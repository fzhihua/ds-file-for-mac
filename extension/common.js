// Shared pure helpers. No private NAS address, secret, or user-specific file path.
export const DEFAULT_SETTINGS = Object.freeze({enabled: true, autoOpen: true, autoClose: true});
export const MAX_SITES = 10;

export function normalizeOrigin(input) {
  if (typeof input !== "string" || input.length > 2048) throw new Error(t("invalidNasAddress"));
  const u = new URL(input);
  if (!["http:", "https:"].includes(u.protocol) || u.username || u.password ||
      u.pathname !== "/" || u.search || u.hash || !u.hostname) {
    throw new Error(t("invalidNasOriginFormat"));
  }
  return u.origin;
}

export function originFromTabUrl(tabUrl) {
  if (typeof tabUrl !== "string" || tabUrl.length > 8192) throw new Error(t("invalidCurrentTabUrl"));
  const u = new URL(tabUrl);
  return normalizeOrigin(u.origin);
}

// Chrome host match patterns intentionally do not contain ports. Our DNR regex
// and our trusted-origin list separately match the exact scheme, host AND port.
export function permissionPattern(origin) {
  const u = new URL(normalizeOrigin(origin));
  return `${u.protocol}//${u.hostname}/*`;
}

export function normalizeTrustedOrigins(value) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const x of value) {
    try {
      const origin = normalizeOrigin(x);
      if (!out.includes(origin) && out.length < MAX_SITES) out.push(origin);
    } catch (_) { /* Skip invalid legacy settings. */ }
  }
  return out;
}

export function buildRedirectRegex(origin) {
  const safeOrigin = normalizeOrigin(origin).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Capture exactly two values: origin and URL-encoded launchParam. Never copy SynoToken.
  return `^(${safeOrigin})/\\?launchApp=SYNO\\.VideoController2\\.Application(?:&[^#]*?)?&launchParam=([^&#]+)(?:&[^#]*)?$`;
}

export function buildRedirectRule(origin, ruleId, handoffUrl) {
  return {
    id: ruleId, priority: 1,
    action: {type: "redirect", redirect: {
      regexSubstitution: `${handoffUrl}?nasOrigin=\\1&launchParam=\\2`
    }},
    condition: {regexFilter: buildRedirectRegex(origin), resourceTypes: ["main_frame"]}
  };
}

export function parseLaunchParam(value) {
  if (typeof value !== "string" || value.length > 16000) throw new Error(t("invalidPlayerParams"));
  const args = new URLSearchParams(value);
  const physicalPath = args.get("path");
  if (!physicalPath || physicalPath.includes("\0")) throw new Error(t("invalidVideoPath"));
  const m = /^\/volume[1-9][0-9]*\/(.+)$/u.exec(physicalPath);
  if (!m) throw new Error(t("unsupportedPhysicalPath"));
  const parts = m[1].split("/");
  if (parts.length < 2 || parts.some(x => !x || x === "." || x === ".." || x.includes("\\"))) {
    throw new Error(t("invalidVideoSegments"));
  }
  const filename = parts.at(-1);
  if (!/\.(mp4|mkv|mov|m4v|avi|webm|wmv|flv|ts|m2ts|mpg|mpeg|3gp)$/i.test(filename)) {
    throw new Error(t("unsupportedMediaFile"));
  }
  return {physicalPath, sharePath: "/" + m[1], filename};
}

export function normalizeSid(value) {
  const sid = String(value ?? "").trim().replace(/^"|"$/g, "");
  return /^[A-Za-z0-9_-]{20,200}$/.test(sid) ? sid : null;
}

export function sharePathToHex(path) {
  return Array.from(new TextEncoder().encode(path), b => b.toString(16).padStart(2, "0")).join("");
}

export function buildPlaybackUrl(origin, sharePath, sid) {
  const base = normalizeOrigin(origin);
  if (!sharePath.startsWith("/") || sharePath.includes("\0") || !sharePath.includes("/", 1)) {
    throw new Error(t("invalidPlaybackPath"));
  }
  const goodSid = normalizeSid(sid);
  if (!goodSid) throw new Error(t("invalidSid"));
  const file = sharePath.split("/").at(-1);
  return `${base}/fbdownload/${encodeURIComponent(file)}?dlink=${encodeURIComponent('"'+sharePathToHex(sharePath)+'"')}&_sid=${encodeURIComponent('"'+goodSid+'"')}&mode=open`;
}

export function buildIinaUrl(playUrl) {
  const u = new URL(playUrl);
  if (!["http:", "https:"].includes(u.protocol)) throw new Error(t("unsupportedPlaybackProtocol"));
  // Never accept optional mpv_ flags: old IINA versions had an iina:// URL-handler flaw.
  return `iina://open?url=${encodeURIComponent(playUrl)}`;
}

export function sidStorageKey(origin) {
  return `fileStationSid:${normalizeOrigin(origin)}`;
}

export async function getSettings() {
  const x = await chrome.storage.local.get(DEFAULT_SETTINGS);
  return {enabled: Boolean(x.enabled), autoOpen: Boolean(x.autoOpen), autoClose: Boolean(x.autoClose)};
}


// Chrome selects translations from the browser UI language; other locales fall back to English.
export function t(key, ...args) {
  const message = typeof chrome !== "undefined" && chrome.i18n?.getMessage
    ? chrome.i18n.getMessage(key) : "";
  const template = message || key;
  return template.replace(/\{(\d+)\}/g, (_, index) => String(args[Number(index)] ?? ""));
}
export function localizePage(root = document) {
  root.documentElement.lang = t("languageCode");
  for (const node of root.querySelectorAll("[data-i18n]")) {
    node.textContent = t(node.getAttribute("data-i18n"));
  }
  for (const node of root.querySelectorAll("[data-i18n-placeholder]")) {
    node.placeholder = t(node.getAttribute("data-i18n-placeholder"));
  }
}
