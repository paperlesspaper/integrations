import {
  getJson,
  bool,
  required,
  array,
  finite,
  post,
  envelope,
} from "../../_shared/connected-api.js";
import {
  commerceRange,
  summarizeOrders,
  demoOrders,
} from "../../_shared/commerce.js";
export function shopDomain(value) {
  const host = required(value, "Shopify store")
    .replace(/^https:\/\//, "")
    .replace(/\/$/, "");
  if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(host))
    throw Error("Use your store.myshopify.com domain");
  return host.toLowerCase();
}
export function normalizeShopify(nodes) {
  return array(nodes).map((o) => ({
    number: o.name,
    createdAt: o.createdAt,
    amount: finite(o.netPaymentSet?.shopMoney?.amount),
    currency: o.netPaymentSet?.shopMoney?.currencyCode,
    paid: ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"].includes(
      o.displayFinancialStatus,
    ),
    unfulfilled:
      [
        "UNFULFILLED",
        "PARTIALLY_FULFILLED",
        "IN_PROGRESS",
        "SCHEDULED",
        "ON_HOLD",
      ].includes(o.displayFulfillmentStatus) &&
      ["PAID", "PARTIALLY_PAID", "PARTIALLY_REFUNDED"].includes(
        o.displayFinancialStatus,
      ),
    cancelled: !!o.cancelledAt,
    test: o.test === true,
  }));
}
export async function loadData(q = {}, fetchJson = getJson, now = new Date()) {
  const range = commerceRange(q, now);
  if (bool(q.sampleData))
    return envelope(
      summarizeOrders(demoOrders(q, range), q, range),
      true,
      "Shopify",
    );
  const endpoint = `https://${shopDomain(q.shopDomain)}/admin/api/2026-07/graphql.json`;
  const headers = {
    "X-Shopify-Access-Token": required(
      q.accessToken,
      "Shopify Admin API token",
    ),
  };
  const orders = [];
  let cursor = null,
    more = false;
  for (let page = 0; page < 5; page++) {
    const d = await post(
      endpoint,
      {
        query:
          "query($search:String!,$cursor:String){orders(first:100,after:$cursor,sortKey:CREATED_AT,reverse:true,query:$search){pageInfo{hasNextPage endCursor} nodes{name createdAt cancelledAt test displayFinancialStatus displayFulfillmentStatus netPaymentSet{shopMoney{amount currencyCode}}}}}",
        variables: {
          search: `created_at:>=${range.start} created_at:<=${range.end}`,
          cursor,
        },
      },
      headers,
      fetchJson,
    );
    if (d.errors?.length || !d.data?.orders)
      throw Error("Shopify orders unavailable");
    orders.push(...normalizeShopify(d.data.orders.nodes));
    more = d.data.orders.pageInfo?.hasNextPage === true;
    cursor = d.data.orders.pageInfo?.endCursor;
    if (!more) break;
    if (!cursor) throw Error("Missing Shopify cursor");
  }
  return envelope(summarizeOrders(orders, q, range, more), false, "Shopify");
}
export default async function handler({ query }) {
  return loadData(query);
}
