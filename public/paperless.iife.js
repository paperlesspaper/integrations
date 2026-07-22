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
    buildCalendarRange: () => buildCalendarRange,
    detectOverflow: () => detectOverflow,
    escapeHtml: () => escapeHtml,
    fitAllText: () => fitAllText,
    fitCalendarLayout: () => fitCalendarLayout,
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

  // src/runtime.ts
  function isRecord(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }
  function normalizePayload(value) {
    if (Array.isArray(value)) {
      return { data: value };
    }
    if (!isRecord(value)) {
      return void 0;
    }
    const data = value.data;
    if ((isRecord(data) || Array.isArray(data)) && (value.type === "INIT" || value.cmd === "message")) {
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
  function isRecord2(value) {
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
    if (!isRecord2(settings) || !isRecord2(settings.pluginSettings)) {
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
    if (!isRecord2(message)) {
      return void 0;
    }
    if (isRecord2(message.data) && (message.type === "INIT" || message.cmd === "message")) {
      return message.data;
    }
    if (isRecord2(message.payload)) {
      return message.payload;
    }
    return void 0;
  }
  function getSettingsFromMessage(message, defaults) {
    if (!isRecord2(message)) {
      return void 0;
    }
    const payload = payloadFromSettingsMessage(message);
    if (payload) {
      return getSettings(payload, defaults);
    }
    if (isRecord2(message.pluginSettings)) {
      return mergeSettings(defaults, message.pluginSettings);
    }
    if (isRecord2(message.settings)) {
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

  // src/language.ts
  function isRecord3(value) {
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
    const meta = isRecord3(payload?.meta) ? payload.meta : void 0;
    const manifest = isRecord3(meta?.pluginManifest) ? meta.pluginManifest : void 0;
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
    const meta = isRecord3(payload?.meta) ? payload.meta : void 0;
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
    if (!isRecord3(messages)) {
      throw new Error(`Language JSON for ${language} must contain an object`);
    }
    return {
      language,
      messages
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

  // src/html.ts
  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }

  // src/ofTheDay.ts
  var TEXT_SIZES = ["small", "middle", "big"];
  var LAYOUT_CLASSES = [
    "pp-otd--default",
    "pp-otd--facts-left-landscape",
    "pp-otd--hide-header",
    "pp-otd--no-facts",
    "pp-otd--text-small",
    "pp-otd--text-middle",
    "pp-otd--text-big"
  ];
  function normalizeTextSize(value) {
    const normalized = String(value || "middle").toLowerCase();
    return TEXT_SIZES.includes(normalized) ? normalized : "middle";
  }
  function resolveTarget(target) {
    if (target instanceof HTMLElement) {
      return target;
    }
    if (typeof target === "string") {
      const element = document.querySelector(target);
      if (!element) {
        throw new Error(`Could not find of-the-day target: ${target}`);
      }
      return element;
    }
    return document.querySelector("#app") ?? document.body;
  }
  function classAttr(...classes) {
    return classes.filter(Boolean).join(" ");
  }
  function isVisible(item) {
    return item.visible !== false;
  }
  function hasText(value) {
    return String(value ?? "").trim().length > 0;
  }
  function styleProperty(name) {
    return name.startsWith("--") ? name : `--${name}`;
  }
  function renderMetaItem(item) {
    const key = item.key ? ` data-key="${escapeHtml(item.key)}"` : "";
    const classes = classAttr("pp-otd-meta-item", item.className);
    const label = hasText(item.label) ? `<p class="pp-otd-meta-label">${escapeHtml(item.label)}</p>` : "";
    return `
    <div class="${classes}"${key}>
      ${label}
      <p class="pp-otd-meta-value">${escapeHtml(item.value)}</p>
    </div>
  `;
  }
  function renderFact(item, emptyValue) {
    const value = hasText(item.value) ? item.value : emptyValue;
    return `
    <article class="${classAttr("pp-otd-fact", item.className)}">
      <p class="pp-otd-label">${escapeHtml(item.label)}</p>
      <p class="pp-otd-value">${escapeHtml(value)}</p>
    </article>
  `;
  }
  function renderOfTheDayLayout(options) {
    const target = resolveTarget(options.target);
    const textSize = normalizeTextSize(options.textSize);
    const layout = options.layout || "default";
    const showHeader = options.showHeader !== false;
    const facts = (options.facts || []).filter(isVisible);
    const meta = (options.meta || []).filter(isVisible).filter((item) => hasText(item.value));
    const emptyValue = options.emptyValue ?? "N/A";
    const image = options.image || {};
    target.classList.add("pp-screen", "pp-otd-screen");
    target.classList.remove(...LAYOUT_CLASSES);
    target.classList.add(`pp-otd--${layout}`, `pp-otd--text-${textSize}`);
    if (!showHeader) {
      target.classList.add("pp-otd--hide-header");
    }
    if (!facts.length) {
      target.classList.add("pp-otd--no-facts");
    }
    if (options.className) {
      target.classList.add(...options.className.split(/\s+/).filter(Boolean));
    }
    if (options.customProperties) {
      for (const [name, value] of Object.entries(options.customProperties)) {
        if (value !== void 0) {
          target.style.setProperty(styleProperty(name), String(value));
        }
      }
    }
    const imageStyle = [
      image.fit ? `object-fit:${image.fit}` : "",
      image.position ? `object-position:${image.position}` : "",
      image.blendMode ? `mix-blend-mode:${image.blendMode}` : ""
    ].filter(Boolean).join(";");
    target.innerHTML = `
    <section class="pp-otd-shell">
      <header class="pp-otd-header" aria-hidden="${showHeader ? "false" : "true"}">
        <div class="pp-otd-title-area">
          ${hasText(options.kicker) ? `<p class="pp-otd-kicker">${escapeHtml(options.kicker)}</p>` : ""}
          <h1 class="pp-otd-title pp-fit">${escapeHtml(options.title)}</h1>
          ${hasText(options.signature) ? `<p class="pp-otd-signature pp-fit">${escapeHtml(options.signature)}</p>` : ""}
          ${hasText(options.subtitle) ? `<p class="pp-otd-subtitle">${escapeHtml(options.subtitle)}</p>` : ""}
        </div>
        ${meta.length ? `<aside class="pp-otd-meta">${meta.map(renderMetaItem).join("")}</aside>` : ""}
      </header>
      <div class="pp-otd-image-stage">
        <img class="${classAttr("pp-otd-image", image.className)}" src="${escapeHtml(
      image.src
    )}" alt="${escapeHtml(image.alt)}"${imageStyle ? ` style="${escapeHtml(imageStyle)}"` : ""} />
      </div>
      <section class="pp-otd-fact-grid" data-count="${facts.length}">
        ${facts.map((item) => renderFact(item, emptyValue)).join("")}
      </section>
    </section>
  `;
    const shell = target.querySelector(".pp-otd-shell");
    const imageStage = target.querySelector(".pp-otd-image-stage");
    const renderedImage = target.querySelector(".pp-otd-image");
    const factGrid = target.querySelector(".pp-otd-fact-grid");
    if (!shell || !imageStage || !renderedImage || !factGrid) {
      throw new Error("Could not render of-the-day layout.");
    }
    return {
      target,
      shell,
      header: target.querySelector(".pp-otd-header"),
      title: target.querySelector(".pp-otd-title"),
      signature: target.querySelector(".pp-otd-signature"),
      subtitle: target.querySelector(".pp-otd-subtitle"),
      imageStage,
      image: renderedImage,
      factGrid,
      facts: Array.from(target.querySelectorAll(".pp-otd-fact")),
      meta: Array.from(target.querySelectorAll(".pp-otd-meta-item"))
    };
  }
  function fitOfTheDayLayout(layout, options = {}) {
    const root = typeof layout === "string" || layout instanceof HTMLElement ? resolveTarget(layout) : layout.target;
    const title = root.querySelector(".pp-otd-title");
    const signature = root.querySelector(".pp-otd-signature");
    if (title) {
      fitText(title, {
        min: options.titleMin ?? 28,
        max: options.titleMax,
        step: 2,
        tolerance: 6,
        lineBreak: "balance",
        fitParent: true
      });
    }
    if (signature) {
      fitHyphenatedText(signature, {
        min: options.signatureMin ?? 10,
        max: options.signatureMax,
        step: 1,
        lineBreak: true
      });
    }
    if (options.fitScreen !== false) {
      fitToScreen(root, { padding: options.screenPadding ?? 0 });
    }
  }
  function waitForOfTheDayImage(layoutOrImage) {
    const image = layoutOrImage instanceof HTMLImageElement ? layoutOrImage : layoutOrImage.image;
    if (image.complete && image.naturalWidth > 0) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => reject(new Error("Image could not load.")), {
        once: true
      });
    });
  }

  // src/calendar.ts
  var DEFAULT_CALENDAR_SETTINGS = {
    view: "agenda",
    locale: "en",
    dayRange: 14,
    maxEvents: 20,
    highlightToday: false,
    highlightScale: 1,
    showLocation: true,
    showEventIcons: true,
    showEventImages: true
  };
  var DEFAULT_CALENDAR_MESSAGES = {
    allDay: "All day",
    empty: "No events",
    moreEvents: "+{count} more",
    today: "Today",
    untitled: "Untitled event"
  };
  var VIEW_ALIASES = {
    agenda: "agenda",
    day: "day",
    "3-days": "three-days",
    "3days": "three-days",
    three: "three-days",
    "three-day": "three-days",
    "three-days": "three-days",
    week: "week",
    year: "year"
  };
  var VIEW_CLASSES = [
    "pp-cal--view-agenda",
    "pp-cal--view-day",
    "pp-cal--view-three-days",
    "pp-cal--view-week",
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
      locale: validLocale(localeValue, base.locale),
      timeZone: validTimeZone(source.timeZone ?? base.timeZone),
      dayRange: clampInteger(dayRangeValue, base.dayRange, 1, 366),
      maxEvents: clampInteger(source.maxEvents, base.maxEvents, 1, 200),
      highlightToday: parseBoolean(source.highlightToday, base.highlightToday),
      highlightScale: clampNumber(source.highlightScale, base.highlightScale, 1, 3),
      showLocation: parseBoolean(source.showLocation, base.showLocation),
      showEventIcons: parseBoolean(source.showEventIcons, base.showEventIcons),
      showEventImages: parseBoolean(source.showEventImages, base.showEventImages)
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
    if (settings.view === "agenda") {
      endKey = addDaysToKey(startKey, settings.dayRange);
    } else if (settings.view === "three-days") {
      endKey = addDaysToKey(startKey, 3);
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
  function renderEventIcon(event, settings, aliases) {
    const iconName = normalizeIconName(event.iconName);
    if (!settings.showEventIcons || !iconName) {
      return "";
    }
    const iconClass = normalizeIconName(aliases[iconName] ?? iconName);
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
  function renderEventCard(item, settings, messages, aliases, compact = false, showDetails = !compact) {
    const event = item.event;
    const title = hasText2(event.title) ? event.title : messages.untitled;
    const location = settings.showLocation && hasText2(event.location) ? `<p class="pp-cal-event-location">${escapeHtml(event.location)}</p>` : "";
    const details = showDetails ? renderDetails(event) : "";
    const classes = [
      "pp-cal-event",
      compact ? "pp-cal-event--compact" : "",
      details ? "pp-cal-event--with-details" : ""
    ].filter(Boolean).join(" ");
    return `<article class="${classes}" data-date="${escapeHtml(item.dateKey)}">
    <p class="pp-cal-event-time">${escapeHtml(eventTimeText(event, settings, messages))}</p>
    <div class="pp-cal-event-content">
      <div class="pp-cal-event-heading">${renderEventIcon(event, settings, aliases)}<h2 class="pp-cal-event-title">${escapeHtml(
      title
    )}</h2></div>
      ${location}
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
    const weekday = formatCivilDate(dateKey, settings.locale, { weekday: "short" });
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
    }).join("")}${hidden > 0 ? `<p class="pp-cal-more">${escapeHtml(moreEventsLabel(messages.moreEvents, hidden))}</p>` : ""}</div>`;
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
      )}</header><div class="pp-cal-column-events">${visible.length ? `${visible.map((item) => renderEventCard(item, settings, messages, aliases, true, true)).join("")}${hidden > 0 ? `<p class="pp-cal-more">${escapeHtml(moreEventsLabel(messages.moreEvents, hidden))}</p>` : ""}` : `<div class="pp-cal-empty">${escapeHtml(messages.empty)}</div>`}</div></section>`;
    }).join("")}</section>`;
  }
  function renderWeek(range, events, settings, messages, aliases, todayKey) {
    const grouped = eventsByDate(events);
    const perDayLimit = Math.min(settings.maxEvents, 4);
    return `<section class="pp-cal-week">${range.dateKeys.map((dateKey) => {
      const items = grouped.get(dateKey) || [];
      const visible = items.slice(0, perDayLimit);
      const hidden = items.length - visible.length;
      const classes = settings.highlightToday && dateKey === todayKey ? "pp-cal-week-cell is-today" : "pp-cal-week-cell";
      return `<section class="${classes}"><header class="pp-cal-week-heading">${dateHeader(
        dateKey,
        settings
      )}</header><div class="pp-cal-week-events">${visible.map((item) => renderEventCard(item, settings, messages, aliases, true)).join("")}${hidden > 0 ? `<p class="pp-cal-more">${escapeHtml(moreEventsLabel(messages.moreEvents, hidden))}</p>` : ""}</div></section>`;
    }).join("")}</section>`;
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
  function renderCalendarLayout(options) {
    const target = resolveTarget2(options.target);
    const settings = normalizeCalendarSettings(options.settings);
    const messages = { ...DEFAULT_CALENDAR_MESSAGES, ...options.messages };
    const now = normalizeNow(options.now);
    const range = buildCalendarRange(settings, now);
    const events = prepareCalendarEvents(options.events || [], settings, now);
    const todayKey = dateKeyFromDate(now, settings.timeZone);
    const aliases = options.iconAliases || {};
    target.classList.add("pp-screen", "pp-cal-screen");
    target.classList.remove(...VIEW_CLASSES);
    target.classList.add(`pp-cal--view-${settings.view}`);
    if (options.className) {
      target.classList.add(...options.className.split(/\s+/).filter(Boolean));
    }
    const content = settings.view === "year" ? renderYear(range, events, settings, todayKey) : settings.view === "week" ? renderWeek(range, events, settings, messages, aliases, todayKey) : settings.view === "day" || settings.view === "three-days" ? renderDayColumns(range, events, settings, messages, aliases, todayKey) : renderAgenda(events, settings, messages, aliases, todayKey);
    target.innerHTML = `<section class="pp-cal-shell">${renderHeader(options.header)}${renderTodayBanner(
      settings,
      messages,
      todayKey
    )}<section class="pp-cal-body"><h1 class="pp-cal-range-title">${escapeHtml(
      formatRangeTitle(range, settings)
    )}</h1><div class="pp-cal-content pp-fit">${content}</div></section></section>`;
    const shell = target.querySelector(".pp-cal-shell");
    const body = target.querySelector(".pp-cal-content");
    if (!shell || !body) {
      throw new Error("Could not render calendar layout.");
    }
    return { target, shell, body, settings, events, range };
  }
  function fitCalendarLayout(layoutOrTarget, options = {}) {
    const target = typeof layoutOrTarget === "string" || layoutOrTarget instanceof HTMLElement ? resolveTarget2(layoutOrTarget) : layoutOrTarget.target;
    const body = target.querySelector(".pp-cal-content");
    const view = VIEW_CLASSES.find((className) => target.classList.contains(className));
    const defaults = view === "pp-cal--view-year" ? { min: 5, max: 12 } : view === "pp-cal--view-week" ? { min: 7, max: 14 } : { min: 9, max: 17 };
    if (body) {
      fitText(body, {
        min: options.min ?? defaults.min,
        max: options.max ?? defaults.max,
        step: options.step ?? 0.5,
        tolerance: options.tolerance ?? 8
      });
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
    for (const key of ["allDay", "empty", "moreEvents", "today", "untitled"]) {
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
        const events = options.mapEvents?.(context) ?? responseEvents(data);
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
