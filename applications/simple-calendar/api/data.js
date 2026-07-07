const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const regionNames = {
  off: 'Off',
  DE: 'Germany',
  'DE-BE': 'Berlin',
  AT: 'Austria',
  CH: 'Switzerland',
  US: 'United States',
  'GB-ENG': 'England',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  CA: 'Canada',
  AU: 'Australia',
};

const localizedRegionNames = {
  de: {
    off: 'Aus',
    DE: 'Deutschland',
    'DE-BE': 'Berlin',
    AT: 'Österreich',
    CH: 'Schweiz',
    US: 'Vereinigte Staaten',
    'GB-ENG': 'England',
    FR: 'Frankreich',
    ES: 'Spanien',
    IT: 'Italien',
    NL: 'Niederlande',
    CA: 'Kanada',
    AU: 'Australien',
  },
};

const localizedHolidayNames = {
  de: {
    'All Saints': 'Allerheiligen',
    'Anzac Day': 'Anzac Day',
    Armistice: 'Waffenstillstandstag',
    'Ascension Day': 'Christi Himmelfahrt',
    Assumption: 'Mariä Himmelfahrt',
    'Australia Day': 'Australia Day',
    'Bastille Day': 'Französischer Nationalfeiertag',
    'Boxing Day': '2. Weihnachtstag',
    'Canada Day': 'Canada Day',
    'Christmas Day': '1. Weihnachtstag',
    'Columbus Day': 'Columbus Day',
    'Constitution Day': 'Tag der Verfassung',
    'Corpus Christi': 'Fronleichnam',
    'Early May Bank Holiday': 'Maifeiertag',
    'Easter Monday': 'Ostermontag',
    'Easter Tuesday': 'Osterdienstag',
    Epiphany: 'Heilige Drei Könige',
    Ferragosto: 'Ferragosto',
    'German Unity Day': 'Tag der Deutschen Einheit',
    'Good Friday': 'Karfreitag',
    'Immaculate Conception': 'Mariä Empfängnis',
    'Independence Day': 'Unabhängigkeitstag',
    Juneteenth: 'Juneteenth',
    "King's Day": 'Königstag',
    'Labor Day': 'Labor Day',
    'Labour Day': 'Tag der Arbeit',
    'Liberation Day': 'Tag der Befreiung',
    'Memorial Day': 'Memorial Day',
    'MLK Day': 'Martin Luther King Day',
    'National Day': 'Nationalfeiertag',
    'New Year': 'Neujahr',
    'Presidents Day': 'Presidents Day',
    'Remembrance Day': 'Remembrance Day',
    'Republic Day': 'Tag der Republik',
    'Spring Bank Holiday': 'Frühlings-Bankfeiertag',
    'St Stephen': 'Stephanstag',
    'Summer Bank Holiday': 'Sommer-Bankfeiertag',
    Thanksgiving: 'Thanksgiving',
    'Veterans Day': 'Veterans Day',
    'Victory Day': 'Tag des Sieges',
    'Whit Monday': 'Pfingstmontag',
    "Women's Day": 'Frauentag',
  },
};

function localeLanguage(locale) {
  return String(locale || '').split('-')[0].toLowerCase();
}

function localizeRegionName(region, locale) {
  const language = localeLanguage(locale);
  return localizedRegionNames[language]?.[region] || regionNames[region];
}

function localizeHolidayName(name, locale) {
  const language = localeLanguage(locale);
  return localizedHolidayNames[language]?.[name] || name;
}

function toInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : fallback;
}

function normalizeLocale(value) {
  const locale = typeof value === 'string' && value.trim() ? value.trim() : 'en-US';
  try {
    Intl.DateTimeFormat.supportedLocalesOf([locale]);
    return locale;
  } catch (_error) {
    return 'en-US';
  }
}

