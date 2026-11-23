import { bool, getJson, number } from "../../_shared/dashboard-api.js";

const DAY = 86400000;
const API = "https://wikimedia.org/api/rest_v1/metrics/pageviews";
const options = { ttl: 3600000, headers: { "User-Agent": "paperlesspaper-wikipedia/1.0 (https://paperlesspaper.de)" } };
export const editions = ["de", "en", "fr", "es", "it", "pt", "nl", "pl", "sv", "fi"];
export const dateKey = (date) => new Date(date).toISOString().slice(0, 10);
const dayPath = (date) => dateKey(date).replaceAll("-", "/");
const timestamp = (date) => dateKey(date).replaceAll("-", "") + "00";
const titleOf = (page) => String(page?.titles?.normalized || page?.normalizedtitle || page?.title || "").replaceAll("_", " ");
const articleUrl = (edition, title) => `https://${edition}.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(" ", "_"))}`;
export function imageUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["upload.wikimedia.org", "thumb.wikimedia.org"].includes(url.hostname) ? url.href : "";
  } catch { return ""; }
}
export function normalizeSettings(query = {}) {
  const requested = String(query.edition === "auto" || !query.edition ? query.language || "de" : query.edition).split("-")[0];
  return {
    edition: editions.includes(requested) ? requested : "de",
    kind: query.kind === "thumbnail" ? "trends" : ["onthisday", "trends"].includes(query.kind) ? query.kind : "primary",
    showImage: query.showImage == null ? true : bool(query.showImage),
    limit: Math.floor(number(query.limit, 10, 1, 20)),
    limitCharacters: Math.floor(number(query.limitCharacters, 550, 100, 2000)),
    sampleData: bool(query.sampleData),
  };
}

// Exclude navigation pages and known namespaces, but keep article titles with
// colons (e.g. Star Trek: Voyager). The rank is within this filtered article list.
const namespaces = /^(?:speciale|speciaal|specjalna|toiminnot|special|spezial|spécial|especial|wikipedia|wikipédia|user|benutzer(?:in)?|utilisateur|usuario|talk|diskussion|discussion|discusión|file|datei|fichier|archivo|category|kategorie|catégorie|categoría|template|vorlage|modèle|plantilla|help|hilfe|aide|ayuda|portal|portail|mediawiki|module|modul|annexe|draft|book|timedtext|utente|discussione|immagine|categoria|aiuto|portale|usuário|usuária|ficheiro|predefinição|ajuda|gebruiker|overleg|bestand|sjabloon|portaal|wikipedysta|wikipedystka|dyskusja|plik|kategoria|szablon|pomoc|användare|användardiskussion|fil|kategori|mall|hjälp|käyttäjä|keskustelu|tiedosto|luokka|malline|ohje)(?:[ _](?:talk|discussion|diskussion))?:/i;
export function articleRanking(data) {
  const items = data?.items?.[0]?.articles;
  if (!Array.isArray(items)) throw new Error("Invalid Wikipedia ranking");
  const seen = new Set();
  return items.filter((item) => {
    if (typeof item.article !== "string" || !Number.isFinite(item.views) || item.views < 0 || seen.has(item.article)) return false;
    seen.add(item.article);
    return !namespaces.test(item.article) && !["Main_Page", "Hauptseite", "Accueil_principal", "Wikipédia:Accueil_principal", "Portada", "Pagina_principale", "Página_principal", "Hoofdpagina", "Strona_główna", "Huvudsida", "Etusivu", "-"].includes(item.article);
  }).sort((a, b) => b.views - a.views).map((item, index) => ({ ...item, rank: index + 1 }));
}

export function historyValues(data, endDate) {
  const values = new Map((Array.isArray(data?.items) ? data.items : []).map((item) => [String(item.timestamp).slice(0, 8), item.views]));
  return Array.from({ length: 7 }, (_, i) => {
    const value = values.get(timestamp(new Date(endDate).getTime() - (6 - i) * DAY).slice(0, 8));
    return Number.isFinite(value) && value >= 0 ? value : null;
  });
}
export function percentage(current, previous) {
  return Number.isFinite(previous) && previous > 0 ? (current - previous) / previous * 100 : null;
}

