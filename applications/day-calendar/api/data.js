import { curiositiesDe } from "./data/curiosities.de.js";
import { curiositiesEn } from "./data/curiosities.en.js";
import { demotivationalQuotesDe } from "./data/demotivational.de.js";
import { demotivationalQuotesEn } from "./data/demotivational.en.js";
import { funnyFactsDe } from "./data/funnyFacts.de.js";
import { funnyFactsEn } from "./data/funnyFacts.en.js";
import { observancesDe } from "./data/observances.de.js";
import { observancesEn } from "./data/observances.en.js";
import { wordsDe } from "./data/words.de.js";
import { wordsEn } from "./data/words.en.js";

const allowedKinds = new Set([
  "primary",
  "demotivational",
  "funny",
  "day-progress",
  "holiday-observance",
  "season-daylight",
  "word-phrase",
  "curiosity",
]);
const factKinds = new Set([
  "day-progress",
  "holiday-observance",
  "season-daylight",
  "word-phrase",
  "curiosity",
]);
const regionNames = {
  off: "Off",
  DE: "Germany",
  "DE-BE": "Berlin",
  AT: "Austria",
  CH: "Switzerland",
  US: "United States",
  "GB-ENG": "England",
  FR: "France",
  ES: "Spain",
  IT: "Italy",
  NL: "Netherlands",
  CA: "Canada",
  AU: "Australia",
};
const localizedRegionNames = {
  de: {
    off: "Aus",
    DE: "Deutschland",
    "DE-BE": "Berlin",
    AT: "Österreich",
    CH: "Schweiz",
    US: "Vereinigte Staaten",
    "GB-ENG": "England",
    FR: "Frankreich",
    ES: "Spanien",
    IT: "Italien",
    NL: "Niederlande",
    CA: "Kanada",
    AU: "Australien",
  },
};
const localizedHolidayNames = {
  de: {
    "New Year": "Neujahr",
    "Labour Day": "Tag der Arbeit",
    "German Unity Day": "Tag der Deutschen Einheit",
    "Christmas Day": "Erster Weihnachtstag",
    "Boxing Day": "Zweiter Weihnachtstag",
    "Good Friday": "Karfreitag",
    "Easter Monday": "Ostermontag",
    "Ascension Day": "Christi Himmelfahrt",
    "Whit Monday": "Pfingstmontag",
    "Women's Day": "Internationaler Frauentag",
    Epiphany: "Heilige Drei Könige",
    "National Day": "Nationalfeiertag",
    "St Stephen": "Stephanitag",
    "Corpus Christi": "Fronleichnam",
    Juneteenth: "Juneteenth",
    "Independence Day": "Unabhängigkeitstag",
    "Veterans Day": "Veteranentag",
    "MLK Day": "Martin Luther King Jr. Day",
    "Presidents Day": "Presidents Day",
    "Memorial Day": "Memorial Day",
    "Labor Day": "Labor Day",
    "Columbus Day": "Columbus Day",
    Thanksgiving: "Thanksgiving",
    "Early May Bank Holiday": "Early May Bank Holiday",
    "Spring Bank Holiday": "Spring Bank Holiday",
    "Summer Bank Holiday": "Summer Bank Holiday",
    "Victory Day": "Tag des Sieges",
    "Bastille Day": "Nationalfeiertag",
    Assumption: "Mariä Himmelfahrt",
    "All Saints": "Allerheiligen",
    Armistice: "Waffenstillstandstag",
    "Constitution Day": "Tag der Verfassung",
    "Immaculate Conception": "Mariä Empfängnis",
    "Liberation Day": "Tag der Befreiung",
    "Republic Day": "Tag der Republik",
    Ferragosto: "Ferragosto",
    "King's Day": "Königstag",
    "Canada Day": "Canada Day",
    "Remembrance Day": "Remembrance Day",
    "Australia Day": "Australia Day",
    "Anzac Day": "Anzac Day",
    "Easter Tuesday": "Osterdienstag",
  },
};
const seasonLabels = {
  en: {
    spring: "Spring",
    summer: "Summer",
    autumn: "Autumn",
    winter: "Winter",
    daylight: "daylight",
    sunrise: "Sunrise",
    sunset: "sunset",
    moreLight: "more light than yesterday",
    lessLight: "less light than yesterday",
    sameLight: "about the same light as yesterday",
    noHoliday: "No listed holiday today",
    nextObservance: "Next observance",
    holiday: "Holiday",
    observance: "Observance",
    dayProgress: "Day progress",
    dayOfYear: "Day {day} of {year}",
    percentComplete: "{percent}% complete",
    daysLeft: "{days} days left",
    week: "Week {week}",
  },
  de: {
    spring: "Frühling",
    summer: "Sommer",
    autumn: "Herbst",
    winter: "Winter",
    daylight: "Tageslicht",
    sunrise: "Sonnenaufgang",
    sunset: "Sonnenuntergang",
    moreLight: "mehr Licht als gestern",
    lessLight: "weniger Licht als gestern",
    sameLight: "etwa gleich viel Licht wie gestern",
    noHoliday: "Heute kein gelisteter Feiertag",
    nextObservance: "Nächster Aktionstag",
    holiday: "Feiertag",
    observance: "Aktionstag",
    dayProgress: "Jahresfortschritt",
    dayOfYear: "Tag {day} von {year}",
    percentComplete: "{percent}% geschafft",
    daysLeft: "noch {days} Tage",
    week: "Woche {week}",
  },
};