function normalizeEnum(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
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

  if (region === 'off') {
    return holidays;
  }

  if (region === 'DE' || region === 'DE-BE') {
    fixed(1, 1, 'New Year');
    fixed(5, 1, 'Labour Day');
    fixed(10, 3, 'German Unity Day');
    fixed(12, 25, 'Christmas Day');
    fixed(12, 26, 'Boxing Day');
    add(addDays(easter, -2), 'Good Friday');
    add(addDays(easter, 1), 'Easter Monday');
    add(addDays(easter, 39), 'Ascension Day');
    add(addDays(easter, 50), 'Whit Monday');
    if (region === 'DE-BE') {
      fixed(3, 8, "Women's Day");
    }
  }

  if (region === 'AT') {
    fixed(1, 1, 'New Year');
    fixed(1, 6, 'Epiphany');
    fixed(5, 1, 'Labour Day');
    fixed(10, 26, 'National Day');
    fixed(12, 25, 'Christmas Day');
    fixed(12, 26, 'St Stephen');
    add(addDays(easter, 1), 'Easter Monday');
    add(addDays(easter, 39), 'Ascension Day');
    add(addDays(easter, 50), 'Whit Monday');
    add(addDays(easter, 60), 'Corpus Christi');
  }

  if (region === 'CH') {
    fixed(1, 1, 'New Year');
    fixed(8, 1, 'National Day');
    fixed(12, 25, 'Christmas Day');
    fixed(12, 26, 'St Stephen');
    add(addDays(easter, -2), 'Good Friday');
    add(addDays(easter, 1), 'Easter Monday');
    add(addDays(easter, 39), 'Ascension Day');
    add(addDays(easter, 50), 'Whit Monday');
  }

  if (region === 'US') {
    fixed(1, 1, 'New Year');
    fixed(6, 19, 'Juneteenth');
    fixed(7, 4, 'Independence Day');
    fixed(11, 11, 'Veterans Day');
    fixed(12, 25, 'Christmas Day');
    add(nthWeekday(year, 0, 1, 3), 'MLK Day');
    add(nthWeekday(year, 1, 1, 3), 'Presidents Day');
    add(lastWeekday(year, 4, 1), 'Memorial Day');
    add(nthWeekday(year, 8, 1, 1), 'Labor Day');
    add(nthWeekday(year, 9, 1, 2), 'Columbus Day');
    add(nthWeekday(year, 10, 4, 4), 'Thanksgiving');
  }

  if (region === 'GB-ENG') {
    fixed(1, 1, 'New Year');
    fixed(12, 25, 'Christmas Day');
    fixed(12, 26, 'Boxing Day');
    add(addDays(easter, -2), 'Good Friday');
    add(addDays(easter, 1), 'Easter Monday');
    add(nthWeekday(year, 4, 1, 1), 'Early May Bank Holiday');
    add(lastWeekday(year, 4, 1), 'Spring Bank Holiday');
    add(lastWeekday(year, 7, 1), 'Summer Bank Holiday');
  }

  if (region === 'FR') {
    fixed(1, 1, 'New Year');
    fixed(5, 1, 'Labour Day');
    fixed(5, 8, 'Victory Day');
    fixed(7, 14, 'Bastille Day');
    fixed(8, 15, 'Assumption');
    fixed(11, 1, 'All Saints');
    fixed(11, 11, 'Armistice');
    fixed(12, 25, 'Christmas Day');
    add(addDays(easter, 1), 'Easter Monday');
    add(addDays(easter, 39), 'Ascension Day');
    add(addDays(easter, 50), 'Whit Monday');
  }

  if (region === 'ES') {
    fixed(1, 1, 'New Year');
    fixed(1, 6, 'Epiphany');
    fixed(5, 1, 'Labour Day');
    fixed(8, 15, 'Assumption');
    fixed(10, 12, 'National Day');
    fixed(11, 1, 'All Saints');
    fixed(12, 6, 'Constitution Day');
    fixed(12, 8, 'Immaculate Conception');
    fixed(12, 25, 'Christmas Day');
    add(addDays(easter, -2), 'Good Friday');
  }

  if (region === 'IT') {
    fixed(1, 1, 'New Year');
    fixed(1, 6, 'Epiphany');
    fixed(4, 25, 'Liberation Day');
    fixed(5, 1, 'Labour Day');
    fixed(6, 2, 'Republic Day');
    fixed(8, 15, 'Ferragosto');
    fixed(11, 1, 'All Saints');
    fixed(12, 8, 'Immaculate Conception');
    fixed(12, 25, 'Christmas Day');
    fixed(12, 26, 'St Stephen');
    add(addDays(easter, 1), 'Easter Monday');
  }

  if (region === 'NL') {
    fixed(1, 1, 'New Year');
    fixed(4, 27, 'King\'s Day');
    fixed(5, 5, 'Liberation Day');
    fixed(12, 25, 'Christmas Day');
    fixed(12, 26, 'Boxing Day');
    add(addDays(easter, 1), 'Easter Monday');
    add(addDays(easter, 39), 'Ascension Day');
    add(addDays(easter, 50), 'Whit Monday');
  }

  if (region === 'CA') {
    fixed(1, 1, 'New Year');
    fixed(7, 1, 'Canada Day');
    fixed(11, 11, 'Remembrance Day');
    fixed(12, 25, 'Christmas Day');
    fixed(12, 26, 'Boxing Day');
    add(addDays(easter, -2), 'Good Friday');
    add(nthWeekday(year, 8, 1, 1), 'Labour Day');
    add(nthWeekday(year, 9, 1, 2), 'Thanksgiving');
  }

  if (region === 'AU') {
    fixed(1, 1, 'New Year');
    fixed(1, 26, 'Australia Day');
    fixed(4, 25, 'Anzac Day');
    fixed(12, 25, 'Christmas Day');
    fixed(12, 26, 'Boxing Day');
    add(addDays(easter, -2), 'Good Friday');
    add(addDays(easter, 1), 'Easter Monday');
    add(nthWeekday(year, 3, 1, 2), 'Easter Tuesday');
  }

  return holidays;
}

