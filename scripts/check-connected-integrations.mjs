#!/usr/bin/env node
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import {
  ditherImage,
  replaceColors,
  suggestCanvasProcessingOptions,
  spectra6OriginalPalette as palette,
} from "epdoptimize";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const all = [
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
const slugs = all.filter(
  (s) =>
    !process.env.PAPERLESSPAPER_TEST_SLUGS ||
    process.env.PAPERLESSPAPER_TEST_SLUGS.split(",").includes(s),
);
const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, stdio: "pipe" });
    let log = "";
    child.stdout.on("data", (s) => (log += s));
    child.stderr.on("data", (s) => (log += s));
    child.on("error", reject);
    child.on("close", (code) => (code ? reject(Error(log)) : resolve(log)));
  });
for (const slug of slugs) {
  await run([
    "node_modules/@paperlesspaper/openintegration/dist/cli.js",
    "check",
    `applications/${slug}/config.json`,
  ]);
  console.log(slug + ": manifest OK");
}
if (process.argv.includes("--check-only")) process.exit(0);
const output = join(root, "output/connected-integrations");
await mkdir(output, { recursive: true });
const port = Number(process.env.PAPERLESSPAPER_TEST_PORT || 3348);
const server = spawn(process.execPath, ["server/index.js"], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: "pipe",
});
let serverLog = "";
server.stderr.on("data", (s) => (serverLog += s));
let browser;
const reports = [];
const sizes = process.env.PAPERLESSPAPER_QUICK
  ? [
      [800, 480],
      [480, 800],
    ]
  : [
      [800, 480],
      [480, 800],
      [1600, 1200],
      [1200, 1600],
    ];
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/health`)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await puppeteer.launch({
    executablePath:
      process.env.CHROME_BIN ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  for (const slug of slugs) {
    const config = JSON.parse(
      await readFile(join(root, "applications", slug, "config.json"), "utf8"),
    );
    for (const variant of config.configVariants)
      for (const [width, height] of sizes) {
        const page = await browser.newPage();
        await page.setViewport({ width, height });
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        await page.evaluateOnNewDocument(
          ({ settings, manifest }) => {
            addEventListener("DOMContentLoaded", () => {
              let count = 0;
              const timer = setInterval(() => {
                postMessage(
                  {
                    type: "INIT",
                    data: {
                      meta: {
                        language: "de",
                        pluginSettings: settings,
                        pluginManifest: manifest,
                      },
                    },
                  },
                  location.origin,
                );
                if (++count === 3) {
                  clearInterval(timer);
                  window.__initSent = true;
                }
              }, 100);
            });
          },
          { settings: variant, manifest: config },
        );
        await page.goto(`http://127.0.0.1:${port}/${slug}/`, {
          waitUntil: "domcontentloaded",
        });
        await page.waitForFunction(
          () =>
            window.__initSent &&
            document.documentElement.dataset.paperlessRenderStatus === "ready",
          { timeout: 30000 },
        );
        await new Promise((r) => setTimeout(r, 150));
        const metrics = await page.evaluate((color) => {
          const nodes = [
            ...document.querySelectorAll(
              "#app,.pp-dash-metrics,.pp-dash-metric,.pp-dash-footer,.pp-dash-chart,.pp-dash-board,.pp-dash-column",
            ),
          ];
          const overflow = nodes
            .filter(
              (n) =>
                n.scrollWidth > n.clientWidth + 2 ||
                n.scrollHeight > n.clientHeight + 2,
            )
            .map((n) => ({
              node: n.className || n.id,
              x: n.scrollWidth - n.clientWidth,
              y: n.scrollHeight - n.clientHeight,
            }));
          const offscreen = [
            ...document.querySelectorAll(
              ".pp-dash-row:not([hidden]),.pp-dash-metric,.pp-dash-header,.pp-dash-footer",
            ),
          ]
            .filter((n) => {
              const r = n.getBoundingClientRect();
              return (
                r.left < 0 ||
                r.top < 0 ||
                r.right > innerWidth + 1 ||
                r.bottom > innerHeight + 1
              );
            })
            .map((n) => n.className);
          return {
            overflow,
            offscreen,
            theme: document.body.classList.contains(color),
            demo: document.body.innerText.includes("BEISPIELDATEN"),
            rows: document.querySelectorAll(".pp-dash-row:not([hidden])")
              .length,
          };
        }, variant.color);
        const epdOptions = await page.evaluate(
          () =>
            JSON.parse(
              document.querySelector('meta[name="paperless:epd-optimize"]')
                ?.content || "{}",
            ).canvasDitherOptions || {},
        );
        const raw = await page.screenshot({
          path: join(
            root,
            "applications",
            slug,
            variant.screenshots[`${width}x${height}`],
          ),
        });
        let epdPath;
        if (width <= 800 && !process.env.PAPERLESSPAPER_SKIP_EPD) {
          const canvas = createCanvas(width, height);
          canvas.getContext("2d").drawImage(await loadImage(raw), 0, 0);
          const dithered = createCanvas(width, height),
            device = createCanvas(width, height);
          const suggestion = suggestCanvasProcessingOptions(canvas, palette, {
            intent: "faithful",
          });
          await ditherImage(canvas, dithered, {
            ...suggestion.ditherOptions,
            ...epdOptions,
            palette,
          });
          replaceColors(dithered, device, palette);
          epdPath = join(
            root,
            "applications",
            slug,
            "screenshots",
            `${slug}-${variant.color}-${width}x${height}-epd.png`,
          );
          await writeFile(epdPath, device.toBuffer("image/png"));
        }
        if (width === 800 && variant === config.configVariants[0]) {
          await page.evaluate(
            ({ manifest, settings }) =>
              postMessage(
                {
                  type: "INIT",
                  data: {
                    meta: {
                      language: "en",
                      pluginManifest: manifest,
                      pluginSettings: {
                        ...settings,
                        title: "Updated display",
                        color: "red-dark",
                      },
                    },
                  },
                },
                location.origin,
              ),
            { manifest: config, settings: variant },
          );
          await page.waitForFunction(
            () =>
              document.documentElement.lang === "en" &&
              document.querySelector("h1")?.textContent === "Updated display" &&
              document.body.classList.contains("red-dark") &&
              document.documentElement.dataset.paperlessRenderStatus ===
                "ready",
          );
          metrics.hostUpdate = true;
          // A bad setup must not leave the prior successful dashboard on screen.
          await page.setRequestInterception(true);
          page.on("request", (req) =>
            req.url().includes("/api/data")
              ? req.respond({
                  status: 502,
                  contentType: "application/json",
                  body: '{"error":"SECRET must never reach the display"}',
                })
              : req.continue(),
          );
          await page.evaluate(() =>
            postMessage(
              {
                type: "INIT",
                data: {
                  meta: {
                    language: "en",
                    pluginSettings: { sampleData: false },
                  },
                },
              },
              location.origin,
            ),
          );
          await page.waitForFunction(
            () =>
              document.documentElement.dataset.paperlessRenderStatus ===
              "error",
          );
          const safe = await page.evaluate(
            () =>
              !document.body.innerText.includes("SECRET") &&
              !document.body.innerText.includes("DEMO DATA"),
          );
          if (!safe) errors.push("Error state exposes secret or stale content");
          metrics.errorState = safe;
        }
        const fail =
          metrics.overflow.length ||
          metrics.offscreen.length ||
          !metrics.theme ||
          !metrics.demo ||
          errors.length;
        reports.push({
          slug,
          color: variant.color,
          width,
          height,
          ...metrics,
          errors,
          epdPath,
          fail: !!fail,
        });
        console.log(
          `${slug} ${variant.color} ${width}x${height}: ${fail ? "FAIL " + JSON.stringify(metrics) : "OK"}`,
        );
        await page.close();
      }
  }
  if (slugs.includes("plant-care")) {
    const page = await browser.newPage();
    await page.setContent(
      `<iframe src="http://127.0.0.1:${port}/plant-care/settings.html"></iframe>`,
    );
    await page.evaluate(() => {
      window.__settingsPatches = [];
      addEventListener("message", (e) => {
        if (e.data.type === "UPDATE_SETTINGS")
          window.__settingsPatches.push(e.data.payload);
      });
    });
    const frame = await page.waitForFrame((f) =>
      f.url().includes("/plant-care/settings.html"),
    );
    await frame.waitForSelector("#add");
    await frame.evaluate(() =>
      postMessage(
        {
          type: "INIT",
          data: {
            meta: {
              language: "en",
              pluginSettings: { plants: "[]", color: "light" },
            },
          },
        },
        location.origin,
      ),
    );
    await frame.waitForFunction(
      () => document.querySelector("#title").textContent === "Plant care",
    );
    if ((await page.evaluate(() => window.__settingsPatches.length)) !== 0)
      throw Error("Settings wrote on initialization");
    await frame.click("#add");
    await frame.$eval('[data-key="name"]', (input) => {
      input.value = "Fern";
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForFunction(() => window.__settingsPatches.length === 1);
    let saved = await page.evaluate(() =>
      JSON.parse(window.__settingsPatches.at(-1).plants),
    );
    if (
      saved.length !== 1 ||
      saved[0].name !== "Fern" ||
      saved[0].feedEveryDays !== 0
    )
      throw Error("Plant editor did not save defaults");
    await frame.$eval('[data-key="lastWatered"]', (input) => {
      input.value = "2026-10-02";
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForFunction(() => window.__settingsPatches.length === 2);
    saved = await page.evaluate(() =>
      JSON.parse(window.__settingsPatches.at(-1).plants),
    );
    if (saved[0].lastWatered !== "2026-10-02")
      throw Error("Plant care date not saved");
    await frame.evaluate(
      (plants) =>
        postMessage(
          {
            type: "INIT",
            data: {
              meta: {
                language: "de",
                pluginSettings: { plants: JSON.stringify(plants) },
              },
            },
          },
          location.origin,
        ),
      saved,
    );
    await frame.waitForFunction(
      () => document.querySelector("#title").textContent === "Pflanzenpflege",
    );
    await frame.click("[data-remove]");
    await page.waitForFunction(() => window.__settingsPatches.length === 3);
    if (
      await page.evaluate(
        () => JSON.parse(window.__settingsPatches.at(-1).plants).length,
      )
    )
      throw Error("Plant removal failed");
    await writeFile(
      join(output, "settings-report.json"),
      JSON.stringify(
        {
          initialization: true,
          add: true,
          careDate: true,
          languageUpdate: true,
          remove: true,
        },
        null,
        2,
      ),
    );
    console.log("plant-care settings: OK");
    await page.close();
  }
  await writeFile(
    join(output, "layout-report.json"),
    JSON.stringify(reports, null, 2) + "\n",
  );
  const cards = slugs
    .map(
      (slug) =>
        `<section><h2>${slug}</h2><div>${reports
          .filter((r) => r.slug === slug && r.epdPath)
          .map(
            (r) =>
              `<figure><img loading="lazy" src="../../applications/${slug}/screenshots/${r.epdPath.split("/").at(-1)}"><figcaption>${r.color} · ${r.width}×${r.height} · Spectra 6</figcaption></figure>`,
          )
          .join("")}</div></section>`,
    )
    .join("");
  await writeFile(
    join(output, "index.html"),
    `<!doctype html><html><head><meta charset="utf-8"><title>Connected integrations — Spectra 6 review</title><style>body{font-family:system-ui;background:#e9e9ec;color:#111;margin:32px}section{margin-bottom:50px}section>div{display:flex;gap:18px;align-items:start;flex-wrap:wrap}figure{margin:0}img{width:400px;max-width:100%;border:1px solid #bbb}figcaption{font-size:13px;margin-top:6px}h1{font-size:30px}</style></head><body><h1>18 Integrationen · Spectra 6</h1><p>Helle und dunkle Farbschemata · Hoch- und Querformat · explizite Beispieldaten</p>${cards}</body></html>`,
  );
  if (reports.some((r) => r.fail)) process.exitCode = 1;
} finally {
  if (browser) {
    const timer = setTimeout(() => browser.process()?.kill("SIGKILL"), 5000);
    await browser.close().catch(() => {});
    clearTimeout(timer);
  }
  server.kill("SIGTERM");
  if (serverLog.includes("EADDRINUSE")) console.error(serverLog);
}
