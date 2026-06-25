# Moon Phase

A static moon phase card for paperlesspaper displays. It calculates the phase in the browser for a chosen date, shows the phase name, illumination, moon age, hemisphere, and an optional estimate of the next major phase.

## Links

- [Demo](https://integrations.paperlesspaper.de/moon-phase/run)
- [config.json](./config.json)

## Screenshots

Screenshot paths are declared in `config.json` for 800x480 and 480x800 variants, but screenshots are not generated in this folder yet.

## Settings

- `title` sets the heading.
- `date` accepts a `YYYY-MM-DD` date. Empty means today in the browser.
- `hemisphere` flips the moon visual between northern and southern orientation.
- `showDetails` controls illumination, age, cycle, and hemisphere details.
- `showNextPhase` controls the next major phase estimate.

The renderer is browser-only and does not call external services.
