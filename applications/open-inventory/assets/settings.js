const { setupSettingsPage, getSettings, postSettingsUpdate, applyColorTheme, loadLanguageJson } = window.PaperlessOpenIntegration;
const defaults = { baseUrl: '', apiKey: '', resourceId: '', view: 'stock', search: '', maxItems: 12, title: '', timeZone: 'Europe/Berlin', sampleData: false };
const form = document.querySelector('#settings');
const status = document.querySelector('#status');
const button = document.querySelector('#connect');
let settings = { ...defaults }, labels = {}, items = [], language = 'de', revision = 0, controller;
const input = (key) => document.getElementById(key);
const connectionKey = (s) => JSON.stringify([s.baseUrl, s.apiKey, s.sampleData]);

function populateItems() {
  const select = input('resourceId');
  select.replaceChildren(new Option(labels.all || 'Alle Artikel', ''));
  for (const item of items) select.add(new Option(`${item.name}${item.sku ? ` · ${item.sku}` : ''}`, item.id));
  if (settings.resourceId && !items.some((item) => item.id === settings.resourceId)) {
    select.add(new Option(`${labels.selected || 'Ausgewählter Artikel'}: ${settings.resourceId}`, settings.resourceId));
  }
  select.value = settings.resourceId;
}

function showSettings() {
  for (const node of document.querySelectorAll('[data-label]')) node.textContent = labels[node.dataset.label] || node.dataset.label;
  for (const key of Object.keys(defaults)) {
    if (key === 'sampleData') input(key).checked = settings[key] === true || settings[key] === 'true';
    else if (key !== 'resourceId') input(key).value = settings[key];
  }
  populateItems();
}

form.addEventListener('submit', (event) => event.preventDefault());
form.addEventListener('change', (event) => {
  const key = event.target.id;
  if (!(key in defaults)) return;
  if (!event.target.reportValidity()) return;
  const value = key === 'sampleData' ? event.target.checked : key === 'maxItems' ? Number(event.target.value) : event.target.value.trim();
  if (key === 'timeZone') {
    try { new Intl.DateTimeFormat('en', { timeZone: value }).format(); }
    catch { status.textContent = labels.invalidTimeZone; return; }
  }
  const patch = { [key]: value };
  if (['baseUrl', 'apiKey', 'sampleData'].includes(key)) {
    controller?.abort(); revision++;
    items = []; patch.resourceId = ''; button.disabled = false;
  }
  settings = { ...settings, ...patch };
  populateItems();
  postSettingsUpdate(patch);
  status.textContent = labels.changed;
});

button.addEventListener('click', async () => {
  if (!form.reportValidity()) return;
  const current = ++revision;
  controller?.abort(); controller = new AbortController();
  const active = controller;
  const timer = setTimeout(() => active.abort(), 20000);
  button.disabled = true; status.textContent = labels.loading;
  try {
    const response = await fetch(new URL('../api/options', import.meta.url), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl: settings.baseUrl, apiKey: settings.apiKey, sampleData: settings.sampleData, language }),
      signal: active.signal,
    });
    const data = await response.json();
    if (!response.ok || !Array.isArray(data.items)) throw new Error('Connection failed');
    if (current !== revision) return;
    items = data.items; populateItems();
    status.textContent = labels.connected.replace('{count}', String(items.length));
  } catch {
    if (current === revision) status.textContent = labels.failed;
  } finally {
    clearTimeout(timer);
    if (current === revision) button.disabled = false;
  }
});

let payloadRevision = 0;
setupSettingsPage({
  async onPayload(payload) {
    const current = ++payloadRevision;
    const loaded = await loadLanguageJson(payload, { supported: ['de', 'en'] });
    if (current !== payloadRevision) return;
    language = loaded.language; labels = loaded.messages.settings;
    const next = { ...defaults, ...getSettings(payload) };
    if (connectionKey(next) !== connectionKey(settings)) {
      controller?.abort(); revision++; items = []; button.disabled = false;
    }
    settings = next;
    document.documentElement.lang = language;
    applyColorTheme(settings.color || 'blue-light');
    showSettings();
  },
});
