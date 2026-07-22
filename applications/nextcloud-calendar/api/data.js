import { parseICalendar } from "@paperlesspaper/openintegration/ical";

const USER_AGENT = "paperlesspaper-openintegrations/0.1.0";
const DEFAULT_TIME_ZONE = "Europe/Berlin";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 3;
const MAX_XML_BYTES = 8 * 1024 * 1024;
const MAX_DAV_RESPONSES = 600;
const MAX_CALENDARS = 100;
const MAX_EVENTS = 200;
const MAX_RANGE_DAYS = 370;
const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const EXPAND_FALLBACK_STATUSES = new Set([400, 403, 409, 415, 422, 501]);

class CalDavHttpError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "CalDavHttpError";
    this.status = status;
  }
}

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function stringSetting(query, key, fallback = "") {
  const value = firstValue(query?.[key]);
  if (value === undefined || value === null) {
    return fallback;
  }
  const result = String(value).trim();
  return /^(null|undefined)$/i.test(result) ? fallback : result;
}

function integerSetting(query, key, fallback, min, max) {
  const value = Number(firstValue(query?.[key]));
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function normalizeTimeZone(value) {
  const timeZone = String(value || "").trim() || DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format(new Date());
    return timeZone;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

function normalizeServerUrl(input) {
  const raw = String(input || "").trim();
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Nextcloud URL must be a valid http(s) URL.");
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error("Nextcloud URL must use http or https.");
  }
  if (url.username || url.password) {
    throw new Error("Do not include credentials in the Nextcloud URL.");
  }

  url.hash = "";
  url.search = "";
  const cleanPath = url.pathname.replace(/\/+$/, "");
  const davMarker = "/remote.php/dav";
  const markerIndex = cleanPath.toLowerCase().indexOf(davMarker);
  url.pathname = markerIndex >= 0
    ? `${cleanPath.slice(0, markerIndex + davMarker.length)}/`
    : `${cleanPath}${davMarker}/`;
  return url;
}

function basicAuthorization(username, appPassword) {
  return `Basic ${Buffer.from(`${username}:${appPassword}`).toString("base64")}`;
}

function safeCodePoint(raw, radix) {
  const value = Number.parseInt(raw, radix);
  if (!Number.isFinite(value) || value < 0 || value > 0x10ffff || (value >= 0xd800 && value <= 0xdfff)) {
    return null;
  }
  return String.fromCodePoint(value);
}

function decodeXmlEntities(value) {
  const named = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return String(value || "").replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity) => {
    if (entity[0] !== "#") {
      return named[entity.toLowerCase()] ?? match;
    }
    const isHex = entity[1]?.toLowerCase() === "x";
    return safeCodePoint(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10) ?? match;
  });
}

function xmlText(value) {
  const cdata = [];
  const protectedValue = String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, (_match, content) => {
      const index = cdata.push(content) - 1;
      return `\u0000CDATA${index}\u0000`;
    })
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, "");
  return decodeXmlEntities(protectedValue)
    .replace(/\u0000CDATA(\d+)\u0000/g, (_match, index) => cdata[Number(index)] ?? "")
    .trim();
}

