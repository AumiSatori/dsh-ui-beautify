import {build} from 'esbuild'
import {readFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {dirname,extname,resolve} from 'node:path'
import {composeClientArtifact,validateClientArtifact,assertUnchanged,publishClientArtifact,withClientArtifactLock} from './client-artifact.mjs'
const client=fileURLToPath(new URL('../client.js',import.meta.url)),check=process.argv.includes('--check')
const templateArg=process.argv.find(arg=>arg.startsWith('--template=')),template=templateArg?resolve(templateArg.slice('--template='.length)):client
async function buildArtifact(){
  const source=await readFile(client,'utf8'),draft=template===client?source:await readFile(template,'utf8'),snapshots=new Map([[client,Buffer.from(source)],[template,Buffer.from(draft)]])
  const result=await build({entryPoints:[fileURLToPath(new URL('../src/lens-actions.js',import.meta.url))],bundle:true,write:false,format:'iife',globalName:'DcbLens',minify:true,target:'es2022',legalComments:'inline',loader:{'.jpg':'dataurl','.png':'dataurl'},plugins:[{
    name:'consistent-build-inputs',setup(plugin){plugin.onLoad({filter:/\.(?:m?js|json|png|jpg)$/},async({path})=>{
      const contents=await readFile(path);snapshots.set(path,contents)
      const extension=extname(path),loader=['.png','.jpg'].includes(extension)?'dataurl':extension==='.json'?'json':'js'
      return {contents,loader,resolveDir:dirname(path)}
    })}
  }]})
  const next=composeClientArtifact(draft,result.outputFiles[0].text)
  await assertUnchanged(snapshots)
  if(check){validateClientArtifact(source);if(next!==source)throw Error('Lens bundle is stale; run npm run build:lens')}
  else{const result=await publishClientArtifact(client,next,{expected:source,snapshots});if(result.changed)console.log(JSON.stringify(result))}
}
if(check)await buildArtifact();else await withClientArtifactLock(client,buildArtifact)
