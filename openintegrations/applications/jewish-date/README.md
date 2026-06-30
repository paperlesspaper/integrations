# Jewish Date

Shows the current Jewish/Hebrew calendar date on a paperlesspaper display. The integration is inspired by [MMM-JewishDate](https://github.com/yohaybn/MMM-JewishDate), but it renders the date locally with the browser's Hebrew calendar support instead of fetching Hebcal at render time.

## Links

- [config.json](./config.json)

## Settings

- `title`: heading shown above the date.
- `date`: optional fixed Gregorian date in `YYYY-MM-DD`; leave empty for today.
- `displayStyle`: show the Hebrew date, the transliterated date, or both.
- `afterSunset`: use the next Hebrew date for displays that are updated after local sunset.
- `showGregorian`: show the Gregorian date line.
- `showWeekday`: show the weekday line.
- `showDetails`: show compact details such as Hebrew day, month/year, Omer, Rosh Chodesh, and sunset mode.

## Icon

The application icon is stored at [assets/icon.png](./assets/icon.png). It is a transparent typographic Hebrew wordmark reading `תאריך עברי` ("Hebrew date"). The source PNG is stored at [assets/icon-source.png](./assets/icon-source.png).

### Logo Text

```txt
תאריך
עברי
```

## Notes

The original MagicMirror module displays `data.hebrew` from Hebcal and refreshes hourly. This OpenIntegration keeps the same core purpose, then adds eInk-oriented layout, localization, display toggles, and deterministic local rendering.
