import {readFile} from 'node:fs/promises'
const base='/dsh-ui-beautify/running',directory=new URL('../assets/running-whale/',import.meta.url)
export function registerRunningAssets(root){
 if(typeof root?.inject!=='function')return
 return root.inject(['webServer'],scope=>{
  const server=scope.get?.('webServer')||scope.webServer;if(!server?.register)return
  let manifestPromise,live=true;const disposers=[]
  const manifest=()=>manifestPromise||(manifestPromise=readFile(new URL('manifest.json',directory),'utf8').then(JSON.parse))
  function route(path,handler){
   const result=server.register({kind:'exact',path:base+path,handler:async(req,res)=>{
    try{
     if(!live){res.writeHead(503).end();return}
     if(req.headers?.['sec-fetch-site']==='cross-site'){res.writeHead(403).end();return}
     if(!['GET','HEAD'].includes(req.method||'GET')){res.writeHead(405,{Allow:'GET, HEAD'}).end();return}
     const {body,type}=await handler(req)
     res.writeHead(200,{'content-type':type,'content-length':body.length,'cache-control':'private, max-age=3600','x-content-type-options':'nosniff'});res.end(req.method==='HEAD'?undefined:body)
    }catch(error){res.writeHead(error.code==='NOT_FOUND'?404:500).end()}
   }})
   if(typeof result==='function')disposers.push(result);else if(result?.dispose)disposers.push(()=>result.dispose())
  }
  route('/pack.json',async()=>({body:Buffer.from(JSON.stringify(await manifest())),type:'application/json; charset=utf-8'}))
  route('/asset',async req=>{
   const id=new URL(req.url,'http://localhost').searchParams.get('id'),action=(await manifest()).actions.find(action=>action.id===id)
   if(!action||!/^a\d+\.(?:png|webp)$/.test(action.file))throw Object.assign(Error('missing'),{code:'NOT_FOUND'})
   return {body:await readFile(new URL(action.file,directory)),type:action.file.endsWith('.webp')?'image/webp':'image/png'}
  })
  return()=>{live=false;for(const dispose of disposers)dispose()}
 })
}
