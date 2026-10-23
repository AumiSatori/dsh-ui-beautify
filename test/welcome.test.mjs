import {test} from 'node:test'
import assert from 'node:assert/strict'
import {normalizeWelcome,traceInk,welcomeDefaults} from '../src/welcome-font.js'
import {welcomeMediaType} from '../src/welcome-media.js'

test('welcome preferences preserve explicit off and bound untrusted text, font names and playback time',()=>{
  assert.deepEqual(normalizeWelcome(null),{...welcomeDefaults})
  assert.deepEqual(normalizeWelcome({welcomeEnabled:false,welcomeText:'  你好\n世界 ',welcomeFont:' KaiTi ',welcomeDuration:100}),{...welcomeDefaults,welcomeEnabled:false,welcomeText:'你好 世界',welcomeFont:'KaiTi',welcomeDuration:900})
  assert.equal([...normalizeWelcome({welcomeText:'🙂'.repeat(40)}).welcomeText].length,32)
  assert.equal(normalizeWelcome({welcomeText:'DeepSeek Harness'}).welcomeText,'DeepSeek Harness')
  assert.equal(normalizeWelcome({welcomeText:'\0  ',welcomeFont:[],welcomeDuration:Infinity}).welcomeText,'欢迎回来')
  assert.equal(normalizeWelcome({welcomeDuration:999999}).welcomeDuration,4000)
  assert.equal(normalizeWelcome({welcomeEnabled:'false'}).welcomeEnabled,true)
  const media=normalizeWelcome({welcomeLogo:false,welcomeMode:'media',welcomeMediaFit:'cover',welcomeMediaDuration:999999,welcomeMediaRevision:'abc',welcomeMedia:'data:video/mp4;base64,private'})
  assert.equal(media.welcomeLogo,false);assert.equal(media.welcomeMode,'media');assert.equal(media.welcomeMediaFit,'cover');assert.equal(media.welcomeMediaDuration,10000);assert.equal('welcomeMedia' in media,false)
  assert.equal(normalizeWelcome({welcomeMode:'remote',welcomeMediaFit:'stretch',welcomeMediaDuration:NaN}).welcomeMode,'text')
})
test('media detection rejects markup, renamed SVG and truncated raster headers',()=>{
  const bytes=text=>Uint8Array.from(Buffer.from(text))
  assert.equal(welcomeMediaType(bytes('<svg><script>alert(1)</script></svg>')),null)
  assert.equal(welcomeMediaType(bytes('GIF89a')),null)
  assert.equal(welcomeMediaType(bytes('GIF89a\x20\0\x20\0')), 'image/gif')
  assert.equal(welcomeMediaType(bytes('\x00\x00\x00\x18ftypisom')), 'video/mp4')
  assert.equal(welcomeMediaType(Uint8Array.from([137,80,78,71])),null)
})
test('bounded pen tracing follows a cross without inventing pixels and tolerates blank glyphs',()=>{
  const width=32,height=32,alpha=new Uint8Array(width*height)
  for(let y=4;y<28;y++)for(let x=4;x<28;x++)if(Math.abs(y-16)<3||Math.abs(x-16)<3)alpha[y*width+x]=255
  const paths=traceInk(alpha,width,height)
  assert.ok(paths.length>0&&paths.length<=48)
  for(const path of paths)for(const [x,y]of path.points)assert.ok(alpha[Math.floor(y)*width+Math.floor(x)]>0)
  assert.deepEqual(traceInk(new Uint8Array(width*height),width,height),[])
})
