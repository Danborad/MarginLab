import React, { useState, useRef, useEffect } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { STOCK_PHOTOS, StockPhoto } from "../../lib/stock-photos";
import {
  X,
  Upload,
  Sparkles,
  FolderOpen,
  Search,
  Check,
  Image as ImageIcon,
} from "lucide-react";
import { fileToBase64, getImageDimensions } from "../../lib/utils";
import { UserMediaAsset } from "../../types/document";

export const ReplacePhotoModal: React.FC = () => {
  const replacePhotoModalOpen = useEditorStore((s) => s.replacePhotoModalOpen);
  const replaceTargetElementId = useEditorStore((s) => s.replaceTargetElementId);
  const closeReplacePhotoModal = useEditorStore((s) => s.closeReplacePhotoModal);
  const replaceElementImage = useEditorStore((s) => s.replaceElementImage);
  const addMediaAssets = useEditorStore((s) => s.addMediaAssets);
  const fetchUserMedia = useEditorStore((s) => s.fetchUserMedia);
  const mediaAssets = useEditorStore((s) => s.mediaAssets);
  const currentUser = useEditorStore((s) => s.currentUser);
  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
  const openAiStylizeModal = useEditorStore((s) => s.openAiStylizeModal);

  const [activeTab, setActiveTab] = useState<"uploads" | "curated">("uploads");
  const [stockCategory, setStockCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (replacePhotoModalOpen) {
      fetchUserMedia().catch(() => {});
    }
  }, [replacePhotoModalOpen, fetchUserMedia]);

  if (!replacePhotoModalOpen || !replaceTargetElementId) return null;

  const stockCategories = [
    { id: "all", label: "全部" },
    { id: "architecture", label: "建筑光影" },
    { id: "fashion", label: "时尚人像" },
    { id: "still-life", label: "极简静物" },
    { id: "botanical", label: "自然植觉" },
    { id: "monochrome", label: "黑白胶片" },
  ];

  // Handle direct file upload & replace
  const handleUploadAndReplace = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const dims = await getImageDimensions(base64);
      const name = file.name.replace(/\.[^/.]+$/, "");

      // Also save to user media library
      await addMediaAssets([
        {
          name,
          src: base64,
          width: dims.width,
          height: dims.height,
          aspectRatio: dims.width / dims.height,
          sizeBytes: file.size,
        },
      ]);

      // Replace target element photo
      replaceElementImage(replaceTargetElementId, base64, name, dims.width, dims.height);
    } catch (err) {
      console.error("Replace photo upload failed:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Filter user media assets
  let filteredUserAssets = mediaAssets;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredUserAssets = filteredUserAssets.filter((a) => (a.name || "").toLowerCase().includes(q));
  }

  // Filter stock photos
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
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn"
      onClick={closeReplacePhotoModal}
    >
      <div
        className="bg-studio-panel border border-studio-border rounded-2xl w-[95vw] max-w-3xl overflow-hidden shadow-soft-float flex flex-col max-h-[88vh] ring-1 ring-black/5 dark:ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-4.5 border-b border-studio-border flex items-center justify-between bg-studio-sidebar/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-studio-card border border-studio-accent/30 flex items-center justify-center text-studio-accent shadow-xs">
              <ImageIcon className="w-5 h-5 text-studio-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-wider text-studio-text">
                  替换照片素材
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-studio-accent/15 text-white border border-studio-accent/30 font-medium">
                  保留原有排版与尺寸
                </span>
              </div>
              <p className="text-[11px] text-studio-muted mt-0.5">
                从「我的专属素材库」点选、从「精选美学」挑选，或直接从本地上传新照片替换
              </p>
            </div>
          </div>

          <button
            onClick={closeReplacePhotoModal}
            className="p-1.5 rounded-lg text-studio-muted hover:text-studio-text hover:bg-studio-card transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher & Upload Quick Trigger */}
        <div className="p-3.5 border-b border-studio-border bg-studio-card/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="grid grid-cols-2 gap-1 bg-studio-panel p-1 rounded-xl border border-studio-border w-full sm:w-auto">
            <button
              onClick={() => setActiveTab("uploads")}
              className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "uploads"
                  ? "bg-studio-accent text-white font-semibold shadow-xs"
                  : "text-studio-muted hover:text-gray-950 hover:bg-studio-hover"
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>我的素材库 ({mediaAssets.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("curated")}
              className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "curated"
                  ? "bg-studio-accent text-white font-semibold shadow-xs"
                  : "text-studio-muted hover:text-gray-950 hover:bg-studio-hover"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>精选美学图库 ({STOCK_PHOTOS.length})</span>
            </button>
          </div>

          {/* Quick Upload and Replace Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUploadAndReplace}
            className="hidden"
          />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                const el = useEditorStore.getState().document.elements.find((e) => e.id === replaceTargetElementId);
                openAiStylizeModal((el as any)?.src, replaceTargetElementId);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-studio-accent/15 hover:bg-studio-accent/25 border border-studio-accent/40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="使用 AI 风格化重构当前相片"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 风格化重构</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-studio-card hover:bg-studio-hover border border-studio-border hover:border-studio-accent text-studio-text hover:text-studio-accent text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-studio-accent" />
              <span>{isUploading ? "上传中..." : "本地照片替换"}</span>
            </button>
          </div>
        </div>

        {/* Search & Stock Categories Bar */}
        <div className="px-4 py-2.5 border-b border-studio-border/60 bg-studio-sidebar/40 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-studio-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === "uploads" ? "搜索已上传素材..." : "搜索美学图库..."}
              className="w-full bg-studio-card border border-studio-border focus:border-studio-accent rounded-lg pl-8 pr-7 py-1.5 text-xs text-studio-text placeholder:text-studio-muted focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-studio-muted hover:text-studio-text p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {activeTab === "curated" && (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {stockCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setStockCategory(cat.id)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer border ${
                    stockCategory === cat.id
                      ? "bg-studio-accent text-white font-medium border-studio-accent"
                      : "bg-studio-card text-studio-muted hover:text-gray-950 hover:bg-studio-hover border-studio-border"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Body: Image Grid */}
        <div className="p-4 flex-1 overflow-y-auto max-h-[56vh]">
          {/* TAB 1: User Private Media Library */}
          {activeTab === "uploads" && (
            <div>
              {filteredUserAssets.length === 0 ? (
                <div className="p-10 text-center text-studio-muted text-xs space-y-3 border border-dashed border-studio-border rounded-2xl bg-studio-card/40">
                  <FolderOpen className="w-8 h-8 mx-auto text-studio-border" />
                  <div>
                    <p className="text-studio-text font-medium">我的素材库中暂无图片</p>
                    <p className="text-[11px] text-studio-muted mt-1">
                      您可以点击下方「从本地选择新照片替换」，或在左侧素材库中批量上传图片。
                    </p>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-1.5 rounded-xl bg-studio-accent text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>立即上传本地照片替换</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredUserAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() =>
                        replaceElementImage(
                          replaceTargetElementId,
                          asset.src,
                          asset.name,
                          asset.width,
                          asset.height
                        )
                      }
                      className="group relative rounded-xl border border-studio-border overflow-hidden bg-studio-card hover:border-studio-accent transition-all duration-200 cursor-pointer flex flex-col shadow-xs"
                    >
                      <div className="aspect-[3/4] w-full overflow-hidden bg-studio-panel relative">
                        <img
                          src={asset.src}
                          alt={asset.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="px-2.5 py-1 rounded-lg bg-studio-accent text-white text-[11px] font-semibold flex items-center gap-1 shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>点击替换</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 bg-studio-card border-t border-studio-border/60">
                        <div className="text-[11px] font-medium text-studio-text truncate group-hover:text-studio-accent">
                          {asset.name}
                        </div>
                        <div className="text-[9px] font-mono text-studio-muted">
                          {asset.width}×{asset.height} px
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Curated Stock Library */}
          {activeTab === "curated" && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredStockPhotos.map((photo) => (
                <div
                  key={photo.id}
                  onClick={() =>
                    replaceElementImage(
                      replaceTargetElementId,
                      photo.full,
                      photo.title,
                      1800,
                      Math.round(1800 / photo.aspectRatio)
                    )
                  }
                  className="group relative rounded-xl border border-studio-border overflow-hidden bg-studio-card hover:border-studio-accent transition-all duration-200 cursor-pointer flex flex-col shadow-xs"
                >
                  <div className="aspect-[3/4] w-full overflow-hidden bg-studio-panel relative">
                    <img
                      src={photo.thumb}
                      alt={photo.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="px-2.5 py-1 rounded-lg bg-studio-accent text-white text-[11px] font-semibold flex items-center gap-1 shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>点击替换</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 bg-studio-card border-t border-studio-border/60">
                    <div className="text-[11px] font-medium text-studio-text truncate group-hover:text-studio-accent">
                      {photo.title}
                    </div>
                    <div className="text-[9px] font-mono text-studio-muted">
                      {photo.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 border-t border-studio-border bg-studio-sidebar/90 flex items-center justify-between text-xs text-studio-muted">
          <span className="text-[11px] font-mono">
            💡 提示：替换后会自动保留照片在排版中的原始位置、图层与滤镜设置
          </span>
          <button
            onClick={closeReplacePhotoModal}
            className="px-3.5 py-1 rounded-lg border border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-card transition-colors cursor-pointer"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};
