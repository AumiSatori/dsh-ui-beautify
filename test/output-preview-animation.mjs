import assert from 'node:assert/strict'
import {chromium} from '@playwright/test'
import {htmlPreviewDocument} from '../src/output-preview.js'

const browser=await chromium.launch({headless:true,channel:'chrome'})
try{
  const page=await browser.newPage()
  await page.setContent('<iframe sandbox="" style="width:640px;height:320px"></iframe>')
  const source=`<style>@keyframes enter{from{opacity:0;transform:translateY(10px);filter:blur(3px)}to{opacity:1;transform:none;filter:blur(0)}}.card{animation:enter .24s both;animation-delay:120ms}.card::before{content:'Preview';animation:enter 2s infinite}</style><section class="card">Visible output</section><script>document.body.dataset.executed='yes'</script>`
  await page.locator('iframe').evaluate((node,html)=>node.srcdoc=html,htmlPreviewDocument(source))
  const frame=page.frameLocator('iframe')
  await frame.locator('.card').waitFor()
  const state=await frame.locator('.card').evaluate(node=>({opacity:getComputedStyle(node).opacity,filter:getComputedStyle(node).filter,transform:getComputedStyle(node).transform,pseudo:getComputedStyle(node,'::before').opacity,executed:document.body.dataset.executed}))
  assert.equal(state.opacity,'1')
  assert.equal(state.filter,'blur(0px)')
  assert.ok(['none','matrix(1, 0, 0, 1, 0, 0)'].includes(state.transform))
  assert.equal(state.pseudo,'1')
  assert.equal(state.executed,undefined)
  console.log('PASS static covers resolve delayed entry animations and pseudo-elements without executing scripts')
}finally{await browser.close()}
