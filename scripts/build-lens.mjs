import {build} from 'esbuild'
import {readFile,writeFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
const client=new URL('../client.js',import.meta.url)
const start='    /* DCB_LENS_BUNDLE_START */',end='    /* DCB_LENS_BUNDLE_END */'
const result=await build({entryPoints:[fileURLToPath(new URL('../src/lens-actions.js',import.meta.url))],bundle:true,write:false,format:'iife',globalName:'DcbLens',minify:true,target:'es2022',legalComments:'inline'})
const source=await readFile(client,'utf8'),snippet=`${start}\n    ${result.outputFiles[0].text.trim()}\n${end}`
if(!source.includes(start)||!source.includes(end))throw new Error('Lens bundle markers missing')
const next=source.slice(0,source.indexOf(start))+snippet+source.slice(source.indexOf(end)+end.length)
if(process.argv.includes('--check')){if(next!==source)throw new Error('Lens bundle is stale; run npm run build:lens')}else if(next!==source)await writeFile(client,next)
