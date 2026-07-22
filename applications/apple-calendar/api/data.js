import { parseICalendar } from "@paperlesspaper/openintegration/ical";

const MAX_BODY_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 3;

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function stringSetting(query, key, fallback = "") {
  const value = firstValue(query?.[key]);
  return typeof value === "string" && !/^(null|undefined)$/i.test(value.trim())
    ? value.trim()
    : fallback;
}

function integerSetting(query, key, fallback, min, max) {
  const value = Number(firstValue(query?.[key]));
  return Number.isFinite(value) ? Math.min(max, Math.max(min, Math.trunc(value))) : fallback;
}

function booleanSetting(query, key, fallback = false) {
  const value = firstValue(query?.[key]);
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "string") {
    return !["false", "0", "off", "no"].includes(value.toLowerCase());
  }
  return Boolean(value);
}

function normalizeCalendarUrl(value) {
  const raw = String(value || "").trim().replace(/^webcal:/i, "https:").replace(/^http:/i, "https:");
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Enter a valid Apple public calendar URL");
  }
  const hostname = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Apple calendar links must use HTTPS without embedded credentials");
  }
  if (hostname !== "icloud.com" && !hostname.endsWith(".icloud.com")) {
    throw new Error("The calendar URL must be an Apple iCloud public calendar link");
  }
  return url;
}

async function readLimitedText(response) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw new Error("Apple calendar response is too large");
  }
  if (!response.body) {
    const value = await response.text();
    if (new TextEncoder().encode(value).byteLength > MAX_BODY_BYTES) {
      throw new Error("Apple calendar response is too large");
    }
    return value;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error("Apple calendar response is too large");
    }
    chunks.push(value);
  }
  const combined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
}

async function fetchCalendar(initialUrl) {
  let url = normalizeCalendarUrl(initialUrl);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(url, {
      headers: {
        Accept: "text/calendar, text/plain;q=0.9",
        "User-Agent": "paperlesspaper-openintegrations/0.1.0",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(12_000),
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      try {
        await response.body?.cancel();
      } catch {
        // The next request must not depend on whether the redirect body can be cancelled.
      }
      if (!location || redirect === MAX_REDIRECTS) {
        throw new Error("Apple calendar returned too many redirects");
      }
      url = normalizeCalendarUrl(new URL(location, url).href);
      continue;
    }
    if (!response.ok) {
      throw new Error(`Apple calendar request failed with ${response.status}`);
    }
    return readLimitedText(response);
  }
  throw new Error("Apple calendar could not be loaded");
}

function addDays(dateKey, amount) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function dateTimeParts(value, timeZone) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
}

function zonedDateTime(dateKey, hour, minute, timeZone) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const wallClock = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = wallClock;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const parts = dateTimeParts(new Date(candidate), timeZone);
    const represented = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const correction = wallClock - represented;
    if (!correction) break;
    candidate += correction;
  }
  return new Date(candidate).toISOString();
}

function sampleEvents(rangeStart, timeZone) {
  return [
    {
      id: "apple-sample-1",
      title: "Morning walk",
      start: { dateTime: zonedDateTime(rangeStart, 8, 0, timeZone), timeZone },
      end: { dateTime: zonedDateTime(rangeStart, 8, 45, timeZone), timeZone },
      location: "Riverside path",
    },
    {
      id: "apple-sample-2",
      title: "Family lunch",
      start: {
        dateTime: zonedDateTime(addDays(rangeStart, 1), 12, 30, timeZone),
        timeZone,
      },
      end: { dateTime: zonedDateTime(addDays(rangeStart, 1), 14, 0, timeZone), timeZone },
      location: "Garden café",
    },
    {
      id: "apple-sample-3",
      title: "Summer holiday",
      start: { date: addDays(rangeStart, 3) },
      end: { date: addDays(rangeStart, 6) },
    },
    {
      id: "apple-sample-4",
      title: "Piano lesson",
      start: {
        dateTime: zonedDateTime(addDays(rangeStart, 7), 17, 0, timeZone),
        timeZone,
      },
      end: { dateTime: zonedDateTime(addDays(rangeStart, 7), 18, 0, timeZone), timeZone },
      location: "Music school",
    },
  ];
}

export default async function handler({ query = {} }) {
  const calendarUrl = stringSetting(query, "calendarUrl", "");
  const sample = booleanSetting(query, "sampleData", false) || !calendarUrl;
  const rangeStart = stringSetting(query, "rangeStart", new Date().toISOString().slice(0, 10));
  const rangeEndExclusive = stringSetting(query, "rangeEndExclusive", addDays(rangeStart, 14));
  const timeZone = stringSetting(query, "timeZone", "Europe/Berlin");
  const resultLimit = integerSetting(query, "limit", 500, 1, 1_000);

  if (sample) {
    return {
      sample: true,
      source: "Fictional sample data",
      calendarName: "Personal calendar (sample)",
      events: sampleEvents(rangeStart, timeZone).slice(0, resultLimit),
    };
  }

  const ics = await fetchCalendar(calendarUrl);
  const parsed = parseICalendar(ics, {
    rangeStart,
    rangeEndExclusive,
    timeZone,
  });
  return {
    sample: false,
    source: "Apple iCloud public calendar",
    calendarName: Array.isArray(parsed) ? "" : parsed.calendarName || "",
    events: (Array.isArray(parsed) ? parsed : parsed.events).slice(0, resultLimit),
  };
}
