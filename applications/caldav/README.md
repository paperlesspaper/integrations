# CalDAV Calendar

Displays one calendar collection through read-only CalDAV requests. The adapter performs a
date-bounded `calendar-query` `REPORT`, extracts the returned iCalendar objects, expands bounded
recurrences, and hands canonical events to the shared paperlesspaper calendar layouts.

## Setup

The form is pre-filled with Digital Peak's public DPCalendar demo collection and its published
`demo` / `demo` account. This shared calendar is mutable, so its contents may change; use it only to
preview the integration, then replace all three connection fields with your own CalDAV details.

```text
Calendar URL: https://demo.digital-peak.com/dpc/components/com_dpcalendar/caldav.php/calendars/demo/dp-494/
Username:     demo
Password:     demo
```

1. Obtain the exact CalDAV collection URL for the calendar you want to display. It normally ends in
   the calendar's collection path and is not the provider's browser or account URL.
2. Replace the public demo username and password. Use a dedicated app password when the provider
   offers one.
3. Optionally set **Calendar label** for the display header.
4. Select the display timezone and preferred calendar view.

This initial generic adapter deliberately accepts an exact collection URL instead of performing
provider-specific account discovery. It supports HTTP Basic authentication and read-only event
queries. It does not support OAuth, Digest authentication, event writes, scheduling, or merging
multiple calendar collections. The dedicated Nextcloud integration remains the better choice when
Nextcloud principal and calendar-home discovery are wanted.

## Shared calendar settings

`view`, `locale`, `timeZone`, `dayRange`, `maxEvents`, `highlightToday`, `highlightScale`, and
`showLocation` are handled by `@paperlesspaper/openintegration`. Supported views are `agenda`,
`day`, `three-days`, `week`, and `year`.

The `calendar-query` is limited to the visible civil range. Each returned RFC 5545 object is parsed
for date-only and timed events, timezone definitions, recurrence rules and dates, exclusions,
moved occurrences, cancellations, and multi-day events. `maxEvents` remains a display limit; the
adapter independently returns up to 500 bounded occurrences.

## Network and credential safety

The collection URL, username, and password are sent to the same-origin adapter in a JSON `POST`,
keeping them out of query strings and routine URL access logs. This is not a secret vault: the
trusted renderer and server receive them, and browser inspection or explicit body logging can
expose them. Use a trusted HTTPS deployment, disable request-body logging, prefer a revocable app
password, and grant read-only access where the provider allows it.

The adapter resolves and pins the destination before connecting, rejects redirects while
credentials are present, and blocks private, loopback, link-local, and non-routable destinations by
default. A trusted self-hosted deployment may opt into private networks with:

```sh
PAPERLESSPAPER_ALLOW_PRIVATE_CALENDAR_NETWORKS=true
```

Plain HTTP additionally requires both **Allow insecure HTTP** and:

```sh
PAPERLESSPAPER_ALLOW_INSECURE_CALENDAR_HTTP=true
```

Do not enable either override on an unrestricted public integration host. Requests have DNS,
timeout, response-size, occurrence, and date-range limits.

## Local verification

```sh
node vendor/openintegration/dist/cli.js check applications/caldav/config.json
node vendor/openintegration/dist/cli.js render applications/caldav/config.json --viewport 800x480 --output /tmp/caldav-landscape.png
node vendor/openintegration/dist/cli.js render applications/caldav/config.json --viewport 480x800 --output /tmp/caldav-portrait.png
```

## Specifications

- [RFC 4791: Calendaring Extensions to WebDAV](https://www.rfc-editor.org/rfc/rfc4791)
- [RFC 5545: Internet Calendaring and Scheduling Core Object Specification](https://www.rfc-editor.org/rfc/rfc5545)
- [DPCalendar CalDAV demo documentation](https://joomla.digital-peak.com/documentation/dpcalendar/introduction/calendar-management)
