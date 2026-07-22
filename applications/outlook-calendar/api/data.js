const GRAPH_ORIGIN = "https://graph.microsoft.com";
const TOKEN_ORIGIN = "https://login.microsoftonline.com";
const MAX_PAGES = 5;
const MAX_EVENTS = 2_000;
const MAX_RESPONSE_BYTES = 6 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function stringSetting(query, key, fallback = "") {
  const value = firstValue(query?.[key]);
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed && !/^(null|undefined)$/i.test(trimmed) ? trimmed : fallback;
}

function booleanSetting(query, key, fallback = false) {
  const value = firstValue(query?.[key]);
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "string") {
    return !["false", "0", "off", "no"].includes(value.toLowerCase());
  }
  return Boolean(value);
}

function normalizeTimeZone(value) {
  const timeZone = String(value || "").trim() || "UTC";
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format(new Date());
    return timeZone;
  } catch {
    throw new Error(`Invalid IANA time zone: ${timeZone}`);
  }
}

function parseDateKey(value, label) {
  const dateKey = String(value || "").trim();
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    throw new Error(`${label} must use YYYY-MM-DD format.`);
  }

  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`${label} is not a valid calendar date.`);
  }
  return dateKey;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function addCivilDays(dateKey, count) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + count, 12));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function civilDaySpan(startKey, endKey) {
  const [startYear, startMonth, startDay] = startKey.split("-").map(Number);
  const [endYear, endMonth, endDay] = endKey.split("-").map(Number);
  return Math.round(
    (Date.UTC(endYear, endMonth - 1, endDay) -
      Date.UTC(startYear, startMonth - 1, startDay)) /
      86_400_000
  );
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
    hourCycle: "h23"
  });
  return Object.fromEntries(
    formatter
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
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
    parts.second
  );
  return representedUtc - Math.trunc(value.getTime() / 1_000) * 1_000;
}

function civilDateTime(
  dateKey,
  hour,
  minute,
  second,
  millisecond,
  timeZone
) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute, second, millisecond);
  let candidate = new Date(wallClockUtc);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const next = new Date(wallClockUtc - offsetAt(candidate, timeZone));
    if (next.getTime() === candidate.getTime()) break;
    candidate = next;
  }
  return candidate;
}

function localMidnight(dateKey, timeZone) {
  return civilDateTime(dateKey, 0, 0, 0, 0, timeZone);
}

function dateKeyFromInstant(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = dateParts(date, timeZone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function graphDateTimeToIso(value, responseTimeZone, fallbackTimeZone) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/Z$|[+-]\d{2}:?\d{2}$/i.test(raw)) {
    const normalized = raw.replace(/(\.\d{3})\d+/, "$1");
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
  }

  const match = raw.match(
    /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,7}))?)?$/
  );
  if (!match) return "";

  let timeZone = fallbackTimeZone;
  const candidateZone = String(responseTimeZone || "").trim();
  if (/^(UTC|Etc\/UTC)$/i.test(candidateZone)) {
    timeZone = "UTC";
  } else if (candidateZone) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: candidateZone }).format(new Date());
      timeZone = candidateZone;
    } catch {
      // Microsoft may return a Windows time-zone name. The request's preferred
      // IANA zone still describes the offsetless response value in that case.
    }
  }

  const milliseconds = Number(`0.${match[5] || "0"}`) * 1_000;
  return civilDateTime(
    match[1],
    Number(match[2]),
    Number(match[3]),
    Number(match[4] || 0),
    Math.trunc(milliseconds),
    timeZone
  ).toISOString();
}

function canonicalEvent(event, options) {
  if (!event || typeof event !== "object" || event.isCancelled) return null;

  const startValue = String(event.start?.dateTime || "").trim();
  if (!startValue) return null;

  const privateEvent = ["private", "confidential"].includes(
    String(event.sensitivity || "").toLowerCase()
  );
  const hidden = options.hidePrivate && privateEvent;
  const title = hidden
    ? options.privateTitle
    : String(event.subject || "").trim();
  const location = hidden
    ? ""
    : String(event.location?.displayName || "").trim();
  const id = String(event.id || "").trim() || `${startValue}:${title}`;

  if (event.isAllDay) {
    const startInstant = graphDateTimeToIso(
      startValue,
      event.start?.timeZone,
      options.timeZone
    );
    const endInstant = graphDateTimeToIso(
      event.end?.dateTime,
      event.end?.timeZone,
      options.timeZone
    );
    const startDate = startInstant
      ? dateKeyFromInstant(startInstant, options.timeZone)
      : startValue.slice(0, 10);
    if (!DATE_KEY_PATTERN.test(startDate)) return null;
    const endCandidate = endInstant
      ? dateKeyFromInstant(endInstant, options.timeZone)
      : String(event.end?.dateTime || "").slice(0, 10);
    const endDate = DATE_KEY_PATTERN.test(endCandidate)
      ? endCandidate
      : addCivilDays(startDate, 1);
    return {
      id,
      title,
      start: { date: startDate },
      end: { date: endDate },
      ...(location ? { location } : {})
    };
  }

  const startDateTime = graphDateTimeToIso(
    startValue,
    event.start?.timeZone,
    options.timeZone
  );
  const endDateTime = graphDateTimeToIso(
    event.end?.dateTime,
    event.end?.timeZone,
    options.timeZone
  );
  if (!startDateTime) return null;

  return {
    id,
    title,
    start: { dateTime: startDateTime, timeZone: options.timeZone },
    end: {
      dateTime: endDateTime || startDateTime,
      timeZone: options.timeZone
    },
    ...(location ? { location } : {})
  };
}

