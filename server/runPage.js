const colorThemes = [
  'light',
  'dark',
  'white',
  'black',
  'blue',
  'green',
  'red',
  'yellow',
  'red-dark',
  'red-light',
  'blue-dark',
  'blue-light',
  'green-dark',
  'green-light',
];

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#039;';
    }
  });
}

function serializeForScript(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => {
    switch (char) {
      case '<':
        return '\\u003c';
      case '>':
        return '\\u003e';
      case '&':
        return '\\u0026';
      case '\u2028':
        return '\\u2028';
      case '\u2029':
        return '\\u2029';
      default:
        return char;
    }
  });
}

export function createRunPage({ config, renderPath, settingsPath, slug }) {
  const title = escapeHtml(config.name || slug);
  const description = escapeHtml(config.description || '');
  const configJson = serializeForScript(config);
  const slugJson = serializeForScript(slug);
  const renderPathJson = serializeForScript(renderPath);
  const settingsPathJson = serializeForScript(settingsPath || '');
  const themeOptions = colorThemes
    .map((theme) => `<option value="${escapeHtml(theme)}">${escapeHtml(theme)}</option>`)
    .join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="data:," />
    <title>${title} - paperlesspaper demo</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f4f0;
        --fg: #111;
        --muted: #5f6360;
        --line: #1a1a18;
        --panel: #fff;
        --accent: #d8e7d0;
        --danger: #f4d2c8;
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      [hidden] {
        display: none !important;
      }

      body {
        margin: 0;
        background: var(--bg);
        color: var(--fg);
      }

      a {
        color: inherit;
      }

      button,
      input,
      select,
      textarea {
        border: 2px solid var(--line);
        border-radius: 4px;
        background: var(--panel);
        color: var(--fg);
        font: inherit;
      }

      button {
        min-height: 38px;
        padding: 7px 10px;
        font-weight: 760;
        cursor: pointer;
      }

      input,
      select {
        width: 100%;
        min-height: 38px;
        padding: 7px 9px;
      }

      textarea {
        width: 100%;
        min-height: 180px;
        padding: 9px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.82rem;
        line-height: 1.45;
        resize: vertical;
      }

      .app {
        min-height: 100vh;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
      }

      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 16px;
        border-bottom: 2px solid var(--line);
        background: var(--panel);
      }

      h1 {
        margin: 0;
        font-size: 1.05rem;
        line-height: 1.2;
      }

      .subtitle {
        margin: 3px 0 0;
        color: var(--muted);
        font-size: 0.85rem;
        line-height: 1.35;
      }

      .header-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
      }

      .header-actions a {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        border: 2px solid var(--line);
        border-radius: 4px;
        padding: 5px 9px;
        text-decoration: none;
        font-size: 0.86rem;
        font-weight: 720;
      }

      main {
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 360px;
      }

      .preview {
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
      }

      .preview-toolbar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        padding: 10px 12px;
        border-bottom: 2px solid var(--line);
      }

      .preview-toolbar label {
        width: min(220px, 100%);
      }

      .stage {
        min-height: 0;
        overflow: auto;
        padding: 18px;
      }

      .device {
        width: 800px;
        height: 480px;
        max-width: none;
        border: 3px solid var(--line);
        background: white;
        box-shadow: 0 1px 0 rgba(0, 0, 0, 0.08);
      }

      #preview {
        width: 100%;
        height: 100%;
        display: block;
        border: 0;
        background: white;
      }

      aside {
        min-width: 0;
        max-height: calc(100vh - 63px);
        overflow: auto;
        border-left: 2px solid var(--line);
        background: var(--panel);
      }

      .controls {
        display: grid;
        gap: 14px;
        padding: 14px;
      }

      .group {
        display: grid;
        gap: 10px;
        padding-bottom: 14px;
        border-bottom: 2px solid var(--line);
      }

      .group:last-child {
        border-bottom: 0;
        padding-bottom: 0;
      }

      h2 {
        margin: 0;
        font-size: 0.78rem;
        line-height: 1.1;
        text-transform: uppercase;
      }

      label,
      .field {
        display: grid;
        gap: 6px;
        min-width: 0;
        font-size: 0.78rem;
        font-weight: 760;
      }

      .check {
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        min-height: 38px;
      }

      .check input {
        width: 18px;
        min-height: 18px;
        height: 18px;
        margin: 0;
      }

      .status,
      .warning,
      .empty {
        margin: 0;
        color: var(--muted);
        font-size: 0.82rem;
        line-height: 1.35;
      }

      .warning {
        padding: 9px;
        border: 2px solid var(--line);
        background: var(--danger);
        color: var(--fg);
        font-weight: 680;
      }

      .settings-frame {
        width: 100%;
        height: 360px;
        border: 2px solid var(--line);
        background: var(--panel);
      }

      .buttons {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      @media (max-width: 980px) {
        main {
          grid-template-columns: 1fr;
        }

        aside {
          max-height: none;
          border-left: 0;
          border-top: 2px solid var(--line);
        }
      }
    </style>
  </head>
  <body>
    <div class="app">
      <header>
        <div>
          <h1>${title}</h1>
          <p class="subtitle">${description}</p>
        </div>
        <nav class="header-actions" aria-label="Integration links">
          <a href="/${escapeHtml(slug)}/">Render</a>
          <a href="/${escapeHtml(slug)}/config.json">Manifest</a>
        </nav>
      </header>

      <main>
        <section class="preview" aria-label="Live preview">
          <div class="preview-toolbar">
            <label>
              Viewport
              <select id="viewport">
                <option value="800x480">800 x 480 landscape</option>
                <option value="480x800">480 x 800 portrait</option>
                <option value="1200x1600">1200 x 1600 portrait</option>
                <option value="1600x1200">1600 x 1200 landscape</option>
              </select>
            </label>
            <button id="reload" type="button">Reload</button>
            <p class="status" id="status">Loading preview.</p>
          </div>
          <div class="stage">
            <div class="device" id="device">
              <iframe id="preview" title="${title} preview"></iframe>
            </div>
          </div>
        </section>

        <aside aria-label="Settings">
          <div class="controls">
            <section class="group">
              <h2>Host</h2>
              <label>
                Language
                <select id="language"></select>
              </label>
              <label>
                Color
                <select id="color">${themeOptions}</select>
              </label>
            </section>

            <section class="group" id="settings-page-group" hidden>
              <h2>Settings Page</h2>
              <iframe class="settings-frame" id="settings-page" title="${title} settings"></iframe>
            </section>

            <section class="group">
              <h2>Settings</h2>
              <p class="warning" id="secret-warning" hidden>Public demo. Avoid entering real tokens or API keys.</p>
              <div id="form-fields"></div>
              <p class="empty" id="empty-fields" hidden>No generated settings.</p>
            </section>

            <section class="group">
              <h2>JSON</h2>
              <textarea id="settings-json" spellcheck="false"></textarea>
              <div class="buttons">
                <button id="apply-json" type="button">Apply JSON</button>
                <button id="reset" type="button">Reset</button>
              </div>
            </section>
          </div>
        </aside>
      </main>
    </div>

    <script>
      const config = ${configJson};
      const slug = ${slugJson};
      const renderPath = ${renderPathJson};
      const settingsPath = ${settingsPathJson};
      const colorThemes = ${serializeForScript(colorThemes)};

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
          color: colorValue
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
            pluginSettings
          }
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
            data: currentPayload()
          },
          window.location.origin
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
          ...nextSettings
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
          .map((code) => "<option value=\\"" + escapeText(code) + "\\">" + escapeText(code) + "</option>")
          .join("");
        language.value = languages[0] || "en";
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
      color.value = typeof settings.color === "string" ? settings.color : "light";
      renderControls();
      updateSettingsJson();

      if (settingsPath) {
        settingsPageGroup.hidden = false;
        settingsPage.src = settingsPath;
      }

      reloadPreview();
    </script>
  </body>
</html>`;
}
