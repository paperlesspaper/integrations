import { baseUrl, getJson, bool, text, envelope } from '../lib/http.js';

const tr = (q, de, en) => String(q.language || 'de').startsWith('de') ? de : en;
const clean = (v, max = 120) => String(v ?? '').replace(/<[^>]*>/g, '').trim().slice(0, max);
const finite = (v) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : null;
const metric = (label, value, tone = 'accent', unit = '') => ({ label, value, tone, unit });
const state = (item) => item.quantity === null ? 'unknown' : item.quantity <= 0 ? 'empty' : item.minimumStock > 0 && item.quantity <= item.minimumStock ? 'low' : 'ok';

export function inventoryApiUrl(value) {
  try {
    const root = baseUrl(value);
    return /\/api\/v1$/.test(root) ? root : `${root}/api/v1`;
  } catch {
    throw new Error('Enter an Open Inventory HTTP(S) URL without credentials, query or fragment.');
  }
}

export function parseStock(payload) {
  if (!Array.isArray(payload?.items) || payload.items.length > 5000) {
    throw new Error('Invalid or oversized Open Inventory stock response.');
  }
  const ids = new Set();
  return payload.items.map((item) => {
    if (!item || typeof item.resourceId !== 'string' || !item.resourceId || ids.has(item.resourceId) || typeof item.name !== 'string') {
      throw new Error('Invalid Open Inventory stock item.');
    }
    ids.add(item.resourceId);
    return {
      resourceId: item.resourceId,
      name: clean(item.name),
      sku: clean(item.sku, 60),
      quantity: finite(item.quantity),
      minimumStock: finite(item.minimumStock),
      onOrder: finite(item.onOrder),
      unitName: clean(item.unitName, 20),
    };
  });
}

const sample = { items: [
  { resourceId: 'demo-oak', name: 'Rahmen Eiche / Oak frames', sku: 'FRAME-OAK', quantity: 8, minimumStock: 12, onOrder: 24, unitName: 'Stk.' },
  { resourceId: 'demo-board', name: 'OpenPaper Platine / PCB', sku: 'PCB-13', quantity: 0, minimumStock: 10, onOrder: 50, unitName: 'Stk.' },
  { resourceId: 'demo-white', name: 'Rahmen Weiß / White frames', sku: 'FRAME-WHITE', quantity: 36, minimumStock: 12, onOrder: 0, unitName: 'Stk.' },
  { resourceId: 'demo-screws', name: 'Montageschrauben / Assembly screws', sku: 'SCREW-M3', quantity: 240, minimumStock: 100, onOrder: 0, unitName: 'Stk.' },
  { resourceId: 'demo-cable', name: 'USB-C Kabel / USB-C cables', sku: 'USB-C', quantity: 18, minimumStock: 20, onOrder: 0, unitName: 'Stk.' },
  { resourceId: 'demo-box', name: 'Versandkarton / Shipping box', sku: 'BOX-13', quantity: 72, minimumStock: 25, onOrder: 0, unitName: 'Stk.' },
] };

export async function fetchInventory(q = {}, fetchJson = getJson) {
  if (bool(q.sampleData)) return parseStock(sample);
  const url = inventoryApiUrl(q.baseUrl);
  const apiKey = text(q.apiKey);
  if (!apiKey || /[\r\n]/.test(apiKey) || apiKey.length > 4096) {
    throw new Error(tr(q, 'Bitte einen gültigen Open-Inventory-API-Key eingeben.', 'Enter a valid Open Inventory API key.'));
  }
  try {
    const payload = await fetchJson(`${url}/stock`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      maxBytes: 2 * 1024 * 1024,
    });
    return parseStock(payload);
  } catch (error) {
    const status = String(error?.message).match(/^Source returned HTTP (\d{3})$/)?.[1];
    if (status === '401' || status === '403') throw new Error(tr(q, 'Zugriff verweigert. API-Key und Leserechte für Bestand prüfen.', 'Access denied. Check API key and stock read permissions.'));
    if (status === '404') throw new Error(tr(q, 'Stock-API nicht gefunden. URL der Open-Inventory-Instanz prüfen.', 'Stock API not found. Check the Open Inventory instance URL.'));
    // Never expose provider response bodies, URLs, credentials or arbitrary transport errors.
    throw new Error(tr(q, 'Open Inventory konnte nicht geladen werden. URL, Erreichbarkeit und API-Antwort prüfen.', 'Could not load Open Inventory. Check URL, connectivity and API response.'));
  }
}

