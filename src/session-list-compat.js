// DSH 0.2.2 can emit api-session/removed when a resident Session is released
// even though its history remains persisted. Confirm against the native list
// before allowing that event to withdraw an ordinary Session from the UI.
export function preservePersistedSessions(sessions) {
  if (typeof sessions?.handleSessionRemoved !== 'function' ||
      typeof sessions.refresh !== 'function' ||
      typeof sessions.list?.getSnapshot !== 'function') return () => {}

  const original = sessions.handleSessionRemoved
  const pending = new Map()
  let disposed = false

  async function reconcile(sessionId, record) {
    try {
      // The first refresh may join a request sent before the removal event.
      // The next request must begin after that event to confirm absence.
      await sessions.refresh()
      while (!disposed) {
        const revision = record.revision
        await sessions.refresh()
        if (disposed) return
        if (revision !== record.revision) continue
        if (!sessions.list.getSnapshot().byId[sessionId]) original.call(sessions, sessionId)
        return
      }
    } catch (error) {
      console.warn('[dsh-ui-beautify] Session list reconciliation failed', error)
    } finally {
      pending.delete(sessionId)
    }
  }

  function handleSessionRemoved(sessionId) {
    const row = sessions.list.getSnapshot().byId[sessionId]
    if (!row || row.origin === 'subagent') return original.call(sessions, sessionId)
    const existing = pending.get(sessionId)
    if (existing) {
      existing.revision++
      return existing.promise
    }
    const record = { revision: 0, promise: null }
    pending.set(sessionId, record)
    record.promise = reconcile(sessionId, record)
    return record.promise
  }

  sessions.handleSessionRemoved = handleSessionRemoved
  return () => {
    disposed = true
    pending.clear()
    if (sessions.handleSessionRemoved === handleSessionRemoved) sessions.handleSessionRemoved = original
  }
}
