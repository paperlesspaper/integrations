---
slug: google-drive-slideshow
name: Google Drive Slideshow
version: 0.2.1
description: Shows one image at a time from a Google Drive folder (public link or private folder via your service account), advancing on a fixed time slot.
renderPage: ./render.html
configUrl: /google-drive-slideshow/config.json
apiUrl: /google-drive-slideshow/api/data
offline: false
---

# Google Drive Slideshow

Cycles through images in a Google Drive folder. The photo changes on a fixed schedule, so the display does not need to remember which image was last shown.

Set up a **public folder** (link + API key) or **private folder** (service account) in the integration settings in the paperlesspaper app.

## Links

- [Demo](https://integrations.paperlesspaper.de/google-drive-slideshow/run)
- [config.json](./config.json)

## Preview

Leave connection fields empty in the local preview to see a built-in sample slideshow.

## Setup

**Public folder:** Put JPEG, PNG, WebP, or GIF files in the **folder root** (subfolders are ignored). Share the folder as **Anyone with the link → Viewer**. Enter the folder link (or ID) and API key in settings.

**Private folder:** Share the photo folder with your service account email as Viewer, paste the service account JSON key in settings, and pick the folder.

## Settings

**Connection** (settings page tabs): `folderUrl`, `folderResourceKey`, `apiKey` for a public folder, or `serviceAccountKey`, `serviceAccountEmail`, `folderId`, `folderName`, `folderResourceKeyPrivate` for a private folder. Both setups can be saved; `connectionMode` selects which tab is active.

**Slideshow:** `order`, `fit`, `slotMinutes`, `showFilename`, `brightnessBoost`. `color` is a host theme setting.

## Security

- API keys and service account JSON are sent only in POST requests to this integration’s same-origin data adapter.
- Use HTTPS in production; restrict and rotate API keys in Google Cloud.
- Treat the service account JSON key like a password.

## Notes

- Up to 5000 images in the folder root (subfolders are not used).
- A brief fetch failure keeps showing the last good image.
- Private mode loads each photo in the browser (thumbnail first, then the full file). Very large originals may be slow or fail on memory-constrained devices.
- UI available in English, German, French, Spanish, and Italian.

## Branding

Google Drive is a trademark of Google LLC. This integration uses a custom icon, not the Google Drive product logo.
