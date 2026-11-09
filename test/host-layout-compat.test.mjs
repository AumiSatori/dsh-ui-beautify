import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import test from 'node:test'
import {nativeSidebarWidth} from '../src/host-sidebar-width.js'
import {createSidebarOverlay,sidebarOverlayCss} from '../src/sidebar-overlay.js'
import {createConversationWidth} from '../src/conversation-width.js'
import {overlaySidebarCover} from '../src/header-layout.js'
import {turnCardsCss} from '../src/turn-cards.js'
import {splitClientArtifact} from '../scripts/client-artifact.mjs'

// Minimal elements for the two native layouts. 0.2.1 sizes the sidebar slot root
// inline; 0.2.2 renders it as display:contents and publishes the width on the frame.
function style(initial={}){
  const values=new Map(Object.entries(initial)),priorities=new Map()
  return {
    get width(){return values.get('width')||''},
    get gridTemplateColumns(){return values.get('grid-template-columns')||''},
    getPropertyValue:key=>values.get(key)||'',
    getPropertyPriority:key=>priorities.get(key)||'',
    setProperty(key,value,priority=''){values.set(key,String(value));priorities.set(key,priority)},
    removeProperty(key){values.delete(key);priorities.delete(key)},
  }
}
function element(kind,{css={},rect={},attrs={},children=[]}={}){
  const attributes=new Map(Object.entries(attrs)),node={
    kind,children,style:style(css),dataset:{},parentElement:null,isConnected:true,
    get firstElementChild(){return children[0]||null},
    getAttribute:name=>attributes.has(name)?attributes.get(name):null,
    setAttribute(name,value){attributes.set(name,String(value))},
    removeAttribute(name){attributes.delete(name)},
    hasAttribute:name=>attributes.has(name),
    toggleAttribute(name,force){force?attributes.set(name,''):attributes.delete(name);return !!force},
    matches:selector=>selector.includes(`_${kind}"`),
    closest:()=>null,
    getBoundingClientRect:()=>({left:0,top:0,right:rect.width||0,bottom:0,width:0,height:0,...rect}),
    getClientRects:()=>rect.width?[rect]:[],
  }
  for(const child of children)child.parentElement=node
  return node
}
function windowFixture(observers=[]){
  return {
    MutationObserver:class{constructor(callback){this.callback=callback;this.targets=[];observers.push(this)}observe(target,options){this.targets.push([target,options])}disconnect(){this.targets=[]}},
    ResizeObserver:class{observe(){}unobserve(){}disconnect(){}},
    getComputedStyle:()=>({paddingTop:'40px'}),
  }
}
function layout({root,frameCss={},collapsed=false}){
  const left=element('sidebarCol',{children:[root]}),center=element('centerCol')
  const frame=element('frame',{css:frameCss,attrs:collapsed?{'data-sidebar-collapsed':'true'}:{},children:[left,center]})
  const doc={documentElement:element('html',{attrs:{'data-windows-titlebar':''}}),querySelectorAll:selector=>selector.includes('_frame"')?[frame]:[]}
  return {frame,doc}
}

test('native sidebar width reads both host layouts', () => {
  const legacyRoot=element('sidebarRoot',{css:{width:'312px'},rect:{width:312}})
  assert.equal(nativeSidebarWidth(element('frame'),legacyRoot),312)
  const contentsRoot=element('sidebarRoot')
  assert.equal(nativeSidebarWidth(element('frame',{css:{'--dsh-windows-sidebar-width':'360px'}}),contentsRoot),360)
  // A published zero (collapsed column) falls back instead of hiding the drawer.
  assert.equal(nativeSidebarWidth(element('frame',{css:{'--dsh-windows-sidebar-width':'0px'}}),legacyRoot),312)
  // Web profiles have no titlebar variable; the inline first track still carries
  // the native column width (observed on DSH 0.2.1-rc.5 with a contents root).
  const webFrame=element('frame',{css:{'grid-template-columns':'332px minmax(0px, 1fr) minmax(0px, 0px)'}})
  assert.equal(nativeSidebarWidth(webFrame,contentsRoot),332)
  assert.equal(nativeSidebarWidth(element('frame',{css:{'grid-template-columns':'minmax(0px, 1fr)'}}),legacyRoot),312)
  assert.equal(nativeSidebarWidth(element('frame'),contentsRoot),null)
  assert.equal(nativeSidebarWidth(null,null),null)
})

test('overlay drawer follows the legacy inline root width', () => {
  const {frame,doc}=layout({root:element('sidebarRoot',{css:{width:'300px'},rect:{width:300}})})
  const overlay=createSidebarOverlay(doc,windowFixture())
  overlay.sync(true)
  assert.equal(frame.style.getPropertyValue('--dcb-overlay-left-width'),'300px')
  assert.equal(frame.style.getPropertyValue('--dcb-overlay-rail'),'0px')
  overlay.dispose()
  assert.equal(frame.style.getPropertyValue('--dcb-overlay-left-width'),'')
})

test('overlay drawer follows the published width of a display:contents root while dragging', () => {
  const observers=[],{frame,doc}=layout({root:element('sidebarRoot'),frameCss:{'--dsh-windows-sidebar-width':'360px'}})
  const overlay=createSidebarOverlay(doc,windowFixture(observers),()=>{})
  overlay.sync(true)
  assert.equal(frame.style.getPropertyValue('--dcb-overlay-left-width'),'360px')
  // The host republishes the frame style on each pointer move; the drawer must
  // retarget at once instead of staying at the 280px fallback.
  frame.style.setProperty('--dsh-windows-sidebar-width','428px')
  observers[0].callback([{type:'attributes',target:frame,attributeName:'style'}])
  assert.equal(frame.style.getPropertyValue('--dcb-overlay-left-width'),'428px')
  overlay.dispose()
})

