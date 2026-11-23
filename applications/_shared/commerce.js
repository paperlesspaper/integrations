import {
  number,
  text,
  clean,
  array,
  finite,
  tr,
  metric,
  row,
  dayInZone,
  localDayNumber,
  dateLabel,
} from "./connected-api.js";
// Resolve local midnight through the configured IANA zone, including DST transitions.
export function midnightUtc(day, zone) {
  const desired = localDayNumber(day) * 86400000;
  let t = desired;
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  for (let i = 0; i < 4; i++) {
    const p = Object.fromEntries(
      formatter.formatToParts(t).map((x) => [x.type, x.value]),
    );
    const represented = Date.UTC(
      +p.year,
      +p.month - 1,
      +p.day,
      +p.hour,
      +p.minute,
      +p.second,
    );
    const delta = desired - represented;
    t += delta;
    if (!delta) break;
  }
  return new Date(t).toISOString();
}
export function commerceRange(q, now = new Date()) {
  const zone = text(q.timeZone) || "Europe/Berlin";
  const days = Math.floor(number(q.days, 7, 1, 30));
  const today = dayInZone(now, zone);
  const startDay = new Date((localDayNumber(today) - days + 1) * 86400000)
    .toISOString()
    .slice(0, 10);
  return { start: midnightUtc(startDay, zone), end: now.toISOString(), days };
}
export function summarizeOrders(orders, q, range, partial = false) {
  const currency = (text(q.currency) || "EUR").toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw Error("Use an ISO currency code");
  const money = new Intl.NumberFormat(
    String(q.language).startsWith("de") ? "de-DE" : "en-GB",
    { style: "currency", currency },
  );
  const valid = array(orders).filter(
    (o) =>
      !o.cancelled &&
      !o.test &&
      Number.isFinite(Date.parse(o.createdAt)) &&
      Date.parse(o.createdAt) >= Date.parse(range.start) &&
      Date.parse(o.createdAt) <= Date.parse(range.end),
  );
  const paid = valid.filter(
    (o) => o.paid && o.currency === currency && finite(o.amount) !== null,
  );
  const missingAmounts = valid.some(
    (o) =>
      o.paid &&
      (!o.currency || (o.currency === currency && finite(o.amount) === null)),
  );
  const amount =
    Math.round(paid.reduce((sum, o) => sum + Math.max(0, o.amount), 0) * 100) /
    100;
  const pending = valid.filter((o) => o.unfulfilled);
  return {
    subtitle: `${dateLabel(range.start, q)} – ${dateLabel(range.end, q)}`,
    metrics: [
      metric(tr(q, "Bestellungen", "Orders"), valid.length),
      metric(
        tr(q, "Bezahlter Bestellwert", "Paid order value"),
        missingAmounts ? null : money.format(amount),
      ),
      metric(tr(q, "Versand offen¹", "To ship¹"), pending.length),
      metric(
        tr(q, "Ø bezahlt", "Paid average"),
        !missingAmounts && paid.length
          ? money.format(amount / paid.length)
          : null,
      ),
    ],
    rows: valid
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 100)
      .map((o) =>
        row(
          o.number,
          dateLabel(o.createdAt, q, true),
          o.unfulfilled
            ? tr(q, "Versand offen", "To ship")
            : o.paid
              ? tr(q, "Bezahlt", "Paid")
              : tr(q, "Unbezahlt", "Unpaid"),
          o.unfulfilled ? "orange" : "accent",
        ),
      ),
    total: valid.length,
    partial: partial || missingAmounts,
    note:
      tr(
        q,
        `¹Nur Bestellungen im Zeitraum. Bezahlter Wert inkl. Steuer/Versand, abzgl. Erstattungen; nur ${currency}. Keine Umsatzbuchhaltung.`,
        `¹Orders in period only. Paid value includes tax/shipping, less refunds; ${currency} only. Not accounting revenue.`,
      ) +
      (partial ? tr(q, " Abruflimit erreicht.", " Fetch limit reached.") : ""),
  };
}
export function demoOrders(q, range) {
  return Array.from({ length: 8 }, (_, i) => ({
    number: "#" + (1048 - i),
    createdAt: new Date(Date.parse(range.end) - i * 3600000).toISOString(),
    amount: [129, 89, 49, 159, 24, 69, 99, 39][i],
    currency: text(q.currency) || "EUR",
    paid: i !== 3,
    unfulfilled: i < 3,
    cancelled: false,
  }));
}
