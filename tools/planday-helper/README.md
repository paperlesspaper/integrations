# Planday-Wochenplan in Dokploy

Der einzelne Container öffnet alle zehn Minuten die aktuelle Woche der konfigurierten Abteilung im regulären Planday-Webportal. Er übernimmt die Schichten und die zugehörigen Namen aus den Antworten, die diese Ansicht selbst lädt. Bei der Einrichtung muss das verwendete Planday-Konto die Abteilung sehen dürfen. Der Integrationsserver liest den Wochenplan über das private Docker-Netz. Der Rahmen verwendet weiterhin die Planday-Kalenderlayouts.

## Einrichtung

In Dokploy den Compose-Dienst aus diesem Verzeichnis starten. Das externe Netz `dokploy-network` muss auch den Integrationsserver enthalten. `PLANDAY_PORTAL` auf den HTTPS-Ursprung des Portals und `PLANDAY_DEPARTMENT` auf die numerische Abteilungs-ID setzen. Browserprofil, Lesezugang und der letzte minimierte Wochenplan liegen im privaten Volume `/state`.

1. Im Dokploy-Terminal des Containers den Befehl `/app/login` ausführen. Bei leeren Umgebungsvariablen den Portalursprung und die numerische Abteilungs-ID anhängen: `/app/login https://PORTAL.planday.com ABTEILUNGSNUMMER`.
2. Das Terminal zeigt die Herkunft und die Anmeldefelder der regulären Planday-Seite an. Die Feldnummer wählen, E-Mail und Passwort jeweils verdeckt eingeben und die Anmelde-Schaltfläche wählen. Bei einer Planday-Codeabfrage auch den Einmalcode verdeckt eintragen. Enter aktualisiert die Auswahl. Externe SSO-Anbieter und gerätegebundene Passkeys sind in diesem Terminalablauf nicht verfügbar.
3. Nach der Anmeldung öffnet der Helper die konfigurierte Abteilungswoche. Nach der Meldung „Wochenplan synchronisiert“ bleibt der Browser im Hintergrund angemeldet. Der Steuerkanal ist ein privater Unix-Socket im Container. Das Terminal kann anschließend geschlossen werden.
4. Im Container-Terminal mit `cat /state/frame-key` den Leseschlüssel abrufen und direkt in den privaten Rahmeneinstellungen eintragen. Die Datenquelle heißt `weekHelper`, die Kalenderansicht `week`. Der Schlüssel erlaubt ausschließlich das Lesen des Wochenplans. Vor- und Nachnamen sowie Mitarbeiterfarben werden von der Planday-Integration formatiert.

Ein leerer Dienstplan ist ein gültiges Ergebnis. Nach 30 Minuten ohne erfolgreiche Synchronisierung meldet die Integration, dass der Wochenplan fehlt. Wenn die Websitzung abgelaufen ist, die Anmeldung im selben Volume erneut ausführen. Der Container veröffentlicht keine Ports auf dem Host.

Chromium läuft als Benutzer `node` mit eigener Browser-Sandbox. Das Seccomp-Profil basiert auf dem [Docker-Profil von Playwright](https://github.com/microsoft/playwright/blob/main/utils/docker/seccomp_profile.json) und erlaubt zusätzlich `chroot` innerhalb der Chromium-Sandbox. Der Container verwirft alle Linux-Capabilities.
