import assert from 'node:assert/strict'
import {openSync, readSync, closeSync} from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import {preservePersistedSessions} from '../src/session-list-compat.js'

function fixture(ids = ['kept'], refresh = async () => {}) {
  const state = {rows: ids.map(id => ({id})), removed: [], refreshes: 0}
  const sessions = {
    list: {getSnapshot: () => ({byId: Object.fromEntries(state.rows.map(row => [row.id, row]))})},
    handleSessionRemoved(id) {
      assert.equal(this, sessions)
      state.removed.push(id)
      state.rows = state.rows.filter(row => row.id !== id)
    },
    async refresh() {
      state.refreshes++
      await refresh(state)
    },
  }
  return {state, sessions}
}

function deferred() {
  let resolve
  const promise = new Promise(done => {resolve = done})
  return {promise, resolve}
}

test('persisted sessions stay in the list from removal notification through confirmation', async () => {
  const {state, sessions} = fixture()
  const restore = preservePersistedSessions(sessions)
  const pending = sessions.handleSessionRemoved('kept')
  assert.equal(state.rows.length, 1)
  await pending
  assert.equal(state.refreshes, 2)
  assert.equal(state.rows.length, 1)
  assert.deepEqual(state.removed, [])
  restore()
})

test('confirmed removal still reaches the native handler with its original receiver', async () => {
  const {state, sessions} = fixture(['deleted'], async state => {state.rows = []})
  const restore = preservePersistedSessions(sessions)
  await sessions.handleSessionRemoved('deleted')
  assert.deepEqual(state.removed, ['deleted'])
  assert.equal(state.refreshes, 2)
  restore()
})

test('a failed confirmation preserves the row and a later event can retry', async t => {
  t.mock.method(console, 'warn', () => {})
  const {state, sessions} = fixture(['kept'], async state => {
    if (state.refreshes === 1) throw new Error('synthetic connection failure')
  })
  const restore = preservePersistedSessions(sessions)
  await sessions.handleSessionRemoved('kept')
  assert.equal(state.rows.length, 1)
  await sessions.handleSessionRemoved('kept')
  assert.equal(state.refreshes, 3)
  assert.deepEqual(state.removed, [])
  restore()
})

test('a removal during a confirmation waits for a newer list response', async () => {
  const response = deferred()
  const {state, sessions} = fixture(['kept'], async state => {
    if (state.refreshes === 2) await response.promise
    if (state.refreshes === 3) state.rows = []
  })
  const restore = preservePersistedSessions(sessions)
  const pending = sessions.handleSessionRemoved('kept')
  await new Promise(done => setImmediate(done))
  assert.equal(state.refreshes, 2)
  assert.equal(sessions.handleSessionRemoved('kept'), pending)
  response.resolve()
  await pending
  assert.equal(state.refreshes, 3)
  assert.deepEqual(state.removed, ['kept'])
  restore()
})

test('subagents and unknown identities retain the native removal behavior', () => {
  const {state, sessions} = fixture(['child'])
  state.rows[0].origin = 'subagent'
  const restore = preservePersistedSessions(sessions)
  sessions.handleSessionRemoved('child')
  sessions.handleSessionRemoved('unknown')
  assert.equal(state.refreshes, 0)
  assert.deepEqual(state.removed, ['child', 'unknown'])
  restore()
})

test('uninstall during a request restores the handler and prevents late removal', async () => {
  const response = deferred()
  const {state, sessions} = fixture(['kept'], async () => {await response.promise})
  const original = sessions.handleSessionRemoved
  const restore = preservePersistedSessions(sessions)
  const pending = sessions.handleSessionRemoved('kept')
  restore()
  assert.equal(sessions.handleSessionRemoved, original)
  response.resolve()
  await pending
  assert.deepEqual(state.removed, [])
  assert.equal(state.refreshes, 1)
})

test('cleanup preserves a later handler installed by another owner', () => {
  const {sessions} = fixture()
  const restore = preservePersistedSessions(sessions)
  const later = () => {}
  sessions.handleSessionRemoved = later
  restore()
  assert.equal(sessions.handleSessionRemoved, later)
})

test('hosts without the reconciliation interfaces are left usable', () => {
  const sessions = {handleSessionRemoved() {}}
  const original = sessions.handleSessionRemoved
  preservePersistedSessions(sessions)()
  assert.equal(sessions.handleSessionRemoved, original)
  preservePersistedSessions(null)()
})

function readNativeController() {
  const fd = openSync(process.env.DSH_ASAR, 'r')
  try {
    const header = Buffer.alloc(16)
    readSync(fd, header, 0, header.length, 0)
    const json = Buffer.alloc(header.readUInt32LE(12))
    readSync(fd, json, 0, json.length, 16)
    let entry = JSON.parse(json)
    for (const part of 'dsh/node_modules/@deepseek-ai/dsh-api-session-controller/lib/client.js'.split('/')) entry = entry.files[part]
    const bytes = Buffer.alloc(entry.size)
    readSync(fd, bytes, 0, bytes.length, 8 + header.readUInt32LE(4) + Number(entry.offset))
    return bytes.toString()
  } finally {
    closeSync(fd)
  }
}

test('installed native controller reproduces the disappearing row and accepts the compatibility fix', {skip: !process.env.DSH_ASAR}, async () => {
  const source = readNativeController()
  const region = start => {
    const at = source.indexOf(start)
    assert.ok(at >= 0, start)
    return source.slice(at, source.indexOf('//#endregion', at))
  }
  const NativeManager = new vm.Script(
    region('function mergeOrderedBaseline(') + region('var SessionManager = class') + '\n;SessionManager',
  ).runInNewContext()

  function nativeFixture() {
    const summary = {sessionId: 'session-demo', blank: false, running: false, agentAvailable: false, updatedAt: 1}
    let removed = false
    const manager = Object.assign(Object.create(NativeManager.prototype), {
      summaries: [summary], sessions: new Map([['session-demo', {
        handleRemoved() {removed = true}, handleBlank() {}, handleRunning() {},
      }]]),
      disposed: false, addresses: new Map(), projectionStores: new Map(), projectionInflight: new Map(),
      projectionLoads: new Map(), engagedSessions: new Set(), listMutations: null, listInflight: null,
      listPhase: 'ready', listState: 'idle', notifier: {markDirty() {}},
      remote: {session: {list: async () => ({ok: true, value: {items: [summary]}})}},
    })
    const sessions = {
      list: {getSnapshot: () => ({byId: Object.fromEntries(manager.summaries.map(row => [row.sessionId, {id: row.sessionId}]))})},
      refresh: () => manager.refreshList(),
      handleSessionRemoved: id => manager.handleSessionRemoved(id),
    }
    return {manager, sessions, removed: () => removed}
  }

  const before = nativeFixture()
  before.sessions.handleSessionRemoved('session-demo')
  assert.equal(before.manager.summaries.length, 0, 'the native event withdraws a persisted row')
  assert.equal(before.removed(), true, 'the resident session also becomes unavailable')

  const after = nativeFixture()
  const restore = preservePersistedSessions(after.sessions)
  const pending = after.sessions.handleSessionRemoved('session-demo')
  assert.equal(after.manager.summaries.length, 1)
  await pending
  assert.equal(after.manager.summaries.length, 1)
  assert.equal(after.removed(), false)
  restore()
})
