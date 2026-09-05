import {
  bool,
  number,
  text,
  required,
  getJson,
  retrievedAt,
  envelope,
} from "../../_shared/dashboard-api.js";
export default async function handler({ query }) {
  const type = ["e5", "e10", "diesel"].includes(query.fuelType)
    ? query.fuelType
    : "e10";
  const sample = bool(query.sampleData);
  let data;
  if (sample)
    data = {
      ok: true,
      stations: [
        {
          id: "demo-1",
          name: "City Tankstelle",
          street: "Hauptstraße",
          houseNumber: "12",
          dist: 1.2,
          isOpen: true,
          price: 1.639,
        },
        {
          id: "demo-2",
          name: "Park Tankstelle",
          street: "Parkweg",
          houseNumber: "8",
          dist: 2.4,
          isOpen: true,
          price: 1.659,
        },
        {
          id: "demo-3",
          name: "West Tankstelle",
          street: "Weststraße",
          houseNumber: "3",
          dist: 3.1,
          isOpen: true,
          price: 1.679,
        },
        {
          id: "demo-4",
          name: "Nord Tankstelle",
          street: "Nordring",
          houseNumber: "5",
          dist: 4.5,
          isOpen: false,
          price: 1.689,
        },
      ],
    };
  else {
    const params = new URLSearchParams({
      lat: String(number(query.latitude, 52.52, -90, 90)),
      lng: String(number(query.longitude, 13.405, -180, 180)),
      rad: String(number(query.radius, 5, 1, 25)),
      type,
      sort: "price",
      apikey: required(query.apiKey, "Tankerkönig API key"),
    });
    data = await getJson(
      `https://creativecommons.tankerkoenig.de/json/list.php?${params}`,
      { ttl: 10 * 60 * 1000 },
    );
  }
  if (data.ok !== true || !Array.isArray(data.stations))
    throw new Error(
      "Tankerkönig could not return prices; check the API key and location",
    );
  const rows = data.stations
    .filter(
      (s) =>
        (!bool(query.openOnly) || s.isOpen === true) &&
        typeof s.price === "number" &&
        s.price > 0,
    )
    .sort((a, b) => a.price - b.price || a.dist - b.dist);
  return envelope(
    {
      fuelType: type,
      total: rows.length,
      stations: rows
        .slice(0, number(query.limit, 5, 1, 8))
        .map((s) => ({
          id: String(s.id),
          name: text(s.name),
          address: [s.street, s.houseNumber].filter(Boolean).join(" "),
          distance: s.dist,
          price: s.price,
          open: s.isOpen === true,
        })),
    },
    sample,
    "Tankerkönig · MTS-K · CC BY 4.0",
    retrievedAt(data),
  );
}
