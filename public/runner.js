const icons = {
  cpu: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  fileJson: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"/><path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"/></svg>',
  form: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/></svg>',
  image: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/></svg>',
  monitor: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>',
  pulse: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12h-4l-3 8L9 4l-3 8H2"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 0 1-15.54 6.22L3 16"/><path d="M3 21v-5h5"/><path d="M3 12A9 9 0 0 1 18.54 5.78L21 8"/><path d="M21 3v5h-5"/></svg>',
  reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
  send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>',
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M2 14h4"/><path d="M10 8h4"/><path d="M18 16h4"/></svg>',
  terminal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></svg>',
};

const colorThemes = [
  "black",
  "white",
  "blue",
  "green",
  "red",
  "yellow",
  "dark",
  "light",
  "red-dark",
  "red-light",
  "blue-dark",
  "blue-light",
  "green-dark",
  "green-light",
];

const colorOptions = [
  "",
  "dark",
  "light",
  "red-dark",
  "red-light",
  "blue-dark",
  "blue-light",
  "green-dark",
  "green-light",
];

const runnerData = JSON.parse(document.querySelector("#runner-data").textContent);
const { config, configUrl, renderPath, settingsPath, slug } = runnerData;
const iframe = document.querySelector("#preview");
const renderedPreview = document.querySelector("#rendered-preview");
const settingsFrame = document.querySelector("#settings-page");
const formFields = document.querySelector("#form-fields");
const settingsEditor = document.querySelector("#settings");
const status = document.querySelector("#status");
const devStatus = document.querySelector("#dev-status");
const renderStatus = document.querySelector("#render-status");
const schemaStatus = document.querySelector("#schema-status");
const rendererStatus = document.querySelector("#renderer-status");
const rendererDownload = document.querySelector("#renderer-download");
const variantsStatus = document.querySelector("#variants-status");
const variantsList = document.querySelector("#variants-list");
const regenerateVariants = document.querySelector("#regenerate-variants");
const viewport = document.querySelector("#viewport");
const viewportPresets = [...document.querySelectorAll("[data-viewport]")];
const color = document.querySelector("#color");
const languageField = document.querySelector("#language-field");
const language = document.querySelector("#language");
const secretWarning = document.querySelector("#secret-warning");

const secretPattern = /(api[_-]?key|token|secret|password|authorization)/i;
const defaultPluginSettings = clone(config.nativeSettings || {});
const defaultSettingsValue = JSON.stringify(defaultPluginSettings, null, 2);
const languages = Array.isArray(config.language)
  ? config.language.filter((code) => typeof code === "string" && code.trim())
  : [];
const defaultColorValue =
  typeof defaultPluginSettings.color === "string" ? defaultPluginSettings.color : "";
const defaultLanguageValue = languages[0] || "";
const defaultViewportValue = viewport.value;
const storageKey = [
  "paperlesspaper-openintegration",
  config.name || slug,
  config.version || "0.1.0",
  renderPath,
].join(":");

let monitorTimer;
let timeoutTimer;
let reloadTimer;
let syncingJson = false;
let cacheSuppressed = false;

function installIcons() {
  for (const element of document.querySelectorAll("[data-icon]")) {
    element.innerHTML = icons[element.dataset.icon] || "";
  }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function setStatus(title, detail) {
  status.innerHTML = "<strong>" + escapeText(title) + "</strong>" + escapeText(detail);
}

function setPanel(panel, title, detail) {
  if (!panel) {
    return;
  }

  panel.innerHTML = "<strong>" + escapeText(title) + "</strong>" + detail;
}

function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#039;";
    }
  });
}

