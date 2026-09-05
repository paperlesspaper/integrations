const {
  waitForPayload,
  getSettings,
  getQuerySettings,
  mergeSettings,
  loadLanguageJson,
  applyColorTheme,
  markLoading,
  markReady,
  markError,
  escapeHtml,
  fitAllText,
} = window.PaperlessOpenIntegration;
const defaults = {
  color: "blue-light",
  title: "",
  sampleData: false,
  stations: "KÖLN\nBONN",
};
const app = document.querySelector("#app");
let revision = 0;
const short = (v, n = 100) =>
  String(v ?? "").length > n
    ? String(v).slice(0, n - 1) + "…"
    : String(v ?? "");
async function renderPayload(payload) {
  const current = ++revision;
  markLoading();
  let m = {
    error: "Could not load data.",
    setup: "Check settings and connection.",
  };
  try {
    const loaded = await loadLanguageJson(payload, { supported: ["de", "en"] });
    if (current !== revision) return;
    m = loaded.messages;
    document.documentElement.lang = loaded.language;
    const settings = mergeSettings(
      defaults,
      getSettings(payload),
      getQuerySettings(),
    );
    applyColorTheme(settings.color, { defaultTheme: defaults.color });
    const locale = loaded.language === "de" ? "de-DE" : "en-GB";
    const e = escapeHtml;
    const response = await fetch(new URL("../api/data", import.meta.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, language: loaded.language }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw Error("API request failed");
    const d = await response.json();
    if (current !== revision) return;
    const date = (v) => {
      const t = Date.parse(v);
      return Number.isFinite(t)
        ? new Intl.DateTimeFormat(locale, {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: "Europe/Berlin",
          }).format(t)
        : m.unavailable;
    };
    const value = (v) =>
      typeof v === "number"
        ? new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(v)
        : v === null
          ? m.unavailable
          : short(v, 45);
    app.innerHTML = `<header><p class="eyebrow">${e(d.sample ? m.sample : d.source)}</p><h1>${e(short(settings.title || m.title, 80))}</h1></header><section id="content">${d.summary ? `<p class="summary">${e(d.summary)}</p>` : ""}<div class="cards">${d.cards.map((c) => `<article class="entry tone-${["orange", "blue", "green", "red"].includes(c.tone) ? c.tone : "blue"}"><h2>${e(short(c.title, 100))}</h2>${c.value !== "" ? `<div class="value">${e(value(c.value))}${c.unit ? `<span class="unit">${e(c.unit)}</span>` : ""}</div>` : ""}${c.detail ? `<p class="detail">${e(short(c.detail, 110))}</p>` : ""}${c.stamp ? `<p class="stamp">${e(date(c.stamp))}</p>` : ""}${c.caption ? `<p class="caption">${e(c.caption)}</p>` : ""}</article>`).join("")}</div>${!d.cards.length ? `<p class="summary">${e(m.empty)}</p>` : ""}</section><p class="note">${e(d.partial ? m.partial + " · " : "")}${e(d.note || "")}</p><footer><span id="count">${e(d.source)}</span><span>${e(m.updated)} ${e(date(d.updatedAt))}</span></footer>`;
    await document.fonts?.ready;
    if (current !== revision) return;
    fitAllText("h1");
    const content = app.querySelector("#content"),
      cards = app.querySelector(".cards");
    const total = d.total ?? d.cards.length;
    let shown = d.cards.length;
    while (
      content.scrollHeight > content.clientHeight + 1 &&
      cards.children.length > 1
    ) {
      cards.lastElementChild.remove();
      shown--;
    }
    if (total > shown)
      app.querySelector("#count").textContent = m.shown
        .replace("{shown}", shown)
        .replace("{total}", total);
    markReady();
  } catch (error) {
    if (current !== revision) return;
    app.innerHTML = `<h1>${escapeHtml(m.error)}</h1><p>${escapeHtml(m.setup)}</p>`;
    markError(new Error(m.error));
  }
}
const payload = await waitForPayload({
  timeoutMs: 500,
  onUpdate: renderPayload,
});
await renderPayload(payload);
