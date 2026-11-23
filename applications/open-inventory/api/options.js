import { fetchInventory } from './data.js';

export default async function handler({ query, request }) {
  if (request?.method !== 'POST') throw new Error('Use a JSON POST request.');
  const items = await fetchInventory(query);
  return { items: items.map(({ resourceId, name, sku }) => ({ id: resourceId, name, sku })) };
}
