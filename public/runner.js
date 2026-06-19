const colorThemes = [
  "light",
  "dark",
  "white",
  "black",
  "blue",
  "green",
  "red",
  "yellow",
  "red-dark",
  "red-light",
  "blue-dark",
  "blue-light",
  "green-dark",
  "green-light",
];

const runnerData = JSON.parse(document.querySelector("#runner-data").textContent);
const { config, renderPath, settingsPath, slug } = runnerData;

const preview = document.querySelector("#preview");
const device = document.querySelector("#device");
const viewport = document.querySelector("#viewport");
const status = document.querySelector("#status");
const language = document.querySelector("#language");
const color = document.querySelector("#color");
const formFields = document.querySelector("#form-fields");
const emptyFields = document.querySelector("#empty-fields");
const settingsJson = document.querySelector("#settings-json");
const settingsPageGroup = document.querySelector("#settings-page-group");
const settingsPage = document.querySelector("#settings-page");
const secretWarning = document.querySelector("#secret-warning");

const schemaProperties = isObject(config.formSchema?.properties)
  ? config.formSchema.properties
  : {};
const generatedProperties = Object.entries(schemaProperties).filter(([, property]) => {
  return property?.inStettingsPage !== true &&
    property?.inStettingsPage !== "true" &&
    property?.inSettingsPage !== true &&
    property?.inSettingsPage !== "true";
});
const secretPattern = /(api[_-]?key|token|secret|password|authorization)/i;
let settings = clone(config.nativeSettings || {});
let reloadTimer;
let readyTimer;
let readyTimeout;

function clone(value) {
  return JSON.parse(JSON.stringify(value ?? {}));
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#039;";
    }
  });
}

function labelFor(name, property) {
  return typeof property?.title === "string" && property.title
    ? property.title
    : name.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase());
}

function defaultFor(name, property) {
  if (Object.prototype.hasOwnProperty.call(settings, name)) {
    return settings[name];
  }

  if (Object.prototype.hasOwnProperty.call(property || {}, "default")) {
    return property.default;
  }

  if (property?.type === "boolean") {
    return false;
  }

  return "";
}

function coerceFieldValue(input, property) {
  if (property?.type === "boolean") {
    return input.checked;
  }

  if (property?.type === "number" || property?.type === "integer") {
    if (input.value === "") {
      return null;
    }

    const value = Number(input.value);
    return Number.isFinite(value) ? value : null;
  }

  return input.value;
}

function createField(name, property) {
  const label = document.createElement("label");
  const title = document.createElement("span");
  title.textContent = labelFor(name, property);
  label.append(title);

  let input;
  const value = defaultFor(name, property);

  if (property?.type === "boolean") {
    label.classList.add("check");
    input = document.createElement("input");
    input.type = "checkbox";
    input.checked = Boolean(value);
    label.prepend(input);
  } else if (Array.isArray(property?.enum)) {
    input = document.createElement("select");
    for (const optionValue of property.enum) {
      const option = document.createElement("option");
      option.value = String(optionValue);
      option.textContent = String(optionValue);
      input.append(option);
    }
    input.value = value == null ? "" : String(value);
  } else {
    input = document.createElement("input");
    input.type = property?.type === "number" || property?.type === "integer"
      ? "number"
      : secretPattern.test(name)
        ? "password"
        : "text";
    if (input.type === "number") {
      input.step = property?.type === "integer" ? "1" : "any";
    }
    input.value = value == null ? "" : String(value);
  }

  input.dataset.name = name;
  input.addEventListener("input", applyFieldChanges);
  input.addEventListener("change", applyFieldChanges);
  label.append(input);

  if (typeof property?.description === "string" && property.description) {
    const hint = document.createElement("p");
    hint.className = "status";
    hint.textContent = property.description;
    label.append(hint);
  }

  return label;
}

function renderControls() {
  formFields.innerHTML = "";

  for (const [name, property] of generatedProperties) {
    formFields.append(createField(name, property));
  }

  emptyFields.hidden = generatedProperties.length > 0;
  secretWarning.hidden = !Object.keys(schemaProperties).some((name) => secretPattern.test(name));
}

function fieldInput(name) {
  return [...formFields.querySelectorAll("[data-name]")].find((input) => input.dataset.name === name);
}

function readFieldsIntoSettings() {
  for (const [name, property] of generatedProperties) {
    const input = fieldInput(name);
    if (input) {
      settings[name] = coerceFieldValue(input, property);
    }
  }
}

function syncControlsFromSettings() {
  for (const [name, property] of generatedProperties) {
    const input = fieldInput(name);
    if (!input) {
      continue;
    }

    const value = defaultFor(name, property);
    if (property?.type === "boolean") {
      input.checked = Boolean(value);
    } else {
      input.value = value == null ? "" : String(value);
    }
  }
}

function updateSettingsJson() {
  settingsJson.value = JSON.stringify(settings, null, 2);
}

