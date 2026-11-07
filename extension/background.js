import {DEFAULT_SETTINGS, normalizeOrigin, normalizeTrustedOrigins, permissionPattern,
        buildRedirectRule, sidStorageKey} from "./common.js";

async function allowed(origin) {
  const sites = normalizeTrustedOrigins((await chrome.storage.local.get("trustedOrigins")).trustedOrigins);
  return sites.includes(origin) && await chrome.permissions.contains({origins: [permissionPattern(origin)]});
}

async function syncRedirectRules() {
  const current = await chrome.declarativeNetRequest.getDynamicRules();
  const {enabled} = await chrome.storage.local.get(DEFAULT_SETTINGS);
  const sites = normalizeTrustedOrigins((await chrome.storage.local.get("trustedOrigins")).trustedOrigins);
  const rules = [];
  if (enabled) {
    for (const site of sites) {
      if (!await chrome.permissions.contains({origins: [permissionPattern(site)]})) continue;
      const next = buildRedirectRule(site, rules.length + 1, chrome.runtime.getURL("handoff.html"));
      if (chrome.declarativeNetRequest.isRegexSupported) {
        const valid = await chrome.declarativeNetRequest.isRegexSupported({regex: next.condition.regexFilter, requireCapturing: true});
        if (!valid.isSupported) throw new Error("NAS URL 拦截规则不受 Chrome 支持");
      }
      rules.push(next);
    }
  }
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: current.map(rule => rule.id), addRules: rules
  });
  return rules.length;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.session.remove("sid").catch(() => {}); // Drop V0.2's global SID key.
  syncRedirectRules().catch(e => console.error("拦截规则更新失败", e.message));
});
chrome.runtime.onStartup.addListener(() => {
  syncRedirectRules().catch(e => console.error("拦截规则恢复失败", e.message));
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.trustedOrigins || changes.enabled)) {
    syncRedirectRules().catch(e => console.error("拦截规则更新失败", e.message));
  }
});
chrome.permissions.onRemoved.addListener(() => {
  syncRedirectRules().catch(e => console.error("权限撤销后规则清理失败", e.message));
});

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type === "checkHandoffOrigin") {
    const verified = typeof sender.url === "string" &&
      sender.url.startsWith(chrome.runtime.getURL("handoff.html?"));
    if (!verified) { respond({ok: false}); return false; }
    let origin;
    try { origin = normalizeOrigin(message.nasOrigin); }
    catch (_) {respond({ok:false});return false;}
    allowed(origin).then(ok => respond({ok, origin})).catch(() => respond({ok:false}));
    return true;
  }
  if (message?.type !== "closeHandoffTab") return false;
  const handoff = typeof sender.url === "string" &&
    sender.url.startsWith(chrome.runtime.getURL("handoff.html?"));
  if (!handoff || !Number.isInteger(sender.tab?.id)) {
    respond({ok:false,reason:"unauthorized"});return false;
  }
  chrome.tabs.remove(sender.tab.id)
    .then(() => respond({ok:true})).catch(() => respond({ok:false,reason:"close_failed"}));
  return true;
});
