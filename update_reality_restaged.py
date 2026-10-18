import json

# 1. New prompt template
new_prompt_template = (
    "A cinematic tableau photograph in the strict visual language of \"Reality Restaged\" "
    "(Documentary memory. Surreal stage. Reference: traveler0621/reality-restaged).\n\n"
    "Follow the 5 Core Principles of Reality Restaged:\n"
    "1. DOCUMENTARY ANCHOR (真实记忆与建筑/人文主体):\n"
    "- Faithfully preserve the core subject from the source photo: whether it is human gestures/figures, animals, vehicles, or iconic architecture/landmarks (such as traditional Chinese palace gatehouses, flying eaves, vermilion walls, glazed roofs, or courtyard structures).\n"
    "- Maintain authentic documentary proportions, cultural integrity, and physical realism. The subject must be grounded solidly and physically on the stage floor—STRICTLY NO FLOATING, NO FLYING, NO LEVITATION.\n\n"
    "2. COLOR IS ARCHITECTURE (色彩即建筑，巨幅纯色色场构筑空间):\n"
    "- Rebuild the entire environment using 2 dominant saturated color fields plus 1 supporting tone (e.g., massive Yves Klein Cobalt Blue wall × Vermilion China Red plane; or Mustard Ochre Yellow wall × Dark Terracotta floor × Deep Teal accent).\n"
    "- 60%–80% of the composition is occupied by monumental, flat, matte color planes that act as physical walls, floors, geometric horizons, and spatial thresholds. Color is architecture, not decorative background.\n\n"
    "3. RADICAL ENVIRONMENTAL REDUCTION (大刀阔斧削减现实杂质):\n"
    "- Aggressively eliminate all environmental clutter: tourists, crowds, traffic, lampposts, modern buildings, messy wires, trees, and sky smog.\n"
    "- Reconstruct the scene into a pristine, silent, theatrical cinematic stage with massive negative space, sharp geometric cuts, and absolute minimalism.\n\n"
    "4. ONE IMPOSSIBLE THING (唯一超现实戏剧干预 - 坚决拒绝庸俗AI奇幻):\n"
    "- Introduce ONE restrained, high-concept theatrical impossibility through space, scale, shadow, or architectural threshold (such as a razor-sharp vertical geometric doorway cut into a monumental colored wall revealing a contrasting night sky/color; an oversized theatrical silhouette shadow cast on a flat wall; or an impossible spatial division).\n"
    "- STRICT PROHIBITION: Absolutely NO floating in the clouds, NO heavenly sky gates, NO fluffy sunset clouds, NO glowing celestial fantasy, NO fantasy castles, NO dreamcore clichés. The world is structurally impossible, but physically and photographically believable.\n\n"
    "5. 35MM ANALOG PHOTOGRAPHIC REALISM (真实35mm胶片摄影质感):\n"
    "- Directional, clean theatrical sunlight creating hard, crisp geometric shadows; tactile matte plaster, stucco, and stone textures; fine 35mm film grain (Kodak Portra / Ektachrome).\n"
    "- Looks like a real documentary photograph taken on a colossal art-directed stage (like Edward Hopper meets Giorgio de Chirico and Alex Prager), zero CGI 3D digital gloss, zero digital airbrush, zero fantasy video game aesthetics.\n"
    "{moodNotes} {textInstruction}"
)

new_negative_prompt = (
    "floating in the clouds, heavenly clouds, golden sunset sky, celestial fantasy, dreamcore, fantasy castle, "
    "flying buildings, floating islands, fluffy clouds, CGI 3D digital art, video game rendering, glossy shiny surfaces, "
    "plastic texture, neon glow, cluttered background, tourist crowds, watermark, text, signature, low quality"
)

new_description = (
    "“One impossible thing”。保留真实人物/建筑/人文记忆，大刀阔斧削减环境杂质，重构为饱和纯色色场、极简几何空间与硬朗戏剧光影的超现实电影舞台。"
)

