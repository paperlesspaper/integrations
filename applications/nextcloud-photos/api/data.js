import crypto from "node:crypto";

const userAgent = "paperlesspaper-openintegrations/0.1.0";
const maxImageBytes = 25 * 1024 * 1024;

function stringValue(value) {
  return String(value ?? "").trim();
}

function normalizeServerUrl(input) {
  const raw = stringValue(input);
  if (!raw) {
    throw new Error("Nextcloud URL is required.");
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Nextcloud URL must be a valid http(s) URL.");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Nextcloud URL must use http or https.");
  }

  url.hash = "";
  url.search = "";
  url.pathname = url.pathname.replace(/\/+$/, "");
  return url.toString().replace(/\/+$/, "");
}

function credentials(query) {
  const username = stringValue(query.username);
  const userId = stringValue(query.userId) || username;
  const appPassword = stringValue(query.appPassword);
  const albumName = stringValue(query.albumName);

  if (!username || !appPassword || !albumName) {
    throw new Error("Nextcloud username, app password, and album name are required.");
  }

  return { username, userId, appPassword, albumName };
}

function authHeaders(username, appPassword) {
  return {
    authorization: `Basic ${Buffer.from(`${username}:${appPassword}`).toString("base64")}`,
    "user-agent": userAgent,
  };
}

function albumUrl(serverUrl, userId, albumName) {
  return `${serverUrl}/remote.php/dav/photos/${encodeURIComponent(userId)}/albums/${encodeURIComponent(albumName)}`;
}

function decodeXml(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/g, "&");
}

function extractTag(xml, localName) {
  const tag = localName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = xml.match(
    new RegExp(`<(?:[\\w.-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?${tag}>`, "i"),
  );
  return match ? decodeXml(match[1].replace(/<[^>]+>/g, "").trim()) : "";
}

function responseBlocks(xml) {
  return String(xml || "").match(
    /<(?:[\w.-]+:)?response\b[^>]*>[\s\S]*?<\/(?:[\w.-]+:)?response>/gi,
  ) || [];
}

function filenameFromHref(href) {
  const path = String(href || "").split("?")[0].replace(/\/+$/, "");
  const last = path.slice(path.lastIndexOf("/") + 1);
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

function parseAlbum(xml) {
  return responseBlocks(xml)
    .map((block) => {
      const href = extractTag(block, "href");
      const contentType = extractTag(block, "getcontenttype").split(";")[0].toLowerCase();
      const resourceType = block.match(/<(?:[\w.-]+:)?resourcetype\b[^>]*>[\s\S]*?<\/(?:[\w.-]+:)?resourcetype>/i)?.[0] || "";
      const isCollection = /<(?:[\w.-]+:)?collection\b/i.test(resourceType);
      const name = extractTag(block, "displayname") || filenameFromHref(href);
      const extensionLooksLikeImage = /\.(?:avif|bmp|gif|heic|heif|jpe?g|png|tiff?|webp)$/i.test(name);

      return {
        href,
        name,
        contentType,
        modifiedAt: extractTag(block, "getlastmodified"),
        size: Number.parseInt(extractTag(block, "getcontentlength"), 10) || null,
        fileId: extractTag(block, "fileid"),
        isCollection,
        isImage: contentType.startsWith("image/") || (!contentType && extensionLooksLikeImage),
      };
    })
    .filter((photo) => photo.href && !photo.isCollection && photo.isImage);
}

function requestXml() {
  return `<?xml version="1.0" encoding="utf-8" ?>
<d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns" xmlns:nc="http://nextcloud.org/ns">
  <d:prop>
    <d:displayname />
    <d:getlastmodified />
    <d:getcontentlength />
    <d:getcontenttype />
    <d:resourcetype />
    <oc:fileid />
    <nc:has-preview />
    <nc:photos-album-file-origin />
  </d:prop>
</d:propfind>`;
}

async function responseError(response, label) {
  const body = await response.text().catch(() => "");
  const concise = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 220);
  return `${label} failed with ${response.status}${concise ? `: ${concise}` : ""}`;
}

async function listAlbum(serverUrl, auth, albumName) {
  const url = albumUrl(serverUrl, auth.userId, albumName);
  const response = await fetch(url, {
    method: "PROPFIND",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
    headers: {
      ...authHeaders(auth.username, auth.appPassword),
      accept: "application/xml,text/xml",
      "content-type": "application/xml; charset=utf-8",
      depth: "1",
    },
    body: requestXml(),
  });

  if (!response.ok) {
    throw new Error(await responseError(response, "Nextcloud album request"));
  }

  const photos = parseAlbum(await response.text());
  if (!photos.length) {
    throw new Error(`No photos were found in the Nextcloud album “${albumName}”.`);
  }

  return photos;
}

function timestamp(photo) {
  const value = new Date(photo.modifiedAt).getTime();
  return Number.isFinite(value) ? value : 0;
}

function dailyIndex(albumName, length) {
  const day = new Date().toISOString().slice(0, 10);
  const hash = crypto.createHash("sha256").update(`${day}:${albumName}`).digest();
  return hash.readUInt32BE(0) % length;
}

