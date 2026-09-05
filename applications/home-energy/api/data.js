import { bool, text, envelope } from "../../_shared/dashboard-api.js";
import { readEntities } from "../../_shared/home-assistant.js";
export default async function handler({ query }) {
  const sample = bool(query.sampleData),
    fields = ["solar", "consumption", "yield", "battery"];
  if (sample)
    return envelope(
      {
        sensors: [
          { role: "solar", value: "2.4", unit: "kW" },
          { role: "consumption", value: "640", unit: "W" },
          { role: "yield", value: "12.8", unit: "kWh" },
          { role: "battery", value: "76", unit: "%" },
        ],
      },
      true,
      "Home Assistant",
    );
  const chosen = fields.filter((k) => text(query[`${k}Entity`]));
  if (!chosen.length) throw new Error("Choose at least one energy sensor");
  const sensors = await readEntities(
    query,
    chosen.map((k) => text(query[`${k}Entity`])),
  );
  return envelope(
    { sensors: sensors.map((s, i) => ({ ...s, role: chosen[i] })) },
    false,
    "Home Assistant",
  );
}
