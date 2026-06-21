const dwdUrl = "https://opendata.dwd.de/climate_environment/health/alerts/s31fg.json";
const userAgent = "paperlesspaper-openintegrations/0.1.0";
const predictionDays = [
  ["today", 0],
  ["tomorrow", 1],
  ["dayafter_to", 2],
];

function integerInRange(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(number)));
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

function dataRegionId(region) {
  return Number(region.partregion_id) === -1
    ? Number(region.region_id)
    : Number(region.partregion_id);
}

function dateFromDwdClock(value) {
  const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : new Date().toISOString().slice(0, 10);
}

function addDaysIso(dateIso, days) {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function convertValue(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return null;
  }

  const rangeMatch = text.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const lower = Number(rangeMatch[1]);
    const upper = Number(rangeMatch[2]);
    return Number.isFinite(lower) && lower + 1 === upper ? lower + 0.5 : null;
  }

  const number = Number(text);
  if (!Number.isFinite(number) || number === -1) {
    return null;
  }

  return number;
}

function extractLegend(legendData = {}) {
  const entries = {};

  for (const [key, value] of Object.entries(legendData)) {
    if (key.endsWith("_desc")) {
      continue;
    }

    const raw = String(value);
    const numeric = convertValue(raw);
    const description = legendData[`${key}_desc`] || "";

    entries[raw] = description;
    if (numeric !== null) {
      entries[String(numeric)] = description;
    }
  }

  return entries;
}

function forecastForValue(raw, date, legend) {
  const value = convertValue(raw);

  if (value === null) {
    return null;
  }

  return {
    date,
    raw: String(raw),
    value,
    description: legend[String(raw)] || legend[String(value)] || "",
  };
}

function shapeRegion(region) {
  const id = dataRegionId(region);
  const regionName = String(region.region_name || "");
  const partRegionName = String(region.partregion_name || "").trim();

  return {
    id,
    regionId: Number(region.region_id),
    partRegionId: Number(region.partregion_id),
    regionName,
    partRegionName,
    displayName: partRegionName ? `${partRegionName}, ${regionName}` : regionName,
  };
}

function shapePollenRows(region, sourceDate, legend) {
  return Object.entries(region.Pollen || {}).map(([key, values]) => {
    const forecasts = {};

    for (const [dayKey, offset] of predictionDays) {
      forecasts[dayKey] = forecastForValue(
        values?.[dayKey],
        addDaysIso(sourceDate, offset),
        legend
      );
    }

    const numericValues = Object.values(forecasts)
      .map((forecast) => forecast?.value)
      .filter((value) => Number.isFinite(value));

    const highestValue = numericValues.length ? Math.max(...numericValues) : null;

    return {
      key,
      forecasts,
      todayValue: forecasts.today?.value ?? null,
      highestValue,
    };
  });
}

function comparePollen(sortBy) {
  return (left, right) => {
    if (sortBy === "name") {
      return left.key.localeCompare(right.key, "de");
    }

    const bySeverity = (right.todayValue ?? right.highestValue ?? -1)
      - (left.todayValue ?? left.highestValue ?? -1);

    return bySeverity || left.key.localeCompare(right.key, "de");
  };
}

async function fetchDwdData() {
  const response = await fetch(dwdUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": userAgent,
    },
  });

  if (!response.ok) {
    throw new Error(`DWD request failed with ${response.status}`);
  }

  return response.json();
}

export default async function handler({ query }) {
  const regionId = integerInRange(query.regionId, 50, 1, 999);
  const limit = integerInRange(query.limit, 8, 1, 8);
  const sortBy = ["severity", "name"].includes(query.sortBy)
    ? query.sortBy
    : "severity";
  const showEmpty = booleanOrDefault(query.showEmpty, false);

  const dwdData = await fetchDwdData();
  const regions = Array.isArray(dwdData.content) ? dwdData.content : [];
  const selectedRegion =
    regions.find((region) => dataRegionId(region) === regionId)
    || regions.find((region) => Number(region.region_id) === regionId)
    || regions.find((region) => dataRegionId(region) === 50)
    || regions[0];

  if (!selectedRegion) {
    throw new Error("DWD pollen data did not contain any regions");
  }

  const sourceDate = dateFromDwdClock(dwdData.last_update);
  const legend = extractLegend(dwdData.legend);
  const pollen = shapePollenRows(selectedRegion, sourceDate, legend)
    .filter((row) => showEmpty || (row.highestValue ?? 0) > 0)
    .sort(comparePollen(sortBy))
    .slice(0, limit);

  return {
    name: stringOrDefault(dwdData.name, "Pollenflug-Gefahrenindex"),
    sender: stringOrDefault(
      dwdData.sender,
      "Deutscher Wetterdienst - Medizin-Meteorologie"
    ),
    sourceUrl: dwdUrl,
    lastUpdate: dwdData.last_update || "",
    nextUpdate: dwdData.next_update || "",
    region: shapeRegion(selectedRegion),
    pollen,
    regions: regions.map(shapeRegion).sort((left, right) => left.id - right.id),
    updatedAt: new Date().toISOString(),
  };
}
