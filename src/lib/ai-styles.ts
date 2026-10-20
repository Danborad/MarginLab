import { StylePreset, StyleCategory, ImageAspectRatio, IMAGE_RATIOS, AspectRatioOption } from "../types/ai";
import { RETOUCH_STYLES } from "./retouch-styles";
export { IMAGE_RATIOS };
export type { ImageAspectRatio, AspectRatioOption, StylePreset, StyleCategory };

export interface DreamySamplePhoto {
  id: string;
  name: string;
  mechanism: string;
  src: string;
  quote: string;
  desc: string;
}

export const DREAMY_SAMPLE_PHOTOS: DreamySamplePhoto[] = [
  {
    id: "mountain_chapel",
    name: "雪山古堂",
    mechanism: "自然肌理 • Mountain Collage",
    src: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
    quote: "silence. watch. GATHERED SCENES",
    desc: "雪山石砌小堂与等高线拼贴手记",
  },
  {
    id: "train_window",
    name: "电车旧梦",
    mechanism: "慢门拖影 • Crowd Drift",
    src: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
    quote: "光影穿梭，电车奔赴旧梦",
    desc: "城市电车慢门拖影 • 光轨流转与诗意车厢",
  },
  {
    id: "flying_birds",
    name: "长空飞鸟",
    mechanism: "逆光留白 • Backlit Halation",
    src: "https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1200&q=80",
    quote: "长空万里，风为飞鸟留白",
    desc: "逆光晕染与大面积高空留白 • 飞鸟破空残影",
  },
  {
    id: "romantic_couple",
    name: "温柔慢行",
    mechanism: "动态掠影 • Passing Gesture",
    src: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    quote: "风拂裙摆，时光温柔慢行",
    desc: "擦肩掠影 • 飘逸裙摆与柔光流动",
  },
];

export const STYLE_CATEGORIES: { id: StyleCategory; label: string; icon?: string }[] = [
  { id: "all", label: "全部风格" },
  { id: "editorial", label: "高定双联 / 画册" },
  { id: "illustration", label: "水粉 / 艺术插画" },
  { id: "photography", label: "电影 / 胶片摄影" },
  { id: "vintage", label: "复古 / 东方美学" },
  { id: "modern", label: "现代 / 几何构成" },
];

