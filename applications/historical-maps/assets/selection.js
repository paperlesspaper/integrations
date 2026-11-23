export const defaults = Object.freeze({
  color: 'blue-light', mapId: '', view: 'detail', timeZone: 'Europe/Berlin',
  dayOffset: 0, showDescription: false,
});

export function selectMap(maps, settings, now = new Date()) {
  if (!Array.isArray(maps) || !maps.length) throw new Error('catalogFailed');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: settings.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = name => parts.find(p => p.type === name).value;
  const day = `${part('year')}-${part('month')}-${part('day')}`;
  const offset = Number(settings.dayOffset);
  if (!Number.isInteger(offset) || Math.abs(offset) > 3650) throw new Error('invalidOffset');
  if (!['detail', 'complete'].includes(settings.view)) throw new Error('invalidView');
  const pinned = String(settings.mapId || '');
  if (pinned) {
    const map = maps.find(entry => entry.id === pinned);
    if (!map) throw new Error('unknownMap');
    return { map, index: maps.indexOf(map), day };
  }
  // Calendar-day arithmetic (rather than elapsed local hours) also works across DST.
  const dayNumber = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86400000) + offset;
  const index = ((dayNumber % maps.length) + maps.length) % maps.length;
  return { map: maps[index], index, day };
}
