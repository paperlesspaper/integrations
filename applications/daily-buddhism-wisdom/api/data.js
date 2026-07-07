const apiBaseUrl = "https://buddha-api.com/api";

const fallbackEntries = [
  {
    title: {
      en: "Buddha",
      de: "Buddha",
    },
    text: {
      en: "Radiate boundless love towards the entire world.",
      de: "Strahle grenzenlose Liebe auf die ganze Welt aus.",
    },
  },
  {
    title: {
      en: "Dogen",
      de: "Dogen",
    },
    text: {
      en: "Time is already existence, and all existence is time.",
      de: "Zeit ist bereits Existenz, und alle Existenz ist Zeit.",
    },
  },
  {
    title: {
      en: "Thich Nhat Hanh",
      de: "Thich Nhat Hanh",
    },
    text: {
      en: "Life is available only in the present moment.",
      de: "Das Leben ist nur im gegenwärtigen Augenblick verfügbar.",
    },
  },
];

const supportedLanguages = new Set(["en", "de"]);
const supportedAuthors = new Set([
  "buddha",
  "dalai_lama",
  "dogen",
  "thich_nhat_hanh",
]);

function pickLanguage(value) {
  const requested = String(value || "en").toLowerCase();
  const base = requested.split("-")[0];
  return supportedLanguages.has(requested)
    ? requested
    : supportedLanguages.has(base)
      ? base
      : "en";
}

function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff =
    date -
    start +
    (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60000;
  return Math.floor(diff / 86400000);
}

function pickAuthor(value) {
  const author = String(value || "").trim().toLowerCase();
  return supportedAuthors.has(author) ? author : "";
}

function fallbackEntry(dayOfYear, language, source = "fallback") {
  const entry = fallbackEntries[(dayOfYear - 1) % fallbackEntries.length];
  const isLocal = source === "local";

  return {
    title: entry.title[language] || entry.title.en,
    text: entry.text[language] || entry.text.en,
    attribution:
      language === "de"
        ? isLocal
          ? "Lokale Weisheitssammlung"
          : "Offline-Fallback nach Buddha API"
        : isLocal
          ? "Local wisdom collection"
          : "Offline fallback after Buddha API",
    source,
  };
}

function normalizeQuote(value) {
  if (!value || typeof value !== "object") {
    throw new Error("Buddha API returned an empty response.");
  }

  const text = typeof value.text === "string" ? value.text.trim() : "";
  const author = typeof value.byName === "string" ? value.byName.trim() : "";

  if (!text || !author) {
    throw new Error("Buddha API response is missing quote text or author.");
  }

  return {
    id: typeof value.id === "string" ? value.id : "",
    title: author,
    text,
    attribution: `${author} · Buddha API`,
    authorId: typeof value.byId === "string" ? value.byId : "",
    authorImage: typeof value.byImage === "string" ? value.byImage : "",
    source: "buddha-api",
    sourceUrl: "https://buddha-api.com/",
  };
}

async function fetchDailyQuote(author) {
  const url = new URL(`${apiBaseUrl}/today`);

  if (author) {
    url.searchParams.set("by", author);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Buddha API failed with ${response.status}`);
    }

    return normalizeQuote(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}

export default async function handler({ query }) {
  const language = pickLanguage(query.language);
  const author = pickAuthor(query.author || query.by);
  const dayOfYear = getDayOfYear();
  let entry;

  if (language === "de") {
    entry = fallbackEntry(dayOfYear, language, "local");
  } else {
    try {
      entry = await fetchDailyQuote(author);
    } catch (error) {
      entry = fallbackEntry(dayOfYear, language);
      entry.error = error.message;
    }
  }

  return {
    dayOfYear,
    entryCount: null,
    updatedAt: new Date().toISOString(),
    ...entry,
  };
}
