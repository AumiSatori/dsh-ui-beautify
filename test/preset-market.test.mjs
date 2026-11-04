import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import vm from 'node:vm'
import {createSettingsTransfer} from '../src/settings-transfer.js'
import {scopeSettings,sharedPresetRecords,settingScope} from '../src/preset-scopes.js'
import {sha256,normalizePresetMeta,inspectPresetConfig,createPresetZip,inspectPresetZip} from '../src/preset-package.js'
import {normalizeMarketCatalog,trustedPresetAsset,createPresetMarket} from '../src/preset-market.js'
import {presetSubmissionUrl,nextPresetCatalog} from '../scripts/preset-market.mjs'
import {registerPresetMarket} from '../server/preset-market.js'

let registration
vm.runInNewContext(readFileSync(new URL('../client.js',import.meta.url),'utf8'),{window:{navigator:{userAgent:'test'},__ModuleLoader__:{load:spec=>{registration=spec}}},document:{documentElement:{hasAttribute:()=>false}}})
const normalize=registration.factory(()=>({})).__test.normalize
const config=(scope='sidebar',settings={sidebarStyle:'glass'})=>new Blob([JSON.stringify({format:'dsh-ui-beautify-config',version:1,scope,settings,layout:{widths:{version:1,window:1100,fullscreen:1500}}})])
const meta=async blob=>({format:'dsh-ui-preset',schemaVersion:1,id:'demo-preset',version:'1.0.0',title:'Demo',description:'A safe test preset',author:'test-author',scope:'sidebar',tags:['glass'],license:'MIT',configSha256:await sha256(blob)})
const pack=async(blob=config(),change={})=>{const metadata={...await meta(blob),...change};return createPresetZip(new Map([['manifest.json',new Blob([JSON.stringify(metadata)])],['config.dshui',blob]]))}

