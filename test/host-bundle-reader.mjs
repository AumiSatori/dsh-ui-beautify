import {transformSync} from 'esbuild'
import {runInNewContext} from 'node:vm'

// Older builds retain source regions. Recent builds ship the same declarations
// on a single line. Format the latter before selecting complete declarations.
export function formatBundle(source){
  return source.includes('//#region')?source:transformSync(source,{supported:{'template-literal':false}}).code
}

export function componentRegion(source,start,next){
  const first=source.indexOf(start)
  const last=source.indexOf(source.includes('//#region')?'//#endregion':next,first+start.length)
  if(first<0||last<0)throw Error('Missing component boundary for '+start)
  return source.slice(first,last)
}

export function moduleCss(source,name){
  const tag=source.indexOf('/'+name+'.module.css')
  if(tag<0)throw Error('Missing stylesheet marker for '+name)
  const block=source.includes('//#region')?source.slice(source.lastIndexOf('//#region',tag),source.indexOf('//#endregion',tag)):source.slice(0,tag)
  const declarations=block.matchAll(/\bconst css\$?\d* = ([^\n]+);/g)
  const declaration=Array.from(declarations).at(-1)
  if(!declaration)throw Error('Missing stylesheet for '+name)
  return runInNewContext(declaration[1],{require:{asset:path=>path},require2:{asset:path=>path}},{timeout:1000})
}

export function moduleClasses(source,name){
  const match=source.match(new RegExp('var '+name+'_module_css_default = (\\{[^}]*\\});'))
  if(!match)throw Error('Missing class map for '+name)
  return JSON.parse(match[1])
}
