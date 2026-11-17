import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {t,localizePage} from '../extension/common.js';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../extension');
const en=JSON.parse(fs.readFileSync(path.join(dir,'_locales/en/messages.json'),'utf8'));
const zh=JSON.parse(fs.readFileSync(path.join(dir,'_locales/zh_CN/messages.json'),'utf8'));
const read=name=>fs.readFileSync(path.join(dir,name),'utf8');
function translated(locale,key,...args) {
 return (locale[key]?.message ?? key).replace(/\{(\d+)\}/g,(_,i)=>String(args[Number(i)]??''));
}
test('Chrome manifest and Chinese/English catalogs are complete',()=>{
 const manifest=JSON.parse(read('manifest.json'));
 assert.equal(manifest.version,'0.3.3');
 assert.equal(manifest.default_locale,'en');
 for(const [field,key] of [['name','appName'],['short_name','appShortName'],['description','appDescription']])
  assert.equal(manifest[field],'__MSG_'+key+'__');
 assert.equal(manifest.action.default_title,'__MSG_actionTitle__');
 assert.deepEqual(Object.keys(en).sort(),Object.keys(zh).sort());
 assert.ok(Object.keys(en).length>=75);
 const placeholders=s=>[...s.matchAll(/\{(\d+)\}/g)].map(x=>x[1]).sort().join(',');
 for(const [key,value] of Object.entries(en)){
  assert.ok(typeof value.message==='string'&&value.message.length>0,'Missing English '+key);
  assert.ok(typeof zh[key]?.message==='string'&&zh[key].message.length>0,'Missing Chinese '+key);
  assert.equal(placeholders(value.message),placeholders(zh[key].message),'Placeholder mismatch: '+key);
 }
});
test('all visible HTML and runtime translation keys exist in both locales',()=>{
 const content=['popup.html','handoff.html','popup.js','handoff.js','common.js'].map(read).join('\n');
 const names=new Set();
 for(const match of content.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g))names.add(match[1]);
 for(const match of content.matchAll(/\bt\("([^"]+)"/g))names.add(match[1]);
 for(const key of ['siteAuthorizedPrefix','sitePermissionLostPrefix'])names.add(key);
 for(const key of names){assert.ok(en[key],'Missing English '+key);assert.ok(zh[key],'Missing Chinese '+key);}
 assert.ok(names.size>=65,'Too few localized keys');
});
test('Chrome UI language selects both catalog messages and DOM strings',()=>{
 const saved=globalThis.chrome;
 try{
  globalThis.chrome={i18n:{getMessage:key=>translated(en,key)}};
  assert.equal(t('authorizedStatus'),en.authorizedStatus.message);
  assert.match(t('grantSuccess','https://nas.example:5001'),/Authorized https:\/\/nas/);
  const titleNode={getAttribute:()=> 'popupTitle',textContent:''};
  const placeholderNode={getAttribute:()=> 'originPlaceholder',placeholder:''};
  const root={documentElement:{lang:''},querySelectorAll:selector=>
    selector==='[data-i18n]'?[titleNode]:selector==='[data-i18n-placeholder]'?[placeholderNode]:[]};
  localizePage(root);assert.equal(root.documentElement.lang,'en');
  assert.equal(titleNode.textContent,en.popupTitle.message);
  globalThis.chrome={i18n:{getMessage:key=>translated(zh,key)}};
  localizePage(root);assert.equal(root.documentElement.lang,'zh-CN');
  assert.equal(titleNode.textContent,zh.popupTitle.message);
  assert.match(t('grantSuccess','https://nas.example:5001'),/已授权 https:\/\/nas/);
 }finally{
  if(saved===undefined)delete globalThis.chrome;else globalThis.chrome=saved;
 }
});
test('English authorization state renders for two different NAS sites',async()=>{
 const src=read('popup.js').replace(/^import[\s\S]+?from "\.\/common\.js";/,'').replace(/\nmain\(\)\.catch[\s\S]*$/,'');
 const nodes=new Map(['authStatus','grant','removeSite','sites','nasOrigin','status'].map(id=>[id,{dataset:{},textContent:'',value:'',disabled:false}]));
 const origin='https://nas.example:5443';
 const ctx=vm.createContext({
  chrome:{storage:{local:{get:async()=>({trustedOrigins:[origin]})}},permissions:{contains:async()=>true}},
  document:{getElementById:id=>nodes.get(id)},
  normalizeOrigin:value=>new URL(value).origin,normalizeTrustedOrigins:values=>values,permissionPattern:value=>value,
  t:(key,...args)=>translated(en,key,...args),localizePage:()=>{},MAX_SITES:10,
  getSettings:()=>{},DEFAULT_SETTINGS:{},originFromTabUrl:()=>{},sidStorageKey:()=>{},console
 });
 vm.runInContext(src,ctx);nodes.get('nasOrigin').value=origin;
 await vm.runInContext('renderSites()',ctx);
 assert.equal(nodes.get('authStatus').dataset.state,'authorized');
 assert.equal(nodes.get('authStatus').textContent,en.authorizedStatus.message);
 assert.match(nodes.get('sites').textContent,/NAS sites registered/);
});
