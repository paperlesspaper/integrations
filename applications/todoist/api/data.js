const TODOIST_API_BASE = "https://api.todoist.com";
const validViews = new Set(["today", "upcoming", "project", "custom", "all"]);
const validSorts = new Set(["todoist", "due", "priority"]);

function asString(value, fallback = "") {
  return String(value ?? fallback).trim();
}

function integerInRange(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.floor(number)));
}

function normalizeTimezone(value) {
  const timezone = asString(value, "Europe/Berlin");
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return "Europe/Berlin";
  }
}

function normalizeLanguage(value) {
  return asString(value, "en").toLowerCase().split("-")[0] || "en";
}

function normalizeSettings(query) {
  const view = validViews.has(asString(query.view)) ? asString(query.view) : "today";
  const sortBy = validSorts.has(asString(query.sortBy)) ? asString(query.sortBy) : "todoist";
  const settings = {
    apiToken: asString(query.apiToken || process.env.TODOIST_API_TOKEN),
    view,
    filter: asString(query.filter),
    projectId: asString(query.projectId),
    limit: integerInRange(query.limit, 7, 1, 12),
    sortBy,
    timezone: normalizeTimezone(query.timezone),
    language: normalizeLanguage(query.language),
  };

  if (settings.apiToken && settings.view === "project" && !settings.projectId) {
    throw new Error("Project view requires a Todoist project ID.");
  }

  if (settings.apiToken && settings.view === "custom" && !settings.filter) {
    throw new Error("Custom view requires a Todoist filter.");
  }

  return settings;
}

