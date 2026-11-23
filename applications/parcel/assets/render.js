import defaults from './defaults.js';
const { waitForPayload, getSettings, getQuerySettings, mergeSettings, loadLanguageJson, applyColorTheme, markLoading, markReady, markError, escapeHtml } = window.PaperlessOpenIntegration;
const app = document.querySelector('#app');
const esc = escapeHtml;
const yes = v => v === true || v === 'true' || v === 1 || v === '1';
const short = (s, n) => String(s || '').length > n ? String(s).slice(0, n - 1).trimEnd() + '…' : String(s || '');
let revision = 0, controller;
function dateLabel(value, locale, timeZone, withTime = false) {
  if (!value) return '';
  const d = new Date(value.length === 10 ? value + 'T12:00:00Z' : value);
  if (!Number.isFinite(d.getTime())) return '';
  return new Intl.DateTimeFormat(locale, { timeZone: value.length === 10 ? 'UTC' : timeZone, day: 'numeric', month: 'short', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) }).format(d);
}
async function renderPayload(payload) {
  const current = ++revision;
  controller?.abort(); controller = new AbortController();
  let m = {};
  try {
    markLoading();
    const loaded = await loadLanguageJson(payload);
    if (current !== revision) return;
    m = loaded.messages;
    const locale = loaded.language === 'de' ? 'de-DE' : 'en-GB';
    document.documentElement.lang = loaded.language;
    const settings = mergeSettings(defaults, getSettings(payload), getQuerySettings());
    applyColorTheme(settings.color, { defaultTheme: defaults.color });
    const response = await fetch(new URL('../api/data', import.meta.url), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...settings, language: loaded.language }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(30000)]) });
    if (!response.ok) throw new Error('API request failed');
    const data = await response.json();
    if (current !== revision) return;
    const t = (key, vars = {}) => Object.entries(vars).reduce((s, [k,v]) => s.replaceAll('{' + k + '}', String(v)), m[key] || key);
    app.innerHTML = `<header><div><p class="eyebrow ${data.sample ? 'sample' : ''}">${esc(data.sample ? m.sample : data.source)}</p><h1 class="clamp">${esc(short(settings.title || m.title, 80))}</h1></div></header><section id="content"></section><footer><span id="count">${esc(data.source)}</span><span>${esc(m.updated)} ${esc(dateLabel(data.updatedAt, locale, settings.timeZone || 'Europe/Berlin', true))}</span></footer>`;
    paint(data, app.querySelector('#content'), { settings, m, t, locale });
    await document.fonts?.ready;
    await Promise.all([...app.querySelectorAll('img')].map(img => new Promise(resolve => {
      if (img.complete) { if (!img.naturalWidth) imageFailed(img, m); resolve(); return; }
      const timer = setTimeout(() => { imageFailed(img, m); resolve(); }, 8000);
      img.onload = () => { clearTimeout(timer); resolve(); };
      img.onerror = () => { clearTimeout(timer); imageFailed(img, m); resolve(); };
    })));
    if (current !== revision) return;
    fit(data, { settings, m, t, locale });
    markReady();
  } catch (error) {
    if (current !== revision) return;
    app.innerHTML = `<section class="error"><h1>${esc(m.error || 'Could not load data')}</h1><p>${esc(m.setup || 'Check connection settings.')}</p></section>`;
    markError(new Error(m.error || 'Could not load data'));
  }
}
function imageFailed(img, m) {
  if (!img.isConnected) return;
  const label = document.createElement('span'); label.textContent = m.noPoster || '';
  img.replaceWith(label);
}
// Fit text to its allocated space; visibly mark an excerpt when the complete text cannot fit.
function fitExcerpt(element, availableHeight, original, minSize = 17) {
  if (!element) return false;
  let size = parseFloat(getComputedStyle(element).fontSize);
  while (element.scrollHeight > availableHeight + 1 && size > minSize) { size -= 1; element.style.fontSize = size + 'px'; }
  if (element.scrollHeight <= availableHeight + 1) return false;
  let low = 0, high = original.length;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    element.textContent = original.slice(0, mid).trimEnd() + '…';
    if (element.scrollHeight <= availableHeight + 1) low = mid; else high = mid - 1;
  }
  element.textContent = original.slice(0, low).trimEnd() + '…';
  return true;
}

function paint(data, root, { settings, m, locale }) {
  root.innerHTML = data.deliveries.length ? data.deliveries.map(d => {
    const expected = d.expected ? dateLabel(d.expected, locale, settings.timeZone, true) : d.expectedLabel;
    const end = d.expectedEnd ? dateLabel(d.expectedEnd, locale, settings.timeZone, true) : d.expectedEndLabel;
    return `<article class="delivery" data-status="${d.status}"><div class="delivery-top"><h2 class="clamp">${esc(short(d.description || m.unknownTitle, 100))}</h2><span class="badge">${esc(m[d.status < 0 ? 'statusUnknown' : 'status' + d.status])}</span></div><p class="meta clamp">${esc([d.carrier.toUpperCase(), expected ? m.expected + ' ' + expected + (end ? ' – ' + end : '') : ''].filter(Boolean).join(' · '))}</p>${d.event ? `<p class="clamp">${esc(short(d.event, 160))}</p>` : ''}${yes(settings.showTrackingNumber) && d.trackingNumber ? `<p class="clamp">${esc(d.trackingNumber)}</p>` : ''}</article>`;
  }).join('') : `<div class="empty">${esc(m.empty)}</div>`;
}
function fit(data, { t }) {
  const content = document.querySelector('#content');
  const entries = [...content.querySelectorAll('.delivery')];
  while (content.scrollHeight > content.clientHeight + 1 && entries.length > 1) entries.pop().remove();
  document.querySelector('#count').textContent = t('shown', { shown: entries.length, total: data.total });
}

const payload = await waitForPayload({ timeoutMs: 500, onUpdate: renderPayload });
await renderPayload(payload);
