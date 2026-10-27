import {readFileSync,writeFileSync,mkdirSync,copyFileSync,renameSync,existsSync,openSync,closeSync,unlinkSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {spawnSync} from 'node:child_process'
import {dirname,join,resolve} from 'node:path'
import {homedir} from 'node:os'
import {fileURLToPath} from 'node:url'

const ENTRY='dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/index.html',MARKER='data-dcb-early-opening="v1"'
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
const nodeAt=tree=>ENTRY.split('/').reduce((node,key)=>node?.files?.[key],tree)
export function earlyOpeningHtml(html,bundle){
  const clean=html.replace(/<script data-dcb-early-opening="v1">[\s\S]*?<\/script>\s*/g,'')
  if(clean.split('</body>').length!==2)throw Error('Frontend body anchor changed; preserving the installation')
  return clean.replace('</body>',`<script ${MARKER}>${bundle.replace(/<\/script/gi,'<\\/script')}</script>\n</body>`)
}
export function prepareEarlyOpeningArchive(bytes,bundle){
  const size=bytes.readUInt32LE(12),tree=JSON.parse(bytes.subarray(16,16+size).toString()),base=8+bytes.readUInt32LE(4),entry=nodeAt(tree)
  if(!entry||entry.unpacked||entry.files)throw Error('Installed frontend index is unavailable')
  const offset=Number(entry.offset),original=bytes.subarray(base+offset,base+offset+entry.size),html=original.toString()
  const patched=Buffer.from(earlyOpeningHtml(html,bundle))
  if(patched.equals(original))return{changed:false,bytes}
  if(entry.integrity&&entry.integrity.hash!==hash(original))throw Error('Installed frontend integrity check failed')
  let payload=bytes.subarray(base)
  if(offset+entry.size===payload.length)payload=payload.subarray(0,offset)
  entry.offset=String(payload.length);entry.size=patched.length
  if(entry.integrity){const integrity=entry.integrity;if(integrity.algorithm!=='SHA256'||!Number.isSafeInteger(integrity.blockSize)||integrity.blockSize<1)throw Error('Unknown archive integrity format');integrity.hash=hash(patched);integrity.blocks=[];for(let i=0;i<patched.length;i+=integrity.blockSize)integrity.blocks.push(hash(patched.subarray(i,i+integrity.blockSize)))}
  const json=Buffer.from(JSON.stringify(tree)),padding=(4-json.length%4)%4,prefix=Buffer.alloc(16)
  prefix.writeUInt32LE(4,0);prefix.writeUInt32LE(8+json.length+padding,4);prefix.writeUInt32LE(4+json.length+padding,8);prefix.writeUInt32LE(json.length,12)
  const result=Buffer.concat([prefix,json,Buffer.alloc(padding),payload,patched])
  const verifyBase=8+result.readUInt32LE(4),verify=nodeAt(JSON.parse(result.subarray(16,16+result.readUInt32LE(12)).toString()))
  if(!result.subarray(verifyBase+Number(verify.offset),verifyBase+Number(verify.offset)+verify.size).equals(patched))throw Error('Rebuilt archive verification failed')
  return{changed:true,bytes:result}
}
export function desktopPids(){
  if(process.platform!=='win32')return[]
  const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"Get-CimInstance Win32_Process -Filter \"Name='DeepSeek Harness.exe'\" -ErrorAction Stop | Select-Object -ExpandProperty ProcessId"],{encoding:'utf8',windowsHide:true})
  if(result.error||result.status!==0)throw Error('Cannot confirm whether Desktop is closed')
  return result.stdout.trim().split(/\s+/).filter(Boolean).map(Number)
}
export async function main(args=process.argv.slice(2)){
  const arg=key=>{const i=args.indexOf(key);return i<0?undefined:args[i+1]}
  const asar=resolve(arg('--asar')||process.env.DSH_ASAR||''),data=resolve(arg('--data')||join(homedir(),'.dsh','data','dsh-ui-beautify','early-opening'))
  if(!asar.endsWith('app.asar')||!existsSync(asar))throw Error('Specify the installed app.asar with --asar')
  const bundle=readFileSync(new URL('../assets/early-opening.js',import.meta.url),'utf8')
  if(args.includes('--check')){const installed=!prepareEarlyOpeningArchive(readFileSync(asar),bundle).changed;console.log(JSON.stringify({installed}));process.exitCode=installed?0:1;return}
  if(!args.includes('--apply')){const result=prepareEarlyOpeningArchive(readFileSync(asar),bundle);console.log(JSON.stringify({changed:result.changed,requiresClosedDesktop:true}));return}
  mkdirSync(data,{recursive:true});const status=join(data,'status.json'),lock=join(data,'pending.lock')
  if(existsSync(lock)){const pid=Number(readFileSync(lock,'utf8'));try{process.kill(pid,0);throw Error('An early-opening installer is already waiting')}catch(error){if(error.code!=='ESRCH')throw error;unlinkSync(lock)}}
  const fd=openSync(lock,'wx');writeFileSync(fd,String(process.pid));closeSync(fd)
  const report=value=>writeFileSync(status,JSON.stringify({...value,pid:process.pid,time:new Date().toISOString()},null,2)+'\n')
  try{
    let pids=desktopPids()
    if(pids.length&&!args.includes('--when-closed'))throw Error('Exit Desktop before applying the early-opening patch')
    if(pids.length)report({state:'waiting-for-desktop-exit'})
    while(pids.length){await new Promise(done=>setTimeout(done,1000));pids=desktopPids()}
    const original=readFileSync(asar),prepared=prepareEarlyOpeningArchive(original,readFileSync(new URL('../assets/early-opening.js',import.meta.url),'utf8'))
    if(!prepared.changed){report({state:'installed',changed:false});return}
    const backup=join(data,'backups',String(Date.now()));mkdirSync(backup,{recursive:true});copyFileSync(asar,join(backup,'app.asar'))
    if(desktopPids().length||!readFileSync(asar).equals(original))throw Error('Desktop or its installation changed; retry while it is closed')
    const temp=join(dirname(asar),'app.asar.dcb-early.tmp')
    try{writeFileSync(temp,prepared.bytes);if(!readFileSync(temp).equals(prepared.bytes))throw Error('Staged archive differs');renameSync(temp,asar)}catch(error){if(existsSync(temp))unlinkSync(temp);throw error}
    report({state:'installed',changed:true,backup,sha256:hash(prepared.bytes),nextLaunch:true})
  }catch(error){report({state:'failed',error:error.message});throw error}finally{unlinkSync(lock)}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1})
