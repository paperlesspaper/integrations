const MS_PER_DAY = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

const DEFAULTS = {
  title: "Waste Collection",
  addressLabel: "Sample Street 12",
  sourceMode: "manual",
  icsUrl: "",
  manualDates:
    "2026-06-23 | Bulky waste | Booked appointment\n2026-07-03 | Glass",
  recurringRules:
    "Residual waste | WEEKLY | 2 | 2026-01-05 | MO\nPaper | WEEKLY | 4 | 2026-01-12 | MO\nOrganic waste | WEEKLY | 1 | 2026-01-07 | WE\nRecycling | WEEKLY | 2 | 2026-01-09 | FR",
  excludedDates: "",
  includeTypes: "",
  excludeTypes: "",
  daysAhead: 45,
  limit: 8,
  locale: "en-US",
  timeZone: "Europe/Berlin",
  showWeekStrip: true,
  showSource: true,
};

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function stringSetting(query, key) {
  const value = firstValue(query[key]);
  if (typeof value !== "string") {
    return DEFAULTS[key];
  }
  const trimmed = value.trim();
  return trimmed && !/^(null|undefined)$/i.test(trimmed)
    ? trimmed
    : DEFAULTS[key];
}

function optionalStringSetting(query, key) {
  const value = firstValue(query[key]);
  if (typeof value !== "string") {
    return DEFAULTS[key];
  }
  return /^(null|undefined)$/i.test(value.trim()) ? "" : value;
}

