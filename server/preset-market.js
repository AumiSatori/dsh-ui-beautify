import {MARKET_RAW,MARKET_CDN,MARKET_RAW_V2,MARKET_CDN_V2,MARKET_REPO,PRESET_PACKAGE_LIMIT} from './preset-market-config.js'

// Only public catalog reads and immutable, catalog-listed downloads are
// exposed locally. Publication and review use GitHub's own permissions.
export function registerPresetMarket(root,{fetcher=fetch}={}){
  if(typeof root?.inject!=='function')return
  return root.inject(['webServer'],scope=>{
    const server=scope.get?.('webServer')||scope.webServer
    if(!server?.register)return
    const caches={legacy:{cached:null,loading:null,urls:[MARKET_RAW,MARKET_CDN]},v2:{cached:null,loading:null,urls:[MARKET_RAW_V2,MARKET_CDN_V2]}}
    let live=true
    const controllers=new Set(),disposers=[]
    async function download(url,limit){
      const controller=new AbortController();controllers.add(controller)
      const timeout=setTimeout(()=>controller.abort(),30000)
      try{
        const response=await fetcher(url,{signal:controller.signal,headers:{'User-Agent':'dsh-ui-beautify-market'},credentials:'omit'})
        if(!response.ok)throw Error('远程服务返回 HTTP '+response.status)
        if(Number(response.headers.get('content-length'))>limit){await response.body?.cancel();throw Error('下载超过大小限制。')}
        const reader=response.body.getReader(),chunks=[];let size=0
        try{while(true){const next=await reader.read();if(next.done)break;size+=next.value.length;if(size>limit)throw Error('下载超过大小限制。');chunks.push(next.value)}}catch(error){await reader.cancel().catch(()=>{});throw error}
        return Buffer.concat(chunks)
      }finally{clearTimeout(timeout);controllers.delete(controller)}
    }
    async function catalog(kind='legacy'){
      const state=caches[kind]
      if(state.cached&&Date.now()-state.cached.at<60000)return state.cached.data
      if(!state.loading)state.loading=Promise.any(state.urls.map(async url=>{
        const bytes=await download(url,2*1024*1024),data=JSON.parse(bytes)
        if(data?.schemaVersion!==1||!Array.isArray(data.presets)||data.presets.length>1000)throw Error('市场目录格式无效。')
        return data
      })).then(data=>{state.cached={data,at:Date.now()};return data}).finally(()=>{state.loading=null})
      return state.loading
    }
    function route(path,handler){
      const disposer=server.register({kind:'exact',path:'/dsh-ui-beautify/preset-market/'+path,handler:async(req,res)=>{
        try{
          if(!live){res.writeHead(503).end();return}
          if(req.headers?.['sec-fetch-site']==='cross-site'){res.writeHead(403).end();return}
          if(!['GET','HEAD'].includes(req.method||'GET')){res.writeHead(405,{Allow:'GET, HEAD'}).end();return}
          const {body,type}=await handler(req)
          res.writeHead(200,{'content-type':type,'content-length':body.length,'cache-control':'private, max-age=60','x-content-type-options':'nosniff'})
          res.end(req.method==='HEAD'?undefined:body)
        }catch(error){res.writeHead(error.status||502,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}).end(JSON.stringify({error:error.message||'市场暂不可用。'}))}
      }})
      if(typeof disposer==='function')disposers.push(disposer);else if(disposer?.dispose)disposers.push(()=>disposer.dispose())
    }
    route('catalog',async()=>({body:Buffer.from(JSON.stringify(await catalog())),type:'application/json; charset=utf-8'}))
    route('catalog-v2',async()=>({body:Buffer.from(JSON.stringify(await catalog('v2'))),type:'application/json; charset=utf-8'}))
    route('package',async req=>{
      const params=new URL(req.url,'http://localhost').searchParams,id=params.get('id'),version=params.get('version')
      if(!/^[a-z0-9][a-z0-9-]{0,59}$/.test(id||'')||!/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(version||''))throw Object.assign(Error('预设标识无效。'),{status:400})
      // catalog-v2 is a superset; fall back to the legacy list if it is unreachable.
      const find=data=>data.presets.find(p=>p?.id===id&&p.version===version)
      const item=await catalog('v2').then(find,()=>null)||find(await catalog())
      let url;try{url=new URL(item?.archiveUrl)}catch{}
      if(!item||!url||url.origin!=='https://github.com'||!url.pathname.startsWith('/'+MARKET_REPO+'/releases/download/')||url.username||url.password||url.search||url.hash||!/^[a-f0-9]{64}$/.test(item.sha256||''))throw Object.assign(Error('预设不在已审核的下载目录中。'),{status:404})
      const body=await download(url.href,PRESET_PACKAGE_LIMIT)
      const {createHash}=await import('node:crypto')
      if(createHash('sha256').update(body).digest('hex')!==item.sha256)throw Error('预设包校验失败。')
      return{body,type:'application/zip'}
    })
    return()=>{live=false;for(const controller of controllers)controller.abort();for(const dispose of disposers)dispose()}
  })
}
