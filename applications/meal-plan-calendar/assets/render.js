const {
  applyColorTheme,
  escapeHtml,
  getQuerySettings,
  getSettings,
  hyphenateText,
  loadLanguageJson,
  markError,
  markLoading,
  markReady,
  mergeSettings,
  waitForPayload,
} = window.PaperlessOpenIntegration;

const app = document.querySelector("#app");
const defaults = {
  color: "light",
  title: "",
  calendarUrl: "",
  days: 5,
  startDay: "today",
  slots: "lunch-dinner",
  allDayMeal: "dinner",
  timeZone: "Europe/Berlin",
  iconStyle: "color",
  showHeader: true,
  showLegend: true,
  sampleData: false,
  now: "",
};
const FIT_SCALES = [1, 0.94, 0.88, 0.82, 0.76, 0.7];
const MAX_TITLE = 120;
// Short display side from which the L layout applies (7" frames: 480, L frames: 1200).
const LARGE_MIN_SIDE = 900;
const ICON_STYLES = ["color", "mono"];
const SLOT_ORDER = ["breakfast", "lunch", "dinner", "other"];
// Common dish components; compounds break before them ("Kartoffel-suppe", "Flamm-kuchen").
const DISH_PARTS = [
  "auflauf", "bowl", "braten", "brot", "brötchen", "burger", "chili", "creme", "curry",
  "eintopf", "filet", "fisch", "frikadellen", "gemüse", "gratin", "kartoffeln", "klöße",
  "knödel", "kompott", "kuchen", "lasagne", "nudeln", "omelette", "pfanne", "pizza", "puffer",
  "püree", "quiche", "reis", "risotto", "salat", "sauce", "schnitzel", "soße", "spätzle",
  "spieße", "strudel", "suppe", "taler", "tarte", "würstchen",
];
let revision = 0;

const glyphs = {
  breakfast:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 10h12v4.5a5.5 5.5 0 0 1-5.5 5.5h-1A5.5 5.5 0 0 1 4 14.5z"/><path fill="none" stroke="currentColor" stroke-width="2.2" d="M16 11.5h1.5a2.5 2.5 0 0 1 0 5H15.5"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M8 3.5c-1 1.2 1 2.3 0 3.5M12 3.5c-1 1.2 1 2.3 0 3.5"/></svg>',
  lunch:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.6" fill="currentColor"/><g stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 1.8v2.6M12 19.6v2.6M1.8 12h2.6M19.6 12h2.6M4.8 4.8l1.8 1.8M17.4 17.4l1.8 1.8M4.8 19.2l1.8-1.8M17.4 6.6l1.8-1.8"/></g></svg>',
  dinner:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1z"/><path fill="currentColor" d="M17 3l.8 1.8 1.8.8-1.8.8L17 8.2l-.8-1.8-1.8-.8 1.8-.8z"/></svg>',
  other:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M7 3v7a2 2 0 0 0 4 0V3M9 12v9"/><path d="M17 21V3c-2 1-3.2 3.6-3.2 7.2 0 1.6.9 2.8 3.2 2.8"/></g></svg>',
};

function fill(template, values) {
  return String(template || "").replace(/\{(\w+)\}/g, (_match, key) => values[key] ?? "");
}

function dayFromKey(key) {
  return new Date(`${key}T12:00:00Z`);
}

function formatter(locale, options) {
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...options });
}

function dishBreaks(word) {
  const lower = word.toLowerCase();
  const breaks = new Set();
  for (const part of DISH_PARTS) {
    for (let at = lower.indexOf(part, 3); at > 0; at = lower.indexOf(part, at + 1)) {
      if (word.length - at >= 3) breaks.add(at);
    }
  }
  let result = "";
  let from = 0;
  for (const at of [...breaks].sort((x, y) => x - y)) {
    if (at - from < 3) continue;
    result += `${word.slice(from, at)}\u00ad`;
    from = at;
  }
  return result + word.slice(from);
}

const measure = document.createElement("canvas").getContext("2d");

