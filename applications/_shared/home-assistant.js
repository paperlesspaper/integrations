import { baseUrl, required, getJson } from "./dashboard-api.js";

export async function readEntities(query, ids) {
  const base = baseUrl(query.baseUrl);
  const token = required(query.token, "Home Assistant token");
  if (!ids.length || ids.length > 12)
    throw new Error("Choose between 1 and 12 entities");
  if (ids.some((id) => !/^(sensor|binary_sensor)\.[a-z0-9_]+$/.test(id)))
    throw new Error("Use sensor.* or binary_sensor.* entity IDs");
  return Promise.all(
    ids.map(async (id) => {
      const raw = await getJson(
        `${base}/api/states/${encodeURIComponent(id)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (raw.entity_id !== id || typeof raw.state !== "string")
        throw new Error("Invalid Home Assistant entity response");
      return {
        id,
        name: String(raw.attributes?.friendly_name || id),
        value: raw.state,
        unit: String(raw.attributes?.unit_of_measurement || ""),
        deviceClass: raw.attributes?.device_class || "",
        updatedAt: raw.last_updated || "",
        unavailable: ["unknown", "unavailable"].includes(raw.state),
      };
    }),
  );
}
