with open('server.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update /api/admin/styles/reset
old_reset = """  const resetStyles = current.map((s) => ({
    ...s,
    enabled: s.id === "dreamy_motion_editorial",
    badge: s.id === "dreamy_motion_editorial" ? "s21 顶荐" : "待开放",
    updatedAt: new Date().toISOString(),
  }));"""

new_reset = """  const resetStyles = current.map((s) => {
    const isCore = s.id === "dreamy_motion_editorial" || s.id === "fantasy_qiqiguaiguai";
    return {
      ...s,
      enabled: isCore,
      badge: s.id === "dreamy_motion_editorial" ? "s21 顶荐" : s.id === "fantasy_qiqiguaiguai" ? "爆款社交" : "待开放",
      updatedAt: new Date().toISOString(),
    };
  });"""

assert old_reset in content, "old_reset not found"
content = content.replace(old_reset, new_reset, 1)

old_reset_msg = 'message: "已重置风格模板列表（仅保留 s21 梦幻动态电影海报 开启）",'
new_reset_msg = 'message: "已重置风格模板列表（保留 s21 梦幻动态海报 与 FANTASY 奇奇怪怪 开启）",'
content = content.replace(old_reset_msg, new_reset_msg, 1)

# 2. Update generateFallbackStylizedArtwork for isFantasy
old_fn_start = """function generateFallbackStylizedArtwork(styleId, styleName, sourceImage, prompt) {
  const isDreamy = styleId === 'dreamy_motion_editorial' || (styleName && styleName.includes('梦幻'));
  const isSplit = styleId === 'split_gouache_editorial';
  const isBauhaus = styleId === 'bauhaus_geometry';
  const isFilm = styleId === 'vintage_film_contact';
  const isCyber = styleId === 'cyberpunk_neon_noir';"""

new_fn_start = """function generateFallbackStylizedArtwork(styleId, styleName, sourceImage, prompt) {
  const isDreamy = styleId === 'dreamy_motion_editorial' || (styleName && styleName.includes('梦幻'));
  const isFantasy = styleId === 'fantasy_qiqiguaiguai' || (styleName && (styleName.includes('奇奇怪怪') || styleName.includes('FANTASY')));
  const isSplit = styleId === 'split_gouache_editorial';
  const isBauhaus = styleId === 'bauhaus_geometry';
  const isFilm = styleId === 'vintage_film_contact';
  const isCyber = styleId === 'cyberpunk_neon_noir';

  if (isFantasy) {
    let fTitle = "本人正在加载";
    let fSub = "临时外包电源 • 请勿强制启动";
    let fTag1 = "⚡ 续命装置";
    let fTag2 = "电量: 18%";
    let fPercent = "68%";

    const lowerP = (prompt || "").toLowerCase();
    const lowerS = (sourceImage || "").toLowerCase();

    if (lowerP.includes("猫") || lowerP.includes("狗") || lowerP.includes("宠") || lowerP.includes("pet") || lowerS.includes("dog") || lowerS.includes("cat")) {
      fTitle = "家庭首席批准官";
      fSub = "今日决策：拆！业务已全票通过";
      fTag1 = "🐾 业务审批";
      fTag2 = "超支已核准";
      fPercent = "100%";
    } else if (lowerP.includes("雨") || lowerP.includes("伞") || lowerP.includes("rain") || lowerP.includes("weather")) {
      fTitle = "临时气象外包";
      fSub = "今日降水服务：全靠我撑场子";
      fTag1 = "🌧️ 靠天吃饭";
      fTag2 = "勉强有效";
      fPercent = "80%";
    } else if (lowerP.includes("行李") || lowerP.includes("箱") || lowerP.includes("焦虑") || lowerP.includes("travel")) {
      fTitle = "把焦虑托运一下";
      fSub = "换个城市，换个心情，下一站未知";
      fTag1 = "🧳 行李: 超重";
      fTag2 = "计划: 已变形";
      fPercent = "95%";
    } else if (lowerP.includes("街") || lowerP.includes("停") || lowerP.includes("红灯") || lowerP.includes("city")) {
      fTitle = "城市暂停三十秒";
      fSub = "行人缓存中 • 信号待定";
      fTag1 = "🚦 等待模式";
      fTag2 = "肉体仍在工位";
      fPercent = "45%";
    }

    const fantasySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 768 1024" width="768" height="1024">
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
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.45"/>
        </filter>
      </defs>

      <!-- Background Canvas -->
      <rect width="768" height="1024" fill="url(#fq_bg)"/>

      <!-- Editorial Grid Texture -->
      <g stroke="#334155" stroke-width="1" opacity="0.25">
        <line x1="0" y1="128" x2="768" y2="128" stroke-dasharray="8,8"/>
        <line x1="0" y1="256" x2="768" y2="256" stroke-dasharray="8,8"/>
        <line x1="0" y1="384" x2="768" y2="384" stroke-dasharray="8,8"/>
        <line x1="0" y1="512" x2="768" y2="512" stroke-dasharray="8,8"/>
        <line x1="0" y1="640" x2="768" y2="640" stroke-dasharray="8,8"/>
        <line x1="0" y1="768" x2="768" y2="768" stroke-dasharray="8,8"/>
        <line x1="0" y1="896" x2="768" y2="896" stroke-dasharray="8,8"/>
        <line x1="128" y1="0" x2="128" y2="1024" stroke-dasharray="8,8"/>
        <line x1="384" y1="0" x2="384" y2="1024" stroke-dasharray="8,8"/>
        <line x1="640" y1="0" x2="640" y2="1024" stroke-dasharray="8,8"/>
      </g>

      <!-- Photo Card Layer -->
      <g transform="rotate(-1.2 384 512)" filter="url(#fq_shadow)">
        <rect x="70" y="90" width="628" height="780" rx="16" fill="#FFFFFF"/>
        <rect x="94" y="114" width="580" height="600" rx="8" fill="#1E242E"/>
        <!-- Abstract Photographic Silhouette -->
        <path d="M94 520 L240 380 L380 490 L520 350 L674 540 L674 714 L94 714 Z" fill="#334155"/>
        <circle cx="240" cy="280" r="70" fill="#FDE047" opacity="0.85"/>
        <!-- Subject silhouette -->
        <path d="M310 440 L335 640 Q340 660 360 660 L440 660 Q460 660 465 640 L490 440 Z" fill="#94A3B8" opacity="0.8"/>
        <rect x="295" y="426" width="210" height="20" rx="6" fill="#F1F5F9"/>
      </g>

      <!-- Top Left Tape Sticker -->
      <g transform="rotate(-5 160 80)">
        <rect x="90" y="60" width="160" height="44" fill="#FEF08A" opacity="0.95"/>
        <text x="170" y="88" font-family="monospace" font-size="16" font-weight="bold" fill="#854D0E" text-anchor="middle">FANTASY / 3:4</text>
      </g>

      <!-- Giant Sticker Title -->
      <g filter="url(#fq_shadow)">
        <text x="384" y="240" font-family="'PingFang SC', 'Microsoft YaHei', 'Arial Black', sans-serif" font-size="76" font-weight="900" fill="#FFFFFF" text-anchor="middle" stroke="#FFFFFF" stroke-width="18" stroke-linejoin="round" letter-spacing="4">${fTitle}</text>
        <text x="384" y="240" font-family="'PingFang SC', 'Microsoft YaHei', 'Arial Black', sans-serif" font-size="76" font-weight="900" fill="url(#fq_blue)" text-anchor="middle" letter-spacing="4">${fTitle}</text>
      </g>

      <!-- Sparkle Doodles -->
      <path d="M590 160 L605 135 M615 175 L640 165 M608 195 L630 210" stroke="#F59E0B" stroke-width="5" stroke-linecap="round"/>

      <!-- Progress / Battery Status -->
      <g transform="translate(134, 280)" filter="url(#fq_shadow)">
        <rect x="0" y="0" width="500" height="56" rx="28" fill="#0F172A" stroke="#38BDF8" stroke-width="3"/>
        <rect x="8" y="8" width="340" height="40" rx="20" fill="url(#fq_blue)"/>
        <text x="178" y="34" font-family="monospace" font-size="20" font-weight="bold" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">STATUS: ${fPercent}</text>
        <circle cx="455" cy="28" r="10" fill="#22C55E"/>
      </g>

      <!-- Subtitle / Punchline Callout -->
      <g transform="translate(94, 735)" filter="url(#fq_shadow)">
        <rect x="0" y="0" width="580" height="50" rx="10" fill="#0F172A" opacity="0.9"/>
        <text x="290" y="32" font-family="'Songti SC', 'STSong', serif" font-size="22" font-weight="bold" fill="#F8FAFC" text-anchor="middle" letter-spacing="2">“${fSub}”</text>
      </g>

      <!-- Floating Badges -->
      <g transform="translate(80, 580) rotate(-4)" filter="url(#fq_shadow)">
        <rect x="0" y="0" width="230" height="64" rx="10" fill="#FEF08A" stroke="#CA8A04" stroke-width="3"/>
        <text x="20" y="28" font-family="sans-serif" font-size="17" font-weight="900" fill="#713F12">${fTag1}</text>
        <text x="20" y="50" font-family="sans-serif" font-size="14" font-weight="bold" fill="#854D0E">${fTag2}</text>
      </g>

      <g transform="translate(480, 540) rotate(5)" filter="url(#fq_shadow)">
        <rect x="0" y="0" width="200" height="54" rx="8" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/>
        <text x="100" y="34" font-family="sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle">⚠️ 情绪已超标</text>
      </g>

      <!-- Bottom Tag Strip -->
      <rect x="50" y="890" width="668" height="84" rx="16" fill="#1E293B" stroke="#334155" stroke-width="2"/>
      <text x="80" y="930" font-family="sans-serif" font-size="24" font-weight="900" fill="#F8FAFC" letter-spacing="2">FANTASY · 奇奇怪怪</text>
      <text x="80" y="955" font-family="monospace" font-size="15" font-weight="bold" fill="#38BDF8" letter-spacing="3">3:4 SOCIAL EDITORIAL POSTER</text>

      <rect x="540" y="908" width="150" height="48" rx="8" fill="url(#fq_amber)"/>
      <text x="615" y="939" font-family="sans-serif" font-size="18" font-weight="900" fill="#78350F" text-anchor="middle">爆款社交</text>
    </svg>`;

    return "data:image/svg+xml;utf8," + encodeURIComponent(fantasySvg);
  }"""

assert old_fn_start in content, "old_fn_start not found"
content = content.replace(old_fn_start, new_fn_start, 1)

with open('server.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("server.js patched successfully")
