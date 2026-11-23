import { createHash } from "node:crypto";
import {
  getJson,
  bool,
  required,
  text,
  array,
  row,
  metric,
  tr,
  envelope,
  id,
} from "../../_shared/connected-api.js";
const sessions = new Map();
const ROOT = "https://api.getbring.com/rest/v2/";
export function shoppingCategory(name, q) {
  const value = String(name).toLowerCase();
  if (
    /tomat|apfel|äpfel|apple|banan|salat|lettuce|carrot|karott|gurk|cucumber|onion|zwiebel|kartoff|potato|pear|birne|obst|gemüse/.test(
      value,
    )
  )
    return {
      icon: "leaf",
      label: tr(q, "Obst & Gemüse", "Fruit & vegetables"),
      order: 0,
    };
  if (/brot|bread|bröt|toast|croissant|baguette/.test(value))
    return { icon: "bread", label: tr(q, "Backwaren", "Bakery"), order: 1 };
  if (/milch|milk|käse|cheese|joghurt|yogurt|butter|quark/.test(value))
    return {
      icon: "bottle",
      label: tr(q, "Kühlregal & Alternativen", "Chilled & alternatives"),
      order: 2,
    };
  if (/kaffee|coffee|tee|tea|kakao/.test(value))
    return {
      icon: "cup",
      label: tr(q, "Kaffee & Tee", "Coffee & tea"),
      order: 3,
    };
  if (/wasser|water|saft|juice|bier|beer|wein|wine/.test(value))
    return { icon: "bottle", label: tr(q, "Getränke", "Drinks"), order: 4 };
  return {
    icon: "cart",
    label: tr(q, "Weitere Artikel", "Other items"),
    order: 5,
  };
}
export function normalizeShopping(data, q, translations = {}) {
  const items = array(data.purchase);
  return {
    subtitle: text(data.name),
    total: items.length,
    metrics: [metric(tr(q, "Noch einkaufen", "To buy"), items.length)],
    rows: items
      .slice(0, 100)
      .map((x) => {
        const name = translations[x.name] || x.name,
          category = shoppingCategory(name, q);
        return {
          ...row(
            name,
            [category.label, x.specification].filter(Boolean).join(" · "),
            "□",
          ),
          icon: category.icon,
          categoryOrder: category.order,
        };
      })
      .sort((a, b) => a.categoryOrder - b.categoryOrder),
    note: tr(
      q,
      "Kategorien automatisch vorgeschlagen · erledigte Artikel ausgeblendet",
      "Suggested categories · completed items hidden",
    ),
  };
}
export async function loadData(q = {}, fetchJson = getJson) {
  if (bool(q.sampleData))
    return envelope(
      normalizeShopping(
        {
          name: "Wochenmarkt",
          purchase: [
            { name: "Tomaten", specification: "500 g · Bio" },
            { name: "Hafermilch", specification: "2 Packungen" },
            { name: "Sauerteigbrot", specification: "1 Laib" },
            { name: "Äpfel", specification: "1 kg" },
            { name: "Kaffee", specification: "Ganze Bohnen" },
          ],
        },
        q,
      ),
      true,
      "Bring!",
    );
  const email = required(q.email, "Bring! email"),
    password = required(q.password, "Bring! password");
  const key = createHash("sha256")
    .update(email + "\0" + password)
    .digest("hex");
  let session = sessions.get(key);
  if (!session || session.until < Date.now()) {
    const d = await fetchJson(ROOT + "bringauth", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email, password }).toString(),
    });
    session = {
      uuid: required(d.uuid, "Bring! user ID"),
      token: required(d.access_token, "Bring! access token"),
      until: Date.now() + 300000,
    };
    if (sessions.size >= 32) sessions.delete(sessions.keys().next().value);
    sessions.set(key, session);
  }
  const headers = {
    "X-BRING-CLIENT": "webApp",
    "X-BRING-CLIENT-SOURCE": "webApp",
    "X-BRING-COUNTRY": "DE",
    "X-BRING-API-KEY": "cof4Nc6D8saplXjE3h3HXqHH8m7VU2i1Gs0g85Sp",
    "X-BRING-USER-UUID": session.uuid,
    Authorization: `Bearer ${session.token}`,
  };
  try {
    const lists = await fetchJson(
      ROOT + `bringusers/${id(session.uuid)}/lists`,
      { headers },
    );
    const selected = array(lists.lists).find(
      (l) => !text(q.listId) || l.listUuid === q.listId,
    );
    if (!selected) throw Error("Shopping list not found");
    const data = await fetchJson(ROOT + `bringlists/${id(selected.listUuid)}`, {
      headers,
    });
    return envelope(
      normalizeShopping({ ...data, name: selected.name }, q),
      false,
      "Bring!",
    );
  } catch (e) {
    sessions.delete(key);
    throw e;
  }
}
export default async function handler({ query }) {
  return loadData(query);
}
