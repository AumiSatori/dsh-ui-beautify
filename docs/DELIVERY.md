# 安装、兼容与交付验证

## 使用者

在 DSH 的插件页搜索 **UI动效美化** 或内部包名 `dsh-claude-beautify`，确认来源为 **AumiSatori/dsh-ui-beautify**。市场收录以社区目录 PR 合并和索引刷新为准，发布 GitHub Release 不等于已进入市场。

也可从本仓库最新 Release 下载 `dsh-claude-beautify.tgz`，在 DSH 插件安装入口填写其公开下载地址。Web profile 可使用：

```sh
dsh plugin --profile web add https://github.com/AumiSatori/dsh-ui-beautify/releases/latest/download/dsh-claude-beautify.tgz
```

安装包含预构建 `client.js`，不需要开发依赖、不执行安装期构建。首次安装后按宿主提示重载；客户端更新通常 Ctrl+R 即可。展示设置在 **设置 → UI动效美化**。所有样式的默认选项排在前面。

本地源码链接版保留现有安装方式；不要在同一 profile 同时登记源码链接和市场包。切换安装来源时，先在插件管理器移除旧登记，再安装新来源；本机偏好与素材保留在浏览器来源中。

## 兼容范围

- 实际回归宿主：本机应用归档内 `@deepseek-ai/dsh` 和 UI 包均为 **0.2.1-rc.2**，独立于桌面外壳版本。
- 声明的宿主范围：`>=0.2.1-rc.2 <0.3.0-0`；后续大版本需重新验证。Node.js 22.13+。
- 测试浏览器：Windows 上已安装的 Chrome；窄屏、暗色、减少动态效果、强制颜色及 GPU/Canvas 降级有专门用例。
- 桌面与 Web 使用同一客户端。未声称已验证所有操作系统或第三方客户端。
- 字体、用户图片/视频、SVG 与 HTML 保存在当前浏览器来源；不随账号自动跨设备同步。
- 本卡片的 Artifact 阅读器不接管其他插件接口；多个预览窗口可能重叠。需要外部脚本、相邻文件或网络请求的 HTML 请用原生入口打开。

## 维护者交付流程

0.3.70 交付回归结果：**37 组全部通过，442 项具名检查**。其中包含实际宿主组件、已安装推理滑块和外部 Artifact 预览的集成验证；GPU/Canvas 与性能检查也通过。完整无日志摘要见 [validation-0.3.70.json](validation-0.3.70.json)。记录绑定到被验证客户端的 SHA-256，失败的旧检查已修正后复验，不以跳过代替通过。

```sh
npm ci
npm run build:lens
npm run check:lens
npm run check:release
npm run test:release
```

完整浏览器验证需要本机 Chrome。将 `DSH_ASAR` 指向本机应用归档，`DSH_CLAUDE_OUTPUT_DIR` 指向临时输出目录，`FFMPEG` 指向本机 FFmpeg；可选 `DSH_SLIDER_CLIENT` 和 `DSH_ARTIFACT_CLIENT` 指向已安装配套插件的客户端，加入真实集成检查。测试只读取宿主组件代码，界面中的内容均为合成数据。

`test:release` 依次运行 `package.json` 中全部 `test` / `test:*`（自身除外），每项保留日志，输出 `release-verification/report.json`。`npm run test:release -- --rerun-failed` 只复验失败项并合并报告、保留之前尝试；用 `--only=test:settings,test:artifact` 可单独定位。失败不能以旧的通过结果代替。

发版必须包含带版本安装包及固定名 `dsh-claude-beautify.tgz`，并记录 SHA-256。校验工作树、远端提交和下载后的包内容后，更新或提交社区市场条目。市场提交只改本插件的一份 YAML；不要编辑生成的市场 README。

## 数据与许可

运行时没有额外包依赖，不增加遥测或远程素材请求。用户显式加载的 HTML 背景和自定义样式仍需按文档所述使用。发布包不包含 profile、认证、聊天记录、缓存、测试日志或开发用截图。

代码使用 MIT。可选鲸鱼娘素材并非 MIT，受 CC BY-NC-SA 4.0 的非商业和相同方式共享要求约束，详见根目录 THIRD_PARTY_NOTICES.md 与素材说明；市场截图使用合成内容，不包含用户会话。
