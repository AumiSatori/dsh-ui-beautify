import {readdir,readFile,writeFile} from 'node:fs/promises'
import {resolve,relative,join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {deflateRawSync} from 'node:zlib'
import {runningCRC32} from './running-pack-zip.mjs'
import {normalizeRunningManifest,runningImageType,RUNNING_LIMITS as L} from './running-animation-config.mjs'
export function createRunningZip(files){
 const parts=[],central=[];let offset=0
 for(const [path,data]of files){
  const name=Buffer.from(path),packed=deflateRawSync(data),crc=runningCRC32(data),head=Buffer.alloc(30),entry=Buffer.alloc(46)
  head.writeUInt32LE(0x04034b50);head.writeUInt16LE(20,4);head.writeUInt16LE(0x800,6);head.writeUInt16LE(8,8);head.writeUInt32LE(crc,14);head.writeUInt32LE(packed.length,18);head.writeUInt32LE(data.length,22);head.writeUInt16LE(name.length,26)
  entry.writeUInt32LE(0x02014b50);entry.writeUInt16LE(20,4);entry.writeUInt16LE(20,6);entry.writeUInt16LE(0x800,8);entry.writeUInt16LE(8,10);entry.writeUInt32LE(crc,16);entry.writeUInt32LE(packed.length,20);entry.writeUInt32LE(data.length,24);entry.writeUInt16LE(name.length,28);entry.writeUInt32LE(offset,42)
  parts.push(head,name,packed);central.push(entry,name);offset+=head.length+name.length+packed.length
 }
 const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.size,8);end.writeUInt16LE(files.size,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16)
 return Buffer.concat([...parts,directory,end])
}
export async function buildAnimationPack(source,output){
 const files=new Map();let total=0
 async function walk(directory){for(const item of await readdir(directory,{withFileTypes:true})){const path=join(directory,item.name);if(item.isSymbolicLink())throw Error('包内不能包含符号链接');if(item.isDirectory())await walk(path);else if(item.isFile()&&(/\.(gif|png|apng|webp)$/i.test(item.name)||item.name==='manifest.json'||item.name==='LICENSE')){const data=await readFile(path);if(data.length>L.fileBytes||(total+=data.length)>L.totalBytes||files.size>=L.entries)throw Error('素材过大或过多');files.set(relative(source,path).replaceAll('\\','/'),data)}}}
 await walk(source)
 const actions=files.has('manifest.json')?normalizeRunningManifest(JSON.parse(files.get('manifest.json')),files).actions:[...files.keys()].filter(path=>/\.(gif|png|apng|webp)$/i.test(path)).map(file=>({file}))
 if(!actions.length||actions.length>100)throw Error('需要 1–100 个动作')
 for(const action of actions)runningImageType(files.get(action.file))
 await writeFile(output,createRunningZip(files));return {output,actions:actions.length}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [source,output]=process.argv.slice(2);if(!source||!output){console.error('用法：node scripts/build-animation-pack.mjs <动图文件夹> <输出.zip>');process.exitCode=1}else console.log(JSON.stringify(await buildAnimationPack(resolve(source),resolve(output))))
}