test('collapsed overlay keeps the rail width on both layouts', () => {
  for(const root of [element('sidebarRoot',{css:{width:'300px'}}),element('sidebarRoot')]){
    const {frame,doc}=layout({root,frameCss:{'--dsh-windows-sidebar-width':'360px'},collapsed:true})
    const overlay=createSidebarOverlay(doc,windowFixture())
    overlay.sync(true)
    assert.equal(frame.style.getPropertyValue('--dcb-overlay-left-width'),'0px')
    overlay.dispose()
  }
})

test('titlebar menu holder rule only targets hosts that render it under the overlay', () => {
  assert.match(sidebarOverlayCss,/:root\[data-windows-titlebar\]:has\(\[data-dcb-sidebar-overlay\]\) \[data-windows-menu\] \{[^}]*width:320px!important/)
})

test('open overlay sidebar pushes header content past its edge', () => {
  const shell={style:style({'--dcb-overlay-left-width':'440px'}),getBoundingClientRect:()=>({left:0})}
  const header={closest:selector=>selector.includes('[data-dcb-sidebar-overlay]')?shell:null}
  assert.equal(overlaySidebarCover(header,{left:0}),440)
  assert.equal(overlaySidebarCover(header,{left:500}),0)
  assert.equal(overlaySidebarCover({closest:()=>null},{left:0}),0)
})

test('wide tables stay inside finite turn cards and keep the native line layout', () => {
  const rule=turnCardsCss.match(/([^\n{}]*\.md-table-wide) \{([^}]*)\}/)
  assert.ok(rule,'wide table rule')
  assert.match(rule[1],/:not\(\[data-dcb-turn-surface="line"\]\)/)
  for(const declaration of ['--dsh-table-spare:0px!important','--dsh-table-lead:0px!important','margin-left:0!important','overflow-x:auto!important'])assert.ok(rule[2].includes(declaration),declaration)
})

test('conversation width mirrors the drag value into the native key', () => {
  const storage=new Map([['dsh.conversation.contentWidth','900']]),writes=[]
  const handle={closest:selector=>selector==='[data-width-handle]'?handle:selector==='[data-conversation-content]'?body:null}
  const root={style:style({'--dsh-chat-user-width':'900px'})}
  const body={
    ...element('conversationContent',{rect:{width:1400}}),parentElement:root,offsetWidth:1400,
    querySelectorAll:selector=>selector==='[data-width-handle]'?[handle]:[],
    closest:selector=>selector.includes('_centerCol')?{}:null,
  }
  root.style.setProperty('--dsh-chat-user-width','900px')
  const listeners=new Map(),win={
    ...windowFixture(),
    localStorage:{getItem:key=>storage.has(key)?storage.get(key):null,setItem(key,value){storage.set(key,value);writes.push([key,value])},removeItem:key=>storage.delete(key)},
    matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),
    requestAnimationFrame:()=>1,cancelAnimationFrame(){},queueMicrotask:callback=>callback(),
    addEventListener(){},removeEventListener(){},screen:{availWidth:0,availHeight:0},
  }
  const doc={
    documentElement:element('html'),fullscreenElement:null,
    querySelectorAll:selector=>selector==='[data-conversation-content]'?[body]:[],
    addEventListener:(type,listener)=>listeners.set(type,listener),removeEventListener(){},
  }
  const width=createConversationWidth(doc,win)
  width.sync()
  listeners.get('pointerdown')({button:0,target:handle,clientX:10,pointerId:1})
  // The native control narrows the column; content reflow then republishes
  // the user width from storage, which must already hold the drag value.
  root.style.setProperty('--dsh-chat-user-width','650px')
  listeners.get('pointermove')({pointerId:1,clientX:-240})
  width.sync()
  assert.equal(storage.get('dsh.conversation.contentWidth'),'650')
  assert.equal(body.style.getPropertyValue('--dsh-chat-content-width'),'650px')
  width.dispose()
})

test('sidebar drags take the light sync path and settle afterwards', () => {
  const {prefix,suffix}=splitClientArtifact(readFileSync(new URL('../client.js',import.meta.url),'utf8')),outer=prefix+suffix
  const body=outer.slice(outer.indexOf('      function sync() {'),outer.indexOf('        headerLayout.sync(settings.headerCentered)\n        heroGreeting.sync'))
  assert.match(body,/\[data-dragging\]/)
  assert.match(body,/dragSettle = setTimeout\(schedule, 120\)/)
  assert.ok(body.indexOf('return\n')<body.indexOf('fullscreenControls.sync()'),'heavy modules wait for the drag to settle')
  assert.match(outer,/clearTimeout\(dragSettle\)\n        window\.removeEventListener\('resize', schedule\)/)
})

test('custom user bubbles cover answered question replies and keep the older hosts', () => {
  const source=readFileSync(new URL('../src/user-bubbles.js',import.meta.url),'utf8')
  const native=/const NATIVE='([^']+)'/.exec(source)?.[1]
  assert.ok(native,'native bubble scope')
  // 0.2.2 answered questions reuse the user surface under [data-question-reply].
  for(const owner of ['[data-chat-flow-kind="user"]','[data-chat-flow-kind="steering"]','[data-submission-echo]','[data-pending-steering]','[data-question-reply]'])assert.ok(native.includes(owner),owner)
  // Both the public marker (0.2.2) and the module class (0.2.1) select the bubble.
  for(const bubble of ['[data-message-bubble]','[class$="_bubble"]'])assert.ok(native.includes(bubble),bubble)
})
