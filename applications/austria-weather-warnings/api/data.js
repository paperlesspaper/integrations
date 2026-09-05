import {
  bool,
  number,
  language,
  getJson,
  retrievedAt,
  envelope,
} from "../../_shared/dashboard-api.js";
import { localDateTime } from "../../_shared/calendar-feed.js";
export function warningTime(raw, local) {
  if (
    raw !== undefined &&
    raw !== null &&
    raw !== "" &&
    Number.isFinite(Number(raw))
  )
    return new Date(Number(raw) * 1000).toISOString();
  const m = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/.exec(
    String(local || ""),
  );
  if (!m) throw new Error("GeoSphere warning has no valid timestamp");
  return localDateTime(
    +m[3],
    +m[2] - 1,
    +m[1],
    +m[4],
    +m[5],
    "Europe/Vienna",
  ).toISOString();
}
export function normalizeWarnings(data, includeUpcoming, now = Date.now()) {
  if (
    !data?.properties?.location?.properties?.name ||
    !Array.isArray(data.properties.warnings)
  )
    throw new Error("Invalid GeoSphere response");
  const warnings = data.properties.warnings
    .map((w) => {
      const p = w.properties;
      if (!p || ![1, 2, 3].includes(Number(p.warnstufeid)))
        throw new Error("Invalid GeoSphere warning");
      return {
        type: Number(p.warntypid),
        level: Number(p.warnstufeid),
        start: warningTime(p.rawinfo?.start, p.begin),
        end: warningTime(p.rawinfo?.end, p.end),
        text: String(p.text || p.meteotext || "")
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 700),
      };
    })
    .filter(
      (w) =>
        Date.parse(w.end) >= now &&
        (includeUpcoming || Date.parse(w.start) <= now),
    )
    .sort(
      (a, b) => b.level - a.level || Date.parse(a.start) - Date.parse(b.start),
    );
  return {
    municipality: data.properties.location.properties.name,
    warnings,
    total: warnings.length,
  };
}
export default async function handler({ query }) {
  if (bool(query.sampleData)) {
    const now = Date.now();
    return envelope(
      {
        municipality: "Wien · DEMO",
        warnings: [
          {
            type: 5,
            level: 2,
            start: new Date(now - 3600000).toISOString(),
            end: new Date(now + 4 * 3600000).toISOString(),
            text:
              language(query) === "de"
                ? "Beispielwarnung: Gewitter mit Starkregen und kräftigen Böen."
                : "Example warning: Thunderstorms with heavy rain and strong gusts.",
          },
        ],
        total: 1,
      },
      true,
      "GeoSphere Austria · CC BY 4.0",
    );
  }
  const params = new URLSearchParams({
    lat: String(number(query.latitude, 48.2082, 46, 49.1)),
    lon: String(number(query.longitude, 16.3738, 9.5, 17.2)),
    lang: language(query),
  });
  const raw = await getJson(
    `https://warnungen.zamg.at/wsapp/api/getWarningsForCoords?${params}`,
    { ttl: 300000 },
  );
  return envelope(
    normalizeWarnings(raw, bool(query.includeUpcoming)),
    false,
    "GeoSphere Austria · CC BY 4.0",
    retrievedAt(raw),
  );
}
