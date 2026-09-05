const defaultBaseUrl = "https://app.chatwoot.com";
const maxResponseBytes = 2 * 1024 * 1024;

function asString(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function asBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.toLowerCase();
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

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nullableNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeBaseUrl(value) {
  const raw = asString(value, defaultBaseUrl).replace(/\/+$/, "");
  const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Chatwoot URL must use http or https.");
  }

  url.hash = "";
  url.search = "";
  return url.toString().replace(/\/+$/, "");
}

function normalizeTimeZone(value) {
  const timezone = asString(value, "Europe/Berlin");

  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return "UTC";
  }
}

function normalizeSettings(query) {
  return {
    baseUrl: normalizeBaseUrl(
      query.baseUrl || process.env.CHATWOOT_BASE_URL || defaultBaseUrl,
    ),
    accountId: integerInRange(
      query.accountId || process.env.CHATWOOT_ACCOUNT_ID,
      0,
      0,
      Number.MAX_SAFE_INTEGER,
    ),
    apiAccessToken: asString(
      query.apiAccessToken || process.env.CHATWOOT_API_ACCESS_TOKEN,
    ),
    rangeDays: integerInRange(query.rangeDays, 7, 3, 7),
    agentLimit: integerInRange(query.agentLimit, 4, 1, 6),
    timezone: normalizeTimeZone(query.timezone),
    showSource: asBoolean(query.showSource, true),
    timeoutMs: integerInRange(query.timeoutMs, 8000, 2000, 20000),
  };
}

