import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { EventEmitter } from "node:events";
import {
  localDayNumber,
  nextUrl,
  finite,
} from "../applications/_shared/connected-api.js";
import {
  commerceRange,
  summarizeOrders,
  midnightUtc,
} from "../applications/_shared/commerce.js";
import { careSchedule } from "../applications/plant-care/api/data.js";
import { normalizeEvcc } from "../applications/evcc/api/data.js";
import {
  brokerUrl,
  readSnapshot,
  normalizeTesla,
} from "../applications/teslamate/api/data.js";
import { normalizeWoo } from "../applications/woocommerce/api/data.js";
import {
  normalizeShopify,
  shopDomain,
} from "../applications/shopify/api/data.js";
import { normalizeTides } from "../applications/tides/api/data.js";
import {
  auroraAt,
  normalizeAurora,
} from "../applications/aurora-forecast/api/data.js";
import { normalizeSnow } from "../applications/snow-report/api/data.js";
import { normalizeFacilities } from "../applications/station-accessibility/api/data.js";
import { normalizeTasks } from "../applications/microsoft-to-do/api/data.js";
import { normalizeBoard } from "../applications/trello/api/data.js";
import { normalizeNetwork } from "../applications/unifi/api/data.js";
export const slugs = [
  "bring-shopping",
  "plant-care",
  "evcc",
  "teslamate",
  "notion",
  "microsoft-to-do",
  "trello",
  "github-pull-requests",
  "github-activity",
  "unifi",
  "tides",
  "snow-report",
  "aurora-forecast",
  "ebird-sightings",
  "station-accessibility",
  "woocommerce",
  "shopify",
  "youtube-analytics",
];
const imports = new Map();
for (const slug of slugs) {
  const mod = await import(`../applications/${slug}/api/data.js`);
  imports.set(slug, mod);
  for (const language of ["de", "en"])
    test(`${slug}: explicit ${language} demo works without network`, async () => {
      const config = JSON.parse(
        await readFile(
          new URL(`../applications/${slug}/config.json`, import.meta.url),
        ),
      );
      const d = await mod.loadData(
        { ...config.nativeSettings, sampleData: true, language },
        () => {
          throw Error("Unexpected network in demo");
        },
      );
      assert.equal(d.sample, true);
      assert.ok(d.source);
      assert.ok(
        d.metrics?.length ||
          d.rows?.length ||
          d.columns?.length ||
          d.heatmap?.length,
      );
      assert.doesNotMatch(JSON.stringify(d), /NaN|undefined|Infinity/);
    });
}
test("date validation and calendar arithmetic are strict", () => {
  assert.throws(() => localDayNumber("2026-02-30"));
  assert.throws(() => localDayNumber("02/03/2026"));
  assert.equal(
    midnightUtc("2026-03-29", "Europe/Berlin"),
    "2026-03-28T23:00:00.000Z",
  );
  assert.equal(
    midnightUtc("2026-03-30", "Europe/Berlin"),
    "2026-03-29T22:00:00.000Z",
  );
  assert.equal(
    midnightUtc("2026-10-25", "Europe/Berlin"),
    "2026-10-24T22:00:00.000Z",
  );
  assert.equal(
    commerceRange({ days: 1 }, new Date("2026-10-02T23:30:00Z")).start,
    "2026-10-02T22:00:00.000Z",
  );
});
test("plants distinguish missing dates, due dates and unknown intervals", () => {
  const d = careSchedule(
    [
      { name: "Fern", lastWatered: "2026-03-23", waterEveryDays: 7 },
      { name: "Palm", waterEveryDays: 7 },
    ],
    { language: "en" },
    new Date("2026-03-30T08:00:00Z"),
  );
  assert.equal(d.metrics[1].value, 1);
  assert.equal(d.rows[0].badge, "Date missing");
  assert.equal(d.rows[1].badge, "Today");
  assert.throws(() => careSchedule([{ name: "Bad", waterEveryDays: -1 }], {}));
});
test("EVCC kWh are not incorrectly divided by 1000", () => {
  const d = normalizeEvcc(
    {
      loadpoints: [
        { chargedEnergy: 12.4, chargePower: 7200, connected: false },
      ],
    },
    {},
  );
  assert.equal(d.metrics[2].value, 12.4);
  assert.equal(d.metrics[1].value, 7.2);
  assert.equal(d.metrics[0].value, null);
});
test("MQTT only connects to an operator-allowed broker and never publishes", async () => {
  const before = process.env.PAPERLESSPAPER_MQTT_BROKERS;
  process.env.PAPERLESSPAPER_MQTT_BROKERS = "mqtt://localhost:1883";
  try {
    assert.throws(() => brokerUrl("mqtt://evil.example:1883"));
    assert.throws(() => brokerUrl("mqtt://user:password@localhost:1883"));
    let ended = false;
    const topics = [];
    const result = await readSnapshot(
      { brokerUrl: "mqtt://localhost:1883", carId: 2 },
      () => {
        const c = new EventEmitter();
        c.end = () => {
          ended = true;
        };
        c.subscribe = (ts, options, cb) => {
          topics.push(...ts);
          cb(
            null,
            ts.map((topic) => ({ topic, qos: 0 })),
          );
          c.emit(
            "message",
            "teslamate/cars/2/battery_level",
            Buffer.from("82"),
          );
          c.emit("message", "teslamate/cars/3/battery_level", Buffer.from("1"));
        };
        queueMicrotask(() => c.emit("connect"));
        return c;
      },
    );
    assert.equal(result.battery_level, "82");
    assert.ok(ended);
    assert.ok(topics.every((x) => x.startsWith("teslamate/cars/2/")));
  } finally {
    if (before === undefined) delete process.env.PAPERLESSPAPER_MQTT_BROKERS;
    else process.env.PAPERLESSPAPER_MQTT_BROKERS = before;
  }
});
test("missing Tesla values remain unknown", () => {
  const d = normalizeTesla({ state: "asleep" }, {});
  assert.equal(d.metrics[0].value, null);
  assert.equal(d.metrics[3].value, null);
});
test("WooCommerce refunds and Shopify net payments normalize consistently", () => {
  const woo = normalizeWoo([
    {
      id: 1,
      date_created_gmt: "2026-10-02T10:00:00",
      currency: "EUR",
      total: "120",
      refunds: [{ total: "-20" }],
      status: "processing",
    },
  ])[0];
  const shop = normalizeShopify([
    {
      name: "#1",
      createdAt: "2026-10-02T10:00:00Z",
      netPaymentSet: { shopMoney: { amount: "100", currencyCode: "EUR" } },
      displayFinancialStatus: "PARTIALLY_REFUNDED",
      displayFulfillmentStatus: "UNFULFILLED",
    },
  ])[0];
  assert.equal(woo.amount, 100);
  assert.equal(shop.amount, 100);
  assert.equal(woo.paid, shop.paid);
  assert.equal(woo.unfulfilled, shop.unfulfilled);
});
test("commerce excludes cancellations, tests and foreign currencies from money totals", () => {
  const range = {
    start: "2026-10-02T00:00:00.000Z",
    end: "2026-10-03T00:00:00.000Z",
  };
  const base = {
    createdAt: "2026-10-02T00:00:00Z",
    paid: true,
    currency: "EUR",
    amount: 100,
  };
  const d = summarizeOrders(
    [
      base,
      { ...base, currency: "USD" },
      { ...base, cancelled: true },
      { ...base, test: true },
      { ...base, paid: false },
      { ...base, createdAt: "2026-10-01T00:00:00Z" },
    ],
    { language: "en" },
    range,
  );
  assert.equal(d.metrics[0].value, 3);
  assert.equal(d.metrics[1].value, "€100.00");
  assert.equal(d.metrics[3].value, "€100.00");
});
test("Shopify token cannot be sent to arbitrary hosts", () => {
  assert.equal(shopDomain("https://demo.myshopify.com/"), "demo.myshopify.com");
  for (const s of [
    "example.org",
    "demo.myshopify.com.evil.org",
    "https://demo.myshopify.com@evil.org",
    "demo.myshopify.com/path",
  ])
    assert.throws(() => shopDomain(s));
});
test("Microsoft pagination cannot forward bearer credentials to another host", () => {
  assert.throws(() =>
    nextUrl(
      "https://evil.org/v1.0/me/todo/",
      "https://graph.microsoft.com",
      "/v1.0/me/todo/",
    ),
  );
});
test("Microsoft excludes completed tasks and sorts due work", () => {
  const d = normalizeTasks(
    [
      { title: "Done", status: "completed" },
      {
        title: "Later",
        status: "notStarted",
        dueDateTime: { dateTime: "2026-11-01T00:00:00" },
      },
      {
        title: "First",
        status: "notStarted",
        dueDateTime: { dateTime: "2026-10-01T00:00:00" },
      },
    ],
    {},
  );
  assert.equal(d.total, 2);
  assert.equal(d.rows[0].title, "First");
});
test("Trello uses the selected lists and excludes archived cards", () => {
  const d = normalizeBoard(
    [
      { id: "1", name: "One" },
      { id: "2", name: "Two" },
    ],
    [
      { idList: "1", name: "Hidden", closed: true },
      { idList: "2", name: "Visible" },
    ],
    { listIds: "2" },
  );
  assert.equal(d.columns.length, 1);
  assert.equal(d.columns[0].rows[0].title, "Visible");
});
test("NOAA UTC times are filtered against now and missing curve is supported", () => {
  const d = normalizeTides(
    {
      predictions: [
        { t: "2026-10-02 06:00", type: "H", v: "2.2" },
        { t: "2026-10-02 12:00", type: "L", v: "0.4" },
      ],
    },
    null,
    { language: "en" },
    Date.parse("2026-10-02T08:00:00Z"),
  );
  assert.equal(d.rows.length, 1);
  assert.equal(d.rows[0].title, "Low tide");
  assert.equal(d.chart, undefined);
});
test("aurora handles western longitudes, unknown clouds, and stale forecasts", () => {
  const oval = {
    coordinates: [
      [359, 65, 30],
      [180, 65, 100],
    ],
    "Forecast Time": "2026-10-02T10:00:00Z",
  };
  assert.equal(auroraAt(oval, 65, -1), 30);
  const d = normalizeAurora(
    oval,
    null,
    { latitude: 65, longitude: -1, language: "en" },
    Date.parse("2026-10-02T18:00:00Z"),
  );
  assert.equal(d.metrics[1].value, null);
  assert.equal(d.partial, true);
  assert.match(d.note, /stale/);
});
test("snow converts depth from metres but leaves missing values unknown", () => {
  const q = { language: "en" };
  const d = normalizeSnow(
    {
      hourly: { time: [1], snow_depth: [0.45] },
      daily: { time: [1], snowfall_sum: [null] },
    },
    q,
    null,
    1000,
  );
  assert.equal(d.metrics[0].value, 45);
  assert.equal(d.metrics[1].value, null);
  assert.equal(d.rows[0].badge, "—");
});
test("station facilities never interpret UNKNOWN as operational", () => {
  const d = normalizeFacilities(
    [
      { type: "ELEVATOR", state: "UNKNOWN", stationnumber: 1 },
      { type: "ESCALATOR", state: "ACTIVE", stationnumber: 1 },
    ],
    { language: "en" },
  );
  assert.equal(d.rows.length, 1);
  assert.equal(d.rows[0].badge, "Unknown");
});
test("UniFi unknown state is not reported as online", () => {
  const d = normalizeNetwork(
    [{ name: "Unknown" }, { name: "Router", state: "ONLINE" }],
    null,
    {},
  );
  assert.equal(d.metrics[1].value, 1);
  assert.equal(d.metrics[3].value, null);
});
test("Notion paginates using the documented data source route", async () => {
  const calls = [];
  const result = await imports
    .get("notion")
    .loadData(
      { token: "SECRET", dataSourceId: "abc" },
      async (url, options) => {
        calls.push({ url, options });
        return {
          results: [
            {
              properties: {
                Name: {
                  type: "title",
                  title: [
                    { plain_text: calls.length === 1 ? "First" : "Second" },
                  ],
                },
              },
            },
          ],
          has_more: calls.length === 1,
          next_cursor: "next",
        };
      },
    );
  assert.equal(result.total, 2);
  assert.equal(JSON.parse(calls[1].options.body).start_cursor, "next");
  assert.ok(
    calls.every(
      (c) =>
        !c.url.includes("SECRET") &&
        c.options.headers.Authorization === "Bearer SECRET",
    ),
  );
});
test("GitHub GraphQL errors fail instead of showing an empty healthy dashboard", async () => {
  await assert.rejects(
    imports
      .get("github-activity")
      .loadData({ username: "alex", token: "SECRET" }, async () => ({
        errors: [{ message: "denied" }],
      })),
  );
});
test("Shopify pagination and authentication are isolated from URL parameters", async () => {
  let count = 0;
  const d = await imports
    .get("shopify")
    .loadData(
      { shopDomain: "demo.myshopify.com", accessToken: "SECRET" },
      async (url, opts) => {
        assert.doesNotMatch(url, /SECRET/);
        assert.equal(opts.headers["X-Shopify-Access-Token"], "SECRET");
        count++;
        return {
          data: {
            orders: {
              nodes: [],
              pageInfo: { hasNextPage: count === 1, endCursor: "next" },
            },
          },
        };
      },
    );
  assert.equal(count, 2);
  assert.equal(d.sample, false);
});
test("Microsoft refresh token is exchanged server-side, followed by safe pagination", async () => {
  const calls = [];
  const d = await imports
    .get("microsoft-to-do")
    .loadData(
      { listId: "list", clientId: "app-test", refreshToken: "REFRESH" },
      async (url, opts) => {
        calls.push({ url, opts });
        if (url.includes("login.microsoftonline"))
          return {
            access_token: "ACCESS",
            expires_in: 3600,
            refresh_token: "ROTATED",
          };
        return calls.length === 2
          ? {
              value: [{ title: "One" }],
              "@odata.nextLink":
                "https://graph.microsoft.com/v1.0/me/todo/lists/list/tasks?$skip=1",
            }
          : { value: [{ title: "Two" }] };
      },
    );
  assert.equal(d.total, 2);
  assert.equal(calls.length, 3);
  assert.ok(calls[0].opts.body.includes("REFRESH"));
  assert.equal(calls[1].opts.headers.Authorization, "Bearer ACCESS");
});
test("Bring authenticates and reads without writing to a shopping list", async () => {
  const calls = [];
  const d = await imports
    .get("bring-shopping")
    .loadData(
      { email: "test@example.org", password: "SECRET" },
      async (url, opts) => {
        calls.push({ url, opts });
        if (url.endsWith("bringauth"))
          return { uuid: "u", access_token: "TOKEN" };
        if (url.endsWith("/lists"))
          return { lists: [{ listUuid: "l", name: "Groceries" }] };
        return { purchase: [{ name: "Bread", specification: "1 loaf" }] };
      },
    );
  assert.equal(d.rows[0].title, "Bread");
  assert.equal(calls.filter((c) => c.opts.method === "POST").length, 1);
  assert.ok(calls.every((c) => !c.url.includes("SECRET")));
});
test("YouTube reporting range follows Pacific dates and hides absent data", async () => {
  const calls = [];
  await imports.get("youtube-analytics").loadData(
    { accessToken: "A", days: 1 },
    async (url) => {
      calls.push(url);
      if (url.includes("youtubeanalytics"))
        return {
          columnHeaders: [{ name: "day" }, { name: "views" }],
          rows: [],
        };
      throw Error("Scope unavailable");
    },
    new Date("2026-10-03T01:00:00Z"),
  );
  assert.equal(new URL(calls[0]).searchParams.get("endDate"), "2026-10-01");
});
test("empty or missing numeric data stays unknown, zero stays zero", () => {
  assert.equal(finite(null), null);
  assert.equal(finite(""), null);
  assert.equal(finite(0), 0);
});

