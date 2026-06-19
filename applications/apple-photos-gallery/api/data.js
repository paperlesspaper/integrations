import crypto from 'node:crypto';

const tokenToOriginCache = new Map();

function extractTokenFromInput(input) {
  const trimmed = String(input || '').trim();
  if (!trimmed) {
    return '';
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return trimmed;
  }

  const url = new URL(trimmed);
  if (url.hash && url.hash.length > 1) {
    return url.hash.slice(1);
  }

  const parts = url.pathname.split('/').filter(Boolean);
  if (
    url.hostname.endsWith('icloud.com') &&
    parts[0] === 'sharedalbum' &&
    parts.length <= 2
  ) {
    throw new Error(
      'The iCloud shared album URL is missing its # token. Paste only B1d5Uzl7VAmYnH, or encode # as %23 when using albumUrl in a browser URL.',
    );
  }

  return parts[parts.length - 1] || '';
}

function parseOriginsCsv(value) {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function candidateOriginsForToken(token) {
  const configured = parseOriginsCsv(process.env.APPLE_PHOTOS_SHAREDSTREAMS_ORIGINS);
  const cached = tokenToOriginCache.get(token);
  const origins = [];

  if (cached) {
    origins.push(cached);
  }
  origins.push(...configured);

  if (origins.length > 0) {
    return Array.from(new Set(origins));
  }

  return [
    'https://p01-sharedstreams.icloud.com',
    'https://p02-sharedstreams.icloud.com',
    'https://p03-sharedstreams.icloud.com',
    'https://p04-sharedstreams.icloud.com',
    'https://p05-sharedstreams.icloud.com',
  ];
}

function webstreamUrlFor(origin, token) {
  return `${origin}/${encodeURIComponent(token)}/sharedstreams/webstream`;
}

function webasseturlsUrlFor(origin, token) {
  return `${origin}/${encodeURIComponent(token)}/sharedstreams/webasseturls`;
}

function photoDateFromObject(obj) {
  if (typeof obj.dateCreated === 'string') {
    return obj.dateCreated;
  }
  if (typeof obj.createdAt === 'string') {
    return obj.createdAt;
  }
  if (typeof obj.addedDate === 'string') {
    return obj.addedDate;
  }
  return undefined;
}

function collectPhotoGuids(value) {
  const results = [];
  const seen = new Set();
  const queue = [value];

  while (queue.length) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    if (Array.isArray(current)) {
      for (const item of current) {
        queue.push(item);
      }
      continue;
    }

    if (typeof current === 'object') {
      const obj = current;
      const guid =
        (typeof obj.photoGuid === 'string' && obj.photoGuid) ||
        (typeof obj.photoGUID === 'string' && obj.photoGUID) ||
        (typeof obj.guid === 'string' && obj.guid) ||
        '';

      if (guid && !seen.has(guid)) {
        let preferredChecksum;
        const derivatives = obj.derivatives;

        if (derivatives && typeof derivatives === 'object') {
          let bestSize = -1;
          for (const [sizeKey, derivativeValue] of Object.entries(derivatives)) {
            const size = Number.parseInt(sizeKey, 10);
            if (!Number.isFinite(size) || !derivativeValue || typeof derivativeValue !== 'object') {
              continue;
            }

            const { checksum } = derivativeValue;
            if (typeof checksum !== 'string' || !checksum) {
              continue;
            }

            if (size > bestSize) {
              bestSize = size;
              preferredChecksum = checksum;
            }
          }
        }

        seen.add(guid);
        results.push({
          guid,
          caption: typeof obj.caption === 'string' ? obj.caption : undefined,
          createdAt: photoDateFromObject(obj),
          preferredChecksum,
        });
      }

      for (const nested of Object.values(obj)) {
        queue.push(nested);
      }
    }
  }

  return results;
}

