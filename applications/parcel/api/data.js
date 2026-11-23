import { bool, number, text, required, getJson, envelope, retrievedAt } from '../../_shared/dashboard-api.js';

export function normalizeDelivery(d) {
  if (!d || typeof d !== 'object') throw new Error('Invalid Parcel delivery');
  const status = typeof d.status_code === 'number' && Number.isInteger(d.status_code) ? d.status_code : -1;
  const event = Array.isArray(d.events) ? d.events.find(e => e && typeof e === 'object') : null;
  const timestamp = v => typeof v === 'number' && v > 0 && Number.isFinite(new Date(v * 1000).getTime()) ? new Date(v * 1000).toISOString() : '';
  return {
    description: text(d.description).slice(0, 300), carrier: text(d.carrier_code).slice(0, 60),
    status: status >= 0 && status <= 8 ? status : -1,
    trackingNumber: text(d.tracking_number).slice(0, 150),
    expected: timestamp(d.timestamp_expected), expectedEnd: timestamp(d.timestamp_expected_end),
    // Provider strings have no timezone: retain them verbatim rather than inventing one.
    expectedLabel: text(d.date_expected).slice(0, 100), expectedEndLabel: text(d.date_expected_end).slice(0, 100),
    event: text(event?.event).slice(0, 500), location: text(event?.location).slice(0, 150),
    eventDate: text(event?.date).slice(0, 100),
  };
}
const demo = { success: true, deliveries: [
  { description: 'Bücher für den Herbst', carrier_code: 'DHL', status_code: 4, tracking_number: 'DEMO123456', date_expected: '28.09.2026', events: [{ event: 'Die Sendung wurde in das Zustellfahrzeug geladen.', date: '28.09.2026 08:14', location: 'Berlin' }] },
  { description: 'Neue Laufschuhe', carrier_code: 'DPD', status_code: 3, tracking_number: 'DEMO654321', events: [{ event: 'Zur Abholung im Paketshop bereit.', date: '27.09.2026 16:30', location: 'Paketshop an der Ecke' }] },
  { description: 'Kaffee aus der Rösterei', carrier_code: 'UPS', status_code: 2, tracking_number: 'DEMO987654', date_expected: '29.09.2026', events: [{ event: 'Im Paketzentrum angekommen.', date: '27.09.2026 20:05', location: 'Hamburg' }] },
  { description: 'Ersatzteil für das Fahrrad', carrier_code: 'GLS', status_code: 7, events: [{ event: 'Bitte Lieferadresse beim Versanddienst prüfen.', date: '27.09.2026' }] },
] };
export async function loadParcels(query = {}, json = getJson) {
  const sample = bool(query.sampleData);
  const mode = query.filterMode === 'recent' ? 'recent' : 'active';
  const data = sample ? structuredClone(demo) : await json(`https://api.parcel.app/external/deliveries/?filter_mode=${mode}`, {
    headers: { 'api-key': required(query.apiKey, 'Parcel API key') }, ttl: 10 * 60 * 1000,
  });
  if (data?.success !== true || !Array.isArray(data.deliveries)) throw new Error('Parcel could not return deliveries; check API access');
  const deliveries = data.deliveries.map(normalizeDelivery).filter(d => mode === 'recent' || d.status !== 0);
  // Actionable deliveries first; stable ordering within each status.
  const priority = [7, 6, 3, 4, 2, 8, 5, 1, -1, 0];
  deliveries.sort((a, b) => priority.indexOf(a.status) - priority.indexOf(b.status));
  if (!bool(query.showTrackingNumber)) deliveries.forEach(d => { d.trackingNumber = ''; });
  return envelope({ deliveries: deliveries.slice(0, Math.floor(number(query.limit, 4, 1, 8))), total: deliveries.length }, sample, 'Parcel', retrievedAt(data));
}
export default async function handler({ query }) { return loadParcels(query); }