export const DEFAULT_AI_STYLES: StylePreset[] = [
  {
    id: "dreamy_motion_editorial",
    coverImage: "/covers/01_dreamy_motion_editorial.webp",
    name: "s21 · 梦幻动态电影海报",
    enName: "01 · Dreamy Motion Editorial",
    category: "editorial",
    badge: "s21 顶荐",
    enabled: true, // Replicated & Active
    order: 1,
    githubUrl: "https://github.com/lzs0594/dreamy-motion-editorial",
    description:
      "保留主体语义核心，将环境解构为慢门拖影、光影流动与高级诗意留白，搭配手写典雅排版与电影质感。",
    aspectRatio: "auto",
    recommendedTemplateId: "s21-dreamy-motion-editorial",
    tags: ["s21首选", "慢门拖影", "动态留白", "电影质感", "朦胧梦幻", "诗意排版"],
    promptTemplate:
      "只严格保留原照片中的【唯一主体身份/面部特征/关键关系或动作/一个关键物体/一个原生强调色】。不要完整保留整个背景。将画面的【45–70%】重构为低信息留白，通过低对比薄雾、半透明色场、纸张般柔光、大块渐变或浅景深虚化实现。建立具有方向性的真实慢门拖影与电影光学扩散（crowd-drift / floral-diffusion / glass-memory / backlit-halation），动态发生在次要人物、近景遮挡、衣料、头发或光斑中。主体的眼神/手势/轮廓保持清晰作为视觉锚点。暖光局部高光晕染，细致 35mm 胶片颗粒与边缘暗角。画面情绪：朦胧记忆、诗意疏离、时光温柔慢行。{moodNotes} {textInstruction}",
    negativePrompt:
      "literal full-scene reconstruction, busy detailed background, equal-detail composition, static empty background, no motion atmosphere, cluttered signage, ugly face, distorted fingers, excessive white fog, fantasy sparkles, cheap wedding photography, watermark",
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
      <defs>
        <linearGradient id="dm_bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1E232A"/>
          <stop offset="45%" stop-color="#3A4652"/>
          <stop offset="75%" stop-color="#B88A58"/>
          <stop offset="100%" stop-color="#DFCFB9"/>
        </linearGradient>
        <linearGradient id="dm_light" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFF" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#E5C49F" stop-opacity="0"/>
        </linearGradient>
        <filter id="dm_blur">
          <feGaussianBlur stdDeviation="3"/>
        </filter>
        <filter id="dm_motion">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6,1"/>
        </filter>
      </defs>
      <rect width="300" height="400" fill="#14171C"/>
      <rect x="12" y="12" width="276" height="376" rx="8" fill="url(#dm_bg)"/>
      <rect x="30" y="30" width="165" height="230" rx="10" fill="#1B242C" opacity="0.85" stroke="#4B5866" stroke-width="2"/>
      <path d="M30 150 Q75 115 115 145 T195 135 L195 260 L30 260 Z" fill="#4B6375" opacity="0.75"/>
      <circle cx="140" cy="85" r="16" fill="#FCEBD0" opacity="0.9" filter="url(#dm_blur)"/>
      <path d="M20 190 L280 250 L240 300 L10 230 Z" fill="url(#dm_light)" filter="url(#dm_motion)" opacity="0.65"/>
      <path d="M50 110 L265 180" stroke="#FFF" stroke-width="3" stroke-linecap="round" opacity="0.4" filter="url(#dm_motion)"/>
      <path d="M35 230 L255 290" stroke="#E5C49F" stroke-width="5" stroke-linecap="round" opacity="0.5" filter="url(#dm_motion)"/>
      <rect x="175" y="100" width="90" height="155" rx="8" fill="#543A26" opacity="0.95" stroke="#E5C49F" stroke-width="1.5"/>
      <rect x="195" y="120" width="50" height="115" rx="6" fill="#7D5737"/>
      <text x="30" y="315" font-family="'Songti SC', 'STSong', serif" font-size="16" font-weight="bold" fill="#FFFFFF" letter-spacing="2">光影穿梭，电车奔赴旧梦</text>
      <text x="30" y="338" font-family="'Helvetica Neue', sans-serif" font-size="7.5" font-weight="600" fill="#EADDCB" letter-spacing="3">DREAMY MOTION EDITORIAL • S21</text>
      <text x="30" y="355" font-family="monospace" font-size="6.5" fill="#C59B6D" letter-spacing="1.5">VOL. 21 / KINETIC NEGATIVE SPACE</text>
    </svg>`,
  },
  {
    id: "fantasy_qiqiguaiguai",
    coverImage: "/covers/02_fantasy_qiqiguaiguai.webp",
    name: "FANTASY · 奇奇怪怪",
    enName: "02 · FANTASY Social Editorial",
    category: "editorial",
    badge: "爆款社交",
    enabled: true, // Replicated & Active
    order: 2,
    githubUrl: "https://github.com/dacnay816y62-hub/fantasy-qiqiguaiguai-skill",
    description:
      "从日常碎片、人物、宠物、物件与零散想法中提炼幽默反差与第二层含义。3:4 竖版社交海报，高对比大标题、贴纸描边、趣味功能信息块与身份错位幽默。",
    aspectRatio: "3:4",
    tags: ["FANTASY", "奇奇怪怪", "3:4社交海报", "反差幽默", "杂志拼贴", "趣味标签", "朋友圈封面"],
    promptTemplate:
      "使用输入素材作为核心视觉，制作 3:4 竖版高定幽默社交海报（FANTASY 奇奇怪怪风格）。完整保留原图人物五官、发型穿搭、姿态或宠物花色脸型关键识别特征，隐藏真实隐私。采用当代视觉杂志与高密度编辑语言，画面由【巨大高对比主标题（贴纸白边或双色撞色粗体，与主体形成前后穿插遮挡） + 一条克制手写副标或冷幽默补刀 + 3–5个围绕同一世界观的功能性趣味信息块/状态进度条/档案标签/手绘箭头/虚线框】构成。文案制造第二层荒诞反差、生活失败美学或社会身份错位（如宠物CEO、工作续命装置、事故档案、合法情绪补丁）。色彩采用高对比现代配色（黄黑白/蓝黄黑/红蓝白），高信息密度但有明确视觉中心，无品牌商标Logo，无低质乱码涂鸦。画面时髦、荒诞、可直接发布。{moodNotes} {textInstruction}",
    negativePrompt:
      "brand logo, trademark, commercial product mockup, cheap e-commerce sale stickers, children doodle scrap, low contrast washed out, blurry text, distorted faces, ugly hands, extra limbs, watermark, random chaotic collage without visual focal point",
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
      <defs>
        <linearGradient id="fq_bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0F172A"/>
          <stop offset="50%" stop-color="#1E293B"/>
          <stop offset="100%" stop-color="#090D16"/>
        </linearGradient>
        <linearGradient id="fq_blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#38BDF8"/>
          <stop offset="100%" stop-color="#2563EB"/>
        </linearGradient>
        <linearGradient id="fq_amber" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FDE047"/>
          <stop offset="100%" stop-color="#F59E0B"/>
        </linearGradient>
        <filter id="fq_shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.4"/>
        </filter>
      </defs>
      <rect width="300" height="400" fill="url(#fq_bg)"/>
      <g stroke="#334155" stroke-width="0.5" opacity="0.25">
        <line x1="0" y1="50" x2="300" y2="50" stroke-dasharray="4,4"/>
        <line x1="0" y1="100" x2="300" y2="100" stroke-dasharray="4,4"/>
        <line x1="0" y1="150" x2="300" y2="150" stroke-dasharray="4,4"/>
        <line x1="0" y1="200" x2="300" y2="200" stroke-dasharray="4,4"/>
        <line x1="0" y1="250" x2="300" y2="250" stroke-dasharray="4,4"/>
        <line x1="0" y1="300" x2="300" y2="300" stroke-dasharray="4,4"/>
        <line x1="0" y1="350" x2="300" y2="350" stroke-dasharray="4,4"/>
        <line x1="50" y1="0" x2="50" y2="400" stroke-dasharray="4,4"/>
        <line x1="150" y1="0" x2="150" y2="400" stroke-dasharray="4,4"/>
        <line x1="250" y1="0" x2="250" y2="400" stroke-dasharray="4,4"/>
      </g>
      <g transform="rotate(-1.5 150 200)" filter="url(#fq_shadow)">
        <rect x="35" y="45" width="230" height="300" rx="6" fill="#FFFFFF"/>
        <rect x="45" y="55" width="210" height="225" rx="3" fill="#222933"/>
        <path d="M45 200 L110 140 L160 190 L205 130 L255 210 L255 280 L45 280 Z" fill="#334155"/>
        <circle cx="100" cy="110" r="28" fill="#FDE047" opacity="0.85"/>
        <path d="M130 180 L140 250 Q142 258 150 258 L180 258 Q188 258 190 250 L200 180 Z" fill="#94A3B8" opacity="0.75"/>
        <rect x="125" y="174" width="80" height="8" rx="2" fill="#F1F5F9"/>
      </g>
      <g transform="rotate(-6 70 38)">
        <rect x="45" y="28" width="65" height="20" fill="#FEF08A" opacity="0.9"/>
        <text x="77" y="42" font-family="monospace" font-size="8" font-weight="bold" fill="#854D0E" text-anchor="middle">T2 / 拼贴</text>
      </g>
      <g filter="url(#fq_shadow)">
        <text x="150" y="105" font-family="'PingFang SC', 'Microsoft YaHei', 'Arial Black', sans-serif" font-size="36" font-weight="900" fill="#FFFFFF" text-anchor="middle" stroke="#FFFFFF" stroke-width="9" stroke-linejoin="round" letter-spacing="2">本人正在加载</text>
        <text x="150" y="105" font-family="'PingFang SC', 'Microsoft YaHei', 'Arial Black', sans-serif" font-size="36" font-weight="900" fill="url(#fq_blue)" text-anchor="middle" letter-spacing="2">本人正在加载</text>
      </g>
      <path d="M238 68 L244 58 M248 74 L258 70 M245 82 L254 88" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/>
      <g transform="translate(55, 122)" filter="url(#fq_shadow)">
        <rect x="0" y="0" width="190" height="26" rx="13" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>
        <rect x="4" y="4" width="125" height="18" rx="9" fill="url(#fq_blue)"/>
        <text x="65" y="17" font-family="monospace" font-size="10" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">LOADING 68%</text>
        <circle cx="172" cy="13" r="5" fill="#22C55E"/>
      </g>
      <g transform="translate(38, 255) rotate(-3)" filter="url(#fq_shadow)">
        <rect x="0" y="0" width="118" height="34" rx="6" fill="#FEF08A" stroke="#CA8A04" stroke-width="1.5"/>
        <text x="10" y="15" font-family="sans-serif" font-size="9" font-weight="900" fill="#713F12">⚡ 临时外包电源</text>
        <text x="10" y="27" font-family="sans-serif" font-size="8" font-weight="bold" fill="#854D0E">请勿强制重启本人</text>
      </g>
      <g transform="translate(162, 230) rotate(4)" filter="url(#fq_shadow)">
        <rect x="0" y="0" width="102" height="28" rx="4" fill="#EF4444" stroke="#FFFFFF" stroke-width="1"/>
        <text x="51" y="18" font-family="sans-serif" font-size="9.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">⚠️ 情绪已超标</text>
      </g>
      <rect x="25" y="348" width="250" height="38" rx="8" fill="#1E293B" stroke="#334155" stroke-width="1"/>
      <text x="38" y="365" font-family="sans-serif" font-size="11" font-weight="900" fill="#F8FAFC" letter-spacing="1">FANTASY · 奇奇怪怪</text>
      <text x="38" y="378" font-family="monospace" font-size="7.5" font-weight="bold" fill="#38BDF8" letter-spacing="1.5">3:4 SOCIAL POSTER EDITORIAL</text>
      <rect x="206" y="356" width="58" height="20" rx="4" fill="url(#fq_amber)"/>
      <text x="235" y="370" font-family="sans-serif" font-size="8.5" font-weight="900" fill="#78350F" text-anchor="middle">爆款社交</text>
    </svg>`,
  },
  {
    id: "street_photo_black_ink",
    coverImage: "/covers/03_street_photo_black_ink.webp",
    name: "黑白手绘实景插画",
    enName: "03 · Street Photo Black Ink",
    category: "editorial",
    badge: "黑白手绘",
    enabled: true,
    order: 3,
    githubUrl: "https://github.com/dacnay816y62-hub/street-photo-illustration-skill",
    description: "黑白手绘、线条清爽、人物更像贴进照片里的纸感角色。严格保持原图环境、街道建筑与光影透视不重绘，仅将画面中的人物替换为点眼抽象手绘纸感插画，自带白色贴纸轮廓边缘。",
    aspectRatio: "3:4",
    tags: ["实景手绘", "BLACK INK", "黑白插画", "街拍插画", "纸感角色", "贴纸边框", "点眼极简"],
    promptTemplate: "使用上传的源照片作为场景结构、人物位置、姿势、服装、配饰、光照、透视和环境的唯一来源。保持全部实景环境照片级且完全不修改（不得重绘或替换建筑、街道、自然景观、天空、家具、车辆、阴影与空间深度）。仅将源照片中的人物在完全相同位置替换为清爽黑白手绘插画（BLACK INK 纸感手绘角色）。严格保持原动作、身体朝向、四肢方向、发型轮廓、服装版型、鞋包眼镜配饰与手持物。人物以纯白为主要填充基底，搭配干净有节制的黑色插画线条与高对比白色贴纸轮廓边缘。面部强制极简符号化（仅画两个纯黑圆点眼睛、极小嘴巴或不画嘴，默认省略鼻子，切勿绘制真实五官、双眼皮、瞳孔、睫毛、鼻梁、唇纹或肖像阴影，绝不画写实面部）。身体比例严格匹配原图头身比与肩宽四肢长，成人保持成人体态，不缩短腿部，不缩头成卡通吉祥物。{moodNotes} {textInstruction}",
    negativePrompt: "redrawn background, altered architecture, comic panel, manga page, dirty pencil shading, rough sketchbook scratch, dense crosshatching, heavy gray shading, realistic portrait face, anime glossy eyes, detailed eyelids, eyelashes, lips contour, toddler mascot body, shortened limbs, watermark, brand logo",
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
  <defs>
    <linearGradient id="bi_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1E293B"/>
      <stop offset="60%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <filter id="bi_shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.4"/>
    </filter>
  </defs>
  <rect width="300" height="400" fill="url(#bi_bg)"/>
  <path d="M0 260 L120 180 L200 220 L300 160 L300 400 L0 400 Z" fill="#1E293B" opacity="0.6"/>
  <rect x="30" y="70" width="70" height="180" fill="#0F172A" opacity="0.4"/>
  <rect x="190" y="50" width="80" height="200" fill="#0F172A" opacity="0.4"/>
  <g transform="rotate(-4 65 35)">
    <rect x="35" y="22" width="95" height="24" fill="#FFFFFF" rx="3" opacity="0.95"/>
    <text x="82" y="38" font-family="'Courier New', monospace" font-size="9" font-weight="bold" fill="#0F172A" text-anchor="middle" letter-spacing="1">BLACK INK</text>
  </g>
  <g transform="translate(110, 110)" filter="url(#bi_shadow)">
    <path d="M40 30 C20 30, 20 60, 40 60 C60 60, 60 30, 40 30 Z M25 65 L55 65 L65 140 L45 140 L45 210 L35 210 L35 140 L15 140 Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="12" stroke-linejoin="round"/>
    <path d="M40 30 C22 30, 22 58, 40 58 C58 58, 58 30, 40 30 Z" fill="#FFFFFF" stroke="#0F172A" stroke-width="3"/>
    <circle cx="34" cy="44" r="2.2" fill="#0F172A"/>
    <circle cx="46" cy="44" r="2.2" fill="#0F172A"/>
    <path d="M38 51 Q40 53 42 51" stroke="#0F172A" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M26 40 C24 24, 56 24, 54 40 C48 32, 32 32, 26 40 Z" fill="#0F172A"/>
    <path d="M26 65 L54 65 L60 135 L48 135 L47 205 L33 205 L32 135 L20 135 Z" fill="#FFFFFF" stroke="#0F172A" stroke-width="3" stroke-linejoin="round"/>
    <line x1="28" y1="95" x2="52" y2="95" stroke="#0F172A" stroke-width="2"/>
    <line x1="40" y1="65" x2="40" y2="135" stroke="#0F172A" stroke-width="2"/>
    <path d="M28 72 L50 115" stroke="#0F172A" stroke-width="2.5" stroke-dasharray="3,2"/>
  </g>
  <path d="M60 150 L68 140 M55 160 L75 160" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
  <circle cx="230" cy="130" r="4" fill="none" stroke="#FFFFFF" stroke-width="1.5" stroke-dasharray="2,2"/>
  <rect x="25" y="348" width="250" height="38" rx="8" fill="#0F172A" stroke="#475569" stroke-width="1"/>
  <text x="38" y="365" font-family="'PingFang SC', sans-serif" font-size="11" font-weight="900" fill="#FFFFFF" letter-spacing="1">黑白手绘实景插画</text>
  <text x="38" y="378" font-family="'Courier New', monospace" font-size="7.5" font-weight="bold" fill="#94A3B8" letter-spacing="1.5">03 · BLACK INK EDITORIAL</text>
  <rect x="206" y="356" width="58" height="20" rx="4" fill="#FFFFFF"/>
  <text x="235" y="370" font-family="sans-serif" font-size="8.5" font-weight="900" fill="#0F172A" text-anchor="middle">黑白手绘</text>
</svg>`,
  },
  {
    id: "street_photo_color_chibi",
    coverImage: "/covers/04_street_photo_color_chibi.webp",
    name: "彩色轻Q实景插画",
    enName: "04 · Street Photo Color Chibi",
    category: "editorial",
    badge: "彩色轻Q",
    enabled: true,
    order: 4,
    githubUrl: "https://github.com/dacnay816y62-hub/street-photo-illustration-skill",
    description: "彩色、轻松、编辑感更强，适合生活方式、旅行、商业空间和社交内容。保持原片环境与场景空间完全不变，将人物替换为4.5~6头身轻Q版彩色插画，保留穿搭色彩与长腿比例，极简点眼腮红与白色贴纸描边。",
    aspectRatio: "3:4",
    tags: ["彩色轻Q", "COLOR CHIBI", "生活方式", "旅行插画", "实景替换", "手绘编辑", "贴纸描边"],
    promptTemplate: "使用上传的源照片作为场景结构、人物位置、姿势、服装色彩、配饰、光照、透视和环境的唯一来源。保持全部实景环境照片级且完全不修改（不得重绘或替换建筑、街道、景观、天空、家具、室内装潢、光影透视与景深）。仅将源照片中的人物在完全相同位置替换为清晰生动的彩色轻Q版插画角色（COLOR CHIBI 角色）。必须抽象但绝不幼儿化：严格保持原人物的动作逻辑、身体朝向、发型发色、服装款式与穿搭色彩、背包帽子鞋子。面部极度抽象化：两个小圆点眼睛、极简小嘴巴、微弱粉嫩腮红，切勿画写实瞳孔、水汪汪日漫大眼或厚重睫毛。体态比例严格控制在 4.5 至 6 头身（轻度萌化但保留大长腿、苗条身形与时尚站姿），自带清晰白色贴纸描边分离层，具有干净纸感或轻微色铅笔肌理。{moodNotes} {textInstruction}",
    negativePrompt: "redrawn background, changed architecture, 2-head-tall toddler chibi, doll baby body, shortened stubby legs, giant glossy anime eyes, sparkling irises, realistic portrait face, messy watercolor bleeding, thick oil painting, rough scratchy sketch, blurry edges, watermark, brand logo",
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
  <defs>
    <linearGradient id="cc_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0284C7"/>
      <stop offset="50%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#FCD34D"/>
    </linearGradient>
    <filter id="cc_shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="300" height="400" fill="url(#cc_bg)"/>
  <rect x="0" y="240" width="300" height="160" fill="#065F46" opacity="0.75"/>
  <path d="M0 240 Q80 200 160 230 T300 210 L300 400 L0 400 Z" fill="#047857" opacity="0.85"/>
  <circle cx="230" cy="90" r="32" fill="#FEF08A" opacity="0.9"/>
  <g transform="rotate(-5 65 35)">
    <rect x="35" y="22" width="105" height="24" fill="#FEF08A" rx="3" opacity="0.95"/>
    <text x="87" y="38" font-family="'Courier New', monospace" font-size="9" font-weight="bold" fill="#854D0E" text-anchor="middle" letter-spacing="1">COLOR CHIBI</text>
  </g>
  <g transform="translate(105, 115)" filter="url(#cc_shadow)">
    <path d="M45 28 C22 28, 22 62, 45 62 C68 62, 68 28, 45 28 Z M28 68 L62 68 L72 135 L52 135 L50 205 L40 205 L38 135 L18 135 Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="12" stroke-linejoin="round"/>
    <path d="M45 28 C24 28, 24 60, 45 60 C66 60, 66 28, 45 28 Z" fill="#FED7AA" stroke="#0F172A" stroke-width="2.5"/>
    <path d="M25 42 C22 20, 68 20, 65 42 C56 32, 34 32, 25 42 Z" fill="#92400E"/>
    <circle cx="38" cy="45" r="2.5" fill="#0F172A"/>
    <circle cx="52" cy="45" r="2.5" fill="#0F172A"/>
    <ellipse cx="33" cy="50" rx="3.5" ry="2" fill="#F43F5E" opacity="0.6"/>
    <ellipse cx="57" cy="50" rx="3.5" ry="2" fill="#F43F5E" opacity="0.6"/>
    <path d="M42 51 Q45 54 48 51" stroke="#0F172A" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M28 68 L62 68 L68 130 L52 130 L50 195 L40 195 L38 130 L22 130 Z" fill="#FDE047" stroke="#0F172A" stroke-width="2.5" stroke-linejoin="round"/>
    <rect x="35" y="125" width="20" height="25" rx="3" fill="#2563EB" stroke="#0F172A" stroke-width="2"/>
    <path d="M22 80 L14 110 L26 115 Z" fill="#EF4444" stroke="#0F172A" stroke-width="2"/>
  </g>
  <path d="M65 140 L75 140 M70 135 L70 145" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M225 155 L235 155 M230 150 L230 160" stroke="#FEF08A" stroke-width="2.5" stroke-linecap="round"/>
  <rect x="25" y="348" width="250" height="38" rx="8" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/>
  <text x="38" y="365" font-family="'PingFang SC', sans-serif" font-size="11" font-weight="900" fill="#FFFFFF" letter-spacing="1">彩色轻Q实景插画</text>
  <text x="38" y="378" font-family="'Courier New', monospace" font-size="7.5" font-weight="bold" fill="#38BDF8" letter-spacing="1.5">04 · COLOR CHIBI EDITORIAL</text>
  <rect x="206" y="356" width="58" height="20" rx="4" fill="#38BDF8"/>
  <text x="235" y="370" font-family="sans-serif" font-size="8.5" font-weight="900" fill="#0C4A6E" text-anchor="middle">彩色轻Q</text>
</svg>`,
  },
  {
    id: "culture_fragment_poster",
    coverImage: "/covers/05_culture_fragment_poster.webp",
    name: "文化碎片海报",
    enName: "05 · Culture Fragment Poster",
    category: "editorial",
    badge: "梵想美学",
    enabled: true,
    order: 5,
    githubUrl: "https://github.com/dacnay816y62-hub/culture-fragment-poster-engine",
    description:
      "提取传统器物、纹样、织物与建筑等文化碎片提炼为视觉基因，重构为克制、高级的商业 KV 艺术海报与极简衬线排版。",
    aspectRatio: "3:4",
    tags: ["文化基因", "东方梵想", "高奢KV", "碎片解构", "艺术海报", "衬线排版", "留白克制"],
    promptTemplate:
      "严格基于上传的文化/艺术/实景素材，提炼其核心视觉基因（材质肌理、织物经纬、纹样构成、器物光影或建筑构件），重构为当代高奢艺术展览与高级商业 KV 级别的【文化碎片海报】（Culture Fragment Poster）。切勿进行粗制滥造的旅游纪念品式拼贴。采用现代高定平面设计语言：【画面主体】将传统文化质感解构为纯粹克制的现代视觉焦点，与留白空间形成呼吸韵律；【色彩体系】提取原素材低饱和矿物颜料、暖米白纸质底色或哑光大地色系，辅以微量克制的金线或点睛色彩；【排版构成】排版极简典雅，结合高对比细衬线英文与大号艺术字标题，局部点缀编号与索引标签；【材质细节】细腻的 35mm 胶片颗粒、微糙手工纸与矿物微粒质感。整幅海报呈现东方梵想、诗意克制、当代奢华的艺术指导级美学。{moodNotes} {textInstruction}",
    negativePrompt:
      "cheap tourist souvenir collage, busy cluttered bazaar, low quality watermark, cartoon mascot, garish saturated neon, plastic gloss, deformed text, messy typography, distorted faces, amateur photo",
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
  <defs>
    <linearGradient id="cf_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#18181B"/>
      <stop offset="60%" stop-color="#27272A"/>
      <stop offset="100%" stop-color="#09090B"/>
    </linearGradient>
    <linearGradient id="cf_gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="50%" stop-color="#D97706"/>
      <stop offset="100%" stop-color="#B45309"/>
    </linearGradient>
    <linearGradient id="cf_crimson" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#DC2626"/>
      <stop offset="100%" stop-color="#991B1B"/>
    </linearGradient>
    <filter id="cf_shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
  </defs>
  <rect width="300" height="400" fill="url(#cf_bg)"/>
  <rect x="15" y="15" width="270" height="370" fill="none" stroke="#3F3F46" stroke-width="0.75" opacity="0.6"/>
  <rect x="25" y="25" width="140" height="200" fill="#F4EFE6" rx="4" filter="url(#cf_shadow)"/>
  <g transform="translate(35, 35)">
    <path d="M0 60 Q60 0 120 60 L120 180 L0 180 Z" fill="#1C1917"/>
    <circle cx="60" cy="90" r="38" fill="none" stroke="url(#cf_gold)" stroke-width="2"/>
    <circle cx="60" cy="90" r="26" fill="url(#cf_crimson)" opacity="0.85"/>
    <line x1="20" y1="90" x2="100" y2="90" stroke="#FAF5EE" stroke-width="1" stroke-dasharray="2,2"/>
    <line x1="60" y1="50" x2="60" y2="130" stroke="#FAF5EE" stroke-width="1" stroke-dasharray="2,2"/>
  </g>
  <g transform="translate(180, 50)" filter="url(#cf_shadow)">
    <rect width="90" height="130" fill="#E4DCD3" rx="3"/>
    <rect x="8" y="8" width="74" height="114" fill="#0C0A09"/>
    <path d="M15 90 Q45 20 75 70" stroke="url(#cf_gold)" stroke-width="2.5" fill="none"/>
    <text x="45" y="105" font-family="serif" font-size="7" fill="#E7E5E4" text-anchor="middle" letter-spacing="2">ARCHIVE</text>
  </g>
  <g transform="translate(30, 248)">
    <text x="0" y="22" font-family="'Songti SC', 'STSong', serif" font-size="22" font-weight="900" fill="#FAF5EE" letter-spacing="3">文化碎片 · 梵想</text>
    <text x="0" y="40" font-family="'Helvetica Neue', sans-serif" font-size="8" font-weight="600" fill="#D4D4D8" letter-spacing="2">CULTURE FRAGMENT POSTER • KV</text>
    <text x="0" y="54" font-family="monospace" font-size="7" fill="#F59E0B" letter-spacing="1.5">GENE TRANSLATION / N°05 / 3:4 EDITORIAL</text>
  </g>
  <rect x="206" y="352" width="62" height="20" rx="4" fill="url(#cf_gold)"/>
  <text x="237" y="366" font-family="sans-serif" font-size="8.5" font-weight="900" fill="#451A03" text-anchor="middle">梵想美学</text>
</svg>`,
  },
  {
    id: "eastern_ink_diptych",
    coverImage: "/covers/06_eastern_ink_diptych_scenery.webp",
    name: "东方水墨摄影二分画",
    enName: "06 · Eastern Ink Photo Diptych",
    category: "editorial",
    badge: "水墨二分",
    enabled: true,
    order: 6,
    githubUrl: "https://github.com/Hiseaa/eastern-ink-photo-diptych",
    description:
      "竖版画册海报。上半部忠实保留摄影，下半部将同一场景提炼为克制、留白充足的东方极简水墨构成。根据原图提取低饱和自然色，底部排版简短小字号细衬线英文标题。",
    aspectRatio: "auto",
    tags: ["东方水墨", "摄影二分画", "写意留白", "忠于原图", "低饱和自然色", "细衬线标题"],
    promptTemplate:
      "Create a {aspectRatioDesc} editorial art-paper poster from the attached photograph. Use a quiet two-part composition on matte warm ivory paper. In the upper panel, retain the source photograph faithfully, preserving the original scene arrangement, subject silhouettes, architecture or landform, spatial proportions, and subdued natural palette; make no invented changes and keep authentic photographic texture. In the lower panel, reinterpret the exact same scene as Eastern minimalist ink-and-wash abstraction. Keep only the essential spatial signs and dominant masses, geometrically simplify them, and use expansive negative space, few flat translucent shapes, pale ink bloom, rice-paper permeability, soft edges, and low detail. Use only muted colors derived from the source. Do not draw individual leaves, tiles, roads, textures, people, decorations, sharp outlines, dramatic light, or complex shadows. {textInstruction} {moodNotes} The result should feel like a restrained high-end Eastern architecture or landscape study booklet: clean, rational, calm, and spacious.",
    negativePrompt:
      "decorative borders, stamps, red wax seals, watermarks, badges, bright neon colors, western oil painting, busy detailed lower panel, messy scribbles, garbled text",
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
  <defs>
    <linearGradient id="ei_photo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1E3A5F"/>
      <stop offset="50%" stop-color="#2D5A7B"/>
      <stop offset="100%" stop-color="#4A7C9D"/>
    </linearGradient>
    <linearGradient id="ei_ink" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F5F2EB"/>
      <stop offset="40%" stop-color="#E8E4DA"/>
      <stop offset="100%" stop-color="#D5CFC2"/>
    </linearGradient>
    <filter id="ei_shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.15"/>
    </filter>
  </defs>
  <rect width="300" height="400" fill="#F8F6F0"/>
  <rect x="18" y="16" width="264" height="368" fill="none" stroke="#E2DDD2" stroke-width="1"/>
  <!-- Upper Panel: Real Photography (38-48%) -->
  <g transform="translate(30, 28)" filter="url(#ei_shadow)">
    <rect width="240" height="145" fill="url(#ei_photo)" rx="2"/>
    <circle cx="180" cy="55" r="22" fill="#E8D5B5" opacity="0.4"/>
    <path d="M0 110 L45 80 L110 115 L180 75 L240 120 L240 145 L0 145 Z" fill="#142436"/>
    <path d="M50 145 L90 105 L150 135 L210 95 L240 125 L240 145 L50 145 Z" fill="#0D1B2A" opacity="0.8"/>
    <rect x="6" y="6" width="48" height="14" rx="2" fill="#000000" opacity="0.6"/>
    <text x="30" y="16" font-family="monospace" font-size="6.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">PHOTO</text>
  </g>
  <!-- Middle Spacer -->
  <line x1="45" y1="185" x2="255" y2="185" stroke="#D1C9BA" stroke-width="0.75" stroke-dasharray="2,3"/>
  <!-- Lower Panel: Minimal Eastern Ink (38-48%) -->
  <g transform="translate(30, 198)" filter="url(#ei_shadow)">
    <rect width="240" height="145" fill="url(#ei_ink)" rx="2"/>
    <path d="M0 95 Q60 50 130 85 T240 70 L240 145 L0 145 Z" fill="#6B7280" opacity="0.3"/>
    <path d="M30 115 Q90 85 170 110 T240 100 L240 145 L30 145 Z" fill="#374151" opacity="0.5"/>
    <path d="M60 130 Q120 105 180 125 L240 120 L240 145 L60 145 Z" fill="#1F2937" opacity="0.75"/>
    <circle cx="195" cy="55" r="16" fill="#C2410C" opacity="0.25"/>
    <rect x="6" y="6" width="38" height="14" rx="2" fill="#374151" opacity="0.7"/>
    <text x="25" y="16" font-family="monospace" font-size="6.5" font-weight="bold" fill="#F9FAFB" text-anchor="middle">INK</text>
  </g>
  <!-- Bottom Margin Typography: Small Refined Serif -->
  <text x="150" y="362" font-family="'Times New Roman', 'Songti SC', serif" font-size="9" font-weight="bold" fill="#292524" text-anchor="middle" letter-spacing="4">M I S T Y   R E F L E C T I O N S</text>
  <text x="150" y="373" font-family="'Helvetica Neue', sans-serif" font-size="6" font-weight="500" fill="#78716C" text-anchor="middle" letter-spacing="1.5">EASTERN INK PHOTO DIPTYCH</text>
  <rect x="220" y="350" width="48" height="18" rx="3" fill="#374151"/>
  <text x="244" y="362" font-family="sans-serif" font-size="8" font-weight="bold" fill="#F3F4F6" text-anchor="middle">水墨二分</text>
</svg>`,
  },
  {
    id: "reality_restaged",
    coverImage: "/covers/08_reality_restaged.webp",
    name: "纪实重构 · 超现实舞台",
    enName: "07 · Reality Restaged",
    category: "photography",
    badge: "电影舞台",
    enabled: true,
    order: 7,
    githubUrl: "https://github.com/traveler0621/reality-restaged",
    description:
      "“One impossible thing”。保留真实人物/建筑/人文记忆，大刀阔斧削减环境杂质，重构为饱和纯色色场、极简几何空间与硬朗戏剧光影的超现实电影舞台。",
    aspectRatio: "auto",
    tags: ["纪实重构", "超现实舞台", "One Impossible Thing", "戏剧光影", "纯色色场", "电影定格", "35mm胶片"],
    promptTemplate:
      `A cinematic tableau photograph in the strict visual language of "Reality Restaged" (Documentary memory. Surreal stage. Reference: traveler0621/reality-restaged).

Follow the 5 Core Principles of Reality Restaged:
1. DOCUMENTARY ANCHOR (真实记忆与建筑/人文主体):
- Faithfully preserve the core subject from the source photo: whether it is human gestures/figures, animals, vehicles, or iconic architecture/landmarks (such as traditional Chinese palace gatehouses, flying eaves, vermilion walls, glazed roofs, or courtyard structures).
- Maintain authentic documentary proportions, cultural integrity, and physical realism. The subject must be grounded solidly and physically on the stage floor—STRICTLY NO FLOATING, NO FLYING, NO LEVITATION.

2. COLOR IS ARCHITECTURE (色彩即建筑，巨幅纯色色场构筑空间):
- Rebuild the entire environment using 2 dominant saturated color fields plus 1 supporting tone (e.g., massive Yves Klein Cobalt Blue wall × Vermilion China Red plane; or Mustard Ochre Yellow wall × Dark Terracotta floor × Deep Teal accent).
- 60%–80% of the composition is occupied by monumental, flat, matte color planes that act as physical walls, floors, geometric horizons, and spatial thresholds. Color is architecture, not decorative background.

3. RADICAL ENVIRONMENTAL REDUCTION (大刀阔斧削减现实杂质):
- Aggressively eliminate all environmental clutter: tourists, crowds, traffic, lampposts, modern buildings, messy wires, trees, and sky smog.
- Reconstruct the scene into a pristine, silent, theatrical cinematic stage with massive negative space, sharp geometric cuts, and absolute minimalism.

4. ONE IMPOSSIBLE THING (唯一超现实戏剧干预 - 坚决拒绝庸俗AI奇幻):
- Introduce ONE restrained, high-concept theatrical impossibility through space, scale, shadow, or architectural threshold (such as a razor-sharp vertical geometric doorway cut into a monumental colored wall revealing a contrasting night sky/color; an oversized theatrical silhouette shadow cast on a flat wall; or an impossible spatial division).
- STRICT PROHIBITION: Absolutely NO floating in the clouds, NO heavenly sky gates, NO fluffy sunset clouds, NO glowing celestial fantasy, NO fantasy castles, NO dreamcore clichés. The world is structurally impossible, but physically and photographically believable.

5. 35MM ANALOG PHOTOGRAPHIC REALISM (真实35mm胶片摄影质感):
- Directional, clean theatrical sunlight creating hard, crisp geometric shadows; tactile matte plaster, stucco, and stone textures; fine 35mm film grain (Kodak Portra / Ektachrome).
- Looks like a real documentary photograph taken on a colossal art-directed stage (like Edward Hopper meets Giorgio de Chirico and Alex Prager), zero CGI 3D digital gloss, zero digital airbrush, zero fantasy video game aesthetics.
{moodNotes} {textInstruction}`,
    negativePrompt:
      "floating in the clouds, heavenly clouds, golden sunset sky, celestial fantasy, dreamcore, fantasy castle, flying buildings, floating islands, fluffy clouds, CGI 3D digital art, video game rendering, glossy shiny surfaces, plastic texture, neon glow, cluttered background, tourist crowds, watermark, text, signature, low quality",
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
  <defs>
    <!-- Matte Wall & Asphalt Shading -->
    <linearGradient id="rr_blue_wall" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="60%" stop-color="#1D4ED8"/>
      <stop offset="100%" stop-color="#1E40AF"/>
    </linearGradient>
    <linearGradient id="rr_red_door" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#B91C1C"/>
      <stop offset="100%" stop-color="#DC2626"/>
    </linearGradient>
    <filter id="rr_shadow_soft">
      <feGaussianBlur stdDeviation="1.5"/>
    </filter>
  </defs>

  <!-- Massive Saturated Yves Klein Cobalt Blue Wall (Color is Architecture) -->
  <rect width="300" height="315" fill="url(#rr_blue_wall)"/>
  
  <!-- Subtle Architectural Plaster Seam -->
  <line x1="110" y1="0" x2="110" y2="315" stroke="#1E3A8A" stroke-width="1.2" opacity="0.4"/>

  <!-- Monumental Giant Detective Silhouette Shadow on Blue Wall -->
  <g id="giant_shadow" opacity="0.32" transform="translate(185, 20)">
    <!-- Fedora Hat & Brim -->
    <path d="M5 45 C15 20 50 15 80 18 C75 35 70 42 68 45 L115 48 C120 50 115 56 100 56 L-5 52 C-15 52 -10 46 5 45 Z" fill="#0A0F1D"/>
    <!-- Face Profile: Forehead, Nose, Lips, Chin, Jaw -->
    <path d="M12 52 C20 70 25 82 23 90 L32 98 L24 104 C25 112 28 116 26 122 L18 126 C22 145 35 175 42 205 L-20 205 L-20 52 Z" fill="#0A0F1D"/>
  </g>

  <!-- Theatrical Recessed Vermilion Red Doorway on Left -->
  <g id="red_doorway" transform="translate(32, 75)">
    <!-- Depth Bevel -->
    <polygon points="-4,-4 38,-4 38,240 -4,240" fill="#0F172A" opacity="0.6"/>
    <!-- Pure Saturated Red Door Interior -->
    <rect x="0" y="0" width="34" height="240" fill="url(#rr_red_door)"/>
    <!-- Inner Shadow -->
    <line x1="0" y1="0" x2="0" y2="240" stroke="#7F1D1D" stroke-width="2"/>
    <line x1="0" y1="0" x2="34" y2="0" stroke="#7F1D1D" stroke-width="2"/>
  </g>

  <!-- Clean Asphalt Ground Plane -->
  <rect x="0" y="315" width="300" height="85" fill="#1F2937"/>
  <line x1="0" y1="315" x2="300" y2="315" stroke="#111827" stroke-width="2"/>

  <!-- Saturated Wet Blue Paint Strip Rolled out on Asphalt -->
  <path d="M0 342 L236 342 L236 370 L0 370 Z" fill="#2563EB" opacity="0.95"/>
  <line x1="0" y1="342" x2="236" y2="342" stroke="#60A5FA" stroke-width="1.2" opacity="0.7"/>

  <!-- Red Vintage Boxy Car Emerging from the Doorway -->
  <g id="red_car" transform="translate(26, 252)">
    <!-- Cast Shadow on Road -->
    <ellipse cx="65" cy="65" rx="55" ry="5" fill="#0A0F1D" opacity="0.8"/>
    <!-- Car Body -->
    <path d="M4 35 L20 35 L40 18 L78 18 L95 35 L118 36 C122 36 125 39 125 44 L123 58 C123 60 120 62 116 62 L105 62 C105 52 92 52 92 62 L35 62 C35 52 22 52 22 62 L6 62 C4 62 2 60 2 56 L4 35 Z" fill="#DC2626"/>
    <!-- Car Cabin / Windows -->
    <path d="M42 21 L75 21 L88 34 L38 34 Z" fill="#0F172A" opacity="0.85"/>
    <line x1="58" y1="21" x2="58" y2="34" stroke="#DC2626" stroke-width="2.5"/>
    <line x1="75" y1="21" x2="75" y2="34" stroke="#DC2626" stroke-width="2"/>
    <!-- Car Wheels with Blue Rims -->
    <circle cx="28" cy="60" r="11" fill="#111827"/>
    <circle cx="28" cy="60" r="6" fill="#3B82F6"/>
    <circle cx="28" cy="60" r="2.5" fill="#E2E8F0"/>
    <circle cx="98" cy="60" r="11" fill="#111827"/>
    <circle cx="98" cy="60" r="6" fill="#3B82F6"/>
    <circle cx="98" cy="60" r="2.5" fill="#E2E8F0"/>
    <!-- Bumper & Headlight -->
    <rect x="119" y="46" width="6" height="12" rx="1" fill="#1F2937"/>
    <rect x="117" y="40" width="4" height="6" fill="#FEF08A"/>
  </g>

  <!-- Walking Man pulling the Blue Paint Roller -->
  <g id="walking_man" transform="translate(242, 210)">
    <!-- Ground Cast Shadow -->
    <ellipse cx="22" cy="112" rx="20" ry="4.5" fill="#0A0F1D" opacity="0.75"/>
    <!-- Legs in Motion -->
    <path d="M14 62 L6 90 L2 112 M20 62 L32 88 L38 110" stroke="#111827" stroke-width="6" stroke-linecap="round" fill="none"/>
    <polygon points="0,110 5,110 4,114 -2,114" fill="#020617"/>
    <polygon points="36,108 42,108 40,112 34,112" fill="#020617"/>
    <!-- Tweed Jacket & Torso -->
    <path d="M8 26 L30 26 L34 65 L8 65 Z" fill="#9CA3AF"/>
    <path d="M12 28 L28 28 L30 63 L12 63 Z" fill="#6B7280"/>
    <!-- Arm pulling handle -->
    <path d="M14 34 L-6 62" stroke="#9CA3AF" stroke-width="4.5" stroke-linecap="round"/>
    <!-- Head & Fedora Hat -->
    <ellipse cx="20" cy="15" rx="6" ry="8" fill="#FCA5A5"/>
    <path d="M10 11 C12 2 26 2 28 11 Z" fill="#1F2937"/>
    <line x1="8" y1="12" x2="32" y2="12" stroke="#111827" stroke-width="3" stroke-linecap="round"/>

    <!-- Red Paint Roller Pole & Blue Roller -->
    <line x1="-6" y1="62" x2="-26" y2="135" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="-38" y="130" width="22" height="18" rx="4" fill="#1D4ED8" stroke="#1E40AF" stroke-width="1.5"/>
    <circle cx="-27" cy="139" r="3" fill="#EF4444"/>
  </g>

  <!-- Bottom Theatrical Film Caption -->
  <g id="film_caption" transform="translate(18, 385)">
    <text x="0" y="0" font-family="'Helvetica Neue', 'Arial Black', sans-serif" font-size="8.5" font-weight="900" fill="#F8FAFC" letter-spacing="1.5">REALITY RESTAGED</text>
    <text x="0" y="8.5" font-family="'Courier New', monospace" font-size="5" font-weight="700" fill="#93C5FD" letter-spacing="1">DOCUMENTARY MEMORY • SURREAL STAGE</text>
  </g>
  <!-- Right Category Badge -->
  <rect x="238" y="374" width="48" height="16" rx="3" fill="#E11D48"/>
  <text x="262" y="385" font-family="sans-serif" font-size="7.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">电影舞台</text>
</svg>`,
  },
  {
    id: "photo_abstract_diptych",
    coverImage: "/covers/09_photo_abstract_diptych.webp",
    name: "真实摄影+抽象设计",
    enName: "08 · Photo & Abstract Minimalist Poster",
    category: "editorial",
    badge: "p10 推荐",
    enabled: true,
    order: 8,
    githubUrl: "",
    description:
      "保持“真实摄影+抽象设计”的上下组合形式。上半部分保留原始照片作为主体摄影与自然光影；下半部分提取核心形态进行极简几何扁平色块与细线条抽象设计，米白背景搭配高级画册排版。",
    aspectRatio: "3:4",
    recommendedTemplateId: "couture-dual-bleed",
    tags: ["真实摄影", "抽象设计", "上下组合", "几何色块", "建筑海报", "国际设计"],
    promptTemplate:
      "请将上传的照片制作成高级极简设计海报，保持“真实摄影+抽象设计”的上下组合形式。画面分为上下两个部分 上半部分: 保留原始照片作为主体摄影区域，保持真实质感和自然光影，不改变主体结构。突出照片中的核心元素(建筑、风景、人物、物体等)，保持原始色彩氛围，并进行轻微高级摄影调色，使画面具有杂志摄影感。 下半部分: 将上方照片中的主体提取出来，进行极简抽象化设计。 设计要求: 提取主体轮廓和最具识别性的形态；使用简洁几何形状、扁平色块、细线条进行重新表达；不使用复杂细节，不做写实插画；保留主体的视觉特征，让人一眼能够识别原物；使用照片中的主要颜色作为设计配色；采用高级品牌视觉设计风格；类似国际设计工作室制作的建筑海报、艺术展览海报、品牌视觉系统。 构图要求: 米白色或浅色背景；主体居中排列；下方加入简单水平线、纹理线或抽象环境元素；使用高级排版，可加入简洁英文标题。 整体感觉: 高级、克制、现代、艺术化，不像普通滤镜效果，而像设计师制作的限量版艺术海报。 {moodNotes} {textInstruction}",
    negativePrompt:
      "complex photographic background in lower half, 3d render, messy elements, low quality, distorted shapes, overly complex gradients, cheap filter, cartoon, watermark, noisy textures, dirty paper",
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
  <defs>
    <linearGradient id="pa_sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0B132B"/>
      <stop offset="50%" stop-color="#1C2541"/>
      <stop offset="85%" stop-color="#4F5D75"/>
      <stop offset="100%" stop-color="#EF8354"/>
    </linearGradient>
    <linearGradient id="pa_water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#EF8354" stop-opacity="0.8"/>
      <stop offset="30%" stop-color="#2D3748"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
    <filter id="pa_glow">
      <feGaussianBlur stdDeviation="2"/>
    </filter>
  </defs>
  <rect width="300" height="400" fill="#F8F6F0"/>
  <g id="top_photo">
    <rect x="16" y="14" width="268" height="172" rx="4" fill="url(#pa_sky)"/>
    <rect x="16" y="140" width="268" height="46" rx="2" fill="url(#pa_water)"/>
    <path d="M16 140 L45 130 L60 135 L85 125 L105 132 L130 118 L150 135 L175 122 L200 134 L235 125 L284 140 Z" fill="#0B132B" opacity="0.9"/>
    <polygon points="120,40 128,40 132,142 116,142" fill="#2B3A4A"/>
    <polygon points="122,40 126,40 128,142 120,142" fill="#E2E8F0" opacity="0.3"/>
    <path d="M124 45 L20 142 M124 55 L35 142 M124 70 L55 142 M124 85 L75 142 M124 100 L95 142" stroke="#EF8354" stroke-width="0.8" opacity="0.75"/>
    <path d="M124 45 L230 142 M124 55 L210 142 M124 70 L190 142 M124 85 L170 142 M124 100 L150 142" stroke="#EF8354" stroke-width="0.8" opacity="0.75"/>
    <line x1="16" y1="141" x2="284" y2="141" stroke="#F6AD55" stroke-width="2.5"/>
    <line x1="16" y1="143" x2="284" y2="143" stroke="#1A202C" stroke-width="1"/>
    <ellipse cx="124" cy="148" rx="25" ry="3" fill="#FBD38D" opacity="0.8" filter="url(#pa_glow)"/>
  </g>
  <g id="middle_editorial">
    <text x="150" y="208" font-family="'Helvetica Neue', Arial, sans-serif" font-size="10.5" font-weight="900" fill="#111827" text-anchor="middle" letter-spacing="2.8">RIVER BRIDGE FORM</text>
    <text x="150" y="219" font-family="'Helvetica Neue', Arial, sans-serif" font-size="5.5" font-weight="700" fill="#6B7280" text-anchor="middle" letter-spacing="1.8">NIGHT STRUCTURE STUDY • URBAN ARCHIVE</text>
    <line x1="110" y1="225" x2="190" y2="225" stroke="#9CA3AF" stroke-width="0.8"/>
  </g>
  <g id="bottom_abstract">
    <rect x="16" y="234" width="268" height="152" rx="4" fill="#F3EFE6"/>
    <line x1="16" y1="360" x2="284" y2="360" stroke="#CBD5E1" stroke-width="1"/>
    <line x1="16" y1="375" x2="284" y2="375" stroke="#E2E8F0" stroke-width="0.8"/>
    <line x1="150" y1="234" x2="150" y2="380" stroke="#E2E8F0" stroke-width="0.8" stroke-dasharray="3,3"/>
    <polygon points="30,360 270,360 250,380 50,380" fill="#1E293B" opacity="0.85"/>
    <polygon points="110,360 190,360 175,376 125,376" fill="#F97316" opacity="0.9"/>
    <polygon points="144,248 156,248 162,360 138,360" fill="#0F172A"/>
    <polygon points="150,250 80,360 105,360" fill="#2563EB" opacity="0.3"/>
    <polygon points="150,250 220,360 195,360" fill="#3B82F6" opacity="0.25"/>
    <line x1="150" y1="252" x2="70" y2="360" stroke="#1E40AF" stroke-width="1.2"/>
    <line x1="150" y1="265" x2="85" y2="360" stroke="#2563EB" stroke-width="1"/>
    <line x1="150" y1="280" x2="100" y2="360" stroke="#3B82F6" stroke-width="0.8"/>
    <line x1="150" y1="298" x2="115" y2="360" stroke="#60A5FA" stroke-width="0.8"/>
    <line x1="150" y1="318" x2="130" y2="360" stroke="#93C5FD" stroke-width="0.6"/>
    <line x1="150" y1="252" x2="230" y2="360" stroke="#1E40AF" stroke-width="1.2"/>
    <line x1="150" y1="265" x2="215" y2="360" stroke="#2563EB" stroke-width="1"/>
    <line x1="150" y1="280" x2="200" y2="360" stroke="#3B82F6" stroke-width="0.8"/>
    <line x1="150" y1="298" x2="185" y2="360" stroke="#60A5FA" stroke-width="0.8"/>
    <line x1="150" y1="318" x2="170" y2="360" stroke="#93C5FD" stroke-width="0.6"/>
    <circle cx="150" cy="275" r="8" fill="#F59E0B"/>
    <circle cx="150" cy="275" r="14" fill="#FEF3C7" opacity="0.5"/>
  </g>
</svg>`,
  },
  {
    id: "minimal_editorial_illustration",
    coverImage: "/covers/10_minimal_editorial_illustration.webp",
    name: "极简编辑插画海报",
    enName: "09 · Minimal Editorial Illustration",
    category: "illustration",
    badge: "独立杂志",
    enabled: true,
    order: 9,
    githubUrl: "",
    description:
      "将照片转化为温暖、克制的高端独立杂志单页插画。融合极简水粉、建筑手稿与现代主义空间插画，提取低饱和编辑色盘与大面积象牙白留白，排版古典衬线诗意英文标题。",
    aspectRatio: "auto",
    recommendedTemplateId: "modern-gallery-single",
    tags: ["极简水粉", "建筑手稿", "空间插画", "独立杂志", "象牙白留白", "低饱和编辑色"],
    promptTemplate:
      "请将我上传的图片作为唯一内容来源，转化为一张极简编辑插画海报。 先在内部分析图片中最重要的主体、结构、比例、空间层级、位置关系、轮廓、色彩和光线，但不要输出分析过程。保留原图最具辨识度的内容与构图节奏，删除杂乱背景、微小装饰、复杂纹理和摄影细节，将其重新诠释为安静、克制、温暖的现代编辑插画。 视觉风格融合： 极简水粉画、淡彩水彩、建筑手稿、现代主义空间插画、高端室内与生活方式独立杂志插图。 不要写实复刻，也不要直接对原图应用滤镜。将图片内容简化成少量柔和的几何色块、半透明水粉形状和稀疏的手绘结构线。主体需要保持清晰可辨，但表现方式应当平面化、低细节、诗意且非写实。 绘画语言： - 使用大面积哑光、低饱和、略带透明感的水粉色块 - 色块边缘保留自然、轻微不规则的手绘起伏 - 使用少量深咖啡色或炭灰色细线标记关键结构 - 线条略有粗细变化和轻微抖动，不要机械笔直 - 不要给每个色块完整描边 - 省略表面纹理、复杂透视和细小构造 - 用平面体块、间距、重叠和留白表现空间关系 - 光源使用克制、柔和的暖琥珀色微光 - 光晕必须轻微自然，不要形成霓虹灯效果 色彩必须从上传图片中提取并重新调和为低饱和编辑色盘。整体以暖象牙白、燕麦灰、灰米色、雾霾蓝、浅鼠尾草绿、柔和焦糖色和深咖啡色为基调，可根据原图保留少量必要的强调色。避免纯黑、纯白和鲜艳高饱和颜色。 构图要求： - 自动根据上传的参考图生成对应比例 - 背景为温暖、干净、接近无纹理的象牙白 - 上方保留约 20%–30% 的大面积空白 - 插画主体集中在画面中部偏下 - 主体约占画布高度的 45%–55% - 主体周围保留充分的呼吸感 - 使用轻微不对称但视觉平衡的编辑构图 - 不要铺满画面，不要添加边框、卡片、拼贴或样机 根据上传图片呈现的内容、空间或情绪，自动创作一个由 2–4 个英文单词组成的诗意标题。在画面下方偏左排版，使用优雅、高对比度的古典编辑衬线字体，颜色为深咖啡黑。 标题下方自动生成一句由 4–9 个英文单词组成的简短副标题，使用较小的斜体衬线字体。文字需要自然、克制，与图片内容直接相关。除此之外不要添加日期、Logo、标签、水印或其他文字。 最终效果应当像一本高端建筑、室内、家具、艺术或生活方式独立杂志中的单页插画：安静、松弛、温暖，具有设计感、留白感和收藏感。 禁止出现： 照片写实感、3D渲染、CGI质感、精确矢量图、儿童绘本风、卡通风、黑色粗描边、复杂透视、密集物件、过度装饰、强烈渐变、高饱和色彩、厚重阴影、明显纸张污渍、复古做旧、胶带、拼贴、海报边框、Logo和水印。 最终只输出完成的编辑插画海报，不要输出分析过程或文字说明。 {moodNotes} {textInstruction}",
    negativePrompt:
      "photorealistic, 3d render, cgi, accurate vector, children illustration, cartoon, thick black strokes, complex perspective, crowded objects, over decoration, strong gradient, neon, saturated colors, dark shadow, paper texture, vintage stain, tape, collage, borders, watermark, logo",
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
  <defs>
    <filter id="me_blur">
      <feGaussianBlur stdDeviation="3"/>
    </filter>
    <linearGradient id="me_light" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FDE68A" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#F59E0B" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="300" height="400" fill="#F9F6F0"/>
  <g id="gouache_art" transform="translate(25, 80)">
    <path d="M15 40 L180 30 L180 200 L15 200 Z" fill="#E8E2D7" opacity="0.9"/>
    <path d="M40 50 Q85 30 130 50 L130 150 L40 150 Z" fill="#D2DBD2" opacity="0.8"/>
    <rect x="48" y="60" width="74" height="85" rx="3" fill="#BAC7BD" opacity="0.65"/>
    <polygon points="120,40 225,120 180,210 65,180" fill="url(#me_light)" opacity="0.5" filter="url(#me_blur)"/>
    <ellipse cx="120" cy="170" rx="65" ry="24" fill="#C98A62" opacity="0.9"/>
    <ellipse cx="120" cy="168" rx="63" ry="22" fill="#DE9E74" opacity="0.95"/>
    <path d="M112 155 Q108 140 114 135 Q120 140 116 155 Z" fill="#F4EDE4"/>
    <path d="M115 135 Q110 115 125 105 M114 122 Q126 120 128 114 M112 128 Q102 126 104 118" stroke="#4A5568" stroke-width="1.2" fill="none" stroke-linecap="round"/>
    <circle cx="128" cy="114" r="3" fill="#6B7280" opacity="0.8"/>
    <circle cx="104" cy="118" r="3" fill="#6B7280" opacity="0.8"/>
    <circle cx="125" cy="105" r="3.5" fill="#718096" opacity="0.9"/>
    <path d="M40 135 C38 150 42 170 42 195 M55 135 C53 150 56 170 56 195" stroke="#3D352E" stroke-width="1.4" stroke-linecap="round" fill="none"/>
    <path d="M35 155 Q48 150 62 156" stroke="#3D352E" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <ellipse cx="48" cy="158" rx="14" ry="5" fill="#B8A495" opacity="0.7"/>
    <path d="M185 135 C183 150 186 170 186 195 M198 135 C196 150 199 170 200 195" stroke="#3D352E" stroke-width="1.4" stroke-linecap="round" fill="none"/>
    <path d="M180 155 Q192 150 206 156" stroke="#3D352E" stroke-width="1.6" stroke-linecap="round" fill="none"/>
    <ellipse cx="193" cy="158" rx="14" ry="5" fill="#B8A495" opacity="0.7"/>
    <line x1="120" y1="0" x2="120" y2="75" stroke="#3D352E" stroke-width="0.8"/>
    <path d="M102 85 Q120 72 138 85 Z" fill="#2D3748"/>
    <circle cx="120" cy="88" r="4" fill="#FBBF24" filter="url(#me_blur)"/>
    <line x1="15" y1="200" x2="235" y2="200" stroke="#3D352E" stroke-width="1.3" stroke-linecap="round"/>
    <line x1="15" y1="40" x2="15" y2="200" stroke="#3D352E" stroke-width="1" stroke-linecap="round"/>
    <line x1="180" y1="30" x2="180" y2="200" stroke="#3D352E" stroke-width="1" stroke-linecap="round"/>
  </g>
  <g id="typography" transform="translate(32, 335)">
    <text x="0" y="0" font-family="'Didot', 'Playfair Display', 'Songti SC', 'STSong', serif" font-size="21" font-weight="600" fill="#2A2421" letter-spacing="0.5">Soft Gatherings</text>
    <text x="1" y="16" font-family="'Baskerville', 'Georgia', serif" font-style="italic" font-size="8.8" fill="#6E6259" letter-spacing="0.6">Where light lingers and time slows down.</text>
    <text x="1" y="32" font-family="'Helvetica Neue', sans-serif" font-size="5.5" font-weight="700" fill="#A89F91" letter-spacing="2.2">EDITORIAL LIVING • ISSUE NO. 10</text>
  </g>
</svg>`,
  },
  {
    id: "funny_ugly_doodle",
    coverImage: "/covers/11_funny_ugly_doodle.webp",
    name: "魔性丑萌蜡笔涂鸦",
    enName: "10 · Funny Ugly Doodle Meme Drawing",
    category: "illustration",
    badge: "Meme 涂鸦",
    enabled: true,
    order: 10,
    githubUrl: "",
    description:
      "将照片转化为魔性、幽默、故意画得很烂的廉价蜡笔/马克笔涂鸦。粗糙凌乱的儿童简笔画风、崩坏失真的透视与笨拙滑稽的人物表情，点缀戴墨镜太阳、魔性对话框（如 SUP PEASANTS、AYO WHAT 等）与街头草稿涂鸦，极具互联网梗图 Meme 喜感。",
    aspectRatio: "auto",
    recommendedTemplateId: "modern-gallery-single",
    tags: ["魔性涂鸦", "蜡笔手绘", "廉价马克笔", "Meme梗图", "儿童画风", "幽默恶搞", "抽象简笔"],
    promptTemplate:
      "Turn this photo into a funny ugly doodle drawing. Make it look like: a quick sketch using a cheap marker or crayon messy, rough, childlike style bad perspective and awkward proportions slightly exaggerated facial features Add: simple cartoon background (like buildings, trees, street) random sketchy lines and details uneven coloring and visible strokes Style: looks like a lazy drawing, not polished humorous and a bit stupid-looking meme-like, casual, internet style Do NOT: make it realistic. {moodNotes} {textInstruction}",
    negativePrompt:
      "photorealistic, 3d render, detailed art, clean vector, polished digital painting, beautiful lighting, accurate proportions, smooth gradients, cinematic",
    previewSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
  <defs>
    <!-- Paper texture & sketch patterns -->
    <pattern id="doodle_hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="8" stroke="#D1D5DB" stroke-width="0.8" />
    </pattern>
    <pattern id="crayon_orange" width="6" height="6" patternTransform="rotate(25 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="6" stroke="#EA580C" stroke-width="2.2" opacity="0.65"/>
    </pattern>
    <pattern id="crayon_green" width="6" height="6" patternTransform="rotate(70 0 0)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="6" stroke="#16A34A" stroke-width="2" opacity="0.7"/>
    </pattern>
  </defs>

  <!-- Warm sketchbook paper background -->
  <rect width="300" height="400" fill="#FDFCF7"/>
  <rect x="10" y="10" width="280" height="380" rx="3" fill="#FAF5E8" stroke="#E5DECE" stroke-width="1.5"/>

  <!-- Background Sky & Doodles -->
  <!-- Cool Sunglass Sun -->
  <g id="sun" transform="translate(68, 55)">
    <!-- Sun Rays -->
    <path d="M0 -22 L0 -30 M15 -15 L22 -22 M22 0 L30 0 M15 15 L22 22 M0 22 L0 30 M-15 15 L-22 22 M-22 0 L-30 0 M-15 -15 L-22 -22" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="0" cy="0" r="18" fill="#FDE047" stroke="#EA580C" stroke-width="2"/>
    <!-- Sunglasses -->
    <polygon points="-12,-5 -2,-5 -3,3 -10,3" fill="#18181B"/>
    <polygon points="2,-5 12,-5 10,3 3,3" fill="#18181B"/>
    <line x1="-2" y1="-3" x2="2" y2="-3" stroke="#18181B" stroke-width="2"/>
    <line x1="-10" y1="-3" x2="-4" y2="1" stroke="#FFFFFF" stroke-width="1"/>
    <line x1="4" y1="-3" x2="10" y2="1" stroke="#FFFFFF" stroke-width="1"/>
    <!-- Smirk -->
    <path d="M-6 8 Q0 13 8 7" fill="none" stroke="#EA580C" stroke-width="2" stroke-linecap="round"/>
  </g>

  <!-- Doodled flying birds -->
  <path d="M120 38 Q125 32 130 38 Q135 32 140 38" fill="none" stroke="#4B5563" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M148 48 Q152 44 156 48 Q160 44 164 48" fill="none" stroke="#6B7280" stroke-width="1.2" stroke-linecap="round"/>

  <!-- Sketchy Hotel / City Building on Left -->
  <g id="building" transform="translate(24, 75)">
    <polygon points="4,20 46,16 44,145 2,145" fill="#E9D5FF" stroke="#374151" stroke-width="1.8"/>
    <!-- Antenna & Sign -->
    <line x1="24" y1="16" x2="24" y2="2" stroke="#374151" stroke-width="1.5"/>
    <rect x="10" y="6" width="28" height="10" fill="#FEF08A" stroke="#374151" stroke-width="1.2"/>
    <text x="24" y="14" font-family="'Comic Sans MS', cursive, sans-serif" font-size="6" font-weight="bold" fill="#1F2937" text-anchor="middle">HOTEL</text>
    <!-- Windows -->
    <rect x="8" y="26" width="8" height="10" fill="#FEF08A" stroke="#4B5563" stroke-width="1"/>
    <rect x="22" y="25" width="8" height="10" fill="#FEF08A" stroke="#4B5563" stroke-width="1"/>
    <rect x="34" y="24" width="7" height="10" fill="#DDD6FE" stroke="#4B5563" stroke-width="1"/>
    <rect x="8" y="44" width="8" height="10" fill="#DDD6FE" stroke="#4B5563" stroke-width="1"/>
    <rect x="22" y="43" width="8" height="10" fill="#FEF08A" stroke="#4B5563" stroke-width="1"/>
    <rect x="34" y="42" width="7" height="10" fill="#FEF08A" stroke="#4B5563" stroke-width="1"/>
    <rect x="8" y="62" width="8" height="10" fill="#FEF08A" stroke="#4B5563" stroke-width="1"/>
    <rect x="22" y="61" width="8" height="10" fill="#DDD6FE" stroke="#4B5563" stroke-width="1"/>
    <rect x="34" y="60" width="7" height="10" fill="#FEF08A" stroke="#4B5563" stroke-width="1"/>
    <!-- Scribble brick lines -->
    <line x1="6" y1="85" x2="42" y2="85" stroke="#9333EA" stroke-width="1" stroke-dasharray="2,3"/>
    <line x1="6" y1="105" x2="42" y2="105" stroke="#9333EA" stroke-width="1" stroke-dasharray="3,2"/>
  </g>

  <!-- Wonky Tree & Sign on Right -->
  <g id="tree_and_sign" transform="translate(230, 65)">
    <!-- Tree Trunk & Foliage -->
    <path d="M30 65 L28 120 M36 65 L38 120" stroke="#78350F" stroke-width="3" stroke-linecap="round"/>
    <path d="M12 60 C5 40 25 20 40 25 C55 15 68 35 62 55 C68 70 50 82 35 78 C20 85 8 75 12 60 Z" fill="#86EFAC" stroke="#15803D" stroke-width="2"/>
    <circle cx="36" cy="48" r="16" fill="url(#crayon_green)"/>
    <!-- Tiny stick bird on tree -->
    <ellipse cx="48" cy="32" rx="4" ry="3" fill="#38BDF8"/>
    <polygon points="52,32 56,33 52,35" fill="#F59E0B"/>
    <!-- NO DOGS sign -->
    <g transform="translate(-14, 75)">
      <line x1="14" y1="26" x2="14" y2="55" stroke="#78350F" stroke-width="2.5"/>
      <rect x="0" y="0" width="28" height="26" fill="#F8FAFC" stroke="#1F2937" stroke-width="1.5" rx="2"/>
      <circle cx="14" cy="13" r="9" fill="none" stroke="#DC2626" stroke-width="1.8"/>
      <line x1="7" y1="7" x2="21" y2="19" stroke="#DC2626" stroke-width="1.8"/>
      <text x="14" y="8" font-family="'Comic Sans MS', cursive, sans-serif" font-size="4.2" font-weight="bold" fill="#1F2937" text-anchor="middle">NO</text>
      <text x="14" y="22" font-family="'Comic Sans MS', cursive, sans-serif" font-size="4.2" font-weight="bold" fill="#1F2937" text-anchor="middle">DOGS</text>
    </g>
  </g>

  <!-- Speech Bubble: 'SUP PEASANTS' -->
  <g id="speech_bubble" transform="translate(165, 52)">
    <!-- Cloud / Bubble outline -->
    <path d="M10 20 C2 10 20 -4 46 -3 C72 -2 85 12 78 26 C82 38 65 48 45 46 C35 48 20 46 14 38 C6 38 4 30 10 20 Z" fill="#FFFFFF" stroke="#18181B" stroke-width="2"/>
    <!-- Pointer -->
    <polygon points="22,42 12,56 30,44" fill="#FFFFFF"/>
    <polyline points="21,41 12,56 30,44" fill="none" stroke="#18181B" stroke-width="2"/>
    <text x="44" y="18" font-family="'Impact', 'Arial Black', sans-serif" font-size="9" fill="#18181B" text-anchor="middle">SUP</text>
    <text x="44" y="32" font-family="'Impact', 'Arial Black', sans-serif" font-size="8.5" fill="#18181B" text-anchor="middle">PEASANTS</text>
  </g>

  <!-- Sidewalk & Ground Hatching -->
  <g id="ground">
    <path d="M14 240 Q150 215 286 235" fill="none" stroke="#4B5563" stroke-width="2.5"/>
    <path d="M14 242 L286 237 L286 385 L14 385 Z" fill="#E5E7EB" opacity="0.4"/>
    <!-- Perspective lines & rough cracks -->
    <line x1="40" y1="240" x2="15" y2="385" stroke="#9CA3AF" stroke-width="1.2" stroke-dasharray="4,3"/>
    <line x1="120" y1="230" x2="85" y2="385" stroke="#9CA3AF" stroke-width="1.2" stroke-dasharray="5,3"/>
    <line x1="210" y1="232" x2="225" y2="385" stroke="#9CA3AF" stroke-width="1.2" stroke-dasharray="4,3"/>
    <line x1="270" y1="236" x2="280" y2="385" stroke="#9CA3AF" stroke-width="1.2" stroke-dasharray="4,3"/>
  </g>

  <!-- Foreground Meme Cat / Funny Ugly Doodle Figure -->
  <g id="meme_cat">
    <!-- Body Base Crayon Filling -->
    <path d="M110 210 C140 180 220 185 240 220 C255 245 250 280 230 300 C200 320 145 320 100 290 C80 270 85 235 110 210 Z" fill="#FDBA74"/>
    <path d="M110 210 C140 180 220 185 240 220 C255 245 250 280 230 300 C200 320 145 320 100 290 C80 270 85 235 110 210 Z" fill="url(#crayon_orange)"/>

    <!-- Tail sticking out weirdly -->
    <path d="M235 225 C265 190 275 160 270 145 C265 140 258 145 255 155 C250 170 240 195 228 215" fill="#F97316" stroke="#18181B" stroke-width="2.5" stroke-linecap="round"/>

    <!-- Left big clumsy leg stretched out towards camera -->
    <path d="M120 275 C100 290 85 320 95 345 C105 370 145 365 140 335 C138 315 142 295 150 285" fill="#FDBA74" stroke="#18181B" stroke-width="2.5"/>
    <path d="M120 275 C100 290 85 320 95 345 C105 370 145 365 140 335 C138 315 142 295 150 285" fill="url(#crayon_orange)"/>
    <!-- Pink toe beans on huge paw -->
    <ellipse cx="118" cy="352" rx="6" ry="4" fill="#F472B6" stroke="#18181B" stroke-width="1.2"/>
    <circle cx="106" cy="344" r="3" fill="#F472B6"/>
    <circle cx="116" cy="338" r="3" fill="#F472B6"/>
    <circle cx="128" cy="342" r="3" fill="#F472B6"/>

    <!-- Right outstretched leg -->
    <path d="M190 285 C210 295 235 310 250 300 C262 290 255 270 235 265" fill="#FDBA74" stroke="#18181B" stroke-width="2.5"/>
    <circle cx="248" cy="292" r="3" fill="#F472B6"/>
    <circle cx="254" cy="285" r="2.5" fill="#F472B6"/>

    <!-- Awkward front arm resting on ground -->
    <path d="M175 245 C185 270 190 300 185 315 C180 322 170 320 168 310 C165 290 162 265 160 250" fill="#FED7AA" stroke="#18181B" stroke-width="2.5"/>

    <!-- Cat Head & Ears -->
    <g transform="translate(130, 160)">
      <!-- Ears -->
      <polygon points="-12,-8 -22,-32 -2,-18" fill="#FDBA74" stroke="#18181B" stroke-width="2.5"/>
      <polygon points="-10,-12 -18,-27 -5,-18" fill="#F472B6"/>
      <polygon points="18,-15 32,-30 26,-5" fill="#FDBA74" stroke="#18181B" stroke-width="2.5"/>
      <polygon points="20,-13 28,-25 24,-7" fill="#F472B6"/>
      <!-- Head shape -->
      <path d="M-20 -5 C-30 15 -20 40 5 42 C30 43 40 20 32 -3 C20 -15 -10 -15 -20 -5 Z" fill="#FDBA74" stroke="#18181B" stroke-width="2.5"/>
      <path d="M-20 -5 C-30 15 -20 40 5 42 C30 43 40 20 32 -3 C20 -15 -10 -15 -20 -5 Z" fill="url(#crayon_orange)"/>
      <!-- Cheek fluffs -->
      <path d="M-24 15 L-34 18 L-22 24 M-23 26 L-32 30 L-18 32" stroke="#18181B" stroke-width="2" stroke-linecap="round"/>
      <path d="M34 15 L44 17 L33 24 M33 26 L42 29 L31 32" stroke="#18181B" stroke-width="2" stroke-linecap="round"/>

      <!-- Smug / Judgmental Meme Cat Eyes -->
      <!-- Left Eye -->
      <ellipse cx="-8" cy="12" rx="7" ry="5" fill="#FEF08A" stroke="#18181B" stroke-width="1.8"/>
      <line x1="-15" y1="8" x2="-1" y2="12" stroke="#18181B" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="-8" cy="13" rx="2" ry="3.5" fill="#18181B"/>
      <!-- Right Eye -->
      <ellipse cx="16" cy="11" rx="7" ry="5" fill="#FEF08A" stroke="#18181B" stroke-width="1.8"/>
      <line x1="9" y1="11" x2="23" y2="7" stroke="#18181B" stroke-width="2.2" stroke-linecap="round"/>
      <ellipse cx="16" cy="12" rx="2" ry="3.5" fill="#18181B"/>

      <!-- Tiny grumpy nose and crooked mouth -->
      <polygon points="3,20 0,23 6,23" fill="#F472B6" stroke="#18181B" stroke-width="1.2"/>
      <path d="M3 23 L3 26 M3 26 Q-3 29 -7 27 M3 26 Q9 29 13 26" fill="none" stroke="#18181B" stroke-width="1.8" stroke-linecap="round"/>
      <!-- Whiskers -->
      <line x1="-12" y1="24" x2="-35" y2="22" stroke="#18181B" stroke-width="1.5"/>
      <line x1="-12" y1="27" x2="-33" y2="32" stroke="#18181B" stroke-width="1.5"/>
      <line x1="16" y1="24" x2="38" y2="23" stroke="#18181B" stroke-width="1.5"/>
      <line x1="16" y1="27" x2="36" y2="33" stroke="#18181B" stroke-width="1.5"/>
    </g>
  </g>

  <!-- Ground Meme Junk (crushed can, fish bone, poop, (wtf)) -->
  <!-- Crushed Soda Can on Left -->
  <g id="soda_can" transform="translate(35, 335) rotate(-15)">
    <rect x="0" y="0" width="16" height="22" rx="3" fill="#EF4444" stroke="#18181B" stroke-width="1.5"/>
    <ellipse cx="8" cy="2" rx="7" ry="2" fill="#E5E7EB" stroke="#18181B" stroke-width="1"/>
    <path d="M2 11 Q8 16 14 11" stroke="#FFFFFF" stroke-width="2" fill="none"/>
  </g>

  <!-- Fish Skeleton Doodle on Right -->
  <g id="fish_bone" transform="translate(215, 332)">
    <line x1="0" y1="8" x2="28" y2="8" stroke="#18181B" stroke-width="1.6"/>
    <!-- Head -->
    <polygon points="28,8 36,2 36,14" fill="#E5E7EB" stroke="#18181B" stroke-width="1.5"/>
    <circle cx="33" cy="7" r="1" fill="#18181B"/>
    <!-- Ribs -->
    <line x1="8" y1="2" x2="8" y2="14" stroke="#18181B" stroke-width="1.4"/>
    <line x1="15" y1="1" x2="15" y2="15" stroke="#18181B" stroke-width="1.4"/>
    <line x1="22" y1="3" x2="22" y2="13" stroke="#18181B" stroke-width="1.4"/>
    <!-- Tail -->
    <polygon points="0,8 -6,2 -6,14" fill="#E5E7EB" stroke="#18181B" stroke-width="1.5"/>
  </g>

  <!-- Funny Little Poop Doodle -->
  <g id="poop" transform="translate(254, 326)">
    <path d="M5 20 C0 20 0 14 6 14 C1 14 2 8 8 8 C5 8 7 3 11 3 C12 3 13 6 11 8 C16 8 18 14 14 14 C19 14 19 20 12 20 Z" fill="#92400E" stroke="#18181B" stroke-width="1.5"/>
    <circle cx="6" cy="2" r="1" fill="#18181B"/>
    <circle cx="16" cy="4" r="1" fill="#18181B"/>
    <text x="10" y="-4" font-family="'Comic Sans MS', cursive, sans-serif" font-size="5" fill="#6B7280" text-anchor="middle">(wtf)</text>
  </g>

  <!-- Bottom Bad Drawing Caption / Meme Tag -->
  <g id="footer_caption" transform="translate(150, 386)">
    <text x="0" y="0" font-family="'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif" font-size="7.5" font-weight="bold" fill="#78716C" text-anchor="middle" letter-spacing="1.2">11 · FUNNY UGLY DOODLE MEME • CHEAP CRAYON</text>
  </g>
</svg>`,
  },
  {
  "id": "fieldform_raster",
  "name": "场域引力场 · 光栅线形",
  "enName": "11 · Fieldform Raster Gravitation",
  "category": "modern",
  "badge": "光栅场域",
  "order": 11,
  "enabled": true,
  "githubUrl": "https://v.douyin.com/xHWdRbNdjCg/",
  "coverImage": "/covers/11_fieldform_raster.jpg",
  "description": "以密集的黑白微光连续平行线构建空间场域。线条随原图主体三维体积自然弯曲形变与聚拢，深黑背景搭配极简坐标与数学几何构造。",
  "aspectRatio": "auto",
  "tags": [
    "光栅线形",
    "物理引力场",
    "黑白微光",
    "实验海报",
    "数学几何",
    "连续平行线"
  ],
  "promptTemplate": "以用户上传的照片为唯一主题与形态依据，创作一张独立的{aspectRatioDesc}实验编辑海报。不要拼图，不要输出说明文字。先观察照片中最具辨识度的主体、外轮廓、体积、姿态、遮挡和环境留白，将主体转译为隐藏的三维形态，使它像从连续光栅场域中向外推挤而出。主体在画面中占约70–80%，保留足够的形态线索使人能辨认来源，但不进行逼真重绘。整个画面以极其细密、锐利、平滑、间距均匀的连续平行线为基本材料。线条通过少数几个受控的压缩、扩张和弯曲区域表现体积；在远离主体的安静区域逐渐恢复为笔直、平行、均匀的线场。维持线条连续，避免断裂、交叉、锯齿和杂乱。主体由线密度变化与负空间共同显现，不增加独立的实体轮廓线，不做写实渲染。采用严格黑白系统：深黑背景与清晰白线，局部带有微弱克制的白色边缘辉光。在画面安静留白处克制排版极小的细衬线英文与数学坐标符号。整体充满理性、静谧与超现实空间引力场美学。{moodNotes} {textInstruction}",
  "negativePrompt": "colorful neon, rainbow colors, realistic texture, messy crossed lines, broken jagged strokes, low resolution, comic style, cluttered background, cartoon, watermark, logo",
  "previewSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 400\" width=\"100%\" height=\"100%\">\n    <rect width=\"300\" height=\"400\" fill=\"#09090B\"/>\n    <path d=\"M20 180 Q150 140 280 180\" stroke=\"#FFFFFF\" stroke-width=\"0.8\" fill=\"none\" opacity=\"0.3\"/>\n    <path d=\"M20 200 Q150 120 280 200\" stroke=\"#FFFFFF\" stroke-width=\"1.1\" fill=\"none\" opacity=\"0.6\"/>\n    <path d=\"M20 220 Q150 100 280 220\" stroke=\"#FFFFFF\" stroke-width=\"1.4\" fill=\"none\" opacity=\"0.9\"/>\n    <path d=\"M20 240 Q150 130 280 240\" stroke=\"#FFFFFF\" stroke-width=\"1.1\" fill=\"none\" opacity=\"0.6\"/>\n    <path d=\"M20 260 Q150 170 280 260\" stroke=\"#FFFFFF\" stroke-width=\"0.8\" fill=\"none\" opacity=\"0.3\"/>\n    <text x=\"30\" y=\"45\" font-family=\"monospace\" font-size=\"7\" fill=\"#71717A\" letter-spacing=\"2\">FIELD STUDY / VERTICAL ORBIT</text>\n    <text x=\"270\" y=\"45\" font-family=\"monospace\" font-size=\"7\" fill=\"#A1A1AA\" text-anchor=\"end\">R(θ)</text>\n    <rect x=\"220\" y=\"356\" width=\"56\" height=\"18\" rx=\"3\" fill=\"#27272A\"/>\n    <text x=\"248\" y=\"368\" font-family=\"sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#F4F4F5\" text-anchor=\"middle\">光栅场域</text>\n  </svg>"
},
  {
  "id": "real_extension_sketch",
  "name": "实景延伸 · 线稿海报",
  "enName": "12 · Real Extension Sketch Poster",
  "category": "editorial",
  "badge": "线稿延伸",
  "order": 12,
  "enabled": true,
  "githubUrl": "https://v.douyin.com/W825uLQSVWc/",
  "coverImage": "/covers/12_real_extension_sketch.jpg",
  "description": "上方60%—70%保留原照片真实摄影质感，下方暖白纸面延伸出手绘线条与故事感小人互动，搭配克制手写英文旁白，赋予废片诗意生命力。",
  "aspectRatio": "auto",
  "tags": [
    "实景延伸",
    "暖白象牙纸",
    "钢笔线稿",
    "故事小人",
    "手写旁白",
    "诗意旅行"
  ],
  "promptTemplate": "将上传的照片制作成一张独立的{aspectRatioDesc}实景延伸线稿海报。上方约60%—70%保留原照片的真实摄影质感，保持原有主体、人物、建筑、自然景物、光线、色彩和空间关系，只允许为适配画幅进行必要的等比例裁切。下方留出干净的暖白象牙纸面，带轻微纸张纹理和充足留白。根据上传照片中最具动势的一个视觉元素（如道路、河流、花枝、海浪、小径、桥梁、光芒或建筑外轮廓），让该元素从照片对应位置顺势自然延伸到下方纸面，平滑过渡简化为细腻的黑白或淡彩手绘线条。衔接处透视连贯自然。在下方纸面上融入一个极小比例的黑色钢笔线稿人物（高度约占画面7%—10%），设计一个简单而有故事感的松弛动作与延伸出的线条产生趣味互动（如轻抚花枝、沿着线条漫步、拉住线条、坐在边缘眺望），人物姿态自然，有合理的受力与落脚点，省略五官，线条纤细自然。在下方留白处添加一句简短克制的小字号英文手写旁白（1—5个单词）。整体诗意、松弛、留白充分、编辑感高级。{moodNotes} {textInstruction}",
  "negativePrompt": "giant floating person, realistic portrait face, anime style, clumsy thick lines, abrupt cut line, cluttered collage, heavy stickers, borders, watermark, distorted perspective",
  "previewSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 400\" width=\"100%\" height=\"100%\">\n    <rect width=\"300\" height=\"400\" fill=\"#FAF8F5\"/>\n    <rect x=\"25\" y=\"25\" width=\"250\" height=\"200\" fill=\"#475569\" rx=\"3\"/>\n    <path d=\"M150 225 Q150 290 150 320\" stroke=\"#1E293B\" stroke-width=\"1.5\" fill=\"none\"/>\n    <circle cx=\"150\" cy=\"330\" r=\"4\" fill=\"#0F172A\"/>\n    <line x1=\"150\" y1=\"334\" x2=\"150\" y2=\"355\" stroke=\"#0F172A\" stroke-width=\"1.5\"/>\n    <text x=\"35\" y=\"375\" font-family=\"cursive, sans-serif\" font-size=\"9\" fill=\"#64748B\">hold the bright hour</text>\n    <rect x=\"220\" y=\"356\" width=\"56\" height=\"18\" rx=\"3\" fill=\"#334155\"/>\n    <text x=\"248\" y=\"368\" font-family=\"sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#F8FAFC\" text-anchor=\"middle\">线稿延伸</text>\n  </svg>"
},
  {
  "id": "torn_paper_zine",
  "name": "手撕拼贴 · 独立杂志",
  "enName": "13 · Torn Paper Zine Collage",
  "category": "editorial",
  "badge": "手撕拼贴",
  "order": 13,
  "enabled": true,
  "githubUrl": "https://github.com/Zeejay0/gathered-scenes-zine-skill",
  "coverImage": "/covers/13_torn_paper_zine.jpg",
  "description": "真实照片处理成不规则手撕毛边区域，与暖米白纹理纸底和简化手绘剪影自然延展，搭配大面积留白与一行极小英文打字机文字，呈现独立艺术杂志质感。",
  "aspectRatio": "auto",
  "tags": [
    "手撕毛边",
    "独立杂志",
    "丝网印刷",
    "暖米白纹理",
    "极简打字机",
    "Zine拼贴"
  ],
  "promptTemplate": "以用户上传的照片为核心，制作一张{aspectRatioDesc}独立艺术杂志实景手撕拼贴海报（Gathered Scenes Zine Collage）。混合媒介拼贴：保留上传照片核心主体、自然光影与空间关系，将照片处理为具有真实纤维毛边的不规则手撕纸张区域，置于暖米白纤维纹理纸张背景之上。撕裂边缘路径随机自由、边缘露白带有真实手工撕裂毛刺与轻微投影。手绘与动线延展（约占30%~35%）：从原照片中提取关键轮廓（如屋脊瓦片、树木枝干、地平线或道路），以简练的黑色线描/剪影与一种提取自原图的暖调高饱和色块笔触，顺势延展至纸张留白区域，维持空间透视连贯。版面保持大面积安静留白，在空白处排版一行极小字号的英文打字机单色文字。整体呈现独立艺术出版物、丝网手工印刷与粗粝旧纸张的松弛高级感。{moodNotes} {textInstruction}",
  "negativePrompt": "full bleed rectangular photo, shiny plastic, cheap digital cut, anime illustration, giant bold title, bright multi-color clutter, tourist banner, borders, logo, watermark",
  "previewSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 400\" width=\"100%\" height=\"100%\">\n    <rect width=\"300\" height=\"400\" fill=\"#F4EFE6\"/>\n    <path d=\"M50 70 Q90 55 140 65 Q200 60 240 85 Q260 140 245 230 Q200 270 120 250 Q60 240 45 160 Z\" fill=\"#2C3E50\"/>\n    <path d=\"M220 90 Q250 120 230 180\" stroke=\"#D97706\" stroke-width=\"8\" stroke-linecap=\"round\" fill=\"none\" opacity=\"0.8\"/>\n    <text x=\"180\" y=\"70\" font-family=\"monospace\" font-size=\"6\" fill=\"#78716C\">some places stay with you.</text>\n    <rect x=\"220\" y=\"356\" width=\"56\" height=\"18\" rx=\"3\" fill=\"#B45309\"/>\n    <text x=\"248\" y=\"368\" font-family=\"sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#FEF3C7\" text-anchor=\"middle\">手撕拼贴</text>\n  </svg>"
},
  {
  "id": "graffiti_sketch",
  "name": "涂鸦速写 · 随性手绘",
  "enName": "14 · Expressive Graffiti Sketch",
  "category": "illustration",
  "badge": "涂鸦速写",
  "order": 14,
  "enabled": true,
  "githubUrl": "https://v.douyin.com/u6YNky3fVwM/",
  "coverImage": "/covers/14_graffiti_sketch.jpg",
  "description": "保留原图构图与空间主体，以粗细变化的即兴钢笔线条、干刷水彩块面与飞白刷痕重新表现，点缀草稿箭头、圈画记号与角落专属艺术签名。",
  "aspectRatio": "auto",
  "tags": [
    "自由速写",
    "干刷水粉",
    "手绘草稿",
    "飞白刷痕",
    "设计符号",
    "随性插画"
  ],
  "promptTemplate": "将用户上传的照片整体转化为一张生动潇洒的{aspectRatioDesc}【涂鸦速写手绘风插画海报】（Expressive Graffiti Sketch）。严格保留原图的核心构图骨架、主体姿态、地平线与空间透视关系，用快速勾勒、自由变形、即兴手绘和草稿式线条表现。线条随手、夸张、粗细不一、略显凌乱但极具节奏感与表现力，强调概括与趣味，避免严谨写实刻画。色彩使用粗糙、干刷感明显的块面，保留不均匀涂抹痕迹、刷痕、飞白与覆盖感，色彩严格从原照片中提取适配（如落日暖橙、深墨色、树林青绿）。不要细腻水彩晕染，不要柔和雾化，保留纯净白色或米白底纸质感。背景以充足留白为主，保持简洁、轻松与设计感；在画面空白处随性点缀少量辅助性手绘设计符号：手绘小箭头、轻微圈画、记号、重复线条或随手写下的涂鸦手写短字。画面左下角或角落自然融入一个精致克制的手写艺术签名作为作品落款。{moodNotes} {textInstruction}",
  "negativePrompt": "photorealistic render, blurry gradient, smooth 3D airbrush, soft misty fog, children crayon mess without structure, heavy black muddy blob, digital clip art, watermark",
  "previewSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 400\" width=\"100%\" height=\"100%\">\n    <rect width=\"300\" height=\"400\" fill=\"#FFFFFF\"/>\n    <path d=\"M30 60 Q120 40 270 50 Q230 140 180 180 Q100 160 30 110 Z\" fill=\"#EA580C\" opacity=\"0.85\"/>\n    <line x1=\"20\" y1=\"280\" x2=\"280\" y2=\"280\" stroke=\"#18181B\" stroke-width=\"2\"/>\n    <rect x=\"130\" y=\"190\" width=\"30\" height=\"90\" fill=\"#27272A\"/>\n    <path d=\"M140 140 L160 140 M155 135 L165 140 L155 145\" stroke=\"#71717A\" stroke-width=\"1.5\" fill=\"none\"/>\n    <text x=\"35\" y=\"375\" font-family=\"cursive, sans-serif\" font-size=\"14\" fill=\"#09090B\">Syr</text>\n    <rect x=\"220\" y=\"356\" width=\"56\" height=\"18\" rx=\"3\" fill=\"#EA580C\"/>\n    <text x=\"248\" y=\"368\" font-family=\"sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#FFFFFF\" text-anchor=\"middle\">涂鸦速写</text>\n  </svg>"
},
  {
  "id": "diffuse_gradient",
  "name": "弥散渐变 · 失重色场",
  "enName": "15 · Diffuse Gradient Field",
  "category": "editorial",
  "badge": "弥散渐变",
  "order": 15,
  "enabled": true,
  "githubUrl": "https://v.douyin.com/VxSWshAKsV8/",
  "coverImage": "/covers/15_diffuse_gradient.jpg",
  "description": "双联艺术排版：顶部保留实景原图，下方将同一画面重构为大面积失重弥散渐变。3—5个柔和色场缓慢融开交叠，部分轮廓消融于通透深色光晕中。",
  "aspectRatio": "auto",
  "tags": [
    "弥散渐变",
    "自由色场",
    "超现实失重",
    "双联艺术",
    "柔和光晕",
    "诗意融开"
  ],
  "promptTemplate": "严格基于用户上传的照片，制作一张{aspectRatioDesc}双联艺术作品（Diffuse Gradient Field）。顶部保留真实摄影原片，占高度约30%—38%，真实光影与色彩忠于原片；下方使用同一主题与主体进行【弥散渐变超现实重构】：观察原图的主体、姿态、关键轮廓与色彩，保留最具辨识度的局部，重新组织画面尺度与空间，让主体局部化为半透明的色光，或让原有轮廓在失重空间中放大、悬浮、延展。大面积柔和渐变主导画面：提取原图关键色彩，构成3—5个大小不同、彼此交叠的自由弥散色场，颜色从中心向外缓慢变淡，边缘完全融开，交叠处自然混出通透的新颜色。至少一片色场穿过主体，让部分轮廓消融其中。以有颜色的深蓝、墨紫、夜绿或原图暗色打底，暗部通透，高光柔和。保留宽阔的安静区域与少量辨识度细节。整体洁净、朦胧、轻盈、超现实失重感。不添加杂乱文字或水印。{moodNotes} {textInstruction}",
  "negativePrompt": "solid harsh outlines, cheap neon glow, dirty muddy noise, stars and galaxy sparkles, dense smoke, low quality blur, random disconnected objects, borders, watermark",
  "previewSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 400\" width=\"100%\" height=\"100%\">\n    <rect width=\"300\" height=\"400\" fill=\"#0F172A\"/>\n    <rect x=\"20\" y=\"20\" width=\"260\" height=\"110\" fill=\"#1E293B\" rx=\"2\"/>\n    <circle cx=\"110\" cy=\"270\" r=\"70\" fill=\"#E11D48\" opacity=\"0.6\" filter=\"blur(20px)\"/>\n    <circle cx=\"190\" cy=\"250\" r=\"80\" fill=\"#3B82F6\" opacity=\"0.6\" filter=\"blur(20px)\"/>\n    <circle cx=\"150\" cy=\"300\" r=\"60\" fill=\"#F59E0B\" opacity=\"0.5\" filter=\"blur(20px)\"/>\n    <rect x=\"220\" y=\"356\" width=\"56\" height=\"18\" rx=\"3\" fill=\"#6366F1\"/>\n    <text x=\"248\" y=\"368\" font-family=\"sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#FFFFFF\" text-anchor=\"middle\">弥散渐变</text>\n  </svg>"
},
  {
  "id": "chinese_paper_relief",
  "name": "中式浮雕 · 手工纸浆",
  "enName": "16 · Chinese Paper Pulp Relief",
  "category": "vintage",
  "badge": "纸浆浮雕",
  "order": 16,
  "enabled": true,
  "githubUrl": "https://v.douyin.com/-NSRluJi9Zc/",
  "coverImage": "/covers/16_chinese_paper_relief.jpg",
  "description": "将原图主体与手工纸浆浅浮雕结合。主体内部保留清晰细节，外围转化为纸纤维撕裂与矿物厚涂，柔和侧光微影，左上小号宋体标题，约60%纯净留白。",
  "aspectRatio": "auto",
  "tags": [
    "手工纸浆",
    "浅浮雕",
    "矿物厚涂",
    "宋体排版",
    "柔和侧光",
    "东方画册"
  ],
  "promptTemplate": "将用户上传的照片转化为一张独立的{aspectRatioDesc}艺术海报（手工纸浆浅浮雕风格）。单图输出，不分栏不拼图。提取照片中最具辨识度的主体（人物/建筑/山川/植物/器物），忠实保留其轮廓姿态、核心色彩与空间关系，剔除杂乱背景。采用非对称构图，主体偏向中下部或一侧，画面约60%保留干净质朴的暖象牙白艺术纸留白。纸浆浮雕质感融合：主体内部保留清晰具象的细节与原图色彩，外围轮廓逐渐转化为立体不规则的纯白纸纤维、手工纸浆凸起、矿物颜料厚涂与干刷露白，自然消融于纸面底色。采用柔和的自然侧光，以细腻微阴影表现纸浆薄层的立体起伏，材质哑光、细腻、微糙手工纸肌理。排版设计：在宽阔留白处排版极简典雅文字，包含小号高瘦宋体或明朝体中文主标题（可分两行），搭配一行更小的细衬线英文注释与一条取自原图配色的极短细线，字距舒朗，呈现高级独立艺术出版物格调。{moodNotes} {textInstruction}",
  "negativePrompt": "plastic 3d CGI, glossy clay, yellowed dirty stains, heavy drop shadows, full bleed messy background, oversized bold typography, warped faces, borders, watermark",
  "previewSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 400\" width=\"100%\" height=\"100%\">\n    <rect width=\"300\" height=\"400\" fill=\"#FBF9F5\"/>\n    <path d=\"M120 180 L230 180 L240 330 L110 320 Z\" fill=\"#DC2626\"/>\n    <path d=\"M90 210 Q120 170 140 230 Q160 160 210 210 L250 340 L80 340 Z\" fill=\"#E2E8F0\" opacity=\"0.9\"/>\n    <text x=\"40\" y=\"70\" font-family=\"serif\" font-size=\"18\" font-weight=\"900\" fill=\"#1C1917\" letter-spacing=\"3\">雪境</text>\n    <text x=\"40\" y=\"95\" font-family=\"serif\" font-size=\"18\" font-weight=\"900\" fill=\"#1C1917\" letter-spacing=\"3\">独行</text>\n    <line x1=\"40\" y1=\"105\" x2=\"60\" y2=\"105\" stroke=\"#DC2626\" stroke-width=\"1.5\"/>\n    <rect x=\"220\" y=\"356\" width=\"56\" height=\"18\" rx=\"3\" fill=\"#991B1B\"/>\n    <text x=\"248\" y=\"368\" font-family=\"sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#FEF2F2\" text-anchor=\"middle\">纸浆浮雕</text>\n  </svg>"
},
  {
  "id": "paper_line_continuation",
  "name": "纸上续行 · 彩铅线描",
  "enName": "17 · Paper Line Continuation",
  "category": "editorial",
  "badge": "纸上续行",
  "order": 17,
  "enabled": true,
  "githubUrl": "https://v.douyin.com/H8-acmVSJyM/",
  "coverImage": "/covers/17_paper_line_continuation.jpg",
  "description": "上方真实摄影，让画面关键元素（枝桠、水面、小径、阳光）顺势向下延展，转化为暖白纸上的细腻彩铅线描，小人物在其中穿梭互动，续写诗意故事。",
  "aspectRatio": "auto",
  "tags": [
    "摄影手绘融合",
    "彩铅线描",
    "故事续行",
    "纸面留白",
    "趣味互动",
    "插画海报"
  ],
  "promptTemplate": "根据用户上传的照片，创作一张{aspectRatioDesc}摄影与彩铅手绘无缝融合的艺术作品（Paper Line Continuation 纸上续行）。上方保留原照片的现场真实光影与主体质感；让原图中的一个核心自然元素（如树枝、枝桠、水波、麦浪、小径、阳光射线或建筑轮廓）自然向下延伸，在边缘平滑生长转化为暖白纹理画纸上的细腻彩铅与手绘墨线。在延伸出的线条构架中融入一个精致小比例手绘人物，与这个延伸元素产生清楚、有趣、充满想象力的互动关系（如在线条编织的网中漫步、轻抚花叶线条、在延伸的枝头眺望），动作有故事感与呼吸感。色彩取自原片本色，线条纤细细腻，保留手工画纸质感与恰到好处的呼吸留白。边缘点缀极简细小手写英文，作品充满治愈、温情与诗意想象力。{moodNotes} {textInstruction}",
  "negativePrompt": "abrupt mechanical boundary, hard split line, cartoon anime face, clumsy thick outlines, messy watercolor splatters, floating giant person, dark muddy background, watermark",
  "previewSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 400\" width=\"100%\" height=\"100%\">\n    <rect width=\"300\" height=\"400\" fill=\"#FDFBF7\"/>\n    <rect x=\"25\" y=\"25\" width=\"250\" height=\"150\" fill=\"#F59E0B\" rx=\"3\" opacity=\"0.9\"/>\n    <path d=\"M120 175 Q160 230 200 270 Q230 300 240 330\" stroke=\"#78350F\" stroke-width=\"2.5\" fill=\"none\"/>\n    <path d=\"M130 175 Q150 250 170 300\" stroke=\"#D97706\" stroke-width=\"1.2\" fill=\"none\"/>\n    <circle cx=\"215\" cy=\"275\" r=\"3\" fill=\"#1C1917\"/>\n    <line x1=\"215\" y1=\"278\" x2=\"215\" y2=\"295\" stroke=\"#1C1917\" stroke-width=\"1.2\"/>\n    <text x=\"35\" y=\"375\" font-family=\"cursive, sans-serif\" font-size=\"8\" fill=\"#92400E\">Weaving the autumn</text>\n    <rect x=\"220\" y=\"356\" width=\"56\" height=\"18\" rx=\"3\" fill=\"#D97706\"/>\n    <text x=\"248\" y=\"368\" font-family=\"sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#FFFBEB\" text-anchor=\"middle\">纸上续行</text>\n  </svg>"
},
  {
  "id": "ai_travel_journal",
  "name": "旅行手账 · 水彩拼贴",
  "enName": "18 · Travel Journal Scrapbook",
  "category": "editorial",
  "badge": "旅行手账",
  "order": 18,
  "enabled": true,
  "githubUrl": "https://v.douyin.com/4fIvoVGzJwM/",
  "coverImage": "/covers/18_ai_travel_journal.jpg",
  "description": "上半部分保留真实风景摄影，下半部分自然过渡为水彩手绘插画与手撕纸拼贴，融入复古旅行邮戳、手写随笔、地点明信片与旅行日期，记录旅途记忆。",
  "aspectRatio": "auto",
  "tags": [
    "旅行手账",
    "水彩手绘",
    "手撕纸拼贴",
    "旅行邮戳",
    "复古便签",
    "手写日记"
  ],
  "promptTemplate": "将用户上传的照片制作成一张{aspectRatioDesc}清新文艺的【旅行手账拼贴海报】（Travel Journal Scrapbook）。完整保留原照片的核心风景或主体与现场光影。画面布局：上半部分展现原汁原味的实景摄影，下半部分通过不规则的手撕纸毛边与淡彩水渍，自然过渡为暖米白纸面上的水彩与钢笔手绘插画，重绘同一场景的局部细节。手账元素点缀：在纸面留白处巧妙穿插复古旅行手账设计元素，包括：一枚精致的旅行印章/邮戳（印有目的地地名与微缩图标）、胶带粘贴的小号旅行植物/速写便签、一行文艺手写英文或中文旅行随笔，以及年份日期与地名字样。色彩清新、自然、干净，具有独立旅行生活方式杂志与精美旅行手账本的收藏质感。{moodNotes} {textInstruction}",
  "negativePrompt": "messy chaotic doodle, cheap digital stickers, saturated cartoon graphics, low resolution, dirty paper stains, illegible scribbles, ugly fonts, watermark, commercial advertisement",
  "previewSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 400\" width=\"100%\" height=\"100%\">\n    <rect width=\"300\" height=\"400\" fill=\"#F7F4EC\"/>\n    <rect x=\"25\" y=\"25\" width=\"250\" height=\"150\" fill=\"#1E3A8A\" rx=\"2\"/>\n    <circle cx=\"220\" cy=\"225\" r=\"22\" stroke=\"#475569\" stroke-width=\"1.2\" stroke-dasharray=\"2,2\" fill=\"none\"/>\n    <text x=\"220\" y=\"228\" font-family=\"monospace\" font-size=\"6\" fill=\"#475569\" text-anchor=\"middle\">TRAVEL POST</text>\n    <text x=\"40\" y=\"270\" font-family=\"serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#1E293B\">TRAVEL NOTES</text>\n    <text x=\"40\" y=\"285\" font-family=\"sans-serif\" font-size=\"7\" fill=\"#64748B\">A Trip to Memory • 2026</text>\n    <rect x=\"220\" y=\"356\" width=\"56\" height=\"18\" rx=\"3\" fill=\"#047857\"/>\n    <text x=\"248\" y=\"368\" font-family=\"sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#ECFDF5\" text-anchor=\"middle\">旅行手账</text>\n  </svg>"
},
  {
  "id": "topographic_contour_relief",
  "name": "实景等高线 · 地形浮雕",
  "enName": "19 · Topographic Contour Relief",
  "category": "modern",
  "badge": "等高线浮雕",
  "order": 19,
  "enabled": true,
  "githubUrl": "https://v.douyin.com/yZZKPOzCAt0/",
  "coverImage": "/covers/19_topographic_contour_relief.jpg",
  "description": "上下严格50%二分排版：上半部分保留真实山川、建筑或实景摄影；下半部分将同一场景解构为严谨立体的等高线层叠纸雕浮雕，搭配现代地理学细衬线排版。",
  "aspectRatio": "auto",
  "tags": [
    "等高线浮雕",
    "地形线稿",
    "上下二分",
    "纸雕质感",
    "山川建筑",
    "现代地理美学"
  ],
  "promptTemplate": "将上传的照片制作成一张{aspectRatioDesc}【实景等高线地形海报】（Topographic Contour Relief Poster）。画面采用上下严格二分排版（各占约50%）：上半部分：完整保留原始照片的摄影质感，真实还原山脉、丘陵、建筑、天际线或人文实景，自然光影与色彩完全忠实原片，等比例裁切；下半部分：暖米白艺术纸底，将上方照片中的【同一场景、同一地貌与结构】严谨转译为三维等高线纸雕浮雕（Topographic 3D contour relief）。密集的平行等高线随着地形起伏、山脊走势或建筑轮廓自然隆起、聚拢与延展，层层递进呈现清晰的纵深与立体阴影。线条可保留来自原图的单色或低饱和自然色调（如岩石砂白、古建砖红或大地青绿）。边距留白排版：在上下两部分接缝或下半部上方留白处，使用极简高对比现代细衬线英文字体排版（如左侧居中大字标题，右侧标注精致小号属性词如 NATURE / LIGHT / TERRAIN）。整体呈现极高工艺感、地理测绘美学与当代艺术画册格调。{moodNotes} {textInstruction}",
  "negativePrompt": "unrelated scene in lower half, flat 2d messy scribbles, distorted chaotic curves, bright neon glow, anime style, messy collage, thick heavy borders, watermark, logo",
  "previewSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 400\" width=\"100%\" height=\"100%\">\n    <rect width=\"300\" height=\"400\" fill=\"#F4EFE6\"/>\n    <rect x=\"20\" y=\"20\" width=\"260\" height=\"170\" fill=\"#334155\" rx=\"2\"/>\n    <line x1=\"20\" y1=\"198\" x2=\"280\" y2=\"198\" stroke=\"#D6D3D1\" stroke-width=\"0.75\"/>\n    <text x=\"35\" y=\"218\" font-family=\"serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#292524\" letter-spacing=\"2\">MOUNTAIN</text>\n    <text x=\"265\" y=\"218\" font-family=\"monospace\" font-size=\"6\" fill=\"#78716C\" text-anchor=\"end\">TERRAIN / FORM</text>\n    <path d=\"M30 320 Q90 240 150 270 Q210 230 270 300\" stroke=\"#44403C\" stroke-width=\"1.8\" fill=\"none\"/>\n    <path d=\"M30 330 Q90 250 150 280 Q210 240 270 310\" stroke=\"#78716C\" stroke-width=\"1.4\" fill=\"none\"/>\n    <path d=\"M30 340 Q90 260 150 290 Q210 250 270 320\" stroke=\"#A8A29E\" stroke-width=\"1\" fill=\"none\"/>\n    <rect x=\"220\" y=\"356\" width=\"56\" height=\"18\" rx=\"3\" fill=\"#292524\"/>\n    <text x=\"248\" y=\"368\" font-family=\"sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#F5F5F4\" text-anchor=\"middle\">等高线</text>\n  </svg>"
},
  {
  "id": "graphic_paper_reconstruction",
  "name": "实景纸面重构 · 拓印图录",
  "enName": "20 · Graphic Paper Reconstruction",
  "category": "vintage",
  "badge": "纸面重构",
  "order": 20,
  "enabled": true,
  "githubUrl": "https://v.douyin.com/ZfaGccZCUN8/",
  "coverImage": "/covers/20_graphic_paper_reconstruction.jpg",
  "description": "上下1:1二分：上半保留真实照片，下半暖白纸面提取核心视觉母题，以圆、弧、轴线建立几何骨架，转化为兼具古物拓片、木刻拓印与现代平面设计感的图形。",
  "aspectRatio": "auto",
  "tags": [
    "几何骨架",
    "木刻拓印",
    "丝网印刷",
    "图录拓片",
    "上下二分",
    "民俗图解"
  ],
  "promptTemplate": "将上传的照片制作成一张{aspectRatioDesc}独立的高级设计海报（实景纸面重构风格）。画面采用上下严格1:1二分构图（各占50%）：上半部分：完整保留原始照片，保持主体数量、位置、比例、姿态、真实质感与自然色彩，只进行轻微摄影调色；不裁掉主体，不改变原有内容。下半部分：暖白色纹理纸张。分析照片中最具识别度的主体与空间特征，从中提取核心视觉母题，以圆、方、弧线、轴线或辅助结构线建立严谨的几何骨架。通过剪影、局部放大与符号化转译，将主体重构为兼具民俗图录、古物拓片与现代平面设计感的图形。配色严格从原图提取：深色建立结构，搭配1—2个主题色与少量强调色。呈现木刻拓印、干刷丝网印刷的混合质感，保留微弱断墨、擦痕与露底细节。大面积留白，搭配一个简短中文标题和一行小号英文注释，文字作为辅助信息排版克制。传统文化感与现代设计秩序并存。{moodNotes} {textInstruction}",
  "negativePrompt": "random cluttered elements, photographic background in lower half, messy gradients, cartoon stickers, western oil painting, dirty stains, watermark, logo",
  "previewSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 400\" width=\"100%\" height=\"100%\">\n    <rect width=\"300\" height=\"400\" fill=\"#F6F4EB\"/>\n    <rect x=\"20\" y=\"20\" width=\"260\" height=\"170\" fill=\"#047857\" rx=\"2\"/>\n    <line x1=\"20\" y1=\"198\" x2=\"280\" y2=\"198\" stroke=\"#D1D5DB\" stroke-width=\"0.8\"/>\n    <text x=\"40\" y=\"235\" font-family=\"serif\" font-size=\"16\" font-weight=\"900\" fill=\"#064E3B\">静水叠叶</text>\n    <circle cx=\"180\" cy=\"270\" r=\"45\" fill=\"#059669\" opacity=\"0.85\"/>\n    <circle cx=\"210\" cy=\"300\" r=\"35\" fill=\"#10B981\" opacity=\"0.6\"/>\n    <circle cx=\"140\" cy=\"310\" r=\"28\" fill=\"#047857\" opacity=\"0.9\"/>\n    <rect x=\"220\" y=\"356\" width=\"56\" height=\"18\" rx=\"3\" fill=\"#065F46\"/>\n    <text x=\"248\" y=\"368\" font-family=\"sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#ECFDF5\" text-anchor=\"middle\">纸面重构</text>\n  </svg>"
},
  {
  "id": "shell_mineral_mosaic",
  "name": "贝壳矿物 · 像素拼贴",
  "enName": "21 · Shell Mineral Mosaic",
  "category": "editorial",
  "badge": "贝壳像素",
  "order": 21,
  "enabled": true,
  "githubUrl": "https://v.douyin.com/ffHbDD_FBLA/",
  "coverImage": "/covers/21_shell_mineral_mosaic.jpg",
  "description": "上下严格二分：上半部分保留原景摄影，下半部分以天然贝壳薄片、矿物切片或石材碎片的微型方块拼贴出同一主体，具有细微层理与哑光质感，搭配打字机短句。",
  "aspectRatio": "auto",
  "tags": [
    "贝壳薄片",
    "矿物切片",
    "像素马赛克",
    "材料艺术",
    "上下二分",
    "明信片"
  ],
  "promptTemplate": "为上传的图片独立制作一张{aspectRatioDesc}双联艺术海报（贝壳矿物像素拼贴）。画面上下严格1:1分区（各占50%）：上半部分：完整保留原摄影照片，保持主体比例、透视、光影与现场色彩；下半部分：提取原图中最有记忆点的主体与空间结构，重构为极简的天然贝壳矿物像素拼贴画。用规则的微型小方块拼成主体，方块具有天然贝壳薄片、矿物切片或大理石碎片的细微层理、微小颗粒和哑光石材质感，绝非塑料马赛克。主体严格保持原图的视角与结构，居中稳定构图，核心区域密实完整，边缘极少数方块向周围大面积暖白纸张自然消融消隐。主体约占下半区30%—45%，其余为安静暖白留白。配色提取自原图，保持贝壳与天然矿物的清爽通透冷暖微差。留白处加入一句极小的英文打字机字体诗句。当代材料艺术工作室级质感。{moodNotes} {textInstruction}",
  "negativePrompt": "plastic digital minecraft pixel art, shiny 3D cubes, computer grid, cartoon mascot, garish saturated rainbow, cluttered background in lower half, watermark, logo",
  "previewSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 400\" width=\"100%\" height=\"100%\">\n    <rect width=\"300\" height=\"400\" fill=\"#FAF8F5\"/>\n    <rect x=\"20\" y=\"20\" width=\"260\" height=\"170\" fill=\"#92400E\" rx=\"2\"/>\n    <line x1=\"20\" y1=\"198\" x2=\"280\" y2=\"198\" stroke=\"#E7E5E4\" stroke-width=\"0.8\"/>\n    <g transform=\"translate(110, 225)\">\n      <rect x=\"0\" y=\"0\" width=\"16\" height=\"16\" fill=\"#D6D3D1\"/>\n      <rect x=\"18\" y=\"0\" width=\"16\" height=\"16\" fill=\"#A8A29E\"/>\n      <rect x=\"36\" y=\"0\" width=\"16\" height=\"16\" fill=\"#E7E5E4\"/>\n      <rect x=\"54\" y=\"0\" width=\"16\" height=\"16\" fill=\"#78716C\"/>\n      <rect x=\"0\" y=\"18\" width=\"16\" height=\"16\" fill=\"#F5F5F4\"/>\n      <rect x=\"18\" y=\"18\" width=\"16\" height=\"16\" fill=\"#D6D3D1\"/>\n      <rect x=\"36\" y=\"18\" width=\"16\" height=\"16\" fill=\"#A8A29E\"/>\n      <rect x=\"54\" y=\"18\" width=\"16\" height=\"16\" fill=\"#57534E\"/>\n      <rect x=\"18\" y=\"36\" width=\"16\" height=\"16\" fill=\"#E7E5E4\"/>\n      <rect x=\"36\" y=\"36\" width=\"16\" height=\"16\" fill=\"#D6D3D1\"/>\n    </g>\n    <text x=\"150\" y=\"335\" font-family=\"monospace\" font-size=\"7\" fill=\"#78716C\" text-anchor=\"middle\">Stone holds the light.</text>\n    <rect x=\"220\" y=\"356\" width=\"56\" height=\"18\" rx=\"3\" fill=\"#78716C\"/>\n    <text x=\"248\" y=\"368\" font-family=\"sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#FAFAF9\" text-anchor=\"middle\">贝壳像素</text>\n  </svg>"
},
  {
  "id": "emotional_deconstruction",
  "name": "情绪解构 · 现代展签",
  "enName": "22 · Emotional Deconstruction Poster",
  "category": "vintage",
  "badge": "情绪解构",
  "order": 22,
  "enabled": true,
  "githubUrl": "https://v.douyin.com/qUuWHjDgOkU/",
  "coverImage": "/covers/22_emotional_deconstruction.jpg",
  "description": "上下严格50%分区：上半保留真实摄影，下半暖象牙白艺术纸将画面主体转译为高反差版画、丝网印刷与水墨线描，点缀1种高纯度强调色（如朱砂红飘带），大字非对称排版。",
  "aspectRatio": "auto",
  "tags": [
    "现代展签",
    "丝网版画",
    "水墨线描",
    "朱砂红带",
    "非对称排版",
    "东方实验"
  ],
  "promptTemplate": "根据上传的真实摄影图片，制作一张{aspectRatioDesc}现代艺术展览级摄影再设计海报（情绪解构风格）。整体采用上下严格50%分区构图：上半部分：完整保留原始摄影照片，保持主体人物、动物或景物的身份、姿态、比例、空间关系、真实材质与原始光影。只进行轻微艺术调色，不改变主体，不增加不存在的元素。下半部分：以暖象牙白艺术纸为底，将照片主体情绪重新转译为现代主义编辑设计。将主体转译为高反差版画质感、丝网印刷颗粒与水墨笔触剪影，保留核心轮廓与动作动势。根据画面主题融入一组连贯的视觉流动符号（如随风飘扬的单色朱砂红丝带、流动线条、植物轮廓或水墨飞白），贯穿画面结构。色彩以暖白与墨黑为主，加入1种取自原图的高纯度点睛强调色（如朱砂红、青蓝或橙黄）。艺术展览级文字排版：在右侧或左侧以纵向大字排版简短中文标题，搭配宽字距非对称小号英文说明，文字作为画面视觉结构自然穿插。整体极具现代东方艺术展海报与实验印刷质感。{moodNotes} {textInstruction}",
  "negativePrompt": "commercial ad banner, cheap propaganda poster, random unrelated geometry, distorted face, changing actions, 3d CGI glossy render, watermark, logo, messy scribbles",
  "previewSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 400\" width=\"100%\" height=\"100%\">\n    <rect width=\"300\" height=\"400\" fill=\"#F6F4ED\"/>\n    <rect x=\"20\" y=\"20\" width=\"260\" height=\"170\" fill=\"#18181B\" rx=\"2\"/>\n    <line x1=\"20\" y1=\"198\" x2=\"280\" y2=\"198\" stroke=\"#D1D5DB\" stroke-width=\"0.8\"/>\n    <text x=\"235\" y=\"245\" font-family=\"serif\" font-size=\"22\" font-weight=\"900\" fill=\"#18181B\">行</text>\n    <text x=\"235\" y=\"275\" font-family=\"serif\" font-size=\"22\" font-weight=\"900\" fill=\"#18181B\">風</text>\n    <path d=\"M50 300 Q140 260 210 270 Q240 280 270 260\" stroke=\"#DC2626\" stroke-width=\"4.5\" fill=\"none\"/>\n    <rect x=\"60\" y=\"240\" width=\"70\" height=\"90\" fill=\"#27272A\" opacity=\"0.85\"/>\n    <rect x=\"220\" y=\"356\" width=\"56\" height=\"18\" rx=\"3\" fill=\"#B91C1C\"/>\n    <text x=\"248\" y=\"368\" font-family=\"sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#FEF2F2\" text-anchor=\"middle\">情绪解构</text>\n  </svg>"
},
  {
  "id": "retro_print_illustration",
  "name": "复古实验平面插画 · Riso印刷",
  "enName": "23 · Retro Experimental Graphic Print",
  "category": "vintage",
  "badge": "Riso复古",
  "order": 23,
  "enabled": true,
  "githubUrl": "https://v.douyin.com/DUwpMYhAtBI/",
  "coverImage": "/covers/23_retro_print_illustration.jpg",
  "description": "Riso孔版印刷与丝网印刷质感，粗粝纸张颗粒、旧报纸半色调网点与轻微套色错位。黑米灰打底点缀荧光橙/钴蓝，极简高反差构图与天体几何符号，复古未来主义印刷海报感。",
  "aspectRatio": "9:16",
  "tags": [
    "Riso孔版印刷",
    "丝网质感",
    "半色调网点",
    "复古未来主义",
    "神秘几何",
    "高反差海报"
  ],
  "promptTemplate": "【复古实验平面插画风格】以原参考图主体的造型特征和固有色彩特征保持不变为核心。呈现Riso孔版印刷与丝网印刷质感：粗粝纸张颗粒、旧报纸半色调网点、复印机噪点、轻微套色错位；重绘参考图配色，黑色、米白、灰色为主，少量点缀荧光橙、柠檬黄、钴蓝与绿色。极简高反差构图，将主体置于画面一角，大面积留白，留白处填充天体与几何图形纹理元素，设计感海报英文大字，运用密集平行线、等高线、波纹、同心圆和几何栅格塑造形体，二维扁平、超现实尺度、复古未来主义、神秘存在主义氛围，非写实摄影，印刷海报感。{moodNotes} {textInstruction}",
  "negativePrompt": "realistic 3d rendering, glossy photograph, modern gradient, modern digital clean vectors, blurry, low resolution, cheap cartoon, watermark, logo",
  "previewSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 400\" width=\"100%\" height=\"100%\">\n    <rect width=\"300\" height=\"400\" fill=\"#EAE5D9\"/>\n    <circle cx=\"150\" cy=\"180\" r=\"80\" fill=\"#1C1917\" opacity=\"0.9\"/>\n    <circle cx=\"150\" cy=\"180\" r=\"70\" fill=\"none\" stroke=\"#F97316\" stroke-width=\"3\" stroke-dasharray=\"4,4\"/>\n    <path d=\"M70 260 L230 260 L210 320 L90 320 Z\" fill=\"#1C1917\"/>\n    <text x=\"150\" y=\"360\" font-family=\"'Courier New', monospace\" font-size=\"10\" font-weight=\"bold\" fill=\"#1C1917\" text-anchor=\"middle\" letter-spacing=\"3\">RISO EXPERIMENTAL PRINT</text>\n    <rect x=\"220\" y=\"356\" width=\"56\" height=\"18\" rx=\"3\" fill=\"#EA580C\"/>\n    <text x=\"248\" y=\"368\" font-family=\"sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#FFF7ED\" text-anchor=\"middle\">Riso复古</text>\n  </svg>"
},
  {
  "id": "travel_postcard_collage",
  "name": "浪漫旅行手账 · 明信片",
  "enName": "24 · Romantic Travel Postcard Collage",
  "category": "editorial",
  "badge": "旅行明信片",
  "order": 24,
  "enabled": true,
  "githubUrl": "https://v.douyin.com/wUYjb9N-hAc/",
  "coverImage": "/covers/24_travel_postcard_collage.jpg",
  "description": "上下严格50%分区：上半等比保留原照真实摄影，下半不透明水粉水彩手绘拼贴横向铺满，提取3-4个手绘贴纸、风景邮票、邮戳与植物线条，搭配优雅英文信笺排版。",
  "aspectRatio": "3:4",
  "tags": [
    "旅行手账",
    "浪漫明信片",
    "水粉水彩",
    "手绘拼贴",
    "风景邮票",
    "邮戳信笺"
  ],
  "promptTemplate": "将上传照片制作成一张独立的{aspectRatioDesc}浪漫旅行手账海报（旅行明信片风格）。画面上方摄影、下方手绘拼贴，严格各占50%。上半部分：完整保留原始照片的主体、构图、比例、色彩与光影，等比缩放居中，必要时左右留暖白边，不裁切主体、不拉伸。下半部分：根据照片重新设计为铺满整个宽度的横向手绘拼贴，保留原照最具辨识度的主体与空间关系，以不透明水粉结合水彩晕染重新绘制，呈现自然笔触、干刷露白与细腻纸纹，通过柔和暖光、局部灯火、轻盈云霞和冷暖层次营造浪漫感。从原照提取3—4个代表性元素制作大小错落的手绘贴纸、局部小画与风景邮票分布在边角，轻轻跨越主景边缘，搭配少量信笺、邮戳及场景植物线条。下半上方配小号优雅衬线英文标题，底部配一句简短手写英文，整体温柔、通透、有旅行书信的情绪。{moodNotes} {textInstruction}",
  "negativePrompt": "heavy torn paper, jagged edges, 3D embossed relief, strong drop shadows, thick white sticker borders, messy overdecorated collage, giant text, distorted subject, watermark",
  "previewSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 400\" width=\"100%\" height=\"100%\">\n    <rect width=\"300\" height=\"400\" fill=\"#FAF7F2\"/>\n    <rect x=\"25\" y=\"20\" width=\"250\" height=\"165\" fill=\"#38BDF8\" rx=\"3\" opacity=\"0.85\"/>\n    <line x1=\"20\" y1=\"198\" x2=\"280\" y2=\"198\" stroke=\"#E2E8F0\" stroke-width=\"0.8\" stroke-dasharray=\"3,3\"/>\n    <rect x=\"35\" y=\"215\" width=\"230\" height=\"120\" fill=\"#FDE68A\" rx=\"4\" opacity=\"0.7\"/>\n    <circle cx=\"230\" cy=\"245\" r=\"14\" fill=\"none\" stroke=\"#94A3B8\" stroke-width=\"1.2\"/>\n    <text x=\"230\" y=\"248\" font-family=\"monospace\" font-size=\"6\" fill=\"#64748B\" text-anchor=\"middle\">POST</text>\n    <text x=\"50\" y=\"240\" font-family=\"serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#475569\">POSTCARD FROM JOURNEY</text>\n    <rect x=\"220\" y=\"356\" width=\"56\" height=\"18\" rx=\"3\" fill=\"#0284C7\"/>\n    <text x=\"248\" y=\"368\" font-family=\"sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#F0F9FF\" text-anchor=\"middle\">旅行明信片</text>\n  </svg>"
},
  {
  "id": "out_of_frame_3d",
  "name": "破框而出 · 2D突破3D海报",
  "enName": "25 · Breaking Out of Frame 3D Art Poster",
  "category": "modern",
  "badge": "破框立体",
  "order": 25,
  "enabled": true,
  "githubUrl": "https://v.douyin.com/JI54THUaubQ/",
  "coverImage": "/covers/25_out_of_frame_3d.jpg",
  "description": "2D突破3D视觉奇观：极简相框或拍立得边框中，主体花卉、人物或光影突破平面框体，向画外现实空间生长探出，形成虚实交错、空间穿透的数字雕塑与艺术展海报质感。",
  "aspectRatio": "auto",
  "tags": [
    "2D突破3D",
    "破框而出",
    "穿透相框",
    "数字雕塑",
    "轻超现实",
    "艺术展海报"
  ],
  "promptTemplate": "以上传的照片为基础，重新创作成一张独立的{aspectRatioDesc}具有“2D突破3D”视觉效果的创意艺术海报（破框而出风格）。核心视觉概念：将原照片中最具辨识度的主体（花朵、植物、人物、建筑或风景），重新设计为从平面相框、画框或拍立得边框中突破而出的形态。主体的一部分停留在框体内部，另一部分自然向外延伸、生长、探出、漂浮到边框之外，制造出“原本属于2D平面的东西突然跨入现实空间”的强烈穿透感。采用竖版海报排版，纯净深灰黑或极简浅色留白背景，中央一个明确的白色极简框架作为视觉容器。主体带有光滑细腻的数字雕塑或半写实立体质感，前后层次分明，枝叶或衣摆跨过边缘投下柔和自然投影，辅以极少灵动光点或飞散碎屑。上方配置简洁现代的大号海报英文字体，整体概念明确、极具视觉记忆点与现代艺术展海报冲击力。{moodNotes} {textInstruction}",
  "negativePrompt": "flat flat photo, plain bordered photo, messy cluttered background, lack of depth, cartoon anime, clumsy sketch, cheap collage, commercial watermark, logo",
  "previewSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 300 400\" width=\"100%\" height=\"100%\">\n    <rect width=\"300\" height=\"400\" fill=\"#0F172A\"/>\n    <rect x=\"50\" y=\"70\" width=\"200\" height=\"250\" fill=\"#1E293B\" stroke=\"#FFFFFF\" stroke-width=\"4\" rx=\"4\"/>\n    <circle cx=\"150\" cy=\"180\" r=\"50\" fill=\"#EC4899\" opacity=\"0.8\"/>\n    <path d=\"M120 180 Q100 130 70 110 Q90 150 110 180 Z\" fill=\"#F43F5E\"/>\n    <path d=\"M170 160 Q210 100 240 80 Q210 130 180 170 Z\" fill=\"#FB7185\"/>\n    <text x=\"150\" y=\"50\" font-family=\"'Helvetica Neue', sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#FFFFFF\" text-anchor=\"middle\" letter-spacing=\"4\">BREAKING OUT</text>\n    <rect x=\"220\" y=\"356\" width=\"56\" height=\"18\" rx=\"3\" fill=\"#E11D48\"/>\n    <text x=\"248\" y=\"368\" font-family=\"sans-serif\" font-size=\"8\" font-weight=\"bold\" fill=\"#FFF1F2\" text-anchor=\"middle\">破框立体</text>\n  </svg>"
},
];

