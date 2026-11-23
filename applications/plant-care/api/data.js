import {
  bool,
  text,
  array,
  clean,
  row,
  metric,
  tr,
  envelope,
  localDayNumber,
  dayInZone,
} from "../../_shared/connected-api.js";
export function careSchedule(plants, q, now = new Date()) {
  const today = localDayNumber(
    dayInZone(now, text(q.timeZone) || "Europe/Berlin"),
  );
  const tasks = [];
  for (const p of array(plants).slice(0, 100)) {
    if (!text(p.name)) throw Error("Plant name is required");
    for (const [kind, dateKey, intervalKey] of [
      ["water", "lastWatered", "waterEveryDays"],
      ["feed", "lastFed", "feedEveryDays"],
    ]) {
      const interval = Number(p[intervalKey]);
      if (!interval && kind === "feed") continue;
      if (!Number.isInteger(interval) || interval < 1 || interval > 365)
        throw Error("Care interval must be 1–365 days");
      const last = text(p[dateKey]);
      const due = last ? localDayNumber(last) + interval - today : null;
      const action =
        kind === "water" ? tr(q, "Gießen", "Water") : tr(q, "Düngen", "Feed");
      tasks.push({
        due,
        icon: "plant",
        ...row(
          p.name,
          [clean(p.location), action].filter(Boolean).join(" · "),
          due === null
            ? tr(q, "Datum fehlt", "Date missing")
            : due < 0
              ? tr(q, `${-due} Tage überfällig`, `${-due} days overdue`)
              : due === 0
                ? tr(q, "Heute", "Today")
                : tr(q, `In ${due} Tagen`, `In ${due} days`),
          due === null
            ? "orange"
            : due < 0
              ? "red"
              : due === 0
                ? "orange"
                : "green",
        ),
      });
    }
  }
  tasks.sort((a, b) => (a.due ?? -9999) - (b.due ?? -9999));
  return {
    total: tasks.length,
    metrics: [
      metric(tr(q, "Pflanzen", "Plants"), plants.length),
      metric(
        tr(q, "Heute / überfällig", "Due / overdue"),
        tasks.filter((x) => x.due !== null && x.due <= 0).length,
      ),
      metric(
        tr(q, "Ohne Datum", "Missing date"),
        tasks.filter((x) => x.due === null).length,
      ),
    ],
    rows: tasks,
    note: tr(
      q,
      "Nach dem Pflegen das Datum in den Einstellungen aktualisieren. Bedarf der Pflanze prüfen.",
      "After care, update the date in settings. Check the actual needs of each plant.",
    ),
  };
}
export async function loadData(q = {}, _fetch, now = new Date()) {
  const sample = bool(q.sampleData);
  const daysAgo = (n) =>
    new Date(
      (localDayNumber(dayInZone(now, text(q.timeZone) || "Europe/Berlin")) -
        n) *
        86400000,
    )
      .toISOString()
      .slice(0, 10);
  const plants = sample
    ? [
        {
          name: "Monstera",
          location: tr(q, "Wohnzimmer", "Living room"),
          lastWatered: daysAgo(8),
          waterEveryDays: 7,
        },
        {
          name: "Calathea",
          location: tr(q, "Schlafzimmer", "Bedroom"),
          lastWatered: daysAgo(4),
          waterEveryDays: 4,
        },
        {
          name: "Ficus",
          location: tr(q, "Arbeitszimmer", "Office"),
          lastWatered: daysAgo(3),
          waterEveryDays: 7,
          lastFed: daysAgo(20),
          feedEveryDays: 30,
        },
      ]
    : JSON.parse(text(q.plants) || "[]");
  return envelope(
    careSchedule(plants, q, now),
    sample,
    tr(q, "Pflanzenpflege", "Plant care"),
  );
}
export default async function handler({ query }) {
  return loadData(query);
}
