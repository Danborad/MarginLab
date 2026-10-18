import React, { useState, useRef, useEffect, useMemo } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import {
  Upload,
  Sparkles,
  Trash2,
  Search,
  X,
  Check,
  Download,
  Wand2,
  LayoutTemplate,
  Images,
  FolderOpen,
} from "lucide-react";
import { fileToBase64, getImageDimensions, imageExtFromUrl } from "../../lib/utils";
import { UserMediaAsset } from "../../types/document";
import { thumbOf } from "../../lib/thumbs";

type GalleryTab = "all" | "upload" | "generated";

export const MediaPanel: React.FC = () => {
  const addElement = useEditorStore((s) => s.addElement);
  const canvas = useEditorStore((s) => s.document.canvas);
  const mediaAssets = useEditorStore((s) => s.mediaAssets);
  const addMediaAssets = useEditorStore((s) => s.addMediaAssets);
  const deleteMediaAsset = useEditorStore((s) => s.deleteMediaAsset);
  const clearAllMediaAssets = useEditorStore((s) => s.clearAllMediaAssets);
  const fetchUserMedia = useEditorStore((s) => s.fetchUserMedia);
  const aiHistory = useEditorStore((s) => s.aiHistory);
  const fetchAiHistory = useEditorStore((s) => s.fetchAiHistory);
  const deleteAiHistoryItem = useEditorStore((s) => s.deleteAiHistoryItem);
  const setAiSourceImage = useEditorStore((s) => s.setAiSourceImage);
  const setLatestAiGeneratedImage = useEditorStore((s) => s.setLatestAiGeneratedImage);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);

  useEffect(() => {
    fetchUserMedia().catch(() => {});
    fetchAiHistory().catch(() => {});
  }, [fetchUserMedia, fetchAiHistory]);

  const [activeTab, setActiveTab] = useState<GalleryTab>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [justUploadedCount, setJustUploadedCount] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 合并用户的 mediaAssets 与 aiHistory，确保所有上传的图片与生成的图片都在图库中完整呈现
  const unifiedFiles = useMemo(() => {
    const list: (UserMediaAsset & { isFromHistory?: boolean })[] = [];
    const seenSrc = new Set<string>();

    for (const asset of mediaAssets) {
      if (!asset.src) continue;
      seenSrc.add(asset.src);
      const isGen =
        asset.category === "generated" ||
        asset.name.startsWith("AI") ||
        asset.name.includes("成片") ||
        asset.name.includes("风格");
      list.push({
        ...asset,
        category: isGen ? "generated" : "upload",
      });
    }

    for (const hist of aiHistory) {
      const img = hist.resultUrl || hist.resultBase64;
      if (!img || seenSrc.has(img)) continue;
      seenSrc.add(img);
      list.push({
        id: hist.id,
        userId: hist.userId || "default",
        name: `AI成片 · ${hist.styleName || "修图"}`,
        src: img,
        thumb: img,
        width: 1024,
        height: 1024,
        aspectRatio: 1,
        category: "generated",
        createdAt: hist.createdAt,
        isFromHistory: true,
      });
    }

    return list;
  }, [mediaAssets, aiHistory]);

  const uploadCount = useMemo(
    () => unifiedFiles.filter((f) => f.category === "upload").length,
    [unifiedFiles]
  );
  const generatedCount = useMemo(
    () => unifiedFiles.filter((f) => f.category === "generated").length,
    [unifiedFiles]
  );

  const filteredFiles = useMemo(() => {
    return unifiedFiles.filter((item) => {
      if (activeTab === "upload" && item.category !== "upload") return false;
      if (activeTab === "generated" && item.category !== "generated") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return item.name.toLowerCase().includes(q);
      }
      return true;
    });
  }, [unifiedFiles, activeTab, searchQuery]);

  // 上传本地图片到图库
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      category: "upload" | "generated";
    }[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await fileToBase64(file);
        const dims = await getImageDimensions(base64).catch(() => ({ width: 1200, height: 1200 }));
        const aspect = dims.width / (dims.height || 1);

        itemsToSave.push({
          name: file.name.replace(/\.[^/.]+$/, "") || "上传图片",
          src: base64,
          width: dims.width,
          height: dims.height,
          aspectRatio: aspect,
          sizeBytes: file.size,
          category: "upload",
        });
      }

      const created = await addMediaAssets(itemsToSave);
      setJustUploadedCount(created.length);
      setTimeout(() => setJustUploadedCount(0), 2500);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUseInAiRetouch = (asset: UserMediaAsset) => {
    setAiSourceImage(asset.src);
    setLatestAiGeneratedImage(null);
    setActivePanel("ai-retouch");
  };

  const handleAddToCollage = (asset: UserMediaAsset) => {
    const w = Math.round(canvas.width * 0.45);
    const h = Math.round(w / (asset.aspectRatio || 1));

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
      originalHeight: asset.height || 1200,
      fit: "cover",
      borderRadius: 2,
      shadowBlur: 20,
      shadowOpacity: 0.15,
    });
    setActivePanel("templates");
  };

  const handleDownload = (asset: UserMediaAsset) => {
    const a = document.createElement("a");
    a.href = asset.src;
    a.download = `${asset.name || "atelier-file"}-${Date.now()}.${imageExtFromUrl(asset.src)}`;
    a.click();
  };

  const handleDelete = (asset: UserMediaAsset & { isFromHistory?: boolean }) => {
    if (asset.isFromHistory) {
      deleteAiHistoryItem(asset.id);
    } else {
      deleteMediaAsset(asset.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white select-none">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 顶部标题与上传区 */}
      <div className="p-4 border-b border-gray-200 space-y-3 shrink-0 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-gray-950 tracking-tight">
                我的图库
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-800 text-[11px] font-bold">
                {unifiedFiles.length} 个文件
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              集中管理所有上传的原图与 AI 生成图片
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-3.5 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{isUploading ? "上传中..." : "上传图片"}</span>
          </button>
        </div>

        {justUploadedCount > 0 && (
          <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>已成功上传 {justUploadedCount} 张图片至图库</span>
          </div>
        )}

        {/* 搜索框 */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索上传的图片或 AI 生成作品..."
            className="w-full bg-gray-100/90 border border-transparent focus:border-gray-300 focus:bg-white rounded-xl pl-8 pr-7 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all"
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

        {/* 三大分类切换：全部文件 / 上传的图片 / 生成的图片 */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "all"
                ? "bg-gray-950 text-white shadow-2xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            全部文件 {unifiedFiles.length}
          </button>
          <button
            onClick={() => setActiveTab("upload")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "upload"
                ? "bg-gray-950 text-white shadow-2xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            上传的图片 {uploadCount}
          </button>
          <button
            onClick={() => setActiveTab("generated")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "generated"
                ? "bg-gray-950 text-white shadow-2xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
            }`}
          >
            生成的图片 {generatedCount}
          </button>
        </div>
      </div>

      {/* 文件网格列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {mediaAssets.length > 0 && (
          <div className="flex items-center justify-between text-[11px] text-gray-500">
            <span>点击图片可快速送入 AI 修图或下载</span>
            {!confirmClear ? (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-gray-400 hover:text-red-600 font-semibold cursor-pointer"
              >
                清空图库
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-bold">确定清空？</span>
                <button
                  onClick={() => {
                    clearAllMediaAssets();
                    setConfirmClear(false);
                  }}
                  className="text-red-600 underline font-bold cursor-pointer"
                >
                  确认
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        )}

        {filteredFiles.length === 0 ? (
          <div className="py-16 px-4 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto text-gray-400 shadow-2xs">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-gray-800">
                {activeTab === "upload"
                  ? "暂无上传的图片"
                  : activeTab === "generated"
                  ? "暂无 AI 生成的图片"
                  : "图库中还没有任何文件"}
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed max-w-[220px] mx-auto">
                您上传的原图或通过 AI 修图生成的图片都会自动保存在这里
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>上传第一张图片</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredFiles.map((asset) => {
              const isGen = asset.category === "generated";
              return (
                <div
                  key={asset.id}
                  className="group relative rounded-2xl border border-gray-200 overflow-hidden bg-gray-50 hover:border-gray-900 transition-all flex flex-col shadow-2xs"
                >
                  <div
                    onClick={() => handleUseInAiRetouch(asset)}
                    className="aspect-3/4 w-full overflow-hidden bg-gray-100 relative cursor-pointer"
                  >
                    <img
                      src={thumbOf(asset.thumb || asset.src, 480)}
                      alt={asset.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* 左上角类型角标 */}
                    <div className="absolute top-2 left-2 z-10">
                      {isGen ? (
                        <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          AI生成
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-black/65 backdrop-blur-xs text-white text-[10px] font-bold">
                          上传原图
                        </span>
                      )}
                    </div>

                    {/* 右上角删除按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(asset);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
                      title="删除文件"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    {/* 悬浮快捷操作遮罩 */}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/45 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseInAiRetouch(asset);
                        }}
                        className="w-full py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-950 text-[11px] font-extrabold flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Wand2 className="w-3 h-3 text-emerald-600" />
                        <span>去 AI 修图</span>
                      </button>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCollage(asset);
                          }}
                          className="py-1 rounded-md bg-black/60 hover:bg-black text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <LayoutTemplate className="w-2.5 h-2.5" />
                          <span>去拼图</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(asset);
                          }}
                          className="py-1 rounded-md bg-black/60 hover:bg-black text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Download className="w-2.5 h-2.5" />
                          <span>下载</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-white flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold text-gray-800 truncate">
                      {asset.name}
                    </span>
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
