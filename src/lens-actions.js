import {GlassRenderer} from '../vendor/lens/internal/renderer.js'
export {normalizeRunningAnimation} from './running-animation-config.js'
export {createRunningPacks} from './running-packs.js'
export {createRunningAnimations,runningAnimationCss} from './running-animation.js'
export {createRunningSettings,runningSettingsCss} from './running-animation-settings.js'
export {settingsControlsCss} from './settings-controls.js'
export {createSettingsReset,settingsResetCss} from './settings-reset.js'
export {createSettingsTransfer,createSettingsTransferUI,settingsTransferCss} from './settings-transfer.js'
export {createFullBackground,normalizeBackground,fullBackgroundCss} from './full-background.js'
export {createBackgroundSettings,backgroundSettingsCss} from './background-settings.js'
export {observeReadingTurn} from './reading-turn.js'
export {createContextParticles,normalizeParticles,contextParticlesCss} from './context-particles.js'
export {createParticleSettings,particleSettingsCss} from './context-particle-settings.js'
export {createSidebarGlass} from './sidebar-glass.js'
export {glassSurfacesCss} from './glass-surfaces.js'
export {createSidebarOverlay,sidebarOverlayCss} from './sidebar-overlay.js'
export {createSidebarAttention,sidebarAttentionCss} from './sidebar-attention.js'
export {createConversationWidth,conversationWidthMode} from './conversation-width.js'
export {createHeaderLayout,headerLayoutCss,headerProjectLabel} from './header-layout.js'
export {createThemeToggle,themeToggleCss} from './theme-toggle.js'
export {createUnifiedIcons,createWelcomeToolbar,createIconSettings,unifiedIconsCss,normalizeIconStyle} from './unified-icons.js'
export {createFocusMode,focusModeCss} from './focus-mode.js'
export {createFullscreenControls,fullscreenControlsCss} from './fullscreen-controls.js'
export {createComposerSlots,composerSlotsCss} from './composer-slots.js'
export {createComposerScrollMotion} from './composer-scroll-motion.js'
export {createComposerPlacementMotion} from './composer-placement-motion.js'
export {createStartupMotion} from './startup-motion.js'
export {normalizeWelcome} from './welcome-font.js'
export {createWelcomeSettings,welcomeSettingsCss} from './welcome-settings.js'
export {createWelcomeMediaStore} from './welcome-media.js'
export {createWelcomeCodeStore,welcomeCodeReferences} from './welcome-code.js'
export {cacheOpeningAppearance} from './opening-appearance.js'
export {createSessionMotion} from './session-motion.js'
export {normalizeThemedWelcome,themeWelcome,patchWelcomeTheme,welcomeTheme} from './welcome-theme.js'
export {createSettingsTabs,settingsTabsCss} from './settings-tabs.js'
export {createToolbarLayout,createToolbarSettings,normalizeToolbar,toolbarSettingsCss} from './toolbar-settings.js'
export {createConversationTabs,conversationTabsCss} from './conversation-tabs.js'
export {createTurnCards,turnCardsCss,normalizeTurnCards,createTurnCardSettings} from './turn-cards.js'
export {createUserBubbles,normalizeUserBubbles,createUserBubbleSettings,userBubbleSettingsCss} from './user-bubbles.js'
export {createScopeSwitch,scopeSwitchCss} from './scope-switch.js'
export {createOutputPreviewBridge,createOutputArtifact,outputPreviewReader,outputPreviewCss,isHtmlOutput} from './output-preview.js'
export {createOutputViewer,outputContentReader,outputViewerCss} from './output-viewer.js'
export {createStatPopoverMotion,statPopoverCss} from './stat-popover-motion.js'
export {motion} from './motion.js'
export {messageImageLayoutCss} from './message-image-layout.js'
export {summaryEntryState,summaryEventStatus,createSummaryEntryStatus,summaryEntryCss} from './summary-entry-status.js'
export {createChatDisclosureMotion} from './chat-disclosure-motion.js'
export {createStreamReveal,createStreamRevealSettings,normalizeStreamReveal,streamRevealSettingsCss} from './stream-reveal.js'
export {createProgressLiquid, progressRollEase} from './progress-liquid.js'
export {affectsPresentation, affectsScroll} from './presentation-observer.js'
export {applyPresentationOnce} from './presentation-owner.js'

const MARK='data-dcb-composer-action',CANVAS='data-dcb-lens-canvas'

