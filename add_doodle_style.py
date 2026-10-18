import json
import xml.etree.ElementTree as ET

# 1. Prepare SVG
doodle_svg = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" width="100%" height="100%">
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
</svg>"""

# Validate SVG XML
ET.fromstring(doodle_svg)
print("SVG validated successfully as XML!")

# 2. Style Object Definition
style_11_obj = {
    "id": "funny_ugly_doodle",
    "name": "魔性丑萌蜡笔涂鸦",
    "enName": "11 · Funny Ugly Doodle Meme Drawing",
    "category": "illustration",
    "badge": "Meme 涂鸦",
    "enabled": True,
    "order": 11,
    "githubUrl": "",
    "description": "将照片转化为魔性、幽默、故意画得很烂的廉价蜡笔/马克笔涂鸦。粗糙凌乱的儿童简笔画风、崩坏失真的透视与笨拙滑稽的人物表情，点缀戴墨镜太阳、魔性对话框（如 SUP PEASANTS、AYO WHAT 等）与街头草稿涂鸦，极具互联网梗图 Meme 喜感。",
    "aspectRatio": "auto",
    "recommendedTemplateId": "modern-gallery-single",
    "tags": ["魔性涂鸦", "蜡笔手绘", "廉价马克笔", "Meme梗图", "儿童画风", "幽默恶搞", "抽象简笔"],
    "promptTemplate": "Turn this photo into a funny ugly doodle drawing. Make it look like: a quick sketch using a cheap marker or crayon messy, rough, childlike style bad perspective and awkward proportions slightly exaggerated facial features Add: simple cartoon background (like buildings, trees, street) random sketchy lines and details uneven coloring and visible strokes Style: looks like a lazy drawing, not polished humorous and a bit stupid-looking meme-like, casual, internet style Do NOT: make it realistic. {moodNotes} {textInstruction}",
    "negativePrompt": "photorealistic, 3d render, detailed art, clean vector, polished digital painting, beautiful lighting, accurate proportions, smooth gradients, cinematic",
    "previewSvg": doodle_svg
}

# 3. Update server_data/ai_styles.json
with open("server_data/ai_styles.json", "r", encoding="utf-8") as f:
    server_styles = json.load(f)

# Filter out if existing funny_ugly_doodle exists
server_styles = [s for s in server_styles if s.get("id") != "funny_ugly_doodle"]
server_styles.append(style_11_obj)

with open("server_data/ai_styles.json", "w", encoding="utf-8") as f:
    json.dump(server_styles, f, ensure_ascii=False, indent=2)
print("Updated server_data/ai_styles.json! Total styles:", len(server_styles))

# 4. Update src/lib/ai-styles.ts
with open("src/lib/ai-styles.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Insert before "  {\n    id: \"reality_collage\","
target_hook = "  {\n    id: \"reality_collage\","
assert target_hook in content, "target_hook not found in ai-styles.ts"

ts_style_insert = f'''  {{
    id: "funny_ugly_doodle",
    name: "魔性丑萌蜡笔涂鸦",
    enName: "11 · Funny Ugly Doodle Meme Drawing",
    category: "illustration",
    badge: "Meme 涂鸦",
    enabled: true,
    order: 11,
    githubUrl: "",
    description:
      "将照片转化为魔性、幽默、故意画得很烂的廉价蜡笔/马克笔涂鸦。粗糙凌乱的儿童简笔画风、崩坏失真的透视与笨拙滑稽的人物表情，点缀戴墨镜太阳、魔性对话框（如 SUP PEASANTS、AYO WHAT 等）与街头草稿涂鸦，极具互联网梗图 Meme 喜感。",
    aspectRatio: "auto",
    recommendedTemplateId: "modern-gallery-single",
    tags: ["魔性涂鸦", "蜡笔手绘", "廉价马克笔", "Meme梗图", "儿童画风", "幽默恶搞", "抽象简笔"],
    promptTemplate:
      "Turn this photo into a funny ugly doodle drawing. Make it look like: a quick sketch using a cheap marker or crayon messy, rough, childlike style bad perspective and awkward proportions slightly exaggerated facial features Add: simple cartoon background (like buildings, trees, street) random sketchy lines and details uneven coloring and visible strokes Style: looks like a lazy drawing, not polished humorous and a bit stupid-looking meme-like, casual, internet style Do NOT: make it realistic. {{moodNotes}} {{textInstruction}}",
    negativePrompt:
      "photorealistic, 3d render, detailed art, clean vector, polished digital painting, beautiful lighting, accurate proportions, smooth gradients, cinematic",
    previewSvg: `{doodle_svg}`,
  }},
'''

content = content.replace(target_hook, ts_style_insert + target_hook, 1)

# Update buildStylePrompt branches
old_specified_branch = """        : style.id === "minimal_editorial_illustration"
        ? `【杂志标题排版】: 请在画面下方偏左排版，使用优雅高对比度的古典编辑衬线字体排版英文标题“${specifiedText.trim()}”，颜色为深咖啡黑，并附带一行小号斜体衬线副标题。`
        : `【画面文字排版】: 请在画面的留白或视觉焦点处，自然融入排版文字“${specifiedText.trim()}”，采用契合整体风格的典雅字体。`;"""

new_specified_branch = """        : style.id === "minimal_editorial_illustration"
        ? `【杂志标题排版】: 请在画面下方偏左排版，使用优雅高对比度的古典编辑衬线字体排版英文标题“${specifiedText.trim()}”，颜色为深咖啡黑，并附带一行小号斜体衬线副标题。`
        : style.id === "funny_ugly_doodle"
        ? `【涂鸦对话框/恶搞台词排版】: 请在画面空白处以魔性儿童简笔对话框或粗糙蜡笔手写字形式，融入“${specifiedText.trim()}”，带有一点歪七扭八的恶搞幽默感。`
        : `【画面文字排版】: 请在画面的留白或视觉焦点处，自然融入排版文字“${specifiedText.trim()}”，采用契合整体风格的典雅字体。`;"""

assert old_specified_branch in content, "old_specified_branch not found"
content = content.replace(old_specified_branch, new_specified_branch, 1)

old_unspecified_branch = """    } else if (style.id === "minimal_editorial_illustration") {
      textPart = `【杂志标题排版】: 根据上传图片呈现的内容、空间或情绪，自动创作一个由 2–4 个英文单词组成的诗意标题（如 “Soft Gatherings” / “Open Light”）。在画面下方偏左排版，使用优雅高对比度的古典编辑衬线字体，颜色为深咖啡黑。标题下方附带一句由 4–9 个英文单词组成的简短副标题，使用较小的斜体衬线字体。`;
    } else {"""

new_unspecified_branch = """    } else if (style.id === "minimal_editorial_illustration") {
      textPart = `【杂志标题排版】: 根据上传图片呈现的内容、空间或情绪，自动创作一个由 2–4 个英文单词组成的诗意标题（如 “Soft Gatherings” / “Open Light”）。在画面下方偏左排版，使用优雅高对比度的古典编辑衬线字体，颜色为深咖啡黑。标题下方附带一句由 4–9 个英文单词组成的简短副标题，使用较小的斜体衬线字体。`;
    } else if (style.id === "funny_ugly_doodle") {
      textPart = `【涂鸦对话框/恶搞台词排版】: 请在画面空白处添加简笔画恶搞对话框或手写涂鸦英文短语（如 “SUP PEASANTS”, “AYO WHAT”, “EZ DUB”, “I CAN DO WHATEVER I WANT” 等符合画面神态的搞笑英文 meme 台词），并点缀戴墨镜太阳、歪歪扭扭的楼房、乱七八糟的杂物草稿线，营造出极其搞笑欠扁的互联网梗图效果。`;
    } else {"""

assert old_unspecified_branch in content, "old_unspecified_branch not found"
content = content.replace(old_unspecified_branch, new_unspecified_branch, 1)

with open("src/lib/ai-styles.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated src/lib/ai-styles.ts successfully with style 11!")
