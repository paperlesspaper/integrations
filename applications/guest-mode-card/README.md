# Guest Mode Card

A guest-ready home card for paperlesspaper displays. It shows a Wi-Fi QR code, checkout time, house rules, nearby cafes, smart-home instructions, and an optional emergency contact.

## Links

- [Demo](https://integrations.paperlesspaper.de/guest-mode-card/run)
- [config.json](./config.json)

## Screenshots

| Landscape | Portrait |
| --- | --- |
| <img src="./screenshots/guest-mode-card-800x480-landscape.png" alt="Guest Mode Card landscape screenshot: Guest Mode Card" width="360"> | <img src="./screenshots/guest-mode-card-480x800-portrait.png" alt="Guest Mode Card portrait screenshot: Guest Mode Card" width="216"> |
| <img src="./screenshots/guest-mode-card-dark-800x480-landscape.png" alt="Guest Mode Card landscape screenshot: Dark" width="360"> | <img src="./screenshots/guest-mode-card-dark-480x800-portrait.png" alt="Guest Mode Card portrait screenshot: Dark" width="216"> |

## Settings

- `placeName` and `welcomeLine` set the header.
- `wifiName`, `wifiPassword`, and `wifiSecurity` build the scannable Wi-Fi QR payload.
- `showWifiPassword` controls whether the password is printed next to the QR code.
- `checkoutTime` and `checkoutNote` explain departure details.
- `houseRules`, `nearbyCafes`, and `smartHomeInstructions` accept one item per line.
- `emergencyContact` hides the contact footer when empty.

The renderer is static and does not call external services.
