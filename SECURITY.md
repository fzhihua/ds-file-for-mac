# Security / 安全说明

## Disclosure and current limitations

This is an **unaudited community preview**, not a hardened authentication client. Report sensitive findings privately using GitHub private vulnerability reporting if available; never post a live NAS URL, SID, Cookie, or credentials publicly.

- The File Station `_sid` is a session credential, **not** a per-file video capability. IINA receives a NAS playback URL containing SID. It can persist in application diagnostics or OS handling history. Do not share playback URLs.
- **HTTP** offers no encryption. NAS credentials, SID, file names, and video stream can be visible to an on-path attacker. HTTPS protects those during transport **only if the NAS certificate is validated**. HTTPS does not hide SID from the endpoint/player or local logs.
- Access to an old/unpatched DSM management interface from the internet is independently risky. This extension does not fix NAS vulnerabilities. Consider a restricted account with read-only file access.
- IINA older than 1.4.4 had a URL handler security issue. Do not use versions below 1.4.4.

## Hardening already implemented in v0.3.0

- No hardcoded NAS host, personal file paths, or historical SID in source or release.
- Per-site **explicit user consent** before requesting host permissions; exact origin (scheme, host, port) DNR rules only.
- No host access automatically granted at install. Chrome optional host permissions are requested per NAS site, though Chrome host permissions cover all ports for the same protocol/host.
- Browser Cookie reads restricted to the current authorized NAS origin; per-origin cached SID in `chrome.storage.session`, not persisted across Chrome restarts.
- No third-party requests, telemetry, remote scripts, or automatic updates outside Chrome extensions infrastructure.
- Password is used only to request a File Station session from the chosen NAS, then immediately cleared; HTTP password login requires an explicit risk acknowledgement.
- No mutation API calls to NAS and no filesystem write functionality.
- Copying a video URL that includes SID requires an explicit confirmation.
- On extension update, the previous globally cached SID field is discarded.

## Remaining risks

1. SID still travels to IINA inside a video URL; if you need stronger isolation, a separately reviewed local proxy or authenticated native host would be required. This is not in the current minimum-feature release.
2. The Web Accessible Resource handoff page must accept navigations from different sites to enable unconfigured NAS addresses. Its code validates that the requested NAS origin is one explicitly authorized by the user before reading any Cookie/SID or contacting a NAS.
3. Browser focus change is only an approximation of IINA startup. No claim is made that the extension can verify the native player's actual execution or playback.
4. DSM 7.x, reverse proxies with non-root paths, Web Station changes, and different DSM cookies may not behave like DSM 6.2.4.

### Safer everyday use

Use a least-privilege Synology account, prefer HTTPS and a properly trusted certificate, log out when finished, do not share generated URLs or debug logs, and avoid entering credentials into HTTP sites. Remove unused site grants with the popup's “移除当前 NAS 授权” action.
