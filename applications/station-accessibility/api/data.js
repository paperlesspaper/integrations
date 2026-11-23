import {
  getJson,
  bool,
  required,
  text,
  array,
  queryUrl,
  row,
  metric,
  tr,
  envelope,
} from "../../_shared/connected-api.js";
export function normalizeFacilities(facilities, q) {
  const rows = array(facilities).filter(
    (f) => q.facilityType === "all" || f.type === "ELEVATOR",
  );
  const order = { INACTIVE: 0, UNKNOWN: 1, ACTIVE: 2 };
  rows.sort((a, b) => (order[a.state] ?? 1) - (order[b.state] ?? 1));
  return {
    total: rows.length,
    metrics: [
      metric(tr(q, "Anlagen", "Facilities"), rows.length),
      metric(
        tr(q, "Außer Betrieb", "Out of service"),
        rows.filter((x) => x.state === "INACTIVE").length,
        "",
        "red",
      ),
      metric(
        tr(q, "Unbekannt", "Unknown"),
        rows.filter((x) => !["ACTIVE", "INACTIVE"].includes(x.state)).length,
      ),
    ],
    rows: rows.map((f) =>
      row(
        f.description || `${f.type} ${f.equipmentnumber}`,
        tr(q, "Bahnhof ", "Station ") + f.stationnumber,
        f.state === "ACTIVE"
          ? tr(q, "In Betrieb", "Operational")
          : f.state === "INACTIVE"
            ? tr(q, "Außer Betrieb", "Out of service")
            : tr(q, "Unbekannt", "Unknown"),
        f.state === "INACTIVE"
          ? "red"
          : f.state === "ACTIVE"
            ? "green"
            : "orange",
      ),
    ),
    note: tr(
      q,
      "DB InfraGO · Anlagenstatus der gewählten Bahnhöfe",
      "DB InfraGO · facility status at selected stations",
    ),
  };
}
export async function loadData(q = {}, fetchJson = getJson) {
  if (bool(q.sampleData))
    return envelope(
      normalizeFacilities(
        [
          {
            type: "ELEVATOR",
            description: "Aufzug zu Gleis 3/4",
            stationnumber: 1071,
            state: "INACTIVE",
          },
          {
            type: "ELEVATOR",
            description: "Aufzug Eingang Nord",
            stationnumber: 1071,
            state: "ACTIVE",
          },
          {
            type: "ELEVATOR",
            description: "Aufzug zu Gleis 7",
            stationnumber: 1071,
            state: "UNKNOWN",
          },
        ],
        q,
      ),
      true,
      "DB FaSta",
    );
  const stations = [
    ...new Set(
      required(q.stationIds, "Station numbers")
        .split(/[,\s]+/)
        .filter(Boolean),
    ),
  ];
  if (stations.length > 5 || stations.some((x) => !/^\d{1,7}$/.test(x)))
    throw Error("Use up to five station numbers");
  const headers = {
    "DB-Client-Id": required(q.clientId, "DB client ID"),
    "DB-Api-Key": required(q.apiKey, "DB API key"),
  };
  const results = await Promise.allSettled(
    stations.map((station) =>
      fetchJson(
        queryUrl(
          "https://apis.deutschebahn.com/db-api-marketplace/apis/fasta/v2/facilities",
          { stationnumber: station },
        ),
        { headers, ttl: 300000 },
      ),
    ),
  );
  const ok = results.filter((x) => x.status === "fulfilled");
  if (!ok.length) throw Error("DB facilities unavailable");
  const data = normalizeFacilities(
    ok.flatMap((x) => array(x.value)),
    q,
  );
  results.forEach((r, i) => {
    if (r.status === "rejected")
      data.rows.unshift(
        row(
          tr(q, "Bahnhof ", "Station ") + stations[i],
          tr(q, "Daten nicht erreichbar", "Data unavailable"),
          "?",
          "orange",
        ),
      );
  });
  data.total = data.rows.length;
  return envelope(
    { ...data, partial: ok.length < stations.length },
    false,
    "DB FaSta",
  );
}
export default async function handler({ query }) {
  return loadData(query);
}
