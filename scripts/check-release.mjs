import assert from 'node:assert/strict'
import {readFile,access} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import vm from 'node:vm'

const root=fileURLToPath(new URL('..',import.meta.url)),read=path=>readFile(resolve(root,path),'utf8')
const pkg=JSON.parse(await read('package.json')),lock=JSON.parse(await read('package-lock.json'))
assert.equal(pkg.name,'dsh-ui-beautify');assert.notEqual(pkg.private,true);assert.equal(pkg.version,lock.version);assert.equal(pkg.version,lock.packages[''].version)
for(const key of['author','description','homepage','icon','license'])assert.ok(pkg[key],`Missing ${key}`)
assert.ok(pkg.keywords.includes('dsh-plugin'));assert.ok(pkg.engines.dsh)
assert.ok(process.env.npm_execpath,'Run npm run check:release so the configured npm CLI can inspect its exact package contents')
const semver=createRequire(process.env.npm_execpath)('semver')
assert.ok(semver.satisfies('0.2.1-rc.2',pkg.engines.dsh),'The actual tested prerelease host must be installable')
assert.ok(!semver.satisfies('0.1.0',pkg.engines.dsh));assert.ok(!semver.satisfies('0.3.0',pkg.engines.dsh))
for(const hook of['preinstall','install','postinstall','prepare'])assert.equal(pkg.scripts[hook],undefined,`Unexpected install-time hook ${hook}`)
assert.equal(Object.keys(pkg.dependencies||{}).length,0,'Presentation runtime uses only host services')
const patch=await read(pkg.dsh.bundle.patch);assert.match(patch,/- insert:/);assert.match(patch,/id: dsh-ui-beautify/);assert.match(patch,/name: dsh-ui-beautify/)
let registration
vm.runInNewContext(await read('client.js'),{window:{__ModuleLoader__:{load:value=>registration=value}}})
assert.equal(registration.id,pkg.name);assert.equal(typeof registration.factory(()=>({})).apply,'function')
const screenshots=JSON.parse(await read('screenshots.json'));assert.ok(screenshots.length>=1&&screenshots.length<=8)
for(const path of[pkg.icon,'assets/icon.png',...screenshots]){assert.ok(!path.startsWith('/')&&!path.split(/[\\/]/).includes('..'));await access(resolve(root,path))}
const [pack]=JSON.parse(execFileSync(process.execPath,[process.env.npm_execpath,'pack','--dry-run','--json','--offline','--ignore-scripts'],{cwd:root,encoding:'utf8',maxBuffer:4*1024*1024,timeout:30000,windowsHide:true}))
const files=new Set(pack.files.map(item=>item.path))
for(const path of['index.js','client.js','cordis.patch.yml','README.md','LICENSE','THIRD_PARTY_NOTICES.md','vendor/lens/LICENSE','assets/CONTEXT-WHALE-LICENSE.md','assets/icon.svg','assets/icon.png','docs/DELIVERY.md','CHANGELOG.md'])assert.ok(files.has(path),`Missing package file ${path}`)
for(const file of files)assert.ok(!/(?:^|\/)(?:node_modules|test|tests|src|\.git|\.scratch|profiles|cache)(?:\/|$)|(?:^|\/)\.env|\.(?:log|bak|wav|mp3|sqlite|pem|key)$/i.test(file),`Unexpected package content: ${file}`)
assert.ok(pack.size<4*1024*1024,'Review unexpectedly large package contents before release')
console.log(JSON.stringify({name:pkg.name,version:pkg.version,host:pkg.engines.dsh,files:files.size,packedBytes:pack.size,unpackedBytes:pack.unpackedSize,screenshots:screenshots.length,installHooks:false,runtimeDependencies:0}))
