import {
  getJson,
  bool,
  text,
  array,
  clean,
  auth,
  id,
  post,
  row,
  tr,
  envelope,
  metric,
} from "../../_shared/connected-api.js";
export function notionText(p) {
  if (!p) return "";
  if (["title", "rich_text"].includes(p.type))
    return (p[p.type] || [])
      .map((x) => x.plain_text || x.text?.content || "")
      .join("");
  if (["status", "select"].includes(p.type)) return p[p.type]?.name || "";
  if (p.type === "date") return p.date?.start || "";
  if (p.type === "checkbox") return p.checkbox ? "✓" : "□";
  if (p.type === "number") return p.number === null ? "" : String(p.number);
  if (p.type === "multi_select")
    return (p.multi_select || []).map((x) => x.name).join(", ");
  if (p.type === "people")
    return (p.people || []).map((x) => x.name).join(", ");
  return "";
}
export function normalizeNotion(pages, q) {
  const rows = array(pages)
    .filter((p) => !p.archived && !p.in_trash)
    .map((p) => {
      const props = p.properties || {};
      const title =
        notionText(Object.values(props).find((v) => v.type === "title")) ||
        tr(q, "Ohne Titel", "Untitled");
      const detail = text(q.detailProperty)
        ? notionText(props[q.detailProperty])
        : "";
      const badge = text(q.statusProperty)
        ? notionText(props[q.statusProperty])
        : "";
      return row(title, detail, badge);
    });
  return {
    total: rows.length,
    rows,
    metrics: [metric(tr(q, "Einträge", "Entries"), rows.length)],
  };
}
export async function loadData(q = {}, fetchJson = getJson) {
  if (bool(q.sampleData))
    return envelope(
      {
        metrics: [metric(tr(q, "Einträge", "Entries"), 4)],
        rows: [
          row("Herbstkollektion", "Launch · 12.10.", "In Arbeit"),
          row("Fototermin", "Studio · Dienstag", "Geplant"),
          row("Versandmaterial", "Nachhaltige Verpackung", "Review"),
          row("Newsletter", "Ausgabe Oktober", "Entwurf"),
        ],
      },
      true,
      "Notion",
    );
  const headers = { ...auth(q.token), "Notion-Version": "2026-03-11" };
  const pages = [];
  let cursor;
  let more = false;
  let filter;
  if (text(q.filterJson)) {
    filter = JSON.parse(q.filterJson);
    if (!filter || typeof filter !== "object" || Array.isArray(filter))
      throw Error("Invalid Notion filter");
  }
  for (let page = 0; page < 5; page++) {
    const d = await post(
      `https://api.notion.com/v1/data_sources/${id(q.dataSourceId, "Notion data source ID")}/query`,
      {
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
        ...(filter ? { filter } : {}),
      },
      headers,
      fetchJson,
    );
    pages.push(...array(d.results));
    more = d.has_more === true;
    cursor = d.next_cursor;
    if (!more) break;
    if (!cursor) throw Error("Missing Notion cursor");
  }
  return envelope(
    {
      ...normalizeNotion(pages, q),
      partial: more,
      note: more
        ? tr(
            q,
            "Auf die ersten 500 Einträge begrenzt",
            "Limited to the first 500 entries",
          )
        : "",
    },
    false,
    "Notion",
  );
}
export default async function handler({ query }) {
  return loadData(query);
}
