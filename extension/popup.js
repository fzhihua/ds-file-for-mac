import {MAX_SITES, DEFAULT_SETTINGS, originFromTabUrl, normalizeOrigin,
        normalizeTrustedOrigins, permissionPattern, getSettings, sidStorageKey} from "./common.js";
const $ = id => document.getElementById(id);
let detected = null;
let statusRevision = 0;
function message(text) {$("status").textContent = text;}
function currentOrigin() {return normalizeOrigin($("nasOrigin").value.trim() || detected || "");}
async function renderSiteStatus() {
  const rev = ++statusRevision;
  let site;
  try {site = currentOrigin();} catch (_) {
    $("authStatus").dataset.state = "unknown";
    $("authStatus").textContent = "未识别 NAS · 请先打开 File Station，或填写 NAS 入口";
    $("grant").disabled = true;
    $("removeSite").disabled = true;
    return;
  }
  const [saved, permission] = await Promise.all([
    chrome.storage.local.get("trustedOrigins"),
    chrome.permissions.contains({origins:[permissionPattern(site)]})
  ]);
  if (rev !== statusRevision) return;
  const registered = normalizeTrustedOrigins(saved.trustedOrigins).includes(site);
  const state = registered && permission ? "authorized" : registered ? "permission-lost" : "unauthorized";
  $("authStatus").dataset.state = state;
  $("authStatus").textContent = state === "authorized"
    ? "已授权 · 当前 NAS 可以自动截获播放"
    : state === "permission-lost"
    ? "授权失效 · Chrome 站点权限已撤销，请重新授权"
    : "未授权 · 首次使用请点击“授权当前 NAS”";
  $("grant").disabled = state === "authorized";
  $("grant").textContent = state === "authorized" ? "当前 NAS 已授权" : "授权当前 NAS";
  $("removeSite").disabled = !registered;
}
async function renderSites() {
  const sites = normalizeTrustedOrigins((await chrome.storage.local.get("trustedOrigins")).trustedOrigins);
  const values = await Promise.all(sites.map(async site => {
    const valid = await chrome.permissions.contains({origins:[permissionPattern(site)]});
    return (valid ? "已授权：" : "权限失效：") + site;
  }));
  $("sites").textContent = sites.length
    ? "已登记 " + sites.length + " 个 NAS 入口（分别授权、分别缓存 SID）\n" + values.join("\n")
    : "尚未登记任何 NAS 站点";
  await renderSiteStatus();
}
async function addSite() {
  const site = currentOrigin();
  // Request immediately from the click gesture. Previously awaiting contains()
  // could consume the browser's transient user activation.
  const granted = await chrome.permissions.request({origins:[permissionPattern(site)]});
  if (!granted) {message("没有获得 NAS 站点权限，未启用拦截。");return;}
  const sites = normalizeTrustedOrigins((await chrome.storage.local.get("trustedOrigins")).trustedOrigins);
  if (!sites.includes(site)) {
    if (sites.length >= MAX_SITES) throw new Error(`最多授权 ${MAX_SITES} 个 NAS 入口`);
    sites.push(site);
    await chrome.storage.local.set({trustedOrigins:sites});
  }
  message(`已授权 ${site}。返回 File Station 后可直接点击视频“播放”。`);
  await renderSites();
}
async function removeSite() {
  const site = currentOrigin();
  const sites = normalizeTrustedOrigins((await chrome.storage.local.get("trustedOrigins")).trustedOrigins);
  const remaining = sites.filter(s=>s!==site);
  await chrome.storage.local.set({trustedOrigins:remaining});
  await chrome.storage.session.remove(sidStorageKey(site));
  // Keep host permission if another authorized origin on the same host still needs it.
  if (!remaining.some(s=>permissionPattern(s)===permissionPattern(site))) {
    await chrome.permissions.remove({origins:[permissionPattern(site)]});
  }
  message(`已移除 ${site} 的拦截授权。`);
  await renderSites();
}
async function main() {
  const settings = await getSettings();
  for (const key of ["enabled","autoOpen","autoClose"]) {
    $(key).checked = settings[key];
    $(key).addEventListener("change", () => chrome.storage.local.set({[key]:$(key).checked})
      .then(()=>message("已保存设置。"))
      .catch(e=>message(e.message)));
  }
  const tabs = await chrome.tabs.query({active:true,currentWindow:true});
  try {
    detected = originFromTabUrl(tabs[0]?.url);
    $("nasOrigin").value = detected;
    $("detected").textContent = "当前网页识别为：" + detected;
  } catch (_) {
    $("detected").textContent = "当前标签页不是普通 HTTP(S) 页面；可手动填写 NAS 入口。";
  }
  $("nasOrigin").addEventListener("input", () => { void renderSiteStatus(); });
  $("grant").addEventListener("click", () => addSite().catch(e=>message("授权失败："+e.message)));
  $("removeSite").addEventListener("click", () => removeSite().catch(e=>message("移除失败："+e.message)));
  $("clear").addEventListener("click", async ()=>{
    await chrome.storage.session.clear();
    message("临时 SID 已清除；NAS 浏览器登录未受影响。");
  });
  await renderSites();
  message("设置已加载。上方显示当前 NAS 实际授权状态。" );
}
main().catch(e=>message("初始化失败："+e.message));
