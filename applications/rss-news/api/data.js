import { XMLParser, XMLValidator } from "fast-xml-parser";
import {
  bool,
  number,
  text,
  getText,
  envelope,
} from "../../_shared/dashboard-api.js";
const array = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);
const plain = (v) =>
  String(typeof v === "object" ? v?.["#text"] || "" : v || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
export function parseFeed(xml, sourceUrl) {
  if (/<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true)
    throw new Error("Invalid or unsupported RSS/Atom document");
  const root = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    parseTagValue: false,
    processEntities: true,
  }).parse(xml);
  const feed = root.rss?.channel || root.feed || root.RDF;
  if (!feed) throw new Error("The source is not an RSS or Atom feed");
  const source =
    plain(feed.title || feed.channel?.title) || new URL(sourceUrl).hostname;
  return array(feed.item || feed.entry || root.RDF?.item)
    .slice(0, 100)
    .map((item) => {
      const link = array(item.link).find(
        (l) =>
          typeof l === "string" || !l["@_rel"] || l["@_rel"] === "alternate",
      );
      let url = "";
      try {
        const candidate = new URL(
          typeof link === "string" ? link : link?.["@_href"],
          sourceUrl,
        );
        if (["http:", "https:"].includes(candidate.protocol))
          url = candidate.href;
      } catch {}
      const date = Date.parse(
        item.pubDate || item.published || item.updated || item.date || "",
      );
      return {
        title: plain(item.title),
        source,
        url,
        date: Number.isFinite(date) ? new Date(date).toISOString() : "",
      };
    })
    .filter((item) => item.title);
}
export default async function handler({ query }) {
  const sample = bool(query.sampleData);
  if (sample)
    return envelope(
      {
        items: [
          {
            title: "Mehr Platz für Fahrräder in der Innenstadt",
            source: "Beispiel Nachrichten",
            date: "2026-09-05T09:00:00Z",
          },
          {
            title: "Neue Forschung zeigt Wege zu sparsamen Gebäuden",
            source: "Beispiel Wissenschaft",
            date: "2026-09-05T08:00:00Z",
          },
          {
            title: "Das Kulturprogramm für das Wochenende",
            source: "Beispiel Kultur",
            date: "2026-09-05T07:00:00Z",
          },
          {
            title: "Gemeinschaftsgärten laden zur Ernte ein",
            source: "Beispiel Regional",
            date: "2026-09-05T06:00:00Z",
          },
        ],
        total: 4,
        failedFeeds: 0,
      },
      true,
      "RSS / Atom",
    );
  const feeds = [
    ...new Set(
      text(query.feeds)
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ];
  if (!feeds.length || feeds.length > 4)
    throw new Error("Enter between one and four RSS/Atom feed URLs");
  const results = await Promise.allSettled(
    feeds.map(async (url) => parseFeed(await getText(url), url)),
  );
  const good = results.filter((r) => r.status === "fulfilled");
  if (!good.length) throw new Error("No RSS/Atom feed could be loaded");
  const seen = new Set();
  const items = good
    .flatMap((r) => r.value)
    .sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0))
    .filter((i) => {
      const key = i.url || i.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return envelope(
    {
      items: items.slice(0, number(query.limit, 5, 1, 8)),
      total: items.length,
      failedFeeds: results.length - good.length,
    },
    false,
    "RSS / Atom",
  );
}
