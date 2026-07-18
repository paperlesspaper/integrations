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
    SOFT_HYPHEN: () => SOFT_HYPHEN,
    addSoftHyphensToTextNodes: () => addSoftHyphensToTextNodes,
    applyColorTheme: () => applyColorTheme,
    applyColorThemeFromQuery: () => applyColorThemeFromQuery,
    detectOverflow: () => detectOverflow,
    escapeHtml: () => escapeHtml,
    fitAllText: () => fitAllText,
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
    normalizeColorTheme: () => normalizeColorTheme,
    observeSettingsHeight: () => observeSettingsHeight,
    postSettingsHeight: () => postSettingsHeight,
    postSettingsReady: () => postSettingsReady,
    postSettingsUpdate: () => postSettingsUpdate,
    prepareHyphenation: () => prepareHyphenation,
    renderOfTheDayLayout: () => renderOfTheDayLayout,
    resolveLanguage: () => resolveLanguage,
    setupSettingsPage: () => setupSettingsPage,
    stripSoftHyphens: () => stripSoftHyphens,
    validateConfig: () => validateConfig,
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
  function appendHiddenMarker(id, text = "") {
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
    marker.textContent = text;
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
    if (!isRecord(value)) {
      return void 0;
    }
    const data = value.data;
    if (isRecord(data) && (value.type === "INIT" || value.cmd === "message")) {
      return data;
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

  // src/manifest.ts
  function isRecord4(value) {
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
  function validateConfig(config) {
    const errors = [];
    const warnings = [];
    if (!isRecord4(config)) {
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
    if ("nativeSettings" in config && !isRecord4(config.nativeSettings)) {
      errors.push("nativeSettings must be an object");
    }
    if ("formSchema" in config && !isRecord4(config.formSchema)) {
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
