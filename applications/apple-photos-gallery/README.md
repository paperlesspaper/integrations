---
slug: apple-photos-gallery
name: Apple Photos Gallery
version: 0.1.0
description: Shows a random or numbered image from a public Apple Photos shared album.
renderPage: ./render.html
configUrl: /apple-photos-gallery/config.json
apiUrl: /apple-photos-gallery/api/data
offline: false
screenshots:
  - ./screenshots/apple-photos-gallery-first-cover-800x480-landscape.png
  - ./screenshots/apple-photos-gallery-first-cover-480x800-portrait.png
  - ./screenshots/apple-photos-gallery-first-metadata-800x480-landscape.png
  - ./screenshots/apple-photos-gallery-first-metadata-480x800-portrait.png
---

# Apple Photos Gallery

OpenIntegration screen for showing a photo from a public iCloud shared album. It can pick a random image or a fixed 1-based photo number, then render it as a full-screen cover or contained image.

## Common URLs

- `/apple-photos-gallery/`
- `/apple-photos-gallery/config.json`
- `/apple-photos-gallery/api/data`

## Settings

- `albumUrl`: public iCloud shared album URL, or the token from the share URL
- `selection`: `random` or `number`
- `photoNumber`: 1-based photo position when `selection` is `number`
- `fit`: `cover` or `contain`
- `showMetadata`: show album metadata
- `showCaptureDate`: show capture date when available

## Language Support

This integration declares `language: ["en", "de", "fr", "es", "it"]` in `config.json` and loads localized fixed UI copy from `languages/<code>.json` using the host-selected `payload.meta.language`.
