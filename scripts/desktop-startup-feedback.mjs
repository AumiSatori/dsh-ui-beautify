import {createHash} from 'node:crypto'
import {copyFileSync,closeSync,mkdirSync,openSync,readSync,statSync,writeFileSync,writeSync} from 'node:fs'
import {join,resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {spawnSync} from 'node:child_process'

const changes=[
  ['const window = createWindow(appPreload, false, true);','const window = createWindow(appPreload, true , true);'],
  ['if (window === mainWindow && !enteredWorkspace) return;','/* Loading windows also answer ordinary activation. */'],
]
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
export function patchStartupFeedback(source){
  let next=source
  for(const [before,after]of changes){
    if(Buffer.byteLength(after)>Buffer.byteLength(before))throw new Error('Patch must fit its existing byte slot')
    const replacement=after.padEnd(before.length,' ')
    if(next.includes(replacement)&&!next.includes(before))continue
    if(next.split(before).length!==2)throw new Error('Desktop startup anchor changed or is ambiguous; preserving application')
    next=next.replace(before,replacement)
  }
  if(Buffer.byteLength(next)!==Buffer.byteLength(source))throw new Error('Desktop patch changed the archive entry size')
  return next
}
export function readDesktopMain(path){
  const fd=openSync(path,'r')
  try{
    const prefix=Buffer.alloc(16);readSync(fd,prefix,0,16,0)
    const json=Buffer.alloc(prefix.readUInt32LE(12));readSync(fd,json,0,json.length,16)
    const header=JSON.parse(json.toString()),entry=header.files?.lib?.files?.['main.js']
    if(!entry||entry.unpacked||entry.files)throw new Error('Desktop main entry is unavailable')
    const offset=8+prefix.readUInt32LE(4)+Number(entry.offset),bytes=Buffer.alloc(entry.size)
    if(readSync(fd,bytes,0,bytes.length,offset)!==bytes.length)throw new Error('Incomplete Desktop main entry')
    return{json,header,entry,offset,bytes,source:bytes.toString()}
  }finally{closeSync(fd)}
}
export function replacementHeader(record,bytes){
  const header=structuredClone(record.header),entry=header.files.lib.files['main.js']
  if(entry.integrity){
    const {blockSize}=entry.integrity
    if(entry.integrity.algorithm!=='SHA256'||!Number.isSafeInteger(blockSize)||blockSize<1)throw new Error('Unsupported Desktop integrity metadata')
    entry.integrity.hash=hash(bytes);entry.integrity.blocks=[]
    for(let i=0;i<bytes.length;i+=blockSize)entry.integrity.blocks.push(hash(bytes.subarray(i,i+blockSize)))
  }
  const json=Buffer.from(JSON.stringify(header))
  if(json.length!==record.json.length)throw new Error('Desktop header size changed; preserving archive layout')
  return json
}
function runningDesktop(){
  if(process.platform!=='win32')return[]
  const result=spawnSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',"try { Get-CimInstance Win32_Process -Filter \"Name='DeepSeek Harness.exe'\" -ErrorAction Stop | Select-Object -ExpandProperty ProcessId; exit 0 } catch { exit 2 }"],{encoding:'utf8',windowsHide:true})
  if(result.error||result.status!==0)throw new Error('Unable to verify Desktop is closed')
  return result.stdout.trim().split(/\s+/).filter(Boolean).map(Number)
}
export async function main(args=process.argv.slice(2)){
  const value=flag=>{const i=args.indexOf(flag);return i<0?undefined:args[i+1]}
  const input=value('--asar')||process.env.DSH_ASAR
  if(!input)throw new Error('Specify --asar <installed app.asar>')
  const asar=resolve(input),record=readDesktopMain(asar),next=patchStartupFeedback(record.source),bytes=Buffer.from(next),json=replacementHeader(record,bytes)
  const changed=next!==record.source,pids=runningDesktop()
  if(!args.includes('--apply')){
    const output=value('--output')
    if(output){
      mkdirSync(output,{recursive:true})
      writeFileSync(join(output,'desktop-startup-before.js'),record.source)
      writeFileSync(join(output,'desktop-startup-after.js'),next)
      writeFileSync(join(output,'desktop-startup-changes.json'),JSON.stringify({changes:changes.map(([before,after])=>({before,after})),bytesUnchanged:record.bytes.length===bytes.length},null,2))
    }
    console.log(JSON.stringify({changed,running:pids.length>0,requiresClosedDesktop:true,entryBytes:bytes.length,entryHash:hash(bytes)}));return
  }
  if(!changed){console.log(JSON.stringify({changed:false}));return}
  if(pids.length)throw new Error('Desktop is running; close it normally before applying. No process or application file was changed.')
  const backupRoot=value('--backup-dir')
  if(!backupRoot)throw new Error('Specify a backup directory outside source control')
  const backup=join(resolve(backupRoot),new Date().toISOString().replace(/[:.]/g,'-'))
  mkdirSync(backup,{recursive:true});copyFileSync(asar,join(backup,'app.asar'))
  const current=readDesktopMain(asar),copied=readDesktopMain(join(backup,'app.asar'))
  if(!current.json.equals(record.json)||!current.bytes.equals(record.bytes)||!copied.bytes.equals(record.bytes)||statSync(asar).size!==statSync(join(backup,'app.asar')).size)throw new Error('Desktop changed concurrently; preserving newer archive')
  const fd=openSync(asar,'r+')
  try{writeSync(fd,bytes,0,bytes.length,record.offset);writeSync(fd,json,0,json.length,16)}catch(error){closeSync(fd);copyFileSync(join(backup,'app.asar'),asar);throw error}
  closeSync(fd)
  const verified=readDesktopMain(asar)
  if(!verified.bytes.equals(bytes)||!verified.json.equals(json)){copyFileSync(join(backup,'app.asar'),asar);throw new Error('Desktop patch verification failed; backup restored')}
  writeFileSync(join(backup,'verification.json'),JSON.stringify({before:hash(record.bytes),after:hash(bytes),archiveBytes:statSync(asar).size},null,2))
  console.log(JSON.stringify({changed:true,backup,nextLaunch:true}))
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1})
