# Spacecraft of the Day

Shows a deterministic daily spacecraft on a paperlesspaper display. The rotation includes satellites, probes, capsules, rockets, landers, and space telescopes. Each entry combines a centered portrait-mode spacecraft image with compact facts: mission, launch date, agency, destination, mass, power source, and outcome.

## Links

- [config.json](./config.json)

## Artwork

The spacecraft images were generated with the `imagegen` skill as raster PNG assets and stored in [assets/spacecraft](./assets/spacecraft). The renderer does not draw SVG spacecraft.

### Icon Prompt

Use this prompt for icon variants:

```txt
Create a high-resolution 2D digital icon for a Spacecraft of the Day integration. Show a compact upright spacecraft/probe with a small dish, capsule-like body, and blue solar panels, fully visible and centered. Realistic but minimalistic raster icon with slightly 3D CAD-like shading, smooth beveled edges, clean technical details. Square icon composition, clean light background, no readable logos, no text labels, no watermark, no stars, no planet, no orbit trails, no surrounding elements.
```

### Image Prompt

Use this prompt for additional spacecraft. Replace `NAME OF THE SPACECRAFT` and the identifying details:

```txt
Create a rendered CAD-like image of NAME OF THE SPACECRAFT, centered as a standing portrait-mode spacecraft object. Pure white studio background. The spacecraft is fully visible and upright in the frame, with its characteristic silhouette, panels, antennas, dish, capsule body, rocket stack, legs, booms, instruments, or sunshield clearly recognizable.

Use a public museum/NASA/ESA-style reference image as visual guidance for the distinctive shape, colors, and technical details.

The spacecraft should feel simplified but recognizable, like a clean technical product render: crisp edges, high contrast, precise forms, subtle material reflections, and slightly 3D CAD-like shading.

Composition: portrait image, exact centered object, mostly front or three-quarter technical orthographic view, generous padding, no cropping. No perspective drama, no environment, no planet, no stars, no people, no launch smoke, no flame, no watermark.
```

## Settings

- `vehicleType`: filter the rotation by satellites, probes, capsules, rockets, landers, telescopes, or orbiters.
- `era`: show any spacecraft, historic spacecraft, or modern spacecraft.
- `spacecraftId`: pin a spacecraft by slug.
- `seed`: optional text that creates a different daily rotation.
- `showMission`, `showLaunchDate`, `showAgency`, `showDestination`, `showMass`, `showPowerSource`, `showOutcome`: default fact checkboxes.
- `showVehicleType`, `showCountry`, `showLaunchVehicle`, `showOperationalLife`, `showSource`: optional extra fact checkboxes.

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
