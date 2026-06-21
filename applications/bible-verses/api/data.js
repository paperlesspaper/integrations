const bibleApiTranslations = {
  asv: {
    name: "American Standard Version",
    shortName: "ASV",
    license: "Public Domain",
  },
  kjv: {
    name: "King James Version",
    shortName: "KJV",
    license: "Public Domain",
  },
  web: {
    name: "World English Bible",
    shortName: "WEB",
    license: "Public Domain",
  },
};

const bollsTranslations = {
  asv: {
    name: "American Standard Version",
    shortName: "ASV",
    slug: "ASV",
    language: "en",
  },
  kjv: {
    name: "King James Version",
    shortName: "KJV",
    slug: "KJV",
    language: "en",
  },
  web: {
    name: "World English Bible",
    shortName: "WEB",
    slug: "WEB",
    language: "en",
  },
  lut: {
    name: "Luther 1912",
    shortName: "LUT",
    slug: "LUT",
    language: "de",
  },
  elb: {
    name: "Elberfelder Bibel 1871",
    shortName: "ELB",
    slug: "ELB",
    language: "de",
  },
  sch: {
    name: "Schlachter 1951",
    shortName: "SCH",
    slug: "SCH",
    language: "de",
  },
  mb: {
    name: "Menge-Bibel",
    shortName: "MB",
    slug: "MB",
    language: "de",
  },
};

const sources = {
  "bible-api": {
    name: "bible-api.com",
    versions: bibleApiTranslations,
  },
  bolls: {
    name: "Bolls Bible API",
    versions: bollsTranslations,
  },
};

const modes = {
  random: "Random verse",
  daily: "Verse of the day",
};

const dailyVersesTranslations = {
  af: {
    default: {
      name: "Afrikaans",
      shortName: "AF",
      path: "/af",
    },
  },
  ar: {
    default: {
      name: "Arabic",
      shortName: "AR",
      path: "/ar",
    },
  },
  bn: {
    default: {
      name: "Bengali",
      shortName: "BN",
      path: "/bn",
    },
  },
  cs: {
    default: {
      name: "Czech",
      shortName: "CS",
      path: "/cs",
    },
  },
  da: {
    default: {
      name: "Danish",
      shortName: "DA",
      path: "/da",
    },
  },
  en: {
    asv: null,
    kjv: {
      name: "King James Version",
      shortName: "KJV",
      path: "/kjv",
    },
    web: {
      name: "World English Bible",
      shortName: "WEB",
      path: "/web",
    },
    default: {
      name: "World English Bible",
      shortName: "WEB",
      path: "/web",
    },
  },
  de: {
    elb: {
      name: "Elberfelder Bibel",
      shortName: "ELB",
      path: "/de/elb",
    },
    lut: {
      name: "Luther 1912",
      shortName: "LU12",
      path: "/de/lu12",
    },
    default: {
      name: "Luther 2017",
      shortName: "LUT",
      path: "/de",
    },
  },
  el: {
    default: {
      name: "Greek",
      shortName: "EL",
      path: "/el",
    },
  },
  es: {
    default: {
      name: "Spanish",
      shortName: "ES",
      path: "/es",
    },
  },
  fa: {
    default: {
      name: "Persian",
      shortName: "FA",
      path: "/fa",
    },
  },
  fi: {
    default: {
      name: "Finnish",
      shortName: "FI",
      path: "/fi",
    },
  },
  fr: {
    default: {
      name: "French",
      shortName: "FR",
      path: "/fr",
    },
  },
  hi: {
    default: {
      name: "Hindi",
      shortName: "HI",
      path: "/hi",
    },
  },
  hu: {
    default: {
      name: "Hungarian",
      shortName: "HU",
      path: "/hu",
    },
  },
  it: {
    default: {
      name: "Italian",
      shortName: "IT",
      path: "/it",
    },
  },
  mg: {
    default: {
      name: "Malagasy",
      shortName: "MG",
      path: "/mg",
    },
  },
  nl: {
    default: {
      name: "Dutch",
      shortName: "NL",
      path: "/nl",
    },
  },
  pl: {
    default: {
      name: "Polish",
      shortName: "PL",
      path: "/pl",
    },
  },
  pt: {
    default: {
      name: "Portuguese",
      shortName: "PT",
      path: "/pt",
    },
  },
  ru: {
    default: {
      name: "Russian",
      shortName: "RU",
      path: "/ru",
    },
  },
  sk: {
    default: {
      name: "Slovak",
      shortName: "SK",
      path: "/sk",
    },
  },
  st: {
    default: {
      name: "Southern Sotho",
      shortName: "ST",
      path: "/st",
    },
  },
  tc: {
    default: {
      name: "Chinese Traditional",
      shortName: "ZH",
      path: "/tc",
    },
  },
  ur: {
    default: {
      name: "Urdu",
      shortName: "UR",
      path: "/ur",
    },
  },
  xh: {
    default: {
      name: "Xhosa",
      shortName: "XH",
      path: "/xh",
    },
  },
  zu: {
    default: {
      name: "Zulu",
      shortName: "ZU",
      path: "/zu",
    },
  },
};

