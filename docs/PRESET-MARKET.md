# 预设市场

入口：**设置 → dsh-UI美化 → 全局配置 → 预设市场**。「全局配置」下分为「本机配置」和「预设市场」两个子 TAB；市场包含「发现」和「投稿」，通过受审核的公开 GitHub 目录分享预设，无需为插件配置 GitHub token。

## 发现与应用

- 按「整套 / 单项」、分类、官方 / 社区来源、名称、作者和标签筛选。
- 整套预设替换整套美化配置及两种聊天宽度；单项预设只替换对应设置和素材。聊天宽度分类只调整两种宽度。
- 单项分类：任务面板、输入栏、侧栏、全图背景、粒子背景、开屏欢迎、欢迎语、思考动图、消息气泡、回合分割线、回合卡片、对话动效、工具栏、聊天宽度。
- 点击「查看预设」先下载、校验并查看应用范围，再选择「应用预设」或「保存到本机预设」。保存后可在「全局配置」中切换，旧的本机预设继续可用。
- 应用复用现有导入的事务回退和撤销能力。「全局配置」中的「撤销上次应用」可恢复应用前设置及被替换的素材；需要重载的素材会按原有方式提示刷新。
- 市场不再自带默认预设。网络不可用时使用最近 30 天内的缓存目录；没有可用缓存时展示空状态。首批 5 个示例已从在线目录与内置回退中移除，旧镜像和旧缓存中的这些示例也会被过滤。
- 卡片默认显示风格示意；投稿可以提供真实截图作为封面。查看详情不会运行包内的自定义动画或代码；应用后沿用各功能已有的隔离方式。

## 社区投稿

1. 先将当前美化配置调整为准备分享的样式，进入「投稿」。
2. 填写名称、公开署名、ID、版本、简介、分类、标签和许可，按需选择封面。许可可选 CC-BY-4.0、CC-BY-SA-4.0、CC-BY-NC-SA-4.0、CC0-1.0、MIT；素材本身是 CC BY-NC-SA 的二创（如同人角色立绘）只能选 CC-BY-NC-SA-4.0，并在简介中写明原作者与二创作者。详情页对该许可标注「仅限非商业使用，改编须以相同许可分享」，发布说明同样注明。
3. 确认有权分享素材并检查内容后，点击「导出投稿包」。单个 ZIP 最多 64 MB；封面最多 4 MB。
4. 点击「打开 GitHub 投稿页」，登录 GitHub，将刚下载的 ZIP 拖入「投稿 ZIP」，补充素材来源后提交。
5. 等待维护者审核。提交 issue、上传 ZIP、在本机导入预设都不会直接上架。

投稿只打包所选分类及引用的素材，不打包本机其他预设、素材导入历史、浏览器其他存储、聊天或登录信息。打包时会阻止常见凭据、本机文件地址和不安全字段；投稿者仍须自行检查素材、文案和代码。原有完整备份保持原来的行为，不受市场共享筛选影响。

包格式由插件生成，不是通用 ZIP 导入接口：根目录固定为 `manifest.json`、`config.dshui`，以及可选 `cover.png` / `cover.jpg` / `cover.webp`。配置和二进制素材校验 SHA-256，ZIP 条目校验 CRC32，禁止额外文件、目录路径、重复条目、压缩炸弹及分类越界。

## 维护者审核与官方上传

市场目录位于 `market/catalog.json`，包体托管在本仓库 GitHub Releases。目录与源码使用同一个仓库的权限边界。官方标识由发布身份生成，用户上传包不能自封「官方」。

审核社区投稿：

1. 检查预设效果、素材来源与许可、包内 HTML / CSS / 代码，以及是否包含私人信息。必要时下载投稿 ZIP，运行：

   ```sh
   node scripts/preset-market.mjs validate --file /path/to/preset.zip
   ```

2. 同意收录时，为投稿 issue 添加 **`preset-approved`** 标签。只有仓库具有 `write`、`maintain` 或 `admin` 权限的维护者能触发有效发布。不同意时说明原因，使用 `preset-rejected` 标签；不要添加审核通过标签。
3. 查看 Actions 的 **Preset market review and publication** 结果。它从审核事件中的 ZIP 附件读取包，重新校验，上传不可变版本的预设 Release，再更新 `main` 中的目录。社区更新只能更新原投稿账号的预设 ID，必须提高版本号，不能改变来源或分类。

官方上传有两种入口：

- 在插件内导出投稿包并上传为 GitHub 附件，然后在 Actions 中手动运行 **Preset market review and publication**，填入附件 URL。
- 维护者在干净的 `main` 工作树使用本机已登录的 `gh`：

  ```sh
  node scripts/preset-market.mjs publish --official --file /path/to/preset.zip --dry-run
  node scripts/preset-market.mjs publish --official --file /path/to/preset.zip
  ```

第二条命令才会上传预设 Release、提交并推送目录。`--dry-run` 只验证并展示计划。`GH_PATH` 可指定 `gh` 可执行文件。预设 Release 使用 `preset-<id>-v<version>`，不会成为插件的 Latest Release，也不会发布 npm 包。

仓库需要启用 Actions，并允许该工作流使用 `contents: write`。审核与官方发布串行执行。若资源上传成功但目录推送失败，工作流会明确失败；修复原因后需先核对 Release 与目录，不能覆盖已发布版本。

## 开发与接入

- 客户端优先读取宿主同源 `/dsh-ui-beautify/preset-market/catalog`，并与官方 raw / jsDelivr 目录并发回退。目录与包下载均有超时及流式大小限制。
- 社区包经宿主 `/dsh-ui-beautify/preset-market/package?id=...&version=...` 下载，以避免 GitHub Release 的跨域限制。服务端只下载目录列出的本仓库 Release，拒绝跨站调用、写请求和任意 URL 代理。
- 首次增加后端路由后，需要**完全退出 DSH（包括托盘）再启动**；后续纯客户端变更可刷新窗口。未加载新路由时仍可浏览随插件提供的官方预设，社区包下载需重启后使用。
- `market/catalog.json` 同时作为离线官方目录打入客户端；构建命令为 `npm run build:lens`。
- `npm run market:validate` 检查目录；`node --test test/preset-market.test.mjs` 检查格式、分类隔离、审核规则和路由；`npm run test:preset-market` 使用模拟接口验证完整浏览器流程，不产生真实投稿或发布。
- 浏览器截图与检查报告位于工作区 `outputs/dsh-ui-beautify/preset-market/`，可用 `DSH_CLAUDE_OUTPUT_DIR` 指定输出根目录。

当前实现与验证不代表已经发布新的插件版本，也未代替用户提交真实投稿或触发真实预设 Release。上架内容以 `main` 中的审核目录为准。
