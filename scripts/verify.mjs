import {spawn} from 'node:child_process'
import {readFile,mkdir,writeFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'

const root=fileURLToPath(new URL('..',import.meta.url)),pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'))
const output=resolve(process.env.DSH_CLAUDE_OUTPUT_DIR||resolve(root,'../.scratch/claude-beautify'),'release-verification')
await mkdir(output,{recursive:true})
const retry=process.argv.includes('--rerun-failed'),previous=retry?JSON.parse(await readFile(resolve(output,'report.json'),'utf8')):null
const only=retry?previous.results.filter(item=>item.code!==0).map(item=>item.name):process.argv.find(value=>value.startsWith('--only='))?.slice(7).split(',')
const cases=Object.entries(pkg.scripts).filter(([name,command])=>(name==='test'||name.startsWith('test:'))&&name!=='test:release'&&command.startsWith('node ')&&(!only||only.includes(name)))
const report=previous?{...previous,version:pkg.version,completedAt:undefined}:{version:pkg.version,startedAt:new Date().toISOString(),hostArchive:!!process.env.DSH_ASAR,results:[]}
for(const [name,command]of cases){
 console.log(`START ${name}`)
 const start=Date.now(),log=[]
 if(!process.env.npm_execpath)throw Error('Run npm run test:release so compound test commands use the configured npm CLI')
 const result=await new Promise(done=>{
  const child=spawn(process.execPath,[process.env.npm_execpath,'run',name],{cwd:root,env:process.env,windowsHide:true,stdio:['ignore','pipe','pipe']})
  child.stdout.on('data',chunk=>log.push(chunk.toString()));child.stderr.on('data',chunk=>log.push(chunk.toString()))
  const timer=setTimeout(()=>{child.kill();},300000)
  child.on('error',error=>log.push(error.message));child.on('close',(code,signal)=>{clearTimeout(timer);done({code,signal})})
 })
 const text=log.join(''),checks=(text.match(/^PASS /gm)||[]).length||Number(text.match(/ℹ pass (\d+)/)?.[1]||0)
 const index=report.results.findIndex(item=>item.name===name),old=index>=0?report.results[index]:null,attempt=(old?.attempt||0)+1
 const filename=name.replaceAll(':','-')+`-attempt${attempt}.log`;await writeFile(resolve(output,filename),text)
 const record={name,...result,checks,elapsedMs:Date.now()-start,attempt,log:filename,...(old?{previousAttempts:[...(old.previousAttempts||[]),{code:old.code,elapsedMs:old.elapsedMs,log:old.log}]}:{})}
 if(index>=0)report.results[index]=record;else report.results.push(record)
 await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n')
 console.log(`${result.code===0?'PASS':'FAIL'} ${name} (${checks} checks, ${Math.round(record.elapsedMs/1000)}s)`)
 if(result.code!==0)console.log(text.slice(-2500))
}
report.completedAt=new Date().toISOString();report.passed=report.results.filter(item=>item.code===0).length;report.failed=report.results.filter(item=>item.code!==0).length;report.checks=report.results.reduce((sum,item)=>sum+item.checks,0)
await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify({version:report.version,suites:report.results.length,passed:report.passed,failed:report.failed,checks:report.checks,report:resolve(output,'report.json')}))
process.exitCode=report.failed?1:0
