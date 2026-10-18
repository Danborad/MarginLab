import React from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { AI_STYLES } from "../../lib/ai-styles";
import { StylePreset } from "../../types/ai";
import { Sparkles, ArrowRight, Check } from "lucide-react";

export const ZineGallery: React.FC = () => {
  const selectedStyleId = useEditorStore((s) => s.selectedAiStyleId);
  const setSelectedStyleId = useEditorStore((s) => s.setSelectedAiStyleId);
  const isDrawerOpen = useEditorStore((s) => s.isZineDrawerOpen);
  const setIsDrawerOpen = useEditorStore((s) => s.setIsZineDrawerOpen);

  const handleSelectStyle = (style: StylePreset) => {
    setSelectedStyleId(style.id);
    setIsDrawerOpen(true);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#F6F4EF] text-[#222] select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Top Feature Announcement Banner */}
        <div className="flex items-center justify-between p-3 px-4 rounded-2xl bg-[#EBE7DF]/80 border border-[#DDD7CC] text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2563EB]/10 text-[#2563EB] font-bold border border-[#2563EB]/20">
              功能更新
            </span>
            <span className="text-[#4A463F]">
              新功能上线 | <strong className="font-semibold text-[#18181B]">边缘留影 • s21 梦幻动态电影海报</strong>
            </span>
          </div>
          <span className="text-[11px] text-[#7A756D] font-mono hidden sm:inline-block">
            自动留白与排版引擎已就绪
          </span>
        </div>

        {/* Big Editorial Heading */}
        <div className="space-y-1.5 pt-1">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-[42px] font-bold tracking-tight text-[#18181B] leading-tight">
            选择一种创作方式
          </h1>
          <p className="text-xs sm:text-sm text-[#736E65] font-sans">
            从同一张普通照片出发，进入七种不同的视觉表达。
          </p>
        </div>

        {/* 7/8 Artistic Style Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6 pt-2 pb-12">
          {AI_STYLES.map((style, idx) => {
            const isSelected = selectedStyleId === style.id && isDrawerOpen;
            const indexStr = String(idx + 1).padStart(2, "0");

            return (
              <div
                key={style.id}
                onClick={() => handleSelectStyle(style)}
                className={`group relative rounded-2xl overflow-hidden bg-white border transition-all duration-200 cursor-pointer flex flex-col shadow-xs ${
                  isSelected
                    ? "ring-2 ring-[#2563EB] border-[#2563EB] shadow-md"
                    : "border-[#E5E0D6] hover:border-[#2563EB]/50 hover:shadow-sm"
                }`}
              >
                {/* Visual Preview Container */}
                <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#F1EFEA]">
                  {/* Top-left Number Badge */}
                  <div
                    className={`absolute top-3 left-3 z-10 px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider transition-colors ${
                      isSelected
                        ? "bg-[#2563EB] text-white"
                        : "bg-[#1E293B]/80 text-white group-hover:bg-[#2563EB]"
                    }`}
                  >
                    {indexStr}
                  </div>

                  {/* SVG Illustration Artwork */}
                  <div
                    dangerouslySetInnerHTML={{ __html: style.previewSvg || "" }}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />

                  {/* Floating Action Badge on Hover / Active */}
                  <div className="absolute bottom-3 right-3 z-10">
                    {isSelected ? (
                      <span className="px-3 py-1 rounded-full bg-[#2563EB] text-white text-xs font-semibold shadow-sm flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>正在创作</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-[#18181B]/85 group-hover:bg-[#2563EB] text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-all shadow-sm flex items-center gap-1">
                        <span>开始创作</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Metadata Info */}
                <div className="p-3.5 flex items-center justify-between border-t border-[#EAE6DD] bg-white">
                  <div>
                    <h3 className="text-sm font-semibold text-[#18181B] font-sans">
                      {style.name}
                    </h3>
                    <p className="text-[10px] text-[#7A756D] font-mono truncate max-w-[140px]">
                      {style.enName}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono text-[#8C877E] shrink-0">
                    {style.badge || "当前开放"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
