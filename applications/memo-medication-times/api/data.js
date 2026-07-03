const userAgent = "paperlesspaper-openintegrations/0.1.0 memo-medication-times";

function firstQueryValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function stringValue(value) {
  return String(firstQueryValue(value) || "").trim();
}

function settingOrEnv(value, envName) {
  return stringValue(value) || stringValue(process.env[envName]);
}

function memoApiKey(value) {
  return (
    stringValue(value) ||
    stringValue(process.env.MEMO_API_API_KEY) ||
    stringValue(process.env.MEMO_API_KEY) ||
    stringValue(process.env.PAPERLESSPAPER_API_KEY)
  );
}

function booleanSetting(query, key, fallback = false) {
  const value = firstQueryValue(query[key]);
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function numberSetting(query, key, fallback, { min = -Infinity, max = Infinity } = {}) {
  const number = Number(firstQueryValue(query[key]));
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, number));
}

function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function compactParts(parts) {
  return parts.map((part) => stringValue(part)).filter(Boolean);
}

function firstString(...values) {
  return compactParts(values)[0] || "";
}

function hexColor(value) {
  const raw = stringValue(value);
  if (/^#[0-9a-f]{3,8}$/i.test(raw)) {
    return raw;
  }
  if (/^[0-9a-f]{3,8}$/i.test(raw)) {
    return `#${raw}`;
  }
  return "";
}

function normalizeMemoBaseUrl(input) {
  const raw = stringValue(input);
  if (!raw) {
    throw new Error("Memo API base URL is required. Set apiBaseUrl or MEMO_API_BASE_URL.");
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Memo API base URL must be a valid http(s) URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Memo API base URL must use http or https.");
  }

  url.hash = "";
  url.search = "";

  const cleanPath = url.pathname.replace(/\/+$/, "");
  url.pathname = cleanPath.endsWith("/v1") ? cleanPath : `${cleanPath || ""}/v1`;

  return url.toString().replace(/\/+$/, "");
}

function endpointUrl(baseUrl, path, params = {}) {
  const url = new URL(`${baseUrl}${path.startsWith("/") ? path : `/${path}`}`);
  for (const [key, value] of Object.entries(params)) {
    const text = stringValue(value);
    if (text) {
      url.searchParams.set(key, text);
    }
  }
  return url;
}

function timeoutSignal(ms) {
  return typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
    ? AbortSignal.timeout(ms)
    : undefined;
}

async function readError(response) {
  const text = await response.text().catch(() => "");
  if (!text) {
    return `Memo API request failed with ${response.status}`;
  }

  try {
    const parsed = JSON.parse(text);
    return parsed.message || parsed.error || text.slice(0, 240);
  } catch {
    return text.slice(0, 240);
  }
}

