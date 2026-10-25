// Task data and actions stay with the host. Only bundled presentation assets
// are served here; imported animation packs live in the browser's IndexedDB.
import {registerRunningAssets} from './server/running-assets.js'
import {registerDeliverableNudge} from './server/deliverable-nudge.js'
export const name = 'dsh-ui-beautify'
// 交付物提示必须在 apply 里挂上：白板 agent 不会主动调 present，卡片就空着。
export function apply(root, config) {
  registerDeliverableNudge(root, config)
  return registerRunningAssets(root)
}
