// HTML backgrounds are stored verbatim (text/html blob + IndexedDB), so the cap
// covers both the editor buffer and the saved asset. Base64 artwork makes the
// document mostly ASCII, which keeps characters ≈ bytes for this limit.
export const HTML_BACKGROUND_LIMIT=4*1024*1024
export const HTML_BACKGROUND_LIMIT_LABEL='4MB'
