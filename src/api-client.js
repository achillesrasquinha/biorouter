/**
 * Shared API client utilities for the life-science-mcp scoring engine.
 *
 * Provides registry-backed source resolution and a safe request wrapper
 * used by both scoring.js and claude-modules.js.
 */

import { request } from "./request.js";
import { loadRegistry } from "./registry.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

let _sources = null;

export function getSources() {
  if (!_sources) {
    const reg = loadRegistry(join(__dirname, "providers"));
    _sources = reg.sources;
  }
  return _sources;
}

export async function safeCall(sourceName, toolName, params) {
  try {
    const sources = getSources();
    const src = sources.get(sourceName);
    if (!src) return null;
    const tool = src.tools[toolName];
    if (!tool) return null;
    return await request(src, tool, params);
  } catch (e) {
    if (process.env.DEBUG) {
      console.error(`[safeCall] ${sourceName}.${toolName} failed: ${e.message}`);
    }
    return null;
  }
}
