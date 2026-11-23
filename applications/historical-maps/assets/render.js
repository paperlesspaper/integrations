import { defaults, selectMap } from './selection.js';
const { waitForPayload, getSettings, getQuerySettings, mergeSettings, applyColorTheme,
  loadLanguageJson, escapeHtml, markLoading, markReady, markError } = window.PaperlessOpenIntegration;
const app = document.querySelector('#app');
let generation = 0;
let controller;
let catalog;
const fallback = { errorTitle: 'Karte konnte nicht geladen werden', error: 'Bitte Einstellungen und lokale Kartendateien prüfen.' };

async function loadCatalog(signal) {
  if (catalog) return catalog;
  const response = await fetch('./data/maps.json', { signal });
  if (!response.ok) throw new Error('catalogFailed');
  const value = await response.json();
  if (!Array.isArray(value) || !value.length) throw new Error('catalogFailed');
  catalog = value;
  return catalog;
}

async function decodeImage(image, signal) {
  let timer;
  let abort;
  try {
    await Promise.race([
      image.decode(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('imageFailed')), 10000);
        abort = () => reject(new DOMException('Aborted', 'AbortError'));
        signal.addEventListener('abort', abort, { once: true });
        if (signal.aborted) abort();
      }),
    ]);
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('imageFailed');
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}

async function renderPayload(payload) {
  const current = ++generation;
  controller?.abort();
  controller = new AbortController();
  const { signal } = controller;
  let messages = fallback;
  markLoading();
  try {
    const settings = mergeSettings(defaults, getSettings(payload), getQuerySettings());
    applyColorTheme(settings.color, { defaultTheme: defaults.color });
    const locale = await loadLanguageJson(payload);
    if (current !== generation) return;
    messages = { ...fallback, ...locale.messages };
    document.documentElement.lang = locale.language;
    const maps = await loadCatalog(signal);
    const { map } = selectMap(maps, settings);
    const copy = map[locale.language] || map.en;
    const image = new Image();
    image.className = 'map-image';
    image.alt = map.originalTitle;
    image.src = map.image;
    image.style.objectPosition = `${map.focus[0]}% ${map.focus[1]}%`;
    await decodeImage(image, signal);
    if (current !== generation) return;
    const e = escapeHtml;
    app.innerHTML = `
      <figure class="map-stage ${settings.view === 'complete' ? 'complete' : ''}" aria-label="${e(messages[settings.view])}"></figure>
      <section class="caption">
        <h1 class="map-title">${e(copy.title)}</h1><div class="map-year">${e(map.year)}</div>
        <p class="map-maker">${e(map.creator)}${settings.view === 'detail' ? ` · ${e(messages.detail)}` : ''}</p>
        ${settings.showDescription === false || settings.showDescription === 'false' ? '' : `<p class="map-description">${e(copy.description)}</p>`}
      </section>
      <footer class="credits">
        <div class="source-line"><span>Library of Congress, Geography and Map Division</span><a href="${e(map.sourceUrl)}">loc.gov/item/${e(map.locId)}</a></div>
      </footer>`;
    app.querySelector('.map-stage').prepend(image);
    await document.fonts.ready;
    if (current === generation) markReady();
  } catch (error) {
    if (current !== generation || signal.aborted) return;
    const detail = error instanceof RangeError ? messages.invalidTimeZone : messages[error.message];
    app.innerHTML = `<section class="error-card" role="alert"><h1>${escapeHtml(messages.errorTitle)}</h1><p>${escapeHtml(detail || messages.error)}</p></section>`;
    markError(error);
  }
}
const payload = await waitForPayload({ timeoutMs: 500, onUpdate: renderPayload });
await renderPayload(payload);
