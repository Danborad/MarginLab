# 高级感 Web 拼图排版软件方案

> 目标：做一个面向创意工作者的 Web 拼图排版工具，支持图片自由拼贴、图层编辑、裁切、文字排版、模板和高质量导出。
>
> 产品形态：纯 Web，优先支持桌面浏览器，不做原生 App。

## 1. 结论先行

推荐把产品定义为：

> **自由画布 Moodboard + 高级拼贴编辑器 + 轻量海报排版工具**

第一版不要从“几十种拼图模板”开始，而应该先做好以下体验：

- 图片拖入画布后可以自然地移动、缩放、旋转和裁切
- 图片之间可以叠放、对齐、分组和调整层级
- 用户可以自由控制留白、边框、圆角和画布比例
- 常用尺寸可以一键创建，例如社交媒体、桌面壁纸、海报和演示文稿
- 导出结果清晰、稳定，不能出现模糊、错位或字体替换

高级感主要来自版式、留白、动效和交互细节，而不是堆叠更多功能。

## 2. 产品定位

### 2.1 目标用户

- 摄影师和视觉设计师
- 时尚、家居、旅行和品牌内容创作者
- 需要制作 Moodboard、Lookbook、灵感板的人
- 需要快速做社交媒体视觉素材的个人用户
- 需要把多张图片整理成一张高级海报的普通用户

### 2.2 核心使用场景

1. 上传一组图片，快速生成一张具有秩序感的拼图海报。
2. 从空白画布开始，自由搭建 Moodboard。
3. 使用模板快速完成社交媒体、作品集或产品展示图。
4. 将图片、文字、色块和装饰元素组合成视觉故事。
5. 导出 PNG、JPG 或 PDF，用于发布、打印或分享。

### 2.3 不建议的第一版方向

- 复杂的多人实时协作
- 视频编辑和时间轴
- 完整的 Photoshop 级滤镜系统
- 复杂的矢量路径编辑
- 图片素材社区和社交推荐算法
- 同时适配所有移动端手势和小屏编辑体验

这些能力都可以作为后续路线，但会显著扩大编辑器、渲染和数据同步的复杂度。

## 3. 参考项目与借鉴方式

### 3.1 GitHub 技术项目

