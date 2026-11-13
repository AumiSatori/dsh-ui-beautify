import {presetScope,settingScope,databaseScope} from './preset-scopes.js'
import {runningCRC32} from './running-pack-zip.js'
import {PRESET_PACKAGE_LIMIT} from '../server/preset-market-config.js'
export {PRESET_PACKAGE_LIMIT,MARKET_REPO,MARKET_RAW,MARKET_CDN} from '../server/preset-market-config.js'

// Licenses a market preset may carry. NC-SA covers fan art whose original
// terms forbid commercial use and require the same license on adaptations.
export const PRESET_LICENSES=['CC-BY-4.0','CC-BY-SA-4.0','CC-BY-NC-SA-4.0','CC0-1.0','MIT']
export const presetLicenseNote=license=>license==='CC-BY-NC-SA-4.0'?'仅限非商业使用，改编须以相同许可分享':''
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)
const safeKey=key=>!['__proto__','constructor','prototype'].includes(key)
export const sha256=async(blob,win=globalThis)=>Array.from(new Uint8Array(await win.crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('')
function text(value,max,required=true){
  if(typeof value!=='string'||value.length>max||required&&!value.trim()||/[\u0000-\u001f\u007f]/.test(value))throw Error('预设资料缺失或格式无效。')
  return value.trim()
}
export function normalizePresetMeta(value){
  if(!plain(value)||value.format!=='dsh-ui-preset'||value.schemaVersion!==1)throw Error('不是支持的市场预设包。')
  const id=text(value.id,60),version=text(value.version,32)
  if(!/^[a-z0-9][a-z0-9-]{0,59}$/.test(id)||!/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(version))throw Error('预设 ID 或版本号无效。')
  const scope=presetScope(value.scope).id
  if(!Array.isArray(value.tags)||value.tags.length>8)throw Error('最多填写 8 个标签。')
  const tags=[...new Set(value.tags.map(tag=>text(tag,20)))]
  if(!PRESET_LICENSES.includes(value.license))throw Error('请选择支持分享的许可。')
  if(!/^[a-f0-9]{64}$/.test(value.configSha256||''))throw Error('预设缺少配置校验信息。')
  if(value.coverFile&&!/^cover\.(png|jpg|webp)$/.test(value.coverFile))throw Error('封面文件名无效。')
  const result={format:value.format,schemaVersion:1,id,version,title:text(value.title,60),description:text(value.description,300),author:text(value.author,60),scope,tags,license:value.license,configSha256:value.configSha256,coverFile:value.coverFile||''}
  inspectPublicStrings(result)
  return result
}
export function inspectPublicStrings(value){
  function visit(item,depth=0){
    if(depth>35)throw Error('预设数据层级过深。')
    if(typeof item==='string'&&(/\b(?:ghp_|github_pat_|sk-(?:proj-)?)[A-Za-z0-9_-]{20,}/.test(item)||/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(item)||/(?:[A-Z]:\\(?:Users|workSpace)\\|file:\/\/\/|https?:\/\/[^\s/]+:[^\s/@]+@)/i.test(item)))throw Error('投稿内容含本机路径或疑似凭据，请清理后再导出。')
    if(item&&typeof item==='object')for(const [key,child] of Object.entries(item)){if(!safeKey(key))throw Error('预设包含不安全的字段。');visit(child,depth+1)}
  }
  visit(value)
}
export async function inspectPresetConfig(blob,scope,win=globalThis){
  presetScope(scope)
  if(!blob?.size||blob.size>PRESET_PACKAGE_LIMIT)throw Error('市场预设包最多 64 MB。')
  const head=new Uint8Array(await blob.slice(0,12).arrayBuffer()),binary=new TextDecoder().decode(head.slice(0,8))==='DSHUI01\n'
  const length=binary?new DataView(head.buffer).getUint32(8,true):blob.size
  if(!length||length>8*1024*1024||binary&&12+length>blob.size)throw Error('预设配置目录无效。')
  let data;try{data=JSON.parse(await blob.slice(binary?12:0,binary?12+length:blob.size).text())}catch{throw Error('预设配置已损坏。')}
  if(data?.format!=='dsh-ui-beautify-config'||data.version!==1||(data.scope||'full')!==scope||!plain(data.settings))throw Error('预设分类与配置内容不匹配。')
  for(const key of Object.keys(data.settings))if(!safeKey(key)||key!=='enabled'&&!settingScope(key)||scope!=='full'&&settingScope(key)!==scope)throw Error('预设含分类以外的设置：'+key)
  if(scope!=='layout'&&!Object.keys(data.settings).length)throw Error('预设没有可用的设置。')
  inspectPublicStrings(data)
  let records=0,at=binary?12+length:blob.size
  if(binary){
    if(!Array.isArray(data.blobs)||data.blobs.length>5000||!Array.isArray(data.databases))throw Error('预设素材目录无效。')
    for(const item of data.blobs){
      if(!Number.isSafeInteger(item?.size)||item.size<0||at+item.size>blob.size||typeof item.type!=='string'||item.type.length>100||!/^[a-f0-9]{64}$/.test(item.sha256||''))throw Error('预设素材描述无效。')
      if(await sha256(blob.slice(at,at+item.size),win)!==item.sha256)throw Error('预设素材校验失败。')
      at+=item.size
    }
    const seen=new Set()
    function packed(value,depth=0){
      if(depth>30)throw Error('素材层级过深。')
      if(value===null||['string','boolean','number'].includes(typeof value))return
      if(!plain(value))throw Error('素材数据无效。')
      if(value.type==='blob'&&Number.isInteger(value.index)&&data.blobs[value.index])return
      if(value.type==='array'&&Array.isArray(value.items)){for(const child of value.items)packed(child,depth+1);return}
      if(value.type==='object'&&Array.isArray(value.entries)){const keys=new Set();for(const entry of value.entries){if(!Array.isArray(entry)||entry.length!==2||typeof entry[0]!=='string'||!safeKey(entry[0])||keys.has(entry[0]))throw Error('素材字段无效。');keys.add(entry[0]);packed(entry[1],depth+1)}return}
      throw Error('素材引用无效。')
    }
    for(const group of data.databases){
      if(!databaseScope(group?.name)||scope!=='full'&&databaseScope(group.name)!==scope||seen.has(group.name)||!Array.isArray(group.records))throw Error('预设素材分类无效。')
      seen.add(group.name);const keys=new Set()
      const stores={background:['wallpaper','assets'],welcome:group.name.endsWith('-code')?['opening']:['media'],hero:['logo'],particles:['artwork'],divider:['art'],running:['packs','assets']}[databaseScope(group.name)]
      for(const record of group.records){if(++records>5000||!stores.includes(record?.store)||typeof record.key!=='string'||!record.key||record.key.length>512||keys.has(record.store+'\0'+record.key))throw Error('预设素材条目无效。');keys.add(record.store+'\0'+record.key);packed(record.value)}
    }
  }
  if(at!==blob.size)throw Error('预设含未识别的数据。')
  return {data,records}
}

// Deliberately tiny STORE-only ZIP: the plugin creates exactly two or three
// files, so publication never needs a general-purpose archive extractor.
export async function createPresetZip(files,win=globalThis){
  const local=[],central=[];let offset=0
  for(const [name,blob] of files){
    const data=new Uint8Array(await blob.arrayBuffer()),path=new TextEncoder().encode(name),crc=runningCRC32(data)
    const header=new Uint8Array(30+path.length),v=new DataView(header.buffer)
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint32(14,crc,true);v.setUint32(18,data.length,true);v.setUint32(22,data.length,true);v.setUint16(26,path.length,true);header.set(path,30)
    local.push(header,data)
    const entry=new Uint8Array(46+path.length),e=new DataView(entry.buffer)
    e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x800,true);e.setUint32(16,crc,true);e.setUint32(20,data.length,true);e.setUint32(24,data.length,true);e.setUint16(28,path.length,true);e.setUint32(42,offset,true);entry.set(path,46);central.push(entry);offset+=header.length+data.length
  }
  const end=new Uint8Array(22),e=new DataView(end.buffer)
  e.setUint32(0,0x06054b50,true);e.setUint16(8,files.size,true);e.setUint16(10,files.size,true);e.setUint32(12,central.reduce((n,c)=>n+c.length,0),true);e.setUint32(16,offset,true)
  const blob=new win.Blob([...local,...central,end],{type:'application/zip'})
  if(blob.size>PRESET_PACKAGE_LIMIT)throw Error('市场预设包最多 64 MB。')
  return blob
}
export async function inspectPresetZip(blob,win=globalThis){
  if(!blob?.size||blob.size>PRESET_PACKAGE_LIMIT)throw Error('市场预设包最多 64 MB。')
  const bytes=new Uint8Array(await blob.arrayBuffer()),view=new DataView(bytes.buffer),end=bytes.length-22,files=new Map()
  if(end<0||view.getUint32(end,true)!==0x06054b50||view.getUint32(end+4,true)||view.getUint16(end+20,true))throw Error('请选择插件导出的市场投稿 ZIP。')
  const count=view.getUint16(end+10,true),start=view.getUint32(end+16,true)
  if(count<2||count>3||count!==view.getUint16(end+8,true)||start+view.getUint32(end+12,true)!==end)throw Error('投稿 ZIP 目录无效。')
  let at=start,localEnd=0
  for(let i=0;i<count;i++){
    if(at+46>end||view.getUint32(at,true)!==0x02014b50)throw Error('投稿 ZIP 目录损坏。')
    const flags=view.getUint16(at+8,true),method=view.getUint16(at+10,true),crc=view.getUint32(at+16,true),size=view.getUint32(at+24,true),nameSize=view.getUint16(at+28,true),extra=view.getUint16(at+30,true),comment=view.getUint16(at+32,true),offset=view.getUint32(at+42,true)
    if(method!==0||flags!==0x800||size!==view.getUint32(at+20,true)||at+46+nameSize+extra+comment>end||offset!==localEnd||offset+30>start)throw Error('投稿 ZIP 文件头无效。')
    const name=new TextDecoder('utf-8',{fatal:true}).decode(bytes.slice(at+46,at+46+nameSize));at+=46+nameSize+extra+comment
    if(!/^(manifest\.json|config\.dshui|cover\.(png|jpg|webp))$/.test(name)||files.has(name)||view.getUint32(offset,true)!==0x04034b50||view.getUint16(offset+6,true)!==flags||view.getUint16(offset+8,true)!==method||view.getUint32(offset+14,true)!==crc||view.getUint32(offset+18,true)!==size||view.getUint32(offset+22,true)!==size)throw Error('投稿 ZIP 含不支持或重复的文件。')
    const n=view.getUint16(offset+26,true),x=view.getUint16(offset+28,true),data=offset+30+n+x
    if(n!==nameSize||new TextDecoder().decode(bytes.slice(offset+30,offset+30+n))!==name||data+size>start)throw Error('投稿 ZIP 长度无效。')
    const content=bytes.slice(data,data+size)
    if(runningCRC32(content)!==crc)throw Error('投稿 ZIP 校验失败。')
    files.set(name,new win.Blob([content]));localEnd=data+size
  }
  if(at!==end||localEnd!==start||!files.has('manifest.json')||!files.has('config.dshui')||files.get('manifest.json').size>16384)throw Error('投稿 ZIP 内容不完整。')
  const meta=normalizePresetMeta(JSON.parse(await files.get('manifest.json').text()))
  if(meta.coverFile){const cover=files.get(meta.coverFile);if(!cover||cover.size>4*1024*1024)throw Error('封面缺失或超过 4 MB。');const b=new Uint8Array(await cover.slice(0,12).arrayBuffer()),ascii=(a,z)=>String.fromCharCode(...b.slice(a,z));if(!(meta.coverFile.endsWith('.png')&&b[0]===137&&ascii(1,4)==='PNG'||meta.coverFile.endsWith('.jpg')&&b[0]===255&&b[1]===216||meta.coverFile.endsWith('.webp')&&ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP'))throw Error('封面图片格式无效。')}
  if(files.size!==(meta.coverFile?3:2)||await sha256(files.get('config.dshui'),win)!==meta.configSha256)throw Error('投稿配置校验失败。')
  const config=await inspectPresetConfig(files.get('config.dshui'),meta.scope,win)
  return {meta,files,...config}
}
