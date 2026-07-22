const DEFAULT_ROTA_URL =
  "https://app.churchdesk.com/rota/a8e746dc-c9b1-4e8f-8937-6768dc896afb";
const CHURCHDESK_API_BASE = "https://api2.churchdesk.com/shifts/rotas/public";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function stringSetting(query, key, fallback = "") {
  const value = firstValue(query?.[key]);
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed && !/^(null|undefined)$/i.test(trimmed) ? trimmed : fallback;
}

function integerSetting(query, key, fallback, min, max) {
  const value = Number(firstValue(query?.[key]));
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function booleanSetting(query, key, fallback = false) {
  const value = firstValue(query?.[key]);
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value === "string") {
    return !["false", "0", "off", "no"].includes(value.toLowerCase());
  }
  return Boolean(value);
}

function normalizeLocale(value) {
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([value]).length ? value : "de-DE";
  } catch {
    return "de-DE";
  }
}

function normalizeTimeZone(value) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format();
    return value;
  } catch {
    return "Europe/Berlin";
  }
}

function parseRotaId(value) {
  const raw = String(value || "").trim();
  if (UUID_PATTERN.test(raw)) {
    return raw.toLowerCase();
  }

  try {
    const url = new URL(raw);
    const match = url.pathname.match(/\/rota\/([0-9a-f-]{36})(?:\/|$)/i);
    if (match && UUID_PATTERN.test(match[1])) {
      return match[1].toLowerCase();
    }
  } catch {
    // A clear validation error is returned below.
  }

  throw new Error("Invalid public ChurchDesk rota URL or UUID");
}

function dateParts(value, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  return Object.fromEntries(
    formatter
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
}

function offsetAt(value, timeZone) {
  const parts = dateParts(value, timeZone);
  const representedUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  return representedUtc - value.getTime();
}

function localDateTime(year, monthIndex, day, hour, minute, timeZone) {
  const wallClockUtc = Date.UTC(year, monthIndex, day, hour, minute);
  let candidate = new Date(wallClockUtc - offsetAt(new Date(wallClockUtc), timeZone));
  candidate = new Date(wallClockUtc - offsetAt(candidate, timeZone));
  return candidate;
}

function localMidnight(year, monthIndex, day, timeZone) {
  return localDateTime(year, monthIndex, day, 0, 0, timeZone);
}

function startOfLocalDay(nowMs, timeZone) {
  const parts = dateParts(new Date(nowMs), timeZone);
  return localMidnight(parts.year, parts.month - 1, parts.day, timeZone);
}

function addLocalDays(value, days, timeZone) {
  const parts = dateParts(value, timeZone);
  return localMidnight(parts.year, parts.month - 1, parts.day + days, timeZone);
}

function localDateFromKey(value, timeZone) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }
  const date = localMidnight(Number(match[1]), Number(match[2]) - 1, Number(match[3]), timeZone);
  return dayKey(date.getTime(), timeZone) === value ? date : null;
}

function daysBetweenKeys(startKey, endKey) {
  const toDay = (value) => {
    const [year, month, day] = value.split("-").map(Number);
    return Date.UTC(year, month - 1, day) / 86_400_000;
  };
  return toDay(endKey) - toDay(startKey);
}

function dayKey(value, timeZone) {
  const parts = dateParts(new Date(value), timeZone);
  return [parts.year, String(parts.month).padStart(2, "0"), String(parts.day).padStart(2, "0")].join(
    "-",
  );
}

function roleFilters(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLocaleLowerCase())
    .filter(Boolean);
}

function roleMatches(title, filters) {
  if (!filters.length) {
    return true;
  }
  const normalized = String(title || "").toLocaleLowerCase();
  return filters.some((filter) => normalized.includes(filter));
}

function normalizeAssignments(tasks, filters) {
  if (!tasks || typeof tasks !== "object") {
    return [];
  }

  return Object.values(tasks)
    .filter((task) => roleMatches(task?.title, filters))
    .map((task) => ({
      role: String(task?.title || ""),
      people: Array.isArray(task?.users)
        ? task.users
            .map((user) => String(user?.contact?.fullName || "").trim())
            .filter(Boolean)
        : [],
      unassigned: Math.max(0, Number(task?.unassigned) || 0),
    }))
    .filter((assignment) => assignment.role)
    .sort((left, right) => left.role.localeCompare(right.role, "de"));
}