function eventSortValue(event) {
  const value = event.start?.dateTime || `${event.start?.date || "9999-12-31"}T00:00:00Z`;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

async function responseText(response, label, maxBytes = MAX_RESPONSE_BYTES) {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error(`${label} returned more data than the ${Math.round(maxBytes / 1_048_576)} MB limit.`);
  }
  const body = await response.text();
  if (Buffer.byteLength(body, "utf8") > maxBytes) {
    throw new Error(`${label} returned more data than the ${Math.round(maxBytes / 1_048_576)} MB limit.`);
  }
  return body;
}

async function upstreamError(response, label) {
  const body = await responseText(response, label, 128 * 1024).catch(() => "");
  let detail = "";
  try {
    const parsed = JSON.parse(body);
    detail = String(
      parsed?.error?.message ||
        parsed?.error_description ||
        parsed?.message ||
        ""
    );
  } catch {
    detail = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  return `${label} failed with ${response.status}${detail ? `: ${detail.slice(0, 240)}` : ""}`;
}

async function accessToken(credentials) {
  const tenant = encodeURIComponent(credentials.tenantId);
  const response = await fetch(`${TOKEN_ORIGIN}/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      accept: "application/json",
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      scope: `${GRAPH_ORIGIN}/.default`,
      grant_type: "client_credentials"
    })
  });

  if (!response.ok) throw new Error(await upstreamError(response, "Microsoft token request"));
  const body = await responseText(response, "Microsoft token request", 512 * 1024);
  let payload;
  try {
    payload = JSON.parse(body);
  } catch {
    throw new Error("Microsoft token request returned invalid JSON.");
  }
  if (!payload?.access_token) {
    throw new Error("Microsoft token response did not include an access token.");
  }
  return String(payload.access_token);
}

function graphPageUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.origin !== GRAPH_ORIGIN) {
    throw new Error("Microsoft Graph returned an unsafe pagination URL.");
  }
  return url;
}

async function graphJson(url, token) {
  const response = await fetch(graphPageUrl(url), {
    method: "GET",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      prefer: 'outlook.timezone="UTC"'
    }
  });
  if (!response.ok) throw new Error(await upstreamError(response, "Microsoft Graph calendar request"));
  const body = await responseText(response, "Microsoft Graph calendar request");
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("Microsoft Graph calendar request returned invalid JSON.");
  }
}

function calendarViewUrl(credentials, range) {
  const user = encodeURIComponent(credentials.userId);
  const calendarPath = credentials.calendarId
    ? `calendars/${encodeURIComponent(credentials.calendarId)}/calendarView`
    : "calendar/calendarView";
  const url = new URL(`/v1.0/users/${user}/${calendarPath}`, GRAPH_ORIGIN);
  url.searchParams.set("startDateTime", range.startInstant.toISOString());
  url.searchParams.set("endDateTime", range.endInstant.toISOString());
  url.searchParams.set(
    "$select",
    "id,subject,start,end,isAllDay,isCancelled,location,sensitivity,type"
  );
  url.searchParams.set("$top", "1000");
  return url;
}

async function graphEvents(credentials, options, range) {
  const token = await accessToken(credentials);
  let next = calendarViewUrl(credentials, range).href;
  const rawEvents = [];
  let pageCount = 0;
  let truncated = false;

  while (next && pageCount < MAX_PAGES && rawEvents.length < MAX_EVENTS) {
    const payload = await graphJson(next, token);
    pageCount += 1;
    if (!Array.isArray(payload?.value)) {
      throw new Error("Microsoft Graph calendar response did not include an event list.");
    }

    rawEvents.push(...payload.value.slice(0, MAX_EVENTS - rawEvents.length));
    next = typeof payload["@odata.nextLink"] === "string"
      ? graphPageUrl(payload["@odata.nextLink"]).href
      : "";
  }

  if (next) truncated = true;
  const events = rawEvents
    .map((event) => canonicalEvent(event, options))
    .filter(Boolean)
    .sort((left, right) => eventSortValue(left) - eventSortValue(right));

  return { events, pageCount, truncated };
}

function sampleEvents(range, options) {
  const events = [];
  const insideRange = (dateKey) => dateKey >= range.startKey && dateKey < range.endKey;

  const addTimed = (offset, hour, minute, durationMinutes, title, location, privateEvent = false) => {
    const dateKey = addCivilDays(range.startKey, offset);
    if (!insideRange(dateKey)) return;
    const start = civilDateTime(dateKey, hour, minute, 0, 0, options.timeZone);
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    events.push({
      id: `sample-${offset}-${hour}-${minute}`,
      title: privateEvent && options.hidePrivate ? options.privateTitle : title,
      start: { dateTime: start.toISOString(), timeZone: options.timeZone },
      end: { dateTime: end.toISOString(), timeZone: options.timeZone },
      ...(!privateEvent || !options.hidePrivate
        ? location
          ? { location }
          : {}
        : {})
    });
  };

  const addAllDay = (offset, durationDays, title, location) => {
    const dateKey = addCivilDays(range.startKey, offset);
    if (!insideRange(dateKey)) return;
    events.push({
      id: `sample-day-${offset}`,
      title,
      start: { date: dateKey },
      end: { date: addCivilDays(dateKey, durationDays) },
      ...(location ? { location } : {})
    });
  };

  addTimed(0, 9, 30, 45, "Product design review", "Studio 4B");
  addTimed(0, 14, 0, 30, "Customer roadmap call", "Online");
  addTimed(1, 8, 30, 90, "Focus time", "Library workspace");
  addAllDay(2, 1, "Community volunteer day", "Riverside garden");
  addTimed(2, 18, 15, 75, "Evening language class", "Room 2.17");
  addTimed(4, 10, 0, 60, "Quarterly planning", "North meeting room");
  addTimed(6, 16, 30, 30, "Project hand-off", "Online");
  addTimed(9, 12, 15, 60, "Lunch with Morgan", "Market Hall");
  addTimed(11, 15, 0, 45, "Budget review", "Finance office", true);
  addAllDay(13, 2, "Regional makers conference", "City Forum");

  return events.sort((left, right) => eventSortValue(left) - eventSortValue(right));
}

function readConfiguration(query) {
  const credentials = {
    tenantId: stringSetting(query, "tenantId"),
    clientId: stringSetting(query, "clientId"),
    clientSecret: stringSetting(query, "clientSecret"),
    userId: stringSetting(query, "userId"),
    calendarId: stringSetting(query, "calendarId")
  };
  const required = [
    credentials.tenantId,
    credentials.clientId,
    credentials.clientSecret,
    credentials.userId
  ];
  const configuredCount = required.filter(Boolean).length;
  const sample = configuredCount === 0 && !credentials.calendarId;

  if (!sample && configuredCount !== required.length) {
    throw new Error(
      "Outlook Calendar requires tenant ID, client ID, client secret, and mailbox user. Clear every connection field to use sample data."
    );
  }

  return {
    sample,
    credentials,
    options: {
      timeZone: normalizeTimeZone(stringSetting(query, "timeZone", "UTC")),
      hidePrivate: booleanSetting(query, "hidePrivate", true),
      privateTitle: stringSetting(query, "privateTitle", "Private event").slice(0, 120)
    }
  };
}

export default async function outlookCalendar({ query = {} } = {}) {
  const configuration = readConfiguration(query);
  const startKey = parseDateKey(stringSetting(query, "rangeStart"), "Range start");
  const endKey = parseDateKey(
    stringSetting(query, "rangeEndExclusive"),
    "Exclusive range end"
  );
  if (endKey <= startKey) {
    throw new Error("Exclusive range end must be after range start.");
  }
  if (civilDaySpan(startKey, endKey) > 370) {
    throw new Error("Calendar range cannot exceed 370 days.");
  }

  const range = {
    startKey,
    endKey,
    startInstant: localMidnight(startKey, configuration.options.timeZone),
    endInstant: localMidnight(endKey, configuration.options.timeZone)
  };

  if (configuration.sample) {
    return {
      source: "sample",
      calendarName: "Outlook Calendar",
      timeZone: configuration.options.timeZone,
      range: { start: startKey, endExclusive: endKey },
      events: sampleEvents(range, configuration.options),
      truncated: false
    };
  }

  const result = await graphEvents(
    configuration.credentials,
    configuration.options,
    range
  );
  return {
    source: "microsoft-graph",
    calendarName: "Outlook Calendar",
    timeZone: configuration.options.timeZone,
    range: { start: startKey, endExclusive: endKey },
    events: result.events,
    truncated: result.truncated,
    pageCount: result.pageCount
  };
}
