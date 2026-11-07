# DS File for Mac

**非官方 Chrome 扩展：在 Mac 上获得类似 Synology DS file 手机 App 的“NAS 视频交给本地播放器”体验。**

**Unofficial Chrome extension inspired by Synology DS file.** Keep browsing files in Synology **File Station**, click **Play**, and have the video handed to **IINA** on macOS. No media-server installation or NAS file migration required.

> This is **not** a port of Synology's official DS file app, and is **not affiliated with or endorsed by Synology or IINA**. It only implements video playback handoff.

## 立即试用 V0.3.2 RC1（Mac + Chrome）

**[下载 V0.3.2 RC1 安装 ZIP](https://github.com/fzhihua/ds-file-for-mac/releases/download/v0.3.2-rc.1/ds-file-for-mac-v0.3.2.zip)** · [查看 Release](https://github.com/fzhihua/ds-file-for-mac/releases/tag/v0.3.2-rc.1)

> **这是 GitHub 预览版，不是 Chrome Web Store 已上架扩展。** 需要通过 Chrome「加载已解压的扩展程序」安装，**不能直接把 ZIP 拖进 Chrome**。ZIP 根目录含有 `manifest.json`，无须构建。

1. 确认 Mac 已安装 **IINA 1.4.4 或更新版本**。
2. 下载上面的 ZIP，解压到一个不会随意删除或移动的文件夹。
3. Chrome 打开 `chrome://extensions` → 开启「开发者模式」→「加载已解压的扩展程序」→ **选择解压后包含 `manifest.json` 的文件夹**。
4. **不要在同一个 Chrome 配置文件内同时启用 V0.2 和 V0.3.x 的自动拦截。** 推荐用新 Chrome 配置文件试用 V0.3；或者先把旧 V0.2 扩展禁用（不必卸载）。
5. 在该 Chrome 中打开你的 NAS **File Station** 并登录；点击工具栏中的 **DS File for Mac** 扩展图标，检查识别出的 NAS 地址并点击「授权当前 NAS」。
6. 返回 File Station，选视频点「播放」。Chrome 可能首次要求允许打开 IINA；选择允许。插件将调用 IINA，并尝试在切换焦点后约 5 秒关闭临时交接页。
7. 若没有拦截，先刷新 File Station 并检查扩展弹窗的站点授权和自动拦截开关；若交接页显示但没有自动播放，可点「用 IINA 播放」。

**授权状态与多 NAS：** 弹窗高亮显示当前 NAS 的“已授权 / 未授权 / 授权失效”，并分别列出已登记的 NAS。打开 NAS 的 File Station 后点击扩展图标会自动识别地址；Chrome 首次授权仍需用户点击确认，插件不会静默申请全站权限。不同 NAS 的 SID 会话缓存和拦截规则彼此隔离。

**TS 视频：** 文件路径解析已允许 `.ts`，但如果 File Station 对文件只执行下载、不产生 `SYNO.VideoController2.Application` 播放跳转，本插件不会自动截获；即便生成有效播放链接，TS 容器或编码仍需在 IINA 中验证。本发布不宣称已修复用户的具体 TS 播放问题。

**路径确认：** 也可以直接下载本仓库源码，在 `chrome://extensions` 中选择 `extension/` 文件夹（`manifest.json` 位于其中）。

**安全提醒：** 当前播放 URL 仍包含 NAS 会话 SID。只在自己的设备使用，不要分享播放链接、浏览器日志或含令牌截图；推荐使用验证证书的 HTTPS 和视频目录只读账户。HTTP 可能泄露登录和会话信息。详细见 [SECURITY.md](SECURITY.md)。

**自动关闭时序：** 只有已发出 IINA 打开指令，且交接标签页失去焦点或被隐藏后，才开始约 **5 秒**的关闭延迟。并非点击播放后固定 5 秒关闭。Chrome 无法核实 IINA 是否真正启动；首次外部应用授权弹窗可能影响焦点判断，遇到误关可在扩展设置中关闭自动收起。

## 当前状态 / Status

- **V0.2（个人使用版）**：DS218 / DSM 6.2.4 + Mac Chrome + IINA 实际播放及自动关闭临时标签，用户已验证。
- **V0.3.2（社区预览版）**：移除了私人 NAS 网址和历史会话数据；动态授权 NAS 站点，从截获 URL 自动识别协议、主机和端口；临时 SID 按站点隔离；包含本地测试。**尚未完成其他用户或 DSM 7.x 的端到端验收。**
- 尚未上架 Chrome Web Store，不保证 DSM 7.x 及各种登录模式兼容。

## 安装和使用（macOS + Chrome）

1. 安装 [IINA](https://iina.io/) **1.4.4 或以上**版本。
2. 从 GitHub 的本仓库 Releases 下载 `ds-file-for-mac-v0.3.2.zip`，解压到固定文件夹；或直接使用源码里的 `extension/` 文件夹。
3. 在 Chrome 打开 `chrome://extensions`，启用**开发者模式**，点击**加载已解压的扩展程序**，选择包含 `manifest.json` 的文件夹。
4. 用 Chrome 打开你的 NAS 的 File Station 网页并登录（例如 `https://nas.example.com:5001/`）。
5. 点击 Chrome 工具栏中的 **DS File for Mac** 图标，核对自动识别的站点地址，点击**授权当前 NAS**。只授予所选站点权限。必要时可在弹出窗口手动输入站点 Origin（不含路径/参数）。
6. 回到 File Station，选择视频点击**播放**。新标签页将转为插件交接页，并尝试启动 IINA。Chrome 可能首次询问是否允许打开外部应用。成功切换焦点后约 5 秒自动关闭临时标签页。
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
