const baseUrl = "https://www.letour.fr";
const routeUrl = `${baseUrl}/en/overall-route`;
const rankingsUrl = `${baseUrl}/en/rankings`;

const fallbackRoute = [
  { stage: 1, date: "2026-07-04", dayLabel: "Sat 07/04", type: "Team Time-Trial", route: "Barcelone > Barcelone", distance: "19.6 km", url: "/en/stage-1" },
  { stage: 2, date: "2026-07-05", dayLabel: "Sun 07/05", type: "Hilly", route: "Tarragone > Barcelone", distance: "168.5 km", url: "/en/stage-2" },
  { stage: 3, date: "2026-07-06", dayLabel: "Mon 07/06", type: "Mountain", route: "Granollers > Les Angles", distance: "195.9 km", url: "/en/stage-3" },
  { stage: 4, date: "2026-07-07", dayLabel: "Tue 07/07", type: "Hilly", route: "Carcassonne > Foix", distance: "181.9 km", url: "/en/stage-4" },
  { stage: 5, date: "2026-07-08", dayLabel: "Wed 07/08", type: "Flat", route: "Lannemezan > Pau", distance: "158.3 km", url: "/en/stage-5" },
  { stage: 6, date: "2026-07-09", dayLabel: "Thu 07/09", type: "Mountain", route: "Pau > Gavarnie-Gedre", distance: "186.2 km", url: "/en/stage-6" },
  { stage: 7, date: "2026-07-10", dayLabel: "Fri 07/10", type: "Flat", route: "Hagetmau > Bordeaux", distance: "175.1 km", url: "/en/stage-7" },
  { stage: 8, date: "2026-07-11", dayLabel: "Sat 07/11", type: "Flat", route: "Perigueux > Bergerac", distance: "180.4 km", url: "/en/stage-8" },
  { stage: 9, date: "2026-07-12", dayLabel: "Sun 07/12", type: "Hilly", route: "Malemort > Ussel", distance: "185.5 km", url: "/en/stage-9" },
  { stage: null, rest: 1, date: "2026-07-13", dayLabel: "Mon 07/13", type: "Rest Day", route: "Cantal", distance: "", url: "/en/rest-1" },
  { stage: 10, date: "2026-07-14", dayLabel: "Tue 07/14", type: "Mountain", route: "Aurillac > Le Lioran", distance: "166.6 km", url: "/en/stage-10" },
  { stage: 11, date: "2026-07-15", dayLabel: "Wed 07/15", type: "Flat", route: "Vichy > Nevers", distance: "161.3 km", url: "/en/stage-11" },
  { stage: 12, date: "2026-07-16", dayLabel: "Thu 07/16", type: "Flat", route: "Circuit Nevers Magny-Cours > Chalon-sur-Saone", distance: "179.1 km", url: "/en/stage-12" },
  { stage: 13, date: "2026-07-17", dayLabel: "Fri 07/17", type: "Hilly", route: "Dole > Belfort", distance: "205.8 km", url: "/en/stage-13" },
  { stage: 14, date: "2026-07-18", dayLabel: "Sat 07/18", type: "Mountain", route: "Mulhouse > Le Markstein Fellering", distance: "155.3 km", url: "/en/stage-14" },
  { stage: 15, date: "2026-07-19", dayLabel: "Sun 07/19", type: "Mountain", route: "Champagnole > Plateau de Solaison", distance: "183.9 km", url: "/en/stage-15" },
  { stage: null, rest: 2, date: "2026-07-20", dayLabel: "Mon 07/20", type: "Rest Day", route: "Haute-Savoie", distance: "", url: "/en/rest-2" },
  { stage: 16, date: "2026-07-21", dayLabel: "Tue 07/21", type: "Individual time-trial", route: "Evian-les-Bains > Thonon-les-Bains", distance: "26.1 km", url: "/en/stage-16" },
  { stage: 17, date: "2026-07-22", dayLabel: "Wed 07/22", type: "Flat", route: "Chambery > Voiron", distance: "174.7 km", url: "/en/stage-17" },
  { stage: 18, date: "2026-07-23", dayLabel: "Thu 07/23", type: "Mountain", route: "Voiron > Orcieres-Merlette", distance: "185.2 km", url: "/en/stage-18" },
  { stage: 19, date: "2026-07-24", dayLabel: "Fri 07/24", type: "Mountain", route: "Gap > Alpe d'Huez", distance: "127.9 km", url: "/en/stage-19" },
  { stage: 20, date: "2026-07-25", dayLabel: "Sat 07/25", type: "Mountain", route: "Le Bourg d'Oisans > Alpe d'Huez", distance: "170.9 km", url: "/en/stage-20" },
  { stage: 21, date: "2026-07-26", dayLabel: "Sun 07/26", type: "Flat", route: "Thoiry > Paris Champs-Elysees", distance: "133 km", url: "/en/stage-21" },
];

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "paperlesspaper-openintegrations/0.1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Tour de France request failed with ${response.status}`);
  }

  return response.text();
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stripTags(value = "") {
  return decodeHtml(String(value).replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(value = "") {
  if (!value) return "";
  try {
    return new URL(decodeHtml(value).split("|")[0], baseUrl).toString();
  } catch {
    return "";
  }
}

function officialImageUrl(value = "") {
  const url = absoluteUrl(value);
  return url.startsWith("https://img.aso.fr/")
    || url.includes("/img/")
    || /\.(png|jpe?g)(\?|$)/i.test(url)
    ? url
    : "";
}

function toInteger(value, fallback, { min, max } = {}) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  const rounded = Math.floor(number);
  if (Number.isFinite(min) && rounded < min) return min;
  if (Number.isFinite(max) && rounded > max) return max;
  return rounded;
}

function toBoolean(value, fallback = false) {
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return fallback;
}

function normalizeSelection(value) {
  return ["auto", "stage", "next"].includes(value) ? value : "auto";
}

function normalizeTimeZone(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "Europe/Berlin";
}

function localDayNumber(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const part = (type) => Number(parts.find((item) => item.type === type)?.value);
    return Math.floor(Date.UTC(part("year"), part("month") - 1, part("day")) / 86400000);
  } catch {
    return null;
  }
}

