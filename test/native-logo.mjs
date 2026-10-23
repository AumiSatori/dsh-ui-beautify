import assert from 'node:assert/strict'
import {openSync,readSync,closeSync} from 'node:fs'

// Read the installed host's exact exported brand constants for isolated tests.
// Nothing is copied into plugin sources or the distributed package.
export function nativeLogo(){
  if(!process.env.DSH_ASAR)return null
  const fd=openSync(process.env.DSH_ASAR,'r')
  try{
    const head=Buffer.alloc(16);readSync(fd,head,0,16,0)
    const json=Buffer.alloc(head.readUInt32LE(12));readSync(fd,json,0,json.length,16)
    const table=JSON.parse(json),assets=table.files.dsh.files.node_modules.files['@deepseek-ai'].files['dsh-web-frontend'].files.dist.files.assets.files
    for(const [name,entry]of Object.entries(assets)){
      if(!/^index-.*\.js$/.test(name))continue
      const bytes=Buffer.alloc(entry.size);readSync(fd,bytes,0,bytes.length,8+head.readUInt32LE(4)+Number(entry.offset))
      const source=bytes.toString(),pathName=source.match(/FISH_LOGO_PATH:([\w$]+)/)?.[1],boxName=source.match(/FISH_LOGO_VIEWBOX:([\w$]+)/)?.[1]
      if(!pathName||!boxName)continue
      const path=source.slice(source.indexOf(pathName+'="')+pathName.length+2).split('"')[0]
      const box=source.slice(source.indexOf(boxName+'={')+boxName.length+2).match(/^width:([\d.]+),height:([\d.]+)/)
      assert.ok(path.startsWith('M')&&box,'The installed host exports the native FishLogo shape and dimensions')
      return{path,width:Number(box[1]),height:Number(box[2])}
    }
    throw Error('Installed FishLogo constants not found')
  }finally{closeSync(fd)}
}
export function installLogoFixture(logo){
  window.nativeLogo=logo
  window.fixtureFishLogo=({size=24,className})=>logo?window.fixtureReact.createElement('svg',{width:size,height:size*logo.height/logo.width,className,viewBox:`0 0 ${logo.width} ${logo.height}`,'aria-hidden':true},window.fixtureReact.createElement('path',{d:logo.path,fill:'currentColor'})):null
}
