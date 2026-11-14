// Public constants shared by the bundled client and the Node host route.
export const PRESET_PACKAGE_LIMIT=64*1024*1024
export const MARKET_REPO='AumiSatori/dsh-ui-beautify'
export const MARKET_RAW=`https://raw.githubusercontent.com/${MARKET_REPO}/main/market/catalog.json`
export const MARKET_CDN=`https://cdn.jsdelivr.net/gh/${MARKET_REPO}@main/market/catalog.json`
// catalog-v2.json lists every preset; catalog.json keeps only the entries
// 0.6.0-0.6.3 accept, because those versions reject the whole list otherwise.
export const MARKET_RAW_V2=`https://raw.githubusercontent.com/${MARKET_REPO}/main/market/catalog-v2.json`
export const MARKET_CDN_V2=`https://cdn.jsdelivr.net/gh/${MARKET_REPO}@main/market/catalog-v2.json`
