const { waitForPayload, getSettings, getQuerySettings, mergeSettings, loadLanguageJson, applyColorTheme, markLoading, markReady, markError, escapeHtml } = window.PaperlessOpenIntegration;
const app = document.querySelector("#app");
const defaults = { color: "blue-light", kind: "primary", edition: "auto", limit: 10, limitCharacters: 550, sampleData: false, showImage: true };
const supported = ["de", "en", "fr", "es", "it", "pt", "nl", "pl", "sv", "fi"];
const esc = escapeHtml;
let revision = 0;
let controller;
let lastRender;
const readableDate = (date, edition, year = true) => new Date(`${date}T12:00:00Z`).toLocaleDateString(edition, { day: "numeric", month: "long", ...(year ? { year: "numeric" } : {}), timeZone: "UTC" });
const number = (value, edition) => new Intl.NumberFormat(edition, { notation: "compact", maximumFractionDigits: 1 }).format(value);
const percent = (value, edition) => value === null ? "—" : `${value > 0 ? "+" : ""}${new Intl.NumberFormat(edition, { maximumFractionDigits: 0 }).format(value)}%`;
function shorten(element) {
  const text = element.textContent.replace(/…$/, "");
  const lastSpace = text.lastIndexOf(" ");
  element.textContent = text.slice(0, lastSpace > 0 ? lastSpace : Math.max(0, text.length - 20)) + "…";
}

function shrinkText(element, minimum, maximum) {
  let size = maximum;
  element.style.fontSize = `${size}px`;
  while ((element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1) && size > minimum) {
    size--;
    element.style.fontSize = `${size}px`;
  }
  return element.scrollHeight <= element.clientHeight + 1 && element.scrollWidth <= element.clientWidth + 1;
}

function demoNote(data, messages) {
  return data.sample ? `<aside class="demo-note"><b class="demo">${esc(messages.demo)}</b></aside>` : "";
}
function header(data, messages, title) {
  return `<header><div class="masthead"><span class="brand">WIKIPEDIA <span class="edition">${esc(data.edition.toUpperCase())}</span></span><span>${esc(readableDate(data.date, data.edition))}</span></div><h1>${esc(title)}</h1></header>`;
}
function sparkline(row, messages) {
  const max = Math.max(1, ...row.history.filter(Number.isFinite));
  return `<span class="spark" role="img" aria-label="${esc(messages.history)}: ${esc(row.history.map((v) => v === null ? messages.missing : v).join(', '))}">${row.history.map((value) => `<i class="${value === null ? "missing" : ""}" style="height:${value === null ? 0 : Math.max(3, value / max * 100)}%"></i>`).join("")}</span>`;
}
function rankLabel(row, messages) {
  if (row.newEntry) return messages.new;
  if (row.rankChange === null) return messages.missing;
  return `${messages.rank}: ${row.rankChange > 0 ? "+" : ""}${row.rankChange}`;
}

function draw(data, messages) {
  app.className = `${data.kind}${data.kind === "trends" && data.showImage ? " with-image" : ""}`;
  if (data.kind === "primary") {
    const article = data.article;
    app.innerHTML = article ? `${data.showImage && article.image ? `<img class="hero" src="${esc(article.image)}" alt="${esc(article.title)}">` : ""}<section class="article-body"><h1 class="article-title"><a href="${esc(article.url)}">${esc(article.title)}</a></h1><div class="extract"><strong>${esc(readableDate(data.date, data.edition))} –</strong> ${esc(article.extract)}</div></section>${demoNote(data, messages)}` : `${header(data, messages, messages.featured)}<p class="content message">${esc(messages.emptyArticle)}</p>${demoNote(data, messages)}`;
    return;
  }
  if (data.kind === "onthisday") {
    app.innerHTML = `${header(data, messages, readableDate(data.date, data.edition, false))}<section class="content events">${data.events.length ? data.events.map((event) => `<p class="event">${data.showImage && event.image ? `<img class="event-image" src="${esc(event.image)}" alt="">` : ""}<span class="year">${esc(event.year)}</span> · ${esc(event.text)}</p>`).join("") : `<p class="message">${esc(messages.emptyEvents)}</p>`}</section>${demoNote(data, messages)}`;
    return;
  }
  const trends = true;
  app.innerHTML = `${header(data, messages, messages.top)}<section class="content ranking-stage">${data.showImage ? `<figure class="lead">${data.image ? `<img class="lead-image" src="${esc(data.image)}" alt="${esc(data.imageTitle || data.articles[0].title)}">` : `<div class="no-image">${esc(messages.photoMissing)}</div>`}<figcaption><span class="rank">#1</span><br>${esc(data.articles[0].title)}</figcaption></figure>` : ""}<section class="ranking"><div class="columns"><span>#</span><span></span><span class="metric">${esc(messages.views)}</span>${trends ? `<span class="metric">${esc(messages.change)}</span><span class="metric">${esc(messages.history)}</span>` : ""}</div><div class="rows"></div></section></section>${data.partial ? `<p class="partial">${esc(messages.partial)}</p>` : ""}${demoNote(data, messages)}`;
  const rows = app.querySelector(".rows");
  // More complete rows fit on a larger frame and in portrait; do not shrink the
  // entire display or cut the last row in half.
  const minRowHeight = Math.max(43, Math.min(72, Math.min(innerWidth, innerHeight) * 0.087));
  let count = Math.min(data.articles.length, Math.max(1, Math.floor(rows.clientHeight / minRowHeight)));
  const renderRows = () => {
    const selected = data.articles.slice(0, count);
    rows.innerHTML = selected.map((row) => `<div class="row"><span class="rank" title="${esc(rankLabel(row, messages))}">${row.rank}</span><span class="row-title">${row.url ? `<a href="${esc(row.url)}">${esc(row.title)}</a>` : esc(row.title)}</span><span class="metric">${esc(number(row.views, data.edition))}</span>${trends ? `<span class="metric delta ${row.change > 0 ? "up" : row.change < 0 ? "down" : ""}">${esc(percent(row.change, data.edition))}</span>${sparkline(row, messages)}` : ""}</div>`).join("");

  };
  renderRows();
  while (count > 1 && [...rows.children].some((row) => row.clientHeight < minRowHeight - 1 || row.scrollHeight > row.clientHeight + 1)) {
    count--;
    renderRows();
  }
}