function pickPhoto(photos, query) {
  const selection = typeof query.selection === 'string' ? query.selection : 'random';

  if (selection === 'number') {
    const requested = Math.floor(Number(query.photoNumber || 1));
    if (!Number.isFinite(requested) || requested < 1 || requested > photos.length) {
      throw new Error(`Photo number must be between 1 and ${photos.length}`);
    }
    return { photo: photos[requested - 1], index: requested };
  }

  const index = crypto.randomInt(0, photos.length);
  return { photo: photos[index], index: index + 1 };
}

function buildBestAssetUrl(assetData, preferredChecksum) {
  if (!assetData || typeof assetData !== 'object') {
    return undefined;
  }

  const { locations, items } = assetData;
  if (!locations || typeof locations !== 'object' || !items || typeof items !== 'object') {
    return undefined;
  }

  const pickItem = (checksum) => {
    const item = items[checksum];
    if (!item || typeof item !== 'object') {
      return undefined;
    }

    const urlPath = item.url_path;
    const urlLocation = item.url_location;
    if (typeof urlPath !== 'string' || !urlPath || typeof urlLocation !== 'string' || !urlLocation) {
      return undefined;
    }

    const location = locations[urlLocation];
    if (!location || typeof location !== 'object') {
      return `https://${urlLocation}${urlPath}`;
    }

    const scheme = typeof location.scheme === 'string' ? location.scheme : 'https';
    const hosts = Array.isArray(location.hosts) ? location.hosts : [];
    const host = typeof hosts[0] === 'string' ? hosts[0] : urlLocation;
    return `${scheme}://${host}${urlPath}`;
  };

  if (preferredChecksum) {
    const url = pickItem(preferredChecksum);
    if (url) {
      return url;
    }
  }

  for (const checksum of Object.keys(items)) {
    const url = pickItem(checksum);
    if (url) {
      return url;
    }
  }

  return undefined;
}

function collectHttpUrls(value) {
  const urls = [];
  const seen = new Set();
  const queue = [value];

  while (queue.length) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    if (typeof current === 'string') {
      if ((current.startsWith('http://') || current.startsWith('https://')) && !seen.has(current)) {
        seen.add(current);
        urls.push(current);
      }
      continue;
    }

    if (Array.isArray(current)) {
      for (const item of current) {
        queue.push(item);
      }
      continue;
    }

    if (typeof current === 'object') {
      for (const nested of Object.values(current)) {
        queue.push(nested);
      }
    }
  }

  return urls;
}

async function parseRedirectHost(response) {
  const headerHost = response.headers.get('x-apple-mme-host');
  if (headerHost) {
    return headerHost;
  }

  try {
    const body = await response.clone().json();
    return typeof body?.['X-Apple-MMe-Host'] === 'string' ? body['X-Apple-MMe-Host'] : undefined;
  } catch {
    return undefined;
  }
}

async function tryFetchJson(url, redirectDepth = 0) {
  const getResponse = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
    headers: {
      accept: 'application/json,text/plain,*/*',
      'user-agent': 'paperlesspaper-openintegrations/0.1.0',
    },
  });

  if (getResponse.ok) {
    return { data: await getResponse.json(), finalUrl: url };
  }

  const postResponse = await fetch(url, {
    method: 'POST',
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
    headers: {
      accept: 'application/json,text/plain,*/*',
      'content-type': 'application/json',
      'user-agent': 'paperlesspaper-openintegrations/0.1.0',
    },
    body: JSON.stringify({ streamCtag: null }),
  });

  if (postResponse.status === 330 && redirectDepth < 3) {
    const host = await parseRedirectHost(postResponse);
    if (host) {
      const next = new URL(url);
      next.protocol = 'https:';
      next.host = host;
      return tryFetchJson(next.toString(), redirectDepth + 1);
    }
  }

  if (!postResponse.ok) {
    const text = await postResponse.text().catch(() => '');
    throw new Error(`Apple shared album request failed (${postResponse.status}): ${text.slice(0, 200)}`);
  }

  return { data: await postResponse.json(), finalUrl: url };
}

