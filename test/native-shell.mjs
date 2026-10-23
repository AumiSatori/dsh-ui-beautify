import {openSync,readSync,closeSync} from 'node:fs'

export function nativeShell(){
  if(!process.env.DSH_ASAR)throw Error('Set DSH_ASAR to verify the installed native AppFrame and SidebarRoot')
  const fd=openSync(process.env.DSH_ASAR,'r')
  try{
    const header=Buffer.alloc(16);readSync(fd,header,0,16,0)
    const json=Buffer.alloc(header.readUInt32LE(12));readSync(fd,json,0,json.length,16)
    const tree=JSON.parse(json),offset=8+header.readUInt32LE(4)
    const entry=name=>{let item=tree;for(const part of `dsh/node_modules/@deepseek-ai/dsh-client-ui-${name}/lib/client.js`.split('/'))item=item.files[part];const data=Buffer.alloc(item.size);readSync(fd,data,0,data.length,offset+Number(item.offset));return data.toString()}
    const layout=entry('layout'),sidebar=entry('sidebar'),right=entry('sidebar-right')
    function sheet(source,name,prefix){
      const at=source.indexOf(name+'.module.css'),region=source.slice(source.lastIndexOf('//#region',at),source.indexOf('//#endregion',at))
      const raw=JSON.parse(region.match(/const css\$?\d* = ("(?:[^"\\]|\\.)*");/)[1]),hash=raw.match(/\.([\w]+)_(?:frame|root|session)\{/)[1]
      return {css:raw.replaceAll(hash+'_',prefix+'_'),hash}
    }
    function classes(source,name,hash,prefix){const object=JSON.parse(source.match(new RegExp(`var ${name}_module_css_default = (\\{[\\s\\S]*?\\n\\s*\\});`))[1]);for(const key of Object.keys(object))object[key]=object[key].replace(hash+'_',prefix+'_');return JSON.stringify(object)}
    const frame=sheet(layout,'AppFrame','af'),left=sheet(sidebar,'SidebarRoot','sb'),panel=sheet(right,'SidebarRight','rb')
    const region=(source,start)=>{const at=source.indexOf(start);if(at<0)throw Error('Missing native component '+start);return source.slice(at,source.indexOf('//#endregion',at))}
    const constants=region(layout,'const SIDEBAR_AUTO_COLLAPSE'),title=region(layout,'function DocumentTitle('),shell=region(layout,'function CenterColumn('),root=region(sidebar,'function SidebarRoot(')
    const collapse=sidebar.match(/const COLLAPSE_SETTLE_MS = ([\d.e]+);/)[1],linger=sidebar.match(/const SCROLLBAR_LINGER_MS = ([\d.e]+);/)[1]
    return{css:frame.css+left.css+panel.css,code:`const AppFrame_module_css_default=${classes(layout,'AppFrame',frame.hash,'af')},SidebarRoot_module_css_default=${classes(sidebar,'SidebarRoot',left.hash,'sb')},COLLAPSE_SETTLE_MS=${collapse},SCROLLBAR_LINGER_MS=${linger};${constants}\n${title}\n${shell}\n${root}`}
  }finally{closeSync(fd)}
}