function formatter(locale, options) {
  try {
    return new Intl.DateTimeFormat(locale, options);
  } catch (_error) {
    return new Intl.DateTimeFormat('en-US', options);
  }
}

function alternateDayLabel(date, locale, calendar) {
  if (calendar === 'off') {
    return '';
  }

  try {
    const altLocale = `${locale}-u-ca-${calendar}`;
    return new Intl.DateTimeFormat(altLocale, { day: 'numeric' }).format(date);
  } catch (_error) {
    return '';
  }
}

export default async function handler({ query }) {
  const now = new Date();
  const locale = normalizeLocale(query.locale);
  const weekStartName = normalizeEnum(query.weekStart, dayKeys, 'monday');
  const weeklyHolidayName = normalizeEnum(query.weeklyHoliday, ['off', ...dayKeys], 'sunday');
  const holidayRegion = normalizeEnum(query.holidayRegion, Object.keys(regionNames), 'off');
  const alternateCalendar = normalizeEnum(
    query.alternateCalendar,
    ['off', 'buddhist', 'chinese', 'hebrew', 'indian', 'islamic', 'japanese', 'persian'],
    'off',
  );
  const monthOffset = toInteger(query.monthOffset, 0);
  const activeDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();
  const todayKey = dateKey(now);
  const weekStart = dayKeys.indexOf(weekStartName);
  const weeklyHoliday = weeklyHolidayName === 'off' ? -1 : dayKeys.indexOf(weeklyHolidayName);
  const firstOfMonth = new Date(year, month, 1);
  const leadingDays = (firstOfMonth.getDay() - weekStart + 7) % 7;
  const gridStart = addDays(firstOfMonth, -leadingDays);
  const monthHolidays = new Map([
    ...holidayMap(year - 1, holidayRegion),
    ...holidayMap(year, holidayRegion),
    ...holidayMap(year + 1, holidayRegion),
  ]);
  const weekdayFormatter = formatter(locale, { weekday: 'short' });
  const narrowWeekdayFormatter = formatter(locale, { weekday: 'narrow' });
  const monthFormatter = formatter(locale, { month: query.shortMonthLabel === 'true' ? 'short' : 'long', year: 'numeric' });
  const compactMonthFormatter = formatter(locale, { month: 'short', year: 'numeric' });

  const weekdays = Array.from({ length: 7 }, (_value, index) => {
    const date = addDays(new Date(2024, 0, 7), weekStart + index);
    return {
      short: weekdayFormatter.format(date),
      narrow: narrowWeekdayFormatter.format(date),
      key: dayKeys[date.getDay()],
      isWeeklyHoliday: date.getDay() === weeklyHoliday,
    };
  });

  const days = Array.from({ length: 42 }, (_value, index) => {
    const date = addDays(gridStart, index);
    const key = dateKey(date);
    return {
      key,
      day: date.getDate(),
      weekday: date.getDay(),
      inMonth: date.getMonth() === month,
      isToday: key === todayKey,
      isWeeklyHoliday: date.getDay() === weeklyHoliday,
      holiday: localizeHolidayName(monthHolidays.get(key) || '', locale),
      alternateDay: alternateDayLabel(date, locale, alternateCalendar),
    };
  });

  return {
    title: monthFormatter.format(firstOfMonth),
    compactTitle: compactMonthFormatter.format(firstOfMonth),
    locale,
    year,
    month: month + 1,
    weekdays,
    days,
    settings: {
      weekStart: weekStartName,
      weeklyHoliday: weeklyHolidayName,
      holidayRegion,
      holidayRegionName: localizeRegionName(holidayRegion, locale),
      alternateCalendar,
    },
    updatedAt: now.toISOString(),
  };
}
