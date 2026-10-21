# DSH Claude Beautify

为 DeepSeek Harness 提供受 Claude 桌面版启发的右上角任务面板。首版仅调整任务清单的位置与外观。

任务面板固定在**当前聊天列**的右上角，避开会话标题、输入框与右侧预览栏。使用暖灰色卡片、细边框与陶土色强调，支持深色主题、长任务换行、长清单滚动及窄屏自适应。

插件直接修饰 DSH 原有的 React 任务组件，不复制任务、不搬动 React 节点、不读写会话日志。任务更新、折叠、键盘操作及会话隔离仍由 DSH 自己负责。没有任务的会话不会出现面板。

## 环境

- Node.js 22.13 或更高版本。
- DSH Desktop，已验证安装包内 `@deepseek-ai/dsh-client-ui-conversation` 0.2.1-rc.2 的 TodoPanel。
- Git；测试需要开发依赖和 Chrome（或通过 `PLAYWRIGHT_CHANNEL` 选择本机其他 Playwright 浏览器渠道）。

插件运行本身没有额外 npm 依赖，React 由 DSH 提供。

## 安装与启用

将仓库放在长期保留的工具源码目录，然后执行：

```powershell
node scripts/profile.mjs install
node scripts/profile.mjs check
```

默认接入 `$env:DSH_HOME` 或用户目录下 `.dsh` 的 `desktop` profile，可用 `--profile <名称>` 指定其他已有 profile。

安装器建立 `node_modules` junction，登记 `link:` 依赖、锁文件及 `dsh.profile.bundles`，通过包内 `cordis.patch.yml` 挂载；**不改用户 patch 层**。重复安装幂等，遇到已被占用的插件目录或不认识的锁文件结构会停止并保留现场。

**首次增加插件后，需要完全退出 DSH（包括托盘）再启动**，让宿主重新发现客户端插件图。之后只改 `client.js` 时，通常在 DSH 窗口按 `Ctrl+R` 刷新即可。重启前应等当前任务结束。

打开 **设置 → Claude 美化**：

- 启用或关闭右上角任务面板；关闭后立即恢复原位置。
- 调整面板宽度（260–420 px，默认 320 px）；窄屏自动缩小。
- 点击任务标题展开或收起，沿用 DSH 的折叠状态与操作方式。

## 卸载

```powershell
node scripts/profile.mjs uninstall
```

只移除本插件的链接、依赖、锁记录与 bundle 条目，保留仓库和其他插件，然后完全重启 DSH。运行中禁用本插件的客户端实例会清理观察器、样式和定位标记。

## 状态与产物

- 展示设置：当前浏览器 `localStorage["dsh-claude-beautify:settings:v1"]`，只有启用开关和面板宽度，不含任务文本。
- 安装前的 profile 配置备份：工作区 `data/dsh-claude-beautify/install-backups/`，不入 Git。可通过 `DSH_CLAUDE_DATA_DIR` 更改。
- 渲染测试截图：工作区 `outputs/dsh-claude-beautify/`，不入 Git。可通过 `DSH_CLAUDE_OUTPUT_DIR` 更改。
- 不创建聊天缓存、任务副本或后台服务。

## 验证

```powershell
npm ci --ignore-scripts
npm test
npm run test:browser
```

浏览器测试检查右上角定位、原生折叠与键盘操作、动态任务更新、会话切换与空清单、右侧栏缩放、长文本、深色主题、手机宽度、设置持久化、组件重新挂载以及卸载恢复。

本机还可直接提取已安装 DSH 的 TodoPanel 到临时测试页，验证真实组件与插件配合；第三方源码只在内存中使用，不复制到仓库：

```powershell
$env:DSH_ASAR = '<DSH安装目录>\resources\app.asar'
npm run test:browser
```

版本 0.1.0 已通过 5 项 Node 测试和 11 项真实 TodoPanel 浏览器场景，浅色、深色与窄屏截图均已检查。此验证覆盖已安装组件的受控渲染，当前桌面会话内的加载效果仍须在宿主重启后确认。

## 兼容边界

依赖 DSH 的稳定 DOM 标记 `data-testid="todo-panel"`、`data-conversation-content`、`data-composer-seat`，不依赖构建生成的 CSS 类名。未来宿主若移除这些标记，插件会保留原清单位置。极窄或不可见的聊天列也恢复原布局。

任务面板以浮层展示，展开时会覆盖右上角的一部分聊天内容，可点击标题收起或在设置中关闭。浏览器偏好按设备保存；不会把展示偏好同步到服务器。

这是独立的 DSH 扩展，与 Anthropic、Claude 或 DeepSeek 官方没有隶属关系；不包含它们的商标图片或专有资源。

## 托管

仓库：`AumiSatori/dsh-claude-beautify`，GitHub private。运行配置、备份、截图和聊天数据不上传。
