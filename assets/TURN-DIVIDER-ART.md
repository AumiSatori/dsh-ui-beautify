# 对话分隔鲸鱼娘素材

历史素材记录：2026-10-24 按用户要求移除内置分隔鲸鱼娘。下列图片不再由客户端引用或打包；艺术字与分隔线继续保留，只有用户自行导入的图片才显示在右侧。

2026-10-24 使用内置 imagegen 生成，以本机蓝发鲸鱼女仆指针图为造型参考。人物趴着、双手托腮看向观察者，后方双腿交替摆动；不是 ChatGPT Pet。

`turn-divider-maid-source.png` 保存 2×2 四帧透明原图；`turn-divider-maid.png` 是 4×1、每帧 256×192 的界面素材。准备步骤只裁切、等比缩小并按身体底部对齐，没有绘制替代素材。界面按约 132×99 CSS 像素显示，使用 CSS steps 切换。

动效只在当前可见的分隔区域播放，关闭动效、系统减少动态效果或切到后台时暂停。无全屏 Canvas、背景滤镜或持续 JavaScript 帧循环。

## 生成提示词

Use case: stylized-concept. Asset type: 4-frame transparent animation sprite sheet for a tiny desktop UI mascot. Reference image provides the exact blue-haired whale-maid character identity and palette; do NOT draw the floating glove. Make ONE square 1024x1024 sheet with an invisible exact 2x2 grid, each 512x512 cell is one frame of the SAME illustration, same camera, same scale, same body and face positions. No drawn gridlines. Each cell: a cute Japanese chibi blue-haired whale-maid is lying on her stomach horizontally, head on the LEFT and feet extending toward the RIGHT; elbows on the ground, both palms supporting her cheeks/chin, blue eyes looking directly at the viewer, small affectionate smile. Long wavy indigo/cornflower hair, white frilly maid headband, navy maid dress with white apron, socks and black Mary Jane shoes, tiny whale ear fins and a little whale-tail behind the outfit. Modest fully clothed playful relaxed pose. Whole figure fully visible, compact horizontal silhouette occupying roughly cell x=60..455 and y=140..390. Knees bent upward behind her with both little feet clearly distinct above the right end. Animation difference ONLY the lower legs and shoes: frame1 top-left left foot high/right foot low, frame2 top-right both feet midway, frame3 bottom-left left foot low/right foot high, frame4 bottom-right both feet midway returning to frame1. Head, torso, hands, eyes and hair remain aligned and unchanged, to avoid jitter. Crisp clean cel-shaded 2D sticker art, no realistic texture, thick enough indigo outline and thin pale outer outline for dark/light UI. True transparent alpha background across sheet and every cell. No text, letters, arrows, symbols, hand/glove icon, cell numbers, border, ground plane, scenery, shadow blob or watermark. This is a small UI sprite, so prioritize a readable prone chin-in-hands pose and feet moving over minute costume details.
