# Eventkalender mit Google Kalender – Designstudie

Stand: 27. September 2026. Drei eigenständige HTML/CSS-Entwürfe mit fiktiven
Veranstaltungen und selbst gestalteten SVG-Bildern. Keine Live-Daten, keine
Änderung an den verfügbaren Integrationsoptionen. Der angezeigte Ticketlink ist
ein Beispiel, kein Buchungsangebot.

Die automatische Bildsuche ist inzwischen in der Google-Kalender-Integration
implementiert: Beschreibung, öffentliche Bildanhänge und Vorschaumetadaten
verlinkter Webseiten. Siehe [Bildquellen](../../applications/google-calendar/README.md#icons-and-images).
Die drei hier gezeigten Veranstaltungsdesigns und die zusätzlichen Ticket-/Preisfelder
bleiben eigenständige Entwürfe.

## Entwürfe ansehen

Vom Repository aus `python3 -m http.server 3378 --bind 127.0.0.1` starten und
`http://127.0.0.1:3378/docs/event-calendar-concepts/index.html` öffnen.

- **Eventmagazin:** ein Aufmacher plus weitere Termine mit kleinen Bildern.
- **Programmliste:** Datum, Thumbnail, Titel, Ort und Uhrzeit in festen Zeilen.
- **Veranstaltungsplakat:** ein hervorgehobener Termin, darunter zwei Folgetermine.

Die Galerie bietet 800 × 480 und 1600 × 1200 sowie die gedrehten Formate,
`blue-light` und `dark`, jeweils roh oder als Spectra-6-Palettensimulation.
Die aktuellen Bilder sind in [`../screenshots/calendars/concepts/`](../screenshots/calendars/README.md) versioniert. Die ursprüngliche Renderhilfe schreibt temporäre Dateien nach `output/playwright/event-calendar/`. Die Galerie verwendet die versionierten Bilder.
Reproduktion mit installiertem Playwright-CLI-Skill:

```sh
~/.codex/skills/playwright/scripts/playwright_cli.sh --session event-design open about:blank
node scripts/render-event-calendar-concepts.mjs
```

Das Skript prüft die Beispielansichten auf Überläufe, Bildladefehler und
JavaScript-Fehler. Es erzeugt 24 Browserbilder und 24 mit `epdoptimize`,
`errorDiffusion` und der nativen Spectra-6-Palette verarbeitete Bilder.
Dies ist eine Prüfung des Entwurfs mit festen Beispieldaten, keine vollständige
Validierung eines neuen Produktionsrenderers. Die Darstellungen mit Fotos und
die Wirkung auf physischer Hardware müssen zusätzlich geprüft werden.

## Empfohlener Pflegeweg

Ein eigener Google-Kalender „Veranstaltungen“ enthält nur veröffentlichungsfähige
Termine. Titel, Start/Ende und Ort werden dort normal gepflegt. Eine dauerhaft
erreichbare Bildadresse kommt in die Beschreibung. In der Integration wird
`showEventImages` aktiviert. Die Beschreibung muss vom Host mitgeliefert werden;
der Adapter meldet sich nicht selbst bei Google an.

Beispiel für eine Beschreibung (Adressen sind Platzhalter):

```text
Das Westend Quartett spielt unter freiem Himmel.
https://kultur.example.org/bilder/jazz-im-hof.jpg

Kategorie: Konzert
Tickets: https://kultur.example.org/jazz
Einlass: 18:30
Preis: ab 18 €
```

**Heute schon vorhanden:** Der [Google-Adapter](../../applications/google-calendar/render.html)
übernimmt Titel, Zeit, Ort, Farbe und ein Bild aus der Beschreibung. Er sucht
zuerst in HTML-Bildern, dann in Bildlinks, dann nach direkten Bildadressen im
Text. Text- und Linkadressen müssen eine unterstützte Bildendung haben. Bilder
sind standardmäßig deaktiviert. Abgesagte Termine werden aktuell ausgefiltert.

**Vorgeschlagene Ergänzung:** Kurzbeschreibung und die benannten Felder aus der
Vorlage auslesen; die Vorlage ist heute noch kein implementiertes Datenformat.
Ein optionales Bild-/Ticketformular in paperlesspaper wäre bequemer als eine
Textkonvention. Es könnte Metadaten anhand von Kalender-ID und Termin-ID
speichern. Bei Serienterminen braucht es eine Regel für Serie und Einzeltermin.

## Was Google liefert und was ergänzt werden muss

Die dokumentierte Event-Ressource enthält Beschreibung, Zeit, Ort, Anhänge und
Zusatzdaten, aber kein allgemeines `coverImage` für Veranstaltungen.
Ein Kalender-Anhang bietet unter anderem Dateilink, MIME-Typ und Datei-ID;
`iconLink` ist das Dateisymbol, nicht das Veranstaltungsfoto.
Quelle: [Google Calendar Events](https://developers.google.com/workspace/calendar/api/v3/reference/events).

Für eine API-gestützte Pflege können eigene Werte wie `ppImageUrl`,
`ppTicketUrl`, `ppCategory` und `ppImageFit` in `extendedProperties` stehen.
Diese sind versteckte Schlüssel/Wert-Daten; dafür wäre ein eigenes Formular
oder ein Importprozess nötig. `private` und `shared` unterscheiden sich in der
Weitergabe zwischen Terminkopien. Quelle:
[Google Extended Properties](https://developers.google.com/workspace/calendar/api/guides/extended-properties).

Drive-Bilder sind eine zweite Ausbaustufe: Datei mit passender Berechtigung
auflösen, Bild serverseitig abrufen und eine kontrollierte Renderadresse
bereitstellen. Drive-Vorschaulinks laufen nach einigen Stunden ab und benötigen
bei nicht öffentlichen Dateien authentifizierte Abrufe. Sie sollten nicht als
dauerhafter Bildlink gespeichert werden. Quelle:
[Google Drive Files](https://developers.google.com/workspace/drive/api/reference/rest/v3/files).

## Umsetzungslücken und sinnvolle Reihenfolge

1. **Gemeinsames Event-Modell erweitern.** Kurztext, Kategorie, Ticketadresse,
   Preistext, Einlass und Bildmodus optional ergänzen. Bestehende Kalender ohne
   diese Felder bleiben verwendbar. Den Host-Datenvertrag für Beschreibung,
   Zusatzdaten und gegebenenfalls Anhänge überprüfen.
2. **Programmliste und Magazin als Optionen ergänzen.** Zeitraum, maximale
   Eventzahl und Bildanzeige einstellbar machen. Den nächsten laufenden oder
   bevorstehenden Termin als Aufmacher wählen, optional gezielt hervorheben.
   Bei Überlauf ganze Termine ausblenden und die verbleibende Zahl anzeigen.
3. **Bilder verlässlich laden.** Timeout und Ersatzmotiv, Größenbegrenzung,
   Cache und Aktualisierung vorsehen. Beim Abruf externer URLs serverseitig
   Weiterleitungen und Ziele prüfen. Keine Google-Zugangstokens im Renderer.
4. **Foto oder Plakat unterscheiden.** Fotos können einen gewählten Ausschnitt
   füllen (`cover`); textreiche Plakate sollten vollständig sichtbar bleiben
   (`contain`). Titel, Zeit und Ort immer separat als lesbaren Text anzeigen.
   Kleine Schrift im Plakat taugt nicht als alleinige Informationsquelle.
5. **Veranstaltungsdetails ergänzen.** Ticket-QR nur bei vorhandenem Link,
   sonst weglassen. Kategorie mit Text und Farbe kennzeichnen. Preis und
   Ausverkauft-Status explizit pflegen; sie lassen sich nicht zuverlässig aus
   gewöhnlichen Google-Terminen ableiten.
6. **Terminregeln überprüfen.** Laufende und mehrtägige Events, Zeitzonen,
   Serientermine und Ausnahmen, entfernte/abgesagte Events sowie ein sichtbarer
   Aktualisierungsstand. Absagen optional als Hinweis zeigen, statt sie wie
   heute immer auszublenden.

Für eine erste veröffentlichbare Version würde ich mit **Programmliste +
Eventmagazin, Bildlink in der Beschreibung und gutem Ersatzmotiv** beginnen.
Drive-Anhänge und ein komfortables Metadatenformular können darauf aufbauen.
