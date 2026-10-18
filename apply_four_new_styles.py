import json
import re

# 1. Define the 4 new styles
NEW_STYLES = [
    {
        "id": "culture_fragment_poster",
        "name": "文化碎片海报",
        "enName": "05 · Culture Fragment Poster",
        "category": "editorial",
        "badge": "梵想美学",
        "enabled": True,
        "order": 5,
        "githubUrl": "https://github.com/dacnay816y62-hub/culture-fragment-poster-engine",
        "description": "提取传统器物、纹样、织物与建筑等文化碎片提炼为视觉基因，重构为克制、高级的商业 KV 艺术海报与极简衬线排版。",
        "aspectRatio": "3:4",
        "tags": ["文化基因", "东方梵想", "高奢KV", "碎片解构", "艺术海报", "衬线排版", "留白克制"],
        "promptTemplate": "严格基于上传的文化/艺术/实景素材，提炼其核心视觉基因（材质肌理、织物经纬、纹样构成、器物光影或建筑构件），重构为当代高奢艺术展览与高级商业 KV 级别的【文化碎片海报】（Culture Fragment Poster）。切勿进行粗制滥造的旅游纪念品式拼贴。采用现代高定平面设计语言：【画面主体】将传统文化质感解构为纯粹克制的现代视觉焦点，与留白空间形成呼吸韵律；【色彩体系】提取原素材低饱和矿物颜料、暖米白纸质底色或哑光大地色系，辅以微量克制的金线或点睛色彩；【排版构成】排版极简典雅，结合高对比细衬线英文与大号艺术字标题，局部点缀编号与索引标签；【材质细节】细腻的 35mm 胶片颗粒、微糙手工纸与矿物微粒质感。整幅海报呈现东方梵想、诗意克制、当代奢华的艺术指导级美学。{moodNotes} {textInstruction}",
        "negativePrompt": "cheap tourist souvenir collage, busy cluttered bazaar, low quality watermark, cartoon mascot, garish saturated neon, plastic gloss, deformed text, messy typography, distorted faces, amateur photo",
        "previewSvg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
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
</svg>"""
    },
    {
        "id": "eastern_ink_diptych_scenery",
        "name": "东方水墨二分画 · 景致篇",
        "enName": "06 · Eastern Ink Diptych Scenery",
        "category": "editorial",
        "badge": "水墨二分",
        "enabled": True,
        "order": 6,
        "githubUrl": "https://github.com/Hiseaa/eastern-ink-photo-diptych",
        "description": "3:5 竖版画册海报。上半部忠实保留自然风景摄影，下半部提炼为克制、大面积留白的东方极简水墨构成，底部小字细衬线英文标题。",
        "aspectRatio": "auto",
        "tags": ["东方水墨", "二分画", "3:5画册", "写意留白", "自然景致", "细衬线标题", "禅意雅致"],
        "promptTemplate": "严格基于输入照片制作 3:5 竖版【东方水墨二分画册海报 · 景致篇】（Eastern Ink Photo Diptych · Scenery）。底衬为哑光暖米白艺术宣纸（matte warm ivory art paper）。垂直双联二分排版：【上半部摄影面板（约占高度 38–48%）】忠实保留原图中的风景、山水、湖泊、林木或旅途实景摄影，原照片的主体轮廓、地平线、光影景深与空间关系保持真实真实不重绘；【下半部水墨面板（约占高度 38–48%）】将同一场景垂直提炼为东方极简大写意水墨构成，大面积纯净留白，仅以少许层次分明的湿润淡墨、柔和晕染与提取自原图的低饱和自然色呼应上方景致，绝不描绘具象树叶、道路与杂物细节；【底部边距】居中小字号细衬线英文标题（small centered refined serif English title），字距舒朗。整体极具东方画册典藏感与禅意呼吸感。{moodNotes} {textInstruction}",
        "negativePrompt": "busy detailed lower panel, fully rendered leaves in ink panel, bright neon colors, western oil painting, borders, stamps, seals, red wax, watermark, distorted horizon, messy scribbles, low resolution",
        "previewSvg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
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
  <text x="150" y="373" font-family="'Helvetica Neue', sans-serif" font-size="6" font-weight="500" fill="#78716C" text-anchor="middle" letter-spacing="1.5">EASTERN INK PHOTO DIPTYCH • SCENERY</text>
  <rect x="220" y="350" width="48" height="18" rx="3" fill="#374151"/>
  <text x="244" y="362" font-family="sans-serif" font-size="8" font-weight="bold" fill="#F3F4F6" text-anchor="middle">水墨二分</text>
</svg>"""
    },
    {
        "id": "eastern_ink_diptych_arch",
        "name": "东方水墨二分画 · 构筑篇",
        "enName": "07 · Eastern Ink Diptych Arch",
        "category": "vintage",
        "badge": "水墨构筑",
        "enabled": True,
        "order": 7,
        "githubUrl": "https://github.com/Hiseaa/eastern-ink-photo-diptych",
        "description": "侧重园林亭台、门楼长廊、瓦当窗棱的建筑构筑二分画。上半部保留实景木石建筑光影，下半部提炼为极简线描与淡墨块面，凸显东方营造之美。",
        "aspectRatio": "auto",
        "tags": ["水墨建筑", "园林亭台", "木构榫卯", "白描线条", "二分画册", "空间留白", "东方美学"],
        "promptTemplate": "严格基于输入照片制作 3:5 竖版【东方水墨二分画册海报 · 构筑篇】（Eastern Ink Diptych · Architecture）。米白雅致艺术纸底。垂直二分空间布局：【上半部建筑摄影（约占高度 38–48%）】真实保留原照片中的中国传统建筑、亭台楼阁、回廊门洞、飞檐瓦当或园林框景，木构质感、自然采光与景深透视完全忠实原片；【下半部水墨线描（约占高度 38–48%）】将上方建筑构筑提炼为极致简练的东方水墨白描线稿与淡墨空间块面，大量虚实留白，剔除繁杂瓦片细节与多余杂物，凸显中国传统营造之法、榫卯韵律与几何比例；【底部边距】居中排版极简细衬线建筑篇章英文标题，如“SILENT PAVILION”。整幅作品呈现东方文人造园与建筑诗学的静谧深远。{moodNotes} {textInstruction}",
        "negativePrompt": "dense technical engineering blueprint, modern steel skyscraper, dirty pencil scratches, heavy ink blobs, anime lines, extra roof tiers, floating debris, seal, watermark, distorted perspective",
        "previewSvg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
  <defs>
    <linearGradient id="ea_photo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3B2E24"/>
      <stop offset="60%" stop-color="#544033"/>
      <stop offset="100%" stop-color="#705544"/>
    </linearGradient>
    <filter id="ea_shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="300" height="400" fill="#F6F4ED"/>
  <rect x="18" y="16" width="264" height="368" fill="none" stroke="#DFD9CB" stroke-width="1"/>
  <!-- Upper: Real Architecture Photo -->
  <g transform="translate(30, 28)" filter="url(#ea_shadow)">
    <rect width="240" height="145" fill="url(#ea_photo)" rx="2"/>
    <path d="M120 20 L20 65 L40 68 L120 38 L200 68 L220 65 Z" fill="#241B14"/>
    <path d="M120 40 L45 78 L195 78 Z" fill="#1C1510"/>
    <rect x="65" y="78" width="110" height="67" fill="#423226"/>
    <rect x="95" y="95" width="50" height="50" fill="#18120D"/>
    <rect x="6" y="6" width="54" height="14" rx="2" fill="#1C1510" opacity="0.7"/>
    <text x="33" y="16" font-family="monospace" font-size="6.5" font-weight="bold" fill="#F5EEE6" text-anchor="middle">ARCH PHOTO</text>
  </g>
  <!-- Divider -->
  <line x1="45" y1="185" x2="255" y2="185" stroke="#CCC4B4" stroke-width="0.75" stroke-dasharray="3,3"/>
  <!-- Lower: Eastern Ink Line & Wash -->
  <g transform="translate(30, 198)" filter="url(#ea_shadow)">
    <rect width="240" height="145" fill="#EAE5D9" rx="2"/>
    <!-- Ink wash silhouette -->
    <path d="M120 30 L40 70 L200 70 Z" fill="#BBB1A0" opacity="0.6"/>
    <!-- Fine ink line sketch -->
    <path d="M120 25 L30 68" stroke="#262626" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M120 25 L210 68" stroke="#262626" stroke-width="2.2" stroke-linecap="round"/>
    <line x1="50" y1="72" x2="190" y2="72" stroke="#262626" stroke-width="1.8"/>
    <line x1="70" y1="72" x2="70" y2="135" stroke="#262626" stroke-width="1.5"/>
    <line x1="170" y1="72" x2="170" y2="135" stroke="#262626" stroke-width="1.5"/>
    <rect x="95" y="90" width="50" height="45" fill="none" stroke="#262626" stroke-width="1.5"/>
    <circle cx="120" cy="112" r="14" fill="none" stroke="#262626" stroke-width="1.2"/>
    <rect x="6" y="6" width="50" height="14" rx="2" fill="#57534E" opacity="0.8"/>
    <text x="31" y="16" font-family="monospace" font-size="6.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">INK SKETCH</text>
  </g>
  <!-- Bottom Serif Title -->
  <text x="150" y="362" font-family="'Times New Roman', 'Songti SC', serif" font-size="9" font-weight="bold" fill="#1C1917" text-anchor="middle" letter-spacing="4">S I L E N T   P A V I L I O N</text>
  <text x="150" y="373" font-family="'Helvetica Neue', sans-serif" font-size="6" font-weight="500" fill="#78716C" text-anchor="middle" letter-spacing="1.5">EASTERN INK ARCHITECTURAL DIPTYCH</text>
  <rect x="220" y="350" width="48" height="18" rx="3" fill="#78350F"/>
  <text x="244" y="362" font-family="sans-serif" font-size="8" font-weight="bold" fill="#FEF3C7" text-anchor="middle">水墨构筑</text>
</svg>"""
    },
    {
        "id": "reality_restaged",
        "name": "纪实重构 · 超现实舞台",
        "enName": "08 · Reality Restaged",
        "category": "photography",
        "badge": "电影舞台",
        "enabled": True,
        "order": 8,
        "githubUrl": "https://github.com/traveler0621/reality-restaged",
        "description": "“One impossible thing”。保留人物与纪实记忆，大刀阔斧削减环境杂物，重构为纯色色场、超现实尺度与电影戏剧舞台感的不可思议世界。",
        "aspectRatio": "auto",
        "tags": ["纪实重构", "超现实舞台", "One Impossible Thing", "戏剧光影", "纯色色场", "电影定格", "35mm胶片"],
        "promptTemplate": "基于上传照片进行【纪实重构 · 超现实舞台】（Reality Restaged: Documentary memory, Surreal stage）。遵循核心法则：【现实第一，超现实第二】。画面必须严格保留原照片中真实人物/动物的身体姿态、眼神、动作互动、服饰质感与纪实情绪锚点；大刀阔斧削减原本琐碎繁杂的现实背景。引入【一个强有力的超现实戏剧性干预（One impossible thing）】：将主体置于电影舞台般的宏大纯净色场、极简几何空间、剧场追光或超现实尺度构图中（Color is Architecture）。保持真实自然的电影光学布光、细腻真实的 35mm 胶片颗粒与真实人体解剖比例。画面不是廉价卡通或过度修饰的CG，而是一张“本不可能存在的世界的真实摄影”。{moodNotes} {textInstruction}",
        "negativePrompt": "generic AI fantasy sparkles, plastic smooth skin, oversharpened, 3d render CGI, cartoon comic, multiple duplicate heads, distorted hands, extra limbs, messy cluttered objects, cheap photoshop cutout, watermark",
        "previewSvg": """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
  <defs>
    <linearGradient id="rr_bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#09101D"/>
      <stop offset="40%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
    <linearGradient id="rr_beam" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FEF08A" stop-opacity="0.85"/>
      <stop offset="60%" stop-color="#F59E0B" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#D97706" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="rr_stage" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#1E3A8A"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
    <filter id="rr_glow">
      <feGaussianBlur stdDeviation="4"/>
    </filter>
  </defs>
  <rect width="300" height="400" fill="url(#rr_bg)"/>
  <!-- Theatrical Color Field Background -->
  <rect x="20" y="20" width="260" height="310" rx="6" fill="#0B1329"/>
  <!-- Impossible Geometric Architecture / Void -->
  <path d="M20 200 L180 80 L280 140 L280 330 L20 330 Z" fill="url(#rr_stage)" opacity="0.85"/>
  <!-- Cinematic Spotlight Beam (One Impossible Thing) -->
  <polygon points="110,20 190,20 260,330 40,330" fill="url(#rr_beam)" opacity="0.55"/>
  <!-- Impossible Floating Surreal Sphere -->
  <circle cx="210" cy="100" r="28" fill="#F87171" opacity="0.9"/>
  <circle cx="204" cy="94" r="28" fill="none" stroke="#FECACA" stroke-width="1.5" opacity="0.8"/>
  <!-- Hero Silhouette with Realistic Human Anatomy -->
  <g transform="translate(135, 200)">
    <!-- Shadow -->
    <ellipse cx="15" cy="85" rx="30" ry="6" fill="#020617" opacity="0.7"/>
    <!-- Figure -->
    <path d="M12 20 C6 20, 6 36, 12 36 C18 36, 18 20, 12 20 Z" fill="#FEF08A"/>
    <path d="M8 38 L18 38 L22 62 L15 62 L15 82 L10 82 L10 62 L4 62 Z" fill="#F8FAFC"/>
    <path d="M4 42 L-2 58 L2 60 L6 45 Z" fill="#F8FAFC"/>
  </g>
  <!-- Cinematic Film Titles -->
  <g transform="translate(30, 350)">
    <text x="0" y="14" font-family="'Helvetica Neue', sans-serif" font-size="12" font-weight="900" fill="#F8FAFC" letter-spacing="2">REALITY RESTAGED</text>
    <text x="0" y="26" font-family="monospace" font-size="7" font-weight="bold" fill="#38BDF8" letter-spacing="1">ONE IMPOSSIBLE THING • CINEMATIC TABLEAU</text>
  </g>
  <rect x="206" y="352" width="62" height="20" rx="4" fill="#E11D48"/>
  <text x="237" y="366" font-family="sans-serif" font-size="8.5" font-weight="900" fill="#FFFFFF" text-anchor="middle">电影舞台</text>
</svg>"""
    }
]

print("Loaded", len(NEW_STYLES), "new styles.")

# 2. Update server_data/ai_styles.json
with open("server_data/ai_styles.json", "r", encoding="utf-8") as f:
    existing_styles = json.load(f)

# Keep track of existing ids
existing_ids = {s["id"] for s in existing_styles}

# Re-organize existing:
# Top 4: dreamy_motion_editorial, fantasy_qiqiguaiguai, street_photo_black_ink, street_photo_color_chibi
# Then our 4 new styles (order 5, 6, 7, 8)
# Then remaining styles (reality_collage, visual_distillation, cinematic_poster, etc.) with updated orders

top_4 = []
others = []
for s in existing_styles:
    if s["id"] in ["dreamy_motion_editorial", "fantasy_qiqiguaiguai", "street_photo_black_ink", "street_photo_color_chibi"]:
        top_4.append(s)
    elif s["id"] not in [ns["id"] for ns in NEW_STYLES]:
        others.append(s)

# Combine:
final_server_styles = []
for idx, s in enumerate(top_4, 1):
    s["order"] = idx
    final_server_styles.append(s)

for idx, ns in enumerate(NEW_STYLES, len(final_server_styles) + 1):
    ns_copy = dict(ns)
    ns_copy["order"] = idx
    final_server_styles.append(ns_copy)

for idx, s in enumerate(others, len(final_server_styles) + 1):
    s["order"] = idx
    final_server_styles.append(s)

with open("server_data/ai_styles.json", "w", encoding="utf-8") as f:
    json.dump(final_server_styles, f, ensure_ascii=False, indent=2)

print("Updated server_data/ai_styles.json. Total styles:", len(final_server_styles))

