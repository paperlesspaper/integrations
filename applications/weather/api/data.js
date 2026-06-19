function numberOrDefault(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function stringOrDefault(value, fallback) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export default async function handler({ query }) {
  const city = stringOrDefault(query.city, 'Berlin');
  const latitude = numberOrDefault(query.latitude, 52.52);
  const longitude = numberOrDefault(query.longitude, 13.405);

  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,apparent_temperature,wind_speed_10m,weather_code',
    daily: 'temperature_2m_min,temperature_2m_max',
    forecast_days: '3',
    timezone: 'auto',
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'paperlesspaper-openintegrations/0.1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with ${response.status}`);
  }

  const data = await response.json();
  const daily = data.daily || {};

  return {
    city,
    temperature: data.current?.temperature_2m,
    apparentTemperature: data.current?.apparent_temperature,
    windSpeed: data.current?.wind_speed_10m,
    weatherCode: data.current?.weather_code,
    forecast: (daily.time || []).slice(0, 3).map((date, index) => ({
      date,
      min: daily.temperature_2m_min?.[index],
      max: daily.temperature_2m_max?.[index],
    })),
    updatedAt: data.current?.time || new Date().toISOString(),
  };
}