function escapedName(name) {
  return name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function elementContents(xml, localName) {
  const name = escapedName(localName);
  const pattern = new RegExp(
    `<(?:[\\w.-]+:)?${name}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${name}\\s*>`,
    "gi",
  );
  return Array.from(String(xml || "").matchAll(pattern), (match) => match[1]);
}

function firstElementText(xml, localName) {
  const content = elementContents(xml, localName)[0];
  return content === undefined ? "" : xmlText(content);
}

function responseBlocks(xml) {
  const blocks = String(xml || "").match(
    /<(?:[\w.-]+:)?response\b[^>]*>[\s\S]*?<\/(?:[\w.-]+:)?response\s*>/gi,
  ) || [];
  if (blocks.length > MAX_DAV_RESPONSES) {
    throw new Error(`Nextcloud returned more than ${MAX_DAV_RESPONSES} DAV resources.`);
  }
  return blocks;
}

function successfulPropertyFragments(responseBlock) {
  const propstats = elementContents(responseBlock, "propstat");
  const successful = propstats
    .filter((propstat) => /\s2\d\d(?:\s|$)/.test(firstElementText(propstat, "status")))
    .flatMap((propstat) => elementContents(propstat, "prop"));
  if (successful.length) {
    return successful;
  }

  const status = firstElementText(responseBlock, "status");
  return !status || /\s2\d\d(?:\s|$)/.test(status)
    ? elementContents(responseBlock, "prop")
    : [];
}

function sameOriginUrl(value, baseUrl, allowedOrigin, label) {
  let url;
  try {
    url = new URL(xmlText(value), baseUrl);
  } catch {
    throw new Error(`Nextcloud returned an invalid ${label} URL.`);
  }
  if (
    !['http:', 'https:'].includes(url.protocol)
    || url.origin !== allowedOrigin
    || url.username
    || url.password
  ) {
    throw new Error(`Nextcloud returned a cross-origin ${label} URL; credentials were not forwarded.`);
  }
  url.hash = "";
  return url;
}

function propertyHref(xml, propertyName, baseUrl, allowedOrigin) {
  for (const block of responseBlocks(xml)) {
    for (const properties of successfulPropertyFragments(block)) {
      for (const property of elementContents(properties, propertyName)) {
        const href = firstElementText(property, "href");
        if (href) {
          return sameOriginUrl(href, baseUrl, allowedOrigin, propertyName);
        }
      }
    }
  }
  throw new Error(`Nextcloud CalDAV discovery did not return ${propertyName}.`);
}

async function readLimitedText(response, limit = MAX_XML_BYTES) {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) {
    throw new Error(`Nextcloud response exceeds the ${Math.round(limit / 1024 / 1024)} MB limit.`);
  }
  if (!response.body) {
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > limit) {
      throw new Error(`Nextcloud response exceeds the ${Math.round(limit / 1024 / 1024)} MB limit.`);
    }
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    bytes += value.byteLength;
    if (bytes > limit) {
      await reader.cancel();
      throw new Error(`Nextcloud response exceeds the ${Math.round(limit / 1024 / 1024)} MB limit.`);
    }
    text += decoder.decode(value, { stream: true });
  }
  return text + decoder.decode();
}

function conciseErrorBody(text) {
  return xmlText(text).replace(/\s+/g, " ").slice(0, 240);
}

async function davRequest(initialUrl, options) {
  const {
    allowedOrigin,
    authorization,
    body,
    depth = "0",
    label,
    method,
  } = options;
  let url = sameOriginUrl(initialUrl.toString(), initialUrl, allowedOrigin, label);

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const response = await fetch(url, {
      method,
      body,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Accept: "application/xml,text/xml",
        Authorization: authorization,
        "Content-Type": "application/xml; charset=utf-8",
        Depth: depth,
        "User-Agent": USER_AGENT,
      },
    });

    if (REDIRECT_STATUSES.has(response.status)) {
      if (redirectCount === MAX_REDIRECTS) {
        throw new Error(`${label} exceeded the redirect limit.`);
      }
      const location = response.headers.get("location");
      if (!location) {
        throw new Error(`${label} returned a redirect without a location.`);
      }
      await response.body?.cancel();
      url = sameOriginUrl(location, url, allowedOrigin, `${label} redirect`);
      continue;
    }

    const text = await readLimitedText(response);
    if (!response.ok) {
      const detail = conciseErrorBody(text);
      throw new CalDavHttpError(
        `${label} failed with ${response.status}${detail ? `: ${detail}` : ""}`,
        response.status,
      );
    }
    return { text, url, status: response.status };
  }

  throw new Error(`${label} failed unexpectedly.`);
}

