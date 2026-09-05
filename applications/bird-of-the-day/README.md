# Bird of the Day

Shows a deterministic daily bird on a paperlesspaper display. The rotation uses Wikipedia-sourced facts for range, wingspan, call, diet, conservation status, migration, and optional extra field-guide facts.

## Links

- [config.json](./config.json)

## Artwork

The bird images were generated with the built-in Codex `imagegen` skill from Wikipedia-style field-guide references:

- exact side-profile bird view
- clean white studio background
- full bird visible and centered
- crisp natural-history / CAD-like simplification
- no labels, readable text, watermarks, branches, or surrounding scenery

The application icon is stored at [assets/icon.png](./assets/icon.png).

### Icon Prompt

```txt
Use case: logo-brand
Asset type: square integration icon for paperlesspaper Bird of the Day
Primary request: simple high-resolution 2D icon showing a clean side-profile bird for a daily bird facts integration
Subject: a compact generic songbird in exact side profile, facing right, with a bright accent breast and simple dark wing shape, readable at small size
Style/medium: minimal polished semi-realistic icon, slight 3D shading and highlights, clean beveled shape
Composition/framing: centered bird, fully visible, generous padding, square composition
Scene/backdrop: transparent background
Lighting/mood: soft studio lighting, crisp high-contrast edges
Constraints: no text, no labels, no watermark, no branch, no extra objects, no shadow outside the subject
```

### Image Prompt

Use this prompt for additional birds. Replace `NAME OF THE BIRD` and the reference details:

```txt
Use case: scientific-educational
Asset type: paperlesspaper Bird of the Day integration artwork
Primary request: clean side-profile illustration of NAME OF THE BIRD for a daily bird fact display
Subject: NAME OF THE BIRD, with the field marks, proportions, bill shape, tail shape, plumage colors, and posture described from Wikipedia reference images
Style/medium: polished semi-realistic natural history illustration with subtle CAD-like clarity, clean edges, high contrast
Composition/framing: exact orthographic side profile facing right, entire bird fully visible, centered with generous padding
Scene/backdrop: perfectly clean white studio background
Lighting/mood: even soft studio light, no dramatic shadows
Constraints: no text, no labels, no watermark, no border, no extra objects; preserve accurate silhouette and characteristic markings
```

## Settings

- `region`: show all birds, European birds, Americas birds, Asian birds, oceanic birds, or worldwide-range birds.
- `habitat`: filter by broad habitat, such as open country, coast, wetland, forest, tundra, or urban.
- `birdId`: pin a bird by slug.
- `seed`: optional text that creates a different daily rotation.
- `showRange`, `showWingspan`, `showCall`, `showDiet`, `showConservation`, `showMigration`: default fact checkboxes.
- `showScientificName`, `showHabitat`, `showSize`, `showNesting`, `showOrder`: optional extra fact checkboxes, disabled by default.

## Sources

Facts are summarized from Wikipedia pages linked in [data/birds.js](./data/birds.js): Barn swallow, Atlantic puffin, Common kingfisher, Snowy owl, Red-crowned crane, Wandering albatross, European robin, Common raven, and Ruby-throated hummingbird.

## Shared display layout

This integration uses the common illustrated daily-card renderer. It chooses a side-by-side
or stacked composition from the artwork shape and display orientation, keeps the full image
inside its allotted area, and scales typography for small and large display resolutions.

- `textSize`: `small`, `middle` (default), or `big`.
- `showHeader`: hides title, description, date and metadata when false.
- `showFactCount`: optionally shows e.g. “5 of 6 facts” when selected facts do not all fit; defaults to false.
- `showRotationCount`: optionally shows the item count in the rotation; defaults to false and requires the header.
- Existing fact switches select the eligible facts. If they do not all fit legibly while
  preserving the picture area, the renderer shows the first complete facts in their defined
  priority order. The optional fact count is independent of the header. Facts are not paginated.
- Deselecting all facts leaves no facts; disabling the header as well gives an image-only view.

The shared rules and generation checklist live in
[`@paperlesspaper/openintegration`'s guide](../../vendor/openintegration/of-the-day-integrations.md).
Validate the installed runtime with `npm run check:of-the-day -- --full` from the repository root.
