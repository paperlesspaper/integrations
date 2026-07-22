import {
  booleanSetting,
  buildSampleEvents,
  fetchCalDavCalendar,
  integerSetting,
  localDateTime,
  normalizeCalendarRange,
  parseCalendarFeed,
  stringSetting
} from "../../_shared/calendar-feed.js";

const SAMPLE_EVENTS = [
  { title: "Team planning", hour: 9, duration: 60, location: "Conference room" },
  { title: "Focus block", hour: 13, duration: 150, location: "Home office" },
  { title: "Client review", hour: 11, duration: 45, location: "Video call", dayOffset: 2 },
  { title: "Maintenance window", allDay: true, days: 2, dayOffset: 4 },
  { title: "Release retrospective", hour: 15, duration: 60, dayOffset: 8 }
];

function sampleCalendar(range, limit) {
  const [year, month, day] = range.rangeStart.split("-").map(Number);
  const base = localDateTime(year, month - 1, day, 0, 0, range.timeZone);
  return {
    sample: true,
    source: "Fictional sample data",
    calendarName: "Work calendar (sample)",
    events: buildSampleEvents(base, range.timeZone, SAMPLE_EVENTS).slice(0, limit)
  };
}

function eventStart(event) {
  return String(event?.start?.dateTime || event?.start?.date || "");
}

function mergeCalendarObjects(objects, range, limit) {
  const events = [];
  let parsedCalendarName = "";
  for (const object of objects) {
    const parsed = parseCalendarFeed(object, {
      from: range.rangeStart,
      to: range.rangeEndExclusive,
      timeZone: range.timeZone,
      maxEvents: limit
    });
    parsedCalendarName ||= parsed.calendarName;
    events.push(...parsed.events);
    if (events.length >= limit * 2) {
      break;
    }
  }

  const unique = new Map();
  for (const event of events) {
    const key = `${String(event.id || "event")}|${eventStart(event)}`;
    if (!unique.has(key)) {
      unique.set(key, event);
    }
  }
  return {
    calendarName: parsedCalendarName,
    events: [...unique.values()]
      .sort((left, right) => eventStart(left).localeCompare(eventStart(right)))
      .slice(0, limit)
  };
}

export default async function handler({ query = {} }) {
  const calendarUrl = stringSetting(query, "calendarUrl", "");
  const username = stringSetting(query, "username", "");
  const password = stringSetting(query, "password", "");
  const configuredCalendarName = stringSetting(query, "calendarName", "");
  const sampleData = booleanSetting(query, "sampleData", false);
  const limit = integerSetting(query, "limit", 500, 1, 1_000);
  const range = normalizeCalendarRange({
    rangeStart: stringSetting(query, "rangeStart", ""),
    rangeEndExclusive: stringSetting(query, "rangeEndExclusive", ""),
    timeZone: stringSetting(query, "timeZone", "Europe/Berlin"),
    now: stringSetting(query, "now", ""),
    defaultDays: 14,
    maxDays: 370
  });

  const hasConnectionSettings = Boolean(calendarUrl || username || password);
  if (sampleData || !hasConnectionSettings) {
    return sampleCalendar(range, limit);
  }
  if (!calendarUrl || !username || !password) {
    throw new Error("Calendar URL, username, and password are all required for CalDAV.");
  }

  const objects = await fetchCalDavCalendar({
    calendarUrl,
    username,
    appPassword: password,
    from: range.from,
    to: range.to,
    allowHttp: booleanSetting(query, "allowHttp", false)
  });
  const parsed = mergeCalendarObjects(objects, range, limit);
  return {
    sample: false,
    source: "CalDAV calendar",
    calendarName: configuredCalendarName || parsed.calendarName || "",
    events: parsed.events
  };
}
