const AIRTABLE_API_BASE = "https://api.airtable.com/v0";
const USER_AGENT = "paperlesspaper-openintegrations/0.1.0";

const sampleTables = [
  {
    title: "Project Board",
    source: "Sample data",
    columns: ["Task", "Owner", "Status", "Due"],
    rows: [
      ["Finalize copy", "Mina", "Ready", "Today"],
      ["Review artwork", "Jon", "In progress", "Tomorrow"],
      ["Print labels", "Ada", "Waiting", "Jun 24"],
      ["Publish update", "Lea", "Queued", "Jun 25"]
    ],
    rowBorder: true
  },
  {
    title: "Milestones",
    source: "Sample data",
    columns: ["Milestone", "Date", "Owner"],
    rows: [
      ["Beta freeze", "Jun 27", "Product"],
      ["Partner review", "Jul 02", "Ops"],
      ["Launch", "Jul 09", "Team"]
    ],
    rowBorder: false
  }
];

function asString(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function asBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = asString(value).toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
}

function numberInRange(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(number)));
}

function parseList(value) {
  if (Array.isArray(value)) {
    return value.flatMap(parseList);
  }

  return asString(value)
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanTableName(value) {
  return asString(value).replace(/^\/+|\/+$/g, "");
}

function parseTablesJson(value) {
  const raw = asString(value);
  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Advanced tables JSON must be an array.");
  }

  return parsed.filter((item) => item && typeof item === "object");
}

function normalizeBaseSettings(query) {
  return {
    title: asString(query.title, "Airtable"),
    token: asString(query.token || process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY),
    baseId: asString(query.baseId || process.env.AIRTABLE_BASE_ID),
    tableName: cleanTableName(query.tableName || process.env.AIRTABLE_TABLE_NAME),
    view: asString(query.view, "Grid view"),
    fields: parseList(query.fields),
    filterByFormula: asString(query.filterByFormula),
    sortField: asString(query.sortField),
    sortDirection: asString(query.sortDirection).toLowerCase() === "desc" ? "desc" : "asc",
    maxRows: numberInRange(query.maxRows, 8, 1, 50),
    rowBorder: asBoolean(query.rowBorder, true),
    showTitle: asBoolean(query.showTitle, true),
    showMeta: asBoolean(query.showMeta, true)
  };
}

function normalizeTableConfig(base, override = {}, index = 0) {
  return {
    ...base,
    ...override,
    title: asString(override.title, index === 0 ? base.title : `${base.title} ${index + 1}`),
    tableName: cleanTableName(override.tableName || override.workspaceName || base.tableName),
    view: asString(override.view, base.view),
    fields: parseList(override.fields ?? base.fields),
    filterByFormula: asString(override.filterByFormula, base.filterByFormula),
    sortField: asString(override.sortField, base.sortField),
    sortDirection: asString(override.sortDirection).toLowerCase() === "desc" ? "desc" : "asc",
    maxRows: numberInRange(override.maxRows, base.maxRows, 1, 50),
    rowBorder: asBoolean(override.rowBorder, base.rowBorder)
  };
}

function buildAirtableUrl(config, offset) {
  const url = new URL(
    `${AIRTABLE_API_BASE}/${encodeURIComponent(config.baseId)}/${encodeURIComponent(config.tableName)}`
  );
  url.searchParams.set("pageSize", String(Math.min(100, config.maxRows)));
  url.searchParams.set("maxRecords", String(config.maxRows));

  if (config.view) {
    url.searchParams.set("view", config.view);
  }

  if (config.filterByFormula) {
    url.searchParams.set("filterByFormula", config.filterByFormula);
  }

  config.fields.forEach((field) => {
    url.searchParams.append("fields[]", field);
  });

  if (config.sortField) {
    url.searchParams.set("sort[0][field]", config.sortField);
    url.searchParams.set("sort[0][direction]", config.sortDirection);
  }

  if (offset) {
    url.searchParams.set("offset", offset);
  }

  return url;
}

async function fetchAirtableRecords(config) {
  let offset = "";
  const records = [];

  do {
    const response = await fetch(buildAirtableUrl(config, offset), {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.token}`,
        "User-Agent": USER_AGENT
      }
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = body?.error?.message || body?.error?.type || response.statusText;
      throw new Error(`Airtable request for "${config.tableName}" failed with ${response.status}: ${message}`);
    }

    records.push(...(Array.isArray(body.records) ? body.records : []));
    offset = body.offset || "";
  } while (offset && records.length < config.maxRows);

  return records.slice(0, config.maxRows);
}

function formatValue(value) {
  if (value == null) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (Array.isArray(value)) {
    return value.map(formatValue).filter(Boolean).join(", ");
  }

  if (typeof value === "object") {
    if (typeof value.name === "string") {
      return value.name;
    }
    if (typeof value.filename === "string") {
      return value.filename;
    }
    if (typeof value.email === "string") {
      return value.email;
    }
    if (typeof value.url === "string") {
      return value.url;
    }

    return JSON.stringify(value);
  }

  return String(value);
}

function columnsFromRecords(records, preferredFields) {
  if (preferredFields.length) {
    return preferredFields;
  }

  const columns = [];
  records.forEach((record) => {
    Object.keys(record.fields || {}).forEach((field) => {
      if (!columns.includes(field)) {
        columns.push(field);
      }
    });
  });

  return columns;
}

function shapeTable(records, config) {
  const columns = columnsFromRecords(records, config.fields);
  const rows = records.map((record) =>
    columns.map((column) => formatValue(record.fields?.[column]))
  );

  return {
    title: config.title || config.tableName,
    source: config.tableName,
    columns,
    rows,
    rowBorder: config.rowBorder
  };
}

function sampleResponse(query, base) {
  const tables = parseTablesJson(query.tablesJson);
  const selected = tables.length ? sampleTables : [sampleTables[0]];
  return {
    generatedAt: new Date().toISOString(),
    isSample: true,
    showTitle: base.showTitle,
    showMeta: base.showMeta,
    tables: selected.map((table, index) => ({
      ...table,
      title: index === 0 ? base.title || table.title : table.title,
      rows: table.rows.slice(0, base.maxRows),
      rowBorder: index === 0 ? base.rowBorder : table.rowBorder
    }))
  };
}

export default async function handler({ query }) {
  const base = normalizeBaseSettings(query);

  if (!base.token || !base.baseId || !base.tableName) {
    return sampleResponse(query, base);
  }

  const overrides = parseTablesJson(query.tablesJson);
  const configs = overrides.length
    ? overrides.map((override, index) => normalizeTableConfig(base, override, index))
    : [normalizeTableConfig(base)];

  const tables = await Promise.all(
    configs.map(async (config) => shapeTable(await fetchAirtableRecords(config), config))
  );

  return {
    generatedAt: new Date().toISOString(),
    isSample: false,
    showTitle: base.showTitle,
    showMeta: base.showMeta,
    tables
  };
}
