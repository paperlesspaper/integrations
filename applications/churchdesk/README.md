# Churchdesk

Displays services and rota assignments from a public ChurchDesk rota. ChurchDesk fetching and field mapping stay in this integration; the calendar views, date grouping, fitting, and responsive presentation are provided by the shared `@paperlesspaper/openintegration` calendar toolkit also used by Google Calendar.

The default points to the public rota for **Pfarrei St. Matthias Schöneberg**:

- [ChurchDesk rota](https://app.churchdesk.com/rota/a8e746dc-c9b1-4e8f-8937-6768dc896afb)
- [config.json](./config.json)

## Data source

`api/data.js` extracts the rota UUID and calls the JSON endpoint used by ChurchDesk's public rota page:

```text
https://api2.churchdesk.com/shifts/rotas/public/<rota-id>
```

Only display data is returned: event times, titles, locations, assignment roles, and assignee display names. User IDs, email fields, and profile images are discarded. This is a public page endpoint, not a documented versioned ChurchDesk API, so the provider adapter may need adjustment if ChurchDesk changes it.

Checked-in screenshots use deterministic fictional sample data (`Beispielpfarrei St. Marien`) and never expose real assignee names. The internal `sampleData` and `now` values are present only in preview variants.

## Settings

Common calendar settings:

- `view`: `agenda`, `day`, `three-days`, or `week`. The public endpoint is limited to a 31-day request window, so the year view is intentionally omitted.
- `locale` and `timeZone`: date formatting and IANA timezone.
- `dayRange`: agenda range from 1 through 31 days.
- `maxEvents`: presentation limit used by the shared renderer. The adapter keeps up to 200
  matching provider events so later day and week columns are not truncated by an earlier busy day.
- `highlightToday` and `highlightScale`: optional current-day banner.
- `showLocation`: show event locations.

ChurchDesk adapter settings:

- `title`: display heading.
- `rotaUrl`: public ChurchDesk rota URL or UUID.
- `roleFilter`: optional comma-separated role filter.
- `showOrganization`: show the organization name.
- `showAssignments`: map roles and assigned people into shared event details.

For compatibility, `daysAhead` remains accepted as an API alias for `dayRange`. Private ChurchDesk calendars and authenticated organization APIs are not supported.

## Local verification

```sh
node dist/cli.js check ../paperlesspaper-integrations/applications/churchdesk/config.json
node dist/cli.js render ../paperlesspaper-integrations/applications/churchdesk/config.json --viewport 800x480 --output /tmp/churchdesk-landscape.png
node dist/cli.js render ../paperlesspaper-integrations/applications/churchdesk/config.json --viewport 480x800 --output /tmp/churchdesk-portrait.png
```
