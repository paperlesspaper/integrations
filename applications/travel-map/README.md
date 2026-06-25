# Travel Map

Travel Map shows a personal visited map for an eInk frame. The custom settings page lets you switch between world countries, US states, and German Bundesländer, then click regions or use the searchable list to mark them as visited and add the year.

Visited regions can be colored by year, shown in one selected color, or shaded by year from one selected color. The frame can also show a compact `visited/total` counter and a year legend.

## Data Sources

- Countries: `world-atlas`, based on Natural Earth public domain data.
- US states: `us-atlas`, based on U.S. Census cartographic boundaries.
- German Bundesländer: `deutschlandGeoJSON`, derived from DIVA-GIS administrative boundaries.
- Rendering helpers: `d3` and `topojson-client`, both vendored as static browser bundles.
