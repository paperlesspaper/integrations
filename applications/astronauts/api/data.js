const sourceUrl = "https://www.howmanypeopleareinspacerightnow.com/peopleinspace.json";

function stringOrDefault(value, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();
  return trimmed && trimmed !== "null" && trimmed !== "undefined" ? trimmed : fallback;
}

function numberInRange(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function daysSince(value) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / millisecondsPerDay));
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function displayCountry(country) {
  const normalized = normalizeText(country);
  const labels = {
    usa: "USA",
    us: "USA",
    "united states": "USA",
    russia: "Russia",
    russian: "Russia",
    china: "China",
    japan: "Japan",
    italy: "Italy",
    france: "France",
    germany: "Germany",
    denmark: "Denmark",
    canada: "Canada",
  };

  return labels[normalized] || stringOrDefault(country, "Unknown");
}

function shapePerson(person) {
  const missionDays = daysSince(person.launchdate);
  const careerDays = Number.isFinite(Number(person.careerdays))
    ? Math.floor(Number(person.careerdays))
    : null;

  return {
    name: stringOrDefault(person.name, "Unknown astronaut"),
    title: stringOrDefault(person.title, "Astronaut"),
    country: displayCountry(person.country),
    location: stringOrDefault(person.location, "In space"),
    launchDate: person.launchdate || null,
    missionDays,
    careerDays,
    bio: stringOrDefault(person.bio, ""),
    biophoto: stringOrDefault(person.biophoto, ""),
    biolink: stringOrDefault(person.biolink, ""),
  };
}

function groupByLocation(people) {
  const grouped = new Map();

  for (const person of people) {
    const location = person.location || "In space";
    const group = grouped.get(location) || {
      location,
      count: 0,
      countries: new Map(),
    };

    group.count += 1;
    group.countries.set(person.country, (group.countries.get(person.country) || 0) + 1);
    grouped.set(location, group);
  }

  return Array.from(grouped.values())
    .map((group) => ({
      location: group.location,
      count: group.count,
      countries: Array.from(group.countries.entries())
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([country, count]) => ({ country, count })),
    }))
    .sort((a, b) => b.count - a.count || a.location.localeCompare(b.location));
}

function filterPeople(people, filter) {
  const normalizedFilter = normalizeText(filter);
  if (!normalizedFilter) {
    return people;
  }

  const aliases = {
    iss: "international space station",
    tiangong: "tiangong space station",
    css: "tiangong space station",
    artemis: "orion spacecraft - artemis ii",
    orion: "orion spacecraft",
  };
  const expandedFilter = aliases[normalizedFilter] || normalizedFilter;

  return people.filter((person) => {
    const location = normalizeText(person.location);
    return location.includes(normalizedFilter) || location.includes(expandedFilter);
  });
}

export default async function handler({ query }) {
  const locationFilter = stringOrDefault(query.locationFilter);
  const rosterLimit = numberInRange(query.rosterLimit, 8, 1, 24);

  const response = await fetch(sourceUrl, {
    headers: {
      Accept: "application/json",
      "User-Agent": "paperlesspaper-openintegrations/0.1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`People in Space request failed with ${response.status}`);
  }

  const payload = await response.json();
  const allPeople = Array.isArray(payload.people) ? payload.people.map(shapePerson) : [];
  const people = filterPeople(allPeople, locationFilter);

  return {
    count: people.length,
    totalCount: Number.isFinite(Number(payload.number)) ? Number(payload.number) : allPeople.length,
    locationFilter,
    locations: groupByLocation(people),
    people: people.slice(0, rosterLimit),
    allPeopleCount: allPeople.length,
    source: "How Many People Are In Space Right Now?",
    sourceUrl: "https://www.howmanypeopleareinspacerightnow.com/",
    updatedAt: new Date().toISOString(),
  };
}
