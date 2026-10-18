import React from "react";
import { Album, AlbumTheme, AlbumCoverConfig, AlbumCoverStyle } from "../../../types/album";
import { COVER_THEMES } from "./BookFaces";
import { Sparkles, Bookmark, Compass, Award } from "lucide-react";

export interface BookCoverRendererProps {
  album: Album;
  coverConfig?: AlbumCoverConfig;
  theme?: AlbumTheme;
  previewMode?: boolean;
}

export const BookCoverRenderer: React.FC<BookCoverRendererProps> = ({
  album,
  coverConfig: customConfig,
  theme: customTheme,
  previewMode = false,
}) => {
  const theme = customTheme || album.theme || "indigo";
  const skin = COVER_THEMES[theme] || COVER_THEMES.indigo;
  const config: AlbumCoverConfig = {
    ...(album.coverConfig || {}),
    ...(customConfig || {}),
  };
  const style: AlbumCoverStyle = config.style || "minimal";

  /* 书脊装订压槽痕 (French Groove Hinge Crease) - 堵头布由书脊正中统一维护，避免展开时双倍重复 */
  const renderHardcoverAccents = () => (
    <div
      className="absolute top-0 bottom-0 left-[16px] w-[1.5px] pointer-events-none z-20"
      style={{
        background:
          "linear-gradient(to right, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.06) 50%, rgba(255,255,255,0.35) 100%)",
      }}
    />
  );

  /* ─────────────────────────────────────────────────────────────
   * 风格 1：文艺书影 (Literary Minimalist)
   * 对应用户参考图 1：暖白特种纸、照片拼贴切片、竖排诗意大字、
   * 斜向深蓝手写体穿插、作者署名与出版社圆形钢印。
   * ───────────────────────────────────────────────────────────── */
  if (style === "literary") {
    const secondaryImg =
      config.secondaryImage ||
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80";

    return (
      <div
        className="w-full h-full relative overflow-hidden select-none bg-[#FAF7F2] text-white"
        style={{
          borderRadius: previewMode ? "4px" : "3px 14px 14px 3px",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
        }}
      >
        {renderHardcoverAccents()}

        {/* 右上方黑白/氛围照片切片 */}
        <div
          className="absolute top-6 right-7 w-[105px] h-[116px] overflow-hidden bg-stone-200 border border-black/10 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
          style={{ transform: "rotate(0.5deg)" }}
        >
          <img
            src={secondaryImg}
            alt=""
            draggable={false}
            className="w-full h-full object-cover filter grayscale contrast-105"
          />
        </div>

        {/* 核心主照片卡片 (带真实白边与悬浮阴影) */}
        <div
          className="absolute top-[148px] left-[52px] w-[184px] h-[132px] bg-white p-1.5 shadow-[0_10px_26px_rgba(0,0,0,0.18)] border border-black/5"
          style={{ transform: "rotate(-1deg)" }}
        >
          <div className="w-full h-full overflow-hidden relative bg-stone-100">
            <img
              src={album.coverImage}
              alt={album.title}
              draggable={false}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 右侧竖排大字标题句 */}
        <div
          className="absolute top-[52px] left-[170px] z-10 pointer-events-none"
          style={{
            writingMode: "vertical-rl",
            letterSpacing: "4px",
          }}
        >
          <span className="font-serif font-bold text-[14px] text-zinc-900 leading-tight">
            {config.tagline || "没有到不了的，你要去相信，"}
          </span>
        </div>

        {/* 左侧竖排诗意辅句 */}
        <div
          className="absolute top-[108px] left-[26px] z-10 pointer-events-none max-h-[190px] overflow-hidden"
          style={{
            writingMode: "vertical-rl",
            letterSpacing: "2.5px",
          }}
        >
          <span className="font-serif text-[10.5px] text-zinc-700 leading-relaxed">
            {config.tagline2 || "愿有人陪你颠沛流离，如果没有，愿你成为自己的太阳。"}
          </span>
        </div>

        {/* 贯穿照片与版面的深蓝手写花体签名 */}
        <div
          className="absolute top-[242px] left-[16px] z-20 pointer-events-none text-[#1E3A8A] font-serif italic text-[27px] font-normal tracking-wide whitespace-nowrap"
          style={{
            transform: "rotate(-8.5deg)",
            textShadow: "0 1px 2px rgba(255,255,255,0.9)",
          }}
        >
          {config.scriptText || "there is no tomorrow"}
        </div>

        {/* 下部书名与作者署名 */}
        <div className="absolute bottom-[66px] right-[36px] flex items-end gap-3 z-10">
          <div
            style={{ writingMode: "vertical-rl", letterSpacing: "3px" }}
            className="font-serif text-[11px] text-zinc-700"
          >
            <span>{album.author || "卢思浩"}</span>
            <span className="text-[9px] text-zinc-400 mt-1">著</span>
          </div>

          <div
            style={{ writingMode: "vertical-rl", letterSpacing: "6px" }}
            className="font-serif font-bold text-[18px] text-zinc-950"
          >
            {config.verticalTitle || album.title || "明。天"}
          </div>
        </div>

        {/* 底部百花洲文艺出版社圆形钢印署名 */}
        <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[9px] font-serif text-zinc-500 z-10">
          <div className="w-3.5 h-3.5 rounded-full border border-zinc-400 flex items-center justify-center text-[7px] font-bold">
            印
          </div>
          <span className="tracking-widest uppercase text-[8.5px]">
            {config.publisher || "百花洲文艺出版社"}
          </span>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
   * 风格 2：现代书腰 (Modern Art Obi Band)
   * 对应用户参考图 2：全幅流体/艺术大片、空灵竖排大字、
   * 底部实体纸质半截书腰（腰封）与几何水印。
   * ───────────────────────────────────────────────────────────── */
  if (style === "obi") {
    // 拆解主标题为两个呼吸感大字
    const rawTitle = config.verticalTitle || album.title || "心流";
    const char1 = rawTitle.charAt(0) || "心";
    const char2 = rawTitle.charAt(1) || rawTitle.slice(1) || "流";

    return (
      <div
        className="w-full h-full relative overflow-hidden select-none bg-stone-900 text-white"
        style={{
          borderRadius: previewMode ? "4px" : "3px 14px 14px 3px",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
        }}
      >
        {renderHardcoverAccents()}

        {/* 全幅艺术底图 */}
        <div className="absolute inset-0">
          <img
            src={album.coverImage}
            alt=""
            draggable={false}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,25,30,0.65) 0%, rgba(10,25,30,0.30) 40%, rgba(10,25,30,0.75) 100%)",
            }}
          />
        </div>

        {/* 上半部：空灵现代竖排大字排版 */}
        <div className="relative z-10 pt-7 px-8 flex flex-col items-center text-center">
          {/* 顶部圆环符号 */}
          <div className="text-[#F3DFC8] text-base font-light mb-1 opacity-90">○</div>

          {/* 首个巨型大字 */}
          <h1
            className="text-4xl sm:text-5xl font-serif font-light text-[#F5E2CE] tracking-[0.2em] leading-none"
            style={{ textShadow: "0 4px 16px rgba(0,0,0,0.7)" }}
          >
            {char1}
          </h1>

          {/* 中间横向大字距英文字母 */}
          <div
            className="my-3 text-[9px] font-mono tracking-[0.35em] text-[#E8C59A] uppercase px-3 py-0.5 border-y border-[#E8C59A]/30 bg-black/20"
          >
            {config.scriptText || "M - E - N - T - A - L   F - L - O - W"}
          </div>

          {/* 第二个巨型大字 */}
          <h1
            className="text-4xl sm:text-5xl font-serif font-light text-[#F5E2CE] tracking-[0.2em] leading-none mb-3"
            style={{ textShadow: "0 4px 16px rgba(0,0,0,0.7)" }}
          >
            {char2}
          </h1>

          {/* 括号副标 */}
          <div className="text-[10px] font-serif text-[#E8C59A]/90 tracking-widest mt-1">
            「{album.subtitle || "最優體驗心理學"}」
          </div>

          {/* 作者署名 */}
          <div className="text-[8.5px] font-mono text-gray-900/70 tracking-widest mt-2 uppercase">
            BY {album.author || "Mihaly Csikszentmihalyi"}
          </div>
        </div>

        {/* 下半部：现代特种纸质感书腰 (Obi / Belly Band) */}
        <div
          className="absolute bottom-0 inset-x-0 h-[142px] bg-[#FAF8F5] text-white p-3.5 flex justify-between z-20 shadow-[0_-6px_20px_rgba(0,0,0,0.45)] border-t border-black/10 overflow-hidden"
        >
          {/* 书腰背景几何同心圆水印 */}
          <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full border border-red-500/10 pointer-events-none" />
          <div className="absolute -right-2 -bottom-2 w-28 h-28 rounded-full border border-red-500/10 pointer-events-none" />

          {/* 书腰左侧：竖排小九宫格与英文小标 */}
          <div className="w-[52px] shrink-0 border-r border-stone-300/80 pr-2 flex flex-col justify-between">
            <div
              style={{ writingMode: "vertical-rl", letterSpacing: "2px" }}
              className="font-serif font-bold text-[10px] text-zinc-800 leading-tight"
            >
              {config.obiBadge || "心體最 理驗優 學"}
            </div>
            <span className="font-serif italic text-[8.5px] text-stone-400">
              mental flow
            </span>
          </div>

          {/* 书腰右侧：红色宣发主标与精彩摘录 */}
          <div className="flex-1 pl-3 flex flex-col justify-between py-0.5">
            <div className="space-y-1">
              <h5 className="text-[11px] font-serif font-bold text-[#B91C1C] leading-snug tracking-wide">
                {config.obiHeadline || "心流理論之父、積極心理學奠基人 开山之作！"}
              </h5>
              <p className="text-[8.5px] font-serif text-stone-600 line-clamp-3 leading-relaxed">
                "{config.obiText || "『心流』是我們在做某些事情時，那種全神貫注、投入忘我的狀態——這種狀態下，你甚至感覺不到時間的存在。"}"
              </p>
            </div>
            <div className="text-[7.5px] font-mono text-stone-400 flex items-center justify-between border-t border-stone-200 pt-1">
              <span>SPECIAL EDITION</span>
              <span>MARGINLAB PUBLISHING</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
   * 风格 3：画廊全幅 (Fine Art Gallery)
   * 极简杂志大片、细线几何框、典雅高定字号。
   * ───────────────────────────────────────────────────────────── */
  if (style === "gallery") {
    return (
      <div
        className="w-full h-full relative overflow-hidden select-none bg-black text-white"
        style={{
          borderRadius: previewMode ? "4px" : "3px 14px 14px 3px",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)",
        }}
      >
        {renderHardcoverAccents()}

        <img
          src={album.coverImage}
          alt={album.title}
          draggable={false}
          className="w-full h-full object-cover"
        />

        {/* 渐变遮罩 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 35%, rgba(0,0,0,0.85) 100%)",
          }}
        />

        {/* 细金双边框画框 */}
        <div className="absolute inset-4 sm:inset-5 border border-amber-300/40 pointer-events-none flex flex-col justify-between p-4">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-amber-200/90 bg-black/40 px-2 py-0.5 rounded border border-amber-300/20">
              {config.badge || "MARGINLAB FINE ART • VOL. 07"}
            </span>
            <span className="text-[8px] font-mono text-gray-900/60">2026 EDITION</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-wider leading-tight">
              {album.title}
            </h2>
            {album.subtitle && (
              <p className="text-[10px] font-serif text-gray-900/80 tracking-widest uppercase">
                {album.subtitle}
              </p>
            )}
            <div className="flex items-center justify-between text-[9px] font-mono text-gray-900/60 pt-2 border-t border-white/20">
              <span>{album.author || "MarginLab Studio"}</span>
              <span className="text-amber-300/90">LIMITED COLLECTION</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
   * 风格 4：东方留白 (Oriental Zen Minimalist)
   * 暖色宣纸肌理、宋体竖排标题、朱砂印章、细条摄影切片。
   * ───────────────────────────────────────────────────────────── */
  if (style === "minimal") {
    return (
      <div
        className="w-full h-full relative overflow-hidden select-none bg-[#F7F4EB] text-white p-6 flex justify-between"
        style={{
          borderRadius: previewMode ? "4px" : "3px 14px 14px 3px",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
        }}
      >
        {renderHardcoverAccents()}

        {/* 左侧：宋体竖排标题与朱砂印章 */}
        <div className="flex items-start gap-4 pl-3 pt-4">
          <div
            style={{ writingMode: "vertical-rl", letterSpacing: "8px" }}
            className="font-serif font-bold text-2xl text-zinc-900"
          >
            {config.verticalTitle || album.title}
          </div>

          <div className="flex flex-col items-center gap-3 pt-2">
            {/* 朱砂印章 */}
            <div className="w-5 h-5 rounded-xs border-2 border-[#991B1B] text-[#991B1B] flex items-center justify-center text-[9px] font-serif font-black shadow-2xs">
              印
            </div>
            {album.subtitle && (
              <div
                style={{ writingMode: "vertical-rl", letterSpacing: "3px" }}
                className="font-serif text-[10px] text-zinc-500"
              >
                {album.subtitle}
              </div>
            )}
          </div>
        </div>

        {/* 右侧：纵向修长摄影画卷切片 */}
        <div className="w-[130px] h-[340px] my-auto rounded-xs overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-black/10 relative bg-stone-200">
          <img
            src={album.coverImage}
            alt=""
            draggable={false}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 底部作者与年代 */}
        <div className="absolute bottom-5 left-8 text-[9px] font-serif text-zinc-400 tracking-widest">
          {album.author || "MarginLab"} · 丙午年藏
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
   * 风格 5：经典精装 (Classic Hardcover)
   * 布面质感底色、烫金居中开窗画框、高定藏书压印。
   * 绝无粗糙金柱，展现典雅正规装帧。
   * ───────────────────────────────────────────────────────────── */
  return (
    <div
      className="w-full h-full relative overflow-hidden select-none p-6 flex flex-col justify-between"
      style={{
        background: skin.bg,
        borderRadius: previewMode ? "4px" : "3px 14px 14px 3px",
        boxShadow: "inset 0 0 0 1px " + skin.border,
      }}
    >
      {renderHardcoverAccents()}

      {/* 顶部主标与烫金字体 */}
      <div className="pl-4 space-y-1">
        <span
          className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border font-bold inline-block"
          style={{
            borderColor: skin.border,
            color: skin.foil,
            backgroundColor: "rgba(0,0,0,0.25)",
          }}
        >
          {config.badge || "FINE ART PHOTOBOOK"}
        </span>

        <h2
          className="text-2xl font-serif font-bold tracking-wider leading-tight line-clamp-2"
          style={{
            color: skin.foil,
            textShadow: "0 2px 8px rgba(0,0,0,0.6)",
          }}
        >
          {album.title || "艺术画册"}
        </h2>

        {album.subtitle && (
          <p className="text-[10px] font-serif tracking-wide text-gray-900/75 line-clamp-1">
            {album.subtitle}
          </p>
        )}
      </div>

      {/* 居中开窗画框 */}
      <div className="my-3 ml-4 rounded-md overflow-hidden border border-amber-400/30 shadow-[0_8px_24px_rgba(0,0,0,0.45)] relative bg-black/20 flex-1">
        <img
          src={album.coverImage}
          alt={album.title}
          draggable={false}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%)",
          }}
        />
      </div>

      {/* 底部作者与出版社署名 */}
      <div className="ml-4 flex items-center justify-between text-[9px] font-mono text-gray-900/50 border-t border-white/10 pt-2">
        <span className="truncate max-w-[150px]">{album.author || "MarginLab Journal"}</span>
        <span className="opacity-70">COLLECTION</span>
      </div>
    </div>
  );
};
