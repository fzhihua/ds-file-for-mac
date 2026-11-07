import {MAX_SITES, DEFAULT_SETTINGS, originFromTabUrl, normalizeOrigin,
        normalizeTrustedOrigins, permissionPattern, getSettings, sidStorageKey} from "./common.js";
const $ = id => document.getElementById(id);
let detected = null;
function message(text) {$("status").textContent = text;}
async function renderSites() {
  const sites = normalizeTrustedOrigins((await chrome.storage.local.get("trustedOrigins")).trustedOrigins);
  $("sites").textContent = sites.length ? "已授权的站点：" + sites.join("，") : "尚未授权 NAS 站点";
}
function currentOrigin() {return normalizeOrigin($("nasOrigin").value.trim() || detected || "");}
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
  $("grant").addEventListener("click", () => addSite().catch(e=>message("授权失败："+e.message)));
  $("removeSite").addEventListener("click", () => removeSite().catch(e=>message("移除失败："+e.message)));
  $("clear").addEventListener("click", async ()=>{
    await chrome.storage.session.clear();
    message("临时 SID 已清除；NAS 浏览器登录未受影响。");
  });
  await renderSites();
  message("已加载设置。首次使用请授权当前 NAS。" );
}
main().catch(e=>message("初始化失败："+e.message));
