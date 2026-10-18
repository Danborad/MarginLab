import React from "react";
import { Album, AlbumSpreadPage, AlbumTheme } from "../../../types/album";
import { AlbumPageRenderer } from "../AlbumPageRenderer";
import { BookCoverRenderer } from "./BookCoverRenderer";
import {
  BOARD_BOX,
  BOARD_OVH,
  FaceBox,
  FaceSpec,
  PAGE_H,
  PAGE_W,
  PAPER_BOX,
  Side,
} from "./bookModel";
import { Edit2, Sparkles, RotateCcw } from "lucide-react";

export interface FaceContext {
  album: Album;
  totalPages: number;
  onPlaceholderClick: () => void;
  onRestart: () => void;
  onEditPage?: (target: "cover" | "backCover" | "page", spreadIndex?: number, side?: Side) => void;
  interactive: boolean;
}

export const isBoardFace = (spec: FaceSpec | null): boolean =>
  !!spec && (spec.kind === "cover" || spec.kind === "backCover");

export const faceBox = (spec: FaceSpec | null): FaceBox =>
  isBoardFace(spec) ? BOARD_BOX : PAPER_BOX;

/**
 * 侧边容器内的定位：x 一律从「书脊（订口）」往外量。
 * 右半页用 left、左半页用 right，两侧共用同一套几何，永不镜像错位。
 */
export const hingeStyle = (side: Side, box: FaceBox): React.CSSProperties =>
  side === "right"
    ? { left: box.x, top: box.y, width: box.w, height: box.h }
    : { right: box.x, top: box.y, width: box.w, height: box.h };

// 精装封面主题底色材质
export const COVER_THEMES: Record<AlbumTheme, { bg: string; border: string; foil: string }> = {
  indigo: {
    bg: "linear-gradient(140deg, #3C3325 0%, #2A2318 45%, #1E1913 100%)",
    border: "rgba(226,186,110,0.35)",
    foil: "#E6C687",
  },
  slate: {
    bg: "linear-gradient(140deg, #2E3240 0%, #222530 45%, #161820 100%)",
    border: "rgba(200,210,230,0.30)",
    foil: "#E0E6F0",
  },
  dark: {
    bg: "linear-gradient(140deg, #222328 0%, #17181C 45%, #0D0E11 100%)",
    border: "rgba(180,180,190,0.25)",
    foil: "#D0D0D8",
  },
  neutral: {
    bg: "linear-gradient(140deg, #EAE7DE 0%, #DBD6C9 45%, #CBC5B6 100%)",
    border: "rgba(160,140,110,0.35)",
    foil: "#6A5636",
  },
  burgundy: {
    bg: "linear-gradient(140deg, #4F1B25 0%, #380F17 45%, #24080D 100%)",
    border: "rgba(235,185,120,0.35)",
    foil: "#E8BA7B",
  },
  forest: {
    bg: "linear-gradient(140deg, #1C3C2C 0%, #12291E 45%, #0B1A13 100%)",
    border: "rgba(220,195,130,0.35)",
    foil: "#E2C37E",
  },
};

export const getEndpaperBg = (style?: string) => {
  if (style === "literary" || style === "minimal") {
    return "linear-gradient(140deg, #FAF7F2 0%, #F0ECE4 60%, #E6E1D6 100%)";
  }
  if (style === "gallery") {
    return "linear-gradient(140deg, #1A1A1A 0%, #111111 60%, #080808 100%)";
  }
  if (style === "obi") {
    return "linear-gradient(140deg, #24252B 0%, #1A1B20 60%, #121316 100%)";
  }
  return "linear-gradient(140deg, #2E2A22 0%, #201C16 60%, #17140F 100%)";
};

export const ENDPAPER_BG = "linear-gradient(140deg, #FAF7F2 0%, #F0ECE4 60%, #E6E1D6 100%)";

/* ── 内页（相纸）─────────────────────────────────────────────── */

export interface PaperFaceProps {
  spread?: AlbumSpreadPage;
  side: Side;
  spreadIndex?: number;
  pageNumber?: number;
  onPlaceholderClick: () => void;
  onEditPage?: (target: "cover" | "backCover" | "page", spreadIndex?: number, side?: Side) => void;
  interactive: boolean;
}