export async function loadWikipedia(query = {}, fetchJson = getJson, now = new Date()) {
  const settings = normalizeSettings(query);
  const { edition, kind, limit, limitCharacters, showImage } = settings;
  if (settings.sampleData) {
    const { sampleData } = await import("../data/sample.js");
    return sampleData(settings);
  }
  const get = (url) => fetchJson(url, options);
  const today = dateKey(now);
  if (kind === "primary" || kind === "onthisday") {
    const feed = await get(`https://${edition}.wikipedia.org/api/rest_v1/feed/featured/${dayPath(today)}`);
    const page = feed?.tfa;
    return {
      edition, kind, showImage, date: today, sample: false,
      article: page && titleOf(page) && page.extract ? {
        title: titleOf(page), extract: String(page.extract).slice(0, limitCharacters) + (String(page.extract).length > limitCharacters ? "…" : ""),
        image: showImage ? imageUrl(page.thumbnail?.source) : "", url: articleUrl(edition, titleOf(page)),
      } : null,
      events: (Array.isArray(feed?.onthisday) ? feed.onthisday : []).filter((event) => Number.isInteger(event.year) && typeof event.text === "string" && event.text.trim()).slice(0, limit).map((event) => ({ year: event.year, text: event.text, image: showImage ? imageUrl(event.pages?.find((page) => imageUrl(page.thumbnail?.source))?.thumbnail?.source) : "" })),
    };
  }

  let ranked, date;
  // Yesterday is the latest complete UTC day. Publication may lag by a day.
  for (let offset = 1; offset <= 3; offset++) {
    date = dateKey(new Date(today).getTime() - offset * DAY);
    try {
      ranked = articleRanking(await get(`${API}/top/${edition}.wikipedia/all-access/${dayPath(date)}`));
      if (ranked.length) break;
    } catch (error) {
      if (offset === 3) throw error;
    }
  }
  if (!ranked?.length) throw new Error("Wikipedia ranking unavailable");
  const previousDate = dateKey(new Date(date).getTime() - DAY);
  const [previousResult, summaryResult] = await Promise.allSettled([
    get(`${API}/top/${edition}.wikipedia/all-access/${dayPath(previousDate)}`).then(articleRanking),
    showImage ? get(`https://${edition}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(ranked[0].article)}`) : Promise.resolve(null),
  ]);
  const previous = previousResult.status === "fulfilled" ? new Map(previousResult.value.map((item) => [item.article, item.rank])) : null;
  const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
  const rows = ranked.slice(0, limit);
  // Bound upstream concurrency, even on larger displays.
  const articles = [];
  for (let start = 0; start < rows.length; start += 4) {
    const batch = await Promise.all(rows.slice(start, start + 4).map(async (row) => {
      let history = Array(7).fill(null);
      try {
        history = historyValues(await get(`${API}/per-article/${edition}.wikipedia/all-access/user/${encodeURIComponent(row.article)}/daily/${timestamp(new Date(date).getTime() - 6 * DAY)}/${timestamp(date)}`), date);
      } catch { /* A missing optional history never hides the current ranking. */ }
      const previousRank = previous?.get(row.article);
      return {
        title: row.article.replaceAll("_", " "), url: articleUrl(edition, row.article),
        rank: row.rank, views: row.views, history,
        change: percentage(row.views, history[5]),
        rankChange: previousRank ? previousRank - row.rank : null,
        newEntry: previous ? !previous.has(row.article) : false,
      };
    }));
    articles.push(...batch);
  }
  return {
    edition, kind, showImage, date, sample: false, articles,
    image: imageUrl(summary?.thumbnail?.source),
    imageTitle: summary ? titleOf(summary) : "",
    partial: previous === null || articles.some((row) => row.history.some((value) => value === null)),
  };
}

export default async function handler({ query }) { return loadWikipedia(query); }