function normalizeEvent(event, filters, timeZone) {
  const startMs = Date.parse(event?.startDate);
  const endMs = Date.parse(event?.endDate);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return null;
  }

  const resourceName = Array.isArray(event.resources)
    ? event.resources.find((resource) => resource?.name)?.name
    : "";
  const churchName = Array.isArray(event.churches)
    ? event.churches.find((church) => church?.name)?.name
    : "";

  return {
    id: String(event.id || ""),
    title: String(event.title || "Termin"),
    startDate: new Date(startMs).toISOString(),
    endDate: new Date(endMs).toISOString(),
    allDay: Boolean(event.allDay),
    dayKey: dayKey(startMs, timeZone),
    endDayKey: dayKey(endMs, timeZone),
    location: String(event.locationName || resourceName || churchName || ""),
    church: String(churchName || ""),
    assignments: normalizeAssignments(event.tasks, filters),
  };
}

const SAMPLE_EVENTS = [
  {
    dayOffset: 0,
    hour: 7,
    minute: 45,
    duration: 30,
    title: "Morgenlob",
    location: "St. Marien",
    assignments: [
      ["Küsterdienst", ["Lukas M."]],
      ["Lektor:in", ["Hannah R."]],
    ],
  },
  {
    dayOffset: 0,
    hour: 18,
    minute: 0,
    duration: 45,
    title: "Abendmesse",
    location: "St. Marien",
    assignments: [
      ["Zelebrant", ["Johannes B."]],
      ["Küsterdienst", ["Maria K."]],
    ],
  },
  {
    dayOffset: 1,
    hour: 10,
    minute: 0,
    duration: 45,
    title: "Marktmesse",
    location: "St. Marien",
    assignments: [
      ["Zelebrant", ["Johannes B."]],
      ["Küsterdienst", ["Eva S."]],
    ],
  },
  {
    dayOffset: 2,
    hour: 17,
    minute: 30,
    duration: 20,
    title: "Rosenkranzgebet",
    location: "Marienkapelle",
    assignments: [["Gebetsleitung", ["Hannah R."]]],
  },
  {
    dayOffset: 2,
    hour: 18,
    minute: 0,
    duration: 60,
    title: "Eucharistische Anbetung",
    location: "Marienkapelle",
    assignments: [["Küsterdienst", ["Noah T."]]],
  },
  {
    dayOffset: 3,
    hour: 19,
    minute: 0,
    duration: 45,
    title: "Abendmesse",
    location: "St. Marien",
    assignments: [
      ["Zelebrant", ["Michael H."]],
      ["Lektor:in", ["Eva S."]],
    ],
  },
  {
    dayOffset: 4,
    hour: 17,
    minute: 0,
    duration: 60,
    title: "Vorabendmesse",
    location: "St. Marien",
    assignments: [
      ["Zelebrant", ["Johannes B."]],
      ["Kirchenmusik", ["Clara N."]],
    ],
  },
  {
    dayOffset: 5,
    hour: 10,
    minute: 30,
    duration: 60,
    title: "Familiengottesdienst",
    location: "St. Marien",
    assignments: [
      ["Zelebrant", ["Michael H."]],
      ["Kirchenmusik", ["Clara N."]],
      ["Lektor:in", ["Lukas M."]],
    ],
  },
  {
    dayOffset: 5,
    hour: 18,
    minute: 0,
    duration: 30,
    title: "Vesper",
    location: "Marienkapelle",
    assignments: [["Gebetsleitung", ["Maria K."]]],
  },
  {
    dayOffset: 7,
    hour: 8,
    minute: 0,
    duration: 40,
    title: "Werktagsmesse",
    location: "Marienkapelle",
    assignments: [
      ["Zelebrant", ["Johannes B."]],
      ["Küsterdienst", ["Noah T."]],
    ],
  },
];

function sampleDate(rangeStart, definition, timeZone) {
  const localDay = addLocalDays(rangeStart, definition.dayOffset, timeZone);
  const parts = dateParts(localDay, timeZone);
  return localDateTime(
    parts.year,
    parts.month - 1,
    parts.day,
    definition.hour,
    definition.minute,
    timeZone,
  );
}

