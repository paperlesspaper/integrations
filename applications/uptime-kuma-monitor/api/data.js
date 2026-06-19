const statusLabels = {
  0: "Down",
  1: "Up",
  2: "Pending",
  3: "Maintenance",
};

const statusKeys = {
  0: "down",
  1: "up",
  2: "pending",
  3: "maintenance",
};

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

function numberInRange(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(number)));
}

function normalizeSlug(value) {
  return asString(value, "default")
    .toLowerCase()
    .replace(/^\/?status\//, "")
    .replace(/[^a-z0-9_-]/g, "") || "default";
}

function parseBaseUrl(value) {
  const raw = asString(value).replace(/\/+$/, "");
  if (!raw) {
    return { baseUrl: "", slug: "" };
  }

  const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Uptime Kuma base URL must use http or https.");
  }

  const statusMatch = url.pathname.match(/^(.*)\/status\/([^/]+)$/);
  const basePath = (statusMatch ? statusMatch[1] : url.pathname).replace(/\/+$/, "");

  return {
    baseUrl: `${url.origin}${basePath === "/" ? "" : basePath}`,
    slug: statusMatch ? statusMatch[2] : "",
  };
}

function normalizeSettings(query) {
  const parsedBaseUrl = parseBaseUrl(query.baseUrl || process.env.UPTIME_KUMA_BASE_URL);
  const requestedSlug = asString(query.slug || process.env.UPTIME_KUMA_STATUS_SLUG);

  return {
    baseUrl: parsedBaseUrl.baseUrl,
    slug: normalizeSlug(
      requestedSlug && requestedSlug !== "default" ? requestedSlug : parsedBaseUrl.slug || requestedSlug,
    ),
    monitor: asString(query.monitor),
    limit: numberInRange(query.limit, 8, 1, 16),
    showIncidents: asBoolean(query.showIncidents, true),
    showMaintenance: asBoolean(query.showMaintenance, true),
    showHeartbeats: asBoolean(query.showHeartbeats, true),
    showPing: asBoolean(query.showPing, true),
    timeoutMs: numberInRange(query.timeoutMs, 5000, 1000, 15000),
  };
}

function apiUrl(baseUrl, path) {
  return new URL(`${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`);
}

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "paperlesspaper-openintegrations/0.1.0",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`${url.hostname} returned ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Uptime Kuma request timed out after ${timeoutMs}ms.`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function latestHeartbeat(heartbeats) {
  return Array.isArray(heartbeats) && heartbeats.length
    ? heartbeats[heartbeats.length - 1]
    : null;
}

function numericPing(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function averagePing(heartbeats) {
  const pings = heartbeats
    .map((beat) => numericPing(beat?.ping))
    .filter((ping) => ping !== null);

  if (!pings.length) {
    return null;
  }

  return Math.round(pings.reduce((sum, ping) => sum + ping, 0) / pings.length);
}

function uptimePercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }

  return number <= 1 ? number * 100 : number;
}

function shapeMonitor(monitor, group, heartbeatList, uptimeList) {
  const heartbeats = Array.isArray(heartbeatList?.[monitor.id])
    ? heartbeatList[monitor.id]
    : [];
  const latest = latestHeartbeat(heartbeats);
  const status = Number.isFinite(Number(latest?.status)) ? Number(latest.status) : 2;
  const uptime24 = uptimePercent(uptimeList?.[`${monitor.id}_24`]);

  return {
    id: monitor.id,
    name: monitor.name || `Monitor ${monitor.id}`,
    type: monitor.type || "",
    url: monitor.url || "",
    groupName: group.name || "Services",
    status,
    statusKey: statusKeys[status] || "unknown",
    statusLabel: statusLabels[status] || "Unknown",
    uptime24,
    latestPing: numericPing(latest?.ping),
    averagePing: averagePing(heartbeats),
    lastHeartbeatAt: latest?.time || "",
    heartbeats: heartbeats.slice(-36).map((beat) => ({
      status: Number(beat.status),
      statusKey: statusKeys[Number(beat.status)] || "unknown",
      time: beat.time,
      ping: numericPing(beat.ping),
    })),
  };
}

function monitorMatches(monitor, filter) {
  if (!filter) {
    return true;
  }

  const normalized = filter.toLowerCase();
  if (/^\d+$/.test(normalized) && String(monitor.id) === normalized) {
    return true;
  }

  return String(monitor.name || "").toLowerCase().includes(normalized);
}

function overallStatus(monitors) {
  if (!monitors.length) {
    return { key: "unknown", label: "No public monitors" };
  }

  if (monitors.some((monitor) => monitor.status === 3)) {
    return { key: "maintenance", label: "Maintenance" };
  }

  const up = monitors.filter((monitor) => monitor.status === 1).length;
  const down = monitors.filter((monitor) => monitor.status === 0).length;

  if (down === 0 && up > 0) {
    return { key: "up", label: "All systems operational" };
  }

  if (up === 0 && down > 0) {
    return { key: "down", label: "Systems down" };
  }

  if (down > 0) {
    return { key: "degraded", label: "Partially degraded" };
  }

  return { key: "pending", label: "Pending checks" };
}

