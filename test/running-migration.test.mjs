import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,symlinkSync,readlinkSync,existsSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {migrateRunningPlugin} from '../scripts/migrate-running-plugin.mjs'
test('migration is explicit, backed up and idempotent; preserves source trees, other dependencies and lock graph',t=>{
 const base=mkdtempSync(join(tmpdir(),'dcb-running-migrate-')),source=fileURLToPath(new URL('..',import.meta.url)),profile=join(base,'profile'),stable=join(base,'stable'),old=join(base,'old')
 t.after(()=>{assert.ok(base.startsWith(join(tmpdir(),'dcb-running-migrate-')));rmSync(base,{recursive:true,force:true})})
 for(const path of[profile,stable,old,join(profile,'node_modules')])mkdirSync(path,{recursive:true})
 const link=path=>`link:${resolve(path).replaceAll('\\','/')}`
 writeFileSync(join(stable,'package.json'),JSON.stringify({name:'dsh-ui-beautify'}));writeFileSync(join(old,'package.json'),JSON.stringify({name:'dsh-whalechan-running'}));writeFileSync(join(old,'keep.txt'),'source retained')
 symlinkSync(stable,join(profile,'node_modules/dsh-ui-beautify'),process.platform==='win32'?'junction':'dir');symlinkSync(old,join(profile,'node_modules/dsh-whalechan-running'),process.platform==='win32'?'junction':'dir')
 const pkg={dependencies:{other:'1.0', 'dsh-ui-beautify':link(stable),'dsh-whalechan-running':link(old)},dsh:{profile:{bundles:['other','dsh-whalechan-running','dsh-ui-beautify']}},custom:{keep:true}}
 writeFileSync(join(profile,'package.json'),JSON.stringify(pkg));writeFileSync(join(profile,'cordis.patch.yml'),'# keep exactly\n')
 const graph='\npackages:\n  other@1.0:\n    resolution: {integrity: unchanged}\n',lock=`lockfileVersion: '9.0'\nimporters:\n  .:\n    dependencies:\n      other:\n        specifier: 1.0\n        version: 1.0\n      dsh-ui-beautify:\n        specifier: ${link(stable)}\n        version: ${link(stable)}\n      dsh-whalechan-running:\n        specifier: ${link(old)}\n        version: ${link(old)}\n${graph}`
 writeFileSync(join(profile,'pnpm-lock.yaml'),lock)
 const options={profile,source,backup:join(base,'backups')}
 assert.equal(migrateRunningPlugin(options).applied,false);assert.equal(readFileSync(join(profile,'pnpm-lock.yaml'),'utf8'),lock)
 const result=migrateRunningPlugin({...options,apply:true}),next=JSON.parse(readFileSync(join(profile,'package.json'))),newLock=readFileSync(join(profile,'pnpm-lock.yaml'),'utf8')
 assert.equal(result.applied,true);assert.ok(existsSync(join(result.backupDir,'links.json')));assert.equal(readFileSync(join(result.backupDir,'pnpm-lock.yaml'),'utf8'),lock)
 assert.equal(next.dependencies.other,'1.0');assert.deepEqual(next.custom,pkg.custom);assert.equal(next.dependencies['dsh-whalechan-running'],undefined);assert.equal(next.dependencies['dsh-ui-beautify'],link(source));assert.deepEqual(next.dsh.profile.bundles,['other','dsh-ui-beautify'])
 assert.equal(readFileSync(join(old,'keep.txt'),'utf8'),'source retained');assert.ok(newLock.endsWith(graph));assert.doesNotMatch(newLock,/dsh-whalechan-running/);assert.equal(readFileSync(join(profile,'cordis.patch.yml'),'utf8'),'# keep exactly\n')
 assert.equal(resolve(readlinkSync(join(profile,'node_modules/dsh-ui-beautify'))),resolve(source));assert.equal(existsSync(join(profile,'node_modules/dsh-whalechan-running')),false)
 assert.equal(migrateRunningPlugin({...options,apply:true}).changed,false)
 const current=readFileSync(join(profile,'package.json'),'utf8');writeFileSync(join(profile,'cordis.patch.yml'),'- id: dsh-whalechan-running\n')
 assert.throws(()=>migrateRunningPlugin({...options,apply:true}),/补丁层/);assert.equal(readFileSync(join(profile,'package.json'),'utf8'),current)
})
