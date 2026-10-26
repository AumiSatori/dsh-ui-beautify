// The host paints the opening frame (theme and whale logo) before React mounts.
// Leaving the last painted values behind lets that frame match the theme and
// logo the session is returning to instead of flashing the default ones.
const OPENING_THEME_KEY='dsh-ui-beautify:opening-theme:v1',OPENING_LOGO_KEY='dsh-ui-beautify:opening-logo:v1'

export function cacheOpeningAppearance(doc,win,cache){
  try{
    win.localStorage.setItem(OPENING_THEME_KEY,doc.body.hasAttribute('data-ds-dark-theme')?'dark':'light')
    if(cache){
      const node=cache.node?.matches?.('svg')?cache.node:cache.node?.querySelector?.('svg')
      const path=node?.querySelector?.('path')
      if(path)win.localStorage.setItem(OPENING_LOGO_KEY,JSON.stringify({viewBox:node.getAttribute('viewBox'),path:path.getAttribute('d')}))
    }
  }catch{}
}