export const AI_STYLES = DEFAULT_AI_STYLES;

export function getStyleById(id: string, styles: StylePreset[] = DEFAULT_AI_STYLES): StylePreset {
  const retouchHit = RETOUCH_STYLES.find((s) => s.id === id);
  if (retouchHit) return retouchHit;
  if (id === "eastern_ink_diptych" || id === "eastern_ink_diptych_scenery" || id === "eastern_ink_diptych_arch") {
    const inkHit =
      styles.find((s) => s.id === "eastern_ink_diptych" || s.id === "eastern_ink_diptych_scenery") ||
      DEFAULT_AI_STYLES.find((s) => s.id === "eastern_ink_diptych");
    if (inkHit) return inkHit;
  }
  return styles.find((s) => s.id === id) || styles.find((s) => s.enabled !== false) || styles[0] || DEFAULT_AI_STYLES[0];
}

export function buildStylePrompt(
  style: StylePreset,
  options: {
    customNotes?: string;
    mood?: string;
    includeText?: boolean;
    specifiedText?: string;
    sourceDescription?: string;
    aspectRatio?: string;
  } = {}
): string {
  const { customNotes = "", mood = "", includeText = true, specifiedText = "", sourceDescription = "", aspectRatio = "3:4" } = options;
  let prompt = style.promptTemplate;
  const isEasternInk =
    style.id === "eastern_ink_diptych" ||
    style.id === "eastern_ink_diptych_scenery" ||
    style.id === "eastern_ink_diptych_arch";

  const ratioDescMap: Record<string, string> = {
    "3:4": "vertical 3:4",
    "9:16": "vertical 9:16",
    "3:5": "vertical 3:5",
    "4:3": "horizontal 4:3",
    "16:9": "horizontal 16:9",
    "1:1": "1:1 square",
  };
  const aspectRatioDesc = ratioDescMap[aspectRatio] || "vertical 3:4";
  prompt = prompt.replace("{aspectRatioDesc}", aspectRatioDesc);

  const moodContent = mood.trim() || customNotes.trim();
  const moodPart = moodContent
    ? isEasternInk
      ? `Additional mood/color notes: ${moodContent}.`
      : `【画面方向与氛围要求】: ${moodContent}。`
    : "";

  let textPart = "";
  if (includeText) {
    if (specifiedText.trim()) {
      textPart = style.id === "fantasy_qiqiguaiguai"
        ? `【画面文字排版】: 画面主标题大字必须以巨大高对比粗体（带醒目贴纸白边、与主体前后穿插遮挡）清晰呈现“${specifiedText.trim()}”，并自然融入2–4个同世界观的趣味功能性标签（如状态进度条/审批印章/手绘箭头/说明便签）。`
        : style.id === "street_photo_black_ink" || style.id === "street_photo_color_chibi"
        ? `【画面环境排版】: 请在天空、墙面或开阔建筑负空间，以契合场景透视的排版方式融入“${specifiedText.trim()}”，文字与场景透视自然融合，严禁遮挡人物手绘角色。`
        : style.id === "culture_fragment_poster"
        ? `【画面文字排版】: 结合典雅细衬线英文与艺术字标题融入“${specifiedText.trim()}”，点缀档案编号与分类索引，呈现高奢商业 KV 质感。`
        : isEasternInk
        ? `Add a tiny elegant thin-serif English title in the bottom margin: "${specifiedText.trim()}".`
        : style.id === "reality_restaged"
        ? `【电影定格排版】: 请在画面下部或角落以电影剧照定格字幕融入“${specifiedText.trim()}”，克制典雅，不破坏超现实舞台构图。`
        : style.id === "photo_abstract_diptych"
        ? `【海报标题排版】: 请在上下两部分分割处或海报中央留白处，使用高级国际设计排版风格居中排版英文大标题“${specifiedText.trim()}”，附带精致小字副标题与细水平分割线。`
        : style.id === "minimal_editorial_illustration"
        ? `【杂志标题排版】: 请在画面下方偏左排版，使用优雅高对比度的古典编辑衬线字体排版英文标题“${specifiedText.trim()}”，颜色为深咖啡黑，并附带一行小号斜体衬线副标题。`
        : style.id === "funny_ugly_doodle"
        ? `【涂鸦对话框/恶搞台词排版】: 请在画面空白处以魔性儿童简笔对话框或粗糙蜡笔手写字形式，融入“${specifiedText.trim()}”，带有一点歪七扭八的恶搞幽默感。`
        : style.id === "fieldform_raster"
        ? `【画面文字排版】: 请在画面安静留白处以极小的细衬线英文与数学坐标符号排版呈现“${specifiedText.trim()}”，保持克制极简与空间引力场美学。`
        : style.id === "real_extension_sketch"
        ? `【画面文字排版】: 请在下方纸面留白处添加极简小字号手写英文旁白“${specifiedText.trim()}”，与画面手绘故事自然呼应。`
        : style.id === "torn_paper_zine"
        ? `【画面文字排版】: 请在留白处排版一行极小字号的英文打字机单色文字“${specifiedText.trim()}”，呈现独立艺术杂志质感。`
        : style.id === "graffiti_sketch"
        ? `【涂鸦手写排版】: 请在空白处随性点缀涂鸦手写字“${specifiedText.trim()}”，并在角落自然融入艺术签名落款。`
        : style.id === "diffuse_gradient"
        ? `【画面文字排版】: 请在底部边缘克制融入极小字号典雅英文字符“${specifiedText.trim()}”，绝不破坏柔和弥散色场。`
        : style.id === "chinese_paper_relief"
        ? `【中式排版】: 在宽阔留白处排版极简典雅文字，包含小号高瘦宋体或明朝体中文主标题“${specifiedText.trim()}”，搭配一行更小的细衬线英文注释与极短细线。`
        : style.id === "paper_line_continuation"
        ? `【手写文字排版】: 在边缘留白处点缀极简细小手写英文“${specifiedText.trim()}”，呼应彩铅故事。`
        : style.id === "ai_travel_journal"
        ? `【手账排版】: 在手账留白处巧妙融入文艺手写文字“${specifiedText.trim()}”与复古旅行印章、邮戳。`
        : style.id === "topographic_contour_relief"
        ? `【测绘排版】: 在上下接缝或留白处，使用极简高对比现代细衬线英文字体排版标题“${specifiedText.trim()}”，呈现地理测绘美学。`
        : style.id === "graphic_paper_reconstruction"
        ? `【图录排版】: 在留白处加入简短中文标题“${specifiedText.trim()}”和一行小号英文注释，呈现拓印图录秩序。`
        : style.id === "shell_mineral_mosaic"
        ? `【打字机排版】: 在下半部分留白处加入一句极小的英文打字机字体短句“${specifiedText.trim()}”，具有材料艺术质感。`
        : style.id === "emotional_deconstruction"
        ? `【展签排版】: 在侧边以纵向大字排版简短中文标题“${specifiedText.trim()}”，搭配宽字距非对称小号英文说明，呈现现代东方艺术展海报质感。`
        : `【画面文字排版】: 请在画面的留白或视觉焦点处，自然融入排版文字“${specifiedText.trim()}”，采用契合整体风格的典雅字体。`;
    } else if (style.id === "fantasy_qiqiguaiguai") {
      textPart = `【画面文字排版】: 请根据素材主体的生活反差与社会身份错位，自动创作提炼一个巨大高对比主标题（如：“本人正在加载”、“家庭首席批准官”、“城市暂停三十秒”、“把焦虑托运一下”、“合法情绪补丁”等生活哲学大标题），使用粗体与白色贴纸轮廓线，与画面主体形成前后穿插遮挡，并配有2–4个趣味功能状态标签、电量/进度条与手写补刀。`;
    } else if (style.id === "street_photo_black_ink" || style.id === "street_photo_color_chibi") {
      textPart = `【画面环境排版】: 可在天空或墙面等开阔负空间克制融入 1~2 行环境文字（如地点、天气、生活标语或时间戳），与场景空间透视自然相融，不遮挡手绘角色主体。`;
    } else if (style.id === "culture_fragment_poster") {
      textPart = `【画面文字排版】: 允许系统根据素材文化属性，在画面融入一组高奢品牌海报排版文字（包括一组英文细衬线大标题、文化基因索引号如 N°05 ARCHIVE 及极简小字注释）。`;
    } else if (isEasternInk) {
      textPart = `Add a tiny elegant thin-serif English title in the bottom margin that responds directly to the source photograph (1 to 3 short English words in small uppercase with generous tracking).`;
    } else if (style.id === "reality_restaged") {
      textPart = `【画面文字要求】: 保持极简纯净艺术画面，切勿在画面中添加任何文字、标题、字幕、水印或标签 (Pure artwork, no text, no typography, no subtitles, no watermarks).`;
    } else if (style.id === "photo_abstract_diptych") {
      textPart = `【海报标题排版】: 请在上下两部分中间的米白色分割带，居中排版一组高级简洁英文标题（如 “RIVER BRIDGE FORM / NIGHT STRUCTURE STUDY” 或 “URBAN FORM STUDY”），搭配精致水平纹理细线与限量版艺术海报字样。`;
    } else if (style.id === "minimal_editorial_illustration") {
      textPart = `【杂志标题排版】: 根据上传图片呈现的内容、空间或情绪，自动创作一个由 2–4 个英文单词组成的诗意标题（如 “Soft Gatherings” / “Open Light”）。在画面下方偏左排版，使用优雅高对比度的古典编辑衬线字体，颜色为深咖啡黑。标题下方附带一句由 4–9 个英文单词组成的简短副标题，使用较小的斜体衬线字体。`;
    } else if (style.id === "funny_ugly_doodle") {
      textPart = `【涂鸦对话框/恶搞台词排版】: 请在画面空白处添加简笔画恶搞对话框或手写涂鸦英文短语（如 “SUP PEASANTS”, “AYO WHAT”, “EZ DUB”, “I CAN DO WHATEVER I WANT” 等符合画面神态的搞笑英文 meme 台词），并点缀戴墨镜太阳、歪歪扭扭的楼房、乱七八糟的杂物草稿线，营造出极其搞笑欠扁的互联网梗图效果。`;
    } else if (style.id === "fieldform_raster") {
      textPart = `【画面文字排版】: 在画面安静留白处克制排版极小的细衬线英文与数学坐标符号，保持理性超现实空间感。`;
    } else if (style.id === "real_extension_sketch") {
      textPart = `【画面文字排版】: 在下方留白处添加一句简短克制的小字号英文手写旁白（1—5个单词），字号小且克制。`;
    } else if (style.id === "torn_paper_zine") {
      textPart = `【画面文字排版】: 在空白处排版一行极小字号的英文打字机单色文字，整体呈现独立艺术出版物格调。`;
    } else if (style.id === "graffiti_sketch") {
      textPart = `【涂鸦符号排版】: 在画面空白处随性点缀少量辅助性手绘设计符号、小箭头或涂鸦手写短字，画面角落自然融入一个精致手写艺术签名。`;
    } else if (style.id === "diffuse_gradient") {
      textPart = `【画面文字要求】: 保持超现实纯净色场，切勿添加任何大号标题、边框或杂乱文字。`;
    } else if (style.id === "chinese_paper_relief") {
      textPart = `【中式文字排版】: 在宽阔留白处排版极简典雅文字，包含小号高瘦宋体或明朝体中文主标题（可分两行），搭配更小的细衬线英文注释与一条取自原图配色的极短细线。`;
    } else if (style.id === "paper_line_continuation") {
      textPart = `【手绘文字排版】: 边缘点缀极简细小手写英文，充满治愈与温情想象力。`;
    } else if (style.id === "ai_travel_journal") {
      textPart = `【旅行手账排版】: 在纸面留白处巧妙穿插复古旅行手账设计元素，包括一枚精致旅行印章/邮戳、手写旅行随笔短句及年份日期。`;
    } else if (style.id === "topographic_contour_relief") {
      textPart = `【测绘文字排版】: 在上下两部分接缝或留白处，使用极简高对比现代细衬线英文字体排版，右侧标注精致小号属性词如 NATURE / LIGHT / TERRAIN。`;
    } else if (style.id === "graphic_paper_reconstruction") {
      textPart = `【图录文字排版】: 搭配一个简短中文标题和一行小号英文注释，文字作为辅助信息排版克制，传统文化感与现代设计秩序并存。`;
    } else if (style.id === "shell_mineral_mosaic") {
      textPart = `【打字机文字排版】: 在下半部分留白处加入一句极小的英文打字机字体诗句，像当代材料艺术工作室制作的照片双联海报。`;
    } else if (style.id === "emotional_deconstruction") {
      textPart = `【展签艺术排版】: 在右侧或左侧以纵向大字排版简短中文标题，搭配宽字距非对称小号英文说明，文字作为画面视觉结构自然穿插。`;
    } else {
      textPart = `【画面文字排版】: 允许系统根据画面主体与意境，在留白区域创作融入一句精炼典雅的短句或英文排版字符。`;
    }
  } else {
    textPart = isEasternInk
      ? `Leave the bottom margin completely clean without any text, title, or typography.`
      : `【画面文字要求】: 保持纯净艺术画面，切勿在画面中添加任何文字、标题、字母、水印或标签字符 (Pure artwork, no text, no typography, no captions, no watermarks)。`;
  }

  const descPart = sourceDescription.trim() ? ` 画面核心内容与主体描述: ${sourceDescription.trim()}。` : "";

  prompt = prompt
    .replace("{moodNotes}", moodPart)
    .replace("{textInstruction}", textPart);

  const notesPart = customNotes.trim() && !mood.trim() ? ` 附加具体要求: ${customNotes.trim()}。` : "";

  prompt = prompt.replace("{customNotes}", notesPart + descPart);

  // Inject negative constraints directly so OpenAI image edit / chatgpt2api models respect them
  if (style.negativePrompt && style.negativePrompt.trim() && !isEasternInk) {
    prompt += ` 【严禁出现 (Strictly Prohibited)】: ${style.negativePrompt.trim()}。`;
  }

  return prompt.trim();
}

export function getDreamyQuoteForImage(src?: string | null): string {
  if (!src) return "光影穿梭，电车奔赴旧梦";
  const found = DREAMY_SAMPLE_PHOTOS.find((p) => p.src === src || src.includes(p.id));
  if (found) return found.quote;
  if (src.includes("1544620347")) return "光影穿梭，电车奔赴旧梦";
  if (src.includes("1444464666168")) return "长空万里，风为飞鸟留白";
  if (src.includes("1519741497674")) return "风拂裙摆，时光温柔慢行";
  return "光影穿梭，电车奔赴旧梦";
}
