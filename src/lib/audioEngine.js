export const EQ_PRESETS = {
  flat: [0, 0, 0],
  warm: [2.5, -0.5, -1],
  vocal: [-0.8, 2, 0.5],
  bright: [-0.5, 0, 2.5],
};
export const SOUND_DEFAULTS = { spatialWidth: 0.45, roomAmount: 0.08 };
export const SOUND_VERSION = 2;
const bounded = (value, fallback) =>
  Number.isFinite(Number(value))
    ? Math.max(0, Math.min(1, Number(value)))
    : fallback;
export function normalizeSoundSettings(settings = {}) {
  return {
    soundMode: settings.soundMode === "spatial" ? "spatial" : "stereo",
    spatialWidth: bounded(settings.spatialWidth ?? SOUND_DEFAULTS.spatialWidth, SOUND_DEFAULTS.spatialWidth),
    roomAmount: bounded(settings.roomAmount ?? SOUND_DEFAULTS.roomAmount, SOUND_DEFAULTS.roomAmount),
  };
}
export function restoreSoundSettings(settings = {}) {
  // Older presets used a much stronger full-mix room renderer.
  return normalizeSoundSettings(settings.soundVersion === SOUND_VERSION ? settings : { soundMode: settings.soundMode });
}

// Keep the center of the mix intact; render only the stereo difference into
// a quiet virtual soundstage. Flat Stereo has its own unity-gain bypass.
export function createSoundGraph(context, initial = {}) {
  const input = context.createGain();
  input.channelCount = 2;
  input.channelCountMode = "explicit";
  input.channelInterpretation = "speakers";
  const bypass = context.createGain(), toned = context.createGain(), spatial = context.createGain();
  const mix = context.createGain(), preamp = context.createGain();
  input.connect(bypass).connect(mix);
  const low = context.createBiquadFilter();
  low.type = "lowshelf"; low.frequency.value = 180;
  const mid = context.createBiquadFilter();
  mid.type = "peaking"; mid.frequency.value = 1600; mid.Q.value = 0.7;
  const high = context.createBiquadFilter();
  high.type = "highshelf"; high.frequency.value = 5000;
  input.connect(preamp).connect(low).connect(mid).connect(high);
  high.connect(toned).connect(mix);

  const split = context.createChannelSplitter(2), center = context.createGain(), side = context.createGain();
  high.connect(split);
  const matrix = (channel, gain, destination) => {
    const node = context.createGain(); node.gain.value = gain;
    split.connect(node, channel); node.connect(destination);
  };
  matrix(0, 0.5, center); matrix(1, 0.5, center);
  matrix(0, 0.5, side); matrix(1, -0.5, side);
  const merger = context.createChannelMerger(2), widthLeft = context.createGain(), widthRight = context.createGain();
  center.connect(merger, 0, 0); center.connect(merger, 0, 1);
  side.connect(widthLeft).connect(merger, 0, 0);
  side.connect(widthRight).connect(merger, 0, 1);
  const spatialBus = context.createGain();
  merger.connect(spatialBus);

  const bassCut = context.createBiquadFilter(), airCut = context.createBiquadFilter();
  bassCut.type = "highpass"; bassCut.frequency.value = 300; bassCut.Q.value = 0.5;
  airCut.type = "lowpass"; airCut.frequency.value = 6500; airCut.Q.value = 0.5;
  side.connect(bassCut).connect(airCut);
  const fronts = [], frontLevels = [], roomLevels = [], delays = [];
  const position = (node, x, y, z) => {
    node.positionX.value = x; node.positionY.value = y; node.positionZ.value = z;
  };
  for (let channel = 0; channel < 2; channel++) {
    const polarity = context.createGain(); polarity.gain.value = channel === 0 ? 1 : -1;
    airCut.connect(polarity);
    const front = context.createPanner(), frontLevel = context.createGain();
    front.panningModel = "HRTF"; front.rolloffFactor = 0;
    polarity.connect(front).connect(frontLevel).connect(spatialBus);
    const delay = context.createDelay(0.1), rear = context.createPanner(), room = context.createGain();
    rear.panningModel = "HRTF"; rear.rolloffFactor = 0;
    position(rear, channel === 0 ? -1.5 : 1.5, 0.1, 1.7);
    polarity.connect(delay).connect(rear).connect(room).connect(spatialBus);
    fronts.push(front); frontLevels.push(frontLevel); roomLevels.push(room); delays.push(delay);
  }
  const headroom = context.createGain(), peakGuard = context.createWaveShaper();
  const curve = new Float32Array(16385);
  for (let i = 0; i < curve.length; i++) {
    const x = 2 * i / (curve.length - 1) - 1, magnitude = Math.abs(x);
    curve[i] = magnitude <= 0.96 ? x : Math.sign(x) * (0.96 + 0.03 * Math.tanh((magnitude - 0.96) / 0.03));
  }
  // Linear at ordinary levels, with a soft ceiling for exceptional peaks.
  // This avoids the look-ahead and gain modulation of full-mix compression.
  peakGuard.curve = curve;
  spatialBus.connect(headroom).connect(peakGuard).connect(spatial).connect(mix);
  const analyser = context.createAnalyser(); analyser.fftSize = 128;
  const output = context.createGain(); mix.connect(analyser).connect(output);
  let state = normalizeSoundSettings(initial), eq = EQ_PRESETS[initial.eq] ? initial.eq : "flat";
  const param = (parameter, value, immediate) => {
    const now = context.currentTime;
    if (immediate) { parameter.cancelScheduledValues(now); parameter.setValueAtTime(value, now); }
    else {
      if (parameter.cancelAndHoldAtTime) parameter.cancelAndHoldAtTime(now);
      else { const held = parameter.value; parameter.cancelScheduledValues(now); parameter.setValueAtTime(held, now); }
      parameter.setTargetAtTime(value, now, 0.025);
    }
  };
  function route(immediate) {
    const enabled = state.soundMode === "spatial";
    param(bypass.gain, !enabled && eq === "flat" ? 1 : 0, immediate);
    param(toned.gain, !enabled && eq !== "flat" ? 1 : 0, immediate);
    param(spatial.gain, enabled ? 1 : 0, immediate);
  }
  function update(settings, immediate = false) {
    state = normalizeSoundSettings({ ...state, ...settings });
    const width = 1 + state.spatialWidth * 0.12;
    param(widthLeft.gain, width, immediate); param(widthRight.gain, -width, immediate);
    // Allow headroom for the wider side signal and quiet ambience.
    param(headroom.gain, 0.93 / (1 + state.spatialWidth * 0.18 + state.roomAmount * 0.06), immediate);
    const angle = (40 + state.spatialWidth * 25) * Math.PI / 180;
    for (let channel = 0; channel < 2; channel++) {
      const sideSign = channel === 0 ? -1 : 1;
      param(fronts[channel].positionX, sideSign * Math.sin(angle) * 2, immediate);
      param(fronts[channel].positionZ, -Math.cos(angle) * 2, immediate);
      param(frontLevels[channel].gain, state.spatialWidth * 0.06, immediate);
      param(roomLevels[channel].gain, state.roomAmount * 0.04, immediate);
      param(delays[channel].delayTime, (channel === 0 ? 0.011 : 0.017) + state.spatialWidth * 0.004, immediate);
    }
    route(immediate); return state;
  }
  function setEqualizer(preset, immediate = false) {
    eq = EQ_PRESETS[preset] ? preset : "flat";
    const gains = EQ_PRESETS[eq];
    [low, mid, high].forEach((band, index) => param(band.gain, gains[index], immediate));
    // EQ boosts get input headroom instead of compressing the original mix.
    param(preamp.gain, Math.pow(10, -Math.max(0, ...gains) / 20), immediate);
    route(immediate);
  }
  setEqualizer(eq, true); update(state, true);
  return { input, output, analyser, update, setEqualizer };
}
