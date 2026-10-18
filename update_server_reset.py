with open("server.js", "r", encoding="utf-8") as f:
    content = f.read()

old_code = """  const resetStyles = current.map((s) => {
    const isCore = s.id === "dreamy_motion_editorial" || s.id === "fantasy_qiqiguaiguai" || s.id === "street_photo_black_ink" || s.id === "street_photo_color_chibi";
    return {
      ...s,
      enabled: isCore,
      badge: s.id === "dreamy_motion_editorial" ? "s21 顶荐" : s.id === "fantasy_qiqiguaiguai" ? "爆款社交" : s.id === "street_photo_black_ink" ? "黑白手绘" : s.id === "street_photo_color_chibi" ? "彩色轻Q" : "待开放",
      updatedAt: new Date().toISOString(),
    };
  });
  writeAiStyles(resetStyles);

  res.json({
    success: true,
    message: "已重置风格模板列表（保留 s21 梦幻动态海报、FANTASY 奇奇怪怪 与街拍实景插画两款开启）",
    styles: resetStyles,
  });"""

new_code = """  const resetStyles = current.map((s) => {
    const isCore =
      s.id === "dreamy_motion_editorial" ||
      s.id === "fantasy_qiqiguaiguai" ||
      s.id === "street_photo_black_ink" ||
      s.id === "street_photo_color_chibi" ||
      s.id === "culture_fragment_poster" ||
      s.id === "eastern_ink_diptych_scenery" ||
      s.id === "eastern_ink_diptych_arch" ||
      s.id === "reality_restaged";
    return {
      ...s,
      enabled: isCore,
      badge:
        s.id === "dreamy_motion_editorial"
          ? "s21 顶荐"
          : s.id === "fantasy_qiqiguaiguai"
          ? "爆款社交"
          : s.id === "street_photo_black_ink"
          ? "黑白手绘"
          : s.id === "street_photo_color_chibi"
          ? "彩色轻Q"
          : s.id === "culture_fragment_poster"
          ? "梵想美学"
          : s.id === "eastern_ink_diptych_scenery"
          ? "水墨二分"
          : s.id === "eastern_ink_diptych_arch"
          ? "水墨构筑"
          : s.id === "reality_restaged"
          ? "电影舞台"
          : "待开放",
      updatedAt: new Date().toISOString(),
    };
  });
  writeAiStyles(resetStyles);

  res.json({
    success: true,
    message: "已重置风格模板列表（保留 8 大官方高定与开源复刻风格开启）",
    styles: resetStyles,
  });"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open("server.js", "w", encoding="utf-8") as f:
        f.write(content)
    print("Updated server.js reset logic successfully.")
else:
    print("Warning: old_code not found in server.js")