test("shared HTTP transport sends POST bodies and caches distinct bodies separately", async () => {
  const { createServer } = await import("node:http");
  const { getJson } = await import("../applications/_shared/dashboard-api.js");
  const server = createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    if (req.url === "/redirect") {
      res.writeHead(302, { Location: "/echo" });
      res.end();
      return;
    }
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        method: req.method,
        body,
        token: req.headers["x-shopify-access-token"],
      }),
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const before = process.env.PAPERLESSPAPER_PRIVATE_API_ORIGINS;
  process.env.PAPERLESSPAPER_PRIVATE_API_ORIGINS = origin;
  try {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": "SECRET",
      },
      body: '{"page":1}',
      ttl: 5000,
    };
    const one = await getJson(origin + "/echo", options),
      two = await getJson(origin + "/echo", { ...options, body: '{"page":2}' });
    assert.equal(one.method, "POST");
    assert.equal(one.token, "SECRET");
    assert.equal(JSON.parse(two.body).page, 2);
    await assert.rejects(
      getJson(origin + "/redirect", options),
      /redirect refused/,
    );
    await assert.rejects(
      getJson(origin + "/redirect", { headers: options.headers }),
      /redirect refused/,
    );
  } finally {
    if (before === undefined)
      delete process.env.PAPERLESSPAPER_PRIVATE_API_ORIGINS;
    else process.env.PAPERLESSPAPER_PRIVATE_API_ORIGINS = before;
    await new Promise((r) => server.close(r));
  }
});

test("UniFi preserves the API rate unit and unknown uplink values", () => {
  const d = normalizeNetwork(
    [],
    0,
    {},
    { uplink: { rxRateBps: 12345, txRateBps: null } },
  );
  assert.equal(d.rows[0].badge, "12345 / — Bps");
});

test("absent YouTube report metrics are unknown, not fabricated zeroes", () => {
  const d = imports
    .get("youtube-analytics")
    .normalizeAnalytics(
      { columnHeaders: [{ name: "day" }, { name: "views" }] },
      {},
    );
  assert.ok(d.metrics.every((m) => m.value === null));
  assert.equal(d.partial, true);
});
test("missing paid order amounts mark commerce totals unknown and partial", () => {
  const range = { start: "2026-10-02T00:00:00Z", end: "2026-10-03T00:00:00Z" };
  const d = summarizeOrders(
    [
      {
        createdAt: "2026-10-02T10:00:00Z",
        currency: "EUR",
        paid: true,
        amount: null,
      },
    ],
    {},
    range,
  );
  assert.equal(d.metrics[1].value, null);
  assert.equal(d.metrics[3].value, null);
  assert.equal(d.partial, true);
});