function assetUrl(value, cacheBust) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  const url = /^https?:\/\//.test(value)
    ? new URL(value)
    : new URL("/" + slug + "/" + value.replace(/^\.?\//, ""), window.location.origin);

  if (cacheBust) {
    url.searchParams.set("t", String(cacheBust));
  }

  return url.href;
}

function frameUrl() {
  return new URL(renderPath, window.location.origin).href;
}

function configHref() {
  return new URL(configUrl || "/" + slug + "/config.json", window.location.origin).href;
}

function selectValue(select, value, fallback) {
  if (!select) {
    return;
  }

  if ([...select.options].some((option) => option.value === value)) {
    select.value = value;
    return;
  }

  select.value = fallback;
}

function initColorControl() {
  color.innerHTML = colorOptions
    .map((theme) => {
      const label = theme || "none";
      return "<option value=\"" + escapeText(theme) + "\">" + escapeText(label) + "</option>";
    })
    .join("");
}

function initLanguageControl() {
  if (languages.length === 0) {
    languageField.hidden = true;
    return;
  }

  languageField.hidden = false;
  language.innerHTML = languages
    .map((code) => "<option value=\"" + escapeText(code) + "\">" + escapeText(code) + "</option>")
    .join("");
}

function syncViewportPresets() {
  viewportPresets.forEach((button) => {
    button.setAttribute("aria-pressed", button.dataset.viewport === viewport.value ? "true" : "false");
  });
}

function parseEditablePluginSettings() {
  try {
    const values = JSON.parse(settingsEditor.value || "{}");
    return isObject(values) ? values : {};
  } catch {
    return {};
  }
}

function syncSettingsColorFromSelect() {
  const values = parseEditablePluginSettings();

  if (color.value) {
    values.color = color.value;
  } else {
    delete values.color;
  }

  syncingJson = true;
  settingsEditor.value = JSON.stringify(values, null, 2);
  syncingJson = false;
}

function syncColorFromJson() {
  try {
    const values = JSON.parse(settingsEditor.value || "{}");

    if (!isObject(values)) {
      return;
    }

    selectValue(color, typeof values.color === "string" ? values.color : "", "");
  } catch {
    // Keep the current select value while raw JSON is being edited.
  }
}

function readCachedState() {
  try {
    const raw = localStorage.getItem(storageKey);
    const state = raw ? JSON.parse(raw) : undefined;
    return isObject(state) ? state : {};
  } catch {
    return {};
  }
}

function cacheState(reason) {
  if (cacheSuppressed) {
    return;
  }

  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        color: color.value,
        language: language?.value,
        settings: settingsEditor.value,
        viewport: viewport.value,
      }),
    );
    setPanel(devStatus, "Cached", escapeText(reason));
  } catch (error) {
    setPanel(devStatus, "Cache unavailable", escapeText(error.message || error));
  }
}

function hydrateCachedState() {
  const state = readCachedState();

  if (typeof state.settings === "string") {
    settingsEditor.value = state.settings;
  }

  if (typeof state.color === "string") {
    selectValue(color, state.color, defaultColorValue);
  } else {
    syncColorFromJson();
  }

  if (language) {
    if (typeof state.language === "string") {
      selectValue(language, state.language, defaultLanguageValue);
    } else {
      selectValue(language, defaultLanguageValue, language.options[0]?.value || "");
    }
  }

  if (typeof state.viewport === "string") {
    selectValue(viewport, state.viewport, defaultViewportValue);
  }

  syncViewportPresets();
  syncSettingsColorFromSelect();

  if (Object.keys(state).length > 0) {
    setPanel(devStatus, "Cache restored", "Loaded saved preview values.");
  }
}

function resetCachedState() {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // localStorage may be unavailable in restricted browser modes.
  }

  settingsEditor.value = defaultSettingsValue;
  selectValue(color, defaultColorValue, "");
  if (language) {
    selectValue(language, defaultLanguageValue, language.options[0]?.value || "");
  }
  selectValue(viewport, defaultViewportValue, defaultViewportValue);
  cacheSuppressed = true;
  syncSettingsColorFromSelect();
  syncFormFromJson();
  applyViewport();
  syncViewportPresets();
  setPanel(devStatus, "Cache reset", "Restored manifest defaults.");
  reloadFrame();
  cacheSuppressed = false;
}

