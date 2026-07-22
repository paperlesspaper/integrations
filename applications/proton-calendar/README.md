# Proton Calendar

Displays a Proton Calendar using its read-only **Share with anyone** link. The adapter downloads and expands iCalendar data on the server, maps it into the reusable calendar model, and shares all display views and settings with the other calendar integrations.

## Setup and supported access

1. In the Proton Calendar web app, open Settings → Calendars.
2. Under **Share with anyone**, create either a Limited view or Full view link.
3. Paste the link into `calendarUrl`.

Proton documents these links as its supported way to subscribe from third-party calendars. Proton does not provide CalDAV access, so this integration intentionally does not collect Proton credentials or use a private API. See [Proton's sharing guide](https://proton.me/support/share-calendar-via-link) and [Proton's external calendar/CalDAV statement](https://proton.me/support/subscribe-to-external-calendar).

**Share with anyone requires a paid Proton plan.** Proton currently allows up to five sharing links per calendar; Limited-view and Full-view links both count toward that limit.

Limited links expose only the busy information present in the feed. Full-view links include titles, descriptions, participants, and locations and contain the key required to decrypt the shared calendar. This integration displays only title, time, and optional location.

Proton notes that link updates can take up to eight hours and that a third-party subscription can occasionally stop refreshing; generating a new sharing link is their documented recovery step.

## Shared calendar settings

`view`, `locale`, `timeZone`, `dayRange`, `maxEvents`, `highlightToday`, `highlightScale`, and `showLocation` are handled by the common calendar toolkit. Supported views are `agenda`, `day`, `three-days`, `week`, and `year`.

The server adapter uses the shared iCalendar parser for folded text, date and timezone values, recurrence rules, exclusions, moved occurrences, and cancellations. `maxEvents` remains a presentation limit; the adapter independently keeps up to 500 normalized events so later days are not starved. Fetches have strict Proton host checks plus redirect, timeout, response-size, source-event, and occurrence limits.

## Privacy note

Treat the sharing URL like a password. The form masks it and sends it to the same-origin adapter in a JSON POST body, keeping it out of URL query strings and ordinary URL access logs. The trusted render runtime and adapter server still receive the link, so run the integration only over trusted HTTPS and do not log request bodies. Delete the link in Proton Calendar to revoke access.

## Local verification

```sh
node dist/cli.js check ../paperlesspaper-integrations/applications/proton-calendar/config.json
node dist/cli.js render ../paperlesspaper-integrations/applications/proton-calendar/config.json --viewport 800x480 --output /tmp/proton-calendar-landscape.png
node dist/cli.js render ../paperlesspaper-integrations/applications/proton-calendar/config.json --viewport 480x800 --output /tmp/proton-calendar-portrait.png
```
