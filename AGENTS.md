# Codex project instructions

## Color on Spectra 6 displays

Integrations may and should use purposeful color where it improves recognition,
hierarchy, or understanding. Do not default every new integration to a purely
black-and-white design. Paperlesspaper's Spectra 6 displays support **black,
white, red, yellow, blue, and green**.

- Prefer a white or black reading surface with high-contrast text and a small
  number of deliberate color accents: section markers, selected dates, charts,
  category labels, status borders, or illustrated icons.
- Use the shared theme via `applyColorTheme()` and consume `--pp-accent`,
  `--pp-bg`, `--pp-fg`, `--pp-border`, and the shared Spectra palette variables
  (`--pp-red`, `--pp-yellow`, `--pp-blue`, `--pp-green`, `--pp-black`,
  `--pp-white`). Choose a suitable colored default theme, such as `blue-light`
  or `green-light`, when the integration benefits from it.
- Use yellow sparingly: it has weak contrast on white. Prefer orange for warm
  decorative accents, category markers and chart highlights. Reserve yellow for
  small, purposeful details or established status meanings; do not use it as the
  default color for large chart areas. Keep text on orange or yellow fills black.
- Orange is a design color, not a seventh native Spectra 6 pigment. Until the
  shared theme provides an orange token, use `var(--pp-orange, #ff8000)` locally
  for these accents. Use supported EPD dithering (for example `errorDiffusion`)
  to approximate orange with the physical palette; quantization-only processing
  can collapse it to red or yellow. Inspect the processed output.
- Keep black text on yellow fills and white text on dark saturated fills.
  Avoid yellow body text on white, subtle gray gradients, and low-contrast
  pastel backgrounds. Prefer solid palette colors for interface graphics.
- Preserve intentional semantic colors independently of the accent theme
  where needed (for example red for a severe warning). Always add a written
  label or symbol; color must not be the only indication of state. If the
  upstream meaning uses a color outside the palette, keep its textual label
  and map the graphic to a supported high-contrast color.
- Honor the user's global theme selection. Verify colored light and dark
  variants in both orientations and inspect production-like EPD output, not
  only raw browser screenshots.

## Related repositories

This repository depends on the sibling source repository:

- `/Users/utzel/htdocs/paperlesspaper-openintegration`

Treat that sibling as the canonical source for `@paperlesspaper/openintegration`.
The copy under `vendor/openintegration` in this repository is a built snapshot used
by `package.json`, Docker builds, and deployments; it is not the canonical source.

Before creating a new integration, read
`/Users/utzel/htdocs/paperlesspaper-openintegration/README.md` and use it as the
implementation guide. In particular, follow its LLM integration contract,
recommended generation and validation loop, manifest and settings conventions,
render lifecycle, localization rules, icon guidance, theme usage, and fixed-size
eInk layout requirements. Prefer the current sibling README over copied or
remembered conventions when they differ.

When a requested integration change requires shared runtime, CSS, preview, CLI,
manifest-validation, or rendering behavior:

1. Inspect the sibling source repository before working around the behavior in an
   individual integration.
2. Make shared-library changes in the sibling repository's `src/` files, not in
   its generated `dist/` directory and not directly in this repository's vendored
   `dist/` files.
3. In the sibling repository, run `npm run build`, `npm test`, and
   `npm run typecheck`.
4. Sync the sibling's `package.json`, `README.md`, and built `dist/` directory into
   `vendor/openintegration` here.
5. Run `npm install` here so `node_modules/@paperlesspaper/openintegration` and the
   generated files in `public/` are refreshed from the vendored snapshot.
6. Validate and render the affected integrations in this repository.

Keep changes in the two repositories clearly separated when reviewing, staging,
or committing. Do not assume that changing the sibling source automatically
updates the vendored dependency consumed by this repository.

If the sibling repository is not part of the active writable workspace, report
that limitation and ask for it to be added as a workspace root before attempting
to modify it. Instructions in this file do not themselves grant filesystem write
access.
