import assert from 'node:assert/strict'
import test from 'node:test'
import {normalizeToolbar,toolbarDefaultOrder} from '../src/toolbar-settings.js'

test('legacy toolbar layouts insert search after theme without changing saved order or visibility',()=>{
  const order=['rightSidebar','summary','theme','folder','more','settings','focus'],hidden=['folder','focus']
  const migrated=normalizeToolbar({order,hidden})
  assert.deepEqual(migrated.order,['rightSidebar','summary','theme','search','folder','more','settings','focus'])
  assert.deepEqual(migrated.order.filter(id=>id!=='search'),order)
  assert.deepEqual(migrated.hidden,hidden)
  assert.deepEqual(normalizeToolbar(migrated),migrated)
})

test('explicit search position and hidden preference survive normalization and JSON transfer',()=>{
  const layout={order:['search',...toolbarDefaultOrder.filter(id=>id!=='search')],hidden:['search','more']}
  assert.deepEqual(normalizeToolbar({toolbar:JSON.parse(JSON.stringify(layout))}),layout)
  assert.deepEqual(normalizeToolbar({}),{order:toolbarDefaultOrder,hidden:[]})
})

test('unknown and repeated toolbar entries are filtered while retaining a deliberate search placement',()=>{
  const value=normalizeToolbar({order:['focus','missing','search','focus'],hidden:['search','missing','search']})
  assert.deepEqual(value.order,['focus','search',...toolbarDefaultOrder.filter(id=>!['focus','search'].includes(id))])
  assert.deepEqual(value.hidden,['search'])
})
