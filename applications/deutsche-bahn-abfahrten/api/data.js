const apiBaseUrl = "https://v6.db.transport.rest";
const fallbackBaseUrl = "https://dbf.finalrewind.org";
const primaryTimeoutMs = 3000;

const productNames = [
  "nationalExpress",
  "national",
  "regionalExpress",
  "regional",
  "suburban",
  "subway",
  "tram",
  "bus",
  "ferry",
  "taxi",
];

function stringOrDefault(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function integerInRange(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(number)));
}

function booleanOrDefault(value, fallback) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["1", "true", "yes", "on"].includes(value.toLowerCase())
      ? true
      : ["0", "false", "no", "off"].includes(value.toLowerCase())
        ? false
        : fallback;
  }

  return fallback;
}

function selectedProducts(value) {
  const selected = stringOrDefault(
    value,
    "nationalExpress,national,regionalExpress,regional,suburban,subway,tram,bus"
  )
    .split(",")
    .map((item) => item.trim())
    .filter((item) => productNames.includes(item));

  return new Set(selected.length ? selected : productNames);
}

async function fetchJson(baseUrl, path, searchParams = {}, options = {}) {
  const url = new URL(path, baseUrl);

  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  const controller = options.timeoutMs ? new AbortController() : null;
  const timeout = controller
    ? setTimeout(() => controller.abort(), options.timeoutMs)
    : null;

  let response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "paperlesspaper-openintegrations/0.1.0",
      },
      signal: controller?.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`${url.hostname} request timed out after ${options.timeoutMs}ms`);
    }

    throw error;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }

  if (!response.ok) {
    throw new Error(`${url.hostname} request failed with ${response.status}`);
  }

  return response.json();
}

function firstStop(value) {
  if (Array.isArray(value)) {
    return value[0];
  }

  if (Array.isArray(value?.stations)) {
    return value.stations[0];
  }

  if (Array.isArray(value?.stops)) {
    return value.stops[0];
  }

  if (Array.isArray(value?.locations)) {
    return value.locations[0];
  }

  return value && typeof value === "object" ? value : null;
}

async function findStation(stationName, stationId) {
  if (stationId) {
    return {
      id: stationId,
      name: stationName || stationId,
    };
  }

  const data = await fetchJson(
    apiBaseUrl,
    "/locations",
    {
      query: stationName,
      results: 5,
      addresses: false,
      poi: false,
      linesOfStops: false,
    },
    { timeoutMs: primaryTimeoutMs }
  );
  const station = firstStop(data);

  if (!station?.id) {
    throw new Error(`No Deutsche Bahn station found for "${stationName}"`);
  }

  return {
    id: station.id,
    name: station.name || stationName,
    products: station.products || {},
  };
}

function departureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (Array.isArray(value?.departures)) {
    return value.departures;
  }

  return [];
}

function productOf(departure) {
  return departure.line?.product || departure.line?.mode || "";
}

function lineName(departure) {
  return departure.line?.name || departure.line?.fahrtNr || departure.line?.id || "Train";
}

function platformChange(departure) {
  const planned = String(departure.plannedPlatform || "").trim();
  const current = String(departure.platform || "").trim();
  return Boolean(planned && current && planned !== current);
}

function minutesFromSeconds(value) {
  const seconds = Number(value);
  return Number.isFinite(seconds) ? Math.round(seconds / 60) : 0;
}

function statusLabel(departure) {
  if (departure.cancelled) {
    return "Cancelled";
  }

  const delay = minutesFromSeconds(departure.delay);
  if (delay > 0) {
    return `+${delay} min`;
  }

  if (delay < 0) {
    return `${delay} min`;
  }

  if (platformChange(departure)) {
    return "Platform changed";
  }

  return "On time";
}

function compactRemark(remark) {
  const text = remark?.text || remark?.summary || remark?.code || "";
  return String(text).replace(/\s+/g, " ").trim();
}

