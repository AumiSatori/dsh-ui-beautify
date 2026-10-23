function setTheme(light){
  state.lightTarget=light?1:0;
  document.documentElement.dataset.theme=light?'light':'dark';
  $('#theme').textContent=light?'☾':'☼';
  $('#theme').setAttribute('aria-label',light?'切换深色主题':'切换浅色主题');
  for(const b of document.querySelectorAll('[data-theme-choice]'))b.setAttribute('aria-pressed',String((b.dataset.themeChoice==='light')===!!light));
  requestFrame();
}
function setView(view){
  state.viewTarget=view==='chat'?1:0;document.body.dataset.view=view;
  for(const [selector,visible] of [['.chat',!!state.viewTarget],['.composer-area',!!state.viewTarget],['.intro',!state.viewTarget]]){
    const el=$(selector);el.inert=!visible;el.setAttribute('aria-hidden',String(!visible));
  }
  for(const b of document.querySelectorAll('button[data-view]'))b.setAttribute('aria-pressed',String(b.dataset.view===view));
  requestFrame();
}
function bindShell(){
  state.light=document.documentElement.dataset.theme==='light'?1:0;setTheme(!!state.light);
  const conversation=$('#conversation'),initial=conversation.innerHTML,chat=$('.chat');
  const assistant=text=>{
    const article=document.createElement('article');article.className='message-assistant new-message';
    article.innerHTML='<div class="assistant-avatar"><svg><use href="#whale"/></svg></div><div class="message-body"><div class="assistant-name">DeepSeek</div><p></p><div class="message-actions"><span>本地模拟回答</span></div></div>';
    article.querySelector('p').textContent=text;return article;
  };
  let replacement=0,mobileShell=innerWidth<=760;
  if(mobileShell)document.body.dataset.sidebar='closed';
  const disclosureCleanup=new WeakMap();
  async function replaceConversation(content){
    const current=++replacement;
    if(!media.matches)await conversation.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-8px)',filter:'blur(3px)'}],{duration:140,easing:'cubic-bezier(.4,0,.2,1)'}).finished;
    if(current!==replacement)return;
    conversation.innerHTML=content;chat.scrollTop=0;
    if(!media.matches)conversation.animate([{opacity:0,transform:'translateY(10px)',filter:'blur(3px)'},{opacity:1,transform:'none',filter:'none'}],{duration:260,easing:'cubic-bezier(.22,.8,.26,1)'});
  }
  function setSidebar(open){
    document.body.dataset.sidebar=open?'open':'closed';syncSidebarAccess();requestFrame();
  }
  function syncSidebarAccess(){
    const mobile=innerWidth<=760;
    if(mobile!==mobileShell){document.body.dataset.sidebar=mobile?'closed':'open';mobileShell=mobile}
    const visible=innerWidth<=760?document.body.dataset.sidebar==='open':document.body.dataset.sidebar!=='closed';
    $('.sidebar').inert=!visible;$('.sidebar').setAttribute('aria-hidden',String(!visible));
    $('#sidebar-open').setAttribute('aria-expanded',String(visible));
    $('#sidebar-scrim').tabIndex=innerWidth<=760&&visible?0:-1;
  }
  $('#sidebar-close').addEventListener('click',()=>{setSidebar(false);$('#sidebar-open').focus()});
  $('#sidebar-open').addEventListener('click',()=>{setSidebar(true);$('#sidebar-close').focus()});
  $('#sidebar-scrim').addEventListener('click',()=>setSidebar(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&innerWidth<=760)setSidebar(false);if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#new-chat').click()}});
  window.addEventListener('resize',syncSidebarAccess,{passive:true});syncSidebarAccess();
  for(const b of document.querySelectorAll('[data-theme-choice]'))b.addEventListener('click',()=>setTheme(b.dataset.themeChoice==='light'));
  const clearHistory=()=>{for(const b of document.querySelectorAll('[data-chat]')){b.classList.remove('active');b.removeAttribute('aria-current')}};
  $('#new-chat').addEventListener('click',()=>{
    setView('chat');clearHistory();replaceConversation('<div class="welcome"><svg><use href="#whale"/></svg><h1>今天有什么可以帮到你？</h1><p>在这里开始一段对话，也让记忆慢慢成形。</p></div>');
    if(innerWidth<=760)setSidebar(false);$('#message-input').focus();
  });
  const topics={svg:['我可以用自己的 SVG 形成粒子吗？','可以。点击下方的「导入 SVG」，或把 SVG 文件直接拖到页面。粒子会沿着图形的填充、描边和渐变逐渐归位，当前的上下文占用保持不变。'],reading:['粒子背景会影响看正文吗？','背景在会话视图中会降低亮度，并避开左侧的主要阅读区域。可以切换黑、白主题，或拖动占用比例，对照查看不同密度下的阅读效果。'],transition:['能让整个形成过程更均匀吗？','光点数量在整个区间持续增长，每一颗粒子有各自的归位进度。前半段不断生长与聚拢，后半段逐渐补齐细节。点击自动演示，可以看完整的往返过程。']};
  for(const b of document.querySelectorAll('[data-chat]'))b.addEventListener('click',async()=>{
    setView('chat');clearHistory();b.classList.add('active');b.setAttribute('aria-current','page');
    if(b.dataset.chat==='memory')await replaceConversation(initial);
    else{const [question,answer]=topics[b.dataset.chat];const user=document.createElement('div');user.className='message-user';user.textContent=question;await replaceConversation(user.outerHTML+assistant(answer).outerHTML)}
    if(innerWidth<=760)setSidebar(false);
  });
  $('#search-chat').addEventListener('click',()=>notify('这是本地模拟页面，可点击侧栏的示例会话切换'));
  for(const id of ['deep-think','web-search'])$('#'+id).addEventListener('click',()=>{
    const b=$('#'+id);b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'));
    if(id==='web-search'&&b.getAttribute('aria-pressed')==='true')notify('联网搜索仅模拟选中状态，本页不会发起搜索');
  });
  $('#attach').addEventListener('click',()=>$('#svg-file').click());
  const input=$('#message-input');input.addEventListener('input',()=>$('#send').disabled=!input.value.trim());
  input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('#composer').requestSubmit()}});
  $('#composer').addEventListener('submit',e=>{
    e.preventDefault();const text=input.value.trim();if(!text)return;
    const user=document.createElement('div');user.className='message-user new-message';user.textContent=text;
    conversation.append(user,assistant('这条消息已在本地展示。你可以继续输入，查看多轮对话与粒子背景叠加的效果；下方滑块用于模拟上下文占用。'));
    input.value='';$('#send').disabled=true;setTarget(Math.min(100,state.target+4));
    requestAnimationFrame(()=>chat.scrollTo({top:chat.scrollHeight,behavior:media.matches?'instant':'smooth'}));
  });
  conversation.addEventListener('click',async e=>{
    const thinking=e.target.closest('.thinking');
    if(thinking){
      const detail=thinking.nextElementSibling,open=thinking.getAttribute('aria-expanded')!=='true';
      disclosureCleanup.get(detail)?.();
      if(!open)detail.style.height=detail.getBoundingClientRect().height+'px';
      detail.getBoundingClientRect();thinking.setAttribute('aria-expanded',String(open));detail.inert=!open;detail.setAttribute('aria-hidden',String(!open));
      detail.dataset.open=String(open);detail.style.height=open?detail.firstElementChild.scrollHeight+14+'px':'0px';
      const finish=event=>{if(event&&event.propertyName!=='height')return;detail.style.height=open?'auto':'';detail.removeEventListener('transitionend',finish)};
      disclosureCleanup.set(detail,()=>detail.removeEventListener('transitionend',finish));
      detail.addEventListener('transitionend',finish);if(media.matches)finish();
    }
    const copy=e.target.closest('[data-copy]');
    if(copy){try{await navigator.clipboard.writeText(Array.from(copy.closest('.message-body').querySelectorAll('h2,p,blockquote')).map(e=>e.textContent).join('\n\n'));notify('已复制示例文字')}catch{notify('此浏览器未开放剪贴板，可直接选择文字复制')}}
    if(e.target.closest('[data-feedback]'))notify('这是本地示例，反馈与重新生成未连接服务');
  });
}
