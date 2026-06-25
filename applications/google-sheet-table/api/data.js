import { inflateRawSync } from "node:zlib";

const defaultSettings = {
  sheetId: "",
  gid: "",
  namesText: "",
  displayNamesText: "",
  columnsText: "",
  dateColumn: "A",
  maxEntries: 20,
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

function indexToColLetter(index) {
  let value = Number(index) + 1;
  let letters = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    value = Math.floor((value - 1) / 26);
  }

  return letters || "A";
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

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCharCode(parseInt(code, 16)));
}

function stripHtmlTags(value) {
  return String(value || "").replace(/<[^>]*>/g, "");
}

function parseAttributes(value) {
  const attrs = {};
  const attrPattern = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match;

  while ((match = attrPattern.exec(value))) {
    attrs[match[1].toLowerCase()] = decodeHtmlEntities(match[2] ?? match[3] ?? match[4] ?? "");
  }

  return attrs;
}

function parseStyle(value) {
  const styles = {};

  for (const declaration of String(value || "").split(";")) {
    const index = declaration.indexOf(":");
    if (index === -1) {
      continue;
    }

    const property = declaration.slice(0, index).trim().toLowerCase();
    const styleValue = declaration.slice(index + 1).trim();
    if (property && styleValue) {
      styles[property] = styleValue;
    }
  }

  return styles;
}

function cellFormatFromAttributes(attrs, inherited = {}) {
  const styles = parseStyle(attrs.style);
  const format = { ...inherited };
  const fontWeight = styles["font-weight"];
  const fontStyle = styles["font-style"];

  if (fontWeight && (fontWeight === "bold" || Number(fontWeight) >= 600)) {
    format.bold = true;
  }
  if (fontStyle === "italic") {
    format.italic = true;
  }
  if (styles.color) {
    format.color = styles.color;
  }
  if (styles["background-color"]) {
    format.backgroundColor = styles["background-color"];
  }
  if (styles["text-align"] || attrs.align) {
    format.align = styles["text-align"] || attrs.align;
  }

  return format;
}

function mergeInlineContentFormat(html, format) {
  const next = { ...format };

  if (/<(?:b|strong)\b/i.test(html)) {
    next.bold = true;
  }
  if (/<(?:i|em)\b/i.test(html)) {
    next.italic = true;
  }

  const styledTagPattern = /<[^>]+\sstyle=(?:"([^"]*)"|'([^']*)')[^>]*>/gi;
  let match;
  while ((match = styledTagPattern.exec(html))) {
    Object.assign(next, cellFormatFromAttributes({ style: match[1] ?? match[2] }, next));
  }

  return next;
}

function trimEmptyTableRows(rows) {
  return rows.filter((row) => row.some((cell) => stringOrDefault(cell.value)));
}

function parseGvizHtmlTable(html) {
  const tableMatch = String(html || "").match(/<table\b[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) {
    return null;
  }

  const rows = [];
  const rowPattern = /<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowPattern.exec(tableMatch[1]))) {
    const rowAttrs = parseAttributes(rowMatch[1]);
    const rowFormat = cellFormatFromAttributes(rowAttrs);
    const cells = [];
    const cellPattern = /<t[dh]\b([^>]*)>([\s\S]*?)<\/t[dh]>/gi;
    let cellMatch;

    while ((cellMatch = cellPattern.exec(rowMatch[2]))) {
      const cellAttrs = parseAttributes(cellMatch[1]);
      const cellFormat = cellFormatFromAttributes(cellAttrs, rowFormat);
      cells.push({
        value: stringOrDefault(decodeHtmlEntities(stripHtmlTags(cellMatch[2]))),
        format: mergeInlineContentFormat(cellMatch[2], cellFormat),
      });
    }

    if (cells.length) {
      rows.push(cells);
    }
  }

  const trimmedRows = trimEmptyTableRows(rows);
  if (trimmedRows.length < 2) {
    return null;
  }

  return trimmedRows;
}

