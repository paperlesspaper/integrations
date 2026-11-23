# Wikipedia

Static HTML/CSS/JavaScript migration of the Wikipedia integration from
`paperlesspaper-apps/src/components/Wikipedia`, with the additional most-viewed
article modes inspired by [Top Wikipedia on Reddit](https://www.reddit.com/r/trmnl/comments/1wf7z76/wikipedia_tranding_articles/).
No React, API key or scheduled external data build is required.

## Views

| `kind` | Display |
| --- | --- |
| `primary` | Featured article: full-width photo, bold title, date and excerpt, matching the original layout. The legacy values `default` and `primary` both work. |
| `onthisday` | Large underlined date heading and historical events with emphasized years, matching the original layout. |
| `trends` | Ranking, views, percentage change from the preceding day and a seven-day bar chart per article. The optional image shows the leading article. More rows fit with the image disabled. |

`edition` selects German, English, French, Spanish, Italian, Portuguese, Dutch, Polish, Swedish or Finnish (`de`, `en`, `fr`, `es`, `it`, `pt`, `nl`, `pl`, `sv`, `fi`). The default `auto` follows the host's
`meta.language`. Edition selection also controls all display labels and date/number
formatting. The legacy `?language=en` query is accepted when edition is `auto`;
there is no duplicate host-language field in the settings form.

`showImage` toggles images in all three views (default true): the featured article image, images from the associated pages of historical events, or the leading trending article. The legacy `kind=thumbnail` URL maps to `trends`.

Source footers, entry counts, total views and biggest-increase summaries are omitted. Demo data retains a small explicit label.

`limit` caps events or ranking entries at 1–20 (default 10). The renderer shows as
many complete rows as fit, without a count footer. Larger displays and portrait
orientation have room for more ranking entries. `limitCharacters` controls the
featured excerpt (100–2000, default 550); exceptionally long text ends with an
ellipsis when the frame cannot accommodate it at a readable size.

`color` uses the shared theme, with `blue-light` as the default. Positive/negative
changes have explicit signs as well as colored labels. Photos use Spectra 6 error
diffusion. `sampleData` is an internal fixture flag for screenshot generation and is not exposed
in the settings form. It defaults to false; fixtures are visibly labelled and never
used as an automatic fallback.

## Data and failure behavior

- Featured articles and historical events use the Wikipedia featured feed for
  today's UTC date. Availability varies by edition; missing sections show a
  localized empty state without substituting a different edition or article.
- Rankings use the official [Wikimedia Pageviews API](https://doc.wikimedia.org/generated-data-platform/aqs/analytics-api/reference/page-views.html),
  `top/{edition}.wikipedia/all-access/YYYY/MM/DD`. Navigation pages and known
  namespaces are excluded. The displayed rank is within the remaining articles.
- The most recent complete UTC day is requested first. If it is unavailable,
  the adapter tries the preceding two days and always displays the actual date.
- Seven-day histories use `per-article/.../all-access/user/.../daily`, aligned by
  timestamp, with the displayed day as the final bar. Each chart has its own
  vertical scale. A missing day is an outlined mark, not an invented zero.
- Percentage changes compare that day's views with the preceding day's views.
  An absent or zero denominator yields `—`. No aggregate totals or biggest-increase summary is displayed.
- Optional image/history failures preserve the ranking, with missing-data labels.
  A complete source failure shows a localized error and marks the render as failed.
- Server requests have a one-hour bounded cache, response size/time limits and at
  most four simultaneous history requests. Settings updates cancel stale browser
  requests. Resizing refits the last result without another API fetch.

## Local preview and validation

```sh
npm start
# Open http://localhost:3000/wikipedia/run
npx paperless check applications/wikipedia/config.json
node --test tests/wikipedia.test.mjs
npx paperless render applications/wikipedia/config.json --settings '{"kind":"trends","sampleData":true}' --viewport 800x480 --output /tmp/wikipedia-trends.png
```

The server discovers this integration automatically. Migration of existing saved
device configurations and removal of the old React route are separate deployment
steps; this change provides the new `/wikipedia/run`, `/wikipedia/render.html` and
`/wikipedia/config.json` endpoints here.

## Sources and assets

Live content comes from the selected Wikipedia edition; article links lead to the
source page and its revision/attribution history. Wikipedia text is available under
CC BY-SA, and individual article images retain their own licenses.

The integration icon is reused from the existing Wikipedia editor in
`paperlesspaper-web`. The demo photograph, `assets/sample-earth.jpg`, is a thumbnail
of [Meteosat-12 FCI, March equinox 2025](https://commons.wikimedia.org/wiki/File:Meteosat-12-fci-march-equinox-2025-noon.jpg),
© European Organisation for the Exploitation of Meteorological Satellites
(EUMETSAT), distributed with the attribution requirement documented on that page.
New editions use English sample article text in internal fixtures; live content and interface labels use the selected edition. Demo excerpts are short original summaries; demo rankings and view counts are
synthetic and clearly labelled. The sample events refer to 16 July 1969, 1945 and
1994.
