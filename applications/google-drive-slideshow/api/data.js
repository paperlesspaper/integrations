import crypto from "node:crypto";
import { inferConnectionMode } from "../assets/drive-connection.js";
import {
  accessTokenFromKeyInput,
  driveErrorKind,
  DriveSlideshowError,
  normalizeServiceAccountKeyInput,
  readGoogleError,
  userAgent,
} from "./serviceAccount.js";

export { inferConnectionMode };

const maxSlideshowImages = 5000;
const driveListPageSize = 1000;
const driveIdPattern = /^[\w-]+$/;
const imageMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const imageExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const photoOrders = new Set(["name", "modified", "created", "random"]);
function stringValue(value) {
  return String(value ?? "").trim();
}

function normalizePhotoOrder(value) {
  const order = stringValue(value).toLowerCase();
  return photoOrders.has(order) ? order : "random";
}

export function clampSlotMinutes(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 60;
  }
  return Math.min(24 * 60, Math.max(1, Math.floor(parsed)));
}

function normalizeDriveFileId(value) {
  const id = stringValue(value).replace(/[^\w-]/g, "");
  if (!id || !driveIdPattern.test(id)) {
    return "";
  }
  return id;
}

function normalizeResourceKey(value) {
  const key = stringValue(value);
  if (!key) {
    return "";
  }
  if (!/^[\w%+=./-]+$/i.test(key)) {
    return "";
  }
  return key;
}

export function parseFolderInput(input) {
  const raw = stringValue(input);
  if (!raw) {
    return { folderId: "", resourceKey: "" };
  }

  if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
    return { folderId: normalizeDriveFileId(raw), resourceKey: "" };
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new DriveSlideshowError("Folder URL must be a valid Google Drive link or folder ID.", "transient");
  }

  const resourceKey = normalizeResourceKey(
    url.searchParams.get("resourcekey") || url.searchParams.get("resourceKey"),
  );

  const folderMatch = url.pathname.match(/\/folders\/([^/?#]+)/i);
  if (folderMatch?.[1]) {
    const folderId = normalizeDriveFileId(decodeURIComponent(folderMatch[1]));
    if (!folderId) {
      throw new DriveSlideshowError("Could not find a valid folder ID in the Google Drive URL.", "transient");
    }
    return { folderId, resourceKey };
  }

  const openId = url.searchParams.get("id");
  if (openId) {
    const folderId = normalizeDriveFileId(openId);
    if (!folderId) {
      throw new DriveSlideshowError("Could not find a valid folder ID in the Google Drive URL.", "transient");
    }
    return { folderId, resourceKey };
  }

  throw new DriveSlideshowError("Could not find a folder ID in the Google Drive URL.", "transient");
}

function driveResourceKeysHeader(entries) {
  const pairs = (entries || [])
    .filter((entry) => entry?.id && entry?.resourceKey)
    .map((entry) => `${entry.id}/${entry.resourceKey}`);
  if (!pairs.length) {
    return {};
  }
  return { "x-goog-drive-resource-keys": pairs.join(",") };
}

function isImageFile(file) {
  const mimeType = stringValue(file?.mimeType).toLowerCase();
  if (imageMimeTypes.has(mimeType)) {
    return true;
  }
  if (mimeType && mimeType !== "application/octet-stream") {
    return false;
  }
  const name = stringValue(file?.name).toLowerCase();
  return imageExtensions.some((extension) => name.endsWith(extension));
}

async function resolveFolderResourceKey(folderId, apiKey, resourceKeyHint) {
  if (resourceKeyHint) {
    return resourceKeyHint;
  }

  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(folderId)}?fields=resourceKey&supportsAllDrives=true&key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
    headers: {
      accept: "application/json",
      "user-agent": userAgent,
      ...driveResourceKeysHeader([{ id: folderId, resourceKey: resourceKeyHint }]),
    },
  });

  if (!response.ok) {
    return "";
  }

  const payload = await response.json();
  return stringValue(payload.resourceKey);
}

function hashSlot(paperId, slot) {
  const hash = crypto.createHash("sha256").update(`${paperId}:${slot}`).digest();
  return hash.readUInt32BE(0);
}

