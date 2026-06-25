const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const USER_AGENT = "paperlesspaper-openintegrations/0.1.0";

const weatherCodeDescriptions = {
  en: {
    0: "clear sky",
    1: "mainly clear",
    2: "partly cloudy",
    3: "overcast",
    45: "fog",
    48: "rime fog",
    51: "light drizzle",
    53: "moderate drizzle",
    55: "dense drizzle",
    56: "freezing drizzle",
    57: "dense freezing drizzle",
    61: "light rain",
    63: "moderate rain",
    65: "heavy rain",
    66: "freezing rain",
    67: "heavy freezing rain",
    71: "light snow",
    73: "moderate snow",
    75: "heavy snow",
    77: "snow grains",
    80: "light showers",
    81: "showers",
    82: "heavy showers",
    85: "snow showers",
    86: "heavy snow showers",
    95: "thunderstorm",
    96: "thunderstorm with hail",
    99: "heavy thunderstorm with hail",
  },
  de: {
    0: "klarer Himmel",
    1: "meist klar",
    2: "teilweise bewolkt",
    3: "bedeckt",
    45: "Nebel",
    48: "Reifnebel",
    51: "leichter Nieselregen",
    53: "Nieselregen",
    55: "starker Nieselregen",
    56: "gefrierender Nieselregen",
    57: "starker gefrierender Nieselregen",
    61: "leichter Regen",
    63: "Regen",
    65: "starker Regen",
    66: "gefrierender Regen",
    67: "starker gefrierender Regen",
    71: "leichter Schnee",
    73: "Schnee",
    75: "starker Schnee",
    77: "Schneegriesel",
    80: "leichte Schauer",
    81: "Schauer",
    82: "starke Schauer",
    85: "Schneeschauer",
    86: "starke Schneeschauer",
    95: "Gewitter",
    96: "Gewitter mit Hagel",
    99: "starkes Gewitter mit Hagel",
  },
  es: {
    0: "cielo despejado",
    1: "principalmente despejado",
    2: "parcialmente nublado",
    3: "cubierto",
    45: "niebla",
    48: "niebla con escarcha",
    51: "llovizna ligera",
    53: "llovizna moderada",
    55: "llovizna densa",
    56: "llovizna helada",
    57: "llovizna helada densa",
    61: "lluvia ligera",
    63: "lluvia moderada",
    65: "lluvia fuerte",
    66: "lluvia helada",
    67: "lluvia helada fuerte",
    71: "nieve ligera",
    73: "nieve moderada",
    75: "nieve fuerte",
    77: "granos de nieve",
    80: "chubascos ligeros",
    81: "chubascos",
    82: "chubascos fuertes",
    85: "chubascos de nieve",
    86: "chubascos fuertes de nieve",
    95: "tormenta",
    96: "tormenta con granizo",
    99: "tormenta fuerte con granizo",
  },
  fr: {
    0: "ciel degage",
    1: "principalement degage",
    2: "partiellement nuageux",
    3: "couvert",
    45: "brouillard",
    48: "brouillard givrant",
    51: "bruine faible",
    53: "bruine moderee",
    55: "bruine dense",
    56: "bruine verglacante",
    57: "bruine verglacante dense",
    61: "pluie faible",
    63: "pluie moderee",
    65: "forte pluie",
    66: "pluie verglacante",
    67: "forte pluie verglacante",
    71: "neige faible",
    73: "neige moderee",
    75: "forte neige",
    77: "grains de neige",
    80: "averses faibles",
    81: "averses",
    82: "fortes averses",
    85: "averses de neige",
    86: "fortes averses de neige",
    95: "orage",
    96: "orage avec grele",
    99: "fort orage avec grele",
  },
  it: {
    0: "cielo sereno",
    1: "prevalentemente sereno",
    2: "parzialmente nuvoloso",
    3: "coperto",
    45: "nebbia",
    48: "nebbia con brina",
    51: "pioviggine leggera",
    53: "pioviggine moderata",
    55: "pioviggine intensa",
    56: "pioviggine gelata",
    57: "pioviggine gelata intensa",
    61: "pioggia leggera",
    63: "pioggia moderata",
    65: "pioggia forte",
    66: "pioggia gelata",
    67: "pioggia gelata forte",
    71: "neve leggera",
    73: "neve moderata",
    75: "neve forte",
    77: "granelli di neve",
    80: "rovesci leggeri",
    81: "rovesci",
    82: "rovesci forti",
    85: "rovesci di neve",
    86: "forti rovesci di neve",
    95: "temporale",
    96: "temporale con grandine",
    99: "forte temporale con grandine",
  },
};

