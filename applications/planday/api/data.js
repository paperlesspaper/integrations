import { buildCalendarRange } from "@paperlesspaper/openintegration";
import { addLocalDays, dateKey, localDateTime, normalizeCalendarRange, normalizeTimeZone } from "../../_shared/calendar-feed.js";
import { bool, getJson, required, text } from "../../_shared/dashboard-api.js";

const studioZone = "Europe/Berlin";
const dayMs = 86_400_000;

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

const sampleNames = new Map([[1, "Mila Weber"], [2, "Noah Beck"], [3, "Leni Fischer"], [4, "Sam Keller"]]);
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

export async function loadCalendar(query = {}, fetchJson = getJson, now = new Date()) {
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
  const missing = new Set();
  function collect(shifts) {
    for (const shift of shifts) {
      const event = calendarEvent(shift, range);
      if (event) {
        events.push({ ...event, employeeId: shift.employeeId });
        missing.add(shift.employeeId);
      }
    }
  }

  const sample = bool(query.sampleData);
  let names;
  if (sample) {
    names = sampleNames;
    collect(sampleShifts(params.from, params.to));
  } else {
    const clientId = text(query.clientId);
    const refreshToken = text(query.refreshToken);
    if (!clientId || !refreshToken) throw new Error(query.language === "en"
      ? "Enter your Planday app ID and refresh token in the integration settings."
      : "Trage die Planday-App-ID und das Refresh-Token in den Einstellungen ein.");
    const departmentId = text(query.departmentId);
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
    if (missing.size) {
      for await (const employees of pages("/hr/v1.0/employees", {}, headers, 50, fetchJson)) {
        for (const employee of employees) {
          if (!missing.delete(employee.id)) continue;
          names.set(employee.id, [text(employee.firstName), text(employee.lastName)].filter(Boolean).join(" "));
        }
        if (!missing.size) break;
      }
    }
  }
  return { sample, events: events.map(({ employeeId, ...event }) => ({
    ...event, title: names.get(employeeId) || "#" + employeeId,
  })) };
}

export default async function handler({ query }) {
  return loadCalendar(query);
}
