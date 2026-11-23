import {
  getJson,
  bool,
  text,
  array,
  id,
  auth,
  oauthToken,
  nextUrl,
  row,
  tr,
  metric,
  envelope,
  dateLabel,
} from "../../_shared/connected-api.js";
export function normalizeTasks(tasks, q) {
  const open = array(tasks)
    .filter((x) => x.status !== "completed")
    .sort(
      (a, b) =>
        (a.dueDateTime?.dateTime || "9999").localeCompare(
          b.dueDateTime?.dateTime || "9999",
        ) || Number(b.importance === "high") - Number(a.importance === "high"),
    );
  return {
    total: open.length,
    metrics: [
      metric(tr(q, "Offen", "Open"), open.length),
      metric(
        tr(q, "Wichtig", "Important"),
        open.filter((x) => x.importance === "high").length,
      ),
    ],
    rows: open.map((t) =>
      row(
        t.title,
        t.dueDateTime
          ? tr(q, "Fällig: ", "Due: ") +
              String(t.dueDateTime.dateTime).slice(0, 10)
          : "",
        t.importance === "high"
          ? "!"
          : t.status === "inProgress"
            ? tr(q, "In Arbeit", "In progress")
            : "□",
        t.importance === "high" ? "orange" : "accent",
      ),
    ),
  };
}
export async function loadData(q = {}, fetchJson = getJson) {
  if (bool(q.sampleData))
    return envelope(
      normalizeTasks(
        [
          {
            title: "Wochenplanung abschließen",
            importance: "high",
            status: "notStarted",
            dueDateTime: { dateTime: "2026-10-02T00:00:00" },
          },
          { title: "Zahnarzttermin vereinbaren", status: "notStarted" },
          { title: "Urlaubsfotos sortieren", status: "inProgress" },
        ],
        q,
      ),
      true,
      "Microsoft To Do",
    );
  const headers = auth(await oauthToken(q, "microsoft", fetchJson));
  let listId = text(q.listId),
    name = "";
  if (!listId) {
    const lists = await fetchJson(
      "https://graph.microsoft.com/v1.0/me/todo/lists?$top=100",
      { headers },
    );
    const l =
      array(lists.value).find((x) => x.wellknownListName === "defaultList") ||
      lists.value[0];
    if (!l) throw Error("No To Do list");
    listId = l.id;
    name = l.displayName;
  }
  let url = `https://graph.microsoft.com/v1.0/me/todo/lists/${id(listId)}/tasks?$top=100`;
  const tasks = [];
  for (let page = 0; url && page < 5; page++) {
    const d = await fetchJson(url, { headers });
    tasks.push(...array(d.value));
    url = d["@odata.nextLink"]
      ? nextUrl(
          d["@odata.nextLink"],
          "https://graph.microsoft.com",
          "/v1.0/me/todo/",
        )
      : "";
  }
  return envelope(
    { ...normalizeTasks(tasks, q), subtitle: name, partial: !!url },
    false,
    "Microsoft To Do",
  );
}
export default async function handler({ query }) {
  return loadData(query);
}
