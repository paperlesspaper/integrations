# Train of the Day

Shows a deterministic daily train on a paperlesspaper display. The rotation focuses on European trains and includes a 30-train historic rail set. It shows the leading vehicle as CAD-like generated artwork, with a small clipped hint of the next car at the right edge for longer trains.

## Links

- [Demo](https://integrations.paperlesspaper.de/train-of-the-day/run)
- [config.json](./config.json)

## Artwork

The train images were generated from Wikipedia-style reference photos with this framing:

- exact orthographic side view
- white studio background
- simplified rendered CAD look
- first vehicle fully visible and centered
- only a narrow part of the next car visible at the right edge

The application icon is stored at [assets/icon.png](./assets/icon.png).

### Icon Prompt

Use this prompt for icon variants. Replace `YOUR USECASE` with a concise description such as `show a daily European train with facts`:

```txt
A high-resolution 2D digital icon for an integration for the paperlesspaper eInk display that can YOUR USECASE, featuring an old short locomotive in exact orthographic side view. Use a compact vintage steam tank locomotive that is fully visible from rear buffer to front buffer, with no cropped parts.

The icon has smooth, beveled edges and appears realistic but minimalistic, with slightly 3D CAD-like shading and highlights to give it depth. The image is viewed from the side, not from the top. The background is fully transparent, with no shadows, smoke, rails, or surrounding elements, suitable for use as an icon or in UI design.
```

### Image Prompt

Use this prompt for additional trains. Replace `NAME OF THE TRAIN` and the reference details:

```txt
Erstelle ein gerendertes CAD-ähnliches Bild des ersten Wagens / führenden Triebkopfs der Lokomotive NAME OF THE TRAIN in exakter orthografischer Seitenansicht, ohne Perspektive. Der erste Wagen oder die erste Lokomotive steht klar im Mittelpunkt und ist vollständig sichtbar; rechts ist nur ein sehr kleiner angeschnittener Teil des nächsten Wagens zu sehen, der aus dem Bild herausläuft. Weißer Hintergrund, Studio-Licht, hoher Kontrast, klare Kanten und saubere technische Flächen.

Nutze ein öffentliches Referenzbild von Wikipedia als visuelle Vorlage: NAME OF THE TRAIN mit den charakteristischen Farben, der typischen Frontform, Fensteranordnung, Türen, Dachausrüstung und Lackierung. Das Bild soll keine lesbaren Logos oder Textbeschriftungen enthalten.

Die Lok oder der führende Wagen soll etwas vereinfacht wirken, wie eine gerenderte CAD-Zeichnung: reduzierte, aber erkennbare Details; präzise Formen; sichtbare Räder, Achsen, Drehgestelle, Fenster, Türen, Lüftungsgitter, Puffer, Kupplungen, Pantografen und charakteristische Elemente. Saubere Lackierung, dezente Materialreflexionen, feiner Schatten unter dem Fahrzeug.

Komposition: exakte Seitenansicht, horizontal von links nach rechts, erster Wagen oder erste Lokomotive zentriert und dominant, vollständig sichtbar. Der nächste Wagen darf nur als schmaler Anschnitt am rechten Bildrand erscheinen, ungefähr 8 bis 15 Prozent sichtbar, und läuft aus dem Bild heraus. Keine perspektivische Verzerrung, keine Umgebung, keine Personen, keine starken Gebrauchsspuren, keine überladenen Details, kein Wasserzeichen, keine Textlabels.
```

## Settings

- `region`: use European trains only, worldwide historic entries, or all curated trains.
- `traction`: show any train, high-speed trains, or locomotives.
- `trainId`: pin a train by slug. The catalog contains 66 trains, including newer additions such as `ice-t`, `tgv-pos`, `renfe-s130`, `sbb-icn`, `db-class-101`, and `sncf-cc-72000`, plus historic examples such as `stephensons-rocket`, `mallard`, `sbb-crocodile`, and `union-pacific-big-boy`.
- `seed`: optional text that creates a different daily rotation.
- `showOrigin`, `showService`, `showSpeed`, `showBuilder`, `showType`: default fact checkboxes.
- `showOperator`, `showFormation`, `showLength`, `showVoltage`, `showGauge`, `showDrive`: optional extra fact checkboxes.
- `showFamily`, `showYearsBuilt`, `showUnitsBuilt`, `showRecordSpeed`, `showPowerOutput`, `showCapacity`, `showAxleArrangement`, `showRoute`: optional expanded fact checkboxes, all disabled by default.

Useful additional train facts for future entries include manufacturer variants, depot or home base, livery, signalling systems, and notable named services.