// One bounded GPU scene per visible input row, shared by its small buttons.
// The center remains the real browser backdrop. Only the rim uses Lens pixels;
// no chat text, draft, image, screenshot or remote resource enters the scene.
export function createLensActions(doc,win) {
  const groups=new Map(),forced=win.matchMedia('(forced-colors: active)')
  let disposed=false,lastActions=[]
  const visible=el=>el.isConnected&&el.getClientRects().length&&win.getComputedStyle(el).visibility!=='hidden'
  const assign=(el,key,value)=>{if(el.style[key]!==value)el.style[key]=value}
  const rgba=value=>{const n=value.match(/[\d.]+/g)?.map(Number);return n?.length>=3?[n[0],n[1],n[2],n[3]??1]:[0,0,0,0]}
  function backdrop(button) {
    const r=button.getBoundingClientRect(),layers=doc.elementsFromPoint(r.left+r.width/2,r.top+r.height/2)
    let color=doc.body.hasAttribute('data-ds-dark-theme')?[24,28,36]:[247,248,250]
    for(const el of layers.reverse()){
      if(el===button||button.contains(el)||el.hasAttribute(CANVAS)||el.closest('[data-dcb-lens-stage]'))continue
      const c=rgba(win.getComputedStyle(el).backgroundColor)
      color=color.map((v,i)=>v*(1-c[3])+c[i]*c[3])
    }
    return color
  }
  function destroy(group) {
    group.destroyed=true;win.cancelAnimationFrame(group.frame);group.resize.disconnect();group.state.disconnect()
    group.composer.removeEventListener('pointermove',group.pointer)
    group.composer.removeEventListener('pointerdown',group.press)
    group.renderer.destroy();group.stage.remove()
    for(const [button,tile] of group.tiles){tile.remove();button.removeAttribute('data-dcb-lens-ready')}
  }
  function create(composer) {
    const stage=doc.createElement('div'),canvas=doc.createElement('canvas')
    stage.setAttribute('data-dcb-lens-stage','');stage.setAttribute('aria-hidden','true');stage.append(canvas);doc.body.append(stage)
    const group={composer,stage,canvas,tiles:new Map(),buttons:[],frame:0,destroyed:false,colors:[]}
    const artwork=(ctx,{width,height,dpr})=>{
      const dark=doc.body.hasAttribute('data-ds-dark-theme'),box=stage.getBoundingClientRect()
      ctx.fillStyle=dark?'#181c24':'#f7f8fa';ctx.fillRect(0,0,width,height)
      for(const {rect,color} of group.colors){
        // A local tint source for the optical rim, never an invented texture.
        ctx.fillStyle=`rgb(${color.join(',')})`;ctx.fillRect((rect.left-box.left-24)*dpr,0,(rect.width+48)*dpr,height)
      }
    }
    group.renderer=new GlassRenderer(canvas,stage,{scene:'grid',artwork,motion:false,brightness:1,refraction:.65,blur:.06,dispersion:.35})
    group.renderer.readGeometry=()=>{
      const origin=stage.getBoundingClientRect(),s=group.renderer.dpr
      group.renderer.geometry=group.buttons.filter(visible).map(el=>{
        const r=el.getBoundingClientRect(),cs=win.getComputedStyle(el)
        return {el,kind:'free',opacity:1,selected:0,x:(r.left-origin.left)*s,y:(origin.bottom-r.bottom)*s,w:r.width*s,h:r.height*s,r:Math.min(parseFloat(cs.borderTopLeftRadius)||r.width/2,r.width/2,r.height/2)*s,localW:r.width*s,localH:r.height*s,inverse:[1,0,0,1],clip:{left:0,bottom:0,right:origin.width*s,top:origin.height*s}}
      });group.renderer.rectDirty=false
    }
    const render=group.renderer.render.bind(group.renderer)
    group.renderer.render=now=>{
      render(now);if(canvas.dataset.gpuState!=='active')return
      const origin=stage.getBoundingClientRect(),s=group.renderer.dpr
      for(const [button,tile] of group.tiles){
        if(!visible(button))continue
        const r=button.getBoundingClientRect(),w=Math.max(1,Math.round(r.width*s)),h=Math.max(1,Math.round(r.height*s))
        if(tile.width!==w||tile.height!==h){tile.width=w;tile.height=h}
        const ctx=tile.getContext('2d');ctx.clearRect(0,0,w,h)
        ctx.drawImage(canvas,(r.left-origin.left)*s,(r.top-origin.top)*s,r.width*s,r.height*s,0,0,w,h)
        if(!button.hasAttribute('data-dcb-lens-ready'))button.setAttribute('data-dcb-lens-ready','')
      }
    }
    group.pointer=event=>{const r=stage.getBoundingClientRect(),s=group.renderer.dpr;group.renderer.pointer={x:(event.clientX-r.left)*s,y:(r.bottom-event.clientY)*s};group.renderer.invalidate(180,false)}
    group.press=()=>group.renderer.invalidate(180,false)
    composer.addEventListener('pointermove',group.pointer,{passive:true});composer.addEventListener('pointerdown',group.press,{passive:true})
    group.resize=new win.ResizeObserver(()=>schedule(group));group.resize.observe(composer)
    group.state=new win.MutationObserver(()=>{if(canvas.dataset.gpuState!=='active')for(const button of group.tiles.keys())button.removeAttribute('data-dcb-lens-ready')})
    group.state.observe(canvas,{attributes:true,attributeFilter:['data-gpu-state']})
    return group
  }
  function refresh(group) {
    group.frame=0;if(disposed||group.destroyed)return
    const buttons=group.buttons.filter(visible)
    if(!buttons.length)return
    const rects=buttons.map(button=>button.getBoundingClientRect()),pad=10
    const left=Math.max(0,Math.min(...rects.map(r=>r.left))-pad),top=Math.max(0,Math.min(...rects.map(r=>r.top))-pad)
    const right=Math.min(win.innerWidth,Math.max(...rects.map(r=>r.right))+pad),bottom=Math.min(win.innerHeight,Math.max(...rects.map(r=>r.bottom))+pad)
    const bounds={left,top,width:Math.max(1,right-left),height:Math.max(1,bottom-top)}
    const geometryKey=[win.devicePixelRatio,...Object.values(bounds),...rects.flatMap(r=>[r.left,r.top,r.width,r.height])].join(':')
    const colors=buttons.map((button,i)=>({rect:rects[i],color:backdrop(button)}))
    // The sampled tint is local to the button row. Moving the row as a whole
    // changes geometry, but does not require a new artwork canvas or texture.
    const artworkKey=[doc.body.hasAttribute('data-ds-dark-theme'),bounds.width,bounds.height,win.devicePixelRatio,
      ...colors.flatMap(({rect,color})=>[rect.left-left,rect.width,...color])].join(':')
    const geometryChanged=group.geometryKey!==geometryKey,artworkChanged=group.artworkKey!==artworkKey
    group.colors=colors
    if(!geometryChanged&&!artworkChanged&&!group.buttonsChanged)return
    for(const [key,value] of Object.entries(bounds))assign(group.stage,key,`${value}px`)
    const width=group.renderer.width,height=group.renderer.height
    group.renderer.resize()
    // resize() already uploads artwork when the raster size changes.
    if(artworkChanged&&width===group.renderer.width&&height===group.renderer.height)group.renderer.setScene('grid')
    group.geometryKey=geometryKey;group.artworkKey=artworkKey;group.buttonsChanged=false
    group.renderer.invalidate()
  }
  function schedule(group){if(!group.frame&&!group.destroyed)group.frame=win.requestAnimationFrame(()=>refresh(group))}
  function sync(actions) {
    if(disposed)return
    lastActions=[...actions]
    const wanted=new Map()
    if(!forced.matches)for(const button of lastActions){const composer=button.closest('[data-composer-card]');if(composer&&visible(button)){if(!wanted.has(composer))wanted.set(composer,[]);wanted.get(composer).push(button)}}
    for(const [composer,group] of groups)if(!wanted.has(composer)){destroy(group);groups.delete(composer)}
    for(const [composer,buttons] of wanted){
      let group=groups.get(composer);if(!group){group=create(composer);groups.set(composer,group)}
      group.buttonsChanged=group.buttonsChanged||group.buttons.length!==buttons.length||group.buttons.some((button,i)=>button!==buttons[i])
      group.buttons=buttons
      for(const [button,tile] of group.tiles)if(!buttons.includes(button)){tile.remove();button.removeAttribute('data-dcb-lens-ready');group.tiles.delete(button)}
      for(const button of buttons){
        let tile=group.tiles.get(button)
        if(!tile){tile=doc.createElement('canvas');tile.setAttribute(CANVAS,'');tile.setAttribute('aria-hidden','true');group.tiles.set(button,tile)}
        if(tile.parentElement!==button)button.prepend(tile)
      }
      schedule(group)
    }
  }
  const onForced=()=>sync(lastActions);forced.addEventListener('change',onForced)
  return {sync,dispose(){disposed=true;forced.removeEventListener('change',onForced);for(const group of groups.values())destroy(group);groups.clear()}}
}
