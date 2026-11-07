# DS File for Mac

**Unofficial Chrome extension inspired by Synology DS file.** Bring the familiar DS file-style video playback experience to Mac: browse in Synology File Station, click **Play**, and open the NAS video in **IINA** instead of the browser player.

**中文：** 面向寻找「DS file Mac 版」的群晖用户：保留 File Station 网页操作，把视频交给 Mac 本地 IINA 播放。

> **Non-official project.** Not affiliated with or endorsed by Synology or IINA. This is not a complete port of the DS file mobile application: it currently enhances video playback only.

## What has been verified

- Personal V0.2: Synology DS218 / DSM 6.2.4 + Chrome on macOS + IINA, video playback and automatic handoff-tab closure **tested successfully**.
- DSM 7.x, other Synology devices, other authentication conditions and Chrome Web Store: **not yet tested**.

## Security and publication status

The prototype uses a Synology File Station session ID (SID) to request videos and currently hands that SID to IINA in the playback URL. A SID is a session credential, **not** a one-video sharing token. Never publish NAS URLs containing SID, cookies, account details or private file paths.

**Repository created; sanitized source release and security review are pending. No supported installable GitHub release is published yet.**

## Roadmap

1. Commit reviewed and sanitized V0.2 source and tests.
2. Auto-detect the NAS origin from the intercepted URL, with narrow site permissions; do not hardcode users' NAS addresses.
3. Document HTTP versus HTTPS and reduce SID exposure.
4. Verify DSM 7.x compatibility before claiming broader support.
5. Prepare optional free Chrome Web Store distribution.

**Search terms:** Synology DS file Mac · DS file for macOS · 群晖 DS file Mac · Synology File Station IINA · Chrome extension NAS video.
