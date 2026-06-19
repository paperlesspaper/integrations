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

export function createRunPage({ config, renderPath, settingsPath, slug }) {
  const title = escapeHtml(config.name || slug);
  const description = escapeHtml(config.description || '');
  const escapedSlug = escapeHtml(slug);
  const runnerData = serializeForScript({
    config,
    renderPath,
    settingsPath: settingsPath || '',
    slug,
  });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" href="data:," />
    <link rel="stylesheet" href="/assets/runner.css" />
    <title>${title} - paperlesspaper demo</title>
  </head>
  <body>
    <div class="app">
      <header>
        <div>
          <h1>${title}</h1>
          <p class="subtitle">${description}</p>
        </div>
        <nav class="header-actions" aria-label="Integration links">
          <a href="/${escapedSlug}/">Render</a>
          <a href="/${escapedSlug}/config.json">Manifest</a>
        </nav>
      </header>

      <main>
        <section class="preview" aria-label="Live preview">
          <div class="preview-toolbar">
            <label>
              Viewport
              <select id="viewport">
                <option value="800x480">800 x 480 landscape</option>
                <option value="480x800">480 x 800 portrait</option>
                <option value="1200x1600">1200 x 1600 portrait</option>
                <option value="1600x1200">1600 x 1200 landscape</option>
              </select>
            </label>
            <button id="reload" type="button">Reload</button>
            <p class="status" id="status">Loading preview.</p>
          </div>
          <div class="stage">
            <div class="device" id="device">
              <iframe id="preview" title="${title} preview"></iframe>
            </div>
          </div>
        </section>

        <aside aria-label="Settings">
          <div class="controls">
            <section class="group">
              <h2>Host</h2>
              <label>
                Language
                <select id="language"></select>
              </label>
              <label>
                Color
                <select id="color"></select>
              </label>
            </section>

            <section class="group" id="settings-page-group" hidden>
              <h2>Settings Page</h2>
              <iframe class="settings-frame" id="settings-page" title="${title} settings"></iframe>
            </section>

            <section class="group">
              <h2>Settings</h2>
              <p class="warning" id="secret-warning" hidden>Public demo. Avoid entering real tokens or API keys.</p>
              <div id="form-fields"></div>
              <p class="empty" id="empty-fields" hidden>No generated settings.</p>
            </section>

            <section class="group">
              <h2>JSON</h2>
              <textarea id="settings-json" spellcheck="false"></textarea>
              <div class="buttons">
                <button id="apply-json" type="button">Apply JSON</button>
                <button id="reset" type="button">Reset</button>
              </div>
            </section>
          </div>
        </aside>
      </main>
    </div>

    <script type="application/json" id="runner-data">${runnerData}</script>
    <script type="module" src="/assets/runner.js"></script>
  </body>
</html>`;
}
