import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import { BlockList, isIP } from "node:net";
import { createHash } from "node:crypto";

// Server-side transport for these data adapters. Pin validated DNS results to the
// connection, bound time and bytes, and never forward credentials on redirects.
const blocked = new BlockList();
for (const [ip, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 3],
])
  blocked.addSubnet(ip, prefix, "ipv4");
const globalV6 = new BlockList();
globalV6.addSubnet("2000::", 3, "ipv6");
const deniedV6 = new BlockList();
deniedV6.addSubnet("2001::", 23, "ipv6");
deniedV6.addSubnet("2001:db8::", 32, "ipv6");
deniedV6.addSubnet("2002::", 16, "ipv6");
const cache = new Map();
const retrievalTimes = new WeakMap();
export const retrievedAt = (data) =>
  retrievalTimes.get(data) || new Date().toISOString();

export const bool = (value) =>
  value === true || value === "true" || value === 1 || value === "1";
export const text = (value) => (typeof value === "string" ? value.trim() : "");
export const number = (value, fallback, min, max) =>
  value === "" || value == null || !Number.isFinite(Number(value))
    ? fallback
    : Math.max(min, Math.min(max, Number(value)));
export const language = (query) =>
  String(query.language || "de").startsWith("de") ? "de" : "en";
export function required(value, label) {
  const v = text(value);
  if (!v) throw new Error(`${label} is required`);
  return v;
}
export function baseUrl(value) {
  const u = new URL(required(value, "URL"));
  if (
    !["https:", "http:"].includes(u.protocol) ||
    u.username ||
    u.password ||
    u.search ||
    u.hash
  )
    throw new Error(
      "Use an HTTP(S) base URL without credentials, query or fragment",
    );
  return u.href.replace(/\/+$/, "");
}
export function publicAddress(address) {
  const version = isIP(address);
  if (version === 4) return !blocked.check(address, "ipv4");
  if (version === 6)
    return globalV6.check(address, "ipv6") && !deniedV6.check(address, "ipv6");
  return false;
}

export async function getText(
  value,
  { headers = {}, maxBytes = 2 * 1024 * 1024, redirects = 0 } = {},
) {
  let u;
  try {
    u = new URL(value);
  } catch {
    throw new Error("Invalid source URL");
  }
  const privateAllowed = (process.env.PAPERLESSPAPER_PRIVATE_API_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .includes(u.origin);
  if (
    (!privateAllowed && u.protocol !== "https:") ||
    !["https:", "http:"].includes(u.protocol) ||
    u.username ||
    u.password
  )
    throw new Error(
      "Source requires HTTPS; local origins must be enabled by the server operator",
    );
  const hostname = u.hostname.replace(/^\[|\]$/g, "");
  let timer;
  let addresses;
  try {
    addresses = isIP(hostname)
      ? [{ address: hostname, family: isIP(hostname) }]
      : await Promise.race([
          lookup(hostname, { all: true }),
          new Promise((_, reject) => {
            timer = setTimeout(() => reject(new Error("DNS timeout")), 4000);
          }),
        ]);
  } catch {
    throw new Error("Source hostname could not be resolved");
  } finally {
    clearTimeout(timer);
  }
  if (
    !addresses.length ||
    (!privateAllowed && addresses.some((a) => !publicAddress(a.address)))
  )
    throw new Error("Private source address is not enabled");
  const selected = addresses[0];
  const result = await new Promise((resolve, reject) => {
    const fail = () =>
      reject(new Error("Source connection failed or timed out"));
    const req = (u.protocol === "https:" ? httpsRequest : httpRequest)(
      u,
      {
        headers: {
          Accept: "application/json, application/xml;q=0.9, */*;q=0.1",
          "User-Agent": "paperlesspaper-openintegrations/0.1.0",
          ...headers,
        },
        lookup: (_name, options, cb) =>
          options.all
            ? cb(null, [selected])
            : cb(null, selected.address, selected.family),
      },
      (res) => {
        const chunks = [];
        let size = 0;
        res.on("data", (chunk) => {
          size += chunk.length;
          if (size > maxBytes) {
            res.destroy();
            req.destroy();
            reject(new Error("Source response exceeds size limit"));
          } else chunks.push(chunk);
        });
        res.on("error", fail);
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            location: res.headers.location,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    const deadline = setTimeout(() => req.destroy(), 12000);
    req.on("close", () => clearTimeout(deadline));
    req.on("error", fail);
    req.end();
  });
  if (result.status >= 300 && result.status < 400 && result.location) {
    if (
      Object.keys(headers).some((k) => /authorization|api.key/i.test(k)) ||
      redirects >= 3
    )
      throw new Error("Source redirect refused");
    return getText(new URL(result.location, u).href, {
      headers,
      maxBytes,
      redirects: redirects + 1,
    });
  }
  if (result.status < 200 || result.status >= 300)
    throw new Error(`Source returned HTTP ${result.status}`);
  return result.body;
}

export async function getJson(url, options = {}) {
  const key = createHash("sha256")
    .update(url)
    .update(JSON.stringify(options.headers || {}))
    .digest("hex");
  const hit = cache.get(key);
  if (options.ttl && hit?.until > Date.now()) return hit.data;
  let data;
  try {
    data = JSON.parse(await getText(url, options));
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new Error("Source returned invalid JSON");
    throw error;
  }
  if (data && typeof data === "object")
    retrievalTimes.set(data, new Date().toISOString());
  if (options.ttl) {
    if (cache.size >= 64) cache.delete(cache.keys().next().value);
    cache.set(key, { until: Date.now() + options.ttl, data });
  }
  return data;
}

export function envelope(
  data,
  sample = false,
  source = "",
  updatedAt = new Date().toISOString(),
) {
  return { ...data, sample, source, updatedAt };
}