function readUInt16(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8);
}

function readUInt32(buffer, offset) {
  return (
    (buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16) | (buffer[offset + 3] << 24))
    >>> 0
  );
}

function unzipFiles(buffer) {
  const files = {};
  let eocdOffset = -1;

  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (readUInt32(buffer, offset) === 0x06054b50) {
      eocdOffset = offset;
      break;
    }
  }

  if (eocdOffset === -1) {
    return files;
  }

  const entryCount = readUInt16(buffer, eocdOffset + 10);
  let centralOffset = readUInt32(buffer, eocdOffset + 16);

  for (let index = 0; index < entryCount; index += 1) {
    if (readUInt32(buffer, centralOffset) !== 0x02014b50) {
      break;
    }

    const method = readUInt16(buffer, centralOffset + 10);
    const compressedSize = readUInt32(buffer, centralOffset + 20);
    const nameLength = readUInt16(buffer, centralOffset + 28);
    const extraLength = readUInt16(buffer, centralOffset + 30);
    const commentLength = readUInt16(buffer, centralOffset + 32);
    const localOffset = readUInt32(buffer, centralOffset + 42);
    const name = buffer
      .subarray(centralOffset + 46, centralOffset + 46 + nameLength)
      .toString("utf8");

    const localNameLength = readUInt16(buffer, localOffset + 26);
    const localExtraLength = readUInt16(buffer, localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    let data = null;

    if (method === 0) {
      data = compressed;
    } else if (method === 8) {
      data = inflateRawSync(compressed);
    }

    if (data) {
      files[name] = data.toString("utf8");
    }

    centralOffset += 46 + nameLength + extraLength + commentLength;
  }

  return files;
}

function tagBlocks(xml, tagName) {
  return [...String(xml || "").matchAll(new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, "gi"))]
    .map((match) => ({
      attrs: parseAttributes(match[1]),
      inner: match[2],
    }));
}

function selfClosingTags(xml, tagName) {
  return [...String(xml || "").matchAll(new RegExp(`<${tagName}\\b([^>]*)\\/>`, "gi"))]
    .map((match) => ({
      attrs: parseAttributes(match[1]),
      inner: "",
    }));
}

function allTags(xml, tagName) {
  return tagBlocks(xml, tagName).concat(selfClosingTags(xml, tagName));
}

function parseSharedStrings(xml) {
  return tagBlocks(xml, "si").map((item) =>
    tagBlocks(item.inner, "t")
      .map((text) => decodeHtmlEntities(text.inner))
      .join(""),
  );
}

function normalizeArgbColor(value) {
  const raw = stringOrDefault(value);
  if (!/^[0-9a-f]{6,8}$/i.test(raw)) {
    return "";
  }

  return `#${raw.slice(-6)}`;
}

function colorFromTagXml(xml) {
  const color = allTags(xml, "color")[0]?.attrs;
  if (!color) {
    return "";
  }

  return normalizeArgbColor(color.rgb);
}

function parseFonts(xml) {
  const fontsXml = tagBlocks(xml, "fonts")[0]?.inner || "";
  return tagBlocks(fontsXml, "font").map((fontXml) => ({
    bold: /<b\b/i.test(fontXml.inner),
    italic: /<i\b/i.test(fontXml.inner),
    strikethrough: /<strike\b/i.test(fontXml.inner),
    underline: /<u\b/i.test(fontXml.inner),
    color: colorFromTagXml(fontXml.inner),
  }));
}

function parseFills(xml) {
  const fillsXml = tagBlocks(xml, "fills")[0]?.inner || "";
  return tagBlocks(fillsXml, "fill").map((fillXml) => {
    const patternFill = tagBlocks(fillXml.inner, "patternFill")[0]
      || selfClosingTags(fillXml.inner, "patternFill")[0];
    const fgColor = patternFill ? allTags(patternFill.inner, "fgColor")[0]?.attrs : null;
    return {
      backgroundColor: normalizeArgbColor(fgColor?.rgb),
    };
  });
}

