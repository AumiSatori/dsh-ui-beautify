import builtin from '../market/catalog.json' with {type:'json'}
import {PRESET_SCOPES,presetScope} from './preset-scopes.js'
import {MARKET_REPO,MARKET_RAW,MARKET_CDN,PRESET_PACKAGE_LIMIT,normalizePresetMeta,inspectPresetConfig,inspectPresetZip,createPresetZip,sha256} from './preset-package.js'

export function trustedPresetAsset(url){
  try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.search&&!u.hash&&(
    u.hostname==='github.com'&&u.pathname.startsWith('/'+MARKET_REPO+'/releases/download/')||
    u.hostname==='raw.githubusercontent.com'&&u.pathname.startsWith('/'+MARKET_REPO+'/')||
    u.hostname==='cdn.jsdelivr.net'&&u.pathname.startsWith('/gh/'+MARKET_REPO+'@'))}catch{return false}
}
export function normalizeMarketCatalog(value){
  if(value?.schemaVersion!==1||!Array.isArray(value.presets)||value.presets.length>1000)throw Error('市场目录格式无效。')
  const seen=new Set()
  return value.presets.map(item=>{
    const meta=normalizePresetMeta({...item,format:'dsh-ui-preset',schemaVersion:1,configSha256:item.configSha256||'0'.repeat(64)})
    if(seen.has(meta.id)||!['official','community'].includes(item.source))throw Error('市场目录含重复或无效条目。')
    seen.add(meta.id)
    if(!item.settings&&(!trustedPresetAsset(item.archiveUrl)||!/^[a-f0-9]{64}$/.test(item.sha256||'')))throw Error('预设下载地址或校验值无效。')
    if(item.settings&&item.source!=='official')throw Error('社区预设必须通过已审核的投稿包提供。')
    const palette=Array.isArray(item.palette)&&item.palette.length===3&&item.palette.every(c=>/^#[a-f0-9]{6}$/i.test(c))?item.palette:['#e8edf2','#b7c5d4','#71879c']
    return {...meta,source:item.source,palette,settings:item.settings,layout:item.layout,archiveUrl:item.archiveUrl,sha256:item.sha256,preview:trustedPresetAsset(item.preview)?item.preview:'',publishedAt:typeof item.publishedAt==='string'?item.publishedAt:''}
  })
}
async function boundedResponse(response,limit,win){
  if(!response.ok)throw Error('HTTP '+response.status)
  if(Number(response.headers.get('content-length'))>limit){await response.body?.cancel();throw Error('下载文件超过大小限制。')}
  const reader=response.body.getReader(),chunks=[];let size=0
  try{while(true){const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>limit)throw Error('下载文件超过大小限制。');chunks.push(item.value)}}catch(error){await reader.cancel().catch(()=>{});throw error}
  return new win.Blob(chunks)
}
export function createPresetMarket(win,transfer,{sources=['/dsh-ui-beautify/preset-market/catalog',MARKET_RAW,MARKET_CDN]}={}){
  const fallback=normalizeMarketCatalog(builtin),controllers=new Set(),cacheKey='dsh-ui-beautify:market-cache:v1'
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
      const result=await Promise.any(sources.map(async url=>{const blob=await request(url,2*1024*1024);const raw=JSON.parse(await blob.text());return {raw,items:normalizeMarketCatalog(raw)}}))
      check();try{win.localStorage.setItem(cacheKey,JSON.stringify({at:Date.now(),catalog:result.raw}))}catch{}
      return {items:result.items,cached:false,builtin:false,error:''}
    }catch{
      check()
      try{const cache=JSON.parse(win.localStorage.getItem(cacheKey));if(cache&&Date.now()-cache.at<30*86400000)return{items:normalizeMarketCatalog(cache.catalog),cached:true,builtin:false,error:'网络暂不可用，正在显示最近一次目录。'}}catch{}
      return {items:fallback,cached:false,builtin:true,error:'网络暂不可用，先显示随插件提供的官方预设。'}
    }
  }
  async function inspect(item){
    check()
    // The supplied item must satisfy the same constraints as a catalog entry.
    item=normalizeMarketCatalog({schemaVersion:1,presets:[item]})[0]
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
    const plan=await transfer.inspect(blob);check()
    return {item,meta,plan,blob}
  }
  async function apply(prepared){check();return transfer.apply(prepared.plan,{preserveNavigation:true})}
  async function submission(draft,{cover=null}={}){
    check()
    const scope=presetScope(draft.scope).id
    const config=await transfer.exportFile(true,{scope,sharing:true})
    await inspectPresetConfig(config.blob,scope,win)
    const meta=normalizePresetMeta({...draft,format:'dsh-ui-preset',schemaVersion:1,configSha256:await sha256(config.blob,win),coverFile:cover?(/\.webp$/i.test(cover.name)?'cover.webp':/\.jpe?g$/i.test(cover.name)?'cover.jpg':'cover.png'):''})
    const files=new Map([['manifest.json',new win.Blob([JSON.stringify(meta,null,2)])],['config.dshui',config.blob]])
    if(cover)files.set(meta.coverFile,cover)
    const blob=await createPresetZip(files,win);await inspectPresetZip(blob,win);check()
    const params=new URLSearchParams({template:'preset-submission.yml',title:`[预设投稿] ${meta.title}`,preset_id:meta.id,preset_version:meta.version,scope:meta.scope,author:meta.author,description:meta.description})
    return {blob,name:`${meta.id}-${meta.version}.zip`,url:`https://github.com/${MARKET_REPO}/issues/new?${params}`,meta}
  }
  return {catalog,inspect,apply,submission,scopes:PRESET_SCOPES,dispose(){disposed=true;for(const controller of controllers)controller.abort();controllers.clear()}}
}
