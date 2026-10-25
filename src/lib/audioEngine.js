export const EQ_PRESETS = {
  flat: [0, 0, 0],
  warm: [4, -1, -2],
  vocal: [-2, 4, 1],
  bright: [-1, 0, 4],
};
const bounded = (value, fallback) =>
  Number.isFinite(Number(value))
    ? Math.max(0, Math.min(1, Number(value)))
    : fallback;
export function normalizeSoundSettings(settings = {}) {
  return {
    soundMode: settings.soundMode === "spatial" ? "spatial" : "stereo",
    spatialWidth: bounded(settings.spatialWidth ?? 0.65, 0.65),
    roomAmount: bounded(settings.roomAmount ?? 0.25, 0.25),
  };
}

// A fixed binaural virtual-speaker renderer for stereo headphones.
// Separate left/right paths preserve the recording's channel information.
export function createSoundGraph(context, initial = {}) {
  const input = context.createGain();
  input.channelCount = 2;
  input.channelCountMode = "explicit";
  input.channelInterpretation = "speakers";
  const low = context.createBiquadFilter();
  low.type = "lowshelf";
  low.frequency.value = 180;
  const mid = context.createBiquadFilter();
  mid.type = "peaking";
  mid.frequency.value = 1400;
  mid.Q.value = 0.7;
  const high = context.createBiquadFilter();
  high.type = "highshelf";
  high.frequency.value = 5000;
  input.connect(low).connect(mid).connect(high);
  const stereo = context.createGain(),
    spatial = context.createGain(),
    mix = context.createGain();
  high.connect(stereo).connect(mix);
  const split = context.createChannelSplitter(2);
  high.connect(split);
  const fronts = [],
    rears = [],
    roomGains = [],
    delays = [];
  for (let channel = 0; channel < 2; channel++) {
    const front = context.createPanner();
    front.panningModel = "HRTF";
    front.distanceModel = "inverse";
    front.rolloffFactor = 0;
    const frontLevel = context.createGain();
    frontLevel.gain.value = 0.8;
    split.connect(front, channel);
    front.connect(frontLevel).connect(spatial);
    const damping = context.createBiquadFilter();
    damping.type = "lowpass";
    damping.frequency.value = 4200;
    damping.Q.value = 0.5;
    const delay = context.createDelay(0.1),
      rear = context.createPanner(),
      room = context.createGain();
    rear.panningModel = "HRTF";
    rear.distanceModel = "inverse";
    rear.rolloffFactor = 0;
    split.connect(damping, channel);
    damping.connect(delay).connect(rear).connect(room).connect(spatial);
    fronts.push(front);
    rears.push(rear);
    roomGains.push(room);
    delays.push(delay);
  }
  spatial.connect(mix);
  const limiter = context.createDynamicsCompressor();
  limiter.threshold.value = -2;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.08;
  const analyser = context.createAnalyser();
  analyser.fftSize = 128;
  const output = context.createGain();
  mix.connect(limiter).connect(analyser).connect(output);
  let state = normalizeSoundSettings(initial);
  const param = (parameter, value, immediate) => {
    if (immediate) parameter.setValueAtTime(value, context.currentTime);
    else {
      parameter.cancelScheduledValues(context.currentTime);
      parameter.setTargetAtTime(value, context.currentTime, 0.035);
    }
  };
  const position = (node, x, y, z, immediate) => {
    if (node.positionX) {
      param(node.positionX, x, immediate);
      param(node.positionY, y, immediate);
      param(node.positionZ, z, immediate);
    } else node.setPosition(x, y, z);
  };
  function update(settings, immediate = false) {
    state = normalizeSoundSettings({ ...state, ...settings });
    const enabled = state.soundMode === "spatial";
    param(stereo.gain, enabled ? 0 : 1, immediate);
    param(spatial.gain, enabled ? 1 : 0, immediate);
    const angle = ((22 + state.spatialWidth * 43) * Math.PI) / 180;
    for (let channel = 0; channel < 2; channel++) {
      const side = channel === 0 ? -1 : 1;
      position(
        fronts[channel],
        side * Math.sin(angle) * 2,
        0,
        -Math.cos(angle) * 2,
        immediate,
      );
      position(
        rears[channel],
        side * 1.5,
        0.15,
        1.3 + state.spatialWidth * 0.7,
        immediate,
      );
      param(roomGains[channel].gain, state.roomAmount * 0.22, immediate);
      param(
        delays[channel].delayTime,
        (channel === 0 ? 0.017 : 0.027) + state.spatialWidth * 0.006,
        immediate,
      );
    }
    return state;
  }
  function setEqualizer(preset, immediate = false) {
    const gains = EQ_PRESETS[preset] || EQ_PRESETS.flat;
    [low, mid, high].forEach((band, index) =>
      param(band.gain, gains[index], immediate),
    );
  }
  setEqualizer(initial.eq || "flat", true);
  update(state, true);
  return { input, output, analyser, update, setEqualizer };
}
