# Countdown Card

A mostly static countdown card for paperlesspaper displays. It shows days, and optionally hours and minutes, until or since a configurable target date. When a start date is provided, it can also show progress toward the target.

## Links

- [Demo](https://integrations.paperlesspaper.de/countdown-card/run)
- [config.json](./config.json)

## Screenshots

Screenshot paths are declared in `config.json` for landscape and portrait variants, but screenshot images are not checked in yet.

## Settings

- `title`: heading shown above the countdown.
- `targetDate`: date or date-time used as the countdown target.
- `mode`: choose `auto`, `until`, or `since`.
- `showTime`: toggles the hours and minutes columns.
- `showProgress`: shows progress when `startDate` is set.
- `startDate`: optional date or date-time used only for progress.
- `dateLabel`: short label displayed next to the formatted target date.

The renderer is browser-only and does not call external services.

## Local URLs

```txt
http://localhost:3000/countdown-card/
http://localhost:3000/countdown-card/config.json
```