function currentPayload() {
  let pluginSettings;
  try {
    pluginSettings = JSON.parse(settingsEditor.value || "{}");
  } catch (error) {
    throw new Error("pluginSettings is not valid JSON: " + error.message);
  }

  if (color.value) {
    pluginSettings = {
      ...pluginSettings,
      color: color.value,
    };
  }

  return {
    id: "paperlesspaper-online-runner",
    draft: true,
    meta: {
      color: color.value || undefined,
      frameKind: "epd7",
      language: language?.value || defaultLanguageValue || undefined,
      pluginConfigUrl: configHref(),
      pluginManifest: config,
      pluginSettings,
    },
  };
}

function sendSettingsPageInit() {
  if (!settingsFrame?.contentWindow) {
    return;
  }

  try {
    settingsFrame.contentWindow.postMessage(
      {
        type: "INIT",
        cmd: "message",
        data: currentPayload(),
      },
      window.location.origin,
    );
  } catch {
    // The settings frame may still be navigating.
  }
}

function updatePluginSettings(nextSettings, reason) {
  if (!isObject(nextSettings)) {
    return;
  }

  const values = {
    ...parseEditablePluginSettings(),
    ...nextSettings,
  };

  if (color.value) {
    values.color = color.value;
  } else if (Object.prototype.hasOwnProperty.call(nextSettings, "color")) {
    delete values.color;
  }

  syncingJson = true;
  settingsEditor.value = JSON.stringify(values, null, 2);
  syncingJson = false;
  syncFormFromJson();
  syncColorFromJson();
  cacheState(reason);
  scheduleReload(reason);
  sendSettingsPageInit();
}

function showLivePreview() {
  renderedPreview.hidden = true;
  renderedPreview.removeAttribute("src");
  iframe.hidden = false;
  rendererDownload.disabled = true;
}

function fieldValueFromSettings(name, schema, values) {
  if (Object.prototype.hasOwnProperty.call(values, name)) {
    return values[name];
  }

  if (Object.prototype.hasOwnProperty.call(schema, "default")) {
    return schema.default;
  }

  if (schema.type === "boolean") {
    return false;
  }

  return "";
}

function coerceFieldValue(element, schema) {
  const type = schema.type;

  if (type === "boolean") {
    return element.checked;
  }

  if (element.value === "") {
    return null;
  }

  if (type === "number" || type === "integer") {
    const number = Number(element.value);
    return Number.isFinite(number) ? number : null;
  }

  if (type === "array" || type === "object") {
    try {
      return JSON.parse(element.value);
    } catch {
      return element.value;
    }
  }

  return element.value;
}

function updateJsonFromForm() {
  if (syncingJson) {
    return;
  }

  let values = {};
  try {
    values = JSON.parse(settingsEditor.value || "{}");
  } catch {
    values = {};
  }

  for (const element of formFields.querySelectorAll("[data-setting-name]")) {
    const name = element.dataset.settingName;
    const property = config.formSchema?.properties?.[name] || {};
    values[name] = coerceFieldValue(element, property);
  }

  syncingJson = true;
  settingsEditor.value = JSON.stringify(values, null, 2);
  syncingJson = false;
  cacheState("Settings saved.");
  scheduleReload("Settings changed");
}

function syncFormFromJson() {
  if (syncingJson) {
    return;
  }

  let values = {};
  try {
    values = JSON.parse(settingsEditor.value || "{}");
  } catch {
    return;
  }

  syncingJson = true;

  for (const element of formFields.querySelectorAll("[data-setting-name]")) {
    const name = element.dataset.settingName;
    const property = config.formSchema?.properties?.[name] || {};
    const value = fieldValueFromSettings(name, property, values);

    if (property.type === "boolean") {
      element.checked = Boolean(value);
    } else if (property.type === "array" || property.type === "object") {
      element.value = value === "" ? "" : JSON.stringify(value, null, 2);
    } else {
      element.value = value ?? "";
    }
  }

  syncingJson = false;
}

