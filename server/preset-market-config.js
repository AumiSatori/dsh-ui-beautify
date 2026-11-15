// Public constants shared by the bundled client and the Node host route.
export const PRESET_PACKAGE_LIMIT=64*1024*1024
export const MARKET_REPO='AumiSatori/dsh-ui-beautify'
export const MARKET_RAW=`https://raw.githubusercontent.com/${MARKET_REPO}/main/market/catalog.json`
export const MARKET_CDN=`https://cdn.jsdelivr.net/gh/${MARKET_REPO}@main/market/catalog.json`
// catalog-v2.json lists every preset; catalog.json keeps only the entries
// 0.6.0-0.6.3 accept, because those versions reject the whole list otherwise.
export const MARKET_RAW_V2=`https://raw.githubusercontent.com/${MARKET_REPO}/main/market/catalog-v2.json`
export const MARKET_CDN_V2=`https://cdn.jsdelivr.net/gh/${MARKET_REPO}@main/market/catalog-v2.json`
// How recent a catalog is: its newest publication time. Mirrors and browser
// caches can return an older copy (jsDelivr asks browsers to keep @main for 7
// days), so the newest of several answers wins, never just the fastest.
export function catalogFreshness(raw){
  let time=Date.parse(raw?.updatedAt)||0
  for(const item of Array.isArray(raw?.presets)?raw.presets:[]){const value=Date.parse(item?.publishedAt);if(value>time)time=value}
  return time
}
// Resolve with the freshest successful result: after the first success the
// others get a short grace period; rejects only when every source fails.
export function newestOf(tasks,{grace=1200,freshness=()=>0}={}){
  return new Promise((resolve,reject)=>{
    let best=null,pending=tasks.length,timer=null,done=false
    const errors=[],finish=()=>{if(done)return;done=true;clearTimeout(timer);best?resolve(best.value):reject(new AggregateError(errors,'市场目录暂不可用。'))}
    if(!pending){finish();return}
    for(const task of tasks)Promise.resolve(task).then(value=>{const rank=freshness(value);if(!best||rank>best.rank)best={value,rank};if(!timer&&!done)timer=setTimeout(finish,grace)},error=>{errors.push(error)}).finally(()=>{if(--pending===0)finish()})
  })
}
