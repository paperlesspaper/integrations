import {
  getJson,
  bool,
  array,
  number,
  finite,
  auth,
  oauthToken,
  queryUrl,
  metric,
  row,
  tr,
  envelope,
  dayInZone,
  localDayNumber,
} from "../../_shared/connected-api.js";
export function normalizeAnalytics(report, q) {
  if (!Array.isArray(report.columnHeaders))
    throw Error("Invalid YouTube report");
  const names = report.columnHeaders.map((c) => c.name);
  const rows = array(report.rows || []).map((values) =>
    Object.fromEntries(names.map((name, i) => [name, values[i]])),
  );
  const sum = (key) =>
    rows.length &&
    names.includes(key) &&
    rows.every((r) => finite(r[key]) !== null)
      ? rows.reduce((total, r) => total + Number(r[key]), 0)
      : null;
  const minutes = sum("estimatedMinutesWatched"),
    gained = sum("subscribersGained"),
    lost = sum("subscribersLost");
  return {
    metrics: [
      metric(tr(q, "Aufrufe", "Views"), sum("views")),
      metric(
        tr(q, "Wiedergabezeit", "Watch time"),
        minutes === null ? null : minutes / 60,
        "h",
      ),
      metric(
        tr(q, "Abonnenten netto", "Net subscribers"),
        gained === null || lost === null ? null : gained - lost,
      ),
    ],
    partial: !rows.length,
    chart: {
      label: tr(q, "Tägliche Aufrufe", "Daily views"),
      points: rows.map((r) => ({
        label: String(r.day),
        value: finite(r.views),
      })),
    },
    note: tr(
      q,
      "YouTube Analytics · Daten können verzögert oder unvollständig sein · Berichtstage in Pacific Time",
      "YouTube Analytics · reporting may be delayed or incomplete · report days in Pacific Time",
    ),
  };
}
export async function loadData(q = {}, fetchJson = getJson, now = new Date()) {
  const days = Math.floor(number(q.days, 7, 1, 30));
  const lastDay = localDayNumber(dayInZone(now, "America/Los_Angeles")) - 1;
  const end = new Date(lastDay * 86400000).toISOString().slice(0, 10),
    start = new Date((lastDay - days + 1) * 86400000)
      .toISOString()
      .slice(0, 10);
  if (bool(q.sampleData))
    return envelope(
      {
        ...normalizeAnalytics(
          {
            columnHeaders: [
              "day",
              "views",
              "estimatedMinutesWatched",
              "subscribersGained",
              "subscribersLost",
            ].map((name) => ({ name })),
            rows: Array.from({ length: days }, (_, i) => [
              new Date(Date.parse(start) + i * 86400000)
                .toISOString()
                .slice(0, 10),
              [1240, 1480, 980, 2310, 1860, 2740, 3100][i % 7],
              4200 + i * 130,
              12 + i,
              2,
            ]),
          },
          q,
        ),
        subtitle: `${start} – ${end}`,
        rows: [
          row(
            "A quieter way to stay informed",
            tr(q, "Neuestes Video", "Latest video"),
            "2.410 " + tr(q, "Aufrufe", "views"),
          ),
        ],
      },
      true,
      "YouTube",
    );
  const headers = auth(await oauthToken(q, "google", fetchJson));
  const report = await fetchJson(
    queryUrl("https://youtubeanalytics.googleapis.com/v2/reports", {
      ids: "channel==MINE",
      startDate: start,
      endDate: end,
      metrics:
        "views,estimatedMinutesWatched,subscribersGained,subscribersLost",
      dimensions: "day",
      sort: "day",
    }),
    { headers },
  );
  const data = normalizeAnalytics(report, q);
  data.subtitle = `${start} – ${end}`;
  try {
    const channel = await fetchJson(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true",
      { headers },
    );
    const c = array(channel.items)[0];
    if (c) {
      data.subtitle = c.snippet?.title + " · " + data.subtitle;
      data.metrics.push(
        metric(
          tr(q, "Abonnenten gesamt", "Total subscribers"),
          c.statistics?.hiddenSubscriberCount
            ? null
            : finite(c.statistics?.subscriberCount),
        ),
      );
      const playlist = c.contentDetails?.relatedPlaylists?.uploads;
      if (playlist) {
        const p = await fetchJson(
          queryUrl("https://www.googleapis.com/youtube/v3/playlistItems", {
            part: "snippet,contentDetails",
            playlistId: playlist,
            maxResults: 1,
          }),
          { headers },
        );
        const video = p.items?.[0];
        if (video?.contentDetails?.videoId) {
          const v = await fetchJson(
            queryUrl("https://www.googleapis.com/youtube/v3/videos", {
              part: "statistics",
              id: video.contentDetails.videoId,
            }),
            { headers },
          );
          data.rows = [
            row(
              video.snippet?.title,
              tr(
                q,
                "Neuestes Video · Aufrufe gesamt",
                "Latest video · lifetime views",
              ),
              String(v.items?.[0]?.statistics?.viewCount ?? "—"),
            ),
          ];
        }
      }
    }
  } catch {
    data.partial = true;
  }
  return envelope(data, false, "YouTube");
}
export default async function handler({ query }) {
  return loadData(query);
}
