# ATELIER / 拼图 — 原型约定

产品与功能路线见 `COLLAGE_PLAN.md`；本文件只记录已经由用户确认过的**实现性决定**，
后续改动必须遵守，避免反复回退。

## 视觉规则（用户已确认）

- **禁止毛玻璃**：不使用 `backdrop-blur-*`。浮层（工具条、气泡、弹卡、抽屉）一律用
  不透明底色 token：`bg-studio-card` / `bg-studio-sidebar` / `bg-studio-bg`；
  层次感靠 1px hairline 边框 + `shadow-2xl`，不靠模糊。
- **圆角统一**：
  - 面板 / 工具条 / 浮层 = `rounded-xl`（12px）
  - 面板内部按钮、分段控件、小标签 = `rounded-lg`（8px）
  - 只有真正的圆形图标按钮才用 `rounded-full`；非圆形面板禁止用 `rounded-full` / `rounded-3xl`
- 滚动区内的吸顶标题必须**完全不透明 + 全出血底色**，不允许 `bg-*/95 + backdrop-blur`
  （卡片会从下面透出、糊成一片，看不清标题）。
- 画布上的浮动快捷工具条（风格化 / 裁切 / 替换 / 删除）必须**完整落在画布容器内**，
  左右各留 ≥12px；宽度用 `ResizeObserver` 量测后夹取，不允许被容器裁掉。

## 代码约定

- `studio-*` 颜色是 **hex 值的 CSS 变量**（`src/index.css`），所以 Tailwind 的透明度
  修饰符 `bg-studio-card/60`、`border-studio-accent/40` **不会生成任何 CSS（静默失效）**。
  需要半透明时用真实颜色（`bg-black/85`、`bg-zinc-900`）或新增变量，不要写 `/NN`。
- 编辑/阅读器浮层的动效与圆角在明暗两套主题下都要检查（`html.light` 与默认暗色）。

## 运行与验证

- 开发/生产统一由 `node server.js` 提供，端口 **3001**（双栈）；`.html` 已设 no-cache。
- 任何 `src/` 改动后必须重新构建，否则线上仍是旧包：
  `npx tsc -b && npx vite build`
- 浏览器自查：`agent-browser --session-name atelier`，配合
  `window.__store`（`enterAsGuest()` / `setCurrentView('studio')` / `setActivePanel(...)`
  / `selectElements([id])`）可直接进到需要检查的状态。

## AI 创作工作台（用户已确认）

- **一个聊天 = 一条历史记录**：同一条对话里连续生成多次，只在同一条记录上追加轮次（`roundIndex`），
  侧栏显示「N 轮」；只有点「新建聊天」才会产生新的历史记录。
  刷新页面后仍续在最近一次聊天里（`atelier_creative_active_chat_v1`），不允许把追问拆成第二条记录。
- 参考图必须支持「上传参考图」与「从图库选图」两条入口；发送之后参考图清空，下一轮重新选。
- 生成结果按张独立操作：鼠标悬停图片时图片放大（`scale-[1.08]`），底部浮出 4 个小按钮
  —— 全屏放大 / 下载这一张 / 保存到图库 / 作为参考图。不要再用整排全局「下载 1/2」按钮。
- 画幅比例、生成张数弹窗：选中即自动关闭，点外部 / ESC 也关闭。
- 大图预览（Lightbox）：支持 ESC 直接退出，点背景也可关闭。
- 生成中只保留「已用时 Ns」的真实计时，不要写「正在进行光影渲染…」这类装饰性提示语。

## 品牌（2026-10-18 用户更名）

- 中文名 **留白集**，英文名 **MarginLab**，一句话定位：**极简图片AI调色风格化与艺术拼图排版工具**。
- 落地页：主标题 `留白集`（「集」字做渐变强调），右侧跟 `MarginLab` 等宽字距小字；标语行写上述定位句。
- 顶栏品牌字样统一为 `留白集`，右侧小徽标 `MarginLab`（落地页与工作台顶栏一致）；面包屑用 `留白集 / …`。
- 浏览器标签标题：`留白集 MarginLab · 极简图片AI调色风格化与艺术拼图排版工具`（`index.html`）。
- 仓库：<https://github.com/Danborad/MarginLab>。
- 画册封面 / 书页 / 贴纸 / 导出水印上的英文品牌字样统一为 `MARGINLAB`
  （`MARGINLAB PUBLISHING` / `MARGINLAB ARCHIVE` / `MARGINLAB FINE ART • VOL. 07` / `2026.08 • MARGINLAB`）。
- 画册默认署名 / 落款（作者、出版社、签印）统一为 `MarginLab …`。
- 代码里的内部标识 `DEFAULT_ATELIER_ALBUM` 保留不改（已存数据依赖该 id）。