function parseCellStyles(xml) {
  const fonts = parseFonts(xml);
  const fills = parseFills(xml);
  const cellXfsXml = tagBlocks(xml, "cellXfs")[0]?.inner || "";

  return allTags(cellXfsXml, "xf").map((xfXml) => {
    const font = fonts[Number(xfXml.attrs.fontid)] || {};
    const fill = fills[Number(xfXml.attrs.fillid)] || {};
    const alignment = tagBlocks(xfXml.inner, "alignment")[0] || selfClosingTags(xfXml.inner, "alignment")[0];
    return {
      ...(font.bold ? { bold: true } : {}),
      ...(font.italic ? { italic: true } : {}),
      ...(font.strikethrough ? { strikethrough: true } : {}),
      ...(font.underline ? { underline: true } : {}),
      ...(font.color ? { color: font.color } : {}),
      ...(fill.backgroundColor ? { backgroundColor: fill.backgroundColor } : {}),
      ...(alignment?.attrs.horizontal ? { align: alignment.attrs.horizontal } : {}),
    };
  });
}

function columnIndexFromCellRef(ref) {
  const letters = String(ref || "").match(/^[A-Z]+/i)?.[0] || "A";
  return colLetterToIndex(letters);
}

function rowIndexFromCellRef(ref) {
  return Math.max(0, Number(String(ref || "").match(/\d+/)?.[0] || 1) - 1);
}

function cellValueFromXlsx(cellXml, sharedStrings) {
  const value = tagBlocks(cellXml.inner, "v")[0]?.inner ?? "";
  if (cellXml.attrs.t === "s") {
    return stringOrDefault(sharedStrings[Number(value)]);
  }
  if (cellXml.attrs.t === "inlineStr") {
    return tagBlocks(cellXml.inner, "t")
      .map((text) => decodeHtmlEntities(text.inner))
      .join("");
  }
  return stringOrDefault(value.replace(/\.0$/, ""));
}

function parseXlsxColumnWidths(sheetXml) {
  const sheetFormat = allTags(sheetXml, "sheetFormatPr")[0]?.attrs || {};
  const defaultWidth = Number(sheetFormat.defaultcolwidth);
  const byIndex = {};
  const colsXml = tagBlocks(sheetXml, "cols")[0]?.inner || "";

  for (const col of allTags(colsXml, "col")) {
    const min = Math.max(1, Number(col.attrs.min) || 1);
    const max = Math.max(min, Number(col.attrs.max) || min);
    const width = Number(col.attrs.width);
    if (!Number.isFinite(width) || width <= 0) {
      continue;
    }

    for (let column = min; column <= max; column += 1) {
      byIndex[column - 1] = width;
    }
  }

  return {
    byIndex,
    defaultWidth: Number.isFinite(defaultWidth) && defaultWidth > 0 ? defaultWidth : 10,
  };
}

function parseXlsxTable(buffer) {
  const files = unzipFiles(Buffer.from(buffer));
  const sheetXml = files["xl/worksheets/sheet1.xml"];
  const stylesXml = files["xl/styles.xml"];
  if (!sheetXml || !stylesXml) {
    return null;
  }

  const sharedStrings = parseSharedStrings(files["xl/sharedStrings.xml"] || "");
  const styles = parseCellStyles(stylesXml);
  const columnWidths = parseXlsxColumnWidths(sheetXml);
  const rows = [];

  for (const rowXml of tagBlocks(sheetXml, "row")) {
    for (const cellXml of allTags(rowXml.inner, "c")) {
      const rowIndex = rowIndexFromCellRef(cellXml.attrs.r);
      const columnIndex = columnIndexFromCellRef(cellXml.attrs.r);
      rows[rowIndex] ||= [];
      rows[rowIndex][columnIndex] = {
        value: cellValueFromXlsx(cellXml, sharedStrings),
        format: styles[Number(cellXml.attrs.s)] || {},
      };
    }
  }

  const trimmedRows = trimEmptyTableRows(rows.filter(Boolean));
  if (trimmedRows.length < 2) {
    return null;
  }

  trimmedRows.columnWidths = columnWidths;
  return trimmedRows;
}