| 项目 | 适合研究什么 | 是否建议直接采用 |
| --- | --- | --- |
| [Penpot](https://github.com/penpot/penpot) | 完整设计工具的画布、图层、页面、组件、协作和文件模型 | 适合研究架构，不建议整体 Fork |
| [tldraw](https://github.com/tldraw/tldraw) | 无限画布、对象模型、自定义图形、画布交互 | 适合快速验证无限画布，但商业生产环境需单独确认授权 |
| [Fabric.js](https://github.com/fabricjs/fabric.js) | Canvas 对象模型、选择、变换、分组、序列化和 SVG 导入导出 | 适合海报和设计编辑器 |
| [Konva](https://github.com/konvajs/konva) | Canvas 场景图、事件系统、拖动、变换、缓存和高清导出 | 适合自由画布和高性能编辑器 |
| [React Konva](https://github.com/konvajs/react-konva) | React 与 Konva 的声明式结合 | 使用 Konva 时建议一并评估 |
| [Moveable](https://github.com/daybrush/moveable) | 拖动、缩放、旋转、倾斜、吸附、多选和组操作 | 适合作为交互层 |
| [Cropper.js](https://github.com/fengyuanchen/cropperjs) | 图片裁切、比例裁切、裁切框和图片位置调整 | 适合作为图片裁切基础 |
| [Muuri](https://github.com/haltu/muuri) | 可拖拽网格、排序、过滤和自动排列 | 适合模板布局或自动拼图 |

### 3.2 商业 SDK 参考

| 项目 | 价值 | 适合情况 |
| --- | --- | --- |
| [Polotno SDK](https://polotno.com/sdk/product/features) | 已经提供较完整的画布编辑器、图层、缩放、吸附、页面和导出能力 | 想快速上线，且可以接受商业 SDK 成本 |

Polotno 更适合“买基础设施，专注产品体验”的路线；Konva 或 Fabric.js 更适合“自己掌握编辑器核心能力”的路线。

## 4. 产品体验参考

| 产品 | 重点研究方向 | 适合借鉴的部分 |
| --- | --- | --- |
| [Shuffles](https://www.shffls.com/) | 数字拼贴和创意表达 | 抠图、图层、旋转、缩放、叠放、动效和低门槛创作 |
| [Milanote](https://milanote.com/) | 创意项目视觉工作区 | 图片、文字、链接和文件的自由组织 |
| [Kosmik](https://www.kosmik.app/) | 无限画布和视觉研究 | 无限画布、素材采集、浏览器内容和视觉关系 |
| [Are.na](https://www.are.na/) | 视觉研究和内容组织 | 内容块、收藏、频道、来源和克制的视觉系统 |
| [PureRef](https://www.pureref.com/) | 参考图板 | 快速导入、自由摆放、极低干扰和高效浏览 |

这些产品不一定要照搬视觉风格。建议分别研究它们的交互逻辑，再形成自己的品牌语言。

## 5. 推荐技术路线

### 5.1 推荐方案：Konva 作为画布核心

```text
React
TypeScript
Konva / React Konva
Moveable 或自定义 Transformer
Cropper.js
Zustand
Vite
Tailwind CSS 或 CSS Modules
Playwright
PNG/JPG 导出：Canvas
PDF 导出：服务端或浏览器 PDF 渲染方案
```

选择 Konva 的原因：

- 有场景图，比较适合管理图片、文字、形状和分组
- 适合实现多个对象、图层和复杂交互
- 支持序列化，便于保存为 JSON 文档
- 支持高清导出和缓存
- MIT License，商业使用限制相对简单

### 5.2 Fabric.js 方案

如果产品更偏“海报设计器”和“模板编辑器”，可以选择 Fabric.js：

- 对象模型比较直接
- 文本编辑和 SVG 相关能力较方便
- 分组、选区、缩放和旋转上手较快
- 更适合围绕设计元素搭建编辑器

### 5.3 选型建议

| 产品重点 | 推荐 |
| --- | --- |
| 无限画布、自由拼贴、Moodboard | Konva + React |
| 固定画布、海报、模板编辑 | Fabric.js |
| 自动拼图和可拖拽网格 | Muuri 或自研布局算法 |
| 尽快做出完整商业版本 | Polotno SDK |
| 商业项目使用 tldraw | 先完成授权和成本评估 |

**本项目默认建议：React + TypeScript + Konva + Moveable + Cropper.js。**

## 6. 功能规划

### 6.1 MVP：第一版必须有

#### 画布

- 创建空白画布
- 预设画布尺寸和自定义尺寸
- 缩放、平移和适应窗口
- 画布背景色
- 画布边界和安全区域

#### 图片

- 本地上传图片
- 拖拽图片进入画布
- 图片移动、缩放和旋转
- `cover` / `contain` 图片填充模式
- 图片框内裁切和重新定位
- 圆角、透明度、边框和阴影

#### 图层

- 置顶、置底、上移、下移
- 图层列表
- 图层锁定和隐藏
- 多选和分组
- 删除、复制和粘贴

#### 排版

- 左右和上下对齐
- 等间距分布
- 对齐辅助线
- 网格吸附
- 组合整体缩放

#### 文本和形状

- 单行文本和多行文本
- 字体、字号、字重、颜色和行高
- 矩形、圆形和线条
- 色块作为图片底板或装饰元素

#### 编辑与导出

- 撤销和重做
- 快捷键
- PNG、JPG 导出
- 导出倍率设置
- 自动保存到浏览器本地

### 6.2 第二阶段

- 拼图模板
- 自动排版和随机排列
- 图片批量替换
- 多页面文档
- 作品历史版本
- 分享链接和只读预览
- 图片滤镜和基础调色
- 文字样式预设
- 品牌色和品牌字体配置

### 6.3 第三阶段

- 云端项目保存
- 用户登录和跨设备同步
- 评论和协作
- 批量生成不同尺寸
- AI 抠图、背景移除和智能排版
- 图片内容识别和颜色提取
- 模板市场和素材库

## 7. 高级感的设计原则

### 7.1 视觉语言

- 使用中性背景和少量强调色
- 让作品本身成为视觉中心
- 面板边界尽量轻，减少厚重卡片
- 控件密度适中，避免工具栏塞满按钮
- 图标优先使用熟悉的符号，文字只用于明确命令
- 选中状态、辅助线和吸附提示要清晰但克制
- 不要过度使用渐变、阴影、圆角和装饰性背景

### 7.2 交互节奏

- 拖入图片后立即出现在画布中心
- 默认图片使用合理的最大尺寸，不遮满整个画布
- 双击图片进入裁切模式
- `Space + 拖拽` 平移画布
- `Delete` 删除选中对象
- `Cmd/Ctrl + D` 复制对象
- `Cmd/Ctrl + Z` 撤销
- `Shift` 保持比例或进行连续选择
- 拖拽边缘时提供对齐、间距和尺寸提示

### 7.3 版式默认值

建议将以下参数作为设计系统的一部分，而不是散落在组件代码里：

```ts
const layoutTokens = {
  pagePadding: 64,
  gridUnit: 8,
  defaultGap: 16,
  largeGap: 32,
  borderRadius: 8,
  maxShadowBlur: 24,
  minTextSize: 10,
};
```

实际数值需要通过视觉测试调整，但应保持统一、可配置和可复用。

## 8. 页面结构建议

```text
应用外壳
├── 顶部栏
│   ├── 项目名称
│   ├── 撤销 / 重做
│   ├── 缩放控制
│   ├── 保存状态
│   └── 导出
├── 左侧工具栏
│   ├── 选择
│   ├── 图片
│   ├── 文字
│   ├── 形状
│   ├── 模板
│   └── 上传
├── 中央画布区
│   ├── 画布
│   ├── 对齐辅助线
│   ├── 选择框
│   └── 裁切层
├── 右侧属性面板
│   ├── 位置和尺寸
│   ├── 旋转
│   ├── 外观
│   ├── 图片裁切
│   ├── 图层
│   └── 文本属性
└── 底部状态栏
    ├── 当前尺寸
    ├── 选中对象信息
    └── 导出提示
```

建议默认采用三栏编辑器布局，但允许收起左右面板，让用户专注于画布。

## 9. 数据结构建议

编辑器不要直接把 React 组件状态当成文档格式。建议维护一个独立、可版本化的 JSON 文档。

```ts
type CollageDocument = {
  id: string;
  version: number;
  name: string;
  canvas: {
    width: number;
    height: number;
    background: string;
  };
  elements: CollageElement[];
  createdAt: string;
  updatedAt: string;
};

type CollageElement = {
  id: string;
  type: "image" | "text" | "rect" | "circle" | "line";
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
  groupId?: string;
  style?: Record<string, unknown>;
  asset?: {
    id: string;
    src: string;
    originalWidth: number;
    originalHeight: number;
    fit: "cover" | "contain";
    crop?: {
      x: number;
      y: number;
      scale: number;
    };
  };
};
```

### 9.1 关键原则

- 保存原图地址和裁切参数，不要每次裁切都生成一张新图片
- 将 `x/y/width/height/rotation` 作为画布坐标保存
- 画布渲染尺寸和导出尺寸分开
- 所有编辑操作都转换成可撤销的 command
- 为文档保留 `version`，方便未来迁移数据结构

## 10. 推荐代码分层

```text
src/
├── app/
├── components/
│   ├── editor-shell/
│   ├── toolbar/
│   ├── panels/
│   └── dialogs/
├── canvas/
│   ├── CanvasStage.tsx
│   ├── element-renderers/
│   ├── selection/
│   ├── snapping/
│   └── viewport/
├── editor/
│   ├── commands/
│   ├── history/
│   ├── keyboard/
│   └── selection/
├── document/
│   ├── types.ts
│   ├── migrations.ts
│   └── serializers.ts
├── assets/
│   ├── upload.ts
│   ├── image-cache.ts
│   └── image-processing.ts
├── export/
│   ├── export-image.ts
│   └── export-pdf.ts
└── store/
    └── editor-store.ts
```

## 11. 自动拼图算法方向

自动布局可以分为三类：

### 11.1 网格布局

适合快速生成整齐的照片墙。

```text
图片数量 → 行列数 → 单元格尺寸 → 图片裁切 → 间距和边距
```

### 11.2 Masonry 布局

适合图片比例差异较大的灵感板和瀑布流。

### 11.3 版式模板布局

适合高级海报，例如：

- 一张主图 + 两张辅助图
- 左大右小
- 非对称留白
- 图像与标题错位
- 图片穿插文字

建议不要只提供“随机排列”。可以提供以下几个按钮：

- `重新排版`
- `保持图片顺序`
- `更紧凑`
- `更多留白`
- `突出第一张图片`
- `保持当前风格`

这样用户会感觉自己在控制结果，而不是被算法接管。

## 12. 导出与性能

### 12.1 导出要求

- 使用更高倍率渲染导出，而不是直接截取屏幕
- 导出前重新计算画布尺寸和对象坐标
- 处理跨域图片，否则 Canvas 可能被污染
- 对透明背景、JPG 背景和 PDF 背景分别处理
- 检查字体加载完成后再导出
- 对超大画布增加导出进度和失败提示

### 12.2 性能策略

- 预览图和原图分开使用
- 图片进入画布前生成缩略图
- 对不变化的图片使用缓存
- 大图导出放到 Web Worker 或服务端
- 控制历史记录的内存大小
- 不要在每次鼠标移动时重新创建全部画布对象
- 当对象数量较多时，使用可见区域渲染或分层渲染

### 12.3 需要重点测试的情况

- 20、50、100 张图片同时存在
- 超大尺寸图片和透明 PNG
- 连续旋转、缩放、裁切后导出
- 不同浏览器的字体和 Canvas 差异
- 设备像素比为 1、1.5、2、3 的屏幕
- 用户刷新页面或关闭页面后的自动恢复

## 13. 开发阶段

### 阶段一：画布核心

- 创建项目和编辑器布局
- 创建文档数据结构
- 实现画布缩放、平移和背景
- 实现图片添加、选择、移动、缩放、旋转
- 实现图层顺序

### 阶段二：编辑体验

- 图片裁切和填充模式
- 多选、分组和对齐
- 吸附线和网格
- 文字和基础形状
- 撤销、重做和快捷键

### 阶段三：产品化

- 本地自动保存
- PNG/JPG 导出
- 画布尺寸预设
- 模板系统
- 空状态、加载状态、错误状态和导出状态

### 阶段四：增强能力

- 云端项目
- 分享链接
- 多页面
- 自动排版
- AI 抠图和智能布局

## 14. 许可证与商业化注意事项

在正式商业化之前，建议为所有依赖建立一份许可证清单，并在发布前复核版本对应的 LICENSE 文件。

当前值得注意的项目：

- Fabric.js：MIT License
- Konva：MIT License
- React Konva：MIT License
- Moveable：MIT License
- Cropper.js：MIT License
- Muuri：MIT License
- tldraw：生产环境需要根据其当前授权规则获取 license key 或商业授权
- Penpot：适合研究完整设计工具和开源产品架构，实际复用代码前应确认具体模块的许可证
- Polotno：商业 SDK，使用前需要确认套餐、授权范围和导出限制

同时还要注意：

- 用户上传的图片不等于你拥有再分发权
- 模板中的字体、图片和图标需要分别检查版权
- 默认字体不能保证所有用户设备都安装
- 不要把 Pinterest、Are.na 等平台的图片库直接抓取到自己的素材库
- 分享链接中的图片资源需要考虑权限、过期时间和隐私

## 15. 建议的第一版技术决策

```text
前端：React + TypeScript + Vite
画布：Konva + React Konva
变换交互：Moveable 或 Konva Transformer
图片裁切：Cropper.js
状态：Zustand
样式：CSS Modules 或 Tailwind CSS
本地保存：IndexedDB
文件导出：Canvas 高倍率导出
测试：Vitest + Playwright
```

第一版可以完全不需要后端：

- 图片只保存在浏览器本地
- 文档保存到 IndexedDB
- 导出在浏览器端完成
- 用 JSON 文件导入和导出项目

等编辑器交互稳定后，再增加登录、云端同步和分享功能。

## 16. Definition of Done

第一版达到以下标准，才适合进入用户试用：

- 新用户不看教程也能在 30 秒内添加第一张图片
- 图片裁切不会破坏原图数据
- 移动、缩放和旋转操作连续且无明显抖动
- 多个对象可以准确对齐和调整间距
- 撤销和重做能覆盖所有核心编辑动作
- 浏览器刷新后作品可以恢复
- 导出的图片与画布预览基本一致
- 100 张中等尺寸图片不会直接导致页面失去响应
- 不同浏览器下文字和图片位置不会明显错位
- 所有第三方依赖的许可证都已经记录

## 17. 最终建议

如果目标是做出一个真正有辨识度的 Web 产品，建议采用以下顺序：

1. 先用 Konva 做出自由画布和图层系统。
2. 用 Moveable 或 Konva Transformer 完成交互细节。
3. 用 Cropper.js 处理图片框内裁切。
4. 用少量高质量模板验证用户是否需要自动排版。
5. 再决定是继续自研，还是引入 Polotno 这类商业 SDK。

核心产品差异应该放在“排版结果和创作体验”上，而不是单纯拥有更多滤镜或更多模板。

## 18. 参考链接

### GitHub

- [Penpot](https://github.com/penpot/penpot)
- [tldraw](https://github.com/tldraw/tldraw)
- [Fabric.js](https://github.com/fabricjs/fabric.js)
- [Konva](https://github.com/konvajs/konva)
- [React Konva](https://github.com/konvajs/react-konva)
- [Moveable](https://github.com/daybrush/moveable)
- [Cropper.js](https://github.com/fengyuanchen/cropperjs)
- [Muuri](https://github.com/haltu/muuri)

### 产品

- [Shuffles](https://www.shffls.com/)
- [Milanote](https://milanote.com/)
- [Kosmik](https://www.kosmik.app/)
- [Are.na](https://www.are.na/)
- [PureRef](https://www.pureref.com/)
- [Polotno SDK](https://polotno.com/)