function propfindXml(properties) {
  return `<?xml version="1.0" encoding="utf-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>${properties.join("")}</d:prop>
</d:propfind>`;
}

async function discoverPrincipal(davRoot, requestOptions) {
  const response = await davRequest(davRoot, {
    ...requestOptions,
    method: "PROPFIND",
    depth: "0",
    label: "Nextcloud principal discovery",
    body: propfindXml(["<d:current-user-principal />"]),
  });
  return propertyHref(response.text, "current-user-principal", response.url, requestOptions.allowedOrigin);
}

async function discoverCalendarHome(principalUrl, requestOptions) {
  const response = await davRequest(principalUrl, {
    ...requestOptions,
    method: "PROPFIND",
    depth: "0",
    label: "Nextcloud calendar-home discovery",
    body: propfindXml(["<c:calendar-home-set />"]),
  });
  return propertyHref(response.text, "calendar-home-set", response.url, requestOptions.allowedOrigin);
}

function componentNames(properties) {
  const supported = elementContents(properties, "supported-calendar-component-set").join("\n");
  return Array.from(
    supported.matchAll(/<(?:[\w.-]+:)?comp\b[^>]*\bname\s*=\s*["']([^"']+)["'][^>]*\/?\s*>/gi),
    (match) => match[1].toUpperCase(),
  );
}

function hasCalendarResourceType(properties) {
  return elementContents(properties, "resourcetype").some((value) =>
    /<(?:[\w.-]+:)?calendar(?:\s|\/|>)/i.test(value),
  );
}

function decodedLastPathSegment(url) {
  const raw = url.pathname.replace(/\/+$/, "").split("/").at(-1) || "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function parseCalendars(xml, baseUrl, allowedOrigin) {
  const calendars = [];
  for (const block of responseBlocks(xml)) {
    const href = firstElementText(block, "href");
    if (!href) {
      continue;
    }
    for (const properties of successfulPropertyFragments(block)) {
      if (!hasCalendarResourceType(properties)) {
        continue;
      }
      const components = componentNames(properties);
      if (components.length && !components.includes("VEVENT")) {
        continue;
      }
      const url = sameOriginUrl(href, baseUrl, allowedOrigin, "calendar");
      calendars.push({
        url,
        name: firstElementText(properties, "displayname") || decodedLastPathSegment(url),
        pathName: decodedLastPathSegment(url),
      });
      if (calendars.length > MAX_CALENDARS) {
        throw new Error(`Nextcloud returned more than ${MAX_CALENDARS} calendars.`);
      }
      break;
    }
  }
  return calendars;
}

async function discoverCalendars(calendarHome, requestOptions) {
  const response = await davRequest(calendarHome, {
    ...requestOptions,
    method: "PROPFIND",
    depth: "1",
    label: "Nextcloud calendar discovery",
    body: propfindXml([
      "<d:displayname />",
      "<d:resourcetype />",
      "<c:supported-calendar-component-set />",
    ]),
  });
  const calendars = parseCalendars(response.text, response.url, requestOptions.allowedOrigin);
  if (!calendars.length) {
    throw new Error("No Nextcloud calendar supporting VEVENT was found for this account.");
  }
  return calendars;
}

function normalizedPath(url) {
  return url.pathname.replace(/\/+$/, "");
}

