import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { resolveAuth } from "../src/request.js";

describe("resolveAuth", () => {
  const saved = {};

  beforeEach(() => {
    saved.LS_TEST_KEY = process.env.LS_TEST_KEY;
  });

  afterEach(() => {
    if (saved.LS_TEST_KEY === undefined) delete process.env.LS_TEST_KEY;
    else process.env.LS_TEST_KEY = saved.LS_TEST_KEY;
  });

  it("returns empty for no auth config", () => {
    assert.deepEqual(resolveAuth({}), {});
    assert.deepEqual(resolveAuth({ auth: null }), {});
  });

  it("returns apiKey param when env is set", () => {
    process.env.LS_TEST_KEY = "abc123";
    const result = resolveAuth({ auth: { type: "apiKey", env: "LS_TEST_KEY", param: "api_key" } });
    assert.deepEqual(result, { params: { api_key: "abc123" } });
  });

  it("returns bearer header when env is set", () => {
    process.env.LS_TEST_KEY = "tok";
    const result = resolveAuth({ auth: { type: "bearer", env: "LS_TEST_KEY" } });
    assert.deepEqual(result, { headers: { Authorization: "Bearer tok" } });
  });

  it("returns custom header when env is set", () => {
    process.env.LS_TEST_KEY = "val";
    const result = resolveAuth({ auth: { type: "header", env: "LS_TEST_KEY", header: "X-Api-Key" } });
    assert.deepEqual(result, { headers: { "X-Api-Key": "val" } });
  });

  it("returns empty when env is not set and not required", () => {
    delete process.env.LS_TEST_KEY;
    const result = resolveAuth({ auth: { type: "apiKey", env: "LS_TEST_KEY", param: "key" } });
    assert.deepEqual(result, {});
  });

  it("throws when env is not set and required", () => {
    delete process.env.LS_TEST_KEY;
    assert.throws(
      () => resolveAuth({ auth: { type: "apiKey", env: "LS_TEST_KEY", param: "key", required: true } }),
      /Missing env var/
    );
  });
});
