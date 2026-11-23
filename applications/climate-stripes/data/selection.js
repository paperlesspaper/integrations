export const styles = {
  stripes: 'display_link',
  labelled: 'download_link_label',
  bars: 'download_link_bar',
  'bars-scale': 'download_link_bar_labels',
};

export function selectChart(locations, settings) {
  const location = locations.find((item) => item.id === settings.location);
  if (!location) throw new Error('Unknown climate stripes location');
  if (!Object.hasOwn(styles, settings.style)) throw new Error('Unknown climate stripes style');
  const path = location.urls[styles[settings.style]];
  if (typeof path !== 'string' || !path.startsWith('/stripes/') || !path.endsWith('.png')) {
    throw new Error('Invalid climate chart URL');
  }
  return { ...location, imageUrl: new URL(path, 'https://showyourstripes.info').href };
}
