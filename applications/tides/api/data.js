import {
  getJson,
  bool,
  text,
  required,
  array,
  finite,
  queryUrl,
  row,
  tr,
  envelope,
  dateLabel,
} from "../../_shared/connected-api.js";
export function normalizeTides(extremes, heights, q, now = Date.now()) {
  const normalized = array(extremes.predictions)
    .map((p) => ({
      time: Date.parse(p.t.replace(" ", "T") + "Z"),
      height: finite(p.v),
      type: p.type,
    }))
    .filter((p) => Number.isFinite(p.time));
  const upcoming = normalized.filter((p) => p.time >= now).slice(0, 6);
  return {
    subtitle: text(q.stationName) || text(q.stationId),
    total: upcoming.length,
    rows: upcoming.map((p) =>
      row(
        p.type === "H"
          ? tr(q, "Hochwasser", "High tide")
          : tr(q, "Niedrigwasser", "Low tide"),
        dateLabel(new Date(p.time).toISOString(), q, true),
        p.height === null ? "—" : `${p.height.toFixed(2)} m`,
      ),
    ),
    chart: heights
      ? {
          label: tr(q, "Vorhergesagter Wasserstand", "Predicted water level"),
          unit: "m",
          points: array(heights.predictions)
            .slice(0, 49)
            .map((p) => ({
              label: dateLabel(p.t.replace(" ", "T") + "Z", q, true),
              value: finite(p.v),
            })),
        }
      : undefined,
    note: tr(
      q,
      "NOAA · Höhen über MLLW · US-Stationen · Vorhersage, keine Messung",
      "NOAA · heights above MLLW · US stations · prediction, not observation",
    ),
  };
}
export async function loadData(q = {}, fetchJson = getJson, now = Date.now()) {
  if (bool(q.sampleData)) {
    const start = Math.floor(now / 3600000) * 3600000;
    const fmt = (t) => new Date(t).toISOString().slice(0, 16).replace("T", " ");
    return envelope(
      normalizeTides(
        {
          predictions: Array.from({ length: 6 }, (_, i) => ({
            t: fmt(start + (i * 6 + 2) * 3600000),
            v: i % 2 ? "0.3" : "1.8",
            type: i % 2 ? "L" : "H",
          })),
        },
        {
          predictions: Array.from({ length: 25 }, (_, i) => ({
            t: fmt(start + i * 3600000),
            v: 1 + Math.sin((i * Math.PI) / 6) * 0.8,
          })),
        },
        q,
        now,
      ),
      true,
      "NOAA CO-OPS",
    );
  }
  const station = required(q.stationId, "NOAA station ID");
  if (!/^\d{7}$/.test(station))
    throw Error("Use a seven-digit NOAA station ID");
  const params = {
    product: "predictions",
    application: "paperlesspaper",
    begin_date: new Date(now).toISOString().slice(0, 10).replaceAll("-", ""),
    range: 48,
    datum: "MLLW",
    station,
    time_zone: "gmt",
    units: "metric",
    format: "json",
  };
  const [extremes, heights] = await Promise.allSettled([
    fetchJson(
      queryUrl("https://api.tidesandcurrents.noaa.gov/api/prod/datagetter", {
        ...params,
        interval: "hilo",
      }),
      { ttl: 3600000 },
    ),
    fetchJson(
      queryUrl("https://api.tidesandcurrents.noaa.gov/api/prod/datagetter", {
        ...params,
        interval: "h",
      }),
      { ttl: 3600000 },
    ),
  ]);
  if (extremes.status !== "fulfilled" || extremes.value.error)
    throw Error("NOAA predictions unavailable for station");
  const curve =
    heights.status === "fulfilled" && !heights.value.error
      ? heights.value
      : null;
  return envelope(
    { ...normalizeTides(extremes.value, curve, q, now), partial: !curve },
    false,
    "NOAA CO-OPS",
  );
}
export default async function handler({ query }) {
  return loadData(query);
}
