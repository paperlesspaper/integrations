import { connect } from "mqtt";
import {
  bool,
  text,
  required,
  number,
  finite,
  metric,
  row,
  tr,
  envelope,
  dateLabel,
} from "../../_shared/connected-api.js";
const FIELDS = [
  "display_name",
  "state",
  "since",
  "healthy",
  "battery_level",
  "est_battery_range_km",
  "charge_energy_added",
  "time_to_full_charge",
  "plugged_in",
];
export function brokerUrl(value) {
  const u = new URL(required(value, "MQTT broker URL"));
  if (
    !["mqtt:", "mqtts:"].includes(u.protocol) ||
    u.username ||
    u.password ||
    u.search ||
    u.hash ||
    !["", "/"].includes(u.pathname)
  )
    throw Error("Use mqtt(s)://host:port without credentials");
  const allowed = (process.env.PAPERLESSPAPER_MQTT_BROKERS || "")
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""));
  if (!allowed.includes(u.href.replace(/\/$/, "")))
    throw Error("MQTT broker must be enabled by the server operator");
  return u.href;
}
export async function readSnapshot(q, connector = connect) {
  const url = brokerUrl(q.brokerUrl);
  const car = String(Math.floor(number(q.carId, 1, 1, 9999)));
  const prefix = `teslamate/cars/${car}/`;
  return new Promise((resolve, reject) => {
    const values = {};
    let timer,
      settle,
      finished = false;
    const client = connector(url, {
      username: text(q.username) || undefined,
      password: text(q.password) || undefined,
      reconnectPeriod: 0,
      connectTimeout: 8000,
      clean: true,
      rejectUnauthorized: true,
      protocolVersion: 4,
    });
    const finish = (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      clearTimeout(settle);
      client.end(true);
      error
        ? reject(new Error(error))
        : Object.keys(values).length
          ? resolve(values)
          : reject(Error("No retained TeslaMate values"));
    };
    timer = setTimeout(
      () => finish(Object.keys(values).length ? null : "MQTT timeout"),
      10000,
    );
    client.on("error", () => finish("MQTT connection failed"));
    client.on("connect", () =>
      client.subscribe(
        FIELDS.map((f) => prefix + f),
        { qos: 0 },
        (err, granted) => {
          if (err || granted?.some((g) => g.qos === 128))
            return finish("MQTT subscription denied");
          settle = setTimeout(() => finish(), 1600);
        },
      ),
    );
    client.on("message", (topic, body) => {
      const field = topic.startsWith(prefix) ? topic.slice(prefix.length) : "";
      if (FIELDS.includes(field) && body.length < 1024)
        values[field] = body.toString();
    });
  });
}
export function normalizeTesla(d, q) {
  const states = {
    online: tr(q, "Online", "Online"),
    asleep: tr(q, "Schläft", "Asleep"),
    charging: tr(q, "Lädt", "Charging"),
    offline: tr(q, "Offline", "Offline"),
    driving: tr(q, "Fährt", "Driving"),
  };
  return {
    subtitle: d.display_name,
    metrics: [
      metric(tr(q, "Akku", "Battery"), finite(d.battery_level), "%"),
      metric(
        tr(q, "Geschätzte Reichweite", "Estimated range"),
        finite(d.est_battery_range_km),
        "km",
      ),
      metric(
        tr(q, "Zuletzt geladen", "Last energy added"),
        finite(d.charge_energy_added),
        "kWh",
      ),
      metric(
        tr(q, "Bis voll", "Until full"),
        d.state === "charging" ? finite(d.time_to_full_charge) : null,
        "h",
      ),
    ],
    rows: [
      row(
        tr(q, "Fahrzeugstatus", "Vehicle state"),
        d.since
          ? tr(q, "Status seit ", "State since ") + dateLabel(d.since, q, true)
          : "",
        states[d.state] || tr(q, "Unbekannt", "Unknown"),
      ),
      row(
        tr(q, "Datenlogger", "Data logger"),
        "",
        d.healthy === "true"
          ? tr(q, "Verbunden", "Connected")
          : d.healthy === "false"
            ? tr(q, "Gestört", "Unhealthy")
            : tr(q, "Unbekannt", "Unknown"),
        d.healthy === "false" ? "red" : "accent",
      ),
    ],
    note: tr(
      q,
      "Gespeicherte MQTT-Werte; Alter einzelner Messwerte unbekannt. „Status seit“ ist kein Messzeitpunkt.",
      "Retained MQTT values; individual measurement age unknown. State time is not a measurement timestamp.",
    ),
  };
}
export async function loadData(q = {}, reader = readSnapshot) {
  const sample = bool(q.sampleData);
  const d = sample
    ? {
        display_name: "Model Y",
        state: "asleep",
        battery_level: "78",
        est_battery_range_km: "342",
        charge_energy_added: "18.4",
        healthy: "true",
        since: new Date(Date.now() - 3600000).toISOString(),
      }
    : await reader(q);
  return envelope(normalizeTesla(d, q), sample, "TeslaMate · MQTT");
}
export default async function handler({ query }) {
  return loadData(query);
}