export function normalizeStock(items, q = {}) {
  const selectedId = text(q.resourceId);
  const selected = selectedId ? items.find((item) => item.resourceId === selectedId) : null;
  if (selectedId && !selected) throw new Error(tr(q, 'Der ausgewählte Artikel wird nicht mehr im Bestand geführt. Bitte neu auswählen.', 'The selected item is no longer stock-tracked. Select it again.'));
  const search = text(q.search).toLocaleLowerCase();
  const scope = selected ? [selected] : items.filter((item) => `${item.name} ${item.sku}`.toLocaleLowerCase().includes(search));
  const nf = new Intl.NumberFormat(tr(q, 'de-DE', 'en-GB'), { maximumFractionDigits: 2 });
  const format = (v) => v === null ? '—' : nf.format(v);
  const labels = { unknown: tr(q, 'Unbekannt', 'Unknown'), empty: tr(q, 'Leer', 'Empty'), low: tr(q, 'Knapp', 'Low'), ok: tr(q, 'OK', 'OK') };
  const filtered = q.view === 'low-stock' ? scope.filter((item) => ['empty', 'low'].includes(state(item))) : scope;
  const ordered = [...filtered].sort((a, b) => {
    const rank = { empty: 0, low: 1, unknown: 2, ok: 3 };
    return rank[state(a)] - rank[state(b)] || a.name.localeCompare(b.name, tr(q, 'de', 'en'));
  });
  const limit = Number.isFinite(Number(q.maxItems)) ? Math.max(1, Math.min(50, Math.trunc(Number(q.maxItems)))) : 12;
  const metrics = selected ? [
    metric(tr(q, 'Bestand', 'On hand'), selected.quantity, state(selected) === 'ok' ? 'green' : state(selected) === 'unknown' ? 'accent' : 'red', selected.unitName),
    metric(tr(q, 'Mindestbestand', 'Minimum stock'), selected.minimumStock),
    metric(tr(q, 'Bestellt', 'On order'), selected.onOrder, 'blue'),
  ] : [
    metric(tr(q, 'Artikel', 'Items'), scope.length),
    metric(tr(q, 'Knapp', 'Low'), scope.filter((item) => state(item) === 'low').length, 'orange'),
    metric(tr(q, 'Leer', 'Empty'), scope.filter((item) => state(item) === 'empty').length, 'red'),
    metric(tr(q, 'Im Zulauf', 'Incoming'), scope.filter((item) => item.onOrder > 0).length, 'blue'),
  ];
  return {
    subtitle: selected?.name || (q.view === 'low-stock' ? tr(q, 'Nachfüllen & nachbestellen', 'Refill & reorder') : tr(q, 'Material & Bestände', 'Materials & stock')),
    metrics,
    total: ordered.length,
    rows: ordered.slice(0, limit).map((item) => ({
      title: item.name,
      detail: [item.sku, `${tr(q, 'Min.', 'Min.')} ${format(item.minimumStock)}`, `${tr(q, 'Bestellt', 'On order')} ${format(item.onOrder)}`].filter(Boolean).join(' · '),
      badge: `${format(item.quantity)} ${item.unitName} · ${labels[state(item)]}`.trim(),
      tone: state(item) === 'empty' ? 'red' : state(item) === 'low' ? 'orange' : state(item) === 'ok' ? 'green' : 'accent',
    })),
    note: !ordered.length
      ? tr(q, 'Keine passenden Bestandsartikel.', 'No matching stock items.')
      : tr(q, 'Gebuchter Bestand · Reservierungen sind nicht abgezogen.', 'Recorded stock · Reservations are not deducted.'),
  };
}

export async function loadData(q = {}, fetchJson = getJson) {
  return envelope(normalizeStock(await fetchInventory(q, fetchJson), q), bool(q.sampleData), 'Open Inventory');
}

export default async function handler({ query, request }) {
  if (request?.method !== 'POST') throw new Error('Use a JSON POST request.');
  return loadData(query);
}
