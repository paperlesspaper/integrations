import { baseUrl } from "../../_shared/dashboard-api.js";
import {
  getJson,
  bool,
  finite,
  array,
  number,
  metric,
  row,
  tr,
  envelope,
  auth,
  text,
} from "../../_shared/connected-api.js";
export function normalizeEvcc(body, q) {
  const d = body.result || body;
  const lp = array(d.loadpoints)[Math.floor(number(q.loadpoint, 1, 1, 64)) - 1];
  if (!lp) throw Error("EVCC loadpoint not found");
  const state =
    lp.charging === true
      ? tr(q, "Lädt", "Charging")
      : lp.connected === true
        ? tr(q, "Verbunden", "Connected")
        : lp.connected === false
          ? tr(q, "Nicht verbunden", "Disconnected")
          : tr(q, "Unbekannt", "Unknown");
  return {
    subtitle: lp.title,
    metrics: [
      metric(tr(q, "Akku", "Battery"), finite(lp.vehicleSoc), "%"),
      metric(
        tr(q, "Ladeleistung", "Charge power"),
        finite(lp.chargePower) === null ? null : lp.chargePower / 1000,
        "kW",
      ),
      metric(tr(q, "Geladen", "Energy added"), finite(lp.chargedEnergy), "kWh"),
      metric(
        tr(q, "Solaranteil Sitzung", "Session solar share"),
        finite(lp.sessionSolarPercentage),
        "%",
      ),
    ],
    rows: [
      row(
        lp.vehicleName || tr(q, "Fahrzeug", "Vehicle"),
        state,
        lp.mode || "—",
        lp.charging ? "green" : "accent",
      ),
      row(
        tr(q, "Reichweite", "Range"),
        "",
        finite(lp.vehicleRange) === null ? "—" : `${lp.vehicleRange} km`,
      ),
    ],
    note: tr(
      q,
      "Momentaufnahme des gewählten Ladepunkts · keine Steuerung",
      "Snapshot of the selected charge point · read-only",
    ),
  };
}
export async function loadData(q = {}, fetchJson = getJson) {
  const sample = bool(q.sampleData);
  const d = sample
    ? {
        loadpoints: [
          {
            title: "Carport",
            vehicleName: "Familienauto",
            vehicleSoc: 68,
            chargePower: 5400,
            chargedEnergy: 12.4,
            sessionSolarPercentage: 92,
            charging: true,
            mode: "pv",
            vehicleRange: 312,
          },
        ],
      }
    : await fetchJson(baseUrl(q.baseUrl) + "/api/state", {
        headers: text(q.token) ? auth(q.token) : {},
      });
  return envelope(normalizeEvcc(d, q), sample, "evcc");
}
export default async function handler({ query }) {
  return loadData(query);
}
