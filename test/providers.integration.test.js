import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadRegistry } from "../src/registry.js";
import { request } from "../src/request.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { sources } = loadRegistry(join(__dirname, "../src/providers"));

function resolvePath(obj, path) {
  if (!path) return obj;
  let current = obj;
  for (const part of path.split(".")) {
    if (current == null) return undefined;
    current = /^\d+$/.test(part) ? current[parseInt(part)] : current[part];
  }
  return current;
}

function checkAssertion(result, a) {
  if (a.anyOf) {
    const items = a.anyOf.map((i) => (typeof i === "string" ? { path: i } : i));
    const passed = items.some((item) => {
      try {
        checkAssertion(result, item);
        return true;
      } catch {
        return false;
      }
    });
    assert.ok(passed, `none of anyOf conditions met: ${JSON.stringify(a.anyOf)}`);
    return;
  }

  const val = resolvePath(result, a.path || "");
  const label = a.path || "root";

  if (a.isArray) assert.ok(Array.isArray(val), `expected array at ${label}`);
  if (a.equals !== undefined) assert.strictEqual(val, a.equals, `expected ${a.equals} at ${label}`);
  if (a.minLength !== undefined) assert.ok(val?.length >= a.minLength, `expected length >= ${a.minLength} at ${label}`);
  if (a.gt !== undefined) assert.ok(val > a.gt, `expected > ${a.gt} at ${label}`);
  if (a.gte !== undefined) assert.ok(val >= a.gte, `expected >= ${a.gte} at ${label}`);
  if (a.includes !== undefined) assert.ok(val?.includes?.(a.includes), `expected includes "${a.includes}" at ${label}`);
  if (a.type) assert.strictEqual(typeof val, a.type, `expected typeof ${a.type} at ${label}`);

  const hasCheck = a.isArray || a.equals !== undefined || a.minLength !== undefined ||
    a.gt !== undefined || a.gte !== undefined || a.includes !== undefined || a.type;
  if (!hasCheck) {
    assert.ok(val, `expected truthy value at ${label}`);
  }
}

for (const [name, source] of sources) {
  if (!source.tests) continue;

  describe(source.displayName || name, () => {
    for (const [toolName, cases] of Object.entries(source.tests)) {
      for (const testCase of cases) {
        it(testCase.name, async () => {
          const tool = source.tools[toolName];
          assert.ok(tool, `tool "${toolName}" not found in ${name}`);

          try {
            const result = await request(source, tool, testCase.params || {});
            for (const a of testCase.assert || []) {
              checkAssertion(result, a);
            }
          } catch (err) {
            if (testCase.allowError) {
              assert.ok(
                err.message.includes("HTTP") || err.message.includes("fetch"),
                `unexpected error: ${err.message}`
              );
            } else {
              throw err;
            }
          }
        });
      }
    }
  });
}
