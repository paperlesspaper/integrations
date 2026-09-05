import {
  bool,
  number,
  text,
  required,
  baseUrl,
  getJson,
  envelope,
} from "../../_shared/dashboard-api.js";
export function normalizeStats(raw) {
  const value = (k) => {
    const v = raw[k]?.value ?? raw[k];
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0)
      throw new Error("Invalid Umami statistics");
    return v;
  };
  const visitors = value("visitors"),
    pageviews = value("pageviews"),
    visits = value("visits"),
    bounces = value("bounces");
  return {
    visitors,
    pageviews,
    visits,
    bounceRate: visits ? Math.min(100, (bounces / visits) * 100) : 0,
  };
}
export default async function handler({ query }) {
  const days = Math.trunc(number(query.days, 7, 1, 30));
  if (bool(query.sampleData))
    return envelope(
      {
        days,
        stats: {
          visitors: 1284,
          pageviews: 3926,
          visits: 1598,
          bounceRate: 32.4,
        },
        series: [120, 160, 135, 210, 190, 245, 224].map((y, i) => ({
          x: `2026-09-0${i + 1}`,
          y,
        })),
      },
      true,
      "Umami",
    );
  const cloud = query.hosting !== "self-hosted";
  const base = cloud
    ? "https://api.umami.is/v1"
    : `${baseUrl(query.baseUrl)}/api`;
  const token = required(query.token, "Umami API key / bearer token"),
    id = required(query.websiteId, "Website ID");
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(id)) throw new Error("Invalid website ID");
  const endAt = Date.now(),
    startAt = endAt - days * 86400000;
  const zone = text(query.timeZone) || "Europe/Berlin";
  new Intl.DateTimeFormat("en", { timeZone: zone });
  const params = new URLSearchParams({
    startAt: String(startAt),
    endAt: String(endAt),
    unit: "day",
    timezone: zone,
  });
  const options = { headers: { Authorization: `Bearer ${token}` } };
  const [raw, series] = await Promise.all([
    getJson(`${base}/websites/${id}/stats?${params}`, options),
    getJson(`${base}/websites/${id}/pageviews?${params}`, options),
  ]);
  if (!Array.isArray(series.sessions))
    throw new Error("Invalid Umami daily series");
  return envelope(
    {
      days,
      stats: normalizeStats(raw),
      series: series.sessions
        .slice(0, 32)
        .map((p) => ({ x: String(p.x), y: number(p.y, 0, 0, 1e12) })),
    },
    false,
    "Umami",
  );
}
