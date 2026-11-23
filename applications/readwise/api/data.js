import { bool, number, text, required, getJson, envelope, retrievedAt } from '../../_shared/dashboard-api.js';

export function selectHighlight(highlights, query, now = new Date()) {
  const timeZone = text(query.timeZone) || 'Europe/Berlin';
  // Calendar-day rotation follows the user's zone, including DST, rather than server UTC.
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(now);
  const p = Object.fromEntries(parts.map(p => [p.type, p.value]));
  const day = Math.floor(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day)) / 86400000);
  const offset = Math.floor(number(query.highlightIndex, 0, 0, 1000));
  const rotation = query.rotation === 'fixed' ? 0 : query.rotation === 'hourly' ? day * 24 + Number(p.hour) : day;
  if (!highlights.length) return { highlight: null, index: 0, total: 0 };
  const index = (rotation + offset) % highlights.length;
  return { highlight: highlights[index], index, total: highlights.length };
}
const demo = { highlights: [
  { text: 'Ein guter Gedanke wird wertvoller, wenn wir ihm im Alltag wieder begegnen. Nicht alles muss neu sein. Manchmal genügt es, sich an das Wesentliche zu erinnern.', title: 'Notizen über Aufmerksamkeit', author: 'Paperlesspaper · Demo', note: 'Jeden Tag einen Gedanken mitnehmen.' },
  { text: 'Kleine Schritte sind auch Schritte. Was wir regelmäßig tun, prägt unseren Alltag oft stärker als das, was wir uns gelegentlich vornehmen.', title: 'Über kleine Gewohnheiten', author: 'Paperlesspaper · Demo', note: 'Lieber anfangen als auf den perfekten Moment warten.' },
  { text: 'Reading gives us a place to pause. A sentence can stay with us long after we have closed the book.', title: 'A place to pause', author: 'Paperlesspaper · Demo', note: '' },
] };
export async function loadReadwise(query = {}, json = getJson, now = new Date()) {
  const sample = bool(query.sampleData);
  let data;
  if (sample) data = structuredClone(demo);
  else {
    const token = required(query.apiToken, 'Readwise access token');
    try {
      data = await json('https://readwise.io/api/v2/review/', { headers: { Authorization: `Token ${token}` }, ttl: 15 * 60 * 1000 });
    } catch (error) {
      if (error.message === 'Source returned HTTP 404') data = { highlights: [] };
      else throw error;
    }
  }
  if (!Array.isArray(data?.highlights)) throw new Error('Invalid Readwise review response');
  const highlights = data.highlights.filter(h => h && text(h.text) && !h.is_deleted && !h.is_discard).map(h => ({
    text: text(h.text).slice(0, 8191), title: text(h.title).slice(0, 511), author: text(h.author).slice(0, 1024),
    note: bool(query.showNote ?? true) ? text(h.note).slice(0, 8191) : '',
  }));
  return envelope(selectHighlight(highlights, query, now), sample, 'Readwise · Daily Review', retrievedAt(data));
}
export default async function handler({ query }) { return loadReadwise(query); }
