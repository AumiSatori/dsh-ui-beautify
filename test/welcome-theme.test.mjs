import {test} from 'node:test'
import assert from 'node:assert/strict'
import {normalizeThemedWelcome,themeWelcome,patchWelcomeTheme} from '../src/welcome-theme.js'
import {welcomeCodeReferences} from '../src/welcome-code-modes.js'

test('legacy opening settings remain available in both themes until one is edited',()=>{
  const legacy={welcomeEnabled:false,welcomeText:'旧欢迎',welcomeMode:'media',welcomeMediaRevision:'old',welcomeFont:'Old Font'}
  assert.equal(normalizeThemedWelcome(legacy).welcomeThemes,null)
  const next=patchWelcomeTheme(legacy,{welcomeText:'夜间欢迎',welcomeMediaRevision:'night'},'dark')
  assert.equal(themeWelcome(next,'light').welcomeText,'旧欢迎')
  assert.equal(themeWelcome(next,'light').welcomeMediaRevision,'old')
  assert.equal(themeWelcome(next,'dark').welcomeText,'夜间欢迎')
  assert.equal(themeWelcome(next,'dark').welcomeMediaRevision,'night')
  assert.equal(themeWelcome(next,'dark').welcomeEnabled,false)
})
test('each theme retains its opening mode, font, duration, fit, logo and enabled state',()=>{
  const day={welcomeEnabled:true,welcomeMode:'media',welcomeMediaRevision:'day',welcomeMediaFit:'cover',welcomeMediaDuration:6000,welcomeText:'日间',welcomeDuration:1200,welcomeFont:'Day',welcomeLogo:true}
  const night={welcomeEnabled:false,welcomeMode:'characters',welcomeMediaRevision:'night',welcomeMediaFit:'contain',welcomeMediaDuration:2500,welcomeText:'夜间',welcomeDuration:3200,welcomeFont:'Night',welcomeLogo:false}
  const source={...day,...patchWelcomeTheme(day,night,'dark')},saved=patchWelcomeTheme(source,{welcomeText:'新日间'},'light')
  for(const [key,value]of Object.entries(night))assert.equal(themeWelcome(saved,'dark')[key],value,key)
  for(const [key,value]of Object.entries({...day,welcomeText:'新日间'}))assert.equal(themeWelcome(saved,'light')[key],value,key)
  assert.deepEqual(patchWelcomeTheme(saved,{width:350},'dark'),{width:350})
  assert.equal(themeWelcome({...saved,width:350,messageMotion:false},'dark').width,350)
  assert.equal(themeWelcome({...saved,width:350,messageMotion:false},'dark').messageMotion,false)
})
test('theme maps normalize untrusted fields and never persist media bytes or unknown preferences',()=>{
  const clean=normalizeThemedWelcome({welcomeThemes:{light:{welcomeDuration:-5,blob:'private'},dark:{welcomeMediaDuration:Infinity,welcomeText:'\0  夜间  ',welcomeMediaRevision:'x'.repeat(120),extra:1}}})
  assert.equal(clean.welcomeThemes.light.welcomeDuration,900)
  assert.equal(clean.welcomeThemes.dark.welcomeMediaDuration,3000)
  assert.equal(clean.welcomeThemes.dark.welcomeText,'夜间')
  assert.equal(clean.welcomeThemes.dark.welcomeMediaRevision.length,80)
  assert.equal(JSON.stringify(clean).includes('private'),false)
  assert.equal(Object.hasOwn(clean.welcomeThemes.dark,'extra'),false)
})

test('legacy code migrates only to its selected behavior and toggles never borrow the other code',()=>{
  for(const interactive of [false,true]){
    const source={welcomeCodeInteractive:interactive,welcomeCodeRevision:'legacy',welcomeCodeName:'旧代码'}
    const changed=patchWelcomeTheme(source,{welcomeCodeInteractive:!interactive},'light')
    assert.equal(themeWelcome(changed,'light').welcomeCodeRevision,'')
    assert.equal(themeWelcome(changed,'dark').welcomeCodeRevision,'legacy')
    const restored=patchWelcomeTheme(changed,{welcomeCodeInteractive:interactive},'light')
    assert.equal(themeWelcome(restored,'light').welcomeCodeRevision,'legacy')
  }
})

test('four theme and behavior code references remain independent and survive normalization and replacement',()=>{
  let value={welcomeEnabled:false}
  for(const theme of ['light','dark'])for(const interactive of [false,true]){
    value={...value,...patchWelcomeTheme(value,{welcomeCodeInteractive:interactive},theme)}
    value={...value,...patchWelcomeTheme(value,{welcomeCodeRevision:theme+'-'+interactive,welcomeCodeName:'代码 '+theme+' '+interactive},theme)}
  }
  assert.deepEqual(welcomeCodeReferences(value).sort(),['dark-false','dark-true','light-false','light-true'])
  value=normalizeThemedWelcome(JSON.parse(JSON.stringify(value)))
  const next={...value,...patchWelcomeTheme(value,{welcomeCodeModes:{...themeWelcome(value,'light').welcomeCodeModes,timed:{revision:'new-day',name:'新定时'}}},'light')}
  assert.deepEqual(welcomeCodeReferences(next).sort(),['dark-false','dark-true','light-true','new-day'])
  for(const theme of ['light','dark'])for(const interactive of [false,true]){
    const selected={...next,...patchWelcomeTheme(next,{welcomeCodeInteractive:interactive},theme)}
    assert.equal(themeWelcome(selected,theme).welcomeCodeRevision,theme==='light'&&!interactive?'new-day':theme+'-'+interactive)
  }
})
