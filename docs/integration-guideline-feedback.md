# Guideline feedback from the dashboard integrations

The implementation follows the canonical sibling
[OpenIntegration README](../../paperlesspaper-openintegration/README.md).
The following are proposed additions or clarifications, not changes to its
shared runtime. The requested Spectra 6 color guidance has already been added to
this project's [AGENTS.md](../AGENTS.md#color-on-spectra-6-displays).

## 1. Align validation with the global-color contract

The guide says to include `color` in `nativeSettings`, but not in
`formSchema.properties`, since it is a global host control. The current CLI still
prints `WARN nativeSettings.color has no matching formSchema property` for that
correct configuration. Exempt global host controls in the validator and test
the exact documented example. Do not add duplicate color controls just to silence
the warning.

## 2. Standardize explicit demos and source freshness

Recommend an explicit `sampleData` boolean and an unmistakable localized demo
label. Never fall back to realistic-looking sample values after a live request
fails. Differentiate source retrieval time, provider observation time and render
time. Cached responses should retain retrieval time; unavailable sensors must not
turn into zeroes or an “everything is fine” empty state.

## 3. Document private-network deployment as part of data adapters

New integrations frequently need a local Home Assistant, Mealie or analytics
instance. Explain that the renderer/server must be able to reach it. Recommend
operator-controlled exact-origin allowlists, pinned DNS validation, bounded
requests, credential-safe redirect handling and JSON POST for renderer secrets.
A small server-side HTTP helper in the canonical toolkit would prevent each
repository from having to maintain similar transport code.

## 4. Inherit host locale in the calendar boot helper

The boot helper loads host-language messages, but calendar date formatting can
still use the default English locale when no explicit locale is configured.
Prefer the host language as the default date locale while preserving an explicit
user locale override. These two new calendar adapters pass the host locale
through the existing request context and provide the shared calendar labels.

## 5. Include palette and overlap checks in visual acceptance

Use the six Spectra 6 colors deliberately, rather than treating color eInk like
a monochrome display. Verify semantic colors with written labels and map unsupported
colors such as orange explicitly. Prefer orange over frequent yellow accents,
using EPD dithering to approximate it; keep yellow sparing and purposeful. Check colored and dark examples through EPD
optimization, and inspect screenshots as well as DOM overflow: a CSS grid can
overlap an adjacent chart even when the outer page reports no overflow.

## 6. Verify icon files, not just prompts

A prompt asking for transparency is not proof of an alpha channel. Verify square
dimensions, the PNG alpha channel, actual transparent border pixels and the absence
of a painted checkerboard before accepting an icon. Keep prompts/provenance with
the repository assets and show a preview on both light and dark backgrounds.
