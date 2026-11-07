import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../extension');
const raw=fs.readFileSync(path.join(dir,'handoff.js'),'utf8');
const src=raw.replace(/^import[\s\S]+?from "\.\/common\.js";/,'').replace(/\nmain\(\);\s*$/,'');
function scenario() {
 let current=10000,hasFocus=true,visibilityState='visible',seq=1;
 const pending=new Map(),requests=[];
 const document={hasFocus:()=>hasFocus,get visibilityState(){return visibilityState},getElementById:()=>({textContent:'',dataset:{}})};
 const chrome={runtime:{sendMessage:async msg=>{requests.push(msg);return {ok:true}}}};
 const context=vm.createContext({
  chrome,document,window:{},console,Date:{now:()=>current},
  setTimeout:(fn,delay)=>{const id=seq++;pending.set(id,{fn,delay});return id},
  clearTimeout:id=>pending.delete(id),
  getSettings:()=>({}),normalizeOrigin:()=>{},sidStorageKey:()=>{},
  parseLaunchParam:()=>{},buildPlaybackUrl:()=>{},buildIinaUrl:()=>{},normalizeSid:()=>{}
 });
 vm.runInContext(src,context);
 vm.runInContext('settings={autoClose:true};',context);
 return {
  pending,requests,
  arm(){vm.runInContext('closeArmedAt=Date.now();',context)},
  check(){vm.runInContext('scheduleCloseIfPlayerTookFocus()',context)},
  focus:v=>{hasFocus=v},hidden:v=>{visibilityState=v?'hidden':'visible'},
  shiftTime:n=>{current+=n},
  async fire(){const item=[...pending.values()][0];pending.clear();item?.fn();await Promise.resolve()}
 };
}
test('5 second close delay; never close without opening player',()=>{
 assert.match(raw,/const AUTO_CLOSE_DELAY_MS = 5000;/);
 const s=scenario();s.focus(false);s.hidden(true);s.check();assert.equal(s.pending.size,0);
});
test('blur after opening player schedules 5000ms then closes own handoff',async()=>{
 const s=scenario();s.arm();s.focus(false);s.check();assert.equal(s.pending.size,1);
 assert.equal([...s.pending.values()][0].delay,5000);
 await s.fire();assert.equal(s.requests.length,1);assert.equal(s.requests[0].type,'closeHandoffTab');
});
test('return of focus before timeout prevents automatic close',async()=>{
 const s=scenario();s.arm();s.focus(false);s.check();s.focus(true);s.hidden(false);
 await s.fire();assert.equal(s.requests.length,0);
});
test('expired handoff window does not auto-close',()=>{
 const s=scenario();s.arm();s.shiftTime(21000);s.focus(false);s.check();assert.equal(s.pending.size,0);
});
test('manifest version is 0.3.2',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
 assert.equal(manifest.manifest_version,3);assert.equal(manifest.version,'0.3.2');
});