function createField(name, property, required) {
  const wrapper = document.createElement("div");
  wrapper.className = "field";

  const title = document.createElement("div");
  title.className = "field-title";
  title.textContent = property.title || name;

  let input;

  if (property.type === "boolean") {
    const row = document.createElement("label");
    row.className = "field-row";
    const text = document.createElement("span");
    text.textContent = property.title || name;
    input = document.createElement("input");
    input.type = "checkbox";
    row.append(text, input);
    wrapper.append(row);
  } else {
    wrapper.append(title);

    if (Array.isArray(property.enum)) {
      input = document.createElement("select");
      const empty = document.createElement("option");
      empty.value = "";
      empty.textContent = required ? "Select..." : "None";
      input.append(empty);

      for (const optionValue of property.enum) {
        const option = document.createElement("option");
        option.value = String(optionValue);
        option.textContent = String(optionValue);
        input.append(option);
      }
    } else if (property.type === "array" || property.type === "object") {
      input = document.createElement("textarea");
      input.rows = 4;
    } else {
      input = document.createElement("input");
      input.type = property.type === "number" || property.type === "integer"
        ? "number"
        : secretPattern.test(name)
          ? "password"
          : "text";

      if (property.type === "integer") {
        input.step = "1";
      }
    }

    wrapper.append(input);
  }

  input.dataset.settingName = name;

  if (property.description) {
    const help = document.createElement("p");
    help.className = "field-help";
    help.textContent = property.description;
    wrapper.append(help);
  }

  input.addEventListener("input", updateJsonFromForm);
  input.addEventListener("change", updateJsonFromForm);

  return wrapper;
}

function shouldShowField(name, property) {
  if (name === "color" || !isObject(property)) {
    return false;
  }

  return property.inStettingsPage !== true &&
    property.inStettingsPage !== "true" &&
    property.inSettingsPage !== true &&
    property.inSettingsPage !== "true";
}

function renderFormFields() {
  formFields.innerHTML = "";
  const schema = config.formSchema;

  if (!isObject(schema) || schema.type !== "object" || !isObject(schema.properties)) {
    secretWarning.hidden = true;
    setPanel(schemaStatus, "Settings schema", "No object formSchema found.");
    return;
  }

  const required = Array.isArray(schema.required) ? schema.required : [];
  secretWarning.hidden = !Object.keys(schema.properties).some((name) => secretPattern.test(name));

  for (const [name, property] of Object.entries(schema.properties)) {
    if (!shouldShowField(name, property)) {
      continue;
    }

    formFields.append(createField(name, property, required.includes(name)));
  }

  syncFormFromJson();
  setPanel(schemaStatus, "Settings schema", formFields.children.length + " generated field(s).");
}

function settingsFromVariant(variant) {
  if (!isObject(variant)) {
    return {};
  }

  const values = {};

  for (const [key, value] of Object.entries(variant)) {
    if (key !== "screenshots") {
      values[key] = value;
    }
  }

  return values;
}

