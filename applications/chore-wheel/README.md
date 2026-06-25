# Chore Wheel

Assigns household chores to members on a paperlesspaper display. Members and chores are entered as comma- or newline-separated lists, then the renderer deterministically rotates assignments by day or ISO week.

The renderer is browser-only and does not call external services.

## Links

- [Demo](https://integrations.paperlesspaper.de/chore-wheel/run)
- [config.json](./config.json)

## Screenshots

The manifest includes screenshot paths for `800x480` and `480x800`, but screenshot files are not generated yet.

## Settings

- `title`: heading above the wheel.
- `members`: household members separated by commas or new lines.
- `chores`: chores separated by commas or new lines.
- `rotation`: choose `daily` or `weekly`.
- `seed`: change this to reshuffle the deterministic rotation.
- `showNext`: preview the next day or week assignment under each chore.

## Local URLs

```txt
http://localhost:3000/chore-wheel/
http://localhost:3000/chore-wheel/config.json
```
