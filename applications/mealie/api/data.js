import {
  bool,
  baseUrl,
  required,
  text,
  getJson,
  language,
} from "../../_shared/dashboard-api.js";
import {
  normalizeCalendarRange,
  dateKey,
  addLocalDays,
} from "../../_shared/calendar-feed.js";
export default async function handler({ query }) {
  const range = normalizeCalendarRange({
    ...query,
    defaultDays: 7,
    maxDays: 370,
  });
  const sample = bool(query.sampleData),
    de = language(query) === "de";
  if (sample) {
    const dishes = de
      ? [
          "Pasta mit Tomaten",
          "Ofengemüse",
          "Kürbissuppe",
          "Gemüse-Curry",
          "Pizza Margherita",
          "Pilzrisotto",
          "Kartoffelgratin",
        ]
      : [
          "Tomato pasta",
          "Roasted vegetables",
          "Pumpkin soup",
          "Vegetable curry",
          "Pizza Margherita",
          "Mushroom risotto",
          "Potato gratin",
        ];
    return {
      sample: true,
      source: "Mealie",
      events: dishes.map((title, i) => ({
        id: `demo-${i}`,
        title,
        start: {
          date: dateKey(
            addLocalDays(range.from, i, range.timeZone),
            range.timeZone,
          ),
        },
        location: de ? "Abendessen" : "Dinner",
      })),
    };
  }
  const base = baseUrl(query.baseUrl),
    token = required(query.token, "Mealie API token");
  const params = new URLSearchParams({
    start_date: range.rangeStart,
    end_date: dateKey(
      addLocalDays(range.to, -1, range.timeZone),
      range.timeZone,
    ),
    perPage: "100",
    orderBy: "date",
    orderDirection: "asc",
  });
  const items = [];
  for (let page = 1; page <= 20; page++) {
    params.set("page", String(page));
    const raw = await getJson(`${base}/api/households/mealplans?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!Array.isArray(raw.items))
      throw new Error("Invalid Mealie meal-plan response");
    items.push(...raw.items);
    if (!raw.next) break;
    if (page === 20)
      throw new Error("Meal plan exceeds 2000 entries; choose a shorter range");
  }
  const types = de
    ? {
        breakfast: "Frühstück",
        lunch: "Mittagessen",
        dinner: "Abendessen",
        side: "Beilage",
      }
    : {};
  return {
    sample: false,
    source: "Mealie",
    events: items
      .filter(
        (i) => i.date >= range.rangeStart && i.date < range.rangeEndExclusive,
      )
      .map((i) => ({
        id: String(i.id),
        title:
          text(i.title) || text(i.recipe?.name) || (de ? "Mahlzeit" : "Meal"),
        start: { date: i.date },
        location: types[i.entryType] || text(i.entryType),
      })),
  };
}
