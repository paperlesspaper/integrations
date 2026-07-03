#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const applicationsRoot = join(root, "applications");

async function loadEnv(filePath) {
  let raw;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
    return;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, "$2");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

const resolutions = [
  { key: "800x480", orientation: "landscape", fileLabel: "800x480-landscape" },
  { key: "480x800", orientation: "portrait", fileLabel: "480x800-portrait" },
];

const apps = [
  {
    slug: "apple-photos-gallery",
    variants: [
      {
        id: "first-cover",
        values: {
          albumUrl: "",
          selection: "number",
          photoNumber: 1,
          fit: "cover",
          showMetadata: false,
          showCaptureDate: false,
        },
      },
      {
        id: "first-metadata",
        values: {
          albumUrl: "",
          selection: "number",
          photoNumber: 1,
          fit: "contain",
          showMetadata: true,
          showCaptureDate: true,
        },
      },
    ],
  },
  {
    slug: "astronauts",
    variants: [
      {
        id: "all-crew",
        values: { locationFilter: "", rosterLimit: 8, showPortraits: true },
      },
      {
        id: "iss-compact",
        values: { locationFilter: "ISS", rosterLimit: 6, showPortraits: false },
      },
    ],
  },
  {
    slug: "chore-wheel",
    variants: [
      {
        id: "weekly",
        values: {
          color: "light",
          title: "Chore Wheel",
          members: "Alex\nSam\nMira\nJonas",
          chores: "Dishes\nTrash\nVacuum\nBathroom\nPlants",
          rotation: "weekly",
          seed: "home",
          showNext: true,
        },
      },
      {
        id: "daily-dark",
        values: {
          color: "dark",
          title: "Kitchen Week",
          members: "Nora, Eli, Fatima, Ben",
          chores: "Cook dinner\nClear table\nLoad dishwasher\nWipe counters",
          rotation: "daily",
          seed: "kitchen",
          showNext: false,
        },
      },
    ],
  },
  {
    slug: "countdown-card",
    variants: [
      {
        id: "launch",
        values: {
          color: "light",
          title: "Launch Day",
          targetDate: "2030-01-01T00:00:00",
          mode: "auto",
          showTime: true,
          showProgress: true,
          startDate: "2026-01-01T00:00:00",
          dateLabel: "Target",
        },
      },
      {
        id: "since",
        values: {
          color: "dark",
          title: "Since Opening",
          targetDate: "2024-05-01T09:00:00",
          mode: "since",
          showTime: false,
          showProgress: false,
          startDate: "",
          dateLabel: "Opened",
        },
      },
    ],
  },
  {
    slug: "deutsche-bahn-abfahrten",
    variants: [
      {
        id: "berlin-hbf",
        values: {
          color: "light",
          stationName: "Berlin Hbf",
          stationId: "8011160",
          duration: 90,
          limit: 7,
          products: "nationalExpress,national,regionalExpress,regional,suburban,subway,tram,bus",
          locale: "de-DE",
          timeZone: "Europe/Berlin",
          showCancelled: true,
          showPlatformChanges: true,
        },
      },
      {
        id: "hamburg-regional",
        values: {
          color: "dark",
          stationName: "Hamburg Hbf",
          stationId: "8002549",
          duration: 45,
          limit: 6,
          products: "regionalExpress,regional,suburban",
          locale: "de-DE",
          timeZone: "Europe/Berlin",
          showCancelled: false,
          showPlatformChanges: true,
        },
      },
    ],
  },
  {
    slug: "dwd-pollenflug",
    variants: [
      {
        id: "berlin",
        values: {
          color: "light",
          regionId: 50,
          limit: 8,
          sortBy: "severity",
          showEmpty: false,
        },
      },
      {
        id: "rhein-main",
        values: {
          color: "dark",
          regionId: 91,
          limit: 6,
          sortBy: "severity",
          showEmpty: true,
        },
      },
    ],
  },
  {
    slug: "day-calendar",
    variants: [
      {
        id: "primary-dark",
        values: {
          color: "dark",
          kind: "primary",
          showTime: false,
          language: "en-US",
        },
      },
      {
        id: "demotivational-de",
        values: {
          color: "light",
          kind: "demotivational",
          showTime: true,
          language: "de",
        },
      },
      {
        id: "funny-red",
        values: {
          color: "red-light",
          kind: "funny",
          showTime: false,
          language: "en-US",
        },
      },
      {
        id: "day-progress",
        values: {
          color: "dark",
          kind: "day-progress",
          showTime: false,
          language: "en-US",
        },
      },
      {
        id: "holiday-observance-de",
        values: {
          color: "light",
          kind: "holiday-observance",
          showTime: false,
          language: "de",
          holidayRegion: "DE-BE",
        },
      },
      {
        id: "season-daylight",
        values: {
          color: "dark",
          kind: "season-daylight",
          showTime: true,
          language: "en-US",
          latitude: 52.52,
          longitude: 13.405,
        },
      },
      {
        id: "word-phrase-de",
        values: {
          color: "red-light",
          kind: "word-phrase",
          showTime: false,
          language: "de",
        },
      },
      {
        id: "curiosity",
        values: {
          color: "light",
          kind: "curiosity",
          showTime: false,
          language: "en-US",
        },
      },
    ],
  },
  {
    slug: "duden-wort-des-tages",
    variants: [
      {
        id: "word-of-the-day",
        values: { wordPath: "" },
      },
    ],
  },
  {
    slug: "formula-1-races",
    variants: [
      {
        id: "upcoming-full",
        values: {
          color: "light",
          selection: "upcoming",
          offset: 0,
          round: 1,
          locale: "en-US",
          timeZone: "Europe/Berlin",
          showTrackMap: true,
          showSessions: true,
        },
      },
      {
        id: "round-one-compact",
        values: {
          color: "dark",
          selection: "round",
          offset: 0,
          round: 1,
          locale: "de-DE",
          timeZone: "Europe/Berlin",
          showTrackMap: false,
          showSessions: true,
        },
      },
    ],
  },
  {
    slug: "tour-de-france",
    variants: [
      {
        id: "auto",
        values: {
          color: "light",
          selection: "auto",
          stage: 1,
          locale: "en-US",
          timeZone: "Europe/Berlin",
          showProfile: true,
          showRankings: true,
        },
      },
      {
        id: "alpe-dhuez",
        values: {
          color: "dark",
          selection: "stage",
          stage: 19,
          locale: "de-DE",
          timeZone: "Europe/Berlin",
          showProfile: true,
          showRankings: false,
        },
      },
    ],
  },
  {
    slug: "immich-photos",
    variants: [
      {
        id: "newest-cover",
        values: {
          serverUrl: "",
          apiKey: "",
          selection: "newest",
          albumId: "",
          onlyFavorites: false,
          visibility: "timeline",
          takenAfter: "",
          takenBefore: "",
          imageSize: "preview",
          fit: "cover",
          preferEdited: true,
          showMetadata: false,
          showDate: true,
          showLocation: true,
          showAlbumName: true,
          locale: "en-US",
        },
      },
      {
        id: "oldest-metadata",
        values: {
          serverUrl: "",
          apiKey: "",
          selection: "oldest",
          albumId: "",
          onlyFavorites: false,
          visibility: "timeline",
          takenAfter: "",
          takenBefore: "",
          imageSize: "thumbnail",
          fit: "contain",
          preferEdited: true,
          showMetadata: true,
          showDate: true,
          showLocation: true,
          showAlbumName: true,
          locale: "en-US",
        },
      },
    ],
  },
  {
    slug: "islamic-prayer-times",
    variants: [
      {
        id: "berlin-diyanet",
        values: {
          color: "light",
          title: "Prayer Times",
          locationName: "Berlin",
          latitude: 52.52,
          longitude: 13.405,
          elevation: 34,
          timeZone: "Europe/Berlin",
          date: "",
          calculationMethod: "diyanet",
          asrSchool: "standard",
          highLatitudeRule: "angle-based",
          timeFormat: "24h",
          layout: "auto",
          showSunrise: true,
          showHijriDate: true,
          showCountdown: true,
          showIqamah: false,
          iqamahMinutes: 10,
          showTomorrow: true,
          fajrOffset: 0,
          sunriseOffset: 0,
          dhuhrOffset: 0,
          asrOffset: 0,
          maghribOffset: 0,
          ishaOffset: 0,
        },
      },
      {
        id: "jakarta-iqamah",
        values: {
          color: "dark",
          title: "Waktu Shalat",
          locationName: "Jakarta",
          latitude: -6.2088,
          longitude: 106.8456,
          elevation: 8,
          timeZone: "Asia/Jakarta",
          date: "",
          calculationMethod: "mwl",
          asrSchool: "standard",
          highLatitudeRule: "none",
          timeFormat: "24h",
          layout: "vertical",
          showSunrise: true,
          showHijriDate: true,
          showCountdown: true,
          showIqamah: true,
          iqamahMinutes: 10,
          showTomorrow: false,
          fajrOffset: -2,
          sunriseOffset: 0,
          dhuhrOffset: 2,
          asrOffset: 1,
          maghribOffset: 3,
          ishaOffset: 2,
        },
      },
    ],
  },
  {
    slug: "newsstand",
    variants: [
      {
        id: "top3-cover",
        values: { newspaper: "top3", fit: "cover", showTitleBar: true },
      },
      {
        id: "guardian-contain",
        values: { newspaper: "guardian", fit: "contain", showTitleBar: false },
      },
    ],
  },
  {
    slug: "mastodon",
    variants: [
      {
        id: "opensource-list",
        values: {
          color: "light",
          instanceUrl: "https://mastodon.social",
          accessToken: "",
          feedType: "hashtag",
          hashtag: "opensource",
          profileAcct: "",
          limit: 3,
          displayMode: "list",
          postIndex: 0,
          showMedia: true,
          dateFormat: "relative",
          hideReplies: true,
          showQrCode: false,
          qrCodeSize: 88,
          maxLinkLength: 42,
        },
      },
      {
        id: "science-profile-single",
        values: {
          color: "blue-light",
          instanceUrl: "https://mastodon.social",
          accessToken: "",
          feedType: "profile",
          hashtag: "",
          profileAcct: "@ScienceNews@mstdn.social",
          limit: 8,
          displayMode: "single",
          postIndex: 0,
          showMedia: true,
          dateFormat: "absolute",
          hideReplies: true,
          showQrCode: true,
          qrCodeSize: 112,
          maxLinkLength: 36,
        },
      },
    ],
  },
  {
    slug: "moon-phase",
    variants: [
      {
        id: "today",
        values: {
          color: "light",
          title: "Moon Phase",
          date: "",
          hemisphere: "northern",
          showDetails: true,
          showNextPhase: true,
        },
      },
      {
        id: "southern-dark",
        values: {
          color: "dark",
          title: "Southern Moon",
          date: "2026-01-03",
          hemisphere: "southern",
          showDetails: true,
          showNextPhase: false,
        },
      },
    ],
  },
  {
    slug: "opening-hours",
    variants: [
      {
        id: "coffee-week",
        values: {
          color: "light",
          businessName: "Paperless Coffee",
          subtitle: "Cafe and workspace",
          placeId: "",
          googleMapsApiKey: "",
          languageCode: "en",
          regionCode: "",
          timezone: "Europe/Berlin",
          monday: "08:00-18:00",
          tuesday: "08:00-18:00",
          wednesday: "08:00-18:00",
          thursday: "08:00-18:00",
          friday: "08:00-18:00",
          saturday: "10:00-16:00",
          sunday: "closed",
          notes: "Special holiday hours may vary.",
          address: "Sample Street 12, Berlin",
          phone: "",
          website: "",
          showWeeklyHours: true,
          showContact: true,
          clockMode: "24h",
        },
      },
      {
        id: "studio-open-now",
        values: {
          color: "dark",
          businessName: "Night Studio",
          subtitle: "Always-on print lab",
          placeId: "",
          googleMapsApiKey: "",
          languageCode: "en",
          regionCode: "",
          timezone: "Europe/Berlin",
          monday: "24h",
          tuesday: "24h",
          wednesday: "24h",
          thursday: "24h",
          friday: "24h",
          saturday: "24h",
          sunday: "24h",
          notes: "Members can enter with their access card.",
          address: "Mitte, Berlin",
          phone: "+49 30 000000",
          website: "https://paperlesspaper.de",
          showWeeklyHours: false,
          showContact: true,
          clockMode: "24h",
        },
      },
    ],
  },
  {
    slug: "quote",
    variants: [
      {
        id: "daily",
        values: { index: null },
      },
      {
        id: "index-7",
        values: { index: 7 },
      },
    ],
  },
  {
    slug: "simple-calendar",
    variants: [
      {
        id: "us-regular",
        values: {
          color: "light",
          locale: "en-US",
          weekStart: "monday",
          weeklyHoliday: "sunday",
          holidayRegion: "US",
          alternateCalendar: "off",
          fontFamily: "system",
          density: "regular",
          weekdayLabels: "auto",
          hideTitleBar: false,
          shortMonthLabel: false,
        },
      },
      {
        id: "berlin-persian-compact",
        values: {
          color: "dark",
          locale: "de-DE",
          weekStart: "monday",
          weeklyHoliday: "sunday",
          holidayRegion: "DE-BE",
          alternateCalendar: "persian",
          fontFamily: "serif",
          density: "compact",
          weekdayLabels: "show",
          hideTitleBar: false,
          shortMonthLabel: true,
        },
      },
    ],
  },
  {
    slug: "simple-text",
    variants: [
      {
        id: "markdown",
        values: {
          color: "light",
          title: "",
          content: "# Hello World\n\nUse **markdown** or plain text on your paperlesspaper display.",
          format: "markdown",
          fontFamily: "system",
          fontSize: "large",
          fontStyle: "normal",
          fontWeight: "700",
          textAlign: "center",
          verticalAlign: "center",
          lineHeight: "1.15",
          showFrame: false,
        },
      },
      {
        id: "plain",
        values: {
          color: "dark",
          title: "Notice",
          content: "This is a plain text note.\nLine breaks are preserved.",
          format: "plain",
          fontFamily: "serif",
          fontSize: "x-large",
          fontStyle: "italic",
          fontWeight: "600",
          textAlign: "left",
          verticalAlign: "center",
          lineHeight: "1.25",
          showFrame: true,
        },
      },
    ],
  },
  {
    slug: "the-onion-editorial-cartoon",
    variants: [
      {
        id: "latest-with-meta",
        values: { selection: "latest", offset: 0, showTitle: true, showDate: true },
      },
      {
        id: "offset-art-only",
        values: { selection: "offset", offset: 3, showTitle: false, showDate: false },
      },
    ],
  },
  {
    slug: "uptime-kuma-monitor",
    variants: [
      {
        id: "overview",
        values: {
          color: "light",
          baseUrl: "",
          slug: "default",
          monitor: "",
          limit: 6,
          showIncidents: true,
          showMaintenance: true,
          showHeartbeats: true,
          showPing: true,
          timeoutMs: 5000,
        },
      },
      {
        id: "single-api",
        values: {
          color: "dark",
          baseUrl: "",
          slug: "default",
          monitor: "API",
          limit: 1,
          showIncidents: false,
          showMaintenance: true,
          showHeartbeats: true,
          showPing: true,
          timeoutMs: 5000,
        },
      },
    ],
  },
  {
    slug: "weather",
    variants: [
      {
        id: "berlin",
        values: { city: "Berlin", latitude: 52.52, longitude: 13.405 },
      },
      {
        id: "new-york",
        values: { city: "New York", latitude: 40.7128, longitude: -74.006 },
      },
    ],
  },
  {
    slug: "xkcd",
    variants: [
      {
        id: "latest",
        values: { kind: "latest", difference: 0 },
      },
      {
        id: "offset-42",
        values: { kind: "offset", difference: 42 },
      },
    ],
  },
];

