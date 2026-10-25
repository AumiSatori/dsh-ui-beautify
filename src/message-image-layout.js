// The host normally writes its fitted image dimensions inline. A durable
// attachment can arrive without those dimensions: its NaN inline size is then
// discarded by the browser, leaving only a 44px loading button. Reserve the
// host's own 240px unknown-image box before decoding; valid inline sizes win.
// Scope this to user-message attachment frames, never editor thumbnails,
// markdown illustrations, image viewers, tool outputs or other buttons.
const FRAME='[data-message-attachments] button[data-variant]:is([class$="_frame"],[class*="_frame "])'
const CODEX='[data-message-attachments] .codexMessageImages'
export const messageImageLayoutCss=`
 ${FRAME}[data-variant="single"] { width:240px; height:240px; max-width:100%; max-height:240px; }
 ${FRAME}>img,${CODEX}>.codexImageThumb>img { min-width:0; min-height:0; max-width:100%; max-height:100%; }
 ${CODEX}[data-single="true"]>.codexImageThumb { width:240px; height:240px; max-width:100%; max-height:240px; }
 ${CODEX}[data-single="true"]>.codexImageThumb>img { width:100%; height:100%; object-fit:contain; }
`
// The subscription adapter supplies no dimensions to its DOM, even when the
// attachment metadata is complete. Keep its single-image box identical across
// preview, authenticated loading, retry and decoded states. Contain the whole
// image inside it; do not crop portraits or interfere with its preview action.
