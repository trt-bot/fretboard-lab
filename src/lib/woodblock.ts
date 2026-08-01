/**
 * Synthesized woodblock via Web Audio — short noise burst + resonant body.
 * iOS Safari-safe: unlock on user gesture, webkit prefix, silent buffer unlock.
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
let keepAliveEl: HTMLAudioElement | null = null;

/** Tiny silent WAV (1 sample) — unlocks iOS media pipeline */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";

function getCtx(): AudioContext {
  if (!sharedCtx) {
    const AC = getAudioContextClass();
    try {
      sharedCtx = new AC({ latencyHint: "interactive" });
    } catch {
      // Older webkit may not accept options object
      sharedCtx = new AC();
    }
  }
  return sharedCtx;
}

/**
 * Fully unlock iOS/Safari audio. Call from a direct user gesture (tap/click).
 * Must run as much as possible synchronously inside the gesture handler.
 */
export async function ensureAudioReady(): Promise<AudioContext> {
  const ctx = getCtx();

  // 1) Resume AudioContext (required on iOS — often starts suspended)
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      // ignore — retry after silent unlock
    }
  }

  // 2) Silent buffer through Web Audio (completes unlock on older iOS)
  if (!unlocked) {
    try {
      const buffer = ctx.createBuffer(1, 1, ctx.sampleRate || 44100);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      // ignore
    }

    // 3) HTMLAudioElement unlock — critical for some iOS / in-app browsers
    try {
      if (!keepAliveEl) {
        keepAliveEl = new Audio(SILENT_WAV);
        keepAliveEl.loop = true;
        keepAliveEl.volume = 0.001;
        keepAliveEl.setAttribute("playsinline", "true");
        keepAliveEl.setAttribute("webkit-playsinline", "true");
      }
      await keepAliveEl.play();
    } catch {
      // may still work with Web Audio alone
    }

    unlocked = true;
  }

  // 4) Resume again after unlock attempts
  if (ctx.state === "suspended") {
    try {
      await ctx.resume();
    } catch {
      // leave for caller
    }
  }

  return ctx;
}

/**
 * Synchronous best-effort unlock for the click call stack (iOS gesture chain).
 * Fire this first, then await ensureAudioReady() for the rest.
 */
export function unlockAudioSync(): AudioContext {
  const ctx = getCtx();
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  try {
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate || 44100);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // ignore
  }
  if (!keepAliveEl) {
    try {
      keepAliveEl = new Audio(SILENT_WAV);
      keepAliveEl.loop = true;
      keepAliveEl.volume = 0.001;
      keepAliveEl.setAttribute("playsinline", "true");
      keepAliveEl.setAttribute("webkit-playsinline", "true");
      void keepAliveEl.play();
    } catch {
      // ignore
    }
  }
  return ctx;
}

export type WoodblockOpts = {
  /** 0–1 overall volume */
  volume?: number;
  /** Slight pitch variance for organic feel */
  detune?: number;
  /** Accent beat (stronger hit) */
  accent?: boolean;
};

/**
 * Safe envelope helper — linear ramps (more reliable on iOS than exponential).
 */
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

/**
 * Play a woodblock hit at `when` (AudioContext time). Defaults to now.
 * Louder defaults for phone speakers; master gain boosts mobile playback.
 */
export function playWoodblock(opts: WoodblockOpts = {}, when?: number): void {
  const ctx = getCtx();
  // If still suspended, hits are silent — bail early (caller should unlock)
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const t = when ?? ctx.currentTime;
  // Boost baseline so phone speakers cut through (user volume still scales)
  const vol = Math.min(1, (opts.volume ?? 0.85) * 1.15);
  const accent = opts.accent ?? false;
  const detune = opts.detune ?? Math.random() * 40 - 20;
  const gainScale = accent ? 1 : 0.72;

  // Master bus — single path to destination (cleaner for iOS routing)
  const master = ctx.createGain();
  master.gain.value = 1.0;
  master.connect(ctx.destination);

  // Noise burst (mallet impact)
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

  // Resonant body — two closely spaced partials (hollow wood character)
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

  // Very short formant click (edge of wood)
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

export function getAudioState(): AudioContextState | "none" {
  return sharedCtx?.state ?? "none";
}

export function closeAudio(): void {
  if (keepAliveEl) {
    try {
      keepAliveEl.pause();
      keepAliveEl.src = "";
    } catch {
      // ignore
    }
    keepAliveEl = null;
  }
  if (sharedCtx) {
    void sharedCtx.close();
    sharedCtx = null;
  }
  unlocked = false;
}
