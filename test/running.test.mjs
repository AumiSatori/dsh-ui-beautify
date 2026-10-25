import {test} from 'node:test'
import assert from 'node:assert/strict'
import {normalizeRunningAnimation,normalizeRunningManifest,runningPath,chooseRunningAction,runningLabelLines,chooseRunningLabel,RUNNING_LABEL_LIMIT} from '../src/running-animation-config.js'
import {readRunningZip} from '../src/running-pack-zip.js'
import {createRunningZip} from '../scripts/build-animation-pack.mjs'
import {registerRunningAssets} from '../server/running-assets.js'
const manifest={format:'dsh-running-pack',version:1,actions:[{id:'work',name:'工作',file:'work.png',type:'sprite',frames:60,columns:10,fps:12.5}]}
test('animation preferences retain an explicitly empty selection and bound corrupt settings',()=>{
 assert.equal(normalizeRunningAnimation(null).runningAnimationEnabled,true)
 assert.deepEqual(normalizeRunningAnimation({runningAnimationActions:[]}).runningAnimationActions,[])
 assert.deepEqual(normalizeRunningAnimation({runningAnimationActions:['one','one','../two']}).runningAnimationActions,['one'])
 assert.equal(normalizeRunningAnimation({runningAnimationSize:900}).runningAnimationSize,80)
 assert.equal(normalizeRunningAnimation({runningAnimationSize:-1}).runningAnimationSize,16)
})
test('pack manifests reject missing files, duplicate ids, path traversal and broken sprite metadata',()=>{
 assert.equal(normalizeRunningManifest(manifest,new Map([['work.png',{}]])).actions[0].rows,6)
 assert.throws(()=>normalizeRunningManifest(manifest,new Map()),/缺少/)
 for(const file of ['../x.png','/x.png','x/../a.png','C:\\x.png','https://x/image.png'])assert.throws(()=>runningPath(file))
 assert.throws(()=>normalizeRunningManifest({...manifest,actions:[...manifest.actions,...manifest.actions]}),/唯一/)
 assert.throws(()=>normalizeRunningManifest({...manifest,actions:[{...manifest.actions[0],frames:999}]}),/参数/)
})
test('random action selection avoids an immediate repeat; fixed and empty modes are deterministic',()=>{
 const actions=[{id:'a'},{id:'b'},{id:'c'}]
 assert.equal(chooseRunningAction(actions,{previous:'a',randomValue:0}).id,'b')
 assert.equal(chooseRunningAction(actions,{previous:'a',randomValue:.999}).id,'c')
 assert.equal(chooseRunningAction(actions,{random:false,previous:'a'}).id,'a');assert.equal(chooseRunningAction([]),null)
})
test('custom thinking labels keep editing newlines, trim blank lines and bound each entry',()=>{
 assert.equal(normalizeRunningAnimation(null).runningAnimationLabel,'')
 assert.equal(normalizeRunningAnimation({runningAnimationLabel:'甲\r\n乙'}).runningAnimationLabel,'甲\n乙')
 assert.equal(normalizeRunningAnimation({runningAnimationLabel:' 甲 \n\n 乙 '}).runningAnimationLabel,' 甲 \n\n 乙 ')
 assert.equal(normalizeRunningAnimation({runningAnimationLabel:'字'.repeat(2000)}).runningAnimationLabel.length,RUNNING_LABEL_LIMIT.chars)
 assert.deepEqual(runningLabelLines('甲\n\n  甲  \n 乙 '),['甲','乙'])
 assert.deepEqual(runningLabelLines('字'.repeat(80)),['字'.repeat(RUNNING_LABEL_LIMIT.lineChars)])
 assert.equal(runningLabelLines(Array.from({length:30},(_,index)=>`第${index}条`).join('\n')).length,RUNNING_LABEL_LIMIT.lines)
 assert.deepEqual(runningLabelLines(null),[]);assert.deepEqual(runningLabelLines('   '),[])
})
test('random label groups avoid an immediate repeat while fixed mode keeps the first entry',()=>{
 assert.equal(chooseRunningLabel([]),'')
 assert.equal(chooseRunningLabel(['唯一'],{random:true}),'唯一')
 assert.equal(chooseRunningLabel(['甲','乙'],{random:false,randomValue:.99}),'甲')
 assert.equal(chooseRunningLabel(['甲','乙','丙'],{previous:'甲',randomValue:0}),'乙')
 assert.equal(chooseRunningLabel(['甲','乙','丙'],{previous:'甲',randomValue:.999}),'丙')
})
test('ZIP import validates Unicode filenames, deflate streams, checksums and unsafe paths',async()=>{
 const zipped=createRunningZip(new Map([['动作/工作.gif',Buffer.from('GIF89atest')],['manifest.json',Buffer.from(JSON.stringify(manifest))]]))
 const file=new File([zipped],'pack.zip'),files=await readRunningZip(file)
 assert.equal(await files.get('动作/工作.gif').text(),'GIF89atest')
 const corrupt=Buffer.from(zipped);corrupt[14]^=1;corrupt[corrupt.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]))+16]^=1
 await assert.rejects(()=>readRunningZip(new File([corrupt],'bad.zip')),/校验/)
 await assert.rejects(()=>readRunningZip(new File([createRunningZip(new Map([['../escape.gif',Buffer.from('GIF89a')]]))],'bad.zip')),/路径/)
 await assert.rejects(()=>readRunningZip(new File([createRunningZip(new Map([['a.gif',Buffer.from('1')],['A.gif',Buffer.from('2')]]))],'bad.zip')),/重复/)
 await assert.rejects(()=>readRunningZip(new File([zipped.subarray(0,zipped.length-4)],'bad.zip')),/ZIP/)
})
test('builtin asset server exposes only manifest-listed images and releases both routes',async()=>{
 const routes=new Map();let cleanup
 registerRunningAssets({inject(_keys,fn){cleanup=fn({webServer:{register(route){routes.set(route.path,route.handler);return()=>routes.delete(route.path)}}})}})
 async function request(path,method='GET',headers={}){let status,body;await routes.get(path.split('?')[0])({url:path,method,headers},{writeHead(code){status=code;return this},end(data){body=data}});return {status,body}}
 const response=await request('/dsh-ui-beautify/running/pack.json'),pack=JSON.parse(response.body)
 assert.equal(response.status,200);assert.equal(pack.actions.length,51)
 assert.equal((await request('/dsh-ui-beautify/running/asset?id='+pack.actions[0].id)).status,200)
 assert.equal((await request('/dsh-ui-beautify/running/asset?id=../../secret')).status,404)
 assert.equal((await request('/dsh-ui-beautify/running/pack.json','POST')).status,405)
 assert.equal((await request('/dsh-ui-beautify/running/pack.json','GET',{'sec-fetch-site':'cross-site'})).status,403)
 cleanup();assert.equal(routes.size,0)
})