const scopes = {
  all: "",
  ot: "OT",
  nt: "NT",
};

const englishBookNames = [
  "",
  "Genesis",
  "Exodus",
  "Leviticus",
  "Numbers",
  "Deuteronomy",
  "Joshua",
  "Judges",
  "Ruth",
  "1 Samuel",
  "2 Samuel",
  "1 Kings",
  "2 Kings",
  "1 Chronicles",
  "2 Chronicles",
  "Ezra",
  "Nehemiah",
  "Esther",
  "Job",
  "Psalms",
  "Proverbs",
  "Ecclesiastes",
  "Song of Solomon",
  "Isaiah",
  "Jeremiah",
  "Lamentations",
  "Ezekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadiah",
  "Jonah",
  "Micah",
  "Nahum",
  "Habakkuk",
  "Zephaniah",
  "Haggai",
  "Zechariah",
  "Malachi",
  "Matthew",
  "Mark",
  "Luke",
  "John",
  "Acts",
  "Romans",
  "1 Corinthians",
  "2 Corinthians",
  "Galatians",
  "Ephesians",
  "Philippians",
  "Colossians",
  "1 Thessalonians",
  "2 Thessalonians",
  "1 Timothy",
  "2 Timothy",
  "Titus",
  "Philemon",
  "Hebrews",
  "James",
  "1 Peter",
  "2 Peter",
  "1 John",
  "2 John",
  "3 John",
  "Jude",
  "Revelation",
];

const germanBookNames = [
  "",
  "1. Mose",
  "2. Mose",
  "3. Mose",
  "4. Mose",
  "5. Mose",
  "Josua",
  "Richter",
  "Rut",
  "1. Samuel",
  "2. Samuel",
  "1. Konige",
  "2. Konige",
  "1. Chronik",
  "2. Chronik",
  "Esra",
  "Nehemia",
  "Ester",
  "Hiob",
  "Psalmen",
  "Spruche",
  "Prediger",
  "Hohelied",
  "Jesaja",
  "Jeremia",
  "Klagelieder",
  "Hesekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadja",
  "Jona",
  "Micha",
  "Nahum",
  "Habakuk",
  "Zephanja",
  "Haggai",
  "Sacharja",
  "Maleachi",
  "Matthaus",
  "Markus",
  "Lukas",
  "Johannes",
  "Apostelgeschichte",
  "Romer",
  "1. Korinther",
  "2. Korinther",
  "Galater",
  "Epheser",
  "Philipper",
  "Kolosser",
  "1. Thessalonicher",
  "2. Thessalonicher",
  "1. Timotheus",
  "2. Timotheus",
  "Titus",
  "Philemon",
  "Hebraer",
  "Jakobus",
  "1. Petrus",
  "2. Petrus",
  "1. Johannes",
  "2. Johannes",
  "3. Johannes",
  "Judas",
  "Offenbarung",
];

const bibleserverBookSlugs = [
  "",
  "1.Mose",
  "2.Mose",
  "3.Mose",
  "4.Mose",
  "5.Mose",
  "Josua",
  "Richter",
  "Rut",
  "1.Samuel",
  "2.Samuel",
  "1.Könige",
  "2.Könige",
  "1.Chronik",
  "2.Chronik",
  "Esra",
  "Nehemia",
  "Ester",
  "Hiob",
  "Psalmen",
  "Sprüche",
  "Prediger",
  "Hohelied",
  "Jesaja",
  "Jeremia",
  "Klagelieder",
  "Hesekiel",
  "Daniel",
  "Hosea",
  "Joel",
  "Amos",
  "Obadja",
  "Jona",
  "Micha",
  "Nahum",
  "Habakuk",
  "Zephanja",
  "Haggai",
  "Sacharja",
  "Maleachi",
  "Matthäus",
  "Markus",
  "Lukas",
  "Johannes",
  "Apostelgeschichte",
  "Römer",
  "1.Korinther",
  "2.Korinther",
  "Galater",
  "Epheser",
  "Philipper",
  "Kolosser",
  "1.Thessalonicher",
  "2.Thessalonicher",
  "1.Timotheus",
  "2.Timotheus",
  "Titus",
  "Philemon",
  "Hebräer",
  "Jakobus",
  "1.Petrus",
  "2.Petrus",
  "1.Johannes",
  "2.Johannes",
  "3.Johannes",
  "Judas",
  "Offenbarung",
];

