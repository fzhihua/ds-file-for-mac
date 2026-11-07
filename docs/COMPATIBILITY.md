# Compatibility and evidence

| Environment | Scope | Status |
|---|---|---|
| DSM 6.2.4, Synology DS218 (ARM) | Chrome + IINA, individual V0.2 installation | **User-tested**, media playback and handoff-tab auto-close worked |
| v0.3.2 code | URL conversion, site permission, DNR rule construction, SID scope, tab close | **Local automated tests**; not yet full production compatibility |
| DSM 7.x / AMD/Intel models | File Station `launchApp` and `/fbdownload/` compatibility | **Not tested** |
| Chrome Web Store listing | Review and store distribution | **Not submitted** |

The Mac extension does not run on the NAS processor. NAS model/DSM changes matter only insofar as the web interface, File Station authorization, and video download endpoints are compatible.

## Supported launch URL form

`http(s)://<authorized-nas-origin>/?launchApp=SYNO.VideoController2.Application&...&launchParam=<percent-encoded-parameters>`

The current parser accepts `/volumeN/<shared-folder>/<video-file>` and a common set of video extensions; future DSM versions may use different structures.

## Known behavior

- Chrome may prompt before opening the `iina://` custom protocol.
- Extension cannot reliably detect IINA process success; it closes its temporary handoff tab only after sending the open request and observing loss of focus.
- Cookie/session and TLS certificate behavior varies by NAS configuration.
- Each distinct NAS origin, including scheme and port, must be explicitly added through the popup. The popup auto-detects the origin and clearly indicates authorized, unapproved or revoked permission states, including when managing two NAS at once. Different origins have independent SID storage keys.
- `.ts` is recognized by the launch URL parser, but direct `/fbdownload/` downloads are not intercepted; only `SYNO.VideoController2.Application` launches are intercepted. Actual TS stream decoding remains unverified.
