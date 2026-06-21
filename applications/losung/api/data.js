const losungenBaseUrl = 'https://www.losungen.de/fileadmin/media-losungen/heute';

const namedEntities = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"',
  auml: '\u00e4',
  Auml: '\u00c4',
  ouml: '\u00f6',
  Ouml: '\u00d6',
  uuml: '\u00fc',
  Uuml: '\u00dc',
  szlig: '\u00df',
  middot: '\u00b7',
};

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
    .replace(/<[^>]+>/g, ' '));
}

function normalizeText(value) {
  return stripTags(value)
    .replace(/\u00ad/g, '')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function toDateOffset(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }
  return Math.max(-366, Math.min(366, Math.trunc(number)));
}

function createTargetDate(query) {
  const explicitDate = typeof query.date === 'string' ? query.date.trim() : '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(explicitDate)) {
    const [year, month, day] = explicitDate.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  const target = new Date();
  target.setHours(12, 0, 0, 0);
  target.setDate(target.getDate() + toDateOffset(query.dateOffset));
  return target;
}

function createLosungUrl(date) {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${losungenBaseUrl}/${year}/${month}${day}.html`;
}

async function fetchLosungenHtml(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'de-DE,de;q=0.9,en;q=0.5',
      'User-Agent': 'paperlesspaper-openintegrations/0.1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Losungen request failed with ${response.status}`);
  }

  return response.text();
}

function extractDateLabel(html) {
  const match = html.match(/Losung und Lehrtext f(?:&uuml;|ue|u)r\s+([^<]+)/i);
  return match ? normalizeText(match[1]) : '';
}

function extractVerseBlock(block) {
  const parts = String(block || '').split(/<br\s*\/?>/i);
  const text = normalizeText(parts[0] || '');
  const reference = normalizeText(parts.slice(1).join(' '));

  if (!text || !reference) {
    throw new Error('Losungen verse block could not be parsed');
  }

  return { text, reference };
}

function extractLosungen(html) {
  const blocks = Array.from(html.matchAll(/<p>\s*<font\b[^>]*>([\s\S]*?)<\/font>\s*<\/p>/gi))
    .map((match) => match[1])
    .filter(Boolean);

  if (blocks.length < 2) {
    throw new Error('Losungen page did not contain both text blocks');
  }

  return {
    losung: extractVerseBlock(blocks[0]),
    lehrtext: extractVerseBlock(blocks[1]),
  };
}

function toIsoDate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export default async function handler({ query }) {
  const targetDate = createTargetDate(query || {});
  const url = createLosungUrl(targetDate);
  const html = await fetchLosungenHtml(url);
  const data = extractLosungen(html);

  return {
    date: toIsoDate(targetDate),
    dateLabel: extractDateLabel(html),
    url,
    losung: data.losung,
    lehrtext: data.lehrtext,
    updatedAt: new Date().toISOString(),
  };
}
