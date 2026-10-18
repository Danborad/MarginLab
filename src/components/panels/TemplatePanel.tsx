import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { TemplateThumbnail } from "./TemplateThumbnail";
import { TEMPLATES } from "../../lib/templates";
import { useEditorStore } from "../../store/useEditorStore";
import {
  Sparkles,
  SlidersHorizontal,
  LayoutTemplate,
  PlusCircle,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  List,
  Search,
  X,
  Check,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../ui/Button";

type ViewMode = "grid2" | "list";

export const TemplatePanel: React.FC = () => {
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const currentDocName = useEditorStore((s) => s.document.name);
  const canvas = useEditorStore((s) => s.document.canvas);
  const customTemplates = useEditorStore((s) => s.customTemplates);
  const deleteCustomTemplate = useEditorStore((s) => s.deleteCustomTemplate);
  const setProjectModalOpen = useEditorStore((s) => s.setProjectModalOpen);

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [adaptToCurrentCanvas, setAdaptToCurrentCanvas] = useState<boolean>(true);

  // Search & sub-filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [photoCountFilter, setPhotoCountFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid2"); // Default: compact 2-column poster grid
  const [isCategoryExpanded, setIsCategoryExpanded] = useState<boolean>(false);

  // Scroll references for category bar
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const activeBtnRef = useRef<HTMLButtonElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Drag-to-scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);

  const categories = [
    { id: "All", label: "全部", count: TEMPLATES.length },
    { id: "Full Bleed", label: "🔥 全屏大字", count: TEMPLATES.filter((t) => t.category === "Full Bleed").length },
    { id: "Editorial", label: "📖 杂志画报", count: TEMPLATES.filter((t) => t.category === "Editorial").length },
    { id: "Lookbook", label: "✨ 高定画册", count: TEMPLATES.filter((t) => t.category === "Lookbook").length },
    { id: "Gallery", label: "🎞️ 多图画廊", count: TEMPLATES.filter((t) => t.category === "Gallery").length },
    { id: "Polaroid", label: "📷 拍立得卡片", count: TEMPLATES.filter((t) => t.category === "Polaroid").length },
    { id: "Minimalist", label: "🏛️ 东方留白", count: TEMPLATES.filter((t) => t.category === "Minimalist").length },
    { id: "Brutalist", label: "▦ 粗野实验", count: TEMPLATES.filter((t) => t.category === "Brutalist").length },
    { id: "Custom", label: "⭐ 我的自制", count: customTemplates.length },
  ];

  const photoFilters = [
    { id: "all", label: "全部张数" },
    { id: "1", label: "1 图" },
    { id: "2", label: "2 图" },
    { id: "3", label: "3 图" },
    { id: "4", label: "4 图" },
    { id: "multi", label: "6-9 图" },
  ];

  // Update scroll indicators
  const updateScrollButtons = () => {
    const el = categoryScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useLayoutEffect(() => {
    updateScrollButtons();
    if (!isCategoryExpanded && activeBtnRef.current) {
      activeBtnRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
    const t = setTimeout(updateScrollButtons, 150);
    return () => clearTimeout(t);
  }, [selectedCategory, isCategoryExpanded]);

  useEffect(() => {
    const handleResize = () => updateScrollButtons();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleScrollCategories = (direction: "left" | "right") => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const delta = direction === "left" ? -160 : 160;
    el.scrollBy({ left: delta, behavior: "smooth" });
    setTimeout(updateScrollButtons, 250);
  };

  // Mouse wheel horizontal scroll
  const handleCategoryWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isCategoryExpanded) return;
    if (e.deltaY !== 0) {
      e.preventDefault();
      if (categoryScrollRef.current) {
        categoryScrollRef.current.scrollLeft += e.deltaY;
        updateScrollButtons();
      }
    }
  };

  // Mouse drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCategoryExpanded || !categoryScrollRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - categoryScrollRef.current.offsetLeft;
    startScrollLeftRef.current = categoryScrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !categoryScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - categoryScrollRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    categoryScrollRef.current.scrollLeft = startScrollLeftRef.current - walk;
    updateScrollButtons();
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Filter templates logic
  let filteredTemplates =
    selectedCategory === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === selectedCategory);

  if (photoCountFilter !== "all") {
    if (photoCountFilter === "1") filteredTemplates = filteredTemplates.filter((t) => t.photoCount === 1);
    else if (photoCountFilter === "2") filteredTemplates = filteredTemplates.filter((t) => t.photoCount === 2);
    else if (photoCountFilter === "3") filteredTemplates = filteredTemplates.filter((t) => t.photoCount === 3);
    else if (photoCountFilter === "4") filteredTemplates = filteredTemplates.filter((t) => t.photoCount === 4);
    else if (photoCountFilter === "multi") filteredTemplates = filteredTemplates.filter((t) => t.photoCount >= 6);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredTemplates = filteredTemplates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.badge?.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }

  return (
    <div className="p-3.5 space-y-3 select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-studio-border/80">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-studio-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-studio-text">
            艺术排版模板库
          </h2>
        </div>
        <button
          onClick={() => setProjectModalOpen(true)}
          className="text-[11px] font-mono text-studio-accent hover:underline flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-studio-card transition-colors cursor-pointer"
          title="将当前画作存为自制模板"
        >
          <PlusCircle className="w-3 h-3" />
          <span>存为模板</span>
        </button>
      </div>

      {/* Search & Layout Density Bar */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-studio-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索模板、风格、九宫格..."
            className="w-full bg-studio-card/80 border border-studio-border focus:border-studio-accent rounded-lg pl-8 pr-7 py-1.5 text-xs text-studio-text placeholder:text-studio-muted/70 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-studio-muted hover:text-studio-text p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Layout Density Controls */}
        <div className="flex items-center bg-studio-card border border-studio-border rounded-lg p-0.5 shrink-0">
          <button
            onClick={() => setViewMode("grid2")}
            className={`p-1 rounded transition-colors cursor-pointer ${
              viewMode === "grid2"
                ? "bg-studio-accent text-white shadow-sm"
                : "text-studio-muted hover:text-gray-950"
            }`}
            title="双列海报紧凑缩略图 (推荐)"
          >
            <Grid2X2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-1 rounded transition-colors cursor-pointer ${
              viewMode === "list"
                ? "bg-studio-accent text-white shadow-sm"
                : "text-studio-muted hover:text-gray-950"
            }`}
            title="单列图文详情"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Auto-adaptation Canvas Reflow Box */}
      <div className="p-2.5 rounded-xl border border-studio-border bg-studio-card/60 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-studio-muted font-medium flex items-center gap-1.5">
            <SlidersHorizontal className="w-3 h-3 text-studio-accent" />
            自适应当前画布尺寸
          </span>
          <button
            onClick={() => setAdaptToCurrentCanvas((prev) => !prev)}
            className={
              "w-8 h-4 rounded-full transition-colors relative shrink-0 cursor-pointer " +
              (adaptToCurrentCanvas ? "bg-studio-accent text-white" : "bg-studio-border")
            }
          >
            <div
              className={
                "w-3 h-3 rounded-full bg-studio-bg transition-transform absolute top-0.5 " +
                (adaptToCurrentCanvas ? "left-4.5" : "left-0.5")
              }
            />
          </button>
        </div>
        <p className="text-[10px] text-studio-muted leading-relaxed">
          {adaptToCurrentCanvas ? (
            <span>
              套用模板将<span className="text-studio-accent font-medium">自适应匹配</span>当前画布（
              {canvas.presetName || `${canvas.width}×${canvas.height} px`}）
            </span>
          ) : (
            <span>套用模板将重设为该模板专属原始画幅比例</span>
          )}
        </p>
      </div>

      {/* Category Navigation Bar (Enhanced with Left/Right Arrows + Wheel Scroll + Expand Cloud) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono text-studio-muted">
          <span className="flex items-center gap-1">
            <span>风格分类</span>
            <span className="text-[10px] text-studio-accent font-semibold">({filteredTemplates.length}款)</span>
          </span>
          <button
            onClick={() => setIsCategoryExpanded(!isCategoryExpanded)}
            className="flex items-center gap-1 text-[10px] text-studio-accent hover:underline cursor-pointer"
          >
            <LayoutGrid className="w-3 h-3" />
            <span>{isCategoryExpanded ? "收起滑动" : "展开全部"}</span>
          </button>
        </div>

        {isCategoryExpanded ? (
          /* Multi-row Expanded Tag Cloud */
          <div className="p-2 bg-studio-card/80 rounded-xl border border-studio-border flex flex-wrap gap-1.5 animate-fadeIn">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                  }}
                  className={
                    "px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all flex items-center gap-1 cursor-pointer " +
                    (isSelected
                      ? "bg-studio-accent text-white font-semibold shadow-sm ring-1 ring-studio-accent"
                      : "bg-studio-panel text-studio-muted hover:text-studio-text hover:bg-studio-hover border border-studio-border/60")
                  }
                >
                  <span>{cat.label}</span>
                  <span className="text-[9px] opacity-70 font-sans">({cat.count})</span>
                </button>
              );
            })}
          </div>
        ) : (
          /* Single-row Carousel with Clean Navigation Arrows */
          <div className="flex items-center gap-1 bg-studio-card/40 p-1 rounded-xl border border-studio-border/60">
            <button
              onClick={() => handleScrollCategories("left")}
              disabled={!canScrollLeft}
              className="p-1 rounded text-studio-muted hover:text-studio-text hover:bg-studio-panel disabled:opacity-20 disabled:pointer-events-none transition-colors shrink-0 cursor-pointer"
              title="向左滚动分类"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div
              ref={categoryScrollRef}
              onScroll={updateScrollButtons}
              onWheel={handleCategoryWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5 cursor-grab active:cursor-grabbing"
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    ref={isSelected ? activeBtnRef : undefined}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={
                      "px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all whitespace-nowrap shrink-0 flex items-center gap-1 cursor-pointer " +
                      (isSelected
                        ? "bg-studio-accent text-white font-semibold shadow-sm ring-1 ring-studio-accent"
                        : "bg-studio-panel text-studio-muted hover:text-studio-text hover:bg-studio-hover border border-studio-border/60")
                    }
                  >
                    <span>{cat.label}</span>
                    <span className="text-[9px] opacity-75 font-sans">({cat.count})</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handleScrollCategories("right")}
              disabled={!canScrollRight}
              className="p-1 rounded text-studio-muted hover:text-studio-text hover:bg-studio-panel disabled:opacity-20 disabled:pointer-events-none transition-colors shrink-0 cursor-pointer"
              title="向右滚动查看更多分类"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Photo Count Quick Sub-filter (1图 / 2图 / 3图 / 4图 / 多图) */}
        {selectedCategory !== "Custom" && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5 text-[10px] font-mono">
            <span className="text-studio-muted/70 mr-0.5 shrink-0">张数:</span>
            {photoFilters.map((pf) => (
              <button
                key={pf.id}
                onClick={() => setPhotoCountFilter(pf.id)}
                className={`px-2 py-0.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                  photoCountFilter === pf.id
                    ? "bg-studio-panel text-studio-accent font-semibold shadow-sm"
                    : "text-studio-muted hover:text-studio-text hover:bg-studio-card"
                }`}
              >
                {pf.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Templates Grid */}
      <div className="max-h-[calc(100vh-325px)] overflow-y-auto pr-0.5 space-y-2">
        {selectedCategory === "Custom" ? (
          customTemplates.length === 0 ? (
            <div className="p-6 text-center text-studio-muted text-xs space-y-2 border border-dashed border-studio-border rounded-xl">
              <LayoutTemplate className="w-6 h-6 mx-auto text-studio-border" />
              <p className="text-studio-text font-medium">暂无自制模板</p>
              <p className="text-[11px]">你可以把当前设计的版式保存为专属模板</p>
              <Button
                variant="accent"
                size="sm"
                onClick={() => setProjectModalOpen(true)}
                className="mt-2"
              >
                保存当前为模板
              </Button>
            </div>
          ) : (
            customTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-3.5 rounded-xl border border-studio-border bg-studio-card/60 hover:bg-studio-card hover:border-gray-400 transition-all flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-studio-text">{tpl.name}</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-studio-panel border border-studio-border text-studio-accent">
                      {tpl.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-studio-muted">{tpl.description}</p>
                </div>
                <div className="pt-2.5 mt-2 border-t border-studio-border/60 flex items-center justify-between">
                  <button
                    onClick={() => loadTemplate(tpl.id, adaptToCurrentCanvas)}
                    className="px-3 py-1 rounded-lg bg-studio-accent text-white text-[11px] font-semibold hover:bg-studio-accentHover transition-colors cursor-pointer"
                  >
                    套用此模板
                  </button>
                  <button
                    onClick={() => deleteCustomTemplate(tpl.id)}
                    className="p-1 rounded hover:bg-red-500/10 text-studio-muted hover:text-red-600 transition-colors cursor-pointer"
                    title="删除自制模板"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )
        ) : filteredTemplates.length === 0 ? (
          <div className="p-8 text-center text-studio-muted text-xs border border-dashed border-studio-border rounded-xl space-y-2">
            <p className="text-studio-text font-medium">未找到符合条件的模板</p>
            <p className="text-[11px]">请尝试更换分类或清空搜索关键词</p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setPhotoCountFilter("all");
                setSearchQuery("");
              }}
              className="px-3 py-1 rounded bg-studio-card hover:bg-studio-hover text-studio-accent text-xs font-mono cursor-pointer"
            >
              重置所有筛选
            </button>
          </div>
        ) : viewMode === "grid2" ? (
          /* Default Compact 2-Column Poster Grid */
          <div className="grid grid-cols-2 gap-2">
            {filteredTemplates.map((tpl) => {
              const isActive = currentDocName === tpl.name;
              return (
                <div
                  key={tpl.id}
                  onClick={() => loadTemplate(tpl.id, adaptToCurrentCanvas)}
                  className={
                    "group relative rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 flex flex-col " +
                    (isActive
                      ? "border-studio-accent ring-1 ring-studio-accent shadow-subtle-glow bg-studio-card"
                      : "border-studio-border/70 hover:border-gray-400 bg-studio-card/50 hover:bg-studio-card")
                  }
                >
                  {/* Poster Thumbnail */}
                  <div className="aspect-[3/4] w-full overflow-hidden bg-studio-panel relative">
                    <TemplateThumbnail template={tpl} className="group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

                    {/* Top Floating Badges */}
                    <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/40 backdrop-blur-md text-studio-accent border border-gray-200 font-medium">
                        {tpl.badge || tpl.category}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-white/20 backdrop-blur-md text-gray-900 font-medium">
                        {tpl.photoCount}图
                      </span>
                    </div>

                    {/* Active Checkmark */}
                    {isActive && (
                      <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-studio-accent text-white flex items-center justify-center shadow-lg">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Card Title Footer */}
                  <div className="p-2 bg-studio-card/80">
                    <h3 className="text-[11px] font-medium text-studio-text truncate group-hover:text-studio-accent transition-colors leading-tight">
                      {tpl.name.split("•")[0].trim()}
                    </h3>
                    <p className="text-[9px] font-mono text-studio-muted truncate mt-0.5">
                      {tpl.photoCount}张图片 • {tpl.badge || tpl.category}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Detailed 1-Column List View (Compact horizontal cards) */
          <div className="space-y-2">
            {filteredTemplates.map((tpl) => {
              const isActive = currentDocName === tpl.name;
              return (
                <div
                  key={tpl.id}
                  onClick={() => loadTemplate(tpl.id, adaptToCurrentCanvas)}
                  className={
                    "group p-2 rounded-xl border flex gap-2.5 cursor-pointer transition-all duration-200 " +
                    (isActive
                      ? "border-studio-accent ring-1 ring-studio-accent shadow-subtle-glow bg-studio-card"
                      : "border-studio-border/70 hover:border-gray-400 bg-studio-card/50 hover:bg-studio-card")
                  }
                >
                  <div className="w-16 h-20 rounded-lg overflow-hidden bg-studio-panel shrink-0 relative">
                    <TemplateThumbnail template={tpl} />
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[8px] font-mono bg-black/40 text-studio-accent">
                      {tpl.photoCount}图
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-0.5 overflow-hidden">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-xs font-semibold text-studio-text group-hover:text-studio-accent transition-colors truncate">
                          {tpl.name}
                        </h3>
                      </div>
                      <p className="text-[10px] text-studio-muted line-clamp-2 leading-relaxed mt-0.5">
                        {tpl.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-studio-panel border border-studio-border text-studio-accent">
                        {tpl.badge || tpl.category}
                      </span>
                      {isActive && (
                        <span className="text-[9px] font-mono text-emerald-600 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> 当前画布
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
