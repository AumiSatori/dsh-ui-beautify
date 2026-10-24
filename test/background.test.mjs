import {test} from 'node:test'
import assert from 'node:assert/strict'
import {normalizeBackground,backgroundMediaType,themeBackground,backgroundThemeSelection} from '../src/background-media.js'

test('wallpaper starts disabled and clamps persisted appearance without touching other preferences',()=>{
  assert.equal(normalizeBackground(null).backgroundEnabled,false)
  const value=normalizeBackground({backgroundEnabled:true,backgroundOpacity:130,backgroundBlur:-2,backgroundFit:'script',backgroundPosition:'other',backgroundSound:'true',backgroundName:'x'.repeat(200)})
  assert.equal(value.backgroundEnabled,true);assert.equal(value.backgroundOpacity,100);assert.equal(value.backgroundBlur,0)
  assert.equal(value.backgroundFit,'cover');assert.equal(value.backgroundPosition,'center');assert.equal(value.backgroundSound,false);assert.equal(value.backgroundName.length,160)
  assert.equal(normalizeBackground({backgroundOpacity:NaN,backgroundBlur:Infinity}).backgroundOpacity,45)
})
test('media type comes from file bytes rather than the extension or supplied MIME',()=>{
  const bytes=value=>new Uint8Array(Buffer.from(value,'binary'))
  for(const [content,type]of[['\xff\xd8\xff\xe0','image/jpeg'],['\x89PNG\r\n\x1a\n','image/png'],['GIF89a','image/gif'],['RIFF0000WEBP','image/webp'],['0000ftypisom','video/mp4'],['\x1a\x45\xdf\xa3','video/webm']])assert.equal(backgroundMediaType(bytes(content)),type)
  assert.equal(backgroundMediaType(bytes('<svg onload="alert(1)">')),null)
  assert.equal(backgroundMediaType(bytes('not an image.jpg')),null)
})

test('theme selections preserve independent HTML, disabled choices and per-theme undo without storing HTML source',()=>{
  const first=backgroundThemeSelection({},'dark',{revision:'night',name:'夜间 HTML'})
  const second=backgroundThemeSelection(first,'light',{revision:'day',name:'日间 HTML'})
  assert.equal(themeBackground(second,'dark').backgroundRevision,'night')
  assert.equal(themeBackground(second,'light').backgroundRevision,'day')
  const third=backgroundThemeSelection(second,'dark',{revision:'night-2',name:'另一份夜间 HTML'})
  assert.equal(third.backgroundThemes.dark.previousRevision,'night')
  assert.equal(third.backgroundThemes.light.previousRevision,'')
  const disabled={...third,backgroundThemes:{...third.backgroundThemes,dark:{...third.backgroundThemes.dark,backgroundEnabled:false,source:'<script>private()</script>'}}}
  assert.equal(themeBackground(disabled,'dark').backgroundEnabled,false)
  assert.equal(themeBackground(disabled,'light').backgroundEnabled,true)
  assert.equal(JSON.stringify(normalizeBackground(disabled)).includes('private'),false)
  const cleared=backgroundThemeSelection(third,'dark',null)
  assert.equal(themeBackground(cleared,'dark').backgroundRevision,'')
  assert.equal(themeBackground(cleared,'light').backgroundRevision,'day')
})

test('legacy HTML belongs only to its current theme while legacy pictures remain available to both palettes',()=>{
  const legacy={backgroundEnabled:true,backgroundRevision:'old',backgroundName:'旧背景'}
  const html=backgroundThemeSelection(legacy,'dark',{revision:'old',name:'旧背景'},{legacyKind:'html',previousRevision:'older'})
  assert.equal(themeBackground(html,'light').backgroundRevision,'')
  assert.equal(themeBackground(html,'dark').backgroundRevision,'old')
  assert.equal(html.backgroundThemes.dark.previousRevision,'older')
  const disabled=backgroundThemeSelection({...legacy,backgroundEnabled:false},'dark',{revision:'old',name:'旧背景'},{legacyKind:'html',enabled:false})
  assert.equal(themeBackground(disabled,'dark').backgroundEnabled,false)
  assert.equal(themeBackground(disabled,'dark').backgroundRevision,'old')
  const image=backgroundThemeSelection(legacy,'light',{revision:'new',name:'新背景'},{legacyKind:'image'})
  assert.equal(themeBackground(image,'dark').backgroundRevision,'old')
  assert.equal(themeBackground(image,'light').backgroundRevision,'new')
})
