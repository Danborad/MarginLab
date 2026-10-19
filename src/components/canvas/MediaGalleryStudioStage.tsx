import React, { useState, useRef, useMemo, useEffect } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import {
  Upload,
  Download,
  Wand2,
  LayoutTemplate,
  FolderOpen,
  Images,
  Trash2,
  Search,
  X,
  Sparkles,
  Eye,
  Check,
  ArrowUpDown,
} from "lucide-react";
import { fileToBase64, getImageDimensions, imageExtFromUrl } from "../../lib/utils";
import { UserMediaAsset } from "../../types/document";
import { thumbOf } from "../../lib/thumbs";

type FilterTab = "all" | "upload" | "generated";

export const MediaGalleryStudioStage: React.FC = () => {
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
  const addElement = useEditorStore((s) => s.addElement);
  const canvas = useEditorStore((s) => s.document.canvas);
  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
  const setAuthModalOpen = useEditorStore((s) => s.setAuthModalOpen);

  useEffect(() => {
    fetchUserMedia().catch(() => {});
    fetchAiHistory().catch(() => {});
  }, [fetchUserMedia, fetchAiHistory]);

  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [previewAsset, setPreviewAsset] = useState<(UserMediaAsset & { isFromHistory?: boolean }) | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [justUploadedCount, setJustUploadedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 合并全部文件列表（所有上传原图 + 所有 AI 生成图片）
  const allFiles = useMemo(() => {
    const list: (UserMediaAsset & { isFromHistory?: boolean })[] = [];
    const seen = new Set<string>();

    for (const a of mediaAssets) {
      if (!a.src) continue;
      seen.add(a.src);
      const isGen =
        a.category === "generated" ||
        a.name.startsWith("AI") ||
        a.name.includes("成片") ||
        a.name.includes("风格");
      list.push({
        ...a,
        category: isGen ? "generated" : "upload",
      });
    }

    for (const h of aiHistory) {
      const img = h.resultUrl || h.resultBase64;
      if (!img || seen.has(img)) continue;
      seen.add(img);
      list.push({
        id: h.id,
        userId: h.userId || "default",
        name: `AI成片 · ${h.styleName || "修图"}`,
        src: img,
        thumb: img,
        width: 1024,
        height: 1024,
        aspectRatio: 1,
        category: "generated",
        createdAt: h.createdAt,
        isFromHistory: true,
      });
    }

    return list;
  }, [mediaAssets, aiHistory]);

  const uploadCount = useMemo(
    () => allFiles.filter((f) => f.category === "upload").length,
    [allFiles]
  );
  const generatedCount = useMemo(
    () => allFiles.filter((f) => f.category === "generated").length,
    [allFiles]
  );

  const displayedFiles = useMemo(() => {
    let filtered = allFiles.filter((f) => {
      if (filterTab === "upload" && f.category !== "upload") return false;
      if (filterTab === "generated" && f.category !== "generated") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return f.name.toLowerCase().includes(q);
      }
      return true;
    });

    if (sortOrder === "newest") {
      filtered = [...filtered].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    } else {
      filtered = [...filtered].sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
    }
    return filtered;
  }, [allFiles, filterTab, searchQuery, sortOrder]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true, "register");
      return;
    }
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      const toSave = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const b64 = await fileToBase64(file);
        const dims = await getImageDimensions(b64).catch(() => ({ width: 1200, height: 1200 }));
        toSave.push({
          name: file.name.replace(/\.[^/.]+$/, "") || "上传图片",
          src: b64,
          width: dims.width,
          height: dims.height,
          aspectRatio: dims.width / (dims.height || 1),
          sizeBytes: file.size,
          category: "upload" as const,
        });
      }
      const created = await addMediaAssets(toSave);
      setJustUploadedCount(created.length);
      setTimeout(() => setJustUploadedCount(0), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUseInAiRetouch = (file: UserMediaAsset) => {
    setAiSourceImage(file.src);
    setLatestAiGeneratedImage(null);
    setActivePanel("ai-retouch");
    setPreviewAsset(null);
  };

  const handleAddToCollage = (file: UserMediaAsset) => {
    const w = Math.round(canvas.width * 0.45);
    const h = Math.round(w / (file.aspectRatio || 1));
    addElement({
      type: "image",
      name: file.name,
      x: Math.round((canvas.width - w) / 2),
      y: Math.round((canvas.height - h) / 2),
      width: w,
      height: h,
      rotation: 0,
      opacity: 1,
      src: file.src,
      originalWidth: file.width || 1200,
      originalHeight: file.height || 1200,
      fit: "cover",
      borderRadius: 2,
      shadowBlur: 20,
      shadowOpacity: 0.15,
    });
    setActivePanel("templates");
    setPreviewAsset(null);
  };

  const handleDownload = (file: UserMediaAsset) => {
    const a = document.createElement("a");
    a.href = file.src;
    a.download = `${file.name}-${Date.now()}.${imageExtFromUrl(file.src)}`;
    a.click();
  };

  const handleDelete = (file: UserMediaAsset & { isFromHistory?: boolean }) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true, "register");
      return;
    }
    if (file.isFromHistory) {
      deleteAiHistoryItem(file.id);
    } else {
      deleteMediaAsset(file.id);
    }
    if (previewAsset?.id === file.id) {
      setPreviewAsset(null);
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return "刚刚";
    try {
      const d = new Date(iso);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = String(d.getHours()).padStart(2, "0");
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${mm}-${dd} ${hh}:${min}`;
    } catch {
      return "刚刚";
    }
  };

  return (
    <div className="flex-1 w-full h-full bg-gray-50/50 flex flex-col overflow-hidden select-none">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />

      {/* 顶部综合工具栏（现代文件管理器顶部） */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col gap-3 shrink-0 shadow-2xs">
        {/* 只读速览提示条 */}
        {!isAuthenticated && (
          <div className="w-full px-4 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs font-semibold flex items-center justify-between shadow-xs shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>素材图库只读速览中 · 浏览全部公有与演示资产 · 注册登录开启私有云端相册存储</span>
            </div>
            <button
              onClick={() => setAuthModalOpen(true, "register")}
              className="ml-2 px-2.5 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold cursor-pointer transition-all active:scale-95 whitespace-nowrap"
            >
              立即注册
            </button>
          </div>
        )}
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* 标题与文件数统计 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-900 shadow-2xs">
              <Images className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-gray-950 tracking-tight">
                  我的图库
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                  共 {allFiles.length} 个文件
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                集中沉淀您上传的原图与 AI 艺术生成资产，随时复用修图或拼图
              </p>
            </div>
          </div>

          {/* 右侧动作：上传图片 & 清空 */}
          <div className="flex items-center gap-3">
            {allFiles.length > 0 && (
              !confirmClear ? (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="text-xs text-gray-400 hover:text-red-600 font-semibold transition-colors cursor-pointer px-2 py-1.5"
                >
                  清空图库
                </button>
              ) : (
                <div className="flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-xl border border-red-200 text-xs font-bold">
                  <span className="text-red-600">确定清空？</span>
                  <button
                    onClick={() => {
                      clearAllMediaAssets();
                      setConfirmClear(false);
                    }}
                    className="text-red-600 underline font-extrabold cursor-pointer"
                  >
                    确认
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-gray-500 hover:text-gray-800 cursor-pointer ml-1"
                  >
                    取消
                  </button>
                </div>
              )
            )}

            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setAuthModalOpen(true, "register");
                  return;
                }
                fileInputRef.current?.click();
              }}
              disabled={isUploading}
              className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>{isUploading ? "正在上传..." : "上传本地图片"}</span>
            </button>
          </div>
        </div>

        {justUploadedCount > 0 && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>已成功上传 {justUploadedCount} 张照片至图库！</span>
          </div>
        )}

        {/* 分类过滤器 + 搜索栏 + 排序 */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterTab("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterTab === "all"
                  ? "bg-gray-950 text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              全部文件 ({allFiles.length})
            </button>
            <button
              onClick={() => setFilterTab("upload")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterTab === "upload"
                  ? "bg-gray-950 text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              上传的原图 ({uploadCount})
            </button>
            <button
              onClick={() => setFilterTab("generated")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterTab === "generated"
                  ? "bg-gray-950 text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              AI 生成图片 ({generatedCount})
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-56 sm:w-64">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索文件名称或风格..."
                className="w-full bg-gray-100 border border-transparent focus:border-gray-300 focus:bg-white rounded-xl pl-8 pr-7 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
              className="px-2.5 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white text-xs text-gray-700 font-bold flex items-center gap-1 cursor-pointer transition-colors"
              title="切换排序顺序"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
              <span>{sortOrder === "newest" ? "最新优先" : "最早优先"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 核心文件网格浏览区（纯粹、宽阔的文件浏览器，无左右重复） */}
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
        {displayedFiles.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDraggingOver(false);
              handleFileUpload(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full max-w-2xl mx-auto my-12 aspect-16/10 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-200 ${
              isDraggingOver
                ? "border-gray-950 bg-gray-50 scale-[1.01]"
                : "border-gray-300 bg-white hover:border-gray-900 hover:bg-gray-50/60"
            }`}
          >
            <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 mb-3">
              <FolderOpen className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-gray-950 mb-1">
              {filterTab === "upload"
                ? "暂无上传的原图"
                : filterTab === "generated"
                ? "暂无 AI 艺术生成图片"
                : "图库中暂无任何照片"}
            </h3>
            <p className="text-xs text-gray-500 mb-5 max-w-sm">
              点击或拖拽本地照片至此处上传，在「AI修图」上传的照片与生成的成片也会自动汇聚于此
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="px-6 py-2.5 rounded-xl bg-gray-950 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>上传第一张照片</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
            {displayedFiles.map((file) => {
              const isGen = file.category === "generated";
              return (
                <div
                  key={file.id}
                  className="group relative rounded-2xl border border-gray-200 bg-white hover:border-gray-950 hover:shadow-lg transition-all flex flex-col overflow-hidden select-none"
                >
                  {/* 缩略图窗口 */}
                  <div
                    onClick={() => setPreviewAsset(file)}
                    className="aspect-3/4 w-full overflow-hidden bg-gray-100 relative cursor-pointer"
                  >
                    <img
                      src={thumbOf(file.thumb || file.src, 480)}
                      alt={file.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* 左上角标签 */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      {isGen ? (
                        <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-emerald-400 text-[10px] font-extrabold flex items-center gap-1 shadow-xs">
                          <Sparkles className="w-2.5 h-2.5" />
                          AI生成
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-extrabold shadow-xs">
                          原图
                        </span>
                      )}
                    </div>

                    {/* 右上角删除按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file);
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10"
                      title="删除此文件"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* 悬停快捷工具层 */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/85 via-black/55 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUseInAiRetouch(file);
                        }}
                        className="w-full py-1.5 rounded-lg bg-white hover:bg-gray-100 text-gray-950 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Wand2 className="w-3 h-3 text-emerald-600" />
                        <span>去 AI 修图</span>
                      </button>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCollage(file);
                          }}
                          className="py-1 rounded-md bg-black/65 hover:bg-black text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <LayoutTemplate className="w-2.5 h-2.5" />
                          <span>去拼图</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(file);
                          }}
                          className="py-1 rounded-md bg-black/65 hover:bg-black text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Download className="w-2.5 h-2.5" />
                          <span>下载</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 底部信息条 */}
                  <div className="p-3 bg-white flex flex-col gap-0.5 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                      <span>{file.width ? `${file.width}×${file.height}` : "高清"}</span>
                      <span>{formatTime(file.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 点击卡片弹出的 Lightbox 高清大图预览浮层 */}
      {previewAsset && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 animate-fadeIn"
          onClick={() => setPreviewAsset(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗顶部栏 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    previewAsset.category === "generated"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {previewAsset.category === "generated" ? "✨ AI 成片" : "📷 上传原图"}
                </span>
                <h3 className="text-sm font-extrabold text-gray-950 truncate max-w-md">
                  {previewAsset.name}
                </h3>
                <span className="text-xs font-mono text-gray-400 hidden sm:inline">
                  ({previewAsset.width} × {previewAsset.height} px)
                </span>
              </div>

              <button
                onClick={() => setPreviewAsset(null)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-950 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 大图展示区 */}
            <div className="flex-1 overflow-hidden p-6 bg-gray-50/70 flex items-center justify-center max-h-[66vh]">
              <img
                src={previewAsset.src}
                alt={previewAsset.name}
                className="max-h-[66vh] max-w-full object-contain rounded-xl shadow-md border border-gray-200"
              />
            </div>

            {/* 弹窗底部动作栏 */}
            <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between">
              <div className="text-xs text-gray-500 font-mono">
                归档时间：{formatTime(previewAsset.createdAt)}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => handleUseInAiRetouch(previewAsset)}
                  className="px-4 py-2 rounded-xl bg-gray-950 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>用作 AI 修图原图</span>
                </button>

                <button
                  onClick={() => handleAddToCollage(previewAsset)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <LayoutTemplate className="w-3.5 h-3.5 text-blue-600" />
                  <span>加入拼图画布</span>
                </button>

                <button
                  onClick={() => handleDownload(previewAsset)}
                  className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载原图</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
