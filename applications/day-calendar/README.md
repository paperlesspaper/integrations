---
slug: day-calendar
name: Day Calendar
version: 0.1.0
description: Shows the current day, optional time, quotes, and daily facts.
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

Plain OpenIntegration version of the upstream `paperlesspaper-apps/src/components/DayCalendar` component, extended with offline daily fact modes.

It keeps the same base settings (`color`, `kind`, `showTime`, `language`), the same date/time formatting behavior, and the same quote/fact arrays. Additional fact modes are selected by local day-of-year or deterministic date calculations.

## Common URLs

- `/day-calendar/`
- `/day-calendar/?color=light&kind=demotivational&language=de&showTime=true`
- `/day-calendar/?color=red-light&kind=funny&language=en-US`
- `/day-calendar/?kind=day-progress`
- `/day-calendar/?kind=holiday-observance&holidayRegion=DE-BE`
- `/day-calendar/?kind=season-daylight&latitude=52.52&longitude=13.405`
- `/day-calendar/?kind=word-phrase&language=de`
- `/day-calendar/?kind=curiosity&language=en-US`
- `/day-calendar/config.json`
- `/day-calendar/api/data`

## Settings

- `color`: `dark`, `light`, `red-dark`, or `red-light`
- `kind`: `primary`, `demotivational`, `funny`, `day-progress`, `holiday-observance`, `season-daylight`, `word-phrase`, or `curiosity`
- `showTime`: optional boolean
- `language`: `en-US` or `de`
- `holidayRegion`: public-holiday region for `holiday-observance`; defaults to `DE-BE`
- `latitude`: latitude for `season-daylight`; defaults to Berlin
- `longitude`: longitude for `season-daylight`; defaults to Berlin

## Language Support

This integration declares `language: ["en", "de", "fr", "es", "it"]` in `config.json` and loads localized fixed UI copy from `languages/<code>.json` using the host-selected `payload.meta.language`.

The language JSON files localize dashboard labels, empty states, update text, and error titles only. Integration settings such as `locale`, `language`, or external API language codes remain separate.