function extractTitleFromHtml(html) {
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
  if (ogTitle) {
    return stringOrDefault(decodeHtmlEntities(ogTitle[1]));
  }

  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (!title) {
    return "";
  }

  return stringOrDefault(decodeHtmlEntities(title[1]).replace(/\s+-\s+Google Sheets$/i, ""));
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

function deriveColumns(rows, settings) {
  const configured = Object.entries(settings.columns);
  if (configured.length) {
    const columnMap = {};
    for (const [letter, group] of configured) {
      columnMap[colLetterToIndex(letter)] = group;
    }
    return columnMap;
  }

  const header = rows[0] || [];
  const dateColIdx = colLetterToIndex(settings.dateColumn);
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), header.length);
  const columnMap = {};

  for (let columnIndex = 0; columnIndex < maxColumns; columnIndex += 1) {
    if (columnIndex === dateColIdx) {
      continue;
    }

    const hasData = rows
      .slice(1)
      .some((row) => stringOrDefault(row[columnIndex]));
    if (!hasData) {
      continue;
    }

    columnMap[columnIndex] = stringOrDefault(header[columnIndex], indexToColLetter(columnIndex));
  }

  return columnMap;
}

function hasConfiguredTableTransform(settings) {
  return settings.names.length > 0 || Object.keys(settings.columns).length > 0;
}

function buildRawTable(rows, settings) {
  const header = rows[0] || [];
  const dataRows = rows.slice(1);
  const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), header.length);
  const columnIndexes = [];

  for (let columnIndex = 0; columnIndex < maxColumns; columnIndex += 1) {
    const hasHeader = stringOrDefault(header[columnIndex]);
    const hasData = dataRows.some((row) => stringOrDefault(row[columnIndex]));
    if (hasHeader || hasData) {
      columnIndexes.push(columnIndex);
    }
  }

  return {
    columns: columnIndexes.map((columnIndex) =>
      stringOrDefault(header[columnIndex], indexToColLetter(columnIndex)),
    ),
    rows: dataRows.slice(0, settings.maxEntries).map((row) =>
      columnIndexes.map((columnIndex) => stringOrDefault(row[columnIndex])),
    ),
  };
}

