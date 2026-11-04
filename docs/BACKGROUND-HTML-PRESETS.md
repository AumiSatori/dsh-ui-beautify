# HTML 动态背景预设（镜海）

设置 → 界面与外观 → dsh-UI美化 → 布局 → 全图背景 → 展开「✦ HTML 动态背景」，顶部两张预设卡片：
**镜海**（本次新增）、**深海极光**（原有）。点卡片会把代码载入编辑器并立刻预览，再点「应用 HTML 背景」保存为一份本机 HTML 背景素材。

## 镜海做了什么

`src/background-mirror-sea.js` 把两张同构图壁纸（日间 / 夜间）**超分后定在 2K（2560×1440）**、压成 WebP q90 后内联，整个场景是纯 Canvas 2D：

| 效果 | 实现 |
| --- | --- |
| 昼夜过渡 | **跟随宿主主题**：浅色主题显示日间图、深色主题显示夜间图，切换时约 0.7s 交叉淡化。宿主通过 `{type:'dcb-background-theme',theme:'light'|'dark'}` 推送，iframe 每次重新加载后会再推一次；没有收到主题消息时才退回 `prefers-color-scheme`。与本地时间无关。 |
| 海面涟漪 | 地平线（画面 0.528 高度）以下按扫描线条带逐行横向位移，位移幅度随离镜面的距离增大；另加地平线微光与角色倒影处的同心圈 |
| 光斑粒子 | 28 个预渲染径向渐变光点，白天偏暖、夜里偏冷（配色随昼夜插值），叠加 `lighter` 混合 |
| 鼠标视差 | 底图与粒子的取样窗口按指针位置做 ±8~16px 偏移；宿主通过 `dcb-background-pointer` 消息传入，iframe 内也监听指针 |
| 减少动态效果 | `prefers-reduced-motion: reduce` 时只画一张静态底图，不跑 `requestAnimationFrame`，也即无涟漪、无粒子、无视差；切换主题仍然即时生效 |

## 体积与安全

- 图片在构建时由 esbuild 的 `dataurl` loader 内联（`scripts/build-lens.mjs` 已支持 `.webp`），运行时零请求。
- 超分链路：`realesrgan-ncnn-vulkan`（`realesrgan-x4plus-anime`，4× 到 6688×3764）→ Lanczos 缩到 2560×1440 → WebP q90。
- 两张源图 1672×941：日间 1.86MB / 夜间 2.38MB → 2K WebP **日间 311.4KB / 夜间 511.3KB**；base64 约 1.07MB，整份预设 HTML 约 1.1MB，占 4MB 上限的 27%。
- 只使用 `data:image/webp` 与内联脚本，符合 `htmlDocument()` 的 CSP（`default-src 'none'; script-src 'unsafe-inline'; img-src data: blob:`）：`test/background-mirror-sea-browser.mjs` 会断言文档里没有 `http(s)`、`fetch(`、`XMLHttpRequest`、`import(`、外链 `<script>`/`<link>`。
- HTML 背景上限从 2MB 放宽到 **4MB**（`src/background-html-limits.js`，编辑器导入、预览与应用三处共用；超限提示同步为「HTML 需小于 4MB」）。预设文档必须留在 3MB 以内，测试会断言这条余量。

## 首帧与节流

`resize()` 在图片解码完成后**同步**画一帧，不依赖 `requestAnimationFrame`。预览 iframe 在部分环境里帧时钟被节流（宿主设置页里的 iframe 实测约 1fps），没有这一笔就会显示空白画布。

## 验证

```bash
npm run test:background-mirror-sea   # 内联体积、无外链、涟漪动画、主题日夜切换、系统配色兜底、视差、减少动态效果静态
npm run test:background              # 全图背景完整流程（含 HTML 预览、应用、素材库）
npm run build:lens                   # 改 src 后必须重建 client.js
```
