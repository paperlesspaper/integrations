# Webcal & iCalendar

Displays a read-only calendar subscription from a `webcal://` link or an HTTP(S) iCalendar feed.
The server adapter downloads RFC 5545 data, expands bounded recurrences, maps events into the
canonical calendar model, and uses the shared paperlesspaper calendar layouts.

## Setup

1. Copy the calendar's subscription or sharing URL from its provider.
2. Paste the `webcal://`, HTTPS, or direct `.ics` URL into **Webcal or iCalendar URL**.
3. When the feed uses HTTP Basic authentication, enter both the username and password. Leave both
   blank for public or capability-link feeds.
4. Select the display timezone and preferred calendar view.

`webcal://` links are upgraded to HTTPS before fetching. This integration reads a remote feed; it
does not upload local `.ics` files, edit events, or provide two-way synchronization.

## Shared calendar settings

`view`, `locale`, `timeZone`, `dayRange`, `maxEvents`, `highlightToday`, `highlightScale`, and
`showLocation` are handled by `@paperlesspaper/openintegration`. Supported views are `agenda`,
`day`, `three-days`, `week`, and `year`.

The shared iCalendar parser supports folded text, date-only and timed events, embedded timezone
definitions, recurrence rules and dates, exclusions, moved occurrences, cancellations, and
multi-day events. `maxEvents` is only the display limit; the adapter independently parses a bounded
set and returns up to 500 occurrences for the requested range.

## Network and privacy model

Feed URLs, usernames, and passwords are sent to the same-origin adapter as JSON `POST` data, so
they do not appear in query strings or routine URL access logs. The trusted renderer and server
still receive these values; use HTTPS and disable request-body logging. Treat a private sharing URL
like a password and revoke it at the calendar provider if exposed.

Remote hosts are resolved and pinned before connection. Public network destinations are allowed by
default; private, loopback, link-local, and non-routable destinations are blocked. A trusted
self-hosted deployment may opt in with:

```sh
PAPERLESSPAPER_ALLOW_PRIVATE_CALENDAR_NETWORKS=true
```

Plain HTTP additionally requires both **Allow insecure HTTP** and the server-side opt-in:

```sh
PAPERLESSPAPER_ALLOW_INSECURE_CALENDAR_HTTP=true
```

Do not enable either override on an unrestricted public integration host. Requests have redirect,
DNS, timeout, response-size, source-event, occurrence, and date-range limits. Authorization is
never forwarded across origins, and authenticated feeds refuse redirects.

## Local verification

```sh
node vendor/openintegration/dist/cli.js check applications/webcal/config.json
node vendor/openintegration/dist/cli.js render applications/webcal/config.json --viewport 800x480 --output /tmp/webcal-landscape.png
node vendor/openintegration/dist/cli.js render applications/webcal/config.json --viewport 480x800 --output /tmp/webcal-portrait.png
```

## Specification

- [RFC 5545: Internet Calendaring and Scheduling Core Object Specification](https://www.rfc-editor.org/rfc/rfc5545)