function buildRawFormattedTable(formattedRows, settings) {
  const header = formattedRows[0] || [];
  const dataRows = formattedRows.slice(1);
  const maxColumns = formattedRows.reduce((max, row) => Math.max(max, row.length), header.length);
  const columnIndexes = [];

  for (let columnIndex = 0; columnIndex < maxColumns; columnIndex += 1) {
    const hasHeader = stringOrDefault(header[columnIndex]?.value);
    const hasData = dataRows.some((row) => stringOrDefault(row[columnIndex]?.value));
    if (hasHeader || hasData) {
      columnIndexes.push(columnIndex);
    }
  }

  return {
    columns: columnIndexes.map((columnIndex) => ({
      value: stringOrDefault(header[columnIndex]?.value, indexToColLetter(columnIndex)),
      format: header[columnIndex]?.format || {},
      width: formattedRows.columnWidths
        ? formattedRows.columnWidths.byIndex[columnIndex] || formattedRows.columnWidths.defaultWidth
        : undefined,
    })),
    rows: dataRows.slice(0, settings.maxEntries).map((row) =>
      columnIndexes.map((columnIndex) => ({
        value: stringOrDefault(row[columnIndex]?.value),
        format: row[columnIndex]?.format || {},
      })),
    ),
  };
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
  const names = settings.names.map((name) => name.toLowerCase());
  const showAllCells = names.length === 0;
  const columnMap = deriveColumns(rows, settings);
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
  let order = 0;

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

    if (!currentDate && !((settings.includeSectionHeaders || showAllCells) && currentSectionHeader)) {
      continue;
    }

    for (const [columnIndex, group] of Object.entries(columnMap)) {
      const cellValue = stringOrDefault(row[Number(columnIndex)]);
      if (!cellValue) {
        continue;
      }

      const normalizedCell = cellValue.toLowerCase();
      if (!showAllCells && !names.includes(normalizedCell)) {
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
        isSectionHeader: false,
        order,
      });
      order += 1;
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = results.filter((result) => {
    if (result.isSectionHeader) {
      return true;
    }
    if (!result.date) {
      return true;
    }
    return settings.showPastDates || result.date >= today;
  });

  filtered.sort((a, b) => {
    if (a.isSectionHeader && !b.isSectionHeader) return 1;
    if (!a.isSectionHeader && b.isSectionHeader) return -1;
    if (a.isSectionHeader && b.isSectionHeader) return 0;
    if (a.sortDate && b.sortDate) {
      const dateDiff = a.sortDate.getTime() - b.sortDate.getTime();
      return dateDiff || a.name.localeCompare(b.name);
    }
    return a.order - b.order || a.name.localeCompare(b.name);
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

async function fetchSheetHtml(settings) {
  if (!settings.sheetId) {
    throw new Error("No Google Sheet ID configured");
  }

  const url = new URL(
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(settings.sheetId)}/gviz/tq`,
  );
  url.searchParams.set("tqx", "out:html");
  if (settings.gid) {
    url.searchParams.set("gid", settings.gid);
  }

  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      "User-Agent": "paperlesspaper-openintegrations/0.1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Google Sheets HTML request failed with ${response.status}`);
  }

  return response.text();
}

async function fetchSheetXlsx(settings) {
  if (!settings.sheetId) {
    throw new Error("No Google Sheet ID configured");
  }

  const url = new URL(
    `https://docs.google.com/spreadsheets/d/${encodeURIComponent(settings.sheetId)}/export`,
  );
  url.searchParams.set("format", "xlsx");

  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*;q=0.8",
      "User-Agent": "paperlesspaper-openintegrations/0.1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`Google Sheets XLSX request failed with ${response.status}`);
  }

  return response.arrayBuffer();
}

async function fetchSheetTitle(settings) {
  if (!settings.sheetId) {
    return "";
  }

  try {
    const url = new URL(
      `https://docs.google.com/spreadsheets/d/${encodeURIComponent(settings.sheetId)}/edit`,
    );

    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "User-Agent": "paperlesspaper-openintegrations/0.1.0",
      },
    });

    if (!response.ok) {
      return "";
    }

    return extractTitleFromHtml(await response.text());
  } catch {
    return "";
  }
}

export default async function handler({ query }) {
  const settings = normalizeSettings({ ...defaultSettings, ...query });
  const useRawTable = !hasConfiguredTableTransform(settings);

  const [csv, sheetTitle, xlsxResult, htmlResult] = await Promise.all([
    fetchSheetCsv(settings),
    fetchSheetTitle(settings),
    useRawTable && !settings.gid ? fetchSheetXlsx(settings).catch(() => null) : Promise.resolve(null),
    useRawTable ? fetchSheetHtml(settings).catch(() => "") : Promise.resolve(""),
  ]);
  const rows = parseCSV(csv);
  if (rows.length < 2) {
    throw new Error("Sheet has no data rows");
  }

  const formattedRows = useRawTable
    ? (xlsxResult ? parseXlsxTable(xlsxResult) : null) || parseGvizHtmlTable(htmlResult)
    : null;

  return {
    ...(!useRawTable
      ? { entries: buildEntries(rows, settings) }
      : { table: formattedRows ? buildRawFormattedTable(formattedRows, settings) : buildRawTable(rows, settings) }),
    rowCount: rows.length - 1,
    sheetTitle,
    updatedAt: new Date().toISOString(),
  };
}