export const PaperFace: React.FC<PaperFaceProps> = ({
  spread,
  side,
  spreadIndex,
  pageNumber,
  onPlaceholderClick,
  onEditPage,
  interactive,
}) => {
  const gutterToRight = side === "left";
  const pageSide = side === "left" ? spread?.leftPage : spread?.rightPage;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#FAF8F5] group">
      {pageSide ? (
        <AlbumPageRenderer
          page={pageSide}
          side={side}
          pageNumber={pageNumber}
          onPlaceholderClick={interactive ? onPlaceholderClick : undefined}
        />
      ) : (
        <div className="w-full h-full bg-[#FAF8F5] flex items-center justify-center text-stone-400 font-mono text-xs">
          空白页
        </div>
      )}

      {/* 书槽内凹阴影：自订口向页面中部自然衰减 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: gutterToRight
            ? "linear-gradient(to right, rgba(0,0,0,0) 65%, rgba(0,0,0,0.06) 80%, rgba(0,0,0,0.16) 92%, rgba(0,0,0,0.26) 100%)"
            : "linear-gradient(to left, rgba(0,0,0,0) 65%, rgba(0,0,0,0.06) 80%, rgba(0,0,0,0.16) 92%, rgba(0,0,0,0.26) 100%)",
        }}
      />

      {/* 外缘微翘柔和受光 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: gutterToRight
            ? "linear-gradient(to left, rgba(255,255,255,0) 72%, rgba(255,255,255,0.08) 100%)"
            : "linear-gradient(to right, rgba(255,255,255,0) 72%, rgba(255,255,255,0.08) 100%)",
        }}
      />

      {/* 悬停编辑药丸按键 (交互状态可用) */}
      {interactive && onEditPage && spreadIndex !== undefined && (
        <div
          className={`absolute top-3 ${
            side === "left" ? "left-3" : "right-3"
          } opacity-0 group-hover:opacity-100 transition-opacity z-30`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditPage("page", spreadIndex, side);
            }}
            data-no-turn="true"
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-medium flex items-center gap-1 shadow-lg border border-white/20 transition-transform hover:scale-105 cursor-pointer"
            title={`独立编辑此页 (P.${pageNumber})`}
          >
            <Edit2 className="w-3 h-3 text-amber-400" />
            <span>编辑此页</span>
          </button>
        </div>
      )}
    </div>
  );
};

/* ── 封面 ─────────────────────────────────────────────────────── */

const CoverFace: React.FC<{
  album: Album;
  ctx: FaceContext;
}> = ({ album, ctx }) => {
  return (
    <div className="absolute inset-0 overflow-hidden group select-none">
      <BookCoverRenderer album={album} />
      {/* 悬停编辑封面按键 */}
      {ctx.interactive && ctx.onEditPage && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-30">
          <button
            onClick={(e) => {
              e.stopPropagation();
              ctx.onEditPage?.("cover");
            }}
            data-no-turn="true"
            className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-medium flex items-center gap-1 shadow-lg border border-white/20 transition-transform hover:scale-105 cursor-pointer"
            title="独立编辑封面画面与排版"
          >
            <Edit2 className="w-3 h-3 text-amber-400" />
            <span>编辑封面</span>
          </button>
        </div>
      )}
    </div>
  );
};

/* ── 封底 (全面适配 5 款封面风格，质感色彩版式 1:1 呼应) ─────────────── */