function selectCalendar(calendars, calendarHome, settings, allowedOrigin) {
  if (settings.calendarPath) {
    const selectionBase = new URL(calendarHome);
    if (!selectionBase.pathname.endsWith("/")) {
      selectionBase.pathname += "/";
    }
    const requested = sameOriginUrl(
      settings.calendarPath,
      selectionBase,
      allowedOrigin,
      "configured calendar path",
    );
    const selected = calendars.find((calendar) => normalizedPath(calendar.url) === normalizedPath(requested));
    if (!selected) {
      throw new Error("The configured calendar path was not found among this account's VEVENT calendars.");
    }
    return selected;
  }

  if (settings.calendarName) {
    const requestedName = settings.calendarName.toLocaleLowerCase();
    const selected = calendars.find((calendar) =>
      [calendar.name, calendar.pathName].some(
        (value) => value.toLocaleLowerCase() === requestedName,
      ),
    );
    if (!selected) {
      const available = calendars.slice(0, 8).map((calendar) => calendar.name).join(", ");
      throw new Error(
        `Nextcloud calendar “${settings.calendarName}” was not found.${available ? ` Available: ${available}.` : ""}`,
      );
    }
    return selected;
  }

  return [...calendars].sort((left, right) => {
    const leftPersonal = /^(personal|pers[oö]nlich)$/i.test(left.name) ? 0 : 1;
    const rightPersonal = /^(personal|pers[oö]nlich)$/i.test(right.name) ? 0 : 1;
    return leftPersonal - rightPersonal || left.name.localeCompare(right.name);
  })[0];
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
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
    - value.getTime();
}

function localDateTime(dateKey, hour, minute, timeZone) {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (!match) {
    throw new Error(`Invalid calendar date: ${dateKey}`);
  }
  const wallClock = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), hour, minute);
  let candidate = new Date(wallClock - offsetAt(new Date(wallClock), timeZone));
  candidate = new Date(wallClock - offsetAt(candidate, timeZone));
  return candidate;
}

function validDateKey(value) {
  const match = DATE_KEY_PATTERN.exec(String(value || ""));
  if (!match) {
    return false;
  }
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1])
    && date.getUTCMonth() === Number(match[2]) - 1
    && date.getUTCDate() === Number(match[3]);
}