function stringOrDefault(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function languageCode(value) {
  return stringOrDefault(value, "en").split("-")[0].toLowerCase();
}

function normalizeDataSource(value) {
  const normalized = stringOrDefault(value, "openweathermap")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  if (["openmeteo", "meteo"].includes(normalized)) {
    return "open-meteo";
  }

  if (["openweather", "openweathermap", "owm"].includes(normalized)) {
    return "openweathermap";
  }

  return "openweathermap";
}

function getApiKey(query) {
  const queryKey = stringOrDefault(query.apiKey, "");
  return queryKey || process.env.OPENWEATHERMAP_API_KEY || "";
}

async function fetchJson(url, messagePrefix) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    let message = `${messagePrefix} failed with ${response.status}`;

    try {
      const errorData = await response.json();
      if (errorData?.reason) {
        message = errorData.reason;
      } else if (errorData?.message) {
        message = errorData.message;
      } else if (errorData?.error) {
        message = errorData.error;
      }
    } catch {
      // Keep the status-based error when the upstream response is not JSON.
    }

    throw new Error(message);
  }

  return response.json();
}

async function fetchOpenWeather(path, params, apiKey) {
  const search = new URLSearchParams({
    ...params,
    appid: apiKey,
    units: "metric",
  });

  return fetchJson(
    `https://api.openweathermap.org/data/2.5/${path}?${search.toString()}`,
    "OpenWeatherMap request",
  );
}

async function fetchOpenWeatherData({ apiKey, language, location }) {
  if (!apiKey) {
    throw new Error("OPENWEATHERMAP_API_KEY is not configured.");
  }

  const params = {
    q: location,
    lang: language,
  };

  const [currentWeather, forecast] = await Promise.all([
    fetchOpenWeather("weather", params, apiKey),
    fetchOpenWeather("forecast", params, apiKey),
  ]);

  return {
    source: "openweathermap",
    currentWeather,
    forecast,
    fetchedAt: new Date().toISOString(),
  };
}

function weatherCodeIcon(code, isDay = true) {
  const suffix = isDay ? "d" : "n";
  const weatherCode = Number(code);

  if (weatherCode === 0) {
    return `01${suffix}`;
  }
  if ([1, 2].includes(weatherCode)) {
    return `02${suffix}`;
  }
  if (weatherCode === 3) {
    return `04${suffix}`;
  }
  if ([45, 48].includes(weatherCode)) {
    return `50${suffix}`;
  }
  if ([51, 53, 55, 80, 81, 82].includes(weatherCode)) {
    return `09${suffix}`;
  }
  if ([56, 57, 66, 67, 71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return `13${suffix}`;
  }
  if ([61, 63, 65].includes(weatherCode)) {
    return `10${suffix}`;
  }
  if ([95, 96, 99].includes(weatherCode)) {
    return `11${suffix}`;
  }

  return `01${suffix}`;
}

function weatherCodeDescription(code, language) {
  const descriptions =
    weatherCodeDescriptions[language] || weatherCodeDescriptions.en;
  return descriptions[Number(code)] || weatherCodeDescriptions.en[Number(code)] || "weather";
}

function weatherCodeMain(code) {
  const weatherCode = Number(code);

  if (weatherCode === 0) {
    return "Clear";
  }
  if ([1, 2, 3].includes(weatherCode)) {
    return "Clouds";
  }
  if ([45, 48].includes(weatherCode)) {
    return "Fog";
  }
  if ([51, 53, 55, 56, 57].includes(weatherCode)) {
    return "Drizzle";
  }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(weatherCode)) {
    return "Rain";
  }
  if ([71, 73, 75, 77, 85, 86].includes(weatherCode)) {
    return "Snow";
  }
  if ([95, 96, 99].includes(weatherCode)) {
    return "Thunderstorm";
  }

  return "Clear";
}

function weatherEntry(code, isDay, language) {
  return {
    id: Number(code),
    main: weatherCodeMain(code),
    description: weatherCodeDescription(code, language),
    icon: weatherCodeIcon(code, isDay),
  };
}

function toUnixSeconds(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? Math.round(parsed / 1000) : null;
}

function localDateTimeText(unixSeconds, timezoneOffsetSeconds = 0) {
  const timestamp =
    (Number(unixSeconds) + Number(timezoneOffsetSeconds || 0)) * 1000;

  if (!Number.isFinite(timestamp)) {
    return "";
  }

  return new Date(timestamp).toISOString().slice(0, 19).replace("T", " ");
}

function valueAt(values, index) {
  return Array.isArray(values) ? values[index] : undefined;
}

