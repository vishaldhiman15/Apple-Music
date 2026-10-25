import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

function configuration(values) {
  const env = {
    ...process.env,
    CLOUDINARY_URL: "",
    CLOUDINARY_CLOUD_NAME: "",
    CLOUDINARY_API_KEY: "",
    CLOUDINARY_API_SECRET: "",
    ...values,
  };
  const child = spawnSync(
    process.execPath,
    [
      "-e",
      `
    const { cloudinary, configured } = require('./backend/config/cloudinary');
    const c = cloudinary.config();
    const signature = configured() ? cloudinary.utils.api_sign_request({folder:'applemusic/audio/test',timestamp:123},c.api_secret) : null;
    console.log(JSON.stringify({configured:configured(),cloud:c.cloud_name,key:c.api_key,signature}));
  `,
    ],
    { cwd: new URL("..", import.meta.url), env, encoding: "utf8" },
  );
  assert.equal(child.status, 0, child.stderr);
  return JSON.parse(child.stdout.trim());
}

test("Cloudinary accepts separate credentials or CLOUDINARY_URL with identical signed uploads", () => {
  const separate = configuration({
    CLOUDINARY_CLOUD_NAME: "fixture-cloud",
    CLOUDINARY_API_KEY: "123456",
    CLOUDINARY_API_SECRET: "fixture-secret",
  });
  const url = configuration({
    CLOUDINARY_URL: "cloudinary://123456:fixture-secret@fixture-cloud",
  });
  assert.deepEqual(url, separate);
  assert.equal(url.configured, true);
  assert.equal(url.cloud, "fixture-cloud");
  assert.match(url.signature, /^[a-f0-9]{40}$/);
});

test("Cloudinary cannot enable uploads with an incomplete credential set", () => {
  assert.equal(configuration({}).configured, false);
  assert.equal(
    configuration({
      CLOUDINARY_CLOUD_NAME: "fixture-cloud",
      CLOUDINARY_API_SECRET: "fixture-secret",
    }).configured,
    false,
  );
});
