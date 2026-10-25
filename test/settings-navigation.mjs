export async function selectSettingsCategory(page,name){
  const parent={输入栏:'组件布局',侧栏:'组件布局',右上工具栏:'组件布局',开屏欢迎:'全局布局',全图背景:'全局布局',粒子背景:'全局布局',任务面板:'对话布局',思考动图:'对话布局',对话动效:'对话布局'}[name]
  if(parent){const group=page.getByRole('tab',{name:parent,exact:true});if(await group.count()&&await group.getAttribute('aria-selected')!=='true')await group.click()}
  const tab=page.getByRole('tab',{name,exact:true})
  if(await tab.getAttribute('aria-selected')!=='true')await tab.click()
  await page.waitForFunction(()=>document.querySelector('.dcb-settings-tab-page')?.getAttribute('aria-hidden')==='false'&&document.querySelector('.dcb-settings-tab-stage')?.getAttribute('data-state')==='idle'&&!document.getAnimations().some(animation=>animation.id==='dcb-settings-tab'))
}
