import { bool, text, envelope, language } from "../../_shared/dashboard-api.js";
import { readEntities } from "../../_shared/home-assistant.js";
export default async function handler({ query }) {
  const sample = bool(query.sampleData),
    de = language(query) === "de";
  const sensors = sample
    ? [
        {
          id: "sensor.demo_temperature",
          name: de ? "Wohnzimmer" : "Living room",
          value: "21.4",
          unit: "°C",
        },
        { id: "sensor.demo_co2", name: "CO₂", value: "645", unit: "ppm" },
        {
          id: "sensor.demo_humidity",
          name: de ? "Luftfeuchte" : "Humidity",
          value: "48",
          unit: "%",
        },
        {
          id: "binary_sensor.demo_window",
          name: de ? "Küchenfenster" : "Kitchen window",
          value: "off",
          unit: "",
          deviceClass: "window",
        },
      ].map((s) => ({ ...s, updatedAt: new Date().toISOString() }))
    : await readEntities(query, [
        ...new Set(
          text(query.entities)
            .split(/[\n,]+/)
            .map((s) => s.trim())
            .filter(Boolean),
        ),
      ]);
  return envelope({ sensors }, sample, "Home Assistant");
}
