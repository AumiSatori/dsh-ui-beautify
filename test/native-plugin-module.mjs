import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'

const require=createRequire(import.meta.url)
const {babelParse,traverse}=require(join(dirname(require.resolve('playwright/package.json')),'lib/transform/babelBundle.js'))

// Borrow the actual installed component and its local helpers. Compressed host
// packages no longer have module-region comments to delimit those helpers.
export function nativePluginDeclarations(source,names,{external=[],dependencies=true}={}){
 const ast=babelParse(source,'native-plugin.js',true),declarations=new Map(),visiting=new Set()
 let scope
 const find=path=>{if(path.node.id?.name===names[0]){scope=path.parentPath.scope;path.stop()}}
 traverse(ast,{FunctionDeclaration:find,VariableDeclarator:find,ClassDeclaration:find})
 assert.ok(scope,'Installed native component '+names[0])
 const excluded=new Set(['react','react_dom','react_jsx_runtime','clsx',...external])
 function collect(name){
  if(excluded.has(name)||name.startsWith('_deepseek_')||name.endsWith('_module_css_default')||declarations.has(name)||visiting.has(name))return
  const binding=scope.getBinding(name)
  if(!binding||binding.scope!==scope)return
  const node=binding.path.node
  assert.ok(['FunctionDeclaration','VariableDeclarator','ClassDeclaration'].includes(node.type),'Native declaration '+name)
  visiting.add(name)
  if(dependencies)binding.path.traverse({ReferencedIdentifier(path){const dependency=path.scope.getBinding(path.node.name);if(dependency?.scope===scope&&dependency!==binding)collect(path.node.name)}})
  declarations.set(name,{start:node.start,code:node.type==='VariableDeclarator'?'const '+source.slice(node.start,node.end)+';':source.slice(node.start,node.end)})
  visiting.delete(name)
 }
 for(const name of names){assert.ok(scope.getBinding(name),'Native binding '+name);collect(name)}
 return [...declarations.values()].sort((a,b)=>a.start-b.start).map(value=>value.code).join('\n')
}
