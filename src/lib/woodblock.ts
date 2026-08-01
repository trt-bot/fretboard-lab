/**
 * Synthesized woodblock via Web Audio — short noise burst + resonant body.
 * iOS-safe unlock that never blocks Play on a hung promise.
 */

type AudioContextConstructor = new (
  contextOptions?: AudioContextOptions,
) => AudioContext;

function getAudioContextClass(): AudioContextConstructor {
  const w = globalThis as typeof globalThis & {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  const AC = w.AudioContext ?? w.webkitAudioContext;
  if (!AC) {
    throw new Error("Web Audio API is not supported in this browser");
  }
  return AC;
}

let sharedCtx: AudioContext | null = null;
let unlocked = false;
let unlockInFlight: Promise<AudioContext> | null = null;

function getCtx(): AudioContext {
  if (!sharedCtx) {
    const AC = getAudioContextClass();
    try {
      sharedCtx = new AC({ latencyHint: "interactive" });
    } catch {
      sharedCtx = new AC();
    }
  }
  return sharedCtx;
}

/** Race a promise so iOS media play/resume can never hang start forever. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    let done = false;
    const t = window.setTimeout(() => {
      if (done) return;
      done = true;
      resolve(fallback);
    }, ms);
    p.then(
      (v) => {
        if (done) return;
        done = true;
        window.clearTimeout(t);
        resolve(v);
      },
      () => {
        if (done) return;
        done = true;
        window.clearTimeout(t);
        resolve(fallback);
      },
    );
  });
}

function playSilentBuffer(ctx: AudioContext): void {
  try {
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate || 44100);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // ignore
  }
}

/**
 * Synchronous unlock for the click/tap stack — call first, never await.
 */
export function unlockAudioSync(): AudioContext {
  const ctx = getCtx();
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  playSilentBuffer(ctx);
  return ctx;
}

/**
 * Finish unlock without blocking. Safe to fire-and-forget after unlockAudioSync.
 */
export async function ensureAudioReady(): Promise<AudioContext> {
  const ctx = getCtx();

  if (ctx.state === "suspended") {
    await withTimeout(ctx.resume().then(() => true), 250, false);
  }

  if (!unlocked) {
    playSilentBuffer(ctx);
    unlocked = true;
  }

  if (ctx.state === "suspended") {
    await withTimeout(ctx.resume().then(() => true), 150, false);
  }

  return ctx;
}

/** Coalesce concurrent unlocks */
export function ensureAudioReadyOnce(): Promise<AudioContext> {
  if (!unlockInFlight) {
    unlockInFlight = ensureAudioReady().finally(() => {
      unlockInFlight = null;
    });
  }
  return unlockInFlight;
}

export type WoodblockOpts = {
  volume?: number;
  detune?: number;
  accent?: boolean;
};

function hitEnvelope(
  g: GainNode,
  t: number,
  peak: number,
  attack: number,
  decay: number,
) {
  const peakClamped = Math.max(0.0001, peak);
  g.gain.cancelScheduledValues(t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peakClamped, t + attack);
  g.gain.linearRampToValueAtTime(0.0001, t + decay);
}

export function playWoodblock(opts: WoodblockOpts = {}, when?: number): void {
  const ctx = getCtx();
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const t = when ?? ctx.currentTime;
  const vol = Math.min(1, (opts.volume ?? 0.85) * 1.15);
  const accent = opts.accent ?? false;
  const detune = opts.detune ?? Math.random() * 40 - 20;
  const gainScale = accent ? 1 : 0.72;

  const master = ctx.createGain();
  master.gain.value = 1.0;
  master.connect(ctx.destination);

  const noiseDur = 0.028;
  const noiseBuf = ctx.createBuffer(
    1,
    Math.ceil(ctx.sampleRate * noiseDur),
    ctx.sampleRate,
  );
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const env = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * env * env;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuf;

  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 2400 + detune * 4;
  noiseFilter.Q.value = 1.2;

  const noiseGain = ctx.createGain();
  hitEnvelope(noiseGain, t, 0.7 * vol * gainScale, 0.001, 0.04);

  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(t);
  noise.stop(t + noiseDur + 0.01);

  const partials: Array<{ freq: number; amp: number; decay: number }> = [
    { freq: 980 + detune, amp: 0.55, decay: 0.13 },
    { freq: 1480 + detune * 1.2, amp: 0.36, decay: 0.1 },
    { freq: 2100 + detune * 0.6, amp: 0.16, decay: 0.07 },
  ];

  for (const p of partials) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = p.freq;

    const g = ctx.createGain();
    hitEnvelope(g, t, p.amp * vol * gainScale, 0.0015, p.decay);

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3200;
    lp.Q.value = 0.7;

    osc.connect(lp);
    lp.connect(g);
    g.connect(master);
    osc.start(t);
    osc.stop(t + p.decay + 0.02);
  }

  const click = ctx.createOscillator();
  click.type = "triangle";
  click.frequency.value = 3200 + detune;
  const clickGain = ctx.createGain();
  hitEnvelope(clickGain, t, 0.24 * vol * gainScale, 0.0008, 0.02);
  click.connect(clickGain);
  clickGain.connect(master);
  click.start(t);
  click.stop(t + 0.03);
}

export function getAudioContext(): AudioContext {
  return getCtx();
}

export function getAudioState(): AudioContextState | "none" {
  return sharedCtx?.state ?? "none";
}

export function closeAudio(): void {
  if (sharedCtx) {
    void sharedCtx.close();
    sharedCtx = null;
  }
  unlocked = false;
  unlockInFlight = null;
}
