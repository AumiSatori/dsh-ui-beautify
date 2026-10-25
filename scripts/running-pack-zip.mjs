import {RUNNING_LIMITS as L,runningPath} from './running-animation-config.mjs'
const table=Uint32Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0})
export function runningCRC32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=table[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0}
export async function readRunningZip(file,win=globalThis){
  if(!file.size||file.size>L.zipBytes)throw Error('ZIP 不能超过 100 MB')
  const bytes=new Uint8Array(await file.arrayBuffer()),view=new DataView(bytes.buffer),decoder=new TextDecoder('utf-8',{fatal:true})
  let end=-1
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(view.getUint32(i,true)===0x06054b50&&i+22+view.getUint16(i+20,true)===bytes.length){end=i;break}
  if(end<0||view.getUint16(end+4,true)||view.getUint16(end+6,true))throw Error('不是有效的单文件 ZIP')
  const count=view.getUint16(end+10,true),start=view.getUint32(end+16,true),centralSize=view.getUint32(end+12,true)
  if(!count||count>L.entries||count!==view.getUint16(end+8,true)||start+centralSize!==end)throw Error('ZIP 文件数量或目录无效')
  let at=start,total=0
  const result=new Map(),names=new Set()
  for(let index=0;index<count;index++){
    if(at+46>end||view.getUint32(at,true)!==0x02014b50)throw Error('ZIP 目录损坏')
    const flags=view.getUint16(at+8,true),method=view.getUint16(at+10,true),crc=view.getUint32(at+16,true),packed=view.getUint32(at+20,true),size=view.getUint32(at+24,true),nameSize=view.getUint16(at+28,true),extra=view.getUint16(at+30,true),comment=view.getUint16(at+32,true),offset=view.getUint32(at+42,true)
    if(at+46+nameSize+extra+comment>end)throw Error('ZIP 目录损坏')
    const name=decoder.decode(bytes.slice(at+46,at+46+nameSize));at+=46+nameSize+extra+comment
    if(name.endsWith('/')||name.startsWith('__MACOSX/')||name.endsWith('.DS_Store'))continue
    const path=runningPath(name),lower=path.toLowerCase(),limit=lower.endsWith('manifest.json')?L.manifestBytes:L.fileBytes
    if(names.has(lower)||flags&1||![0,8].includes(method)||size>limit||(total+=size)>L.totalBytes)throw Error('ZIP 含重复、加密、过大或不支持的文件')
    names.add(lower)
    if(offset+30>start||view.getUint32(offset,true)!==0x04034b50||view.getUint16(offset+8,true)!==method||view.getUint16(offset+6,true)!==flags)throw Error('ZIP 文件头无效')
    const localName=view.getUint16(offset+26,true),localExtra=view.getUint16(offset+28,true),data=offset+30+localName+localExtra
    if(data+packed>start||decoder.decode(bytes.slice(offset+30,offset+30+localName))!==name)throw Error('ZIP 文件路径或长度无效')
    let output=bytes.slice(data,data+packed)
    if(method===8){
      const reader=new win.Blob([output]).stream().pipeThrough(new win.DecompressionStream('deflate-raw')).getReader(),parts=[];let length=0
      try{while(true){const item=await reader.read();if(item.done)break;length+=item.value.length;if(length>size||length>limit)throw Error('ZIP 解压后超过大小限制');parts.push(item.value)}}catch(error){await reader.cancel().catch(()=>{});throw error}
      output=new Uint8Array(length);let cursor=0;for(const part of parts){output.set(part,cursor);cursor+=part.length}
    }
    if(output.length!==size||runningCRC32(output)!==crc)throw Error('ZIP 文件校验失败')
    result.set(path,new win.File([output],path.split('/').at(-1)))
  }
  if(at!==end)throw Error('ZIP 目录长度无效')
  return result
}
