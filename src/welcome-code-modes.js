const record=value=>value&&typeof value==='object'&&!Array.isArray(value)
const clean=(value,max)=>typeof value==='string'?[...value.replace(/[\u0000-\u001f\u007f]/g,' ').trim()].slice(0,max).join(''):''
const selection=value=>({revision:clean(value?.revision,80),name:clean(value?.name,160)})
export const welcomeCodeMode=value=>value?.welcomeCodeInteractive===true?'interactive':'timed'

// Settings hold references only. Existing shared code belongs to the mode
// that was selected before upgrading; the other mode starts empty.
export function normalizeWelcomeCode(value){
  const mode=welcomeCodeMode(value),stored=value?.welcomeCodeModes
  const modes=record(stored)?{timed:selection(stored.timed),interactive:selection(stored.interactive)}:{timed:selection(null),interactive:selection(null)}
  if(!record(stored))modes[mode]=selection({revision:value?.welcomeCodeRevision,name:value?.welcomeCodeName})
  return {welcomeCodeInteractive:mode==='interactive',welcomeCodeModes:modes,welcomeCodeRevision:modes[mode].revision,welcomeCodeName:modes[mode].name}
}

export function patchWelcomeCode(value,patch){
  const previous=normalizeWelcomeCode(value),mode=welcomeCodeMode({...previous,...patch})
  const modes=Object.hasOwn(patch,'welcomeCodeModes')?normalizeWelcomeCode({...previous,...patch}).welcomeCodeModes:previous.welcomeCodeModes
  const selected={...modes[mode]}
  if(Object.hasOwn(patch,'welcomeCodeRevision'))selected.revision=patch.welcomeCodeRevision
  if(Object.hasOwn(patch,'welcomeCodeName'))selected.name=patch.welcomeCodeName
  return normalizeWelcomeCode({...previous,...patch,welcomeCodeModes:{...modes,[mode]:selected}})
}

export function welcomeCodeReferences(value){
  const themes=record(value?.welcomeThemes)?['light','dark'].map(scheme=>({...value,...value.welcomeThemes[scheme],welcomeCodeModes:value.welcomeThemes[scheme]?.welcomeCodeModes??null})):[value]
  return [...new Set(themes.flatMap(theme=>Object.values(normalizeWelcomeCode(theme).welcomeCodeModes).map(item=>item.revision)).filter(Boolean))]
}