function shapeDeparture(departure) {
  const remarks = Array.isArray(departure.remarks)
    ? departure.remarks.map(compactRemark).filter(Boolean).slice(0, 2)
    : [];

  return {
    id: departure.tripId || `${lineName(departure)}-${departure.when || departure.plannedWhen}`,
    line: lineName(departure),
    product: productOf(departure),
    direction: departure.direction || departure.provenance || "",
    when: departure.when || departure.plannedWhen || "",
    plannedWhen: departure.plannedWhen || departure.when || "",
    delayMinutes: minutesFromSeconds(departure.delay),
    platform: departure.platform || departure.plannedPlatform || "",
    plannedPlatform: departure.plannedPlatform || departure.platform || "",
    platformChanged: platformChange(departure),
    cancelled: Boolean(departure.cancelled),
    status: statusLabel(departure),
    remarks,
  };
}

function productFromTrainClasses(classes) {
  const values = Array.isArray(classes) ? classes : [];

  if (values.includes("S")) {
    return "suburban";
  }

  if (values.includes("N")) {
    return "regionalExpress";
  }

  if (values.includes("D")) {
    return "regional";
  }

  if (values.includes("F")) {
    return "nationalExpress";
  }

  return "regional";
}

// DBF's IRIS API returns German wall-clock times without a date or offset.
// Resolve them in Europe/Berlin, independently of the server/display timezone.
function localDateTimeFromClock(clock, now, delayMinutes = 0) {
  const match = String(clock || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return "";

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  });
  const parts = (time) => Object.fromEntries(
    formatter.formatToParts(time).map(({ type, value }) => [type, value])
  );
  const today = parts(now);
  const localMidnight = Date.UTC(Number(today.year), Number(today.month) - 1, Number(today.day));
  const candidates = [];
  for (const day of [-1, 0, 1]) {
    const wallTime = localMidnight + day * 86400000 + Number(match[1]) * 3600000 + Number(match[2]) * 60000;
    // Berlin uses UTC+1 or UTC+2; round-trip validation handles DST transitions.
    for (const offset of [1, 2]) {
      const candidate = wallTime - offset * 3600000;
      const local = parts(candidate);
      const roundTrip = Date.UTC(Number(local.year), Number(local.month) - 1,
        Number(local.day), Number(local.hour), Number(local.minute));
      if (roundTrip === wallTime) candidates.push(candidate);
    }
  }
  // Include the delay when choosing the day, including departures across midnight.
  candidates.sort((a, b) => Math.abs(a + delayMinutes * 60000 - now)
    - Math.abs(b + delayMinutes * 60000 - now));
  return candidates.length ? new Date(candidates[0]).toISOString() : "";
}

function upcomingDepartures(departures, { now, duration, limit, products, showCancelled }) {
  return departures
    .filter((departure) => products.has(departure.product))
    .filter((departure) => showCancelled || !departure.cancelled)
    .filter((departure) => {
      const when = Date.parse(departure.when);
      return Number.isFinite(when) && when >= now && when <= now + duration * 60000;
    })
    .sort((a, b) => Date.parse(a.when) - Date.parse(b.when))
    .slice(0, limit);
}

function addMinutes(isoDate, minutes) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Date(date.getTime() + minutes * 60000).toISOString();
}

function compactFallbackRemark(message) {
  return String(message?.text || "").replace(/\s+/g, " ").trim();
}

function compactTrainName(value) {
  return String(value || "Train")
    .replace(/^S\s+(S\d+)/, "$1")
    .replace(/^RE\s+(RE\d+)/, "$1")
    .replace(/^RB\s+(RB\d+)/, "$1")
    .replace(/^OE\s+(RE\d+)/, "$1")
    .trim();
}

