const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const validActivityTypes = new Set(["swim", "ride", "run"]);

function asString(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function splitList(value) {
  if (Array.isArray(value)) {
    return value.flatMap(splitList);
  }

  return asString(value)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeActivityTypes(value) {
  const selected = [...new Set(splitList(value))].filter((item) => validActivityTypes.has(item));
  return (selected.length ? selected : ["swim", "ride", "run"]).slice(0, 3);
}

function normalizeSettings(query) {
  return {
    clientId: asString(query.clientId || process.env.STRAVA_CLIENT_ID),
    clientSecret: asString(query.clientSecret || process.env.STRAVA_CLIENT_SECRET),
    accessToken: asString(query.accessToken || process.env.STRAVA_ACCESS_TOKEN),
    refreshToken: asString(query.refreshToken || process.env.STRAVA_REFRESH_TOKEN),
    expiresAt: asNumber(query.expiresAt || process.env.STRAVA_EXPIRES_AT),
    athleteId: asString(query.athleteId || process.env.STRAVA_ATHLETE_ID),
    athleteName: asString(query.athleteName),
    activityTypes: normalizeActivityTypes(query.activityTypes),
    units: asString(query.units, "metric").toLowerCase() === "imperial" ? "imperial" : "metric",
  };
}

function timeoutSignal(milliseconds = 12_000) {
  return AbortSignal.timeout(milliseconds);
}

async function responseMessage(response, fallback) {
  const body = await response.json().catch(() => ({}));
  const message = asString(body?.message || body?.error || body?.errors?.[0]?.message);
  return message || fallback;
}

async function refreshAccessToken(settings) {
  if (!settings.clientId || !settings.clientSecret || !settings.refreshToken) {
    throw new Error("The Strava connection has expired. Open settings and connect Strava again.");
  }

  const body = new URLSearchParams({
    client_id: settings.clientId,
    client_secret: settings.clientSecret,
    grant_type: "refresh_token",
    refresh_token: settings.refreshToken,
  });
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "paperlesspaper-strava-dashboard/0.2.0",
    },
    body,
    signal: timeoutSignal(),
  });

  if (!response.ok) {
    throw new Error(await responseMessage(response, `Strava token refresh failed with ${response.status}.`));
  }

  const token = await response.json();
  if (!token?.access_token || !token?.refresh_token || !Number.isFinite(Number(token?.expires_at))) {
    throw new Error("Strava returned an incomplete token response.");
  }

  return {
    accessToken: asString(token.access_token),
    refreshToken: asString(token.refresh_token),
    expiresAt: Number(token.expires_at),
  };
}

async function resolveToken(settings) {
  const now = Math.floor(Date.now() / 1000);
  const shouldRefresh =
    !settings.accessToken ||
    (settings.expiresAt > 0 && settings.expiresAt <= now + 15 * 60);

  if (!shouldRefresh) {
    return {
      accessToken: settings.accessToken,
      refreshToken: settings.refreshToken,
      expiresAt: settings.expiresAt,
      refreshed: false,
    };
  }

  return {
    ...(await refreshAccessToken(settings)),
    refreshed: true,
  };
}