function numberSetting(query, key, min, max) {
  const value = Number(firstValue(query[key]));
  if (!Number.isFinite(value)) {
    return DEFAULTS[key];
  }
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function booleanSetting(query, key) {
  const value = firstValue(query[key]);
  if (value === undefined || value === null || value === "") {
    return DEFAULTS[key];
  }
  return value === true || value === "true" || value === "1" || value === "on";
}

function getSettings(query) {
  const sourceMode = stringSetting(query, "sourceMode").toLowerCase();
  return {
    ...DEFAULTS,
    title: stringSetting(query, "title"),
    addressLabel: optionalStringSetting(query, "addressLabel"),
    sourceMode: ["manual", "ics", "auto"].includes(sourceMode)
      ? sourceMode
      : DEFAULTS.sourceMode,
    icsUrl: optionalStringSetting(query, "icsUrl"),
    manualDates: optionalStringSetting(query, "manualDates"),
    recurringRules: optionalStringSetting(query, "recurringRules"),
    excludedDates: optionalStringSetting(query, "excludedDates"),
    includeTypes: optionalStringSetting(query, "includeTypes"),
    excludeTypes: optionalStringSetting(query, "excludeTypes"),
    daysAhead: numberSetting(query, "daysAhead", 1, 370),
    limit: numberSetting(query, "limit", 1, 20),
    locale: stringSetting(query, "locale"),
    timeZone: stringSetting(query, "timeZone"),
    showWeekStrip: booleanSetting(query, "showWeekStrip"),
    showSource: booleanSetting(query, "showSource"),
  };
}

function dateFromKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function keyFromDate(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function parseDateKey(value) {
  const raw = String(value || "").trim();
  const basic = raw.match(/^(\d{4})(\d{2})(\d{2})/);
  const dashed = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const match = dashed || basic;
  if (!match) {
    return null;
  }

  const key = `${match[1]}-${match[2]}-${match[3]}`;
  const date = dateFromKey(key);
  return keyFromDate(date) === key ? key : null;
}

function addDaysKey(key, days) {
  const date = dateFromKey(key);
  date.setUTCDate(date.getUTCDate() + days);
  return keyFromDate(date);
}

function diffDays(fromKey, toKey) {
  return Math.round((dateFromKey(toKey) - dateFromKey(fromKey)) / MS_PER_DAY);
}

function todayKey(timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(new Date()).map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function monthDiff(fromKey, toKey) {
  const from = dateFromKey(fromKey);
  const to = dateFromKey(toKey);
  return (
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    to.getUTCMonth() -
    from.getUTCMonth()
  );
}

function yearDiff(fromKey, toKey) {
  return dateFromKey(toKey).getUTCFullYear() - dateFromKey(fromKey).getUTCFullYear();
}

function weekdayCode(key) {
  return WEEKDAYS[dateFromKey(key).getUTCDay()];
}

function splitLines(value) {
  return String(value || "")
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitList(value) {
  return String(value || "")
    .split(/[,\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeType(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function typeMatches(type, tokens) {
  if (!tokens.length) {
    return false;
  }
  const normalized = type.toLowerCase();
  return tokens.some((token) => normalized.includes(token));
}

function classifyType(type) {
  const value = type.toLowerCase();
  if (/(bio|organic|compost|food|gruen|grün|green|garden)/.test(value)) {
    return "organic";
  }
  if (/(paper|papier|cardboard|pappe|carton)/.test(value)) {
    return "paper";
  }
  if (/(yellow|gelb|recycl|plastic|wertstoff|packaging|sack|tonne)/.test(value)) {
    return "recycling";
  }
  if (/(glass|glas)/.test(value)) {
    return "glass";
  }
  if (/(bulky|sperr|furniture|large)/.test(value)) {
    return "bulky";
  }
  if (/(hazard|schad|chemical|battery|paint)/.test(value)) {
    return "hazard";
  }
  if (/(residual|rest|refuse|general|trash|garbage|waste|muell|müll|mull)/.test(value)) {
    return "residual";
  }
  return "default";
}

function makeEvent({ date, type, note = "", source = "manual" }) {
  const collectionType = normalizeType(type) || "Collection";
  return {
    date,
    type: collectionType,
    note: String(note || "").trim(),
    source,
    category: classifyType(collectionType),
  };
}

function parseManualDates(value) {
  return splitLines(value)
    .map((line) => {
      const [dateRaw, typeRaw, ...noteParts] = line.split("|").map((part) => part.trim());
      const date = parseDateKey(dateRaw);
      if (!date || !typeRaw) {
        return null;
      }
      return makeEvent({
        date,
        type: typeRaw,
        note: noteParts.join(" | "),
        source: "manual",
      });
    })
    .filter(Boolean);
}

function parseWeekdays(value, fallback) {
  const raw = String(value || "").trim();
  if (!raw) {
    return fallback ? [fallback] : [];
  }
  return raw
    .split(/[,\s]+/)
    .map((item) => item.slice(0, 2).toUpperCase())
    .filter((item) => WEEKDAYS.includes(item));
}

function parseRRule(value) {
  const result = {};
  for (const part of String(value || "").split(";")) {
    const [key, ...rest] = part.split("=");
    if (!key || !rest.length) {
      continue;
    }
    result[key.trim().toUpperCase()] = rest.join("=").trim();
  }
  return result;
}

function nthWeekdayInMonth(key) {
  const day = dateFromKey(key);
  const weekday = day.getUTCDay();
  const month = day.getUTCMonth();
  let nth = 0;
  for (let cursor = 1; cursor <= day.getUTCDate(); cursor += 1) {
    const candidate = new Date(Date.UTC(day.getUTCFullYear(), month, cursor, 12));
    if (candidate.getUTCDay() === weekday) {
      nth += 1;
    }
  }

  let remaining = 0;
  const lastDate = new Date(Date.UTC(day.getUTCFullYear(), month + 1, 0, 12)).getUTCDate();
  for (let cursor = day.getUTCDate(); cursor <= lastDate; cursor += 1) {
    const candidate = new Date(Date.UTC(day.getUTCFullYear(), month, cursor, 12));
    if (candidate.getUTCDay() === weekday) {
      remaining += 1;
    }
  }

  return { positive: nth, negative: -remaining };
}

function byDayMatchesMonth(key, byDayValues) {
  if (!byDayValues.length) {
    return true;
  }
  const code = weekdayCode(key);
  const nth = nthWeekdayInMonth(key);
  return byDayValues.some((item) => {
    const match = item.match(/^([+-]?\d+)?([A-Z]{2})$/);
    if (!match || match[2] !== code) {
      return false;
    }
    if (!match[1]) {
      return true;
    }
    const ordinal = Number(match[1]);
    return ordinal > 0 ? nth.positive === ordinal : nth.negative === ordinal;
  });
}

function ruleMatchesKey(key, start, rule) {
  if (diffDays(start, key) < 0) {
    return false;
  }

  const frequency = String(rule.FREQ || "WEEKLY").toUpperCase();
  const interval = Math.max(1, Number.parseInt(rule.INTERVAL || "1", 10) || 1);
  const byDay = String(rule.BYDAY || "")
    .split(",")
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
  const byMonthDay = String(rule.BYMONTHDAY || "")
    .split(",")
    .map((item) => Number.parseInt(item, 10))
    .filter(Number.isFinite);

  if (frequency === "DAILY") {
    return diffDays(start, key) % interval === 0;
  }

  if (frequency === "WEEKLY") {
    const weekDistance = Math.floor(diffDays(start, key) / 7);
    const days = byDay.length ? byDay : [weekdayCode(start)];
    return weekDistance % interval === 0 && days.includes(weekdayCode(key));
  }

  if (frequency === "MONTHLY") {
    const distance = monthDiff(start, key);
    if (distance % interval !== 0) {
      return false;
    }
    if (byMonthDay.length) {
      return byMonthDay.includes(dateFromKey(key).getUTCDate());
    }
    if (byDay.length) {
      return byDayMatchesMonth(key, byDay);
    }
    return dateFromKey(key).getUTCDate() === dateFromKey(start).getUTCDate();
  }

  if (frequency === "YEARLY") {
    const distance = yearDiff(start, key);
    const startDate = dateFromKey(start);
    const date = dateFromKey(key);
    return (
      distance % interval === 0 &&
      date.getUTCMonth() === startDate.getUTCMonth() &&
      date.getUTCDate() === startDate.getUTCDate()
    );
  }

  return false;
}

function expandRule({ type, note, start, rule, until, source }, rangeStart, rangeEnd) {
  const events = [];
  const count = Number.parseInt(rule.COUNT || "", 10);
  const untilKey = parseDateKey(rule.UNTIL || until) || rangeEnd;
  const finalKey = diffDays(untilKey, rangeEnd) < 0 ? untilKey : rangeEnd;
  let occurrenceCount = 0;

  for (let key = start; diffDays(key, finalKey) >= 0; key = addDaysKey(key, 1)) {
    if (!ruleMatchesKey(key, start, rule)) {
      continue;
    }

    occurrenceCount += 1;
    if (Number.isFinite(count) && occurrenceCount > count) {
      break;
    }
    if (diffDays(rangeStart, key) < 0) {
      continue;
    }

    events.push(makeEvent({ date: key, type, note, source }));
  }

  return events;
}

function parseRecurringRules(value, rangeStart, rangeEnd) {
  return splitLines(value).flatMap((line) => {
    const parts = line.split("|").map((part) => part.trim());
    const [type, frequencyRaw, intervalRaw, startRaw, weekdaysRaw, untilRaw, ...noteParts] =
      parts;
    const start = parseDateKey(startRaw);
    if (!type || !start) {
      return [];
    }

    const frequency = String(frequencyRaw || "WEEKLY").toUpperCase();
    const interval = Math.max(1, Number.parseInt(intervalRaw || "1", 10) || 1);
    const weekdays = parseWeekdays(weekdaysRaw, weekdayCode(start));
    const rule = {
      FREQ: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"].includes(frequency)
        ? frequency
        : "WEEKLY",
      INTERVAL: String(interval),
      BYDAY: weekdays.join(","),
    };

    return expandRule(
      {
        type,
        note: noteParts.join(" | "),
        start,
        until: untilRaw,
        rule,
        source: "manual",
      },
      rangeStart,
      rangeEnd,
    );
  });
}

function parseExcluded(value) {
  return splitLines(value.replaceAll(",", "\n")).map((line) => {
    const [dateRaw, typeRaw] = line.split("|").map((part) => part.trim());
    return {
      date: parseDateKey(dateRaw),
      type: normalizeType(typeRaw).toLowerCase(),
    };
  });
}

function isExcluded(event, excluded) {
  return excluded.some(
    (item) =>
      item.date === event.date &&
      (!item.type || item.type === event.type.toLowerCase()),
  );
}

function unfoldIcs(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n[ \t]/g, "");
}

function unescapeIcs(value) {
  return String(value || "")
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function parseIcsProperty(line) {
  const separator = line.indexOf(":");
  if (separator < 0) {
    return null;
  }
  const left = line.slice(0, separator);
  const value = unescapeIcs(line.slice(separator + 1));
  const [nameRaw, ...paramParts] = left.split(";");
  const params = {};
  for (const part of paramParts) {
    const [key, ...rest] = part.split("=");
    if (key && rest.length) {
      params[key.toUpperCase()] = rest.join("=");
    }
  }
  return {
    name: nameRaw.toUpperCase(),
    params,
    value,
  };
}

function parseIcsDate(prop) {
  if (!prop) {
    return null;
  }
  return parseDateKey(prop.value);
}

function parseIcs(text, rangeStart, rangeEnd) {
  const blocks = unfoldIcs(text).match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || [];
  const events = [];

  for (const block of blocks) {
    const props = block
      .split("\n")
      .map(parseIcsProperty)
      .filter(Boolean);
    const prop = (name) => props.find((item) => item.name === name);
    const propsByName = (name) => props.filter((item) => item.name === name);
    const start = parseIcsDate(prop("DTSTART"));
    const type = prop("SUMMARY")?.value || prop("DESCRIPTION")?.value || "Collection";
    const note = prop("LOCATION")?.value || "";
    const rrule = prop("RRULE")?.value ? parseRRule(prop("RRULE").value) : null;
    const exDates = new Set(
      propsByName("EXDATE")
        .flatMap((item) => item.value.split(","))
        .map(parseDateKey)
        .filter(Boolean),
    );

    if (!start) {
      continue;
    }

    const expanded = rrule
      ? expandRule({ type, note, start, rule: rrule, source: "ics" }, rangeStart, rangeEnd)
      : [makeEvent({ date: start, type, note, source: "ics" })];

    const rDates = propsByName("RDATE")
      .flatMap((item) => item.value.split(","))
      .map(parseDateKey)
      .filter(Boolean)
      .map((date) => makeEvent({ date, type, note, source: "ics" }));

    events.push(
      ...expanded.filter((event) => !exDates.has(event.date)),
      ...rDates,
    );
  }

  return events;
}

async function fetchIcsEvents(settings, rangeStart, rangeEnd) {
  if (!settings.icsUrl) {
    return [];
  }

  const url = settings.icsUrl.replace(/^webcal:/i, "https:");
  const response = await fetch(url, {
    headers: {
      Accept: "text/calendar,text/plain,*/*",
      "User-Agent": "paperlesspaper-openintegrations/0.1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`ICS request failed with ${response.status}`);
  }

  return parseIcs(await response.text(), rangeStart, rangeEnd);
}

function mergeEvents(events) {
  const merged = new Map();
  for (const event of events) {
    const key = `${event.date}\n${event.type.toLowerCase()}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, event);
      continue;
    }
    if (event.note && !existing.note.includes(event.note)) {
      existing.note = existing.note ? `${existing.note}; ${event.note}` : event.note;
    }
  }
  return [...merged.values()];
}

function filterEvents(events, settings, today, rangeEnd) {
  const includeTypes = splitList(settings.includeTypes);
  const excludeTypes = splitList(settings.excludeTypes);
  const excluded = parseExcluded(settings.excludedDates);

  return mergeEvents(events)
    .filter((event) => diffDays(today, event.date) >= 0)
    .filter((event) => diffDays(event.date, rangeEnd) >= 0)
    .filter((event) => !includeTypes.length || typeMatches(event.type, includeTypes))
    .filter((event) => !typeMatches(event.type, excludeTypes))
    .filter((event) => !isExcluded(event, excluded))
    .sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));
}

function groupEvents(events, today, limit) {
  const groups = [];
  for (const event of events) {
    let group = groups.find((item) => item.date === event.date);
    if (!group) {
      group = {
        date: event.date,
        daysUntil: diffDays(today, event.date),
        items: [],
      };
      groups.push(group);
    }
    group.items.push(event);
  }
  return groups.slice(0, limit);
}

function buildWeekStrip(events, today) {
  return Array.from({ length: 14 }, (_item, index) => {
    const date = addDaysKey(today, index);
    return {
      date,
      daysUntil: index,
      items: events.filter((event) => event.date === date),
    };
  });
}

export default async function handler({ query }) {
  const settings = getSettings(query);
  const today = todayKey(settings.timeZone);
  const rangeEnd = addDaysKey(today, settings.daysAhead);
  const manualEvents = [
    ...parseManualDates(settings.manualDates),
    ...parseRecurringRules(settings.recurringRules, today, rangeEnd),
  ];
  let source = "manual";
  let events = manualEvents;
  let warning = "";

  if (
    settings.icsUrl &&
    (settings.sourceMode === "ics" || settings.sourceMode === "auto")
  ) {
    try {
      events = await fetchIcsEvents(settings, today, rangeEnd);
      source = "ics";
    } catch (error) {
      if (settings.sourceMode === "ics") {
        throw error;
      }
      warning = error instanceof Error ? error.message : "ICS source failed";
    }
  }

  const upcoming = filterEvents(events, settings, today, rangeEnd);
  const groups = groupEvents(upcoming, today, settings.limit);

  return {
    title: settings.title,
    addressLabel: settings.addressLabel,
    source,
    sourceMode: settings.sourceMode,
    warning,
    today,
    rangeEnd,
    locale: settings.locale,
    timeZone: settings.timeZone,
    showWeekStrip: settings.showWeekStrip,
    showSource: settings.showSource,
    updatedAt: new Date().toISOString(),
    next: upcoming[0]
      ? {
          ...upcoming[0],
          daysUntil: diffDays(today, upcoming[0].date),
        }
      : null,
    groups,
    week: buildWeekStrip(upcoming, today),
  };
}
