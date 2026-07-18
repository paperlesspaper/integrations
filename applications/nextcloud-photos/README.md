# Nextcloud Photos

Shows one image from a private album in the Nextcloud Photos app. Photos can rotate daily, randomly, by modification date, or by a fixed album position.

## Setup

1. Open Nextcloud and create or choose an album in the Photos app.
2. In **Personal settings → Security → Devices & sessions**, create a dedicated app password.
3. Set the Nextcloud base URL, username, app password, and the exact album name.
4. If the Nextcloud user ID differs from the login username, set **User ID** as well.

The integration uses Nextcloud's authenticated WebDAV API. The configured provider handles the credentials server-side, but settings are submitted to that provider, so use a trusted HTTPS deployment.

When every connection field is blank, a built-in preview album is shown. A partially filled connection shows a setup error instead of silently using sample data.

## Settings

- `serverUrl`: Nextcloud base URL, including a subdirectory when applicable.
- `username`: Nextcloud login username.
- `userId`: optional DAV user ID; defaults to `username`.
- `appPassword`: dedicated Nextcloud app password.
- `albumName`: exact private Photos album name.
- `selection`: `daily`, `random`, `newest`, `oldest`, or `number`.
- `photoNumber`: one-based position used with `number`.
- `fit`: crop with `cover` or preserve the whole image with `contain`.
- `showAlbumName`, `showFilename`, `showCaptureDate`, `showPhotoCount`: metadata controls.
- `locale`: locale used to format the photo date.

Images larger than 25 MB are rejected to keep rendering predictable. The date shown is the album item's WebDAV modification date.

## Environment variables

This integration intentionally keeps credentials in integration settings rather than reading shared environment variables, because multiple displays may use different Nextcloud accounts.

## Sources

- [Nextcloud WebDAV API](https://docs.nextcloud.com/server/stable/developer_manual/client_apis/WebDAV/basic.html)
- [Nextcloud WebDAV and app-password setup](https://docs.nextcloud.com/server/stable/user_manual/en/files/access_webdav.html)