function shapeFallbackDeparture(departure, now) {
  const delayMinutes = Number(departure.delayDeparture);
  const safeDelay = Number.isFinite(delayMinutes) ? delayMinutes : 0;
  const plannedWhen = localDateTimeFromClock(departure.scheduledDeparture, now, safeDelay);
  const remarks = []
    .concat(departure.messages?.delay || [])
    .concat(departure.messages?.qos || [])
    .map(compactFallbackRemark)
    .filter(Boolean)
    .slice(0, 2);
  const platform = String(departure.platform || "").trim();
  const plannedPlatform = String(departure.scheduledPlatform || "").trim();

  return {
    id: `${departure.train || "Train"}-${departure.trainNumber || ""}-${plannedWhen}`,
    line: compactTrainName(departure.train),
    product: productFromTrainClasses(departure.trainClasses),
    direction: departure.destination || "",
    when: addMinutes(plannedWhen, safeDelay),
    plannedWhen,
    delayMinutes: safeDelay,
    platform: platform || plannedPlatform,
    plannedPlatform: plannedPlatform || platform,
    platformChanged: Boolean(platform && plannedPlatform && platform !== plannedPlatform),
    cancelled: Boolean(departure.isCancelled),
    status: departure.isCancelled
      ? "Cancelled"
      : safeDelay > 0
        ? `+${safeDelay} min`
        : safeDelay < 0
          ? `${safeDelay} min`
          : platform && plannedPlatform && platform !== plannedPlatform
            ? "Platform changed"
            : "On time",
    remarks,
  };
}

function stationFromName(stationName, stationId) {
  return {
    id: stationId || stationName,
    name: stationName,
  };
}

async function fetchPrimaryDepartures(request) {
  const { duration, locale, products, stationId, stationName, destination, now } = request;
  const station = await findStation(stationName, stationId);
  const target = destination ? await findStation(destination, "") : null;

  const data = await fetchJson(
    apiBaseUrl,
    `/stops/${encodeURIComponent(station.id)}/departures`,
    {
      duration,
      when: new Date(now).toISOString(),
      direction: target?.id,
      ...Object.fromEntries(productNames.map((product) => [product, products.has(product)])),
      linesOfStops: false,
      remarks: true,
      language: locale.slice(0, 2),
    },
    { timeoutMs: primaryTimeoutMs }
  );

  const departures = upcomingDepartures(departureArray(data).map(shapeDeparture), request);

  return {
    source: "v6.db.transport.rest",
    station,
    duration,
    departures,
    updatedAt: new Date().toISOString(),
    realtimeDataUpdatedAt: data?.realtimeDataUpdatedAt || null,
  };
}

async function fetchFallbackDepartures(request) {
  const { duration, stationId, stationName, destination, now } = request;
  const data = await fetchJson(
    fallbackBaseUrl,
    `/${encodeURIComponent(stationId || stationName)}.json`,
    {
      version: 3,
      // DBF accepts a regex; escape it so the setting is literal station text.
      via: destination.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/,/g, "\\x2c"),
    }
  );
  const departures = upcomingDepartures(
    (Array.isArray(data?.departures) ? data.departures : [])
      .filter((departure) => departure.scheduledDeparture)
      .map((departure) => shapeFallbackDeparture(departure, now)),
    request
  );

  return {
    source: "dbf.finalrewind.org",
    station: stationFromName(stationName, stationId),
    duration,
    departures,
    updatedAt: new Date().toISOString(),
    realtimeDataUpdatedAt: null,
  };
}

export default async function handler({ query }) {
  const stationName = stringOrDefault(query.stationName, "Berlin Hbf");
  const stationId = stringOrDefault(query.stationId, "");
  const duration = integerInRange(query.duration, 90, 10, 360);
  const limit = integerInRange(query.limit, 7, 1, 14);
  const products = selectedProducts(query.products);
  const showCancelled = booleanOrDefault(query.showCancelled, true);
  const locale = stringOrDefault(query.locale, "de-DE");
  const request = {
    now: Date.now(),
    destination: stringOrDefault(query.destination, ""),
    duration,
    limit,
    locale,
    products,
    showCancelled,
    stationId,
    stationName,
  };

  try {
    return await fetchPrimaryDepartures(request);
  } catch (error) {
    const fallback = await fetchFallbackDepartures(request);
    return {
      ...fallback,
      primaryError: error instanceof Error ? error.message : String(error),
    };
  }
}