function buildSampleRota(rangeStart, timeZone) {
  return {
    name: "Gottesdienste & Dienste",
    organization: { name: "Beispielpfarrei St. Marien" },
    events: SAMPLE_EVENTS.map((definition, index) => {
      const start = sampleDate(rangeStart, definition, timeZone);
      const end = new Date(start.getTime() + definition.duration * 60 * 1000);
      const tasks = Object.fromEntries(
        definition.assignments.map(([title, people], assignmentIndex) => [
          String(assignmentIndex + 1),
          {
            title,
            unassigned: 0,
            users: people.map((fullName) => ({ contact: { fullName } })),
          },
        ]),
      );
      return {
        id: `sample-${index + 1}`,
        title: definition.title,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        allDay: false,
        locationName: definition.location,
        churches: [{ name: "St. Marien (Beispiel)" }],
        tasks,
      };
    }),
  };
}

async function fetchRota(rotaId, start, end) {
  const url = new URL(`${CHURCHDESK_API_BASE}/${encodeURIComponent(rotaId)}`);
  url.searchParams.set("startDate", start.toISOString());
  url.searchParams.set("endDate", end.toISOString());

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "paperlesspaper-openintegrations/0.1.0",
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`ChurchDesk request failed with ${response.status}`);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.events)) {
    throw new Error("ChurchDesk returned an unexpected response");
  }
  return data;
}

export default async function handler({ query = {} }) {
  const sampleData = booleanSetting(query, "sampleData", false);
  const rotaUrl = stringSetting(query, "rotaUrl", DEFAULT_ROTA_URL);
  const rotaId = sampleData ? "" : parseRotaId(rotaUrl);
  const daysAhead = integerSetting(
    query,
    "dayRange",
    integerSetting(query, "daysAhead", 14, 1, 31),
    1,
    31,
  );
  const resultLimit = integerSetting(query, "limit", 200, 1, 200);
  const locale = normalizeLocale(stringSetting(query, "locale", "de-DE"));
  const timeZone = normalizeTimeZone(stringSetting(query, "timeZone", "Europe/Berlin"));
  const filters = roleFilters(stringSetting(query, "roleFilter", ""));
  const requestedNow = Date.parse(stringSetting(query, "now", ""));
  const nowMs = Number.isFinite(requestedNow) ? requestedNow : Date.now();
  const fallbackStart = startOfLocalDay(nowMs, timeZone);
  const requestedStartKey = stringSetting(query, "rangeStart", "");
  const requestedEndKey = stringSetting(query, "rangeEndExclusive", "");
  const requestedStart = localDateFromKey(requestedStartKey, timeZone);
  const requestedEnd = localDateFromKey(requestedEndKey, timeZone);
  const rangeStart = requestedStart && requestedEnd ? requestedStart : fallbackStart;
  const rangeEnd = requestedStart && requestedEnd
    ? requestedEnd
    : addLocalDays(rangeStart, daysAhead, timeZone);
  const rangeStartKey = dayKey(rangeStart.getTime(), timeZone);
  const rangeEndKey = dayKey(rangeEnd.getTime(), timeZone);
  const rangeDays = daysBetweenKeys(rangeStartKey, rangeEndKey);
  if (rangeDays < 1 || rangeDays > 31) {
    throw new Error("ChurchDesk supports date ranges from 1 through 31 days");
  }
  const data = sampleData
    ? buildSampleRota(rangeStart, timeZone)
    : await fetchRota(rotaId, rangeStart, rangeEnd);

  const events = data.events
    .map((event) => normalizeEvent(event, filters, timeZone))
    .filter(Boolean)
    .filter((event) => {
      const startsAt = Date.parse(event.startDate);
      const endsAt = Date.parse(event.endDate);
      return endsAt > rangeStart.getTime() && startsAt < rangeEnd.getTime();
    })
    .sort((left, right) => Date.parse(left.startDate) - Date.parse(right.startDate))
    .slice(0, resultLimit);

  return {
    sample: sampleData,
    source: sampleData ? "Fictional sample data" : "ChurchDesk public rota API",
    sourceUrl: sampleData ? "" : `https://app.churchdesk.com/rota/${rotaId}`,
    rotaName: String(data.name || ""),
    organization: String(data.organization?.name || ""),
    locale,
    timeZone,
    today: dayKey(nowMs, timeZone),
    range: {
      start: rangeStart.toISOString(),
      endExclusive: rangeEnd.toISOString(),
      startKey: rangeStartKey,
      endKey: rangeEndKey,
      days: rangeDays,
    },
    events,
    updatedAt: new Date().toISOString(),
  };
}
