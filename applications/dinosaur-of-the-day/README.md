# Dinosaur of the Day

Shows a deterministic daily dinosaur on a paperlesspaper display. The rotation uses Wikipedia-sourced facts and generated side-view silhouette artwork optimized for quick recognition on color eInk.

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

The dinosaur images were generated with the built-in image generation tool, then chroma-keyed locally into transparent PNG assets. The images use this framing:

- exact orthographic side view
- centered full-body dinosaur silhouette
- dark display-friendly shape with crisp edges
- transparent background after local chroma-key removal
- no text, labels, watermark, environment, or cast shadow

The application icon is stored at [assets/icon.png](./assets/icon.png).

### Icon Prompt

Use this prompt for icon variants. Replace `YOUR DINOSAUR` with a concise dinosaur description:

```txt
A high-resolution 2D digital icon for a Dinosaur of the Day integration for the paperlesspaper eInk display, featuring YOUR DINOSAUR in exact orthographic side view. The dinosaur is fully visible from snout to tail tip, centered with generous padding.

The icon has a clean minimal silhouette with subtle beveled 3D shading and crisp edges. The background is fully transparent, with no shadows, floor, surrounding elements, text, labels, or watermark, suitable for use as an icon or in UI design.
```

### Image Prompt

Use this prompt for additional dinosaurs. Replace `NAME OF THE DINOSAUR` and the anatomy hints:

```txt
Create a display-friendly scientific silhouette of NAME OF THE DINOSAUR in exact orthographic side view, without perspective. The full dinosaur is centered and completely visible from snout to tail tip, with generous padding around the body. Use a dark charcoal silhouette with crisp edges and subtle eInk-friendly edge highlights.

Use Wikipedia as the factual reference for the dinosaur's recognizable anatomy and proportions: include the characteristic body shape, skull, limbs, tail, plates, horns, sail, crest, claws, or other signature outline details for NAME OF THE DINOSAUR. The image should contain no readable text, logos, labels, watermark, environment, people, ground, cast shadow, or background objects.

For transparent asset generation with the built-in tool, place the dinosaur on a perfectly flat solid #00ff00 chroma-key background. The background must be one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation, and #00ff00 must not appear inside the dinosaur.
```

## Settings

- `group`: show all dinosaurs or filter by a broad dinosaur group.
- `dinosaurId`: pin a dinosaur by slug. The catalog includes `tyrannosaurus-rex`, `triceratops`, `stegosaurus`, `brachiosaurus`, `velociraptor`, and `spinosaurus`.
- `seed`: optional text that creates a different daily rotation.
- `showPeriod`, `showLength`, `showDiet`, `showFossilLocation`, `showNameMeaning`: default fact checkboxes.
- `showSource`: optional Wikipedia source label.
