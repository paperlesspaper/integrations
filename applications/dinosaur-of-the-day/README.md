# Dinosaur of the Day

Shows a deterministic daily dinosaur on a paperlesspaper display. The rotation uses Wikipedia-sourced facts and generated CAD-like side-view artwork optimized for quick recognition on color eInk.

## Links

- [config.json](./config.json)
- Wikipedia sources used in the catalog:
  - [Tyrannosaurus](https://en.wikipedia.org/wiki/Tyrannosaurus)
  - [Triceratops](https://en.wikipedia.org/wiki/Triceratops)
  - [Stegosaurus](https://en.wikipedia.org/wiki/Stegosaurus)
  - [Brachiosaurus](https://en.wikipedia.org/wiki/Brachiosaurus)
  - [Velociraptor](https://en.wikipedia.org/wiki/Velociraptor)
  - [Spinosaurus](https://en.wikipedia.org/wiki/Spinosaurus)

## Artwork

The dinosaur images were generated with the built-in image generation tool as non-transparent PNG assets. The images use this framing:

- exact orthographic side view
- centered full-body dinosaur
- white studio background
- high-contrast CAD-like surfaces with crisp edges
- no text, labels, watermark, environment, or cast shadow

The application icon is stored at [assets/icon.png](./assets/icon.png).

### Icon Prompt

Use this prompt for icon variants. Replace `NAME OF THE DINOSAUR` with a dinosaur name:

```txt
Erstelle ein gerendertes CAD-ähnliches Bild von dem Dinosaurier NAME OF THE DINOSAUR in exakter orthografischer Seitenansicht, ohne Perspektive. Der Dinosaurier ist vollständig sichtbar. Weißer Hintergrund, Studio-Licht, hoher Kontrast, klare Kanten und saubere technische Flächen.

Nutze ein öffentliches Referenzbild von Wikipedia als visuelle Vorlage: NAME OF THE DINOSAUR mit den charakteristischen Farben und Form. Das Bild soll keine lesbaren Logos oder Textbeschriftungen enthalten.

Der Dinosaurier soll etwas vereinfacht wirken, wie eine gerenderte CAD-Zeichnung: reduzierte, aber erkennbare Details.

Komposition: exakte Seitenansicht, horizontal von links nach rechts, vollständig sichtbar. Keine perspektivische Verzerrung, keine Umgebung, keine Personen, keine starken Gebrauchsspuren, keine überladenen Details, kein Wasserzeichen, keine Textlabels.

no transparency
```

### Image Prompt

Use this prompt for additional dinosaurs. Replace `NAME OF THE DINOSAUR`:

```txt
Erstelle ein gerendertes CAD-ähnliches Bild von dem Dinosaurier NAME OF THE DINOSAUR in exakter orthografischer Seitenansicht, ohne Perspektive. Der Dinosaurier ist vollständig sichtbar. Weißer Hintergrund, Studio-Licht, hoher Kontrast, klare Kanten und saubere technische Flächen.

Nutze ein öffentliches Referenzbild von Wikipedia als visuelle Vorlage: NAME OF THE DINOSAUR mit den charakteristischen Farben und Form. Das Bild soll keine lesbaren Logos oder Textbeschriftungen enthalten.

Der Dinosaurier soll etwas vereinfacht wirken, wie eine gerenderte CAD-Zeichnung: reduzierte, aber erkennbare Details.

Komposition: exakte Seitenansicht, horizontal von links nach rechts, vollständig sichtbar. Keine perspektivische Verzerrung, keine Umgebung, keine Personen, keine starken Gebrauchsspuren, keine überladenen Details, kein Wasserzeichen, keine Textlabels.

no transparency
```

## Settings

- `group`: show all dinosaurs or filter by a broad dinosaur group.
- `dinosaurId`: pin a dinosaur by slug. The catalog includes `tyrannosaurus-rex`, `triceratops`, `stegosaurus`, `brachiosaurus`, `velociraptor`, and `spinosaurus`.
- `seed`: optional text that creates a different daily rotation.
- `showPeriod`, `showLength`, `showDiet`, `showFossilLocation`, `showNameMeaning`: default fact checkboxes.
- `showSource`: optional Wikipedia source label.
