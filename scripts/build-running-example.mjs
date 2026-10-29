import {readFile,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createRunningZip} from './build-animation-pack.mjs'
import {normalizeRunningManifest} from './running-animation-config.mjs'

export async function buildRunningExample({check=false}={}){
 const files=new Map()
 for(const [name,path]of [
  ['manifest.json','assets/running-example/manifest.json'],
  ['example.webp','assets/running-whale/a001.webp'],
  ['README.txt','assets/running-example/README.txt'],
  ['LICENSE','assets/running-whale/LICENSE']
 ]){
  const data=await readFile(new URL('../'+path,import.meta.url))
  files.set(name,name==='example.webp'?data:Buffer.from(data.toString('utf8').replace(/\r\n?/g,'\n')))
 }
 normalizeRunningManifest(JSON.parse(files.get('manifest.json')),files)
 const output=new URL('../assets/running-example.zip',import.meta.url),zip=createRunningZip(files)
 if(check){if(!(await readFile(output)).equals(zip))throw Error('Running example ZIP is stale; run npm run build:lens')}
 else await writeFile(output,zip)
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildRunningExample({check:process.argv.includes('--check')})
