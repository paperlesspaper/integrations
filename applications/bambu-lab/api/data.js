import { bool, text, number, getJson, retrievedAt } from "../../_shared/dashboard-api.js";

const short = (value, max = 160) => text(value).slice(0, max);
const finite = (value) => (typeof value === "number" || (typeof value === "string" && value.trim())) && Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : null;
const timestamp = (value) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? Date.parse(value) : null;

// Only images on the provider's public CDN are passed to the renderer. No token
// is appended or forwarded to image requests.
export function imageUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname;
    const allowed = host === "makerworld.bblmw.com" || ["bambulab.com", "bambulab.cn", "makerworld.com"].some((domain) => host === domain || host.endsWith(`.${domain}`)) || /^bbl-(us|eu|cn)-public\.oss-[a-z0-9-]+\.aliyuncs\.com$/.test(host);
    return allowed && url.protocol === "https:" && !url.username && !url.password && !url.port ? url.href : "";
  } catch { return ""; }
}

export function normalizeTask(task, now = Date.now()) {
  const start = timestamp(task.startTime);
  const end = timestamp(task.endTime);
  const estimateSeconds = finite(task.costTime);
  const status = String(task.status ?? "").toUpperCase();
  let state = "unknown";
  // Terminal states take precedence over the historic start/end sentinel,
  // including genuinely short completed or aborted prints.
  if (["2", "FINISH", "FINISHED", "COMPLETED"].includes(status)) state = "finished";
  else if (["3", "FAILED", "ABORTED", "CANCELLED"].includes(status)) state = "failed";
  else if (["PAUSE", "PAUSED"].includes(status)) state = "paused";
  else if (start !== null && start <= now && (end === null || (end >= start && end - start <= 60000))) state = "printing";
  const estimatedEnd = start !== null && estimateSeconds > 0 ? start + estimateSeconds * 1000 : null;
  // History is not live telemetry. Never turn an elapsed estimate into success
  // or leave an old unfinished record claiming an ongoing print indefinitely.
  if (state === "printing" && (estimatedEnd === null || now > estimatedEnd)) state = "unconfirmed";
  const progress = state === "printing" && estimatedEnd !== null
    ? Math.min(99, Math.max(0, Math.floor((now - start) / (estimateSeconds * 10)))) : null;
  const mappings = Array.isArray(task.amsDetailMapping) ? task.amsDetailMapping.slice(0, 32) : [];
  const materials = [...new Set(mappings.map((item) => short(item?.targetFilamentType || item?.filamentType, 24)).filter(Boolean))].slice(0, 4);
  if (!materials.length && text(task.material?.name)) materials.push(short(task.material.name, 24));
  const terminal = state === "finished" || state === "failed";
  return {
    id: String(task.id ?? "").slice(0, 100),
    title: short(task.title) || short(task.designTitle),
    deviceId: short(task.deviceId, 100),
    printer: short(task.deviceName, 80) || short(task.deviceModel, 80),
    image: imageUrl(task.cover), state, progress,
    startTime: start === null ? null : new Date(start).toISOString(),
    endTime: terminal && end !== null && (start === null || end >= start) ? new Date(end).toISOString() : null,
    estimatedEnd: state === "printing" && estimatedEnd !== null ? new Date(estimatedEnd).toISOString() : null,
    durationSeconds: terminal && start !== null && end !== null && end >= start ? (end - start) / 1000 : null,
    estimateSeconds, weightGrams: finite(task.weight), materials,
  };
}

export function normalizeHistory(body, query = {}, now = Date.now()) {
  if (!body || !Array.isArray(body.hits)) throw new Error("Invalid cloud history");
  const deviceId = text(query.deviceId);
  const limit = Math.floor(number(query.historyLimit, 3, 0, 4));
  const seen = new Set();
  const tasks = body.hits.slice(0, 100).filter((task) => task && typeof task === "object" && !Array.isArray(task))
    .filter((task) => !deviceId || task.deviceId === deviceId)
    .map((task) => normalizeTask(task, now))
    .filter((task) => { if (!task.id) return true; if (seen.has(task.id)) return false; seen.add(task.id); return true; })
    .sort((a, b) => (Date.parse(b.startTime) || 0) - (Date.parse(a.startTime) || 0));
  const current = tasks.find((task) => ["printing", "paused"].includes(task.state)) || tasks[0] || null;
  return { current, history: tasks.filter((task) => task !== current).slice(0, limit) };
}

function demo(query, now) {
  const state = ["finished", "failed", "empty"].includes(query.demoState) ? query.demoState : "printing";
  const iso = (offset) => new Date(now + offset * 1000).toISOString();
  const task = (id, title, offset, duration, status = 2) => ({
    id, title, status, deviceName: "Bambu Lab P1S", deviceId: "DEMO",
    startTime: iso(offset), endTime: iso(offset + (status === 1 ? 0 : duration)),
    costTime: duration, weight: id === 1 ? 86.4 : 24.8 + id * 8,
    amsDetailMapping: [{ filamentType: id === 3 ? "PETG" : "PLA" }],
  });
  const hits = state === "empty" ? [] : [
    task(1, "Spiral Vase", state === "printing" ? -5400 : -18000, 8640, state === "printing" ? 1 : state === "failed" ? 3 : 2),
    task(2, "Desk Organizer", -86400, 4260),
    task(3, "Cable Clips · Set of 6", -172800, 1920),
    task(4, "Plant Pot", -259200, 7260),
    task(5, "Tool Holder", -345600, 3120),
  ];
  const data = normalizeHistory({ hits }, { ...query, deviceId: "" }, now);
  if (data.current) data.current.image = "./assets/demo-vase.svg";
  return { ...data, sample: true, source: "Bambu Lab Cloud", updatedAt: new Date(now).toISOString() };
}

export async function loadBambu(query = {}, read = getJson, now = Date.now()) {
  if (bool(query.sampleData)) return demo(query, now);
  const token = text(query.token).replace(/^Bearer\s+/i, "");
  if (!token || token.length > 8192 || /\s/.test(token)) throw new Error("setup");
  const host = query.region === "china" ? "api.bambulab.cn" : "api.bambulab.com";
  const url = new URL(`https://${host}/v1/user-service/my/tasks`);
  url.searchParams.set("limit", "50");
  if (text(query.deviceId)) url.searchParams.set("deviceId", short(query.deviceId, 100));
  let body;
  try {
    body = await read(url.href, { headers: { Authorization: `Bearer ${token}` }, ttl: 60000, maxBytes: 2 * 1024 * 1024 });
  } catch (error) {
    throw new Error(/HTTP (401|403)\b/.test(error.message) ? "auth" : "upstream");
  }
  if (body?.error || (body?.code != null && ![0, "0"].includes(body.code))) throw new Error("upstream");
  return { ...normalizeHistory(body, query, now), sample: false, source: "Bambu Lab Cloud", updatedAt: retrievedAt(body) };
}

export default async function handler({ query = {} }) {
  try { return await loadBambu(query); }
  catch (error) { return { error: ["setup", "auth"].includes(error.message) ? error.message : "upstream" }; }
}
