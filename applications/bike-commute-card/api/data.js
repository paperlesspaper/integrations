const forecastBaseUrl = "https://api.open-meteo.com/v1/forecast";
const airQualityBaseUrl = "https://air-quality-api.open-meteo.com/v1/air-quality";
const userAgent = "paperlesspaper-openintegrations/0.1.0";

function numberOrDefault(value, fallback, min = -Infinity, max = Infinity) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, number));
}

function integerOrDefault(value, fallback, min, max) {
  return Math.round(numberOrDefault(value, fallback, min, max));
}

function stringOrDefault(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function booleanOrDefault(value, fallback) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }

    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function routeStatusOrDefault(value) {
  return ["clear", "caution", "disrupted"].includes(value) ? value : "clear";
}

function timeOrDefault(value, fallback) {
  const text = String(value || "").trim();
  return /^\d{2}:\d{2}$/.test(text) ? text : fallback;
}

function minutesFromClock(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function clockFromMinutes(value) {
  const normalized = ((Math.round(value) % 1440) + 1440) % 1440;
  const hours = String(Math.floor(normalized / 60)).padStart(2, "0");
  const minutes = String(normalized % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function addDaysIso(dateIso, days) {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function localStamp(dateIso, minutes) {
  return `${dateIso}T${clockFromMinutes(minutes)}`;
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function average(values) {
  const numeric = values.filter((value) => Number.isFinite(value));
  if (!numeric.length) {
    return null;
  }

  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

async function fetchJson(url, label) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": userAgent
    }
  });

  if (!response.ok) {
    throw new Error(`${label} request failed with ${response.status}`);
  }

  return response.json();
}

function hourlyRows(hourly = {}) {
  const times = Array.isArray(hourly.time) ? hourly.time : [];

  return times.map((time, index) => ({
    time,
    rain: toNumber(hourly.rain?.[index]) ?? 0,
    precipitationProbability: toNumber(hourly.precipitation_probability?.[index]),
    windSpeed: toNumber(hourly.wind_speed_10m?.[index]),
    windGust: toNumber(hourly.wind_gusts_10m?.[index]),
    weatherCode: toNumber(hourly.weather_code?.[index])
  }));
}

function selectCommuteDate(currentTime, commuteStart, durationMinutes) {
  const currentDate = String(currentTime || new Date().toISOString()).slice(0, 10);
  const currentClock = String(currentTime || "").slice(11, 16);

  if (!/^\d{2}:\d{2}$/.test(currentClock)) {
    return currentDate;
  }

  const currentMinutes = minutesFromClock(currentClock);
  const startMinutes = minutesFromClock(commuteStart);
  const endMinutes = startMinutes + durationMinutes;

  return currentMinutes > endMinutes ? addDaysIso(currentDate, 1) : currentDate;
}

function summarizeCommute(rows, dateIso, commuteStart, durationMinutes) {
  const startMinutes = minutesFromClock(commuteStart);
  const endMinutes = startMinutes + durationMinutes;
  const start = localStamp(dateIso, startMinutes);
  const end = localStamp(dateIso, endMinutes);
  let selected = rows.filter((row) => row.time >= start && row.time <= end);

  if (!selected.length) {
    selected = rows.filter((row) => row.time >= start).slice(0, 2);
  }

  const rainProbabilities = selected
    .map((row) => row.precipitationProbability)
    .filter((value) => Number.isFinite(value));
  const windSpeeds = selected
    .map((row) => row.windSpeed)
    .filter((value) => Number.isFinite(value));
  const windGusts = selected
    .map((row) => row.windGust)
    .filter((value) => Number.isFinite(value));

  return {
    date: dateIso,
    start: clockFromMinutes(startMinutes),
    end: clockFromMinutes(endMinutes),
    rainProbability: rainProbabilities.length ? Math.max(...rainProbabilities) : null,
    rainTotal: selected.reduce((sum, row) => sum + (row.rain || 0), 0),
    windSpeed: average(windSpeeds),
    windGust: windGusts.length ? Math.max(...windGusts) : null,
    weatherCode: selected.find((row) => Number.isFinite(row.weatherCode))?.weatherCode ?? null
  };
}

function findRainWindow(rows, currentTime, threshold, lookaheadHours = 14) {
  const startIndex = Math.max(0, rows.findIndex((row) => row.time >= currentTime));
  const candidates = rows.slice(startIndex, startIndex + lookaheadHours);
  let active = null;

  for (const row of candidates) {
    const probability = row.precipitationProbability ?? 0;
    const wet = probability >= threshold || row.rain > 0.05;

    if (wet && !active) {
      active = {
        start: row.time.slice(11, 16),
        end: row.time.slice(11, 16),
        maxProbability: probability,
        rainTotal: row.rain
      };
      continue;
    }

    if (wet && active) {
      active.end = row.time.slice(11, 16);
      active.maxProbability = Math.max(active.maxProbability, probability);
      active.rainTotal += row.rain;
      continue;
    }

    if (!wet && active) {
      active.end = row.time.slice(11, 16);
      return active;
    }
  }

  return active;
}

async function fetchForecast(settings) {
  const params = new URLSearchParams({
    latitude: String(settings.latitude),
    longitude: String(settings.longitude),
    current: [
      "temperature_2m",
      "precipitation",
      "rain",
      "weather_code",
      "wind_speed_10m",
      "wind_gusts_10m"
    ].join(","),
    hourly: [
      "precipitation_probability",
      "rain",
      "weather_code",
      "wind_speed_10m",
      "wind_gusts_10m"
    ].join(","),
    forecast_days: "2",
    timezone: "auto"
  });
  const sourceUrl = `${forecastBaseUrl}?${params.toString()}`;
  const data = await fetchJson(sourceUrl, "Open-Meteo forecast");
  const rows = hourlyRows(data.hourly);
  const currentTime = data.current?.time || rows[0]?.time || new Date().toISOString();
  const commuteDate = selectCommuteDate(
    currentTime,
    settings.commuteStart,
    settings.commuteDurationMinutes
  );

  return {
    sourceUrl,
    currentTime,
    temperature: toNumber(data.current?.temperature_2m),
    currentRain: toNumber(data.current?.rain) ?? toNumber(data.current?.precipitation),
    currentWindSpeed: toNumber(data.current?.wind_speed_10m),
    currentWindGust: toNumber(data.current?.wind_gusts_10m),
    currentWeatherCode: toNumber(data.current?.weather_code),
    rainWindow: findRainWindow(
      rows,
      currentTime,
      settings.rainProbabilityThreshold
    ),
    commute: summarizeCommute(
      rows,
      commuteDate,
      settings.commuteStart,
      settings.commuteDurationMinutes
    )
  };
}

async function fetchAirQuality(settings) {
  const params = new URLSearchParams({
    latitude: String(settings.latitude),
    longitude: String(settings.longitude),
    current: "european_aqi,pm2_5,pm10,nitrogen_dioxide",
    timezone: "auto"
  });
  const sourceUrl = `${airQualityBaseUrl}?${params.toString()}`;
  const data = await fetchJson(sourceUrl, "Open-Meteo air quality");

  return {
    sourceUrl,
    time: data.current?.time || "",
    europeanAqi: toNumber(data.current?.european_aqi),
    pm25: toNumber(data.current?.pm2_5),
    pm10: toNumber(data.current?.pm10),
    nitrogenDioxide: toNumber(data.current?.nitrogen_dioxide)
  };
}

function scoreRide({ forecast, airQuality, settings }) {
  const routeStatus = settings.routeStatus;
  const commute = forecast?.commute || {};
  const rainProbability = commute.rainProbability ?? 0;
  const windGust = commute.windGust ?? forecast?.currentWindGust ?? 0;
  const windSpeed = commute.windSpeed ?? forecast?.currentWindSpeed ?? 0;
  const aqi = airQuality?.europeanAqi ?? 0;

  if (
    routeStatus === "disrupted" ||
    rainProbability >= 70 ||
    windGust >= settings.windStrongKmh ||
    aqi >= settings.aqiHigh + 20
  ) {
    return "avoid";
  }

  if (
    routeStatus === "caution" ||
    rainProbability >= settings.rainProbabilityThreshold ||
    windSpeed >= settings.windCautionKmh ||
    windGust >= settings.windStrongKmh ||
    aqi >= settings.aqiCaution
  ) {
    return "watch";
  }

  return "ride";
}

export default async function handler({ query }) {
  const settings = {
    title: stringOrDefault(query.title, "Bike Commute"),
    routeName: stringOrDefault(query.routeName, "Home to Work"),
    city: stringOrDefault(query.city, "Berlin"),
    latitude: numberOrDefault(query.latitude, 52.52, -90, 90),
    longitude: numberOrDefault(query.longitude, 13.405, -180, 180),
    commuteStart: timeOrDefault(query.commuteStart, "07:30"),
    commuteDurationMinutes: integerOrDefault(query.commuteDurationMinutes, 45, 5, 240),
    rainProbabilityThreshold: integerOrDefault(query.rainProbabilityThreshold, 35, 0, 100),
    windCautionKmh: integerOrDefault(query.windCautionKmh, 28, 1, 120),
    windStrongKmh: integerOrDefault(query.windStrongKmh, 40, 1, 160),
    aqiCaution: integerOrDefault(query.aqiCaution, 40, 0, 500),
    aqiHigh: integerOrDefault(query.aqiHigh, 60, 0, 500),
    routeStatus: routeStatusOrDefault(query.routeStatus),
    routeNote: stringOrDefault(query.routeNote, ""),
    showSource: booleanOrDefault(query.showSource, true)
  };

  const [forecastResult, airQualityResult] = await Promise.allSettled([
    fetchForecast(settings),
    fetchAirQuality(settings)
  ]);
  const forecast =
    forecastResult.status === "fulfilled" ? forecastResult.value : null;
  const airQuality =
    airQualityResult.status === "fulfilled" ? airQualityResult.value : null;
  const errors = [
    forecastResult.status === "rejected" ? forecastResult.reason?.message : "",
    airQualityResult.status === "rejected" ? airQualityResult.reason?.message : ""
  ].filter(Boolean);

  return {
    ...settings,
    forecast,
    airQuality,
    score: scoreRide({ forecast, airQuality, settings }),
    updatedAt: new Date().toISOString(),
    sources: {
      forecast: forecast?.sourceUrl || forecastBaseUrl,
      airQuality: airQuality?.sourceUrl || airQualityBaseUrl
    },
    errors
  };
}
