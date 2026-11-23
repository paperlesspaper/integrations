import { defaults, getBabyState, dateInZone, illustrationFor } from '../data/model.js';
const { waitForPayload, getSettings, getQuerySettings, mergeSettings, loadLanguageJson, applyColorTheme, markLoading, markReady, markError, escapeHtml, fitText } = window.PaperlessOpenIntegration;
const app = document.querySelector('#app');
const e = escapeHtml;
let revision = 0;
let dataPromise;
const correctionUrl = 'https://www.healthychildren.org/English/ages-stages/baby/preemie/Pages/Corrected-Age-For-Preemies.aspx';
function data() {
  if (!dataPromise) dataPromise = fetch('./data/development.json').then(r => { if (!r.ok) throw new Error('Data unavailable'); return r.json(); }).catch(error => { dataPromise = undefined; throw error; });
  return dataPromise;
}
function isOn(value) { return value === true || value === 'true'; }
function fill(template, values = {}) { return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? '')); }
function ageLabel(age, t) {
  if (age.months === 0) return age.totalDays === 1 ? t.ageDay : fill(t.ageDays, { n: age.totalDays });
  if (age.months < 24) return age.months === 1 ? t.ageMonth : fill(t.ageMonths, { n: age.months });
  if (age.months % 12) return fill(t.andMonths, { years: Math.floor(age.months / 12), months: age.months % 12 });
  return fill(t.ageYears, { n: age.months / 12 });
}
async function settleImages(container) {
  await Promise.all([...container.querySelectorAll('img')].map(async img => {
    try {
      await Promise.race([img.decode(), new Promise((_, reject) => setTimeout(() => reject(new Error('Image timeout')), 8000))]);
    } catch {
      const fallback = document.createElement('span');
      fallback.className = 'image-fallback'; fallback.textContent = img.dataset.fallback;
      img.replaceWith(fallback);
    }
  }));
}
async function renderPayload(payload) {
  const current = ++revision;
  markLoading();
  let t;
  try {
    const localized = await loadLanguageJson(payload, { supported: ['de', 'en'], defaultLanguage: 'de' });
    if (current !== revision) return;
    t = localized.messages;
    const lang = localized.language;
    const s = mergeSettings(defaults, getSettings(payload), getQuerySettings());
    applyColorTheme(s.color, { defaultTheme: defaults.color });
    const records = await data();
    if (current !== revision) return;
    const state = getBabyState(s, records);
    document.documentElement.lang = lang;
    app.dataset.textSize = ['small', 'big'].includes(s.textSize) ? s.textSize : 'middle';
    app.dataset.phase = state.phase || state.error;
    app.dataset.entry = state.entry?.id || '';
    const daily = isOn(s.dailyContent) ? state.daily : null;
    app.dataset.daily = daily?.id || '';
    app.dataset.imageStyle = s.imageStyle === 'classic' ? 'classic' : 'illustrated';
    const date = s.referenceDate || dateInZone();
    const dateLabel = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date)) ? new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)) : '';
    const badge = (s.demo === true || s.demo === 'true') ? t.demo : s.referenceDate ? t.preview : '';
    const showDate = isOn(s.showDate) || Boolean(s.referenceDate);
    const header = badge || showDate ? `<header class="header">${badge ? `<span class="badge">${e(badge)}</span>` : ''}${showDate ? `<time>${e(dateLabel)}</time>` : ''}</header>` : '';
    app.dataset.illustration = String(isOn(s.showIllustration));
    app.dataset.notes = String(isOn(s.showNotes));
    if (state.error) {
      app.innerHTML = `${header}<section class="message">${isOn(s.showIllustration) ? `<img src="./assets/${illustrationFor(null, s.imageStyle)}.png" alt="" data-fallback="${e(t.imageError)}">` : ''}<div><h1>${e(t.emptyTitle)}</h1><p>${e(t[state.error])}</p></div></section>`;
    } else {
      const child = state.phase === 'child';
      const item = state.entry;
      const name = String(s.childName || '').slice(0, 40);
      const age = child ? ageLabel(state.age, t) : fill(t.week, state);
      let detail = child ? t.born : fill(t.weekDetail, { n: state.week + 1, trimester: state.week < 13 ? 1 : state.week < 28 ? 2 : 3 });
      if (child && state.corrected) detail = `${state.beforeDue ? t.beforeDue : fill(t.corrected, { n: state.developmentalAge.months })}`;
      else if (child && state.age.months > 0 && state.age.days > 0) detail += ` · ${fill(t.ageExtra, { n: state.age.days })}`;
      const illustration = isOn(s.showIllustration) ? `<figure class="art"><img src="./assets/${illustrationFor(state.illustration, s.imageStyle)}.png" alt="${e(t.illustration)}" data-fallback="${e(t.imageError)}"></figure>` : '';
      const hero = `<section class="hero"><div class="hero-copy"><p class="eyebrow name">${e(name || (child ? t.child : t.pregnancy))}</p><p class="age">${e(age)}</p>${isOn(s.showAgeDetails) || state.corrected ? `<p class="age-detail">${e(detail)}</p>` : ''}</div>${illustration}</section>`;
      let body, reference, tip, note;
      if (child) {
        reference = item.month ? fill(t.reference, { n: item.month }) : t.newbornReference;
        body = daily ? `<p class="description">${e(daily.text[lang])}</p>` : `<div class="facts">${item.facts.map(f => `<section class="fact"><h2>${e(t[f.domain])}</h2><p>${e(f[lang])}</p></section>`).join('')}</div>`;
        tip = item.tips[lang][state.tipIndex];
        note = `${item.month ? t.milestoneNote + ' ' : ''}${t.developmentNote}`;
      } else {
        reference = state.remaining > 0 ? fill(t.remaining, { n: state.remaining }) : state.remaining === 0 ? t.dueToday : fill(t.afterDue, { n: -state.remaining });
        body = `<p class="description">${e(daily?.text[lang] || item?.text[lang] || t.earlyText)}</p>`;
        if (isOn(s.showMeasurements) && item?.sizeCm) body += `<div class="measurement"><strong>${e(fill(t.size, { n: new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(item.sizeCm) }))}</strong><span>${e(t[item.measurement])}${state.week === 20 ? `<br>${e(t.measurementChange)}` : ''}</span></div>`;
        if (isOn(s.showProgress)) body += `<div class="progress" role="progressbar" aria-label="${e(t.pregnancy)}" aria-valuemin="0" aria-valuemax="280" aria-valuenow="${Math.round(state.progress * 280)}"><span style="width:${state.progress * 100}%"></span></div>`;
        tip = item?.tip[lang] || t.earlyTip;
        note = state.week >= 20 ? t.movementNote : t.pregnancyNote;
      }
      const source = item?.source || { title: 'NHS', url: 'https://www.nhs.uk/best-start-in-life/pregnancy/week-by-week-guide-to-pregnancy/1st-trimester/week-4/' };
      // A daily activity already is the day's idea; don't repeat it below.
      const showTip = isOn(s.showTip) && daily?.kind !== 'activity';
      const footer = isOn(s.showNotes) || isOn(s.showSources) ? `<footer class="footer">${isOn(s.showNotes) ? `<p>${e(note)}</p>` : ''}${isOn(s.showSources) ? `<div class="sources">${e(t.source)}: <a href="${e(source.url)}" target="_blank" rel="noreferrer">${e(source.title.replace('weeks', lang === 'de' ? 'Wochen' : 'weeks').replace('months', lang === 'de' ? 'Monate' : 'months'))}</a>${state.corrected ? ` · <a href="${correctionUrl}">${e(t.correctionSource)}</a>` : ''}</div>` : ''}</footer>` : '';
      app.innerHTML = `${header}<div class="main">${hero}<section class="content"><p class="reference">${e(reference)}</p><h1>${e(daily?.title[lang] || item?.title[lang] || t.earlyTitle)}</h1>${body}${showTip ? `<aside class="tip"><h2>${e(t.tip)}</h2><p>${e(tip)}</p></aside>` : ''}</section></div>${footer}`;
    }
    await document.fonts.ready;
    await settleImages(app);
    if (current !== revision) return;
    const nameElement = app.querySelector('.name');
    if (nameElement) fitText(nameElement, { min: 10 });
    markReady();
  } catch (error) {
    if (current !== revision) return;
    app.innerHTML = `<section class="message"><p>${e(t?.loadError || 'Baby content unavailable.')}</p></section>`;
    markError(error);
  }
}
const payload = await waitForPayload({ timeoutMs: 500, onUpdate: renderPayload });
await renderPayload(payload);
