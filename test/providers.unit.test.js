import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadRegistry } from "../src/registry.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { sources } = loadRegistry(join(__dirname, "../src/providers"));

const VALID_METHODS = new Set(["GET", "POST", "PUT", "DELETE", "PATCH"]);
const VALID_FORMATS = new Set(["json", "tsv", "lines", "keyvalue", "xml", "text"]);
const VALID_PARAM_TYPES = new Set(["string", "integer", "number", "boolean", "array", "object"]);

describe("provider schemas", () => {
  for (const [name, source] of sources) {
    describe(name, () => {
      it("has required top-level fields", () => {
        assert.ok(source.name, "missing name");
        assert.ok(source.displayName, "missing displayName");
        assert.ok(source.description, "missing description");
        assert.ok(Array.isArray(source.tags) && source.tags.length > 0, "missing or empty tags");
        assert.ok(source.baseUrl, "missing baseUrl");
      });

      it("has valid tools", () => {
        assert.ok(source.tools && Object.keys(source.tools).length > 0, "no tools defined");
        for (const [toolName, tool] of Object.entries(source.tools)) {
          assert.ok(tool.description, `${toolName}: missing description`);
          if (source.protocol === "graphql") {
            assert.ok(tool.query, `${toolName}: graphql tool missing query`);
          } else {
            assert.ok(tool.method || tool.path, `${toolName}: missing method or path`);
            if (tool.method) {
              assert.ok(VALID_METHODS.has(tool.method), `${toolName}: invalid method '${tool.method}'`);
            }
          }
        }
      });

      it("has valid param definitions", () => {
        for (const [toolName, tool] of Object.entries(source.tools)) {
          if (!tool.params) continue;
          for (const [paramName, param] of Object.entries(tool.params)) {
            assert.ok(param.type, `${toolName}.${paramName}: missing type`);
            assert.ok(VALID_PARAM_TYPES.has(param.type), `${toolName}.${paramName}: invalid type '${param.type}'`);
          }
        }
      });

      it("has entity metadata on all tools", () => {
        for (const [toolName, tool] of Object.entries(source.tools)) {
          assert.ok(typeof tool.entity === "string" && tool.entity.length > 0,
            `${toolName}: missing or empty entity`);
        }
      });

      it("has valid response format when specified", () => {
        for (const [toolName, tool] of Object.entries(source.tools)) {
          if (tool.response?.format) {
            assert.ok(VALID_FORMATS.has(tool.response.format),
              `${toolName}: invalid response format '${tool.response.format}'`);
          }
        }
      });

      if (source.tests) {
        it("has tests referencing existing tools", () => {
          for (const testTool of Object.keys(source.tests)) {
            assert.ok(source.tools[testTool],
              `test references non-existent tool '${testTool}'`);
          }
        });
      }
    });
  }
});
