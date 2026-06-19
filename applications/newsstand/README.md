---
slug: newsstand
name: Newsstand
version: 0.1.0
description: Shows a fresh newspaper front page from Riley Walz's Papers archive.
renderPage: ./render.html
settingsPage: ./settings.html
icon: ./assets/icon.png
configUrl: /newsstand/config.json
apiUrl: /newsstand/api/data
---

# Newsstand

Newsstand displays a daily newspaper front page from Riley Walz's Papers archive at `walzr.com/papers`.

## Common URLs

- `/newsstand/`
- `/newsstand/?newspaper=top3`
- `/newsstand/?newspaper=random&showTitleBar=false`
- `/newsstand/?newspaper=nyt&fit=contain`
- `/newsstand/config.json`
- `/newsstand/api/data`
- `/newsstand/api/papers`
- `/newsstand/settings.html`

## Settings

- `newspaper`: `top3`, `random`, or a paper slug from `walzr.com/papers`, for example `nyt`, `wsj`, `guardian`, `wapo`, `latimes`, or `sfchronicle`
- `fit`: `cover` crops to fill the display; `contain` shows the whole front page
- `showTitleBar`: show or hide the compact title bar

Orientation is inferred from the frame dimensions instead of stored as a setting.

The custom settings page fetches `/newsstand/api/papers` and renders the current Walz newspaper slugs as a select. The `newspaper` schema property uses `inStettingsPage: true`, so the CLI preview only shows that control in the settings page frame.

## Language Support

This integration declares `language: ["en", "de", "fr", "es", "it"]` in `config.json` and loads localized fixed UI copy from `languages/<code>.json` using the host-selected `payload.meta.language`.

The language JSON files localize dashboard labels, empty states, update text, and error titles only. Integration settings such as `locale`, `language`, or external API language codes remain separate.
