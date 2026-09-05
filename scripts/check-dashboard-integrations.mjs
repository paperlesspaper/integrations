#!/usr/bin/env node
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import puppeteer from "puppeteer-core";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const slugs = [
  "fuel-prices",
  "seasonal-produce",
  "school-timetable",
  "mealie",
  "rss-news",
  "rocket-launches",
  "umami-stats",
  "austria-weather-warnings",
  "home-assistant-sensors",
  "home-energy",
  "ebike-status",
];
const sizes = [
  [800, 480],
  [480, 800],
  [1600, 1200],
  [1200, 1600],
];
const cli = join(
  root,
  "node_modules/@paperlesspaper/openintegration/dist/cli.js",
);
const run = (args) =>
  new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, stdio: "pipe" });
    let out = "";
    child.stdout.on("data", (s) => (out += s));
    child.stderr.on("data", (s) => (out += s));
    child.on("error", reject);
    child.on("close", (code) => (code ? reject(new Error(out)) : resolve(out)));
  });
for (const slug of slugs) {
  const out = await run([cli, "check", `applications/${slug}/config.json`]);
  console.log(
    `${slug}: manifest OK${out.includes("WARN") ? " (global-color warning)" : ""}`,
  );
}
await run(["--test", "tests/dashboard-integrations.test.mjs"]);
console.log("Adapter regression tests OK");
if (!process.argv.includes("--render")) process.exit(0);
const port = Number(process.env.PAPERLESSPAPER_TEST_PORT || 3318);
const server = spawn(process.execPath, ["server/index.js"], {
  cwd: root,
  env: { ...process.env, PORT: String(port) },
  stdio: "pipe",
});
let browser;
const results = [];
try {
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/health`);
      if (r.ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await puppeteer.launch({
    executablePath:
      process.env.CHROME_BIN ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  for (const slug of slugs.filter(
    (slug) =>
      !process.env.PAPERLESSPAPER_TEST_SLUGS ||
      process.env.PAPERLESSPAPER_TEST_SLUGS.split(",").includes(slug),
  )) {
    const config = JSON.parse(
      await readFile(join(root, "applications", slug, "config.json"), "utf8"),
    );
    for (const [variantIndex, variant] of config.configVariants.entries())
      for (const [width, height] of sizes) {
        const page = await browser.newPage();
        await page.setViewport({ width, height });
        const errors = [];
        page.on("pageerror", (e) => errors.push(e.message));
        // Supply INIT through the host protocol, so previews exercise the same contract as production.
        await page.evaluateOnNewDocument(
          ({ settings, manifest }) => {
            addEventListener("DOMContentLoaded", () => {
              let n = 0;
              const timer = setInterval(() => {
                postMessage(
                  {
                    type: "INIT",
                    data: {
                      meta: {
                        language: "de",
                        pluginManifest: manifest,
                        pluginSettings: settings,
                      },
                    },
                  },
                  location.origin,
                );
                if (++n >= 3) {
                  clearInterval(timer);
                  window.__dashboardTestInitSent = true;
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
          () => window.__dashboardTestInitSent && !!document.querySelector("#website-has-loaded"),
          { timeout: 30000 },
        );
        await new Promise((r) => setTimeout(r, 200));
        // A repeated INIT may have started another render after the first ready marker.
        await page.waitForFunction(
          () => document.documentElement.dataset.paperlessRenderStatus === "ready",
          { timeout: 30000 },
        );
        const metrics = await page.evaluate((expected) => {
          const nodes = [
            ...document.querySelectorAll("#app,#content,.metric,.produce,.row"),
          ];
          const overflow = nodes
            .filter(
              (e) =>
                e.scrollWidth > e.clientWidth + 2 ||
                e.scrollHeight > e.clientHeight + 2,
            )
            .map((e) => ({
              tag: e.id || e.className,
              width: e.scrollWidth - e.clientWidth,
              height: e.scrollHeight - e.clientHeight,
            }));
          const groups = [...document.querySelectorAll(".metrics,.pills")];
          const overlaps = groups.flatMap((g) => {
            const children = [...g.children];
            return children.flatMap((a, i) =>
              children
                .slice(i + 1)
                .filter((b) => {
                  const x = a.getBoundingClientRect(),
                    y = b.getBoundingClientRect();
                  return (
                    Math.min(x.right, y.right) - Math.max(x.left, y.left) > 1 &&
                    Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 1
                  );
                })
                .map((b) => a.className + " / " + b.className),
            );
          });
          return {
            overflow,
            overlaps,
            text: document.body.innerText.slice(0, 120),
            ready:
              document.documentElement.dataset.paperlessRenderStatus ===
              "ready",
            correctTheme: document.body.classList.contains(expected.color),
            correctDemo:
              !expected.sampleData ||
              document.body.innerText.includes("BEISPIELDATEN"),
          };
        }, variant);
        if (!metrics.ready || !metrics.correctTheme || !metrics.correctDemo)
          errors.push("Host INIT settings or render status mismatch");
        const output = join(
          root,
          "applications",
          slug,
          variant.screenshots[`${width}x${height}`],
        );
        await mkdir(dirname(output), { recursive: true });
        await page.screenshot({ path: output });
        if (variantIndex === 0 && width === 800) {
          await page.evaluate(
            ({ manifest, settings }) => {
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
                        color: "blue-light",
                      },
                    },
                  },
                },
                location.origin,
              );
            },
            { manifest: config, settings: variant },
          );
          await page.waitForFunction(
            () =>
              document.documentElement.lang === "en" &&
              document.querySelector("h1")?.textContent === "Updated display" &&
              document.body.classList.contains("blue-light") &&
              document.documentElement.dataset.paperlessRenderStatus ===
                "ready",
          );
          metrics.hostUpdate = true;
        }
        results.push({
          slug,
          variant: variantIndex,
          width,
          height,
          ...metrics,
          errors,
        });
        console.log(
          `${slug} ${variantIndex} ${width}x${height}: ${metrics.overflow.length || metrics.overlaps.length || errors.length ? "FAIL" : "OK"}`,
        );
        await page.close();
      }
  }
  await mkdir(join(root, "output/dashboard-integrations"), { recursive: true });
  await writeFile(
    join(root, "output/dashboard-integrations/layout-report.json"),
    JSON.stringify(results, null, 2) + "\n",
  );
  if (
    results.some(
      (r) => r.overflow.length || r.overlaps.length || r.errors.length,
    )
  )
    process.exitCode = 1;
} finally {
  // Chrome can exit before its CDP close response reaches Puppeteer.
  // Bound cleanup so a completed acceptance run cannot hang indefinitely.
  let cleanupTimer;
  try {
    await Promise.race([
      browser?.close(),
      new Promise((resolve) => {
        cleanupTimer = setTimeout(() => {
          browser?.process()?.kill("SIGKILL");
          browser?.disconnect();
          resolve();
        }, 10000);
      }),
    ]);
  } finally {
    clearTimeout(cleanupTimer);
    server.kill("SIGTERM");
  }
}