function currentViewport() {
  const [width, height] = viewport.value.split("x").map((value) => Number(value));
  return { width, height };
}

function currentPayload() {
  const { width, height } = currentViewport();
  const colorValue = color.value || settings.color || "light";
  const pluginSettings = {
    ...settings,
    color: colorValue,
  };

  return {
    id: "paperlesspaper-online-runner",
    draft: true,
    meta: {
      color: colorValue,
      frameKind: "epd7",
      language: language.value,
      orientation: width >= height ? "landscape" : "portrait",
      pluginConfigUrl: new URL("/" + slug + "/config.json", window.location.origin).href,
      pluginManifest: config,
      pluginSettings,
    },
  };
}

function applyViewport() {
  const { width, height } = currentViewport();
  device.style.width = width + "px";
  device.style.height = height + "px";
}

function applyFrameTheme() {
  const body = preview.contentDocument?.body;
  if (!body) {
    return;
  }

  body.classList.remove(...colorThemes);

  if (color.value && colorThemes.includes(color.value)) {
    body.classList.add(color.value);
  }
}

function postInit(targetWindow = preview.contentWindow) {
  if (!targetWindow) {
    return;
  }

  targetWindow.postMessage(
    {
      type: "INIT",
      cmd: "message",
      data: currentPayload(),
    },
    window.location.origin,
  );
}

function monitorReady() {
  clearInterval(readyTimer);
  clearTimeout(readyTimeout);

  readyTimer = setInterval(() => {
    const doc = preview.contentDocument;
    if (doc?.getElementById("website-has-loaded")) {
      clearInterval(readyTimer);
      clearTimeout(readyTimeout);
      status.textContent = "Ready.";
    }
  }, 250);

  readyTimeout = setTimeout(() => {
    clearInterval(readyTimer);
    status.textContent = "Still waiting for ready marker.";
  }, 15000);
}

function reloadPreview() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    applyViewport();
    updateSettingsJson();
    status.textContent = "Loading preview.";
    preview.src = "about:blank";
    setTimeout(() => {
      preview.src = renderPath;
    }, 0);
  }, 80);
}

function applyFieldChanges() {
  readFieldsIntoSettings();
  updateSettingsJson();
  reloadPreview();
}

function applyJson() {
  try {
    const nextSettings = JSON.parse(settingsJson.value || "{}");
    if (!isObject(nextSettings)) {
      throw new Error("JSON must be an object.");
    }
    settings = nextSettings;
    syncControlsFromSettings();
    reloadPreview();
  } catch (error) {
    status.textContent = error.message || String(error);
  }
}

function reset() {
  settings = clone(config.nativeSettings || {});
  color.value = typeof settings.color === "string" ? settings.color : "light";
  syncControlsFromSettings();
  updateSettingsJson();
  reloadPreview();
}

function handleSettingsPageMessage(event) {
  if (event.source !== settingsPage.contentWindow || !isObject(event.data)) {
    return;
  }

  if (event.data.type === "paperlesspaper:settings:ready" || event.data.type === "INIT_REQUEST") {
    postInit(settingsPage.contentWindow);
    return;
  }

  const nextSettings = isObject(event.data.pluginSettings)
    ? event.data.pluginSettings
    : isObject(event.data.settings)
      ? event.data.settings
      : undefined;

  if (!nextSettings) {
    return;
  }

  settings = {
    ...settings,
    ...nextSettings,
  };
  syncControlsFromSettings();
  updateSettingsJson();
  reloadPreview();
}

function initLanguageControl() {
  const languages = Array.isArray(config.language) && config.language.length
    ? config.language
    : ["en"];
  language.innerHTML = languages
    .map((code) => "<option value=\"" + escapeText(code) + "\">" + escapeText(code) + "</option>")
    .join("");
  language.value = languages[0] || "en";
}

function initColorControl() {
  color.innerHTML = colorThemes
    .map((theme) => "<option value=\"" + escapeText(theme) + "\">" + escapeText(theme) + "</option>")
    .join("");
}

preview.addEventListener("load", () => {
  if (!preview.contentWindow || preview.src === "about:blank") {
    return;
  }
  applyFrameTheme();
  postInit(preview.contentWindow);
  monitorReady();
});

settingsPage.addEventListener("load", () => {
  postInit(settingsPage.contentWindow);
});

window.addEventListener("message", handleSettingsPageMessage);
viewport.addEventListener("change", reloadPreview);
language.addEventListener("change", reloadPreview);
color.addEventListener("change", () => {
  settings.color = color.value;
  reloadPreview();
});
document.querySelector("#reload").addEventListener("click", reloadPreview);
document.querySelector("#apply-json").addEventListener("click", applyJson);
document.querySelector("#reset").addEventListener("click", reset);

initLanguageControl();
initColorControl();
color.value = typeof settings.color === "string" ? settings.color : "light";
renderControls();
updateSettingsJson();

if (settingsPath) {
  settingsPageGroup.hidden = false;
  settingsPage.src = settingsPath;
}

reloadPreview();
