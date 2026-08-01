let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!sharedCtx) sharedCtx = new AudioContext();
  return sharedCtx;
}

export async function ensureAudioReady(): Promise<AudioContext> {
  const ctx = getCtx();
  if (ctx.state === "suspended") await ctx.resume();
  return ctx;
}

export type WoodblockOpts = {
  volume?: number;
  detune?: number;
  accent?: boolean;
};

export function playWoodblock(opts: WoodblockOpts = {}, when?: number): void {
  const ctx = getCtx();
  const t = when ?? ctx.currentTime;
  const vol = opts.volume ?? 0.75;
  const accent = opts.accent ?? false;
  const detune = opts.detune ?? Math.random() * 40 - 20;
  const gainScale = accent ? 1 : 0.72;

  const noiseDur = 0.028;
  const noiseBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * noiseDur), ctx.sampleRate);
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
  noiseGain.gain.setValueAtTime(0.0001, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.55 * vol * gainScale, t + 0.001);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(t);
  noise.stop(t + noiseDur + 0.01);

  const partials = [
    { freq: 980 + detune, amp: 0.42, decay: 0.12 },
    { freq: 1480 + detune * 1.2, amp: 0.28, decay: 0.09 },
    { freq: 2100 + detune * 0.6, amp: 0.12, decay: 0.06 },
  ];

  for (const p of partials) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = p.freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(p.amp * vol * gainScale, t + 0.0015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + p.decay);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3200;
    osc.connect(lp);
    lp.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + p.decay + 0.02);
  }

  const click = ctx.createOscillator();
  click.type = "triangle";
  click.frequency.value = 3200 + detune;
  const clickGain = ctx.createGain();
  clickGain.gain.setValueAtTime(0.0001, t);
  clickGain.gain.exponentialRampToValueAtTime(0.18 * vol * gainScale, t + 0.0008);
  clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);
  click.connect(clickGain);
  clickGain.connect(ctx.destination);
  click.start(t);
  click.stop(t + 0.03);
}
