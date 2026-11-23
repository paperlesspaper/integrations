import test from "node:test";
import assert from "node:assert/strict";
import { articleRanking, historyValues, imageUrl, loadWikipedia, normalizeSettings, percentage } from "../applications/wikipedia/api/data.js";

const now = new Date("2026-01-01T00:15:00Z");
const top = (articles) => ({ items: [{ articles }] });
test("settings retain old primary/default modes, normalize editions and bound limits", () => {
  assert.equal(normalizeSettings({ kind: "default" }).kind, "primary");
  assert.equal(normalizeSettings({ edition: "auto", language: "fr-FR" }).edition, "fr");
  assert.equal(normalizeSettings({ edition: "en.evil.test" }).edition, "de");
  assert.equal(normalizeSettings({ limit: 500 }).limit, 20);
  assert.equal(normalizeSettings({ limit: -1 }).limit, 1);
  assert.equal(normalizeSettings({ limit: "bad" }).limit, 10);
  assert.equal(normalizeSettings({ sampleData: "false" }).sampleData, false);
});
test("rankings remove navigation, duplicates and malformed views while retaining article colons", () => {
  const rows = articleRanking(top([
    { article: "Main_Page", views: 999 }, { article: "Spezial:Suche", views: 800 },
    { article: "Star_Trek:_Voyager", views: 20 }, { article: "Terre", views: 30 },
    { article: "Terre", views: 30 }, { article: "Invalid", views: "400" },
    { article: "Wikipédia:Accueil_principal", views: 600 },
  ]));
  assert.deepEqual(rows.map((row) => [row.article, row.rank]), [["Terre", 1], ["Star_Trek:_Voyager", 2]]);
  assert.throws(() => articleRanking({}), /Invalid/);
});
test("history matches UTC dates across year boundaries and distinguishes missing values from zero", () => {
  const history = historyValues({ items: [{ timestamp: "2026010100", views: 30 }, { timestamp: "2025123000", views: 0 }, { timestamp: "2025123100", views: 15 }] }, "2026-01-01");
  assert.deepEqual(history, [null, null, null, null, 0, 15, 30]);
  assert.equal(percentage(30, 15), 100);
  assert.equal(percentage(0, 15), -100);
  assert.equal(percentage(30, 0), null);
  assert.equal(percentage(30, null), null);
});
test("ranking falls back to a published UTC date and calculates comparisons from that day", async () => {
  const urls = [];
  const data = await loadWikipedia({ kind: "trends", limit: 2, showImage: false }, async (url) => {
    urls.push(url);
    if (url.includes("/top/") && url.endsWith("2025/12/31")) throw Error("Not published");
    if (url.includes("/top/")) return top([{ article: "Erde", views: 100 }, { article: "Mond", views: 50 }]);
    assert.ok(url.endsWith("2025122400/2025123000"));
    return { items: [{ timestamp: "2025122900", views: 25 }, { timestamp: "2025123000", views: 100 }] };
  }, now);
  assert.equal(data.date, "2025-12-30");
  assert.equal(data.articles[0].change, 300);
  assert.equal(data.articles[0].rankChange, 0);
  assert.equal(data.articles[0].history[0], null);
  assert.equal(data.partial, true);
  assert.ok(urls.some((url) => url.endsWith("2025/12/29")));
  assert.ok(!urls.some((url) => url.includes("/summary/")));
});
test("optional comparison and image failures preserve the live ranking without fake data", async () => {
  const data = await loadWikipedia({ kind: "thumbnail" }, async (url) => {
    if (url.endsWith("2025/12/31")) return top([{ article: "A/B_&_C", views: 123 }]);
    if (url.includes("/summary/")) assert.ok(url.endsWith("A%2FB_%26_C"));
    throw Error("Unavailable");
  }, now);
  assert.equal(data.sample, false);
  assert.equal(data.image, "");
  assert.equal(data.articles[0].change, null);
  assert.equal(data.articles[0].newEntry, false);
  assert.deepEqual(data.articles[0].history, Array(7).fill(null));
  assert.equal(data.articles[0].views, 123);
  await assert.rejects(loadWikipedia({ kind: "trends" }, async () => { throw Error("Offline"); }, now), /Offline/);
});
test("featured content uses plain titles, bounded extracts and trusted images", async () => {
  const data = await loadWikipedia({ kind: "default", limitCharacters: 100, limit: 1 }, async () => ({
    tfa: { titles: { normalized: "A < B" }, displaytitle: "<b>HTML</b>", extract: "x".repeat(200), thumbnail: { source: "https://evil.test/x.png" } },
    onthisday: [{ year: 1969, text: "Moon landing" }, { year: 2000, text: "Other" }],
  }), now);
  assert.equal(data.article.title, "A < B");
  assert.equal(data.article.extract.length, 101);
  assert.equal(data.article.image, "");
  assert.equal(data.events.length, 1);
  assert.equal(imageUrl("javascript:alert(1)"), "");
  assert.equal(imageUrl("https://upload.wikimedia.org/example.jpg"), "https://upload.wikimedia.org/example.jpg");
});
test("an unsupported featured feed remains an explicit empty state, not an unrelated article", async () => {
  const data = await loadWikipedia({ edition: "es" }, async () => ({}), now);
  assert.equal(data.article, null);
  assert.deepEqual(data.events, []);
});
test("sample mode is explicit, localized and does not contact Wikimedia", async () => {
  for (const edition of ["de", "en", "fr", "es", "it", "pt", "nl", "pl", "sv", "fi"]) {
    const data = await loadWikipedia({ edition, sampleData: true }, () => assert.fail("Unexpected fetch"));
    assert.equal(data.sample, true);
    assert.equal(data.edition, edition);
    assert.equal(data.articles.length, 10);
  }
});

test("image toggle works for featured articles, event images and legacy thumbnail mode", async () => {
  assert.equal(normalizeSettings({kind: "thumbnail"}).kind, "trends");
  assert.equal(normalizeSettings({kind: "thumbnail"}).showImage, true);
  const image = "https://upload.wikimedia.org/example.jpg";
  const feed = {tfa:{title:"Earth",extract:"Planet",thumbnail:{source:image}},onthisday:[{year:1969,text:"Apollo",pages:[{thumbnail:{source:image}}]}]};
  for (const showImage of [true, false]) {
    const data = await loadWikipedia({kind:"onthisday",showImage}, async () => feed, now);
    assert.equal(data.article.image, showImage ? image : "");
    assert.equal(data.events[0].image, showImage ? image : "");
    assert.equal(data.showImage, showImage);
  }
});

test("additional editions exclude localized home and special pages", () => {
 const titles = ["Pagina_principale", "Página_principal", "Hoofdpagina", "Strona_główna", "Huvudsida", "Etusivu", "Speciale:Ricerca", "Speciaal:Zoeken", "Specjalna:Szukaj", "Toiminnot:Haku"];
 assert.deepEqual(articleRanking(top(titles.map(article => ({article,views:100})))), []);
});
