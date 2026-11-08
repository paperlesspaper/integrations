# Layout runtime build

Canonical source: https://github.com/paperlesspaper/openintegration
Commit: `f5122a8e12aed4e6df2ff331e4191d4c4eb488c9`

Built with `npm run build`, with unit tests and typecheck passing. This snapshot
contains the SDK package.json, README.md and generated dist directory. Only
`dist/layout-addon.iife.js` is appended to the provider's existing runtime.

Regenerate from the canonical source; do not edit compiled files.

The addon replaces the export object and installs a capture-phase embedded message
guard before application scripts run, including listeners retained inside older SDK
closures. The packaged provider passes the foreign-sibling INIT regression test.
