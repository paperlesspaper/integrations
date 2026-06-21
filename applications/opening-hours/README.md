---
slug: opening-hours
name: Opening Hours
version: 0.1.0
description: Shows current opening status, today's hours, and the weekly schedule for a place.
renderPage: ./render.html
configUrl: /opening-hours/config.json
apiUrl: /opening-hours/api/data
---

# Opening Hours

OpenIntegration dashboard inspired by TRMNL's Opening hours plugin. It can read live hours from Google Places when `placeId` and `googleMapsApiKey` are configured, and it falls back to manual weekly hours when Google credentials are omitted.

## Links

- [Demo](https://integrations.paperlesspaper.de/opening-hours/run)
- [config.json](./config.json)

## Screenshots

| Landscape | Portrait |
| --- | --- |
| <img src="./screenshots/opening-hours-coffee-week-800x480-landscape.png" alt="Opening Hours landscape screenshot: Coffee Week" width="360"> | <img src="./screenshots/opening-hours-coffee-week-480x800-portrait.png" alt="Opening Hours portrait screenshot: Coffee Week" width="216"> |
| <img src="./screenshots/opening-hours-studio-open-now-800x480-landscape.png" alt="Opening Hours landscape screenshot: Studio Open Now" width="360"> | <img src="./screenshots/opening-hours-studio-open-now-480x800-portrait.png" alt="Opening Hours portrait screenshot: Studio Open Now" width="216"> |

## Common URLs

- `/opening-hours/`
- `/opening-hours/?businessName=Paperless%20Coffee`
- `/opening-hours/?placeId=ChIJ...&googleMapsApiKey=...`
- `/opening-hours/config.json`
- `/opening-hours/api/data`

## Settings

- `placeId`: optional Google Places place ID
- `googleMapsApiKey`: optional Google Maps API key, or use `GOOGLE_MAPS_API_KEY` on the server
- `timezone`: IANA timezone for manual schedules
- `monday` through `sunday`: `closed`, `24h`, or comma-separated ranges such as `09:00-13:00,14:00-18:00`
- `showWeeklyHours`: display the full week panel
- `showContact`: display address, phone, website, and Google Maps availability

## Language Support

This integration declares `language: ["en", "de", "fr", "es", "it"]` in `config.json` and loads localized fixed UI copy from `languages/<code>.json` using the host-selected `payload.meta.language`.

The language JSON files localize dashboard labels, empty states, update text, and error titles only. Integration settings such as `locale`, `language`, or external API language codes remain separate.