async function stravaRequest(path, accessToken) {
  const response = await fetch(`${STRAVA_API_BASE}${path}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "paperlesspaper-strava-dashboard/0.2.0",
    },
    signal: timeoutSignal(),
  });

  if (response.status === 401) {
    const error = new Error("Strava rejected the access token.");
    error.status = 401;
    throw error;
  }
  if (response.status === 403) {
    throw new Error("Strava denied access. Reconnect and grant activity:read_all permission.");
  }
  if (response.status === 429) {
    throw new Error("Strava rate limit reached. Try again after the limit resets.");
  }
  if (!response.ok) {
    throw new Error(await responseMessage(response, `Strava API failed with ${response.status}.`));
  }

  return response.json();
}

async function authorizedRequest(path, settings, token) {
  try {
    return { data: await stravaRequest(path, token.accessToken), token };
  } catch (error) {
    if (error?.status !== 401 || token.refreshed || !settings.refreshToken) {
      throw error;
    }

    const refreshed = {
      ...(await refreshAccessToken(settings)),
      refreshed: true,
    };
    return { data: await stravaRequest(path, refreshed.accessToken), token: refreshed };
  }
}

function athleteName(athlete, fallback) {
  return [athlete?.firstname, athlete?.lastname].map((value) => asString(value)).filter(Boolean).join(" ") || fallback || "Strava athlete";
}

function convertDistance(meters, units) {
  const value = asNumber(meters, NaN);
  if (!Number.isFinite(value)) return { value: null, unit: units === "imperial" ? "mi" : "km" };
  return units === "imperial"
    ? { value: value / 1609.344, unit: "mi" }
    : { value: value / 1000, unit: "km" };
}

function convertElevation(meters, units) {
  const value = asNumber(meters, NaN);
  if (!Number.isFinite(value)) return { value: null, unit: units === "imperial" ? "ft" : "m" };
  return units === "imperial"
    ? { value: value * 3.28084, unit: "ft" }
    : { value, unit: "m" };
}

function summary(total, units, includeElevation) {
  const distance = convertDistance(total?.distance, units);
  const elevation = includeElevation ? convertElevation(total?.elevation_gain, units) : { value: null, unit: "" };
  return {
    distance: distance.value,
    distanceUnit: distance.unit,
    count: asNumber(total?.count, 0),
    movingTimeSeconds: asNumber(total?.moving_time, 0),
    movingTimeFormatted: "",
    elevation: elevation.value,
    elevationUnit: elevation.unit,
  };
}

function statsForType(stats, type, units) {
  return {
    type,
    ytd: summary(stats?.[`ytd_${type}_totals`], units, type !== "swim"),
    recent: summary(stats?.[`recent_${type}_totals`], units, type !== "swim"),
  };
}

function activityCategory(activity) {
  const type = asString(activity?.type || activity?.sport_type).toLowerCase();
  const sportType = asString(activity?.sport_type).toLowerCase();
  if (type === "swim" || sportType.includes("swim")) return "swim";
  if (type === "ride" || /ride|cycling|velomobile/.test(sportType)) return "ride";
  if (type === "run" || sportType.includes("run")) return "run";
  return "other";
}

function totalsFor(activities, type, since = 0) {
  return activities.reduce((total, activity) => {
    const startedAt = Date.parse(activity?.start_date || activity?.start_date_local || "") / 1000;
    if (activityCategory(activity) !== type || (since && (!Number.isFinite(startedAt) || startedAt < since))) {
      return total;
    }
    total.count += 1;
    total.distance += asNumber(activity.distance, 0);
    total.moving_time += asNumber(activity.moving_time, 0);
    total.elevation_gain += asNumber(activity.total_elevation_gain, 0);
    return total;
  }, { count: 0, distance: 0, moving_time: 0, elevation_gain: 0 });
}

function computedStats(activities, types, units, ytdSince, recentSince) {
  return types.map((type) => statsForType({
    [`ytd_${type}_totals`]: totalsFor(activities, type, ytdSince),
    [`recent_${type}_totals`]: totalsFor(activities, type, recentSince),
  }, type, units));
}

async function listYearActivities(accessToken, recentSince) {
  const now = new Date();
  const yearStart = Math.floor(Date.UTC(now.getUTCFullYear(), 0, 1) / 1000);
  const after = Math.min(yearStart, recentSince);
  const all = [];
  const maxPages = 5;

  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await stravaRequest(`/athlete/activities?after=${after}&page=${page}&per_page=200`, accessToken);
    if (!Array.isArray(batch)) {
      throw new Error("Strava returned an unexpected activity list.");
    }
    all.push(...batch);
    if (batch.length < 200) break;
  }

  return all;
}

function paceDetails(activity, units) {
  const seconds = asNumber(activity?.moving_time, NaN);
  const meters = asNumber(activity?.distance, NaN);
  if (!Number.isFinite(seconds) || !Number.isFinite(meters) || seconds <= 0 || meters <= 0) {
    return { pace: null, paceUnit: units === "imperial" ? "min/mi" : "min/km", paceFormatted: "" };
  }

  const distance = units === "imperial" ? meters / 1609.344 : meters / 1000;
  const minutesPerUnit = seconds / 60 / distance;
  const minutes = Math.floor(minutesPerUnit);
  const remainingSeconds = Math.round((minutesPerUnit - minutes) * 60);
  const unit = units === "imperial" ? "min/mi" : "min/km";
  return {
    pace: minutesPerUnit,
    paceUnit: unit,
    paceFormatted: `${minutes}:${String(remainingSeconds).padStart(2, "0")} ${unit}`,
  };
}

function latestActivity(activity, units) {
  if (!activity) return null;
  const distance = convertDistance(activity.distance, units);
  const elevation = convertElevation(activity.total_elevation_gain, units);
  const speed = asNumber(activity.average_speed, NaN);
  const location = [activity.location_city, activity.location_state, activity.location_country]
    .map((value) => asString(value))
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(", ");

  return {
    title: asString(activity.name, "Latest activity"),
    sportType: asString(activity.sport_type || activity.type, "Activity"),
    location,
    date: asString(activity.start_date || activity.start_date_local),
    distance: distance.value,
    distanceUnit: distance.unit,
    movingTimeSeconds: asNumber(activity.moving_time, 0),
    movingTimeFormatted: "",
    ...paceDetails(activity, units),
    speed: Number.isFinite(speed) ? speed * (units === "imperial" ? 2.236936 : 3.6) : null,
    speedUnit: units === "imperial" ? "mph" : "km/h",
    elevation: elevation.value,
    elevationUnit: elevation.unit,
    averageHeartRate: asNumber(activity.average_heartrate, NaN),
    heartRateUnit: "bpm",
    kudos: asNumber(activity.kudos_count, 0),
    calories: asNumber(activity.calories, NaN),
    caloriesUnit: "kcal",
    gear: asString(activity.gear?.name || activity.gear_id),
    activityUrl: activity.id ? `https://www.strava.com/activities/${activity.id}` : "",
    polyline: asString(activity.map?.polyline || activity.map?.summary_polyline),
  };
}

