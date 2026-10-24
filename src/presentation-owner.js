// A module rename or a second Loader entry must not create another page-wide
// renderer. Keep the lease outside the factory so separately evaluated bundles
// share it, and hand it over only after the previous context has been disposed.
const OWNER = Symbol.for('dsh-ui-beautify.presentation-owner.v1')
const STYLES = 'style[data-plugin="dsh-ui-beautify"],style[data-plugin="dsh-claude-beautify"]'

export function applyPresentationOnce(ctx, doc, win, start) {
  let state = win[OWNER]
  if (!state) {
    state = { owner: null, requests: new Map(), queued: false, observer: null }
    const defer = () => {
      if (state.queued) return
      state.queued = true
      win.queueMicrotask(() => { state.queued = false; state.flush() })
    }
    state.flush = () => {
      if (state.owner || !state.requests.size) {
        state.observer?.disconnect(); state.observer = null
        return
      }
      // Older releases did not publish a lease. Let their own lifetime remove
      // the style; do not remove their React nodes or start another renderer.
      if (doc.querySelector(STYLES)) {
        if (!state.observer) {
          state.observer = new win.MutationObserver(defer)
          state.observer.observe(doc.head, { childList: true })
        }
        return
      }
      state.observer?.disconnect(); state.observer = null
      const request = state.requests.values().next().value
      state.owner = request
      try { request.start() }
      catch (error) {
        state.requests.delete(request.ctx); state.owner = null
        defer()
        throw error
      }
    }
    state.release = request => {
      if (state.requests.get(request.ctx) !== request) return
      state.requests.delete(request.ctx)
      if (state.owner === request) state.owner = null
      if (!state.requests.size) { state.observer?.disconnect(); state.observer = null }
      // Cordis still has other slot/injection effects to clean up in this turn.
      defer()
    }
    win[OWNER] = state
  }
  if (state.requests.has(ctx)) return
  const request = { ctx, start }
  state.requests.set(ctx, request)
  ctx.effect(() => () => state.release(request), 'dsh-ui-beautify: presentation ownership')
  state.flush()
}
