import test from "node:test";
import assert from "node:assert/strict";
import {
  loadAir,
  aqiBand,
  normalizeAir,
} from "../applications/air-quality/api/data.js";
import {
  loadRivers,
  stationNames,
  normalizeStation,
} from "../applications/river-levels/api/data.js";
import {
  loadReleases,
  repositories,
  newestRelease,
} from "../applications/github-releases/api/data.js";
import {
  loadDocuments,
  normalizeDocuments,
} from "../applications/paperless-ngx-inbox/api/data.js";

test("air quality retains missing readings and uses European AQI boundary bands", () => {
  assert.deepEqual([null, 0, 20, 20.1, 40, 60, 80, 100, 101].map(aqiBand), [
    null,
    0,
    0,
    1,
    1,
    2,
    3,
    4,
    5,
  ]);
  const d = normalizeAir(
    {
      current: { time: 1000, european_aqi: null, pm2_5: 0, pm10: null },
      hourly: { time: [999, 1001, 25000], european_aqi: [500, 32, 900] },
    },
    { language: "en" },
  );
  assert.equal(d.cards[0].value, null);
  assert.equal(d.cards[1].value, 0);
  assert.equal(d.cards[2].value, null);
  assert.equal(d.cards[3].value, 32);
  assert.throws(() => normalizeAir({}, {}));
});
test("air adapter sends coordinates, UTC timestamps and paid keys only to customer endpoint", async () => {
  await assert.rejects(
    loadAir({ latitude: 91 }, () => assert.fail("no network")),
  );
  await loadAir(
    { latitude: 48, longitude: 16, apiKey: "test-secret" },
    async (url) => {
      const u = new URL(url);
      assert.equal(u.hostname, "customer-air-quality-api.open-meteo.com");
      assert.equal(u.searchParams.get("apikey"), "test-secret");
      assert.equal(u.searchParams.get("timeformat"), "unixtime");
      return { current: { time: 1000, european_aqi: 30 } };
    },
  );
  const d = await loadAir({ sampleData: true }, () =>
    assert.fail("demo is local"),
  );
  assert.equal(d.sample, true);
});
test("river readings preserve units, negative gauge heights and missing measurements", () => {
  assert.deepEqual(stationNames("KÖLN\nKÖLN,BONN"), ["KÖLN", "BONN"]);
  assert.throws(() => stationNames("../bad"));
  assert.throws(() => stationNames("a,b,c,d"));
  const d = normalizeStation({
    longname: "A",
    timeseries: [
      {
        shortname: "W",
        unit: "cm",
        currentMeasurement: {
          value: -5,
          timestamp: "2026-09-05T12:00:00+02:00",
        },
      },
    ],
  });
  assert.equal(d.value, -5);
  assert.equal(d.unit, "cm");
  assert.equal(normalizeStation({ longname: "A", timeseries: [] }).value, null);
});
test("river failures stay visible and total outage rejects without demo fallback", async () => {
  const mock = async (url) => {
    if (url.includes("BAD")) throw Error("source failure");
    return { longname: "KÖLN", timeseries: [] };
  };
  const d = await loadRivers({ stations: "KÖLN,BAD" }, mock);
  assert.equal(d.partial, true);
  assert.equal(d.cards[1].value, null);
  assert.equal(d.sample, false);
  await assert.rejects(loadRivers({ stations: "BAD" }, mock));
});
test("releases select newest publication, reject traversal and exclude drafts even with token", async () => {
  assert.throws(() => repositories("../x"));
  assert.throws(() => repositories("https://github.com/a/b"));
  const rows = [
    { tag_name: "draft", draft: true, published_at: "2026-09-05" },
    { tag_name: "beta", prerelease: true, published_at: "2026-09-04" },
    { tag_name: "v1", published_at: "2026-09-01" },
    { tag_name: "v2", published_at: "2026-09-03" },
  ];
  assert.equal(newestRelease(rows, false).tag_name, "v2");
  assert.equal(newestRelease(rows, true).tag_name, "beta");
  assert.equal(newestRelease([], false), null);
  const d = await loadReleases(
    { repositories: "owner/repo", token: "secret" },
    async (url, opts) => {
      assert.equal(opts.headers.Authorization, "Bearer secret");
      assert(!url.includes("secret"));
      return rows;
    },
  );
  assert.equal(d.cards[0].value, "v2");
  assert(!JSON.stringify(d).includes("secret"));
  await assert.rejects(
    loadReleases({ repositories: "a/b" }, async () => {
      throw Error("rate limit");
    }),
  );
});
test("Paperless-ngx requests bounded metadata and strips OCR content and credentials", async () => {
  let requests = 0;
  const d = await loadDocuments(
    {
      baseUrl: "https://example.org/paperless",
      token: "secret",
      limit: 3,
      search: "tag:Inbox",
      language: "en",
    },
    async (url, opts) => {
      requests++;
      const u = new URL(url);
      assert.equal(u.pathname, "/paperless/api/documents/");
      assert.equal(u.searchParams.get("query"), "tag:Inbox");
      assert.equal(u.searchParams.get("page_size"), "3");
      assert.equal(u.searchParams.get("fields"), "id,title,added,created");
      assert.equal(opts.headers.Authorization, "Token secret");
      return {
        count: 8,
        results: [
          {
            title: "<script>test</script>",
            added: "2026-09-05T10:00:00Z",
            content: "SENSITIVE OCR",
            owner: 7,
          },
        ],
      };
    },
  );
  assert.equal(requests, 1);
  assert.equal(d.total, 8);
  assert(!JSON.stringify(d).includes("SENSITIVE"));
  assert(!JSON.stringify(d).includes("secret"));
  assert.equal(d.cards[0].title, "<script>test</script>");
  assert.throws(() => normalizeDocuments({ results: [] }, {}));
  const empty = normalizeDocuments({ count: 0, results: [] }, {});
  assert.equal(empty.total, 0);
  assert.deepEqual(empty.cards, []);
  await assert.rejects(
    loadDocuments({ baseUrl: "https://example.org", token: "" }, () =>
      assert.fail("missing token"),
    ),
  );
  const demo = await loadDocuments({ sampleData: true }, () =>
    assert.fail("demo is local"),
  );
  assert.equal(demo.sample, true);
});
