import {
  bool,
  number,
  text,
  getJson,
  retrievedAt,
  envelope,
} from "../../_shared/dashboard-api.js";
export default async function handler({ query }) {
  const sample = bool(query.sampleData),
    limit = number(query.limit, 4, 1, 8);
  let data;
  if (sample)
    data = {
      results: [
        {
          name: "Demo mission · Earth observation",
          net: "2026-09-12T10:30:00Z",
          status: { name: "Go for Launch" },
          rocket: { configuration: { name: "Falcon 9" } },
          pad: {
            name: "Launch Complex 40",
            location: { name: "Cape Canaveral" },
          },
          mission: {
            description: "An example mission for the display preview.",
          },
        },
        {
          name: "Demo mission · Lunar science",
          net: "2026-09-15T17:00:00Z",
          status: { name: "To Be Confirmed" },
          rocket: { configuration: { name: "Ariane 6" } },
          pad: { name: "ELA-4", location: { name: "Kourou" } },
        },
        {
          name: "Demo mission · Satellite deployment",
          net: "2026-09-18T08:00:00Z",
          status: { name: "To Be Determined" },
          rocket: { configuration: { name: "Electron" } },
          pad: { location: { name: "Mahia" } },
        },
      ],
    };
  else {
    const params = new URLSearchParams({
      limit: String(limit),
      mode: "normal",
    });
    if (text(query.search))
      params.set("search", text(query.search).slice(0, 100));
    data = await getJson(
      `https://ll.thespacedevs.com/2.3.0/launches/upcoming/?${params}`,
      { ttl: 30 * 60 * 1000 },
    );
  }
  if (!Array.isArray(data.results))
    throw new Error("Invalid Launch Library response");
  return envelope(
    {
      launches: data.results
        .slice(0, limit)
        .map((l) => ({
          name: String(l.name || ""),
          rocket: String(l.rocket?.configuration?.name || ""),
          location: String(l.pad?.location?.name || l.pad?.name || ""),
          date: Number.isFinite(Date.parse(l.net)) ? l.net : "",
          status: String(l.status?.name || ""),
        })),
    },
    sample,
    "The Space Devs · Launch Library 2",
    retrievedAt(data),
  );
}
