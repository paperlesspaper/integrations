import { demotivationalQuotesDe } from "./data/demotivational.de.js";
import { demotivationalQuotesEn } from "./data/demotivational.en.js";
import { funnyFactsDe } from "./data/funnyFacts.de.js";
import { funnyFactsEn } from "./data/funnyFacts.en.js";

const allowedKinds = new Set(["primary", "demotivational", "funny"]);

function stringValue(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function booleanValue(value) {
  return value === true || value === "true" || value === "1";
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

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function quoteCollection(kind, language) {
  if (kind === "demotivational" && language === "de") {
    return demotivationalQuotesDe;
  }

  if (kind === "demotivational") {
    return demotivationalQuotesEn;
  }

  if (language === "de") {
    return funnyFactsDe;
  }

  return funnyFactsEn;
}

export default async function handler({ query }) {
  const now = new Date();
  const kindValue = stringValue(query.kind, "primary");
  const kind = allowedKinds.has(kindValue) ? kindValue : "primary";
  const language = stringValue(query.language, "en-US");
  const showTime = booleanValue(query.showTime);
  const dayOfYear = getDayOfYear(now);
  const showQuote = kind === "demotivational" || kind === "funny";
  const quotes = showQuote ? quoteCollection(kind, language) : [];

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
    quote: showQuote ? quotes[dayOfYear % quotes.length] : "",
    dayOfYear,
    settings: {
      color: stringValue(query.color, "dark"),
      kind,
      showTime,
      language
    },
    updatedAt: now.toISOString()
  };
}
