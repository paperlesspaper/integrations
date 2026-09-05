import { bool, text, language } from "../../_shared/dashboard-api.js";
import {
  normalizeCalendarRange,
  dateKey,
  addLocalDays,
  localDateTime,
  dateParts,
} from "../../_shared/calendar-feed.js";
export function parseSchedule(value) {
  const lines = text(value)
    .split(/\r?\n/)
    .filter((s) => s.trim());
  if (lines.length > 100)
    throw new Error("A timetable supports at most 100 weekly lessons");
  return lines.map((line, i) => {
    const [day, start, end, title, room = ""] = line
      .split("|")
      .map((v) => v.trim());
    if (
      !/^[1-7]$/.test(day) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(start) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(end) ||
      start >= end ||
      !title
    )
      throw new Error(
        `Invalid lesson on line ${i + 1}: weekday | HH:MM | HH:MM | subject | room`,
      );
    return {
      day: +day,
      start,
      end,
      title: title.slice(0, 160),
      room: room.slice(0, 100),
    };
  });
}
export default async function handler({ query }) {
  const sample = bool(query.sampleData),
    de = language(query) === "de";
  const range = normalizeCalendarRange({
    ...query,
    defaultDays: 7,
    maxDays: 370,
  });
  const demo = Array.from(
    { length: 5 },
    (_, i) =>
      `${i + 1}|08:00|08:45|${de ? "Mathematik" : "Mathematics"}|101\n${i + 1}|09:00|09:45|${de ? "Englisch" : "English"}|102\n${i + 1}|10:00|10:45|${de ? "Kunst" : "Art"}|204`,
  ).join("\n");
  const lessons = parseSchedule(sample ? demo : query.schedule);
  const events = [];
  for (
    let date = range.from;
    date < range.to;
    date = addLocalDays(date, 1, range.timeZone)
  ) {
    const key = dateKey(date, range.timeZone),
      p = dateParts(date, range.timeZone),
      weekday = new Date(`${key}T12:00:00Z`).getUTCDay() || 7;
    for (const [i, l] of lessons.entries())
      if (l.day === weekday) {
        const stamp = (clock) => {
          const [h, m] = clock.split(":").map(Number);
          return localDateTime(
            p.year,
            p.month - 1,
            p.day,
            h,
            m,
            range.timeZone,
          ).toISOString();
        };
        events.push({
          id: `${key}-${i}`,
          title: l.title,
          start: { dateTime: stamp(l.start) },
          end: { dateTime: stamp(l.end) },
          location: l.room,
        });
      }
  }
  return {
    events,
    calendarName: text(query.schoolName),
    source: "School Timetable",
    sample,
  };
}
