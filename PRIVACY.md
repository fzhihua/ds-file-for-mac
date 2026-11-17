# Privacy / 隐私说明

## 简体中文

**DS File for Mac 是非官方本地 Chrome 扩展。** 项目作者不收集、出售或接收用户个人资料；不包含广告、遥测、第三方分析服务或自建云端服务器。

为了让 IINA 播放 NAS 视频，扩展只使用以下数据：

- **NAS 站点地址及授权：** 保存在 Chrome 的 storage.local 中。用户为每个 NAS 站点单独授予访问权限。
- **视频文件路径：** 从用户点击 File Station「播放」时产生的 URL 临时解析，不会发送给项目作者。
- **SID：** 尝试从已授权 NAS 的登录 Cookie 读取或通过用户输入的账号信息向该 NAS 登录获取；按 NAS 站点保存在临时 storage.session 中。
- **密码：** 仅用于直接向用户自己的 NAS 发起登录请求，不持久保存，并在请求后清空输入框。
- **本地播放器：** 播放 URL 包含 SID，会传给 Mac 上的 IINA；浏览器、操作系统、播放器或日志可能保留此链接。

扩展发起的网络请求仅针对用户明确授权的 NAS。**HTTP 不加密；推荐使用可信证书的 HTTPS。** 可在弹窗中清除临时 SID、撤销站点权限，或从 NAS 退出登录使会话失效。

本扩展尚未通过 Chrome Web Store 审核，属于开源预览版。另见 [安全说明](SECURITY.md)。

## English

**DS File for Mac is an unofficial local Chrome extension.** Its maintainers do not collect, sell or receive your personal data. There is no telemetry, advertising, third-party analytics library or hosted backend.

The extension uses only the data needed to play a NAS video:

- **NAS origin and permission:** stored in Chrome storage.local; access is granted independently for each NAS site.
- **Video path:** parsed temporarily from the File Station Play navigation; not sent to maintainers.
- **SID:** obtained from the authorized NAS login cookie or a user-initiated login, temporarily cached per NAS origin in storage.session.
- **Password:** sent only to your chosen NAS for login; never persisted and cleared from the form after use.
- **Local player:** IINA receives a playback URL containing SID. The browser, operating system, player or diagnostic logs may retain the URL.

The extension makes network requests only to user-authorized NAS origins. **HTTP traffic is unencrypted; use HTTPS with a properly validated certificate.** You can clear temporary sessions, revoke NAS permissions or log out of your NAS to invalidate credentials.

This project is a GitHub preview, **not yet approved by the Chrome Web Store**. See [Security](SECURITY.md).
