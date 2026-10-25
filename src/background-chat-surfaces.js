// CSS only: native content, file previews and actions retain their own handlers.
// Scope to an enabled wallpaper so default host themes keep their original skin.
const local=name=>`:is([class$="_${name}"],[class*="_${name} "])`
const ROOT='body[data-dcb-background]',FLOW=`${ROOT} [data-chat-flow]`,CARD=`${ROOT} :is([data-chat-flow],[data-conversation-content]) [data-changed-files]`
const ACTIONS=`${FLOW} ${local('actions')}:has(button${local('action')})`
const CODEBLOCK=`${FLOW} .md-code-block`
// Native message attachment cards use a hashed CSS-module class. The public
// suffix stays stable across host builds, so this follows the host geometry
// without copying or depending on a particular hash.
const FILECARD=`${ROOT} :is([data-chat-flow],[data-conversation-content]) ${local('fileCard')}`
const PRESENTED=`${ROOT} :is([data-chat-flow],[data-conversation-content]) [data-presented-file]`
export const backgroundChatSurfacesCss=`
  ${ROOT} { --dcb-presented-fill:transparent; --dcb-presented-hover:var(--dcb-chat-hover); --dcb-presented-icon:transparent; }
  ${ROOT}[data-ds-dark-theme] { --dcb-presented-fill:transparent; --dcb-presented-hover:var(--dcb-chat-hover); --dcb-presented-icon:transparent; }
  ${ROOT} { --dcb-chat-surface:rgba(245,249,255,.66); --dcb-chat-code-head:#fff; --dcb-chat-subtle:rgba(255,255,255,.18); --dcb-chat-hover:rgba(255,255,255,.34); --dcb-chat-rim:rgba(57,76,106,.2); --dcb-chat-ink:var(--dsw-alias-label-primary,#1c2c43); --dcb-chat-muted:var(--dsw-alias-label-secondary,#435771); --dcb-chat-code:rgba(240,246,255,.58); --dcb-chat-added:#086743; --dcb-chat-deleted:#ad203a; }
  ${ROOT}[data-ds-dark-theme] { --dcb-chat-surface:rgba(19,26,39,.8); --dcb-chat-code-head:rgba(30,37,52,.96); --dcb-chat-subtle:rgba(255,255,255,.045); --dcb-chat-hover:rgba(196,215,255,.12); --dcb-chat-rim:rgba(207,224,255,.2); --dcb-chat-ink:var(--dsw-alias-label-primary,#edf3ff); --dcb-chat-muted:var(--dsw-alias-label-secondary,#c0cee3); --dcb-chat-code:rgba(17,25,40,.76); --dcb-chat-added:#74e6ae; --dcb-chat-deleted:#ff9eae; }
  ${FLOW} code:not(pre code) { background:var(--dcb-chat-code)!important; color:var(--dcb-chat-ink)!important; border:1px solid var(--dcb-chat-rim); box-shadow:inset 0 1px 0 #ffffff12; overflow-wrap:anywhere; }
  /* CodeBlock keeps its native header/content split. The header follows the
     requested white source; the code surface follows the chat underlay so the
     wallpaper remains visible through the lower section without losing ink contrast. */
  ${CODEBLOCK} { --dsl-code-block-background:var(--dcb-chat-surface); --dsl-code-block-banner-background-color:var(--dcb-chat-code-head); color:var(--dcb-chat-ink); background:var(--dcb-chat-surface)!important; border:1px solid var(--dcb-chat-rim); box-shadow:inset 0 1px 0 #ffffff38,0 3px 12px #16233d0a; overflow:hidden; }
  ${CODEBLOCK} :is([data-code-block-banner]) { background:var(--dcb-chat-code-head)!important; color:var(--dcb-chat-ink); }
  ${CODEBLOCK} :is([data-code-block-content],pre,pre.shiki) { background:var(--dcb-chat-surface)!important; color:var(--dcb-chat-ink); border-top:1px solid var(--dcb-chat-rim); }
  ${CODEBLOCK} :is([data-code-block-content],pre) code,${CODEBLOCK} :is([data-code-block-content],pre) span { color:inherit; }
  ${FILECARD} { background:transparent!important; color:var(--dcb-chat-ink); border-color:var(--dcb-chat-rim)!important; box-shadow:inset 0 1px 0 #ffffff24,0 3px 12px #16233d0a; }
  ${FILECARD}:is(:hover,:focus-within) { background:var(--dcb-chat-hover)!important; }
  ${FILECARD} ${local('fileName')} { color:var(--dcb-chat-ink)!important; }
  ${FILECARD} ${local('fileMeta')} { color:var(--dcb-chat-muted)!important; }
  ${FILECARD} button:hover { background:var(--dcb-chat-hover); }
  ${PRESENTED} { --deliverable-fill:var(--dcb-presented-fill); --deliverable-hover:var(--dcb-presented-hover); background:var(--deliverable-fill)!important; color:var(--dcb-chat-ink); border-color:var(--dcb-chat-rim)!important; box-shadow:none; }
  ${PRESENTED}:is(:hover,:focus-within) { background:var(--deliverable-hover)!important; }
  ${PRESENTED} ${local('fileIcon')} { background:var(--dcb-presented-icon)!important; border-color:var(--dcb-chat-rim); }
  ${PRESENTED} ${local('fileName')} { color:var(--dcb-chat-ink); }
  ${PRESENTED} [data-presented-description]:not([data-error]) { color:var(--dcb-chat-muted); }
  ${PRESENTED} ${local('actions')} { --dsw-alias-bg-layer-1:var(--dcb-presented-icon); }
  ${CARD} { --changes-fill:transparent; --changes-hover:var(--dcb-chat-hover); color:var(--dcb-chat-ink); background:transparent!important; border-color:var(--dcb-chat-rim)!important; box-shadow:inset 0 1px 0 #ffffff24,0 3px 12px #16233d0a; }
  ${CARD} > ${local('header')} { background:var(--dcb-chat-hover); }
  ${CARD} ${local('list')} { border-top:1px solid var(--dcb-chat-rim); }
  ${CARD} ${local('list')} > li + li,${CARD} ${local('list')} + ${local('toggle')} { border-top:1px solid var(--dcb-chat-rim); }
  ${CARD} ${local('list')},${CARD} ${local('tile')} { border-color:var(--dcb-chat-rim); }
  ${CARD} ${local('tile')} { background:transparent; }
  ${CARD} :is(${local('row')},${local('toggle')},${local('counts')},${local('stat')}) { color:var(--dcb-chat-muted); }
  ${CARD} ${local('added')} { color:var(--dcb-chat-added); }
  ${CARD} ${local('deleted')} { color:var(--dcb-chat-deleted); }
  ${CARD} :is(${local('header')},${local('row')},${local('toggle')}):hover:not(:disabled) { background:var(--dcb-chat-hover); }
  ${CARD} button:focus-visible { outline:2px solid var(--dsw-focus-ring-color,var(--dsh-settings-accent,#596be7)); outline-offset:-3px; }
  ${ACTIONS} { color:var(--dcb-chat-muted); border-radius:9px; }
  ${ACTIONS} :is(button${local('action')},${local('endInfo')},${local('timeStart')}) { color:var(--dcb-chat-muted); }
  ${ACTIONS} button${local('action')}:hover { color:var(--dcb-chat-ink); background:var(--dcb-chat-hover); }
  @media(forced-colors:active) {
    ${FLOW} code:not(pre code),${CODEBLOCK},${CODEBLOCK} :is([data-code-block-banner],[data-code-block-content],pre),${FILECARD},${PRESENTED},${PRESENTED} ${local('fileIcon')},${CARD},${CARD} > ${local('header')},${CARD} ${local('tile')} { background:Canvas!important; color:CanvasText!important; border-color:CanvasText!important; box-shadow:none; }
    ${PRESENTED} :is(${local('fileName')},[data-presented-description]) { color:CanvasText; }
    ${CARD} :is(${local('row')},${local('toggle')},${local('counts')},${local('stat')},${local('added')},${local('deleted')}),${ACTIONS},${ACTIONS} :is(button${local('action')},${local('endInfo')},${local('timeStart')}) { color:CanvasText; }
    ${CARD} button:focus-visible { outline-color:Highlight; }
    ${CARD} ${local('list')},${CARD} ${local('list')} > li + li,${CARD} ${local('list')} + ${local('toggle')} { border-color:CanvasText; }
  }
`