## 备案信息（2026-10-13 新增，管理员后台）

- 管理员后台新增第 4 个页签「备案信息设置」（`adminModalTab: "filing"`），包含两块：
  **ICP 备案设置** 与 **公安部备案号设置**，两块各有一个**独立开关**（`FilingSwitch`）。
- 只有「开关打开 + 已填号码」才显示在落地页页脚；关闭后立刻隐藏。两块互不影响，可只开其中一项。
- 配置全站共享，落盘在 `server_data/site_config.json`：
  `icpEnabled / icpNumber / icpLink / policeEnabled / policeNumber / policeCode / policeLink`。
- 接口：`GET /api/site/config`（公开，页脚读取）、`POST /api/admin/site/config`（`requireAdmin`，保存）。
- 页脚展示位置：`LandingHomePage` 底部 footer，ICP 备案号与公安备案号各自可点击跳转到查询页。

## 后台设置页排版（用户已确认，2026-10-13）

- 管理员控制台的页签文字**一律单行**：`whitespace-nowrap` + `shrink-0`，
  容器用 `overflow-x-auto no-scrollbar`，窗口变窄时横向滚动，**不允许换行**。
- 页签文案保持精简：`创作者账号 (N)` / `全局 AI 模型配置` / `风格化模板 (N)` / `备案设置`。
- 右上「当前管理员: xxx」在 `xl` 以下隐藏，避免挤占页签空间；显示时也必须 `whitespace-nowrap`。
- 卡片小标题、状态文案（已开启/已关闭）、短提示语同样 `whitespace-nowrap`；只有整段说明句允许自动折行。

## 图片性能约定（2026-10-17 用户反馈：右侧历史页太大、打开很慢）

- **列表/历史栏/素材网格一律用缩略图**，不要直接挂原图：
  前端统一走 `src/lib/thumbs.ts` 的 `thumbOf(src, size)` → `/api/thumb?w=..&src=..`，
  服务端用 ImageMagick 按需生成 webp 并缓存到 `server_data/thumb_cache/`（首次 ~90ms，之后命中缓存）。
- **上传/生成的素材不再以 base64 存进用户 JSON**：`src` 落盘到 `server_data/user_media/<userId>/`，
  返回短 URL；`thumb` 固定写 `/api/thumb?...`。历史遗留的 base64 在读取用户数据时自动搬移（幂等）。
  曾经 `userdata/*.json` 因为塞满 base64 涨到 150MB+，登录/打开要整包传输，这是"打开很慢"的根因。
- AI 历史接口额外返回 `thumbUrl` / `sourceThumbUrl`，前端优先用它。
- 原图只在「大图预览 / 编辑器画布 / 下载」时加载。

## 生成历史折叠约定（2026-10-17 用户反馈：折叠历史、默认只展示最近 10 次）

- 右侧「生成历史」栏默认只渲染**最近 10 次**（`HISTORY_PAGE_SIZE = 10`），
  不要把整份历史一次性塞进 DOM（36 条时曾经一次性渲染 36 张卡片）。
- 底部提供 `展开更多（还剩 N 次）`，每次点击再追加 10 条（`visibleHistoryCount += HISTORY_PAGE_SIZE`）；
  展开后额外显示 `收起，只看最近 10 次`，点击回到 10 条。
- 剩余为 0 时「展开更多」按钮自动消失；历史被删到不足一页时自动折回 10 条（`useEffect` clamp）。
- 追加出来的卡片继续走 `thumbOf` + `loading="lazy"`，图片只在滚进视口附近时才请求。
- 样式沿用极简白底：展开按钮 `rounded-xl border-gray-200 bg-white`，
  收起按钮 `text-gray-400 hover:bg-gray-100`，不用毛玻璃、不用彩色。
  （`src/components/studio/ai/AiQueueInlinePanel.tsx` 的历史列表按同一规则实现，保持两个入口一致。）

## 冲印导出约定（2026-10-18 用户反馈：米家打印「不支持的格式」+ 画面被裁切）

- 实测米家 App 的打印编辑框是 **100 × 148 mm（约 2:3）竖版，不是 3:4**。
  3:4 的画面直接送去，米家「无边框」会按相纸比例放大填满、左右各裁掉约 5%（合计约 10%），
  这就是"打印被裁切"的原因。
- 导出面板默认：**米家 6 寸竖版 100 × 148 mm + 完整不裁切 + 300 DPI** → 输出 **1181 × 1748 px**。
  「完整不裁切」是 contain（整页保留、上下留白），「填满相纸」是 cover（会裁边），默认 contain。
