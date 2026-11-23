# Climate Stripes

Displays the original [Show Your Stripes](https://showyourstripes.info/) charts for 1,071 locations, including the globe, countries and cities.

Choose a region, country and city or area in the settings page. Choose one of four styles in the generated settings form:

* `stripes`: warming stripes filling the available chart area.
* `labelled`: stripes with the original location and year labels.
* `bars`: temperature anomaly bars.
* `bars-scale`: bars with the original numerical scale.

All charts use faithful EPD processing to preserve their blue and red shade differences.

Every style fills the entire display with no added headings, credits, borders or padding. Plain stripes are the default. Chart colors remain faithful to the source; production EPD processing approximates the blue and red shades using the Spectra 6 palette. Images stretch to the frame dimensions without cropping source labels, including in portrait orientation. Original chart labels are in English; integration copy supports English and German.

## Data and credit

Charts: Professor Ed Hawkins, University of Reading, [showyourstripes.info](https://showyourstripes.info/), [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Credit and links are provided in the settings page and this documentation. The source charts are resized for the display and their colors are converted by the device renderer. No temperature values or scales are invented or recalculated.

The checked-in location catalog was retrieved on September 9, 2026 and contains series through 2025. Charts load directly from the original HTTPS source; internet access is required. Failed image loads and timeouts produce an error marker, never a successful blank render. Invalid locations are rejected instead of falling back silently.

Refresh catalog metadata when the source publishes new annual charts:

```sh
python3 scripts/update-climate-stripes-catalog.py
node --test tests/climate-stripes.test.mjs
npx paperless check applications/climate-stripes/config.json
```

The refresh script requires Python 3 and curl. It parses the public catalog as data without executing upstream JavaScript. It validates basic catalog structure before replacing the checked-in snapshot. Upstream bundle format changes require updating the script.

## Local preview

```sh
npx paperless dev applications/climate-stripes/config.json
npx paperless render applications/climate-stripes/config.json --color blue-light --viewport 800x480 --output /tmp/climate-stripes.png
```

The server discovers this integration automatically at `/climate-stripes/config.json` and `/climate-stripes/run`.
