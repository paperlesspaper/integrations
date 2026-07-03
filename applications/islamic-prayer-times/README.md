# Islamic Prayer Times

Displays Islamic prayer times for a configured location on a paperlesspaper eInk display. It is inspired by MagicMirror prayer modules such as [MMM-IPT](https://github.com/uok825/MMM-IPT), [MMM-PrayerTime](https://github.com/slametps/MMM-PrayerTime), and [waktudoa](https://github.com/TeeJe/waktudoa), but is packaged as a paperlesspaper Open Integration.

## Features

- Local prayer-time calculation from latitude, longitude, timezone, elevation, calculation method, and Asr school.
- Supported methods include Muslim World League, ISNA, Egyptian Survey, Umm al-Qura, Karachi, Tehran, Diyanet, Singapore, Kuwait, Qatar, France, Russia, and Dubai.
- Shows today, the next prayer, optional countdown, optional iqamah time, Hijri date, and tomorrow's Fajr.
- Optional per-prayer minute offsets for local tuning.
- Light/dark paperlesspaper color themes and responsive portrait/landscape layouts.

## Install

Local development manifest:

```txt
http://localhost:3000/islamic-prayer-times/config.json
```

Production manifest:

```txt
https://integrations.paperlesspaper.de/islamic-prayer-times/config.json
```

## Settings

The built-in settings schema covers:

- `latitude`, `longitude`, `elevation`, and `timeZone`
- `calculationMethod`
- `asrSchool`
- `highLatitudeRule`
- `timeFormat`
- `showSunrise`, `showHijriDate`, `showCountdown`, `showIqamah`, and `showTomorrow`
- Minute offsets for Fajr, sunrise, Dhuhr, Asr, Maghrib, and Isha

The render is deterministic and does not require an API key.
