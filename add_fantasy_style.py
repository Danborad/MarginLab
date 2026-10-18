import json

# 1. Update src/lib/ai-styles.ts
with open('src/lib/ai-styles.ts', 'r', encoding='utf-8') as f:
    content = f.read()

fantasy_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
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
    </svg>"""

fantasy_style_block = f"""  {{
    id: "fantasy_qiqiguaiguai",
    name: "FANTASY · 奇奇怪怪",
    enName: "02 · FANTASY Social Editorial",
    category: "editorial",
    badge: "爆款社交",
    enabled: true, // Replicated & Active
    order: 2,
    description:
      "从日常碎片、人物、宠物、物件与零散想法中提炼幽默反差与第二层含义。3:4 竖版社交海报，高对比大标题、贴纸描边、趣味功能信息块与身份错位幽默。",
    aspectRatio: "3:4",
    tags: ["FANTASY", "奇奇怪怪", "3:4社交海报", "反差幽默", "杂志拼贴", "趣味标签", "朋友圈封面"],
    promptTemplate:
      "使用输入素材作为核心视觉，制作 3:4 竖版高定幽默社交海报（FANTASY 奇奇怪怪风格）。完整保留原图人物五官、发型穿搭、姿态或宠物花色脸型关键识别特征，隐藏真实隐私。采用当代视觉杂志与高密度编辑语言，画面由【巨大高对比主标题（贴纸白边或双色撞色粗体，与主体形成前后穿插遮挡） + 一条克制手写副标或冷幽默补刀 + 3–5个围绕同一世界观的功能性趣味信息块/状态进度条/档案标签/手绘箭头/虚线框】构成。文案制造第二层荒诞反差、生活失败美学或社会身份错位（如宠物CEO、工作续命装置、事故档案、合法情绪补丁）。色彩采用高对比现代配色（黄黑白/蓝黄黑/红蓝白），高信息密度但有明确视觉中心，无品牌商标Logo，无低质乱码涂鸦。画面时髦、荒诞、可直接发布。{{moodNotes}} {{textInstruction}}",
    negativePrompt:
      "brand logo, trademark, commercial product mockup, cheap e-commerce sale stickers, children doodle scrap, low contrast washed out, blurry text, distorted faces, ugly hands, extra limbs, watermark, random chaotic collage without visual focal point",
    previewSvg: `{fantasy_svg}`,
  }},"""

s21_end_marker = '    </svg>`,\n  },'
assert s21_end_marker in content, 's21_end_marker not found'
content = content.replace(s21_end_marker, s21_end_marker + '\n' + fantasy_style_block, 1)

# Update order of reality_collage
content = content.replace('order: 2,\n    description:\n      "照片是事实锚点', 'order: 3,\n    description:\n      "照片是事实锚点')

with open('src/lib/ai-styles.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated src/lib/ai-styles.ts successfully')

# 2. Update server_data/ai_styles.json
with open('server_data/ai_styles.json', 'r', encoding='utf-8') as f:
    styles_list = json.load(f)

fantasy_json_obj = {
  "id": "fantasy_qiqiguaiguai",
  "name": "FANTASY · 奇奇怪怪",
  "enName": "02 · FANTASY Social Editorial",
  "category": "editorial",
  "badge": "爆款社交",
  "enabled": True,
  "order": 2,
  "description": "从日常碎片、人物、宠物、物件与零散想法中提炼幽默反差与第二层含义。3:4 竖版社交海报，高对比大标题、贴纸描边、趣味功能信息块与身份错位幽默。",
  "aspectRatio": "3:4",
  "tags": [
    "FANTASY",
    "奇奇怪怪",
    "3:4社交海报",
    "反差幽默",
    "杂志拼贴",
    "趣味标签",
    "朋友圈封面"
  ],
  "promptTemplate": "使用输入素材作为核心视觉，制作 3:4 竖版高定幽默社交海报（FANTASY 奇奇怪怪风格）。完整保留原图人物五官、发型穿搭、姿态或宠物花色脸型关键识别特征，隐藏真实隐私。采用当代视觉杂志与高密度编辑语言，画面由【巨大高对比主标题（贴纸白边或双色撞色粗体，与主体形成前后穿插遮挡） + 一条克制手写副标或冷幽默补刀 + 3–5个围绕同一世界观的功能性趣味信息块/状态进度条/档案标签/手绘箭头/虚线框】构成。文案制造第二层荒诞反差、生活失败美学或社会身份错位（如宠物CEO、工作续命装置、事故档案、合法情绪补丁）。色彩采用高对比现代配色（黄黑白/蓝黄黑/红蓝白），高信息密度但有明确视觉中心，无品牌商标Logo，无低质乱码涂鸦。画面时髦、荒诞、可直接发布。{moodNotes} {textInstruction}",
  "negativePrompt": "brand logo, trademark, commercial product mockup, cheap e-commerce sale stickers, children doodle scrap, low contrast washed out, blurry text, distorted faces, ugly hands, extra limbs, watermark, random chaotic collage without visual focal point",
  "previewSvg": fantasy_svg,
  "updatedAt": "2026-09-10T09:30:00.000Z",
  "coverImage": ""
}

existing = next((s for s in styles_list if s['id'] == 'fantasy_qiqiguaiguai'), None)
if existing:
    idx = styles_list.index(existing)
    styles_list[idx] = fantasy_json_obj
else:
    styles_list.insert(1, fantasy_json_obj)
    for i, s in enumerate(styles_list):
        s['order'] = i + 1

with open('server_data/ai_styles.json', 'w', encoding='utf-8') as f:
    json.dump(styles_list, f, ensure_ascii=False, indent=2)

print('Updated server_data/ai_styles.json successfully')
