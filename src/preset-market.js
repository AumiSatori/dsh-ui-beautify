import builtin from '../market/catalog-v2.json' with {type:'json'}
import {PRESET_SCOPES,presetScope} from './preset-scopes.js'
import {MARKET_REPO,MARKET_RAW_V2,MARKET_CDN_V2,PRESET_PACKAGE_LIMIT,PRESET_LICENSES,presetLicensePattern,normalizePresetMeta,inspectPresetConfig,inspectPresetZip,createPresetZip,sha256} from './preset-package.js'

// Remove the original bundled examples even when an old CDN response or
// offline cache still contains them. Future reviewed archive uploads remain valid.
const retiredExamples=new Set(['official-soft-glass','official-quiet-desk','official-frosted-sidebar','official-whale-particles','official-light-composer'])
export function trustedPresetAsset(url){
  try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&(
    u.hostname==='github.com'&&u.pathname.startsWith('/'+MARKET_REPO+'/releases/download/')||
    u.hostname==='raw.githubusercontent.com'&&u.pathname.startsWith('/'+MARKET_REPO+'/')||
    u.hostname==='cdn.jsdelivr.net'&&u.pathname.startsWith('/gh/'+MARKET_REPO+'@'))}catch{return false}
}
// Injected by scripts/build-lens.mjs; null in source tests means "do not gate".
export const PLUGIN_VERSION=typeof __DCB_PLUGIN_VERSION__==='string'?__DCB_PLUGIN_VERSION__:null
const semver=/^\d{1,4}\.\d{1,4}\.\d{1,4}$/
export function compareVersions(a,b){const x=a.split('.').map(Number),y=b.split('.').map(Number);for(let i=0;i<3;i++)if(x[i]!==y[i])return x[i]<y[i]?-1:1;return 0}
// Licenses the repository currently accepts, as announced by catalog-v2.json.
export function marketLicenses(value){
  const list=Array.isArray(value?.licenses)?[...new Set(value.licenses.filter(l=>typeof l==='string'&&presetLicensePattern.test(l)))].slice(0,32):[]
  return list.length?list:PRESET_LICENSES
}
// strict: maintainers validate every entry. Readers skip an entry this version
// cannot understand (new license rules, scope, fields) instead of losing the
// whole market, which is what 0.6.0-0.6.3 did.
export function normalizeMarketCatalog(value,{strict=false,version=null}={}){
  if(value?.schemaVersion!==1||!Array.isArray(value.presets)||value.presets.length>1000)throw Error('市场目录格式无效。')
  const seen=new Set(),items=[]
  for(const item of value.presets.filter(item=>!(item?.source==='official'&&item?.settings&&item.version==='1.0.0'&&retiredExamples.has(item.id)))){
    try{
      const entry=normalizeEntry(item,seen)
      if(version&&entry.minPluginVersion&&compareVersions(version,entry.minPluginVersion)<0)entry.requiresUpdate=entry.minPluginVersion
      items.push(entry)
    }catch(error){if(strict)throw error}
  }
  return items
}
function normalizeEntry(item,seen){
  {
    const meta=normalizePresetMeta({...item,format:'dsh-ui-preset',schemaVersion:1,configSha256:item.configSha256||'0'.repeat(64)})
    if(seen.has(meta.id)||!['official','community'].includes(item.source))throw Error('市场目录含重复或无效条目。')
    if(!item.settings&&(!trustedPresetAsset(item.archiveUrl)||!/^[a-f0-9]{64}$/.test(item.sha256||'')))throw Error('预设下载地址或校验值无效。')
    if(item.settings&&item.source!=='official')throw Error('社区预设必须通过已审核的投稿包提供。')
    const palette=Array.isArray(item.palette)&&item.palette.length===3&&item.palette.every(c=>/^#[a-f0-9]{6}$/i.test(c))?item.palette:['#e8edf2','#b7c5d4','#71879c']
    if(item.minPluginVersion!==undefined&&!semver.test(item.minPluginVersion))throw Error('预设版本要求无效。')
    // Claim the id only once the whole entry is valid.
    seen.add(meta.id)
    return {...meta,source:item.source,palette,settings:item.settings,layout:item.layout,archiveUrl:item.archiveUrl,sha256:item.sha256,preview:trustedPresetAsset(item.preview)?item.preview:'',publishedAt:typeof item.publishedAt==='string'?item.publishedAt:'',...(item.minPluginVersion?{minPluginVersion:item.minPluginVersion}:{})}
  }
}
async function boundedResponse(response,limit,win){
  if(!response.ok)throw Error('HTTP '+response.status)
  if(Number(response.headers.get('content-length'))>limit){await response.body?.cancel();throw Error('下载文件超过大小限制。')}
  const reader=response.body.getReader(),chunks=[];let size=0
  try{while(true){const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>limit)throw Error('下载文件超过大小限制。');chunks.push(item.value)}}catch(error){await reader.cancel().catch(()=>{});throw error}
  return new win.Blob(chunks)
}
export function createPresetMarket(win,transfer,{sources=['/dsh-ui-beautify/preset-market/catalog-v2',MARKET_RAW_V2,MARKET_CDN_V2],version=PLUGIN_VERSION}={}){
  const fallback=normalizeMarketCatalog(builtin,{version}),controllers=new Set(),cacheKey='dsh-ui-beautify:market-cache:v2'
  let licenses=marketLicenses(builtin)
  let disposed=false
  const check=()=>{if(disposed)throw Error('预设市场已关闭。')}
  async function request(url,limit){
    check();const controller=new win.AbortController();controllers.add(controller)
    const timer=win.setTimeout(()=>controller.abort(),12000)
    try{return await boundedResponse(await win.fetch(url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'}),limit,win)}finally{win.clearTimeout(timer);controllers.delete(controller)}
  }
  async function catalog(){
    check()
    // Race trusted mirrors; a slow endpoint cannot hold up the other one.
    try{
      const result=await Promise.any(sources.map(async url=>{const blob=await request(url,2*1024*1024);const raw=JSON.parse(await blob.text());return {raw,items:normalizeMarketCatalog(raw,{version})}}))
      check();try{win.localStorage.setItem(cacheKey,JSON.stringify({at:Date.now(),catalog:result.raw}))}catch{}
      licenses=marketLicenses(result.raw)
      return {items:result.items,licenses,cached:false,builtin:false,error:''}
    }catch{
      check()
      try{const cache=JSON.parse(win.localStorage.getItem(cacheKey));if(cache&&Date.now()-cache.at<30*86400000){licenses=marketLicenses(cache.catalog);return{items:normalizeMarketCatalog(cache.catalog,{version}),licenses,cached:true,builtin:false,error:'网络暂不可用，正在显示最近一次目录。'}}}catch{}
      return {items:fallback,licenses,cached:false,builtin:true,error:'网络暂不可用，暂无可用的市场缓存，请稍后刷新重试。'}
    }
  }
  async function inspect(item){
    check()
    // The supplied item must satisfy the same constraints as a catalog entry.
    item=normalizeMarketCatalog({schemaVersion:1,presets:[item]},{strict:true,version})[0]
    if(item.requiresUpdate)throw Error(`这个预设需要 dsh-UI美化 ${item.requiresUpdate} 或以上版本，请先更新插件。`)
    let blob,meta=item
    if(item.settings){
      blob=new win.Blob([JSON.stringify({format:'dsh-ui-beautify-config',version:1,scope:item.scope,settings:item.settings,layout:item.layout||{widths:{version:1,window:null,fullscreen:null}}})],{type:'application/json'})
      await inspectPresetConfig(blob,item.scope,win)
    }else{
      const zip=await request('/dsh-ui-beautify/preset-market/package?'+new URLSearchParams({id:item.id,version:item.version}),PRESET_PACKAGE_LIMIT)
      if(await sha256(zip,win)!==item.sha256)throw Error('预设包校验失败，请刷新市场后重试。')
      const result=await inspectPresetZip(zip,win);meta=result.meta
      if(meta.id!==item.id||meta.version!==item.version||meta.scope!==item.scope)throw Error('预设包与市场目录不匹配。')
      blob=result.files.get('config.dshui')
    }
    const plan=await transfer.inspect(blob,{lenient:true});check()
    return {item,meta,plan,blob}
  }
  async function apply(prepared){check();return transfer.apply(prepared.plan,{preserveNavigation:true})}
  async function submission(draft,{cover=null}={}){
    check()
    const scope=presetScope(draft.scope).id
    const config=await transfer.exportFile(true,{scope,sharing:true})
    await inspectPresetConfig(config.blob,scope,win)
    const meta=normalizePresetMeta({...draft,format:'dsh-ui-preset',schemaVersion:1,configSha256:await sha256(config.blob,win),coverFile:cover?(/\.webp$/i.test(cover.name)?'cover.webp':/\.jpe?g$/i.test(cover.name)?'cover.jpg':'cover.png'):''},{licenses})
    const files=new Map([['manifest.json',new win.Blob([JSON.stringify(meta,null,2)])],['config.dshui',config.blob]])
    if(cover)files.set(meta.coverFile,cover)
    const blob=await createPresetZip(files,win);await inspectPresetZip(blob,win);check()
    const params=new URLSearchParams({template:'preset-submission.yml',title:`[预设投稿] ${meta.title}`,preset_id:meta.id,preset_version:meta.version,scope:meta.scope,author:meta.author,description:meta.description})
    return {blob,name:`${meta.id}-${meta.version}.zip`,url:`https://github.com/${MARKET_REPO}/issues/new?${params}`,meta}
  }
  return {catalog,inspect,apply,submission,scopes:PRESET_SCOPES,get licenses(){return licenses},dispose(){disposed=true;for(const controller of controllers)controller.abort();controllers.clear()}}
}
