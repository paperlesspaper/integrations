import { bool, number, text, required, getJson, envelope, retrievedAt } from '../../_shared/dashboard-api.js';

const languageLookup = { de: 'de-DE', en: 'en-US', fr: 'fr-FR', es: 'es-ES', it: 'it-IT' };
export function normalizeMovie(movie) {
  if (!movie || typeof movie !== 'object') throw new Error('Invalid TMDB movie');
  return {
    id: movie.id, title: text(movie.title).slice(0, 300), overview: text(movie.overview).slice(0, 4000),
    releaseDate: /^\d{4}-\d{2}-\d{2}$/.test(movie.release_date || '') && Number.isFinite(Date.parse(movie.release_date)) && new Date(movie.release_date).toISOString().slice(0, 10) === movie.release_date ? movie.release_date : '',
    poster: /^\/[a-zA-Z0-9_.-]+\.(?:jpg|png|webp)$/.test(movie.poster_path || '') ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
  };
}
export async function loadMovies(query = {}, json = getJson) {
  const sample = bool(query.sampleData), count = Math.floor(number(query.count, 6, 1, 6));
  const region = (text(query.region) || 'DE').toUpperCase();
  if (!/^[A-Z]{2}$/.test(region)) throw new Error('Use a two-letter country code');
  const language = languageLookup[text(query.language).split('-')[0]] || 'en-US';
  if (sample) {
    const de = language.startsWith('de');
    const names = de ? ['Die letzte Umlaufbahn', 'Ein Sommer am Meer', 'Hinter den Bergen', 'Die Stadt bei Nacht', 'Der große Aufbruch', 'Ein neuer Morgen'] : ['The Last Orbit', 'A Summer by the Sea', 'Beyond the Mountains', 'The City at Night', 'The Great Departure', 'A New Morning'];
    const movies = names.slice(0, count).map((title, i) => ({ id: i + 1, title, releaseDate: `2026-10-${String(1 + i * 3).padStart(2, '0')}`, poster: `./assets/demo-poster-${i + 1}.svg`, overview: de ? 'Eine unerwartete Begegnung führt auf eine Reise voller neuer Perspektiven. Eine Geschichte über Mut, Freundschaft und die kleinen Momente, die alles verändern.' : 'An unexpected encounter begins a journey full of new perspectives. A story about courage, friendship and the small moments that change everything.' }));
    return envelope({ movies, region }, true, 'TMDB');
  }
  // Keep the existing paperlesspaper-apps credential and upstream endpoint during migration.
  const key = required(text(query.apiKey) || text(process.env.TMDB_API_KEY), 'TMDB API key');
  const params = new URLSearchParams({ api_key: key, language, region, page: '1' });
  const data = await json(`https://api.themoviedb.org/3/movie/upcoming?${params}`, { ttl: 6 * 60 * 60 * 1000 });
  if (!Array.isArray(data?.results)) throw new Error('Invalid TMDB upcoming response');
  return envelope({ movies: data.results.slice(0, count).map(normalizeMovie), region }, false, 'TMDB', retrievedAt(data));
}
export default async function handler({ query }) { return loadMovies(query); }
