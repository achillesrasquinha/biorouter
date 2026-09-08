#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadRegistry } from "./registry.js";
import { loadEndpoints, run } from "./engine/runner.js";
import { encode as toon } from "@toon-format/toon";
import { compactify } from "./compact.js";
import { buildEndpointIndex, findEndpoints } from "./endpoint-index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { sources } = loadRegistry(join(__dirname, "providers"));
const endpoints = loadEndpoints(join(__dirname, "endpoints"));

const endpointIndex = buildEndpointIndex(endpoints);

const server = new McpServer({
  name: "life-science-mcp",
  version: "0.3.0",
});

function reply(data) {
  return { content: [{ type: "text", text: toon(data) }] };
}

function error(msg) {
  return { content: [{ type: "text", text: msg }], isError: true };
}

server.tool(
  "findTools",
  "Find life science tools by keyword, domain, or intent. Returns endpoint names, descriptions, accepted input, available output groups, and tags — enough to call them directly.",
  { query: z.string().optional(), tags: z.array(z.string()).optional() },
  async ({ query, tags }) => reply(findEndpoints(endpointIndex, query, tags))
);

server.tool(
  "callTools",
  "Execute one or more life science endpoints. Each endpoint aggregates data from dozens of authoritative sources and returns a unified response.\n\nOptions:\n- fields: request specific output groups (e.g. [\"identity\",\"structure\"]) to reduce response size\n- compact: true returns shape summaries instead of full data — use this first to see what's available, then request specific fields\n- provenance: true includes source attribution for each field",
  {
    endpoint: z.string().optional(),
    query: z.string().optional(),
    fields: z.array(z.string()).optional().describe("Output groups to include (omit for all)"),
    compact: z.boolean().optional().describe("Return data shape only — keys, types, array lengths — instead of full payloads"),
    provenance: z.boolean().optional().describe("Include _provenance with source attribution per field"),
    batch: z
      .array(
        z.object({
          endpoint: z.string(),
          query: z.string(),
          fields: z.array(z.string()).optional(),
          compact: z.boolean().optional(),
          provenance: z.boolean().optional(),
        })
      )
      .optional(),
  },
  async ({ endpoint, query, fields, compact, provenance, batch }) => {
    if (batch?.length) {
      const results = await Promise.allSettled(
        batch.map((call) =>
          execEndpoint(call.endpoint, call.query, {
            fields: call.fields,
            compact: call.compact,
            provenance: call.provenance,
          })
        )
      );
      const keyed = {};
      batch.forEach((call, i) => {
        const r = results[i];
        const key = `${call.endpoint}:${call.query}`;
        const uniqueKey = key in keyed ? `${key}:${i}` : key;
        keyed[uniqueKey] =
          r.status === "fulfilled"
            ? r.value
            : { error: r.reason?.message || String(r.reason) };
      });
      return reply(keyed);
    }

    if (!endpoint || !query) return error("Provide endpoint + query, or a batch array");
    try {
      return reply(await execEndpoint(endpoint, query, { fields, compact, provenance }));
    } catch (err) {
      return error(`Error: ${err.message}`);
    }
  }
);

async function execEndpoint(name, query, opts = {}) {
  const spec = endpoints.get(name);
  if (!spec) throw new Error(`Unknown endpoint: ${name}. Use findTools to discover available endpoints.`);

  const result = await run(spec, sources, { query });

  if (opts.fields) {
    const filtered = {};
    for (const f of opts.fields) {
      if (result[f] !== undefined) filtered[f] = result[f];
      if (opts.provenance && result._provenance?.[f]) {
        (filtered._provenance ??= {})[f] = result._provenance[f];
      }
    }
    if (result._meta) filtered._meta = result._meta;
    if (opts.compact) return compactify(filtered);
    return filtered;
  }

  const { _provenance, ...out } = result;
  if (opts.provenance) out._provenance = _provenance;
  if (opts.compact) return compactify(out);
  return out;
}

const transport = new StdioServerTransport();
await server.connect(transport);
