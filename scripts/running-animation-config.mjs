export const RUNNING_BUILTIN='builtin-whale'
export const RUNNING_BASE='/dsh-ui-beautify/running'
export const RUNNING_LIMITS={files:100,entries:128,fileBytes:8*1024*1024,totalBytes:96*1024*1024,zipBytes:100*1024*1024,manifestBytes:65536,frames:240}
export const RUNNING_LABEL_LIMIT={lines:20,lineChars:40,chars:1200}
const number=(value,fallback,min,max)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Number(value))):fallback
export function normalizeRunningAnimation(value={}){
  value=value&&typeof value==='object'?value:{}
  return {runningAnimationEnabled:value.runningAnimationEnabled!==false,runningAnimationPack:typeof value.runningAnimationPack==='string'?value.runningAnimationPack.slice(0,100):RUNNING_BUILTIN,
    runningAnimationActions:Array.isArray(value.runningAnimationActions)?[...new Set(value.runningAnimationActions.filter(id=>typeof id==='string'&&/^[\w-]{1,100}$/.test(id)))].slice(0,100):null,
    runningAnimationRandom:value.runningAnimationRandom!==false,runningAnimationSize:number(value.runningAnimationSize,32,16,80),runningAnimationGap:number(value.runningAnimationGap,6,0,24),runningAnimationOpacity:number(value.runningAnimationOpacity,1,.2,1),
    // Keep the raw text while editing: trimming here would swallow new lines.
    runningAnimationLabel:typeof value.runningAnimationLabel==='string'?value.runningAnimationLabel.replace(/\r\n?/g,'\n').slice(0,RUNNING_LABEL_LIMIT.chars):'',
    runningAnimationLabelRandom:value.runningAnimationLabelRandom!==false}
}
export function runningLabelLines(value){
  if(typeof value!=='string')return []
  return [...new Set(value.split('\n').map(line=>line.trim().slice(0,RUNNING_LABEL_LIMIT.lineChars)).filter(Boolean))].slice(0,RUNNING_LABEL_LIMIT.lines)
}
export function chooseRunningLabel(labels,{random=true,previous='',randomValue=Math.random()}={}){
  if(!labels.length)return ''
  if(!random||labels.length===1)return labels[0]
  const choices=labels.length>1?labels.filter(label=>label!==previous):labels
  return choices[Math.max(0,Math.min(choices.length-1,Math.floor(randomValue*choices.length)))]||labels[0]
}
export function runningPath(value){
  if(typeof value!=='string'||!value||value.length>240||/[\x00-\x1f:?"<>|]/.test(value))throw Error('动图包文件名无效')
  const path=value.replaceAll('\\','/')
  if(path.startsWith('/')||path.split('/').some(part=>!part||part==='.'||part==='..'))throw Error('动图包包含无效路径')
  return path
}
export function runningImageType(bytes){
  if(bytes[0]===71&&bytes[1]===73&&bytes[2]===70&&bytes[3]===56)return 'image/gif'
  if([137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b))return 'image/png'
  if(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp'
  throw Error('仅支持 GIF、PNG/APNG 和 WebP 图片')
}
export function normalizeRunningManifest(value,files){
  if(value?.format!=='dsh-running-pack'||value.version!==1||!Array.isArray(value.actions)||!value.actions.length||value.actions.length>100)throw Error('动图包说明格式无效（需要 dsh-running-pack 第 1 版）')
  const ids=new Set()
  const actions=value.actions.map((item,index)=>{
    const id=item.id||`action-${index+1}`,file=runningPath(item.file)
    if(!/^[\w-]{1,100}$/.test(id)||ids.has(id))throw Error('动作 ID 需要唯一的英文、数字或短横线')
    ids.add(id)
    if(files&&!files.has(file))throw Error(`缺少图片：${file}`)
    const type=item.type==='sprite'?'sprite':'image'
    const action={id,name:String(item.name||id).slice(0,80),file,type}
    if(type==='sprite'){
      const frames=Number(item.frames),columns=Number(item.columns),fps=Number(item.fps??12.5)
      if(!Number.isInteger(frames)||frames<2||frames>240||!Number.isInteger(columns)||columns<1||columns>frames||!Number.isFinite(fps)||fps<1||fps>30)throw Error(`精灵图参数无效：${action.name}`)
      Object.assign(action,{frames,columns,rows:Math.ceil(frames/columns),fps})
    }
    return action
  })
  return {format:'dsh-running-pack',version:1,name:String(value.name||'我的动图包').slice(0,80),author:String(value.author||'').slice(0,80),license:String(value.license||'').slice(0,240),actions}
}
export function chooseRunningAction(actions,{random=true,previous='',randomValue=Math.random()}={}){
  if(!actions.length)return null
  const choices=random&&actions.length>1?actions.filter(action=>action.id!==previous):actions
  return choices[random?Math.max(0,Math.min(choices.length-1,Math.floor(randomValue*choices.length))):0]
}
