import {
  getJson,
  bool,
  text,
  coordinates,
  array,
  finite,
  metric,
  row,
  tr,
  envelope,
  dateLabel,
} from "../../_shared/connected-api.js";
import { weather } from "../../_shared/open-meteo.js";
export function auroraAt(d, lat, lon) {
  const cells = array(d.coordinates);
  let best = null,
    distance = Infinity;
  const longitude = (lon + 360) % 360;
  for (const c of cells) {
    if (!Array.isArray(c) || c.length < 3) continue;
    const dx = Math.min(
      Math.abs(c[0] - longitude),
      360 - Math.abs(c[0] - longitude),
    );
    const dist = dx * dx + (c[1] - lat) ** 2;
    if (dist < distance) {
      best = finite(c[2]);
      distance = dist;
    }
  }
  if (distance > 4 || best === null)
    throw Error("NOAA grid missing for location");
  return best;
}
export function normalizeAurora(oval, forecast, q, now = Date.now()) {
  const { latitude, longitude } = coordinates(q);
  const value = auroraAt(oval, latitude, longitude);
  if (!Number.isFinite(Date.parse(oval["Forecast Time"])))
    throw Error("Missing NOAA forecast time");
  const stale = Math.abs(now - Date.parse(oval["Forecast Time"])) > 3 * 3600000;
  const h = forecast?.hourly;
  const nights = h
    ? array(h.time)
        .map((t, i) => ({
          t,
          cloud: finite(h.cloud_cover?.[i]),
          night: h.is_day?.[i] === 0,
        }))
        .filter((x) => x.night && x.t * 1000 >= now)
        .slice(0, 6)
    : [];
  return {
    subtitle: text(q.locationName),
    metrics: [
      metric(tr(q, "NOAA-Ovalmodell", "NOAA oval model"), value, "%"),
      metric(
        tr(q, "Bewölkung nächste Nachtstunde", "Cloud next night hour"),
        nights[0]?.cloud ?? null,
        "%",
      ),
    ],
    rows: nights.map((x) =>
      row(
        dateLabel(new Date(x.t * 1000).toISOString(), q, true),
        tr(q, "Bewölkung", "Cloud cover"),
        x.cloud === null ? "—" : `${x.cloud}%`,
        x.cloud !== null && x.cloud < 25 ? "green" : "accent",
      ),
    ),
    partial: !forecast || stale,
    note:
      tr(
        q,
        "NOAA-Modell am Standort; keine Sichtbarkeitsgarantie. Wolken: Open-Meteo. Prognose: ",
        "NOAA model at location; not a visibility guarantee. Clouds: Open-Meteo. Forecast: ",
      ) +
      dateLabel(oval["Forecast Time"], q, true) +
      (stale ? tr(q, " · veraltet", " · stale") : ""),
  };
}
export async function loadData(q = {}, fetchJson = getJson, now = Date.now()) {
  if (bool(q.sampleData)) {
    const loc = coordinates(q);
    return envelope(
      normalizeAurora(
        {
          "Forecast Time": new Date(now + 1800000).toISOString(),
          coordinates: [[(loc.longitude + 360) % 360, loc.latitude, 38]],
        },
        {
          hourly: {
            time: Array.from(
              { length: 6 },
              (_, i) => now / 1000 + (i + 1) * 3600,
            ),
            is_day: [0, 0, 0, 0, 0, 0],
            cloud_cover: [18, 12, 8, 15, 30, 36],
          },
        },
        q,
        now,
      ),
      true,
      "NOAA SWPC / Open-Meteo",
    );
  }
  const [oval, clouds] = await Promise.allSettled([
    fetchJson(
      "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json",
      { ttl: 900000, maxBytes: 2 * 1024 * 1024 },
    ),
    weather(q, { hourly: "cloud_cover,is_day", forecast_days: 2 }, fetchJson),
  ]);
  if (oval.status !== "fulfilled") throw Error("NOAA forecast unavailable");
  return envelope(
    normalizeAurora(
      oval.value,
      clouds.status === "fulfilled" ? clouds.value : null,
      q,
      now,
    ),
    false,
    "NOAA SWPC / Open-Meteo",
  );
}
export default async function handler({ query }) {
  return loadData(query);
}
