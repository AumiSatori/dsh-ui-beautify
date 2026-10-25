import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {test} from 'node:test'

const source=readFileSync(new URL('../client.js',import.meta.url),'utf8')
test('sidebar glass keeps the left edge square and rounds only the right corners',()=>{
  assert.match(source,/body \[\$\{SIDEBAR_MARK\}\] \{[^}]*border-radius: 0 16px 16px 0;/)
  assert.match(source,/body \[\$\{SIDEBAR_MARK\}\]::before \{[^}]*border-radius: 0 16px 16px 0;/)
  assert.doesNotMatch(source,/body \[\$\{SIDEBAR_MARK\}\] \{[^}]*overflow: hidden/)
})
test('sidebar exposes an independent right-edge collapse switch',()=>{
  const module=readFileSync(new URL('../src/sidebar-glass.js',import.meta.url),'utf8')
  assert.match(module,/展开左侧栏/)
  assert.match(source,/dcb-sidebar-toggle-right/)
  assert.match(source,/cursor:pointer/)
  assert.doesNotMatch(source,/dcb-sidebar-resize/)
})
