import { readFile } from "node:fs/promises";
import {
  bool,
  number,
  language,
  envelope,
} from "../../_shared/dashboard-api.js";
const produce = JSON.parse(
  await readFile(new URL("../assets/produce.json", import.meta.url), "utf8"),
);
export function seasonalItems(month, includeStorage, category = "all") {
  return produce
    .filter((p) => category === "all" || p.category === category)
    .filter(
      (p) =>
        p.harvest.includes(month) ||
        (includeStorage && p.storage.includes(month)),
    )
    .map((p) => ({
      ...p,
      kind: p.harvest.includes(month) ? "harvest" : "storage",
    }));
}
export default async function handler({ query }) {
  const current = Number(
    new Intl.DateTimeFormat("en", {
      month: "numeric",
      timeZone: "Europe/Berlin",
    }).format(new Date()),
  );
  const month = Math.trunc(number(query.month, 0, 0, 12)) || current;
  const category = ["fruit", "vegetable"].includes(query.category)
    ? query.category
    : "all";
  const items = seasonalItems(month, bool(query.includeStorage), category);
  const next = seasonalItems((month % 12) + 1, false, category).filter(
    (p) => !p.harvest.includes(month),
  );
  return envelope(
    {
      month,
      items: items.map((p) => ({
        name: p[language(query)],
        category: p.category,
        kind: p.kind,
      })),
      next: next.map((p) => p[language(query)]),
    },
    false,
    "Deutschland · BZfE / BZL",
  );
}