// Compounds break before known dish components; other words are only split by the shared
// heuristic when they are wider than the line, otherwise they simply wrap as a whole.
function hyphenateTitles() {
  for (const title of app.querySelectorAll(".mp-title")) {
    title.dataset.raw ??= title.textContent;
    measure.font = getComputedStyle(title).font;
    // Landscape titles are inline and flow around a floated meal symbol, so words must also fit
    // on the shortened first line. The margin absorbs small canvas-vs-layout differences.
    const symbol = title.closest(".mp-meal")?.querySelector(".mp-slot");
    const symbolWidth =
      symbol && getComputedStyle(symbol).float === "left" ? symbol.getBoundingClientRect().width * 1.4 : 0;
    const width = (title.closest(".mp-text").clientWidth - symbolWidth) * 0.96;
    title.textContent = title.dataset.raw.replace(/\p{L}{6,}/gu, (word) => {
      const withParts = dishBreaks(word);
      if (withParts !== word || measure.measureText(word).width <= width) return withParts;
      return hyphenateText(word, { minWordLength: 6, minSegmentLength: 2 });
    });
  }
}

function slotBadge(slot, label) {
  return `<span class="mp-slot" role="img" aria-label="${escapeHtml(label)}">${glyphs[slot] || glyphs.other}</span>`;
}

function renderMeal(meal, previousSlot, messages) {
  const slotLabel = messages.slots?.[meal.slot] || meal.slot;
  const classes = ["mp-meal"];
  if (meal.empty) classes.push("is-empty");
  if (meal.slot === previousSlot) classes.push("is-repeat");
  // Bound pathological calendar titles; the layout fit handles everything shorter.
  const raw = meal.empty ? messages.notPlanned : meal.title;
  const title = raw.length > MAX_TITLE ? `${raw.slice(0, MAX_TITLE).replace(/\s+\S*$/, "")}…` : raw;
  return `<li class="${classes.join(" ")}" data-slot="${escapeHtml(meal.slot)}">
    ${slotBadge(meal.slot, slotLabel)}
    <span class="mp-text"><span class="mp-title">${escapeHtml(title)}</span></span>
  </li>`;
}

// L frames place the days in a grid: more than seven days wrap into a second week row in
// landscape; portrait keeps one column while it fits and falls back to two columns of days.
// The 7" frames keep their single row / single column.
function gridOptions(count) {
  if (!app.classList.contains("mp--large")) return [null];
  if (app.classList.contains("mp--landscape")) {
    const rows = count > 7 ? 2 : 1;
    return [{ rows, cols: Math.ceil(count / rows), byColumn: false }];
  }
  const single = { rows: count, cols: 1, byColumn: true };
  return count > 2 ? [single, { rows: Math.ceil(count / 2), cols: 2, byColumn: true }] : [single];
}

function gridClasses(index, grid) {
  if (!grid) return "";
  const row = grid.byColumn ? index % grid.rows : Math.floor(index / grid.cols);
  const col = grid.byColumn ? Math.floor(index / grid.rows) : index % grid.cols;
  const classes = [];
  if (row === 0) classes.push("is-first-row");
  if (col === 0) classes.push("is-first-col");
  if (col === grid.cols - 1) classes.push("is-last-col");
  return classes.map((name) => ` ${name}`).join("");
}

function renderDay(day, data, locale, messages, extraClasses = "") {
  const date = dayFromKey(day.date);
  const isToday = day.date === data.today;
  const weekday = formatter(locale, { weekday: "long" }).format(date);
  const month = formatter(locale, { month: "long" }).format(date);
  let previousSlot = "";
  const meals = day.meals
    .map((meal) => {
      const html = renderMeal(meal, previousSlot, messages);
      previousSlot = meal.slot;
      return html;
    })
    .join("");
  return `<section class="mp-day${isToday ? " is-today" : ""}${day.date < data.today ? " is-past" : ""}${extraClasses}">
    <header class="mp-date">
      <span class="mp-num">${date.getUTCDate()}</span>
      <span class="mp-dt">
        <span class="mp-wd">${escapeHtml(weekday)}</span>
        <span class="mp-mo">${escapeHtml(month)}</span>
      </span>
    </header>
    ${meals ? `<ul class="mp-meals">${meals}</ul>` : `<p class="mp-nothing">${escapeHtml(messages.nothingPlanned)}</p>`}
  </section>`;
}

