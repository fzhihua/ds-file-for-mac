# 兼容性与验证依据 / Compatibility and evidence

## 简体中文

| 环境 | 已确认范围 | 状态 |
|---|---|---|
| 群晖 DS218 / DSM 6.2.4（ARM） | 个人 V0.2 实际 Chrome → IINA 播放、交接标签关闭 | **用户已实测** |
| V0.3.3 | URL 解析、按站点授权、多 NAS SID 隔离、五秒关闭与中英语言包 | **自动测试；真实新版待验收** |
| 英文界面 Chrome | 根据 Chrome UI 语言自动显示英文或简体中文 | **本地化机制已实现，英文 DSM 播放待实测** |
| DSM 7.x、其他 ARM/Intel/AMD NAS | 播放器 URL 结构、认证与视频流接口 | **未验证** |
| Chrome Web Store | 正式审核、商店上架 | **未提交** |

插件运行在 Mac 的 Chrome 上，不依赖 NAS CPU 架构；但各 DSM 版本可能使用不同的播放器路径、认证 Cookie 或 API。

支持的跳转形态：SYNO.VideoController2.Application + launchParam + /volumeN/共享目录/视频文件。**播放识别按 URL 技术字段完成，不依赖页面上中文或英文按钮文字。**

**TS 说明：** 解析器已支持 .ts，已排查的 MPEG-TS 案例中，本地解码可用，用户确认远程带宽不足是播放失败原因（[Issue #5](https://github.com/fzhihua/ds-file-for-mac/issues/5)）。但直接以 /fbdownload/ 触发的下载不是本扩展目前的页面拦截目标。

## English

| Environment | Verified scope | Status |
|---|---|---|
| Synology DS218 / DSM 6.2.4 (ARM) | Personal V0.2 Chrome → IINA playback, handoff tab auto-close | **User-tested** |
| V0.3.3 | URL parsing, per-site permission, multi-NAS SID isolation, five-second close and locales | **Automated tests; field test pending** |
| English-language Chrome UI | Automatically displays English or Simplified Chinese based on Chrome locale | **Implemented; English DSM playback not field-tested** |
| DSM 7.x, other ARM/Intel/AMD models | Player URL structure, login cookie and file APIs | **Not verified** |
| Chrome Web Store | Review and distribution | **Not submitted** |

The extension runs on macOS Chrome, not on the NAS CPU. Other DSM versions may differ in player navigation, authentication or file endpoints.

The supported navigation structure uses SYNO.VideoController2.Application, launchParam and /volumeN/shared-folder/video-file. **Matching depends on URL parameters, not the language of button labels.**

**MPEG-TS:** The parser already accepts .ts. In a diagnosed case, local decoding worked and the user confirmed insufficient remote bandwidth as the cause ([Issue #5](https://github.com/fzhihua/ds-file-for-mac/issues/5)). Direct /fbdownload/ downloads are not intercepted by this extension.
