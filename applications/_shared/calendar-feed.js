import { lookup as dnsLookup } from "node:dns/promises";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";

import { parseICalendar } from "@paperlesspaper/openintegration/ical";

const USER_AGENT = "paperlesspaper-openintegrations/0.1.0";
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_SOURCE_EVENT_LIMIT = 5_000;
const DEFAULT_OCCURRENCE_LIMIT = 50_000;
const MAX_REDIRECTS = 5;
const DNS_TIMEOUT_MS = 5_000;
const REQUEST_TIMEOUT_MS = 20_000;
const PRIVATE_NETWORK_ENV = "PAPERLESSPAPER_ALLOW_PRIVATE_CALENDAR_NETWORKS";
const INSECURE_HTTP_ENV = "PAPERLESSPAPER_ALLOW_INSECURE_CALENDAR_HTTP";

export function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

export function stringSetting(query, key, fallback = "") {
  const value = firstValue(query?.[key]);
  if (typeof value !== "string") {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed && !/^(null|undefined)$/i.test(trimmed) ? trimmed : fallback;
}

export function integerSetting(query, key, fallback, min, max) {
  const value = Number(firstValue(query?.[key]));
  return Number.isFinite(value)
    ? Math.min(max, Math.max(min, Math.trunc(value)))
    : fallback;
}

export function booleanSetting(query, key, fallback = false) {
  const value = firstValue(query?.[key]);
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value === "string") {
    return !["false", "0", "off", "no"].includes(value.toLowerCase());
  }
  return Boolean(value);
}

export function normalizeLocale(value, fallback = "en-US") {
  const locale = String(value || "").trim() || fallback;
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([locale]).length ? locale : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeTimeZone(value, fallback = "UTC") {
  const timeZone = String(value || "").trim() || fallback;
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
    return timeZone;
  } catch {
    return fallback;
  }
}

export function dateParts(value, timeZone) {
  return Object.fromEntries(
    new Intl.DateTimeFormat("en", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    })
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)])
  );
}

function offsetAt(value, timeZone) {
  const parts = dateParts(value, timeZone);
  return (
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) -
    value.getTime()
  );
}

export function localDateTime(year, monthIndex, day, hour, minute, timeZone) {
  const wallClockUtc = Date.UTC(year, monthIndex, day, hour, minute);
  let candidate = new Date(wallClockUtc - offsetAt(new Date(wallClockUtc), timeZone));
  candidate = new Date(wallClockUtc - offsetAt(candidate, timeZone));
  return candidate;
}

export function startOfLocalDay(value, timeZone) {
  const parts = dateParts(value, timeZone);
  return localDateTime(parts.year, parts.month - 1, parts.day, 0, 0, timeZone);
}

export function addLocalDays(value, days, timeZone) {
  const parts = dateParts(value, timeZone);
  return localDateTime(parts.year, parts.month - 1, parts.day + days, 0, 0, timeZone);
}

export function dateKey(value, timeZone) {
  const parts = dateParts(value, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function calendarWindow({ now, timeZone, dayRange, view = "agenda" }) {
  const parsed = Date.parse(String(now || ""));
  const current = Number.isFinite(parsed) ? new Date(parsed) : new Date();
  let from = startOfLocalDay(current, timeZone);
  let days = dayRange;
  if (view === "day") {
    days = 1;
  } else if (view === "three-days") {
    days = 3;
  } else if (view === "week") {
    const parts = dateParts(current, timeZone);
    const weekday = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
    from = localDateTime(
      parts.year,
      parts.month - 1,
      parts.day - ((weekday + 6) % 7),
      0,
      0,
      timeZone
    );
    days = 7;
  } else if (view === "year") {
    const parts = dateParts(current, timeZone);
    from = localDateTime(parts.year, 0, 1, 0, 0, timeZone);
    const to = localDateTime(parts.year + 1, 0, 1, 0, 0, timeZone);
    return { current, from, to };
  }
  const to = addLocalDays(from, days, timeZone);
  return { current, from, to };
}

function calendarDateParts(value, label) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || "").trim());
  if (!match) {
    throw new Error(`${label} must use YYYY-MM-DD.`);
  }
  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(`${label} is not a valid calendar date.`);
  }
  return { year, month, day };
}

