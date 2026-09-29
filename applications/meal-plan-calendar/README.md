# Meal Plan Calendar

Shows a family meal plan ("Essensplan") that lives in a shared iCloud calendar. Every day gets a large
date and its meals grouped into breakfast, lunch, and dinner. Open slots appear as
"not planned yet".

Landscape frames show one column per day like a paper week planner; portrait frames show a vertical
list. Days that do not fit are left out from the end and counted in the footer.

On the larger L frames (1600x1200 / 1200x1600) the type grows moderately instead of doubling the 7"
layout, and the extra area shows more days: in landscape, more than seven days wrap into a second
week row; in portrait, the list switches to two columns of days once one column no longer fits.
The 7" layout (800x480 / 480x800) is unchanged.

## Setup

1. On iPhone/iPad open **Calendar → Calendars → (i)** next to the meal plan calendar
   (German: **Kalender → Kalender → (i)**), or open Calendar on iCloud.com and use the share button.
2. Enable **Public Calendar** (**Öffentlicher Kalender**) and copy the link via **Share Link…**.
   Sharing the calendar with family members at the same time keeps working as before.
3. Paste the `webcal://` link into `calendarUrl`. It is upgraded to HTTPS and fetched only on the server.

Without a link the integration shows clearly labelled sample data.

The public link is a read-only capability URL: anyone with it can read the calendar. The settings form
masks it, the render page sends it as a same-origin JSON `POST`, and it is never returned in the display
payload. Any other public HTTPS/Webcal iCalendar feed works as well; private or non-routable addresses
are rejected by the shared calendar transport.

## How entries become meals

| Calendar entry | Meal slot |
| --- | --- |
| Title prefix `Frühstück:`, `Breakfast:`, `Brunch:`, `☕` | Breakfast |
| Title prefix `Mittag:`, `Mittagessen:`, `Lunch:`, `☀️` | Lunch |
| Title prefix `Abend:`, `Abendessen:`, `Abendbrot:`, `Dinner:`, `🌙` | Dinner |
| Timed entry before 11:00 / 11:00–15:59 / from 16:00 | Breakfast / Lunch / Dinner |
| All-day entry without prefix | `allDayMeal` setting (dinner by default) |

Prefixes may also be written as `[Mittag] …` or `(Abend) …` and are removed from the displayed title.
Multi-day all-day entries (e.g. leftovers for two days) repeat on each day. Identical dishes in the
same slot are shown once.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `title` | `""` | Heading; empty uses "Essensplan" / "Meal plan". |
| `calendarUrl` | `""` | iCloud public calendar link (`webcal://` or `https://`). |
| `days` | `5` | Days to show (1–14). |
| `startDay` | `today` | `today` or `monday` of the current week. |
| `slots` | `lunch-dinner` | Slots shown as "not planned yet" when empty: `lunch-dinner`, `dinner`, `all`, `none`. |
| `allDayMeal` | `dinner` | Slot for all-day entries without prefix: `dinner`, `lunch`, `breakfast`, `other`. |
| `timeZone` | `Europe/Berlin` | IANA time zone for "today" and timed entries. |
| `iconStyle` | `color` | Meal symbols: `color` (orange sun, blue moon, green cup) or `mono` (symbols in the text color). |
| `showHeader` | `true` | Show title and sample label. |
| `showLegend` | `true` | Show the meal legend (e.g. "Mittag" / "Abend") in the footer. The footer disappears when it has nothing else to show. |

`sampleData` and `now` are available for previews and screenshot variants.

## Design notes

- Today's date sits on an orange block (dithered on Spectra 6, black numerals); colored themes use
  their accent instead.
- Meal symbols have no background: a sun for lunch, a moon for dinner, a cup for breakfast, either
  colored or in the text color (`iconStyle`). On dark themes the blue moon gets a light outline.
  The footer legend names each slot, so color is never the only cue.

## Local verification

```sh
node --test tests/meal-plan-calendar.test.mjs
npx paperlesspaper-openintegration check applications/meal-plan-calendar/config.json
npx paperlesspaper-openintegration render applications/meal-plan-calendar/config.json --viewport 800x480 --output /tmp/meal-plan-landscape.png
npx paperlesspaper-openintegration render applications/meal-plan-calendar/config.json --viewport 480x800 --output /tmp/meal-plan-portrait.png
npx paperlesspaper-openintegration render applications/meal-plan-calendar/config.json --viewport 1600x1200 --output /tmp/meal-plan-l-landscape.png
npx paperlesspaper-openintegration render applications/meal-plan-calendar/config.json --viewport 1200x1600 --output /tmp/meal-plan-l-portrait.png
```
