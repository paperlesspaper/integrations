const epoch = Date.UTC(2026, 8, 22);

// Use a German civil date, independent of the host's timezone and DST day length.
export function germanDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function selectSign(signs, signId = '', date = new Date()) {
  if (!signs.length) throw new Error('Der Schilderkatalog ist leer.');
  const day = germanDay(date);
  if (signId) {
    const sign = signs.find(item => item.id === String(signId));
    if (!sign) throw new Error(`Unbekanntes Verkehrszeichen: ${signId}`);
    return { sign, day, count: 1 };
  }
  const offset = Math.round((Date.parse(`${day}T00:00:00Z`) - epoch) / 86400000);
  const index = ((offset % signs.length) + signs.length) % signs.length;
  return { sign: signs[index], day, count: signs.length };
}
