# DS File for Mac | 群晖 DS file Mac 视频播放插件

**English:** An **unofficial Chrome extension** that lets macOS users keep browsing Synology **File Station** and open videos in the local **IINA** player. Inspired by the mobile DS file experience—no extra media server required.

**中文：** 非官方 Chrome 插件，补上 Mac 缺少的 **DS file 式播放体验**：继续使用群晖 File Station 网页选视频，点击「播放」后直接交给本机 **IINA**，无需额外安装 Plex/Emby、迁移视频或完整下载。

> **Independent project / 非官方项目：** Not affiliated with Synology or IINA. This is **not** the full Synology DS file application port. / 与群晖和 IINA 官方无关联，也不是完整 DS file Mac 移植版。

## 简体中文｜下载与安装

**[下载 V0.3.3 RC1](https://github.com/fzhihua/ds-file-for-mac/releases/download/v0.3.3-rc.1/ds-file-for-mac-v0.3.3.zip)** · [查看 GitHub Release](https://github.com/fzhihua/ds-file-for-mac/releases/tag/v0.3.3-rc.1)

本版本是 **GitHub 预览版**，尚未发布到 Chrome Web Store。

1. 在 Mac 上安装 **IINA 1.4.4 或更新版**。
2. 下载 ZIP、解压到固定文件夹。不能直接将 ZIP 拖进 Chrome；解压后的文件夹根目录应有 manifest.json 和 _locales 目录。
3. Chrome 打开 chrome://extensions，开启「开发者模式」，点击「加载已解压的扩展程序」，选中解压后的文件夹。
4. 如果旧 V0.2/V0.3 扩展还在同一个 Chrome 配置文件中运行，先**禁用旧版自动拦截**，避免同时拦截；也可以新建 Chrome 配置文件测试。
5. 在 Chrome 登录群晖 File Station，点扩展图标。插件会识别当前 NAS 的协议、域名、端口；首次使用点击「授权当前 NAS」一次。
6. 在 File Station 点击视频「播放」。Chrome 可能要求确认打开 IINA。成功移交后临时标签页通常会在失去焦点 **5 秒后**自动关闭。
7. 如果没有自动播放，可在交接页点「用 IINA 播放」。授权状态会显示「已授权 / 未授权 / 授权失效」。

**中文界面自动识别：** Chrome 界面语言为简体中文时显示中文；英文 Chrome 显示英文；其他语言回退英文。无需手动填写语言或增开 NAS 权限。

## English | Download & setup

**[Download V0.3.3 RC1](https://github.com/fzhihua/ds-file-for-mac/releases/download/v0.3.3-rc.1/ds-file-for-mac-v0.3.3.zip)** · [Release notes](https://github.com/fzhihua/ds-file-for-mac/releases/tag/v0.3.3-rc.1)

This is a **GitHub preview**, not yet listed in the Chrome Web Store.

1. Install **IINA 1.4.4 or newer** on your Mac.
2. Download and unzip the extension ZIP to a permanent folder. The extracted root should contain manifest.json and _locales; do **not** drag the ZIP directly into Chrome.
3. Open chrome://extensions, enable **Developer mode**, choose **Load unpacked**, and select the extracted folder.
4. Disable interception in an older copy of this extension in the same Chrome profile, or try a separate Chrome profile, so two copies do not intercept the same navigation.
5. Open your Synology File Station page in Chrome and sign in. Click the extension icon; it detects the NAS protocol, hostname and port. Select **Authorize current NAS** once per origin.
6. In File Station, click **Play** on a video. Chrome may prompt you to allow opening IINA. Once focus moves away, the temporary handoff tab attempts to close after **5 seconds**.
7. If the automatic handoff does not start, select **Play in IINA** on the handoff page. The popup clearly distinguishes authorized, unauthorized and revoked NAS permissions.

**Automatic language selection:** Chrome's UI language selects Simplified Chinese or English using the official extension i18n system. Other locales fall back to English. Language selection does not require extra NAS permissions.

## 功能与边界 | Scope & limitations

| 功能 / Feature | 当前状态 / Status |
|---|---|
| File Station 播放跳转 / Video-player navigation interception | Supported after per-NAS authorization / 已授权站点支持 |
| IINA 本地播放 / Local IINA playback | Supported on the verified DSM 6 setup / 已在 DSM 6 环境验证 |
| 多台 NAS / Multiple NAS sites | Each origin uses its own permissions and session cache / 各自授权与缓存 |
| 标签页自动关闭 / Close handoff tab | 5-second delay after focus loss / 失焦后延迟 5 秒 |
| 中英双语 / Chinese & English | Automatic Chrome UI language selection / 根据 Chrome 界面语言自动选择 |
| DSM 7.x, English-language DSM | Not field-tested / 尚未进行端到端实测 |
| Video indexing, Plex replacement, NAS file modifications | Not included / 暂不提供 |

播放识别基于群晖 URL 中的技术字段（如 SYNO.VideoController2.Application、launchParam），**与 File Station 按钮显示中文或英文无关**。但高版本 DSM 可能采用不同的接口或路径，尚未验证全部机型。

The interception is based on Synology's URL parameters, **not translated button labels**. Different DSM versions may use different endpoints; compatibility has not been proven on every version.

## 安全提示 | Security & privacy

- **SID 是登录会话凭据，不是一次性视频分享码。** 当前实现会将 SID 放入交给 IINA 的视频 URL。不要把完整播放链接、Cookie 或调试日志发到公开 Issue。 / **SID is a login-session credential**, not a single-file link; never share a playback URL, Cookie or diagnostic log containing one.
- HTTP 不加密会话、密码或视频传输。建议使用正确验证服务器证书的 HTTPS；尽量使用仅能读取视频目录的普通账号。 / HTTP is unencrypted. Prefer properly verified HTTPS and a least-privilege read-only NAS account.
- 插件不会将 NAS 账号密码持久保存或上传给项目作者，没有遥测、第三方统计和广告代码。 / The extension does not persist NAS passwords or send data to the maintainer; no telemetry or analytics libraries are included.
- [完整安全说明 / Security](SECURITY.md) · [隐私说明 / Privacy](PRIVACY.md) · [兼容性 / Compatibility](docs/COMPATIBILITY.md)

## 开发与反馈 | Development & feedback

Run **npm test** for automated tests and **npm run check** for JavaScript syntax validation. The release workflow also verifies that English and Chinese locale catalogs are packaged into the ZIP.

欢迎通过 [GitHub Issues](https://github.com/fzhihua/ds-file-for-mac/issues) 反馈兼容性问题，但请移除域名、真实文件路径、SID、Cookie、账号等敏感信息。

Please report compatibility issues via [GitHub Issues](https://github.com/fzhihua/ds-file-for-mac/issues) **without including real NAS hostnames, private file paths, SIDs, Cookies or credentials**.

**Search terms / 搜索关键词:** DS file Mac, DS file for macOS, Synology DS file Chrome extension, File Station IINA, 群晖 DS file Mac 版, 群晖视频本地播放。

Licensed under MIT.
