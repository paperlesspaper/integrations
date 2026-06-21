const countriesUrl = 'https://raw.githubusercontent.com/mledoze/countries/master/countries.json';

const fallbackCountries = [
  {
    area: 357114,
    borders: ['AUT', 'BEL', 'CZE', 'DNK', 'FRA', 'LUX', 'NLD', 'POL', 'CHE'],
    capital: ['Berlin'],
    cca2: 'DE',
    cca3: 'DEU',
    currencies: { EUR: { name: 'Euro', symbol: '€' } },
    flag: '🇩🇪',
    independent: true,
    landlocked: false,
    languages: { deu: 'German' },
    latlng: [51, 9],
    name: {
      common: 'Germany',
      official: 'Federal Republic of Germany',
      native: { deu: { common: 'Deutschland', official: 'Bundesrepublik Deutschland' } },
    },
    region: 'Europe',
    subregion: 'Western Europe',
    tld: ['.de'],
    translations: {
      deu: { common: 'Deutschland', official: 'Bundesrepublik Deutschland' },
      fra: { common: 'Allemagne', official: "Republique federale d'Allemagne" },
      ita: { common: 'Germania', official: 'Repubblica federale di Germania' },
      spa: { common: 'Alemania', official: 'Republica Federal de Alemania' },
    },
    unMember: true,
  },
  {
    area: 9372610,
    borders: ['CAN', 'MEX'],
    capital: ['Washington, D.C.'],
    cca2: 'US',
    cca3: 'USA',
    currencies: { USD: { name: 'United States dollar', symbol: '$' } },
    flag: '🇺🇸',
    independent: true,
    landlocked: false,
    languages: { eng: 'English' },
    latlng: [38, -97],
    name: {
      common: 'United States',
      official: 'United States of America',
      native: { eng: { common: 'United States', official: 'United States of America' } },
    },
    region: 'Americas',
    subregion: 'North America',
    tld: ['.us'],
    translations: {
      deu: { common: 'Vereinigte Staaten', official: 'Vereinigte Staaten von Amerika' },
      fra: { common: 'Etats-Unis', official: "Les Etats-Unis d'Amerique" },
      ita: { common: "Stati Uniti d'America", official: "Stati Uniti d'America" },
      spa: { common: 'Estados Unidos', official: 'Estados Unidos de America' },
    },
    unMember: true,
  },
  {
    area: 7692024,
    borders: [],
    capital: ['Canberra'],
    cca2: 'AU',
    cca3: 'AUS',
    currencies: { AUD: { name: 'Australian dollar', symbol: '$' } },
    flag: '🇦🇺',
    independent: true,
    landlocked: false,
    languages: { eng: 'English' },
    latlng: [-27, 133],
    name: {
      common: 'Australia',
      official: 'Commonwealth of Australia',
      native: { eng: { common: 'Australia', official: 'Commonwealth of Australia' } },
    },
    region: 'Oceania',
    subregion: 'Australia and New Zealand',
    tld: ['.au'],
    translations: {
      deu: { common: 'Australien', official: 'Commonwealth Australien' },
      fra: { common: 'Australie', official: "Commonwealth d'Australie" },
      ita: { common: 'Australia', official: 'Commonwealth of Australia' },
      spa: { common: 'Australia', official: 'Mancomunidad de Australia' },
    },
    unMember: true,
  },
  {
    area: 8515767,
    borders: ['ARG', 'BOL', 'COL', 'GUF', 'GUY', 'PRY', 'PER', 'SUR', 'URY', 'VEN'],
    capital: ['Brasilia'],
    cca2: 'BR',
    cca3: 'BRA',
    currencies: { BRL: { name: 'Brazilian real', symbol: 'R$' } },
    flag: '🇧🇷',
    independent: true,
    landlocked: false,
    languages: { por: 'Portuguese' },
    latlng: [-10, -55],
    name: {
      common: 'Brazil',
      official: 'Federative Republic of Brazil',
      native: { por: { common: 'Brasil', official: 'Republica Federativa do Brasil' } },
    },
    region: 'Americas',
    subregion: 'South America',
    tld: ['.br'],
    translations: {
      deu: { common: 'Brasilien', official: 'Foderative Republik Brasilien' },
      fra: { common: 'Bresil', official: 'Republique federative du Bresil' },
      ita: { common: 'Brasile', official: 'Repubblica federativa del Brasile' },
      spa: { common: 'Brasil', official: 'Republica Federativa del Brasil' },
    },
    unMember: true,
  },
  {
    area: 377930,
    borders: [],
    capital: ['Tokyo'],
    cca2: 'JP',
    cca3: 'JPN',
    currencies: { JPY: { name: 'Japanese yen', symbol: '¥' } },
    flag: '🇯🇵',
    independent: true,
    landlocked: false,
    languages: { jpn: 'Japanese' },
    latlng: [36, 138],
    name: {
      common: 'Japan',
      official: 'Japan',
      native: { jpn: { common: 'Nihon', official: 'Nippon-koku' } },
    },
    region: 'Asia',
    subregion: 'Eastern Asia',
    tld: ['.jp'],
    translations: {
      deu: { common: 'Japan', official: 'Japan' },
      fra: { common: 'Japon', official: 'Japon' },
      ita: { common: 'Giappone', official: 'Giappone' },
      spa: { common: 'Japon', official: 'Japon' },
    },
    unMember: true,
  },
];