- **JPG 一律走服务端 `/api/print/export` 用 ImageMagick 重编码**：8 位 / sRGB / 无 ICC+EXIF /
  基线（非渐进）/ 写入 300 DPI 密度 / quality 92。浏览器 `canvas.toDataURL('image/jpeg')` 出来的文件
  没有 JFIF 密度、还内嵌一段 ICC 描述文件，米家与部分相册会判「不支持的格式」。
  落盘 `server_data/print_exports/<userId>/print_*.jpg`，静态地址 `/api/print-exports/...`。
- **下载文件后缀必须跟真实编码一致**，统一用 `src/lib/utils.ts` 的 `imageExtFromUrl(src)`。
  PNG 字节被命名成 `.jpg`（或反之）同样会被判格式不支持。
- 相纸尺寸写在 `ExportModal` 的 `PRINT_PAPERS`；像素一律按 `mm ÷ 25.4 × DPI` 现算，不要写死。

## AI 生图兜底约定（2026-10-24 用户反馈：成图与上传照片完全无关）

- **禁止返回与用户照片无关的预制占位图**。曾经 `/api/ai/generate` 在上游超时后会回吐一张
  写死的矢量海报（红圆 + 蓝波浪 + `EASTERN ARTISAN VOGUE` 之类），用户上传汉服人像却拿到抽象画，
  这是严重误导，已整体删除 `generateFallbackStylizedArtwork`（650 行）。
- 现在只有一条兜底路径：`renderPhotoDerivedFallback`（`server.js`）——
  用 ImageMagick **直接处理用户这张照片**（Riso 限色双色 / 明信片上摄影+绘画 / 破框虚化底 + 白框 /
  通用影调重塑），保证任何兜底结果都与上传图强相关。
- 没有源图时**如实返回 502 错误**，不要伪造成功；前端只展示失败态并允许重试。
- 上游超时统一 **240s**（`gpt-image-2.5` 实测 56~150s，150s 会误杀真实任务）。
  超时/失败才走兜底，且响应里明确告知「已用本地渲染基于你的原图生成」。

## 源图解析约定（2026-10-24 用户反馈：点击生成不生成，日志报「无法解析源图片数据」）

- 前端传上来的 `sourceImage` **不止 `data:` 一种形态**，实际上传/图库选择后落盘的是短 URL：
  `/api/user-media/<userId>/<file>`、缩略图包装链 `/api/thumb?w=480&src=...`、
  历史资产 `/api/ai/history-assets/<file>`、public 静态资源 `/covers/...`、
  以及本机绝对地址 `http://192.168.31.63:3001/api/user-media/...`。
- **所有入口必须走统一的 `resolveSourceImageBuffer()`**（`server.js`），它按顺序处理：
  data URI → `/api/thumb` 递归拆包 → 绝对地址（先读盘再走网络）→ 站内相对地址读盘 →
  本机 HTTP 兜底。绝不允许再写「只认 data:」的分支判断，否则用户从图库选图必然失败。
- SVG（历史里的矢量海报）要先用 ImageMagick 转 PNG 再送给上游，上游只接受位图。
- 以后新增任何图片来源（新静态目录、新 CDN、对象存储），只需在
  `resolveLocalImagePath` / `resolvePublicAssetPath` 里加一条规则即可，其它代码不用动。

## 重构进行中的约定（2026-10-28 起，PRD 见 `REFACTOR_PLAN.md`）

- **视觉体系已切换为 Dark UI + 极光氛围**（参考即梦 / 可灵）：
  主背景 `#0A0B0E`，容器 `rgba(255,255,255,0.04~0.08)` + `backdrop-blur(16px)`，
  描边 `1px rgba(255,255,255,0.08)`，强调色极光绿 `#22C55E`。
  **这条覆盖了早先「禁止毛玻璃」的约定**，浮层请用 `.glass-float` / `.glass-panel`。
- 新增组件一律用 `aurora-*` 色板、`.btn-aurora` / `.btn-glass` / `.input-dark` / `.hover-aurora`。
- 存量组件的浅色硬编码（`bg-white` / `text-gray-900` / `border-gray-200` 等）由
  `src/index.css` 末尾的「暗色皮肤兼容层」统一重映射；**不要为改色去逐个改 67 个老组件**。
  真正需要保持纯白的区域（画布纸张、PDF 预览）加 `.preserve-light`。
- 路由：`/admin` 为独立全屏管理后台（`AdminDashboardPage`），未登录或非管理员会被踢回首页。
- 资产体系：用户记录新增 `points / storageQuota / lastCheckInDate`；老账号读取时由
  `ensureUserAssets()` 自动补默认值。积分流水存 `server_data/points_log/<userId>.json`。
- AI 生图**先预扣积分 → 成功确认 / 失败原路退还**，任何新增的失败分支都必须记得退分。
