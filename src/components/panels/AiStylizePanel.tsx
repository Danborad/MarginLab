import React, { useState, useMemo } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { AI_STYLES, StylePreset, StyleCategory } from "../../lib/ai-styles";
import { Sliders, Search, X, Check } from "lucide-react";

const STYLIZE_CATEGORY_TABS: { id: StyleCategory; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "editorial", label: "高定双联" },
  { id: "illustration", label: "艺术插画" },
  { id: "vintage", label: "东方美学" },
  { id: "modern", label: "现代几何" },
  { id: "photography", label: "电影摄影" },
];

const STYLIZE_GROUP_ORDER: { id: Exclude<StyleCategory, "all" | "custom">; label: string }[] = [
  { id: "editorial", label: "高定画册与双联设计" },
  { id: "illustration", label: "艺术插画与手绘速写" },
  { id: "vintage", label: "复古拓印与东方美学" },
  { id: "modern", label: "现代几何与实验场域" },
  { id: "photography", label: "电影定格与纪实重构" },
];

export const AiStylizePanel: React.FC = () => {
  const selectedStyleId = useEditorStore((s) => s.selectedAiStyleId);
  const setSelectedStyleId = useEditorStore((s) => s.setSelectedAiStyleId);
  const storeAiStyles = useEditorStore((s) => s.aiStyles);

  const [activeCategory, setActiveCategory] = useState<StyleCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mood, setMood] = useState("");
  const [hoveredStyle, setHoveredStyle] = useState<StylePreset | null>(null);

  const activeStylizeList = useMemo(() => {
    const source = storeAiStyles && storeAiStyles.length >= AI_STYLES.length ? storeAiStyles : AI_STYLES;
    return source
      .filter((s) => s.enabled !== false)
      .sort((a, b) => (a.order || 999) - (b.order || 999));
  }, [storeAiStyles]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: activeStylizeList.length };
    activeStylizeList.forEach((st) => {
      counts[st.category] = (counts[st.category] || 0) + 1;
    });
    return counts;
  }, [activeStylizeList]);

  const normalizedSelectedId =
    selectedStyleId === "eastern_ink_diptych_scenery" ||
    selectedStyleId === "eastern_ink_diptych_arch"
      ? "eastern_ink_diptych"
      : selectedStyleId;

  const currentStyle = useMemo(
    () =>
      activeStylizeList.find((s) => s.id === normalizedSelectedId) ||
      activeStylizeList[0],
    [activeStylizeList, normalizedSelectedId]
  );

  const handleSelectStyle = (styleId: string) => {
    setSelectedStyleId(styleId);
  };

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const targetGroups =
      activeCategory === "all"
        ? STYLIZE_GROUP_ORDER
        : STYLIZE_GROUP_ORDER.filter((g) => g.id === activeCategory);

    return targetGroups
      .map((group) => {
        const items = activeStylizeList.filter((item) => {
          if (item.category !== group.id) return false;
          if (!q) return true;
          return (
            item.name.toLowerCase().includes(q) ||
            (item.enName || "").toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            (item.badge || "").toLowerCase().includes(q) ||
            (item.tags || []).some((t) => t.toLowerCase().includes(q)) ||
            item.promptTemplate.toLowerCase().includes(q)
          );
        });
        return { ...group, items };
      })
      .filter((g) => g.items.length > 0);
  }, [activeStylizeList, activeCategory, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-studio-sidebar text-studio-text select-none overflow-hidden border-r border-studio-border">
      {/* 1. Header Bar */}
      <div className="px-4 pt-4 pb-3 border-b border-studio-border flex items-center justify-between bg-studio-sidebar shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-studio-text tracking-tight">
              AI 先锋风格化
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-studio-panel text-emerald-600 dark:text-emerald-300 border border-studio-border font-bold font-mono">
              {activeStylizeList.length}款
            </span>
          </div>
          <p className="text-[11px] text-studio-muted font-medium mt-0.5">
            高定双联 · 线稿续行 · 纸浆浮雕 · 光栅场域
          </p>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
            showAdvanced ? "bg-gray-100 border-gray-300 text-black" : "border-gray-200 text-gray-600 hover:text-black hover:bg-gray-50"
          }`}
          title="高级提示词与参数"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Search & Category Filter Pills */}
      <div className="px-4 py-2.5 border-b border-studio-border bg-studio-sidebar space-y-2.5 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索先锋风格（如：手撕、浮雕、等高线、水墨、手账）..."
            className="w-full pl-8 pr-7 py-2 rounded-xl bg-studio-input border border-studio-border text-xs text-studio-text placeholder:text-studio-dim focus:outline-none focus:border-emerald-500 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {STYLIZE_CATEGORY_TABS.map((cat) => {
            const isActive = activeCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                  isActive
                    ? "bg-emerald-500/18 text-emerald-300 border-emerald-500/50 shadow-aurora"
                    : "bg-studio-panel text-studio-muted hover:text-studio-text hover:bg-studio-hover border-studio-border"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`ml-1 text-[10px] ${
                    isActive ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Prompt Drawer (Optional) */}
      {showAdvanced && (
        <div className="p-3.5 border-b border-studio-border bg-studio-card space-y-2 shrink-0">
          {currentStyle && (
            <div className="space-y-1.5 mb-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-800">
                  当前风格：{currentStyle.name}
                </span>
                <span className="text-[10px] text-gray-500 font-medium">
                  {currentStyle.badge || currentStyle.tags?.[0] || "先锋风格"}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed bg-white p-2 rounded-lg border border-gray-200 max-h-24 overflow-y-auto">
                <strong className="text-gray-800">AI 提示词：</strong>
                {currentStyle.promptTemplate}
              </p>
            </div>
          )}
          <label className="text-xs font-bold text-gray-700 block">意境与氛围调控 (可选)</label>
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="如：暖阳透过车窗、细雨后的松弛感..."
            className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white focus:outline-none focus:border-black"
          />
        </div>
      )}

      {/* 3. Scrollable Style & Tools Grid (380px 3-Column Fotor Layout) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 no-scrollbar">
        {filteredGroups.map((group) => (
          <div key={group.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white tracking-wider uppercase font-mono">
                {group.label}
              </h4>
              <span className="text-[10px] text-white/40 font-mono font-semibold">
                {group.items.length} 款
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {group.items.map((st, idx) => {
                const isSelected = normalizedSelectedId === st.id;
                const badgeText = st.badge || st.tags?.[0];
                return (
                  <button
                    key={st.id}
                    onClick={() => handleSelectStyle(st.id)}
                    onMouseEnter={() => setHoveredStyle(st)}
                    onMouseLeave={() =>
                      setHoveredStyle((prev) => (prev?.id === st.id ? null : prev))
                    }
                    title={`${st.name}：${st.description}`}
                    className={`group relative aspect-3/4 rounded-xl overflow-hidden bg-studio-card cursor-pointer transition-all duration-300 hover:scale-[1.04] active:scale-[0.98] text-left border ${
                      isSelected
                        ? "border-emerald-400 ring-2 ring-emerald-400/40 shadow-aurora"
                        : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <img
                      src={st.coverImage || st.previewUrl}
                      alt={st.name}
                      loading={idx < 9 ? "eager" : "lazy"}
                      decoding="async"
                      className="w-full h-full object-cover scale-[1.05] group-hover:scale-[1.10] transition-transform duration-300"
                    />
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full btn-aurora text-black flex items-center justify-center shadow-md z-10">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                    {!isSelected && badgeText && (
                      <span className="absolute top-1.5 right-1.5 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded font-bold shadow-xs">
                        {badgeText}
                      </span>
                    )}
                    <div
                      className="absolute inset-x-0 bottom-0 pt-7 pb-2 px-1.5 flex items-end justify-center text-center"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.38) 55%, rgba(0,0,0,0) 100%)",
                      }}
                    >
                      <span className="text-[11px] font-bold text-white tracking-tight truncate w-full drop-shadow-xs">
                        {st.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-xs space-y-1">
            <p className="font-bold text-gray-600">未找到匹配的风格化模板</p>
            <p>试试搜索“手撕”、“浮雕”、“水墨”、“等高线”或切换全部分类</p>
          </div>
        )}
      </div>

      {/* 悬浮大图与详情介绍浮窗（桌面端） */}
      {hoveredStyle && (
        <div className="hidden md:flex fixed left-[476px] top-[76px] z-50 w-[320px] glass-float rounded-2xl p-4 flex-col gap-3 pointer-events-none animate-fadeIn">
          <div className="w-full aspect-3/4 rounded-xl overflow-hidden bg-studio-card border border-studio-border relative">
            <img
              src={hoveredStyle.coverImage || hoveredStyle.previewUrl}
              alt={hoveredStyle.name}
              decoding="async"
              className="w-full h-full object-cover scale-[1.05]"
            />
            {(hoveredStyle.badge || hoveredStyle.tags?.[0]) && (
              <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/70 text-white text-[11px] font-bold">
                {hoveredStyle.badge || hoveredStyle.tags?.[0]}
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white tracking-tight">
                {hoveredStyle.name}
              </h4>
              {hoveredStyle.order && (
                <span className="text-[11px] font-mono text-gray-400">
                  #{String(hoveredStyle.order).padStart(2, "0")}
                </span>
              )}
            </div>
            <p className="text-xs text-studio-muted leading-relaxed font-medium">
              {hoveredStyle.description}
            </p>
            {hoveredStyle.tags && hoveredStyle.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {hoveredStyle.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] border border-white/10 text-white/70 font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
