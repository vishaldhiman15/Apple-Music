import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSoundSettings, restoreSoundSettings, SOUND_VERSION, EQ_PRESETS } from "../src/lib/audioEngine.js";
test("listening preferences recover safely from old or invalid saved values", () => {
  assert.deepEqual(normalizeSoundSettings(), {
    soundMode: "stereo",
    spatialWidth: 0.45,
    roomAmount: 0.08,
  });
  assert.deepEqual(
    normalizeSoundSettings({
      soundMode: "atmos",
      spatialWidth: 99,
      roomAmount: -1,
    }),
    { soundMode: "stereo", spatialWidth: 1, roomAmount: 0 },
  );
  assert.deepEqual(
    normalizeSoundSettings({
      soundMode: "spatial",
      spatialWidth: "invalid",
      roomAmount: Infinity,
    }),
    { soundMode: "spatial", spatialWidth: 0.45, roomAmount: 0.08 },
  );
  assert.equal(EQ_PRESETS.flat.length, 3);
});

test("old room presets migrate to natural settings and current preferences persist", () => {
  assert.deepEqual(restoreSoundSettings({ soundMode: "spatial", spatialWidth: 1, roomAmount: 1 }), {
    soundMode: "spatial", spatialWidth: 0.45, roomAmount: 0.08,
  });
  assert.deepEqual(restoreSoundSettings({ soundVersion: SOUND_VERSION, soundMode: "spatial", spatialWidth: 0.7, roomAmount: 0.2 }), {
    soundMode: "spatial", spatialWidth: 0.7, roomAmount: 0.2,
  });
});
