// Workspace reads and application selection stay with the host. A local-only
// Windows endpoint copies explicitly selected files to the native clipboard.
import {registerRunningAssets} from './server/running-assets.js'
import {registerDeliverableNudge} from './server/deliverable-nudge.js'
import {registerFileClipboard} from './server/file-clipboard.js'
export const name = 'dsh-ui-beautify'
// 交付物提示必须在 apply 里挂上：白板 agent 不会主动调 present，卡片就空着。
export function apply(root, config) {
  registerDeliverableNudge(root, config)
  registerFileClipboard(root)
  return registerRunningAssets(root)
}
