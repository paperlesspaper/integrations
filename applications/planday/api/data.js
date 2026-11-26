import { buildCalendarRange } from "@paperlesspaper/openintegration";
import { addLocalDays, dateKey, localDateTime, normalizeCalendarRange, normalizeTimeZone } from "../../_shared/calendar-feed.js";
import { bool, getJson, required, text } from "../../_shared/dashboard-api.js";

const studioZone = "Europe/Berlin";
const dayMs = 86_400_000;
const employeePalette = ["#0000ff", "#00ff00", "#ff0000", "#000000", "#ffffff", "#ffff00"];

function employeeColors(names, scheduledIds) {
  const roster = [...new Set([...names.keys(), ...scheduledIds])].sort((a, b) => a - b);
  const colors = new Map();
  const unused = new Set(employeePalette);
  const shared = [];
  for (const [index, id] of roster.entries()) {
    if (!scheduledIds.has(id)) continue;
    const preferred = employeePalette[index % employeePalette.length];
    colors.set(id, preferred);
    if (!unused.delete(preferred)) shared.push(id);
  }
  // In larger teams, give scheduled staff distinct colors while spare pigments are available.
  for (const id of shared) {
    const next = unused.values().next();
    if (next.done) break;
    colors.set(id, next.value);
    unused.delete(next.value);
  }
  return colors;
}

function employeeName(format, firstName, lastName, displayName) {
  if (format === "Nur Vorname") return text(firstName);
  if (format === "Nur Nachname") return text(lastName);
  return text(displayName) || [text(firstName), text(lastName)].filter(Boolean).join(" ");
}

function departmentIdText(value) {
  return Number.isSafeInteger(value) ? String(value) : text(value);
}

async function webSchedule(query, params, collect, fetchJson) {
  const en = query.language === "en";
  const department = departmentIdText(query.departmentId);
  const token = text(query.browserToken).replace(/^Bearer\s+/i, "");
  if (!/^\d+$/.test(department) || !token || /\s/.test(token)) {
    throw new Error(en ? "Enter the department ID and a valid web schedule token."
      : "Trage die Abteilungs-ID und ein gültiges Zugriffstoken für den Web-Dienstplan ein.");
  }
  const headers = {
    Authorization: "Bearer " + token,
    ...(text(query.clientId) && { "X-ClientId": text(query.clientId) }),
    "Planday-Client-Version": "Web-0.0.1",
  };
  const basePath = "/scheduling/departments/" + department + "/day_based/";
  async function rows(service, resource) {
    const url = new URL(basePath + resource, "https://scheduling-" + service + "-api.prod-westeurope.planday.cloud");
    url.search = new URLSearchParams(params);
    let payload;
    try {
      payload = await fetchJson(url.href, { headers });
    } catch (error) {
      if (/HTTP 401\b/.test(error.message)) throw new Error(en
        ? "Planday rejected the web schedule token. Replace it in the settings."
        : "Planday hat das Zugriffstoken abgelehnt. Ersetze es in den Einstellungen.");
      throw error;
    }
    if (!Array.isArray(payload?.[resource])) throw new Error("Invalid Planday web schedule response");
    return payload[resource];
  }
  const shifts = await rows("shift", "shifts");
  const ids = collect(shifts.map(shift => ({
    id: shift.id, employeeId: shift.employee_id, status: shift.status,
    date: shift.date, timeZone: shift.time_zone,
    startDateTime: shift.start_date_time, endDateTime: shift.end_date_time,
  })));
  const names = new Map();
  if (ids.size) {
    for (const employee of await rows("people", "employees")) {
      names.set(employee.id, employeeName(query.nameFormat,
        employee.name?.first_name ?? employee.first_name,
        employee.name?.last_name ?? employee.last_name,
        employee.display_name));
    }
  }
  return names;
}

function timestamp(value, zone) {
  if (!value) return null;
  // Planday also returns wall-clock values without a numeric offset.
  const local = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value);
  const instant = local
    ? localDateTime(+local[1], +local[2] - 1, +local[3], +local[4], +local[5], zone)
    : new Date(value);
  if (!Number.isFinite(instant.getTime())) throw new Error("Invalid Planday shift time");
  return instant;
}

async function* pages(path, params, headers, limit, fetchJson) {
  let offset = 0;
  while (true) {
    const url = new URL(path, "https://openapi.planday.com");
    url.search = new URLSearchParams({ ...params, limit, offset });
    const { data, paging } = await fetchJson(url.href, { headers });
    if (!Array.isArray(data)) throw new Error("Invalid Planday response");
    yield data;
    offset += data.length;
    if (Number.isInteger(paging?.total)) {
      if (offset >= paging.total) return;
      if (!data.length) throw new Error("Incomplete Planday response");
    } else if (data.length < limit) return;
  }
}

const sampleEmployees = [[1, "Mila", "Weber"], [2, "Noah", "Beck"], [3, "Leni", "Fischer"], [4, "Sam", "Keller"]];
const sampleWeek = [
  [], [[1, "08:00", "12:00"], [2, "12:00", "18:00"]], [[4, "08:00", "16:00"]],
  [[3, "08:30", "13:00"], [2, "12:00", "19:00"]], [[1, "08:00", "14:00"], [4, "14:00", "20:00"]],
  [[3, "09:00", "17:00"], [4, "18:00", "02:00"]], [[2, "10:00", "15:00"]],
];

function sampleShifts(from, to) {
  const shifts = [];
  for (let ms = Date.parse(from); ms <= Date.parse(to); ms += dayMs) {
    const day = new Date(ms);
    const date = day.toISOString().slice(0, 10);
    for (const [employeeId, start, end] of sampleWeek[day.getUTCDay()]) {
      const endDate = end < start ? new Date(ms + dayMs).toISOString().slice(0, 10) : date;
      shifts.push({ id: date + "/" + employeeId, employeeId, status: "Assigned", date,
        startDateTime: date + "T" + start, endDateTime: endDate + "T" + end });
    }
  }
  return shifts;
}

