import {MAX_SITES, DEFAULT_SETTINGS, originFromTabUrl, normalizeOrigin,
        normalizeTrustedOrigins, permissionPattern, getSettings, sidStorageKey, t, localizePage} from "./common.js";
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
    $("authStatus").textContent = t("unknownOrigin");
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
    ? t("authorizedStatus")
    : state === "permission-lost"
    ? t("permissionLostStatus")
    : t("unauthorizedStatus");
  $("grant").disabled = state === "authorized";
  $("grant").textContent = state === "authorized" ? t("authorizedButton") : t("grantSite");
  $("removeSite").disabled = !registered;
}
async function renderSites() {
  const sites = normalizeTrustedOrigins((await chrome.storage.local.get("trustedOrigins")).trustedOrigins);
  const values = await Promise.all(sites.map(async site => {
    const valid = await chrome.permissions.contains({origins:[permissionPattern(site)]});
    return t(valid ? "siteAuthorizedPrefix" : "sitePermissionLostPrefix", site);
  }));
  $("sites").textContent = sites.length
    ? t("registeredSites", sites.length) + "\n" + values.join("\n")
    : t("noRegisteredSites");
  await renderSiteStatus();
}
async function addSite() {
  const site = currentOrigin();
  // Request immediately from the click gesture. Previously awaiting contains()
  // could consume the browser's transient user activation.
  const granted = await chrome.permissions.request({origins:[permissionPattern(site)]});
  if (!granted) {message(t("sitePermissionDenied"));return;}
  const sites = normalizeTrustedOrigins((await chrome.storage.local.get("trustedOrigins")).trustedOrigins);
  if (!sites.includes(site)) {
    if (sites.length >= MAX_SITES) throw new Error(t("tooManySites", MAX_SITES));
    sites.push(site);
    await chrome.storage.local.set({trustedOrigins:sites});
  }
  message(t("grantSuccess", site));
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
  message(t("removeSuccess", site));
  await renderSites();
}
async function main() {
  localizePage();
  const settings = await getSettings();
  for (const key of ["enabled","autoOpen","autoClose"]) {
    $(key).checked = settings[key];
    $(key).addEventListener("change", () => chrome.storage.local.set({[key]:$(key).checked})
      .then(()=>message(t("settingsSaved")))
      .catch(e=>message(e.message)));
  }
  const tabs = await chrome.tabs.query({active:true,currentWindow:true});
  try {
    detected = originFromTabUrl(tabs[0]?.url);
    $("nasOrigin").value = detected;
    $("detected").textContent = t("detectedOrigin", detected);
  } catch (_) {
    $("detected").textContent = t("notOrdinaryTab");
  }
  $("nasOrigin").addEventListener("input", () => { void renderSiteStatus(); });
  $("grant").addEventListener("click", () => addSite().catch(e=>message(t("grantFailed", e.message))));
  $("removeSite").addEventListener("click", () => removeSite().catch(e=>message(t("removeFailed", e.message))));
  $("clear").addEventListener("click", async ()=>{
    await chrome.storage.session.clear();
    message(t("temporarySidCleared"));
  });
  await renderSites();
  message(t("settingsLoaded") );
}
main().catch(e=>message(t("initializationFailed", e.message)));
