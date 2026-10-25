// 交付物登记提示。
//
// 本插件的任务卡 Artifact 预览只认 `deliverables/presented` 事件，而这个事件
// 只有模型主动调用 present 才会产生。白板用户（没写过 AGENTS.md 的）默认不会
// 主动调，卡片输出区就一直空着。
//
// 所以随插件注入一小节系统提示：装插件即生效，不依赖、也不改写用户的
// AGENTS.md。注入点走 cordis 的 `system-prompt/assemble`，与 dsh-meme 注入
// 斗图规则的方式一致。
//
// 关闭方式：cordis 配置项 `deliverableNudge: false`；文案可整段替换成
// `deliverableNudgeText`。

const SECTION_NAME = 'dsh-ui-beautify:deliverables'

const DEFAULT_TEXT = [
  '交付规则:本轮只要新建或改动了准备给用户打开的文件(网页、图片、Markdown、PDF、表格、压缩包、音视频等),结束前必须调用 present 登记为交付物,每个文件一条,description 写清它是什么。',
  '- 纯聊天、只读查资料、临时脚本、日志、缓存不登记;写过的源码文件本身不算交付物。',
  '- 路径必须真实存在,别用 .scratch/、node_modules/、dist/、build/ 这类被忽略目录,否则用户打不开。',
].join('\n')

export function registerDeliverableNudge(root, config = {}) {
  if (config?.deliverableNudge === false) return
  if (!root || typeof root.on !== 'function') return
  const custom = typeof config?.deliverableNudgeText === 'string' ? config.deliverableNudgeText.trim() : ''
  const text = custom || DEFAULT_TEXT
  root.on('system-prompt/assemble', async (_assembly, _context, next) => {
    const assembled = await next()
    const sections = assembled?.sections
    if (!Array.isArray(sections)) return assembled
    if (sections.some((section) => section?.name === SECTION_NAME)) return assembled
    sections.push({ name: SECTION_NAME, text })
    return assembled
  })
}
