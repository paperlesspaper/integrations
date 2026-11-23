const { waitForPayload, getSettings, getQuerySettings, mergeSettings, loadLanguageJson,
  applyColorTheme, markLoading, markReady, markError, escapeHtml } = window.PaperlessOpenIntegration;
const defaults = { color: "blue-light", title: "", sampleData: true, demoState: "printing", token: "", region: "global", deviceId: "", historyLimit: 3, showMaterial: true, showHeader: true };
const app = document.querySelector("#app");
const e = escapeHtml;
const bool = (v) => v === true || v === "true" || v === 1 || v === "1";
const short = (v, max = 160) => String(v ?? "").slice(0, max);
const printerIcon = '<svg class="brand" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 29V3H27V29ZM5 9H27M10 25H22M16 9V15M12 25V20L16 18L20 20V25"/></svg>';
let revision = 0;
let controller;

async function renderPayload(payload) {
  const current = ++revision;
  controller?.abort();
  controller = new AbortController();
  const signal = controller.signal;
  markLoading();
  let m = { error: "Print data unavailable", upstream: "Please check the connection.", setup: "Enter a Bambu token." };
  try {
    const loaded = await loadLanguageJson(payload, { supported: ["de", "en"] });
    if (current !== revision) return;
    m = loaded.messages;
    document.documentElement.lang = loaded.language;
    const settings = mergeSettings(defaults, getSettings(payload), getQuerySettings());
    applyColorTheme(settings.color, { defaultTheme: defaults.color });
    const locale = loaded.language === "de" ? "de-DE" : "en-GB";
    const date = (value, options) => value && Number.isFinite(Date.parse(value))
      ? new Intl.DateTimeFormat(locale, { timeZone: "Europe/Berlin", ...options }).format(new Date(value)) : m.unavailable;
    const time = (value) => date(value, { hour: "2-digit", minute: "2-digit" });
    const day = (value) => date(value, { day: "2-digit", month: "2-digit" });
    const number = (value) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);
    const duration = (seconds) => {
      if (seconds === null || !Number.isFinite(seconds)) return m.unavailable;
      const minutes = Math.round(seconds / 60);
      return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")} min` : `${minutes} min`;
    };
    const response = await fetch(new URL("../api/data", import.meta.url), {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings), signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
    });
    if (!response.ok) throw new Error("upstream");
    const data = await response.json();
    if (current !== revision) return;
    if (data.error) throw new Error(["setup", "auth"].includes(data.error) ? data.error : "upstream");
    const t = data.current;
    const sample = data.sample ? `<span class="sample">${e(m.sample)}</span>` : "";
    const header = bool(settings.showHeader) ? `<header>${printerIcon}<h1>${e(short(settings.title || m.title, 80))}</h1>${sample}</header>` : "";
    const footer = `<footer><span>${e(m.note)}${!bool(settings.showHeader) && data.sample ? ` · <b>${e(m.sample)}</b>` : ""}</span><span>${e(m.updated)} ${e(time(data.updatedAt))}</span></footer>`;
    if (!t) {
      app.innerHTML = `${header}<section class="empty"><h2>${e(m.empty)}</h2><p>${e(m.emptyNote)}</p></section>${footer}`;
    } else {
      const state = ["printing", "finished", "failed", "paused", "unconfirmed"].includes(t.state) ? t.state : "unknown";
      const terminal = state === "finished" || state === "failed";
      const durationValue = t.durationSeconds ?? t.estimateSeconds;
      const placeholder = `<div class="placeholder">${printerIcon}<span>${e(m.noImage)}</span></div>`;
      const image = t.image ? `<img src="${e(t.image)}" alt="${e(short(t.title || m.untitled))}" referrerpolicy="no-referrer" />` : placeholder;
      const timing = t.estimatedEnd || t.endTime;
      const progress = t.progress !== null ? `<div class="progress"><div class="progress-head"><span>${e(m.progress)}</span><b>${e(t.progress)} %</b></div><div class="track" role="progressbar" aria-label="${e(m.progress)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${e(t.progress)}"><span style="width:${Number(t.progress)}%"></span></div></div>` : "";
      const history = data.history.length ? `<section class="history"><h3>${e(m.history)}</h3>${data.history.map((row) => `<article class="history-row" data-state="${e(row.state)}"><span class="history-name">${e(short(row.title || m.untitled))}</span><span class="amount">${e(duration(row.durationSeconds ?? row.estimateSeconds))}</span><time>${e(day(row.endTime || row.startTime))}</time><span class="state">${e(m[row.state] || m.unknown)}</span></article>`).join("")}</section>` : "";
      app.innerHTML = `${header}<section class="hero"><div class="model">${image}</div><div class="details"><span class="status" data-state="${state}">${e(m[state])}</span><h2>${e(short(t.title || m.untitled))}</h2><p class="printer">${e(t.printer || m.cloud)} · ${e(terminal ? m.last : m.current)}</p><div class="metrics"><div class="metric"><span class="label">${e(t.durationSeconds !== null ? m.duration : m.estimate)}</span><p class="value">${e(duration(durationValue))}</p></div><div class="metric"><span class="label">${e(m.filament)}</span><p class="value">${t.weightGrams === null ? e(m.unavailable) : `${e(number(t.weightGrams))} g`}</p></div></div>${bool(settings.showMaterial) && t.materials.length ? `<p class="material">${e(t.materials.join(" / "))}</p>` : ""}${timing ? `<div class="timing"><span class="label">${e(t.estimatedEnd ? m.doneBy : m.ended)} · ${e(day(timing))}</span><span class="value">${e(time(timing))}</span></div>` : ""}${progress}${state === "unconfirmed" || state === "unknown" ? `<p class="note">${e(state === "unconfirmed" ? m.pending : m.unknownNote)}</p>` : ""}</div></section>${history}${footer}`;
      const img = app.querySelector(".model img");
      if (img) {
        let timer;
        const loadedImage = await Promise.race([
          img.decode().then(() => true, () => false),
          new Promise((resolve) => { timer = setTimeout(() => resolve(false), 6000); }),
        ]);
        clearTimeout(timer);
        if (current !== revision) return;
        if (!loadedImage) app.querySelector(".model").innerHTML = placeholder;
      }
    }
    await document.fonts?.ready;
    if (current !== revision) return;
    // Give the current job priority on fixed-size displays. Remove complete
    // oldest history rows if a long title needs extra vertical space.
    const hero = app.querySelector(".hero");
    const history = app.querySelector(".history");
    if (hero && history) {
      const total = history.querySelectorAll(".history-row").length;
      while (hero.scrollHeight > hero.clientHeight + 1 && history.querySelector(".history-row")) {
        history.lastElementChild.remove();
      }
      const shown = history.querySelectorAll(".history-row").length;
      if (!shown) history.remove();
      else if (shown < total) history.querySelector("h3").textContent = `${m.history} · ${shown}/${total}`;
    }
    markReady();
  } catch (error) {
    if (current !== revision) return;
    const detail = m[error.message] || m.upstream;
    app.innerHTML = `<section class="empty"><h2>${e(m.error)}</h2><p>${e(detail)}</p></section>`;
    markError(new Error(detail));
  }
}
const payload = await waitForPayload({ timeoutMs: 500, onUpdate: renderPayload });
await renderPayload(payload);
