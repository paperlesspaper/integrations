import {
  getJson,
  bool,
  text,
  finite,
  array,
  metric,
  row,
  tr,
  envelope,
  dateLabel,
} from "../../_shared/connected-api.js";
import { weather } from "../../_shared/open-meteo.js";
export function normalizeSnow(d, q, resort = null, now = Date.now()) {
  const hourly = d.hourly;
  if (!hourly || !d.daily) throw Error("Invalid snow forecast");
  const times = array(hourly.time);
  let index = times.findIndex((t) => t * 1000 >= now);
  if (index < 0) index = times.length - 1;
  const depth = finite(hourly.snow_depth?.[index]);
  const rows = array(d.daily.time).map((t, i) =>
    row(
      dateLabel(new Date(t * 1000).toISOString(), q),
      tr(q, "Neuschnee (Modell)", "New snow (model)"),
      finite(d.daily.snowfall_sum?.[i]) === null
        ? "—"
        : `${d.daily.snowfall_sum[i]} cm`,
    ),
  );
  if (resort) {
    rows.unshift(
      row(
        tr(q, "Lifte geöffnet", "Lifts open"),
        dateLabel(resort.updatedAt, q, true),
        finite(resort.liftsOpen) === null
          ? "—"
          : `${resort.liftsOpen} / ${finite(resort.liftsTotal) ?? "—"}`,
      ),
      row(
        tr(q, "Pisten geöffnet", "Runs open"),
        "",
        finite(resort.runsOpen) === null
          ? "—"
          : `${resort.runsOpen} / ${finite(resort.runsTotal) ?? "—"}`,
      ),
    );
  }
  return {
    subtitle: text(q.locationName),
    metrics: [
      metric(
        tr(q, "Schneehöhe (Modell)", "Snow depth (model)"),
        depth === null ? null : depth * 100,
        "cm",
      ),
      metric(
        tr(q, "Neuschnee heute", "New snow today"),
        finite(d.daily.snowfall_sum?.[0]),
        "cm",
      ),
      metric(
        tr(q, "Temperatur", "Temperature"),
        finite(d.current?.temperature_2m),
        "°C",
      ),
    ],
    rows,
    total: rows.length,
    note:
      tr(
        q,
        "Open-Meteo · Modellwerte am Standort, kein Pistenbericht.",
        "Open-Meteo · model values at the location, not a piste report.",
      ) +
      (resort
        ? " " +
          tr(
            q,
            "Lift-/Pistenstatus aus konfiguriertem Feed.",
            "Lift/run status from configured feed.",
          )
        : ""),
  };
}
export async function loadData(q = {}, fetchJson = getJson, now = Date.now()) {
  const sample = bool(q.sampleData);
  const d = sample
    ? {
        current: { temperature_2m: -3.5 },
        hourly: { time: [now / 1000], snow_depth: [0.72] },
        daily: {
          time: [0, 1, 2, 3].map((i) => now / 1000 + i * 86400),
          snowfall_sum: [12, 8, 0, 3],
        },
      }
    : await weather(
        q,
        {
          hourly: "snow_depth",
          daily: "snowfall_sum",
          current: "temperature_2m",
          forecast_days: 4,
        },
        fetchJson,
      );
  let resort = null,
    partial = false;
  if (text(q.resortFeedUrl) && !sample) {
    try {
      resort = await fetchJson(q.resortFeedUrl);
      if (
        !resort ||
        typeof resort !== "object" ||
        !Number.isFinite(Date.parse(resort.updatedAt))
      )
        throw Error("Invalid resort feed");
    } catch {
      partial = true;
    }
  }
  return envelope(
    { ...normalizeSnow(d, q, resort, now), partial },
    sample,
    "Open-Meteo",
  );
}
export default async function handler({ query }) {
  return loadData(query);
}