function parseArgs(argv) {
  const options = {
    apps: undefined,
    configOnly: false,
    resolutions: undefined,
    variants: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === "--config-only") {
      options.configOnly = true;
      continue;
    }

    if (arg === "--app") {
      if (!next) {
        throw new Error("--app needs a comma-separated slug list");
      }
      options.apps = new Set(next.split(",").map((value) => value.trim()).filter(Boolean));
      index += 1;
      continue;
    }

    if (arg === "--variant") {
      if (!next) {
        throw new Error("--variant needs a comma-separated id list");
      }
      options.variants = new Set(next.split(",").map((value) => value.trim()).filter(Boolean));
      index += 1;
      continue;
    }

    if (arg === "--resolution") {
      if (!next) {
        throw new Error("--resolution needs a comma-separated resolution list");
      }
      options.resolutions = new Set(next.split(",").map((value) => value.trim()).filter(Boolean));
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

async function exists(filePath) {
  try {
    await access(filePath, constants.X_OK);
    return true;
  } catch {
    try {
      await access(filePath, constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }
}

async function findCli() {
  const candidates = [
    process.env.PAPERLESS_OPENINTEGRATION_CLI,
    join(root, "node_modules/.bin/paperlesspaper-openintegration"),
    resolve(root, "../../paperlesspaper-openintegration/dist/cli.js"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "Could not find paperlesspaper-openintegration CLI. Set PAPERLESS_OPENINTEGRATION_CLI to dist/cli.js.",
  );
}

function screenshotPath(slug, variantId, resolution) {
  return `./screenshots/${slug}-${variantId}-${resolution.fileLabel}.png`;
}

function configVariantsFor(app, selectedResolutions) {
  return app.variants.map((variant) => ({
    ...variant.values,
    screenshots: Object.fromEntries(
      selectedResolutions.map((resolution) => [
        resolution.key,
        screenshotPath(app.slug, variant.id, resolution),
      ]),
    ),
  }));
}

function withConfigVariants(config, configVariants) {
  const next = {};
  let inserted = false;

  for (const [key, value] of Object.entries(config)) {
    if (key === "configVariants") {
      continue;
    }

    next[key] = value;

    if (key === "nativeSettings") {
      next.configVariants = configVariants;
      inserted = true;
    }
  }

  if (!inserted) {
    next.configVariants = configVariants;
  }

  return next;
}

async function updateConfig(app, selectedResolutions) {
  const configPath = join(applicationsRoot, app.slug, "config.json");
  const config = JSON.parse(await readFile(configPath, "utf8"));
  const next = withConfigVariants(config, configVariantsFor(app, selectedResolutions));
  await writeFile(configPath, `${JSON.stringify(next, null, 2)}\n`);
}

function run(command, args) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", rejectRun);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolveRun();
        return;
      }
      rejectRun(new Error(`${command} ${args.join(" ")} exited with ${signal || code}`));
    });
  });
}

