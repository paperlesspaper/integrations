# Memo Medication Times

Displays the next baked Memo medication intake times on a paperlesspaper display. When the current time is inside the configured intake window, the render page switches to a full-screen medication reminder.

Data is loaded through `api/data.js` so the Memo API key is used by the provider server. The render page calls the local integration API only.

The custom `settings.html` page can load organizations and patients from Memo through `api/options.js`. Leave the Memo API base URL and API key blank to use provider environment variables, or enter them as per-display overrides. Then load organizations, choose an organization, and choose the patient whose intake calendar should be displayed.

## Settings

| Setting | Purpose |
| --- | --- |
| `apiBaseUrl` | Memo API URL, with or without `/v1`. Leave blank to use `MEMO_API_BASE_URL`. |
| `apiKey` | Memo API key. Leave blank to use `MEMO_API_API_KEY`, `MEMO_API_KEY`, or `PAPERLESSPAPER_API_KEY`. |
| `patientId` | Memo patient ObjectId. This is the recommended source because calendar entries contain scheduled intake dates. |
| `organizationId` | Selected Memo organization used by the settings page to load patient choices. |
| `displayName` | Optional name shown in the date header. |
| `locale` | Locale for dates and times, for example `de-DE` or `en-US`. |
| `timezone` | IANA timezone for display formatting. |
| `lookaheadDays` | Number of days to show upcoming entries for. |
| `maxEntries` | Maximum rows shown in the schedule view. |
| `intakeWindowMinutes` | Minutes before or after a scheduled intake time that trigger the full-screen alert. |
| `fullscreenAlert` | Enables or disables the full-screen intake reminder. |
| `showLastUpdated` | Shows a small last-updated timestamp. |
| `showTakenEntries` | Includes entries marked as taken. |

## Memo API

The integration reads:

- `GET /v1/calendars?patient=<patientId>&limit=10000&sortBy=date:asc`, filtered to entries where `bake` is `true`
- `GET /v1/organizations` and `GET /v1/users?organization=<organizationId>` in the settings page

Requests send the API key using the `x-api-key` header.

Medication rows use `localMedicationData.meta.color` when available, falling back to other medication metadata color fields.

## Local Preview

```sh
npm start
```

Open:

```txt
http://localhost:3000/memo-medication-times/run
```

For a no-credential sample schedule:

```txt
http://localhost:3000/memo-medication-times/render.html?forceSample=true&sampleMode=schedule
```

For the full-screen reminder sample:

```txt
http://localhost:3000/memo-medication-times/render.html?forceSample=true&sampleMode=alert
```
