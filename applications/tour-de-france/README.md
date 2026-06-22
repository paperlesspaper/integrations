# Tour de France

Displays the active, next, or selected Tour de France 2026 stage on a paperlesspaper display.

## Data source

There is no documented public Tour de France API. The integration uses the official `letour.fr` pages as a best-effort source:

- `/en/overall-route` for the route table when the markup is available
- `/en/stage-N` for profile, map, elevation, and climb details
- `/en/rankings` for general ranking data, only when it clearly advertises 2026 rankings

The 2026 route table is embedded as a fallback so the display keeps rendering if the official site changes its HTML or the ranking page still points to a previous edition.
