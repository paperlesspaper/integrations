// Google colors are user/calendar metadata, not global display-theme settings.
// The host may supply the CalendarList entries and the Colors API response with its events.
const record = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const text = (value) => typeof value === "string" ? value.trim() : "";

export function resolveGoogleEventColors(event, payload) {
  const root = record(payload);
  const data = record(root.calendarData || record(root.meta).calendarData || root);
  const palette = record(data.colors || root.colors);
  const calendars = data.calendars || root.calendars;
  const calendarId = text(event.calendarId);
  const entry = Array.isArray(calendars)
    ? calendars.find((calendar) => calendarId && calendar?.id === calendarId)
    : calendarId ? record(calendars)[calendarId] : undefined;
  const single = record(data.calendar);
  const calendar = record(event.calendar || entry || (!calendarId || single.id === calendarId ? single : undefined));
  return {
    color: text(event.color) || text(event.backgroundColor)
      || text(record(record(palette.event)[event.colorId]).background),
    calendarColor: text(event.calendarColor) || text(calendar.backgroundColor)
      || text(record(record(palette.calendar)[calendar.colorId]).background)
      || (!calendarId || single.id === calendarId ? text(data.calendarColor) : "")
  };
}
