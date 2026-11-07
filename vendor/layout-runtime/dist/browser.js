// src/embedded.ts
function embeddedContext() {
  if (typeof window === "undefined" || window.parent === window || !window.name.startsWith("paperless-slot:"))
    return;
  try {
    const value = JSON.parse(window.name.slice("paperless-slot:".length));
    if (typeof value.renderId === "string" && typeof value.regionId === "string" && typeof value.parentOrigin === "string" && /^https?:\/\//.test(value.parentOrigin))
      return value;
  } catch {
  }
}
function postEmbeddedStatus(status, error) {
  const context = embeddedContext();
  if (!context) return;
  const processing = document.querySelector('meta[name="paperless:epd-optimize"]')?.getAttribute("content");
  window.parent.postMessage(
    { type: "PAPERLESS_RENDER_STATUS", ...context, status, error, processing },
    context.parentOrigin
  );
}
function announceEmbeddedListener() {
  const context = embeddedContext();
  if (context)
    window.parent.postMessage(
      { type: "PAPERLESS_RENDER_HELLO", ...context },
      context.parentOrigin
    );
}
function acceptsEmbeddedInit(event) {
  const context = embeddedContext();
  if (!context) return true;
  const message = event.data;
  return event.source === window.parent && event.origin === context.parentOrigin && message?.type === "INIT" && message.renderId === context.renderId && message.regionId === context.regionId;
}

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
  postEmbeddedStatus("loading");
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
  postEmbeddedStatus("ready");
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
  if (doc) {
    doc.getElementById(loadingMarkerId)?.remove();
    appendHiddenMarker(loadedMarkerId, "error");
    doc.documentElement.dataset[renderStatusDataKey] = "error";
    doc.documentElement.dataset[renderErrorDataKey] = error instanceof Error ? error.message : String(error || "unknown error");
    postEmbeddedStatus("error", doc.documentElement.dataset[renderErrorDataKey]);
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
  const { fallback = {}, allowedOrigins, onUpdate, source } = options;
  const timeoutMs = embeddedContext() ? -1 : options.timeoutMs ?? options.timeout ?? 500;
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
      if (source && event.source !== source) return;
      if (typeof event.data?.type === "string" && event.data.type.startsWith("PAPERLESS_")) return;
      if (!acceptsEmbeddedInit(event) || !originAllowed(event.origin, allowedOrigins)) {
        return;
      }
      const payload = normalizePayload(event.data);
      if (payload) {
        finish(payload, event);
      }
    };
    window.addEventListener("message", onMessage);
    announceEmbeddedListener();
    if (timeoutMs >= 0) {
      timer = setTimeout(() => finish(fallback), timeoutMs);
    }
  });
}

