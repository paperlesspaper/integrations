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
  sampleData: true,
  baseUrl: "",
  token: "",
  entities: "",
};
const app = document.querySelector("#app");
const esc = escapeHtml;
const yes = (v) => v === true || v === "true" || v === 1 || v === "1";
const short = (v, n = 110) =>
  String(v ?? "").length > n
    ? String(v).slice(0, n - 1) + "…"
    : String(v ?? "");
let messages = {},
  locale = "de-DE",
  settings = {},
  revision = 0;
const t = (key, vars = {}) =>
  Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll("{" + k + "}", String(v)),
    messages[key] || key,
  );
function num(v, digits = 0) {
  return typeof v === "number" && Number.isFinite(v)
    ? new Intl.NumberFormat(locale, {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
        ...(Math.abs(v) > 1e6 ? { notation: "compact" } : {}),
      }).format(v)
    : "—";
}
function stamp(value, options = { dateStyle: "short", timeStyle: "short" }) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    timeZone: settings.timeZone || "Europe/Berlin",
    ...options,
  }).format(date);
}
function sensorValue(s) {
  if (s.unavailable || ["unknown", "unavailable"].includes(s.value))
    return t("unavailable");
  if (["on", "off"].includes(s.value))
    return ["window", "door", "opening"].includes(s.deviceClass)
      ? t(s.value === "on" ? "open" : "closed")
      : t(s.value);
  const value = String(s.value ?? "");
  return value.trim() !== "" && Number.isFinite(Number(value))
    ? num(Number(value), Math.abs(Number(value)) < 100 ? 1 : 0)
    : short(value, 32);
}
function metric(s) {
  return `<article class="metric entry"><h2>${esc(short(s.role ? t(s.role) : s.name, 70))}</h2><div class="value">${esc(sensorValue(s))}<span class="unit">${esc(s.unavailable ? "" : s.unit || "")}</span></div>${s.updatedAt ? `<p class="detail">${esc(t("sourceTime"))}: ${esc(stamp(s.updatedAt))}</p>` : ""}</article>`;
}
function fitEntries() {
  const content = app.querySelector("#content");
  let entries = [...content.querySelectorAll(".entry")];
  const total = Number(content.dataset.total) || entries.length;
  let removed = 0;
  while (
    content.scrollHeight > content.clientHeight + 1 &&
    entries.length > 1
  ) {
    entries.pop().remove();
    removed++;
  }
  if (total > entries.length) {
    app.querySelector("#count").textContent = t("shown", {
      shown: entries.length,
      total,
    });
  }
  if (content.scrollHeight > content.clientHeight + 1 && removed === 0)
    content.classList.add("compact");
  fitAllText("h1");
}
async function renderPayload(payload) {
  const current = ++revision;
  try {
    markLoading();
    const loaded = await loadLanguageJson(payload);
    if (current !== revision) return;
    messages = loaded.messages;
    document.documentElement.lang = loaded.language;
    locale = String(payload?.meta?.language || "de").startsWith("de")
      ? "de-DE"
      : "en-GB";
    settings = mergeSettings(
      defaults,
      getSettings(payload),
      getQuerySettings(),
    );
    applyColorTheme(settings.color, { defaultTheme: defaults.color });
    const response = await fetch(new URL("../api/data", import.meta.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...settings, language: locale }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error("API request failed");
    const data = await response.json();
    if (current !== revision) return;
    const title = String(settings.title || messages.title);
    app.innerHTML = `<header><div><p class="eyebrow">${data.sample ? esc(t("sample")) : esc(data.source)}</p><h1>${esc(title)}</h1></div></header><section id="content"></section><footer><span id="count">${esc(data.source)}</span><span>${esc(t("updated"))} ${esc(stamp(data.updatedAt))}</span></footer>`;
    paint(data, app.querySelector("#content"));
    await document.fonts?.ready;
    if (current !== revision) return;
    fitEntries();
    markReady();
  } catch (error) {
    if (current !== revision) return;
    app.innerHTML = `<section id="content" class="error"><h1 class="hero">${esc(t("error"))}</h1><p class="note">${esc(t("setup"))}</p></section>`;
    markError(new Error(t("error")));
  }
}
function paint(data, root) {
  root.dataset.total = data.sensors.length;
  root.innerHTML = `<div class="metrics">${data.sensors.slice(0, 6).map(metric).join("")}</div>`;
}
const payload = await waitForPayload({
  timeoutMs: 500,
  onUpdate: renderPayload,
});
await renderPayload(payload);
