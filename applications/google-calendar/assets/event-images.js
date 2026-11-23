// Provider adapter: collect explicit image sources before considering linked pages.
export function webUrl(value, base) {
  if (typeof value !== 'string' || value.length > 4096) return '';
  try {
    const url = new URL(value.trim(), base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
    url.hash = '';
    return url.href;
  } catch { return ''; }
}

const imagePath = url => /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(new URL(url).pathname);
const privateService = url => /^(?:calendar|meet|drive|docs|accounts)\.google\.com$/i.test(new URL(url).hostname);

export function collectEventImageSources(event, { document = globalThis.document, automatic = true } = {}) {
  const images = [], pages = [], seen = new Set();
  const add = (value, source, image = false) => {
    const url = webUrl(value);
    if (!url || privateService(url)) return;
    const isImage = image || imagePath(url);
    if (seen.has(url)) {
      // A MIME-typed attachment can clarify a previously ambiguous extensionless link.
      const pageIndex = pages.indexOf(url);
      if (isImage && pageIndex !== -1) {
        pages.splice(pageIndex, 1);
        images.push({ url, source });
      }
      return;
    }
    seen.add(url);
    if (isImage) images.push({ url, source });
    else if (automatic) pages.push(url);
  };
  if (automatic) {
    add(event.imageUrl, 'event-image', true);
    add(event.extendedProperties?.private?.ppImageUrl, 'event-image', true);
    add(event.extendedProperties?.shared?.ppImageUrl, 'event-image', true);
  }
  const raw = String(event.description || '').slice(0, 32000);
  const template = document.createElement('template');
  template.innerHTML = raw;
  template.content.querySelectorAll('script,style,template').forEach(node => node.remove());
  for (const img of template.content.querySelectorAll('img')) {
    add(img.getAttribute('src'), 'description-image', true);
    add(img.getAttribute('data-src'), 'description-image', true);
    // Ignore data URLs in srcset; explicit HTTP(S) candidates only.
    for (const match of String(img.getAttribute('srcset') || '').matchAll(/(?:^|,)\s*(https?:\/\/[^\s,]+)/gi)) {
      add(match[1], 'description-image', true);
    }
  }
  for (const match of raw.matchAll(/!\[[^\]]*\]\(\s*(https?:\/\/[^\s)]+)(?:\s+[^)]*)?\)/gi)) add(match[1], 'description-image', true);
  for (const link of template.content.querySelectorAll('a[href]')) add(link.getAttribute('href'), 'description-link');
  template.content.querySelectorAll('br').forEach(node => node.replaceWith(' '));
  template.content.querySelectorAll('p,div,li').forEach(node => node.append(' '));
  const text = template.content.textContent || '';
  for (const match of text.matchAll(/https?:\/\/[^\s<>"']+/gi)) add(match[0].replace(/[.,;!?)\]]+$/, ''), 'description-link');
  if (automatic) {
    for (const attachment of (Array.isArray(event.attachments) ? event.attachments : []).slice(0, 10)) {
      // Google Drive viewer links require a separate authorized Drive integration.
      if (/^image\//i.test(attachment.mimeType || '')) add(attachment.fileUrl, 'image-attachment', true);
    }
    add(event.source?.url, 'event-website');
    add(event.url, 'event-website');
  }
  return { images: images.slice(0, 12), pages: pages.slice(0, 3) };
}

const imageCache = new Map();
async function canLoadImage(url, { signal, timeoutMs = 1800, ImageClass = globalThis.Image } = {}) {
  if (signal?.aborted) return false;
  const hit = imageCache.get(url);
  if (hit && hit.until > Date.now()) return hit.valid;
  return new Promise(resolve => {
    const img = new ImageClass();
    let done = false;
    const finish = valid => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      img.onload = img.onerror = null;
      if (!signal?.aborted) {
        if (imageCache.size >= 200) imageCache.delete(imageCache.keys().next().value);
        imageCache.set(url, { valid, until: Date.now() + (valid ? 900000 : 30000) });
      }
      if (!valid) img.src = '';
      resolve(valid);
    };
    const abort = () => finish(false);
    const timer = setTimeout(abort, timeoutMs);
    signal?.addEventListener('abort', abort, { once:true });
    img.referrerPolicy = 'no-referrer';
    img.onload = () => finish(img.naturalWidth >= 64 && img.naturalHeight >= 48);
    img.onerror = abort;
    img.src = url;
  });
}

export async function resolveEventImage(sources, {
  signal, fetchImpl = globalThis.fetch, loadImage = canLoadImage,
  endpoint = new URL('../api/event-images', import.meta.url).href,
} = {}) {
  const tryImages = async candidates => {
    for (const candidate of candidates) {
      if (signal?.aborted) break;
      const url = webUrl(candidate.url);
      if (url && await loadImage(url, { signal })) return { ...candidate, url };
    }
    return null;
  };
  const direct = await tryImages(sources.images);
  if (direct || !sources.pages.length || signal?.aborted) return direct;
  try {
    const response = await fetchImpl(endpoint, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ urls:sources.pages }), signal,
    });
    if (!response.ok) return null;
    const data = await response.json();
    return await tryImages(Array.isArray(data.images) ? data.images.slice(0, 18) : []);
  } catch { return null; }
}

export async function enrichEventImages(events, { signal, automatic = true, resolve = resolveEventImage } = {}) {
  let next = 0;
  // All workers share the caller's render deadline and cancellation signal.
  await Promise.all(Array.from({length:Math.min(4, events.length)}, async () => {
    while (next < events.length && !signal?.aborted) {
      const event = events[next++];
      const sources = event.imageSources;
      if (!sources) continue;
      const image = await resolve({ images:sources.images, pages:automatic ? sources.pages : [] }, { signal });
      event.imageUrl = image?.url || '';
      event.imageSource = image?.source || '';
    }
  }));
}
