# Tree of the Day

Shows a deterministic daily tree on a paperlesspaper display. The rotation mixes tree species with individual famous trees and presents generated botanical artwork plus compact facts sourced from Wikipedia.

## Links

- [config.json](./config.json)

## Artwork

The tree images were generated with the `imagegen` skill using Wikipedia-style visual references and this framing:

- whole tree fully visible in portrait mode
- white studio background
- simplified rendered botanical / CAD-like look
- representative leaf, fruit, seed, or cone detail beside the tree
- no readable text, labels, people, landscape, or watermark

The application icon is stored at [assets/icon.png](./assets/icon.png).

### Icon Prompt

```txt
Use case: logo-brand
Asset type: paperlesspaper integration icon source for chroma-key background removal
Primary request: A high-resolution 2D digital icon for a Tree of the Day integration, featuring a compact stylized tree with a trunk and leafy crown plus one large leaf, centered.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for background removal. The background must be one uniform color with no shadows, gradients, texture, reflections, floor plane, or lighting variation.
Subject: minimal botanical tree icon, whole small tree fully visible, simple trunk, green crown, one separate leaf accent.
Style/medium: clean realistic-minimal 3D/CAD-like icon with beveled depth and crisp edges.
Composition/framing: square composition, centered, generous padding, readable at small sizes.
Lighting/mood: soft studio lighting on subject only, no cast shadow.
Constraints: do not use #ff00ff anywhere in the subject; no text, no labels, no watermark, no surrounding elements.
```

### Image Prompt

Use this prompt for additional trees. Replace `NAME OF THE TREE` and the visual details:

```txt
Use case: scientific-educational
Asset type: paperlesspaper Tree of the Day integration artwork
Primary request: Create a rendered botanical plate of NAME OF THE TREE with the whole tree and a representative leaf/fruit/seed detail.
Scene/backdrop: pure white studio background.
Subject: a mature NAME OF THE TREE shown as an entire tree in portrait mode, with its characteristic trunk, crown, bark, and branch structure; include a separate enlarged leaf and fruit/seed/cone detail near the lower right.
Style/medium: clean high-resolution semi-realistic 3D/CAD-like botanical render, simplified but accurate, crisp edges, subtle material texture.
Composition/framing: portrait orientation, whole tree fully visible from base to crown, centered and dominant, no cropped parts; leaf/fruit/seed detail floats beside the tree, smaller than the tree and clearly separated.
Lighting/mood: soft studio light, high contrast suitable for eInk display.
Color palette: natural bark, foliage, fruit, and seed colors.
Constraints: use publicly available Wikipedia-style visual knowledge as reference; no text, no labels, no watermark, no people, no environment, no strong shadow.
```

## Settings

- `region`: show trees from any region or from Europe, Africa, Asia, North America, South America, or Oceania.
- `category`: show any entry, species entries, or individual famous trees.
- `treeId`: pin a tree by slug. The catalog contains `coast-redwood`, `african-baobab`, `dragon-blood-tree`, `ginkgo`, `jaya-sri-maha-bodhi`, `olive-tree`, `norway-spruce`, `major-oak`, `wollemi-pine`, `giant-sequoia`, `general-sherman`, `bristlecone-pine`, `banyan`, `japanese-cherry`, `date-palm`, `kapok`, `dawn-redwood`, `bald-cypress`, `sugar-maple`, `cacao`, `coconut-palm`, `deodar-cedar`, `queensland-bottle-tree`, and `royal-poinciana`.
- `seed`: optional text that creates a different daily rotation.
- `showSpecies`, `showRange`, `showHeight`, `showAge`, `showLeafType`, `showFruitSeed`, `showCulturalRole`: default fact checkboxes.
- `showFamily`, `showHabitat`, `showConservation`, `showCategory`: optional extra fact checkboxes.

## Sources

Facts and visual prompts are based on Wikipedia pages for the listed species or individual trees. The source title and URL are included in [data/trees.js](./data/trees.js).
