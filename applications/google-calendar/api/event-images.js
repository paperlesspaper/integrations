import { resolvePageImages } from '../../_shared/event-image-resolver.js';

export default async function eventImages({query}) {
  const urls=Array.isArray(query?.urls)?query.urls.filter(u=>typeof u==='string'&&u.length<=4096).slice(0,3):[];
  const results=await Promise.all([...new Set(urls)].map(resolvePageImages));
  return {images:results.flat()};
}
