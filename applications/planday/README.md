# Planday Dienstplan

Verwendet denselben Kalender-Renderer wie Google Kalender, Outlook und Webcal. Standardmäßig zeigt die Kalenderwoche, wer von Montag bis Sonntag wann arbeitet. Die voreingestellte Zeitzone ist Europe/Berlin.

## Planday verbinden

1. Öffne dein Planday-Portal als Administrator und gehe zu **Einstellungen → Integrationen → API-Zugriff**.
2. Erstelle eine App mit den Leserechten `shift:read` und `employee:read` und autorisiere sie für dieses Portal.
3. Übernimm die **App-ID** und das **Refresh-Token** aus Planday in die Einstellungen der paperlesspaper-Integration. Lass **Beispieldaten anzeigen** für den Live-Betrieb ausgeschaltet.
4. Für den Dienstplan einer einzelnen Abteilung kannst du deren numerische **Abteilungs-ID** eintragen. Ein leeres Feld zeigt die zugeordneten Schichten aller zugänglichen Abteilungen.

Das Manifest liegt beim laufenden Integrationsserver unter `/planday/config.json`. Die Einrichtung des API-Zugangs beschreibt [Planday in der Autorisierungsanleitung](https://developer.planday.com/gettingstarted/authorization/).

## Anzeige

Unter **Kalenderansicht** stehen alle zehn gemeinsamen Layouts zur Wahl. Neben Kalenderwoche, Tag, drei Tagen und Jahr gibt es die klassische und moderne Agenda, „Heute und als Nächstes“, die nächsten sieben Tage als Liste oder Zeitraster sowie die Tageszeitleiste. Der Datenabruf richtet sich nach dem sichtbaren Zeitraum. In der Jahresansicht markieren die Kalendertage die Schichtbelegung.

Jede zugeordnete Schicht wird zum Kalendereintrag mit dem Namen der eingeteilten Person und den Zeiten aus Planday. Nachtschichten bleiben über Mitternacht zusammenhängend. Offene Schichten und Entwürfe entfallen. Fehlt der Name, erscheint die Planday-Mitarbeiter-ID. Für Schichten ohne hinterlegte Startzeit zeigt der Kalender „Zeit offen“ an.

Schriftgröße, Informationsdichte, Kopfzeile, Tageszusammenfassung und Hervorhebung des aktuellen Tages lassen sich wie bei den anderen Kalendern einstellen. **Beispieldaten anzeigen** lädt einen fiktiven Dienstplan zum Ausprobieren der Ansichten.

Die Zugangsdaten gelangen per JSON-POST zum Integrationsserver. Dieser tauscht das Refresh-Token gegen ein Zugriffstoken und führt [Schichten](https://developer.planday.com/api/schedule/) und [Mitarbeiternamen](https://developer.planday.com/api/hr/) zusammen.

## Lokal prüfen

```sh
npx paperless check applications/planday/config.json
node --test tests/planday.test.mjs
npx paperless dev applications/planday/config.json
```