export function sortFiles(files, order) {
  const list = [...files];
  if (order === "modified") {
    list.sort((a, b) => String(a.modifiedTime).localeCompare(String(b.modifiedTime)));
    return list;
  }
  if (order === "created") {
    list.sort((a, b) => String(a.createdTime).localeCompare(String(b.createdTime)));
    return list;
  }
  list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return list;
}

function baseIndexForSlot(length, order, slot, paperId) {
  if (order === "random") {
    return hashSlot(paperId || "slideshow", slot) % length;
  }
  return ((slot % length) + length) % length;
}

export function pickIndex(length, order, slot, paperId) {
  if (length <= 0) {
    return 0;
  }
  const index = baseIndexForSlot(length, order, slot, paperId);
  if (length > 1 && index === baseIndexForSlot(length, order, slot - 1, paperId)) {
    return (index + 1) % length;
  }
  return index;
}

async function readDriveError(response) {
  if (response.status === 403) {
    return "Google Drive denied access. Enable the Drive API for your API key and set the folder to Anyone with the link can view.";
  }
  if (response.status === 404) {
    return "Google Drive folder was not found. Check the folder URL or ID.";
  }

  return readGoogleError(response, `Google Drive request failed with ${response.status}.`);
}

async function listFolderImagesWithApiKey(folderId, apiKey, folderResourceKey) {
  const files = [];
  let pageToken = "";
  let rawCount = 0;
  const folderResourceEntries = folderResourceKey ? [{ id: folderId, resourceKey: folderResourceKey }] : [];

  while (true) {
    if (files.length >= maxSlideshowImages || rawCount >= maxSlideshowImages) {
      break;
    }

    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken,files(id,name,mimeType,thumbnailLink,modifiedTime,createdTime,resourceKey)",
      pageSize: String(driveListPageSize),
      orderBy: "folder,name",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
      key: apiKey,
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
      headers: {
        accept: "application/json",
        "user-agent": userAgent,
        ...driveResourceKeysHeader(folderResourceEntries),
      },
    });

    if (!response.ok) {
      const kind = driveErrorKind(response.status);
      throw new DriveSlideshowError(await readDriveError(response), kind);
    }

    const payload = await response.json();
    collectImageFiles(payload.files, files, () => {
      rawCount += 1;
    });

    if (files.length >= maxSlideshowImages || rawCount >= maxSlideshowImages) {
      break;
    }

    pageToken = stringValue(payload.nextPageToken);
    if (!pageToken) {
      break;
    }
  }

  return { files, rawCount };
}

