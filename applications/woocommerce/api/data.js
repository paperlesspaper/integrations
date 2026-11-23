import { baseUrl } from "../../_shared/dashboard-api.js";
import {
  getJson,
  bool,
  required,
  array,
  finite,
  queryUrl,
  envelope,
} from "../../_shared/connected-api.js";
import {
  commerceRange,
  summarizeOrders,
  demoOrders,
} from "../../_shared/commerce.js";
export function normalizeWoo(d) {
  return array(d).map((o) => ({
    number: "#" + (o.number || o.id),
    createdAt: o.date_created_gmt
      ? o.date_created_gmt.replace(/Z$/, "") + "Z"
      : "",
    currency: o.currency,
    amount:
      finite(o.total) === null
        ? null
        : Math.max(
            0,
            Number(o.total) -
              array(o.refunds || []).reduce(
                (s, r) => s + Math.abs(finite(r.total) || 0),
                0,
              ),
          ),
    paid: ["processing", "completed", "refunded"].includes(o.status),
    unfulfilled: o.status === "processing",
    cancelled: ["cancelled", "failed", "trash"].includes(o.status),
    test: false,
  }));
}
export async function loadData(q = {}, fetchJson = getJson, now = new Date()) {
  const range = commerceRange(q, now);
  if (bool(q.sampleData))
    return envelope(
      summarizeOrders(demoOrders(q, range), q, range),
      true,
      "WooCommerce",
    );
  const root = baseUrl(q.storeUrl),
    key = required(q.consumerKey, "WooCommerce consumer key"),
    secret = required(q.consumerSecret, "WooCommerce consumer secret");
  const headers = {
    Authorization:
      "Basic " + Buffer.from(key + ":" + secret).toString("base64"),
  };
  const orders = [];
  let more = false;
  for (let page = 1; page <= 5; page++) {
    const d = await fetchJson(
      queryUrl(root + "/wp-json/wc/v3/orders", {
        after: range.start,
        before: range.end,
        dates_are_gmt: true,
        per_page: 100,
        page,
        orderby: "date",
        order: "desc",
        _fields: "id,number,status,date_created_gmt,currency,total,refunds",
      }),
      { headers },
    );
    orders.push(...normalizeWoo(d));
    more = d.length === 100;
    if (!more) break;
  }
  return envelope(
    summarizeOrders(orders, q, range, more),
    false,
    "WooCommerce",
  );
}
export default async function handler({ query }) {
  return loadData(query);
}
