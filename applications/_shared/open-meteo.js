import { coordinates, queryUrl, text, getJson } from "./connected-api.js";
export function weatherUrl(q, params) {
  const key = text(q.weatherApiKey);
  return queryUrl(
    key
      ? "https://customer-api.open-meteo.com/v1/forecast"
      : "https://api.open-meteo.com/v1/forecast",
    {
      ...coordinates(q),
      timezone: text(q.timeZone) || "Europe/Berlin",
      timeformat: "unixtime",
      ...params,
      ...(key ? { apikey: key } : {}),
    },
  );
}
export async function weather(q, params, fetchJson = getJson) {
  return fetchJson(weatherUrl(q, params), { ttl: 900000 });
}
