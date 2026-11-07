import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {
 normalizeOrigin,originFromTabUrl,permissionPattern,normalizeTrustedOrigins,
 buildRedirectRegex,buildRedirectRule,parseLaunchParam,normalizeSid,
 buildPlaybackUrl,buildIinaUrl,sharePathToHex,sidStorageKey
} from '../extension/common.js';

const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../extension');
const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));

test('manifest uses MV3, optional host access and no private NAS data',()=>{
 assert.equal(manifest.version,'0.3.2');
 assert.equal(manifest.manifest_version,3);
 assert.deepEqual(manifest.host_permissions,undefined);
 assert.deepEqual(manifest.optional_host_permissions,['http://*/*','https://*/*']);
 assert.ok(manifest.permissions.includes('activeTab'));
 assert.ok(manifest.permissions.includes('declarativeNetRequestWithHostAccess'));
 assert.deepEqual(manifest.web_accessible_resources[0].resources,['handoff.html']);
 for(const f of fs.readdirSync(dir)) {
  const content=fs.readFileSync(path.join(dir,f),'utf8');
  assert.doesNotMatch(content,/SynoToken=d[\w.]+|_sid=%22[A-Za-z0-9_-]{40}/);
 }
});

test('trust origin parsing prevents credentials, non-http schemes and query injection',()=>{
 assert.equal(normalizeOrigin('https://nas.example:5443'),'https://nas.example:5443');
 assert.equal(originFromTabUrl('http://nas.example:5080/webman/index.cgi?x=1'),'http://nas.example:5080');
 assert.equal(permissionPattern('https://nas.example:5443'),'https://nas.example/*');
 for(const input of ['javascript:alert(1)','file:///etc/passwd','https://u:p@nas.example/',
   'https://nas.example/path','https://nas.example?sid=abc','https://nas.example/#x']) {
  assert.throws(()=>normalizeOrigin(input));
 }
 assert.deepEqual(normalizeTrustedOrigins(['https://nas.example:5001','https://nas.example:5001','bad','http://nas2.example:5000']),['https://nas.example:5001','http://nas2.example:5000']);
});

test('DNR matches ONLY authorized scheme, hostname, port and exact player launch route',()=>{
 const origin='https://nas.example:5443';
 const rx=new RegExp(buildRedirectRegex(origin));
 const launch=encodeURIComponent('player_id=streaming&path=%2Fvolume1%2Fmovie%2Fsample.mp4');
 const source=`${origin}/?launchApp=SYNO.VideoController2.Application&SynoToken=NOT_A_SID&launchParam=${launch}`;
 const m=rx.exec(source);
 assert.ok(m);
 assert.equal(m[1],origin);
 assert.equal(m[2],launch);
 const rule=buildRedirectRule(origin,1,'chrome-extension://id/handoff.html');
 const redirected=source.replace(rx,(_,a,b)=>`chrome-extension://id/handoff.html?nasOrigin=${a}&launchParam=${b}`);
 assert.equal(new URL(redirected).searchParams.get('nasOrigin'),origin);
 assert.equal(new URL(redirected).searchParams.get('launchParam'),decodeURIComponent(launch));
 assert.equal(redirected.includes('SynoToken'),false);
 assert.equal(rule.condition.resourceTypes[0],'main_frame');
 for(const invalid of [source.replace('https:','http:'),source.replace(':5443',':55002'),source.replace('nas.example','nas.example.attacker.invalid'),
  source.replace('launchApp=SYNO.VideoController2.Application','launchApp=SYNO.Other'),
  source.replace('/?launchApp','/unrelated?launchApp')]) assert.equal(rx.test(invalid),false);
});

test('playback URL preserves UTF-8 path and dynamic origin; SID is scoped by origin',()=>{
 const p='/volume2/movie/test/示例 4K.mp4';
 const video=parseLaunchParam(new URLSearchParams({path:p}).toString());
 assert.equal(video.sharePath,'/movie/test/示例 4K.mp4');
 const sid='abcD123_'.repeat(9);
 const url=buildPlaybackUrl('https://nas.example:5443',video.sharePath,sid);
 const parsed=new URL(url);
 assert.equal(parsed.origin,'https://nas.example:5443');
 assert.equal(parsed.searchParams.get('_sid'),'"'+sid+'"');
 assert.equal(parsed.searchParams.get('mode'),'open');
 assert.equal(parsed.searchParams.get('dlink'),'"'+sharePathToHex(video.sharePath)+'"');
 assert.equal(decodeURIComponent(parsed.pathname).endsWith('示例 4K.mp4'),true);
 assert.equal(new URL(buildIinaUrl(url)).searchParams.get('url'),url);
 assert.notEqual(sidStorageKey('http://nas.example:5080'),sidStorageKey('https://nas.example:5443'));
 assert.equal(normalizeSid('bad&sid'),null);
 for(const invalid of ['/volume1/movie/../bad.mp4','/volume1/movie/./bad.mp4','/volume1/movie/not-video.txt']) {
  assert.throws(()=>parseLaunchParam(new URLSearchParams({path:invalid}).toString()));
 }
});

