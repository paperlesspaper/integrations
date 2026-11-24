import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = fileURLToPath(new URL("../", import.meta.url));
const dt = Date.parse("2026-11-24T09:00:00Z") / 1000;
const weather = {
  currentWeather: {
    name: "Dresden",
    dt,
    timezone: 3600,
    main: {
      temp: 8,
      feels_like: 6,
      humidity: 70,
      pressure: 1015,
      temp_min: 5,
      temp_max: 10,
    },
    weather: [
      { id: 800, main: "Clear", description: "klarer Himmel", icon: "01d" },
    ],
    wind: { speed: 3 },
    sys: { sunrise: dt - 7200, sunset: dt + 21600 },
  },
  forecast: {
    city: { name: "Dresden", timezone: 3600 },
    list: Array.from({ length: 40 }, (_, index) => ({
      dt: dt + index * 10800,
      dt_txt: new Date((dt + index * 10800) * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " "),
      main: {
        temp: 8 + (index % 3),
        temp_min: 5,
        temp_max: 10,
        humidity: 70,
        pressure: 1015,
      },
      weather: [{ id: 800, description: "klarer Himmel", icon: "01d" }],
      wind: { speed: 3 },
      pop: 0,
    })),
  },
};
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".css": "text/css",
  ".woff2": "font/woff2",
};
const listen = (server) =>
  new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () =>
      resolve(`http://127.0.0.1:${server.address().port}`)
    )
  );

