import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {resolve,join,dirname,basename} from 'node:path'
import {tmpdir} from 'node:os'
import {execFileSync} from 'node:child_process'
import vm from 'node:vm'
import {MARKET_REPO,PRESET_PACKAGE_LIMIT,inspectPresetZip,inspectPresetConfig,sha256} from '../src/preset-package.js'
import {normalizeMarketCatalog} from '../src/preset-market.js'
import {createSettingsTransfer} from '../src/settings-transfer.js'

const root=fileURLToPath(new URL('..',import.meta.url)),catalogPath=resolve(root,'market/catalog.json')
const gh=(...args)=>execFileSync(process.env.GH_PATH||'gh',args,{cwd:root,encoding:'utf8',windowsHide:true}).trim()
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',windowsHide:true}).trim()
function normalizer(){let registration;vm.runInNewContext(readFileSync(resolve(root,'client.js'),'utf8'),{window:{navigator:{userAgent:'market-validator'},__ModuleLoader__:{load:value=>{registration=value}}},document:{documentElement:{hasAttribute:()=>false}}});return registration.factory(()=>({})).__test.normalize}
export function presetSubmissionUrl(body){
  const section=/### 投稿 ZIP\s*\n([\s\S]*?)(?=\n### |$)/.exec(body||'')?.[1]||''
  const urls=section.match(/https:\/\/github\.com\/user-attachments\/files\/\d+\/[A-Za-z0-9._-]+\.zip/g)||[]
  if(urls.length!==1)throw Error('请在「投稿 ZIP」中上传一份插件导出的 ZIP。')
  return urls[0]
}
export function nextPresetCatalog(catalog,meta,{source,actor,issue,sha,archiveUrl,preview='',now=new Date().toISOString()}){
  if(!['official','community'].includes(source)||!/^[A-Za-z0-9-]{1,39}$/.test(actor||''))throw Error('发布身份无效。')
  const previous=catalog.presets.find(item=>item.id===meta.id)
  if(previous){
    const version=v=>v.split('.').map(Number),a=version(meta.version),b=version(previous.version)
    const newer=a.some((n,i)=>n>b[i]&&a.slice(0,i).every((n,j)=>n===b[j]))
    if(!newer)throw Error('更新预设必须提高版本号，禁止覆盖已发布文件。')
    if(previous.source!==source||previous.scope!==meta.scope)throw Error('更新不能更换预设来源或分类。')
    if(source==='community'&&previous.contributor!==actor)throw Error('不能更新其他投稿者的预设 ID。')
  }
  if(source==='community'&&(!Number.isSafeInteger(issue)||issue<1))throw Error('社区投稿必须关联已审核的 issue。')
  const entry={...meta,source,contributor:actor,archiveUrl,sha256:sha,publishedAt:now,...(preview?{preview}:{}),...(issue?{reviewIssue:`https://github.com/${MARKET_REPO}/issues/${issue}`}:{})}
  const next={schemaVersion:1,presets:previous?catalog.presets.map(item=>item.id===meta.id?entry:item):[entry,...catalog.presets]}
  normalizeMarketCatalog(next)
  return {catalog:next,entry}
}
async function readRemoteZip(url){
  if(!/^https:\/\/github\.com\/(?:user-attachments\/files\/\d+\/|AumiSatori\/dsh-ui-beautify\/releases\/download\/)[A-Za-z0-9._/-]+\.zip$/.test(url))throw Error('只接受 GitHub 投稿附件或本仓库 Release ZIP。')
  const response=await fetch(url,{signal:AbortSignal.timeout(60000),credentials:'omit'})
  if(!response.ok)throw Error('无法下载投稿 ZIP：HTTP '+response.status)
  const reader=response.body.getReader(),parts=[];let size=0
  try{while(true){const item=await reader.read();if(item.done)break;size+=item.value.length;if(size>PRESET_PACKAGE_LIMIT)throw Error('投稿 ZIP 超过 64 MB。');parts.push(item.value)}}catch(error){await reader.cancel().catch(()=>{});throw error}
  return new Blob(parts)
}
async function validateCatalog(){
  const catalog=JSON.parse(readFileSync(catalogPath,'utf8')),items=normalizeMarketCatalog(catalog),normalize=normalizer(),keys=normalize(null)
  for(const item of items)if(item.settings){
    for(const key of Object.keys(item.settings))if(!Object.hasOwn(keys,key))throw Error('未识别的设置：'+key)
    await inspectPresetConfig(new Blob([JSON.stringify({format:'dsh-ui-beautify-config',version:1,scope:item.scope,settings:item.settings})]),item.scope)
  }
  console.log(JSON.stringify({catalog:'valid',presets:items.length}))
}
async function publish(args){
  const value=name=>args[args.indexOf(name)+1],has=name=>args.includes(name)
  const dry=has('--dry-run')
  let source=has('--official')?'official':'community',actor,issue,blob
  if(has('--event')){
    const event=JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'))
    if(process.env.GITHUB_REPOSITORY!==MARKET_REPO)throw Error('审核工作流只能在市场维护仓库运行。')
    if(event.action!=='labeled'||event.label?.name!=='preset-approved'||!event.issue||event.issue.pull_request)throw Error('不是预设审核通过事件。')
    actor=event.sender.login;source='community';issue=event.issue.number
    const permission=JSON.parse(gh('api',`repos/${MARKET_REPO}/collaborators/${actor}/permission`)).permission
    if(!['admin','maintain','write'].includes(permission))throw Error('只有维护者可以审核投稿。')
    actor=event.issue.user.login
    blob=await readRemoteZip(presetSubmissionUrl(event.issue.body))
  }else{
    if(!has('--official'))throw Error('官方发布请使用 --official；社区发布必须由审核事件触发。')
    if(has('--file'))blob=new Blob([readFileSync(resolve(value('--file')))])
    else if(has('--url'))blob=await readRemoteZip(value('--url'))
    else throw Error('请提供 --file 或 --url。')
    if(process.env.GITHUB_REPOSITORY&&process.env.GITHUB_REPOSITORY!==MARKET_REPO)throw Error('官方发布只能在市场维护仓库运行。')
    actor=dry?'dry-run':process.env.GITHUB_ACTOR||gh('api','user','--jq','.login')
    if(!dry){const permission=JSON.parse(gh('api',`repos/${MARKET_REPO}/collaborators/${actor}/permission`)).permission;if(!['admin','maintain','write'].includes(permission))throw Error('只有维护者可以发布官方预设。')}
  }
  const inspected=await inspectPresetZip(blob),{meta,files}=inspected
  const normalize=normalizer(),known=normalize(null)
  for(const key of Object.keys(inspected.data.settings))if(!Object.hasOwn(known,key))throw Error('未识别的设置：'+key)
  await createSettingsTransfer(globalThis,{normalize}).inspect(files.get('config.dshui'))
  const tag=`preset-${meta.id}-v${meta.version}`,filename=`${meta.id}-${meta.version}.zip`,archiveUrl=`https://github.com/${MARKET_REPO}/releases/download/${tag}/${filename}`
  const next=nextPresetCatalog(JSON.parse(readFileSync(catalogPath,'utf8')),meta,{source,actor,issue,sha:await sha256(blob),archiveUrl,preview:meta.coverFile?`https://github.com/${MARKET_REPO}/releases/download/${tag}/${meta.coverFile}`:''})
  if(dry){console.log(JSON.stringify({dryRun:true,entry:next.entry,records:inspected.records},null,2));return}
  if(git('status','--porcelain'))throw Error('发布前请先提交工作树中的改动。')
  if(git('branch','--show-current')!=='main')throw Error('请从 main 发布预设。')
  git('fetch','origin','main');git('merge','--ff-only','origin/main')
  // Re-read after synchronization so publication cannot erase another approval.
  const synchronized=nextPresetCatalog(JSON.parse(readFileSync(catalogPath,'utf8')),meta,{source,actor,issue,sha:next.entry.sha256,archiveUrl,preview:next.entry.preview})
  const base=resolve(process.env.RUNNER_TEMP||tmpdir()),temporary=mkdtempSync(join(base,'dsh-preset-'))
  try{
    const path=join(temporary,filename);writeFileSync(path,Buffer.from(await blob.arrayBuffer()))
    const assets=[path]
    if(meta.coverFile){const cover=join(temporary,meta.coverFile);writeFileSync(cover,Buffer.from(await files.get(meta.coverFile).arrayBuffer()));assets.push(cover)}
    // Separate preset assets from plugin releases; never mark a preset Latest.
    gh('release','create',tag,...assets,'--repo',MARKET_REPO,'--title',meta.title+' '+meta.version,'--notes',`${meta.description}\n\n作者：${meta.author}\n许可：${meta.license}\n分类：${meta.scope}`,'--latest=false','--target',git('rev-parse','HEAD'))
    writeFileSync(catalogPath,JSON.stringify(synchronized.catalog,null,2)+'\n')
    git('add','--','market/catalog.json');git('commit','-m',`market: publish ${meta.id} ${meta.version}`);git('push','origin','HEAD:main')
    console.log(JSON.stringify({published:meta.id,version:meta.version,source,issue:issue||null}))
  }finally{
    if(dirname(temporary)===base&&basename(temporary).startsWith('dsh-preset-'))rmSync(temporary,{recursive:true,force:true})
  }
}
async function main(){const [command,...args]=process.argv.slice(2);if(command==='validate'){await validateCatalog();const index=args.indexOf('--file');if(index>=0){const result=await inspectPresetZip(new Blob([readFileSync(resolve(args[index+1]))]));console.log(JSON.stringify({package:'valid',id:result.meta.id,scope:result.meta.scope,records:result.records}))}}else if(command==='publish')await publish(args);else throw Error('Use validate [--file preset.zip] or publish --official --file preset.zip [--dry-run]')}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1})
