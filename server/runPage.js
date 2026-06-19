function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#039;';
    }
  });
}

function serializeForScript(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => {
    switch (char) {
      case '<':
        return '\\u003c';
      case '>':
        return '\\u003e';
      case '&':
        return '\\u0026';
      case '\u2028':
        return '\\u2028';
      case '\u2029':
        return '\\u2029';
      default:
        return char;
    }
  });
}

function integrationWebPath(slug, value) {
  if (typeof value !== 'string' || !value.trim()) {
    return '';
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `/${slug}/${value.replace(/^\.?\//, '')}`;
}

export function createRunPage({ config, renderPath, settingsPath, slug }) {
  const title = escapeHtml(config.name || slug);
  const version = escapeHtml(config.version || '0.1.0');
  const renderPage = escapeHtml(config.renderPage || './render.html');
  const configPath = `/${slug}/config.json`;
  const settingsLabel = config.settingsPage ? escapeHtml(config.settingsPage) : '';
  const settingsHref = settingsPath ? escapeHtml(settingsPath) : settingsLabel;
  const iconPath = integrationWebPath(slug, config.icon);
  const topbarTitleClass = iconPath ? 'topbar-title' : 'topbar-title no-icon';
  const iconHtml = iconPath
    ? `<img class="integration-icon" src="${escapeHtml(iconPath)}" alt="" aria-hidden="true">`
    : '';
  const runnerData = serializeForScript({
    config,
    configUrl: configPath,
    renderPath,
    settingsPath: settingsPath || '',
    slug,
  });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="${escapeHtml(iconPath || 'data:,')}" />
    <link rel="stylesheet" href="/assets/runner.css" />
    <title>${title} - paperlesspaper preview</title>
  </head>
  <body>
    <div class="app">
      <header class="topbar">
        <div class="${topbarTitleClass}">
          ${iconHtml}
          <div class="title-copy">
            <div class="topbar-kicker"><span class="button-icon" data-icon="terminal"></span>OpenIntegration preview</div>
            <h1>${title}</h1>
            <div class="topbar-meta">v${version} · ${renderPage}</div>
          </div>
        </div>

        <div class="topbar-controls">
          <div class="viewport-control">
            <div class="viewport-presets" aria-label="Viewport presets">
              <button type="button" class="viewport-preset" data-viewport="480x800" title="480 x 800 portrait" aria-label="480 x 800 portrait"><span class="viewport-symbol portrait">7</span></button>
              <button type="button" class="viewport-preset" data-viewport="800x480" title="800 x 480 landscape" aria-label="800 x 480 landscape"><span class="viewport-symbol landscape">7</span></button>
              <button type="button" class="viewport-preset" data-viewport="1200x1600" title="1200 x 1600 portrait" aria-label="1200 x 1600 portrait"><span class="viewport-symbol portrait">L</span></button>
              <button type="button" class="viewport-preset" data-viewport="1600x1200" title="1600 x 1200 landscape" aria-label="1600 x 1200 landscape"><span class="viewport-symbol landscape">L</span></button>
            </div>
            <select id="viewport" aria-label="Viewport">
              <option value="800x480">800 x 480 landscape</option>
              <option value="480x800">480 x 800 portrait</option>
              <option value="1600x1200">1600 x 1200 landscape</option>
              <option value="1200x1600">1200 x 1600 portrait</option>
              <option value="1024x758">1024 x 758 landscape</option>
              <option value="758x1024">758 x 1024 portrait</option>
              <option value="1200x825">1200 x 825 landscape</option>
              <option value="825x1200">825 x 1200 portrait</option>
            </select>
          </div>
        </div>

        <div class="topbar-actions">
          <button class="primary" id="send" title="Send INIT"><span class="button-icon" data-icon="send"></span><span>Send INIT</span></button>
          <button id="reload" title="Reload preview"><span class="button-icon" data-icon="refresh"></span><span>Reload</span></button>
          <button id="reset" title="Reset saved preview values"><span class="button-icon" data-icon="reset"></span><span>Reset</span></button>
        </div>
      </header>

      <div class="workspace">
        <aside class="sidebar">
          ${
            settingsPath
              ? `<details open>
            <summary><span class="button-icon" data-icon="settings"></span><span>Settings Page</span></summary>
            <div class="details-body">
              <a href="${settingsHref}" target="_blank" rel="noreferrer">${settingsLabel}</a>
              <iframe class="settings-page-frame" id="settings-page" title="${title} settings preview"></iframe>
            </div>
          </details>`
              : ''
          }

          <details open>
            <summary><span class="button-icon" data-icon="form"></span><span>Form Settings</span></summary>
            <div class="details-body">
              <label class="field">
                <span class="field-title">Color</span>
                <select id="color"></select>
              </label>
              <label class="field" id="language-field" hidden>
                <span class="field-title">Language</span>
                <select id="language"></select>
              </label>
              <div class="status warning" id="secret-warning" hidden>
                <strong>Public demo</strong>
                Avoid entering real tokens or API keys.
              </div>
              <div class="settings-form" id="form-fields"></div>
            </div>
          </details>

          <details>
            <summary><span class="button-icon" data-icon="fileJson"></span><span>pluginSettings JSON</span></summary>
            <div class="details-body">
              <textarea id="settings" spellcheck="false"></textarea>
            </div>
          </details>

          <div class="status" id="status">
            <strong>Booting</strong>
            Waiting for the iframe.
          </div>

          <details open>
            <summary><span class="button-icon" data-icon="pulse"></span><span>Diagnostics</span></summary>
            <div class="details-body">
              <div class="status" id="dev-status">
                <strong>Online runner</strong>
                Serving hosted integration files.
              </div>
              <div class="status" id="render-status">
                <strong>Render</strong>
                Not rendered yet.
              </div>
              <div class="status" id="schema-status">
                <strong>Settings schema</strong>
                Waiting for manifest.
              </div>
            </div>
          </details>

          <details open>
            <summary><span class="button-icon" data-icon="image"></span><span>Config Variants</span></summary>
            <div class="details-body manifest-preview">
              <div class="variants-header">
                <div class="status" id="variants-status">
                  <strong>Variants</strong>
                  Waiting for manifest.
                </div>
                <div class="actions">
                  <button id="regenerate-variants" title="Regenerate configured screenshots" disabled><span class="button-icon" data-icon="refresh"></span><span>Regenerate</span></button>
                </div>
              </div>
              <div class="variants-list" id="variants-list"></div>
            </div>
          </details>

          <details open>
            <summary><span class="button-icon" data-icon="monitor"></span><span>Renderer</span></summary>
            <div class="details-body renderer-preview">
              <div class="actions">
                <button id="puppeteer-render" title="Show raw Puppeteer output" disabled><span class="button-icon" data-icon="monitor"></span><span>Puppeteer</span></button>
                <button class="primary" id="epd-render" title="Show epdoptimize output" disabled><span class="button-icon" data-icon="cpu"></span><span>EPD</span></button>
                <button id="show-live" title="Show live iframe preview"><span class="button-icon" data-icon="eye"></span><span>Live</span></button>
                <button id="renderer-download" disabled title="Download current render"><span class="button-icon" data-icon="download"></span><span>Download</span></button>
              </div>
              <div class="status" id="renderer-status">
                <strong>Renderer</strong>
                Hosted runner shows the live iframe preview.
              </div>
            </div>
          </details>

          <div class="meta sidebar-footer">Config: <a href="${escapeHtml(configPath)}">${escapeHtml(configPath)}</a></div>
        </aside>

        <main>
          <div class="frame-wrap">
            <div class="device">
              <iframe id="preview" title="${title} render preview"></iframe>
              <img class="rendered-preview" id="rendered-preview" alt="${title} render output preview" hidden>
            </div>
          </div>
        </main>
      </div>
    </div>

    <script type="application/json" id="runner-data">${runnerData}</script>
    <script type="module" src="/assets/runner.js"></script>
  </body>
</html>`;
}
