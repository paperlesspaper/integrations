import { getJson, retrievedAt } from "../../_shared/dashboard-api.js";

const endpoint = "https://transport.opendata.ch/v1/stationboard";
const fetchLimit = 100;
const clean = (value, max = 160) => typeof value === "string" || typeof value === "number"
  ? String(value).replace(/\s+/g, " ").trim().slice(0, max) : "";
const fold = value => clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const lineKey = value => fold(value).replace(/\s/g, "");
const integer = (value, fallback, min, max) => value == null || value === "" || !Number.isFinite(Number(value))
  ? fallback : Math.max(min, Math.min(max, Math.floor(Number(value))));
const date = value => typeof value === "string" && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
const numeric = value => (typeof value === "number" || (typeof value === "string" && value.trim())) && Number.isFinite(Number(value)) ? Number(value) : null;

export function settingsFor(query = {}) {
  return {
    stationName: clean(query.stationName) || "Zürich HB",
    stationId: clean(query.stationId, 32),
    duration: integer(query.duration, 90, 10, 360),
    limit: integer(query.limit, 7, 1, 12),
    transport: ["train", "tram", "bus", "ship", "cableway"].includes(query.transport) ? query.transport : "all",
    destination: fold(query.destination),
    lines: clean(query.lines).split(",").map(lineKey).filter(Boolean),
    sampleData: query.sampleData === true || query.sampleData === "true",
  };
}

export function normalizeDeparture(journey) {
  if (!journey || typeof journey !== "object") return null;
  const stop = journey.stop || {};
  const plannedWhen = date(stop.departure);
  if (!plannedWhen) return null;
  const prognosis = date(stop.prognosis?.departure);
  // A missing delay is unknown, never an invented "on time" observation.
  const reportedDelay = numeric(stop.delay);
  const delayMinutes = prognosis ? Math.round((Date.parse(prognosis) - Date.parse(plannedWhen)) / 60000) : reportedDelay;
  const expected = new Date(Date.parse(plannedWhen) + (delayMinutes ?? 0) * 60000);
  if (!Number.isFinite(expected.getTime())) return null;
  const when = prognosis || expected.toISOString();
  const plannedPlatform = clean(stop.platform, 24);
  const platform = clean(stop.prognosis?.platform, 24) || plannedPlatform;
  const category = clean(journey.category, 16);
  const number = clean(journey.number, 24);
  const line = [category, number].filter(Boolean).join(" ") || clean(journey.name, 40) || "—";
  return {
    id: `${clean(journey.name, 80)}-${plannedWhen}-${clean(journey.to)}`,
    line, category, operator: clean(journey.operator, 40),
    direction: clean(journey.to), plannedWhen, when, delayMinutes,
    platform, plannedPlatform,
    platformChanged: Boolean(plannedPlatform && platform && plannedPlatform !== platform),
    // passList starts at the selected stop; it must not match a destination filter.
    via: (Array.isArray(journey.passList) ? journey.passList.slice(1, 100) : [])
      .map(pass => clean(pass?.station?.name)).filter(Boolean),
  };
}

export function normalizeBoard(data, settings, now = Date.now()) {
  if (!data?.station?.id || !data.station.name || !Array.isArray(data.stationboard) || data.errors?.length) {
    throw Error("upstream");
  }
  const seen = new Set();
  const departures = data.stationboard.slice(0, 200).map(normalizeDeparture).filter(Boolean)
    .filter(row => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return Date.parse(row.when) >= now && Date.parse(row.when) <= now + settings.duration * 60000
        && (!settings.lines.length || settings.lines.includes(lineKey(row.line)))
        && (!settings.destination || [row.direction, ...row.via].some(name => fold(name).includes(settings.destination)));
    })
    .sort((a, b) => Date.parse(a.when) - Date.parse(b.when));
  return {
    station: { id: clean(data.station.id, 32), name: clean(data.station.name) },
    departures: departures.slice(0, settings.limit),
    more: Math.max(0, departures.length - settings.limit),
    // The public board is bounded, not a guarantee of full lookahead coverage.
    partial: data.stationboard.length >= fetchLimit,
    duration: settings.duration,
  };
}

function sampleBoard() {
  const journeys = [
    ["IC", "1", "Genève-Aéroport", "08:31", 3, "31", "32", ["Bern", "Lausanne"]],
    ["S", "12", "Winterthur", "08:35", 0, "43/44", "", ["Zürich Stadelhofen"]],
    ["IR", "36", "Basel SBB", "08:38", null, "18", "", ["Baden", "Brugg AG"]],
    ["IC", "2", "Lugano", "08:41", 0, "7", "", ["Zug", "Arth-Goldau"]],
    ["S", "8", "Pfäffikon SZ", "08:44", 2, "31", "", ["Thalwil", "Horgen"]],
    ["IR", "13", "Chur", "08:47", 0, "10", "", ["St. Gallen", "Sargans"]],
    ["IC", "5", "Lausanne", "08:51", 0, "16", "", ["Biel/Bienne", "Neuchâtel"]],
    ["RE", "48", "Schaffhausen", "08:55", null, "6", "", ["Bülach"]],
    ["S", "2", "Ziegelbrücke", "09:02", 0, "32", "", ["Thalwil"]],
  ];
  return { station: { id: "8503000", name: "Zürich HB" }, stationboard: journeys.map(([category, number, to, clock, delay, platform, changed, via]) => {
    const departure = `2026-10-06T${clock}:00+02:00`;
    return { category, number, name: category + number, to, operator: "SBB", stop: {
      departure, delay, platform, prognosis: { platform: changed,
        departure: delay === null ? null : new Date(Date.parse(departure) + delay * 60000).toISOString() },
    }, passList: [{ station: { name: "Zürich HB" } }, ...via.map(name => ({ station: { name } }))] };
  }) };
}

export async function loadDepartures(query = {}, fetchJson = getJson, now = Date.now()) {
  const settings = settingsFor(query);
  if (settings.stationId && !/^\d{6,12}$/.test(settings.stationId)) throw Error("station");
  if (settings.sampleData) {
    const updatedAt = "2026-10-06T06:30:00.000Z";
    return { ...normalizeBoard(sampleBoard(), settings, Date.parse(updatedAt)), sample: true, source: "transport.opendata.ch", updatedAt };
  }
  const url = new URL(endpoint);
  url.searchParams.set(settings.stationId ? "id" : "station", settings.stationId || settings.stationName);
  url.searchParams.set("limit", String(fetchLimit));
  url.searchParams.set("type", "departure");
  if (settings.transport !== "all") url.searchParams.append("transportations[]", settings.transport);
  const data = await fetchJson(url.href, { ttl: 30000, maxBytes: 4 * 1024 * 1024 });
  return { ...normalizeBoard(data, settings, now), sample: false, source: "transport.opendata.ch", updatedAt: retrievedAt(data) };
}

export default async function handler({ query = {} }) {
  try { return await loadDepartures(query); }
  catch (error) { return { error: error.message === "station" ? "station" : "upstream" }; }
}
