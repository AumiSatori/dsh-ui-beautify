import assert from 'node:assert/strict'
import {openSync,readSync,closeSync,readFileSync} from 'node:fs'
import {transformSync} from 'esbuild'
import {runInNewContext} from 'node:vm'

// rc.2 ships compressed client bundles without region comments. Decode string
// literals through esbuild so fixtures use the installed CSS in either format.
export function readableHost(source){
 return transformSync(source,{loader:'js',minify:false,supported:{'template-literal':false}}).code
}
export function hostFile(name){
 assert.ok(process.env.DSH_ASAR,'Set DSH_ASAR to verify the installed host')
 const fd=openSync(process.env.DSH_ASAR,'r')
 try{
  const head=Buffer.alloc(16);readSync(fd,head,0,16,0)
  const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
  let entry=JSON.parse(json)
  for(const part of name.split('/'))entry=entry?.files?.[part]
  assert.ok(entry,'Installed host file: '+name)
  if(entry.unpacked)return readFileSync(process.env.DSH_ASAR+'.unpacked/'+name,'utf8')
  const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset))
  return bytes.toString()
 }finally{closeSync(fd)}
}
export function hostSheet(source,name,prefix){
 const formatted=readableHost(source),at=formatted.indexOf('/'+name+'.module.css')
 assert.ok(at>=0,'Installed '+name+' stylesheet tag')
 const literals=[...formatted.slice(0,at).matchAll(/(?:const|var) css(?:\$\d+)? = ("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*');/g)]
 assert.ok(literals.length,'Installed '+name+' stylesheet literal')
 // Only the quoted literal is evaluated; no host statements or interpolations.
 const css=runInNewContext(literals.at(-1)[1],Object.create(null),{timeout:100})
 if(!prefix)return css
 const hash=css.match(/\.([\w-]+)_\w+\{/)
 assert.ok(hash,'Installed '+name+' stylesheet classes')
 return css.replaceAll(hash[1]+'_',prefix+'_')
}
