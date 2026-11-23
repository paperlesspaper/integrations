import { baseUrl } from "../../_shared/dashboard-api.js";
import {
  getJson,
  bool,
  text,
  required,
  array,
  id,
  finite,
  row,
  metric,
  tr,
  envelope,
  queryUrl,
} from "../../_shared/connected-api.js";
export function normalizeNetwork(devices, clients, q, statistics = null) {
  const ds = array(devices);
  const bad = ds.filter((d) => d.state !== "ONLINE");
  const rates = statistics?.uplink;
  const throughput = rates
    ? [
        row(
          tr(q, "Gateway-Uplink", "Gateway uplink"),
          tr(q, "Empfang / Senden", "Receive / transmit"),
          `${finite(rates.rxRateBps) === null ? "—" : String(rates.rxRateBps)} / ${finite(rates.txRateBps) === null ? "—" : String(rates.txRateBps)} Bps`,
        ),
      ]
    : [];
  return {
    total: ds.length + throughput.length,
    metrics: [
      metric(tr(q, "Geräte", "Devices"), ds.length),
      metric(
        tr(q, "Online", "Online"),
        ds.filter((d) => d.state === "ONLINE").length,
      ),
      metric(
        tr(q, "Nicht online", "Not online"),
        bad.length,
        "",
        bad.length ? "red" : "green",
      ),
      metric(tr(q, "Clients", "Clients"), clients),
    ],
    rows: [
      ...throughput,
      ...[...ds]
        .sort(
          (a, b) => Number(a.state === "ONLINE") - Number(b.state === "ONLINE"),
        )
        .map((d) =>
          row(
            d.name || d.model,
            d.model,
            d.state === "ONLINE"
              ? tr(q, "Online", "Online")
              : d.state || tr(q, "Unbekannt", "Unknown"),
            d.state === "ONLINE" ? "green" : "red",
          ),
        ),
    ],
    note: tr(
      q,
      "Lokale UniFi Network API · Gerätestatus, kein Internet-Verfügbarkeitstest",
      "Local UniFi Network API · device status, not an Internet availability test",
    ),
  };
}
export async function loadData(q = {}, fetchJson = getJson) {
  if (bool(q.sampleData))
    return envelope(
      normalizeNetwork(
        [
          { name: "Cloud Gateway", model: "UCG-Ultra", state: "ONLINE" },
          { name: "Wohnzimmer", model: "U6 Pro", state: "ONLINE" },
          { name: "Garten", model: "U6 Mesh", state: "OFFLINE" },
        ],
        23,
        q,
      ),
      true,
      "UniFi",
    );
  const root =
    baseUrl(q.baseUrl) +
    (q.consoleType === "standalone"
      ? "/integration/v1"
      : "/proxy/network/integration/v1");
  const headers = { "X-API-KEY": required(q.apiKey, "UniFi API key") };
  let site = text(q.siteId);
  if (!site) {
    const d = await fetchJson(root + "/sites?limit=100", { headers });
    const sites = array(d.data);
    if (sites.length !== 1) throw Error("Choose a UniFi site ID");
    site = sites[0].id;
  }
  const devices = [];
  let total = 0;
  for (let offset = 0; offset < 500; offset += 100) {
    const d = await fetchJson(
      queryUrl(`${root}/sites/${id(site)}/devices`, { offset, limit: 100 }),
      { headers },
    );
    devices.push(...array(d.data));
    total = finite(d.totalCount) ?? devices.length;
    if (devices.length >= total || d.data.length < 100) break;
  }
  const clients = await fetchJson(`${root}/sites/${id(site)}/clients?limit=1`, {
    headers,
  });
  let statistics = null,
    partial = devices.length < total;
  const gateway = devices.find((d) => d.features?.includes("gateway"));
  if (gateway) {
    try {
      statistics = await fetchJson(
        `${root}/sites/${id(site)}/devices/${id(gateway.id)}/statistics/latest`,
        { headers },
      );
    } catch {
      partial = true;
    }
  }
  return envelope(
    {
      ...normalizeNetwork(devices, finite(clients.totalCount), q, statistics),
      partial,
    },
    false,
    "UniFi",
  );
}
export default async function handler({ query }) {
  return loadData(query);
}
