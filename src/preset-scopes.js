// Shared by the client, package validator and publishing tools.
export const PRESET_SCOPES = Object.freeze([
  ['full','整套预设','替换整套美化设置与配套素材'],
  ['panel','任务面板','卡片材质、模块与进度显示'],
  ['composer','输入栏','输入框材质与菜单透明度'],
  ['sidebar','侧栏','侧栏材质、动效与浮层'],
  ['background','全图背景','日夜背景与背景素材'],
  ['particles','粒子背景','粒子样式、密度与自定义素材'],
  ['welcome','开屏欢迎','日夜开屏动画与素材'],
  ['hero','欢迎语','标题文案、LOGO 与样式'],
  ['running','思考动图','思考动作包与标签'],
  ['bubbles','消息气泡','日夜消息气泡与自定义样式'],
  ['divider','回合分割线','回合分割线与装饰素材'],
  ['turns','回合卡片','对话回合卡片材质'],
  ['messages','对话动效','消息、详情与流式文字动效'],
  ['toolbar','工具栏','图标、顺序与标题布局'],
  ['layout','聊天宽度','窗口和全屏聊天宽度'],
].map(([id,name,description])=>Object.freeze({id,name,description})))
export const presetScope = id => {
  const scope=PRESET_SCOPES.find(item=>item.id===id)
  if(!scope)throw Error('不支持的预设分类。')
  return scope
}
export function settingScope(key){
  if(/^background/.test(key))return 'background'
  if(/^particle/.test(key))return 'particles'
  if(/^welcome/.test(key))return 'welcome'
  if(/^heroGreeting/.test(key))return 'hero'
  if(/^runningAnimation/.test(key))return 'running'
  if(/^sidebar/.test(key))return 'sidebar'
  if(/^(composer|triggerMenu)/.test(key)||key==='chatUnderComposer')return 'composer'
  if(/^userBubble/.test(key))return 'bubbles'
  if(/^turnDivider/.test(key))return 'divider'
  if(/^turn/.test(key))return 'turns'
  if(/^(message|detailMotion|streamReveal)/.test(key))return 'messages'
  if(['toolbar','iconStyle','headerCentered'].includes(key))return 'toolbar'
  if(['width','cardStyle','modules','panelModules','progressView','toolDetails','skillDetails','summaryScope'].includes(key))return 'panel'
  return null
}
export function scopeSettings(settings,scope){
  presetScope(scope)
  return Object.fromEntries(Object.entries(settings).filter(([key])=>scope==='full'||settingScope(key)===scope))
}
export const databaseScope=name=>({
  'dsh-ui-beautify-background':'background','dsh-ui-beautify-welcome':'welcome',
  'dsh-ui-beautify-welcome-code':'welcome','dsh-ui-beautify-hero-logo':'hero',
  'dsh-ui-context-particles':'particles','dsh-ui-beautify-turn-divider':'divider',
  'dsh-ui-beautify-running-packs':'running',
})[name]||null

// Sharing only exports assets used by this preset, never the local import
// history or the user's other saved presets.
export function sharedPresetRecords(name,records,settings){
  const refs=new Set()
  function visit(value,key=''){
    if(typeof value==='string'&&!/^previous/i.test(key)&&(/revision$/i.test(key)||key==='runningAnimationPack'))refs.add(value)
    else if(value&&typeof value==='object')for(const [key,item] of Object.entries(value))visit(item,key)
  }
  visit(settings)
  if(name==='dsh-ui-beautify-background'){
    const selection=records.find(r=>r.store==='wallpaper'&&r.key==='selection')
    if(settings.backgroundEnabled&&!settings.backgroundRevision&&selection?.value?.currentId)refs.add(selection.value.currentId)
    return records.flatMap(r=>{
      if(r.store==='assets')return refs.has(r.key)?[r]:[]
      if(r.key!=='selection')return []
      if(r.value?.schema===2)return [{...r,value:{schema:2,currentId:refs.has(r.value.currentId)?r.value.currentId:'',previousId:'',recent:(r.value.recent||[]).filter(a=>refs.has(a.revision))}}]
      return settings.backgroundEnabled?[{...r,value:{current:r.value?.current||null,previous:null}}]:[]
    })
  }
  if(name==='dsh-ui-beautify-running-packs')return records.filter(r=>r.store==='packs'?settings.runningAnimationPack===r.key:settings.runningAnimationPack&&r.key.startsWith(settings.runningAnimationPack+'/'))
  if(name==='dsh-ui-beautify-hero-logo')return settings.heroGreetingCustomLogo?records:[]
  if(name==='dsh-ui-context-particles'){const revision=settings.particleShape==='image'?settings.particleImageRevision:settings.particleSvgRevision;return ['image','custom'].includes(settings.particleShape)?records.filter(r=>revision?r.value?.revision===revision:r.key==='current'):[]}
  if(name==='dsh-ui-beautify-turn-divider')return settings.turnDividerImageRevision?records.filter(r=>refs.has(r.value?.revision)):[]
  if(name==='dsh-ui-beautify-welcome'||name==='dsh-ui-beautify-welcome-code')return records.filter(r=>refs.has(r.value?.revision)||refs.has(r.key.replace(/^asset:/,'')))
  return []
}
