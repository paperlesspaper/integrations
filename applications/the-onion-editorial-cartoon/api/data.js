const cartoonsApiUrl = 'https://theonion.com/wp-json/wp/v2/posts?categories=977&per_page=20&_embed=1';

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'paperlesspaper-openintegrations/0.1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`The Onion request failed with ${response.status}`);
  }

  return response.json();
}

function decodeHtml(value = '') {
  return String(value)
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripHtml(value = '') {
  return decodeHtml(String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function bestEmbeddedImage(post) {
  const media = post?._embedded?.['wp:featuredmedia']?.[0];
  const sizes = media?.media_details?.sizes || {};
  return (
    sizes.full?.source_url ||
    sizes['2048x2048']?.source_url ||
    sizes['1536x1536']?.source_url ||
    sizes.large?.source_url ||
    media?.source_url ||
    post?.jetpack_featured_media_url ||
    post?.yoast_head_json?.og_image?.[0]?.url ||
    ''
  );
}

function toPositiveInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : null;
}

function toNonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

function shapeCartoon(post) {
  const title = stripHtml(post?.title?.rendered || 'Editorial Cartoon');
  const image = bestEmbeddedImage(post);

  if (!image) {
    throw new Error(`No cartoon image found for "${title}"`);
  }

  return {
    id: post.id,
    title,
    image,
    alt: post?._embedded?.['wp:featuredmedia']?.[0]?.alt_text || title,
    url: post.link,
    date: post.date || post.date_gmt || '',
    excerpt: stripHtml(post?.excerpt?.rendered || post?.yoast_head_json?.og_description || ''),
    source: 'The Onion',
  };
}

export default async function handler({ query }) {
  const explicitId = toPositiveInteger(query.id);
  if (explicitId) {
    return shapeCartoon(await fetchJson(`https://theonion.com/wp-json/wp/v2/posts/${explicitId}?_embed=1`));
  }

  const cartoons = await fetchJson(cartoonsApiUrl);
  if (!Array.isArray(cartoons) || cartoons.length === 0) {
    throw new Error('No Onion editorial cartoons found');
  }

  const selection = typeof query.selection === 'string' ? query.selection : 'latest';
  if (selection === 'random') {
    return shapeCartoon(cartoons[Math.floor(Math.random() * cartoons.length)]);
  }

  if (selection === 'offset') {
    const offset = Math.min(toNonNegativeInteger(query.offset), cartoons.length - 1);
    return shapeCartoon(cartoons[offset]);
  }

  return shapeCartoon(cartoons[0]);
}
