import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {normalizeOrigin,normalizeTrustedOrigins,permissionPattern,
 buildRedirectRegex,parseLaunchParam,sidStorageKey} from '../extension/common.js';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../extension');
test('popup highlights authorized, revoked, unauthorized and unknown; two NAS remain distinct',async()=>{
 const html=fs.readFileSync(path.join(dir,'popup.html'),'utf8');
 assert.match(html,/id="authStatus"/);
 assert.match(html,/aria-live="polite"/);
 const src=fs.readFileSync(path.join(dir,'popup.js'),'utf8')
 .replace(/^import[\s\S]+?from "\.\/common\.js";/,'')
 .replace(/\nmain\(\)\.catch[\s\S]*$/,'');
 const sites=['http://nas-a.example:5000','https://nas-b.example:5443'];
 const granted=new Set(['http://nas-a.example/*']);
 const nodes=new Map();
 for(const id of ['authStatus','grant','removeSite','sites','nasOrigin','status'])
  nodes.set(id,{dataset:{},textContent:'',value:'',disabled:false});
 const ctx=vm.createContext({
  chrome:{storage:{local:{get:async()=>({trustedOrigins:sites})}},
          permissions:{contains:async({origins})=>granted.has(origins[0])}},
  document:{getElementById:id=>nodes.get(id)},
  normalizeOrigin,normalizeTrustedOrigins,permissionPattern,MAX_SITES:10,
  DEFAULT_SETTINGS:{},originFromTabUrl:()=>{},getSettings:()=>{},sidStorageKey:()=>{},console
 });
 vm.runInContext(src,ctx);
 nodes.get('nasOrigin').value=sites[0];
 await vm.runInContext('renderSites()',ctx);
 assert.equal(nodes.get('authStatus').dataset.state,'authorized');
 assert.equal(nodes.get('grant').disabled,true);
 assert.match(nodes.get('sites').textContent,/已登记 2 个 NAS/);
 nodes.get('nasOrigin').value=sites[1];
 await vm.runInContext('renderSiteStatus()',ctx);
 assert.equal(nodes.get('authStatus').dataset.state,'permission-lost');
 assert.equal(nodes.get('grant').disabled,false);
 granted.add('https://nas-b.example/*');
 await vm.runInContext('renderSiteStatus()',ctx);
 assert.equal(nodes.get('authStatus').dataset.state,'authorized');
 nodes.get('nasOrigin').value='https://nas-c.example:5555';
 await vm.runInContext('renderSiteStatus()',ctx);
 assert.equal(nodes.get('authStatus').dataset.state,'unauthorized');
 assert.equal(nodes.get('removeSite').disabled,true);
 nodes.get('nasOrigin').value='chrome://extensions';
 await vm.runInContext('renderSiteStatus()',ctx);
 assert.equal(nodes.get('authStatus').dataset.state,'unknown');
 assert.equal(nodes.get('grant').disabled,true);
 assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8')).permissions.includes('tabs'),false);
});
test('rules and SID keys do not cross between NAS A and NAS B',()=>{
 const a='http://nas-a.example:5000',b='https://nas-b.example:5443';
 const params=encodeURIComponent('player_id=streaming&path=%2Fvolume1%2Ftv%2Fclip.ts');
 const part='/?launchApp=SYNO.VideoController2.Application&SynoToken=redacted&launchParam='+params;
 assert.equal(new RegExp(buildRedirectRegex(a)).test(a+part),true);
 assert.equal(new RegExp(buildRedirectRegex(a)).test(b+part),false);
 assert.equal(new RegExp(buildRedirectRegex(b)).test(b+part),true);
 assert.equal(new RegExp(buildRedirectRegex(b)).test(a+part),false);
 assert.notEqual(sidStorageKey(a),sidStorageKey(b));
});
test('.ts extension and Unicode paths parse as a supported file type',()=>{
 const p='/volume1/tv/concert/episode12.ts';
 const parsed=parseLaunchParam(new URLSearchParams({path:p}).toString());
 assert.equal(parsed.filename,'episode12.ts');
 assert.equal(parsed.sharePath,'/tv/concert/episode12.ts');
});
