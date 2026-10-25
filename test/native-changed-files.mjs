import {openSync,readSync,closeSync} from 'node:fs'

export function nativeChangedFiles(){
  if(!process.env.DSH_ASAR)throw Error('Set DSH_ASAR to verify the installed ChangedFiles component')
  const fd=openSync(process.env.DSH_ASAR,'r')
  try{
    const head=Buffer.alloc(16);readSync(fd,head,0,16,0)
    const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
    let entry=JSON.parse(json)
    for(const part of 'dsh/node_modules/@deepseek-ai/dsh-client-ui-deliverables/lib/client.js'.split('/'))entry=entry.files[part]
    const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset))
    const source=bytes.toString(),at=source.indexOf('ChangedFiles.module.css'),region=source.slice(source.lastIndexOf('//#region',at),source.indexOf('//#endregion',at))
    const css=JSON.parse(region.match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)[1])
    const classes=JSON.parse(source.match(/var ChangedFiles_module_css_default = (\{[\s\S]*?\n\s*\});/)[1])
    const codeAt=source.indexOf('//#region lib/types/client/ChangedFiles.js')
    return {css,classes,code:source.slice(codeAt,source.indexOf('//#endregion',codeAt))}
  }finally{closeSync(fd)}
}
