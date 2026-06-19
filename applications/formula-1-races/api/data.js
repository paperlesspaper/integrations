const scheduleApiUrl = "https://api.jolpi.ca/ergast/f1/current.json";
const wikipediaSummaryBase = "https://en.wikipedia.org/api/rest_v1/page/summary/";

const sessionFields = [
  ["FirstPractice", "FP1"],
  ["SecondPractice", "FP2"],
  ["ThirdPractice", "FP3"],
  ["SprintQualifying", "Sprint Quali"],
  ["Sprint", "Sprint"],
  ["Qualifying", "Qualifying"],
];

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "paperlesspaper-openintegrations/0.1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Formula 1 request failed with ${response.status}`);
  }

  return response.json();
}

function toNonNegativeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

function toPositiveInteger(value, fallback = 1) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function toDateTime(date, time) {
  if (!date) {
    return "";
  }

  return `${date}T${time || "00:00:00Z"}`;
}

function dateTimeMs(date, time) {
  const value = Date.parse(toDateTime(date, time));
  return Number.isFinite(value) ? value : 0;
}

function wikipediaTitleFromUrl(value) {
  try {
    const url = new URL(value);
    const marker = "/wiki/";
    const index = url.pathname.indexOf(marker);
    if (index === -1) {
      return "";
    }

    return decodeURIComponent(url.pathname.slice(index + marker.length));
  } catch {
    return "";
  }
}

async function circuitSummary(circuitUrl) {
  const title = wikipediaTitleFromUrl(circuitUrl);
  if (!title) {
    return {};
  }

  try {
    const data = await fetchJson(`${wikipediaSummaryBase}${encodeURIComponent(title)}`);
    return {
      description: data.description || "",
      extract: data.extract || "",
      image: data.originalimage?.source || data.thumbnail?.source || "",
      page: data.content_urls?.desktop?.page || circuitUrl,
    };
  } catch {
    return {};
  }
}

function shapeSession(label, value) {
  if (!value?.date) {
    return null;
  }

  return {
    label,
    date: value.date,
    time: value.time || "",
    startsAt: toDateTime(value.date, value.time),
  };
}

function shapeRaceSession(race) {
  return {
    label: "Race",
    date: race.date,
    time: race.time || "",
    startsAt: toDateTime(race.date, race.time),
  };
}

function shapeSessions(race) {
  return sessionFields
    .map(([field, label]) => shapeSession(label, race[field]))
    .concat(shapeRaceSession(race))
    .filter(Boolean)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

function raceStartMs(race) {
  return dateTimeMs(race.date, race.time);
}

function findUpcomingIndex(races, nowMs) {
  const raceWindowMs = 4 * 60 * 60 * 1000;
  const index = races.findIndex((race) => raceStartMs(race) + raceWindowMs >= nowMs);
  return index === -1 ? Math.max(0, races.length - 1) : index;
}

function compactRace(race) {
  const location = race.Circuit?.Location || {};

  return {
    round: Number(race.round),
    raceName: race.raceName,
    circuitName: race.Circuit?.circuitName || "",
    locality: location.locality || "",
    country: location.country || "",
    startsAt: toDateTime(race.date, race.time),
  };
}

function localDayNumber(value, timeZone) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

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

function daysUntil(startsAt, nowMs, timeZone) {
  const startDay = localDayNumber(startsAt, timeZone);
  const nowDay = localDayNumber(nowMs, timeZone);

  if (startDay === null || nowDay === null) {
    return null;
  }

  return Math.max(0, startDay - nowDay);
}

function statusLabel(days) {
  if (days === null) {
    return "";
  }

  if (days === 0) {
    return "Race day";
  }

  if (days === 1) {
    return "Tomorrow";
  }

  return `In ${days} days`;
}

export default async function handler({ query }) {
  const schedule = await fetchJson(scheduleApiUrl);
  const races = schedule?.MRData?.RaceTable?.Races || [];

  if (!Array.isArray(races) || races.length === 0) {
    throw new Error("No Formula 1 races found");
  }

  const nowValue = typeof query.now === "string" ? Date.parse(query.now) : NaN;
  const nowMs = Number.isFinite(nowValue) ? nowValue : Date.now();
  const selection = typeof query.selection === "string" ? query.selection : "upcoming";
  const timeZone = typeof query.timeZone === "string" && query.timeZone.trim()
    ? query.timeZone.trim()
    : "Europe/Berlin";
  const round = toPositiveInteger(query.round, 1);
  const offset = toNonNegativeInteger(query.offset, 0);

  let raceIndex = findUpcomingIndex(races, nowMs) + offset;
  if (selection === "round") {
    const explicitIndex = races.findIndex((race) => Number(race.round) === round);
    raceIndex = explicitIndex === -1 ? 0 : explicitIndex;
  }

  raceIndex = Math.min(Math.max(raceIndex, 0), races.length - 1);
  const race = races[raceIndex];
  const circuit = race.Circuit || {};
  const location = circuit.Location || {};
  const summary = await circuitSummary(circuit.url);
  const startsAt = toDateTime(race.date, race.time);
  const days = daysUntil(startsAt, nowMs, timeZone);

  return {
    source: "Jolpica F1 API",
    season: schedule.MRData?.RaceTable?.season || race.season,
    totalRounds: Number(schedule.MRData?.total || races.length),
    round: Number(race.round),
    raceName: race.raceName,
    raceUrl: race.url,
    date: race.date,
    time: race.time || "",
    startsAt,
    status: statusLabel(days),
    daysUntil: days,
    circuit: {
      id: circuit.circuitId || "",
      name: circuit.circuitName || "",
      url: summary.page || circuit.url || "",
      description: summary.description || "",
      extract: summary.extract || "",
      image: summary.image || "",
      locality: location.locality || "",
      country: location.country || "",
      latitude: Number(location.lat),
      longitude: Number(location.long),
    },
    sessions: shapeSessions(race),
    following: races.slice(raceIndex + 1, raceIndex + 4).map(compactRace),
    updatedAt: new Date().toISOString(),
  };
}