// src/settings.ts
function isRecord2(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
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
function fitToScreen(element, options = {}) {
  const { padding = 0, maxScale = 1 } = options;
  const target = element ?? globalThis.document?.body;
  if (typeof window === "undefined" || !target) {
    return 1;
  }
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
function fitImage(image, mode = "contain") {
  image.style.width = "100%";
  image.style.height = "100%";
  image.style.objectFit = mode;
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

// src/layout.ts
var tags = /* @__PURE__ */ new Set([
  "DIV",
  "SECTION",
  "MAIN",
  "HEADER",
  "FOOTER",
  "ASIDE",
  "ARTICLE",
  "P",
  "SPAN",
  "H1",
  "H2",
  "H3",
  "H4",
  "STRONG",
  "EM",
  "SMALL",
  "BR",
  "HR",
  "UL",
  "OL",
  "LI",
  "STYLE",
  "PAPERLESS-SLOT"
]);
function safeCss(css) {
  if (css.length > 32e3 || /url\s*\(|@import|@font-face|image-set\s*\(|expression\s*\(|\\|\/\*/i.test(
    css
  ))
    throw new Error(
      "Layout CSS must not load external resources or use escapes/comments."
    );
  return css;
}
function sanitizeLayoutHtml(html) {
  if (html.length > 32e3) throw new Error("Layout HTML is too large.");
  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const element of [...doc.querySelectorAll("*")]) {
    if (["HTML", "HEAD", "BODY"].includes(element.tagName)) continue;
    if (!tags.has(element.tagName))
      throw new Error(
        `Layout HTML does not support <${element.tagName.toLowerCase()}>.`
      );
    for (const attribute of [...element.attributes]) {
      if (!["class", "id", "name", "style", "aria-label"].includes(attribute.name))
        throw new Error(`Layout HTML does not support ${attribute.name}.`);
      if (attribute.name === "style") safeCss(attribute.value);
    }
    if (element.tagName === "STYLE") safeCss(element.textContent || "");
  }
  return doc.head.innerHTML + doc.body.innerHTML;
}
function validateLayoutRects(rects, width, height) {
  if (rects.length < 2 || rects.length > 4)
    throw new Error("A layout needs two to four slots.");
  rects.forEach((rect, index) => {
    if (![rect.x, rect.y, rect.width, rect.height].every(Number.isInteger) || rect.width < 16 || rect.height < 16 || rect.x < 0 || rect.y < 0 || rect.x + rect.width > width || rect.y + rect.height > height)
      throw new Error(
        "Every slot must fit inside the display and be at least 16 \xD7 16 pixels."
      );
    for (const other of rects.slice(0, index)) {
      if (rect.x < other.x + other.width && rect.x + rect.width > other.x && rect.y < other.y + other.height && rect.y + rect.height > other.y)
        throw new Error("Layout slots must not overlap.");
    }
  });
}
function processingSettings(profile, inherited) {
  if (profile === "photo")
    return JSON.stringify({
      intent: "natural",
      options: { ditheringType: "errorDiffusion" }
    });
  if (profile === "readable") return JSON.stringify({ intent: "readable" });
  if (profile === "quantization")
    return JSON.stringify({
      intent: "readable",
      options: { ditheringType: "quantizationOnly" }
    });
  return inherited || JSON.stringify({ intent: "readable" });
}
async function renderLayout(target, config, signal) {
  if (!config || !Array.isArray(config.regions) || config.regions.length < 2 || config.regions.length > 4 || !config.renderId)
    throw new Error("Select two to four contents for this layout.");
  const ids = config.regions.map((region) => region.id);
  if (new Set(ids).size !== ids.length || ids.some((id) => !/^[a-z][a-z0-9-]{0,31}$/.test(id)))
    throw new Error(
      "Slot names must be unique and use letters, numbers or hyphens."
    );
  const shadow = target.shadowRoot || target.attachShadow({ mode: "open" });
  const gap = Math.max(0, Math.min(64, Number(config.gap) || 0));
  const ratio = Math.max(0.25, Math.min(4, Number(config.ratio) || 1));
  const columns = config.layout === "rows" ? "1fr" : config.layout === "grid" ? "1fr 1fr" : `${ratio}fr ${config.regions.slice(1).map(() => "1fr").join(" ")}`;
  const rows = config.layout === "rows" ? `${ratio}fr ${config.regions.slice(1).map(() => "1fr").join(" ")}` : config.layout === "grid" && config.regions.length > 2 ? "1fr 1fr" : "1fr";
  shadow.innerHTML = `<style>
    :host { display:block; width:100%; height:100%; }
    * { box-sizing:border-box; animation:none!important; transition:none!important; }
    .paperless-layout { display:grid; width:100%; height:100%; grid-template-columns:${columns}; grid-template-rows:${rows}; gap:${gap}px; }
    paperless-slot { display:block; min-width:0; min-height:0; overflow:hidden; }
    paperless-slot > iframe, paperless-slot > img { display:block; border:0; width:100%; height:100%; }
  </style>` + (config.layout === "custom" ? sanitizeLayoutHtml(config.html || "") : `<div class="paperless-layout">${ids.map((id) => `<paperless-slot name="${id}"></paperless-slot>`).join("")}</div>`);
  if (config.layout === "custom") {
    const customStyle = document.createElement("style");
    customStyle.textContent = safeCss(config.css || "");
    shadow.append(customStyle);
  }
  const slots = [...shadow.querySelectorAll("paperless-slot")];
  if (slots.length !== ids.length || slots.some((slot) => !ids.includes(slot.getAttribute("name") || "")) || new Set(slots.map((slot) => slot.getAttribute("name"))).size !== ids.length)
    throw new Error(
      "Custom HTML must contain exactly one paperless-slot for each configured slot name."
    );
  const inherited = /* @__PURE__ */ new Map();
  const timeout = setTimeout(
    () => cancel(
      new Error("Layout contents did not finish loading within 12 seconds.")
    ),
    12e3
  );
  let rejectWait = () => {
  };
  const canceled = new Promise((_, reject) => {
    rejectWait = reject;
  });
  function cancel(error) {
    rejectWait(error);
  }
  const abort = () => cancel(new DOMException("Layout replaced", "AbortError"));
  signal.addEventListener("abort", abort, { once: true });
  const cleanups = [];
  try {
    if (signal.aborted) throw new DOMException("Layout replaced", "AbortError");
    const tasks = config.regions.map(async (region) => {
      const slot = slots.find(
        (slot2) => slot2.getAttribute("name") === region.id
      );
      const url = new URL(region.url, location.href);
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password)
        throw new Error("Invalid content URL.");
      if (region.type === "image") {
        const img = document.createElement("img");
        img.alt = "";
        img.style.objectFit = region.fit === "contain" ? "contain" : "cover";
        img.style.objectPosition = `${Math.max(
          0,
          Math.min(100, region.focalX ?? 50)
        )}% ${Math.max(0, Math.min(100, region.focalY ?? 50))}%`;
        img.src = url.href;
        slot.replaceChildren(img);
        await img.decode();
        if (!img.naturalWidth)
          throw new Error(`Image in ${region.id} could not be loaded.`);
        inherited.set(region.id, JSON.stringify({ intent: "natural" }));
        return;
      }
      await new Promise((resolve, reject) => {
        const frame = document.createElement("iframe");
        frame.title = region.id;
        frame.referrerPolicy = "no-referrer";
        frame.setAttribute("sandbox", "allow-scripts allow-same-origin");
        frame.name = "paperless-slot:" + JSON.stringify({
          renderId: config.renderId,
          regionId: region.id,
          parentOrigin: location.origin
        });
        let initialized = false;
        let finished = false;
        const onMessage = (event) => {
          if (event.source !== frame.contentWindow || event.origin !== url.origin)
            return;
          const message = event.data;
          if (!message || message.renderId !== config.renderId || message.regionId !== region.id)
            return;
          if (message.type === "PAPERLESS_RENDER_HELLO" && !initialized) {
            initialized = true;
            frame.contentWindow.postMessage(
              {
                type: "INIT",
                cmd: "message",
                renderId: config.renderId,
                regionId: region.id,
                data: region.payload || {}
              },
              url.origin
            );
          }
          if (message.type === "PAPERLESS_RENDER_STATUS" && initialized && !finished) {
            if (message.status === "error") {
              finished = true;
              reject(new Error(`Content ${region.id} could not be rendered.`));
            }
            if (message.status === "ready") {
              finished = true;
              inherited.set(
                region.id,
                typeof message.processing === "string" ? message.processing : null
              );
              resolve();
            }
          }
        };
        window.addEventListener("message", onMessage);
        cleanups.push(() => window.removeEventListener("message", onMessage));
        frame.src = url.href;
        slot.replaceChildren(frame);
      });
    });
    await Promise.race([Promise.all(tasks), canceled]);
    await document.fonts?.ready;
    await new Promise(
      (resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    );
    if (signal.aborted) throw new DOMException("Layout replaced", "AbortError");
    const rects = config.regions.map((region) => {
      const slot = slots.find(
        (slot2) => slot2.getAttribute("name") === region.id
      );
      for (let element = slot; element; element = element.parentElement || (element.getRootNode() === shadow ? target : null)) {
        const style = getComputedStyle(element);
        if (style.transform !== "none" || style.clipPath !== "none" || style.maskImage && style.maskImage !== "none" || style.filter !== "none" || style.mixBlendMode !== "normal" || Number(style.opacity) !== 1 || [
          style.borderTopLeftRadius,
          style.borderTopRightRadius,
          style.borderBottomLeftRadius,
          style.borderBottomRightRadius
        ].some((value) => parseFloat(value) !== 0))
          throw new Error(
            "Slots require rectangular, opaque areas without transforms or clipping."
          );
      }
      const bounds = slot.getBoundingClientRect();
      const x = Math.round(bounds.left), y = Math.round(bounds.top);
      return {
        id: region.id,
        x,
        y,
        width: Math.round(bounds.right) - x,
        height: Math.round(bounds.bottom) - y,
        processing: processingSettings(
          (!region.processing || region.processing === "inherit") && region.type === "image" ? "photo" : region.processing,
          inherited.get(region.id)
        )
      };
    });
    validateLayoutRects(rects, innerWidth, innerHeight);
    let meta = document.querySelector(
      'meta[name="paperless:regions"]'
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "paperless:regions";
      document.head.append(meta);
    }
    meta.content = JSON.stringify(rects);
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
    cleanups.forEach((cleanup) => cleanup());
  }
}
async function bootLayoutIntegration(target) {
  let active;
  let hostOrigin;
  window.addEventListener("message", (event) => {
    if (event.source === window.parent && event.data?.type === "INIT" && event.data?.data?.layout)
      hostOrigin = event.origin;
  });
  const notifyHost = (payload, status, error) => {
    if (hostOrigin && window.parent !== window)
      window.parent.postMessage(
        {
          type: "PAPERLESS_LAYOUT_STATUS",
          renderId: payload.layout?.renderId,
          status,
          error
        },
        hostOrigin
      );
  };
  const render = async (payload) => {
    active?.abort();
    const controller = new AbortController();
    active = controller;
    markLoading();
    document.querySelector('meta[name="paperless:regions"]')?.remove();
    try {
      const config = payload.layout;
      applyColorTheme(config?.color || "blue-light");
      await renderLayout(target, config, controller.signal);
      if (!controller.signal.aborted) {
        markReady();
        notifyHost(payload, "ready");
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        markError(error);
        notifyHost(
          payload,
          "error",
          error instanceof Error ? error.message : "Layout failed"
        );
      }
    }
  };
  await render(
    await waitForPayload({
      timeoutMs: -1,
      onUpdate: render,
      source: window.parent
    })
  );
}
export {
  COLOR_THEMES,
  SOFT_HYPHEN,
  addSoftHyphensToTextNodes,
  applyColorTheme,
  applyColorThemeFromQuery,
  bootLayoutIntegration,
  detectOverflow,
  escapeHtml,
  fitAllText,
  fitHyphenatedText,
  fitImage,
  fitText,
  fitToScreen,
  getPayloadLanguage,
  getQuerySettings,
  getSettings,
  hyphenateText,
  hyphenateWord,
  loadLanguageJson,
  markError,
  markLoading,
  markReady,
  mergeSettings,
  normalizeColorTheme,
  prepareHyphenation,
  renderLayout,
  resolveLanguage,
  sanitizeLayoutHtml,
  stripSoftHyphens,
  validateConfig,
  validateLayoutRects,
  waitForPayload
};