const BackCoverFace: React.FC<{ ctx: FaceContext }> = ({ ctx }) => {
  const theme = ctx.album.theme || "indigo";
  const skin = COVER_THEMES[theme] || COVER_THEMES.indigo;
  const back = ctx.album.backCover;
  const config = ctx.album.coverConfig || {};
  const style = config.style || "minimal";

  /* 封底书脊装订压槽痕 (French Groove Hinge Crease) - 堵头布由书脊正中统一维护 */
  const renderSpineAccents = () => (
    <div
      className="absolute top-0 bottom-0 right-[16px] w-[1.5px] pointer-events-none z-20"
      style={{
        background:
          "linear-gradient(to left, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.06) 50%, rgba(255,255,255,0.35) 100%)",
      }}
    />
  );

  /* 条形码与防伪标组件 */
  const renderBarcode = (isDark = false) => (
    <div className="space-y-2">
      <div className={`flex items-center justify-between border-t pt-2.5 ${isDark ? "border-white/15" : "border-black/10"}`}>
        <div className="flex flex-col">
          <span className={`text-[8px] font-mono uppercase ${isDark ? "text-gray-900/40" : "text-stone-400"}`}>
            ISBN 978-7-5500-2026-8
          </span>
          <span className={`text-[9px] font-mono tracking-wider ${isDark ? "text-gray-900/70" : "text-stone-600"}`}>
            MARGINLAB ARCHIVE
          </span>
        </div>
        <div className="flex items-center gap-0.5 h-5">
          {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 3, 2, 1].map((w, i) => (
            <div
              key={i}
              className="h-full"
              style={{
                width: `${w}px`,
                backgroundColor: isDark ? "rgba(255,255,255,0.85)" : "#222222",
              }}
            />
          ))}
        </div>
      </div>
      <div className={`text-[8.5px] font-mono flex items-center justify-between ${isDark ? "text-gray-900/50" : "text-stone-500"}`}>
        <span>{back?.signoff || config.publisher || "MarginLab Fine Art Printing • 2026"}</span>
        <span>共 {ctx.totalPages} 页</span>
      </div>
    </div>
  );

  // 悬停编辑封底按键
  const renderEditBtn = () => (
    ctx.interactive && ctx.onEditPage && (
      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity z-30">
        <button
          onClick={(e) => {
            e.stopPropagation();
            ctx.onEditPage?.("backCover");
          }}
          data-no-turn="true"
          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[10px] font-medium flex items-center gap-1 shadow-lg border border-white/20 transition-transform hover:scale-105 cursor-pointer"
          title="独立编辑封底寄语"
        >
          <Edit2 className="w-3 h-3 text-amber-400" />
          <span>编辑封底</span>
        </button>
      </div>
    )
  );

  /* ─────────────────────────────────────────────────────────────
   * 封底风格 1：文艺书影 (与特种纸白底封面统一)
   * ───────────────────────────────────────────────────────────── */
  if (style === "literary") {
    return (
      <div
        className="absolute inset-0 overflow-hidden group select-none bg-[#FAF7F2] text-white"
        style={{
          borderRadius: "14px 3px 3px 14px",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
        }}
      >
        {renderSpineAccents()}
        {renderEditBtn()}

        <div className="absolute inset-0 flex flex-col justify-between p-7 pr-10 pl-8">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="inline-block text-[9.5px] font-mono px-2 py-0.5 rounded-full font-bold bg-stone-200/90 text-stone-700 border border-stone-300">
                画册封底 · 终篇
              </span>
              <span className="text-[9px] font-serif text-stone-400">EPILOGUE</span>
            </div>

            <h3 className="text-xl font-serif font-bold tracking-wider text-zinc-900 mt-2">
              {back?.title || ctx.album.title || "艺术画册"}
            </h3>

            {back?.subtitle && (
              <p className="text-[11px] text-zinc-600 font-sans">{back.subtitle}</p>
            )}

            <div className="mt-4 p-3.5 rounded-lg bg-white/70 border border-stone-200/80 shadow-2xs">
              <p className="text-[11.5px] text-zinc-700 font-serif leading-relaxed italic border-l-2 border-stone-400 pl-3">
                "{back?.bodyText || "散落于岁月长河中的微光片段，在此拼贴为一本流动的艺术画册。愿每一次翻阅，都能重拾初见时的感动。"}"
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {/* 百花洲文艺出版社圆形钢印署名 (与封面 1:1 呼应) */}
            <div className="flex items-center gap-1.5 text-[9px] font-serif text-zinc-500">
              <div className="w-3.5 h-3.5 rounded-full border border-zinc-400 flex items-center justify-center text-[7px] font-bold">
                印
              </div>
              <span className="tracking-widest uppercase text-[8.5px]">
                {config.publisher || "百花洲文艺出版社"}
              </span>
            </div>

            {renderBarcode(false)}
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
   * 封底风格 2：现代书腰 (与艺术底图+实体书腰封统一)
   * ───────────────────────────────────────────────────────────── */
  if (style === "obi") {
    return (
      <div
        className="absolute inset-0 overflow-hidden group select-none bg-stone-900 text-white"
        style={{
          borderRadius: "14px 3px 3px 14px",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.15)",
        }}
      >
        {renderSpineAccents()}
        {renderEditBtn()}

        {/* 底层全幅艺术底图 */}
        <div className="absolute inset-0">
          <img
            src={ctx.album.coverImage}
            alt=""
            draggable={false}
            className="w-full h-full object-cover opacity-35 filter blur-[1px]"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(10,25,30,0.85) 0%, rgba(10,25,30,0.70) 50%, rgba(10,25,30,0.95) 100%)",
            }}
          />
        </div>

        <div className="relative z-10 h-full flex flex-col justify-between p-7 pr-10 pl-8">
          <div className="space-y-2">
            <span className="inline-block text-[9.5px] font-mono px-2 py-0.5 rounded-full font-bold bg-white/10 text-amber-300 border border-white/20">
              画册封底 · 终篇
            </span>
            <h3 className="text-xl font-serif font-light tracking-[0.15em] text-[#F5E2CE] mt-2">
              {back?.title || ctx.album.title || "心流"}
            </h3>
            <p className="text-[11px] text-gray-900/80 font-serif leading-relaxed italic border-l-2 border-amber-400/40 pl-3 mt-3">
              "{back?.bodyText || "全神贯注、投入忘我的体验，是生命赠予我们最丰盛的礼物。"}"
            </p>
          </div>
        </div>

        {/* 底部 142px 实体书腰后侧延续 (与封面书腰前后相接) */}
        <div className="absolute bottom-0 inset-x-0 h-[142px] bg-[#FAF8F5] text-white p-4 pr-9 pl-7 z-20 shadow-[0_-6px_20px_rgba(0,0,0,0.35)] border-t border-black/10 overflow-hidden flex flex-col justify-between">
          <div className="absolute -left-6 -bottom-6 w-36 h-36 rounded-full border border-red-500/10 pointer-events-none" />
          <div className="space-y-1">
            <span className="text-[9.5px] font-serif font-bold text-[#B91C1C] tracking-wide">
              {config.obiHeadline || "心流理論之父 开山之作 · 典藏装帧"}
            </span>
            <p className="text-[8.5px] font-serif text-stone-600 line-clamp-2">
              "{config.obiText || "愿你在光影与文字的世界里，找回属于自己的专注与心流。"}"
            </p>
          </div>
          {renderBarcode(false)}
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
   * 封底风格 3：画廊全幅 (与全黑高定双金框统一)
   * ───────────────────────────────────────────────────────────── */
  if (style === "gallery") {
    return (
      <div
        className="absolute inset-0 overflow-hidden group select-none bg-black text-white"
        style={{
          borderRadius: "14px 3px 3px 14px",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.2)",
        }}
      >
        {renderSpineAccents()}
        {renderEditBtn()}

        {/* 细金双边框画框 */}
        <div className="absolute inset-4 sm:inset-5 border border-amber-300/40 pointer-events-none flex flex-col justify-between p-4 pr-7">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-mono uppercase tracking-[0.25em] text-amber-200/90 bg-black/40 px-2 py-0.5 rounded border border-amber-300/20">
              MARGINLAB ARCHIVE • EPILOGUE
            </span>
            <span className="text-[8px] font-mono text-gray-900/60">2026 EDITION</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-serif font-bold text-gray-900 tracking-wider">
              {back?.title || ctx.album.title}
            </h3>
            <p className="text-[11px] font-serif text-gray-900/75 leading-relaxed italic border-l-2 border-amber-300/60 pl-3">
              "{back?.bodyText || "山川从不语，却道尽万千深情。至此圆满收官。"}"
            </p>
          </div>

          {renderBarcode(true)}
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
   * 封底风格 4：东方留白 (与宋体宣纸朱砂印统一)
   * ───────────────────────────────────────────────────────────── */
  if (style === "minimal") {
    return (
      <div
        className="absolute inset-0 overflow-hidden group select-none bg-[#F7F4EB] text-white"
        style={{
          borderRadius: "14px 3px 3px 14px",
          boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
        }}
      >
        {renderSpineAccents()}
        {renderEditBtn()}

        <div className="absolute inset-0 flex flex-col justify-between p-7 pr-10 pl-8">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <span className="inline-block text-[9.5px] font-mono px-2 py-0.5 rounded font-bold bg-[#991B1B]/10 text-[#991B1B] border border-[#991B1B]/20">
                终篇 · 跋
              </span>
              <h3 className="text-xl font-serif font-bold text-zinc-900 tracking-widest mt-2">
                {back?.title || ctx.album.title}
              </h3>
              <p className="text-[11.5px] font-serif text-zinc-700 leading-relaxed italic border-l-2 border-[#991B1B]/40 pl-3 mt-3">
                "{back?.bodyText || "万物静观皆自得，四时佳兴与人同。光影留驻于纸，心念安于当下。"}"
              </p>
            </div>
            <div className="w-5 h-5 rounded-xs border-2 border-[#991B1B] text-[#991B1B] flex items-center justify-center text-[9px] font-serif font-black shrink-0 mt-1 shadow-2xs">
              印
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-[9px] font-serif text-zinc-400 tracking-widest">
              {ctx.album.author || "MarginLab"} · 岁在丙午
            </div>
            {renderBarcode(false)}
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
   * 封底风格 5：经典精装 (深色布面烫金统一)
   * ───────────────────────────────────────────────────────────── */
  return (
    <div
      className="absolute inset-0 overflow-hidden group select-none"
      style={{
        background: skin.bg,
        borderRadius: "14px 3px 3px 14px",
        boxShadow: "inset 0 0 0 1px " + skin.border,
      }}
    >
      {renderSpineAccents()}
      {renderEditBtn()}

      <div className="absolute inset-0 flex flex-col justify-between p-7 pr-10 pl-8 text-gray-900">
        <div className="space-y-2">
          <span
            className="inline-block text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border"
            style={{
              backgroundColor: "rgba(245,158,11,0.15)",
              color: skin.foil,
              borderColor: skin.border,
            }}
          >
            画册封底 · 终篇
          </span>
          <h3 className="text-lg font-serif font-bold tracking-wider mt-3" style={{ color: skin.foil }}>
            {back?.title || ctx.album.title || "艺术画册"}
          </h3>
          {back?.subtitle && (
            <p className="text-[10px] text-gray-900/60 font-sans">{back.subtitle}</p>
          )}
          <p className="text-[11px] text-gray-900/75 font-serif mt-3 leading-relaxed italic border-l-2 border-amber-500/40 pl-3">
            "{back?.bodyText || "散落于岁月长河中的微光片段，在此拼贴为一本流动的艺术画册。愿每一次翻阅，都能重拾初见时的感动。"}"
          </p>
        </div>

        {renderBarcode(true)}
      </div>
    </div>
  );
};

/* ── 统一面内容渲染 ─────────────────────────────────────────────
 * 容器尺寸 = faceBox(spec)。硬壳面铺满整块硬壳板；内页面按
 * PAGE_W × PAGE_H 贴在订口一侧，其余部分由硬壳托底（backed）。
 * ────────────────────────────────────────────────────────────── */

export const FaceContent: React.FC<{
  spec: FaceSpec;
  side: Side;
  ctx: FaceContext;
  box: FaceBox;
  backed?: boolean;
}> = ({ spec, side, ctx, box, backed }) => {
  if (spec.kind === "cover") return <CoverFace album={ctx.album} ctx={ctx} />;
  if (spec.kind === "backCover") return <BackCoverFace ctx={ctx} />;

  const spread = ctx.album.spreads[spec.spread];
  const pageNumber = spec.side === "left" ? spec.spread * 2 + 1 : spec.spread * 2 + 2;

  return (
    <>
      {backed && (
        <div
          className="absolute inset-0"
          style={{
            background: getEndpaperBg(ctx.album.coverConfig?.style),
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.06)",
          }}
        />
      )}
      <div
        className="absolute"
        style={{
          width: PAGE_W,
          height: PAGE_H,
          top: -box.y,
          [side === "right" ? "left" : "right"]: 0,
        }}
      >
        <PaperFace
          spread={spread}
          side={spec.side}
          spreadIndex={spec.spread}
          pageNumber={pageNumber}
          onPlaceholderClick={ctx.onPlaceholderClick}
          onEditPage={ctx.onEditPage}
          interactive={ctx.interactive}
        />
      </div>
    </>
  );
};
