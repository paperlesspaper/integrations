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
  - [Megalodon](https://en.wikipedia.org/wiki/Megalodon)
  - [Cretoxyrhina](https://en.wikipedia.org/wiki/Cretoxyrhina)
  - [Cladoselache](https://en.wikipedia.org/wiki/Cladoselache)
  - [Hyneria](https://en.wikipedia.org/wiki/Hyneria)
  - [Eusthenopteron](https://en.wikipedia.org/wiki/Eusthenopteron)
  - [Rhizodus](https://en.wikipedia.org/wiki/Rhizodus)
  - [Onychodus](https://en.wikipedia.org/wiki/Onychodus)
  - [Mawsonia](https://en.wikipedia.org/wiki/Mawsonia)
  - [Materpiscis](https://en.wikipedia.org/wiki/Materpiscis)
  - [Entelognathus](https://en.wikipedia.org/wiki/Entelognathus)
  - [Asterolepis](https://en.wikipedia.org/wiki/Asterolepis_(fish))
  - [Cephalaspis](https://en.wikipedia.org/wiki/Cephalaspis)
  - [Arandaspis](https://en.wikipedia.org/wiki/Arandaspis)
  - [Haikouichthys](https://en.wikipedia.org/wiki/Haikouichthys)
  - [Saurichthys](https://en.wikipedia.org/wiki/Saurichthys)
  - [Aspidorhynchus](https://en.wikipedia.org/wiki/Aspidorhynchus)
  - [Enchodus](https://en.wikipedia.org/wiki/Enchodus)
  - [Cheirolepis](https://en.wikipedia.org/wiki/Cheirolepis)
  - [Pycnodus](https://en.wikipedia.org/wiki/Pycnodus)
  - [Coccosteus](https://en.wikipedia.org/wiki/Coccosteus)

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
Erstelle ein gerendertes CAD-ähnliches Bild von dem prähistorischen Fisch NAME OF THE FISH in exakter orthografischer Seitenansicht, ohne Perspektive. Der Fisch ist vollständig sichtbar. Perfekt flacher #00ff00 Chroma-Key-Hintergrund für die Freistellung, Studio-Licht, hoher Kontrast, klare Kanten und saubere technische Flächen.

Nutze ein öffentliches Referenzbild von Wikipedia als visuelle Vorlage: NAME OF THE FISH mit den charakteristischen Farben und Formen. Das Bild soll keine lesbaren Logos oder Textbeschriftungen enthalten.

Der Fisch soll etwas vereinfacht wirken, wie eine gerenderte CAD-Zeichnung: reduzierte, aber erkennbare Details.

Komposition: exakte Seitenansicht, horizontal von links nach rechts, vollständig sichtbar. Keine perspektivische Verzerrung, keine Umgebung, keine Personen, keine starken Gebrauchsspuren, keine überladenen Details, kein Wasserzeichen, keine Textlabels.

Der Hintergrund muss eine gleichmäßige Chroma-Key-Farbe haben. Kein Schatten, kein Kontakt-Schatten, keine Reflexion, kein Text.
```

### Image Prompt

Use this prompt for additional fish. Replace `NAME OF THE FISH`:

```txt
Erstelle ein gerendertes CAD-ähnliches Bild von dem prähistorischen Fisch NAME OF THE FISH in exakter orthografischer Seitenansicht, ohne Perspektive. Der Fisch ist vollständig sichtbar. Weißer Hintergrund, Studio-Licht, hoher Kontrast, klare Kanten und saubere technische Flächen.

Nutze ein öffentliches Referenzbild von Wikipedia als visuelle Vorlage: NAME OF THE FISH mit den charakteristischen Farben und Form. Das Bild soll keine lesbaren Logos oder Textbeschriftungen enthalten.

Der Fisch soll etwas vereinfacht wirken, wie eine gerenderte CAD-Zeichnung: reduzierte, aber erkennbare Details.

Komposition: exakte Seitenansicht, horizontal von links nach rechts, vollständig sichtbar. Keine perspektivische Verzerrung, keine Umgebung, keine Personen, keine starken Gebrauchsspuren, keine überladenen Details, kein Wasserzeichen, keine Textlabels.

no transparency
```

## Settings

- `group`: show all fish or filter by broad fossil fish group.
- `fishId`: pin a fish by slug. The catalog includes 28 fish, including `dunkleosteus`, `tiktaalik`, `megalodon`, `cretoxyrhina`, `hyneria`, `mawsonia`, `entelognathus`, `cephalaspis`, `saurichthys`, `enchodus`, `pycnodus`, and `coccosteus`.
- `seed`: optional text that creates a different daily fish rotation.
- `showPeriod`, `showLength`, `showDiet`, `showFossilLocation`, `showNameMeaning`: default fact checkboxes.
- `showSource`: optional Wikipedia source label.
