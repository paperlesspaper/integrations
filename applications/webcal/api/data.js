import {
  booleanSetting,
  buildSampleEvents,
  fetchCalendarFeed,
  integerSetting,
  localDateTime,
  normalizeCalendarRange,
  parseCalendarFeed,
  stringSetting
} from "../../_shared/calendar-feed.js";

const SAMPLE_EVENTS = [
  { title: "Breakfast with Maya", hour: 8, minute: 30, duration: 60, location: "Café Linden" },
  { title: "Design review", hour: 14, duration: 75, location: "Studio 3", dayOffset: 1 },
  { title: "City festival", allDay: true, days: 3, dayOffset: 3 },
  { title: "Dentist", hour: 10, duration: 45, location: "Example Dental", dayOffset: 7 },
  { title: "Project milestone", allDay: true, dayOffset: 10 }
];

function sampleCalendar(range, limit) {
  const [year, month, day] = range.rangeStart.split("-").map(Number);
  const base = localDateTime(year, month - 1, day, 0, 0, range.timeZone);
  return {
    sample: true,
    source: "Fictional sample data",
    calendarName: "Shared calendar (sample)",
    events: buildSampleEvents(base, range.timeZone, SAMPLE_EVENTS).slice(0, limit)
  };
}

export default async function handler({ query = {} }) {
  const feedUrl = stringSetting(query, "feedUrl", "");
  const username = stringSetting(query, "username", "");
  const password = stringSetting(query, "password", "");
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

  const hasConnectionSettings = Boolean(feedUrl || username || password);
  if (sampleData || !hasConnectionSettings) {
    return sampleCalendar(range, limit);
  }
  if (!feedUrl) {
    throw new Error("A Webcal or iCalendar feed URL is required when credentials are configured.");
  }

  const text = await fetchCalendarFeed({
    feedUrl,
    username,
    password,
    allowHttp: booleanSetting(query, "allowHttp", false)
  });
  const parsed = parseCalendarFeed(text, {
    from: range.rangeStart,
    to: range.rangeEndExclusive,
    timeZone: range.timeZone,
    maxEvents: limit
  });

  return {
    sample: false,
    source: "Webcal / iCalendar feed",
    calendarName: parsed.calendarName || "",
    events: parsed.events
  };
}
