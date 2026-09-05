import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import {
  getJson,
  getText,
  publicAddress,
} from "../applications/_shared/dashboard-api.js";
import { parseFeed } from "../applications/rss-news/api/data.js";
import {
  parseSchedule,
  default as school,
} from "../applications/school-timetable/api/data.js";
import { seasonalItems } from "../applications/seasonal-produce/api/data.js";
import {
  normalizeWarnings,
  warningTime,
} from "../applications/austria-weather-warnings/api/data.js";
import {
  normalizeStats,
  default as umami,
} from "../applications/umami-stats/api/data.js";
import { default as mealie } from "../applications/mealie/api/data.js";
import { readEntities } from "../applications/_shared/home-assistant.js";
import { default as fuel } from "../applications/fuel-prices/api/data.js";
import { __dayCalendarInternals } from "../applications/day-calendar/api/data.js";

test("public-address filter denies local, mapped, reserved and link-local addresses", () => {
  for (const address of [
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "192.168.1.1",
    "::1",
    "fe80::1",
    "fc00::1",
    "::ffff:127.0.0.1",
    "2002:7f00:1::",
    "2001:db8::1",
  ])
    assert.equal(publicAddress(address), false, address);
  assert.equal(publicAddress("1.1.1.1"), true);
  assert.equal(publicAddress("2606:4700:4700::1111"), true);
});
test("RSS and Atom normalize titles, dates and safe alternate links", () => {
  const rss = parseFeed(
    "<rss><channel><title>News</title><item><title><![CDATA[Hello <b>world</b> & friends]]></title><link>https://example.org/a</link><pubDate>Sat, 05 Sep 2026 10:00:00 GMT</pubDate></item></channel></rss>",
    "https://example.org",
  );
  assert.equal(rss[0].title, "Hello world & friends");
  assert.equal(rss[0].date, "2026-09-05T10:00:00.000Z");
  const atom = parseFeed(
    '<feed xmlns="http://www.w3.org/2005/Atom"><title>Atom</title><entry><title>A</title><link href="javascript:alert(1)"/><updated>invalid</updated></entry></feed>',
    "https://example.org",
  );
  assert.equal(atom[0].url, "");
  assert.equal(atom[0].date, "");
  assert.throws(() =>
    parseFeed(
      '<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>',
      "https://example.org",
    ),
  );
  assert.throws(() =>
    parseFeed("<html>not a feed</html>", "https://example.org"),
  );
});
test("seasonality distinguishes fresh harvest from storage and category filters", () => {
  const january = seasonalItems(1, true);
  assert.equal(january.find((p) => p.en === "Apple").kind, "storage");
  assert(!seasonalItems(1, false).some((p) => p.en === "Apple"));
  assert(seasonalItems(6, false, "fruit").every((p) => p.category === "fruit"));
  assert(!seasonalItems(12, true).some((p) => p.en === "Strawberry"));
});
test("timetable rejects invalid clocks and expands local lessons across DST", async () => {
  for (const value of [
    "0|08:00|09:00|Math",
    "1|25:00|26:00|Math",
    "1|09:00|08:00|Math",
    "1|8:00|09:00|Math",
  ])
    assert.throws(() => parseSchedule(value));
  const d = await school({
    query: {
      sampleData: false,
      schedule: "1|08:00|09:00|Math|101",
      rangeStart: "2026-03-23",
      rangeEndExclusive: "2026-03-31",
      timeZone: "Europe/Berlin",
    },
  });
  assert.deepEqual(
    d.events.map((e) => e.start.dateTime),
    ["2026-03-23T07:00:00.000Z", "2026-03-30T06:00:00.000Z"],
  );
  assert.equal(
    (
      await school({
        query: {
          schedule: "",
          rangeStart: "2026-09-07",
          rangeEndExclusive: "2026-09-14",
        },
      })
    ).events.length,
    0,
  );
});
test("fuel demo uses explicit mode and filters closed stations without invented prices", async () => {
  const d = await fuel({
    query: { sampleData: "true", openOnly: "true", fuelType: "e5" },
  });
  assert(d.sample);
  assert(d.stations.every((s) => s.open));
  assert.equal(d.fuelType, "e5");
  assert.equal(
    (await fuel({ query: { sampleData: true, openOnly: "false" } })).stations
      .length,
    4,
  );
  await assert.rejects(fuel({ query: { sampleData: false } }), /API key/);
});
test("warnings filter expiration and future warnings, and preserve severity", () => {
  const warning = (id, level, start, end) => ({
    properties: {
      warntypid: id,
      warnstufeid: level,
      rawinfo: { start, end },
      text: "<b>Wind</b>",
    },
  });
  const data = {
    properties: {
      location: { properties: { name: "Wien" } },
      warnings: [
        warning(1, 1, 100, 300),
        warning(2, 3, 400, 600),
        warning(3, 2, 0, 100),
      ],
    },
  };
  const active = normalizeWarnings(data, false, 200000);
  assert.equal(active.warnings.length, 1);
  const future = normalizeWarnings(data, true, 200000);
  assert.deepEqual(
    future.warnings.map((w) => w.level),
    [3, 1],
  );
  assert.equal(
    warningTime(null, "01.07.2026 12:00"),
    "2026-07-01T10:00:00.000Z",
  );
  assert.throws(() => normalizeWarnings({}, true));
});
test("Umami handles both numeric and value-wrapped stats without treating missing values as zero", () => {
  assert.equal(
    normalizeStats({ visitors: 10, pageviews: 30, visits: 20, bounces: 5 })
      .bounceRate,
    25,
  );
  assert.equal(
    normalizeStats({
      visitors: { value: 10 },
      pageviews: { value: 30 },
      visits: { value: 20 },
      bounces: { value: 5 },
    }).visitors,
    10,
  );
  assert.throws(() => normalizeStats({ visitors: 10 }));
});
test("daylight delta spans seven civil days, including DST, and handles polar conditions", () => {
  const build = __dayCalendarInternals.buildSeasonDaylightFact;
  const d = build(
    new Date("2026-10-23T12:00:00Z"),
    "de",
    52.52,
    13.405,
    "Europe/Berlin",
  );
  assert.equal(d.trend.length, 7);
  assert.equal(d.trend.at(-1).date, "2026-10-30");
  assert(d.trend.at(-1).deltaMinutes < 0);
  const p = build(new Date("2026-06-21T12:00:00Z"), "en", 89, 0, "UTC");
  assert.equal(p.trend[0].hours, 24);
  assert(!p.meta.includes("Invalid"));
});
test("private service adapters use only read requests, authenticate, paginate, and preserve unavailable sensors", async () => {
  const seen = [];
  const server = createServer((req, res) => {
    seen.push({
      url: req.url,
      method: req.method,
      auth: req.headers.authorization,
    });
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/redirect") {
      res.writeHead(302, { Location: "/secret" });
      return res.end();
    }
    if (req.url === "/large") return res.end("x".repeat(2048));
    if (req.url === "/bad") return res.end("not json");
    if (req.url.startsWith("/api/states/"))
      return res.end(
        JSON.stringify({
          entity_id: "sensor.test",
          state: "unavailable",
          attributes: {
            friendly_name: "A <script>alert(1)</script>",
            unit_of_measurement: "W",
          },
          last_updated: "2026-09-01T00:00:00Z",
        }),
      );
    if (req.url.includes("/mealplans")) {
      const page = new URL(req.url, "http://test").searchParams.get("page");
      return res.end(
        JSON.stringify({
          items: [
            {
              id: Number(page),
              date: page === "1" ? "2026-09-07" : "2026-09-08",
              title: "",
              recipe: { name: "Pasta" },
              entryType: "dinner",
            },
          ],
          next: page === "1" ? "page2" : null,
        }),
      );
    }
    if (req.url.includes("/pageviews"))
      return res.end(JSON.stringify({ sessions: [{ x: "2026-09-05", y: 8 }] }));
    if (req.url.includes("/stats"))
      return res.end(
        JSON.stringify({ visitors: 8, pageviews: 24, visits: 12, bounces: 3 }),
      );
    res.end("{}");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const origin = `http://127.0.0.1:${server.address().port}`;
  const before = process.env.PAPERLESSPAPER_PRIVATE_API_ORIGINS;
  try {
    delete process.env.PAPERLESSPAPER_PRIVATE_API_ORIGINS;
    await assert.rejects(getJson(origin), /HTTPS/);
    process.env.PAPERLESSPAPER_PRIVATE_API_ORIGINS = origin;
    const entities = await readEntities(
      { baseUrl: origin, token: "test-token" },
      ["sensor.test"],
    );
    assert.equal(entities[0].unavailable, true);
    assert.equal(entities[0].value, "unavailable");
    await assert.rejects(
      readEntities({ baseUrl: origin, token: "test-token" }, ["light.bedroom"]),
      /sensor/,
    );
    await assert.rejects(
      getText(`${origin}/redirect`, {
        headers: { Authorization: "Bearer test-token" },
      }),
      /redirect/,
    );
    assert(!seen.some((r) => r.url === "/secret"));
    await assert.rejects(
      getText(`${origin}/large`, { maxBytes: 1024 }),
      /limit/,
    );
    await assert.rejects(getJson(`${origin}/bad`), /JSON/);
    const plan = await mealie({
      query: {
        baseUrl: origin,
        token: "test-token",
        rangeStart: "2026-09-07",
        rangeEndExclusive: "2026-09-10",
        sampleData: false,
      },
    });
    assert.equal(plan.events.length, 2);
    assert.equal(plan.events[0].title, "Pasta");
    assert.equal(plan.events[0].start.date, "2026-09-07");
    const stats = await umami({
      query: {
        hosting: "self-hosted",
        baseUrl: origin,
        token: "test-token",
        websiteId: "test",
        days: 7,
        sampleData: false,
      },
    });
    assert.equal(stats.stats.bounceRate, 25);
    assert.equal(stats.series[0].y, 8);
    assert(seen.every((r) => r.method === "GET"));
    assert(
      seen
        .filter((r) => r.url.startsWith("/api/"))
        .every((r) => r.auth === "Bearer test-token"),
    );
    assert(!JSON.stringify(plan).includes("test-token"));
  } finally {
    if (before === undefined)
      delete process.env.PAPERLESSPAPER_PRIVATE_API_ORIGINS;
    else process.env.PAPERLESSPAPER_PRIVATE_API_ORIGINS = before;
    server.close();
    await once(server, "close");
  }
});