export function normalizeCalendarRange({
  rangeStart,
  rangeEndExclusive,
  timeZone,
  now,
  defaultDays = 14,
  maxDays = 370
} = {}) {
  const normalizedTimeZone = normalizeTimeZone(timeZone, "UTC");
  const parsedNow = Date.parse(String(now || ""));
  const current = Number.isFinite(parsedNow) ? new Date(parsedNow) : new Date();
  const defaultStart = dateKey(startOfLocalDay(current, normalizedTimeZone), normalizedTimeZone);
  const startKey = String(rangeStart || "").trim() || defaultStart;
  const start = calendarDateParts(startKey, "Calendar range start");
  const from = localDateTime(
    start.year,
    start.month - 1,
    start.day,
    0,
    0,
    normalizedTimeZone
  );
  const safeDefaultDays = Math.min(
    Math.max(1, Math.trunc(Number(defaultDays) || 14)),
    Math.max(1, Math.trunc(Number(maxDays) || 370))
  );
  const defaultEnd = dateKey(addLocalDays(from, safeDefaultDays, normalizedTimeZone), normalizedTimeZone);
  const endKey = String(rangeEndExclusive || "").trim() || defaultEnd;
  const end = calendarDateParts(endKey, "Calendar range end");
  const startSerial = Date.UTC(start.year, start.month - 1, start.day);
  const endSerial = Date.UTC(end.year, end.month - 1, end.day);
  const rangeDays = Math.round((endSerial - startSerial) / 86_400_000);
  const safeMaxDays = Math.max(1, Math.trunc(Number(maxDays) || 370));
  if (rangeDays < 1) {
    throw new Error("Calendar range end must be after its start.");
  }
  if (rangeDays > safeMaxDays) {
    throw new Error(`Calendar range cannot exceed ${safeMaxDays} days.`);
  }
  const to = localDateTime(
    end.year,
    end.month - 1,
    end.day,
    0,
    0,
    normalizedTimeZone
  );
  return {
    rangeStart: startKey,
    rangeEndExclusive: endKey,
    rangeDays,
    timeZone: normalizedTimeZone,
    from,
    to
  };
}

export function normalizeFeedUrl(value, { allowHttp = false } = {}) {
  const raw = String(value || "").trim().replace(/^webcal:/i, "https:");
  if (!raw) {
    throw new Error("Calendar feed URL is required.");
  }
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Calendar feed URL must be a valid URL.");
  }
  const protocols = allowHttp ? ["http:", "https:"] : ["https:"];
  if (!protocols.includes(url.protocol)) {
    throw new Error(allowHttp ? "Calendar URL must use http or https." : "Calendar URL must use https.");
  }
  if (url.username || url.password) {
    throw new Error("Put calendar credentials in their dedicated settings, not in the URL.");
  }
  url.hash = "";
  return url.toString();
}

function privateNetworksAllowed() {
  return /^(?:1|true|yes|on)$/i.test(String(process.env[PRIVATE_NETWORK_ENV] || "").trim());
}

function insecureHttpAllowed() {
  return /^(?:1|true|yes|on)$/i.test(String(process.env[INSECURE_HTTP_ENV] || "").trim());
}

function ipv4Parts(address) {
  const parts = String(address || "").split(".");
  if (
    parts.length !== 4 ||
    parts.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)
  ) {
    return null;
  }
  return parts.map(Number);
}

function isPublicIpv4(address) {
  const parts = ipv4Parts(address);
  if (!parts) {
    return false;
  }
  const [first, second, third] = parts;
  return !(
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && third === 0) ||
    (first === 192 && second === 0 && third === 2) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224
  );
}

