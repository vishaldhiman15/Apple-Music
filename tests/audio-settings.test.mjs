import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSoundSettings, EQ_PRESETS } from "../src/lib/audioEngine.js";
test("listening preferences recover safely from old or invalid saved values", () => {
  assert.deepEqual(normalizeSoundSettings(), {
    soundMode: "stereo",
    spatialWidth: 0.65,
    roomAmount: 0.25,
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
    { soundMode: "spatial", spatialWidth: 0.65, roomAmount: 0.25 },
  );
  assert.equal(EQ_PRESETS.flat.length, 3);
});
