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
    <div className="flex flex-col h-full bg-white select-none overflow-hidden">
      {/* 1. Header Bar */}
      <div className="px-4 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-extrabold text-gray-950">AI 修同款</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-bold">
              36款
            </span>
          </div>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
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
      <div className="px-4 py-2.5 border-b border-gray-100 bg-white space-y-2.5 shrink-0">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索修图风格（如：发丝光、水光肌、胶片、去灰）..."
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900 focus:bg-white transition-colors"
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
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-gray-900 text-white shadow-2xs"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-950"
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
        <div className="p-3.5 border-b border-gray-100 bg-gray-50 space-y-2 shrink-0">
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
              <h4 className="text-[14px] font-extrabold text-gray-900 tracking-tight">
                {group.label}
              </h4>
              <span className="text-[11px] text-gray-400 font-semibold">
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
                    className={`group relative aspect-3/4 rounded-2xl overflow-hidden bg-gray-100 cursor-pointer transition-all duration-200 hover:scale-[1.04] hover:z-10 active:scale-95 text-left ${
                      isSelected
                        ? "ring-2.5 ring-gray-950 shadow-md"
                        : "border border-gray-200 hover:border-gray-900 hover:shadow-lg shadow-2xs"
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
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-gray-950 text-white flex items-center justify-center shadow-sm z-10">
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
          <div className="py-12 text-center text-gray-400 text-xs space-y-1">
            <p className="font-bold text-gray-600">未找到匹配的修图风格</p>
            <p>试试搜索“胶片”、“发丝光”、“去灰”或切换全部分类</p>
          </div>
        )}
      </div>

      {/* 悬浮大图与详情介绍浮窗（桌面端） */}
      {hoveredStyle && (
        <div className="hidden md:flex fixed left-[476px] top-[76px] z-50 w-[320px] bg-white rounded-2xl border border-gray-200 shadow-2xl p-4 flex-col gap-3 pointer-events-none animate-fadeIn">
          <div className="w-full aspect-3/4 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 relative">
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
              <h4 className="text-base font-extrabold text-gray-950">
                {hoveredStyle.name}
              </h4>
              <span className="text-[11px] font-mono text-gray-400">
                #{String(hoveredStyle.order).padStart(2, "0")}
              </span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              {hoveredStyle.description}
            </p>
            <div className="pt-2 border-t border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                AI 核心提示词
              </span>
              <p className="text-[11px] text-gray-600 bg-gray-50 rounded-lg p-2 border border-gray-100 leading-relaxed">
                {hoveredStyle.rawPrompt}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
