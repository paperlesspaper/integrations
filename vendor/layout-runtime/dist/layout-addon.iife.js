"use strict";
var PaperlessLayoutIntegration = (() => {
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

  // src/layout-addon.ts
  var layout_addon_exports = {};
  __export(layout_addon_exports, {
    bootLayoutIntegration: () => bootLayoutIntegration,
    markError: () => markError,
    markLoading: () => markLoading,
    markReady: () => markReady,
    waitForPayload: () => waitForPayload
  });

  // src/renderEmbedded.ts
  function installEmbeddedRenderBridge() {
    if (window.parent === window || !window.name.startsWith("paperless-slot:"))
      return;
    let context;
    try {
      context = JSON.parse(window.name.slice("paperless-slot:".length));
    } catch {
      return;
    }
    let initialized = false;
    let completed = false;
    const notify = () => {
      if (!initialized || completed) return;
      const status = document.documentElement?.dataset.paperlessRenderStatus;
      if (!document.querySelector("#website-has-loaded") && status !== "error")
        return;
      completed = true;
      window.parent.postMessage(
        {
          ...context,
          type: "PAPERLESS_RENDER_STATUS",
          status: status === "error" ? "error" : "ready",
          processing: document.querySelector('meta[name="paperless:epd-optimize"]')?.getAttribute("content")
        },
        context.parentOrigin
      );
    };
    window.addEventListener(
      "message",
      (event) => {
        if (event.source !== window.parent || event.origin !== context.parentOrigin || event.data?.type !== "INIT" || event.data.renderId !== context.renderId || event.data.regionId !== context.regionId || initialized)
          return;
        initialized = true;
        document.querySelector("#website-has-loaded")?.remove();
        document.documentElement.dataset.paperlessRenderStatus = "loading";
        const calendar = event.data.data?.calendarData;
        if (event.data.data?.kind === "google-calendar" && calendar)
          queueMicrotask(
            () => window.postMessage(
              { cmd: "message", type: "GOOGLECALENDAR", data: calendar.events },
              location.origin
            )
          );
      },
      true
    );
    document.addEventListener("DOMContentLoaded", () => {
      new MutationObserver(notify).observe(document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true
      });
    });
    window.addEventListener(
      "load",
      () => {
        window.parent.postMessage(
          { ...context, type: "PAPERLESS_RENDER_HELLO" },
          context.parentOrigin
        );
      },
      { once: true }
    );
  }

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

  // src/layout-addon.ts
  if (typeof window !== "undefined") installEmbeddedRenderBridge();
  return __toCommonJS(layout_addon_exports);
})();
Object.assign(globalThis.PaperlessOpenIntegration ||= {}, PaperlessLayoutIntegration);