function stripHtml(value) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function shapeIncident(incident) {
  return {
    id: incident.id,
    title: incident.title || "Incident",
    content: stripHtml(incident.content),
    style: incident.style || "",
    createdAt: incident.createdDate || incident.created_date || "",
    updatedAt: incident.lastUpdatedDate || incident.updatedDate || "",
  };
}

function shapeMaintenance(maintenance) {
  return {
    id: maintenance.id,
    title: maintenance.title || maintenance.name || "Maintenance",
    description: stripHtml(maintenance.description),
    strategy: maintenance.strategy || "",
  };
}

function shapeStatusPage(settings, pageData, heartbeatData) {
  const groups = Array.isArray(pageData.publicGroupList)
    ? pageData.publicGroupList
    : [];
  const heartbeatList = heartbeatData?.heartbeatList || {};
  const uptimeList = heartbeatData?.uptimeList || {};
  const monitors = groups
    .flatMap((group) =>
      (Array.isArray(group.monitorList) ? group.monitorList : []).map((monitor) =>
        shapeMonitor(monitor, group, heartbeatList, uptimeList),
      ),
    )
    .filter((monitor) => monitorMatches(monitor, settings.monitor))
    .slice(0, settings.limit);
  const status = overallStatus(monitors);
  const pageTitle = pageData.config?.title || "Uptime Kuma";
  const baseUrl = settings.baseUrl.replace(/\/+$/, "");

  return {
    title: pageTitle,
    slug: settings.slug,
    status,
    monitors,
    summary: {
      total: monitors.length,
      up: monitors.filter((monitor) => monitor.status === 1).length,
      down: monitors.filter((monitor) => monitor.status === 0).length,
      pending: monitors.filter((monitor) => monitor.status === 2).length,
      maintenance: monitors.filter((monitor) => monitor.status === 3).length,
    },
    incidents: settings.showIncidents && Array.isArray(pageData.incidents)
      ? pageData.incidents.map(shapeIncident).slice(0, 3)
      : [],
    maintenanceList:
      settings.showMaintenance && Array.isArray(pageData.maintenanceList)
        ? pageData.maintenanceList.map(shapeMaintenance).slice(0, 3)
        : [],
    showHeartbeats: settings.showHeartbeats,
    showPing: settings.showPing,
    source: "Uptime Kuma",
    sourceUrl: baseUrl ? `${baseUrl}/status/${settings.slug}` : "",
    updatedAt: new Date().toISOString(),
  };
}

function sampleHeartbeat(minutesAgo, status, ping) {
  return {
    status,
    time: new Date(Date.now() - minutesAgo * 60 * 1000).toISOString(),
    ping,
  };
}

function sampleData(settings) {
  const pageData = {
    config: { title: "Paperless Systems" },
    incidents: [
      {
        id: 1,
        title: "Media API latency",
        content: "Image processing is slower than usual.",
        style: "warning",
        createdDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
    ],
    maintenanceList: [
      {
        id: 1,
        title: "Database upgrade",
        description: "Scheduled maintenance window tonight.",
        strategy: "manual",
      },
    ],
    publicGroupList: [
      {
        id: 1,
        name: "Core",
        monitorList: [
          { id: 11, name: "Website", type: "http", url: "https://example.com" },
          { id: 12, name: "API", type: "http", url: "https://api.example.com" },
          { id: 13, name: "Worker", type: "push" },
          { id: 14, name: "Backups", type: "keyword" },
        ],
      },
    ],
  };
  const heartbeatData = {
    heartbeatList: {
      11: Array.from({ length: 36 }, (_, index) =>
        sampleHeartbeat(35 - index, 1, 55 + (index % 5) * 4),
      ),
      12: Array.from({ length: 36 }, (_, index) =>
        sampleHeartbeat(35 - index, index > 28 && index < 32 ? 0 : 1, 82 + (index % 6) * 7),
      ),
      13: Array.from({ length: 36 }, (_, index) =>
        sampleHeartbeat(35 - index, 1, null),
      ),
      14: Array.from({ length: 36 }, (_, index) =>
        sampleHeartbeat(35 - index, index > 31 ? 3 : 1, 120),
      ),
    },
    uptimeList: {
      "11_24": 1,
      "12_24": 0.972,
      "13_24": 0.996,
      "14_24": 0.989,
    },
  };

  return shapeStatusPage(settings, pageData, heartbeatData);
}

export default async function handler({ query }) {
  const settings = normalizeSettings(query);

  if (!settings.baseUrl) {
    return sampleData(settings);
  }

  const pageUrl = apiUrl(settings.baseUrl, `/api/status-page/${settings.slug}`);
  const heartbeatUrl = apiUrl(
    settings.baseUrl,
    `/api/status-page/heartbeat/${settings.slug}`,
  );
  const [pageData, heartbeatData] = await Promise.all([
    fetchJson(pageUrl, settings.timeoutMs),
    fetchJson(heartbeatUrl, settings.timeoutMs),
  ]);

  return shapeStatusPage(settings, pageData, heartbeatData);
}
