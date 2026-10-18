code = """import React, { useState, useRef, useEffect } from "react";
import { STOCK_PHOTOS, StockPhoto } from "../../lib/stock-photos";
import { useEditorStore } from "../../store/useEditorStore";
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  Plus,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Trash2,
  Search,
  X,
  Check,
  ShieldCheck,
  HardDrive,
  Users,
  LogIn,
  UserCheck,
  Lock,
} from "lucide-react";
import { fileToBase64, getImageDimensions } from "../../lib/utils";
import { UserMediaAsset } from "../../types/document";

export const MediaPanel: React.FC = () => {
  const addElement = useEditorStore((s) => s.addElement);
  const canvas = useEditorStore((s) => s.document.canvas);
  const currentUser = useEditorStore((s) => s.currentUser);
  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
  const mediaAssets = useEditorStore((s) => s.mediaAssets);
  const addMediaAssets = useEditorStore((s) => s.addMediaAssets);
  const deleteMediaAsset = useEditorStore((s) => s.deleteMediaAsset);
  const clearAllMediaAssets = useEditorStore((s) => s.clearAllMediaAssets);
  const setAuthModalOpen = useEditorStore((s) => s.setAuthModalOpen);

  // Tab: "uploads" (My Uploaded Assets) vs "curated" (Stock Library)
  const [activeTab, setActiveTab] = useState<"uploads" | "curated">("uploads");
  const [stockCategory, setStockCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [justUploadedCount, setJustUploadedCount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const stockCategories = [
    { id: "all", label: "全部" },
    { id: "architecture", label: "建筑光影" },
    { id: "fashion", label: "时尚人像" },
    { id: "still-life", label: "极简静物" },
    { id: "botanical", label: "自然植觉" },
    { id: "monochrome", label: "黑白胶片" },
  ];

  const updateScrollButtons = () => {
    const el = categoryScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    updateScrollButtons();
  }, [stockCategory, activeTab]);

  const handleScrollCategories = (direction: "left" | "right") => {
    const el = categoryScrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -120 : 120,
      behavior: "smooth",
    });
    setTimeout(updateScrollButtons, 250);
  };

  const handleCategoryWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      e.preventDefault();
      if (categoryScrollRef.current) {
        categoryScrollRef.current.scrollLeft += e.deltaY;
        updateScrollButtons();
      }
    }
  };

  // Add stock photo to canvas
  const handleAddStockPhoto = (photo: StockPhoto) => {
    const w = Math.round(canvas.width * 0.45);
    const h = Math.round(w / photo.aspectRatio);

    addElement({
      type: "image",
      name: photo.title,
      x: Math.round((canvas.width - w) / 2),
      y: Math.round((canvas.height - h) / 2),
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      src: photo.full,
      originalWidth: 1800,
      originalHeight: Math.round(1800 / photo.aspectRatio),
      fit: "cover",
      borderRadius: 2,
      shadowBlur: 20,
      shadowOpacity: 0.15,
    });
  };

  // Add user media asset to canvas
  const handleAddUserAsset = (asset: UserMediaAsset) => {
    const w = Math.round(canvas.width * 0.45);
    const h = Math.round(w / (asset.aspectRatio || 1.5));

    addElement({
      type: "image",
      name: asset.name,
      x: Math.round((canvas.width - w) / 2),
      y: Math.round((canvas.height - h) / 2),
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      src: asset.src,
      originalWidth: asset.width || 1200,
      originalHeight: asset.height || 800,
      fit: "cover",
      borderRadius: 2,
      shadowBlur: 20,
      shadowOpacity: 0.15,
    });
  };

  // Handle local file uploads: Saves to current user's media library + inserts first onto canvas
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !isAuthenticated) {
      setAuthModalOpen(true, "login");
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const itemsToSave: {
      name: string;
      src: string;
      width: number;
      height: number;
      aspectRatio: number;
      sizeBytes: number;
    }[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await fileToBase64(file);
        const dims = await getImageDimensions(base64);
        const aspect = dims.width / dims.height;

        itemsToSave.push({
          name: file.name.replace(/\\.[^/.]+$/, ""),
          src: base64,
          width: dims.width,
          height: dims.height,
          aspectRatio: aspect,
          sizeBytes: file.size,
        });
      }

      const created = await addMediaAssets(itemsToSave);

      // Auto-insert first uploaded image onto canvas
      if (created.length > 0) {
        const first = created[0];
        const w = Math.round(canvas.width * 0.45);
        const h = Math.round(w / first.aspectRatio);

        addElement({
          type: "image",
          name: first.name,
          x: Math.round((canvas.width - w) / 2),
          y: Math.round((canvas.height - h) / 2),
          width: w,
          height: h,
          rotation: 0,
          opacity: 1,
          src: first.src,
          originalWidth: first.width,
          originalHeight: first.height,
          fit: "cover",
          borderRadius: 2,
          shadowBlur: 20,
          shadowOpacity: 0.15,
        });
      }

      setJustUploadedCount(created.length);
      setTimeout(() => setJustUploadedCount(0), 3000);
      setActiveTab("uploads");
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Filter user uploaded assets
  let filteredUserAssets = mediaAssets;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredUserAssets = filteredUserAssets.filter((a) => a.name.toLowerCase().includes(q));
  }

  // Filter curated stock photos
  let filteredStockPhotos =
    stockCategory === "all"
      ? STOCK_PHOTOS
      : STOCK_PHOTOS.filter((p) => p.category === stockCategory);

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredStockPhotos = filteredStockPhotos.filter(
      (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }

  return (
    <div className="p-3.5 space-y-3 select-none">
      {/* Header Bar with Current User Avatar & Switcher */}
      <div className="pb-2 border-b border-studio-border/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-studio-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-studio-text">
            图片素材库
          </h2>
        </div>
        {currentUser && isAuthenticated ? (
          <button
            onClick={() => setAuthModalOpen(true, "profile")}
            className="flex items-center gap-1 text-[11px] font-mono text-studio-accent hover:underline px-2 py-0.5 rounded bg-studio-card/80 border border-studio-border/60 transition-colors cursor-pointer"
            title="查看专属素材库归属账号与个人中心"
          >
            <span>{currentUser.avatar}</span>
            <span className="max-w-[90px] truncate">{currentUser.name.split(" ")[0]}</span>
          </button>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true, "login")}
            className="flex items-center gap-1 text-[11px] font-mono text-studio-accent hover:underline px-2 py-0.5 rounded bg-studio-accent/15 border border-studio-accent/30 transition-colors cursor-pointer"
          >
            <LogIn className="w-3 h-3" />
            <span>登录</span>
          </button>
        )}
      </div>

      {/* Primary Tab Switcher: "My Uploads" vs "Curated Stock" */}
      <div className="grid grid-cols-2 gap-1 bg-studio-card/80 p-1 rounded-xl border border-studio-border">
        <button
          onClick={() => setActiveTab("uploads")}
          className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "uploads"
              ? "bg-studio-accent text-zinc-950 font-semibold shadow-sm"
              : "text-studio-muted hover:text-studio-text"
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>我的上传 ({isAuthenticated && currentUser ? mediaAssets.length : 0})</span>
        </button>
        <button
          onClick={() => setActiveTab("curated")}
          className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "curated"
              ? "bg-studio-accent text-zinc-950 font-semibold shadow-sm"
              : "text-studio-muted hover:text-studio-text"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>精选美学 ({STOCK_PHOTOS.length})</span>
        </button>
      </div>

      {/* Upload Zone (Always accessible) */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <button
        onClick={() => {
          if (!currentUser || !isAuthenticated) {
            setAuthModalOpen(true, "login");
          } else {
            fileInputRef.current?.click();
          }
        }}
        disabled={isUploading}
        className="w-full border-2 border-dashed border-studio-border hover:border-studio-accent rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 bg-studio-card/40 hover:bg-studio-card transition-all group cursor-pointer"
      >
        <div className="w-8 h-8 rounded-full bg-studio-panel flex items-center justify-center text-studio-muted group-hover:text-studio-accent border border-studio-border transition-colors">
          <Upload className="w-4 h-4" />
        </div>
        <div className="text-center">
          <span className="text-xs font-medium text-studio-text group-hover:text-studio-accent transition-colors block">
            {isUploading
              ? "正在上传保存素材..."
              : currentUser && isAuthenticated
              ? `上传本地图片到「${currentUser.name.split(" ")[0]}」专属素材库`
              : "登录后上传本地图片到专属素材库"}
          </span>
          <span className="text-[10px] text-studio-muted block mt-0.5">
            支持 JPG, PNG, WebP 高清大图 • 账号密码私有隔离
          </span>
        </div>
      </button>

      {/* Upload Toast Notice */}
      {justUploadedCount > 0 && currentUser && (
        <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>已保存 {justUploadedCount} 张图片至「{currentUser.name}」专属素材库！</span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-studio-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={activeTab === "uploads" ? "搜索已上传素材..." : "搜索美学图库..."}
          className="w-full bg-studio-card/80 border border-studio-border focus:border-studio-accent rounded-lg pl-8 pr-7 py-1 text-xs text-studio-text placeholder:text-studio-muted/70 focus:outline-none transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-studio-muted hover:text-white p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Tab 1: My Uploads (User Isolated Library) */}
      {activeTab === "uploads" && (
        <div className="space-y-2">
          {!currentUser || !isAuthenticated ? (
            <div className="p-6 text-center text-studio-muted text-xs space-y-3 border border-dashed border-studio-border rounded-xl bg-studio-card/30">
              <Lock className="w-6 h-6 mx-auto text-studio-accent/70" />
              <div>
                <p className="text-studio-text font-semibold">独立个人账号私有空间</p>
                <p className="text-[11px] leading-relaxed mt-1 text-studio-muted">
                  请登录或注册您的独立创作者账号，即可拥有 100% 私有隔离的图片素材库与画作存档。
                </p>
              </div>
              <button
                onClick={() => setAuthModalOpen(true, "login")}
                className="px-4 py-1.5 rounded-xl bg-studio-accent text-zinc-950 font-semibold text-xs hover:bg-studio-accentHover transition-colors shadow-subtle-glow cursor-pointer"
              >
                立即登录 / 注册
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[10px] font-mono text-studio-muted">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-studio-accent" />
                  <span>@{currentUser.username} 专属素材：{filteredUserAssets.length} 张</span>
                </span>
                {mediaAssets.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("确定要清空当前账号上传的所有素材图片吗？")) {
                        clearAllMediaAssets();
                      }
                    }}
                    className="text-studio-muted hover:text-red-400 transition-colors cursor-pointer"
                  >
                    清空素材
                  </button>
                )}
              </div>

              {filteredUserAssets.length === 0 ? (
                <div className="p-6 text-center text-studio-muted text-xs space-y-2 border border-dashed border-studio-border rounded-xl">
                  <FolderOpen className="w-6 h-6 mx-auto text-studio-border" />
                  <p className="text-studio-text font-medium">当前账号暂无上传素材</p>
                  <p className="text-[11px] leading-relaxed">
                    点击上方「上传本地图片」或拖入文件，即可永久保存在当前「{currentUser.name}」专属素材库中。
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-[calc(100vh-390px)] overflow-y-auto pr-0.5">
                  {filteredUserAssets.map((asset) => (
                    <div
                      key={asset.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          "application/json",
                          JSON.stringify({
                            type: "image",
                            name: asset.name,
                            full: asset.src,
                            aspectRatio: asset.aspectRatio,
                          })
                        );
                      }}
                      onClick={() => handleAddUserAsset(asset)}
                      className="group relative rounded-xl border border-studio-border overflow-hidden bg-studio-card/70 hover:bg-studio-card hover:border-studio-accent transition-all duration-200 cursor-pointer flex flex-col"
                    >
                      <div className="aspect-[3/4] w-full overflow-hidden bg-zinc-900 relative">
                        <img
                          src={asset.src}
                          alt={asset.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 pointer-events-none">
                          <div className="w-7 h-7 rounded-full bg-studio-accent text-zinc-950 flex items-center justify-center shadow-lg">
                            <Plus className="w-4 h-4 stroke-[3]" />
                          </div>
                        </div>

                        {/* Delete button top right */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMediaAsset(asset.id);
                          }}
                          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                          title="从我的素材库删除"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="p-1.5 bg-studio-card/90">
                        <div className="text-[10px] font-medium text-studio-text truncate group-hover:text-studio-accent transition-colors">
                          {asset.name}
                        </div>
                        <div className="text-[9px] font-mono text-studio-muted truncate">
                          {asset.width}×{asset.height} px
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 2: Curated Aesthetic Stock Library */}
      {activeTab === "curated" && (
        <div className="space-y-2">
          {/* Categories Horizontal Carousel */}
          <div className="relative flex items-center">
            {canScrollLeft && (
              <button
                onClick={() => handleScrollCategories("left")}
                className="absolute left-0 z-10 w-5 h-6 bg-zinc-900/90 border border-studio-border text-studio-text hover:text-studio-accent rounded-l flex items-center justify-center backdrop-blur-sm shadow-md"
              >
                <ChevronLeft className="w-3 h-3" />
              </button>
            )}

            <div
              ref={categoryScrollRef}
              onScroll={updateScrollButtons}
              onWheel={handleCategoryWheel}
              className="w-full flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
            >
              {stockCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setStockCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    stockCategory === cat.id
                      ? "bg-studio-accent text-zinc-950 font-medium shadow-sm"
                      : "bg-studio-card text-studio-muted hover:text-studio-text border border-studio-border/60"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {canScrollRight && (
              <button
                onClick={() => handleScrollCategories("right")}
                className="absolute right-0 z-10 w-5 h-6 bg-zinc-900/90 border border-studio-border text-studio-text hover:text-studio-accent rounded-r flex items-center justify-center backdrop-blur-sm shadow-md"
              >
                <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Stock Photos Grid */}
          <div className="grid grid-cols-2 gap-2 max-h-[calc(100vh-390px)] overflow-y-auto pr-0.5">
            {filteredStockPhotos.map((photo) => (
              <div
                key={photo.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/json", JSON.stringify(photo));
                }}
                onClick={() => handleAddStockPhoto(photo)}
                className="group relative rounded-xl border border-studio-border overflow-hidden bg-studio-card cursor-pointer hover:border-studio-accent transition-all duration-200"
              >
                <div className="aspect-[3/4] w-full overflow-hidden bg-zinc-900">
                  <img
                    src={photo.thumb}
                    alt={photo.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-7 h-7 rounded-full bg-studio-accent text-zinc-950 flex items-center justify-center shadow-lg">
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </div>
                </div>
                <div className="p-1.5 text-[10px] font-mono text-studio-muted truncate bg-studio-panel/80">
                  {photo.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
"""

with open("src/components/panels/MediaPanel.tsx", "w") as f:
    f.write(code)

print("Updated MediaPanel.tsx successfully!")