async function listFolderImagesWithAccessToken(folderId, accessToken, folderResourceKey) {
  const files = [];
  let pageToken = "";
  let rawCount = 0;
  const folderResourceEntries = folderResourceKey ? [{ id: folderId, resourceKey: folderResourceKey }] : [];

  while (true) {
    if (files.length >= maxSlideshowImages || rawCount >= maxSlideshowImages) {
      break;
    }

    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed=false`,
      fields: "nextPageToken,files(id,name,mimeType,thumbnailLink,modifiedTime,createdTime,resourceKey)",
      pageSize: String(driveListPageSize),
      orderBy: "folder,name",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
      headers: {
        accept: "application/json",
        authorization: `Bearer ${accessToken}`,
        "user-agent": userAgent,
        ...driveResourceKeysHeader(folderResourceEntries),
      },
    });

    if (!response.ok) {
      const kind = driveErrorKind(response.status);
      const message = await readGoogleError(
        response,
        `Google Drive request failed with ${response.status}.`,
      );
      throw new DriveSlideshowError(message, kind);
    }

    const payload = await response.json();
    collectImageFiles(payload.files, files, () => {
      rawCount += 1;
    });

    if (files.length >= maxSlideshowImages || rawCount >= maxSlideshowImages) {
      break;
    }

    pageToken = stringValue(payload.nextPageToken);
    if (!pageToken) {
      break;
    }
  }

  return { files, rawCount };
}

function collectImageFiles(sourceFiles, files, onRaw) {
  for (const file of sourceFiles || []) {
    if (!file || typeof file !== "object") {
      continue;
    }
    onRaw();
    if (files.length >= maxSlideshowImages) {
      break;
    }
    if (!isImageFile(file)) {
      continue;
    }
    const fileId = normalizeDriveFileId(file.id);
    if (!fileId) {
      continue;
    }
    const mimeType = stringValue(file.mimeType).toLowerCase();
    files.push({
      id: fileId,
      name: stringValue(file.name) || "photo",
      mimeType,
      resourceKey: normalizeResourceKey(file.resourceKey),
      thumbnailLink: stringValue(file.thumbnailLink),
      modifiedTime: file.modifiedTime,
      createdTime: file.createdTime,
    });
  }
}

function noImagesError(rawCount) {
  if (rawCount > 0) {
    return "No supported images were found in the folder root. Use JPEG, PNG, WebP, or GIF files directly in the folder (not in subfolders).";
  }
  return "This folder is empty. Add JPEG, PNG, WebP, or GIF photos to the folder root (not in subfolders), then refresh.";
}

function noImagesErrorKind(rawCount) {
  return rawCount > 0 ? "unsupported" : "empty";
}

export function imageUrlsForFile(file) {
  const urls = [];
  const add = (url) => {
    const normalized = stringValue(url);
    if (normalized && !urls.includes(normalized)) {
      urls.push(normalized);
    }
  };

  if (file.thumbnailLink) {
    add(file.thumbnailLink.replace(/=s\d+$/i, "=s1600"));
  }
  add(`https://lh3.googleusercontent.com/d/${file.id}=w1600-h1600`);
  add(`https://drive.google.com/uc?export=view&id=${encodeURIComponent(file.id)}`);
  return urls;
}

function sampleSvg(label, palette) {
  const [sky, accent, ridge, foreground] = palette;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="${sky}"/><circle cx="220" cy="180" r="70" fill="${accent}"/><path fill="${ridge}" d="M0 520 C280 360 520 620 760 430 C940 300 1080 360 1200 280 V800 H0Z"/><path fill="${foreground}" d="M0 640 C240 560 460 700 720 560 C920 470 1080 500 1200 460 V800 H0Z"/><text x="72" y="96" fill="#111" font-family="sans-serif" font-size="42" font-weight="700">${label}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function sampleResponse(query) {
  const samples = [
    {
      name: "lake-morning.jpg",
      createdAt: "2026-06-14T08:24:00Z",
      modifiedAt: "2026-06-14T08:24:00Z",
      imageUrl: sampleSvg("Lake morning", ["#9fd4f2", "#ffd65a", "#4f7f96", "#1f4a57"]),
    },
    {
      name: "coastal-path.jpg",
      createdAt: "2026-06-28T17:40:00Z",
      modifiedAt: "2026-06-28T17:40:00Z",
      imageUrl: sampleSvg("Coastal path", ["#7ec0e3", "#fff0a6", "#3f7088", "#234a3c"]),
    },
    {
      name: "alpine-evening.jpg",
      createdAt: "2026-07-05T19:12:00Z",
      modifiedAt: "2026-07-05T19:12:00Z",
      imageUrl: sampleSvg("Alpine evening", ["#f0b27a", "#fff1b0", "#6d596b", "#2c3f3e"]),
    },
  ];

  const slotMinutes = clampSlotMinutes(query.slotMinutes);
  const slot = Math.floor(Date.now() / (slotMinutes * 60 * 1000));
  const order = normalizePhotoOrder(query.order);
  const paperId = stringValue(query.paperId) || "preview";
  const ordered = sortFiles(samples, order);
  const index = pickIndex(ordered.length, order, slot, paperId);
  const file = ordered[index];

  return {
    source: "sample",
    imageUrl: file.imageUrl,
    imageUrls: [file.imageUrl],
    name: file.name,
    index: index + 1,
    total: ordered.length,
    createdAt: file.createdAt,
    modifiedAt: file.modifiedAt,
    slot,
    slotMinutes,
  };
}

function errorPayload(error) {
  if (error instanceof DriveSlideshowError) {
    return { error: error.message, errorKind: error.errorKind };
  }
  throw error;
}

async function handlePublic(query) {
  const folderUrl = stringValue(query.folderUrl);
  const apiKey = stringValue(query.apiKey);

  if (!folderUrl && !apiKey) {
    return sampleResponse(query);
  }

  if (!folderUrl) {
    throw new DriveSlideshowError("Google Drive folder URL or ID is required.", "auth");
  }
  if (!apiKey) {
    throw new DriveSlideshowError("Google API key is required.", "auth");
  }

  const { folderId, resourceKey: resourceKeyFromUrl } = parseFolderInput(folderUrl);
  if (!folderId) {
    throw new DriveSlideshowError("Google Drive folder URL or ID is required.", "auth");
  }
  const folderResourceKeyHint =
    resourceKeyFromUrl || normalizeResourceKey(query.folderResourceKey);
  const order = normalizePhotoOrder(query.order);
  const slotMinutes = clampSlotMinutes(query.slotMinutes);
  const slot = Math.floor(Date.now() / (slotMinutes * 60 * 1000));
  const paperId = stringValue(query.paperId) || folderId;

  const folderResourceKey = await resolveFolderResourceKey(folderId, apiKey, folderResourceKeyHint);
  const { files: listedFiles, rawCount } = await listFolderImagesWithApiKey(
    folderId,
    apiKey,
    folderResourceKey,
  );
  const files = sortFiles(listedFiles, order);
  if (!files.length) {
    throw new DriveSlideshowError(noImagesError(rawCount), noImagesErrorKind(rawCount));
  }

  const index = pickIndex(files.length, order, slot, paperId);
  const file = files[index];
  const imageUrls = imageUrlsForFile(file);

  return {
    source: "drive",
    connectionMode: "public",
    imageUrl: imageUrls[0],
    imageUrls,
    name: file.name,
    index: index + 1,
    total: files.length,
    createdAt: file.createdTime,
    modifiedAt: file.modifiedTime,
    slot,
    slotMinutes,
  };
}

async function handleServiceAccount(query) {
  const keyMaterial = stringValue(normalizeServiceAccountKeyInput(query.serviceAccountKey));
  const folderId = normalizeDriveFileId(query.folderId);
  const folderResourceKey = normalizeResourceKey(
    query.folderResourceKeyPrivate || query.folderResourceKey,
  );

  if (!keyMaterial && !folderId) {
    return sampleResponse(query);
  }

  if (!keyMaterial) {
    throw new DriveSlideshowError("Service account JSON key is required.", "auth");
  }
  if (!folderId) {
    throw new DriveSlideshowError("Choose a Google Drive folder in settings.", "auth");
  }

  const order = normalizePhotoOrder(query.order);
  const slotMinutes = clampSlotMinutes(query.slotMinutes);
  const slot = Math.floor(Date.now() / (slotMinutes * 60 * 1000));
  const paperId = stringValue(query.paperId) || folderId;

  const { accessToken } = await accessTokenFromKeyInput(query.serviceAccountKey);
  const { files: listedFiles, rawCount } = await listFolderImagesWithAccessToken(
    folderId,
    accessToken,
    folderResourceKey,
  );
  const files = sortFiles(listedFiles, order);
  if (!files.length) {
    throw new DriveSlideshowError(noImagesError(rawCount), noImagesErrorKind(rawCount));
  }

  const index = pickIndex(files.length, order, slot, paperId);
  const file = files[index];

  return {
    source: "drive",
    connectionMode: "serviceAccount",
    accessToken,
    fileId: file.id,
    mimeType: file.mimeType,
    thumbnailLink: file.thumbnailLink,
    name: file.name,
    index: index + 1,
    total: files.length,
    createdAt: file.createdTime,
    modifiedAt: file.modifiedTime,
    slot,
    slotMinutes,
  };
}

export default async function handler({ query }) {
  try {
    const mode = inferConnectionMode(query);
    if (mode === "serviceAccount") {
      return await handleServiceAccount(query);
    }
    return await handlePublic(query);
  } catch (error) {
    return errorPayload(error);
  }
}