svg_rr = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
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
</svg>"""

# 2. Update server_data/ai_styles.json
with open("server_data/ai_styles.json", "r", encoding="utf-8") as f:
    server_styles = json.load(f)

for s in server_styles:
    if s["id"] == "reality_restaged":
        s["description"] = new_description
        s["promptTemplate"] = new_prompt_template
        s["negativePrompt"] = new_negative_prompt
        s["previewSvg"] = svg_rr
        print("Updated reality_restaged in server_data/ai_styles.json")

with open("server_data/ai_styles.json", "w", encoding="utf-8") as f:
    json.dump(server_styles, f, ensure_ascii=False, indent=2)

# 3. Update src/lib/ai-styles.ts
with open("src/lib/ai-styles.ts", "r", encoding="utf-8") as f:
    ts_content = f.read()

# Replace description
ts_desc_old = '    description:\n      "“One impossible thing”。保留人物与纪实记忆，大刀阔斧削减环境杂物，重构为纯色色场、超现实尺度与电影戏剧舞台感的不可思议世界。",'
ts_desc_new = f'    description:\n      "{new_description}",'
assert ts_desc_old in ts_content, "ts_desc_old not found"
ts_content = ts_content.replace(ts_desc_old, ts_desc_new, 1)

# Replace promptTemplate and negativePrompt
old_block = """    promptTemplate:
      "基于上传照片进行【纪实重构 · 超现实舞台】（Reality Restaged: Documentary memory, Surreal stage）。遵循核心法则：【现实第一，超现实第二】。画面必须严格保留原照片中真实人物/动物的身体姿态、眼神、动作互动、服饰质感与纪实情绪锚点；大刀阔斧削减原本琐碎繁杂的现实背景。引入【一个强有力的超现实戏剧性干预（One impossible thing）】：将主体置于电影舞台般的宏大纯净色场、极简几何空间、剧场追光或超现实尺度构图中（Color is Architecture）。保持真实自然的电影光学布光、细腻真实的 35mm 胶片颗粒与真实人体解剖比例。画面不是廉价卡通或过度修饰的CG，而是一张“本不可能存在的世界的真实摄影”。{moodNotes} {textInstruction}",
    negativePrompt:
      "generic AI fantasy sparkles, plastic smooth skin, oversharpened, 3d render CGI, cartoon comic, multiple duplicate heads, distorted hands, extra limbs, messy cluttered objects, cheap photoshop cutout, watermark","""

escaped_prompt_template = new_prompt_template.replace('"', '\\"')
new_block = f"""    promptTemplate:
      "{escaped_prompt_template}",
    negativePrompt:
      "{new_negative_prompt}","""

assert old_block in ts_content, "old_block not found in ai-styles.ts"
ts_content = ts_content.replace(old_block, new_block, 1)

# Replace previewSvg for reality_restaged
# Find start of previewSvg for reality_restaged
rr_start = ts_content.find('id: "reality_restaged",')
assert rr_start != -1, "reality_restaged start not found"
svg_start = ts_content.find('previewSvg: `<svg', rr_start)
svg_end = ts_content.find('</svg>`,', svg_start) + len('</svg>`,')
old_svg_block = ts_content[svg_start:svg_end]
new_svg_block = f"previewSvg: `{svg_rr}`,"
ts_content = ts_content.replace(old_svg_block, new_svg_block, 1)

# Replace textInstruction in buildStylePrompt
old_rr_text = """    } else if (style.id === "reality_restaged") {
      textPart = `【电影定格排版】: 请在画面底部边角处以极简电影字幕形式融入 1 行定格英文（如 “SCENE 01 • DOCUMENTARY MEMORY”），字号克制。`;"""

new_rr_text = """    } else if (style.id === "reality_restaged") {
      textPart = `【画面文字要求】: 保持极简纯净艺术画面，切勿在画面中添加任何文字、标题、字幕、水印或标签 (Pure artwork, no text, no typography, no subtitles, no watermarks).`;"""

assert old_rr_text in ts_content, "old_rr_text not found in ai-styles.ts"
ts_content = ts_content.replace(old_rr_text, new_rr_text, 1)

# Append negativePrompt injection in buildStylePrompt
old_prompt_return = """  const notesPart = customNotes.trim() && !mood.trim() ? ` 附加具体要求: ${customNotes.trim()}。` : "";

  prompt = prompt.replace("{customNotes}", notesPart + descPart);
  return prompt.trim();"""

new_prompt_return = """  const notesPart = customNotes.trim() && !mood.trim() ? ` 附加具体要求: ${customNotes.trim()}。` : "";

  prompt = prompt.replace("{customNotes}", notesPart + descPart);

  // Inject negative constraints directly so OpenAI image edit / chatgpt2api models respect them
  if (style.negativePrompt && style.negativePrompt.trim()) {
    prompt += ` 【严禁出现 (Strictly Prohibited)】: ${style.negativePrompt.trim()}。`;
  }

  return prompt.trim();"""

assert old_prompt_return in ts_content, "old_prompt_return not found in ai-styles.ts"
ts_content = ts_content.replace(old_prompt_return, new_prompt_return, 1)

with open("src/lib/ai-styles.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print("Successfully updated src/lib/ai-styles.ts and server_data/ai_styles.json!")