function ipv6Parts(address) {
  let source = String(address || "").toLowerCase().split("%")[0];
  if (source.includes(".")) {
    const lastColon = source.lastIndexOf(":");
    const ipv4 = ipv4Parts(source.slice(lastColon + 1));
    if (!ipv4) {
      return null;
    }
    source = `${source.slice(0, lastColon)}:${((ipv4[0] << 8) | ipv4[1]).toString(16)}:${(
      (ipv4[2] << 8) |
      ipv4[3]
    ).toString(16)}`;
  }
  const halves = source.split("::");
  if (halves.length > 2) {
    return null;
  }
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) {
    return null;
  }
  const values = [...left, ...Array(Math.max(0, missing)).fill("0"), ...right];
  if (values.length !== 8 || values.some((part) => !/^[\da-f]{1,4}$/.test(part))) {
    return null;
  }
  return values.map((part) => Number.parseInt(part, 16));
}

function isPublicIpv6(address) {
  const parts = ipv6Parts(address);
  if (!parts) {
    return false;
  }

  // IPv4-compatible and IPv4-mapped addresses inherit the embedded IPv4 classification.
  if (parts.slice(0, 5).every((part) => part === 0) && [0, 0xffff].includes(parts[5])) {
    const embedded = `${parts[6] >> 8}.${parts[6] & 255}.${parts[7] >> 8}.${parts[7] & 255}`;
    return isPublicIpv4(embedded);
  }

  // Publicly routable IPv6 currently lives in 2000::/3. Exclude documentation and transition
  // ranges that can encapsulate an otherwise blocked IPv4 destination.
  const globallyRoutable = parts[0] >= 0x2000 && parts[0] <= 0x3fff;
  const documentation =
    (parts[0] === 0x2001 && parts[1] === 0x0db8) ||
    (parts[0] === 0x3fff && parts[1] < 0x1000);
  const teredo = parts[0] === 0x2001 && parts[1] === 0;
  const sixToFour = parts[0] === 0x2002;
  const benchmarking =
    parts[0] === 0x2001 && parts[1] === 2 && parts[2] === 0;
  const orchid =
    parts[0] === 0x2001 &&
    ((parts[1] & 0xfff0) === 0x10 || (parts[1] & 0xfff0) === 0x20);
  return globallyRoutable && !documentation && !teredo && !sixToFour && !benchmarking && !orchid;
}

function isPublicAddress(address, family) {
  return family === 4 || isIP(address) === 4
    ? isPublicIpv4(address)
    : family === 6 || isIP(address) === 6
      ? isPublicIpv6(address)
      : false;
}

