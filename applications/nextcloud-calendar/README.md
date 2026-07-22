# Nextcloud Calendar

Read-only calendar integration for a private Nextcloud account. The server adapter discovers the
authenticated CalDAV principal, calendar home, and VEVENT calendars, then requests only the date
range needed by the selected shared calendar view. The render page maps no provider UI itself; it
hands normalized events to the reusable `@paperlesspaper/openintegration` calendar layout.

## Setup

1. In Nextcloud, open **Personal settings → Security → Devices & sessions** and create a dedicated
   app password for this integration.
2. Enter the base URL of the Nextcloud instance, your login username, and the app password.
3. Optionally enter an exact calendar display name. Leave it blank to select the first personal
   VEVENT calendar discovered for the account.
4. Use **Calendar path** only when display-name selection is ambiguous. It accepts a calendar URI
   such as `personal`, a path below the discovered calendar home, or a same-origin DAV path.

Do not set both **Calendar name** and **Calendar path**. When every connection field is blank, the
integration renders deterministic fictional sample events. A partially filled connection reports a
setup error instead of silently falling back to samples.

## Einstellungen (Deutsch)

1. Unter **Persönliche Einstellungen → Sicherheit → Geräte & Sitzungen** ein eigenes App-Passwort
   für diese Integration anlegen.
2. Die Basis-URL der Nextcloud-Instanz, den Anmeldenamen und das App-Passwort eintragen.
3. Optional den exakten Anzeigenamen eines Kalenders angeben. Ohne Auswahl wird der erste
   persönliche Kalender mit VEVENT-Unterstützung verwendet.
4. **Kalenderpfad** nur verwenden, wenn die Auswahl über den Namen nicht eindeutig ist. Möglich sind
   beispielsweise `personal` oder ein DAV-Pfad derselben Nextcloud-Instanz.

**Kalendername** und **Kalenderpfad** dürfen nicht gleichzeitig gesetzt sein. Sind alle
Verbindungsfelder leer, werden ausschließlich fiktive, reproduzierbare Beispieldaten angezeigt.

## Settings

- `serverUrl`: Nextcloud base URL, including a subdirectory when applicable.
- `username`: Nextcloud login username.
- `appPassword`: dedicated Nextcloud app password; never use the main account password.
- `calendarName`: optional exact calendar display name or calendar URI.
- `calendarPath`: optional same-origin DAV path used instead of `calendarName`.
- `view`: `agenda`, `day`, `three-days`, `week`, or `year`.
- `locale`: BCP 47 locale used for visible dates and times.
- `timeZone`: IANA timezone used for date boundaries and floating iCalendar values.
- `dayRange`: number of days used by the agenda view.
- `maxEvents`: shared presentation limit. The adapter independently parses at most 200 occurrences
  for the requested range so later days are not starved by an early global display limit.
- `highlightToday`, `highlightScale`, `showLocation`: shared presentation settings.

The host-selected language comes from `payload.meta.language`; it is separate from the date-format
`locale` setting. English and German fixed UI copy are included.

## CalDAV behavior

The API performs these read-only operations:

1. `PROPFIND` for `DAV:current-user-principal`.
2. `PROPFIND` for `CALDAV:calendar-home-set`.
3. A depth-one `PROPFIND` that keeps calendar resources supporting `VEVENT`.
4. A date-bounded `calendar-query` `REPORT`. It asks Nextcloud to expand recurring events in the
   requested interval and retries without the expansion element when a server does not support it.
5. Each returned iCalendar object is parsed and recurrence-limited on the server, then mapped to the
   canonical shared event shape (`id`, `title`, `start`, `end`, and `location`).

The adapter follows at most three redirects and sends Basic credentials only to the configured
origin. Cross-origin discovery responses and redirects are rejected. Requests time out after 20
seconds; XML responses, DAV resources, discovered calendars, range length, and event occurrences
all have explicit caps.

Credentials are submitted to this integration's server-side adapter in a same-origin JSON `POST`,
so they are not placed in the URL or routine URL access logs. The password field is masking, not a
secret vault: the trusted render runtime still receives the app password, and request bodies can be
exposed by browser inspection or explicit body logging. Use only a trusted HTTPS deployment,
disable request-body logging for this endpoint, and restrict access to the integration host. The
adapter never returns the username or app password in its JSON response.

## Local validation

From the `paperlesspaper-openintegration` source repository, after the staged directory is installed
under `paperlesspaper-integrations/applications/nextcloud-calendar`:

```sh
node dist/cli.js check ../paperlesspaper-integrations/applications/nextcloud-calendar/config.json
node dist/cli.js render ../paperlesspaper-integrations/applications/nextcloud-calendar/config.json --viewport 800x480 --output /tmp/nextcloud-calendar-landscape.png
node dist/cli.js render ../paperlesspaper-integrations/applications/nextcloud-calendar/config.json --viewport 480x800 --output /tmp/nextcloud-calendar-portrait.png
```

## Official references

- [Nextcloud Calendar user manual](https://docs.nextcloud.com/server/latest/user_manual/en/groupware/calendar.html)
- [Nextcloud CalDAV address and app-password guidance](https://docs.nextcloud.com/server/latest/user_manual/en/groupware/sync_windows10.html)
- [Nextcloud calendar integration documentation](https://docs.nextcloud.com/server/latest/developer_manual/digging_deeper/groupware/calendar.html)
- [RFC 4791: Calendaring Extensions to WebDAV (CalDAV)](https://www.rfc-editor.org/rfc/rfc4791)
- [RFC 5545: Internet Calendaring and Scheduling Core Object Specification](https://www.rfc-editor.org/rfc/rfc5545)
