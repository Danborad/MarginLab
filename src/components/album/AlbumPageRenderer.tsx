import React from "react";
import { AlbumPageSide } from "../../types/album";
import { TEMPLATES } from "../../lib/templates";
import { TemplateLayoutRenderer } from "./TemplateLayoutRenderer";
import { Image as ImageIcon, Plus } from "lucide-react";

interface AlbumPageRendererProps {
  page: AlbumPageSide;
  side: "left" | "right";
  pageNumber?: number;
  onPlaceholderClick?: () => void;
}

export const AlbumPageRenderer: React.FC<AlbumPageRendererProps> = ({
  page,
  side,
  pageNumber,
  onPlaceholderClick,
}) => {
  const isLeft = side === "left";
  const hasImage = Boolean(page.image && page.image.trim());
  const isTemplate = page.layoutType === "template" || Boolean(page.templateId);

  // 1. 拼图海报模板高保真渲染 (Template Layout)
  // 全面调取系统 47 款拼图海报的真实网格、多图、艺术字号与胶片构件
  if (isTemplate) {
    return (
      <TemplateLayoutRenderer
        page={page}
        isLeft={isLeft}
        pageNumber={pageNumber}
      />
    );
  }

  // 2. 空白艺术相纸模式 (Blank Paper Card)
  if (!hasImage) {
    return (
      <div className="relative w-full h-full bg-[#FAF9F5] p-6 sm:p-8 flex flex-col justify-between select-none">
        {/* 空白相纸画框 */}
        <div
          onClick={onPlaceholderClick}
          data-no-turn="true"
          className="flex-1 w-full rounded-xl border-2 border-dashed border-stone-300 dark:border-stone-600 bg-white/70 hover:bg-white hover:border-amber-500/60 transition-all flex flex-col items-center justify-center p-4 text-center cursor-pointer group shadow-xs"
          title="点击添加照片或套用拼图模板"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 group-hover:scale-110 transition-transform flex items-center justify-center mb-2 border border-amber-500/20">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h5 className="text-xs sm:text-sm font-serif font-bold text-stone-700">
            {page.title || "空白艺术相纸"}
          </h5>
          <p className="text-[10px] text-stone-500 mt-1 max-w-[200px] leading-relaxed">
            {page.caption || "留白相纸 · 可选用拼图模板或加入素材库照片"}
          </p>
          <div className="mt-3 px-3 py-1 rounded-full bg-amber-500/15 text-amber-700 text-[10px] font-mono font-semibold flex items-center gap-1">
            <Plus className="w-3 h-3" />
            <span>点选放入内容</span>
          </div>
        </div>

        {/* 底部随笔 */}
        {page.bodyText && (
          <p className="text-[10px] text-stone-500 font-serif mt-3 line-clamp-2 italic text-center">
            "{page.bodyText}"
          </p>
        )}

        {/* 页码 */}
        {pageNumber !== undefined && (
          <span
            className={`absolute bottom-3 ${
              isLeft ? "left-4" : "right-4"
            } text-[10px] font-mono text-stone-400 font-semibold`}
          >
            {pageNumber}
          </span>
        )}
      </div>
    );
  }

  // 3. 拍立得手记模式 (Polaroid Layout)
  if (page.layoutType === "polaroid") {
    return (
      <div className="relative w-full h-full bg-[#FAF8F5] p-5 sm:p-6 flex flex-col items-center justify-center select-none">
        <div className="w-full max-w-[88%] bg-white p-3.5 sm:p-4 rounded-xs shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-stone-200/80 transform -rotate-1 transition-transform hover:rotate-0">
          <div className="aspect-[4/5] overflow-hidden bg-stone-100 rounded-2xs mb-3 border border-black/5">
            <img src={page.image} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="text-center py-1">
            <h5 className="text-xs sm:text-sm font-serif font-bold text-stone-800 tracking-wide">
              {page.title || "时光拍立得"}
            </h5>
            {page.caption && (
              <p className="text-[9px] text-stone-400 font-sans mt-0.5">{page.caption}</p>
            )}
            {page.bodyText && (
              <p className="text-[10px] text-stone-600 font-serif mt-1.5 line-clamp-3 leading-relaxed italic">
                "{page.bodyText}"
              </p>
            )}
          </div>
        </div>

        {/* 页码 */}
        {pageNumber !== undefined && (
          <span
            className={`absolute bottom-3 ${
              isLeft ? "left-4" : "right-4"
            } text-[10px] font-mono text-stone-400 font-semibold`}
          >
            {pageNumber}
          </span>
        )}
      </div>
    );
  }

  // 4. 杂志图文手札模式 (Journal Layout)
  if (page.layoutType === "journal") {
    return (
      <div className="relative w-full h-full bg-[#FAF9F5] p-5 sm:p-6 flex flex-col justify-between select-none overflow-hidden">
        {/* 上方图片区域 */}
        <div className="flex-1 w-full rounded-sm overflow-hidden bg-stone-100 border border-stone-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.05)] relative mb-3">
          <img
            src={page.image}
            alt={page.title || ""}
            className="w-full h-full object-cover"
          />
        </div>

        {/* 下方杂志排版手札 */}
        <div className="shrink-0 space-y-1.5 pt-1 border-t border-stone-300/60">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-xs sm:text-sm font-serif font-bold text-stone-900 tracking-wider truncate">
              {page.title || "旅途手札"}
            </h4>
            {page.subtitle && (
              <span className="text-[9px] font-mono text-stone-400 uppercase shrink-0">
                {page.subtitle}
              </span>
            )}
          </div>

          {page.caption && (
            <p className="text-[10px] font-sans text-amber-800/80 font-medium line-clamp-1">
              {page.caption}
            </p>
          )}

          {page.bodyText && (
            <p className="text-[10px] font-serif text-stone-600 line-clamp-3 leading-relaxed tracking-wide italic">
              {page.bodyText}
            </p>
          )}
        </div>

        {/* 页码 */}
        {pageNumber !== undefined && (
          <span
            className={`absolute bottom-2.5 ${
              isLeft ? "left-3" : "right-3"
            } text-[10px] font-mono text-stone-400 font-semibold`}
          >
            {pageNumber}
          </span>
        )}
      </div>
    );
  }

  // 5. 多图画廊模式 (Grid-2 / Grid-4)
  if (page.layoutType === "grid-2" || page.layoutType === "grid-4") {
    const photos = page.photos && page.photos.length > 0 ? page.photos : [page.image!];
    const isGrid4 = page.layoutType === "grid-4" || photos.length > 2;

    return (
      <div className="relative w-full h-full bg-[#FAF8F5] p-4 sm:p-5 flex flex-col justify-between select-none">
        {page.title && (
          <h4 className="text-xs sm:text-sm font-serif font-bold text-stone-800 tracking-wide mb-2">
            {page.title}
          </h4>
        )}
        <div
          className={`grid gap-2 flex-1 items-center ${
            isGrid4 ? "grid-cols-2 grid-rows-2" : "grid-cols-1 grid-rows-2"
          }`}
        >
          {photos.slice(0, isGrid4 ? 4 : 2).map((img, i) => (
            <div
              key={i}
              className="w-full h-full overflow-hidden rounded-xs bg-stone-200 border border-stone-200 shadow-2xs"
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {page.caption && (
          <p className="text-[9px] text-stone-500 font-sans mt-2 truncate">{page.caption}</p>
        )}

        {pageNumber !== undefined && (
          <span
            className={`absolute bottom-2.5 ${
              isLeft ? "left-3" : "right-3"
            } text-[10px] font-mono text-stone-400 font-semibold`}
          >
            {pageNumber}
          </span>
        )}
      </div>
    );
  }

  // 6. 单图全幅模式 (Full Bleed)
  return (
    <div className="relative w-full h-full bg-[#FAF9F5] overflow-hidden flex flex-col justify-between select-none">
      <img
        src={page.image}
        alt={page.title || ""}
        className="w-full h-full object-cover object-center"
        loading="eager"
      />
      {(page.title || page.caption) && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-4 text-gray-900">
          {page.title && (
            <h4 className="text-xs sm:text-sm font-bold tracking-wide font-serif drop-shadow-sm">
              {page.title}
            </h4>
          )}
          {page.caption && (
            <p className="text-[10px] text-gray-900/85 mt-0.5 font-light line-clamp-2 drop-shadow-sm">
              {page.caption}
            </p>
          )}
        </div>
      )}
      {pageNumber !== undefined && (
        <span
          className={`absolute bottom-3 ${
            isLeft ? "left-4" : "right-4"
          } text-[10px] font-mono text-gray-900/80 font-semibold drop-shadow-md`}
        >
          {pageNumber}
        </span>
      )}
    </div>
  );
};