function hostnameWithoutBrackets(hostname) {
  return String(hostname || "").replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

async function withTimeout(promise, timeoutMs, message) {
  let timeout;
  try {
    return await Promise.race([
      promise,
      new Promise((_resolve, reject) => {
        timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
      })
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveCalendarHost(url, timeoutMs = DNS_TIMEOUT_MS) {
  const hostname = hostnameWithoutBrackets(url.hostname);
  const normalizedHostname = hostname.toLowerCase();
  if (!hostname) {
    throw new Error("Calendar URL must include a hostname.");
  }
  if (
    !privateNetworksAllowed() &&
    (normalizedHostname === "localhost" || normalizedHostname.endsWith(".localhost"))
  ) {
    throw new Error(
      `Calendar URL resolves to a private network. Set ${PRIVATE_NETWORK_ENV}=true only on a trusted server to allow it.`
    );
  }

  const literalFamily = isIP(hostname);
  const results = literalFamily
    ? [{ address: hostname, family: literalFamily }]
    : await withTimeout(
        dnsLookup(hostname, { all: true, verbatim: true }),
        Math.min(DNS_TIMEOUT_MS, timeoutMs),
        "Calendar hostname lookup timed out."
      );
  if (!results.length) {
    throw new Error("Calendar hostname did not resolve to an address.");
  }
  if (!privateNetworksAllowed()) {
    const blocked = results.find((result) => !isPublicAddress(result.address, result.family));
    if (blocked) {
      throw new Error(
        `Calendar URL resolves to a private or non-routable address. Set ${PRIVATE_NETWORK_ENV}=true only on a trusted server to allow it.`
      );
    }
  }
  return {
    hostname,
    addresses: [...results].sort((left, right) => Number(left.family) - Number(right.family))
  };
}

function pinnedLookup(address, family) {
  return (_hostname, options, callback) => {
    const done = typeof options === "function" ? options : callback;
    const lookupOptions = typeof options === "object" && options ? options : {};
    if (lookupOptions.all) {
      done(null, [{ address, family }]);
    } else {
      done(null, address, family);
    }
  };
}

function headerValue(headers, name) {
  const value = headers[String(name).toLowerCase()];
  return Array.isArray(value) ? value[0] : String(value || "");
}

function requestPinned(url, resolved, { method, headers, body, maxBytes, timeoutMs }) {
  const request = url.protocol === "https:" ? httpsRequest : httpRequest;
  const address = resolved.address;
  const family = resolved.family;
  const requestHeaders = { ...headers };
  if (body !== undefined && body !== null) {
    const hasLength = Object.keys(requestHeaders).some(
      (name) => name.toLowerCase() === "content-length"
    );
    if (!hasLength) {
      requestHeaders["Content-Length"] = Buffer.byteLength(body);
    }
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let timeout;
    const finish = (callback, value) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeout);
      callback(value);
    };
    const fail = (error) => finish(reject, error);
    const requestOptions = {
      protocol: url.protocol,
      hostname: resolved.hostname,
      port: url.port || undefined,
      path: `${url.pathname}${url.search}`,
      method,
      headers: requestHeaders,
      agent: false,
      family,
      lookup: pinnedLookup(address, family)
    };
    if (url.protocol === "https:" && isIP(resolved.hostname) === 0) {
      requestOptions.servername = resolved.hostname;
    }

    const outgoing = request(requestOptions, (incoming) => {
      const status = Number(incoming.statusCode) || 0;
      const location = headerValue(incoming.headers, "location");
      if ([301, 302, 303, 307, 308].includes(status) && location) {
        incoming.resume();
        finish(resolve, { status, headers: incoming.headers, text: "" });
        return;
      }

      const declared = Number(headerValue(incoming.headers, "content-length"));
      if (Number.isFinite(declared) && declared > maxBytes) {
        incoming.destroy();
        fail(new Error("Calendar response exceeds the 5 MB limit."));
        return;
      }
      const chunks = [];
      let length = 0;
      incoming.on("data", (chunk) => {
        if (settled) {
          return;
        }
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        length += bytes.byteLength;
        if (length > maxBytes) {
          incoming.destroy();
          fail(new Error("Calendar response exceeds the 5 MB limit."));
          return;
        }
        chunks.push(bytes);
      });
      incoming.on("end", () => {
        finish(resolve, {
          status,
          headers: incoming.headers,
          text: Buffer.concat(chunks, length).toString("utf8")
        });
      });
      incoming.on("error", fail);
    });
    outgoing.on("error", fail);
    timeout = setTimeout(
      () => outgoing.destroy(new Error("Calendar request timed out.")),
      timeoutMs
    );
    if (body !== undefined && body !== null) {
      outgoing.write(body);
    }
    outgoing.end();
  });
}

async function requestCalendarUrl({
  url,
  allowHttp,
  method = "GET",
  headers = {},
  body,
  followRedirects = true,
  maxBytes = DEFAULT_MAX_BYTES
}) {
  let currentUrl = new URL(normalizeFeedUrl(url, { allowHttp }));
  let currentMethod = method;
  let currentBody = body;
  let currentHeaders = { ...headers };
  const deadline = Date.now() + REQUEST_TIMEOUT_MS;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
    const remainingBeforeLookup = deadline - Date.now();
    if (remainingBeforeLookup <= 0) {
      throw new Error("Calendar request timed out.");
    }
    const { hostname, addresses } = await resolveCalendarHost(currentUrl, remainingBeforeLookup);
    let response;
    let connectionError;
    for (const address of addresses) {
      try {
        response = await requestPinned(
          currentUrl,
          { hostname, ...address },
          {
            method: currentMethod,
            headers: currentHeaders,
            body: currentBody,
            maxBytes,
            timeoutMs: Math.max(1, deadline - Date.now())
          }
        );
        break;
      } catch (error) {
        connectionError = error;
      }
    }
    if (!response) {
      throw connectionError || new Error("Calendar host could not be reached.");
    }
    const location = headerValue(response.headers, "location");
    const redirect = [301, 302, 303, 307, 308].includes(response.status) && location;
    if (!redirect) {
      return response;
    }
    if (!followRedirects) {
      throw new Error("Calendar request refused a redirect because credentials were present.");
    }
    if (redirectCount >= MAX_REDIRECTS) {
      throw new Error(`Calendar request exceeded ${MAX_REDIRECTS} redirects.`);
    }

    const nextUrl = new URL(
      normalizeFeedUrl(new URL(location, currentUrl).toString(), { allowHttp })
    );
    const sameOrigin = nextUrl.origin === currentUrl.origin;
    if (!sameOrigin) {
      currentHeaders = Object.fromEntries(
        Object.entries(currentHeaders).filter(([name]) => name.toLowerCase() !== "authorization")
      );
    }
    if (response.status === 303 || ([301, 302].includes(response.status) && currentMethod !== "GET")) {
      currentMethod = "GET";
      currentBody = undefined;
      currentHeaders = Object.fromEntries(
        Object.entries(currentHeaders).filter(
          ([name]) => !["content-length", "content-type"].includes(name.toLowerCase())
        )
      );
    }
    currentUrl = nextUrl;
  }
  throw new Error(`Calendar request exceeded ${MAX_REDIRECTS} redirects.`);
}

function responseError(response, label) {
  const concise = response.text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  return `${label} failed with ${response.status}${concise ? `: ${concise}` : ""}`;
}

export async function fetchCalendarFeed({
  feedUrl,
  username = "",
  password = "",
  allowHttp = false
}) {
  const effectiveAllowHttp = Boolean(allowHttp && insecureHttpAllowed());
  const url = normalizeFeedUrl(feedUrl, { allowHttp: effectiveAllowHttp });
  const hasCredentials = Boolean(username || password);
  if (hasCredentials && (!username || !password)) {
    throw new Error("Both calendar username and app password are required.");
  }
  const headers = {
    Accept: "text/calendar,text/plain;q=0.9,*/*;q=0.1",
    "User-Agent": USER_AGENT
  };
  if (hasCredentials) {
    headers.Authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
  }
  const response = await requestCalendarUrl({
    url,
    allowHttp: effectiveAllowHttp,
    headers,
    followRedirects: !hasCredentials
  });
  if (response.status < 200 || response.status >= 300) {
    throw new Error(await responseError(response, "Calendar feed request"));
  }
  return response.text;
}

function xmlDecode(value) {
  return String(value || "")
    .replace(/^<!\[CDATA\[|\]\]>$/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&");
}

function basicUtc(value) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export async function fetchCalDavCalendar({
  calendarUrl,
  username,
  appPassword,
  from,
  to,
  allowHttp = false
}) {
  const effectiveAllowHttp = Boolean(allowHttp && insecureHttpAllowed());
  const url = normalizeFeedUrl(calendarUrl, { allowHttp: effectiveAllowHttp });
  if (!username || !appPassword) {
    throw new Error("CalDAV username and password are required.");
  }
  const body = `<?xml version="1.0" encoding="utf-8" ?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop><d:getetag/><c:calendar-data/></d:prop>
  <c:filter><c:comp-filter name="VCALENDAR"><c:comp-filter name="VEVENT">
    <c:time-range start="${basicUtc(from)}" end="${basicUtc(to)}"/>
  </c:comp-filter></c:comp-filter></c:filter>
</c:calendar-query>`;
  const response = await requestCalendarUrl({
    url,
    allowHttp: effectiveAllowHttp,
    method: "REPORT",
    followRedirects: false,
    headers: {
      Accept: "application/xml,text/xml",
      Authorization: `Basic ${Buffer.from(`${username}:${appPassword}`).toString("base64")}`,
      "Content-Type": "application/xml; charset=utf-8",
      Depth: "1",
      "User-Agent": USER_AGENT
    },
    body
  });
  if (response.status < 200 || response.status >= 300) {
    throw new Error(await responseError(response, "CalDAV request"));
  }
  const xml = response.text;
  const calendars = Array.from(
    xml.matchAll(/<(?:[\w.-]+:)?calendar-data\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?calendar-data>/gi),
    (match) => xmlDecode(match[1].trim())
  ).filter(Boolean);
  return calendars;
}

function unfoldIcalendar(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n[ \t]/g, "");
}

function unescapeIcalendarText(value) {
  return String(value || "")
    .replace(/\\([nN,;\\])/g, (_match, escaped) =>
      escaped.toLowerCase() === "n" ? "\n" : escaped
    )
    .trim();
}

function calendarProperty(text, names) {
  const wanted = new Set(names.map((name) => name.toUpperCase()));
  const components = [];
  for (const line of unfoldIcalendar(text).split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 0) {
      continue;
    }
    const property = line.slice(0, separator).split(";", 1)[0].trim().toUpperCase();
    const value = line.slice(separator + 1);
    if (property === "BEGIN") {
      components.push(value.trim().toUpperCase());
      continue;
    }
    if (property === "END") {
      components.pop();
      continue;
    }
    if (components.length === 1 && components[0] === "VCALENDAR" && wanted.has(property)) {
      return unescapeIcalendarText(value);
    }
  }
  return "";
}