function sampleSummary(activityType, period, units) {
  const values = {
    swim: { ytd: [44_200, 30, 48_000, null], recent: [7_700, 5, 8_100, null] },
    ride: { ytd: [733_000, 16, 108_120, 6_785], recent: [99_400, 3, 11_880, 824] },
    run: { ytd: [573_000, 67, 192_060, 3_574], recent: [50_200, 10, 19_080, 1_129] },
  };
  const [meters, count, movingTimeSeconds, elevationMeters] = values[activityType][period];
  const distance = convertDistance(meters, units);
  const elevation = elevationMeters === null ? { value: null, unit: "" } : convertElevation(elevationMeters, units);
  return {
    distance: distance.value,
    distanceUnit: distance.unit,
    count,
    movingTimeSeconds,
    movingTimeFormatted: "",
    elevation: elevation.value,
    elevationUnit: elevation.unit,
  };
}

function sampleData(settings) {
  const sampleActivity = {
    id: 123456789,
    name: "Morning Trail Run",
    sport_type: "TrailRun",
    location_city: "Grunewald",
    start_date: "2026-07-20T04:34:00Z",
    distance: 9_400,
    moving_time: 2_970,
    average_speed: 3.164,
    total_elevation_gain: 140,
    average_heartrate: 162,
    kudos_count: 7,
    calories: 612,
    gear: { name: "Trail Shoes" },
    map: { polyline: "_p~iF~ps|U_ulLnnqC_mqNvxq`@bGx@hDxAnE|B~CzChB" },
  };
  return {
    source: "sample",
    athleteName: "Alex Morgan",
    activities: settings.activityTypes.map((type) => ({
      type,
      ytd: sampleSummary(type, "ytd", settings.units),
      recent: sampleSummary(type, "recent", settings.units),
    })),
    latest: latestActivity(sampleActivity, settings.units),
    fetchedAt: "2026-07-22T08:45:00Z",
  };
}

async function liveData(settings) {
  let token = await resolveToken(settings);
  const athleteResult = await authorizedRequest("/athlete", settings, token);
  const athlete = athleteResult.data;
  token = athleteResult.token;

  if (!athlete?.id) {
    throw new Error("Strava did not return an athlete ID.");
  }

  const headersToken = token.accessToken;
  const now = new Date();
  const ytdSince = Math.floor(Date.UTC(now.getUTCFullYear(), 0, 1) / 1000);
  const recentSince = Math.floor(Date.now() / 1000) - 28 * 24 * 60 * 60;
  const activities = await listYearActivities(headersToken, recentSince);
  const summaryActivity = activities[0] || null;
  const detailedActivity = summaryActivity?.id
    ? await stravaRequest(`/activities/${encodeURIComponent(summaryActivity.id)}?include_all_efforts=false`, headersToken)
    : null;
  const name = athleteName(athlete, settings.athleteName);
  const settingsPatch = {
    accessToken: token.accessToken,
    refreshToken: token.refreshToken,
    expiresAt: token.expiresAt,
    athleteId: String(athlete.id),
    athleteName: name,
  };

  return {
    source: "strava-api",
    athleteName: name,
    activities: computedStats(
      activities,
      settings.activityTypes,
      settings.units,
      ytdSince,
      recentSince,
    ),
    latest: latestActivity(detailedActivity || summaryActivity, settings.units),
    settingsPatch,
    tokenRefreshed: token.refreshed,
    fetchedAt: new Date().toISOString(),
  };
}

export default async function stravaDashboardData({ query = {} } = {}) {
  const settings = normalizeSettings(query);
  const hasCredentials = [settings.clientId, settings.clientSecret, settings.accessToken, settings.refreshToken]
    .some(Boolean);

  if (!hasCredentials) {
    return sampleData(settings);
  }
  if (!settings.accessToken && !(settings.clientId && settings.clientSecret && settings.refreshToken)) {
    throw new Error("Open settings and connect Strava before rendering live data.");
  }

  return liveData(settings);
}
