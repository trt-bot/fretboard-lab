/** Lightweight pitch detector via autocorrelation (browser mic). */

export type PitchFrame = {
  frequency: number | null;
  clarity: number; // 0–1
  midi: number | null;
  noteName: string | null;
  cents: number | null; // vs nearest equal-tempered note
};

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function freqToMidi(freq: number): number {
  return 69 + 12 * Math.log2(freq / 440);
}

export function midiToNoteName(midi: number): string {
  const n = Math.round(midi);
  const pc = ((n % 12) + 12) % 12;
  const oct = Math.floor(n / 12) - 1;
  return `${NOTE_NAMES[pc]}${oct}`;
}

export function centsOff(freq: number, targetFreq: number): number {
  return 1200 * Math.log2(freq / targetFreq);
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Autocorrelation pitch estimate.
 * Good enough for singing practice in quiet rooms (80–1000 Hz).
 */
export function detectPitch(
  buffer: Float32Array | ArrayLike<number>,
  sampleRate: number,
  opts?: { minHz?: number; maxHz?: number },
): PitchFrame {
  const minHz = opts?.minHz ?? 70;
  const maxHz = opts?.maxHz ?? 1000;
  const size = buffer.length;

  // RMS gate — ignore silence
  let rms = 0;
  for (let i = 0; i < size; i++) rms += buffer[i]! * buffer[i]!;
  rms = Math.sqrt(rms / size);
  if (rms < 0.01) {
    return { frequency: null, clarity: 0, midi: null, noteName: null, cents: null };
  }

  const minP = Math.floor(sampleRate / maxHz);
  const maxP = Math.min(Math.floor(sampleRate / minHz), size - 2);

  // Remove mean
  let mean = 0;
  for (let i = 0; i < size; i++) mean += buffer[i]!;
  mean /= size;

  let bestOff = -1;
  let bestCorr = 0;
  let found = false;
  let lastCorr = 1;

  for (let off = minP; off <= maxP; off++) {
    let corr = 0;
    let norm = 0;
    for (let i = 0; i < size - off; i++) {
      const a = buffer[i]! - mean;
      const b = buffer[i + off]! - mean;
      corr += a * b;
      norm += a * a;
    }
    if (norm < 1e-8) continue;
    corr /= norm;

    // peak after rising through threshold
    if (!found && corr > 0.9 && corr > lastCorr) {
      found = true;
    }
    if (found && corr > bestCorr) {
      bestCorr = corr;
      bestOff = off;
    } else if (found && corr < bestCorr) {
      // passed peak
      break;
    }
    lastCorr = corr;
  }

  if (bestOff < 0 || bestCorr < 0.85) {
    // fallback: max corr in range
    bestCorr = 0;
    bestOff = -1;
    for (let off = minP; off <= maxP; off++) {
      let corr = 0;
      let n0 = 0;
      let n1 = 0;
      for (let i = 0; i < size - off; i++) {
        const a = buffer[i]! - mean;
        const b = buffer[i + off]! - mean;
        corr += a * b;
        n0 += a * a;
        n1 += b * b;
      }
      const denom = Math.sqrt(n0 * n1) || 1;
      corr /= denom;
      if (corr > bestCorr) {
        bestCorr = corr;
        bestOff = off;
      }
    }
  }

  if (bestOff < 0 || bestCorr < 0.5) {
    return { frequency: null, clarity: bestCorr, midi: null, noteName: null, cents: null };
  }

  // parabolic interpolation
  const corrAt = (off: number) => {
    let corr = 0;
    let n0 = 0;
    let n1 = 0;
    for (let i = 0; i < size - off; i++) {
      const a = buffer[i]! - mean;
      const b = buffer[i + off]! - mean;
      corr += a * b;
      n0 += a * a;
      n1 += b * b;
    }
    return corr / (Math.sqrt(n0 * n1) || 1);
  };
  const y0 = bestOff > minP ? corrAt(bestOff - 1) : bestCorr;
  const y1 = bestCorr;
  const y2 = bestOff < maxP ? corrAt(bestOff + 1) : bestCorr;
  const denom = 2 * (2 * y1 - y2 - y0);
  const shift = denom !== 0 ? (y2 - y0) / denom : 0;
  const period = bestOff + shift;
  const frequency = sampleRate / period;
  if (frequency < minHz || frequency > maxHz) {
    return { frequency: null, clarity: bestCorr, midi: null, noteName: null, cents: null };
  }

  const midiExact = freqToMidi(frequency);
  const midiRound = Math.round(midiExact);
  const nearestFreq = midiToFreq(midiRound);
  const cents = centsOff(frequency, nearestFreq);

  return {
    frequency,
    clarity: bestCorr,
    midi: midiExact,
    noteName: midiToNoteName(midiExact),
    cents,
  };
}

export class MicPitchMonitor {
  private stream: MediaStream | null = null;
  private audio: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private buf: Float32Array | null = null;
  private raf = 0;
  private running = false;

  async start(onFrame: (frame: PitchFrame) => void): Promise<void> {
    if (this.running) return;
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
    this.audio = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (this.audio.state === "suspended") await this.audio.resume();
    this.source = this.audio.createMediaStreamSource(this.stream);
    this.analyser = this.audio.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.2;
    this.source.connect(this.analyser);
    this.buf = new Float32Array(this.analyser.fftSize);
    this.running = true;

    const tick = () => {
      if (!this.running || !this.analyser || !this.buf || !this.audio) return;
      this.analyser.getFloatTimeDomainData(this.buf as Float32Array<ArrayBuffer>);
      const frame = detectPitch(this.buf, this.audio.sampleRate);
      onFrame(frame);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    try {
      this.source?.disconnect();
    } catch { /* ignore */ }
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.audio?.close();
    this.stream = null;
    this.audio = null;
    this.source = null;
    this.analyser = null;
    this.buf = null;
  }

  get isRunning() {
    return this.running;
  }
}
