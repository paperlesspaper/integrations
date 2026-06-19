const userAgent = "paperlesspaper-openintegrations/0.1.0";

function stringValue(value) {
  return String(value || "").trim();
}

function settingOrEnv(value, envName) {
  return stringValue(value) || stringValue(process.env[envName]);
}

function isEnabled(value) {
  return value === true || value === "true" || value === "1";
}

function normalizeImmichBaseUrl(input) {
  const raw = stringValue(input);
  if (!raw) {
    throw new Error("Immich server URL is required.");
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Immich server URL must be a valid http(s) URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Immich server URL must use http or https.");
  }

  url.hash = "";
  url.search = "";

  const cleanPath = url.pathname.replace(/\/+$/, "");
  url.pathname = cleanPath.endsWith("/api") ? cleanPath : `${cleanPath}/api`;

  return url.toString().replace(/\/+$/, "");
}

function authHeaders(apiKey) {
  const key = stringValue(apiKey);
  if (!key) {
    throw new Error("Immich API key is required.");
  }

  return {
    "x-api-key": key,
    "user-agent": userAgent,
  };
}

function endpointUrl(baseUrl, path) {
  return `${baseUrl}${path}`;
}

async function readError(response) {
  const text = await response.text().catch(() => "");
  if (!text) {
    return `Immich request failed with ${response.status}`;
  }

  try {
    const parsed = JSON.parse(text);
    return parsed.message || parsed.error || text.slice(0, 240);
  } catch {
    return text.slice(0, 240);
  }
}

async function fetchJson(baseUrl, path, apiKey, body) {
  const response = await fetch(endpointUrl(baseUrl, path), {
    method: "POST",
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: {
      ...authHeaders(apiKey),
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

async function fetchGetJson(baseUrl, path, apiKey) {
  const response = await fetch(endpointUrl(baseUrl, path), {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: {
      ...authHeaders(apiKey),
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}

async function fetchImage(baseUrl, assetId, apiKey, query) {
  const size = ["thumbnail", "preview", "fullsize", "original"].includes(query.imageSize)
    ? query.imageSize
    : "preview";
  const edited = isEnabled(query.preferEdited);
  const path =
    size === "original"
      ? `/assets/${encodeURIComponent(assetId)}/original`
      : `/assets/${encodeURIComponent(assetId)}/thumbnail`;
  const params = new URLSearchParams();

  if (edited) {
    params.set("edited", "true");
  }

  if (size !== "original") {
    params.set("size", size);
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await fetch(endpointUrl(baseUrl, `${path}${suffix}`), {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
    headers: {
      ...authHeaders(apiKey),
      accept: "image/avif,image/webp,image/jpeg,image/png,image/*,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const bytes = Buffer.from(await response.arrayBuffer());

  return `data:${contentType.split(";")[0]};base64,${bytes.toString("base64")}`;
}

function uuidList(value) {
  return stringValue(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function dateFilter(value, endOfDay = false) {
  const raw = stringValue(value);
  if (!raw) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date filter: ${raw}`);
  }

  return date.toISOString();
}

function searchBody(query) {
  const body = {
    type: "IMAGE",
    size: 1,
    withExif: true,
  };
  const albumIds = uuidList(query.albumId);
  const takenAfter = dateFilter(query.takenAfter);
  const takenBefore = dateFilter(query.takenBefore, true);
  const visibility = stringValue(query.visibility || "timeline");

  if (albumIds.length) {
    body.albumIds = albumIds;
  }

  if (isEnabled(query.onlyFavorites)) {
    body.isFavorite = true;
  }

  if (visibility && visibility !== "all") {
    body.visibility = visibility;
  }

  if (takenAfter) {
    body.takenAfter = takenAfter;
  }

  if (takenBefore) {
    body.takenBefore = takenBefore;
  }

  return body;
}

async function findAsset(baseUrl, query) {
  const selection = stringValue(query.selection || "random");
  const body = searchBody(query);

  if (selection === "newest" || selection === "oldest") {
    const response = await fetchJson(baseUrl, "/search/metadata", query.apiKey, {
      ...body,
      order: selection === "oldest" ? "asc" : "desc",
      page: 1,
    });
    const items = Array.isArray(response?.assets?.items) ? response.assets.items : [];
    if (!items.length) {
      throw new Error("No matching Immich photos were found.");
    }
    return {
      asset: items[0],
      matchCount: response.assets.count || items.length,
      total: response.assets.total,
    };
  }

  const items = await fetchJson(baseUrl, "/search/random", query.apiKey, body);
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("No matching Immich photos were found.");
  }

  return {
    asset: items[0],
    matchCount: items.length,
    total: undefined,
  };
}

async function albumInfo(baseUrl, query) {
  const albumId = uuidList(query.albumId)[0];
  if (!albumId) {
    return undefined;
  }

  try {
    return await fetchGetJson(baseUrl, `/albums/${encodeURIComponent(albumId)}`, query.apiKey);
  } catch {
    return undefined;
  }
}

function compactParts(parts) {
  return parts.map((part) => stringValue(part)).filter(Boolean);
}

function locationFromExif(exif) {
  if (!exif || typeof exif !== "object") {
    return "";
  }

  return compactParts([exif.city, exif.state, exif.country]).join(", ");
}

function cameraFromExif(exif) {
  if (!exif || typeof exif !== "object") {
    return "";
  }

  return compactParts([exif.make, exif.model]).join(" ");
}

function captionFromAsset(asset) {
  return (
    stringValue(asset?.exifInfo?.description) ||
    stringValue(asset?.originalFileName) ||
    "Immich photo"
  );
}

function shapePhoto(asset, album, imageDataUrl, match) {
  const exif = asset.exifInfo && typeof asset.exifInfo === "object" ? asset.exifInfo : {};

  return {
    id: asset.id,
    caption: captionFromAsset(asset),
    originalFileName: stringValue(asset.originalFileName),
    takenAt:
      stringValue(exif.dateTimeOriginal) ||
      stringValue(asset.localDateTime) ||
      stringValue(asset.fileCreatedAt) ||
      stringValue(asset.createdAt),
    location: locationFromExif(exif),
    camera: cameraFromExif(exif),
    width: asset.width || exif.exifImageWidth || null,
    height: asset.height || exif.exifImageHeight || null,
    albumName: album?.albumName || "",
    albumAssetCount: album?.assetCount,
    isFavorite: Boolean(asset.isFavorite),
    imageDataUrl,
    matchCount: match.matchCount,
    total: match.total,
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler({ query }) {
  const requestQuery = {
    ...query,
    serverUrl: settingOrEnv(query.serverUrl, "IMMICH_SERVER_URL"),
    apiKey: settingOrEnv(query.apiKey, "IMMICH_API_KEY"),
  };
  const baseUrl = normalizeImmichBaseUrl(requestQuery.serverUrl);
  const match = await findAsset(baseUrl, requestQuery);
  const [album, imageDataUrl] = await Promise.all([
    albumInfo(baseUrl, requestQuery),
    fetchImage(baseUrl, match.asset.id, requestQuery.apiKey, requestQuery),
  ]);

  return shapePhoto(match.asset, album, imageDataUrl, match);
}