function addDays(dateKey, count) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + count));
  return [
    value.getUTCFullYear(),
    String(value.getUTCMonth() + 1).padStart(2, "0"),
    String(value.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function daysBetween(startKey, endKey) {
  const start = Date.parse(`${startKey}T00:00:00Z`);
  const end = Date.parse(`${endKey}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

function todayKey(now, timeZone) {
  const requested = new Date(now || Date.now());
  const date = Number.isNaN(requested.getTime()) ? new Date() : requested;
  const parts = dateParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function normalizeRange(query, timeZone) {
  const start = stringSetting(query, "rangeStart");
  const end = stringSetting(query, "rangeEndExclusive");
  const fallbackStart = todayKey(stringSetting(query, "now"), timeZone);
  const rangeStartKey = start || fallbackStart;
  const rangeEndKey = end || addDays(rangeStartKey, integerSetting(query, "dayRange", 14, 1, 366));
  if (!validDateKey(rangeStartKey) || !validDateKey(rangeEndKey)) {
    throw new Error("Calendar range must use YYYY-MM-DD dates.");
  }
  const rangeDays = daysBetween(rangeStartKey, rangeEndKey);
  if (rangeDays < 1 || rangeDays > MAX_RANGE_DAYS) {
    throw new Error(`Calendar range must be between 1 and ${MAX_RANGE_DAYS} days.`);
  }
  return {
    startKey: rangeStartKey,
    endKey: rangeEndKey,
    start: localDateTime(rangeStartKey, 0, 0, timeZone),
    endExclusive: localDateTime(rangeEndKey, 0, 0, timeZone),
  };
}

function calDavTimestamp(value) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function calendarQueryXml(range, expand) {
  const start = calDavTimestamp(range.start);
  const end = calDavTimestamp(range.endExclusive);
  const expandElement = expand ? `<c:expand start="${start}" end="${end}" />` : "";
  return `<?xml version="1.0" encoding="utf-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag />
    <c:calendar-data>${expandElement}</c:calendar-data>
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT">
        <c:time-range start="${start}" end="${end}" />
      </c:comp-filter>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;
}

async function queryCalendar(calendar, range, requestOptions) {
  const request = (expand) => davRequest(calendar.url, {
    ...requestOptions,
    method: "REPORT",
    depth: "1",
    label: `Nextcloud calendar query for “${calendar.name}”`,
    body: calendarQueryXml(range, expand),
  });

  try {
    return { ...(await request(true)), expandedByServer: true };
  } catch (error) {
    if (!(error instanceof CalDavHttpError) || !EXPAND_FALLBACK_STATUSES.has(error.status)) {
      throw error;
    }
    return { ...(await request(false)), expandedByServer: false };
  }
}

function calendarDataValues(xml) {
  const result = [];
  for (const block of responseBlocks(xml)) {
    for (const properties of successfulPropertyFragments(block)) {
      for (const value of elementContents(properties, "calendar-data")) {
        const data = xmlText(value);
        if (data) {
          result.push(data);
          if (result.length > MAX_DAV_RESPONSES) {
            throw new Error(`Nextcloud returned more than ${MAX_DAV_RESPONSES} calendar objects.`);
          }
        }
      }
    }
  }
  return result;
}

function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function canonicalEvent(value) {
  const event = objectValue(value);
  const start = objectValue(event.start);
  const end = objectValue(event.end);
  if (!String(start.date || start.dateTime || "").trim()) {
    return null;
  }
  return {
    id: String(event.id || ""),
    title: String(event.title || ""),
    start: {
      ...(start.date ? { date: String(start.date).slice(0, 10) } : {}),
      ...(start.dateTime ? { dateTime: String(start.dateTime) } : {}),
      ...(start.timeZone ? { timeZone: String(start.timeZone) } : {}),
    },
    ...(Object.keys(end).length
      ? {
          end: {
            ...(end.date ? { date: String(end.date).slice(0, 10) } : {}),
            ...(end.dateTime ? { dateTime: String(end.dateTime) } : {}),
            ...(end.timeZone ? { timeZone: String(end.timeZone) } : {}),
          },
        }
      : {}),
    ...(event.location ? { location: String(event.location) } : {}),
  };
}

function parsedEvents(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return Array.isArray(value?.events) ? value.events : [];
}

async function normalizeCalendarData(calendarData, range, timeZone, resultLimit) {
  const events = [];
  const seen = new Set();
  for (const ics of calendarData) {
    // Shared parser contract: parseICalendar(ics, options) returns canonical
    // CalendarEvent[] (an { events } wrapper is also tolerated during rollout).
    const parsed = await parseICalendar(ics, {
      rangeStart: range.start.toISOString(),
      rangeEndExclusive: range.endExclusive.toISOString(),
      timeZone,
    });
    for (const rawEvent of parsedEvents(parsed)) {
      const event = canonicalEvent(rawEvent);
      if (!event) {
        continue;
      }
      const key = `${event.id}\n${event.start.date || event.start.dateTime || ""}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      events.push(event);
      if (events.length >= resultLimit) {
        return events;
      }
    }
  }
  return events;
}

function eventSortValue(event) {
  if (event.start.date) {
    return `${event.start.date}T00:00:00`;
  }
  const parsed = Date.parse(event.start.dateTime);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : event.start.dateTime;
}

function sampleEvents(range, timeZone, now, resultLimit) {
  const anchor = todayKey(now, timeZone);
  const definitions = [
    { offset: 0, hour: 9, minute: 0, duration: 45, title: "Team sync", location: "Video call" },
    { offset: 0, hour: 17, minute: 30, duration: 60, title: "Evening run", location: "Riverside park" },
    { offset: 1, hour: 11, minute: 0, duration: 30, title: "Project review", location: "Room Linden" },
    { offset: 2, allDay: true, durationDays: 1, title: "Community picnic", location: "Meadow pavilion" },
    { offset: 3, hour: 14, minute: 0, duration: 120, title: "Focus afternoon", location: "Home office" },
    { offset: 5, hour: 10, minute: 30, duration: 75, title: "Museum visit", location: "City museum" },
    { offset: 8, hour: 8, minute: 15, duration: 45, title: "Dentist", location: "Example Dental" },
  ];

  return definitions
    .map((definition, index) => {
      const date = addDays(anchor, definition.offset);
      if (definition.allDay) {
        return {
          id: `nextcloud-sample-${index + 1}`,
          title: definition.title,
          start: { date },
          end: { date: addDays(date, definition.durationDays) },
          location: definition.location,
        };
      }
      const start = localDateTime(date, definition.hour, definition.minute, timeZone);
      const end = new Date(start.getTime() + definition.duration * 60_000);
      return {
        id: `nextcloud-sample-${index + 1}`,
        title: definition.title,
        start: { dateTime: start.toISOString(), timeZone },
        end: { dateTime: end.toISOString(), timeZone },
        location: definition.location,
      };
    })
    .filter((event) => {
      const key = event.start.date || todayKey(event.start.dateTime, timeZone);
      return key >= range.startKey && key < range.endKey;
    })
    .slice(0, resultLimit);
}

function sampleResponse(query, range, timeZone, resultLimit) {
  return {
    sample: true,
    source: "fictional-sample",
    calendarName: "Example Nextcloud · Personal",
    expandedByServer: false,
    range: { start: range.startKey, endExclusive: range.endKey },
    timeZone,
    events: sampleEvents(range, timeZone, stringSetting(query, "now"), resultLimit),
    updatedAt: "2026-07-22T10:00:00.000Z",
  };
}

export default async function handler({ query = {} } = {}) {
  const settings = {
    serverUrl: stringSetting(query, "serverUrl"),
    username: stringSetting(query, "username"),
    appPassword: stringSetting(query, "appPassword"),
    calendarName: stringSetting(query, "calendarName"),
    calendarPath: stringSetting(query, "calendarPath"),
    timeZone: normalizeTimeZone(stringSetting(query, "timeZone", DEFAULT_TIME_ZONE)),
    resultLimit: integerSetting(query, "limit", MAX_EVENTS, 1, MAX_EVENTS),
  };
  const range = normalizeRange(query, settings.timeZone);
  const connectionValues = [
    settings.serverUrl,
    settings.username,
    settings.appPassword,
    settings.calendarName,
    settings.calendarPath,
  ];

  if (connectionValues.every((value) => !value)) {
    return sampleResponse(query, range, settings.timeZone, settings.resultLimit);
  }
  if (!settings.serverUrl || !settings.username || !settings.appPassword) {
    throw new Error("Nextcloud URL, username, and app password are required together.");
  }
  if (settings.calendarName && settings.calendarPath) {
    throw new Error("Set either a calendar name or a calendar path, not both.");
  }

  const davRoot = normalizeServerUrl(settings.serverUrl);
  const requestOptions = {
    allowedOrigin: davRoot.origin,
    authorization: basicAuthorization(settings.username, settings.appPassword),
  };
  const principal = await discoverPrincipal(davRoot, requestOptions);
  const calendarHome = await discoverCalendarHome(principal, requestOptions);
  const calendars = await discoverCalendars(calendarHome, requestOptions);
  const calendar = selectCalendar(calendars, calendarHome, settings, davRoot.origin);
  const report = await queryCalendar(calendar, range, requestOptions);
  const events = await normalizeCalendarData(
    calendarDataValues(report.text),
    range,
    settings.timeZone,
    settings.resultLimit,
  );
  events.sort((left, right) => eventSortValue(left).localeCompare(eventSortValue(right)));

  return {
    sample: false,
    source: "nextcloud-caldav",
    calendarName: calendar.name,
    calendarPath: calendar.url.pathname,
    discoveredCalendars: calendars.length,
    expandedByServer: report.expandedByServer,
    range: { start: range.startKey, endExclusive: range.endKey },
    timeZone: settings.timeZone,
    events,
    updatedAt: new Date().toISOString(),
  };
}