function usedSlots(days, data) {
  const slots = new Set(data.slots || []);
  for (const day of days) for (const meal of day.meals) slots.add(meal.slot);
  return SLOT_ORDER.filter((slot) => slots.has(slot));
}

function renderPlan(data, settings, messages, visibleCount, grid = null) {
  const locale = messages.locale || "de-DE";
  const days = data.days.slice(0, visibleCount);
  const hidden = data.days.length - days.length;
  const title = String(settings.title || "").trim() || messages.title;
  const head = settings.showHeader
    ? `<header class="mp-head">
        <h1>${escapeHtml(title)}</h1>
        ${data.sample ? `<span class="mp-kicker">${escapeHtml(messages.sampleSource)}</span>` : ""}
      </header>`
    : "";
  const legend = (settings.showLegend ? usedSlots(days, data) : [])
    .map((slot) => {
      const label = messages.slots?.[slot] || slot;
      return `<span data-slot="${slot}">${slotBadge(slot, label)}${escapeHtml(label)}</span>`;
    })
    .join("");
  const meta = [];
  if (hidden > 0) meta.push(hidden === 1 ? messages.moreDaysOne : fill(messages.moreDays, { count: hidden }));
  if (data.sample && !settings.showHeader) meta.push(messages.sampleSource);
  const foot =
    legend || meta.length
      ? `<footer class="mp-foot">
      <span class="mp-legend">${legend}</span>
      <span class="mp-meta">${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</span>
    </footer>`
      : "";
  const gridStyle = grid ? `;--mp-rows:${grid.rows};--mp-cols:${grid.cols}` : "";
  const gridClass = grid?.cols > 1 ? " is-multi-col" : "";
  app.innerHTML = `${head}
    <div class="mp-days${gridClass}" style="--mp-count:${days.length}${gridStyle}">
      ${days.map((day, index) => renderDay(day, data, locale, messages, gridClasses(index, grid))).join("")}
    </div>
    ${foot}`;
}

function layoutOverflows() {
  const container = app.querySelector(".mp-days");
  if (!container) return false;
  if (app.scrollHeight > app.clientHeight + 1) return true;
  if (container.scrollHeight > container.clientHeight + 1) return true;
  for (const day of container.querySelectorAll(".mp-day")) {
    if (day.scrollHeight > day.clientHeight + 1 || day.scrollWidth > day.clientWidth + 1) return true;
  }
  for (const row of container.querySelectorAll(".mp-date")) {
    if (row.scrollWidth > row.clientWidth + 1) return true;
  }
  return false;
}

function clampedTitles() {
  return [...app.querySelectorAll(".mp-title")].filter(
    (title) => title.scrollHeight > title.clientHeight + 1,
  ).length;
}

// A preferred grid that is not the last option only counts while its type stays this large.
const MIN_PREFERRED_SCALE = 0.88;

function fitPlan(data, settings, messages) {
  for (let count = data.days.length; count >= 1; count -= 1) {
    const options = gridOptions(count);
    let best = null;
    for (const [index, grid] of options.entries()) {
      const last = index === options.length - 1;
      renderPlan(data, settings, messages, count, grid);
      for (const scale of FIT_SCALES) {
        if (!last && scale < MIN_PREFERRED_SCALE) break;
        app.style.setProperty("--s", String(scale));
        hyphenateTitles();
        if (layoutOverflows()) continue;
        const clamped = clampedTitles();
        if (!clamped) return;
        if (!best || clamped < best.clamped) best = { grid, scale, clamped };
      }
    }
    // Prefer showing every day with a clamped long title over dropping a whole day.
    if (best) {
      renderPlan(data, settings, messages, count, best.grid);
      app.style.setProperty("--s", String(best.scale));
      hyphenateTitles();
      return;
    }
  }
  // Keep a single day at the smallest scale; line clamping bounds the remaining text.
  renderPlan(data, settings, messages, 1, gridOptions(1).at(-1));
  app.style.setProperty("--s", String(FIT_SCALES.at(-1)));
  hyphenateTitles();
}