function parseLimit(value, fallback, maximum) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0
    ? Math.min(maximum, parsed)
    : fallback;
}

export function parseCalendarFeed(
  text,
  {
    from,
    to,
    timeZone,
    maxEvents = 500,
    sourceEventLimit = DEFAULT_SOURCE_EVENT_LIMIT,
    occurrenceLimit = DEFAULT_OCCURRENCE_LIMIT
  }
) {
  const source = String(text || "");
  const outputTimeZone = normalizeTimeZone(timeZone, "UTC");
  const events = parseICalendar(source, {
    rangeStart: from,
    rangeEndExclusive: to,
    timeZone: outputTimeZone,
    maxEvents: parseLimit(sourceEventLimit, DEFAULT_SOURCE_EVENT_LIMIT, 20_000),
    maxOccurrences: parseLimit(occurrenceLimit, DEFAULT_OCCURRENCE_LIMIT, 100_000)
  });
  const calendarName = calendarProperty(source, ["X-WR-CALNAME", "NAME"]);
  const declaredTimeZone = calendarProperty(source, ["X-WR-TIMEZONE"]);

  return {
    calendarName,
    calendarTimeZone: normalizeTimeZone(declaredTimeZone, outputTimeZone),
    events: events.slice(0, parseLimit(maxEvents, 500, DEFAULT_SOURCE_EVENT_LIMIT))
  };
}

export function buildSampleEvents(base, timeZone, definitions) {
  return definitions.map((definition, index) => {
    const day = addLocalDays(base, definition.dayOffset || 0, timeZone);
    const parts = dateParts(day, timeZone);
    if (definition.allDay) {
      const start = dateKey(day, timeZone);
      const end = dateKey(addLocalDays(day, definition.days || 1, timeZone), timeZone);
      return {
        id: `sample-${index + 1}`,
        title: definition.title,
        start: { date: start, timeZone },
        end: { date: end, timeZone },
        location: definition.location || ""
      };
    }
    const start = localDateTime(
      parts.year,
      parts.month - 1,
      parts.day,
      definition.hour || 0,
      definition.minute || 0,
      timeZone
    );
    const end = new Date(start.getTime() + (definition.duration || 60) * 60 * 1000);
    return {
      id: `sample-${index + 1}`,
      title: definition.title,
      start: { dateTime: start.toISOString(), timeZone },
      end: { dateTime: end.toISOString(), timeZone },
      location: definition.location || ""
    };
  });
}
