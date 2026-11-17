# Security / 安全说明

## 简体中文

本项目是**未经独立安全审计的社区预览版**，不是完整的 NAS 身份认证客户端。涉及真实凭据的安全问题请优先使用 GitHub 私密漏洞报告渠道（如已启用），不要在公开 Issue 中贴出 NAS 域名、SID、Cookie 或密码。

**关键风险**

1. File Station 的 _sid 是**会话凭据**，不只是一个视频的分享权限。插件目前把 SID 放入交给 IINA 的视频 URL，可能留存在操作系统、播放器、诊断记录中，切勿转发。
2. **HTTP 明文传输。** 处于网络路径的攻击者可能窃听账号、SID、路径和视频。正确验证证书的 HTTPS 能保护传输过程，但无法保护播放器和本地日志中已出现的 SID。
3. 旧版本 DSM 的公网管理界面有独立风险，插件不能修复 NAS 漏洞。建议使用只读账号、限制共享目录权限。
4. IINA 1.4.4 之前的 URL 处理器存在已修复的安全问题。建议只使用 **IINA 1.4.4 或更新版**。

**当前保护措施**

- 源码、安装包中不写入任何用户的 NAS 域名、视频路径或 SID。
- 每个 NAS 入口由用户首次授权；按协议、主机名、端口精确匹配拦截规则，临时 SID 按 Origin 分开缓存。
- 不在安装时取得所有站点的访问权限；Chrome 站点授权本身可能覆盖该主机的其他端口，拦截规则仍检查具体端口。
- NAS 密码不持久化，HTTP 密码登录需额外确认；不执行 NAS 文件修改、删除，也不访问第三方服务器。
- 复制包含 SID 的播放链接前会提示确认；旧版全局 SID 缓存迁移时清理。

**仍存在的限制**

- 完全消除 SID 在 IINA URL 中出现，需要额外设计受控本地代理或原生应用连接，此能力当前未实现。
- 交接页会再次检查站点是否确实授权，才读取 Cookie 或访问 NAS。
- 自动关闭标签依靠页面失焦估计 IINA 接管，不能证明播放器已经正常启动。
- DSM 7.x、非根路径反向代理及不同 Cookie 登录方式仍待实际兼容性测试。

日常建议：仅授权自己的 NAS、使用只读账号和可信 HTTPS、不要共享视频直链或调试日志，结束后必要时注销 NAS 会话。相关数据处理见 [隐私说明](PRIVACY.md)。

## English

This is an **unaudited community preview**, not a hardened NAS authentication client. Use GitHub's private vulnerability reporting if available; never publish a live NAS URL, SID, Cookie or password.

**Primary risks**

1. A File Station _sid is a **login-session credential**, not a single-file capability. The current extension sends a SID inside the IINA playback URL; it may be retained in OS or player history and logs. Never share it.
2. **HTTP is unencrypted.** Network observers may read login credentials, SIDs, file paths and video data. Correctly validated HTTPS protects data in transit but not a SID already delivered to a local player or log.
3. Exposing an outdated DSM management interface to the internet presents independent risks. This extension does not patch the NAS. Prefer a read-only NAS account with limited shared-folder access.
4. Older IINA URL handlers contained a security issue. **Use IINA 1.4.4 or newer.**

**Current mitigations**

- No private NAS address, filename or SID is hardcoded in source or release packages.
- Explicit per-origin authorization before interception; rules match scheme, host and port, and temporary SID cache is origin-scoped.
- No blanket host access granted on installation. Note Chrome's site permission may cover multiple ports of one host even though the interception rule checks the exact port.
- Passwords are not persisted; HTTP password login requires explicit risk acknowledgment. The extension performs no NAS file mutation and includes no third-party telemetry.
- Copying a SID-bearing playback URL requires confirmation, and the former global SID cache is cleared during migration.

**Remaining limitations**

- Keeping SID out of the player URL requires a separately reviewed local proxy or native host; this is not implemented.
- The handoff page checks origin authorization again before reading cookies or contacting the NAS.
- Loss of browser focus does not prove the native player started successfully.
- DSM 7.x, reverse proxies with non-root paths and alternative DSM login cookies are not fully field-tested.

Use least-privilege accounts, properly verified HTTPS, revoke unused site permissions and never share playback URLs or debug logs. See [Privacy](PRIVACY.md).