async function loadPlan(settings, language) {
  const response = await fetch(new URL("./api/data", window.location.href), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      calendarUrl: settings.calendarUrl,
      days: settings.days,
      startDay: settings.startDay,
      slots: settings.slots,
      allDayMeal: settings.allDayMeal,
      timeZone: settings.timeZone,
      sampleData: settings.sampleData,
      now: settings.now,
      language,
    }),
  });
  const body = await response.text();
  let data = {};
  try {
    data = JSON.parse(body);
  } catch {
    // Some hosts answer failures as plain text; keep only the first message line.
    data = { error: body.split("\n")[0].replace(/^Error:\s*/, "").slice(0, 240) };
  }
  if (!response.ok || data?.error) {
    throw new Error(data?.error || `Meal plan request failed with ${response.status}`);
  }
  if (!Array.isArray(data.days)) throw new Error("Meal plan response is invalid");
  return data;
}

// paperless.css declares Open Sans with font-display: block, so text stays invisible until
// its face has loaded. Load every face this layout uses before measuring and capturing.
const FONT_FACES = ["400", "italic 400", "500", "600", "700", "800"];

async function loadFonts() {
  if (!document.fonts?.load) return;
  await Promise.all(
    FONT_FACES.map((face) =>
      document.fonts.load(`${face} 16px "Paperless Open Sans"`, "Essensplan ÄÖÜäöüß").catch(() => []),
    ),
  );
}

function toBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "string") return !["false", "0", "off", "no"].includes(value.toLowerCase());
  return Boolean(value);
}

async function renderPayload(payload) {
  const current = ++revision;
  let messages = {};
  markLoading();
  try {
    const language = await loadLanguageJson(payload);
    messages = language.messages || {};
    document.documentElement.lang = language.language || "de";
    const settings = mergeSettings(defaults, getSettings(payload), getQuerySettings());
    settings.showHeader = toBoolean(settings.showHeader, true);
    settings.showLegend = toBoolean(settings.showLegend, true);
    settings.sampleData = toBoolean(settings.sampleData, false);
    applyColorTheme(settings.color, { defaultTheme: defaults.color });
    app.classList.remove("mp-error");
    const iconStyle = ICON_STYLES.includes(settings.iconStyle) ? settings.iconStyle : defaults.iconStyle;
    for (const style of ICON_STYLES) app.classList.toggle(`mp--icons-${style}`, style === iconStyle);
    // One unit is 1px on the 800x480 / 480x800 reference frames (7"). L frames (1600x1200 /
    // 1200x1600) use a 1000x750 / 750x1000 reference instead of doubling the 7" layout, so
    // type grows moderately and the extra area shows more days in a grid.
    const landscape = window.innerWidth >= window.innerHeight;
    const large = Math.min(window.innerWidth, window.innerHeight) >= LARGE_MIN_SIDE;
    const [refLong, refShort] = large ? [1000, 750] : [800, 480];
    const unit = landscape
      ? Math.min(window.innerWidth / refLong, window.innerHeight / refShort)
      : Math.min(window.innerWidth / refShort, window.innerHeight / refLong);
    app.style.setProperty("--u", `${unit}px`);
    app.classList.toggle("mp--large", large);
    app.classList.toggle("mp--landscape", landscape);

    const [data] = await Promise.all([loadPlan(settings, language.language || "de"), loadFonts()]);
    if (current !== revision) return;
    fitPlan(data, settings, messages);
    // Faces first used by the rendered text must finish too, or the capture shows blank text.
    await document.fonts?.ready;
    if (current !== revision) return;
    markReady();
  } catch (error) {
    if (current !== revision) return;
    app.classList.add("mp-error");
    app.style.setProperty("--s", "1");
    app.innerHTML = `<h1>${escapeHtml(messages.errorTitle || "Meal plan unavailable")}</h1>
      <p>${escapeHtml(error instanceof Error ? error.message : String(error))}</p>
      <p>${escapeHtml(messages.errorHint || "")}</p>`;
    markError(error);
  }
}

const payload = await waitForPayload({ timeoutMs: 500, onUpdate: renderPayload });
await renderPayload(payload);
