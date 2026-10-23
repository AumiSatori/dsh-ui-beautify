const CONTENT='[data-conversation-content]',FLOW='[data-chat-flow]',ROW='[data-chat-turn]'
const TAIL='[data-chat-following-tail]',MARK='nav button[data-index][aria-current="true"]'
const STRUCTURE=`${CONTENT},${FLOW},${ROW},${TAIL},nav button[data-index]`
const element=node=>node?.nodeType===1?node:node?.parentElement
const containsStructure=node=>node.nodeType===1&&!node.closest('[data-dcb-sidebar-layout-probe], [data-dcb-summary-for]')&&(node.matches(STRUCTURE)||node.querySelector(STRUCTURE))

// Native message rows are in vertical document order. Build their index only
// when that structure changes, then locate the reading line in logarithmic reads.
// Token appends inside a row must never remeasure the entire transcript.
export function observeReadingTurn(doc,win,{sessionId,outlineIds=[],ids=[],onChange}){
  let container=null,column=null,list=null,rows=[],known=[],tail=false,mark=null
  let frame=0,disposed=false,indexDirty=true,railDirty=true,visibilityPending=false
  const resize=new win.ResizeObserver(()=>{if(visibilityPending)indexDirty=true;schedule()})
  function bind(){
    if(container?.isConnected&&container.dataset.conversationSession===sessionId&&container.getClientRects().length)return true
    const next=[...doc.querySelectorAll(CONTENT)].find(node=>node.dataset.conversationSession===sessionId&&!node.closest('[data-dcb-sidebar-layout-probe]')&&node.getClientRects().length)
    if(next!==container){resize.disconnect();container=next;column=list=null;rows=[];indexDirty=railDirty=true;if(next)resize.observe(next)}
    return !!container
  }
  function index(){
    column=container.querySelector(FLOW)
    const next=column?.querySelector(':scope > [data-slot="conversation.chat.flow"]')||column
    if(next!==list){if(list)resize.unobserve(list);list=next;if(list)resize.observe(list)}
    const candidates=list?[...list.children].filter(row=>row.hasAttribute('data-chat-turn')):[...container.querySelectorAll(ROW)].filter(row=>!row.parentElement.closest(ROW))
    known=[...new Set([...outlineIds,...candidates.map(row=>Number(row.dataset.chatTurn))].filter(value=>Number.isSafeInteger(value)&&value>=0))].sort((a,b)=>a-b)
    rows=candidates.filter(row=>!row.closest('[hidden]')&&row.getClientRects().length)
    visibilityPending=candidates.length>0&&rows.length===0
    indexDirty=false;railDirty=true
  }
  function sample(){
    frame=0;if(disposed)return
    if(!bind()){onChange(null);return}
    if(indexDirty)index()
    if(railDirty){tail=!!container.querySelector(TAIL);mark=container.querySelector(MARK);railDirty=false}
    let turn=null
    if(tail){const latest=Math.max(known.at(-1)??-1,ids.at(-1)??-1);turn=latest>=0?latest:null}
    else if(mark?.isConnected)turn=known[Number(mark.dataset.index)]??null
    if(turn===null&&rows.length){
      const scroller=(list||rows[0]).closest('[data-conversation-scroll]')||container.querySelector('[data-conversation-scroll]')||container
      const bounds=scroller.getBoundingClientRect(),line=bounds.top+Math.min(96,bounds.height*.2)
      let lo=0,hi=rows.length
      while(lo<hi){const mid=(lo+hi)>>>1;if(rows[mid].getBoundingClientRect().top<=line)lo=mid+1;else hi=mid}
      turn=Number(rows[Math.max(0,lo-1)].dataset.chatTurn)
    }
    onChange(turn)
  }
  function schedule(){if(!frame&&!disposed)frame=win.requestAnimationFrame(sample)}
  const observer=new win.MutationObserver(records=>{
    let changed=false
    for(const record of records){
      const target=element(record.target)
      if(!target||target.closest('[data-dcb-summary-for], [data-dcb-sidebar-layout-probe]'))continue
      if(record.type==='attributes'){
        if(record.attributeName==='data-conversation-session'){if(target===container||target.dataset.conversationSession===sessionId)indexDirty=railDirty=changed=true;continue}
        if(!container?.contains(target))continue
        if(record.attributeName==='data-chat-turn'||record.attributeName==='hidden'){indexDirty=true;changed=true}
        else if(record.attributeName==='class'&&(target===container||target===column||target===list||target.matches(ROW))){indexDirty=true;changed=true}
        else if(target.matches('nav button[data-index]')||record.attributeName==='data-chat-following-tail'){railDirty=true;changed=true}
      }else{
        if(container?.isConnected&&!container.contains(target)&&!target.contains(container))continue
        if(target===list||target===column){indexDirty=true;changed=true}
        else if([...record.addedNodes,...record.removedNodes].some(containsStructure)){indexDirty=railDirty=changed=true}
      }
    }
    if(changed)schedule()
  })
  observer.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-current','data-index','data-chat-turn','data-chat-following-tail','data-conversation-session','hidden','class']})
  const scroll=event=>{
    const target=element(event.target)
    if(target?.closest('[data-dcb-summary-for]'))return
    if(event.target===doc||target===doc.body||target===doc.documentElement||target?.contains(container)||container?.contains(target)&&target.matches('[data-conversation-scroll]'))schedule()
  }
  doc.addEventListener('scroll',scroll,true);win.addEventListener('resize',schedule)
  sample()
  return()=>{disposed=true;observer.disconnect();resize.disconnect();doc.removeEventListener('scroll',scroll,true);win.removeEventListener('resize',schedule);win.cancelAnimationFrame(frame)}
}
