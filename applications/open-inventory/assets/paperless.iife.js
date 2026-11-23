"use strict";
var PaperlessOpenIntegration = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/browser.ts
  var browser_exports = {};
  __export(browser_exports, {
    COLOR_THEMES: () => COLOR_THEMES,
    DEFAULT_CALENDAR_MESSAGES: () => DEFAULT_CALENDAR_MESSAGES,
    DEFAULT_CALENDAR_SETTINGS: () => DEFAULT_CALENDAR_SETTINGS,
    SOFT_HYPHEN: () => SOFT_HYPHEN,
    addSoftHyphensToTextNodes: () => addSoftHyphensToTextNodes,
    applyColorTheme: () => applyColorTheme,
    applyColorThemeFromQuery: () => applyColorThemeFromQuery,
    bootCalendarApiIntegration: () => bootCalendarApiIntegration,
    bootDashboardIntegration: () => bootDashboardIntegration,
    bootDepartureIntegration: () => bootDepartureIntegration,
    buildCalendarRange: () => buildCalendarRange,
    detectOverflow: () => detectOverflow,
    escapeHtml: () => escapeHtml,
    fitAllText: () => fitAllText,
    fitCalendarLayout: () => fitCalendarLayout,
    fitDashboard: () => fitDashboard,
    fitDepartureBoard: () => fitDepartureBoard,
    fitHyphenatedText: () => fitHyphenatedText,
    fitImage: () => fitImage,
    fitOfTheDayLayout: () => fitOfTheDayLayout,
    fitText: () => fitText,
    fitToScreen: () => fitToScreen,
    getPayloadLanguage: () => getPayloadLanguage,
    getQuerySettings: () => getQuerySettings,
    getSettings: () => getSettings,
    getSettingsFromMessage: () => getSettingsFromMessage,
    getSettingsPageHeight: () => getSettingsPageHeight,
    hyphenateText: () => hyphenateText,
    hyphenateWord: () => hyphenateWord,
    loadLanguageJson: () => loadLanguageJson,
    markError: () => markError,
    markLoading: () => markLoading,
    markReady: () => markReady,
    mergeSettings: () => mergeSettings,
    normalizeCalendarSettings: () => normalizeCalendarSettings,
    normalizeColorTheme: () => normalizeColorTheme,
    observeSettingsHeight: () => observeSettingsHeight,
    postSettingsHeight: () => postSettingsHeight,
    postSettingsReady: () => postSettingsReady,
    postSettingsUpdate: () => postSettingsUpdate,
    prepareCalendarEvents: () => prepareCalendarEvents,
    prepareHyphenation: () => prepareHyphenation,
    renderCalendarLayout: () => renderCalendarLayout,
    renderDashboard: () => renderDashboard,
    renderDepartureBoard: () => renderDepartureBoard,
    renderOfTheDayLayout: () => renderOfTheDayLayout,
    resolveLanguage: () => resolveLanguage,
    setupSettingsPage: () => setupSettingsPage,
    stripSoftHyphens: () => stripSoftHyphens,
    validateConfig: () => validateConfig,
    waitForCalendarImages: () => waitForCalendarImages,
    waitForOfTheDayImage: () => waitForOfTheDayImage,
    waitForPayload: () => waitForPayload
  });

  // src/ready.ts
  var loadingMarkerId = "website-has-loading-element";
  var loadedMarkerId = "website-has-loaded";
  var renderStatusDataKey = "paperlessRenderStatus";
  var renderErrorDataKey = "paperlessRenderError";
  function getDocument() {
    return globalThis.document;
  }
  function appendHiddenMarker(id, text2 = "") {
    const doc = getDocument();
    if (!doc) {
      return void 0;
    }
    const existing = doc.getElementById(id);
    if (existing) {
      return existing;
    }
    const marker = doc.createElement("div");
    marker.id = id;
    marker.textContent = text2;
    marker.hidden = true;
    doc.body.append(marker);
    return marker;
  }
  function hasVisiblePageContent() {
    const doc = getDocument();
    if (!doc) {
      return true;
    }
    const content = Array.from(doc.body.children).filter((element) => {
      if (!(element instanceof HTMLElement)) {
        return false;
      }
      if (element.id === loadingMarkerId || element.id === loadedMarkerId) {
        return false;
      }
      if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(element.tagName)) {
        return false;
      }
      return !element.hidden && element.textContent?.trim();
    });
    return content.length > 0;
  }
  function markLoading() {
    const doc = getDocument();
    doc?.getElementById(loadedMarkerId)?.remove();
    if (doc) {
      doc.documentElement.dataset[renderStatusDataKey] = "loading";
      delete doc.documentElement.dataset[renderErrorDataKey];
    }
    appendHiddenMarker(loadingMarkerId);
  }
  function markReady() {
    const doc = getDocument();
    if (!doc) {
      return;
    }
    doc.getElementById(loadingMarkerId)?.remove();
    doc.documentElement.dataset[renderStatusDataKey] = "ready";
    delete doc.documentElement.dataset[renderErrorDataKey];
    appendHiddenMarker(loadedMarkerId, "ready");
  }
  function markError(error) {
    if (error !== void 0) {
      console.error(error);
    }
    const doc = getDocument();
    if (doc && !hasVisiblePageContent()) {
      const block = doc.createElement("div");
      block.className = "pp-error";
      block.setAttribute("role", "alert");
      block.textContent = "Unable to render this integration.";
      doc.body.append(block);
    }
    markReady();
    if (doc) {
      doc.documentElement.dataset[renderStatusDataKey] = "error";
      doc.documentElement.dataset[renderErrorDataKey] = error instanceof Error ? error.message : String(error || "unknown error");
    }
  }

  // src/html.ts
  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }

  // src/language.ts
  function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }
  function isLanguageCode(value) {
    return typeof value === "string" && /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(value.trim());
  }
  function normalizeLanguage(value) {
    const trimmed = value?.trim();
    return trimmed && isLanguageCode(trimmed) ? trimmed : void 0;
  }
  function payloadManifestLanguages(payload) {
    const meta = isRecord(payload?.meta) ? payload.meta : void 0;
    const manifest = isRecord(meta?.pluginManifest) ? meta.pluginManifest : void 0;
    return Array.isArray(manifest?.language) ? manifest.language.filter(isLanguageCode) : [];
  }
  function defaultFetch(input, init) {
    if (typeof fetch !== "function") {
      throw new Error("fetch is not available to load language JSON");
    }
    return fetch(input, init);
  }
  function languagePath(basePath, language) {
    return `${basePath.replace(/\/+$/, "")}/${encodeURIComponent(language)}.json`;
  }
  function getPayloadLanguage(payload) {
    const meta = isRecord(payload?.meta) ? payload.meta : void 0;
    return normalizeLanguage(typeof meta?.language === "string" ? meta.language : void 0);
  }
  function resolveLanguage({
    requested,
    supported = [],
    defaultLanguage
  }) {
    const supportedCodes = supported.filter(isLanguageCode);
    const requestedCode = normalizeLanguage(requested);
    if (requestedCode) {
      const exact = supportedCodes.find((code) => code === requestedCode);
      if (exact) {
        return exact;
      }
      const exactInsensitive = supportedCodes.find(
        (code) => code.toLowerCase() === requestedCode.toLowerCase()
      );
      if (exactInsensitive) {
        return exactInsensitive;
      }
      const requestedBase = requestedCode.split("-")[0]?.toLowerCase();
      const base = supportedCodes.find((code) => code.toLowerCase() === requestedBase);
      if (base) {
        return base;
      }
    }
    const defaultCode = normalizeLanguage(defaultLanguage);
    if (defaultCode) {
      const defaultMatch = supportedCodes.find((code) => code === defaultCode);
      if (defaultMatch) {
        return defaultMatch;
      }
      const defaultInsensitive = supportedCodes.find(
        (code) => code.toLowerCase() === defaultCode.toLowerCase()
      );
      if (defaultInsensitive) {
        return defaultInsensitive;
      }
      if (supportedCodes.length === 0) {
        return defaultCode;
      }
    }
    return supportedCodes[0] ?? "de";
  }
  async function loadLanguageJson(payload, options = {}) {
    const supported = options.supported ?? payloadManifestLanguages(payload);
    const defaultLanguage = options.defaultLanguage ?? supported[0] ?? "de";
    const language = resolveLanguage({
      defaultLanguage,
      requested: options.requested ?? getPayloadLanguage(payload),
      supported
    });
    const response = await (options.fetch ?? defaultFetch)(
      languagePath(options.basePath ?? "./languages", language)
    );
    if (!response.ok) {
      throw new Error(`Could not load language JSON for ${language}: ${response.status}`);
    }
    const messages = await response.json();
    if (!isRecord(messages)) {
      throw new Error(`Language JSON for ${language} must contain an object`);
    }
    return {
      language,
      messages
    };
  }

  // src/runtime.ts
  function isRecord2(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }
  function normalizePayload(value) {
    if (Array.isArray(value)) {
      return { data: value };
    }
    if (!isRecord2(value)) {
      return void 0;
    }
    const data = value.data;
    if ((isRecord2(data) || Array.isArray(data)) && (value.type === "INIT" || value.cmd === "message")) {
      return Array.isArray(data) ? { data } : data;
    }
    return value;
  }
  function originAllowed(origin, allowedOrigins) {
    if (!allowedOrigins || allowedOrigins.length === 0) {
      return true;
    }
    return allowedOrigins.includes(origin);
  }
  function notifyPayloadUpdate(handler, payload, event) {
    if (!handler) {
      return;
    }
    try {
      const result = handler(payload, event);
      if (result && typeof result.then === "function") {
        result.catch((error) => console.error(error));
      }
    } catch (error) {
      console.error(error);
    }
  }
  function waitForPayload(options = {}) {
    const { fallback = {}, allowedOrigins, onUpdate } = options;
    const timeoutMs = options.timeoutMs ?? options.timeout ?? 500;
    if (typeof window === "undefined") {
      return Promise.resolve(fallback);
    }
    return new Promise((resolve) => {
      let settled = false;
      let timer;
      const cleanup = () => {
        window.removeEventListener("message", onMessage);
        if (timer) {
          clearTimeout(timer);
        }
      };
      const finish = (payload, event) => {
        if (settled) {
          if (event) {
            notifyPayloadUpdate(onUpdate, payload, event);
          }
          return;
        }
        settled = true;
        if (timer) {
          clearTimeout(timer);
        }
        if (!onUpdate) {
          cleanup();
        }
        resolve(payload);
      };
      const onMessage = (event) => {
        if (!originAllowed(event.origin, allowedOrigins)) {
          return;
        }
        const payload = normalizePayload(event.data);
        if (payload) {
          finish(payload, event);
        }
      };
      window.addEventListener("message", onMessage);
      if (timeoutMs >= 0) {
        timer = setTimeout(() => finish(fallback), timeoutMs);
      }
    });
  }

  // src/settings.ts
  function isRecord3(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }
  var pluginMessageSource = "paperlesspaper-plugin";
  function coerceQueryValue(value) {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
    if (value !== "" && Number.isFinite(Number(value))) {
      return Number(value);
    }
    return value;
  }
  function mergeSettings(...sources) {
    return Object.assign({}, ...sources.filter(Boolean));
  }
  function getSettings(payload, defaults) {
    const settings = payload?.meta;
    if (!isRecord3(settings) || !isRecord3(settings.pluginSettings)) {
      return mergeSettings(defaults);
    }
    return mergeSettings(defaults, settings.pluginSettings);
  }
  function getQuerySettings(defaults) {
    if (typeof window === "undefined") {
      return mergeSettings(defaults);
    }
    const params = new URLSearchParams(window.location.search);
    const values = {};
    for (const [key, value] of params) {
      values[key] = coerceQueryValue(value);
    }
    return mergeSettings(defaults, values);
  }
  function targetWindow(target) {
    if (typeof window === "undefined") {
      return void 0;
    }
    return target ?? window.parent;
  }
  function postToParent(message, options = {}) {
    const target = targetWindow(options.target);
    if (!target) {
      return;
    }
    target.postMessage(message, options.targetOrigin ?? "*");
  }
  function payloadFromSettingsMessage(message) {
    if (!isRecord3(message)) {
      return void 0;
    }
    if (isRecord3(message.data) && (message.type === "INIT" || message.cmd === "message")) {
      return message.data;
    }
    if (isRecord3(message.payload)) {
      return message.payload;
    }
    return void 0;
  }
  function getSettingsFromMessage(message, defaults) {
    if (!isRecord3(message)) {
      return void 0;
    }
    const payload = payloadFromSettingsMessage(message);
    if (payload) {
      return getSettings(payload, defaults);
    }
    if (isRecord3(message.pluginSettings)) {
      return mergeSettings(defaults, message.pluginSettings);
    }
    if (isRecord3(message.settings)) {
      return mergeSettings(defaults, message.settings);
    }
    return void 0;
  }
  function postSettingsUpdate(settingsPatch, options = {}) {
    postToParent(
      {
        source: pluginMessageSource,
        type: "UPDATE_SETTINGS",
        payload: settingsPatch
      },
      options
    );
    if (options.legacy !== false) {
      postToParent(
        {
          type: "paperlesspaper:settings:update",
          pluginSettings: settingsPatch
        },
        options
      );
    }
  }
  function postSettingsReady(options = {}) {
    postToParent(
      {
        source: pluginMessageSource,
        type: "READY"
      },
      options
    );
    if (options.legacy !== false) {
      postToParent({ type: "paperlesspaper:settings:ready" }, options);
    }
  }
  function getSettingsPageHeight(root) {
    if (typeof document === "undefined") {
      return 0;
    }
    const element = root ?? document.documentElement;
    const body = document.body;
    const rect = element.getBoundingClientRect();
    const bodyRect = body?.getBoundingClientRect();
    return Math.ceil(
      Math.max(
        rect.height,
        element.scrollHeight,
        element.offsetHeight,
        bodyRect?.height ?? 0,
        body?.scrollHeight ?? 0,
        body?.offsetHeight ?? 0
      )
    );
  }
  function postSettingsHeight(height = getSettingsPageHeight(), options = {}) {
    const nextHeight = Math.max(options.minHeight ?? 0, Math.ceil(Number(height)));
    if (!Number.isFinite(nextHeight) || nextHeight <= 0) {
      return;
    }
    postToParent(
      {
        source: pluginMessageSource,
        type: "SET_HEIGHT",
        payload: {
          height: nextHeight
        }
      },
      options
    );
    if (options.legacy !== false) {
      postToParent(
        {
          type: "paperlesspaper:settings:height",
          height: nextHeight
        },
        options
      );
    }
  }
  function observeSettingsHeight(options = {}) {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return () => {
      };
    }
    const root = options.root ?? document.documentElement;
    let frame = 0;
    let lastHeight = 0;
    const measure = () => {
      frame = 0;
      const height = getSettingsPageHeight(root);
      if (height !== lastHeight) {
        lastHeight = height;
        postSettingsHeight(height, options);
      }
    };
    const schedule = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(measure);
    };
    const resizeObserver = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver(schedule);
    resizeObserver?.observe(root);
    if (document.body && document.body !== root) {
      resizeObserver?.observe(document.body);
    }
    const mutationObserver = typeof MutationObserver === "undefined" ? void 0 : new MutationObserver(schedule);
    mutationObserver?.observe(root, {
      attributes: true,
      childList: true,
      subtree: true
    });
    window.addEventListener("load", schedule);
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("load", schedule);
      window.removeEventListener("resize", schedule);
    };
  }
  function setupSettingsPage(options = {}) {
    const stopObservingHeight = observeSettingsHeight(options);
    if (typeof window === "undefined") {
      return stopObservingHeight;
    }
    const onMessage = (event) => {
      const payload = payloadFromSettingsMessage(event.data);
      if (payload) {
        options.onPayload?.(payload, event);
        postSettingsHeight(getSettingsPageHeight(options.root), options);
      }
    };
    window.addEventListener("message", onMessage);
    postSettingsReady(options);
    return () => {
      window.removeEventListener("message", onMessage);
      stopObservingHeight();
    };
  }

  // src/theme.ts
  var COLOR_THEMES = [
    "dark",
    "light",
    "red-dark",
    "red-light",
    "blue-dark",
    "blue-light",
    "green-dark",
    "green-light"
  ];
  var COLOR_THEME_SET = new Set(COLOR_THEMES);
  var LEGACY_COLOR_THEME_ALIASES = {
    black: "light",
    white: "dark",
    blue: "blue-light",
    green: "green-light",
    red: "red-light",
    yellow: "light"
  };
  var REMOVABLE_COLOR_CLASSES = [...COLOR_THEMES, ...Object.keys(LEGACY_COLOR_THEME_ALIASES)];
  function normalizeColorTheme(value, fallback = "light") {
    if (!value) {
      return fallback;
    }
    if (COLOR_THEME_SET.has(value)) {
      return value;
    }
    return LEGACY_COLOR_THEME_ALIASES[value] ?? fallback;
  }
  function applyColorTheme(value, options = {}) {
    const theme = normalizeColorTheme(value, options.defaultTheme);
    const target = options.target ?? globalThis.document?.body;
    target?.classList.remove(...REMOVABLE_COLOR_CLASSES);
    target?.classList.add(theme);
    return theme;
  }
  function applyColorThemeFromQuery(options = {}) {
    const { paramName = "color" } = options;
    const value = typeof window === "undefined" ? void 0 : new URLSearchParams(window.location.search).get(paramName);
    return applyColorTheme(value, options);
  }

  // src/fitText.ts
  function px(value) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function contentWidth(element) {
    const style = window.getComputedStyle(element);
    const width = element.clientWidth || element.offsetWidth;
    return Math.max(0, width - px(style.paddingLeft) - px(style.paddingRight));
  }
  function contentHeight(element) {
    const style = window.getComputedStyle(element);
    const height = element.clientHeight || element.offsetHeight;
    return Math.max(0, height - px(style.paddingTop) - px(style.paddingBottom));
  }
  function fitTarget(element, fitParent) {
    if (fitParent instanceof HTMLElement) {
      return fitParent;
    }
    if (fitParent && element.parentElement) {
      return element.parentElement;
    }
    return element;
  }
  function overflows(element, tolerance, fitParent) {
    const target = fitTarget(element, fitParent);
    const elementWidth = element.clientWidth || element.offsetWidth;
    const targetWidth = target === element ? elementWidth : Math.min(contentWidth(target), elementWidth || Number.POSITIVE_INFINITY);
    const targetHeight = target === element ? target.clientHeight || target.offsetHeight : contentHeight(target);
    return element.scrollWidth - targetWidth > tolerance || element.scrollHeight - targetHeight > tolerance;
  }
  function fitText(element, options = {}) {
    const {
      min = 8,
      step = 1,
      tolerance = 2,
      lineBreak = false,
      nowrap = false,
      fitParent = false
    } = options;
    const computed = window.getComputedStyle(element);
    const startingSize = px(computed.fontSize) || options.max || 16;
    const max = options.max ?? startingSize;
    if (lineBreak) {
      element.style.whiteSpace = "normal";
      element.style.overflowWrap = "break-word";
      element.style.hyphens = "auto";
      if (lineBreak === "balance") {
        element.style.textWrap = "balance";
      }
    }
    if (nowrap) {
      element.style.whiteSpace = "nowrap";
    }
    let size = max;
    element.style.fontSize = `${size}px`;
    while (size > min && overflows(element, tolerance, fitParent)) {
      size = Math.max(min, size - step);
      element.style.fontSize = `${size}px`;
    }
  }
  function fitAllText(selector = ".pp-fit", options) {
    if (typeof document === "undefined") {
      return;
    }
    for (const element of document.querySelectorAll(selector)) {
      fitText(element, options);
    }
  }

  // src/departures.ts
  var fallbackMessages = {
    departures: "Departures",
    next: "Next departure",
    time: "Time",
    line: "Line",
    direction: "Destination",
    platform: "Platform",
    platformShort: "Pl.",
    planned: "Sched.",
    forecast: "Forecast",
    onTime: "On time",
    timetable: "Timetable",
    changed: "Platform change",
    updated: "Updated",
    example: "Example data",
    window: "Next {minutes} min",
    more: "+{count} more",
    partial: "Limited timetable extract",
    empty: "No matching departures",
    emptyHint: "Check the station, filters or time window.",
    errorTitle: "Departures unavailable",
    upstream: "The source is unavailable. Please try again later.",
    loading: "Loading departures",
    filter: "Filter",
    cancelled: "Cancelled"
  };
  var yes = (value) => value === true || value === "true" || value === 1 || value === "1";
  function renderDepartureBoard(app, data, settings, copy = {}, brand = "") {
    const e = escapeHtml;
    const messages = { ...fallbackMessages };
    for (const [key, value] of Object.entries(copy)) if (typeof value === "string") messages[key] = value;
    const locale = String(settings.locale || document.documentElement.lang || "en-GB");
    const timeZone = String(settings.timeZone || "Europe/Zurich");
    const time = new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    const clock = (value) => value && Number.isFinite(Date.parse(value)) ? time.format(new Date(value)) : "\u2014";
    const stamp = data.updatedAt && Number.isFinite(Date.parse(data.updatedAt)) ? new Date(data.updatedAt) : null;
    const date = stamp ? new Intl.DateTimeFormat(locale, { timeZone, day: "2-digit", month: "short" }).format(stamp) : "\u2014";
    const status = (row) => row.cancelled ? messages.cancelled : row.delayMinutes == null ? messages.timetable : row.delayMinutes === 0 ? messages.onTime : `${row.delayMinutes > 0 ? "+" : ""}${row.delayMinutes} min`;
    const statusClass = (row) => row.cancelled ? "cancelled" : (row.delayMinutes ?? 0) > 0 ? "delay" : "";
    const changed = (row) => yes(settings.showPlatformChanges) && row.platformChanged;
    const departures = data.departures.slice(0, 100);
    const first = departures[0];
    const filter = [settings.destination, settings.lines, settings.transport === "all" ? "" : settings.transport].filter(Boolean).join(" \xB7 ");
    app.classList.add("pp-departures");
    app.dataset.more = String(Math.max(0, Number(data.more) || 0));
    app.dataset.moreLabel = messages.more;
    app.innerHTML = `<header><div class="heading"><p class="eyebrow">${e(messages.departures)} \xB7 ${e(brand)}</p><h1>${e(data.station?.name || settings.stationName || "\u2014")}</h1></div><div class="header-meta">${data.sample ? `<span class="sample">${e(messages.example)}</span>` : ""}${e(date)}</div></header>
          ${first ? `<section class="hero ${first.cancelled ? "is-cancelled" : ""}">
            <div class="hero-time"><p class="eyebrow">${e(messages.next)}</p><div class="hero-clock">${e(clock(first.when))}</div><div class="small">${e(first.cancelled ? messages.cancelled : first.delayMinutes != null ? messages.forecast : messages.timetable)}${first.plannedWhen && first.when !== first.plannedWhen ? ` \xB7 ${e(messages.planned)} ${e(clock(first.plannedWhen))}` : ""}</div></div>
            <div class="hero-main"><span class="line">${e(first.line)}</span><h2>${e(first.direction || "\u2014")}</h2><div class="hero-status"><span class="status ${statusClass(first)}">${e(status(first))}</span><span class="small">${e(first.operator || "")}</span></div></div>
            <div class="platform"><span class="small">${e(messages.platform)}</span><strong class="${changed(first) ? "changed" : ""}">${e(first.platform || "\u2014")}</strong>${changed(first) ? `<div class="changed-label">\u2194 ${e(messages.changed)}<br>${e(first.plannedPlatform)} \u2192 ${e(first.platform)}</div>` : ""}</div>
          </section><section class="board"><div class="board-head"><span>${e(messages.time)}</span><span>${e(messages.line)}</span><span>${e(messages.direction)}</span><span>${e(messages.platformShort)}</span></div>${departures.slice(1).map((row) => `<div class="row ${row.cancelled ? "is-cancelled" : ""}"><div class="row-clock"><span class="row-time">${e(clock(row.when))}</span><br><span class="status ${statusClass(row)}">${e(status(row))}</span></div><div><span class="line">${e(row.line)}</span></div><div class="destination">${e(row.direction || "\u2014")}</div><div class="row-platform"><span class="${changed(row) ? "changed" : ""}">${changed(row) ? "\u2194 " : ""}${e(row.platform || "\u2014")}</span></div></div>`).join("")}</section>` : `<section class="empty"><h2>${e(messages.empty)}</h2><p>${e(messages.emptyHint)}</p></section>`}
          <footer><div class="footer-row"><span>${e(messages.window.replace("{minutes}", String(data.duration ?? settings.duration ?? 90)))}</span><span class="filter">${filter ? `${e(messages.filter)}: ${e(filter)}` : ""}</span><strong class="more"></strong></div><div class="footer-row"><span class="footer-note">${e(data.source)}${data.partial ? ` \xB7 ${e(messages.partial)}` : ""}</span><span>${e(messages.updated)} ${e(clock(data.updatedAt))}</span></div></footer>`;
  }
  function fitDepartureBoard(app) {
    const title = app.querySelector("h1");
    if (title) fitText(title, { min: 18, max: Math.min(65, window.innerWidth * 0.06, window.innerHeight * 0.06) });
    const destination = app.querySelector(".hero h2");
    if (destination) fitText(destination, { min: 17, max: Math.min(52, window.innerWidth * 0.05, window.innerHeight * 0.05) });
    const rows = [...app.querySelectorAll(".row")];
    rows.forEach((row) => row.hidden = false);
    const board = app.querySelector(".board");
    let hidden = 0;
    if (board) for (let i = rows.length - 1; i >= 0 && rows[i].getBoundingClientRect().bottom > board.getBoundingClientRect().bottom + 1; i--) {
      rows[i].hidden = true;
      hidden++;
    }
    const more = app.querySelector(".more");
    const count = hidden + Number(app.dataset.more || 0);
    if (more) more.textContent = count ? (app.dataset.moreLabel || fallbackMessages.more).replace("{count}", String(count)) : "";
  }
  async function bootDepartureIntegration(options) {
    const app = typeof options.target === "string" ? document.querySelector(options.target) : options.target || document.querySelector("#app");
    if (!app) throw Error("Missing departure board target");
    app.classList.add("pp-departures");
    let sequence = 0;
    let controller;
    async function renderPayload(payload2) {
      const target = app;
      const version = ++sequence;
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      markLoading();
      let messages = { ...fallbackMessages };
      try {
        const localized = await loadLanguageJson(payload2);
        if (version !== sequence) return;
        for (const [key, value] of Object.entries(localized.messages)) if (typeof value === "string") messages[key] = value;
        document.documentElement.lang = localized.language;
        const settings = mergeSettings(options.defaults, getSettings(payload2), getQuerySettings());
        applyColorTheme(String(settings.color || options.defaults.color || "red-light"), { defaultTheme: normalizeColorTheme(String(options.defaults.color || "red-light")) });
        target.innerHTML = `<section class="empty"><h2>${escapeHtml(messages.loading)}</h2></section>`;
        const response = await fetch(new URL(options.apiPath || "./api/data", location.href), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
          signal
        });
        if (!response.ok) throw Error("upstream");
        const data = await response.json();
        if (version !== sequence) return;
        if (data.error) throw Error(String(data.error));
        if (!Array.isArray(data.departures)) throw Error("upstream");
        renderDepartureBoard(target, data, { ...settings, timeZone: settings.timeZone || options.timeZone, locale: settings.locale || options.locale || localized.language }, messages, options.brand);
        await document.fonts?.ready;
        if (version !== sequence) return;
        fitDepartureBoard(target);
        markReady();
      } catch (error) {
        if (version !== sequence || signal.aborted) return;
        const key = error instanceof Error ? error.message : "upstream";
        target.innerHTML = `<section class="empty"><p class="eyebrow">${escapeHtml(options.brand)}</p><h2>${escapeHtml(messages.errorTitle)}</h2><p>${escapeHtml(messages[key] || messages.upstream)}</p></section>`;
        markError(error);
      }
    }
    window.addEventListener("resize", () => fitDepartureBoard(app));
    const payload = await waitForPayload({ timeoutMs: 500, onUpdate: renderPayload });
    await renderPayload(payload);
  }

  // src/dashboard.ts
  var safe = (v, n = 180) => escapeHtml(String(v ?? "").slice(0, n));
  var tone = (v) => ["green", "blue", "red", "orange"].includes(String(v)) ? String(v) : "accent";
  var iconPaths = {
    leaf: '<path d="M7 27C2 9 15 4 28 4c1 14-4 26-21 23ZM7 28 23 10"/>',
    bread: '<path d="M8 11C1 6 1 24 8 22v9h20v-9c7 2 7-16 0-11-3-10-17-10-20 0ZM15 15v9m7-9v9"/>',
    bottle: '<path d="M14 3h8v7l5 6v16H9V16l5-6ZM9 21h18"/>',
    cup: '<path d="M6 12h20v13c0 10-20 10-20 0ZM26 15h4c9 0 5 12-4 10M10 3v4m7-4v4m7-4v4"/>',
    cart: '<path d="M3 4h5l4 21h17l4-15H10M14 31h1m11 0h1"/>',
    plant: '<path d="M9 23h20l-4 11H13ZM19 23V11M19 18C5 21 4 9 7 5c9 0 14 7 12 13ZM19 13c0-9 7-12 13-11 1 8-5 13-13 11Z"/>',
    bird: '<path d="M5 27c12 7 24-2 22-12l7-4-8-2c-6-7-13-2-13 4L3 19l10 1c-2 3-5 5-8 7ZM17 29l-2 5m9-7 2 7"/>'
  };
  var iconHtml = (name) => name && iconPaths[name] ? `<svg class="pp-dash-icon" viewBox="0 0 38 38" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${iconPaths[name]}</svg>` : "";
  var list = (v, n = 100) => Array.isArray(v) ? v.slice(0, n) : [];
  function renderDashboard(target, data, settings, messages = {}) {
    const msg = (key, fallback) => String(messages[key] || fallback);
    const locale = document.documentElement.lang === "de" ? "de-DE" : "en-GB";
    const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
    const format = (value) => value === null || value === void 0 ? "\u2014" : typeof value === "number" ? nf.format(value) : String(value);
    const rowHtml = (r) => `<article class="pp-dash-row pp-dash-${tone(r.tone)}"><div class="pp-dash-row-main">${iconHtml(r.icon)}<div><h2>${safe(r.title)}</h2>${r.detail ? `<p>${safe(r.detail)}</p>` : ""}</div></div>${r.badge ? `<strong class="pp-dash-badge">${safe(r.badge, 48)}</strong>` : ""}</article>`;
    let stamp = "\u2014";
    if (data.updatedAt && Number.isFinite(Date.parse(data.updatedAt))) {
      stamp = new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short", timeZone: String(settings.timeZone || "Europe/Berlin") }).format(new Date(data.updatedAt));
    }
    const metrics = list(data.metrics, 4);
    const rows = list(data.rows);
    const columns = list(data.columns, 4);
    const heatmap = list(data.heatmap, 371);
    const chart = data.chart;
    let graphic = "";
    if (chart) {
      const points = list(chart.points, 72);
      const valid = points.filter((p) => p.value !== null && Number.isFinite(p.value));
      const min = Math.min(0, ...valid.map((p) => Number(p.value)));
      const max = Math.max(1, ...valid.map((p) => Number(p.value)));
      const xy = (p, i) => `${20 + i * 760 / Math.max(1, points.length - 1)},${140 - (Number(p.value) - min) / (max - min) * 120}`;
      const segments = [];
      let current = [];
      points.forEach((p, i) => {
        if (p.value !== null && Number.isFinite(p.value)) current.push(xy(p, i));
        else if (current.length) {
          segments.push(current.join(" "));
          current = [];
        }
      });
      if (current.length) segments.push(current.join(" "));
      graphic = `<section class="pp-dash-chart"><h2>${safe(chart.label)}${chart.unit ? ` \xB7 ${safe(chart.unit)}` : ""}</h2><svg viewBox="0 0 800 162" role="img" aria-label="${safe(chart.label)}"><path d="M20 140H780" stroke="currentColor" fill="none"/>${segments.map((points2) => `<polyline points="${points2}" fill="none" stroke="var(--pp-accent)" stroke-width="5"/>`).join("")}</svg><div class="pp-dash-axis"><span>${safe(points[0]?.label)}</span><span>${safe(nf.format(min))} \u2013 ${safe(nf.format(max))} ${safe(chart.unit)}</span><span>${safe(points.at(-1)?.label)}</span></div></section>`;
    }
    if (heatmap.length) {
      const max = Math.max(1, ...heatmap.map((x) => x.count));
      const weekday = (/* @__PURE__ */ new Date(`${heatmap[0].date}T12:00:00Z`)).getUTCDay();
      graphic += `<section class="pp-dash-activity"><div class="pp-dash-heatmap">${Array.from({ length: weekday }, () => '<span class="pp-dash-day pp-dash-spacer"></span>').join("")}${heatmap.map((d) => `<span class="pp-dash-day ${d.count > 0 ? "pp-dash-active" : ""}" title="${safe(d.date)}: ${safe(d.count)}" style="--level:${d.count > max / 2 ? 1 : 0.55}"></span>`).join("")}</div><div class="pp-dash-axis"><span>${safe(heatmap[0]?.date)}</span><span>${safe(msg("contributions", "Contributions"))}</span><span>${safe(heatmap.at(-1)?.date)}</span></div></section>`;
    }
    const content = columns.length ? `<div class="pp-dash-board">${columns.map((c) => `<section class="pp-dash-column"><h2>${safe(c.title)}</h2><div class="pp-dash-list">${list(c.rows).map(rowHtml).join("")}</div><small class="pp-dash-column-count" data-total="${Number(c.total ?? c.rows.length)}"></small></section>`).join("")}</div>` : `<div class="pp-dash-list">${rows.map(rowHtml).join("")}</div>`;
    target.classList.add("pp-dashboard");
    target.innerHTML = `<header class="pp-dash-header"><div class="pp-dash-eyebrow">${safe(data.sample ? msg("sample", "DEMO DATA") : data.source)}</div><h1>${safe(settings.title || messages.title || "Dashboard", 80)}</h1>${data.subtitle ? `<p>${safe(data.subtitle)}</p>` : ""}</header>${metrics.length ? `<section class="pp-dash-metrics">${metrics.map((m) => `<article class="pp-dash-metric pp-dash-${tone(m.tone)}"><p>${safe(m.label)}</p><strong>${safe(format(m.value), 40)}<small>${safe(m.unit)}</small></strong></article>`).join("")}</section>` : ""}<section class="pp-dash-content">${graphic}${content}${!rows.length && !columns.length && !graphic && !metrics.length ? `<p class="pp-dash-empty">${safe(msg("empty", "No entries"))}</p>` : ""}</section><p class="pp-dash-note">${safe(data.partial ? msg("partial", "Partial data") + " \xB7 " : "")}${safe(data.note, 280)}</p><footer class="pp-dash-footer"><span class="pp-dash-count" data-total="${Number(data.total ?? rows.length)}">${safe(data.source)}</span><span>${safe(msg("updated", "Retrieved"))} ${safe(stamp)}</span></footer>`;
    target.dataset.moreLabel = msg("more", "+{count} more");
  }
  function fitDashboard(target) {
    target.querySelectorAll(".pp-dash-row").forEach((r) => {
      r.hidden = false;
    });
    const content = target.querySelector(".pp-dash-content");
    if (!content) return;
    const lists = Array.from(target.querySelectorAll(".pp-dash-list"));
    for (const container of lists) {
      const rows = Array.from(container.querySelectorAll(".pp-dash-row"));
      let visible = rows.length;
      const overflow = () => {
        const last = rows[visible - 1];
        const limit = target.querySelector(".pp-dash-board") ? container.getBoundingClientRect().bottom : content.getBoundingClientRect().bottom;
        return last && last.getBoundingClientRect().bottom > limit + 1;
      };
      while (visible > 0 && overflow()) rows[--visible].hidden = true;
      const count = container.parentElement?.querySelector(".pp-dash-column-count") || target.querySelector(".pp-dash-count");
      if (count) {
        const hidden = Math.max(0, Number(count.dataset.total || rows.length) - visible);
        count.textContent = hidden ? (target.dataset.moreLabel || "+{count} more").replace("{count}", String(hidden)) : "";
      }
    }
  }
  async function bootDashboardIntegration(options) {
    const target = typeof options.target === "string" ? document.querySelector(options.target) : options.target || document.querySelector("#app");
    if (!target) throw new Error("Dashboard target not found");
    let revision = 0;
    let controller;
    async function renderPayload(payload2) {
      const current = ++revision;
      controller?.abort();
      controller = new AbortController();
      const activeController = controller;
      const signal = activeController.signal;
      markLoading();
      let messages = {};
      try {
        const loaded = await loadLanguageJson(payload2, { supported: ["de", "en"] });
        if (current !== revision) return;
        messages = loaded.messages;
        document.documentElement.lang = loaded.language;
        const settings = mergeSettings(options.defaults, getSettings(payload2), getQuerySettings());
        applyColorTheme(String(settings.color || ""), { defaultTheme: normalizeColorTheme(String(options.defaults.color || "blue-light")) });
        const url = new URL(options.apiPath || "./api/data", location.href);
        if (url.origin !== location.origin) throw new Error("Dashboard API must be same-origin");
        const timer = setTimeout(() => activeController.abort(), 45e3);
        let response;
        try {
          response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...settings, language: loaded.language }), signal });
        } finally {
          clearTimeout(timer);
        }
        if (!response.ok) throw new Error("Provider request failed");
        const data = await response.json();
        if (current !== revision) return;
        renderDashboard(target, data, settings, messages);
        await document.fonts?.ready;
        if (current !== revision) return;
        fitDashboard(target);
        markReady();
      } catch {
        if (current !== revision) return;
        const title = String(messages.error || "Could not load data");
        target.classList.add("pp-dashboard");
        target.innerHTML = `<header class="pp-dash-header"><h1>${safe(title)}</h1></header><p>${safe(messages.setup || "Check the integration settings and connection.", 300)}</p>`;
        markError(new Error(title));
      }
    }
    window.addEventListener("resize", () => fitDashboard(target));
    const payload = await waitForPayload({ timeoutMs: 500, onUpdate: renderPayload });
    await renderPayload(payload);
  }

  // src/hyphenation.ts
  var SOFT_HYPHEN = "\xAD";
  var defaultWordPattern = /[A-Za-zÀ-ÿĀ-žА-я]{8,}/g;
  var vowels = "aeiouy\xE4\xF6\xFCAEIOUY\xC4\xD6\xDC\xE1\xE0\xE2\xE3\xE5\u0101\u0103\u0105\xC1\xC0\xC2\xC3\xC5\u0100\u0102\u0104\xE9\xE8\xEA\xEB\u0113\u0115\u0117\u0119\u011B\xC9\xC8\xCA\xCB\u0112\u0114\u0116\u0118\u011A\xED\xEC\xEE\xEF\u012B\u012D\xCD\xCC\xCE\xCF\u012A\u012C\xF3\xF2\xF4\xF5\xF8\u014D\u014F\u0151\xD3\xD2\xD4\xD5\xD8\u014C\u014E\u0150\xFA\xF9\xFB\u016B\u016D\u016F\u0171\xDA\xD9\xDB\u016A\u016C\u016E\u0170";
  function stripSoftHyphens(value) {
    return value.replaceAll(SOFT_HYPHEN, "");
  }
  function isLetter(value) {
    return /\p{L}/u.test(value);
  }
  function isVowel(value) {
    return vowels.includes(value);
  }
  function findBreakPosition(word, from, target, minSegmentLength) {
    const min = from + minSegmentLength;
    const max = word.length - minSegmentLength;
    const preferred = Math.min(max, Math.max(min, target));
    for (let distance = 0; distance <= Math.max(preferred - min, max - preferred); distance += 1) {
      for (const candidate of [preferred + distance, preferred - distance]) {
        if (candidate <= min || candidate >= max) {
          continue;
        }
        const before = word[candidate - 1] ?? "";
        const after = word[candidate] ?? "";
        if (isLetter(before) && isLetter(after) && isVowel(before) !== isVowel(after)) {
          return candidate;
        }
      }
    }
    return preferred;
  }
  function hyphenateWord(word, options = {}) {
    const {
      minWordLength = 8,
      minSegmentLength = 3,
      segmentLength = 6
    } = options;
    const clean = stripSoftHyphens(word);
    if (clean.length < minWordLength || clean.length <= minSegmentLength * 2) {
      return clean;
    }
    const parts = [];
    let from = 0;
    while (clean.length - from > segmentLength + minSegmentLength) {
      const target = from + segmentLength;
      const next = findBreakPosition(clean, from, target, minSegmentLength);
      parts.push(clean.slice(from, next));
      from = next;
    }
    parts.push(clean.slice(from));
    return parts.join(SOFT_HYPHEN);
  }
  function hyphenateText(value, options = {}) {
    const wordPattern = options.wordPattern ?? defaultWordPattern;
    return stripSoftHyphens(value).replace(wordPattern, (word) => hyphenateWord(word, options));
  }
  function addSoftHyphensToTextNodes(root, options = {}) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      nodes.push(walker.currentNode);
    }
    for (const node of nodes) {
      const value = node.nodeValue ?? "";
      if (value.trim()) {
        node.nodeValue = hyphenateText(value, options);
      }
    }
  }
  function prepareHyphenation(element, options = {}) {
    const { lang, lineBreak = "balance", ...hyphenationOptions } = options;
    if (lang) {
      element.lang = lang;
    }
    element.style.whiteSpace = "normal";
    element.style.overflowWrap = "break-word";
    element.style.hyphens = "manual";
    if (lineBreak === "balance") {
      element.style.textWrap = "balance";
    }
    addSoftHyphensToTextNodes(element, hyphenationOptions);
  }
  function fitHyphenatedText(element, options = {}) {
    const {
      lang,
      minWordLength,
      minSegmentLength,
      segmentLength,
      wordPattern,
      lineBreak = "balance",
      ...fitOptions
    } = options;
    prepareHyphenation(element, {
      lang,
      lineBreak,
      minWordLength,
      minSegmentLength,
      segmentLength,
      wordPattern
    });
    fitText(element, {
      ...fitOptions,
      lineBreak: false
    });
  }

  // src/resize.ts
  var fitToScreenStates = /* @__PURE__ */ new WeakMap();
  var fitImageStates = /* @__PURE__ */ new WeakMap();
  function getTarget(element) {
    return element ?? globalThis.document?.body;
  }
  function requestFrame(callback) {
    if (typeof window.requestAnimationFrame === "function") {
      return window.requestAnimationFrame(callback);
    }
    return window.setTimeout(() => callback(window.performance.now()), 0);
  }
  function onScreenResize(callback) {
    window.addEventListener("resize", callback);
    window.addEventListener("orientationchange", callback);
    window.visualViewport?.addEventListener("resize", callback);
    return () => {
      window.removeEventListener("resize", callback);
      window.removeEventListener("orientationchange", callback);
      window.visualViewport?.removeEventListener("resize", callback);
    };
  }
  function scheduleFrame(state) {
    if (state.frame) {
      return;
    }
    state.frame = requestFrame(() => {
      state.frame = 0;
      state.update();
    });
  }
  function applyFitToScreen(target, options) {
    const { padding = 0, maxScale = 1 } = options;
    target.style.transform = "";
    target.style.transformOrigin = "top left";
    const rect = target.getBoundingClientRect();
    const width = rect.width || target.scrollWidth;
    const height = rect.height || target.scrollHeight;
    const availableWidth = Math.max(0, window.innerWidth - padding * 2);
    const availableHeight = Math.max(0, window.innerHeight - padding * 2);
    if (!width || !height || !availableWidth || !availableHeight) {
      return 1;
    }
    const scale = Math.min(maxScale, availableWidth / width, availableHeight / height);
    target.style.transform = `scale(${scale})`;
    return scale;
  }
  function observeFitToScreen(target, options) {
    const state = {
      frame: 0,
      options,
      update: () => {
        if (!target.isConnected && target !== globalThis.document?.body) {
          state.removeListeners();
          fitToScreenStates.delete(target);
          return;
        }
        applyFitToScreen(target, state.options);
      },
      removeListeners: () => void 0
    };
    const schedule = () => scheduleFrame(state);
    state.removeListeners = onScreenResize(schedule);
    fitToScreenStates.set(target, state);
    return state;
  }
  function fitToScreen(element, options = {}) {
    const target = getTarget(element);
    if (typeof window === "undefined" || !target) {
      return 1;
    }
    const state = fitToScreenStates.get(target) ?? observeFitToScreen(target, options);
    state.options = options;
    return applyFitToScreen(target, options);
  }
  function applyFitImage(image, mode) {
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.objectFit = mode;
  }
  function observeFitImage(image, mode) {
    const state = {
      frame: 0,
      mode,
      update: () => {
        if (!image.isConnected) {
          state.removeListeners();
          fitImageStates.delete(image);
          return;
        }
        applyFitImage(image, state.mode);
      },
      removeListeners: () => void 0
    };
    const schedule = () => scheduleFrame(state);
    state.removeListeners = onScreenResize(schedule);
    fitImageStates.set(image, state);
    return state;
  }
  function fitImage(image, mode = "contain") {
    if (typeof window !== "undefined") {
      const state = fitImageStates.get(image) ?? observeFitImage(image, mode);
      state.mode = mode;
    }
    applyFitImage(image, mode);
  }

  // src/overflow.ts
  function elementOverflows(element) {
    return element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
  }
  function detectOverflow(root) {
    const target = root ?? globalThis.document?.body;
    if (!target) {
      return {
        hasOverflow: false,
        elements: []
      };
    }
    const elements = [target, ...Array.from(target.querySelectorAll("*"))].filter(
      elementOverflows
    );
    return {
      hasOverflow: elements.length > 0,
      elements
    };
  }

  // src/ofTheDay.ts
  var states = /* @__PURE__ */ new WeakMap();
  var textSizes = ["small", "middle", "big"];
  var layoutClasses = ["auto", "default", "facts-left-landscape", "side", "stack", "hide-header", "no-facts", "text-small", "text-middle", "text-big"].map((value) => `pp-otd--${value}`);
  function normalizeTextSize(value) {
    const size = String(value || "middle").toLowerCase();
    return textSizes.includes(size) ? size : "middle";
  }
  function resolveTarget(target) {
    if (target instanceof HTMLElement) return target;
    const element = document.querySelector(target || "#app");
    if (!element) throw new Error(`Could not find of-the-day target: ${target || "#app"}`);
    return element;
  }
  function hasText(value) {
    return String(value ?? "").trim().length > 0;
  }
  function renderMeta(item) {
    return `<span class="pp-otd-meta-item ${escapeHtml(item.className || "")}" data-key="${escapeHtml(item.key || "")}">${hasText(item.label) ? `<span class="pp-otd-meta-label">${escapeHtml(item.label)}: </span>` : ""}<span class="pp-otd-meta-value">${escapeHtml(item.value)}</span></span>`;
  }
  function renderOfTheDayLayout(options) {
    const target = resolveTarget(options.target);
    const previous = states.get(target);
    previous?.removeListeners?.();
    if (previous?.frame) cancelAnimationFrame(previous.frame);
    const textSize = normalizeTextSize(options.textSize);
    const mode = options.layout || "auto";
    const facts = (options.facts || []).filter((item) => item.visible !== false);
    const meta = (options.meta || []).filter((item) => item.visible !== false && hasText(item.value));
    const date = meta.filter((item) => item.key === "date");
    const source = meta.filter((item) => item.key !== "date");
    const image = options.image || {};
    target.classList.add("pp-screen", "pp-otd-screen");
    target.classList.remove(...layoutClasses);
    target.classList.add(`pp-otd--${mode}`, `pp-otd--text-${textSize}`);
    target.classList.toggle("pp-otd--hide-header", options.showHeader === false);
    target.classList.toggle("pp-otd--no-facts", facts.length === 0);
    if (options.className) target.classList.add(...options.className.split(/\s+/).filter(Boolean));
    target.style.transform = "";
    for (const [key, value] of Object.entries(options.customProperties || {})) {
      if (value !== void 0) target.style.setProperty(key.startsWith("--") ? key : `--${key}`, String(value));
    }
    target.innerHTML = `
    <section class="pp-otd-shell">
      <header class="pp-otd-header">
        <div class="pp-otd-topline">
          <p class="pp-otd-kicker">${escapeHtml(options.kicker || "")}</p>
          <div class="pp-otd-date">${date.map(renderMeta).join("")}</div>
        </div>
        <div class="pp-otd-title-area">
          <h1 class="pp-otd-title pp-fit">${escapeHtml(options.title)}</h1>
          ${hasText(options.subtitle) ? `<p class="pp-otd-subtitle">${escapeHtml(options.subtitle)}</p>` : ""}
        </div>
        ${hasText(options.signature) ? `<p class="pp-otd-signature">${escapeHtml(options.signature)}</p>` : ""}
      </header>
      <div class="pp-otd-image-stage"><img class="pp-otd-image ${escapeHtml(image.className || "")}" src="${escapeHtml(image.src || "")}" alt="${escapeHtml(image.alt || "")}" /></div>
      <section class="pp-otd-fact-grid" data-count="${facts.length}">
        ${facts.map((fact) => `<article class="pp-otd-fact ${escapeHtml(fact.className || "")}"><p class="pp-otd-label">${escapeHtml(fact.label)}</p><p class="pp-otd-value">${escapeHtml(hasText(fact.value) ? fact.value : options.emptyValue ?? "N/A")}</p></article>`).join("")}
      </section>
      <footer class="pp-otd-footer"><div class="pp-otd-meta">${source.map(renderMeta).join("")}</div><p class="pp-otd-facts-shown" hidden></p></footer>
    </section>`;
    const renderedImage = target.querySelector(".pp-otd-image");
    renderedImage.style.objectFit = image.fit || "contain";
    renderedImage.style.objectPosition = image.position || "center";
    if (image.blendMode) renderedImage.style.mixBlendMode = image.blendMode;
    states.set(target, { mode, textSize, options: {}, showFactCount: options.showFactCount === true, factsShown: options.factsShown || "{shown} of {total} facts" });
    return {
      target,
      shell: target.querySelector(".pp-otd-shell"),
      header: target.querySelector(".pp-otd-header"),
      title: target.querySelector(".pp-otd-title"),
      signature: target.querySelector(".pp-otd-signature"),
      subtitle: target.querySelector(".pp-otd-subtitle"),
      imageStage: target.querySelector(".pp-otd-image-stage"),
      image: renderedImage,
      factGrid: target.querySelector(".pp-otd-fact-grid"),
      facts: Array.from(target.querySelectorAll(".pp-otd-fact")),
      meta: Array.from(target.querySelectorAll(".pp-otd-meta-item"))
    };
  }
  function fitLayout(root, state) {
    const width = root.clientWidth || window.innerWidth;
    const height = root.clientHeight || window.innerHeight;
    const landscape = width > height;
    const unit = landscape ? Math.min(width / 800, height / 480) : Math.min(width / 480, height / 800);
    const scale = Math.max(0.5, unit);
    const multiplier = { small: 0.9, middle: 1, big: 1.18 }[state.textSize];
    const image = root.querySelector(".pp-otd-image");
    const side = landscape && (state.mode === "facts-left-landscape" || state.mode === "auto" && image.naturalWidth / image.naturalHeight < 1.25);
    const facts = Array.from(root.querySelectorAll(".pp-otd-fact"));
    const grid = root.querySelector(".pp-otd-fact-grid");
    const stage = root.querySelector(".pp-otd-image-stage");
    const summary = root.querySelector(".pp-otd-facts-shown");
    const title = root.querySelector(".pp-otd-title");
    const signature = root.querySelector(".pp-otd-signature");
    root.classList.toggle("pp-otd--side", side);
    root.classList.toggle("pp-otd--stack", !side);
    root.style.setProperty("--pp-otd-unit", `${scale}px`);
    root.style.setProperty("--pp-otd-text-scale", String(multiplier));
    root.style.setProperty("--pp-otd-extra-padding", `${Math.max(0, state.options.screenPadding || 0)}px`);
    title.style.fontSize = state.options.titleMax ? `${state.options.titleMax}px` : "";
    if (signature) {
      signature.style.fontSize = state.options.signatureMax ? `${state.options.signatureMax}px` : "";
      if (state.options.signatureMin) {
        signature.style.fontSize = `${Math.max(state.options.signatureMin, parseFloat(getComputedStyle(signature).fontSize))}px`;
      }
    }
    const titleSize = parseFloat(getComputedStyle(title).fontSize);
    const titleMin = Math.min(titleSize, state.options.titleMin ?? 24 * scale * multiplier);
    for (let size = titleSize; size >= titleMin; size -= scale) {
      title.style.fontSize = `${Math.max(titleMin, size)}px`;
      const style = getComputedStyle(title);
      if (title.scrollWidth <= title.clientWidth + 2 && title.clientHeight <= parseFloat(style.lineHeight) * 2 + 2) break;
    }
    const imageFloor = side ? 0 : height * (landscape ? 0.46 : 0.43);
    let shown = facts.length;
    const update = (count, columns) => {
      facts.forEach((fact, index) => {
        fact.hidden = index >= count;
        fact.style.gridColumn = index === count - 1 && count % columns === 1 && columns > 1 ? "1 / -1" : "";
      });
      root.classList.toggle("pp-otd--no-facts", count === 0);
      grid.dataset.visibleCount = String(count);
      grid.style.setProperty("--pp-otd-columns", String(columns));
      summary.hidden = !state.showFactCount || count === facts.length;
      summary.textContent = !summary.hidden ? state.factsShown.replace(/\{shown\}/g, String(count)).replace(/\{total\}/g, String(facts.length)) : "";
    };
    const fits = () => {
      const bounds = root.getBoundingClientRect();
      if (stage.clientHeight < imageFloor || stage.clientWidth < 1) return false;
      return Array.from(root.querySelectorAll(".pp-otd-header, .pp-otd-header *, .pp-otd-fact-grid, .pp-otd-fact:not([hidden]), .pp-otd-fact:not([hidden]) > *, .pp-otd-footer, .pp-otd-footer *")).every((element) => {
        if (!element.getClientRects().length) return true;
        const rect = element.getBoundingClientRect();
        return element.scrollHeight <= element.clientHeight + 2 && element.scrollWidth <= element.clientWidth + 2 && rect.bottom <= bounds.bottom + 1 && rect.right <= bounds.right + 1;
      });
    };
    let valid = false;
    const columnChoices = side || !landscape ? [2, 3] : [Math.min(5, Math.max(1, shown)), 4, 3];
    for (; shown >= 0; shown--) {
      for (const columns of [...new Set(columnChoices)].filter((count) => count <= Math.max(1, shown))) {
        update(shown, columns);
        if (fits()) {
          valid = true;
          break;
        }
      }
      if (valid) break;
      if (shown <= 1) {
        update(shown, 1);
        if (fits()) {
          valid = true;
          break;
        }
      }
    }
    shown = Math.max(0, shown);
    root.dataset.visibleFacts = String(shown);
    root.dataset.selectedFacts = String(facts.length);
    root.dataset.layoutOverflow = String(!valid);
    return { selectedFacts: facts.length, visibleFacts: shown, layout: side ? "side" : "stack", hasOverflow: !valid };
  }
  function fitOfTheDayLayout(layout, options = {}) {
    const root = typeof layout === "string" || layout instanceof HTMLElement ? resolveTarget(layout) : layout.target;
    const state = states.get(root);
    if (!state) throw new Error("Render the of-the-day layout before fitting it.");
    state.options = options;
    state.textSize = normalizeTextSize(options.textSize || state.textSize);
    if (!state.removeListeners) {
      const update = () => {
        if (state.frame) cancelAnimationFrame(state.frame);
        state.frame = requestAnimationFrame(() => {
          state.frame = void 0;
          if (root.isConnected) fitLayout(root, state);
          else {
            state.removeListeners?.();
            state.removeListeners = void 0;
          }
        });
      };
      window.addEventListener("resize", update);
      window.addEventListener("orientationchange", update);
      state.removeListeners = () => {
        window.removeEventListener("resize", update);
        window.removeEventListener("orientationchange", update);
      };
    }
    return fitLayout(root, state);
  }
  async function waitForOfTheDayImage(layoutOrImage) {
    const image = layoutOrImage instanceof HTMLImageElement ? layoutOrImage : layoutOrImage.image;
    if (image.complete) {
      if (image.naturalWidth > 0) {
        await image.decode?.();
        return;
      }
      throw new Error("Image could not load.");
    }
    await new Promise((resolve, reject) => {
      const cleanup = () => {
        image.removeEventListener("load", loaded);
        image.removeEventListener("error", failed);
      };
      const loaded = () => {
        cleanup();
        resolve();
      };
      const failed = () => {
        cleanup();
        reject(new Error("Image could not load."));
      };
      image.addEventListener("load", loaded, { once: true });
      image.addEventListener("error", failed, { once: true });
    });
    await image.decode?.();
  }

  // src/calendar.ts
  var DEFAULT_CALENDAR_SETTINGS = {
    view: "agenda",
    fontSize: 100,
    noPadding: false,
    fullWeekdayNames: false,
    locale: "en",
    dayRange: 14,
    maxEvents: 20,
    highlightToday: false,
    highlightScale: 1,
    showLocation: true,
    showEventIcons: true,
    showEventImages: true,
    showDaySummary: false,
    automaticEventIcons: false,
    showHeader: true,
    personalTitle: "",
    personalSubtitle: "",
    informationDensity: "comfortable"
  };
  var DEFAULT_CALENDAR_MESSAGES = {
    allDay: "All day",
    empty: "No events",
    moreEvents: "+{count} more",
    today: "Today",
    tomorrow: "Tomorrow",
    nextEvent: "Up next",
    ongoing: "Now",
    later: "Coming up",
    untitled: "Untitled event",
    dayAtGlance: "Your day at a glance",
    remainingOne: "1 timed event remaining",
    remainingMany: "{count} timed events remaining",
    allDayCount: "{count} all-day",
    noMoreToday: "No more timed events today",
    freeAfter: "No timed events after {time}",
    asOf: "As of {time}"
  };
  var VIEW_ALIASES = {
    agenda: "agenda",
    "agenda-modern": "agenda-modern",
    "today-next": "today-next",
    day: "day",
    "3-days": "three-days",
    "3days": "three-days",
    three: "three-days",
    "three-day": "three-days",
    "three-days": "three-days",
    week: "week",
    "rolling-week": "rolling-week",
    "rolling-week-list": "rolling-week-list",
    year: "year"
  };
  var VIEW_CLASSES = [
    "pp-cal--view-agenda",
    "pp-cal--view-agenda-modern",
    "pp-cal--view-today-next",
    "pp-cal--view-day",
    "pp-cal--view-three-days",
    "pp-cal--view-week",
    "pp-cal--view-rolling-week",
    "pp-cal--view-rolling-week-list",
    "pp-cal--view-year"
  ];
  var DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
  function clampInteger(value, fallback, min, max) {
    const parsed = Number.parseInt(String(value ?? ""), 10);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
  }
  function clampNumber(value, fallback, min, max) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
  }
  function parseBoolean(value, fallback) {
    if (typeof value === "boolean") {
      return value;
    }
    if (typeof value === "number") {
      return value !== 0;
    }
    const normalized = String(value ?? "").trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return true;
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return false;
    }
    return fallback;
  }
  function text(value) {
    return String(value ?? "").trim();
  }
  function hasText2(value) {
    return text(value).length > 0;
  }
  function validTimeZone(value) {
    const timeZone = text(value);
    if (!timeZone) {
      return void 0;
    }
    try {
      new Intl.DateTimeFormat("en", { timeZone }).format(/* @__PURE__ */ new Date());
      return timeZone;
    } catch {
      return void 0;
    }
  }
  function validLocale(value, fallback) {
    const locale = text(value) || fallback;
    try {
      new Intl.DateTimeFormat(locale).format(/* @__PURE__ */ new Date());
      return locale;
    } catch {
      return fallback;
    }
  }
  function normalizeCalendarSettings(input, defaults = {}) {
    const base = { ...DEFAULT_CALENDAR_SETTINGS, ...defaults };
    const source = input || {};
    const requestedView = text(source.view).toLowerCase();
    const view = VIEW_ALIASES[requestedView] ?? base.view;
    const localeValue = source.locale ?? source.language;
    const dayRangeValue = source.dayRange ?? source.daysAhead;
    return {
      view,
      fontSize: clampNumber(source.fontSize, base.fontSize, 75, 150),
      noPadding: parseBoolean(source.noPadding, base.noPadding),
      fullWeekdayNames: parseBoolean(source.fullWeekdayNames, base.fullWeekdayNames),
      locale: validLocale(localeValue, base.locale),
      timeZone: validTimeZone(source.timeZone ?? base.timeZone),
      dayRange: clampInteger(dayRangeValue, base.dayRange, 1, 366),
      maxEvents: clampInteger(source.maxEvents, base.maxEvents, 1, 200),
      highlightToday: parseBoolean(source.highlightToday, base.highlightToday),
      highlightScale: clampNumber(source.highlightScale, base.highlightScale, 1, 3),
      showLocation: parseBoolean(source.showLocation, base.showLocation),
      showEventIcons: parseBoolean(source.showEventIcons, base.showEventIcons),
      showEventImages: parseBoolean(source.showEventImages, base.showEventImages),
      showDaySummary: parseBoolean(source.showDaySummary, base.showDaySummary),
      automaticEventIcons: parseBoolean(source.automaticEventIcons, base.automaticEventIcons),
      showHeader: parseBoolean(source.showHeader, base.showHeader),
      personalTitle: text(source.personalTitle ?? base.personalTitle).slice(0, 100),
      personalSubtitle: text(source.personalSubtitle ?? base.personalSubtitle).slice(0, 160),
      informationDensity: ["automatic", "comfortable", "compact", "spacious"].includes(text(source.informationDensity)) ? source.informationDensity : base.informationDensity
    };
  }
  function pad(value) {
    return String(value).padStart(2, "0");
  }
  function partsToDateKey(parts) {
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return values.year && values.month && values.day ? `${values.year}-${values.month}-${values.day}` : null;
  }
  function dateKeyFromDate(value, timeZone) {
    if (Number.isNaN(value.getTime())) {
      return "";
    }
    if (timeZone) {
      try {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        });
        const formatted = partsToDateKey(formatter.formatToParts(value));
        if (formatted) {
          return formatted;
        }
      } catch {
      }
    }
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  function dateKeyToUtcDate(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12));
  }
  function dateKeyToDisplayDate(dateKey) {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
  }
  function addDaysToKey(dateKey, count) {
    const date = dateKeyToUtcDate(dateKey);
    date.setUTCDate(date.getUTCDate() + count);
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  }
  function dateKeysBetween(startKey, endKey) {
    const result = [];
    for (let key = startKey; key < endKey; key = addDaysToKey(key, 1)) {
      result.push(key);
    }
    return result;
  }
  function normalizeNow(value) {
    const date = value instanceof Date ? new Date(value.getTime()) : new Date(value ?? Date.now());
    return Number.isNaN(date.getTime()) ? /* @__PURE__ */ new Date() : date;
  }
  function buildCalendarRange(settingsInput = {}, now) {
    const settings = normalizeCalendarSettings(settingsInput);
    const referenceKey = dateKeyFromDate(normalizeNow(now), settings.timeZone);
    let startKey = referenceKey;
    let endKey = addDaysToKey(startKey, 1);
    if (["agenda", "agenda-modern", "today-next"].includes(settings.view)) {
      endKey = addDaysToKey(startKey, settings.dayRange);
    } else if (settings.view === "three-days") {
      endKey = addDaysToKey(startKey, 3);
    } else if (settings.view === "rolling-week" || settings.view === "rolling-week-list") {
      endKey = addDaysToKey(startKey, 7);
    } else if (settings.view === "week") {
      const day = dateKeyToUtcDate(referenceKey).getUTCDay();
      startKey = addDaysToKey(referenceKey, -((day + 6) % 7));
      endKey = addDaysToKey(startKey, 7);
    } else if (settings.view === "year") {
      const year = Number(referenceKey.slice(0, 4));
      startKey = `${year}-01-01`;
      endKey = `${year + 1}-01-01`;
    }
    return {
      view: settings.view,
      startDate: dateKeyToDisplayDate(startKey),
      endDate: dateKeyToDisplayDate(endKey),
      startKey,
      endKey,
      dateKeys: dateKeysBetween(startKey, endKey)
    };
  }
  function eventDateKey(event, settings) {
    const dateOnly = text(event.start?.date).slice(0, 10);
    if (DATE_KEY_PATTERN.test(dateOnly)) {
      return dateOnly;
    }
    const rawDateTime = text(event.start?.dateTime);
    const date = new Date(rawDateTime);
    if (!Number.isNaN(date.getTime())) {
      return dateKeyFromDate(date, settings.timeZone ?? validTimeZone(event.start?.timeZone));
    }
    const prefix = rawDateTime.slice(0, 10);
    return DATE_KEY_PATTERN.test(prefix) ? prefix : "";
  }
  function eventLastDateKey(event, settings, startKey) {
    const endDate = text(event.end?.date).slice(0, 10);
    if (DATE_KEY_PATTERN.test(endDate)) {
      const inclusiveEnd = addDaysToKey(endDate, -1);
      return inclusiveEnd >= startKey ? inclusiveEnd : startKey;
    }
    const endDateTime = new Date(text(event.end?.dateTime));
    if (!Number.isNaN(endDateTime.getTime())) {
      const startDateTime = new Date(text(event.start?.dateTime));
      const inclusiveEnd = new Date(
        endDateTime.getTime() > startDateTime.getTime() ? endDateTime.getTime() - 1 : endDateTime.getTime()
      );
      const endKey = dateKeyFromDate(
        inclusiveEnd,
        settings.timeZone ?? validTimeZone(event.end?.timeZone) ?? validTimeZone(event.start?.timeZone)
      );
      return endKey >= startKey ? endKey : startKey;
    }
    return startKey;
  }
  function eventVisibleDateKeys(event, settings, range) {
    const startKey = eventDateKey(event, settings);
    if (!startKey) {
      return [];
    }
    const lastKey = eventLastDateKey(event, settings, startKey);
    const visibleStart = startKey < range.startKey ? range.startKey : startKey;
    const eventEndExclusive = addDaysToKey(lastKey, 1);
    const visibleEnd = eventEndExclusive > range.endKey ? range.endKey : eventEndExclusive;
    return visibleStart < visibleEnd ? dateKeysBetween(visibleStart, visibleEnd) : [];
  }
  function eventSortTime(event, dateKey) {
    const dateTime = new Date(text(event.start?.dateTime));
    if (!Number.isNaN(dateTime.getTime())) {
      return dateTime.getTime();
    }
    return dateKeyToUtcDate(dateKey).getTime() - 432e5;
  }
  function prepareCalendarEvents(events, settingsInput = {}, now) {
    const settings = normalizeCalendarSettings(settingsInput);
    const range = buildCalendarRange(settings, now);
    return (Array.isArray(events) ? events : []).flatMap((event) => {
      const rawStart = new Date(text(event.start?.dateTime));
      return eventVisibleDateKeys(event, settings, range).map((dateKey) => ({
        event,
        dateKey,
        startDate: Number.isNaN(rawStart.getTime()) ? null : rawStart,
        sortTime: eventSortTime(event, dateKey)
      }));
    }).sort((left, right) => {
      const dateOrder = left.dateKey.localeCompare(right.dateKey);
      if (dateOrder) {
        return dateOrder;
      }
      const leftAllDay = hasText2(left.event.start?.date);
      const rightAllDay = hasText2(right.event.start?.date);
      if (leftAllDay !== rightAllDay) {
        return leftAllDay ? -1 : 1;
      }
      return left.sortTime - right.sortTime;
    });
  }
  function resolveTarget2(target) {
    if (target instanceof HTMLElement) {
      return target;
    }
    if (typeof target === "string") {
      const element = document.querySelector(target);
      if (!element) {
        throw new Error(`Could not find calendar target: ${target}`);
      }
      return element;
    }
    return document.querySelector("#app") ?? document.body;
  }
  function formatCivilDate(dateKey, locale, options) {
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(
      dateKeyToUtcDate(dateKey)
    );
  }
  function formatTime(value, locale, displayTimeZone) {
    const date = new Date(text(value?.dateTime));
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const timeZone = validTimeZone(displayTimeZone) ?? validTimeZone(value?.timeZone);
    return new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      ...timeZone ? { timeZone } : {}
    }).format(date);
  }
  function eventTimeText(event, settings, messages) {
    if (hasText2(event.start?.date)) {
      return messages.allDay;
    }
    const start = formatTime(event.start, settings.locale, settings.timeZone);
    const end = formatTime(event.end, settings.locale, settings.timeZone);
    return end && end !== start ? `${start} \u2013 ${end}` : start;
  }
  function formatRangeTitle(range, settings) {
    if (range.view === "year") {
      return range.startKey.slice(0, 4);
    }
    if (range.view === "day") {
      return formatCivilDate(range.startKey, settings.locale, {
        weekday: "long",
        month: "long",
        day: "numeric"
      });
    }
    const endInclusive = addDaysToKey(range.endKey, -1);
    const start = formatCivilDate(range.startKey, settings.locale, {
      month: "short",
      day: "numeric"
    });
    const end = formatCivilDate(endInclusive, settings.locale, {
      month: "short",
      day: "numeric"
    });
    return start === end ? start : `${start} \u2013 ${end}`;
  }
  function normalizeIconName(value) {
    return text(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
  }
  function safeImageUrl(value) {
    const candidate = text(value);
    if (!candidate) {
      return "";
    }
    try {
      const url = new URL(candidate, window.location.href);
      return ["http:", "https:"].includes(url.protocol) ? url.href : "";
    } catch {
      return "";
    }
  }
  var calendarIconAliases = {
    appointment: "calendar",
    birthday: "birthday-cake",
    work: "suitcase",
    office: "suitcase",
    briefcase: "suitcase",
    meeting: "group",
    call: "phone",
    dentist: "healthcare",
    doctor: "healthcare",
    health: "healthcare",
    medical: "healthcare",
    school: "open-book",
    shopping: "shopping-bag",
    flight: "airplane",
    travel: "airplane",
    trip: "airplane",
    plane: "airplane",
    holiday: "airplane",
    vacation: "beach-bag",
    focus: "star",
    reminder: "warning-triangle",
    video: "video-camera"
  };
  var calendarIconArt = {
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/>',
    "birthday-cake": '<path d="M4 21V11h16v10H4Zm0-6c3 4 5-4 8 0s5-4 8 0M8 11V7m8 4V7m-4 4V5M8 3v1m8-1v1m-4-3v1"/>',
    suitcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12h18m-11 0v3h2v-3"/>',
    healthcare: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6Z"/>',
    group: '<circle cx="9" cy="7" r="3"/><path d="M2 21v-4a7 7 0 0 1 14 0v4m0-17a3 3 0 0 1 0 6m3 3a5 5 0 0 1 3 5v3"/>',
    phone: '<path d="m5 3 4 4-2 3a17 17 0 0 0 7 7l3-2 4 4-3 3C9 20 4 15 2 6Z"/>',
    "shopping-bag": '<path d="M4 8h16l1 13H3ZM8 8V6a4 4 0 0 1 8 0v2"/>',
    airplane: '<path d="m3 10 7 2V3l2-2 2 2v9l7-2v3l-7 3v4l3 2H7l3-2v-4l-7-3Z"/>',
    "open-book": '<path d="M12 5v16M12 5C8 2 5 3 2 3v16c4-1 7 0 10 2 3-2 6-3 10-2V3c-3 0-6-1-10 2Z"/>',
    star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
    "video-camera": '<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m16 9 6-4v14l-6-4"/>',
    music: '<path d="M10 18V5l11-3v13M10 8l11-3"/><ellipse cx="6" cy="18" rx="4" ry="3"/><ellipse cx="17" cy="15" rx="4" ry="3"/>',
    coffee: '<path d="M3 8h14v7a7 7 0 0 1-14 0Zm14 0h2a3 3 0 0 1 0 6h-2M7 2v3m5-3v3M2 23h19"/>',
    bicycle: '<circle cx="5" cy="17" r="4"/><circle cx="19" cy="17" r="4"/><path d="m5 17 5-10 9 10H5m4-7h7m-3-6h3l3 13M8 7h4"/>'
  };
  var iconRules = [
    [/(?:^|[^\p{L}])(?:geburtstag|geburtstagsfeier|birthday)(?:$|[^\p{L}])/u, "birthday-cake"],
    [/(?:^|[^\p{L}])(?:zahnarzt|arzt|ärztin|arzttermin|dentist|doctor|physio|impfung|vaccination)(?:$|[^\p{L}])/u, "healthcare"],
    [/(?:^|[^\p{L}])(?:flug|flight|airport|flughafen)(?:$|[^\p{L}])/u, "airplane"],
    [/(?:^|[^\p{L}])(?:schule|school|elternabend|unterricht|kita)(?:$|[^\p{L}])/u, "open-book"],
    [/(?:^|[^\p{L}])(?:einkaufen|einkauf|shopping|wochenmarkt|supermarkt)(?:$|[^\p{L}])/u, "shopping-bag"],
    [/(?:^|[^\p{L}])(?:telefonat|anruf|call)(?:$|[^\p{L}])/u, "phone"],
    [/(?:^|[^\p{L}])(?:konzert|concert|jazz|chor|probe)(?:$|[^\p{L}])/u, "music"],
    [/(?:^|[^\p{L}])(?:kino|cinema|movie|filmabend|videokonferenz)(?:$|[^\p{L}])/u, "video-camera"],
    [/(?:^|[^\p{L}])(?:fahrrad|radtour|cycling|bicycle)(?:$|[^\p{L}])/u, "bicycle"],
    [/(?:^|[^\p{L}])(?:kaffee|coffee|frühstück|teamfrühstück|brunch)(?:$|[^\p{L}])/u, "coffee"],
    [/(?:^|[^\p{L}])(?:meeting|besprechung|standup|stand-up|teammeeting)(?:$|[^\p{L}])/u, "group"],
    [/(?:^|[^\p{L}])(?:arbeit|work|büro|office)(?:$|[^\p{L}])/u, "suitcase"]
  ];
  function decorateCalendarEvent(event, settings) {
    let tokenIcon = "";
    const strip = (value) => text(value).replace(/\[icon:([^\]\n]+)\]/gi, (_, name) => {
      tokenIcon || (tokenIcon = normalizeIconName(name));
      return "";
    }).trim();
    const title = strip(event.title);
    strip(event.description);
    const explicit = normalizeIconName(event.iconName) || tokenIcon;
    const suggested = settings.automaticEventIcons ? iconRules.find(([pattern]) => pattern.test(title.toLocaleLowerCase(settings.locale)))?.[1] : "";
    return { ...event, title, iconName: explicit || suggested || "" };
  }
  function renderEventIcon(event, settings, aliases) {
    const iconName = normalizeIconName(event.iconName);
    if (!settings.showEventIcons || !iconName) {
      return "";
    }
    const iconClass = normalizeIconName(aliases[iconName] ?? calendarIconAliases[iconName] ?? iconName);
    const art = calendarIconArt[iconClass];
    if (art) return `<span class="pp-cal-event-icon" data-icon="${escapeHtml(iconClass)}" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${art}</svg></span>`;
    return `<span class="pp-cal-event-icon" aria-hidden="true"><i class="iconoir-${escapeHtml(
      iconClass
    )}"></i></span>`;
  }
  function renderEventImage(event, settings) {
    const imageUrl = settings.showEventImages ? safeImageUrl(event.imageUrl) : "";
    return imageUrl ? `<img class="pp-cal-event-image" src="${escapeHtml(
      imageUrl
    )}" alt="" loading="eager" decoding="async">` : "";
  }
  function visibleDetails(event) {
    return (event.details || []).filter(
      (detail) => detail.visible !== false && (hasText2(detail.label) || hasText2(detail.value))
    );
  }
  function renderDetails(event) {
    const details = visibleDetails(event);
    if (!details.length) {
      return "";
    }
    return `<dl class="pp-cal-event-details">${details.map((detail) => {
      const label = hasText2(detail.label) ? `<dt class="pp-cal-event-detail-label">${escapeHtml(detail.label)}</dt>` : "";
      return `<div class="pp-cal-event-detail">${label}<dd class="pp-cal-event-detail-value">${escapeHtml(
        detail.value
      )}</dd></div>`;
    }).join("")}</dl>`;
  }
  var calendarColorCache = /* @__PURE__ */ new Map();
  function calendarPaletteColor(value) {
    if (typeof value !== "string") return "";
    const raw = value.trim().toLowerCase();
    if (calendarColorCache.has(raw)) return calendarColorCache.get(raw);
    let rgb;
    const hex = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(raw)?.[1];
    if (hex) {
      if (hex.length === 4 && hex[3] === "0" || hex.length === 8 && hex.slice(6) === "00") return "";
      const full = hex.length <= 4 ? [...hex.slice(0, 3)].map((c) => c + c).join("") : hex.slice(0, 6);
      rgb = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
    } else if (/^[a-z]{1,30}$/.test(raw) && !["transparent", "currentcolor", "inherit", "initial", "unset", "revert", "revert-layer"].includes(raw)) {
      const probe = document.createElement("span");
      probe.style.color = raw;
      if (probe.style.color) {
        document.body.append(probe);
        const computed = getComputedStyle(probe).color;
        probe.remove();
        const match = /^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\s*\)$/.exec(computed);
        if (match) rgb = match.slice(1).map(Number);
      }
    }
    let color = "";
    if (rgb) {
      const [red, green, blue] = rgb.map((channel) => channel / 255);
      const max = Math.max(red, green, blue), min = Math.min(red, green, blue), delta = max - min;
      if (!max || delta / max < 0.15) {
        color = min > 0.9 ? "white" : "black";
      } else {
        const hue = ((max === red ? (green - blue) / delta : max === green ? (blue - red) / delta + 2 : (red - green) / delta + 4) * 60 + 360) % 360;
        color = hue < 45 || hue >= 300 ? "red" : hue < 70 ? "yellow" : hue < 170 ? "green" : "blue";
      }
    }
    if (calendarColorCache.size >= 256) calendarColorCache.clear();
    calendarColorCache.set(raw, color);
    return color;
  }
  function calendarEventColors(event) {
    const color = calendarPaletteColor(event.color) || calendarPaletteColor(event.calendarColor);
    if (!color) return { className: "", style: "" };
    const foreground = ["white", "yellow", "green"].includes(color) ? "black" : "white";
    return {
      className: `has-source-color pp-cal-event--color-${color}`,
      style: ` style="--pp-cal-event-bg:var(--pp-${color});--pp-cal-event-fg:var(--pp-${foreground})"`
    };
  }
  function renderEventCard(item, settings, messages, aliases, compact = false, showDetails = !compact) {
    const event = item.event;
    const colors = calendarEventColors(event);
    const title = hasText2(event.title) ? event.title : messages.untitled;
    const location2 = settings.showLocation && hasText2(event.location) ? `<p class="pp-cal-event-location">${escapeHtml(event.location)}</p>` : "";
    const details = showDetails ? renderDetails(event) : "";
    const classes = [
      "pp-cal-event",
      colors.className,
      compact ? "pp-cal-event--compact" : "",
      details ? "pp-cal-event--with-details" : ""
    ].filter(Boolean).join(" ");
    return `<article class="${classes}"${colors.style} data-date="${escapeHtml(item.dateKey)}">
    <p class="pp-cal-event-time">${escapeHtml(eventTimeText(event, settings, messages))}</p>
    <div class="pp-cal-event-content">
      <div class="pp-cal-event-heading">${renderEventIcon(event, settings, aliases)}<h2 class="pp-cal-event-title">${escapeHtml(
      title
    )}</h2></div>
      ${location2}
      ${renderEventImage(event, settings)}
    </div>
    ${details}
  </article>`;
  }
  function eventsByDate(events) {
    const result = /* @__PURE__ */ new Map();
    for (const event of events) {
      const bucket = result.get(event.dateKey) ?? [];
      bucket.push(event);
      result.set(event.dateKey, bucket);
    }
    return result;
  }
  function moreEventsLabel(template, count) {
    return template.replace("{count}", String(count));
  }
  function dateHeader(dateKey, settings) {
    const weekday = formatCivilDate(dateKey, settings.locale, { weekday: settings.fullWeekdayNames ? "long" : "short" });
    const date = formatCivilDate(dateKey, settings.locale, { month: "short", day: "numeric" });
    return `<span class="pp-cal-column-weekday">${escapeHtml(
      weekday
    )}</span><span class="pp-cal-column-date">${escapeHtml(date)}</span>`;
  }
  function renderAgenda(events, settings, messages, aliases, todayKey) {
    const visible = events.slice(0, settings.maxEvents);
    const grouped = eventsByDate(visible);
    if (!visible.length) {
      return `<div class="pp-cal-empty">${escapeHtml(messages.empty)}</div>`;
    }
    const hidden = events.length - visible.length;
    return `<div class="pp-cal-agenda">${Array.from(grouped.entries()).map(([dateKey, items]) => {
      const classes = settings.highlightToday && dateKey === todayKey ? "pp-cal-day-group is-today" : "pp-cal-day-group";
      const weekday = formatCivilDate(dateKey, settings.locale, { weekday: "long" });
      const date = formatCivilDate(dateKey, settings.locale, { month: "long", day: "numeric" });
      return `<section class="${classes}"><h2 class="pp-cal-day-heading"><span class="pp-cal-day-weekday">${escapeHtml(
        weekday
      )}</span><span class="pp-cal-day-date">${escapeHtml(
        date
      )}</span></h2><div class="pp-cal-day-events">${items.map((item) => renderEventCard(item, settings, messages, aliases)).join("")}</div></section>`;
    }).join("")}${classicMore(messages, hidden)}</div>`;
  }
  function classicMore(messages, count) {
    return `<p class="pp-cal-more" data-classic-more data-base-count="${count}" data-template="${escapeHtml(messages.moreEvents)}"${count ? "" : " hidden"}>${escapeHtml(moreEventsLabel(messages.moreEvents, count))}</p>`;
  }
  function renderModernDate(dateKey, settings, messages, todayKey) {
    const relative = dateKey === todayKey ? messages.today : dateKey === addDaysToKey(todayKey, 1) ? messages.tomorrow : "";
    return `<header class="pp-cal-modern-date${dateKey === todayKey && settings.highlightToday ? " is-today" : ""}">
    <time datetime="${escapeHtml(dateKey)}" class="pp-cal-modern-number">${escapeHtml(formatCivilDate(dateKey, settings.locale, { day: "numeric" }))}</time>
    <div><p class="pp-cal-modern-relative">${escapeHtml(relative || formatCivilDate(dateKey, settings.locale, { month: "short" }))}</p>
    <p class="pp-cal-modern-weekday">${escapeHtml(formatCivilDate(dateKey, settings.locale, { weekday: "long" }))}</p>${settings.view === "today-next" && dateKey === todayKey ? `<p class="pp-cal-focus-month">${escapeHtml(formatCivilDate(dateKey, settings.locale, { month: "long", year: "numeric" }))}</p>` : ""}</div>
  </header>`;
  }
  function modernMore(messages, count) {
    return `<p class="pp-cal-more pp-cal-modern-more" data-base-count="${count}" data-template="${escapeHtml(messages.moreEvents)}"${count ? "" : " hidden"}>${escapeHtml(moreEventsLabel(messages.moreEvents, count))}</p>`;
  }
  function renderModernAgenda(events, settings, messages, aliases, todayKey) {
    const visible = events.slice(0, settings.maxEvents);
    return `<section class="pp-cal-modern-list" data-modern-list>${visible.length ? Array.from(
      eventsByDate(visible),
      ([dateKey, items]) => `<section class="pp-cal-modern-group">${renderModernDate(dateKey, settings, messages, todayKey)}<div class="pp-cal-modern-events">${items.map((item) => renderEventCard(item, settings, messages, aliases)).join("")}</div></section>`
    ).join("") : `<p class="pp-cal-empty">${escapeHtml(messages.empty)}</p>`}${modernMore(messages, events.length - visible.length)}</section>`;
  }
  function renderTodayNext(events, settings, messages, aliases, todayKey, now) {
    const today = events.filter((item) => item.dateKey === todayKey);
    const later = events.filter((item) => item.dateKey > todayKey);
    const featured = today.find((item) => {
      if (!item.startDate) return false;
      const end = new Date(item.event.end?.dateTime || "").getTime();
      return (Number.isFinite(end) ? end : item.startDate.getTime() + 30 * 6e4) > now.getTime();
    });
    const remaining = today.filter((item) => item !== featured);
    const isFinished = (item) => {
      if (!item.startDate) return false;
      const end = new Date(item.event.end?.dateTime || "").getTime();
      return (Number.isFinite(end) ? end : item.startDate.getTime() + 30 * 6e4) <= now.getTime();
    };
    const ordered = featured ? [featured, ...remaining.filter((item) => !isFinished(item)), ...remaining.filter(isFinished)] : today;
    const visible = ordered.slice(0, settings.maxEvents);
    return `<div class="pp-cal-focus-layout"><section class="pp-cal-focus-today">
    ${renderModernDate(todayKey, settings, messages, todayKey)}
    <section class="pp-cal-modern-list pp-cal-focus-list" data-modern-list>${visible.length ? visible.map((item) => item === featured ? `<div class="pp-cal-featured"><p class="pp-cal-modern-relative">${escapeHtml(item.startDate.getTime() <= now.getTime() ? messages.ongoing : messages.nextEvent)}</p>${renderEventCard(item, settings, messages, aliases)}</div>` : renderEventCard(item, settings, messages, aliases)).join("") : `<p class="pp-cal-empty">${escapeHtml(messages.empty)}</p>`}
      ${modernMore(messages, today.length - visible.length)}</section>
    </section><section class="pp-cal-focus-later"><h2 class="pp-cal-later-title">${escapeHtml(messages.later)}</h2>
    ${renderModernAgenda(later, settings, messages, aliases, todayKey)}</section></div>`;
  }
  function renderDayColumns(range, events, settings, messages, aliases, todayKey) {
    const grouped = eventsByDate(events);
    return `<section class="pp-cal-columns pp-cal-columns--${range.dateKeys.length}">${range.dateKeys.map((dateKey) => {
      const items = grouped.get(dateKey) || [];
      const visible = items.slice(0, settings.maxEvents);
      const hidden = items.length - visible.length;
      const classes = settings.highlightToday && dateKey === todayKey ? "pp-cal-column is-today" : "pp-cal-column";
      return `<section class="${classes}"><header class="pp-cal-column-heading">${dateHeader(
        dateKey,
        settings
      )}</header><div class="pp-cal-column-events">${visible.length ? `${visible.map((item) => renderEventCard(item, settings, messages, aliases, true, true)).join("")}${classicMore(messages, hidden)}` : `<div class="pp-cal-empty">${escapeHtml(messages.empty)}</div>`}</div></section>`;
    }).join("")}</section>`;
  }
  function clockMinutes(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      ...timeZone ? { timeZone } : {}
    }).formatToParts(date);
    return Number(parts.find((part) => part.type === "hour")?.value || 0) * 60 + Number(parts.find((part) => part.type === "minute")?.value || 0);
  }
  function weekSlot(item, settings) {
    if (hasText2(item.event.start.date) || !item.startDate) return null;
    const zone = settings.timeZone ?? validTimeZone(item.event.start.timeZone);
    const start = dateKeyFromDate(item.startDate, zone) < item.dateKey ? 0 : clockMinutes(item.startDate, zone);
    const endDate = new Date(text(item.event.end?.dateTime));
    const validEnd = !Number.isNaN(endDate.getTime()) && endDate > item.startDate;
    const end = validEnd ? dateKeyFromDate(endDate, zone) > item.dateKey ? 1440 : clockMinutes(endDate, zone) : start + 30;
    return { item, start, end: Math.min(1440, Math.max(start + 1, end)), lane: 0, lanes: 1 };
  }
  function positionWeekSlots(slots) {
    const sorted = [...slots].sort((a, b) => a.start - b.start || b.end - a.end);
    let group = [];
    let ends = [];
    let groupEnd = -1;
    const finish = () => group.forEach((slot) => {
      slot.lanes = ends.length;
    });
    for (const slot of sorted) {
      if (slot.start >= groupEnd) {
        finish();
        group = [];
        ends = [];
      }
      let lane = ends.findIndex((end) => end <= slot.start);
      if (lane < 0) lane = ends.length;
      ends[lane] = slot.end;
      slot.lane = lane;
      group.push(slot);
      groupEnd = Math.max(...ends);
    }
    finish();
    return sorted;
  }
  function renderWeek(range, events, settings, messages, aliases, todayKey) {
    const grouped = eventsByDate(events);
    const days = range.dateKeys.map((dateKey) => {
      const items = grouped.get(dateKey) || [];
      const visible = items.slice(0, settings.maxEvents);
      const slots2 = visible.map((item) => weekSlot(item, settings)).filter(
        (slot) => slot !== null
      );
      return {
        dateKey,
        allDay: visible.filter((item) => !weekSlot(item, settings)),
        slots: positionWeekSlots(slots2),
        hidden: items.length - visible.length
      };
    });
    const slots = settings.view === "rolling-week" ? events.map((item) => weekSlot(item, settings)).filter((slot) => slot !== null) : days.flatMap((day) => day.slots);
    const startHour = Math.max(0, Math.floor(Math.min(8 * 60, ...slots.map((slot) => slot.start)) / 60));
    const endHour = Math.min(24, Math.ceil(Math.max(18 * 60, ...slots.map((slot) => slot.end)) / 60));
    const minutes = (endHour - startHour) * 60;
    const hasAllDay = days.some((day) => day.allDay.length);
    const hasHidden = days.some((day) => day.hidden);
    const hourLabel = (hour) => new Intl.DateTimeFormat(settings.locale, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC"
    }).format(new Date(Date.UTC(2026, 0, 1, hour)));
    const hours = Array.from({ length: endHour - startHour + 1 }, (_, i) => startHour + i);
    const todayClass = (dateKey) => settings.highlightToday && dateKey === todayKey ? " is-today" : "";
    return `<section class="pp-cal-week" style="--pp-cal-hours:${endHour - startHour};--pp-cal-days:${days.length}">
    <div class="pp-cal-week-head"><div></div>${days.map(
      ({ dateKey }) => `<header class="pp-cal-week-heading${todayClass(dateKey)}">${settings.view === "rolling-week" ? rollingDayHeader(dateKey, settings, messages, todayKey) : dateHeader(dateKey, settings)}</header>`
    ).join("")}</div>
    ${hasAllDay ? `<div class="pp-cal-week-all-day"><span class="pp-cal-week-all-day-label">${escapeHtml(messages.allDay)}</span>${days.map(
      (day) => `<div class="pp-cal-week-all-day-events">${day.allDay.slice(0, 2).map(
        (item) => renderEventCard(item, settings, messages, aliases, true)
      ).join("")}${day.allDay.length > 2 ? `<span class="pp-cal-more">${escapeHtml(moreEventsLabel(messages.moreEvents, day.allDay.length - 2))}</span>` : ""}</div>`
    ).join("")}</div>` : ""}
    <div class="pp-cal-week-grid"><div class="pp-cal-week-hours">${hours.map(
      (hour, index) => `<span class="pp-cal-hour" style="top:${index / (endHour - startHour) * 100}%">${escapeHtml(hourLabel(hour))}</span>`
    ).join("")}</div>${days.map(
      (day) => `<section class="pp-cal-week-cell${todayClass(day.dateKey)}" data-date="${day.dateKey}">${hours.slice(0, -1).map(
        (_hour, index) => `<div class="pp-cal-hour-rule" style="top:${index / (endHour - startHour) * 100}%" aria-hidden="true"></div>`
      ).join("")}${day.slots.map((slot) => {
        const top = (slot.start - startHour * 60) / minutes * 100;
        const height = (slot.end - slot.start) / minutes * 100;
        return `<div title="${escapeHtml(eventTimeText(slot.item.event, settings, messages))} \xB7 ${escapeHtml(slot.item.event.title || messages.untitled)}" class="pp-cal-week-slot${slot.end - slot.start < 60 ? " is-short" : ""}${slot.end - slot.start < 30 ? " is-tiny" : ""}" data-start="${slot.start}" data-end="${slot.end}" data-lane="${slot.lane}" data-lanes="${slot.lanes}" style="top:${top}%;height:${height}%;left:${slot.lane / slot.lanes * 100}%;width:${100 / slot.lanes}%">${renderEventCard(slot.item, settings, messages, aliases, true)}</div>`;
      }).join("")}</section>`
    ).join("")}</div>
    ${hasHidden ? `<div class="pp-cal-week-overflow"><div></div>${days.map((day) => `<span class="pp-cal-more">${day.hidden ? escapeHtml(moreEventsLabel(messages.moreEvents, day.hidden)) : ""}</span>`).join("")}</div>` : ""}
  </section>`;
  }
  function rollingDayHeader(dateKey, settings, messages, todayKey) {
    const dayName = dateKey === todayKey ? messages.today : formatCivilDate(dateKey, settings.locale, { weekday: settings.fullWeekdayNames ? "long" : "short" });
    return `<span class="pp-cal-column-weekday">${escapeHtml(dayName)}</span><time class="pp-cal-rolling-number" datetime="${dateKey}">${escapeHtml(formatCivilDate(dateKey, settings.locale, { day: "numeric" }))}</time>`;
  }
  function renderRollingWeek(range, events, settings, messages, aliases, todayKey) {
    return `<div class="pp-cal-rolling-grid-wide">${renderWeek(range, events, settings, messages, aliases, todayKey)}</div>
    <div class="pp-cal-rolling-grid-stacked">${[range.dateKeys.slice(0, 4), range.dateKeys.slice(4)].map((dateKeys) => renderWeek({ ...range, dateKeys }, events, settings, messages, aliases, todayKey)).join("")}</div>`;
  }
  function renderRollingList(range, events, settings, messages, aliases, todayKey) {
    const grouped = eventsByDate(events);
    return `<div class="pp-cal-rolling-list">${range.dateKeys.map((dateKey) => {
      const items = grouped.get(dateKey) || [];
      const visible = items.slice(0, settings.maxEvents);
      return `<section class="pp-cal-rolling-day${dateKey === todayKey && settings.highlightToday ? " is-today" : ""}" data-date="${dateKey}">
      <header class="pp-cal-rolling-heading">${rollingDayHeader(dateKey, settings, messages, todayKey)}</header>
      <div class="pp-cal-rolling-events">${visible.length ? visible.map((item) => renderEventCard(item, settings, messages, aliases, true, true)).join("") : `<p class="pp-cal-empty">${escapeHtml(messages.empty)}</p>`}${modernMore(messages, items.length - visible.length)}</div></section>`;
    }).join("")}</div>`;
  }
  function renderYear(range, events, settings, todayKey) {
    const grouped = eventsByDate(events);
    const year = Number(range.startKey.slice(0, 4));
    const weekdayKeys = Array.from({ length: 7 }, (_value, index) => addDaysToKey("2024-01-01", index));
    return `<section class="pp-cal-year">${Array.from({ length: 12 }, (_value, monthIndex) => {
      const monthStart = `${year}-${pad(monthIndex + 1)}-01`;
      const monthWeekday = dateKeyToUtcDate(monthStart).getUTCDay();
      const gridStart = addDaysToKey(monthStart, -((monthWeekday + 6) % 7));
      const days = Array.from({ length: 42 }, (_day, index) => addDaysToKey(gridStart, index));
      const monthName = formatCivilDate(monthStart, settings.locale, { month: "long" });
      return `<section class="pp-cal-month"><h2 class="pp-cal-month-heading">${escapeHtml(
        monthName
      )}</h2><div class="pp-cal-month-weekdays">${weekdayKeys.map(
        (dateKey) => `<span>${escapeHtml(formatCivilDate(dateKey, settings.locale, { weekday: "narrow" }))}</span>`
      ).join("")}</div><div class="pp-cal-month-days">${days.map((dateKey) => {
        const count = (grouped.get(dateKey) || []).length;
        const classes = [
          "pp-cal-month-day",
          dateKey.slice(5, 7) !== pad(monthIndex + 1) ? "pp-cal-month-day--outside" : "",
          count > 0 ? "pp-cal-month-day--events" : "",
          settings.highlightToday && dateKey === todayKey ? "pp-cal-month-day--today" : ""
        ].filter(Boolean).join(" ");
        return `<span class="${classes}" title="${escapeHtml(String(count))}">${escapeHtml(
          String(Number(dateKey.slice(8, 10)))
        )}</span>`;
      }).join("")}</div></section>`;
    }).join("")}</section>`;
  }
  function renderHeader(header) {
    if (!header || !Object.values(header).some(hasText2)) {
      return "";
    }
    return `<header class="pp-cal-header"><div class="pp-cal-header-main">${hasText2(header.kicker) ? `<p class="pp-cal-kicker">${escapeHtml(header.kicker)}</p>` : ""}${hasText2(header.title) ? `<h1 class="pp-cal-title">${escapeHtml(header.title)}</h1>` : ""}${hasText2(header.subtitle) ? `<p class="pp-cal-subtitle">${escapeHtml(header.subtitle)}</p>` : ""}</div>${hasText2(header.source) ? `<p class="pp-cal-source">${escapeHtml(header.source)}</p>` : ""}</header>`;
  }
  function renderDaySummary(events, settings, messages, todayKey, now) {
    if (!settings.showDaySummary) return "";
    const today = events.filter((item) => item.dateKey === todayKey);
    const allDay = today.filter((item) => hasText2(item.event.start.date)).length;
    const remaining = today.filter((item) => {
      if (!item.startDate || hasText2(item.event.start.date)) return false;
      const end = new Date(text(item.event.end?.dateTime));
      return Math.max(item.startDate.getTime(), Number.isNaN(end.getTime()) ? 0 : end.getTime()) > now.getTime() || item.startDate.getTime() === now.getTime();
    });
    const count = remaining.length;
    const parts = [count ? count === 1 ? messages.remainingOne : messages.remainingMany.replace("{count}", String(count)) : messages.noMoreToday];
    if (allDay) parts.push(messages.allDayCount.replace("{count}", String(allDay)));
    const next = remaining[0];
    let detail = "";
    if (next) {
      const ongoing = next.startDate.getTime() <= now.getTime();
      detail = `${ongoing ? messages.ongoing : messages.nextEvent} \xB7 ${formatTime(next.event.start, settings.locale, settings.timeZone)} \xB7 ${text(next.event.title) || messages.untitled}`;
    }
    const ends = remaining.map((item) => new Date(text(item.event.end?.dateTime)));
    if (count && !allDay && ends.every((end, i) => !Number.isNaN(end.getTime()) && end > remaining[i].startDate && dateKeyFromDate(end, settings.timeZone) === todayKey)) {
      const last = new Date(Math.max(...ends.map((end) => end.getTime())));
      parts.push(messages.freeAfter.replace("{time}", formatTime({ dateTime: last.toISOString() }, settings.locale, settings.timeZone)));
    }
    const stamp = messages.asOf.replace("{time}", formatTime({ dateTime: now.toISOString() }, settings.locale, settings.timeZone));
    return `<aside class="pp-cal-day-summary"><div class="pp-cal-summary-heading"><strong>${escapeHtml(messages.dayAtGlance)}</strong><span>${escapeHtml(stamp)}</span></div><p class="pp-cal-summary-count">${escapeHtml(parts.join(" \xB7 "))}</p>${detail ? `<p class="pp-cal-summary-next">${escapeHtml(detail)}</p>` : ""}</aside>`;
  }
  function renderTodayBanner(settings, messages, todayKey) {
    if (!settings.highlightToday) {
      return "";
    }
    const weekday = formatCivilDate(todayKey, settings.locale, { weekday: "long" });
    const date = formatCivilDate(todayKey, settings.locale, { month: "long", day: "numeric" });
    return `<section class="pp-cal-today" style="--pp-cal-highlight-scale:${escapeHtml(
      settings.highlightScale
    )}"><span class="pp-cal-today-label">${escapeHtml(
      messages.today
    )}</span><span class="pp-cal-today-weekday">${escapeHtml(
      weekday
    )}</span><time datetime="${escapeHtml(todayKey)}">${escapeHtml(date)}</time></section>`;
  }
  var calendarEpdOverrides = /* @__PURE__ */ new WeakMap();
  function preserveCalendarPigments(enabled) {
    let meta = document.querySelector('meta[name="paperless:epd-optimize"]');
    let previous = calendarEpdOverrides.get(document);
    if (previous && previous.meta !== meta) {
      calendarEpdOverrides.delete(document);
      previous = void 0;
    }
    if (!enabled) {
      if (previous) {
        if (previous.original === null) previous.meta.remove();
        else previous.meta.content = previous.original;
        calendarEpdOverrides.delete(document);
      }
      return;
    }
    const original = previous ? previous.original : meta?.getAttribute("content") ?? null;
    let settings = {};
    try {
      const parsed = JSON.parse(original || "{}");
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) settings = parsed;
    } catch {
    }
    if (settings.enabled === false) return;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "paperless:epd-optimize";
      document.head.append(meta);
    }
    if (!previous) calendarEpdOverrides.set(document, { meta, original });
    meta.content = JSON.stringify({
      ...settings,
      intent: settings.intent || "readable",
      palette: "spectra6OriginalPalette",
      canvasDitherOptions: {
        ...settings.canvasDitherOptions && typeof settings.canvasDitherOptions === "object" ? settings.canvasDitherOptions : {},
        ditheringType: "errorDiffusion"
      }
    });
  }
  function renderCalendarLayout(options) {
    const target = resolveTarget2(options.target);
    const settings = normalizeCalendarSettings(options.settings);
    const messages = { ...DEFAULT_CALENDAR_MESSAGES, ...options.messages };
    const now = normalizeNow(options.now);
    const range = buildCalendarRange(settings, now);
    const events = prepareCalendarEvents((options.events || []).map((event) => decorateCalendarEvent(event, settings)), settings, now);
    const todayKey = dateKeyFromDate(now, settings.timeZone);
    const aliases = options.iconAliases || {};
    target.classList.add("pp-screen", "pp-cal-screen");
    target.classList.remove(...VIEW_CLASSES);
    target.classList.add(`pp-cal--view-${settings.view}`);
    target.dataset.informationDensity = settings.informationDensity;
    target.dataset.calendarFontScale = String(settings.fontSize / 100);
    target.style.setProperty("--pp-cal-font-scale", String(settings.fontSize / 100));
    target.classList.toggle("pp-cal--personal-header", Boolean(settings.showHeader && (settings.personalTitle || settings.personalSubtitle)));
    target.classList.toggle("pp-cal--no-padding", settings.noPadding);
    target.classList.toggle("pp-cal--full-weekdays", settings.fullWeekdayNames);
    if (options.className) {
      target.classList.add(...options.className.split(/\s+/).filter(Boolean));
    }
    const modern = settings.view === "agenda-modern" || settings.view === "today-next";
    target.classList.toggle("pp-cal--modern", modern);
    const rolling = settings.view === "rolling-week" || settings.view === "rolling-week-list";
    target.classList.toggle("pp-cal--rolling", rolling);
    let content;
    switch (settings.view) {
      case "rolling-week":
        content = renderRollingWeek(range, events, settings, messages, aliases, todayKey);
        break;
      case "rolling-week-list":
        content = renderRollingList(range, events, settings, messages, aliases, todayKey);
        break;
      case "today-next":
        content = renderTodayNext(events, settings, messages, aliases, todayKey, now);
        break;
      case "agenda-modern":
        content = renderModernAgenda(events, settings, messages, aliases, todayKey);
        break;
      case "year":
        content = renderYear(range, events, settings, todayKey);
        break;
      case "week":
        content = renderWeek(range, events, settings, messages, aliases, todayKey);
        break;
      case "day":
      case "three-days":
        content = renderDayColumns(range, events, settings, messages, aliases, todayKey);
        break;
      default:
        content = renderAgenda(events, settings, messages, aliases, todayKey);
    }
    const week = settings.view === "week";
    const header = settings.showHeader ? {
      ...options.header,
      ...settings.personalTitle ? { title: settings.personalTitle, kicker: "" } : {},
      ...settings.personalSubtitle ? { subtitle: settings.personalSubtitle } : {}
    } : void 0;
    target.innerHTML = `<section class="pp-cal-shell">${renderHeader(header)}${renderDaySummary(events, settings, messages, todayKey, now)}${week || modern || rolling ? "" : renderTodayBanner(
      settings,
      messages,
      todayKey
    )}<section class="pp-cal-body">${week || settings.view === "today-next" ? "" : `<h1 class="pp-cal-range-title">${escapeHtml(
      formatRangeTitle(range, settings)
    )}</h1>`}<div class="pp-cal-content pp-fit">${content}</div></section></section>`;
    preserveCalendarPigments((week || modern || rolling) && Boolean(target.querySelector(".has-source-color")));
    const shell = target.querySelector(".pp-cal-shell");
    const body = target.querySelector(".pp-cal-content");
    if (!shell || !body) {
      throw new Error("Could not render calendar layout.");
    }
    return { target, shell, body, settings, events, range };
  }
  function fitWeekGrid(target) {
    for (const grid of target.querySelectorAll(".pp-cal-week-grid")) {
      if (grid.clientHeight <= 0) continue;
      const fontScale = parseFloat(target.style.getPropertyValue("--pp-cal-font-scale")) || 1;
      const rolling = target.classList.contains("pp-cal--view-rolling-week");
      const minimumHeight = (rolling ? Math.min(52, Math.max(32, window.innerWidth * 0.033)) : Math.min(24, Math.max(16, window.innerWidth * 0.024))) * fontScale;
      for (const column of grid.querySelectorAll(".pp-cal-week-cell")) {
        const nodes = Array.from(column.querySelectorAll(".pp-cal-week-slot"));
        const positioned = nodes.map((node) => {
          var _a, _b;
          (_a = node.dataset).top ?? (_a.top = node.style.top);
          (_b = node.dataset).height ?? (_b.height = node.style.height);
          const height = Math.min(grid.clientHeight, Math.max(
            minimumHeight,
            parseFloat(node.dataset.height) / 100 * grid.clientHeight
          ));
          const start = Math.min(
            grid.clientHeight - height,
            parseFloat(node.dataset.top) / 100 * grid.clientHeight
          );
          return { item: node, start, end: start + height, lane: 0, lanes: 1 };
        });
        const slots = positionWeekSlots(positioned);
        for (const slot of slots) {
          const node = slot.item;
          node.style.top = `${slot.start / grid.clientHeight * 100}%`;
          node.style.height = `${(slot.end - slot.start) / grid.clientHeight * 100}%`;
          node.style.left = `${slot.lane / slot.lanes * 100}%`;
          node.style.width = `${100 / slot.lanes}%`;
          node.classList.toggle("is-compact", slot.end - slot.start < (rolling ? 28 : 36) * fontScale);
          node.classList.remove("hide-time");
          const card = node.querySelector(".pp-cal-event");
          const content = node.querySelector(".pp-cal-event-content");
          const time = node.querySelector(".pp-cal-event-time");
          const style = getComputedStyle(card);
          const requiredHeight = content.scrollHeight + time.offsetHeight + parseFloat(style.paddingTop || "0") + parseFloat(style.paddingBottom || "0") + (parseFloat(style.gap) || 0) + 3;
          node.classList.toggle("hide-time", requiredHeight > card.clientHeight);
        }
      }
    }
  }
  function fitModernCalendar(target) {
    const scale = parseFloat(target.style.getPropertyValue("--pp-cal-font-scale")) || 1;
    const body = target.querySelector(".pp-cal-content");
    if (!body) return;
    const base = Math.min(30, Math.max(22, window.innerWidth * 0.028)) * scale;
    body.style.fontSize = `${base}px`;
    if (target.dataset.informationDensity === "automatic") {
      target.querySelectorAll(".pp-cal-event, .pp-cal-modern-group, .pp-cal-featured").forEach((node) => {
        node.hidden = false;
      });
      target.querySelectorAll(".pp-cal-modern-more").forEach((node) => {
        node.hidden = !Number(node.dataset.baseCount || 0);
      });
      for (const list2 of target.querySelectorAll("[data-modern-list]")) {
        fitText(list2, { min: base * 0.88, max: base * 1.12, step: 0.5, tolerance: 1 });
      }
    } else {
      target.querySelectorAll("[data-modern-list]").forEach((node) => {
        node.style.fontSize = "";
      });
    }
    for (const list2 of target.querySelectorAll("[data-modern-list]")) {
      const cards = Array.from(list2.querySelectorAll(".pp-cal-event"));
      const groups = Array.from(list2.querySelectorAll(".pp-cal-modern-group"));
      const counter = list2.querySelector(".pp-cal-modern-more");
      cards.forEach((card) => {
        card.hidden = false;
      });
      groups.forEach((group) => {
        group.hidden = false;
      });
      let hidden = Number(counter.dataset.baseCount || 0);
      const update = () => {
        counter.hidden = hidden === 0;
        counter.textContent = moreEventsLabel(counter.dataset.template || "", hidden);
        groups.forEach((group) => {
          group.hidden = !group.querySelector(".pp-cal-event:not([hidden])");
        });
      };
      update();
      while (list2.scrollHeight > list2.clientHeight + 1 || list2.scrollWidth > list2.clientWidth + 1) {
        const card = [...cards].reverse().find((card2) => !card2.hidden && !card2.closest(".pp-cal-featured")) || [...cards].reverse().find((card2) => !card2.hidden);
        if (!card) break;
        card.hidden = true;
        const featured = card.closest(".pp-cal-featured");
        if (featured) featured.hidden = true;
        hidden += 1;
        update();
      }
    }
  }
  function fitRollingList(target) {
    for (const list2 of target.querySelectorAll(".pp-cal-rolling-events")) {
      const cards = Array.from(list2.querySelectorAll(".pp-cal-event"));
      const counter = list2.querySelector(".pp-cal-modern-more");
      cards.forEach((card) => {
        card.hidden = false;
      });
      counter.hidden = !Number(counter.dataset.baseCount || 0);
      list2.style.fontSize = "";
      if (target.dataset.informationDensity === "automatic") {
        const base = parseFloat(getComputedStyle(list2).fontSize);
        fitText(list2, { min: base * 0.88, max: base * 1.12, step: 0.5, tolerance: 1 });
      }
      let hidden = Number(counter.dataset.baseCount || 0);
      const update = () => {
        counter.hidden = hidden === 0;
        counter.textContent = moreEventsLabel(counter.dataset.template || "", hidden);
      };
      update();
      while (list2.scrollHeight > list2.clientHeight + 1 || list2.scrollWidth > list2.clientWidth + 1) {
        const card = [...cards].reverse().find((card2) => !card2.hidden);
        if (!card) break;
        card.hidden = true;
        hidden += 1;
        update();
      }
    }
  }
  var weekResizeObservers = /* @__PURE__ */ new WeakMap();
  function fitCalendarLayout(layoutOrTarget, options = {}) {
    const target = typeof layoutOrTarget === "string" || layoutOrTarget instanceof HTMLElement ? resolveTarget2(layoutOrTarget) : layoutOrTarget.target;
    const density = target.dataset.informationDensity || "comfortable";
    const factor = density === "compact" ? 0.88 : density === "spacious" ? 1.12 : 1;
    target.style.setProperty("--pp-cal-font-scale", String((Number(target.dataset.calendarFontScale) || 1) * factor));
    const body = target.querySelector(".pp-cal-content");
    for (const node of target.querySelectorAll(".pp-cal-title, .pp-cal-subtitle")) {
      node.style.fontSize = "";
      const max = parseFloat(getComputedStyle(node).fontSize);
      fitText(node, { min: max * 0.7, max, step: 0.5, tolerance: 1 });
    }
    const view = VIEW_CLASSES.find((className) => target.classList.contains(className));
    const defaults = view === "pp-cal--view-year" ? { min: 5, max: 12 } : { min: 9, max: 17 };
    weekResizeObservers.get(target)?.disconnect();
    weekResizeObservers.delete(target);
    if (target.classList.contains("pp-cal--modern")) {
      target.querySelectorAll(".pp-cal-featured").forEach((node) => {
        node.hidden = false;
      });
      fitModernCalendar(target);
      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(() => {
          target.querySelectorAll(".pp-cal-featured").forEach((node) => {
            node.hidden = false;
          });
          fitModernCalendar(target);
        });
        observer.observe(target);
        weekResizeObservers.set(target, observer);
      }
      return;
    }
    if (view === "pp-cal--view-rolling-week-list") {
      fitRollingList(target);
      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(() => fitRollingList(target));
        observer.observe(target);
        weekResizeObservers.set(target, observer);
      }
      return;
    }
    if (view === "pp-cal--view-week" || view === "pp-cal--view-rolling-week") {
      fitWeekGrid(target);
      const grids = target.querySelectorAll(".pp-cal-week-grid");
      if (grids.length && typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(() => fitWeekGrid(target));
        grids.forEach((grid) => observer.observe(grid));
        weekResizeObservers.set(target, observer);
      }
      return;
    }
    const fontScale = parseFloat(target.style.getPropertyValue("--pp-cal-font-scale")) || 1;
    if (body) {
      const fit = () => {
        const cards = Array.from(body.querySelectorAll(".pp-cal-event"));
        const groups = Array.from(body.querySelectorAll(".pp-cal-day-group"));
        const counters = Array.from(body.querySelectorAll("[data-classic-more]"));
        const counts = new Map(counters.map((node) => [node, Number(node.dataset.baseCount || 0)]));
        cards.forEach((node) => {
          node.hidden = false;
        });
        groups.forEach((node) => {
          node.hidden = false;
        });
        const update = () => {
          for (const [node, count] of counts) {
            node.hidden = count === 0;
            node.textContent = moreEventsLabel(node.dataset.template || "", count);
          }
          groups.forEach((group) => {
            group.hidden = !group.querySelector(".pp-cal-event:not([hidden])");
          });
        };
        update();
        fitText(body, {
          min: (options.min ?? (density === "automatic" && view !== "pp-cal--view-year" ? 14 : defaults.min)) * fontScale,
          max: (options.max ?? defaults.max) * fontScale * (density === "automatic" ? 1.12 : 1),
          step: options.step ?? 0.5,
          tolerance: options.tolerance ?? 2
        });
        while (counters.length && (body.scrollHeight > body.clientHeight + 1 || body.scrollWidth > body.clientWidth + 1)) {
          const card = cards.filter((node) => !node.hidden).sort((a, b) => b.getBoundingClientRect().bottom - a.getBoundingClientRect().bottom)[0];
          if (!card) break;
          const counter = card.closest(".pp-cal-column")?.querySelector("[data-classic-more]") ?? counters[0];
          card.hidden = true;
          counts.set(counter, (counts.get(counter) || 0) + 1);
          update();
        }
      };
      fit();
      if (typeof ResizeObserver !== "undefined") {
        const observer = new ResizeObserver(fit);
        observer.observe(target);
        weekResizeObservers.set(target, observer);
      }
    }
    if (options.fitScreen !== false) {
      fitToScreen(target, { padding: options.screenPadding ?? 0 });
    }
  }
  function waitForCalendarImages(layoutOrRoot, timeoutMs = 5e3) {
    const root = typeof layoutOrRoot === "string" || layoutOrRoot instanceof HTMLElement ? resolveTarget2(layoutOrRoot) : layoutOrRoot.target;
    const images = Array.from(root.querySelectorAll(".pp-cal-event-image"));
    const pending = images.filter((image) => !image.complete);
    if (!pending.length) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      let remaining = pending.length;
      const timeout = window.setTimeout(resolve, timeoutMs);
      const settle = () => {
        remaining -= 1;
        if (remaining <= 0) {
          window.clearTimeout(timeout);
          resolve();
        }
      };
      for (const image of pending) {
        image.addEventListener("load", settle, { once: true });
        image.addEventListener("error", settle, { once: true });
      }
    });
  }

  // src/calendarIntegration.ts
  function isRecord4(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }
  function stringValue(value) {
    return typeof value === "string" ? value.trim() : "";
  }
  function booleanValue(value, fallback) {
    if (value === void 0 || value === null || value === "") {
      return fallback;
    }
    if (typeof value === "string") {
      return !["false", "0", "off", "no"].includes(value.toLowerCase());
    }
    return Boolean(value);
  }
  function renderNow(settings) {
    const value = new Date(String(settings.now || ""));
    return Number.isNaN(value.getTime()) ? /* @__PURE__ */ new Date() : value;
  }
  function calendarMessages(messages) {
    const result = {};
    for (const key of ["allDay", "empty", "moreEvents", "today", "tomorrow", "nextEvent", "ongoing", "later", "untitled", "dayAtGlance", "remainingOne", "remainingMany", "allDayCount", "noMoreToday", "freeAfter", "asOf"]) {
      const value = stringValue(messages[key]);
      if (value) {
        result[key] = value;
      }
    }
    return result;
  }
  function responseEvents(data) {
    return Array.isArray(data.events) ? data.events.filter(
      (event) => isRecord4(event) && isRecord4(event.start)
    ) : [];
  }
  async function fetchCalendarData(apiPath, settings, fetchImplementation) {
    const url = new URL(apiPath, window.location.href);
    if (url.origin !== window.location.origin) {
      throw new Error("Calendar API path must be same-origin.");
    }
    const response = await fetchImplementation(url, {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    const value = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = isRecord4(value) ? stringValue(value.error) : "";
      throw new Error(message || `Calendar request failed with ${response.status}`);
    }
    if (!isRecord4(value)) {
      throw new Error("Calendar API returned an unexpected response.");
    }
    return value;
  }
  function defaultHeader(context, fallbackTitle) {
    if (!booleanValue(context.mergedSettings.showHeader, true)) {
      return void 0;
    }
    const calendarName = stringValue(context.data.calendarName);
    const title = stringValue(context.mergedSettings.title) || calendarName || fallbackTitle;
    const source = context.data.sample ? stringValue(context.messages.sampleSource) : stringValue(context.data.source) || fallbackTitle;
    return {
      kicker: calendarName && calendarName !== title ? calendarName : "",
      title,
      source
    };
  }
  function renderCalendarError(target, title, error) {
    const element = target instanceof HTMLElement ? target : typeof target === "string" ? document.querySelector(target) : document.querySelector("#app");
    if (!element) {
      return;
    }
    const section = document.createElement("section");
    section.className = "pp-error";
    const heading = document.createElement("h1");
    heading.textContent = title;
    const detail = document.createElement("p");
    detail.textContent = error instanceof Error ? error.message : String(error);
    section.append(heading, detail);
    element.replaceChildren(section);
  }
  function bootCalendarApiIntegration(options) {
    const apiPath = options.apiPath ?? "./api/data";
    const fallbackTitle = options.fallbackTitle ?? document.title ?? "Calendar";
    const fetchImplementation = options.fetch ?? fetch;
    const defaultTheme = normalizeColorTheme(stringValue(options.defaults.color) || "light");
    let revision = 0;
    const renderPayload = async (payload) => {
      const currentRevision = ++revision;
      let messages = {};
      try {
        markLoading();
        const languageResult = await loadLanguageJson(payload);
        if (currentRevision !== revision) {
          return;
        }
        messages = languageResult.messages;
        document.documentElement.lang = languageResult.language;
        const overrides = mergeSettings(getSettings(payload), getQuerySettings());
        const mergedSettings = mergeSettings(options.defaults, overrides);
        applyColorTheme(stringValue(mergedSettings.color), { defaultTheme });
        const settings = normalizeCalendarSettings(overrides, options.defaults);
        const now = renderNow(mergedSettings);
        const range = buildCalendarRange(settings, now);
        const requestContext = {
          mergedSettings,
          messages,
          payload,
          range,
          settings
        };
        const request = options.buildRequest?.(requestContext) ?? {
          ...mergedSettings,
          ...settings,
          rangeStart: range.startKey,
          rangeEndExclusive: range.endKey
        };
        const data = await fetchCalendarData(apiPath, request, fetchImplementation);
        if (currentRevision !== revision) {
          return;
        }
        const context = {
          ...requestContext,
          data
        };
        const events = (options.mapEvents?.(context) ?? responseEvents(data)).map((event) => ({
          ...event,
          calendarColor: stringValue(data.calendarColor) || event.calendarColor
        }));
        const header = options.resolveHeader ? options.resolveHeader(context) : defaultHeader(context, fallbackTitle);
        const layout = renderCalendarLayout({
          target: options.target ?? "#app",
          events,
          settings,
          messages: {
            ...calendarMessages(messages),
            ...options.resolveMessages?.(context) ?? {}
          },
          now,
          header
        });
        await document.fonts?.ready;
        await waitForCalendarImages(layout);
        if (currentRevision !== revision) {
          return;
        }
        fitCalendarLayout(layout);
        markReady();
      } catch (error) {
        if (currentRevision === revision) {
          renderCalendarError(
            options.target,
            stringValue(messages.errorTitle) || `${fallbackTitle} unavailable`,
            error
          );
          markError(error);
        }
      }
    };
    return waitForPayload({
      timeoutMs: options.timeoutMs ?? 500,
      fallback: {},
      onUpdate: renderPayload
    }).then(renderPayload);
  }

  // src/manifest.ts
  function isRecord5(value) {
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
  function isLanguageCode2(value) {
    return typeof value === "string" && /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(value.trim());
  }
  function isTimeZone(value) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
      return true;
    } catch {
      return false;
    }
  }
  function validateConfig(config) {
    const errors = [];
    const warnings = [];
    if (!isRecord5(config)) {
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
    if ("language" in config && (!Array.isArray(config.language) || config.language.some((language) => !isLanguageCode2(language)))) {
      errors.push("language must be an array of non-empty language codes");
    }
    if ("timezone" in config && (typeof config.timezone !== "string" || config.timezone.trim() === "" || !isTimeZone(config.timezone))) {
      errors.push("timezone must be a valid IANA timezone");
    }
    if ("nativeSettings" in config && !isRecord5(config.nativeSettings)) {
      errors.push("nativeSettings must be an object");
    }
    if ("formSchema" in config && !isRecord5(config.formSchema)) {
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
  return __toCommonJS(browser_exports);
})();
