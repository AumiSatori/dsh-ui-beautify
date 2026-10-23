import {test} from 'node:test'
import assert from 'node:assert/strict'
import {normalizeBackground,backgroundMediaType} from '../src/background-media.js'

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
