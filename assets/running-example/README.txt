DSH 思考动图包 · 导入格式示例

一、直接试用
本 ZIP 可以直接拖进“思考动图”的虚线框，或点击“导入 ZIP 动图包”。
也可以解压后，点击“导入文件夹”选择解压目录。
导入会新增“动图格式示例”，不会删除已有动图包。

二、示例目录
manifest.json  动图包说明（UTF-8、标准 JSON，不写注释）
example.webp   鲸鱼娘“东张西望”精灵图
README.txt     本说明
LICENSE        示例素材的来源和授权

三、普通 GIF / APNG / 动态 WebP
最简单的方式：把每个完整动作保存成一个图片文件，放进同一文件夹后压缩成 ZIP。
不需要 manifest.json，图片文件名就是动作名称。
若要自定义包名或动作名，可以使用下面的 manifest.json：

{
  "format": "dsh-running-pack",
  "version": 1,
  "name": "我的动图包",
  "author": "作者名",
  "license": "自己的素材授权说明",
  "actions": [
    { "id": "working", "name": "认真工作", "file": "工作.gif" },
    { "id": "resting", "name": "休息一下", "file": "休息.webp" }
  ]
}

这两个文件名仅用于说明；换成自己的素材时，请同时修改 file 和实际图片文件名。

四、精灵图
本包的 example.webp 是静态精灵表，必须保留 manifest.json 中的 type: "sprite"。
它有 60 帧，每行 10 格，共 6 行；每格 64×64，整图 640×384，播放速度 12.5 帧/秒。
帧按从左到右、从上到下排列，每格必须是等大的正方形，没有格间距。
替换自己的精灵图后，请同步修改 file、frames、columns、fps。
frames：2–240；columns：1–frames；fps：1–30，省略时为 12.5。
不要删除说明后把整张精灵表当普通动图导入，否则显示的是整张拼图。

五、重新打包
图片路径相对于 manifest.json；可放在子目录，使用 / 分隔。
动作 id 在包内必须唯一，只用英文、数字、下划线或短横线。
选中 manifest.json、图片和说明一起压缩成 ZIP，或把它们所在的文件夹压缩成 ZIP。
普通图片和精灵图可以放在同一个包里，每个精灵图动作单独声明参数。

六、格式与限制
支持 GIF、PNG/APNG、WebP，不支持 SVG、HTML、网络地址、RAR、7z 或加密 ZIP。
最多 100 个动作、128 个文件；单张 ≤8 MB，素材合计 ≤96 MB，ZIP ≤100 MB。
图片最长边 ≤4096 像素、最多约 800 万像素；manifest.json ≤64 KB。
导入包保存在当前浏览器的本机存储；桌面窗口和其他浏览器需分别导入，请保留原 ZIP。

七、素材来源
example.webp 复用插件内置的鲸鱼娘“东张西望”动作，来源：
https://github.com/yanzwzz/dsh-whale-girl-pet
角色：上善无形原型 / ZipZipPipe 女仆二创，角色 CC BY-NC-SA 4.0。
建议个人非商业使用；完整素材许可见 LICENSE。替换素材时请填写实际作者和授权。
