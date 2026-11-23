# Verkehrsschild des Tages

<img src="./assets/icon.png" alt="Integrations-Icon: Vorfahrt-gewähren-Schild mit kurzem Pfosten" width="160" height="160">

Eine tägliche Lernkarte mit einem deutschen Verkehrszeichen, seiner Bedeutung,
dem richtigen Verhalten und einem wichtigen Hinweis. Der Katalog enthält
150 Schilder. Sprache und Rechtsraum sind Deutsch und Deutschland.

## Schilderkatalog

| Gruppe | Anzahl | Beispiele |
| --- | --- | --- |
| Gefahrzeichen | 36 | Kurven, Gefälle, Steigung, Seitenwind, Engstellen, Gegenverkehr, Ampel, Kinder, Wildwechsel, Bahnübergänge, Baken, Steinschlag, Glätte und Amphibienwanderung |
| Vorschriftzeichen | 75 | Vorfahrt, Fahrtrichtungen, Sonderwege, Fußgängerzone, Busfahrstreifen, Verkehrsverbote, Gewichts- und Maßgrenzen, Schneeketten, Tempo, Haltverbots-Pfeile, Umweltzonen und Seitenstreifenfreigabe |
| Richtzeichen | 34 | Vorfahrtstraße, Ortstafeln, Parkzonen, Gehwegparken, Nothaltebucht, Autobahn, Kraftfahrstraße, Zebrastreifen, Sackgasse, Radschnellweg, P+R, Ladestation und Erste Hilfe |
| Zusatzzeichen | 5 | Anlieger frei, Radverkehr frei, Entfernung, Streckenlänge und zeitliche Beschränkung |

Alle 150 Schilder nehmen am täglichen Wechsel teil und können in den Einstellungen
auch einzeln ausgewählt werden. Ein Durchlauf dauert 150 Tage. Jede Karte enthält
drei vollständige Erklärungen. Auch Endzeichen sind enthalten, damit Beginn und
Ende einer Regelung gemeinsam gelernt werden können. Zusatzzeichen werden einzeln
gezeigt; ihre Texte erläutern ausdrücklich die Verbindung zum jeweiligen Hauptschild.
Bei Gefahrzeichen nennen die Texte die Gefahr und das passende Verhalten; feste
Tempolimits werden nur genannt, wenn das jeweilige Zeichen sie tatsächlich vorgibt.

## Gemeinsame Struktur

Wie **Tree of the Day** und **Train of the Day** verwendet die Integration
`renderOfTheDayLayout()`, `waitForOfTheDayImage()` und `fitOfTheDayLayout()` aus
`@paperlesspaper/openintegration`. Layout, Typografie, Bildfläche, Faktenkapazität,
Orientierungswechsel und Themes kommen vollständig aus dem gemeinsamen Renderer.
Die einzige lokale CSS-Regel gibt dem Schild innerhalb seiner Bildfläche einen
mit der Displaygröße skalierenden Innenabstand von 24 Referenzpixeln. Die übrige
Anordnung bleibt vollständig beim gemeinsamen Renderer; es gibt keine zweite Runtime-Kopie.

- `config.json`: Manifest, Einstellungen und Vorschauvarianten.
- `render.html`: INIT-Lebenszyklus, Sprache, Theme und gemeinsamer Renderer.
- `data/signs.json`: Schilder, Erklärungen und genaue Quellenverweise.
- `data/selection.js`: Tagesauswahl nach Kalenderdatum in `Europe/Berlin`.
- `languages/de.json`: deutsche Oberflächentexte.
- `assets/`: lokale SVG-Verkehrszeichen, PNG-Icon und Bildquellen.
- `screenshots/`: EPD-Vorschauen in beiden Orientierungen und zwei Größen.

Die Auswahl durchläuft den Katalog ohne Wiederholung bis zum nächsten Zyklus.
Mehrere Abrufe am selben deutschen Kalendertag zeigen dasselbe Schild. Der Host
muss die Integration täglich aktualisieren. Es sind keine API-Schlüssel und keine
externen Netzwerkanfragen beim Rendern erforderlich.

## Einstellungen

| Einstellung | Bedeutung |
| --- | --- |
| `signId` | Leer: Tagesrotation. Zeichennummer: fest ausgewähltes Schild. |
| `textSize` | `small`, `middle` oder `big`, wie bei den anderen Tageskarten. |
| `showHeader` | Titel, Datum und Quellenangabe anzeigen. |
| `showMeaning` | Bedeutung anzeigen. |
| `showBehavior` | Verhaltensregel anzeigen. |
| `showDetail` | Wichtigen Hinweis anzeigen. |
| `showFactCount` | Bei Platzmangel die Anzahl sichtbarer Erklärungen anzeigen. |
| `showRotationCount` | Kataloggröße in der Kopf-/Quellenstruktur anzeigen. |
| `color` | Globales Theme, standardmäßig `blue-light`. |

