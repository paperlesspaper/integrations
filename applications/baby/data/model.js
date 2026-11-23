// Civil-day arithmetic: dates remain dates across daylight-saving transitions.
export const DAY = 86400000;
export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const n = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === value ? n / DAY : null;
}
export function dateInZone(now = new Date(), timezone = 'Europe/Berlin') {
  const parts = new Intl.DateTimeFormat('en', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = key => parts.find(p => p.type === key).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function addMonths(day, months) {
  const date = new Date(day * DAY);
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months + 1, 0));
  return Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), Math.min(date.getUTCDate(), end.getUTCDate())) / DAY;
}
export function calendarAge(birth, today) {
  const b = new Date(birth * DAY), t = new Date(today * DAY);
  let months = (t.getUTCFullYear() - b.getUTCFullYear()) * 12 + t.getUTCMonth() - b.getUTCMonth();
  if (addMonths(birth, months) > today) months--;
  return { months, days: today - addMonths(birth, months), totalDays: today - birth };
}
export const defaults = { color: 'blue-light', childName: '', dueDate: '', birthDate: '', prematureWeeks: 0, imageStyle: 'illustrated', dailyContent: true, showIllustration: true, showAgeDetails: false, showMeasurements: true, showProgress: false, showDate: false, showSources: false, showNotes: false, showTip: true, textSize: 'middle', demo: false, demoStage: 'baby', demoPregnancyWeek: 24, referenceDate: '' };
// An editorial rotation, not a prediction of development on a particular day.
export function dailyCard(entry, elapsedDays, includeActivities = true) {
  const cards = (entry?.daily || []).filter(card => includeActivities || card.kind !== 'activity');
  return cards.length ? cards[((elapsedDays % cards.length) + cards.length) % cards.length] : null;
}
export function illustrationFor(entry, style) {
  return style === 'classic' ? (entry?.classicImage || 'classic-newborn') : (entry?.image || 'newborn');
}
export function getBabyState(settings, data, now = dateInZone()) {
  const s = { ...defaults, ...settings };
  const today = parseDate(s.referenceDate || now);
  if (today === null) return { error: 'invalidReference' };
  const demo = s.demo === true || s.demo === 'true';
  const includeActivities = s.showTip === true || s.showTip === 'true';
  let birth = s.birthDate ? parseDate(s.birthDate) : null;
  // Legacy birthdate was a due date; never silently treat it as a confirmed birth.
  const dueInput = s.dueDate || s.birthdate;
  let due = dueInput ? parseDate(dueInput) : null;
  if (demo) {
    const requestedWeek = Number(s.demoPregnancyWeek);
    const demoWeek = Number.isInteger(requestedWeek) && requestedWeek >= 0 && requestedWeek <= 41 ? requestedWeek : 24;
    birth = s.demoStage === 'pregnancy' ? null : addMonths(today, s.demoStage === 'toddler' ? -24 : -6);
    due = s.demoStage === 'pregnancy' ? today + 280 - demoWeek * 7 : null;
  } else {
    if (s.birthDate && birth === null) return { error: 'invalidBirth' };
    if (!s.birthDate && dueInput && due === null) return { error: 'invalidDue' };
  }
  if (birth !== null) {
    if (birth > today) return { error: 'futureBirth' };
    const age = calendarAge(birth, today);
    if (age.months >= 72) return { error: 'beyondRange', age };
    const weeks = Number(s.prematureWeeks);
    if (!Number.isInteger(weeks) || weeks < 0 || weeks > 20) return { error: 'invalidCorrection' };
    const corrected = weeks > 0 && age.months < 24;
    const developmentOrigin = birth + (corrected ? weeks * 7 : 0);
    const developmentalAge = calendarAge(Math.min(today, developmentOrigin), today);
    const entry = data.child.filter(e => e.month <= developmentalAge.months).at(-1);
    const illustration = data.childIllustrations?.filter(e => e.month <= developmentalAge.months).at(-1) || entry;
    const daily = dailyCard(entry, demo ? today : today - addMonths(developmentOrigin, entry.month), includeActivities);
    return { phase: 'child', entry, illustration, daily, age, developmentalAge, corrected, beforeDue: corrected && birth + weeks * 7 > today, demo, today, tipIndex: ((today % entry.tips.de.length) + entry.tips.de.length) % entry.tips.de.length };
  }
  if (due === null) return { error: 'setup' };
  const gestationalDays = today - due + 280;
  if (gestationalDays < 0) return { error: 'dueTooFar' };
  // A passed due date is not evidence of a birth; do not switch to child mode.
  if (gestationalDays >= 294) return { error: 'confirmBirth' };
  const week = Math.floor(gestationalDays / 7), day = gestationalDays % 7;
  const entry = data.pregnancy.filter(e => e.week <= week).at(-1) || null;
  const daily = dailyCard(entry, demo ? today : gestationalDays - (entry?.week || 0) * 7, includeActivities);
  return { phase: 'pregnancy', entry, illustration: entry, daily, week, day, remaining: due - today, progress: Math.min(1, gestationalDays / 280), demo, today };
}
