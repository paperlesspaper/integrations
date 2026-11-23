import {
  getJson,
  bool,
  required,
  text,
  array,
  coordinates,
  queryUrl,
  number,
  finite,
  row,
  metric,
  tr,
  envelope,
} from "../../_shared/connected-api.js";
export function normalizeSightings(data, q) {
  const observations = array(data).sort((a, b) =>
    String(b.obsDt).localeCompare(String(a.obsDt)),
  );
  return {
    subtitle: text(q.locationName),
    total: observations.length,
    metrics: [
      metric(
        tr(q, "Gemeldete Arten", "Reported species"),
        new Set(observations.map((x) => x.speciesCode)).size,
      ),
      metric(tr(q, "Umkreis", "Radius"), number(q.radiusKm, 25, 1, 50), "km"),
    ],
    rows: observations.map((o) => ({
      ...row(
        o.comName,
        `${o.locName} · ${o.obsDt}`,
        finite(o.howMany) === null
          ? tr(q, "Gemeldet", "Reported")
          : String(o.howMany),
      ),
      icon: "bird",
    })),
    note: tr(
      q,
      "eBird / Cornell Lab · letzte Meldung je Art · Zeiten am Beobachtungsort",
      "eBird / Cornell Lab · latest report per species · observation local times",
    ),
  };
}
export async function loadData(q = {}, fetchJson = getJson) {
  const sample = bool(q.sampleData),
    loc = sample ? null : coordinates(q);
  const d = sample
    ? [
        {
          comName: tr(q, "Eisvogel", "Common Kingfisher"),
          speciesCode: "comkin1",
          locName: "Stadtpark",
          obsDt: "2026-10-02 08:20",
          howMany: 1,
        },
        {
          comName: tr(q, "Graureiher", "Grey Heron"),
          speciesCode: "graher1",
          locName: "Am Fluss",
          obsDt: "2026-10-02 07:45",
          howMany: 3,
        },
        {
          comName: tr(q, "Buntspecht", "Great Spotted Woodpecker"),
          speciesCode: "grswoo",
          locName: "Waldweg",
          obsDt: "2026-10-01 17:30",
          howMany: 2,
        },
      ]
    : await fetchJson(
        queryUrl("https://api.ebird.org/v2/data/obs/geo/recent", {
          lat: loc.latitude,
          lng: loc.longitude,
          dist: number(q.radiusKm, 25, 1, 50),
          back: number(q.days, 7, 1, 30),
          maxResults: 100,
          sort: "date",
          sppLocale: String(q.language).startsWith("de") ? "de" : "en",
          includeProvisional: false,
        }),
        {
          headers: { "X-eBirdApiToken": required(q.apiKey, "eBird API key") },
          ttl: 900000,
        },
      );
  return envelope(
    { ...normalizeSightings(d, q), partial: d.length === 100 },
    sample,
    "eBird",
  );
}
export default async function handler({ query }) {
  return loadData(query);
}
