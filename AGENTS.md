# Codex project instructions

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
