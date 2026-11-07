# DS File for Mac

**非官方 Chrome 扩展：在 Mac 上获得类似 Synology DS file 手机 App 的“NAS 视频交给本地播放器”体验。**

**Unofficial Chrome extension inspired by Synology DS file.** Keep browsing files in Synology **File Station**, click **Play**, and have the video handed to **IINA** on macOS. No media-server installation or NAS file migration required.

> This is **not** a port of Synology's official DS file app, and is **not affiliated with or endorsed by Synology or IINA**. It only implements video playback handoff.

## 当前状态 / Status

- **V0.2（个人使用版）**：DS218 / DSM 6.2.4 + Mac Chrome + IINA 实际播放及自动关闭临时标签，用户已验证。
- **V0.3.0（社区预览版）**：移除了私人 NAS 网址和历史会话数据；动态授权 NAS 站点，从截获 URL 自动识别协议、主机和端口；临时 SID 按站点隔离；包含本地测试。**尚未完成其他用户或 DSM 7.x 的端到端验收。**
- 尚未上架 Chrome Web Store，不保证 DSM 7.x 及各种登录模式兼容。

## 安装和使用（macOS + Chrome）

1. 安装 [IINA](https://iina.io/) **1.4.4 或以上**版本。
2. 从 GitHub 的本仓库 Releases 下载 `ds-file-for-mac-v0.3.0.zip`，解压到固定文件夹；或直接使用源码里的 `extension/` 文件夹。
3. 在 Chrome 打开 `chrome://extensions`，启用**开发者模式**，点击**加载已解压的扩展程序**，选择包含 `manifest.json` 的文件夹。
4. 用 Chrome 打开你的 NAS 的 File Station 网页并登录（例如 `https://nas.example.com:5001/`）。
5. 点击 Chrome 工具栏中的 **DS File for Mac** 图标，核对自动识别的站点地址，点击**授权当前 NAS**。只授予所选站点权限。必要时可在弹出窗口手动输入站点 Origin（不含路径/参数）。
6. 回到 File Station，选择视频点击**播放**。新标签页将转为插件交接页，并尝试启动 IINA。Chrome 可能首次询问是否允许打开外部应用。成功切换焦点后约 1.8 秒自动关闭临时标签页。
7. 若未自动打开，点击交接页的 **用 IINA 播放**；如果 Chrome 会话无法用于 File Station API，则交接页可用 NAS 账号创建临时会话。

**HTTP/HTTPS：** 两者均支持站点识别，但 HTTP 会明文传输 SID 和视频数据；在 HTTP 上使用账号密码登录前，必须额外勾选风险确认。推荐使用经过正确证书验证的 HTTPS。

**隐私提示：** 会话 SID 仍被放入 `/fbdownload/` 视频 URL，并交给 IINA。**绝对不要分享包含 SID 的 URL、浏览器诊断日志或截图**。建议用仅有视频文件夹读取权限的专用 NAS 账号。见 [SECURITY.md](SECURITY.md) 和 [PRIVACY.md](PRIVACY.md)。

## 做什么 / 不做什么

**做：** 拦截 `launchApp=SYNO.VideoController2.Application` 的 File Station 视频播放器导航；提取 `/volumeN/共享目录/...` 路径；调用 NAS `/fbdownload/` 和 Mac IINA；自动关闭交接标签。支持多站点分开授权（最多 10 个），每个站点的会话缓存相互隔离。

**不做：** 视频索引与管理、Plex/Emby 替代、云端转码、任何 NAS 文件写入、后台跨目录扫描。不会把 NAS 密码保存到本地或上传第三方服务。

## 技术与权限

- Chrome Manifest V3；`declarativeNetRequestWithHostAccess` 仅在已授权 NAS URL 上重定向；`activeTab` 用于读取用户当前主动选中的站点。
- `optional_host_permissions` 声明 HTTP/HTTPS 的可选范围，**首次安装时不获取所有网站权限**；每个 NAS 主机需要用户明确授权。Chrome 站点权限模式不限定端口，插件内部匹配规则额外精确校验协议、主机及端口。
- `cookies` 用于读取**指定 NAS**的登录 `id` Cookie；`storage.session` 只保存按 Origin 分开的临时 SID。
- 插件包中只有 `handoff.html` 被声明为 Web Accessible Resource，用于 Chrome 重定向；页面再次验证站点已授权后才访问 NAS。
- SID 在外部播放器 URL 中的风险尚未完全消除，属于明确的**已知限制**。

## 开发与测试

```bash
node --version  # 推荐 Node.js 20+
npm test
npm run check
```

测试不连接真实 NAS，不包含真实视频、域名、密码或 SID。更多内容参见 [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md)。

## 反馈

请使用 GitHub Issues。不要在 Issues 中附带私人 NAS 域名、完整路径、SID、Cookie 或登录记录。

**关键词：** DS file for Mac、Synology DS file macOS、群晖 DS file Mac 版、File Station Chrome IINA、NAS 视频本地播放器。

MIT License。
