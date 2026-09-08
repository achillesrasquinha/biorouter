import { pluck } from "./pluck.js";
import { parseTsv, parseLines, parseKeyValue, parseXml } from "./parsers.js";

const USER_AGENT = "life-science-mcp/0.3.0";

// ---- Public API ----

export async function request(source, tool, params) {
  const rps = source.rateLimit?.requestsPerSecond || null;
  await throttle(source.name, rps);

  if (source.protocol === "graphql") return graphqlRequest(source, tool, params);
  return restRequest(source, tool, params);
}

export { mapParams };

// ---- REST + GraphQL ----

async function restRequest(source, tool, params) {
  let path = tool.path || "";
  const mapped = mapParams(tool, params);

  for (const [k, v] of Object.entries(mapped)) {
    const placeholder = `{${k}}`;
    if (path.includes(placeholder)) {
      path = path.replaceAll(placeholder, encodeURIComponent(String(v)));
      delete mapped[k];
    }
  }

  const url = new URL((source.baseUrl || "") + path);
  const auth = resolveAuth(source);
  const baseHeaders = { "User-Agent": USER_AGENT, ...(source.headers || {}), ...(auth.headers || {}) };

  if (tool.method === "POST") {
    const headers = { "Content-Type": "application/json", ...baseHeaders };
    if (auth.params) Object.assign(mapped, auth.params);
    const res = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify(mapped),
    });
    return parseResponse(res, tool);
  }

  if (auth.params) Object.assign(mapped, auth.params);
  for (const [k, v] of Object.entries(mapped)) {
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), { headers: baseHeaders });
  return parseResponse(res, tool);
}

async function graphqlRequest(source, tool, params) {
  const variables = mapParams(tool, params);
  const auth = resolveAuth(source);
  const res = await fetch(source.baseUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT, ...(auth.headers || {}) },
    body: JSON.stringify({ query: tool.query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

// ---- Response parsing ----

async function parseResponse(res, tool) {
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);

  const fmt = tool.response?.format;
  const fields = tool.response?.fields;

  if (ct.includes("json") || fmt === "json") {
    try {
      const data = JSON.parse(text);
      return fields?.length ? pluck(data, fields) : data;
    } catch { return { raw: text }; }
  }

  if (fmt === "tsv" || fmt === "lines" || fmt === "keyvalue" || fmt === "xml") {
    const data = parseText(text, fmt, tool.response);
    return fields?.length ? pluck(data, fields) : data;
  }

  return { raw: text };
}

function parseText(text, fmt, responseConfig) {
  if (fmt === "tsv") return parseTsv(text, responseConfig);
  if (fmt === "lines") return parseLines(text);
  if (fmt === "keyvalue") return parseKeyValue(text);
  if (fmt === "xml") return parseXml(text);
  return { raw: text };
}

// ---- Auth ----

export function resolveAuth(source) {
  const auth = source.auth;
  if (!auth) return {};

  const val = auth.env ? process.env[auth.env] : null;
  if (!val) {
    if (auth.required) throw new Error(`Missing env var: ${auth.env}`);
    return {};
  }

  if (auth.type === "apiKey") return { params: { [auth.param]: val } };
  if (auth.type === "header") return { headers: { [auth.header]: val } };
  if (auth.type === "bearer") return { headers: { Authorization: `Bearer ${val}` } };
  return {};
}

// ---- Param mapping ----

const STANDARD_ALIASES = {
  query: ["q", "term", "text", "searchTerm", "search_term", "input", "search", "name", "keyword"],
  limit: ["size", "pageSize", "maxResults", "rows", "per_page", "page_size", "number", "max", "top", "count", "first", "numResults", "maxList", "hitsPerPage"],
  offset: ["page", "start", "skip", "cursor", "pageNumber", "page_number"],
};

function mapParams(tool, params) {
  const mapped = {};
  const schema = tool.params || {};
  for (const [key, def] of Object.entries(schema)) {
    let value = params[key];
    if (value === undefined) {
      for (const [std, natives] of Object.entries(STANDARD_ALIASES)) {
        if (natives.includes(key) && params[std] !== undefined) {
          value = params[std];
          break;
        }
      }
    }
    value = value ?? def.default;
    if (value === undefined) {
      if (def.required) throw new Error(`Missing required param: ${key}`);
      continue;
    }
    mapped[def.mapsTo || key] = def.prefix ? def.prefix + value : value;
  }
  return mapped;
}

// ---- Throttle ----

const buckets = new Map();

async function throttle(sourceName, rps) {
  if (!rps) return;
  const interval = 1000 / rps;
  if (!buckets.has(sourceName)) buckets.set(sourceName, Promise.resolve());
  const prev = buckets.get(sourceName);
  let release;
  const next = new Promise((r) => { release = r; });
  buckets.set(sourceName, next);
  await prev;
  setTimeout(release, interval);
}
