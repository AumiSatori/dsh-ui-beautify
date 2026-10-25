# 底部统计弹层过渡（开发稿）

范围：输入栏下方「轮次 / 步数 / 速度」「Token 用量 / 缓存命中 / 费用」「上下文已用」三个原生入口打开的面板。

展开使用 `src/motion.js` 的 280ms smooth 曲线、8px 上浮和 1px 到 0 的轻微模糊；关闭使用 180ms exit 曲线。连续关开同一种面板时，从当前画面接回。宿主仍处理数据、定位、点击外部和 Escape；动效不延迟原生关闭和焦点操作。

入场直接使用原生节点。宿主关闭时立即卸载原节点，动效只短暂保留最多 120 个后代节点的小面板视觉副本；副本 inert、对辅助技术隐藏、无重复 ID、不接收指针，退场后删除。不会复制聊天或重算全历史。

只观察 body 直接子节点及已识别面板的 style；没有常驻绘制循环。减少动态效果、强制颜色、隐藏窗口、关闭插件和卸载时立即停止并释放动画。上下文面板类名从当前宿主 ContextMeter 样式元数据读取，不硬编码构建哈希或中文标题。

## 本地验证页

```powershell
$env:DSH_ASAR='D:\Program Files\DeepSeek Harness\resources\app.asar'
node test/stat-popover-fixture.mjs
```

用浏览器控制接口打开输出的 loopback URL，点击「运行完整检查」。页面使用本机安装包里的原始 DialogPill、ContextMeter、useStatDialog 与原生 CSS，合成统计数据；只替代公开的定位/外部点击 hook。完整检查含开合中间帧、快速反向、连续切换、固定位置、Escape、草稿/滚动保持、关闭/卸载/重装、模拟动效偏好变更和后台事件。按钮「展示动画中间帧」冻结在 90 / 280ms，便于视觉核对。

另用浏览器检查明暗主题及 520px 窄屏，保存截图到集合目录 `.scratch/status-popover-qa/`。按集合目录 AGENTS.md 最新规则，开发验证通过后自动同步本机当前 DSH 开发目录；提交、推送、合并与发布仍需明确要求。

此开发稿基于 `v0.3.72 / 2189a39`，独立开发分支 `work/status-popover-motion`，已备份并同步到 `.scratch/dsh-ui-ios-settings` 的 `work/ui-animation-packs`；仅合入本次源码、入口、生成 bundle 与说明，保留该目录原有功能。目标版本未定；未提交、推送、合并或发布。同步文件及前后哈希记录在 `.scratch/status-popover-qa/sync-manifest.json`。

已完成验证：独立开发分支 64 项现有单元测试通过；同步后的美化开发目录 70 项单元测试通过，语法与 bundle 一致性检查通过；验证页的 6 组浏览器检查通过。另已核对浅色中间帧、深色面板、520px 窄屏、Enter 打开及 Escape 关闭。模拟动效偏好/后台事件的检查通过；操作系统真实强制颜色模式尚未实测。

本机 DSH 已通过统一脚本重启并加载新资源，`http://localhost:8442/` 实测三个原生面板均带入场中间帧，开合切换和 Enter / Escape 正常；退场副本为 inert、aria-hidden 且不接收指针，退场结束后活动节点、副本与移动标记全部为 0，输入草稿保持为空，新测试页面无控制台错误。截图与结果见 `.scratch/status-popover-qa/runtime-{performance,usage,context}.jpg` 和 `runtime-check.json`。重启前旧页面曾出现宿主会话引用已释放及控制连接超时，重启后新测试页已恢复；没有修改宿主代码或清除用户数据。

本次文件范围：`src/stat-popover-motion.js`、`src/lens-actions.js`、生成的 `client.js`、`test/stat-popover-fixture.mjs`、本说明与根目录 README。当前运行目录 `.scratch/dsh-ui-ios-settings` 的其他开发改动保持原样。
