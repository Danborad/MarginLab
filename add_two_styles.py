import json

with open("src/lib/ai-styles.ts", "r", encoding="utf-8") as f:
    content = f.read()

target_hook = "  {\n    id: \"reality_collage\","
assert target_hook in content, "target_hook not found"

style_insert = '''  {
    id: "photo_abstract_diptych",
    name: "真实摄影+抽象设计",
    enName: "09 · Photo & Abstract Minimalist Poster",
    category: "editorial",
    badge: "p10 推荐",
    enabled: true,
    order: 9,
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
    name: "极简编辑插画海报",
    enName: "10 · Minimal Editorial Illustration",
    category: "illustration",
    badge: "独立杂志",
    enabled: true,
    order: 10,
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
'''

content = content.replace(target_hook, style_insert + target_hook, 1)

old_prompt_branch = """        : style.id === "reality_restaged"
        ? `【电影定格排版】: 请在画面下部或角落以电影剧照定格字幕融入“${specifiedText.trim()}”，克制典雅，不破坏超现实舞台构图。`
        : `【画面文字排版】: 请在画面的留白或视觉焦点处，自然融入排版文字“${specifiedText.trim()}”，采用契合整体风格的典雅字体。`;"""

new_prompt_branch = """        : style.id === "reality_restaged"
        ? `【电影定格排版】: 请在画面下部或角落以电影剧照定格字幕融入“${specifiedText.trim()}”，克制典雅，不破坏超现实舞台构图。`
        : style.id === "photo_abstract_diptych"
        ? `【海报标题排版】: 请在上下两部分分割处或海报中央留白处，使用高级国际设计排版风格居中排版英文大标题“${specifiedText.trim()}”，附带精致小字副标题与细水平分割线。`
        : style.id === "minimal_editorial_illustration"
        ? `【杂志标题排版】: 请在画面下方偏左排版，使用优雅高对比度的古典编辑衬线字体排版英文标题“${specifiedText.trim()}”，颜色为深咖啡黑，并附带一行小号斜体衬线副标题。`
        : `【画面文字排版】: 请在画面的留白或视觉焦点处，自然融入排版文字“${specifiedText.trim()}”，采用契合整体风格的典雅字体。`;"""

assert old_prompt_branch in content, "old_prompt_branch not found"
content = content.replace(old_prompt_branch, new_prompt_branch, 1)

old_else_branch = """    } else if (style.id === "reality_restaged") {
      textPart = `【电影定格排版】: 请在画面底部边角处以极简电影字幕形式融入 1 行定格英文（如 “SCENE 01 • DOCUMENTARY MEMORY”），字号克制。`;
    } else {"""

new_else_branch = """    } else if (style.id === "reality_restaged") {
      textPart = `【电影定格排版】: 请在画面底部边角处以极简电影字幕形式融入 1 行定格英文（如 “SCENE 01 • DOCUMENTARY MEMORY”），字号克制。`;
    } else if (style.id === "photo_abstract_diptych") {
      textPart = `【海报标题排版】: 请在上下两部分中间的米白色分割带，居中排版一组高级简洁英文标题（如 “RIVER BRIDGE FORM / NIGHT STRUCTURE STUDY” 或 “URBAN FORM STUDY”），搭配精致水平纹理细线与限量版艺术海报字样。`;
    } else if (style.id === "minimal_editorial_illustration") {
      textPart = `【杂志标题排版】: 根据上传图片呈现的内容、空间或情绪，自动创作一个由 2–4 个英文单词组成的诗意标题（如 “Soft Gatherings” / “Open Light”）。在画面下方偏左排版，使用优雅高对比度的古典编辑衬线字体，颜色为深咖啡黑。标题下方附带一句由 4–9 个英文单词组成的简短副标题，使用较小的斜体衬线字体。`;
    } else {"""

assert old_else_branch in content, "old_else_branch not found"
content = content.replace(old_else_branch, new_else_branch, 1)

with open("src/lib/ai-styles.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully updated src/lib/ai-styles.ts with 2 new styles!")