const translationByLanguage = {
  de: 'deu',
  es: 'spa',
  fr: 'fra',
  it: 'ita',
};

function isEnabled(value) {
  return value === true || value === 'true' || value === '1';
}

function normalizeRegion(value) {
  const region = typeof value === 'string' ? value.trim() : '';
  return ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania', 'Antarctic'].includes(region)
    ? region
    : 'any';
}

function languageKey(value) {
  const language = typeof value === 'string' ? value.split('-')[0].toLowerCase() : 'en';
  return translationByLanguage[language] || '';
}

function dayKey(value) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return new Date().toISOString().slice(0, 10);
}

function dayNumber(key) {
  const [year, month, day] = key.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function hashText(value) {
  let hash = 2166136261;
  for (const char of String(value || '')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

async function fetchCountries() {
  const response = await fetch(countriesUrl, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'paperlesspaper-openintegrations/0.1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Country dataset request failed with ${response.status}`);
  }

  const countries = await response.json();
  if (!Array.isArray(countries) || countries.length < 100) {
    throw new Error('Country dataset response was not a country list');
  }

  return countries;
}

async function getCountries() {
  try {
    return { countries: await fetchCountries(), source: 'mledoze' };
  } catch (_error) {
    return { countries: fallbackCountries, source: 'fallback' };
  }
}

function displayName(country, langKey) {
  const translated = langKey ? country.translations?.[langKey]?.common : '';
  return translated || country.name?.common || country.cca3 || 'Unknown country';
}

function officialName(country, langKey) {
  const translated = langKey ? country.translations?.[langKey]?.official : '';
  return translated || country.name?.official || displayName(country, langKey);
}

function nativeName(country) {
  const values = Object.values(country.name?.native || {});
  return values[0]?.common || '';
}

function objectValues(value) {
  return Object.values(value || {}).filter(Boolean);
}

function currencies(country) {
  return objectValues(country.currencies).map((currency) => {
    const code = Object.entries(country.currencies || {}).find(([, item]) => item === currency)?.[0];
    return [currency.name, code].filter(Boolean).join(' ');
  });
}

function callingCode(country) {
  const root = country.idd?.root || '';
  const suffix = Array.isArray(country.idd?.suffixes) ? country.idd.suffixes[0] || '' : '';
  return root && suffix ? `${root}${suffix}` : '';
}

function findPinnedCountry(countries, value) {
  const needle = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!needle) {
    return null;
  }

  return countries.find((country) => {
    const names = [
      country.cca2,
      country.cca3,
      country.name?.common,
      country.name?.official,
      ...Object.values(country.translations || {}).flatMap((translation) => [
        translation.common,
        translation.official,
      ]),
    ];
    return names.filter(Boolean).some((name) => String(name).toLowerCase() === needle);
  }) || null;
}

function normalizeCountry(country, countries, langKey, meta) {
  const byCode = new Map(countries.map((item) => [item.cca3, item]));
  const borders = Array.isArray(country.borders)
    ? country.borders
        .map((code) => byCode.get(code))
        .filter(Boolean)
        .map((item) => displayName(item, langKey))
        .sort((a, b) => a.localeCompare(b))
    : [];

  return {
    area: Number(country.area) || 0,
    borders,
    callingCode: callingCode(country),
    capital: Array.isArray(country.capital) ? country.capital.filter(Boolean).join(', ') : '',
    cca2: country.cca2 || '',
    cca3: country.cca3 || '',
    currencies: currencies(country).slice(0, 4),
    dayKey: meta.day,
    flag: country.flag || '',
    independent: country.independent === true,
    index: meta.index,
    landlocked: country.landlocked === true,
    languages: objectValues(country.languages).sort((a, b) => a.localeCompare(b)).slice(0, 5),
    latlng: Array.isArray(country.latlng) ? country.latlng : [],
    name: displayName(country, langKey),
    nativeName: nativeName(country),
    officialName: officialName(country, langKey),
    poolSize: meta.poolSize,
    region: [country.region, country.subregion].filter(Boolean).join(' / '),
    source: meta.source,
    sourceUrl: countriesUrl,
    tlds: Array.isArray(country.tld) ? country.tld : [],
    unMember: country.unMember === true,
  };
}

export default async function handler({ query }) {
  const { countries, source } = await getCountries();
  const langKey = languageKey(query.language);
  const region = normalizeRegion(query.region);
  const independentOnly = query.independentOnly === undefined ? true : isEnabled(query.independentOnly);
  const day = dayKey(query.date);

  const sorted = countries
    .filter((country) => country && country.cca3 && country.name?.common)
    .filter((country) => region === 'any' || country.region === region)
    .filter((country) => !independentOnly || country.independent === true)
    .sort((a, b) => a.cca3.localeCompare(b.cca3));

  const pool = sorted.length ? sorted : countries.filter((country) => country?.cca3);
  const pinned = findPinnedCountry(countries, query.countryCode);
  const seed = typeof query.seed === 'string' ? query.seed : '';
  const index = (dayNumber(day) + hashText(`${seed}:${region}:${independentOnly}`)) % pool.length;
  const country = pinned || pool[index];

  return normalizeCountry(country, countries, langKey, {
    day,
    index,
    poolSize: pool.length,
    source,
  });
}