test('every runtime setting belongs to a supported sharing scope',()=>{
  for(const key of Object.keys(normalize(null)))assert.ok(key==='enabled'||settingScope(key),'unclassified setting: '+key)
})
test('package roundtrip validates metadata, CRC, configuration hash and declared scope',async()=>{
  const result=await inspectPresetZip(await pack())
  assert.equal(result.meta.scope,'sidebar');assert.equal(result.data.settings.sidebarStyle,'glass');assert.equal(result.files.size,2)
  assert.equal(Object.hasOwn(normalizePresetMeta({...result.meta,source:'official'}),'source'),false)
  const bytes=new Uint8Array(await (await pack()).arrayBuffer());bytes[45]^=1
  await assert.rejects(inspectPresetZip(new Blob([bytes])))
  await assert.rejects(inspectPresetZip(await pack(config(),{configSha256:'f'.repeat(64)})),/校验/)
})
test('package validation rejects cross-category changes, credentials and local file references',async()=>{
  await assert.rejects(inspectPresetConfig(config('sidebar',{sidebarStyle:'glass',composerStyle:'clear'}),'sidebar'),/分类以外/)
  await assert.rejects(inspectPresetConfig(config('hero',{heroGreetingCss:'url(file:///C:/private.png)'}),'hero'),/本机路径/)
  await assert.rejects(inspectPresetConfig(config('hero',{heroGreetingCss:'ghp_'+'x'.repeat(32)}),'hero'),/凭据/)
  await assert.rejects(inspectPresetZip(await pack(config(),{id:'../../outside'})),/ID/)
})
test('catalog constrains origins, official badges, unique IDs and trusted URLs',()=>{
  const catalog=JSON.parse(readFileSync(new URL('./fixtures/preset-market-catalog.json',import.meta.url)))
  assert.throws(()=>normalizeMarketCatalog({...catalog,presets:[catalog.presets[0],catalog.presets[0]]}),/重复/)
  assert.throws(()=>normalizeMarketCatalog({schemaVersion:1,presets:[{...catalog.presets[0],source:'community'}]}),/已审核/)
  assert.equal(trustedPresetAsset('https://github.com/AumiSatori/dsh-ui-beautify/releases/download/a/demo.zip'),true)
  for(const url of ['http://127.0.0.1/secret','https://github.com.evil.test/AumiSatori/dsh-ui-beautify/x','https://github.com/other/repo/releases/download/a/a.zip','file:///C:/a'])assert.equal(trustedPresetAsset(url),false)
})
test('production catalog is empty and retired bundled examples cannot reappear through stale mirrors',()=>{
  assert.deepEqual(normalizeMarketCatalog(JSON.parse(readFileSync(new URL('../market/catalog.json',import.meta.url)))),[])
  const item=JSON.parse(readFileSync(new URL('./fixtures/preset-market-catalog.json',import.meta.url))).presets[0]
  const old={...item,id:'official-soft-glass'}
  assert.deepEqual(normalizeMarketCatalog({schemaVersion:1,presets:[old]}),[])
  const uploaded={...old,settings:undefined,archiveUrl:'https://github.com/AumiSatori/dsh-ui-beautify/releases/download/new/new.zip',sha256:'a'.repeat(64)}
  assert.equal(normalizeMarketCatalog({schemaVersion:1,presets:[uploaded]}).length,1)
})
test('offline cache removes retired examples without removing unrelated presets',async()=>{
  const item=JSON.parse(readFileSync(new URL('./fixtures/preset-market-catalog.json',import.meta.url))).presets[0]
  const cache={at:Date.now(),catalog:{schemaVersion:1,presets:[{...item,id:'official-soft-glass'},item]}}
  const win={Blob,crypto,AbortController,setTimeout,clearTimeout,fetch:async()=>{throw Error('offline')},localStorage:{getItem:()=>JSON.stringify(cache)}}
  const manager=createPresetMarket(win,{}, {sources:['https://example.invalid/catalog']})
  const result=await manager.catalog();assert.equal(result.cached,true);assert.equal(result.items.length,1);assert.equal(result.items[0].id,item.id)
  manager.dispose()
})
test('single-component apply and undo preserve other settings, widths and navigation',async()=>{
  const storage=new Map(),localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}
  let current=normalize({composerStyle:'clear',sidebarStyle:'milk',particleCount:12000}),widths={version:1,window:900,fullscreen:1300}
  localStorage.setItem('dsh-ui-beautify:settings:v1',JSON.stringify(current));localStorage.setItem('dsh-ui-beautify:conversation-width:v1',JSON.stringify(widths));localStorage.setItem('dsh-ui-beautify:settings-tab:v1','market')
  const before=JSON.stringify(current)
  const transfer=createSettingsTransfer({...globalThis,Blob,crypto,localStorage},{normalize,getSettings:()=>current,getWidths:()=>widths,onApply:(settings,nextWidths)=>{current=settings;widths=nextWidths}})
  await transfer.apply(await transfer.inspect(config()),{preserveNavigation:true})
  assert.equal(current.sidebarStyle,'glass');assert.equal(current.composerStyle,'clear');assert.equal(current.particleCount,12000);assert.equal(widths.window,900);assert.equal(localStorage.getItem('dsh-ui-beautify:settings-tab:v1'),'market')
  await transfer.undo();assert.equal(JSON.stringify(current),before)
  await transfer.apply(await transfer.inspect(config('layout',{})));assert.equal(widths.window,1100);assert.equal(current.composerStyle,'clear')
})
test('sharing drops unrelated settings and unused historical media',()=>{
  assert.deepEqual(scopeSettings({sidebarStyle:'glass',composerStyle:'css'},'sidebar'),{sidebarStyle:'glass'})
  const records=[{store:'assets',key:'used',value:{revision:'used'}},{store:'assets',key:'private-old',value:{revision:'private-old'}},{store:'wallpaper',key:'selection',value:{schema:2,currentId:'used',previousId:'private-old',recent:[{revision:'used'},{revision:'private-old'}]}}]
  const result=sharedPresetRecords('dsh-ui-beautify-background',records,{backgroundEnabled:true,backgroundRevision:'used',backgroundThemes:{dark:{previousRevision:'private-old'}}})
  assert.equal(result.some(r=>r.key==='private-old'),false);assert.equal(result.at(-1).value.previousId,'');assert.deepEqual(result.at(-1).value.recent,[{revision:'used'}])
  const running=[{store:'packs',key:'selected'},{store:'packs',key:'other'},{store:'assets',key:'selected/one'},{store:'assets',key:'other/two'}]
  assert.equal(sharedPresetRecords('dsh-ui-beautify-running-packs',running,{runningAnimationPack:'selected'}).length,2)
})
test('review URLs require exactly one GitHub upload in the attachment field',()=>{
  assert.equal(presetSubmissionUrl('### 投稿 ZIP\n[demo.zip](https://github.com/user-attachments/files/123/demo.zip)\n### 分享确认\nyes'),'https://github.com/user-attachments/files/123/demo.zip')
  for(const body of ['### 投稿 ZIP\nhttp://localhost/private.zip','### 其他\nhttps://github.com/user-attachments/files/123/demo.zip','### 投稿 ZIP\nhttps://github.com/user-attachments/files/123/a.zip\nhttps://github.com/user-attachments/files/124/b.zip'])assert.throws(()=>presetSubmissionUrl(body))
})
test('publication separates official and community; protects versions and ownership',async()=>{
  const blob=config(),metadata=await meta(blob),options={source:'community',actor:'contributor',issue:1,sha:'a'.repeat(64),archiveUrl:'https://github.com/AumiSatori/dsh-ui-beautify/releases/download/demo/demo.zip'}
  const first=nextPresetCatalog({schemaVersion:1,presets:[]},metadata,options)
  assert.equal(first.entry.source,'community');assert.equal(first.entry.contributor,'contributor')
  assert.throws(()=>nextPresetCatalog(first.catalog,metadata,options),/提高版本/)
  assert.throws(()=>nextPresetCatalog(first.catalog,{...metadata,version:'1.1.0'},{...options,actor:'other'}),/其他投稿者/)
  assert.throws(()=>nextPresetCatalog(first.catalog,{...metadata,version:'1.1.0'},{...options,source:'official'}),/来源/)
  assert.throws(()=>nextPresetCatalog({schemaVersion:1,presets:[]},metadata,{...options,issue:null}),/已审核/)
})
test('local market routes reject cross-site requests, POST and unlisted downloads',async()=>{
  const routes=new Map();let calls=0
  const dispose=registerPresetMarket({inject:(_names,run)=>run({webServer:{register:route=>{routes.set(route.path,route.handler);return()=>routes.delete(route.path)}}})},{fetcher:async()=>{calls++;return new Response(JSON.stringify({schemaVersion:1,presets:[]}))}})
  const call=async(path,req={})=>{let code,body;await routes.get('/dsh-ui-beautify/preset-market/'+path)({method:'GET',headers:{},url:'/dsh-ui-beautify/preset-market/'+path,...req},{writeHead(status){code=status;return this},end(value){body=value;return this}});return{code,body}}
  assert.equal((await call('catalog',{headers:{'sec-fetch-site':'cross-site'}})).code,403)
  assert.equal((await call('catalog',{method:'POST'})).code,405);assert.equal(calls,0)
  assert.equal((await call('catalog')).code,200)
  assert.equal((await call('package',{url:'/package?id=unknown&version=1.0.0'})).code,404)
  assert.equal((await call('package',{url:'/package?id=../x&version=1'})).code,400)
  dispose();assert.equal(routes.size,0)
})