test('background only creates DNR for explicitly trusted and permitted origins, and guards close',async()=>{
 const src=fs.readFileSync(path.join(dir,'background.js'),'utf8').replace(/^import[\s\S]+?from "\.\/common\.js";/,'');
 const listeners={};const stored={enabled:true,trustedOrigins:['http://nas.example:5000','https://nas.example:5001']};
 const granted=new Set(['http://nas.example/*']);
 let rules=[];const removed=[];
 const chrome={
  runtime:{getURL:s=>`chrome-extension://extension/${s}`,
   onInstalled:{addListener:f=>listeners.onInstalled=f},onStartup:{addListener:f=>listeners.onStartup=f},
   onMessage:{addListener:f=>listeners.onMessage=f}},
  storage:{local:{get:async k=>typeof k==='string'?{[k]:stored[k]}:{...k,...stored}},session:{remove:async()=>{}},
   onChanged:{addListener:f=>listeners.onChanged=f}},
  permissions:{contains:async ({origins})=>granted.has(origins[0]),onRemoved:{addListener:f=>listeners.onRemoved=f}},
  declarativeNetRequest:{getDynamicRules:async()=>rules,
   isRegexSupported:async()=>({isSupported:true}),
   updateDynamicRules:async ({addRules,removeRuleIds})=>{removed.push(removeRuleIds);rules=addRules;}},
  tabs:{remove:async id=>{removed.push(['tab',id]);}}
 };
 const context=vm.createContext({chrome,console,DEFAULT_SETTINGS:{enabled:true,autoOpen:true,autoClose:true},normalizeOrigin,normalizeTrustedOrigins,
   permissionPattern,buildRedirectRule,sidStorageKey});
 vm.runInContext(src,context);
 assert.equal(typeof listeners.onStartup,'function');
 listeners.onStartup();await new Promise(r=>setTimeout(r,15));
 assert.equal(rules.length,1);
 assert.equal(rules[0].action.redirect.regexSubstitution.includes('nasOrigin=\\1'),true);
 // Attack site is not listed even if host permission was granted.
 const check=(origin,sender)=>new Promise(resolve=>listeners.onMessage({type:'checkHandoffOrigin',nasOrigin:origin},sender,resolve));
 const trusted={url:'chrome-extension://extension/handoff.html?nasOrigin=http://nas.example:5000',tab:{id:22}};
 assert.equal((await check('http://nas.example:5000',trusted)).ok,true);
 assert.equal((await check('https://nas.example:5001',trusted)).ok,false);
 assert.equal((await check('http://attacker.invalid',trusted)).ok,false);
 assert.equal((await check('http://nas.example:5000',{url:'https://attacker.invalid',tab:{id:23}})).ok,false);
 await new Promise(resolve=>listeners.onMessage({type:'closeHandoffTab'},trusted,resolve));
 assert.deepEqual(removed.at(-1),['tab',22]);
 let badResult=null;assert.equal(listeners.onMessage({type:'closeHandoffTab'},{url:'https://attacker.invalid',tab:{id:999}},r=>badResult=r),false);
 assert.equal(badResult.ok,false);
 assert.notDeepEqual(removed.at(-1),['tab',999]);
 stored.enabled=false;listeners.onChanged({enabled:{newValue:false}},'local');
 await new Promise(r=>setTimeout(r,15));assert.equal(rules.length,0);
});

test('handoff guards origin before reading cookies or sending requests and keeps close fallback',()=>{
 const handoff=fs.readFileSync(path.join(dir,'handoff.js'),'utf8');
 const src=handoff.replace(/^import[\s\S]+?from "\.\/common\.js";/,'');
 assert.ok(src.includes('type:"checkHandoffOrigin"'));
 assert.ok(src.indexOf('checkHandoffOrigin') < src.indexOf('const sid = await getSid();'));
 assert.ok(src.includes('sidStorageKey(nasOrigin)'));
 assert.ok(!src.includes('settings.baseUrl'));
 assert.ok(src.includes('settings?.autoClose'));
 assert.ok(src.includes('AUTO_CLOSE_DELAY_MS = 5000'));
 assert.ok(src.includes('window.addEventListener("blur"'));
 assert.ok(src.includes('settings?.autoClose ? Date.now() : 0'));
});
