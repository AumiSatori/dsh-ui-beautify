// Explicit, reversible local migration. Nothing is changed without --apply.
import {readFileSync,writeFileSync,mkdirSync,lstatSync,readlinkSync,symlinkSync,unlinkSync,existsSync,copyFileSync} from 'node:fs'
import {resolve,join,dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {homedir} from 'node:os'
const NAME='dsh-ui-beautify',OLD='dsh-whalechan-running'
const normalized=path=>resolve(path).replaceAll('\\','/').toLowerCase()
function inspect(link){try{const stat=lstatSync(link);if(!stat.isSymbolicLink())throw Error(`安装项不是链接，已保留：${link}`);return resolve(dirname(link),readlinkSync(link))}catch(error){if(error.code==='ENOENT')return null;throw error}}
export function migrateRunningPlugin({profile,source,backup,apply=false}){
 source=resolve(source);profile=resolve(profile)
 if(JSON.parse(readFileSync(join(source,'package.json'),'utf8')).name!==NAME||!existsSync(join(source,'server/running-assets.js')))throw Error('目标目录不是已整合动图功能的 UI 美化源码')
 const pkgPath=join(profile,'package.json'),lockPath=join(profile,'pnpm-lock.yaml'),patchPath=join(profile,'cordis.patch.yml'),link=join(profile,'node_modules',NAME),oldLink=join(profile,'node_modules',OLD)
 const raw=readFileSync(pkgPath,'utf8'),pkg=JSON.parse(raw),lock=existsSync(lockPath)?readFileSync(lockPath,'utf8'):null,patch=existsSync(patchPath)?readFileSync(patchPath,'utf8'):null,previous=inspect(link),old=inspect(oldLink),spec=`link:${source.replaceAll('\\','/')}`
 if(!Array.isArray(pkg.dsh?.profile?.bundles))throw Error('未知的 DSH profile 格式')
 for(const [name,target]of[[NAME,previous],[OLD,old]]){
  if(pkg.dependencies?.[name]&&(!target||pkg.dependencies[name]!==`link:${target.replaceAll('\\','/')}`))throw Error(`依赖与安装链接不一致，已保留：${name}`)
  if(target&&JSON.parse(readFileSync(join(target,'package.json'),'utf8')).name!==name)throw Error(`链接指向了其他工程，已保留：${name}`)
 }
 if(patch&&/\b(?:id|name):\s*['"]?dsh-whalechan-running\b/.test(patch))throw Error('旧动图插件还在用户补丁层中，请先处理该注册项；没有修改任何文件')
 pkg.dependencies??={};pkg.dependencies[NAME]=spec;delete pkg.dependencies[OLD];pkg.dsh.profile.bundles=[...new Set([...pkg.dsh.profile.bundles.filter(name=>name!==OLD),NAME])]
 const next=JSON.stringify(pkg,null,2)+'\n';let lockNext=lock
 if(lock!==null){
  const match=/(^importers:\r?\n[\s\S]*?^  \.:\r?\n[\s\S]*?^    dependencies:\r?\n)([\s\S]*?)(?=^  [^ ]|^[^ \r\n]|$(?![\s\S]))/m.exec(lock)
  if(!match)throw Error('未知的锁文件格式，未修改任何文件')
  const records=match[2].replace(/^      dsh-(?:ui-beautify|whalechan-running):\r?\n        specifier: [^\r\n]*\r?\n        version: [^\r\n]*(?:\r?\n|$)/gm,'')
  if(/^      dsh-(?:ui-beautify|whalechan-running):/m.test(records))throw Error('锁文件依赖格式异常，未修改任何文件')
  lockNext=lock.slice(0,match.index)+match[1]+`      ${NAME}:\n        specifier: ${spec}\n        version: ${spec}\n`+records+lock.slice(match.index+match[0].length)
 }
 const changed=raw!==next||lock!==lockNext||!!old||!previous||normalized(previous)!==normalized(source)
 const plan={applied:false,changed,profile,source,previous,removedPlugin:OLD,oldSourcePreserved:old,restartRequired:changed}
 if(!apply||!changed)return plan
 const backupDir=resolve(backup||resolve(source,'../running-plugin-migration'),`${Date.now()}`);mkdirSync(backupDir,{recursive:true});copyFileSync(pkgPath,join(backupDir,'package.json'));if(lock!==null)copyFileSync(lockPath,join(backupDir,'pnpm-lock.yaml'));writeFileSync(join(backupDir,'links.json'),JSON.stringify({link,previous,oldLink,old},null,2)+'\n')
 if(readFileSync(pkgPath,'utf8')!==raw||(lock!==null&&readFileSync(lockPath,'utf8')!==lock)||(patch!==null&&readFileSync(patchPath,'utf8')!==patch)||inspect(link)!==previous||inspect(oldLink)!==old)throw Error('配置被其他进程修改，已保留新现场')
 let newLink=false,removedPrevious=false,removedOld=false
 try{
  if(!previous||normalized(previous)!==normalized(source)){if(previous){unlinkSync(link);removedPrevious=true}mkdirSync(dirname(link),{recursive:true});symlinkSync(source,link,process.platform==='win32'?'junction':'dir');newLink=true}
  if(old){unlinkSync(oldLink);removedOld=true}
  if(lock!==lockNext)writeFileSync(lockPath,lockNext)
  writeFileSync(pkgPath,next)
 }catch(error){
  if(newLink&&normalized(inspect(link)||source)===normalized(source))unlinkSync(link)
  if(removedPrevious)symlinkSync(previous,link,process.platform==='win32'?'junction':'dir')
  if(removedOld)symlinkSync(old,oldLink,process.platform==='win32'?'junction':'dir')
  writeFileSync(pkgPath,raw);if(lock!==null)writeFileSync(lockPath,lock)
  throw error
 }
 if(inspect(oldLink)||normalized(inspect(link))!==normalized(source)||JSON.parse(readFileSync(pkgPath,'utf8')).dependencies[OLD])throw Error(`迁移后核验失败，备份：${backupDir}`)
 return {...plan,applied:true,backupDir}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),at=args.indexOf('--profile'),profileName=at<0?'desktop':args[at+1]
 if(!/^[\w-]+$/.test(profileName))throw Error('无效 profile 名称')
 const source=fileURLToPath(new URL('..',import.meta.url)),profile=join(process.env.DSH_HOME||join(homedir(),'.dsh'),'profiles',profileName)
 console.log(JSON.stringify(migrateRunningPlugin({profile,source,apply:args.includes('--apply'),backup:process.env.DSH_UI_MIGRATION_BACKUPS}),null,2))
}
