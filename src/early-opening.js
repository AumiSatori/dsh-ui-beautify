import {createStartupMotion} from './startup-motion.js'
import {createWelcomeCodeStore} from './welcome-code.js'
import {createWelcomeMediaStore} from './welcome-media.js'
import {themeWelcome} from './welcome-theme.js'

const THEME='dsh-ui-beautify:opening-theme:v1',LOGO='dsh-ui-beautify:opening-logo:v1',FLAG='data-dcb-early-opening'
export function cacheOpeningAppearance(doc,win,logo){
  try{
    win.localStorage.setItem(THEME,doc.body.hasAttribute('data-ds-dark-theme')?'dark':'light')
    if(logo){const svg=logo.node?.matches('svg')?logo.node:logo.node?.querySelector('svg'),path=svg?.querySelector('path');if(path)win.localStorage.setItem(LOGO,JSON.stringify({viewBox:svg.getAttribute('viewBox'),path:path.getAttribute('d')}))}
  }catch{}
}
export function startEarlyOpening(doc,win){
  let stored
  try{stored=JSON.parse(win.localStorage.getItem('dsh-ui-beautify:settings:v1'))}catch{return null}
  if(!stored||win[Symbol.for('dsh-ui-beautify.startup-motion.v1')])return null
  const theme=doc.body.hasAttribute('data-ds-dark-theme')?'dark':win.localStorage.getItem(THEME)||(win.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')
  const settings=themeWelcome(stored,theme)
  if(!settings.welcomeEnabled||win.matchMedia('(prefers-reduced-motion: reduce), (forced-colors: active)').matches)return null
  if(theme==='dark')doc.body.setAttribute('data-ds-dark-theme','')
  const codeStore=createWelcomeCodeStore(win),mediaStore=createWelcomeMediaStore(win),previous=doc.body.getAttribute(FLAG),style=doc.createElement('style')
  style.textContent=`body[${FLAG}] [data-dsh-boot]:has([data-dsh-boot-spinner]){visibility:hidden!important}`
  doc.head.append(style);doc.body.setAttribute(FLAG,'')
  let controller,observer,seenBoot=false,closed=false
  const release=()=>{if(closed)return;closed=true;observer?.disconnect();style.remove();codeStore.dispose();mediaStore.dispose();if(previous===null)doc.body.removeAttribute(FLAG);else doc.body.setAttribute(FLAG,previous)}
  const createLogo=()=>{
    try{const saved=JSON.parse(win.localStorage.getItem(LOGO)),ns='http://www.w3.org/2000/svg';if(!saved?.path||!/^[-\d.\s]+$/.test(saved.viewBox||''))return null
      const node=doc.createElementNS(ns,'svg'),path=doc.createElementNS(ns,'path');node.setAttribute('viewBox',saved.viewBox);path.setAttribute('d',saved.path);path.setAttribute('fill','currentColor');node.append(path);return{node,dispose(){node.remove()}}
    }catch{return null}
  }
  try{controller=createStartupMotion(doc,win,settings,{codeStore,mediaStore,createLogo,canReveal:()=>controller?.adopted===true,onFinish:release})}catch{release();return null}
  if(closed)return controller
  observer=new win.MutationObserver(()=>{
    const boot=doc.querySelector('[data-dsh-boot]')
    if(boot){seenBoot=true;if(!boot.querySelector('[data-dsh-boot-spinner]'))controller.dispose()}
    else if(seenBoot&&!controller.adopted)controller.dispose()
  })
  observer.observe(doc.body,{childList:true,subtree:true})
  win[Symbol.for('dsh-ui-beautify.early-opening.v1')]=controller
  return controller
}
