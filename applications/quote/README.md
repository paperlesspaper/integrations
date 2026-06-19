---
slug: quote
name: Quote
version: 0.1.0
description: Shows a deterministic daily quote, with optional index selection.
renderPage: ./render.html
configUrl: /quote/config.json
apiUrl: /quote/api/data
offline: true
screenshots:
  - ./screenshots/quote-daily-1600x1200-landscape.png
  - ./screenshots/quote-daily-1200x1600-portrait.png
  - ./screenshots/quote-daily-800x480-landscape.png
  - ./screenshots/quote-daily-480x800-portrait.png
  - ./screenshots/quote-index-7-1600x1200-landscape.png
  - ./screenshots/quote-index-7-1200x1600-portrait.png
  - ./screenshots/quote-index-7-800x480-landscape.png
  - ./screenshots/quote-index-7-480x800-portrait.png
---

# Quote

Offline-friendly OpenIntegration screen for a daily quote. It uses local data only, accepts an optional `index` query setting, and fits the quote text with `fitHyphenatedText(...)`.

## Common URLs

- `/quote/`
- `/quote/?index=7`
- `/quote/config.json`
- `/quote/api/data`

## Settings

- `index`: optional numeric quote index

## Language Support

This integration declares `language: ["en", "de", "fr", "es", "it"]` in `config.json` and loads localized fixed UI copy from `languages/<code>.json` using the host-selected `payload.meta.language`.

The language JSON files localize dashboard labels, empty states, update text, and error titles only. Integration settings such as `locale`, `language`, or external API language codes remain separate.