function apiUrl(settings, path, searchParams = {}) {
  const url = new URL(`${settings.baseUrl}${path}`);

  for (const [key, value] of Object.entries(searchParams)) {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

async function fetchJson(settings, path, searchParams = {}) {
  const url = apiUrl(settings, path, searchParams);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), settings.timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "paperlesspaper-openintegrations/0.1.0",
        api_access_token: settings.apiAccessToken,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Chatwoot returned ${response.status} for ${url.pathname}`);
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > maxResponseBytes) {
      throw new Error("Chatwoot response was larger than 2 MB.");
    }

    const text = await response.text();
    if (text.length > maxResponseBytes) {
      throw new Error("Chatwoot response was larger than 2 MB.");
    }

    return text ? JSON.parse(text) : null;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Chatwoot request timed out after ${settings.timeoutMs}ms.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function arrayFrom(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (Array.isArray(value?.payload)) {
    return value.payload;
  }
  if (Array.isArray(value?.data?.payload)) {
    return value.data.payload;
  }
  if (Array.isArray(value?.data)) {
    return value.data;
  }
  return [];
}

function objectFrom(value) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value.data && typeof value.data === "object" && !Array.isArray(value.data)
      ? value.data
      : value;
  }
  return {};
}

function dateKey(date, timezone) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function dayKeys(rangeDays, timezone, now = new Date()) {
  return Array.from({ length: rangeDays }, (_, index) =>
    dateKey(
      new Date(now.getTime() - (rangeDays - index - 1) * 24 * 60 * 60 * 1000),
      timezone,
    ),
  );
}

function timestampDate(value) {
  if (typeof value === "number" || /^\d+(?:\.\d+)?$/.test(String(value || ""))) {
    const numeric = Number(value);
    return new Date(numeric < 1e12 ? numeric * 1000 : numeric);
  }
  return new Date(value);
}

function dailySeries(points, keys, timezone) {
  const values = new Map(keys.map((key) => [key, 0]));

  for (const point of arrayFrom(points)) {
    const timestamp = point?.timestamp ?? point?.date ?? point?.created_at;
    const date = timestampDate(timestamp);
    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const key = dateKey(date, timezone);
    if (values.has(key)) {
      values.set(key, values.get(key) + Math.max(0, finiteNumber(point?.value)));
    }
  }

  return keys.map((date) => ({ date, value: values.get(date) || 0 }));
}

function shapeAgents(agentMetricsValue, agentsValue, summaryValue, limit) {
  const records = new Map();

  function recordFor(id) {
    const key = String(id ?? "");
    if (!key) {
      return null;
    }
    if (!records.has(key)) {
      records.set(key, {
        id: key,
        name: `Agent ${key}`,
        email: "",
        availability: "offline",
        open: 0,
        unattended: 0,
        conversations: 0,
        resolved: 0,
        avgFirstResponseTime: null,
        avgResolutionTime: null,
        avgReplyTime: null,
      });
    }
    return records.get(key);
  }

  for (const agent of arrayFrom(agentsValue)) {
    const record = recordFor(agent?.id);
    if (!record) continue;
    record.name = asString(agent?.name || agent?.available_name, record.name);
    record.email = asString(agent?.email);
    record.availability = asString(agent?.availability_status, "offline");
  }

  for (const agent of arrayFrom(agentMetricsValue)) {
    const record = recordFor(agent?.id);
    if (!record) continue;
    record.name = asString(agent?.name || agent?.available_name, record.name);
    record.email = asString(agent?.email, record.email);
    record.availability = asString(
      agent?.availability || agent?.availability_status,
      record.availability,
    );
    record.open = Math.max(0, finiteNumber(agent?.metric?.open));
    record.unattended = Math.max(0, finiteNumber(agent?.metric?.unattended));
  }

  for (const summary of arrayFrom(summaryValue)) {
    const record = recordFor(summary?.id);
    if (!record) continue;
    record.conversations = Math.max(0, finiteNumber(summary?.conversations_count));
    record.resolved = Math.max(0, finiteNumber(summary?.resolved_conversations_count));
    record.avgFirstResponseTime = nullableNumber(summary?.avg_first_response_time);
    record.avgResolutionTime = nullableNumber(summary?.avg_resolution_time);
    record.avgReplyTime = nullableNumber(summary?.avg_reply_time);
  }

  return [...records.values()]
    .sort(
      (left, right) =>
        right.open - left.open ||
        right.conversations - left.conversations ||
        left.name.localeCompare(right.name),
    )
    .slice(0, limit);
}

function initials(name) {
  return asString(name, "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";
}

function finishAgents(agents, trends, keys, timezone) {
  return agents.map((agent, index) => {
    const trend = dailySeries(trends[index], keys, timezone);
    const resolutionRate = agent.conversations > 0
      ? Math.min(100, Math.round((agent.resolved / agent.conversations) * 100))
      : 0;

    return {
      ...agent,
      initials: initials(agent.name),
      resolutionRate,
      trend,
    };
  });
}

function sampleData(settings) {
  const keys = dayKeys(settings.rangeDays, settings.timezone);
  const baseTraffic = [18, 26, 21, 33, 38, 29, 14];
  const traffic = keys.map((date, index) => ({
    date,
    value: baseTraffic[index % baseTraffic.length] + Math.floor(index / 7) * 2,
  }));
  const samples = [
    {
      id: "101",
      name: "Daniel Weber",
      email: "daniel@example.com",
      availability: "available",
      open: 18,
      unattended: 7,
      conversations: 42,
      resolved: 36,
      avgFirstResponseTime: 164,
      avgResolutionTime: 6840,
      avgReplyTime: 410,
      trendValues: [4, 7, 5, 8, 6, 5, 1],
    },
    {
      id: "102",
      name: "Robert Klein",
      email: "robert@example.com",
      availability: "busy",
      open: 12,
      unattended: 4,
      conversations: 34,
      resolved: 28,
      avgFirstResponseTime: 228,
      avgResolutionTime: 7920,
      avgReplyTime: 515,
      trendValues: [3, 4, 6, 5, 4, 5, 1],
    },
    {
      id: "103",
      name: "Mia Sommer",
      email: "mia@example.com",
      availability: "available",
      open: 9,
      unattended: 3,
      conversations: 31,
      resolved: 27,
      avgFirstResponseTime: 132,
      avgResolutionTime: 5760,
      avgReplyTime: 355,
      trendValues: [5, 3, 4, 4, 6, 4, 1],
    },
    {
      id: "104",
      name: "Stephan Wolf",
      email: "stephan@example.com",
      availability: "offline",
      open: 5,
      unattended: 2,
      conversations: 22,
      resolved: 17,
      avgFirstResponseTime: 310,
      avgResolutionTime: 9360,
      avgReplyTime: 602,
      trendValues: [2, 3, 3, 4, 2, 3, 0],
    },
    {
      id: "105",
      name: "Nora Ibrahim",
      email: "nora@example.com",
      availability: "available",
      open: 4,
      unattended: 1,
      conversations: 19,
      resolved: 16,
      avgFirstResponseTime: 194,
      avgResolutionTime: 6300,
      avgReplyTime: 387,
      trendValues: [2, 2, 4, 3, 2, 3, 0],
    },
  ];
  const agents = samples.slice(0, settings.agentLimit).map((agent) => ({
    ...agent,
    initials: initials(agent.name),
    resolutionRate: Math.round((agent.resolved / agent.conversations) * 100),
    trend: keys.map((date, index) => ({
      date,
      value: agent.trendValues[index % agent.trendValues.length],
    })),
    trendValues: undefined,
  }));

  return {
    account: {
      open: 49,
      unattended: 17,
      unassigned: 5,
    },
    period: {
      days: settings.rangeDays,
      conversations: traffic.reduce((sum, point) => sum + point.value, 0),
      resolved: agents.reduce((sum, agent) => sum + agent.resolved, 0),
    },
    traffic,
    agents,
    source: "Chatwoot",
    sourceUrl: settings.baseUrl,
    updatedAt: new Date().toISOString(),
    sample: true,
    showSource: settings.showSource,
  };
}

async function liveData(settings) {
  const accountPath = `/api/v2/accounts/${settings.accountId}`;
  const since = Math.floor(Date.now() / 1000) - settings.rangeDays * 24 * 60 * 60;
  const until = Math.floor(Date.now() / 1000);
  const reportRange = { since, until };
  const requests = [
    fetchJson(settings, `${accountPath}/reports/conversations`, { type: "account" }),
    fetchJson(settings, `${accountPath}/reports/conversations`, { type: "agent" }),
    fetchJson(settings, `/api/v1/accounts/${settings.accountId}/agents`),
    fetchJson(settings, `${accountPath}/summary_reports/agent`, reportRange),
    fetchJson(settings, `${accountPath}/reports`, {
      ...reportRange,
      type: "account",
      metric: "conversations_count",
    }),
  ];
  const settled = await Promise.allSettled(requests);
  const values = settled.map((result) =>
    result.status === "fulfilled" ? result.value : null,
  );

  if (values.every((value) => value === null)) {
    const firstFailure = settled.find((result) => result.status === "rejected");
    throw firstFailure?.reason || new Error("Chatwoot reports could not be loaded.");
  }

  const [accountValue, agentMetricsValue, agentsValue, summaryValue, trafficValue] = values;
  const keys = dayKeys(settings.rangeDays, settings.timezone);
  const agents = shapeAgents(
    agentMetricsValue,
    agentsValue,
    summaryValue,
    settings.agentLimit,
  );
  const trendSettled = await Promise.allSettled(
    agents.map((agent) =>
      fetchJson(settings, `${accountPath}/reports`, {
        ...reportRange,
        type: "agent",
        id: agent.id,
        metric: "resolutions_count",
      }),
    ),
  );
  const trends = trendSettled.map((result) =>
    result.status === "fulfilled" ? result.value : [],
  );
  const finishedAgents = finishAgents(agents, trends, keys, settings.timezone);
  const accountMetrics = objectFrom(accountValue);
  const unassigned = Math.max(0, finiteNumber(accountMetrics.unassigned));
  const assignedOpen = finishedAgents.reduce((sum, agent) => sum + agent.open, 0);
  const traffic = dailySeries(trafficValue, keys, settings.timezone);

  return {
    account: {
      open: Math.max(0, finiteNumber(accountMetrics.open, assignedOpen + unassigned)),
      unattended: Math.max(
        0,
        finiteNumber(
          accountMetrics.unattended,
          finishedAgents.reduce((sum, agent) => sum + agent.unattended, 0),
        ),
      ),
      unassigned,
    },
    period: {
      days: settings.rangeDays,
      conversations: traffic.reduce((sum, point) => sum + point.value, 0),
      resolved: finishedAgents.reduce((sum, agent) => sum + agent.resolved, 0),
    },
    traffic,
    agents: finishedAgents,
    source: "Chatwoot",
    sourceUrl: settings.baseUrl,
    updatedAt: new Date().toISOString(),
    sample: false,
    showSource: settings.showSource,
  };
}

export default async function handler({ query }) {
  const settings = normalizeSettings(query);

  if (!settings.accountId || !settings.apiAccessToken) {
    return sampleData(settings);
  }

  return liveData(settings);
}