function formatDate(date, locale, timeZone) {
  try {
    return new Intl.DateTimeFormat(locale || "en-US", {
      timeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date(`${date}T12:00:00Z`));
  } catch {
    return date;
  }
}

function daysUntil(date, nowMs, timeZone) {
  const stageDay = localDayNumber(`${date}T12:00:00Z`, timeZone);
  const today = localDayNumber(nowMs, timeZone);
  if (stageDay === null || today === null) return null;
  return stageDay - today;
}

function statusFor(entry, nowMs, timeZone) {
  const days = daysUntil(entry.date, nowMs, timeZone);

  if (entry.rest) {
    if (days === 0) return "Rest day";
    if (days < 0) return "Rest complete";
    return `Rest in ${days}d`;
  }

  if (days === null) return "";
  if (days < 0) return "Stage complete";
  if (days === 0) return "Stage day";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

function selectRouteEntry(route, settings, nowMs) {
  const stageRows = route.filter((entry) => Number.isFinite(entry.stage));

  if (settings.selection === "stage") {
    return stageRows.find((entry) => entry.stage === settings.stage) || stageRows[0];
  }

  const today = localDayNumber(nowMs, settings.timeZone);
  if (settings.selection === "next") {
    return stageRows.find((entry) => localDayNumber(`${entry.date}T12:00:00Z`, settings.timeZone) >= today) || stageRows[stageRows.length - 1];
  }

  return route.find((entry) => localDayNumber(`${entry.date}T12:00:00Z`, settings.timeZone) >= today) || route[route.length - 1];
}

function parseRoute(html) {
  const rows = [...html.matchAll(/<tr class="[^"]*">\s*<td>(.*?)<\/td>([\s\S]*?)<\/tr>/g)];
  const parsed = rows.map((row) => {
    const cells = [...row[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => stripTags(cell[1]));
    const href = row[0].match(/href="([^"]+)"/)?.[1] || "";
    const label = stripTags(row[0].match(/<a[^>]*>([\s\S]*?)<\/a>/)?.[1] || "");
    const stageMatch = label.match(/Stage\s+(\d+)/i);
    const restMatch = label.match(/Rest\s+(\d+)/i);
    const stage = stageMatch ? Number(stageMatch[1]) : null;
    const rest = restMatch ? Number(restMatch[1]) : null;
    const dateMatch = cells[2]?.match(/(\d{2})\/(\d{2})\/(\d{4})/);

    if (!dateMatch || (!stage && !rest)) return null;

    return {
      stage,
      rest,
      date: `${dateMatch[3]}-${dateMatch[1]}-${dateMatch[2]}`,
      dayLabel: cells[2].replace(`/${dateMatch[3]}`, ""),
      type: cells[1] || (rest ? "Rest Day" : ""),
      route: cells[3] || "",
      distance: cells[4] || "",
      url: href,
    };
  }).filter(Boolean);

  return parsed.length >= 21 ? parsed : [];
}

function parseStageDetails(html) {
  const background = html.match(/stageHeader__background" style='background:\s*url\("([^"]+)"/)?.[1] || "";
  const profile = html.match(/id="profil"[\s\S]*?<img[^>]+data-src="([^"]+)"/)?.[1] || "";
  const map = html.match(/Download the map[\s\S]*?<a[^>]+href="([^"]+)"/)?.[1]
    || html.match(/href="([^"]+)"[^>]*>\s*Download the map/)?.[1]
    || "";
  const elevationBlock = html.match(/stageHeader__length__label">D\+<\/span><\/br>\s*([^<]+)/);
  const climbs = [...html.matchAll(/<div class="mountain__item">([\s\S]*?)<\/div>\s*<\/div>/g)]
    .slice(0, 3)
    .map((match) => ({
      name: stripTags(match[1].match(/<h3[^>]*>([\s\S]*?)<\/h3>/)?.[1] || ""),
      km: stripTags(match[1].match(/<span class="km">([\s\S]*?)<\/span>/)?.[1] || ""),
      detail: stripTags(match[1].match(/<span class="percent">([\s\S]*?)<\/span>/)?.[1] || ""),
    }))
    .filter((item) => item.name);

  return {
    heroImage: officialImageUrl(background),
    profileImage: officialImageUrl(profile),
    mapImage: officialImageUrl(map),
    elevation: stripTags(elevationBlock?.[1] || ""),
    climbs,
  };
}

function parseRankings(html) {
  const yearLabel = stripTags(html.match(/<div class="ranking__header-title">([\s\S]*?)<\/div>/)?.[1] || "");
  if (!/\b2026\b/.test(yearLabel)) {
    return {
      available: false,
      label: yearLabel || "Rankings not available",
      riders: [],
    };
  }

  const rows = [...html.matchAll(/<tr class="rankingTables__row[\s\S]*?<\/tr>/g)]
    .slice(0, 5)
    .map((match) => {
      const row = match[0];
      const position = stripTags(row.match(/rankingTables__row__position[^>]*><span>([\s\S]*?)<\/span>/)?.[1] || "");
      const name = stripTags(row.match(/rankingTables__row__profile--name[^>]*>([\s\S]*?)<\/a>/)?.[1] || "");
      const team = stripTags(row.match(/<td class="break-line team">([\s\S]*?)<\/td>/)?.[1] || "");
      const times = [...row.matchAll(/<td class="is-alignCenter time">([\s\S]*?)<\/td>/g)].map((cell) => stripTags(cell[1]));
      const country = row.match(/data-class="flag--([^"]+)"/)?.[1]?.toUpperCase() || "";

      return {
        position,
        name,
        team,
        country,
        time: times[0] || "",
        gap: times[1] || "",
      };
    })
    .filter((rider) => rider.position && rider.name);

  return {
    available: rows.length > 0,
    label: yearLabel,
    riders: rows,
  };
}

async function getRoute() {
  try {
    const html = await fetchText(routeUrl);
    const route = parseRoute(html);
    if (route.length) {
      return { route, routeSource: "Official Tour de France route page" };
    }
  } catch {
    // Fallback below keeps the integration renderable when ASO changes markup.
  }

  return { route: fallbackRoute, routeSource: "Embedded 2026 route fallback" };
}

async function getStageDetails(entry) {
  if (!entry?.stage || !entry.url) return {};

  try {
    return parseStageDetails(await fetchText(new URL(entry.url, baseUrl).toString()));
  } catch {
    return {};
  }
}

async function getRankings(enabled) {
  if (!enabled) {
    return { available: false, label: "Disabled", riders: [] };
  }

  try {
    return parseRankings(await fetchText(rankingsUrl));
  } catch {
    return { available: false, label: "Rankings not available", riders: [] };
  }
}

export default async function handler({ query }) {
  const nowValue = typeof query.now === "string" ? Date.parse(query.now) : NaN;
  const nowMs = Number.isFinite(nowValue) ? nowValue : Date.now();
  const settings = {
    selection: normalizeSelection(query.selection),
    stage: toInteger(query.stage, 1, { min: 1, max: 21 }),
    locale: typeof query.locale === "string" && query.locale.trim() ? query.locale.trim() : "en-US",
    timeZone: normalizeTimeZone(query.timeZone),
    showRankings: toBoolean(query.showRankings, true),
  };

  const { route, routeSource } = await getRoute();
  const selected = selectRouteEntry(route, settings, nowMs);
  const stageRows = route.filter((entry) => Number.isFinite(entry.stage));
  const selectedStageIndex = stageRows.findIndex((entry) => entry.stage === selected.stage);
  const details = await getStageDetails(selected);
  const rankings = await getRankings(settings.showRankings);

  return {
    source: "letour.fr",
    sourceUrl: selected?.url ? new URL(selected.url, baseUrl).toString() : routeUrl,
    sourceNote: routeSource,
    year: 2026,
    updatedAt: new Date().toISOString(),
    selection: settings.selection,
    stage: {
      ...selected,
      label: selected.stage ? `Stage ${selected.stage}` : `Rest ${selected.rest}`,
      dateLabel: formatDate(selected.date, settings.locale, settings.timeZone),
      status: statusFor(selected, nowMs, settings.timeZone),
      startsAt: `${selected.date}T13:00:00+02:00`,
      ...details,
    },
    previous: selectedStageIndex > 0 ? stageRows[selectedStageIndex - 1] : null,
    next: selectedStageIndex >= 0 && selectedStageIndex < stageRows.length - 1 ? stageRows[selectedStageIndex + 1] : null,
    route: stageRows,
    rankings,
  };
}