const fallbackVerses = {
  en: [
    {
      book: "Psalms",
      chapter: 119,
      verse: 105,
      text: "Your word is a lamp to my feet, and a light for my path.",
    },
    {
      book: "Romans",
      chapter: 12,
      verse: 12,
      text: "rejoicing in hope; enduring in troubles; continuing steadfastly in prayer;",
    },
    {
      book: "John",
      chapter: 1,
      verse: 5,
      text: "The light shines in the darkness, and the darkness has not overcome it.",
    },
  ],
  de: [
    {
      book: "Psalmen",
      chapter: 119,
      verse: 105,
      text: "Dein Wort ist meines Fusses Leuchte und ein Licht auf meinem Wege.",
    },
    {
      book: "Romer",
      chapter: 12,
      verse: 12,
      text: "Seid frohlich in Hoffnung, geduldig in Trubsal, haltet an am Gebet.",
    },
    {
      book: "Johannes",
      chapter: 1,
      verse: 5,
      text: "Und das Licht scheint in der Finsternis, und die Finsternis hat's nicht begriffen.",
    },
  ],
};

function normalizeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function dailyIndex(length) {
  const now = new Date();
  const start = Date.UTC(now.getUTCFullYear(), 0, 0);
  const day = Math.floor((Date.now() - start) / 86400000);
  return Math.abs(day) % length;
}

function normalizeVerseText(text) {
  return decodeEntities(stripHtml(stripStrongMarkup(text)))
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
}

function stripStrongMarkup(text) {
  return String(text || "")
    .replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/gi, "")
    .replace(/<span\b[^>]*(?:strong|strongs|number)[^>]*>[\s\S]*?<\/span>/gi, "")
    .replace(/<[^>]*>\s*(?:G|H)?\d+\s*<\/[^>]+>/gi, "");
}

