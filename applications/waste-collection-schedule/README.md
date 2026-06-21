# Waste Collection Schedule

Shows upcoming waste collection dates on a paperlesspaper display.

The integration is inspired by `mampfes/hacs_waste_collection_schedule`: it can use a municipality or service-provider ICS/iCal calendar, or generate dates from manually configured static and recurring rules.

## Sources

- `ICS/iCal URL`: fetches and parses `VEVENT` entries from a calendar URL. `webcal:` URLs are converted to `https:`.
- `Manual dates`: one-off entries in the format `YYYY-MM-DD | Type | optional note`.
- `Recurring rules`: repeating entries in the format `Type | WEEKLY | interval | start YYYY-MM-DD | weekday`.

Example recurring rules:

```txt
Residual waste | WEEKLY | 2 | 2026-01-05 | MO
Paper | WEEKLY | 4 | 2026-01-12 | MO
Organic waste | WEEKLY | 1 | 2026-01-07 | WE
Recycling | WEEKLY | 2 | 2026-01-09 | FR
```

The API also understands simple ICS recurrence rules such as `FREQ`, `INTERVAL`, `COUNT`, `UNTIL`, `BYDAY`, `BYMONTHDAY`, `RDATE`, and `EXDATE`.

## Settings

- `sourceMode`: `manual`, `ics`, or `auto`. Auto uses the ICS URL when available and falls back to manual rules if the request fails.
- `includeTypes` / `excludeTypes`: optional comma-separated filters.
- `excludedDates`: remove dates with `YYYY-MM-DD` or `YYYY-MM-DD | Type`.
- `daysAhead`: how far into the future to search.
- `limit`: maximum grouped dates shown in the upcoming list.
- `locale` and `timeZone`: date formatting and "today" calculation.

Local manifest URL:

```txt
http://localhost:3000/waste-collection-schedule/config.json
```

Demo URL:

```txt
http://localhost:3000/waste-collection-schedule/run
```
