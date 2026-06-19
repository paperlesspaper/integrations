// src/ready.ts
var loadingMarkerId = "website-has-loading-element";
var loadedMarkerId = "website-has-loaded";
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
  appendHiddenMarker(loadingMarkerId);
}
function markReady() {
  const doc = getDocument();
  if (!doc) {
    return;
  }
  doc.getElementById(loadingMarkerId)?.remove();
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
function waitForPayload(options = {}) {
  const { timeoutMs = 500, fallback = {}, allowedOrigins } = options;
  if (typeof window === "undefined") {
    return Promise.resolve(fallback);
  }
  return new Promise((resolve) => {
    let settled = false;
    let timer;
    const finish = (payload) => {
      if (settled) {
        return;
      }
      settled = true;
      window.removeEventListener("message", onMessage);
      if (timer) {
        clearTimeout(timer);
      }
      resolve(payload);
    };
    const onMessage = (event) => {
      if (!originAllowed(event.origin, allowedOrigins)) {
        return;
      }
      const payload = normalizePayload(event.data);
      if (payload) {
        finish(payload);
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

// src/fitText.ts
function px(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function overflowTarget(element, fitParent) {
  if (fitParent instanceof HTMLElement) {
    return fitParent;
  }
  if (fitParent && element.parentElement) {
    return element.parentElement;
  }
  return element;
}
function overflows(element, tolerance, fitParent) {
  const target = overflowTarget(element, fitParent);
  return target.scrollWidth - target.clientWidth > tolerance || target.scrollHeight - target.clientHeight > tolerance;
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
  let size = Math.min(startingSize, max);
  element.style.fontSize = `${size}px`;
  while (size < max && !overflows(element, tolerance, fitParent)) {
    const previousSize = size;
    size = Math.min(max, size + step);
    element.style.fontSize = `${size}px`;
    if (overflows(element, tolerance, fitParent)) {
      size = previousSize;
      element.style.fontSize = `${size}px`;
      break;
    }
  }
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
function isRecord3(value) {
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
function validateConfig(config) {
  const errors = [];
  const warnings = [];
  if (!isRecord3(config)) {
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
  if ("nativeSettings" in config && !isRecord3(config.nativeSettings)) {
    errors.push("nativeSettings must be an object");
  }
  if ("formSchema" in config && !isRecord3(config.formSchema)) {
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
export {
  SOFT_HYPHEN,
  addSoftHyphensToTextNodes,
  detectOverflow,
  escapeHtml,
  fitAllText,
  fitHyphenatedText,
  fitImage,
  fitText,
  fitToScreen,
  getQuerySettings,
  getSettings,
  hyphenateText,
  hyphenateWord,
  markError,
  markLoading,
  markReady,
  mergeSettings,
  prepareHyphenation,
  stripSoftHyphens,
  validateConfig,
  waitForPayload
};
