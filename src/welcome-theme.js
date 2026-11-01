import {normalizeWelcome,welcomeDefaults} from './welcome-font.js'
import {patchWelcomeCode} from './welcome-code-modes.js'

const keys=Object.keys(welcomeDefaults),scheme=value=>value==='dark'?'dark':'light'
export const welcomeTheme=doc=>doc.body.hasAttribute('data-ds-dark-theme')?'dark':'light'
export function normalizeThemedWelcome(value){
  const base=normalizeWelcome(value),themes=value?.welcomeThemes
  return {...base,welcomeThemes:themes&&typeof themes==='object'&&!Array.isArray(themes)?{
    light:normalizeWelcome({...base,...themes.light,welcomeCodeModes:themes.light?.welcomeCodeModes??null}),dark:normalizeWelcome({...base,...themes.dark,welcomeCodeModes:themes.dark?.welcomeCodeModes??null}),
  }:null}
}
export function themeWelcome(value,theme){
  const normalized=normalizeThemedWelcome(value)
  return {...value,...normalized,...normalized.welcomeThemes?.[scheme(theme)]}
}
export function removeWelcomeCodeReferences(value,revisions,theme='light'){
  const removed=new Set(revisions)
  const clear=config=>{
    const next=normalizeWelcome(config),modes=Object.fromEntries(Object.entries(next.welcomeCodeModes).map(([mode,item])=>[mode,removed.has(item.revision)?{revision:'',name:''}:item]))
    return normalizeWelcome({...next,welcomeCodeModes:modes,...(removed.has(next.welcomeCodeRevision)?{welcomeCodeRevision:'',welcomeCodeName:'',welcomeMode:next.welcomeMode==='code'?'characters':next.welcomeMode}:{})})
  }
  return {...clear(themeWelcome(value,theme)),welcomeThemes:Object.fromEntries(['light','dark'].map(scheme=>[scheme,clear(themeWelcome(value,scheme))]))}
}
export function patchWelcomeTheme(value,patch,theme){
  if(!keys.some(key=>Object.hasOwn(patch,key)))return patch
  const normalized=normalizeThemedWelcome(value),base=normalizeWelcome(normalized)
  const themes=normalized.welcomeThemes||{light:base,dark:base},target=scheme(theme)
  const changed=Object.fromEntries(keys.filter(key=>Object.hasOwn(patch,key)).map(key=>[key,patch[key]]))
  return {...patch,welcomeThemes:{...themes,[target]:normalizeWelcome({...themes[target],...changed,...patchWelcomeCode(themes[target],changed)})}}
}
