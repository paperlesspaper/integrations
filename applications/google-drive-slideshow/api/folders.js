import {
  accessTokenFromKeyInput,
  driveErrorKind,
  DriveSlideshowError,
  normalizeServiceAccountKeyInput,
  readGoogleError,
  userAgent,
} from "./serviceAccount.js";

const maxFolders = 200;
const folderMime = "application/vnd.google-apps.folder";

function stringValue(value) {
  return String(value ?? "").trim();
}

function normalizeDriveFileId(value) {
  const id = stringValue(value).replace(/[^\w-]/g, "");
  return /^[\w-]+$/.test(id) ? id : "";
}

export default async function handler({ query }) {
  try {
    const keyMaterial = stringValue(normalizeServiceAccountKeyInput(query.serviceAccountKey));
    if (!keyMaterial) {
      throw new DriveSlideshowError("Service account JSON key is required.", "auth");
    }

    const { accessToken } = await accessTokenFromKeyInput(query.serviceAccountKey);

    const params = new URLSearchParams({
      q: `mimeType='${folderMime}' and trashed=false`,
      fields: "nextPageToken,files(id,name,resourceKey,mimeType)",
      pageSize: "100",
      orderBy: "folder,name",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });

    const folders = [];
    let pageToken = "";

    while (folders.length < maxFolders) {
      if (pageToken) {
        params.set("pageToken", pageToken);
      } else {
        params.delete("pageToken");
      }

      const response = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
        headers: {
          accept: "application/json",
          authorization: `Bearer ${accessToken}`,
          "user-agent": userAgent,
        },
      });

      if (!response.ok) {
        const kind = driveErrorKind(response.status);
        const message = await readGoogleError(
          response,
          `Google Drive folder list failed with ${response.status}.`,
        );
        throw new DriveSlideshowError(message, kind);
      }

      const payload = await response.json();
      for (const file of payload.files || []) {
        const id = normalizeDriveFileId(file?.id);
        if (!id) {
          continue;
        }
        folders.push({
          id,
          name: stringValue(file.name) || id,
          resourceKey: stringValue(file.resourceKey),
        });
        if (folders.length >= maxFolders) {
          break;
        }
      }

      pageToken = stringValue(payload.nextPageToken);
      if (!pageToken || folders.length >= maxFolders) {
        break;
      }
    }

    folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

    return { folders };
  } catch (error) {
    if (error instanceof DriveSlideshowError) {
      return { error: error.message, errorKind: error.errorKind };
    }
    throw error;
  }
}
