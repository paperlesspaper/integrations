import { createHash } from "node:crypto";
import {
  getJson,
  language,
  required,
  text,
  number,
  envelope,
  bool,
} from "./dashboard-api.js";
export { getJson, language, required, text, number, envelope, bool };
export const clean = (v, limit = 160) =>
  String(v ?? "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, limit);
export const finite = (v) =>
  v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v))
    ? Number(v)
    : null;
export const array = (v) => {
  if (!Array.isArray(v)) throw Error("Invalid provider response");
  return v;
};
export const id = (v, label = "ID") => encodeURIComponent(required(v, label));
export const tr = (q, de, en) => (language(q) === "de" ? de : en);
export const auth = (token) => ({
  Authorization: `Bearer ${required(token, "Access token")}`,
});
export const metric = (label, value, unit = "", tone = "accent") => ({
  label,
  value,
  unit,
  tone,
});
export const row = (title, detail = "", badge = "", tone = "accent") => ({
  title: clean(title),
  detail: clean(detail),
  badge: clean(badge, 48),
  tone,
});
export const post = (url, data, headers = {}, fetchJson = getJson) =>
  fetchJson(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(data),
  });
export function dateLabel(value, q, withTime = false) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat(language(q) === "de" ? "de-DE" : "en-GB", {
    dateStyle: "short",
    ...(withTime ? { timeStyle: "short" } : {}),
    timeZone: text(q.timeZone) || "Europe/Berlin",
  }).format(date);
}
export function dayInZone(now, timeZone = "Europe/Berlin") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function localDayNumber(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error("Use a YYYY-MM-DD date");
  const ms = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(ms) || new Date(ms).toISOString().slice(0, 10) !== value)
    throw Error("Invalid date");
  return ms / 86400000;
}
export function coordinates(q) {
  const lat = finite(q.latitude),
    lon = finite(q.longitude);
  if (
    lat === null ||
    lon === null ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  )
    throw Error("Latitude and longitude are required");
  return { latitude: lat, longitude: lon };
}
export function queryUrl(base, params) {
  const u = new URL(base);
  for (const [k, v] of Object.entries(params))
    if (v !== undefined && v !== null && v !== "")
      u.searchParams.set(k, String(v));
  return u.href;
}
// Cursor URLs are untrusted provider data; credentials stay on the original origin/path.
export function nextUrl(value, origin, pathPrefix) {
  const u = new URL(value);
  if (
    u.origin !== origin ||
    !u.pathname.startsWith(pathPrefix) ||
    u.username ||
    u.password
  )
    throw Error("Invalid pagination URL");
  return u.href;
}
const tokens = new Map();
export async function oauthToken(q, provider, fetchJson = getJson) {
  if (!text(q.refreshToken))
    return required(q.accessToken, "Access token or refresh token");
  const clientId = required(q.clientId, "OAuth client ID");
  const key = createHash("sha256")
    .update(
      JSON.stringify([
        provider,
        clientId,
        q.clientSecret,
        q.refreshToken,
        q.tenant,
      ]),
    )
    .digest("hex");
  const previous = tokens.get(key);
  if (previous?.expires > Date.now() + 60000) return previous.accessToken;
  const tenant = text(q.tenant) || "common";
  if (!/^[a-zA-Z0-9.-]+$/.test(tenant)) throw Error("Invalid Microsoft tenant");
  const endpoint =
    provider === "microsoft"
      ? `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`
      : "https://oauth2.googleapis.com/token";
  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: previous?.refreshToken || q.refreshToken,
    grant_type: "refresh_token",
  });
  if (text(q.clientSecret)) body.set("client_secret", text(q.clientSecret));
  const token = await fetchJson(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const accessToken = required(
    token.access_token,
    "OAuth access token response",
  );
  if (tokens.size > 64) tokens.delete(tokens.keys().next().value);
  tokens.set(key, {
    accessToken,
    refreshToken:
      token.refresh_token || previous?.refreshToken || q.refreshToken,
    expires: Date.now() + number(token.expires_in, 3600, 60, 86400) * 1000,
  });
  return accessToken;
}
export function demo(q, source, data) {
  return envelope(data, true, source);
}