function stringValue(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function booleanValue(value) {
  return value === true || value === "true" || value === "1";
}

function numberValue(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, number));
}

function normalizeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function languageBase(language) {
  return String(language || "en").toLowerCase().startsWith("de") ? "de" : "en";
}

function text(key, language, values = {}) {
  const labels = seasonLabels[languageBase(language)] || seasonLabels.en;
  const template = labels[key] || seasonLabels.en[key] || key;
  return template.replace(/\{(\w+)\}/g, (_match, name) => values[name] ?? "");
}

function regionName(region, language) {
  return (
    localizedRegionNames[languageBase(language)]?.[region] ||
    regionNames[region] ||
    region
  );
}

function holidayName(name, language) {
  return localizedHolidayNames[languageBase(language)]?.[name] || name;
}

function uniqueLabels(labels) {
  const seen = new Set();
  return labels.filter((label) => {
    if (!label) {
      return false;
    }

    const key = label.toLowerCase();
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function safeDatePart(date, locale, options) {
  try {
    return date.toLocaleDateString(locale, options);
  } catch (_error) {
    return date.toLocaleDateString("en-US", options);
  }
}

function safeTime(date, locale) {
  try {
    return date.toLocaleTimeString(locale);
  } catch (_error) {
    return date.toLocaleTimeString("en-US");
  }
}

function safeFormatter(locale, options) {
  try {
    return new Intl.DateTimeFormat(locale, options);
  } catch (_error) {
    return new Intl.DateTimeFormat("en-US", options);
  }
}

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function daysInYear(year) {
  return new Date(year, 1, 29).getMonth() === 1 ? 366 : 365;
}

function isoWeek(date) {
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayNumber = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNumber = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNumber + 3);
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function monthDayKey(date) {
  return [
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function nthWeekday(year, monthIndex, weekday, nth) {
  const first = new Date(year, monthIndex, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  return new Date(year, monthIndex, 1 + offset + (nth - 1) * 7);
}

function lastWeekday(year, monthIndex, weekday) {
  const last = new Date(year, monthIndex + 1, 0);
  const offset = (last.getDay() - weekday + 7) % 7;
  return new Date(year, monthIndex, last.getDate() - offset);
}

function easterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function holidayMap(year, region) {
  const holidays = new Map();
  const add = (date, name) => holidays.set(dateKey(date), name);
  const fixed = (month, day, name) => add(new Date(year, month - 1, day), name);
  const easter = easterDate(year);

  if (region === "off") {
    return holidays;
  }

  if (region === "DE" || region === "DE-BE") {
    fixed(1, 1, "New Year");
    fixed(5, 1, "Labour Day");
    fixed(10, 3, "German Unity Day");
    fixed(12, 25, "Christmas Day");
    fixed(12, 26, "Boxing Day");
    add(addDays(easter, -2), "Good Friday");
    add(addDays(easter, 1), "Easter Monday");
    add(addDays(easter, 39), "Ascension Day");
    add(addDays(easter, 50), "Whit Monday");
    if (region === "DE-BE") {
      fixed(3, 8, "Women's Day");
    }
  }

  if (region === "AT") {
    fixed(1, 1, "New Year");
    fixed(1, 6, "Epiphany");
    fixed(5, 1, "Labour Day");
    fixed(10, 26, "National Day");
    fixed(12, 25, "Christmas Day");
    fixed(12, 26, "St Stephen");
    add(addDays(easter, 1), "Easter Monday");
    add(addDays(easter, 39), "Ascension Day");
    add(addDays(easter, 50), "Whit Monday");
    add(addDays(easter, 60), "Corpus Christi");
  }

  if (region === "CH") {
    fixed(1, 1, "New Year");
    fixed(8, 1, "National Day");
    fixed(12, 25, "Christmas Day");
    fixed(12, 26, "St Stephen");
    add(addDays(easter, -2), "Good Friday");
    add(addDays(easter, 1), "Easter Monday");
    add(addDays(easter, 39), "Ascension Day");
    add(addDays(easter, 50), "Whit Monday");
  }

  if (region === "US") {
    fixed(1, 1, "New Year");
    fixed(6, 19, "Juneteenth");
    fixed(7, 4, "Independence Day");
    fixed(11, 11, "Veterans Day");
    fixed(12, 25, "Christmas Day");
    add(nthWeekday(year, 0, 1, 3), "MLK Day");
    add(nthWeekday(year, 1, 1, 3), "Presidents Day");
    add(lastWeekday(year, 4, 1), "Memorial Day");
    add(nthWeekday(year, 8, 1, 1), "Labor Day");
    add(nthWeekday(year, 9, 1, 2), "Columbus Day");
    add(nthWeekday(year, 10, 4, 4), "Thanksgiving");
  }

  if (region === "GB-ENG") {
    fixed(1, 1, "New Year");
    fixed(12, 25, "Christmas Day");
    fixed(12, 26, "Boxing Day");
    add(addDays(easter, -2), "Good Friday");
    add(addDays(easter, 1), "Easter Monday");
    add(nthWeekday(year, 4, 1, 1), "Early May Bank Holiday");
    add(lastWeekday(year, 4, 1), "Spring Bank Holiday");
    add(lastWeekday(year, 7, 1), "Summer Bank Holiday");
  }

  if (region === "FR") {
    fixed(1, 1, "New Year");
    fixed(5, 1, "Labour Day");
    fixed(5, 8, "Victory Day");
    fixed(7, 14, "Bastille Day");
    fixed(8, 15, "Assumption");
    fixed(11, 1, "All Saints");
    fixed(11, 11, "Armistice");
    fixed(12, 25, "Christmas Day");
    add(addDays(easter, 1), "Easter Monday");
    add(addDays(easter, 39), "Ascension Day");
    add(addDays(easter, 50), "Whit Monday");
  }

  if (region === "ES") {
    fixed(1, 1, "New Year");
    fixed(1, 6, "Epiphany");
    fixed(5, 1, "Labour Day");
    fixed(8, 15, "Assumption");
    fixed(10, 12, "National Day");
    fixed(11, 1, "All Saints");
    fixed(12, 6, "Constitution Day");
    fixed(12, 8, "Immaculate Conception");
    fixed(12, 25, "Christmas Day");
    add(addDays(easter, -2), "Good Friday");
  }

  if (region === "IT") {
    fixed(1, 1, "New Year");
    fixed(1, 6, "Epiphany");
    fixed(4, 25, "Liberation Day");
    fixed(5, 1, "Labour Day");
    fixed(6, 2, "Republic Day");
    fixed(8, 15, "Ferragosto");
    fixed(11, 1, "All Saints");
    fixed(12, 8, "Immaculate Conception");
    fixed(12, 25, "Christmas Day");
    fixed(12, 26, "St Stephen");
    add(addDays(easter, 1), "Easter Monday");
  }

  if (region === "NL") {
    fixed(1, 1, "New Year");
    fixed(4, 27, "King's Day");
    fixed(5, 5, "Liberation Day");
    fixed(12, 25, "Christmas Day");
    fixed(12, 26, "Boxing Day");
    add(addDays(easter, 1), "Easter Monday");
    add(addDays(easter, 39), "Ascension Day");
    add(addDays(easter, 50), "Whit Monday");
  }

  if (region === "CA") {
    fixed(1, 1, "New Year");
    fixed(7, 1, "Canada Day");
    fixed(11, 11, "Remembrance Day");
    fixed(12, 25, "Christmas Day");
    fixed(12, 26, "Boxing Day");
    add(addDays(easter, -2), "Good Friday");
    add(nthWeekday(year, 8, 1, 1), "Labour Day");
    add(nthWeekday(year, 9, 1, 2), "Thanksgiving");
  }

  if (region === "AU") {
    fixed(1, 1, "New Year");
    fixed(1, 26, "Australia Day");
    fixed(4, 25, "Anzac Day");
    fixed(12, 25, "Christmas Day");
    fixed(12, 26, "Boxing Day");
    add(addDays(easter, -2), "Good Friday");
    add(addDays(easter, 1), "Easter Monday");
    add(nthWeekday(year, 3, 1, 2), "Easter Tuesday");
  }

  return holidays;
}

function quoteCollection(kind, language) {
  if (kind === "demotivational" && languageBase(language) === "de") {
    return demotivationalQuotesDe;
  }

  if (kind === "demotivational") {
    return demotivationalQuotesEn;
  }

  if (languageBase(language) === "de") {
    return funnyFactsDe;
  }

  return funnyFactsEn;
}

function dailyItem(items, dayOfYear) {
  return items[dayOfYear % items.length];
}

function buildDayProgressFact(now, language, dayOfYear) {
  const year = now.getFullYear();
  const totalDays = daysInYear(year);
  const percent = Math.round((dayOfYear / totalDays) * 100);

  return {
    title: text("dayProgress", language),
    text: `${text("dayOfYear", language, { day: dayOfYear, year })}. ${text("percentComplete", language, {
      percent,
    })}.`,
    meta: `${text("week", language, { week: isoWeek(now) })} - ${text("daysLeft", language, {
      days: totalDays - dayOfYear,
    })}`,
  };
}

function findNextObservance(now, observances) {
  for (let offset = 1; offset <= 366; offset += 1) {
    const candidate = addDays(now, offset);
    const label = observances[monthDayKey(candidate)];
    if (label) {
      return { date: candidate, label, offset };
    }
  }

  return null;
}

function buildHolidayObservanceFact(now, language, holidayRegion) {
  const observances = languageBase(language) === "de" ? observancesDe : observancesEn;
  const holiday = holidayMap(now.getFullYear(), holidayRegion).get(dateKey(now));
  const localizedHoliday = holiday ? holidayName(holiday, language) : "";
  const observance = observances[monthDayKey(now)];

  if (localizedHoliday || observance) {
    return {
      title: localizedHoliday ? text("holiday", language) : text("observance", language),
      text: uniqueLabels([localizedHoliday, observance]).join(" - "),
      meta: regionName(holidayRegion, language),
    };
  }

  const next = findNextObservance(now, observances);
  const formatter = safeFormatter(language, { month: "short", day: "numeric" });
  return {
    title: text("observance", language),
    text: text("noHoliday", language),
    meta: next
      ? `${text("nextObservance", language)}: ${next.label} (${formatter.format(next.date)})`
      : regionName(holidayRegion, language),
  };
}

function seasonForDate(date, language) {
  const monthDay = (date.getMonth() + 1) * 100 + date.getDate();
  if (monthDay >= 320 && monthDay < 621) return text("spring", language);
  if (monthDay >= 621 && monthDay < 923) return text("summer", language);
  if (monthDay >= 923 && monthDay < 1221) return text("autumn", language);
  return text("winter", language);
}

function daylightHours(date, latitude) {
  const day = getDayOfYear(date);
  const latRad = (latitude * Math.PI) / 180;
  const declination = (23.44 * Math.PI / 180) * Math.sin((2 * Math.PI * (day - 81)) / 365);
  const hourAngleInput = -Math.tan(latRad) * Math.tan(declination);

  if (hourAngleInput >= 1) {
    return 0;
  }

  if (hourAngleInput <= -1) {
    return 24;
  }

  return (24 / Math.PI) * Math.acos(hourAngleInput);
}

function formatDuration(hours, language) {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return languageBase(language) === "de" ? `${h} Std ${m} Min` : `${h}h ${m}m`;
}

function formatSolarClock(hours, language) {
  if (!Number.isFinite(hours)) {
    return "--:--";
  }

  const dayMinutes = 24 * 60;
  const normalizedMinutes = ((Math.round(hours * 60) % dayMinutes) + dayMinutes) % dayMinutes;
  const whole = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  const date = new Date(2000, 0, 1, whole, minutes);
  return safeFormatter(language, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildSeasonDaylightFact(now, language, latitude, longitude) {
  const daylight = daylightHours(now, latitude);
  const yesterday = daylightHours(addDays(now, -1), latitude);
  const diffMinutes = Math.round((daylight - yesterday) * 60);
  const timezoneOffsetHours = -now.getTimezoneOffset() / 60;
  const solarNoon = 12 + timezoneOffsetHours - longitude / 15;
  const sunrise = solarNoon - daylight / 2;
  const sunset = solarNoon + daylight / 2;
  const lightTrend = Math.abs(diffMinutes) < 1
    ? text("sameLight", language)
    : `${Math.abs(diffMinutes)} min ${diffMinutes > 0 ? text("moreLight", language) : text("lessLight", language)}`;

  return {
    title: seasonForDate(now, language),
    text: `${formatDuration(daylight, language)} ${text("daylight", language)}`,
    meta: `${text("sunrise", language)} ${formatSolarClock(sunrise, language)} - ${text("sunset", language)} ${formatSolarClock(sunset, language)} - ${lightTrend}`,
  };
}

function buildWordPhraseFact(language, dayOfYear) {
  const item = dailyItem(languageBase(language) === "de" ? wordsDe : wordsEn, dayOfYear);
  return {
    title: item.title,
    text: item.text,
    meta: item.meta,
  };
}

function buildCuriosityFact(language, dayOfYear) {
  const item = dailyItem(languageBase(language) === "de" ? curiositiesDe : curiositiesEn, dayOfYear);
  return {
    title: item.title,
    text: item.text,
    meta: item.meta,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
  };
}

function buildFact(kind, settings, now, dayOfYear) {
  if (kind === "day-progress") {
    return buildDayProgressFact(now, settings.language, dayOfYear);
  }

  if (kind === "holiday-observance") {
    return buildHolidayObservanceFact(now, settings.language, settings.holidayRegion);
  }

  if (kind === "season-daylight") {
    return buildSeasonDaylightFact(
      now,
      settings.language,
      settings.latitude,
      settings.longitude,
    );
  }

  if (kind === "word-phrase") {
    return buildWordPhraseFact(settings.language, dayOfYear);
  }

  if (kind === "curiosity") {
    return buildCuriosityFact(settings.language, dayOfYear);
  }

  return null;
}

export default async function handler({ query }) {
  const now = new Date();
  const kindValue = stringValue(query.kind, "primary");
  const kind = allowedKinds.has(kindValue) ? kindValue : "primary";
  const language = stringValue(query.language, "en-US");
  const showTime = booleanValue(query.showTime);
  const dayOfYear = getDayOfYear(now);
  const showQuote = kind === "demotivational" || kind === "funny";
  const settings = {
    color: stringValue(query.color, "dark"),
    kind,
    showTime,
    language,
    holidayRegion: normalizeEnum(query.holidayRegion, Object.keys(regionNames), "DE-BE"),
    latitude: numberValue(query.latitude, 52.52, -66, 66),
    longitude: numberValue(query.longitude, 13.405, -180, 180),
  };
  const fact = factKinds.has(kind) ? buildFact(kind, settings, now, dayOfYear) : null;
  const quotes = showQuote ? quoteCollection(kind, language) : [];
  const quote = fact?.text || (showQuote ? quotes[dayOfYear % quotes.length] : "");

  return {
    date: {
      formattedDate: safeDatePart(now, language, {
        month: "long",
        day: "numeric"
      }),
      day: safeDatePart(now, language, { day: "numeric" }),
      month: safeDatePart(now, language, { month: "long" }),
      weekday: safeDatePart(now, language, { weekday: "long" }),
      time: safeTime(now, language)
    },
    fact,
    quote,
    dayOfYear,
    settings,
    updatedAt: now.toISOString()
  };
}

export const __dayCalendarInternals = {
  buildDayProgressFact,
  buildHolidayObservanceFact,
  buildSeasonDaylightFact,
  buildWordPhraseFact,
  buildCuriosityFact,
  getDayOfYear,
  holidayMap,
};
