---
slug: day-calendar
name: Day Calendar
version: 0.1.0
description: Shows the current day, optional time, and the upstream paperlesspaper demotivational quote or funny fact of the day.
renderPage: ./render.html
configUrl: /day-calendar/config.json
apiUrl: /day-calendar/api/data
offline: true
screenshots:
  - ./screenshots/day-calendar-primary-dark-800x480-landscape.png
  - ./screenshots/day-calendar-primary-dark-480x800-portrait.png
  - ./screenshots/day-calendar-demotivational-de-800x480-landscape.png
  - ./screenshots/day-calendar-demotivational-de-480x800-portrait.png
  - ./screenshots/day-calendar-funny-red-800x480-landscape.png
  - ./screenshots/day-calendar-funny-red-480x800-portrait.png
---

# Day Calendar

Plain OpenIntegration version of the upstream `paperlesspaper-apps/src/components/DayCalendar` component.

It keeps the same settings (`color`, `kind`, `showTime`, `language`), the same date/time formatting behavior, and the same quote/fact arrays. The daily text is selected by local day-of-year modulo the matching upstream array length.

## Common URLs

- `/day-calendar/`
- `/day-calendar/?color=light&kind=demotivational&language=de&showTime=true`
- `/day-calendar/?color=red-light&kind=funny&language=en-US`
- `/day-calendar/config.json`
- `/day-calendar/api/data`

## Settings

- `color`: `dark`, `light`, `red-dark`, or `red-light`
- `kind`: `primary`, `demotivational`, or `funny`
- `showTime`: optional boolean
- `language`: `en-US` or `de`

## Language Support

This integration declares `language: ["en", "de", "fr", "es", "it"]` in `config.json` and loads localized fixed UI copy from `languages/<code>.json` using the host-selected `payload.meta.language`.

The language JSON files localize dashboard labels, empty states, update text, and error titles only. Integration settings such as `locale`, `language`, or external API language codes remain separate.
