#!/usr/bin/env node

// src/cli.ts
import { createCanvas as createCanvas2, loadImage as loadImage2 } from "@napi-rs/canvas";
import {
  ditherImage as ditherImage2,
  replaceColors as replaceColors2,
  suggestCanvasDitherOptions,
  suggestCanvasImageAdjustmentOptions
} from "epdoptimize";
import { mkdir as mkdir3, writeFile as writeFile3 } from "node:fs/promises";
import { dirname as dirname4, extname as extname2, resolve as resolve4 } from "node:path";

// src/devServer.ts
import { watch } from "node:fs";
import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// src/manifest.ts
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
function isLanguageCode(value) {
  return typeof value === "string" && /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(value.trim());
}
function validateConfig(config) {
  const errors = [];
  const warnings = [];
  if (!isRecord(config)) {
    return {
      valid: false,
      errors: ["config must be an object"],
      warnings
    };
  }
  if (typeof config.name !== "string" || config.name.trim() === "") {
    errors.push("name is required");
  }
  if (typeof config.version !== "string" || config.version.trim() === "") {
    errors.push("version is required");
  }
  if (typeof config.renderPage !== "string" || config.renderPage.trim() === "") {
    errors.push("renderPage is required");
  }
  if ("settingsPage" in config && typeof config.settingsPage !== "string") {
    errors.push("settingsPage must be a string");
  }
  if ("language" in config && (!Array.isArray(config.language) || config.language.some((language) => !isLanguageCode(language)))) {
    errors.push("language must be an array of non-empty language codes");
  }
  if ("nativeSettings" in config && !isRecord(config.nativeSettings)) {
    errors.push("nativeSettings must be an object");
  }
  if ("formSchema" in config && !isRecord(config.formSchema)) {
    errors.push("formSchema must be an object");
  }
  if (!("description" in config)) {
    warnings.push("description is missing");
  }
  if (!("nativeSettings" in config)) {
    warnings.push("nativeSettings is missing");
  }
  if (!("formSchema" in config)) {
    warnings.push("formSchema is missing");
  }
  if (typeof config.renderPage === "string" && isHttpUrl(config.renderPage)) {
    warnings.push("renderPage should usually be relative");
  }
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

// src/html.ts
function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

// src/previewHtml.ts
function serializeForScript(value) {
  return JSON.stringify(value ?? null).replace(/</g, "\\u003c");
}
var defaultPreviewFavicon = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#101315"/><path d="M8 10l6 6-6 6" fill="none" stroke="#f5f7f8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 23h8" fill="none" stroke="#f5f7f8" stroke-width="3" stroke-linecap="round"/></svg>'
)}`;
var icons = {
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
  terminal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 17 6-6-6-6"/><path d="M12 19h8"/></svg>'
};
function icon(name) {
  return icons[name];
}
function toPreviewAssetPath(value) {
  if (/^https?:\/\//.test(value)) {
    return value;
  }
  return `/${value.replace(/^\.?\//, "")}`;
}
function createPreviewHtml({
  config,
  configUrl,
  payload,
  renderPath,
  settingsPath
}) {
  const configJson = serializeForScript(config);
  const payloadJson = serializeForScript(payload);
  const renderPathJson = serializeForScript(renderPath);
  const settingsPathJson = serializeForScript(settingsPath);
  const title = escapeHtml(config.name);
  const version = escapeHtml(config.version);
  const renderPage = escapeHtml(config.renderPage);
  const settingsPage = config.settingsPage ? escapeHtml(config.settingsPage) : "";
  const settingsHref = settingsPath ? escapeHtml(settingsPath) : settingsPage;
  const escapedConfigUrl = escapeHtml(configUrl);
  const iconPath = typeof config.icon === "string" && config.icon.trim() ? toPreviewAssetPath(config.icon) : void 0;
  const topbarTitleClass = iconPath ? "topbar-title" : "topbar-title no-icon";
  const faviconPath = iconPath ?? defaultPreviewFavicon;
  const iconHtml = iconPath ? `<img class="integration-icon" src="${escapeHtml(iconPath)}" alt="" aria-hidden="true">` : "";
  const languageCodes = Array.isArray(config.language) ? config.language.filter((language) => typeof language === "string" && language.trim() !== "") : [];
  const languageFieldHtml = languageCodes.length > 0 ? `<label class="field">
              <span class="field-title">Language</span>
              <select id="language">
                ${languageCodes.map((language) => `<option value="${escapeHtml(language)}">${escapeHtml(language)}</option>`).join("\n                ")}
              </select>
            </label>` : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${title} - paperlesspaper preview</title>
    <link rel="icon" href="${escapeHtml(faviconPath)}" />
    <style>
      :root {
        color-scheme: light dark;
        --bg: #0b0d0e;
        --fg: #f5f7f8;
        --muted: #9aa4a9;
        --line: #273033;
        --panel: #14181a;
        --panel-2: #101315;
        --field: #090b0c;
        --accent: #f5f7f8;
        --accent-fg: #090b0c;
        --danger: #d4d8da;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: var(--bg);
        color: var(--fg);
        height: 100vh;
        overflow: hidden;
      }

      .app {
        height: 100vh;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
      }

      .topbar {
        background: var(--panel);
        border-bottom: 1px solid var(--line);
        display: grid;
        grid-template-columns: minmax(220px, 1fr) auto auto;
        align-items: center;
        gap: 14px;
        padding: 10px 14px;
        min-width: 0;
      }

      .topbar-title {
        min-width: 0;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        column-gap: 12px;
        row-gap: 2px;
        align-items: center;
      }

      .topbar-title.no-icon {
        grid-template-columns: minmax(0, 1fr);
      }

      .topbar-kicker {
        color: var(--accent);
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 750;
        letter-spacing: 0;
        text-transform: uppercase;
      }

      .title-copy {
        min-width: 0;
        display: grid;
        gap: 2px;
      }

      .integration-icon {
        width: 42px;
        height: 42px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #FFFFFF;
        object-fit: contain;
        padding: 5px;
      }

      .topbar-meta {
        color: var(--muted);
        font-size: 12px;
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .topbar-controls,
      .topbar-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .topbar-actions {
        justify-content: flex-end;
      }

      .workspace {
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(300px, 360px) minmax(0, 1fr);
      }

      .sidebar {
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-color: var(--line) transparent;
        border-right: 1px solid var(--line);
        background: var(--panel);
        padding: 14px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      main {
        min-width: 0;
        min-height: 0;
        display: grid;
        place-items: center;
        padding: 24px;
        overflow: hidden;
      }

      h1 {
        font-size: 17px;
        line-height: 1.25;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .meta {
        color: var(--muted);
        font-size: 13px;
        line-height: 1.4;
        overflow-wrap: anywhere;
      }

      label {
        display: grid;
        gap: 6px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 650;
        text-transform: uppercase;
      }

      .topbar label {
        min-width: 150px;
      }

      .viewport-control {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      }

      .viewport-presets {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .topbar .viewport-preset {
        width: 34px;
        padding: 0;
      }

      .viewport-preset[aria-pressed="true"] {
        background: var(--accent);
        border-color: var(--accent);
        color: var(--accent-fg);
      }

      .viewport-symbol {
        border: 2px solid currentColor;
        border-radius: 3px;
        display: grid;
        place-items: center;
        font-size: 10px;
        font-weight: 800;
        line-height: 1;
      }

      .viewport-symbol.portrait {
        width: 13px;
        height: 22px;
      }

      .viewport-symbol.landscape {
        width: 22px;
        height: 13px;
      }

      .viewport-control select {
        width: 190px;
      }

      select,
      input,
      textarea,
      button {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 6px;
        font: inherit;
      }

      select,
      input,
      textarea {
        background: var(--field);
        color: var(--fg);
      }

      select,
      input {
        height: 38px;
        padding: 0 10px;
      }

      .topbar select,
      .topbar input {
        height: 34px;
      }

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: var(--accent);
      }

      textarea {
        min-height: 160px;
        resize: vertical;
        padding: 10px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        line-height: 1.45;
      }

      .actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      button {
        height: 38px;
        cursor: pointer;
        background: var(--panel-2);
        color: var(--fg);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        font-weight: 650;
        white-space: nowrap;
      }

      .topbar button {
        width: auto;
        height: 34px;
        padding: 0 11px;
      }

      .button-icon {
        width: 16px;
        height: 16px;
        display: inline-flex;
        flex: 0 0 auto;
      }

      .button-icon svg {
        width: 16px;
        height: 16px;
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      button.primary {
        background: var(--accent);
        border-color: var(--accent);
        color: var(--accent-fg);
      }

      button:disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }

      .status {
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 10px;
        font-size: 13px;
        line-height: 1.4;
        background: var(--panel-2);
      }

      .status strong {
        display: block;
        margin-bottom: 2px;
      }

      .frame-wrap {
        display: grid;
        place-items: center;
        width: 100%;
        height: 100%;
        max-width: 100%;
        overflow: auto;
      }

      .device {
        background: #000000;
        border: 1px solid var(--line);
        box-shadow: 0 18px 60px rgb(0 0 0 / 0.18);
        position: relative;
        width: var(--preview-width);
        height: var(--preview-height);
      }

      iframe,
      .rendered-preview {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
        background: #FFFFFF;
      }

      .rendered-preview {
        object-fit: contain;
      }

      iframe[hidden],
      .rendered-preview[hidden] {
        display: none;
      }

      .settings-form {
        display: grid;
        gap: 10px;
      }

      .field {
        display: grid;
        gap: 6px;
      }

      .field-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 650;
        text-transform: uppercase;
      }

      .field-title {
        color: var(--muted);
        font-size: 12px;
        font-weight: 650;
        line-height: 1.25;
        text-transform: uppercase;
      }

      .field-help {
        margin: 0;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.35;
      }

      details {
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--panel-2);
      }

      summary {
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 7px;
        list-style: none;
        padding: 10px;
        color: var(--muted);
        font-size: 12px;
        font-weight: 650;
        text-transform: uppercase;
      }

      summary::-webkit-details-marker {
        display: none;
      }

      summary::before {
        content: "";
        width: 0;
        height: 0;
        border-top: 4px solid transparent;
        border-bottom: 4px solid transparent;
        border-left: 5px solid currentColor;
        transform-origin: 50% 50%;
      }

      details[open] > summary::before {
        transform: rotate(90deg);
      }

      summary .button-icon {
        color: var(--accent);
      }

      details > .details-body {
        display: grid;
        gap: 10px;
        padding: 0 10px 10px;
      }

      a {
        color: var(--accent);
      }

      .settings-page-frame {
        width: 100%;
        height: 220px;
        min-height: 160px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: #FFFFFF;
      }

      .renderer-preview {
        display: grid;
        gap: 10px;
      }

      .renderer-preview .actions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .manifest-preview {
        display: grid;
        gap: 10px;
      }

      .variants-header {
        display: grid;
        gap: 8px;
      }

      .variants-header .actions {
        grid-template-columns: 1fr;
      }

      .variants-list {
        display: grid;
        gap: 10px;
      }

      .variant-card {
        border: 1px solid var(--line);
        border-radius: 6px;
        overflow: hidden;
        background: var(--field);
      }

      .variant-card-header {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
        padding: 8px;
      }

      .variant-card-header button {
        width: auto;
        padding: 0 10px;
      }

      .variant-title {
        color: var(--fg);
        font-size: 12px;
        font-weight: 750;
        line-height: 1.25;
        overflow-wrap: anywhere;
      }

      .variant-settings {
        margin: 0;
        padding: 0 8px 8px;
        color: var(--muted);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        font-size: 11px;
        line-height: 1.35;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .variant-screenshots {
        display: grid;
        gap: 8px;
        padding: 0 8px 8px;
      }

      .variant-screenshot {
        display: grid;
        gap: 5px;
        margin: 0;
      }

      .variant-screenshot img {
        width: 100%;
        aspect-ratio: 5 / 3;
        border: 1px solid var(--line);
        border-radius: 4px;
        background: #FFFFFF;
        object-fit: contain;
      }

      .variant-screenshot figcaption {
        color: var(--muted);
        font-size: 11px;
        line-height: 1.3;
        overflow-wrap: anywhere;
      }

      .sidebar-footer {
        margin-top: auto;
        padding-top: 2px;
      }

      @media (max-width: 820px) {
        body {
          height: auto;
          overflow: auto;
        }

        .app {
          height: auto;
          min-height: 100vh;
        }

        .topbar {
          grid-template-columns: 1fr;
          align-items: stretch;
        }

        .topbar-controls,
        .topbar-actions {
          flex-wrap: wrap;
        }

        .topbar-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .topbar-actions button {
          width: 100%;
        }

        .topbar label {
          min-width: min(180px, 100%);
          flex: 1 1 180px;
        }

        .workspace {
          grid-template-columns: 1fr;
        }

        .sidebar {
          max-height: 52vh;
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }

        main {
          padding: 14px;
          min-height: 48vh;
        }
      }
    </style>
  </head>
  <body>
    <div class="app">
      <header class="topbar">
        <div class="${topbarTitleClass}">
          ${iconHtml}
          <div class="title-copy">
            <div class="topbar-kicker"><span class="button-icon">${icon("terminal")}</span>OpenIntegration preview</div>
            <h1>${title}</h1>
            <div class="topbar-meta">v${version} \xB7 ${renderPage}</div>
          </div>
        </div>

        <div class="topbar-controls">
          <div class="viewport-control">
            <div class="viewport-presets" aria-label="Viewport presets">
              <button type="button" class="viewport-preset" data-viewport="480x800" title="480 x 800 portrait" aria-label="480 x 800 portrait"><span class="viewport-symbol portrait">7</span></button>
              <button type="button" class="viewport-preset" data-viewport="800x480" title="800 x 480 landscape" aria-label="800 x 480 landscape"><span class="viewport-symbol landscape">7</span></button>
              <button type="button" class="viewport-preset" data-viewport="1200x1600" title="1200 x 1600 portrait" aria-label="1200 x 1600 portrait"><span class="viewport-symbol portrait">L</span></button>
              <button type="button" class="viewport-preset" data-viewport="1600x1200" title="1600 x 1200 landscape" aria-label="1600 x 1200 landscape"><span class="viewport-symbol landscape">L</span></button>
            </div>
            <select id="viewport" aria-label="Viewport">
              <option value="800x480">800 x 480 landscape</option>
              <option value="480x800">480 x 800 portrait</option>
              <option value="1600x1200">1600 x 1200 landscape</option>
              <option value="1200x1600">1200 x 1600 portrait</option>
              <option value="1024x758">1024 x 758 landscape</option>
              <option value="758x1024">758 x 1024 portrait</option>
              <option value="1200x825">1200 x 825 landscape</option>
              <option value="825x1200">825 x 1200 portrait</option>
            </select>
          </div>
        </div>

        <div class="topbar-actions">
          <button class="primary" id="send" title="Send INIT"><span class="button-icon">${icon("send")}</span><span>Send INIT</span></button>
          <button id="reload" title="Reload preview"><span class="button-icon">${icon("refresh")}</span><span>Reload</span></button>
          <button id="reset" title="Reset saved preview values"><span class="button-icon">${icon("reset")}</span><span>Reset</span></button>
        </div>
      </header>

      <div class="workspace">
        <aside class="sidebar">
        ${settingsPage ? `<details open>
          <summary><span class="button-icon">${icon("settings")}</span><span>Settings Page</span></summary>
          <div class="details-body">
            <a href="${settingsHref}" target="_blank" rel="noreferrer">${settingsPage}</a>
            <iframe class="settings-page-frame" id="settings-page" title="${title} settings preview"></iframe>
          </div>
        </details>` : ""}

        <details open>
          <summary><span class="button-icon">${icon("form")}</span><span>Form Settings</span></summary>
          <div class="details-body">
            <label class="field">
              <span class="field-title">Color</span>
              <select id="color">
                <option value="">none</option>
                <option value="dark">dark</option>
                <option value="light">light</option>
                <option value="red-dark">red-dark</option>
                <option value="red-light">red-light</option>
                <option value="blue-dark">blue-dark</option>
                <option value="blue-light">blue-light</option>
                <option value="green-dark">green-dark</option>
                <option value="green-light">green-light</option>
              </select>
            </label>
            ${languageFieldHtml}
            <div class="settings-form" id="form-fields"></div>
          </div>
        </details>

        <details>
          <summary><span class="button-icon">${icon("fileJson")}</span><span>pluginSettings JSON</span></summary>
          <div class="details-body">
            <textarea id="settings" spellcheck="false"></textarea>
          </div>
        </details>

        <div class="status" id="status">
          <strong>Booting</strong>
          Waiting for the iframe.
        </div>

        <details open>
          <summary><span class="button-icon">${icon("pulse")}</span><span>Diagnostics</span></summary>
          <div class="details-body">
            <div class="status" id="dev-status">
              <strong>Dev server</strong>
              Connecting to file watcher.
            </div>
            <div class="status" id="render-status">
              <strong>Render</strong>
              Not rendered yet.
            </div>
            <div class="status" id="schema-status">
              <strong>Settings schema</strong>
              Waiting for manifest.
            </div>
          </div>
        </details>

        <details open>
          <summary><span class="button-icon">${icon("image")}</span><span>Config Variants</span></summary>
          <div class="details-body manifest-preview">
            <div class="variants-header">
              <div class="status" id="variants-status">
                <strong>Variants</strong>
                Waiting for manifest.
              </div>
              <div class="actions">
                <button id="regenerate-variants" title="Regenerate configured screenshots"><span class="button-icon">${icon("refresh")}</span><span>Regenerate</span></button>
              </div>
            </div>
            <div class="variants-list" id="variants-list"></div>
          </div>
        </details>

        <details open>
          <summary><span class="button-icon">${icon("monitor")}</span><span>Renderer</span></summary>
          <div class="details-body renderer-preview">
            <div class="actions">
              <button id="puppeteer-render" title="Show raw Puppeteer output"><span class="button-icon">${icon("monitor")}</span><span>Puppeteer</span></button>
              <button class="primary" id="epd-render" title="Show epdoptimize output"><span class="button-icon">${icon("cpu")}</span><span>EPD</span></button>
              <button id="show-live" title="Show live iframe preview"><span class="button-icon">${icon("eye")}</span><span>Live</span></button>
              <button id="renderer-download" disabled title="Download current render"><span class="button-icon">${icon("download")}</span><span>Download</span></button>
            </div>
            <div class="status" id="renderer-status">
              <strong>Renderer</strong>
              Not rendered yet.
            </div>
          </div>
        </details>

        <div class="meta sidebar-footer">Config: ${escapedConfigUrl}</div>
      </aside>

      <main>
        <div class="frame-wrap">
          <div class="device">
            <iframe id="preview" title="${title} render preview"></iframe>
            <img class="rendered-preview" id="rendered-preview" alt="${title} render output preview" hidden>
          </div>
        </div>
      </main>
      </div>
    </div>

    <script>
      const config = ${configJson};
      const basePayload = ${payloadJson};
      const renderPath = ${renderPathJson};
      const settingsPath = ${settingsPathJson};
      const iframe = document.querySelector("#preview");
      const renderedPreview = document.querySelector("#rendered-preview");
      const settingsFrame = document.querySelector("#settings-page");
      const formFields = document.querySelector("#form-fields");
      const settings = document.querySelector("#settings");
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
      const language = document.querySelector("#language");
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
        "green-light"
      ];
      let monitorTimer;
      let timeoutTimer;
      let reloadTimer;
      let syncingJson = false;
      let cacheSuppressed = false;
      let deviceObjectUrl;
      let rendererDownloadName;

      const defaultPluginSettings = basePayload.meta.pluginSettings || {};
      const defaultSettingsValue = JSON.stringify(defaultPluginSettings, null, 2);
      const defaultColorValue =
        typeof defaultPluginSettings.color === "string" ? defaultPluginSettings.color : basePayload.meta.color || "";
      const defaultLanguageValue = typeof basePayload.meta.language === "string" ? basePayload.meta.language : "";
      const defaultViewportValue = viewport.value;
      const storageKey = [
        "paperlesspaper-openintegration",
        config.name,
        config.version,
        renderPath
      ].join(":");

      settings.value = defaultSettingsValue;
      selectValue(color, defaultColorValue, "");
      if (language) {
        selectValue(language, defaultLanguageValue, language.options[0]?.value || "");
      }
      syncSettingsColorFromSelect();

      function isObject(value) {
        return Boolean(value) && typeof value === "object" && !Array.isArray(value);
      }

      function setStatus(title, detail) {
        status.innerHTML = "<strong>" + title + "</strong>" + detail;
      }

      function setPanel(panel, title, detail) {
        panel.innerHTML = "<strong>" + title + "</strong>" + detail;
      }

      function escapeText(value) {
        return String(value).replace(/[&<>"']/g, (char) => {
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

        const url = /^https?:\\/\\//.test(value)
          ? new URL(value)
          : new URL(value.replace(/^\\.?\\//, "/"), window.location.href);

        if (cacheBust) {
          url.searchParams.set("t", String(cacheBust));
        }

        return url.href;
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

        return "Variant " + (index + 1) + (parts.length ? " \xB7 " + parts.join(" \xB7 ") : "");
      }

      function variantSettingsSummary(variant) {
        const values = settingsFromVariant(variant);
        const text = JSON.stringify(values, null, 2);

        if (text.length <= 360) {
          return text;
        }

        return text.slice(0, 357) + "...";
      }

      function selectValue(select, value, fallback) {
        if ([...select.options].some((option) => option.value === value)) {
          select.value = value;
          return;
        }

        select.value = fallback;
      }

      function syncViewportPresets() {
        viewportPresets.forEach((button) => {
          button.setAttribute("aria-pressed", button.dataset.viewport === viewport.value ? "true" : "false");
        });
      }

      function parseEditablePluginSettings() {
        try {
          const values = JSON.parse(settings.value || "{}");
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
        settings.value = JSON.stringify(values, null, 2);
        syncingJson = false;
      }

      function syncColorFromJson() {
        try {
          const values = JSON.parse(settings.value || "{}");

          if (!isObject(values)) {
            return;
          }

          selectValue(color, typeof values.color === "string" ? values.color : "", "");
        } catch {
          // Keep the current select value while the raw JSON is being edited.
        }
      }

      function updatePluginSettings(nextSettings, reason) {
        if (!isObject(nextSettings)) {
          return;
        }

        const values = {
          ...parseEditablePluginSettings(),
          ...nextSettings
        };

        if (color.value) {
          values.color = color.value;
        } else if (Object.prototype.hasOwnProperty.call(nextSettings, "color")) {
          delete values.color;
        }

        syncingJson = true;
        settings.value = JSON.stringify(values, null, 2);
        syncingJson = false;
        syncFormFromJson();
        syncColorFromJson();
        cacheState(reason);
        scheduleReload(reason);
        sendSettingsPageInit();
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
              settings: settings.value,
              viewport: viewport.value
            })
          );
          setPanel(devStatus, "Cached", reason);
        } catch (error) {
          setPanel(devStatus, "Cache unavailable", String(error.message || error));
        }
      }

      function hydrateCachedState() {
        const state = readCachedState();

        if (typeof state.settings === "string") {
          settings.value = state.settings;
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

        settings.value = defaultSettingsValue;
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
          pluginSettings = JSON.parse(settings.value || "{}");
        } catch (error) {
          throw new Error("pluginSettings is not valid JSON: " + error.message);
        }

        if (color.value) {
          pluginSettings = {
            ...pluginSettings,
            color: color.value
          };
        }

        return {
          ...basePayload,
          meta: {
            ...basePayload.meta,
            color: color.value || undefined,
            language: language?.value || basePayload.meta.language,
            pluginSettings
          }
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
              data: currentPayload()
            },
            window.location.origin
          );
        } catch {
          // The settings frame may still be navigating.
        }
      }

      function revokeDeviceObjectUrl() {
        if (deviceObjectUrl) {
          URL.revokeObjectURL(deviceObjectUrl);
          deviceObjectUrl = undefined;
        }
      }

      function showLivePreview() {
        renderedPreview.hidden = true;
        renderedPreview.removeAttribute("src");
        iframe.hidden = false;
        rendererDownload.disabled = true;
        rendererDownloadName = undefined;
        revokeDeviceObjectUrl();
      }

      function showRenderedPreview(objectUrl) {
        renderedPreview.src = objectUrl;
        renderedPreview.hidden = false;
        iframe.hidden = true;
      }

      function downloadName(suffix) {
        const name = (config.name || "openintegration").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const slug = name.replace(/^-|-$/g, "") || "openintegration";
        return slug + "-" + suffix + ".png";
      }

      function fieldValueFromSettings(name, schema, values) {
        if (Object.prototype.hasOwnProperty.call(values, name)) {
          return values[name];
        }

        if (Object.prototype.hasOwnProperty.call(schema, "default")) {
          return schema.default;
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
          values = JSON.parse(settings.value || "{}");
        } catch {
          values = {};
        }

        for (const element of formFields.querySelectorAll("[data-setting-name]")) {
          const name = element.dataset.settingName;
          const property = config.formSchema?.properties?.[name] || {};
          values[name] = coerceFieldValue(element, property);
        }

        syncingJson = true;
        settings.value = JSON.stringify(values, null, 2);
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
          values = JSON.parse(settings.value || "{}");
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
            input.type = property.type === "number" || property.type === "integer" ? "number" : "text";

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

      function renderFormFields() {
        formFields.innerHTML = "";
        const schema = config.formSchema;

        if (!isObject(schema) || schema.type !== "object" || !isObject(schema.properties)) {
          setPanel(schemaStatus, "Settings schema", "No object formSchema found.");
          return;
        }

        const required = Array.isArray(schema.required) ? schema.required : [];

        for (const [name, property] of Object.entries(schema.properties)) {
          if (name === "color" || !isObject(property)) {
            continue;
          }

          if (property.inStettingsPage === true || property.inStettingsPage === "true") {
            continue;
          }

          formFields.append(createField(name, property, required.includes(name)));
        }

        syncFormFromJson();
        setPanel(schemaStatus, "Settings schema", formFields.children.length + " generated field(s).");
      }

      function applyVariant(variant, index) {
        const nextSettings = settingsFromVariant(variant);

        syncingJson = true;
        settings.value = JSON.stringify(nextSettings, null, 2);
        syncingJson = false;
        syncColorFromJson();
        syncFormFromJson();
        cacheState("Variant " + (index + 1) + " applied.");
        reloadFrame();
      }

      function renderConfigVariants(cacheBust) {
        variantsList.innerHTML = "";
        const variants = Array.isArray(config.configVariants) ? config.configVariants : [];

        if (variants.length === 0) {
          setPanel(variantsStatus, "Variants", "No configVariants found.");
          regenerateVariants.disabled = true;
          return;
        }

        regenerateVariants.disabled = false;

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
              caption.textContent = size + " \xB7 " + path;

              figure.append(image, caption);
              grid.append(figure);
            }

            card.append(grid);
          }

          variantsList.append(card);
        });

        setPanel(variantsStatus, "Variants", variants.length + " configured variant(s).");
      }

      async function regenerateConfigVariantScreenshots() {
        const started = Date.now();

        regenerateVariants.disabled = true;
        setPanel(variantsStatus, "Regenerating", "Rendering configured screenshots.");

        try {
          const response = await fetch("/__paperless/config-variants/regenerate", {
            method: "POST"
          });
          const result = await response.json();
          const failures = Array.isArray(result.results)
            ? result.results.filter((entry) => entry && entry.ok === false)
            : [];

          renderConfigVariants(Date.now());

          if (!response.ok || failures.length > 0) {
            const detail = failures.slice(0, 3)
              .map((entry) => escapeText(entry.viewport || "unknown") + ": " + escapeText(entry.reason || "failed"))
              .join("<br>");
            setPanel(variantsStatus, "Regeneration failed", detail || "Could not regenerate screenshots.");
            return;
          }

          setPanel(
            variantsStatus,
            "Screenshots regenerated",
            String(result.generated || 0) + " file(s) in " + (Date.now() - started) + "ms."
          );
        } catch (error) {
          setPanel(variantsStatus, "Regeneration failed", escapeText(error.message || error));
        } finally {
          regenerateVariants.disabled = false;
        }
      }

      function frameUrl() {
        const url = new URL(renderPath, window.location.href);
        return url.href;
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
              data: payload
            },
            window.location.origin
          );
          setStatus("INIT sent", "Waiting for ready marker.");
          setPanel(renderStatus, "Render", "INIT sent to iframe.");
          monitorReady();
        } catch (error) {
          setStatus("Settings error", String(error.message || error));
          setPanel(renderStatus, "Settings error", String(error.message || error));
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
        setPanel(renderStatus, "Loading iframe", frameUrl());
        iframe.src = frameUrl();
      }

      function scheduleReload(reason) {
        clearTimeout(reloadTimer);
        setPanel(renderStatus, "Reload queued", reason);
        reloadTimer = setTimeout(reloadFrame, 250);
      }

      function reloadSettingsFrame() {
        if (!settingsFrame || !settingsPath) {
          return;
        }

        const url = new URL(settingsPath, window.location.href);
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

        if (
          message.source === "paperlesspaper-plugin" &&
          message.type === "UPDATE_SETTINGS" &&
          isObject(message.payload)
        ) {
          return message.payload;
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

        if (
          message.source === "paperlesspaper-plugin" &&
          message.type === "SET_HEIGHT"
        ) {
          const nextHeight = Number(message.payload?.height);

          if (Number.isFinite(nextHeight) && nextHeight > 0) {
            settingsFrame.style.height = Math.ceil(nextHeight) + "px";
          }

          return;
        }

        if (message.type === "paperlesspaper:settings:height") {
          const nextHeight = Number(message.height);

          if (Number.isFinite(nextHeight) && nextHeight > 0) {
            settingsFrame.style.height = Math.ceil(nextHeight) + "px";
          }

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

      async function renderWithPuppeteerOutput({ optimize, pendingTitle, pendingDetail, readyTitle, failedTitle, downloadSuffix }) {
        showLivePreview();

        try {
          const [width, height] = viewport.value.split("x").map(Number);
          const payload = currentPayload();
          setPanel(rendererStatus, pendingTitle, pendingDetail);
          const response = await fetch("/__paperless/render", {
            body: JSON.stringify({
              color: color.value || undefined,
              height,
              optimize,
              payload,
              width
            }),
            headers: {
              "Content-Type": "application/json"
            },
            method: "POST"
          });

          if (!response.ok) {
            throw new Error(await response.text());
          }

          const blob = await response.blob();
          deviceObjectUrl = URL.createObjectURL(blob);
          const image = new Image();
          image.src = deviceObjectUrl;
          await image.decode();
          showRenderedPreview(deviceObjectUrl);
          rendererDownloadName = downloadName(downloadSuffix);
          rendererDownload.disabled = false;

          const details = [
            image.width + "x" + image.height,
            "ready marker: " + response.headers.get("X-Paperless-Render-Ready"),
            "optimized: " + response.headers.get("X-Paperless-Render-Optimized")
          ];

          if (optimize) {
            details.push(
              "image kind: " + (response.headers.get("X-Paperless-Epd-Image-Kind") || "unknown"),
              "preset: " + (response.headers.get("X-Paperless-Epd-Processing-Preset") || "auto"),
              "device colors: " + (response.headers.get("X-Paperless-Epd-Used-Colors") || "none")
            );
          } else {
            details.push("PNG generated by local Chrome");
          }

          setPanel(
            rendererStatus,
            readyTitle,
            details.map(escapeText).join("<br>")
          );
        } catch (error) {
          showLivePreview();
          setPanel(rendererStatus, failedTitle, escapeText(error.message || error));
        }
      }

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
      regenerateVariants.addEventListener("click", regenerateConfigVariantScreenshots);
      document.querySelector("#puppeteer-render").addEventListener("click", () => {
        renderWithPuppeteerOutput({
          downloadSuffix: "puppeteer",
          failedTitle: "Puppeteer render failed",
          optimize: false,
          pendingDetail: "Rendering with local Chrome.",
          pendingTitle: "Puppeteer",
          readyTitle: "Puppeteer render ready"
        });
      });
      document.querySelector("#epd-render").addEventListener("click", () => {
        renderWithPuppeteerOutput({
          downloadSuffix: "device",
          failedTitle: "EPD render failed",
          optimize: true,
          pendingDetail: "Rendering with local Chrome and epdoptimize.",
          pendingTitle: "EPD optimize",
          readyTitle: "EPD render ready"
        });
      });
      document.querySelector("#show-live").addEventListener("click", () => {
        showLivePreview();
        setPanel(rendererStatus, "Live preview", "Showing iframe preview.");
      });
      rendererDownload.addEventListener("click", () => {
        if (!deviceObjectUrl) {
          return;
        }

        const link = document.createElement("a");
        link.href = deviceObjectUrl;
        link.download = rendererDownloadName || downloadName("render");
        link.click();
      });
      viewport.addEventListener("change", () => {
        updateViewport();
      });
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
      settings.addEventListener("input", () => {
        syncFormFromJson();
        syncColorFromJson();
        cacheState("Raw settings saved.");
        scheduleReload("Raw settings changed");
      });

      if (window.EventSource) {
        const events = new EventSource("/__paperless/events");
        events.addEventListener("ready", (event) => {
          const data = JSON.parse(event.data);
          setPanel(devStatus, "Dev server", data.watch ? "Watching files." : "File watch disabled.");
        });
        events.addEventListener("reload", (event) => {
          const data = JSON.parse(event.data);
          const file = data.file || "integration file";
          setPanel(devStatus, "File changed", file);
          reloadFrame();
          reloadSettingsFrame();
        });
        events.onerror = () => {
          setPanel(devStatus, "Dev server", "Live reload disconnected.");
        };
      } else {
        setPanel(devStatus, "Dev server", "EventSource is not available.");
      }

      hydrateCachedState();
      renderFormFields();
      renderConfigVariants();
      applyViewport();
      reloadSettingsFrame();
      reloadFrame();
    </script>
  </body>
</html>`;
}

// src/epdOptimize.ts
import { createCanvas, loadImage } from "@napi-rs/canvas";
import {
  ditherImage,
  replaceColors,
  suggestCanvasProcessingOptions
} from "epdoptimize";

// src/epdOptimizeMeta.ts
import {
  acepPalette,
  aitjcizeSpectra6Palette,
  defaultPalette,
  gameboyPalette,
  genericFourGrayscalePalette,
  genericTwoColorEinkPalette,
  spectra6BoeberPalette,
  spectra6legacyPalette,
  spectra6OriginalPalette,
  spectra6OriginalPreviewPalette,
  spectra6Palette,
  trmnlSeeed16GrayscalePalette
} from "epdoptimize";
var EPD_OPTIMIZE_META_NAME = "paperless:epd-optimize";
var DEFAULT_EPD_OPTIMIZE_PALETTE_NAME = "aitjcizeSpectra6Palette";
var EPD_OPTIMIZE_INTENTS = /* @__PURE__ */ new Set([
  "faithful",
  "lowNoise",
  "natural",
  "readable",
  "vivid"
]);
var EPD_OPTIMIZE_PALETTES = {
  acepPalette,
  aitjcizeSpectra6Palette,
  defaultPalette,
  gameboyPalette,
  genericFourGrayscalePalette,
  genericTwoColorEinkPalette,
  spectra6BoeberPalette,
  spectra6legacyPalette,
  spectra6OriginalPalette,
  spectra6OriginalPreviewPalette,
  spectra6Palette,
  trmnlSeeed16GrayscalePalette
};
var ditherOptionKeys = /* @__PURE__ */ new Set([
  "adjustmentEngine",
  "algorithm",
  "calibrate",
  "clarity",
  "colorMatching",
  "ditheringType",
  "dynamicRangeCompression",
  "edgeAntialiasing",
  "edgePreservation",
  "errorDiffusionMatrix",
  "levelCompression",
  "numberOfSampleColors",
  "orderedDitheringMatrix",
  "orderedDitheringType",
  "paperNormalization",
  "preview",
  "processingEngine",
  "processingPreset",
  "randomDitheringType",
  "sampleColorsFromImage",
  "serpentine",
  "toneMapping"
]);
function isRecord2(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function isEpdOptimizeIntent(value) {
  return typeof value === "string" && EPD_OPTIMIZE_INTENTS.has(value);
}
function isEpdOptimizePaletteName(value) {
  return typeof value === "string" && value in EPD_OPTIMIZE_PALETTES;
}
function normalizeMetaOptions(value) {
  if (!isRecord2(value)) {
    return {};
  }
  const options = {};
  for (const [key, optionValue] of Object.entries(value)) {
    if (ditherOptionKeys.has(key)) {
      options[key] = optionValue;
    }
  }
  return options;
}
function normalizeEpdOptimizeSettings(value) {
  if (typeof value === "boolean") {
    return { enabled: value };
  }
  if (isEpdOptimizeIntent(value)) {
    return { intent: value };
  }
  if (!isRecord2(value)) {
    return void 0;
  }
  const settings = {};
  const options = {
    ...normalizeMetaOptions(value),
    ...normalizeMetaOptions(value.adjustmentOptions),
    ...normalizeMetaOptions(value.imageAdjustmentOptions),
    ...normalizeMetaOptions(value.canvasImageAdjustmentOptions),
    ...normalizeMetaOptions(value.ditherOptions),
    ...normalizeMetaOptions(value.canvasDitherOptions),
    ...normalizeMetaOptions(value.options)
  };
  if (typeof value.enabled === "boolean") {
    settings.enabled = value.enabled;
  }
  if (isEpdOptimizeIntent(value.intent)) {
    settings.intent = value.intent;
  }
  const paletteName = value.palette ?? value.paletteName;
  if (isEpdOptimizePaletteName(paletteName)) {
    settings.paletteName = paletteName;
  }
  if (Object.keys(options).length > 0) {
    settings.options = options;
  }
  return Object.keys(settings).length > 0 ? settings : void 0;
}
function parseEpdOptimizeMetaContent(content) {
  const trimmed = content?.trim();
  if (!trimmed) {
    return void 0;
  }
  const shorthand = normalizeEpdOptimizeSettings(trimmed);
  if (shorthand) {
    return shorthand;
  }
  try {
    return normalizeEpdOptimizeSettings(JSON.parse(trimmed));
  } catch {
    return void 0;
  }
}
function resolveEpdOptimizePalette(name) {
  return EPD_OPTIMIZE_PALETTES[name ?? DEFAULT_EPD_OPTIMIZE_PALETTE_NAME];
}

// src/epdOptimize.ts
function asCanvasLike(canvas) {
  return canvas;
}
function getProcessingPreset(options) {
  return typeof options.processingPreset === "string" ? options.processingPreset : void 0;
}
function rgbToHex(red, green, blue) {
  return `#${[red, green, blue].map((channel) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}
function getUsedDeviceColors(canvas, palette) {
  const deviceColors = new Set(palette.map((entry) => entry.deviceColor.toUpperCase()));
  const context = canvas.getContext("2d");
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const used = /* @__PURE__ */ new Set();
  for (let index = 0; index < image.data.length; index += 4) {
    const color = rgbToHex(image.data[index], image.data[index + 1], image.data[index + 2]);
    if (deviceColors.has(color)) {
      used.add(color);
    }
  }
  return Array.from(used).sort();
}
async function optimizePngForSpectra6(sourcePng, { height, intent = "readable", options = {}, paletteName, width }) {
  const palette = resolveEpdOptimizePalette(paletteName);
  const image = await loadImage(sourcePng);
  const inputCanvas = createCanvas(width, height);
  const inputContext = inputCanvas.getContext("2d");
  inputContext.drawImage(image, 0, 0, width, height);
  const ditheredCanvas = createCanvas(width, height);
  const deviceCanvas = createCanvas(width, height);
  const suggestion = suggestCanvasProcessingOptions(
    asCanvasLike(inputCanvas),
    palette,
    { intent }
  );
  await ditherImage(asCanvasLike(inputCanvas), asCanvasLike(ditheredCanvas), {
    ...suggestion.ditherOptions,
    ...options,
    palette
  });
  replaceColors(asCanvasLike(ditheredCanvas), asCanvasLike(deviceCanvas), palette);
  return {
    buffer: deviceCanvas.toBuffer("image/png"),
    height,
    imageKind: suggestion.imageKind,
    intent: suggestion.intent,
    processingPreset: getProcessingPreset(suggestion.ditherOptions),
    reasons: suggestion.reasons,
    usedColors: getUsedDeviceColors(deviceCanvas, palette),
    width
  };
}

// src/puppeteerRender.ts
var MAC_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
var PUPPETEER_CHROME_ARGS = [
  "--no-sandbox",
  "--disable-font-subpixel-positioning",
  "--disable-lcd-text",
  "--font-render-hinting=none"
];
var COLOR_THEME_CLASSES = [
  "dark",
  "light",
  "red-dark",
  "red-light",
  "blue-dark",
  "blue-light",
  "green-dark",
  "green-light",
  "black",
  "white",
  "blue",
  "green",
  "red",
  "yellow"
];
function resolveChromePath(chromePath) {
  return chromePath || process.env.CHROME_BIN || process.env.PUPPETEER_EXECUTABLE_PATH || (process.platform === "darwin" ? MAC_CHROME_PATH : void 0);
}
async function readEpdOptimizeMetaSettings(page) {
  const content = await page.evaluate((metaName) => {
    return document.querySelector(`meta[name="${metaName}"]`)?.getAttribute("content");
  }, EPD_OPTIMIZE_META_NAME);
  return parseEpdOptimizeMetaContent(content);
}
async function waitForOptionalNetworkIdle(page) {
  const waitForNetworkIdle = page.waitForNetworkIdle?.bind(page);
  if (!waitForNetworkIdle) {
    return;
  }
  await waitForNetworkIdle({ idleTime: 500, timeout: 5e3 }).catch(() => void 0);
}
async function postInitPayload(page, payload) {
  if (!payload) {
    return;
  }
  await page.evaluate((data, colorThemeClasses) => {
    const payloadRecord = data && typeof data === "object" && !Array.isArray(data) ? data : void 0;
    const meta = payloadRecord?.meta && typeof payloadRecord.meta === "object" && !Array.isArray(payloadRecord.meta) ? payloadRecord.meta : void 0;
    const pluginSettings = meta?.pluginSettings && typeof meta.pluginSettings === "object" && !Array.isArray(meta.pluginSettings) ? meta.pluginSettings : void 0;
    const settingsColor = pluginSettings && typeof pluginSettings.color === "string" ? pluginSettings.color : void 0;
    const color = typeof settingsColor === "string" ? settingsColor : typeof meta?.color === "string" ? meta.color : void 0;
    document.body.classList.remove(...colorThemeClasses);
    if (color && colorThemeClasses.includes(color)) {
      document.body.classList.add(color);
    }
    window.postMessage(
      {
        cmd: "message",
        data,
        type: "INIT"
      },
      "*"
    );
  }, payload, COLOR_THEME_CLASSES);
}
async function waitForReady(page, timeoutMs) {
  try {
    await page.waitForSelector("#website-has-loaded", { timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
}
async function renderUrlWithPuppeteer({
  chromePath,
  height,
  optimize = true,
  payload,
  readyTimeoutMs = 15e3,
  url,
  width
}) {
  const puppeteer = await import("puppeteer-core");
  let browser;
  try {
    browser = await puppeteer.launch({
      args: PUPPETEER_CHROME_ARGS,
      executablePath: resolveChromePath(chromePath),
      headless: true
    });
    const page = await browser.newPage();
    await page.setViewport({
      deviceScaleFactor: 1,
      height,
      width
    });
    await page.goto(url, { timeout: 15e3, waitUntil: "domcontentloaded" });
    await postInitPayload(page, payload);
    const ready = await waitForReady(page, readyTimeoutMs);
    await waitForOptionalNetworkIdle(page);
    const epdOptimizeSettings = optimize ? await readEpdOptimizeMetaSettings(page) : void 0;
    const screenshot = await page.screenshot({
      fullPage: false,
      type: "png"
    });
    const rawBuffer = Buffer.from(screenshot);
    const epd = optimize && epdOptimizeSettings?.enabled !== false ? await optimizePngForSpectra6(rawBuffer, {
      height,
      intent: epdOptimizeSettings?.intent,
      options: epdOptimizeSettings?.options,
      paletteName: epdOptimizeSettings?.paletteName,
      width
    }) : void 0;
    await page.close();
    return {
      buffer: epd?.buffer ?? rawBuffer,
      epd,
      height,
      optimized: Boolean(epd),
      ready,
      width
    };
  } finally {
    await browser?.close();
  }
}

// src/devServer.ts
var defaultColor = "light";
var fallbackLanguage = "de";
var mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp"
};
function resolveConfigPath(configPath) {
  return isAbsolute(configPath) ? configPath : resolve(process.cwd(), configPath);
}
function isInside(root, filePath) {
  const path = relative(root, filePath);
  return path === "" || !path.startsWith("..") && !path.includes(`..${sep}`);
}
function send(response, status, body, type) {
  response.writeHead(status, {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "no-store",
    "Content-Type": type
  });
  response.end(body);
}
function sendJson(response, status, value) {
  send(response, status, JSON.stringify(value, null, 2), "application/json; charset=utf-8");
}
function sendEvent(response, event, value) {
  response.write(`event: ${event}
`);
  response.write(`data: ${JSON.stringify(value)}

`);
}
function packageRoot() {
  return resolve(dirname(fileURLToPath(import.meta.url)), "..");
}
function isRecord3(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function defaultLanguage(config) {
  return Array.isArray(config.language) && typeof config.language[0] === "string" && config.language[0].trim() ? config.language[0] : fallbackLanguage;
}
async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) {
    return void 0;
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
async function readConfig(configPath) {
  const raw = await readFile(configPath, "utf8");
  const parsed = JSON.parse(raw);
  const validation = validateConfig(parsed);
  if (!validation.valid) {
    throw new Error(`Invalid config.json:
${validation.errors.map((error) => `- ${error}`).join("\n")}`);
  }
  return parsed;
}
function buildPayload(config, configUrl, options) {
  const pluginSettings = {
    ...config.nativeSettings ?? {},
    ...options.settings ?? {}
  };
  const color = typeof options.color === "string" && options.color ? options.color : typeof pluginSettings.color === "string" && pluginSettings.color ? pluginSettings.color : defaultColor;
  pluginSettings.color = color;
  return {
    id: "paperlesspaper-dev-preview",
    draft: true,
    meta: {
      color,
      frameKind: options.frameKind ?? "epd7",
      language: options.language ?? defaultLanguage(config),
      orientation: options.orientation ?? "landscape",
      pluginConfigUrl: configUrl,
      pluginManifest: config,
      pluginSettings
    }
  };
}
function withPayloadColor(payload, color) {
  if (typeof color !== "string" || !color) {
    return payload;
  }
  const meta = isRecord3(payload.meta) ? payload.meta : {};
  const pluginSettings = isRecord3(meta.pluginSettings) ? meta.pluginSettings : {};
  return {
    ...payload,
    meta: {
      ...meta,
      color,
      pluginSettings: {
        ...pluginSettings,
        color
      }
    }
  };
}
function toPreviewPagePath(page) {
  if (/^https?:\/\//.test(page)) {
    return page;
  }
  return `/${page.replace(/^\.?\//, "")}`;
}
function queryToRecord(params) {
  const query = {};
  for (const [key, value] of params) {
    query[key] = value;
  }
  return query;
}
function parseViewportSize(value) {
  const match = /^(\d+)x(\d+)$/i.exec(value.trim());
  if (!match) {
    return void 0;
  }
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
    return void 0;
  }
  return { height, width };
}
function variantSettings(variant) {
  const settings = {};
  for (const [key, value] of Object.entries(variant)) {
    if (key !== "screenshots") {
      settings[key] = value;
    }
  }
  return settings;
}
function resolveIntegrationPath(root, fileName) {
  return resolve(root, fileName.replace(/^\.?\//, ""));
}
async function tryServeApi(response, requestUrl, integrationRoot) {
  if (!requestUrl.pathname.startsWith("/api/")) {
    return false;
  }
  const apiPath = resolve(integrationRoot, `.${requestUrl.pathname}.js`);
  if (!isInside(integrationRoot, apiPath)) {
    send(response, 403, "Forbidden", "text/plain; charset=utf-8");
    return true;
  }
  try {
    const info = await stat(apiPath);
    if (!info.isFile()) {
      return false;
    }
    const moduleUrl = pathToFileURL(apiPath);
    moduleUrl.searchParams.set("t", String(Date.now()));
    const mod = await import(moduleUrl.href);
    if (typeof mod.default !== "function") {
      send(response, 500, `API module has no default function: ${requestUrl.pathname}.js`, "text/plain; charset=utf-8");
      return true;
    }
    const result = await mod.default({
      query: queryToRecord(requestUrl.searchParams)
    });
    sendJson(response, 200, result);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
async function tryServeFile(response, filePath, root) {
  const resolved = resolve(filePath);
  if (!isInside(root, resolved)) {
    send(response, 403, "Forbidden", "text/plain; charset=utf-8");
    return true;
  }
  try {
    const info = await stat(resolved);
    if (!info.isFile()) {
      return false;
    }
    const body = await readFile(resolved);
    send(response, 200, body, mimeTypes[extname(resolved)] ?? "application/octet-stream");
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}
async function startDevServer(options) {
  const host = options.host ?? "127.0.0.1";
  const requestedPort = options.port ?? 4300;
  const configPath = resolveConfigPath(options.configPath);
  const integrationRoot = dirname(configPath);
  const config = await readConfig(configPath);
  const distRoot = resolve(packageRoot(), "dist");
  const eventClients = /* @__PURE__ */ new Set();
  let fileWatcher;
  let changeTimer;
  let liveReload = false;
  const broadcastReload = (fileName) => {
    for (const client of eventClients) {
      sendEvent(client, "reload", {
        file: fileName,
        time: Date.now()
      });
    }
  };
  if (options.watch !== false) {
    try {
      fileWatcher = watch(integrationRoot, { recursive: true }, (_eventType, fileName) => {
        if (fileName && /(^|\/)(screenshots|node_modules)\//.test(String(fileName))) {
          return;
        }
        if (changeTimer) {
          clearTimeout(changeTimer);
        }
        changeTimer = setTimeout(() => broadcastReload(fileName ? String(fileName) : null), 120);
      });
      liveReload = true;
    } catch {
      liveReload = false;
    }
  }
  const cleanupResources = () => {
    if (changeTimer) {
      clearTimeout(changeTimer);
    }
    fileWatcher?.close();
    fileWatcher = void 0;
    for (const client of eventClients) {
      client.end();
    }
    eventClients.clear();
  };
  const server = createServer(async (request, response) => {
    try {
      const hostHeader = request.headers.host ?? `${host}:${requestedPort}`;
      const requestUrl = new URL(request.url ?? "/", `http://${hostHeader}`);
      if (requestUrl.pathname === "/__paperless/health") {
        sendJson(response, 200, { ok: true });
        return;
      }
      if (requestUrl.pathname === "/__paperless/config-variants/regenerate" && request.method === "POST") {
        const variants = Array.isArray(config.configVariants) ? config.configVariants : [];
        const configUrl = new URL("/config.json", `http://${hostHeader}`).href;
        const renderUrl = new URL(toPreviewPagePath(config.renderPage), `http://${hostHeader}`);
        const results = [];
        for (let variantIndex = 0; variantIndex < variants.length; variantIndex += 1) {
          const variant = variants[variantIndex];
          if (!isRecord3(variant) || !isRecord3(variant.screenshots)) {
            continue;
          }
          for (const [viewportName, screenshotPath] of Object.entries(variant.screenshots)) {
            const viewport = parseViewportSize(viewportName);
            if (!viewport) {
              results.push({
                ok: false,
                path: screenshotPath,
                reason: `Invalid viewport size: ${viewportName}`,
                variantIndex,
                viewport: viewportName
              });
              continue;
            }
            if (typeof screenshotPath !== "string" || screenshotPath.trim() === "") {
              results.push({
                ok: false,
                reason: `Invalid screenshot path for ${viewportName}`,
                variantIndex,
                viewport: viewportName
              });
              continue;
            }
            const outputPath = resolveIntegrationPath(integrationRoot, screenshotPath);
            if (!isInside(integrationRoot, outputPath)) {
              results.push({
                ok: false,
                path: screenshotPath,
                reason: "Screenshot path must stay inside the integration folder",
                variantIndex,
                viewport: viewportName
              });
              continue;
            }
            try {
              const payload = buildPayload(config, configUrl, {
                ...options,
                color: typeof variant.color === "string" ? variant.color : options.color,
                settings: variantSettings(variant)
              });
              const result = await renderUrlWithPuppeteer({
                height: viewport.height,
                optimize: true,
                payload,
                url: renderUrl.href,
                width: viewport.width
              });
              await mkdir(dirname(outputPath), { recursive: true });
              await writeFile(outputPath, result.buffer);
              results.push({
                height: result.height,
                ok: true,
                optimized: result.optimized,
                path: screenshotPath,
                ready: result.ready,
                variantIndex,
                viewport: viewportName,
                width: result.width
              });
            } catch (error) {
              results.push({
                ok: false,
                path: screenshotPath,
                reason: error instanceof Error ? error.message : String(error),
                variantIndex,
                viewport: viewportName
              });
            }
          }
        }
        sendJson(response, results.some((result) => result.ok === false) ? 500 : 200, {
          generated: results.filter((result) => result.ok === true).length,
          results
        });
        return;
      }
      if (requestUrl.pathname === "/__paperless/render" && request.method === "POST") {
        const body = await readJsonBody(request);
        const width = Number(body?.width ?? 800);
        const height = Number(body?.height ?? 480);
        const configUrl = new URL("/config.json", `http://${hostHeader}`).href;
        const bodyColor = typeof body?.color === "string" ? body.color : void 0;
        const payload = isRecord3(body?.payload) ? withPayloadColor(body.payload, bodyColor) : buildPayload(config, configUrl, {
          ...options,
          color: bodyColor ?? options.color,
          settings: isRecord3(body?.settings) ? body.settings : options.settings
        });
        const renderUrl = new URL(toPreviewPagePath(config.renderPage), `http://${hostHeader}`);
        const result = await renderUrlWithPuppeteer({
          height,
          optimize: body?.optimize !== false,
          payload,
          url: renderUrl.href,
          width
        });
        response.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
          "Content-Type": "image/png",
          "X-Paperless-Epd-Image-Kind": result.epd?.imageKind ?? "",
          "X-Paperless-Epd-Intent": result.epd?.intent ?? "",
          "X-Paperless-Epd-Processing-Preset": result.epd?.processingPreset ?? "",
          "X-Paperless-Epd-Used-Colors": result.epd?.usedColors.join(",") ?? "",
          "X-Paperless-Render-Height": String(result.height),
          "X-Paperless-Render-Optimized": String(result.optimized),
          "X-Paperless-Render-Ready": String(result.ready),
          "X-Paperless-Render-Width": String(result.width)
        });
        response.end(result.buffer);
        return;
      }
      if (requestUrl.pathname === "/__paperless/events") {
        response.writeHead(200, {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-store",
          "Connection": "keep-alive",
          "Content-Type": "text/event-stream"
        });
        sendEvent(response, "ready", {
          watch: liveReload,
          time: Date.now()
        });
        eventClients.add(response);
        request.on("close", () => {
          eventClients.delete(response);
        });
        return;
      }
      if (requestUrl.pathname === "/__paperless/preview") {
        const configUrl = new URL("/config.json", `http://${hostHeader}`).href;
        const payload = buildPayload(config, configUrl, options);
        const html = createPreviewHtml({
          config,
          configUrl,
          payload,
          renderPath: toPreviewPagePath(config.renderPage),
          settingsPath: config.settingsPage ? toPreviewPagePath(config.settingsPage) : void 0
        });
        send(response, 200, html, "text/html; charset=utf-8");
        return;
      }
      const decodedPath = decodeURIComponent(requestUrl.pathname);
      const pathName = decodedPath === "/" ? `/${config.renderPage}` : decodedPath;
      if (await tryServeApi(response, requestUrl, integrationRoot)) {
        return;
      }
      const integrationPath = join(integrationRoot, pathName);
      if (await tryServeFile(response, integrationPath, integrationRoot)) {
        return;
      }
      const assetName = pathName.replace(/^\/assets\//, "/");
      if (["/paperless.css", "/settings.css", "/paperless.js", "/paperless.iife.js"].includes(assetName)) {
        if (await tryServeFile(response, join(distRoot, assetName), distRoot)) {
          return;
        }
      }
      send(response, 404, "Not found", "text/plain; charset=utf-8");
    } catch (error) {
      send(response, 500, String(error.stack ?? error), "text/plain; charset=utf-8");
    }
  });
  try {
    await new Promise((resolveListen, rejectListen) => {
      server.once("error", rejectListen);
      server.listen(requestedPort, host, () => {
        server.off("error", rejectListen);
        resolveListen();
      });
    });
  } catch (error) {
    cleanupResources();
    throw error;
  }
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : requestedPort;
  const url = `http://${host}:${port}/__paperless/preview`;
  return {
    liveReload,
    url,
    close() {
      return new Promise((resolveClose, rejectClose) => {
        cleanupResources();
        server.close((error) => {
          if (error) {
            rejectClose(error);
            return;
          }
          resolveClose();
        });
      });
    }
  };
}

// src/devCheck.ts
import { readdir, readFile as readFile2, stat as stat2 } from "node:fs/promises";
import { dirname as dirname2, isAbsolute as isAbsolute2, resolve as resolve2 } from "node:path";
import { pathToFileURL as pathToFileURL2 } from "node:url";
function resolveConfigPath2(configPath) {
  return isAbsolute2(configPath) ? configPath : resolve2(process.cwd(), configPath);
}
function isRecord4(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
function isExternalPage(value) {
  return /^https?:\/\//.test(value);
}
function resolveIntegrationFile(root, fileName) {
  return resolve2(root, fileName.replace(/^\.?\//, ""));
}
async function fileExists(filePath) {
  try {
    const info = await stat2(filePath);
    return info.isFile();
  } catch {
    return false;
  }
}
async function checkPage(messages, root, label, page) {
  if (!page) {
    return;
  }
  if (isExternalPage(page)) {
    messages.push({ level: "info", message: `${label} is external: ${page}` });
    return;
  }
  const filePath = resolveIntegrationFile(root, page);
  if (!await fileExists(filePath)) {
    messages.push({ level: "error", message: `${label} does not exist: ${page}` });
    return;
  }
  messages.push({ level: "info", message: `${label} found: ${page}` });
}
async function checkApiModules(messages, root) {
  const apiDir = resolve2(root, "api");
  try {
    const entries = await readdir(apiDir, { withFileTypes: true });
    const modules = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".js"));
    if (modules.length === 0) {
      messages.push({ level: "warning", message: "api/ exists but contains no .js handlers" });
      return;
    }
    for (const entry of modules) {
      const apiPath = resolve2(apiDir, entry.name);
      const moduleUrl = pathToFileURL2(apiPath);
      moduleUrl.searchParams.set("check", String(Date.now()));
      const mod = await import(moduleUrl.href);
      if (typeof mod.default !== "function") {
        messages.push({ level: "error", message: `api/${entry.name} has no default function export` });
      } else {
        messages.push({ level: "info", message: `api/${entry.name} default handler found` });
      }
    }
  } catch {
    messages.push({ level: "info", message: "No api/ directory found" });
  }
}
async function checkLanguageFiles(messages, root, config) {
  if (!Array.isArray(config.language) || config.language.length === 0) {
    return;
  }
  for (const language of config.language) {
    const relativePath = `languages/${language}.json`;
    const filePath = resolve2(root, relativePath);
    try {
      const raw = await readFile2(filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (!isRecord4(parsed)) {
        messages.push({ level: "error", message: `${relativePath} must contain a JSON object` });
        continue;
      }
      messages.push({ level: "info", message: `${relativePath} found` });
    } catch (error) {
      messages.push({
        level: "error",
        message: `${relativePath} is missing or invalid: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
}
function checkSchema(messages, config) {
  if (!("formSchema" in config)) {
    messages.push({ level: "warning", message: "formSchema is missing" });
    return;
  }
  const schema = config.formSchema;
  if (!isRecord4(schema)) {
    messages.push({ level: "error", message: "formSchema must be an object" });
    return;
  }
  if (schema.type !== "object") {
    messages.push({ level: "warning", message: "formSchema.type should be object for generated controls" });
  }
  if (!isRecord4(schema.properties)) {
    messages.push({ level: "warning", message: "formSchema.properties is missing; no controls can be generated" });
    return;
  }
  const nativeSettings = isRecord4(config.nativeSettings) ? config.nativeSettings : {};
  for (const key of Object.keys(nativeSettings)) {
    if (!(key in schema.properties)) {
      messages.push({
        level: "warning",
        message: `nativeSettings.${key} has no matching formSchema property`
      });
    }
  }
  messages.push({
    level: "info",
    message: `${Object.keys(schema.properties).length} formSchema field(s) available`
  });
}
async function checkIntegration(configPathInput) {
  const configPath = resolveConfigPath2(configPathInput);
  const root = dirname2(configPath);
  const messages = [];
  let config;
  try {
    const raw = await readFile2(configPath, "utf8");
    const parsed = JSON.parse(raw);
    const validation = validateConfig(parsed);
    for (const error of validation.errors) {
      messages.push({ level: "error", message: error });
    }
    for (const warning of validation.warnings) {
      messages.push({ level: "warning", message: warning });
    }
    if (validation.valid) {
      config = parsed;
      messages.push({ level: "info", message: "config.json is valid" });
    }
  } catch (error) {
    messages.push({
      level: "error",
      message: `Could not read config.json: ${error instanceof Error ? error.message : String(error)}`
    });
  }
  if (config) {
    await checkPage(messages, root, "renderPage", config.renderPage);
    await checkPage(messages, root, "settingsPage", config.settingsPage);
    await checkLanguageFiles(messages, root, config);
    checkSchema(messages, config);
    await checkApiModules(messages, root);
  }
  return {
    configPath,
    valid: !messages.some((message) => message.level === "error"),
    messages
  };
}

// src/scaffold.ts
import { mkdir as mkdir2, writeFile as writeFile2 } from "node:fs/promises";
import { dirname as dirname3, join as join2, resolve as resolve3 } from "node:path";
function titleCase(value) {
  return value.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim().replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function safeNameFromDir(targetDir) {
  const name = targetDir.split(/[\\/]/).filter(Boolean).at(-1) ?? "OpenIntegration";
  return titleCase(name) || "OpenIntegration";
}
function json(value) {
  return `${JSON.stringify(value, null, 2)}
`;
}
function configTemplate(name) {
  return json({
    name,
    version: "0.1.0",
    description: `Displays ${name} on a paperlesspaper eInk display.`,
    renderPage: "./render.html",
    language: ["de", "en"],
    nativeSettings: {
      title: name,
      limit: 5
    },
    formSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          title: "Title",
          default: name
        },
        limit: {
          type: "integer",
          title: "Item limit",
          minimum: 1,
          maximum: 12,
          default: 5
        }
      }
    }
  });
}
function readmeTemplate(name) {
  return `# ${name}

paperlesspaper OpenIntegration scaffold.

## Develop

\`\`\`sh
paperlesspaper-openintegration check ./config.json
paperlesspaper-openintegration dev ./config.json
paperlesspaper-openintegration render ./config.json --viewport 800x480 --output render.png
\`\`\`

## Files

- \`config.json\`: integration manifest, defaults, and generated settings form.
- \`render.html\`: static render page. It must call \`markReady()\` when the frame is complete.
- \`languages/*.json\`: localized copy loaded from the host-selected payload language.
- \`api/data.js\`: optional local API handler used by the dev server.
`;
}
function renderTemplate({ api, name }) {
  const loadData = api ? `const url = new URL("./api/data", window.location.href);
        url.searchParams.set("title", settings.title);
        url.searchParams.set("limit", settings.limit);

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(\`API request failed: \${response.status}\`);
        }

        const data = await response.json();` : `const data = {
          title: settings.title,
          items: (Array.isArray(messages.items)
            ? messages.items.filter((item) => typeof item === "string")
            : [
                "Replace this starter content with your integration data.",
                "Keep text concise and high contrast for eInk.",
                "Run the CLI render command for both landscape and portrait."
              ]).slice(0, settings.limit)
        };`;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${name}</title>
    <link rel="stylesheet" href="./paperless.css" />
    <style>
      html,
      body {
        margin: 0;
        width: 100%;
        height: 100%;
      }

      .screen {
        gap: 18px;
        padding: 28px;
      }

      .items {
        display: grid;
        flex: 1;
        gap: 0;
        min-height: 0;
        border-top: 2px solid currentColor;
      }

      .item {
        display: flex;
        align-items: center;
        min-height: 0;
        border-bottom: 2px solid currentColor;
        font-size: 22px;
        line-height: 1.1;
      }

      @media (orientation: portrait) {
        .screen {
          padding: 22px;
        }
      }
    </style>
  </head>
  <body>
    <div id="website-has-loading-element"></div>

    <main id="app" class="pp-screen screen">
      <p>Loading...</p>
    </main>

    <script type="module">
      import {
        waitForPayload,
        getSettings,
        getQuerySettings,
        mergeSettings,
        loadLanguageJson,
        applyColorThemeFromQuery,
        markReady,
        markError,
        fitAllText,
        fitToScreen,
        escapeHtml
      } from "./paperless.js";

      const app = document.querySelector("#app");

      try {
        const payload = await waitForPayload({ timeoutMs: 500 });
        const { messages } = await loadLanguageJson(payload);
        applyColorThemeFromQuery({ defaultTheme: "light" });

        const settings = mergeSettings(
          { title: ${JSON.stringify(name)}, limit: 5 },
          getSettings(payload),
          getQuerySettings()
        );
        settings.limit = Math.max(1, Math.min(12, Number(settings.limit) || 5));

        ${loadData}

        const items = Array.isArray(data.items) ? data.items.slice(0, settings.limit) : [];
        const footer = typeof messages.footer === "string" ? messages.footer : "";
        app.innerHTML = \`
          <header class="pp-header">
            <div>
              <h1 class="pp-title pp-fit">\${escapeHtml(data.title || settings.title)}</h1>
            </div>
          </header>

          <section class="items">
            \${items
              .map((item) => \`<div class="item pp-fit">\${escapeHtml(item)}</div>\`)
              .join("")}
          </section>

          \${footer ? \`<footer class="pp-footer">\${escapeHtml(footer)}</footer>\` : ""}
        \`;

        await document.fonts?.ready;
        fitAllText(".pp-fit", { min: 12, max: 72, step: 1, tolerance: 3, lineBreak: true });
        fitToScreen(app);
        markReady();
      } catch (error) {
        markError(error);
      }
    </script>
  </body>
</html>
`;
}
function apiTemplate(name) {
  return `function toInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

export default async function handler({ query }) {
  const title = String(query.title || ${JSON.stringify(name)});
  const limit = Math.max(1, Math.min(12, toInteger(query.limit, 5)));

  return {
    title,
    items: [
      "Fetch or compute real integration data in api/data.js.",
      "Return plain JSON that render.html can display.",
      "Clamp user settings before calling external APIs.",
      "Keep copy short enough for an eInk frame.",
      "Call markReady only after images and fonts are settled."
    ].slice(0, limit)
  };
}
`;
}
function languageTemplate(language, name) {
  return json(
    language === "de" ? {
      footer: "Text aus languages/de.json",
      items: [
        "Ersetze diesen Starter-Inhalt durch deine Integrationsdaten.",
        "Halte Text kurz und kontrastreich fuer eInk.",
        "Teste die CLI-Renderausgabe im Hoch- und Querformat."
      ],
      title: name
    } : {
      footer: "Text from languages/en.json",
      items: [
        "Replace this starter content with your integration data.",
        "Keep text concise and high contrast for eInk.",
        "Run the CLI render command for both landscape and portrait."
      ],
      title: name
    }
  );
}
function buildScaffoldFiles(options) {
  const name = options.name?.trim() || safeNameFromDir(options.targetDir);
  const api = options.api ?? true;
  const files = [
    { path: "config.json", body: configTemplate(name) },
    { path: "render.html", body: renderTemplate({ api, name }) },
    { path: "languages/de.json", body: languageTemplate("de", name) },
    { path: "languages/en.json", body: languageTemplate("en", name) },
    { path: "README.md", body: readmeTemplate(name) }
  ];
  if (api) {
    files.push({ path: "api/data.js", body: apiTemplate(name) });
  }
  return files;
}
async function scaffoldIntegration(options) {
  const targetDir = resolve3(options.targetDir);
  const files = buildScaffoldFiles(options);
  const written = [];
  await mkdir2(targetDir, { recursive: true });
  for (const file of files) {
    const filePath = join2(targetDir, file.path);
    await mkdir2(dirname3(filePath), { recursive: true });
    await writeFile2(filePath, file.body, { flag: options.force ? "w" : "wx" });
    written.push(filePath);
  }
  return {
    files: written,
    targetDir
  };
}

// src/cli.ts
var maxPort = 65535;
var defaultEpdOutput = "dithered";
var MAC_CHROME_PATH2 = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
var PUPPETEER_CHROME_ARGS2 = [
  "--no-sandbox",
  "--disable-font-subpixel-positioning",
  "--disable-lcd-text",
  "--font-render-hinting=none"
];
var COLOR_THEME_CLASSES2 = [
  "dark",
  "light",
  "red-dark",
  "red-light",
  "blue-dark",
  "blue-light",
  "green-dark",
  "green-light",
  "black",
  "white",
  "blue",
  "green",
  "red",
  "yellow"
];
function usage() {
  return `Usage:
  paperlesspaper-openintegration dev [config.json] [options]
  paperlesspaper-openintegration check [config.json] [options]
  paperlesspaper-openintegration render [config.json] [options]
  paperlesspaper-openintegration scaffold <directory> [options]

Options:
  --name <name>              Integration display name for scaffold.
  --no-api                   Scaffold a static render page without api/data.js.
  --force                    Overwrite scaffold files if they already exist.
  --host <host>              Host to bind. Defaults to 127.0.0.1.
  --port <port>              Port to bind. Defaults to 4300.
  --settings <json>          JSON object merged into nativeSettings.
  --language <code>          Payload language. Defaults to de.
  --orientation <value>      Payload orientation. Defaults to landscape.
  --frame-kind <value>       Payload frame kind. Defaults to epd7.
  --color <theme>            Initial color theme. Defaults to light.
  --chrome-bin <path>        Chrome executable for Puppeteer.
  --no-watch                 Disable live reload in dev.
  --output <path>            Render output PNG path.
  --epd-output <mode>        EPD output: dithered, device, or both. Defaults to dithered.
  --raw                      Render the raw Puppeteer screenshot without epdoptimize.
  --ready-timeout <ms>       Ready marker timeout. Defaults to 15000.
  --viewport <WxH>           Render viewport. Defaults to 800x480.
  --json                     Print check results as JSON.
  -h, --help                 Show this help.
`;
}
function parseJsonRecord(value) {
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("--settings must be a JSON object");
  }
  return parsed;
}
function parseViewport(value = "800x480") {
  const match = /^(\d+)x(\d+)$/i.exec(value);
  if (!match) {
    throw new Error("--viewport must be formatted as WIDTHxHEIGHT");
  }
  return {
    height: Number(match[2]),
    width: Number(match[1])
  };
}
function safeSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "openintegration";
}
function parseEpdOutputMode(value) {
  if (value === "dithered" || value === "device" || value === "both") {
    return value;
  }
  throw new Error("--epd-output must be one of: dithered, device, both");
}
function asCanvasLike2(canvas) {
  return canvas;
}
function resolveChromePath2(chromePath) {
  return chromePath || process.env.CHROME_BIN || process.env.PUPPETEER_EXECUTABLE_PATH || (process.platform === "darwin" ? MAC_CHROME_PATH2 : void 0);
}
function rgbToHex2(red, green, blue) {
  return `#${[red, green, blue].map((channel) => Math.max(0, Math.min(255, channel)).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}
function getUsedDeviceColors2(canvas, palette) {
  const deviceColors = new Set(palette.map((entry) => entry.deviceColor.toUpperCase()));
  const context = canvas.getContext("2d");
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const used = /* @__PURE__ */ new Set();
  for (let index = 0; index < image.data.length; index += 4) {
    const color = rgbToHex2(image.data[index], image.data[index + 1], image.data[index + 2]);
    if (deviceColors.has(color)) {
      used.add(color);
    }
  }
  return Array.from(used).sort();
}
async function readEpdOptimizeMetaSettings2(page) {
  const content = await page.evaluate((metaName) => {
    return document.querySelector(`meta[name="${metaName}"]`)?.getAttribute("content");
  }, EPD_OPTIMIZE_META_NAME);
  return parseEpdOptimizeMetaContent(content);
}
async function waitForOptionalNetworkIdle2(page) {
  const waitForNetworkIdle = page.waitForNetworkIdle?.bind(page);
  if (!waitForNetworkIdle) {
    return;
  }
  await waitForNetworkIdle({ idleTime: 500, timeout: 5e3 }).catch(() => void 0);
}
async function postInitPayload2(page, payload) {
  if (!payload) {
    return;
  }
  await page.evaluate((data, colorThemeClasses) => {
    const payloadRecord = data && typeof data === "object" && !Array.isArray(data) ? data : void 0;
    const meta = payloadRecord?.meta && typeof payloadRecord.meta === "object" && !Array.isArray(payloadRecord.meta) ? payloadRecord.meta : void 0;
    const pluginSettings = meta?.pluginSettings && typeof meta.pluginSettings === "object" && !Array.isArray(meta.pluginSettings) ? meta.pluginSettings : void 0;
    const settingsColor = pluginSettings && typeof pluginSettings.color === "string" ? pluginSettings.color : void 0;
    const color = typeof settingsColor === "string" ? settingsColor : typeof meta?.color === "string" ? meta.color : void 0;
    document.body.classList.remove(...colorThemeClasses);
    if (color && colorThemeClasses.includes(color)) {
      document.body.classList.add(color);
    }
    window.postMessage(
      {
        cmd: "message",
        data,
        type: "INIT"
      },
      "*"
    );
  }, payload, COLOR_THEME_CLASSES2);
}
async function waitForReady2(page, timeoutMs) {
  try {
    await page.waitForSelector("#website-has-loaded", { timeout: timeoutMs });
    return true;
  } catch {
    return false;
  }
}
async function renderRawWithPuppeteer({
  chromePath,
  height,
  payload,
  readyTimeoutMs = 15e3,
  url,
  width
}) {
  const puppeteer = await import("puppeteer-core");
  let browser;
  try {
    browser = await puppeteer.launch({
      args: PUPPETEER_CHROME_ARGS2,
      executablePath: resolveChromePath2(chromePath),
      headless: true
    });
    const page = await browser.newPage();
    await page.setViewport({
      deviceScaleFactor: 1,
      height,
      width
    });
    await page.goto(url, { timeout: 15e3, waitUntil: "domcontentloaded" });
    await postInitPayload2(page, payload);
    const ready = await waitForReady2(page, readyTimeoutMs);
    await waitForOptionalNetworkIdle2(page);
    const epdOptimizeSettings = await readEpdOptimizeMetaSettings2(page);
    const screenshot = await page.screenshot({
      fullPage: false,
      type: "png"
    });
    await page.close();
    return {
      buffer: Buffer.from(screenshot),
      epdOptimizeSettings,
      height,
      ready,
      width
    };
  } finally {
    await browser?.close();
  }
}
async function optimizePngForCliSpectra6(sourcePng, {
  height,
  intent = "natural",
  options = {},
  paletteName,
  width
}) {
  const palette = resolveEpdOptimizePalette(paletteName);
  const image = await loadImage2(sourcePng);
  const inputCanvas = createCanvas2(width, height);
  const inputContext = inputCanvas.getContext("2d");
  inputContext.drawImage(image, 0, 0, width, height);
  const ditheredCanvas = createCanvas2(width, height);
  const deviceCanvas = createCanvas2(width, height);
  const imageAuto = suggestCanvasImageAdjustmentOptions(
    asCanvasLike2(inputCanvas),
    palette,
    { intent }
  );
  const canvasAuto = suggestCanvasDitherOptions(
    asCanvasLike2(inputCanvas),
    palette,
    { intent }
  );
  await ditherImage2(asCanvasLike2(inputCanvas), asCanvasLike2(ditheredCanvas), {
    ...imageAuto.adjustmentOptions,
    ...canvasAuto.ditherOptions,
    ...options,
    palette
  });
  replaceColors2(asCanvasLike2(ditheredCanvas), asCanvasLike2(deviceCanvas), palette);
  return {
    deviceBuffer: deviceCanvas.toBuffer("image/png"),
    ditheredBuffer: ditheredCanvas.toBuffer("image/png"),
    height,
    imageKind: imageAuto.imageKind,
    intent: imageAuto.intent,
    presetName: canvasAuto.presetName,
    reasons: Array.from(/* @__PURE__ */ new Set([...imageAuto.reasons, ...canvasAuto.reasons])),
    usedColors: getUsedDeviceColors2(deviceCanvas, palette),
    width
  };
}
function outputWithSuffix(output, suffix) {
  const extension = extname2(output);
  return extension ? `${output.slice(0, -extension.length)}${suffix}${extension}` : `${output}${suffix}`;
}
function takeValue(args, index, name) {
  const value = args[index + 1];
  if (!value || value.startsWith("-")) {
    throw new Error(`${name} needs a value`);
  }
  return value;
}
function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "-h" || arg === "--help") {
      parsed.help = true;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
      continue;
    }
    if (arg === "--no-watch") {
      parsed.watch = false;
      continue;
    }
    if (arg === "--raw") {
      parsed.raw = true;
      continue;
    }
    if (arg === "--no-api") {
      parsed.api = false;
      continue;
    }
    if (arg === "--force") {
      parsed.force = true;
      continue;
    }
    if (arg === "--name") {
      parsed.name = takeValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--host") {
      parsed.host = takeValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--port") {
      parsed.port = Number(takeValue(argv, index, arg));
      if (!Number.isInteger(parsed.port) || parsed.port <= 0 || parsed.port > maxPort) {
        throw new Error(`--port must be a positive integer up to ${maxPort}`);
      }
      index += 1;
      continue;
    }
    if (arg === "--settings") {
      parsed.settings = parseJsonRecord(takeValue(argv, index, arg));
      index += 1;
      continue;
    }
    if (arg === "--language") {
      parsed.language = takeValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--orientation") {
      parsed.orientation = takeValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--frame-kind") {
      parsed.frameKind = takeValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--color") {
      parsed.color = takeValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--chrome-bin") {
      parsed.chromePath = takeValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--output") {
      parsed.output = takeValue(argv, index, arg);
      index += 1;
      continue;
    }
    if (arg === "--epd-output") {
      parsed.epdOutput = parseEpdOutputMode(takeValue(argv, index, arg));
      index += 1;
      continue;
    }
    if (arg === "--ready-timeout") {
      parsed.readyTimeoutMs = Number(takeValue(argv, index, arg));
      if (!Number.isFinite(parsed.readyTimeoutMs) || parsed.readyTimeoutMs < 0) {
        throw new Error("--ready-timeout must be a non-negative number");
      }
      index += 1;
      continue;
    }
    if (arg === "--viewport") {
      parsed.viewport = takeValue(argv, index, arg);
      parseViewport(parsed.viewport);
      index += 1;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    if (!parsed.command) {
      parsed.command = arg;
      continue;
    }
    if (parsed.command === "scaffold" || parsed.command === "init" || parsed.command === "create") {
      if (!parsed.targetDir) {
        parsed.targetDir = arg;
        continue;
      }
      throw new Error(`Unexpected argument: ${arg}`);
    }
    if (!parsed.configPath) {
      parsed.configPath = arg;
      continue;
    }
    throw new Error(`Unexpected argument: ${arg}`);
  }
  return parsed;
}
function isPortInUseError(error) {
  return error?.code === "EADDRINUSE";
}
async function startDevServerWithPortFallback(options) {
  const initialPort = options.port ?? 4300;
  if (initialPort === 0) {
    return startDevServer(options);
  }
  for (let port = initialPort; port <= maxPort; port += 1) {
    try {
      return await startDevServer({
        ...options,
        port
      });
    } catch (error) {
      if (!isPortInUseError(error)) {
        throw error;
      }
      if (port < maxPort) {
        console.warn(`Port ${port} is already in use, trying ${port + 1}.`);
      }
    }
  }
  throw new Error(`No available port found from ${initialPort} to ${maxPort}`);
}
async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || !args.command) {
    console.log(usage());
    return;
  }
  if (args.command !== "dev" && args.command !== "check" && args.command !== "render" && args.command !== "scaffold" && args.command !== "init" && args.command !== "create") {
    throw new Error(`Unknown command: ${args.command}`);
  }
  if (args.command === "scaffold" || args.command === "init" || args.command === "create") {
    if (!args.targetDir) {
      throw new Error(`${args.command} needs a target directory`);
    }
    const result = await scaffoldIntegration({
      api: args.api,
      force: args.force,
      name: args.name,
      targetDir: args.targetDir
    });
    console.log(`Created OpenIntegration scaffold: ${result.targetDir}`);
    for (const file of result.files) {
      console.log(`- ${file}`);
    }
    console.log("");
    console.log(`Next: paperlesspaper-openintegration check ${result.targetDir}/config.json`);
    return;
  }
  if (args.command === "check") {
    const result = await checkIntegration(args.configPath ?? "config.json");
    if (args.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`paperlesspaper OpenIntegration check: ${result.configPath}`);
      for (const message of result.messages) {
        const prefix = message.level === "error" ? "ERROR" : message.level === "warning" ? "WARN" : "INFO";
        console.log(`${prefix} ${message.message}`);
      }
    }
    if (!result.valid) {
      process.exit(1);
    }
    return;
  }
  if (args.command === "render") {
    const configPath = args.configPath ?? "config.json";
    const config = await readConfig(configPath);
    const viewport = parseViewport(args.viewport);
    const server2 = await startDevServer({
      color: args.color,
      configPath,
      frameKind: args.frameKind,
      host: args.host,
      language: args.language,
      orientation: args.orientation,
      port: args.port ?? 0,
      settings: args.settings,
      watch: false
    });
    try {
      const origin = new URL(server2.url).origin;
      const configUrl = new URL("/config.json", origin).href;
      const renderUrl = new URL(toPreviewPagePath(config.renderPage), origin);
      const payload = buildPayload(config, configUrl, {
        color: args.color,
        configPath,
        frameKind: args.frameKind,
        language: args.language,
        orientation: args.orientation,
        settings: args.settings
      });
      const rawResult = await renderRawWithPuppeteer({
        chromePath: args.chromePath,
        height: viewport.height,
        payload,
        readyTimeoutMs: args.readyTimeoutMs,
        url: renderUrl.href,
        width: viewport.width
      });
      const epdOutput = args.epdOutput ?? defaultEpdOutput;
      const shouldOptimize = !args.raw && rawResult.epdOptimizeSettings?.enabled !== false;
      const epd = shouldOptimize ? await optimizePngForCliSpectra6(rawResult.buffer, {
        height: viewport.height,
        intent: rawResult.epdOptimizeSettings?.intent,
        options: rawResult.epdOptimizeSettings?.options,
        paletteName: rawResult.epdOptimizeSettings?.paletteName,
        width: viewport.width
      }) : void 0;
      const output = resolve4(
        args.output ?? `render-output/${safeSlug(config.name)}-${viewport.width}x${viewport.height}.png`
      );
      const outputBuffer = args.raw ? rawResult.buffer : epdOutput === "device" ? epd?.deviceBuffer ?? rawResult.buffer : epd?.ditheredBuffer ?? rawResult.buffer;
      const deviceOutput = epd && epdOutput === "both" ? outputWithSuffix(output, "-device") : void 0;
      await mkdir3(dirname4(output), { recursive: true });
      await writeFile3(output, outputBuffer);
      if (deviceOutput && epd) {
        await mkdir3(dirname4(deviceOutput), { recursive: true });
        await writeFile3(deviceOutput, epd.deviceBuffer);
      }
      console.log(`Rendered ${rawResult.width}x${rawResult.height} PNG: ${output}`);
      console.log(`Ready marker: ${rawResult.ready ? "yes" : "no"}`);
      console.log(`EPD optimized: ${epd ? "yes" : "no"}`);
      if (epd) {
        console.log(`EPD output: ${epdOutput}`);
        console.log(`EPD image kind: ${epd.imageKind}`);
        console.log(`EPD intent: ${epd.intent}`);
        if (epd.presetName) {
          console.log(`EPD preset: ${epd.presetName}`);
        }
        console.log(`EPD colors: ${epd.usedColors.join(", ") || "none"}`);
      }
      if (deviceOutput) {
        console.log(`EPD device PNG: ${deviceOutput}`);
      }
    } finally {
      await server2.close();
    }
    return;
  }
  const server = await startDevServerWithPortFallback({
    color: args.color,
    configPath: args.configPath ?? "config.json",
    frameKind: args.frameKind,
    host: args.host,
    language: args.language,
    orientation: args.orientation,
    port: args.port,
    settings: args.settings,
    watch: args.watch
  });
  console.log(`paperlesspaper OpenIntegration preview: ${server.url}`);
  console.log(server.liveReload ? "Live reload enabled." : "Live reload disabled.");
  console.log("Press Ctrl+C to stop.");
  const stop = async () => {
    await server.close();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