async function settleImages(messages) {
  await Promise.all([...app.querySelectorAll("img")].map(async (image) => {
    let timer;
    try {
      await Promise.race([image.decode(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Image timeout")), 8000); })]);
    } catch {
      if (!image.isConnected) return;
      if (image.classList.contains("hero") || image.classList.contains("event-image")) image.remove();
      else {
        const fallback = document.createElement("div");
        fallback.className = "no-image";
        fallback.textContent = messages.photoMissing;
        image.replaceWith(fallback);
      }
    } finally { clearTimeout(timer); }
  }));
}
function fit(data, messages) {
  for (const metric of app.querySelectorAll(".row .metric")) {
    const maximum = parseFloat(getComputedStyle(metric).fontSize);
    shrinkText(metric, Math.max(10, maximum * .6), maximum);
  }
  const minimum = Math.max(17, Math.min(innerWidth, innerHeight) * .033);
  const extract = app.querySelector(".extract");
  if (extract) {
    const title = app.querySelector(".article-title");
    if (!shrinkText(title, minimum + 5, Math.min(72, Math.min(innerWidth, innerHeight) * .1))) {
      while (title.scrollHeight > title.clientHeight + 1 && title.textContent.length > 20) shorten(title.firstElementChild);
    }
    // If the user requests more text than the frame can hold, end visibly with
    // an ellipsis instead of silently clipping words below the frame.
    if (!shrinkText(extract, minimum, Math.min(65, Math.min(innerWidth, innerHeight) * .075))) {
      while (extract.scrollHeight > extract.clientHeight + 1 && extract.textContent.length > 80) {
        shorten(extract);
      }
    }
  }
  const events = app.querySelector(".events");
  if (events && data.events.length) {
    while (!shrinkText(events, minimum, Math.min(70, Math.min(innerWidth, innerHeight) * .07)) && events.children.length > 1) events.lastElementChild.remove();
    if (events.children.length === 1 && events.scrollHeight > events.clientHeight + 1) {
      const event = events.firstElementChild;
      while (events.scrollHeight > events.clientHeight + 1 && event.textContent.length > 80) shorten(event);
    }
  }
}

async function renderPayload(payload) {
  const current = ++revision;
  controller?.abort();
  controller = new AbortController();
  markLoading();
  lastRender = null;
  let messages;
  try {
    const settings = mergeSettings(defaults, getSettings(payload), getQuerySettings());
    const requested = String(settings.edition === "auto" ? settings.language || payload?.meta?.language || "de" : settings.edition).split("-")[0];
    const edition = supported.includes(requested) ? requested : "de";
    document.documentElement.lang = edition;
    applyColorTheme(settings.color, { defaultTheme: defaults.color });
    ({ messages } = await loadLanguageJson(payload, { supported, requested: edition, defaultLanguage: "de" }));
    if (current !== revision) return;
    const response = await fetch(new URL("./api/data", location.href), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...settings, edition }), signal: controller.signal });
    if (!response.ok) throw new Error(`Wikipedia HTTP ${response.status}`);
    const data = await response.json();
    if (current !== revision) return;
    if (data.error) throw new Error(data.error);
    draw(data, messages);
    // The content introduces bold font faces. Wait after inserting it, then
    // measure ranking capacity again with the final font metrics.
    await document.fonts.ready;
    if (current !== revision) return;
    if (data.kind === "trends") draw(data, messages);
    await settleImages(messages);
    await document.fonts.ready;
    if (current !== revision) return;
    fit(data, messages);
    lastRender = { data, messages };
    markReady();
  } catch (error) {
    if (current !== revision) return;
    app.className = "";
    app.innerHTML = `<h1>Wikipedia</h1><p class="message">${esc(messages?.error || "Wikipedia could not be loaded.")}</p>`;
    markError(error);
  }
}
let resizeTimer;
addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(async () => {
    if (!lastRender) return;
    const current = revision;
    const { data, messages } = lastRender;
    draw(data, messages);
    await settleImages(messages);
    if (current === revision) fit(data, messages);
  }, 120);
});
const payload = await waitForPayload({ timeoutMs: 500, onUpdate: renderPayload });
await renderPayload(payload);
