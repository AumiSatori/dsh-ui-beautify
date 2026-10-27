import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {earlyOpeningHtml,prepareEarlyOpeningArchive} from '../scripts/early-opening-patch.mjs'
const hash=bytes=>createHash('sha256').update(bytes).digest('hex')
test('early script precedes deferred modules and repeated upgrades preserve the host index around it',()=>{
  const source='<head><script type="module" src="main.js"></script></head><body><div id="root"></div></body>'
  const first=earlyOpeningHtml(source,'window.example="</script>";')
  assert.ok(first.includes('<\\/script>'));assert.equal(earlyOpeningHtml(first,'next();').match(/data-dcb-early-opening/g).length,1)
  assert.ok(earlyOpeningHtml(first,'next();').includes('<div id="root"></div>'));assert.throws(()=>earlyOpeningHtml('<body>','x'))
})
test('archive replacement updates index integrity, leaves every other entry unchanged and does not grow on repeated updates',()=>{
  const index=Buffer.from('<head></head><body><div id="root"></div></body>'),other=Buffer.from('unchanged-host-module')
  const entry={size:index.length,offset:'0',integrity:{algorithm:'SHA256',hash:hash(index),blockSize:64,blocks:[hash(index)]}}
  const files={};let target=files;for(const name of ['dsh','node_modules','@deepseek-ai','dsh-web-frontend','dist']){target[name]={files:{}};target=target[name].files}target['index.html']=entry;target['main.js']={size:other.length,offset:String(index.length)}
  const json=Buffer.from(JSON.stringify({files})),pad=(4-json.length%4)%4,head=Buffer.alloc(16);head.writeUInt32LE(4,0);head.writeUInt32LE(8+json.length+pad,4);head.writeUInt32LE(4+json.length+pad,8);head.writeUInt32LE(json.length,12)
  const input=Buffer.concat([head,json,Buffer.alloc(pad),index,other]),first=prepareEarlyOpeningArchive(input,'window.early=true;')
  const base=8+first.bytes.readUInt32LE(4),tree=JSON.parse(first.bytes.subarray(16,16+first.bytes.readUInt32LE(12)).toString()),rows=tree.files.dsh.files.node_modules.files['@deepseek-ai'].files['dsh-web-frontend'].files.dist.files
  assert.deepEqual(first.bytes.subarray(base+Number(rows['main.js'].offset),base+Number(rows['main.js'].offset)+other.length),other)
  const changed=rows['index.html'],content=first.bytes.subarray(base+Number(changed.offset),base+Number(changed.offset)+changed.size);assert.equal(changed.integrity.hash,hash(content))
  assert.equal(prepareEarlyOpeningArchive(first.bytes,'window.early=true;').changed,false)
  assert.ok(prepareEarlyOpeningArchive(first.bytes,'window.early=false;').bytes.length<first.bytes.length+10)
})
