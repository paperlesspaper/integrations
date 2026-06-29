# Fish of the Day

Shows a deterministic daily prehistoric fish on a paperlesspaper display. The rotation uses Wikipedia-sourced fossil facts and generated CAD-like side-view artwork optimized for quick recognition on color eInk.

## Links

- [config.json](./config.json)
- Wikipedia sources used in the catalog:
  - [Dunkleosteus](https://en.wikipedia.org/wiki/Dunkleosteus)
  - [Tiktaalik](https://en.wikipedia.org/wiki/Tiktaalik)
  - [Xiphactinus](https://en.wikipedia.org/wiki/Xiphactinus)
  - [Leedsichthys](https://en.wikipedia.org/wiki/Leedsichthys)
  - [Helicoprion](https://en.wikipedia.org/wiki/Helicoprion)
  - [Stethacanthus](https://en.wikipedia.org/wiki/Stethacanthus)
  - [Pteraspis](https://en.wikipedia.org/wiki/Pteraspis)
  - [Bothriolepis](https://en.wikipedia.org/wiki/Bothriolepis)

## Artwork

The fish images were generated with the built-in image generation tool as non-transparent PNG assets. The images use this framing:

- exact orthographic side view
- centered full-body prehistoric fish
- white studio background
- high-contrast CAD-like surfaces with crisp edges
- no text, labels, watermark, environment, or cast shadow

The application icon is stored at [assets/icon.png](./assets/icon.png). It was generated on a chroma-key background and converted to a transparent PNG locally.

### Icon Prompt

Use this prompt for icon variants. Replace `NAME OF THE FISH` with a prehistoric fish name:

```txt
Erstelle ein gerendertes CAD-aehnliches Bild von dem praehistorischen Fisch NAME OF THE FISH in exakter orthografischer Seitenansicht, ohne Perspektive. Der Fisch ist vollstaendig sichtbar. Perfekt flacher #00ff00 Chroma-Key-Hintergrund fuer die Freistellung, Studio-Licht, hoher Kontrast, klare Kanten und saubere technische Flaechen.

Nutze ein oeffentliches Referenzbild von Wikipedia als visuelle Vorlage: NAME OF THE FISH mit den charakteristischen Farben und Formen. Das Bild soll keine lesbaren Logos oder Textbeschriftungen enthalten.

Der Fisch soll etwas vereinfacht wirken, wie eine gerenderte CAD-Zeichnung: reduzierte, aber erkennbare Details.

Komposition: exakte Seitenansicht, horizontal von links nach rechts, vollstaendig sichtbar. Keine perspektivische Verzerrung, keine Umgebung, keine Personen, keine starken Gebrauchsspuren, keine ueberladenen Details, kein Wasserzeichen, keine Textlabels.

Der Hintergrund muss eine gleichmaessige Chroma-Key-Farbe haben. Kein Schatten, kein Kontakt-Schatten, keine Reflexion, kein Text.
```

### Image Prompt

Use this prompt for additional fish. Replace `NAME OF THE FISH`:

```txt
Erstelle ein gerendertes CAD-aehnliches Bild von dem praehistorischen Fisch NAME OF THE FISH in exakter orthografischer Seitenansicht, ohne Perspektive. Der Fisch ist vollstaendig sichtbar. Weisser Hintergrund, Studio-Licht, hoher Kontrast, klare Kanten und saubere technische Flaechen.

Nutze ein oeffentliches Referenzbild von Wikipedia als visuelle Vorlage: NAME OF THE FISH mit den charakteristischen Farben und Form. Das Bild soll keine lesbaren Logos oder Textbeschriftungen enthalten.

Der Fisch soll etwas vereinfacht wirken, wie eine gerenderte CAD-Zeichnung: reduzierte, aber erkennbare Details.

Komposition: exakte Seitenansicht, horizontal von links nach rechts, vollstaendig sichtbar. Keine perspektivische Verzerrung, keine Umgebung, keine Personen, keine starken Gebrauchsspuren, keine ueberladenen Details, kein Wasserzeichen, keine Textlabels.

no transparency
```

## Settings

- `group`: show all fish or filter by broad fossil fish group.
- `fishId`: pin a fish by slug. The catalog includes `dunkleosteus`, `tiktaalik`, `xiphactinus`, `leedsichthys`, `helicoprion`, `stethacanthus`, `pteraspis`, and `bothriolepis`.
- `seed`: optional text that creates a different daily fish rotation.
- `showPeriod`, `showLength`, `showDiet`, `showFossilLocation`, `showNameMeaning`: default fact checkboxes.
- `showSource`: optional Wikipedia source label.