async function renderScreenshot(cli, app, variant, resolution) {
  const appRoot = join(applicationsRoot, app.slug);
  const output = join(appRoot, screenshotPath(app.slug, variant.id, resolution).replace(/^\.\//, ""));
  const cliCommand = cli.endsWith(".js") ? process.execPath : cli;
  const cliArgs = [
    ...(cli.endsWith(".js") ? [cli] : []),
    "render",
    join(appRoot, "config.json"),
    "--viewport",
    resolution.key,
    "--orientation",
    resolution.orientation,
    "--settings",
    JSON.stringify(variant.values),
    "--output",
    output,
    "--ready-timeout",
    "30000",
  ];

  await mkdir(dirname(output), { recursive: true });
  console.log(`\n${app.slug}/${variant.id} ${resolution.key}`);
  await run(cliCommand, cliArgs);
}

async function main() {
  await loadEnv(join(root, ".env"));

  const options = parseArgs(process.argv.slice(2));
  const selectedApps = apps.filter((app) => !options.apps || options.apps.has(app.slug));
  const selectedResolutions = resolutions.filter(
    (resolution) => !options.resolutions || options.resolutions.has(resolution.key),
  );

  if (selectedApps.length === 0) {
    throw new Error("No applications matched.");
  }

  if (selectedResolutions.length === 0) {
    throw new Error("No resolutions matched.");
  }

  for (const app of selectedApps) {
    await updateConfig(app, selectedResolutions);
  }

  if (options.configOnly) {
    return;
  }

  const cli = await findCli();

  for (const app of selectedApps) {
    for (const variant of app.variants) {
      if (options.variants && !options.variants.has(variant.id)) {
        continue;
      }

      for (const resolution of selectedResolutions) {
        await renderScreenshot(cli, app, variant, resolution);
      }
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
