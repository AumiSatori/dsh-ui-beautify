import {test} from 'node:test'
import assert from 'node:assert/strict'
import {removeWelcomeCodeReferences,themeWelcome,patchWelcomeTheme} from '../src/welcome-theme.js'
import {welcomeCodeReferences} from '../src/welcome-code-modes.js'

test('deleting opening history clears both themes and behaviors without changing unrelated settings',()=>{
 const light={welcomeMode:'code',welcomeEnabled:false,welcomeCharacters:'DAY',welcomeCodeModes:{timed:{revision:'same',name:'old'},interactive:{revision:'duplicate',name:'old copy'}}}
 const value={...light,...patchWelcomeTheme(light,{welcomeMode:'code',welcomeCodeInteractive:true,welcomeCharacters:'NIGHT',welcomeCodeModes:{timed:{revision:'other',name:'keep'},interactive:{revision:'same',name:'old'}}},'dark')}
 const patch=removeWelcomeCodeReferences(value,['same','duplicate'],'dark'),next={...value,...patch}
 assert.deepEqual(welcomeCodeReferences(next),['other'])
 assert.equal(themeWelcome(next,'light').welcomeMode,'characters')
 assert.equal(themeWelcome(next,'dark').welcomeMode,'characters')
 assert.equal(themeWelcome(next,'light').welcomeCharacters,'DAY')
 assert.equal(themeWelcome(next,'dark').welcomeCharacters,'NIGHT')
 assert.equal(themeWelcome(next,'light').welcomeEnabled,false)
 assert.equal(themeWelcome(next,'dark').welcomeCodeModes.timed.revision,'other')
 assert.equal(patch.welcomeCodeRevision,'')
 assert.equal(patch.welcomeCodeName,'')
})

test('deleting an unused history entry preserves the active code and media',()=>{
 const value={welcomeMode:'media',welcomeMediaRevision:'media',welcomeCodeRevision:'code',welcomeCodeName:'keep'}
 const patch=removeWelcomeCodeReferences(value,['unused'])
 for(const theme of ['light','dark']){
  const next=themeWelcome(patch,theme)
  assert.equal(next.welcomeMode,'media')
  assert.equal(next.welcomeMediaRevision,'media')
  assert.equal(next.welcomeCodeRevision,'code')
 }
})

test('deleting legacy shared code leaves no dangling reference and preserves the original value',()=>{
 const value={welcomeMode:'code',welcomeCodeInteractive:true,welcomeCodeRevision:'legacy',welcomeCodeName:'legacy'}
 const patch=removeWelcomeCodeReferences(value,['legacy'])
 assert.deepEqual(welcomeCodeReferences(patch),[])
 for(const theme of ['light','dark'])assert.equal(themeWelcome(patch,theme).welcomeMode,'characters')
 assert.equal(value.welcomeCodeRevision,'legacy')
})