function variantTitle(index, variant) {
  const values = settingsFromVariant(variant);
  const parts = Object.entries(values)
    .filter(([, value]) => typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    .slice(0, 3)
    .map(([key, value]) => key + "=" + String(value));

  return "Variant " + (index + 1) + (parts.length ? " · " + parts.join(" · ") : "");
}

function variantSettingsSummary(variant) {
  const values = settingsFromVariant(variant);
  const text = JSON.stringify(values, null, 2);

  if (text.length <= 360) {
    return text;
  }

  return text.slice(0, 357) + "...";
}

function applyVariant(variant, index) {
  const nextSettings = settingsFromVariant(variant);

  syncingJson = true;
  settingsEditor.value = JSON.stringify(nextSettings, null, 2);
  syncingJson = false;
  syncColorFromJson();
  syncFormFromJson();
  cacheState("Variant " + (index + 1) + " applied.");
  reloadFrame();
}

function renderConfigVariants(cacheBust) {
  variantsList.innerHTML = "";
  const variants = Array.isArray(config.configVariants) ? config.configVariants : [];
  regenerateVariants.disabled = true;

  if (variants.length === 0) {
    setPanel(variantsStatus, "Variants", "No configVariants found.");
    return;
  }

  variants.forEach((variant, index) => {
    const card = document.createElement("article");
    card.className = "variant-card";

    const header = document.createElement("div");
    header.className = "variant-card-header";

    const title = document.createElement("div");
    title.className = "variant-title";
    title.textContent = variantTitle(index, variant);

    const apply = document.createElement("button");
    apply.type = "button";
    apply.textContent = "Apply";
    apply.addEventListener("click", () => applyVariant(variant, index));

    header.append(title, apply);
    card.append(header);

    const summary = document.createElement("pre");
    summary.className = "variant-settings";
    summary.textContent = variantSettingsSummary(variant);
    card.append(summary);

    const screenshots = isObject(variant) && isObject(variant.screenshots) ? variant.screenshots : {};
    const screenshotEntries = Object.entries(screenshots);

    if (screenshotEntries.length > 0) {
      const grid = document.createElement("div");
      grid.className = "variant-screenshots";

      for (const [size, path] of screenshotEntries) {
        if (typeof path !== "string") {
          continue;
        }

        const figure = document.createElement("figure");
        figure.className = "variant-screenshot";

        const image = document.createElement("img");
        image.src = assetUrl(path, cacheBust);
        image.alt = variantTitle(index, variant) + " " + size;
        image.loading = "lazy";

        const caption = document.createElement("figcaption");
        caption.textContent = size + " · " + path;

        figure.append(image, caption);
        grid.append(figure);
      }

      card.append(grid);
    }

    variantsList.append(card);
  });

  setPanel(variantsStatus, "Variants", variants.length + " configured variant(s). Screenshot regeneration is available in the CLI.");
}

function applyViewport() {
  const [width, height] = viewport.value.split("x").map(Number);
  document.documentElement.style.setProperty("--preview-width", width + "px");
  document.documentElement.style.setProperty("--preview-height", height + "px");
  syncViewportPresets();
}

function updateViewport() {
  showLivePreview();
  applyViewport();
  cacheState("Viewport saved.");
}

function applyFrameTheme() {
  const doc = iframe.contentDocument;
  if (!doc?.body) {
    return;
  }

  doc.body.classList.remove(...colorThemes);

  if (color.value) {
    doc.body.classList.add(color.value);
  }
}

function sendInit() {
  showLivePreview();

  try {
    const payload = currentPayload();
    applyFrameTheme();
    iframe.contentWindow?.postMessage(
      {
        type: "INIT",
        cmd: "message",
        data: payload,
      },
      window.location.origin,
    );
    setStatus("INIT sent", "Waiting for ready marker.");
    setPanel(renderStatus, "Render", "INIT sent to iframe.");
    monitorReady();
  } catch (error) {
    setStatus("Settings error", String(error.message || error));
    setPanel(renderStatus, "Settings error", escapeText(error.message || error));
  }
}

function monitorReady() {
  clearInterval(monitorTimer);
  clearTimeout(timeoutTimer);

  const started = Date.now();
  monitorTimer = setInterval(() => {
    const doc = iframe.contentDocument;
    if (!doc) {
      return;
    }

    const loaded = doc.querySelector("#website-has-loaded");
    const loading = doc.querySelector("#website-has-loading-element");

    if (loaded) {
      clearInterval(monitorTimer);
      clearTimeout(timeoutTimer);
      applyFrameTheme();
      setStatus("Ready", "Rendered in " + (Date.now() - started) + "ms.");
      setPanel(renderStatus, "Ready", "Rendered in " + (Date.now() - started) + "ms.");
      return;
    }

    if (loading) {
      setStatus("Rendering", "Loading marker is still present.");
      setPanel(renderStatus, "Rendering", "Loading marker is still present.");
    }
  }, 250);

  timeoutTimer = setTimeout(() => {
    clearInterval(monitorTimer);
    setStatus("Timed out", "No #website-has-loaded marker after 30s.");
    setPanel(renderStatus, "Timed out", "No #website-has-loaded marker after 30s.");
  }, 30000);
}

function reloadFrame() {
  showLivePreview();
  applyViewport();
  cacheState("Preview values saved.");
  setStatus("Loading iframe", "Waiting to send INIT.");
  setPanel(renderStatus, "Loading iframe", escapeText(frameUrl()));
  iframe.src = frameUrl();
}

function scheduleReload(reason) {
  clearTimeout(reloadTimer);
  setPanel(renderStatus, "Reload queued", escapeText(reason));
  reloadTimer = setTimeout(reloadFrame, 250);
}

function reloadSettingsFrame() {
  if (!settingsFrame || !settingsPath) {
    return;
  }

  const url = new URL(settingsPath, window.location.origin);
  settingsFrame.src = url.href;
}

function settingsFromMessage(message) {
  if (!isObject(message)) {
    return undefined;
  }

  if (isObject(message.pluginSettings)) {
    return message.pluginSettings;
  }

  if (isObject(message.settings)) {
    return message.settings;
  }

  if (isObject(message.data)) {
    if (isObject(message.data.pluginSettings)) {
      return message.data.pluginSettings;
    }

    if (isObject(message.data.settings)) {
      return message.data.settings;
    }
  }

  return undefined;
}

function handleSettingsPageMessage(event) {
  if (!settingsFrame || event.source !== settingsFrame.contentWindow) {
    return;
  }

  const message = event.data;

  if (!isObject(message)) {
    return;
  }

  if (message.type === "paperlesspaper:settings:ready" || message.type === "INIT_REQUEST") {
    sendSettingsPageInit();
    return;
  }

  const nextSettings = settingsFromMessage(message);
  if (!nextSettings) {
    return;
  }

  updatePluginSettings(nextSettings, "Settings page changed.");
}

installIcons();
initColorControl();
initLanguageControl();
settingsEditor.value = defaultSettingsValue;
selectValue(color, defaultColorValue, "");
if (language) {
  selectValue(language, defaultLanguageValue, language.options[0]?.value || "");
}
syncSettingsColorFromSelect();

iframe.addEventListener("load", () => {
  applyFrameTheme();
  setTimeout(sendInit, 50);
});
settingsFrame?.addEventListener("load", () => {
  setTimeout(sendSettingsPageInit, 50);
});
window.addEventListener("message", handleSettingsPageMessage);
document.querySelector("#send").addEventListener("click", sendInit);
document.querySelector("#reload").addEventListener("click", reloadFrame);
document.querySelector("#reset").addEventListener("click", resetCachedState);
regenerateVariants.addEventListener("click", () => {
  setPanel(variantsStatus, "Regenerate", "Screenshot regeneration is available in the CLI.");
});
document.querySelector("#show-live").addEventListener("click", () => {
  showLivePreview();
  setPanel(rendererStatus, "Live preview", "Showing iframe preview.");
});
viewport.addEventListener("change", updateViewport);
viewportPresets.forEach((button) => {
  button.addEventListener("click", () => {
    selectValue(viewport, button.dataset.viewport, defaultViewportValue);
    updateViewport();
  });
});
color.addEventListener("change", () => {
  syncSettingsColorFromSelect();
  syncFormFromJson();
  cacheState("Settings saved.");
  reloadFrame();
});
language?.addEventListener("change", () => {
  cacheState("Language saved.");
  reloadFrame();
});
settingsEditor.addEventListener("input", () => {
  syncFormFromJson();
  syncColorFromJson();
  cacheState("Raw settings saved.");
  scheduleReload("Raw settings changed");
});

hydrateCachedState();
renderFormFields();
renderConfigVariants();
applyViewport();
reloadSettingsFrame();
reloadFrame();