function stripHtml(text) {
  return String(text || "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "");
}

function decodeEntities(text) {
  return String(text || "").replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (match, entity) => {
    const lower = entity.toLowerCase();
    const named = {
      amp: "&",
      apos: "'",
      gt: ">",
      lt: "<",
      nbsp: " ",
      quot: '"',
    };

    if (named[lower]) {
      return named[lower];
    }

    if (lower.startsWith("#x")) {
      const code = Number.parseInt(lower.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }

    if (lower.startsWith("#")) {
      const code = Number.parseInt(lower.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }

    return match;
  });
}

function bookName(bookId, language) {
  const names = language === "de" ? germanBookNames : englishBookNames;
  return names[bookId] || `Book ${bookId}`;
}

function matchesScope(bookId, scope) {
  if (scope === "ot") {
    return bookId >= 1 && bookId <= 39;
  }

  if (scope === "nt") {
    return bookId >= 40 && bookId <= 66;
  }

  return bookId >= 1 && bookId <= 66;
}

function fallbackVerse({ source, version, scope, translation }) {
  const language = translation.language === "de" ? "de" : "en";
  const candidates = fallbackVerses[language] || fallbackVerses.en;
  const verse = candidates[dailyIndex(candidates.length)];

  return {
    ...verse,
    text: normalizeVerseText(verse.text),
    reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
    mode: "random",
    source,
    version,
    scope,
    translation,
    updatedAt: new Date().toISOString(),
    sourceName: "Local fallback",
    sourceUrl: "",
    isFallback: true,
  };
}

function fallbackDailyVerse({ version, language, translation }) {
  const fallbackTranslation =
    translation || dailyVersesTranslation(version, language).translation;
  const candidates = fallbackVerses[language] || fallbackVerses.en;
  const verse = candidates[dailyIndex(candidates.length)];

  return {
    ...verse,
    text: normalizeVerseText(verse.text),
    reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
    mode: "daily",
    source: "dailyverses",
    version,
    scope: "all",
    translation: fallbackTranslation,
    updatedAt: new Date().toISOString(),
    sourceName: "Local fallback",
    sourceUrl: "",
    isFallback: true,
  };
}

function bibleApiVerseUrl(verse, version) {
  const reference = `${verse.book} ${verse.chapter}:${verse.verse}`;
  return `https://bible-api.com/${encodeURIComponent(reference)}?translation=${encodeURIComponent(version)}`;
}

function bollsVerseUrl(translation, verse) {
  return `https://bolls.life/get-verse/${encodeURIComponent(translation.slug)}/${Number(verse.book)}/${Number(verse.chapter)}/${Number(verse.verse)}/`;
}

function bibleGatewayUrl(reference, version) {
  const url = new URL("https://www.biblegateway.com/passage/");
  url.searchParams.set("search", reference);
  url.searchParams.set("version", String(version || "WEB").toUpperCase());
  return url.toString();
}

function bibleserverVersion(version) {
  const map = {
    elb: "ELB",
    lut: "LUT",
    mb: "MENG",
    sch: "SLT",
  };

  return map[version] || "LUT";
}

function bibleserverUrl(version, bookId, chapter, verse) {
  const book = bibleserverBookSlugs[Number(bookId)] || bookName(Number(bookId), "de").replace(/\s+/g, "");
  const reference = `${book}${Number(chapter)},${Number(verse)}`;
  return `https://www.bibleserver.com/${bibleserverVersion(version)}/${encodeURIComponent(reference)}`;
}

function dailyVersesTranslation(version, language) {
  const languageKey = dailyVersesTranslations[language] ? language : "en";
  const translations = dailyVersesTranslations[languageKey];
  const translation = translations[version] || translations.default;
  return {
    language: languageKey,
    translation: {
      name: translation.name,
      shortName: translation.shortName,
      language: languageKey,
    },
    url: `https://dailyverses.net${translation.path}`,
  };
}

function absoluteDailyVersesUrl(pathOrUrl) {
  if (!pathOrUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return `https://dailyverses.net${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

function parseDailyVersesPage(html, version, sourceUrl, language, translation) {
  const verseBlockMatch = String(html).match(
    /<div class="b1"><span class="v1">([\s\S]*?)<\/span><div class="vr">([\s\S]*?)<\/div>/,
  );

  if (!verseBlockMatch) {
    throw new Error("DailyVerses page did not contain the daily verse.");
  }

  const text = normalizeVerseText(verseBlockMatch[1]);
  const referenceMatch = verseBlockMatch[2].match(
    /<a\b(?=[^>]*class="vc")(?=[^>]*href="([^"]+)")[^>]*>([\s\S]*?)<\/a>/,
  );

  if (!text || !referenceMatch) {
    throw new Error("DailyVerses page did not contain a readable reference.");
  }

  const shareUrlMatch = String(html).match(
    /https:\/\/dailyverses\.net(?:\/[a-z-]+)?\/\d{4}\/\d{1,2}\/\d{1,2}/,
  );
  const reference = normalizeVerseText(referenceMatch[2]);

  return {
    book: reference.replace(/\s+\d+:\d+(?:-\d+)?$/, ""),
    chapter: "",
    verse: "",
    text,
    reference,
    mode: "daily",
    source: "dailyverses",
    version,
    scope: "all",
    translation,
    updatedAt: new Date().toISOString(),
    sourceName: "DailyVerses.net",
    sourceUrl: shareUrlMatch?.[0] || absoluteDailyVersesUrl(referenceMatch[1]),
    apiSourceUrl: sourceUrl,
    randomSourceUrl: "",
    isFallback: false,
    language,
  };
}

function parseBibleApiRandomVerse(payload, version, scope, sourceUrl) {
  const verse = payload?.random_verse;

  if (!verse || !verse.book || !verse.chapter || !verse.verse || !verse.text) {
    throw new Error("Bible API response did not contain a verse.");
  }

  const translation = payload.translation || bibleApiTranslations[version];

  return {
    book: verse.book,
    chapter: verse.chapter,
    verse: verse.verse,
    text: normalizeVerseText(verse.text),
    reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
    mode: "random",
    source: "bible-api",
    version,
    scope,
    translation: {
      name: translation.name || bibleApiTranslations[version].name,
      shortName:
        translation.identifier?.toUpperCase() ||
        bibleApiTranslations[version].shortName,
      license: translation.license || bibleApiTranslations[version].license,
      language: "en",
    },
    updatedAt: new Date().toISOString(),
    sourceName: sources["bible-api"].name,
    sourceUrl: bibleGatewayUrl(`${verse.book} ${verse.chapter}:${verse.verse}`, version),
    apiSourceUrl: bibleApiVerseUrl(verse, version),
    randomSourceUrl: sourceUrl,
    isFallback: false,
  };
}

function parseBollsRandomVerse(payload, version, scope, sourceUrl) {
  const translation = bollsTranslations[version];

  if (!payload || !payload.book || !payload.chapter || !payload.verse || !payload.text) {
    throw new Error("Bolls response did not contain a verse.");
  }

  const book = Number(payload.book);
  const reference = `${bookName(book, translation.language)} ${payload.chapter}:${payload.verse}`;

  return {
    book: bookName(book, translation.language),
    chapter: payload.chapter,
    verse: payload.verse,
    text: normalizeVerseText(payload.text),
    reference,
    mode: "random",
    source: "bolls",
    version,
    scope,
    translation,
    updatedAt: new Date().toISOString(),
    sourceName: sources.bolls.name,
    sourceUrl:
      translation.language === "de"
        ? bibleserverUrl(version, book, payload.chapter, payload.verse)
        : bibleGatewayUrl(reference, translation.shortName),
    apiSourceUrl: bollsVerseUrl(translation, payload),
    randomSourceUrl: sourceUrl,
    isFallback: false,
    bookId: book,
  };
}

async function fetchJson(sourceUrl, timeoutMs = 3500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(sourceUrl, {
      headers: { accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API failed with ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchText(sourceUrl, timeoutMs = 3500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(sourceUrl, {
      headers: { accept: "text/html" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API failed with ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchBibleApiRandomVerse(version, scope) {
  const scopePart = scopes[scope] ? `/${scopes[scope]}` : "";
  const sourceUrl = `https://bible-api.com/data/${version}/random${scopePart}`;
  return parseBibleApiRandomVerse(
    await fetchJson(sourceUrl),
    version,
    scope,
    sourceUrl,
  );
}

async function fetchBollsRandomVerse(version, scope) {
  const translation = bollsTranslations[version];
  const sourceUrl = `https://bolls.life/get-random-verse/${translation.slug}/`;
  const attempts = scope === "all" ? 1 : 8;
  let lastVerse;

  for (let index = 0; index < attempts; index += 1) {
    const verse = parseBollsRandomVerse(
      await fetchJson(sourceUrl),
      version,
      scope,
      sourceUrl,
    );
    lastVerse = verse;

    if (matchesScope(verse.bookId, scope)) {
      return verse;
    }
  }

  return lastVerse;
}

async function fetchDailyVerse(version, language) {
  const daily = dailyVersesTranslation(version, language);
  return parseDailyVersesPage(
    await fetchText(daily.url),
    version,
    daily.url,
    daily.language,
    daily.translation,
  );
}

export default async function handler({ query = {} }) {
  const mode = normalizeEnum(query.mode, Object.keys(modes), "random");
  const source = normalizeEnum(query.source, Object.keys(sources), "bible-api");
  const sourceConfig = sources[source];
  const randomVersion = normalizeEnum(
    query.version,
    Object.keys(sourceConfig.versions),
    source === "bolls" ? "lut" : "web",
  );
  const scope = normalizeEnum(query.scope, Object.keys(scopes), "all");
  const randomTranslation = sourceConfig.versions[randomVersion];
  const language = normalizeEnum(
    String(query.language || randomTranslation.language || "en").split("-")[0].toLowerCase(),
    Object.keys(dailyVersesTranslations),
    randomTranslation.language || "en",
  );
  const dailyVersions = Array.from(
    new Set([...Object.keys(bibleApiTranslations), ...Object.keys(bollsTranslations)]),
  );
  const version =
    mode === "daily"
      ? normalizeEnum(query.version, dailyVersions, language === "de" ? "lut" : "web")
      : randomVersion;
  const translation = sourceConfig.versions[randomVersion];

  try {
    if (mode === "daily") {
      return await fetchDailyVerse(version, language);
    }

    if (source === "bolls") {
      return await fetchBollsRandomVerse(version, scope);
    }

    return await fetchBibleApiRandomVerse(version, scope);
  } catch (_error) {
    if (mode === "daily") {
      return fallbackDailyVerse({ version, language });
    }

    return fallbackVerse({ source, version, scope, translation });
  }
}