function requestHeaders(apiToken) {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${apiToken}`,
    "User-Agent": "paperlesspaper-openintegrations/0.1.0",
  };
}

async function fetchJson(url, apiToken) {
  const response = await fetch(url, {
    headers: requestHeaders(apiToken),
    signal: AbortSignal.timeout(12_000),
  });

  if (response.status === 401) {
    throw new Error("Todoist rejected the API token.");
  }
  if (response.status === 403) {
    throw new Error("Todoist denied access to this resource.");
  }
  if (response.status === 404) {
    throw new Error("The Todoist project or resource was not found.");
  }
  if (response.status === 429) {
    throw new Error("Todoist rate limit reached. Try a slower refresh interval.");
  }
  if (!response.ok) {
    throw new Error(`Todoist API failed with ${response.status}.`);
  }

  return response.json();
}

function taskRequest(settings) {
  if (settings.view === "project") {
    const url = new URL("/api/v1/tasks", TODOIST_API_BASE);
    url.searchParams.set("project_id", settings.projectId);
    url.searchParams.set("limit", "200");
    return { url, queryLabel: `project:${settings.projectId}` };
  }

  if (settings.view === "all") {
    const url = new URL("/api/v1/tasks", TODOIST_API_BASE);
    url.searchParams.set("limit", "200");
    return { url, queryLabel: "all" };
  }

  const filters = {
    today: "today | overdue",
    upcoming: "overdue | 7 days",
    custom: settings.filter,
  };
  const query = filters[settings.view] || filters.today;
  const url = new URL("/api/v1/tasks/filter", TODOIST_API_BASE);
  url.searchParams.set("query", query);
  url.searchParams.set("lang", settings.view === "custom" ? settings.language : "en");
  url.searchParams.set("limit", "200");
  return { url, queryLabel: query };
}

function projectRequest() {
  const url = new URL("/api/v1/projects", TODOIST_API_BASE);
  url.searchParams.set("limit", "200");
  return url;
}

function responseItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }
  return [];
}

function dateKeyInTimezone(value, timezone) {
  if (!value) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function todayKey(timezone) {
  return dateKeyInTimezone(new Date().toISOString(), timezone);
}

function dueState(due, timezone) {
  const key = dateKeyInTimezone(due?.date, timezone);
  if (!key) {
    return "none";
  }

  const today = todayKey(timezone);
  if (key < today) {
    return "overdue";
  }
  if (key === today) {
    return "today";
  }
  return "upcoming";
}

function normalizeDuration(duration) {
  const amount = Number(duration?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return {
    amount,
    unit: asString(duration?.unit, "minute"),
  };
}

function normalizeTask(task, projectNames, settings) {
  const due = task?.due && task.due.date
    ? {
        date: asString(task.due.date),
        string: asString(task.due.string),
        recurring: Boolean(task.due.is_recurring),
      }
    : null;

  return {
    id: asString(task?.id),
    content: asString(task?.content, "Untitled task"),
    description: asString(task?.description),
    priority: integerInRange(task?.priority, 4, 1, 4),
    projectId: asString(task?.project_id),
    projectName: projectNames.get(asString(task?.project_id)) || "",
    labels: Array.isArray(task?.labels) ? task.labels.map((label) => asString(label)).filter(Boolean) : [],
    due,
    dueState: dueState(due, settings.timezone),
    duration: normalizeDuration(task?.duration),
    url: asString(task?.url),
    order: Number.isFinite(Number(task?.child_order)) ? Number(task.child_order) : 0,
  };
}

function sortTasks(tasks, sortBy) {
  if (sortBy === "todoist") {
    return tasks;
  }

  const next = [...tasks];
  if (sortBy === "priority") {
    return next.sort((a, b) => a.priority - b.priority || dueSortValue(a).localeCompare(dueSortValue(b)));
  }

  return next.sort((a, b) => dueSortValue(a).localeCompare(dueSortValue(b)) || a.priority - b.priority);
}

function dueSortValue(task) {
  return task.due?.date || "9999-12-31";
}

function taskStats(tasks) {
  return {
    total: tasks.length,
    overdue: tasks.filter((task) => task.dueState === "overdue").length,
    today: tasks.filter((task) => task.dueState === "today").length,
    upcoming: tasks.filter((task) => task.dueState === "upcoming").length,
    noDue: tasks.filter((task) => task.dueState === "none").length,
  };
}

function addDays(dateKey, days) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function sampleTasks(settings) {
  const today = todayKey(settings.timezone);
  const samples = [
    {
      id: "sample-proposal",
      content: "Send revised proposal",
      description: "Include the updated timeline and final estimate.",
      priority: 1,
      projectName: "Work",
      labels: ["deep-work"],
      due: { date: `${today}T10:30:00`, string: "Today 10:30", recurring: false },
      duration: { amount: 45, unit: "minute" },
    },
    {
      id: "sample-groceries",
      content: "Pick up groceries",
      description: "Milk, tomatoes, pasta, basil.",
      priority: 2,
      projectName: "Personal",
      labels: ["errands"],
      due: { date: `${today}T18:00:00`, string: "Today 18:00", recurring: false },
      duration: { amount: 30, unit: "minute" },
    },
    {
      id: "sample-dentist",
      content: "Book dentist appointment",
      description: "Ask for an early morning slot.",
      priority: 1,
      projectName: "Personal",
      labels: ["calls"],
      due: { date: addDays(today, -1), string: "Yesterday", recurring: false },
      duration: { amount: 10, unit: "minute" },
    },
    {
      id: "sample-checklist",
      content: "Review launch checklist",
      description: "Confirm release notes and support handoff.",
      priority: 2,
      projectName: "Website launch",
      labels: ["review"],
      due: { date: addDays(today, 1), string: "Tomorrow", recurring: false },
      duration: { amount: 25, unit: "minute" },
    },
    {
      id: "sample-invoice",
      content: "Submit travel receipts",
      description: "Attach the train and hotel invoices.",
      priority: 3,
      projectName: "Admin",
      labels: ["finance"],
      due: { date: today, string: "Today", recurring: false },
      duration: { amount: 20, unit: "minute" },
    },
    {
      id: "sample-route",
      content: "Plan weekend cycling route",
      description: "Choose a quiet route with one coffee stop.",
      priority: 3,
      projectName: "Personal",
      labels: ["weekend"],
      due: { date: addDays(today, 3), string: "In 3 days", recurring: false },
      duration: { amount: 30, unit: "minute" },
    },
    {
      id: "sample-library",
      content: "Renew library books",
      description: "Renew online before the due date.",
      priority: 4,
      projectName: "Personal",
      labels: [],
      due: { date: addDays(today, 5), string: "In 5 days", recurring: false },
      duration: { amount: 5, unit: "minute" },
    },
    {
      id: "sample-herbs",
      content: "Water balcony herbs",
      description: "Check the basil and rosemary first.",
      priority: 4,
      projectName: "Home",
      labels: ["routine"],
      due: null,
      duration: { amount: 10, unit: "minute" },
    },
  ].map((task, index) => ({
    ...task,
    projectId: `sample-${task.projectName.toLowerCase().replace(/\s+/g, "-")}`,
    dueState: dueState(task.due, settings.timezone),
    url: "",
    order: index,
  }));

  if (settings.view === "today") {
    return samples.filter((task) => task.dueState === "today" || task.dueState === "overdue");
  }
  if (settings.view === "upcoming") {
    return samples.filter((task) => task.dueState !== "none");
  }
  if (settings.view === "project") {
    return samples.filter((task) => task.projectName === "Personal");
  }
  return samples;
}

function shapeResult(tasks, settings, details = {}) {
  const sorted = sortTasks(tasks, settings.sortBy);
  return {
    source: details.source || "todoist",
    view: settings.view,
    queryLabel: details.queryLabel || "",
    projectName: details.projectName || "",
    tasks: sorted.slice(0, settings.limit),
    stats: taskStats(sorted),
    hasMore: Boolean(details.hasMore) || sorted.length > settings.limit,
    fetchedAt: new Date().toISOString(),
  };
}

async function liveData(settings) {
  const request = taskRequest(settings);
  const [taskPayload, projectPayload] = await Promise.all([
    fetchJson(request.url, settings.apiToken),
    fetchJson(projectRequest(), settings.apiToken).catch(() => ({ results: [] })),
  ]);
  const projects = responseItems(projectPayload);
  const projectNames = new Map(projects.map((project) => [asString(project.id), asString(project.name)]));
  const tasks = responseItems(taskPayload).map((task) => normalizeTask(task, projectNames, settings));

  return shapeResult(tasks, settings, {
    source: "todoist",
    queryLabel: request.queryLabel,
    projectName: projectNames.get(settings.projectId) || "",
    hasMore: Boolean(taskPayload?.next_cursor),
  });
}

export default async function todoistData({ query = {} } = {}) {
  const settings = normalizeSettings(query);

  if (!settings.apiToken) {
    return shapeResult(sampleTasks(settings), settings, {
      source: "sample",
      queryLabel: settings.view === "custom" ? settings.filter : settings.view,
      projectName: settings.view === "project" ? "Personal" : "",
    });
  }

  return liveData(settings);
}
