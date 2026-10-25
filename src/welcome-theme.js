import {normalizeWelcome,welcomeDefaults} from './welcome-font.js'

const keys=Object.keys(welcomeDefaults),scheme=value=>value==='dark'?'dark':'light'
export const welcomeTheme=doc=>doc.body.hasAttribute('data-ds-dark-theme')?'dark':'light'
export function normalizeThemedWelcome(value){
  const base=normalizeWelcome(value),themes=value?.welcomeThemes
  return {...base,welcomeThemes:themes&&typeof themes==='object'&&!Array.isArray(themes)?{
    light:normalizeWelcome({...base,...themes.light}),dark:normalizeWelcome({...base,...themes.dark}),
  }:null}
}
export function themeWelcome(value,theme){
  const normalized=normalizeThemedWelcome(value)
  return {...value,...normalized,...normalized.welcomeThemes?.[scheme(theme)]}
}
export function patchWelcomeTheme(value,patch,theme){
  if(!keys.some(key=>Object.hasOwn(patch,key)))return patch
  const normalized=normalizeThemedWelcome(value),base=normalizeWelcome(normalized)
  const themes=normalized.welcomeThemes||{light:base,dark:base},target=scheme(theme)
  const changed=Object.fromEntries(keys.filter(key=>Object.hasOwn(patch,key)).map(key=>[key,patch[key]]))
  return {...patch,welcomeThemes:{...themes,[target]:normalizeWelcome({...themes[target],...changed})}}
}
