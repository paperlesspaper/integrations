# Losung

Displays the daily Losung and Lehrtext from losungen.de, inspired by the MagicMirror module `Dobherrmann/MMM-Losung`.

The integration fetches the official daily HTML page server-side through `api/data.js`, extracts the two verse blocks, and renders them in a high-contrast layout for paperlesspaper displays.

## Links

- [Demo](https://integrations.paperlesspaper.de/losung/run)
- [config.json](./config.json)

## Screenshots

| Landscape | Portrait |
| --- | --- |
| <img src="./screenshots/losung-both-800x480-landscape.png" alt="Losung landscape screenshot: Both" width="360"> | <img src="./screenshots/losung-both-480x800-portrait.png" alt="Losung portrait screenshot: Both" width="216"> |
| <img src="./screenshots/losung-losung-only-800x480-landscape.png" alt="Losung landscape screenshot: Losung Only" width="360"> | <img src="./screenshots/losung-losung-only-480x800-portrait.png" alt="Losung portrait screenshot: Losung Only" width="216"> |

## Settings

- `showLosung`: show the Old Testament daily verse.
- `showLehrtext`: show the New Testament teaching text.
- `showDate`: show the date from losungen.de.
- `dateOffset`: offset from today in days, for example `-1` for yesterday or `1` for tomorrow.
