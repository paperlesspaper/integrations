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
  - [Ankylosaurus](https://en.wikipedia.org/wiki/Ankylosaurus)
  - [Parasaurolophus](https://en.wikipedia.org/wiki/Parasaurolophus)
  - [Allosaurus](https://en.wikipedia.org/wiki/Allosaurus)
  - [Diplodocus](https://en.wikipedia.org/wiki/Diplodocus)
  - [Iguanodon](https://en.wikipedia.org/wiki/Iguanodon)
  - [Pachycephalosaurus](https://en.wikipedia.org/wiki/Pachycephalosaurus)
  - [Carnotaurus](https://en.wikipedia.org/wiki/Carnotaurus)
  - [Therizinosaurus](https://en.wikipedia.org/wiki/Therizinosaurus)
  - [Dilophosaurus](https://en.wikipedia.org/wiki/Dilophosaurus)
  - [Gallimimus](https://en.wikipedia.org/wiki/Gallimimus)
  - [Apatosaurus](https://en.wikipedia.org/wiki/Apatosaurus)
  - [Ceratosaurus](https://en.wikipedia.org/wiki/Ceratosaurus)
  - [Deinonychus](https://en.wikipedia.org/wiki/Deinonychus)
  - [Edmontosaurus](https://en.wikipedia.org/wiki/Edmontosaurus)
  - [Oviraptor](https://en.wikipedia.org/wiki/Oviraptor)
  - [Protoceratops](https://en.wikipedia.org/wiki/Protoceratops)
  - [Utahraptor](https://en.wikipedia.org/wiki/Utahraptor)
  - [Argentinosaurus](https://en.wikipedia.org/wiki/Argentinosaurus)
  - [Archaeopteryx](https://en.wikipedia.org/wiki/Archaeopteryx)
  - [Compsognathus](https://en.wikipedia.org/wiki/Compsognathus)
  - [Corythosaurus](https://en.wikipedia.org/wiki/Corythosaurus)
  - [Giganotosaurus](https://en.wikipedia.org/wiki/Giganotosaurus)
  - [Kentrosaurus](https://en.wikipedia.org/wiki/Kentrosaurus)
  - [Sauropelta](https://en.wikipedia.org/wiki/Sauropelta)
  - [Styracosaurus](https://en.wikipedia.org/wiki/Styracosaurus)
  - [Suchomimus](https://en.wikipedia.org/wiki/Suchomimus)
  - [Albertosaurus](https://en.wikipedia.org/wiki/Albertosaurus)
  - [Baryonyx](https://en.wikipedia.org/wiki/Baryonyx)
  - [Camarasaurus](https://en.wikipedia.org/wiki/Camarasaurus)
  - [Chasmosaurus](https://en.wikipedia.org/wiki/Chasmosaurus)
  - [Dryosaurus](https://en.wikipedia.org/wiki/Dryosaurus)
  - [Euoplocephalus](https://en.wikipedia.org/wiki/Euoplocephalus)
  - [Lambeosaurus](https://en.wikipedia.org/wiki/Lambeosaurus)
  - [Megalosaurus](https://en.wikipedia.org/wiki/Megalosaurus)
  - [Maiasaura](https://en.wikipedia.org/wiki/Maiasaura)
  - [Plateosaurus](https://en.wikipedia.org/wiki/Plateosaurus)
  - [Coelophysis](https://en.wikipedia.org/wiki/Coelophysis)
  - [Mononykus](https://en.wikipedia.org/wiki/Mononykus)
  - [Psittacosaurus](https://en.wikipedia.org/wiki/Psittacosaurus)
  - [Acrocanthosaurus](https://en.wikipedia.org/wiki/Acrocanthosaurus)
  - [Mamenchisaurus](https://en.wikipedia.org/wiki/Mamenchisaurus)
  - [Pachyrhinosaurus](https://en.wikipedia.org/wiki/Pachyrhinosaurus)
  - [Amargasaurus](https://en.wikipedia.org/wiki/Amargasaurus)
  - [Nigersaurus](https://en.wikipedia.org/wiki/Nigersaurus)
  - [Ouranosaurus](https://en.wikipedia.org/wiki/Ouranosaurus)
  - [Shantungosaurus](https://en.wikipedia.org/wiki/Shantungosaurus)
  - [Tarbosaurus](https://en.wikipedia.org/wiki/Tarbosaurus)
  - [Herrerasaurus](https://en.wikipedia.org/wiki/Herrerasaurus)
  - [Minmi](https://en.wikipedia.org/wiki/Minmi_paravertebra)
  - [Concavenator](https://en.wikipedia.org/wiki/Concavenator)

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
- `dinosaurId`: pin a dinosaur by slug. The catalog includes `true`, `maiasaura`, `plateosaurus`, `coelophysis`, `mononykus`, `psittacosaurus`, `acrocanthosaurus`, `mamenchisaurus`, `pachyrhinosaurus`, `amargasaurus`, `nigersaurus`, `ouranosaurus`, `shantungosaurus`, `tarbosaurus`, `herrerasaurus`, `minmi`, and `concavenator`.
- `seed`: optional text that creates a different daily rotation.
- `showPeriod`, `showLength`, `showDiet`, `showFossilLocation`, `showNameMeaning`: default fact checkboxes.
- `showSource`: optional Wikipedia source label.
