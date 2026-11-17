import {
  normalizeOrigin, sidStorageKey, parseLaunchParam, buildPlaybackUrl,
  buildIinaUrl, getSettings, normalizeSid, t, localizePage
} from "./common.js";

const $ = id => document.getElementById(id);
let movie = null;
let settings = null;
let playUrl = null;
let nasOrigin = null;
let closeArmedAt = 0;
let closeTimer = null;
const AUTO_CLOSE_WINDOW_MS = 20000;
const AUTO_CLOSE_DELAY_MS = 5000;

// 无原生消息宿主时，Chrome 无法验证 IINA 进程或播放成功。
// 因此仅在发出 iina:// 调用且交接页失去焦点后尝试关闭；失败时仍留有手动重试入口。
function stopCloseTimer() {
  if (closeTimer !== null) clearTimeout(closeTimer);
  closeTimer = null;
}
async function closeThisHandoffTab() {
  closeArmedAt = 0;
  stopCloseTimer();
  try {
    const result = await chrome.runtime.sendMessage({type: "closeHandoffTab"});
    if (result?.ok !== true) status(t("closeFailed"), "bad");
  } catch (_err) {
    status(t("closeFailed"), "bad");
  }
}
function scheduleCloseIfPlayerTookFocus() {
  if (!settings?.autoClose || !closeArmedAt || Date.now() - closeArmedAt > AUTO_CLOSE_WINDOW_MS) return;
  if (document.hasFocus() && document.visibilityState === "visible") return;
  stopCloseTimer();
  closeTimer = setTimeout(() => {
    if (!settings?.autoClose || !closeArmedAt || Date.now() - closeArmedAt > AUTO_CLOSE_WINDOW_MS) return;
    if (!document.hasFocus() || document.visibilityState === "hidden") {
      void closeThisHandoffTab();
    }
  }, AUTO_CLOSE_DELAY_MS);
}


function status(message, type = "info") {
  $("status").textContent = message;
  $("status").dataset.type = type;
}
function renderPlay(sid, shouldAutoOpen) {
  playUrl = buildPlaybackUrl(nasOrigin, movie.sharePath, sid);
  $("controls").hidden = false;
  $("loginBox").hidden = true;
  status(t("playReady"), "ok");
  if (shouldAutoOpen) launchPlayer();
}
function launchPlayer() {
  if (!playUrl) return;
  // 浏览器可能阻止未经明确点击的外部协议调用；始终保留手动按钮。
  stopCloseTimer();
  closeArmedAt = settings?.autoClose ? Date.now() : 0;
  try {
    window.location.href = buildIinaUrl(playUrl);
    if (settings?.autoClose) {
      status(t("launchSent"), "ok");
      scheduleCloseIfPlayerTookFocus();
    }
  } catch (_err) {
    closeArmedAt = 0;
    status(t("launchFailed"), "bad");
  }
}

async function testSid(sid) {
  // 只读权限验证，不发起下载、更改或删除；不向第三方服务器发送会话。
  const params = new URLSearchParams({
    api: "SYNO.FileStation.List", version: "2", method: "list_share", _sid: sid
  });
  const res = await fetch(`${nasOrigin}/webapi/entry.cgi?${params}`, {
    method: "GET", cache: "no-store", credentials: "omit"
  });
  if (!res.ok) return false;
  const body = await res.json();
  return body.success === true;
}

async function getBrowserCookieSid() {
  try {
    const cookie = await chrome.cookies.get({url: nasOrigin + "/", name: "id"});
    return normalizeSid(cookie?.value);
  } catch (_) { return null; }
}

async function getSid() {
  const key = sidStorageKey(nasOrigin);
  const old = await chrome.storage.session.get(key);
  const candidates = [normalizeSid(old[key]), await getBrowserCookieSid()];
  for (const sid of candidates) {
    if (!sid) continue;
    try {
      if (await testSid(sid)) {
        await chrome.storage.session.set({[key]: sid});
        return sid;
      }
    } catch (e) {
      status(t("nasUnavailable", String(e.message || e)), "bad");
    }
  }
  await chrome.storage.session.remove(key);
  return null;
}

async function loginWithAccount(event) {
  event.preventDefault();
  const account = $("account").value.trim();
  const password = $("password").value;
  if (!account || !password) return;
  if (nasOrigin.startsWith("http://") && !$("httpConsent").checked) {
    status(t("httpConsentRequired"), "bad");
    return;
  }
  $("login").disabled = true;
  status(t("loginProgress"));
  try {
    const form = new URLSearchParams({
      api: "SYNO.API.Auth", version: "3", method: "login",
      account, passwd: password, session: "FileStation", format: "sid"
    });
    const res = await fetch(nasOrigin + "/webapi/auth.cgi", {
      method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"},
      body: form.toString(), credentials: "omit", cache: "no-store"
    });
    const data = await res.json();
    const sid = normalizeSid(data?.data?.sid);
    if (!res.ok || !data.success || !sid) {
      throw new Error(t("loginFailed", data?.error?.code ?? t("unknownError")));
    }
    if (!await testSid(sid)) throw new Error(t("loginPermissionFailed"));
    await chrome.storage.session.set({[sidStorageKey(nasOrigin)]: sid});
    $("password").value = "";
    renderPlay(sid, true);
  } catch (err) {
    status(err.message || "登录失败", "bad");
  } finally {
    $("password").value = "";
    $("login").disabled = false;
  }
}

async function main() {
  localizePage();
  window.addEventListener("blur", scheduleCloseIfPlayerTookFocus);
  window.addEventListener("focus", stopCloseTimer);
  document.addEventListener("visibilitychange", scheduleCloseIfPlayerTookFocus);
  $("play").addEventListener("click", launchPlayer);
  $("copy").addEventListener("click", async () => {
    if (!playUrl) return;
    if (!confirm(t("copyConfirmation"))) return;
    try { await navigator.clipboard.writeText(playUrl); status(t("copySuccess"), "ok"); }
    catch { status(t("copyFailed"), "bad"); }
  });
  $("loginForm").addEventListener("submit", loginWithAccount);
  $("settings").addEventListener("click", () => window.open(chrome.runtime.getURL("popup.html"), "_blank"));

  try {
    settings = await getSettings();
    const url = new URL(location.href);
    nasOrigin = normalizeOrigin(url.searchParams.get("nasOrigin"));
    const authorized = await chrome.runtime.sendMessage({type:"checkHandoffOrigin", nasOrigin});
    if (!authorized?.ok) throw new Error(t("siteNotAuthorized"));
    $("site").textContent = nasOrigin;
    $("httpConsentRow").hidden = !nasOrigin.startsWith("http://");
    const input = url.searchParams.get("launchParam");
    movie = parseLaunchParam(input);
    $("file").textContent = movie.filename;
    const sid = await getSid();
    if (sid) renderPlay(sid, settings.autoOpen);
    else {
      $("loginBox").hidden = false;
      status(t("browserCookieUnavailable"), "bad");
    }
  } catch (err) {
    status(t("nasParseFailed", err?.message || String(err)), "bad");
  }
}

main();