Der gemeinsame Renderer priorisiert Bedeutung, Verhalten und dann den Hinweis.
Bei großen Schriften oder kleinen Displays kann er vollständige Erklärungsblöcke
ausblenden; er schneidet keine Sätze ab. Alle Erklärungen abgeschaltet ergibt keine
Fakten. Zusätzlich abgeschaltete Kopfzeile ergibt die reine Schildansicht.
Die Schildgrafiken behalten ihre eigenen Farben auf weißer Bildfläche, auch bei
dunklen Themes. Gelb wird bei der Vorfahrtstraße als originale Signalfarbe erhalten.

## Inhalt und Quellen

Abgleich der kurzen, selbst formulierten Lerntexte mit der online veröffentlichten
StVO: **22. September 2026**. Die Karten erläutern die wichtigsten Regeln des
einzelnen Schilds; Zusatzzeichen und die konkrete Verkehrssituation können weitere
Vorgaben enthalten. Die Zusammenfassungen sind keine amtlichen Prüfungsfragen und
keine vollständige Wiedergabe der StVO.

- [StVO Anlage 1: Gefahrzeichen](https://www.gesetze-im-internet.de/stvo_2013/anlage_1.html)
- [StVO Anlage 2: Vorschriftzeichen](https://www.gesetze-im-internet.de/stvo_2013/anlage_2.html)
- [StVO Anlage 3: Richtzeichen](https://www.gesetze-im-internet.de/stvo_2013/anlage_3.html)
- [Amtlicher Verkehrszeichenkatalog: Nummern, Varianten und Zusatzzeichen](https://www.verwaltungsvorschriften-im-internet.de/BMVBW-S32-0001-KF10-BS-A008.htm)
- [§ 39 StVO: Verkehrszeichen und Zusatzzeichen](https://www.gesetze-im-internet.de/stvo_2013/__39.html)
- Ergänzende Paragraphen sind je Schild unter `references` dokumentiert; die
  relativen Pfade beziehen sich auf `https://www.gesetze-im-internet.de/stvo_2013/`.
  Weitere amtliche Erläuterungen sind als vollständige URLs hinterlegt.
  Zusatzzeichen verwenden `category: "additional"`, `annex: null` und eine passende
  `sourceLabel`, damit auf der Karte keine unzutreffende Anlage erscheint.

Die SVGs stammen aus Wikimedia Commons und sind dort überwiegend als gemeinfreie
amtliche Werke nach § 5 Abs. 1 UrhG gekennzeichnet. Die dreistreifige Bake
(157-10) ist unter CC0 1.0 als gemeinfrei freigegeben. Originaltitel, Quelldateiseite und
Download-URL stehen in [assets/sources.json](assets/sources.json). Die Geometrie der SVGs ist unverändert. Rot, Blau, Gelb und Grün sind auf die nativen
Spectra-6-Farben abgebildet, damit insbesondere dunkles Verkehrszeichenblau bei
der EPD-Quantisierung nicht zu Schwarz wird. Die Änderungen stehen pro Datei
in den Bildquellen. Die orangefarbenen Gefahrgutflächen bei Zeichen 261 und 269
bleiben orange; für diese beiden Karten wird `errorDiffusion` verwendet, um Orange
auf dem Display aus Rot und Gelb anzunähern.
Die Jahreszahl im ursprünglichen Dateinamen bezeichnet die Grafikfassung; die
Bedeutungen wurden separat anhand der oben genannten StVO geprüft.

Das Integrations-Icon in `assets/icon.png` wurde mit dem integrierten **Image Gen**
generiert: ein einzelnes Vorfahrt-gewähren-Schild mit kurzem silbernem Pfosten,
ohne Buch oder Schrift, auf transparentem Hintergrund. Die quadratische PNG-Datei
ist unverändert aus Image Gen übernommen und wird im Manifest sowie in der
Repository-Übersicht verwendet. Es handelt sich um eine dekorative Illustration;
die SVG-Verkehrszeichen der Lernkarten haben eigene Quellen.
Der [finale Image-Gen-Prompt](../../docs/integration-icon-prompts.md#traffic-sign-of-the-day)
ist zentral dokumentiert.

Neue Schilder benötigen eine passende Grafik, Quellenabgleich, kurze vollständige
Erklärungen, einen Eintrag in der `signId`-Auswahl und die Layoutprüfung. Bei
inhaltlichen Änderungen den Quellenstand aktualisieren.

## Lokal prüfen

```sh
node node_modules/@paperlesspaper/openintegration/dist/cli.js check applications/traffic-sign-of-the-day/config.json
node --test tests/traffic-sign-of-the-day.test.mjs
node node_modules/@paperlesspaper/openintegration/dist/cli.js dev applications/traffic-sign-of-the-day/config.json
```

Mit dem Repository-Server: `/traffic-sign-of-the-day/run`, Manifest:
`/traffic-sign-of-the-day/config.json`.