function calendarEvent(shift, range) {
  if (!shift.employeeId || shift.status === "Open" || shift.status === "Draft") return null;
  const zone = normalizeTimeZone(shift.timeZone, studioZone);
  const start = timestamp(shift.startDateTime, zone);
  const end = timestamp(shift.endDateTime, zone);
  if (start) {
    if (start >= range.to || (start < range.from && (!end || end <= range.from))) return null;
    return { id: shift.id, start: { dateTime: start.toISOString() }, ...(end && { end: { dateTime: end.toISOString() } }) };
  }
  if (!shift.date || shift.date < range.rangeStart || shift.date >= range.rangeEndExclusive) return null;
  return { id: shift.id, start: { date: shift.date }, ...(end && { end: { dateTime: end.toISOString() } }) };
}

async function fetchHelper(key) {
  // Fixed private Docker service. A frame cannot choose the destination.
  const res = await fetch("http://planday-week-helper:3100/week", {
    headers: { Authorization: "Bearer " + key }, redirect: "error", signal: AbortSignal.timeout(5000),
  });
  if (res.status === 401) throw Error("Der Leseschlüssel für den Helper ist ungültig.");
  if (!res.ok) throw Error("Der Helper hat noch keinen aktuellen Wochenplan. Bitte die Planday-Anmeldung in Dokploy prüfen.");
  return res.json();
}

export async function loadCalendar(query = {}, fetchJson = getJson, now = new Date(), readHelper = fetchHelper) {
  const timeZone = normalizeTimeZone(query.timeZone, studioZone);
  const week = buildCalendarRange({ view: "week", timeZone }, now);
  const range = normalizeCalendarRange({
    rangeStart: query.rangeStart || week.startKey,
    rangeEndExclusive: query.rangeEndExclusive || week.endKey,
    timeZone, maxDays: 366,
  });
  // Include the prior schedule date so shifts crossing the first midnight survive.
  const params = {
    from: dateKey(addLocalDays(range.from, -1, studioZone), studioZone),
    to: dateKey(new Date(range.to.getTime() - 1), studioZone),
  };
  const events = [];
  const scheduledIds = new Set();
  function collect(shifts) {
    for (const shift of shifts) {
      const event = calendarEvent(shift, range);
      if (event) {
        events.push({ ...event, employeeId: shift.employeeId });
        scheduledIds.add(shift.employeeId);
      }
    }
    return scheduledIds;
  }

  const sample = bool(query.sampleData);
  let names;
  if (sample) {
    names = new Map(sampleEmployees.map(([id, first, last]) => [id, employeeName(query.nameFormat, first, last)]));
    collect(sampleShifts(params.from, params.to));
  } else if (query.connection === "weekHelper") {
    const key = text(query.helperKey);
    if (!/^[A-Za-z0-9_-]{43}$/.test(key)) throw Error("Bitte den Leseschlüssel aus dem Wochenplan-Helper eintragen.");
    const data = await readHelper(key);
    if (query.departmentId && departmentIdText(query.departmentId) !== data.department) {
      throw Error("Der Helper ist für eine andere Abteilung eingerichtet.");
    }
    const lastDay = dateKey(new Date(range.to.getTime() - 1), timeZone);
    if (range.rangeStart < data.from || lastDay > data.to) {
      throw Error("Der Helper liefert die laufende Kalenderwoche. Bitte die Kalenderansicht week wählen.");
    }
    collect(data.shifts);
    names = new Map(data.employees.map(e => [e.id, employeeName(query.nameFormat, e.first, e.last, e.display)]));
  } else if (query.connection === "webSchedule") {
    names = await webSchedule(query, params, collect, fetchJson);
  } else {
    const clientId = text(query.clientId);
    const refreshToken = text(query.refreshToken);
    if (!clientId || !refreshToken) throw new Error(query.language === "en"
      ? "Enter your Planday app ID and refresh token in the integration settings."
      : "Trage die Planday-App-ID und das Refresh-Token in den Einstellungen ein.");
    const departmentId = departmentIdText(query.departmentId);
    if (departmentId && !/^\d+$/.test(departmentId)) throw new Error("Invalid Planday department ID");
    if (departmentId) params.departmentId = departmentId;
    const token = await fetchJson("https://id.planday.com/connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, grant_type: "refresh_token", refresh_token: refreshToken }).toString(),
    });
    const headers = {
      "X-ClientId": clientId, Authorization: "Bearer " + required(token.access_token, "Planday access token"),
    };
    for await (const shifts of pages("/scheduling/v1.0/shifts", params, headers, 500, fetchJson)) collect(shifts);
    names = new Map();
    if (scheduledIds.size) {
      for await (const employees of pages("/hr/v1.0/employees", {}, headers, 50, fetchJson)) {
        for (const employee of employees) {
          names.set(employee.id, employeeName(query.nameFormat, employee.firstName, employee.lastName));
        }
      }
    }
  }
  const colors = employeeColors(names, scheduledIds);
  return { sample, events: events.map(({ employeeId, ...event }) => ({
    ...event, color: colors.get(employeeId), title: names.get(employeeId) || "#" + employeeId,
  })) };
}

export default async function handler({ query, request }) {
  if (query.helperKey && (request?.method !== "POST" || request.query?.helperKey)) {
    throw new Error("Submit the helper key in the POST body.");
  }
  if (query.browserToken && (request?.method !== "POST" || request.query?.browserToken)) {
    throw new Error("Submit the web schedule token in the POST body.");
  }
  return loadCalendar(query);
}
