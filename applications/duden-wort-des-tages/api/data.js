const dudenBaseUrl = 'https://www.duden.de';
const wordOfTheDayUrl = `${dudenBaseUrl}/wort-des-tages`;

const namedEntities = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
  shy: '',
};

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'de-DE,de;q=0.9,en;q=0.5',
      'User-Agent': 'paperlesspaper-openintegrations/0.1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Duden request failed with ${response.status}`);
  }

  return response.text();
}

function decodeHtml(value) {
  return String(value || '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity) => {
    if (entity[0] === '#') {
      const codePoint = entity[1]?.toLowerCase() === 'x'
        ? Number.parseInt(entity.slice(2), 16)
        : Number.parseInt(entity.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }

    return Object.prototype.hasOwnProperty.call(namedEntities, entity)
      ? namedEntities[entity]
      : match;
  });
}

function stripTags(value) {
  return decodeHtml(String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|li|div|dd|dt|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' '));
}

function normalizeText(value) {
  return stripTags(value)
    .replace(/\u00ad/g, '')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function firstMatch(html, pattern) {
  const match = html.match(pattern);
  return match ? normalizeText(match[1]) : '';
}

function attrValue(tag, attribute) {
  const pattern = new RegExp(`${attribute}\\s*=\\s*(['"])(.*?)\\1`, 'i');
  return tag.match(pattern)?.[2] || '';
}

function findLinkByClass(html, className) {
  const links = html.match(/<a\b[^>]*>/gi) || [];
  for (const link of links) {
    const classes = attrValue(link, 'class').split(/\s+/);
    if (classes.includes(className)) {
      return decodeHtml(attrValue(link, 'href'));
    }
  }
  return '';
}

function cleanWordPath(value) {
  const path = typeof value === 'string' ? value.trim() : '';
  if (!path) {
    return '';
  }

  try {
    const parsed = new URL(path, dudenBaseUrl);
    if (parsed.origin === dudenBaseUrl && parsed.pathname.startsWith('/rechtschreibung/')) {
      return `${parsed.pathname}${parsed.search}`;
    }
  } catch (_error) {
    // Fall through to the strict relative-path check below.
  }

  return path.startsWith('/rechtschreibung/') && !path.includes('://') ? path : '';
}

function extractSection(html, id) {
  const marker = `id="${id}"`;
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) {
    return '';
  }

  const start = html.lastIndexOf('<div', markerIndex);
  const nextDivision = html.indexOf('<div class="division "', markerIndex + marker.length);
  const articleEnd = html.indexOf('</article>', markerIndex + marker.length);
  const endCandidates = [nextDivision, articleEnd].filter((index) => index > markerIndex);
  const end = endCandidates.length ? Math.min(...endCandidates) : html.length;

  return html.slice(start >= 0 ? start : markerIndex, end);
}

function extractParagraphs(section) {
  return Array.from(section.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi))
    .map((match) => normalizeText(match[1]))
    .filter(Boolean);
}

function extractDefinitionItems(section) {
  const itemPatterns = [
    /<[^>]+class=["'][^"']*\benumeration__text\b[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/gi,
    /<li\b[^>]*>([\s\S]*?)<\/li>/gi,
  ];

  for (const pattern of itemPatterns) {
    const items = Array.from(section.matchAll(pattern))
      .map((match) => normalizeText(match[1]).replace(/\s\(\d+\)$/g, ''))
      .filter(Boolean);
    if (items.length) {
      return items;
    }
  }

  return [];
}

function tupleValue(html, label) {
  const tuples = html.match(/<dl class="tuple">[\s\S]*?<\/dl>/gi) || [];
  for (const tuple of tuples) {
    const key = firstMatch(tuple, /<dt\b[^>]*class=["'][^"']*\btuple__key\b[^"']*["'][^>]*>([\s\S]*?)<\/dt>/i);
    if (key.toLowerCase().startsWith(label.toLowerCase())) {
      return firstMatch(tuple, /<dd\b[^>]*class=["'][^"']*\btuple__val\b[^"']*["'][^>]*>([\s\S]*?)<\/dd>/i);
    }
  }
  return '';
}

function createFrequency(html) {
  const full = firstMatch(html, /<span\b[^>]*class=["'][^"']*\bshaft__full\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i).length;
  const empty = firstMatch(html, /<span\b[^>]*class=["'][^"']*\bshaft__empty\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i).length;
  const total = full + empty;

  if (!total) {
    return 'N/A';
  }

  return `${'\u25ae'.repeat(full)}${'\u25af'.repeat(empty)}`;
}

function extractWordData(html, wordPath) {
  const meaningSection = extractSection(html, 'bedeutung') || extractSection(html, 'bedeutungen');
  const meanings = extractDefinitionItems(meaningSection);
  if (!meanings.length) {
    meanings.push(...extractParagraphs(meaningSection));
  }

  const originSection = extractSection(html, 'herkunft');
  const origins = extractParagraphs(originSection);

  return {
    word: firstMatch(html, /<span\b[^>]*class=["'][^"']*\blemma__main\b[^"']*["'][^>]*>([\s\S]*?)<\/span>/i) || 'N/A',
    meaning: meanings.join('\n') || 'N/A',
    usage: tupleValue(html, 'Gebrauch') || 'N/A',
    type: tupleValue(html, 'Wortart') || 'N/A',
    origin: origins.join(' ') || 'N/A',
    frequency: createFrequency(html),
    url: `${dudenBaseUrl}${wordPath}`,
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler({ query }) {
  let wordPath = cleanWordPath(query.wordPath);

  if (!wordPath) {
    const overviewHtml = await fetchHtml(wordOfTheDayUrl);
    wordPath = cleanWordPath(findLinkByClass(overviewHtml, 'scene__title-link'));
  }

  if (!wordPath) {
    throw new Error('Duden word-of-the-day link could not be found');
  }

  const wordHtml = await fetchHtml(`${dudenBaseUrl}${wordPath}`);
  return extractWordData(wordHtml, wordPath);
}