async function fetchMemoJson(baseUrl, path, apiKey, params = {}) {
  const key = stringValue(apiKey);
  if (!key) {
    throw new Error("Memo API key is required. Set apiKey, MEMO_API_API_KEY, MEMO_API_KEY, or PAPERLESSPAPER_API_KEY.");
  }

  const response = await fetch(endpointUrl(baseUrl, path, params), {
    method: "GET",
    cache: "no-store",
    signal: timeoutSignal(20_000),
    headers: {
      accept: "application/json",
      "user-agent": userAgent,
      "x-api-key": key,
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

function unwrapResults(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  return [];
}

function validDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function intakeStatusValue(entry) {
  return stringValue(record(entry.intake).status || entry.intakeStatus || entry.status).toLowerCase();
}

function isTakenStatus(status) {
  return ["taken", "done", "completed", "confirmed"].includes(stringValue(status).toLowerCase());
}

function medicationNameFromCalendar(entry) {
  const localMedication = record(entry.localMedicationData);
  const localMeta = record(localMedication.meta);
  const medicationData = record(entry.medicationData);
  const medicationMeta = record(medicationData.meta);
  const entryMeta = record(entry.meta);

  return firstString(
    entry.name,
    entry.title,
    entryMeta.medicationName,
    entryMeta.name,
    localMeta.name,
    localMeta.medicationName,
    localMedication.name,
    localMedication.title,
    medicationMeta.name,
    medicationMeta.medicationName,
    medicationData.name,
    medicationData.title,
    medicationData.productName,
    medicationData.PRODUKTNAME,
    entry.abdaMedication,
  );
}

function dosageFormFromCalendar(entry) {
  const localMedication = record(entry.localMedicationData);
  const localMeta = record(localMedication.meta);
  const medicationData = record(entry.medicationData);
  const medicationMeta = record(medicationData.meta);
  const entryMeta = record(entry.meta);

  return firstString(
    entryMeta.dosageFormText,
    entryMeta.dosageForm,
    localMeta.dosageFormText,
    localMeta.dosageForm,
    medicationMeta.dosageFormText,
    medicationMeta.dosageForm,
    medicationData.dosageForm,
    medicationData.darreichungsform,
  );
}

function medicationColorFromCalendar(entry) {
  const localMedication = record(entry.localMedicationData);
  const localMeta = record(localMedication.meta);
  const medicationData = record(entry.medicationData);
  const medicationMeta = record(medicationData.meta);
  const entryMeta = record(entry.meta);

  return hexColor(
    firstString(
      localMeta.color,
      medicationMeta.color,
      entryMeta.medicationColor,
      entryMeta.color,
      localMedication.color,
      medicationData.color,
    ),
  );
}

function shapeCalendarEntry(entry) {
  const date = validDate(entry.date || entry.intakeTime || record(entry.intake).time);
  if (!date) {
    return null;
  }

  const intake = record(entry.intake);
  const status = intakeStatusValue(entry);
  const medicationName = medicationNameFromCalendar(entry) || "Medication";
  const dosageForm = dosageFormFromCalendar(entry);

  return {
    id: stringValue(entry.id || entry._id),
    source: "calendar",
    date: date.toISOString(),
    medicationName,
    medicationSubtitle: dosageForm,
    medicationColor: medicationColorFromCalendar(entry),
    amount: entry.amount ?? "",
    unit: stringValue(entry.unit || record(entry.meta).unit),
    instruction: stringValue(entry.instruction || record(entry.meta).instruction),
    emptyStomach: entry.emptyStomach === true,
    timeCategory: stringValue(entry.timeCategory),
    caseNumber: stringValue(entry.caseNumber),
    intakeStatus: status,
    takenAt: validDate(intake.time)?.toISOString() || "",
    isTaken: isTakenStatus(status),
    bake: entry.bake === true,
  };
}

function parseSettings(query) {
  return {
    apiBaseUrl: settingOrEnv(query.apiBaseUrl, "MEMO_API_BASE_URL"),
    apiKey: memoApiKey(query.apiKey),
    patientId: settingOrEnv(query.patientId, "MEMO_PATIENT_ID"),
    organizationId: settingOrEnv(query.organizationId, "MEMO_ORGANIZATION_ID"),
    timezone: stringValue(query.timezone) || "Europe/Berlin",
    lookaheadDays: numberSetting(query, "lookaheadDays", 7, { min: 1, max: 60 }),
    maxEntries: numberSetting(query, "maxEntries", 6, { min: 1, max: 20 }),
    intakeWindowMinutes: numberSetting(query, "intakeWindowMinutes", 20, { min: 1, max: 240 }),
    showTakenEntries: booleanSetting(query, "showTakenEntries", false),
    forceSample: booleanSetting(query, "forceSample", false),
    sampleMode: stringValue(query.sampleMode) || "schedule",
  };
}

function nextSampleDate(now, hour, minute) {
  const date = new Date(now);
  date.setHours(hour, minute, 0, 0);
  if (date.getTime() <= now.getTime()) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

function sampleEntries(settings) {
  const now = new Date();
  const alertMode = settings.sampleMode === "alert";
  const current = alertMode ? new Date(now) : nextSampleDate(now, 8, 0);
  current.setSeconds(0, 0);

  return [
    {
      id: "sample-current",
      source: "sample",
      date: current.toISOString(),
      medicationName: "Tabletten",
      medicationSubtitle: "",
      medicationColor: "#1AD086",
      amount: 1,
      unit: "St",
      instruction: "",
      emptyStomach: false,
      timeCategory: "morning",
      caseNumber: "1",
      intakeStatus: "",
      takenAt: "",
      isTaken: false,
      bake: true,
    },
    {
      id: "sample-noon",
      source: "sample",
      date: nextSampleDate(now, 13, 30).toISOString(),
      medicationName: "Tabletten",
      medicationSubtitle: "",
      medicationColor: "#91D2FA",
      amount: 1,
      unit: "St",
      instruction: "",
      emptyStomach: false,
      timeCategory: "noon",
      caseNumber: "2",
      intakeStatus: "",
      takenAt: "",
      isTaken: false,
      bake: true,
    },
    {
      id: "sample-evening",
      source: "sample",
      date: nextSampleDate(now, 19, 30).toISOString(),
      medicationName: "Tabletten",
      medicationSubtitle: "",
      medicationColor: "#E9244F",
      amount: 1,
      unit: "St",
      instruction: "",
      emptyStomach: false,
      timeCategory: "night",
      caseNumber: "3",
      intakeStatus: "",
      takenAt: "",
      isTaken: false,
      bake: true,
    },
  ];
}

function currentWindowContains(entry, now, windowMinutes) {
  const date = validDate(entry.date);
  if (!date) {
    return false;
  }
  const delta = Math.abs(date.getTime() - now.getTime());
  return delta <= windowMinutes * 60 * 1000;
}

function summarize(settings, entries, source) {
  const now = new Date();
  const lowerBound = new Date(now.getTime() - settings.intakeWindowMinutes * 60 * 1000);
  const upperBound = new Date(now.getTime() + settings.lookaheadDays * 24 * 60 * 60 * 1000);

  const visibleEntries = entries
    .filter((entry) => validDate(entry.date))
    .filter((entry) => settings.showTakenEntries || !entry.isTaken)
    .filter((entry) => {
      const date = validDate(entry.date);
      return date >= lowerBound && date <= upperBound;
    })
    .sort((a, b) => validDate(a.date).getTime() - validDate(b.date).getTime());

  const currentEntries = visibleEntries.filter(
    (entry) => !entry.isTaken && currentWindowContains(entry, now, settings.intakeWindowMinutes),
  );

  return {
    source,
    timezone: settings.timezone,
    now: now.toISOString(),
    updatedAt: now.toISOString(),
    totalResults: entries.length,
    entries: visibleEntries.slice(0, settings.maxEntries),
    currentEntries,
  };
}

async function readCalendarEntries(baseUrl, settings) {
  const payload = await fetchMemoJson(baseUrl, "/calendars", settings.apiKey, {
    patient: settings.patientId,
    limit: 10000,
    sortBy: "date:asc",
  });

  return unwrapResults(payload)
    .map(shapeCalendarEntry)
    .filter(Boolean)
    .filter((entry) => entry.bake);
}

export default async function handler({ query }) {
  const settings = parseSettings(query);

  if (settings.forceSample) {
    return summarize(settings, sampleEntries(settings), "sample");
  }

  const baseUrl = normalizeMemoBaseUrl(settings.apiBaseUrl);
  if (!settings.patientId) {
    throw new Error("Set patientId to load baked calendar medication intake times.");
  }

  const entries = await readCalendarEntries(baseUrl, settings);
  return summarize(settings, entries, "baked-calendar");
}
