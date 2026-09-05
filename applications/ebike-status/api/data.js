import { bool, text, required, envelope } from "../../_shared/dashboard-api.js";
import { readEntities } from "../../_shared/home-assistant.js";
export default async function handler({ query }) {
  if (bool(query.sampleData))
    return envelope(
      {
        bikeName: text(query.bikeName) || "Turbo · Demo",
        sensors: [
          { role: "battery", value: "84", unit: "%" },
          { role: "distance", value: "1248", unit: "km" },
          { role: "charging", value: "off", unit: "" },
        ],
      },
      true,
      "Home Assistant",
    );
  required(query.batteryEntity, "Battery entity");
  const fields = ["battery", "distance", "charging"].filter((k) =>
    text(query[`${k}Entity`]),
  );
  const sensors = await readEntities(
    query,
    fields.map((k) => text(query[`${k}Entity`])),
  );
  return envelope(
    {
      bikeName: text(query.bikeName),
      sensors: sensors.map((s, i) => ({ ...s, role: fields[i] })),
    },
    false,
    "Home Assistant",
  );
}