async function postJsonWithShardRedirect(url, payload, redirectDepth = 0) {
  const response = await fetch(url, {
    method: 'POST',
    cache: 'no-store',
    signal: AbortSignal.timeout(20_000),
    headers: {
      accept: 'application/json,text/plain,*/*',
      'content-type': 'application/json',
      'user-agent': 'paperlesspaper-openintegrations/0.1.0',
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 330 && redirectDepth < 3) {
    const host = await parseRedirectHost(response);
    if (host) {
      const next = new URL(url);
      next.protocol = 'https:';
      next.host = host;
      return postJsonWithShardRedirect(next.toString(), payload, redirectDepth + 1);
    }
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Asset URL request failed (${response.status}): ${text.slice(0, 200)}`);
  }

  return { data: await response.json(), finalUrl: url };
}

async function fetchAlbum(token) {
  const originCandidates = candidateOriginsForToken(token);
  let webstreamData;
  let resolvedOrigin;
  let lastError;

  for (const origin of originCandidates) {
    try {
      const result = await tryFetchJson(webstreamUrlFor(origin, token));
      webstreamData = result.data;
      resolvedOrigin = new URL(result.finalUrl).origin;
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!webstreamData) {
    throw lastError instanceof Error ? lastError : new Error('Unable to fetch album feed');
  }

  if (resolvedOrigin) {
    tokenToOriginCache.set(token, resolvedOrigin);
  }

  const photos = collectPhotoGuids(webstreamData);
  if (photos.length === 0) {
    throw new Error('Album feed loaded, but no photos were discovered.');
  }

  return { photos, webstreamData, originCandidates, resolvedOrigin };
}

async function resolveImageUrl({ token, photo, webstreamData, originCandidates, resolvedOrigin }) {
  const assetOrigins = resolvedOrigin
    ? Array.from(new Set([resolvedOrigin, ...originCandidates]))
    : originCandidates;
  let assetData;
  let lastError;

  for (const origin of assetOrigins) {
    try {
      const result = await postJsonWithShardRedirect(webasseturlsUrlFor(origin, token), {
        photoGuids: [photo.guid],
      });
      assetData = result.data;
      resolvedOrigin = new URL(result.finalUrl).origin;
      tokenToOriginCache.set(token, resolvedOrigin);
      break;
    } catch (error) {
      lastError = error;
    }
  }

  const imageUrlFromAssets = buildBestAssetUrl(assetData, photo.preferredChecksum);
  const candidateUrls = collectHttpUrls(webstreamData).filter((url) => !url.includes('/sharedalbum/'));
  const imageUrl =
    imageUrlFromAssets ||
    candidateUrls.find((url) => /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)) ||
    candidateUrls[0];

  if (!imageUrl) {
    throw lastError instanceof Error ? lastError : new Error('Unable to resolve an image URL');
  }

  return { imageUrl, resolvedOrigin };
}

export default async function handler({ query }) {
  const token =
    extractTokenFromInput(query.token || query.albumUrl || '') ||
    extractTokenFromInput(process.env.APPLE_PHOTOS_SHARED_ALBUM_URL || '');

  if (!token) {
    throw new Error('Missing albumUrl/token. Provide a public iCloud shared album URL or token.');
  }

  const album = await fetchAlbum(token);
  const { photo, index } = pickPhoto(album.photos, query);
  const { imageUrl, resolvedOrigin } = await resolveImageUrl({
    token,
    photo,
    webstreamData: album.webstreamData,
    originCandidates: album.originCandidates,
    resolvedOrigin: album.resolvedOrigin,
  });

  return {
    imageUrl,
    guid: photo.guid,
    caption: photo.caption,
    createdAt: photo.createdAt,
    index,
    total: album.photos.length,
    token,
    origin: resolvedOrigin || album.resolvedOrigin,
  };
}
