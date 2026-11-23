import {
  getJson,
  bool,
  text,
  required,
  array,
  id,
  row,
  tr,
  envelope,
  dateLabel,
} from "../../_shared/connected-api.js";
export function normalizeBoard(lists, cards, q) {
  const requested = text(q.listIds)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  const selected = array(lists)
    .filter((x) => !x.closed && (!requested.length || requested.includes(x.id)))
    .slice(0, 3);
  const columns = selected.map((l) => {
    const entries = array(cards)
      .filter((c) => !c.closed && c.idList === l.id)
      .sort((a, b) => a.pos - b.pos);
    return {
      title: l.name,
      total: entries.length,
      rows: entries.map((c) =>
        row(
          c.name,
          (c.labels || [])
            .map((l) => l.name)
            .filter(Boolean)
            .join(" · "),
          c.due ? dateLabel(c.due, q) : "",
          c.due && !c.dueComplete && Date.parse(c.due) < Date.now()
            ? "red"
            : "accent",
        ),
      ),
    };
  });
  return {
    columns,
    note: tr(
      q,
      "Bis zu drei ausgewählte Listen · Karten in Board-Reihenfolge",
      "Up to three selected lists · cards in board order",
    ),
  };
}
export async function loadData(q = {}, fetchJson = getJson) {
  if (bool(q.sampleData))
    return envelope(
      normalizeBoard(
        [
          { id: "1", name: tr(q, "Offen", "To do") },
          { id: "2", name: tr(q, "In Arbeit", "Doing") },
          { id: "3", name: tr(q, "Erledigt", "Done") },
        ],
        [
          { idList: "1", name: "Fotos auswählen", pos: 1 },
          { idList: "1", name: "Versand testen", pos: 2 },
          { idList: "2", name: "Neue Kollektion", pos: 1 },
          { idList: "3", name: "Design freigegeben", pos: 1 },
        ],
        q,
      ),
      true,
      "Trello",
    );
  const key = required(q.apiKey, "Trello API key"),
    token = required(q.token, "Trello token");
  const headers = {
    Authorization: `OAuth oauth_consumer_key="${encodeURIComponent(key)}", oauth_token="${encodeURIComponent(token)}"`,
  };
  const root = `https://api.trello.com/1/boards/${id(q.boardId, "Board ID")}`;
  const [board, lists, cards] = await Promise.all([
    fetchJson(root + "?fields=name", { headers }),
    fetchJson(root + "/lists?filter=open&fields=name,pos,closed", { headers }),
    fetchJson(
      root +
        "/cards?filter=open&fields=name,idList,pos,due,dueComplete,labels,closed",
      { headers },
    ),
  ]);
  return envelope(
    { ...normalizeBoard(lists, cards, q), subtitle: board.name },
    false,
    "Trello",
  );
}
export default async function handler({ query }) {
  return loadData(query);
}