function selectPhoto(photos, query, albumName) {
  const selection = stringValue(query.selection) || "daily";
  let ordered = [...photos];
  let index;

  if (selection === "newest" || selection === "oldest") {
    ordered.sort((a, b) => timestamp(a) - timestamp(b));
    index = selection === "newest" ? ordered.length - 1 : 0;
  } else if (selection === "number") {
    const requested = Number.parseInt(query.photoNumber, 10) || 1;
    if (requested < 1 || requested > ordered.length) {
      throw new Error(`Photo number must be between 1 and ${ordered.length}.`);
    }
    index = requested - 1;
  } else if (selection === "random") {
    index = crypto.randomInt(0, ordered.length);
  } else {
    index = dailyIndex(albumName, ordered.length);
  }

  return { photo: ordered[index], index: index + 1, count: ordered.length };
}

function safePhotoUrl(serverUrl, href) {
  const server = new URL(serverUrl);
  const photo = new URL(href, `${server.origin}/`);
  if (photo.origin !== server.origin) {
    throw new Error("Nextcloud returned a photo URL on a different server.");
  }
  return photo.toString();
}

async function fetchPhoto(serverUrl, auth, photo) {
  if (photo.size && photo.size > maxImageBytes) {
    throw new Error(`Selected photo is larger than the 25 MB limit (${photo.name}).`);
  }

  const response = await fetch(safePhotoUrl(serverUrl, photo.href), {
    method: "GET",
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
    headers: {
      ...authHeaders(auth.username, auth.appPassword),
      accept: "image/avif,image/webp,image/jpeg,image/png,image/*",
    },
  });

  if (!response.ok) {
    throw new Error(await responseError(response, "Nextcloud photo request"));
  }

  const contentType = (response.headers.get("content-type") || photo.contentType || "image/jpeg").split(";")[0];
  if (!contentType.toLowerCase().startsWith("image/")) {
    throw new Error("Nextcloud returned a non-image response for the selected photo.");
  }

  const contentLength = Number.parseInt(response.headers.get("content-length"), 10);
  if (contentLength > maxImageBytes) {
    throw new Error(`Selected photo is larger than the 25 MB limit (${photo.name}).`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > maxImageBytes) {
    throw new Error(`Selected photo is larger than the 25 MB limit (${photo.name}).`);
  }

  return `data:${contentType};base64,${bytes.toString("base64")}`;
}

function sampleSvg(_title, _subtitle, palette, scene) {
  const [sky, sun, ridge, foreground] = palette;
  const shapes = scene === "coast"
    ? `<path fill="${ridge}" d="M0 500 C240 410 410 560 640 440 C820 350 950 390 1200 300 V800 H0Z"/><path fill="${foreground}" d="M0 620 C250 560 450 690 720 560 C910 470 1050 490 1200 450 V800 H0Z"/>`
    : `<path fill="${ridge}" d="M0 610 245 310 420 490 650 180 920 520 1080 340 1200 500V800H0Z"/><path fill="${foreground}" d="M0 650 260 520 410 640 710 440 930 610 1200 480V800H0Z"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="${sky}"/><circle cx="910" cy="170" r="92" fill="${sun}"/>${shapes}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function sampleResponse(query) {
  const albumName = stringValue(query.albumName) || "Family Moments";
  const samples = [
    { name: "lake-morning.jpg", modifiedAt: "2026-06-14T08:24:00Z", imageDataUrl: sampleSvg("Lake morning", "A quiet start in the mountains", ["#6bb6df", "#ffd65a", "#355b76", "#183c48"], "mountains") },
    { name: "coastal-path.jpg", modifiedAt: "2026-06-28T17:40:00Z", imageDataUrl: sampleSvg("Coastal path", "Wind, sea, and a long horizon", ["#5fa9d2", "#fff0a6", "#447d94", "#244b38"], "coast") },
    { name: "alpine-evening.jpg", modifiedAt: "2026-07-05T19:12:00Z", imageDataUrl: sampleSvg("Alpine evening", "The last light above the valley", ["#e9a36b", "#fff1b0", "#6d596b", "#2c3f3e"], "mountains") },
    { name: "weekend-ridge.jpg", modifiedAt: "2026-07-10T13:05:00Z", imageDataUrl: sampleSvg("Weekend ridge", "High above the tree line", ["#78b5d1", "#ffe07b", "#4d6f7d", "#213d35"], "mountains") },
  ];
  const selected = selectPhoto(samples, query, albumName);
  return {
    source: "sample",
    albumName,
    count: selected.count,
    index: selected.index,
    photo: selected.photo,
    updatedAt: new Date().toISOString(),
  };
}

export default async function handler({ query }) {
  const connectionFields = [query.serverUrl, query.username, query.userId, query.appPassword].map(stringValue);
  if (connectionFields.every((value) => !value)) {
    return sampleResponse(query);
  }

  const serverUrl = normalizeServerUrl(query.serverUrl);
  const auth = credentials(query);
  const photos = await listAlbum(serverUrl, auth, auth.albumName);
  const selected = selectPhoto(photos, query, auth.albumName);
  const imageDataUrl = await fetchPhoto(serverUrl, auth, selected.photo);

  return {
    source: "nextcloud",
    albumName: auth.albumName,
    count: selected.count,
    index: selected.index,
    photo: {
      name: selected.photo.name,
      modifiedAt: selected.photo.modifiedAt,
      size: selected.photo.size,
      contentType: selected.photo.contentType,
      fileId: selected.photo.fileId,
      imageDataUrl,
    },
    updatedAt: new Date().toISOString(),
  };
}
