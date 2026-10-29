import React, { useState, useMemo } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import {
  RETOUCH_STYLES,
  RETOUCH_CATEGORIES,
  RetouchCategory,
  RetouchStylePreset,
  getRetouchStyleById,
} from "../../lib/retouch-styles";
import { Sliders, Search, X, Check } from "lucide-react";

const GROUP_ORDER: { id: Exclude<RetouchCategory, "all">; label: string }[] = [
  { id: "lighting", label: "光影风格" },
  { id: "beauty", label: "美颜美肤" },
  { id: "rescue", label: "废片拯救" },
  { id: "color", label: "色彩风格" },
];

export const AiRetouchPanel: React.FC = () => {
  const selectedStyleId = useEditorStore((s) => s.selectedAiStyleId);
  const setSelectedStyleId = useEditorStore((s) => s.setSelectedAiStyleId);

  const [activeCategory, setActiveCategory] = useState<RetouchCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [mood, setMood] = useState("");
  const [hoveredStyle, setHoveredStyle] = useState<RetouchStylePreset | null>(null);

  const currentRetouchStyle = useMemo(
    () => getRetouchStyleById(selectedStyleId) || RETOUCH_STYLES[0],
    [selectedStyleId]
  );

  const handleSelectStyle = (style: RetouchStylePreset) => {
    setSelectedStyleId(style.id);
  };

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const targetGroups =
      activeCategory === "all"
        ? GROUP_ORDER
        : GROUP_ORDER.filter((g) => g.id === activeCategory);

    return targetGroups
      .map((group) => {
        const items = RETOUCH_STYLES.filter((item) => {
          if (item.retouchCategory !== group.id) return false;
          if (!q) return true;
          return (
            item.name.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q) ||
            item.rawPrompt.toLowerCase().includes(q) ||
            item.keywords.toLowerCase().includes(q)
          );
        });
        return { ...group, items };
      })
      .filter((g) => g.items.length > 0);
  }, [activeCategory, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-studio-sidebar text-studio-text select-none overflow-hidden border-r border-studio-border">
      {/* 1. Header Bar */}
      <div className="px-4 pt-4 pb-3 border-b border-studio-border flex items-center justify-between bg-studio-sidebar shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-studio-text tracking-tight">AI 修同款</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-studio-panel text-emerald-600 dark:text-emerald-300 border border-studio-border font-bold font-mono">
              {RETOUCH_STYLES.length}款
            </span>
          </div>
          <p className="text-[11px] text-studio-muted font-medium mt-0.5">
            光影风格 · 美颜美肤 · 废片拯救 · 色彩风格
          </p>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`p-2 rounded-lg border transition-colors cursor-pointer ${
            showAdvanced
              ? "bg-gray-100 border-gray-300 text-gray-950"
              : "border-gray-200 text-gray-600 hover:text-gray-950 hover:bg-gray-50"
          }`}
          title="查看/微调修图提示词"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Category Filter Pills & Search */}
      <div className="px-4 py-2.5 border-b border-studio-border bg-studio-sidebar space-y-2.5 shrink-0">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索修图风格（如：发丝光、水光肌、胶片、去灰）..."
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

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {RETOUCH_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
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
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional Prompt Detail / Mood Drawer */}
      {showAdvanced && (
        <div className="p-3.5 border-b border-studio-border bg-studio-card space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-800">
              当前风格：{currentRetouchStyle.name}
            </span>
            <span className="text-[10px] text-gray-500 font-medium">
              {currentRetouchStyle.retouchCategoryLabel}
            </span>
          </div>
          <p className="text-[11px] text-gray-600 leading-relaxed bg-white p-2 rounded-lg border border-gray-200">
            <strong className="text-gray-800">AI 提示词：</strong>
            {currentRetouchStyle.rawPrompt}
          </p>
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              补充修图细节要求 (可选)
            </label>
            <input
              type="text"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              placeholder="如：保留人物微笑、加强暖阳氛围..."
              className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-900 bg-white focus:outline-none focus:border-gray-900"
            />
          </div>
        </div>
      )}

      {/* 3. Categorized 3-Column Card Grid */}
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
                const isSelected = selectedStyleId === st.id;
                return (
                  <button
                    key={st.id}
                    onClick={() => handleSelectStyle(st)}
                    onMouseEnter={() => setHoveredStyle(st)}
                    onMouseLeave={() => setHoveredStyle((prev) => (prev?.id === st.id ? null : prev))}
                    title={`${st.name}：${st.description}`}
                    className={`group cover-card relative aspect-3/4 bg-studio-panel cursor-pointer active:scale-[0.97] text-left ${
                      isSelected
                        ? "ring-2 ring-emerald-500/80 ring-offset-2 ring-offset-studio-sidebar"
                        : ""
                    }`}
                  >
                    <img
                      src={st.coverImage}
                      alt={st.name}
                      loading={idx < 9 ? "eager" : "lazy"}
                      decoding="async"
                      className="w-full h-full object-cover scale-[1.06] group-hover:scale-[1.12] transition-transform duration-300"
                    />

                    {/* Active Checkmark */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-aurora z-10">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}

                    {/* Bottom Gradient Overlay with Style Name */}
                    <div
                      className="absolute inset-x-0 bottom-0 pt-7 pb-2 px-1.5 flex items-end justify-center text-center"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.32) 55%, rgba(0,0,0,0) 100%)",
                      }}
                    >
                      <span className="text-[12px] font-bold text-white tracking-tight truncate w-full drop-shadow-xs">
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
          <div className="py-12 text-center text-studio-dim text-xs space-y-1">
            <p className="font-bold text-studio-muted">未找到匹配的修图风格</p>
            <p>试试搜索“胶片”、“发丝光”、“去灰”或切换全部分类</p>
          </div>
        )}
      </div>

      {/* 悬浮大图与详情介绍浮窗（桌面端） */}
      {hoveredStyle && (
        <div className="hidden md:flex fixed left-[476px] top-[76px] z-50 w-[320px] glass-float rounded-2xl p-4 flex-col gap-3 pointer-events-none animate-fadeIn">
          <div className="w-full aspect-3/4 rounded-xl overflow-hidden bg-studio-card border border-studio-border relative">
            <img
              src={hoveredStyle.coverImage}
              alt={hoveredStyle.name}
              decoding="async"
              className="w-full h-full object-cover scale-[1.06]"
            />
            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/70 text-white text-[11px] font-bold">
              {hoveredStyle.retouchCategoryLabel}
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-extrabold text-studio-text">
                {hoveredStyle.name}
              </h4>
              <span className="text-[11px] font-mono text-studio-dim">
                #{String(hoveredStyle.order).padStart(2, "0")}
              </span>
            </div>
            <p className="text-xs text-studio-muted leading-relaxed font-medium">
              {hoveredStyle.description}
            </p>
            <div className="pt-2 border-t border-studio-border">
              <span className="text-[10px] font-bold text-studio-dim uppercase tracking-wider block mb-1">
                AI 核心提示词
              </span>
              <p className="text-[11px] text-studio-muted bg-white/5 rounded-lg p-2 border border-studio-border leading-relaxed">
                {hoveredStyle.rawPrompt}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
