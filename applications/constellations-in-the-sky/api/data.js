export default async function handler() {
  return {
    title: "Constellations in the Sky",
    source: "VirtualSky local catalogue",
    sourceUrl: "https://github.com/slowe/VirtualSky",
    updatedAt: new Date().toISOString(),
    features: [
      "location-aware star projection",
      "constellation lines and labels",
      "optional IAU constellation boundaries",
      "optional Milky Way outline",
      "optional planet ephemerides"
    ]
  };
}
