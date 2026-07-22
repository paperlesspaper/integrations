# Outlook Calendar

Displays a Microsoft 365 user's Outlook calendar with the shared paperlesspaper calendar layouts.
The integration uses the Microsoft Graph `calendarView` endpoint, so recurring events are returned
as individual occurrences and exceptions before they are mapped to the common calendar event model.

## Microsoft 365 setup

This integration currently uses the OAuth 2.0 **client credentials** flow. It is intended for a
Microsoft 365 work or school organization and does not support personal Outlook.com, Hotmail, or
Live.com calendars.

1. Register an application in Microsoft Entra ID.
2. Add the Microsoft Graph **application** permission `Calendars.ReadBasic.All`. Use
   `Calendars.Read` only if you deliberately extend the adapter to read event bodies or other data.
3. An administrator must grant tenant-wide admin consent for that application permission.
4. Create a client secret and copy its **value** immediately.
5. Configure the integration with the directory tenant ID, application client ID, client secret,
   and the user principal name or Graph user ID of the mailbox.
6. Optionally enter a Microsoft Graph calendar ID. With no calendar ID, the user's default calendar
   is used.

Microsoft's documentation:

- [Client credentials flow](https://learn.microsoft.com/en-us/graph/auth-v2-service)
- [Microsoft Graph calendarView](https://learn.microsoft.com/en-us/graph/api/calendar-list-calendarview?view=graph-rest-1.0)
- [Calendar permission definitions](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Microsoft Graph event schema](https://learn.microsoft.com/en-us/graph/api/resources/event?view=graph-rest-1.0)
- [Supported authentication scenarios](https://learn.microsoft.com/en-us/entra/identity-platform/authentication-flows-app-scenarios)

## Settings

The shared calendar settings are:

- `color`: paperlesspaper color theme.
- `view`: `agenda`, `day`, `three-days`, `week`, or `year`.
- `locale`: BCP 47 locale used to format dates and times.
- `timeZone`: IANA timezone used for the civil query range and display, such as `Europe/Berlin`.
- `dayRange`: number of days in the agenda view.
- `maxEvents`: maximum number of visible events.
- `highlightToday` and `highlightScale`: today emphasis.
- `showLocation`: whether event locations are displayed.

The Outlook data-source settings are:

- `tenantId`, `clientId`, `clientSecret`, and `userId`: required connection credentials.
- `calendarId`: optional non-default calendar.
- `hidePrivate`: replaces private/confidential titles with “Private event” and removes their location.

Leave every connection field empty to use deterministic fictional sample events. A partially filled
connection is treated as a configuration error rather than silently falling back to sample data.

## Data and timezone behavior

`api/data.js` converts the shared renderer's civil `rangeStart` and exclusive `rangeEndExclusive`
dates to the correct UTC instants in the configured timezone. This keeps the Microsoft Graph query
correct across daylight-saving changes. Timed Graph values are normalized to ISO UTC instants and
retain the configured display timezone in the common event model. All-day events remain date-only,
with an exclusive end date, so they cannot shift into a neighboring day.

The adapter follows Microsoft Graph pagination links only on `https://graph.microsoft.com`, limits
pages and total events, rejects redirects, applies request timeouts, and skips cancelled events.

## Credential caveat

The renderer invokes `api/data.js` through a same-origin JSON `POST`, so the client secret is not
placed in the URL or routine URL access logs. Marking `clientSecret` as `format: "password"` masks
the form field, but it is **not a secret vault**: the trusted render runtime still receives the
secret, and request bodies can be exposed by browser inspection or explicit body logging. Use
HTTPS, disable request-body logging for this endpoint, restrict access to the integration host,
rotate the client secret regularly, and grant only the read-only permission needed here. Do not
put real credentials in `configVariants` or screenshots.

## Files

- `render.html`: shared calendar bootstrap plus Outlook-specific request and header mapping.
- `api/data.js`: Microsoft token exchange, Graph calendar query, pagination, privacy handling, and
  deterministic sample data.
- `languages/en.json` and `languages/de.json`: renderer copy.
- `assets/icon.svg`: source icon; a PNG catalog asset can be generated when the integration is
  promoted from staging.