test(
  "weather preserves saved views and finishes calendar layouts without a renderer bridge",
  {
    skip: !process.env.WEATHER_BROWSER_TESTS,
    timeout: 120000,
  },
  async () => {
    let failWeather = false;
    const requests = [];
    const serve = async (req, res) => {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname === "/weather/api/data") {
        requests.push(Object.fromEntries(url.searchParams));
        res.setHeader("Content-Type", "application/json");
        res.statusCode = failWeather ? 502 : 200;
        res.end(
          JSON.stringify(
            failWeather
              ? { error: "Weather fixture unavailable" }
              : {
                  ...weather,
                  currentWeather:
                    url.searchParams.get("kind") === "forecast"
                      ? null
                      : weather.currentWeather,
                  forecast:
                    url.searchParams.get("kind") === "current"
                      ? null
                      : weather.forecast,
                }
          )
        );
        return;
      }
      const base = path.join(
        root,
        url.pathname.startsWith("/assets/") ? "public" : "applications"
      );
      const relative = url.pathname.startsWith("/assets/")
        ? url.pathname.slice(7)
        : url.pathname;
      const file = path.resolve(base, `.${relative}`);
      if (!file.startsWith(base + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      try {
        res.setHeader(
          "Content-Type",
          mime[path.extname(file)] || "application/octet-stream"
        );
        res.end(await readFile(file));
      } catch {
        res.writeHead(404).end();
      }
    };
    const parent = createServer(serve),
      child = createServer(serve);
    const parentOrigin = await listen(parent),
      childOrigin = await listen(child);
    let browser;
    try {
      browser = await puppeteer.launch({
        executablePath:
          process.env.CHROME_BIN ||
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        headless: true,
      });
      const page = await browser.newPage();
      await page.setRequestInterception(true);
      page.on("request", (request) => {
        const origin = new URL(request.url()).origin;
        if (
          [parentOrigin, childOrigin].includes(origin) ||
          request.url().startsWith("data:")
        )
          request.continue();
        else request.abort();
      });
      for (const kind of [
        "simple",
        "default",
        "today-forecast",
        "forecast",
        "forecast-summary",
      ]) {
        await page.goto(
          `${childOrigin}/weather/render.html?kind=${kind}&location=Dresden&iconstyle=light&language=nl&displayLastUpdated=true`
        );
        if (kind !== "default")
          await page.evaluate(() =>
            window.postMessage(
              {
                type: "INIT",
                data: { kind: "weather", meta: { language: "nl" } },
              },
              location.origin
            )
          );
        await page.waitForFunction(
          () =>
            document.documentElement.lang === "nl" &&
            document.documentElement.dataset.paperlessRenderStatus === "ready"
        );
        assert.equal(
          await page.evaluate(
            () => document.documentElement.dataset.paperlessRenderStatus
          ),
          "ready"
        );
        const markup = await page.$eval(
          "#weather-root",
          (root) => root.innerHTML
        );
        if (["simple", "default", "today-forecast"].includes(kind)) {
          assert.ok(
            !markup.includes("summary-view"),
            `${kind} must retain the current-weather view`
          );
          assert.ok(markup.includes("current-stack"));
        }
        if (kind === "forecast") assert.ok(markup.includes("forecast-view"));
        if (kind === "forecast-summary")
          assert.ok(markup.includes("summary-view"));
        assert.equal(
          await page.evaluate(() => document.documentElement.lang),
          "nl"
        );
        assert.equal(requests.at(-1).location, "Dresden");
        assert.equal(requests.at(-1).language, "nl");
        assert.equal(
          requests.at(-1).kind,
          ["simple", "default", "today-forecast"].includes(kind)
            ? "current"
            : "all"
        );
        assert.ok(await page.$(".updated-at"));
      }
      await page.goto(
        `${childOrigin}/weather/render.html?kind=forecast&location=Dresden&displayLastUpdated=false`
      );
      await page.waitForFunction(
        () => document.documentElement.dataset.paperlessRenderStatus === "ready"
      );
      assert.equal(requests.at(-1).kind, "forecast");
      assert.ok(await page.$(".forecast-view"));
      assert.equal(await page.$(".updated-at"), null);
      const iconSelectors = {
        normal: "svg.weather-icon:not(.icon-monochrome)",
        light: "svg.icon-monochrome",
        qweather: 'img[src*="100-fill.svg"]',
        "qweather-line": 'img[src*="100.svg"]',
        "glyphs-poly": 'img[src*="glyphs-poly/sun.svg"]',
        "noto-emoji": 'img[src*="noto/sun.svg"]',
        openmoji: 'img[src*="openmoji/sun.svg"]',
        openweather: 'img[src*="01d@4x.png"]',
      };
      const languages = ["en", "de", "nl", "fr", "es", "it"];
      const colors = ["light", "dark", "red-light", "red-dark"];
      for (const [index, [icon, selector]] of Object.entries(
        iconSelectors
      ).entries()) {
        const language = languages[index % languages.length];
        const color = colors[index % colors.length];
        await page.goto(
          `${childOrigin}/weather/render.html?kind=forecast&iconstyle=${icon}&language=${language}&color=${color}`
        );
        await page.waitForFunction(
          () =>
            document.documentElement.dataset.paperlessRenderStatus === "ready"
        );
        assert.ok(await page.$(selector), `legacy iconstyle=${icon}`);
        assert.equal(
          await page.evaluate(() => document.documentElement.lang),
          language
        );
        assert.equal(requests.at(-1).language, language);
        assert.equal(requests.at(-1).location, "Berlin");
        const background = await page.evaluate(() =>
          getComputedStyle(document.documentElement)
            .getPropertyValue("--pp-bg")
            .trim()
        );
        assert.ok(background, `${color} must resolve to a shared theme`);
      }
      await page.goto(`${childOrigin}/weather/render.html`);
      await page.evaluate(() =>
        window.postMessage(
          {
            type: "INIT",
            data: {
              meta: {
                language: "fr",
                pluginSettings: {
                  kind: "today-forecast",
                  location: "Dresden",
                  displayLastUpdated: true,
                },
              },
            },
          },
          location.origin
        )
      );
      await page.waitForFunction(
        () =>
          document.documentElement.dataset.paperlessRenderStatus === "ready" &&
          document.documentElement.lang === "fr"
      );
      assert.equal(requests.at(-1).location, "Dresden");
      assert.equal(requests.at(-1).kind, "current");
      assert.ok(await page.$(".current-view"));
      assert.ok(await page.$(".updated-at"));
      for (const [width, height, color] of [
        [800, 480, "blue-light"],
        [480, 800, "dark"],
      ]) {
        await page.setViewport({ width, height });
        await page.goto(`${parentOrigin}/layout/render.html`);
        const renderId = `weather-${width}`;
        const layout = {
          renderId,
          layout: width > height ? "columns" : "rows",
          ratio: 1,
          gap: 8,
          color,
          regions: [
            {
              id: "calendar",
              type: "integration",
              url: `${childOrigin}/google-calendar/render.html`,
              payload: {
                meta: {
                  language: "de",
                  pluginSettings: {
                    now: "2026-11-24T09:00:00Z",
                    dayRange: 3,
                    color,
                  },
                },
                calendarData: {
                  events: [
                    {
                      summary: "Mehrtaegiger Termin",
                      start: { date: "2026-11-23" },
                      end: { date: "2026-11-27" },
                    },
                  ],
                },
              },
            },
            {
              id: "weather",
              type: "integration",
              url: `${childOrigin}/weather/render.html?kind=simple&location=Dresden&iconstyle=light&color=${color}`,
              payload: { kind: "weather", meta: { language: "de" } },
            },
          ],
        };
        await page.evaluate(
          (layout) =>
            window.postMessage(
              { type: "INIT", data: { layout } },
              location.origin
            ),
          layout
        );
        await page.waitForFunction(
          () =>
            document.documentElement.dataset.paperlessRenderStatus === "ready",
          { timeout: 11000 }
        );
        const regions = await page.$eval(
          'meta[name="paperless:regions"]',
          (meta) => JSON.parse(meta.content)
        );
        assert.equal(regions.length, 2);
        const calendar = page
          .frames()
          .find((frame) => frame.url().includes("/google-calendar/"));
        assert.equal(
          await calendar.evaluate(
            () =>
              document.body.innerText.split("Mehrtaegiger Termin").length - 1
          ),
          3
        );
        const weatherFrame = page
          .frames()
          .find((frame) => frame.url().includes("/weather/"));
        assert.equal(
          await weatherFrame.evaluate(
            () => document.documentElement.dataset.paperlessRenderStatus
          ),
          "ready"
        );
        if (process.env.WEATHER_REVIEW_DIR) {
          await mkdir(process.env.WEATHER_REVIEW_DIR, { recursive: true });
          const png = await page.screenshot();
          const name = path.join(
            process.env.WEATHER_REVIEW_DIR,
            `weather-calendar-${width}x${height}`
          );
          await writeFile(`${name}.png`, png);
        }
        failWeather = true;
        await page.evaluate(
          (layout) =>
            window.postMessage(
              { type: "INIT", data: { layout } },
              location.origin
            ),
          { ...layout, renderId: `${renderId}-failed` }
        );
        await page.waitForFunction(
          () =>
            document.documentElement.dataset.paperlessRenderStatus === "error",
          { timeout: 11000 }
        );
        failWeather = false;
      }
    } finally {
      await browser?.close();
      for (const server of [parent, child]) {
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
      }
    }
  }
);