function openMeteoHourlyEntry(forecast, index, timezoneOffsetSeconds, language) {
  const hourly = forecast.hourly || {};
  const dt = toUnixSeconds(valueAt(hourly.time, index));
  const code = valueAt(hourly.weather_code, index);

  if (!dt || code === undefined || code === null) {
    return null;
  }

  const isDay = valueAt(hourly.is_day, index);

  return {
    dt,
    dt_txt: localDateTimeText(dt, timezoneOffsetSeconds),
    main: {
      temp: valueAt(hourly.temperature_2m, index),
      humidity: valueAt(hourly.relative_humidity_2m, index),
      pressure: valueAt(hourly.surface_pressure, index),
    },
    weather: [weatherEntry(code, isDay === undefined ? true : Boolean(isDay), language)],
    wind: {
      speed: valueAt(hourly.wind_speed_10m, index),
    },
  };
}

async function fetchOpenMeteoLocation(location, language) {
  const search = new URLSearchParams({
    name: location,
    count: "1",
    language,
    format: "json",
  });
  const data = await fetchJson(
    `${OPEN_METEO_GEOCODING_URL}?${search.toString()}`,
    "Open-Meteo geocoding request",
  );
  const result = Array.isArray(data.results) ? data.results[0] : null;

  if (!result) {
    throw new Error(`Open-Meteo could not find "${location}".`);
  }

  return result;
}

async function fetchOpenMeteoForecast(location) {
  const search = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "weather_code",
      "surface_pressure",
      "wind_speed_10m",
      "is_day",
    ].join(","),
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "weather_code",
      "surface_pressure",
      "wind_speed_10m",
      "is_day",
    ].join(","),
    daily: ["sunrise", "sunset"].join(","),
    timezone: "auto",
    timeformat: "unixtime",
    wind_speed_unit: "ms",
    forecast_days: "5",
  });

  return fetchJson(
    `${OPEN_METEO_FORECAST_URL}?${search.toString()}`,
    "Open-Meteo forecast request",
  );
}

function normalizeOpenMeteoData(location, forecast, language) {
  const current = forecast.current || {};
  const daily = forecast.daily || {};
  const timezoneOffsetSeconds = Number(forecast.utc_offset_seconds || 0);
  const currentDt = toUnixSeconds(current.time) || Math.round(Date.now() / 1000);
  const currentCode = current.weather_code ?? 0;
  const currentIsDay =
    current.is_day === undefined ? true : Boolean(Number(current.is_day));
  const hourlyTimes = Array.isArray(forecast.hourly?.time)
    ? forecast.hourly.time
    : [];
  const currentWeather = {
    coord: {
      lat: Number(location.latitude),
      lon: Number(location.longitude),
    },
    weather: [weatherEntry(currentCode, currentIsDay, language)],
    main: {
      temp: current.temperature_2m,
      pressure: current.surface_pressure,
      humidity: current.relative_humidity_2m,
    },
    wind: {
      speed: current.wind_speed_10m,
    },
    dt: currentDt,
    sys: {
      country: location.country_code,
      sunrise: toUnixSeconds(valueAt(daily.sunrise, 0)),
      sunset: toUnixSeconds(valueAt(daily.sunset, 0)),
    },
    timezone: timezoneOffsetSeconds,
    name: location.name,
  };
  const futureHourlyIndexes = hourlyTimes
    .map((time, index) => ({ dt: toUnixSeconds(time), index }))
    .filter(({ dt }) => dt && dt >= currentDt - 1800)
    .filter((_entry, index) => index % 3 === 0)
    .map(({ index }) => index);
  const list = futureHourlyIndexes
    .map((index) =>
      openMeteoHourlyEntry(forecast, index, timezoneOffsetSeconds, language),
    )
    .filter(Boolean);

  return {
    source: "open-meteo",
    currentWeather,
    forecast: {
      cod: "200",
      message: 0,
      cnt: list.length,
      list,
      city: {
        name: location.name,
        country: location.country_code,
        coord: {
          lat: Number(location.latitude),
          lon: Number(location.longitude),
        },
        timezone: timezoneOffsetSeconds,
        sunrise: currentWeather.sys.sunrise,
        sunset: currentWeather.sys.sunset,
      },
    },
    fetchedAt: new Date().toISOString(),
  };
}

async function fetchOpenMeteoData({ language, location }) {
  const openMeteoLocation = await fetchOpenMeteoLocation(location, language);
  const forecast = await fetchOpenMeteoForecast(openMeteoLocation);
  return normalizeOpenMeteoData(openMeteoLocation, forecast, language);
}

export default async function handler({ query = {} }) {
  const location = stringOrDefault(query.location, "Berlin");
  const language = languageCode(query.language);
  const dataSource = normalizeDataSource(query.dataSource);

  if (dataSource === "open-meteo") {
    return fetchOpenMeteoData({ language, location });
  }

  return fetchOpenWeatherData({
    apiKey: getApiKey(query),
    language,
    location,
  });
}
