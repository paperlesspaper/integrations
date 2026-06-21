const defaultSettings = {
  sheetId: "",
  gid: "",
  namesText: "",
  displayNamesText: "",
  columnsText: "",
  dateColumn: "A",
  maxEntries: 6,
  showPastDates: false,
  includeSectionHeaders: false,
  maxSectionHeaders: 2,
  language: "en",
};

function stringOrDefault(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function booleanOrDefault(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off"].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function integerInRange(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(number)));
}

function splitList(value) {
  return stringOrDefault(value)
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function splitMappingLine(line) {
  const separator = line.includes("=") ? "=" : line.includes(":") ? ":" : "";
  if (!separator) {
    return null;
  }

  const index = line.indexOf(separator);
  const key = line.slice(0, index).trim();
  const value = line.slice(index + 1).trim();
  return key && value ? [key, value] : null;
}

function parseMapping(value, normalizeKey = (key) => key) {
  const map = {};

  for (const line of stringOrDefault(value).split(/\n|,/)) {
    const pair = splitMappingLine(line.trim());
    if (pair) {
      map[normalizeKey(pair[0])] = pair[1];
    }
  }

  return map;
}

function normalizeColumn(value) {
  return stringOrDefault(value, "A").toUpperCase().replace(/[^A-Z]/g, "") || "A";
}

function colLetterToIndex(letter) {
  const normalized = normalizeColumn(letter);
  let index = 0;

  for (const char of normalized) {
    index = index * 26 + (char.charCodeAt(0) - 64);
  }

  return index - 1;
}

function extractSheetParts(value, explicitGid = "") {
  const raw = stringOrDefault(value);
  if (!raw) {
    return { sheetId: "", gid: stringOrDefault(explicitGid) };
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      const match = url.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
      const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
      return {
        sheetId: match ? decodeURIComponent(match[1]) : raw,
        gid: stringOrDefault(explicitGid, url.searchParams.get("gid") || hashParams.get("gid") || ""),
      };
    } catch {
      return { sheetId: raw, gid: stringOrDefault(explicitGid) };
    }
  }

  return { sheetId: raw, gid: stringOrDefault(explicitGid) };
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      row.push(field);
      if (row.some((cell) => cell.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      field = "";
      if (char === "\r" && next === "\n") {
        i += 1;
      }
    } else {
      field += char;
    }
  }

  row.push(field);
  if (row.some((cell) => cell.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

function inferYear(month, day, previousDate) {
  if (previousDate) {
    const candidate = new Date(previousDate.getFullYear(), month, day);
    if (candidate < previousDate) {
      candidate.setFullYear(previousDate.getFullYear() + 1);
    }
    return candidate;
  }

  const now = new Date();
  const candidate = new Date(now.getFullYear(), month, day);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  if (candidate < sixMonthsAgo) {
    candidate.setFullYear(now.getFullYear() + 1);
  }
  return candidate;
}

function parseSheetDate(value, previousDate) {
  if (!value || !value.trim()) {
    return null;
  }

  const firstLine = value
    .trim()
    .replace(/(\d+)(st|nd|rd|th)\b/gi, "$1")
    .split("\n")[0]
    .trim();

  const iso = firstLine.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  }

  const dotted = firstLine.match(/^(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?$/);
  if (dotted) {
    const day = Number(dotted[1]);
    const month = Number(dotted[2]) - 1;
    if (dotted[3]) {
      const year = Number(dotted[3].length === 2 ? `20${dotted[3]}` : dotted[3]);
      return new Date(year, month, day);
    }
    return inferYear(month, day, previousDate);
  }

  const months = {
    jan: 0,
    january: 0,
    januar: 0,
    feb: 1,
    february: 1,
    februar: 1,
    mar: 2,
    march: 2,
    maerz: 2,
    märz: 2,
    apr: 3,
    april: 3,
    may: 4,
    mai: 4,
    jun: 5,
    june: 5,
    juni: 5,
    jul: 6,
    july: 6,
    juli: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    okt: 9,
    oktober: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
    dez: 11,
    dezember: 11,
  };
  const monthName = firstLine.match(/^([A-Za-zÄÖÜäöüß.]+)\s+(\d{1,2})/);
  const dayFirstName = firstLine.match(/^(\d{1,2})\.\s*([A-Za-zÄÖÜäöüß.]+)/);
  const token = monthName ? monthName[1] : dayFirstName ? dayFirstName[2] : "";
  const day = monthName ? Number(monthName[2]) : dayFirstName ? Number(dayFirstName[1]) : 0;
  const month = months[token.toLowerCase().replace(/\.$/, "")];

  if (month === undefined || !day) {
    return null;
  }

  return inferYear(month, day, previousDate);
}

function formatDateShort(date, locale) {
  return new Intl.DateTimeFormat(locale || "en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function isInlineDateAnnotation(value) {
  return /[:;]/.test(value);
}

function normalizeSettings(query) {
  const names = splitList(query.namesText);
  const displayNames = parseMapping(query.displayNamesText, (key) => key.trim().toLowerCase());
  const columns = parseMapping(query.columnsText, normalizeColumn);
  const { sheetId, gid } = extractSheetParts(query.sheetId, query.gid);

  return {
    sheetId,
    gid,
    names,
    displayNames,
    columns,
    dateColumn: normalizeColumn(query.dateColumn || defaultSettings.dateColumn),
    maxEntries: integerInRange(query.maxEntries, defaultSettings.maxEntries, 1, 24),
    showPastDates: booleanOrDefault(query.showPastDates, defaultSettings.showPastDates),
    includeSectionHeaders: booleanOrDefault(
      query.includeSectionHeaders,
      defaultSettings.includeSectionHeaders,
    ),
    maxSectionHeaders: integerInRange(query.maxSectionHeaders, defaultSettings.maxSectionHeaders, 0, 12),
    language: stringOrDefault(query.language, defaultSettings.language),
  };
}

function buildEntries(rows, settings) {
  const columnMap = {};
  for (const [letter, group] of Object.entries(settings.columns)) {
    columnMap[colLetterToIndex(letter)] = group;
  }

  const names = settings.names.map((name) => name.toLowerCase());
  const results = [];
  const explicitDateByRow = {};
  const nextExplicitDateByRow = {};
  const dateColIdx = colLetterToIndex(settings.dateColumn);
  let previousExplicitDate = null;

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] || [];
    const dateCell = stringOrDefault(row[dateColIdx]);
    const parsedDate = parseSheetDate(dateCell, previousExplicitDate);
    if (parsedDate) {
      explicitDateByRow[rowIndex] = parsedDate;
      previousExplicitDate = parsedDate;
    }
  }

  let nextExplicitDate = null;
  for (let rowIndex = rows.length - 1; rowIndex >= 1; rowIndex -= 1) {
    nextExplicitDateByRow[rowIndex] = nextExplicitDate;
    if (explicitDateByRow[rowIndex]) {
      nextExplicitDate = explicitDateByRow[rowIndex];
    }
  }

  let currentDate = null;
  let currentSortDate = null;
  let currentSectionHeader = null;
  let currentDateIsImplied = false;

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] || [];
    const dateCell = stringOrDefault(row[dateColIdx]);

    if (dateCell) {
      const parsedDate = explicitDateByRow[rowIndex];
      if (parsedDate) {
        currentDate = parsedDate;
        currentSortDate = parsedDate;
        currentSectionHeader = null;
        currentDateIsImplied = false;
      } else if (!(currentDate && isInlineDateAnnotation(dateCell))) {
        const impliedDate = settings.includeSectionHeaders
          ? nextExplicitDateByRow[rowIndex] || currentDate
          : null;
        currentDate = impliedDate;
        currentSortDate = nextExplicitDateByRow[rowIndex]
          ? new Date(nextExplicitDateByRow[rowIndex].getTime() - (rows.length - rowIndex))
          : impliedDate;
        currentSectionHeader = dateCell;
        currentDateIsImplied = Boolean(impliedDate);
      }
    }

    if (!currentDate && !(settings.includeSectionHeaders && currentSectionHeader)) {
      continue;
    }

    for (const [columnIndex, group] of Object.entries(columnMap)) {
      const cellValue = stringOrDefault(row[Number(columnIndex)]);
      if (!cellValue) {
        continue;
      }

      const normalizedCell = cellValue.toLowerCase();
      for (const name of names) {
        if (normalizedCell !== name) {
          continue;
        }

        results.push({
          date: currentDate,
          sortDate: currentSortDate,
          dateStr: currentDate
            ? currentDateIsImplied
              ? currentSectionHeader
              : formatDateShort(currentDate, settings.language)
            : currentSectionHeader,
          name: Object.hasOwn(settings.displayNames, normalizedCell)
            ? settings.displayNames[normalizedCell]
            : cellValue,
          group,
          isSectionHeader: !currentDate,
        });
      }
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = results.filter((result) => {
    if (result.isSectionHeader) {
      return true;
    }
    return settings.showPastDates || result.date >= today;
  });

  filtered.sort((a, b) => {
    if (a.isSectionHeader && !b.isSectionHeader) return 1;
    if (!a.isSectionHeader && b.isSectionHeader) return -1;
    if (a.isSectionHeader && b.isSectionHeader) return 0;
    const dateDiff = a.sortDate.getTime() - b.sortDate.getTime();
    return dateDiff || a.name.localeCompare(b.name);
  });

  const dated = filtered
    .filter((result) => !result.isSectionHeader)
    .slice(0, settings.maxEntries);
  const headers = filtered
    .filter((result) => result.isSectionHeader)
    .slice(0, settings.maxSectionHeaders);

  return dated.concat(headers).map((result) => ({
    date: result.dateStr,
    name: result.name,
    group: result.group,
  }));
}

async function fetchSheetCsv(settings) {
  if (!settings.sheetId) {
    throw new Error("No Google Sheet ID configured");
  }

  const url = new URL(
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(settings.sheetId)}/gviz/tq`,
  );
  url.searchParams.set("tqx", "out:csv");
  if (settings.gid) {
    url.searchParams.set("gid", settings.gid);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "text/csv,text/plain;q=0.9,*/*;q=0.8",
      "User-Agent": "paperlesspaper-openintegrations/0.1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Google Sheets request failed with ${response.status}`);
  }

  return response.text();
}

export default async function handler({ query }) {
  const settings = normalizeSettings({ ...defaultSettings, ...query });
  if (!settings.names.length) {
    throw new Error("Add at least one name to find");
  }
  if (!Object.keys(settings.columns).length) {
    throw new Error("Add at least one column mapping");
  }

  const csv = await fetchSheetCsv(settings);
  const rows = parseCSV(csv);
  if (rows.length < 2) {
    throw new Error("Sheet has no data rows");
  }

  return {
    entries: buildEntries(rows, settings),
    rowCount: rows.length - 1,
    updatedAt: new Date().toISOString(),
  };
}
