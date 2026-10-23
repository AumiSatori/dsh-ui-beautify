export async function selectSettingsCategory(page,name){
  const tab=page.getByRole('tab',{name,exact:true})
  if(await tab.getAttribute('aria-selected')!=='true')await tab.click()
  const id=await tab.getAttribute('aria-controls')
  await page.waitForFunction(id=>document.getElementById(id)?.getAttribute('aria-hidden')==='false'&&document.querySelector('.dcb-settings-tab-stage')?.getAttribute('data-state')==='idle'&&!document.getAnimations().some(animation=>animation.id==='dcb-settings-tab'),id)
}
