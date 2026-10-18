new_content = """import React, { useState, useEffect, useRef } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import {
  AI_STYLES,
  getStyleById,
  IMAGE_RATIOS,
  ImageAspectRatio,
} from "../../lib/ai-styles";
import {
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Check,
  LayoutTemplate,
  FolderPlus,
  Download,
  Layers,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  X,
  Plus,
  Minus,
  Eye,
  Loader2,
  FolderOpen,
  Upload,
  Maximize2,
  Minimize2,
  Columns,
  ListPlus,
} from "lucide-react";
import { Button } from "../ui/Button";
import { fileToBase64 } from "../../lib/utils";
import { AspectRatioThumbnail } from "../ui/AspectRatioThumbnail";
import { MediaPickerModal } from "../studio/ai/MediaPickerModal";
import { AiImageLightboxModal } from "../studio/ai/AiImageLightboxModal";
import { AiGenerationQueueDrawer } from "../studio/ai/AiGenerationQueueDrawer";
import { UserMediaAsset } from "../../types/document";

export const AiStylizeStudioStage: React.FC = () => {
  const selectedStyleId = useEditorStore((s) => s.selectedAiStyleId);
  const setSelectedStyleId = useEditorStore((s) => s.setSelectedAiStyleId);
  const aiStyles = useEditorStore((s) => s.aiStyles);
  const fetchAiStyles = useEditorStore((s) => s.fetchAiStyles);
  const sourceImage = useEditorStore((s) => s.aiSourceImage);
  const setSourceImage = useEditorStore((s) => s.setAiSourceImage);
  const latestResult = useEditorStore((s) => s.latestAiGeneratedImage);
  const setLatestResult = useEditorStore((s) => s.setLatestAiGeneratedImage);
  const isGenerating = useEditorStore((s) => s.isGeneratingAi);
  const generateAiImage = useEditorStore((s) => s.generateAiImage);
  const applyStylizedImage = useEditorStore((s) => s.applyStylizedImageToCanvas);
  const addMediaAssets = useEditorStore((s) => s.addMediaAssets);
  const mediaAssets = useEditorStore((s) => s.mediaAssets);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const currentUser = useEditorStore((s) => s.currentUser);
  const setAdminModalOpen = useEditorStore((s) => s.setAdminModalOpen);

  // Queue state from store
  const aiQueue = useEditorStore((s) => s.aiQueue);
  const isQueueRunning = useEditorStore((s) => s.isQueueRunning);
  const addToAiQueue = useEditorStore((s) => s.addToAiQueue);
  const addBatchToAiQueue = useEditorStore((s) => s.addBatchToAiQueue);

  // Form State
  const [mood, setMood] = useState("");
  const [includeText, setIncludeText] = useState(true);
  const [specifiedText, setSpecifiedText] = useState("");
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("auto");

  // Comparison & Lightbox State
  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxData, setLightboxData] = useState<{ result: string | null; source: string | null; styleName: string }>({
    result: null,
    source: null,
    styleName: "",
  });

  // Media Picker Modal State
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Adaptive Workspace Mode: When user is producing (has photo or generating or result), right side expands
  const [isWideWorkspace, setIsWideWorkspace] = useState<boolean>(false);

  // Toast Notification State
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Loading animation progress state
  const [genProgress, setGenProgress] = useState(0);
  const [genStageText, setGenStageText] = useState("正在解析源照片轮廓与色彩结构...");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAiStyles();
  }, [fetchAiStyles]);

  const visibleStyles = (aiStyles && aiStyles.length > 0 ? aiStyles : AI_STYLES).filter(
    (s) => s.enabled !== false
  );

  const activeStyle =
    visibleStyles.find((s) => s.id === selectedStyleId) ||
    visibleStyles[0] ||
    getStyleById(selectedStyleId, aiStyles);

  const isFantasy = activeStyle?.id === "fantasy_qiqiguaiguai" || Boolean(activeStyle?.name && activeStyle.name.includes("奇奇怪怪"));

  // Auto-adapt aspect ratio when switching active style
  useEffect(() => {
    if (activeStyle) {
      if (activeStyle.aspectRatio && activeStyle.aspectRatio !== "auto") {
        setAspectRatio(activeStyle.aspectRatio as ImageAspectRatio);
      } else {
        setAspectRatio("auto");
      }
    }
  }, [selectedStyleId]);

  useEffect(() => {
    if (visibleStyles.length > 0 && !visibleStyles.some((s) => s.id === selectedStyleId)) {
      setSelectedStyleId(visibleStyles[0].id);
    }
  }, [visibleStyles, selectedStyleId, setSelectedStyleId]);

  // When user selects a source image or has result, auto-expand workspace for comfortable large view
  useEffect(() => {
    if (sourceImage || latestResult || isGenerating) {
      setIsWideWorkspace(true);
    }
  }, [sourceImage, latestResult, isGenerating]);

  // Loading animation stages
  useEffect(() => {
    if (isGenerating || isQueueRunning) {
      setGenProgress(15);
      setGenStageText(
        isFantasy
          ? "📐 正在解析生活碎片主体与反差幽默叙事..."
          : "📐 正在解析源照片主体轮廓与高光色彩..."
      );

      const t1 = setTimeout(() => {
        setGenProgress(35);
        setGenStageText(`🎨 正在调用 AI 图像大模型重构「${activeStyle.name.replace(/^[0-9•\\s·]+/, "")}」视觉意境...`);
      }, 4000);

      const t2 = setTimeout(() => {
        setGenProgress(60);
        setGenStageText("✨ 正在进行高定留白、光影扩散与材质定影...");
      }, 12000);

      const t3 = setTimeout(() => {
        setGenProgress(80);
        setGenStageText("🔤 典雅排版字体压印与胶片颗粒定影...");
      }, 24000);

      const t4 = setTimeout(() => {
        setGenProgress(95);
        setGenStageText("💎 正在完成超高解析度渲染与质感合成定影...");
      }, 38000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    } else if (latestResult) {
      setGenProgress(100);
      setGenStageText("✓ 艺术重构成片已就绪！");
    }
  }, [isGenerating, isQueueRunning, latestResult, activeStyle.name]);

  // Auto hide toast message after 3.5s
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Upload Local File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setSourceImage(base64);
      setLatestResult(null);
      setStatusMessage({ type: "success", text: "照片载入成功！" });
      // Auto add to media assets for future use
      addMediaAssets([
        {
          id: "media_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
          name: file.name.replace(/\.[^/.]+$/, ""),
          src: base64,
          createdAt: new Date().toISOString(),
          isAiGenerated: false,
        },
      ]).catch(() => {});
    } catch (err) {
      setStatusMessage({ type: "error", text: "读取图片失败，请重新选择" });
    }
  };

  // Drag & Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0 && files[0].type.startsWith("image/")) {
      const base64 = await fileToBase64(files[0]);
      setSourceImage(base64);
      setLatestResult(null);
      setStatusMessage({ type: "success", text: "照片已成功放入！" });
      addMediaAssets([
        {
          id: "media_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
          name: files[0].name.replace(/\.[^/.]+$/, ""),
          src: base64,
          createdAt: new Date().toISOString(),
          isAiGenerated: false,
        },
      ]).catch(() => {});
    }
  };

  // Handle Select Single Photo from Media Picker
  const handleSelectFromMedia = (asset: UserMediaAsset) => {
    setSourceImage(asset.src);
    setLatestResult(null);
    setStatusMessage({ type: "success", text: `已从素材库载入照片「${asset.name || "素材"}」` });
  };

  // Handle Batch Add to Queue from Media Picker
  const handleBatchQueueFromMedia = (assets: UserMediaAsset[]) => {
    const tasks = assets.map((asset) => ({
      styleId: activeStyle.id,
      styleName: activeStyle.name,
      badge: activeStyle.badge,
      sourceImage: asset.src,
      aspectRatio,
      mood: mood.trim(),
      customNotes: mood.trim(),
      includeText,
      specifiedText: specifiedText.trim(),
    }));

    addBatchToAiQueue(tasks);
    setStatusMessage({
      type: "success",
      text: `已将 ${assets.length} 张照片加入「${activeStyle.name}」生成队列，后台正在排队生成！`,
    });
  };

  // Save to Media Assets
  const handleSaveToAssets = async () => {
    if (!latestResult) return;
    try {
      await addMediaAssets([
        {
          name: `AI风格 · ${activeStyle.name}`,
          src: latestResult,
          width: activeStyle.aspectRatio === "3:4" ? 768 : 1024,
          height: 1024,
          aspectRatio: activeStyle.aspectRatio === "3:4" ? 3 / 4 : 1,
        },
      ]);
      setStatusMessage({
        type: "success",
        text: "已成功存入素材库！随时可在左侧「素材」面板调用",
      });
    } catch (e) {
      console.error("Save asset error:", e);
    }
  };

  // Trigger Generation (Direct or Queue)
  const handleGenerateOrEnqueue = async () => {
    if (!sourceImage) {
      setStatusMessage({ type: "error", text: "请先上传或从素材库选择一张照片作为创作底图" });
      return;
    }

    // If queue is already running, add to queue without blocking user!
    if (isQueueRunning || isGenerating) {
      addToAiQueue({
        styleId: activeStyle.id,
        styleName: activeStyle.name,
        badge: activeStyle.badge,
        sourceImage,
        aspectRatio,
        mood: mood.trim(),
        customNotes: mood.trim(),
        includeText,
        specifiedText: specifiedText.trim(),
      });
      setStatusMessage({
        type: "success",
        text: `已将新任务加入生成队列！后台将自动依次生成。`,
      });
      return;
    }

    // If free, enqueue and execute immediately
    addToAiQueue({
      styleId: activeStyle.id,
      styleName: activeStyle.name,
      badge: activeStyle.badge,
      sourceImage,
      aspectRatio,
      mood: mood.trim(),
      customNotes: mood.trim(),
      includeText,
      specifiedText: specifiedText.trim(),
    });
  };

  // Open Lightbox
  const handleOpenLightbox = (resImg?: string, srcImg?: string, sName?: string) => {
    const finalRes = resImg || latestResult;
    const finalSrc = srcImg || sourceImage;
    if (!finalRes) return;
    setLightboxData({
      result: finalRes,
      source: finalSrc,
      styleName: sName || activeStyle.name,
    });
    setIsLightboxOpen(true);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="relative w-full h-full flex flex-col bg-studio-bg overflow-hidden select-none"
    >
      {/* MODERN FLOATING TOAST NOTIFICATION (DOES NOT PUSH DOWN DOM) */}
      {statusMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-fadeIn">
          <div
            className={`px-4 sm:px-5 py-2.5 rounded-full border shadow-2xl backdrop-blur-xl flex items-center gap-2.5 text-xs font-medium transition-all ${
              statusMessage.type === "success"
                ? "bg-zinc-900/90 dark:bg-zinc-900/95 border-emerald-500/40 text-emerald-300 shadow-emerald-950/30"
                : "bg-zinc-900/90 dark:bg-zinc-900/95 border-red-500/40 text-red-300 shadow-red-950/30"
            }`}
          >
            {statusMessage.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span className="font-sans">{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="ml-1 text-zinc-400 hover:text-white cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* UNIFIED CREATION WORKSPACE: DYNAMICALLY SIZED FOR BROWSING VS PRODUCING */}
      <div className="flex-1 w-full min-h-0 flex flex-col lg:flex-row overflow-hidden z-10 animate-fadeIn">
        
        {/* LEFT: EDITORIAL STYLE GALLERY STREAM */}
        <div
          className={`h-full overflow-y-auto p-4 sm:p-6 lg:p-7 no-scrollbar transition-all duration-300 ${
            isWideWorkspace
              ? "w-full lg:w-[32%] xl:w-[28%] 2xl:w-[26%] border-r border-studio-border bg-studio-bg/60"
              : "flex-1"
          }`}
        >
          {/* Headline */}
          <div className="space-y-1.5 pb-5 flex items-center justify-between">
            <div>
              <h2
                className={`font-serif font-bold tracking-tight text-studio-text leading-tight ${
                  isWideWorkspace ? "text-xl sm:text-2xl" : "text-3xl sm:text-4xl lg:text-[38px]"
                }`}
              >
                选择创作风格
              </h2>
              <p className="text-xs text-studio-muted font-sans mt-0.5">
                {isWideWorkspace ? "点击切换意境风格" : "从普通照片出发，通过 AI 意境重构先锋视觉表达"}
              </p>
            </div>

            {isWideWorkspace && (
              <button
                type="button"
                onClick={() => setIsWideWorkspace(false)}
                className="px-2.5 py-1 rounded-lg text-[11px] bg-studio-panel hover:bg-studio-hover border border-studio-border text-studio-muted hover:text-studio-text flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                title="折叠制作区，展开浏览大图瀑布流"
              >
                <Columns className="w-3 h-3" />
                <span>大图浏览</span>
              </button>
            )}
          </div>

          {/* Style Cards Grid */}
          {visibleStyles.length === 0 ? (
            <div className="p-10 rounded-3xl border border-dashed border-studio-border bg-studio-card/40 text-center space-y-4">
              <Sparkles className="w-9 h-9 text-studio-muted mx-auto" />
              <div>
                <h3 className="text-sm font-semibold text-studio-text">暂无启用的风格化模板</h3>
                <p className="text-xs text-studio-muted mt-1">管理员可在后台控制台开启或添加风格化模板。</p>
              </div>
              {currentUser?.isAdmin && (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => setAdminModalOpen(true, "styles")}
                  className="text-xs"
                >
                  打开风格模板管理后台
                </Button>
              )}
            </div>
          ) : (
            <div
              className={`grid gap-4 sm:gap-5 pb-20 ${
                isWideWorkspace
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
                  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {visibleStyles.map((style, idx) => {
                const isSelected = selectedStyleId === style.id;
                const indexStr = String(idx + 1).padStart(2, "0");

                return (
                  <div
                    key={style.id}
                    onClick={() => {
                      setSelectedStyleId(style.id);
                      // If user clicks a style, encourage opening comfortable creation mode
                      if (!isWideWorkspace && (sourceImage || latestResult)) {
                        setIsWideWorkspace(true);
                      }
                    }}
                    className={`group rounded-2xl overflow-hidden bg-studio-card border transition-all duration-200 cursor-pointer flex flex-col relative shadow-xs ${
                      isSelected
                        ? "ring-2 ring-[#2563EB] border-[#2563EB] shadow-md"
                        : "border-studio-border hover:border-[#2563EB]/50 hover:shadow-sm"
                    }`}
                  >
                    {/* Visual Cover Container */}
                    <div className="relative w-full aspect-[3/4] overflow-hidden bg-studio-panel">
                      {/* Top-left Blue Number Box */}
                      <div
                        className={`absolute top-3 left-3 z-10 px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider transition-colors ${
                          isSelected
                            ? "bg-[#2563EB] text-white shadow-xs"
                            : "bg-[#1E293B]/90 text-white group-hover:bg-[#2563EB]"
                        }`}
                      >
                        {indexStr}
                      </div>

                      {/* Cover Image or SVG Artwork */}
                      {style.coverImage ? (
                        <img
                          src={style.coverImage}
                          alt={style.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : style.previewSvg ? (
                        <div
                          dangerouslySetInnerHTML={{ __html: style.previewSvg }}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 text-studio-accent">
                          <Sparkles className="w-10 h-10 mb-2 opacity-50" />
                          <span className="text-xs font-serif tracking-widest">{style.name}</span>
                        </div>
                      )}

                      {/* Active Status Badge on Cover */}
                      <div className="absolute bottom-3 right-3 z-10">
                        {isSelected ? (
                          <div className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white text-[11px] font-bold flex items-center gap-1 shadow-sm">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>正在创作</span>
                          </div>
                        ) : (
                          <div className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-white/90 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            开始创作
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="p-3.5 flex items-center justify-between border-t border-studio-border bg-studio-card">
                      <div className="min-w-0 pr-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-studio-text font-sans truncate">
                          {style.name}
                        </h3>
                        <p className="text-[10px] text-studio-muted font-mono truncate mt-0.5">
                          {style.enName}
                        </p>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-studio-panel text-studio-muted border border-studio-border shrink-0">
                        {style.badge || "高定开放"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT: PHOTO GENERATION WORKSPACE (ADAPTIVE SIZE: WIDE WHEN PRODUCING, COMPACT WHEN BROWSING) */}
        <aside
          className={`h-full border-t lg:border-t-0 lg:border-l border-studio-border bg-studio-sidebar flex flex-col justify-between overflow-y-auto shrink-0 z-20 shadow-xl transition-all duration-300 ${
            isWideWorkspace
              ? "w-full lg:w-[68%] xl:w-[72%] 2xl:w-[74%]"
              : "w-full lg:w-[440px] xl:w-[470px] 2xl:w-[500px]"
          }`}
        >
          {/* Header */}
          <div className="p-4 sm:p-5 pb-3 border-b border-studio-border flex items-center justify-between sticky top-0 bg-studio-sidebar/95 backdrop-blur-md z-10">
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg sm:text-xl font-bold text-studio-text font-sans tracking-tight">
                制作{activeStyle.name.replace(/^[0-9•\\s·]+/, "")}
              </h3>
              {activeStyle.badge && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30">
                  {activeStyle.badge}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Toggle Wide Workspace Button */}
              <button
                type="button"
                onClick={() => setIsWideWorkspace(!isWideWorkspace)}
                className="px-2.5 py-1.5 rounded-xl bg-studio-panel hover:bg-studio-hover border border-studio-border text-xs text-studio-muted hover:text-studio-text flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title={isWideWorkspace ? "还原为紧凑侧栏" : "展开为宽屏制作工作台"}
              >
                {isWideWorkspace ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-blue-500" />
                    <span className="hidden sm:inline">紧凑视图</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                    <span className="hidden sm:inline">展开工作台</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSourceImage(null);
                  setLatestResult(null);
                }}
                className="w-8 h-8 rounded-full bg-studio-panel hover:bg-studio-hover border border-studio-border flex items-center justify-center text-studio-muted hover:text-studio-text transition-colors cursor-pointer"
                title="清空重置照片"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Form Body */}
          <div className="p-4 sm:p-5 lg:p-6 space-y-6 flex-1">
            {/* Style Description Banner */}
            <p className="text-xs text-studio-muted leading-relaxed">
              {activeStyle.description}
            </p>

            {/* PHOTO UPLOAD & HERO DISPLAY CONTAINER */}
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              {!sourceImage && !latestResult ? (
                /* EMPTY DROPZONE: CLEAR ENTRANCES TO MEDIA ASSETS OR LOCAL UPLOAD */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#2563EB]/40 hover:border-[#2563EB] rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center gap-3.5 bg-blue-50/20 dark:bg-blue-950/10 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all cursor-pointer group"
                >
                  <div className="w-14 h-14 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                    <Plus className="w-7 h-7 stroke-[2.5]" />
                  </div>

                  <div className="text-center space-y-1">
                    <h4 className="text-sm sm:text-base font-bold text-studio-text">
                      放入一张真实照片
                    </h4>
                    <p className="text-xs text-studio-muted">
                      点击选择本地文件或拖入文件 (JPG / PNG / WebP)
                    </p>
                  </div>

                  {/* Pick from User Media Assets Button */}
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setIsMediaPickerOpen(true)}
                      className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                      title="从您已上传或已生成的素材照片库中挑选"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>从素材库选择 ({mediaAssets.length} 张可用)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-studio-panel hover:bg-studio-hover border border-studio-border text-xs font-medium text-studio-text flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-500" />
                      <span>本地文件上传</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* HERO PHOTO CARD WITH LIGHTBOX & CONTROLS (FULL UNROLLED DISPLAY) */
                <div className="space-y-3">
                  <div
                    onDoubleClick={() => handleOpenLightbox()}
                    className="relative w-full rounded-2xl overflow-hidden border border-studio-border bg-stone-200/50 dark:bg-zinc-950 shadow-md group flex items-center justify-center"
                  >
                    {/* Big Image Display (Expands in Wide Mode) */}
                    <div className="w-full flex items-center justify-center overflow-hidden">
                      <img
                        src={
                          latestResult && !isHoldingOriginal
                            ? latestResult
                            : sourceImage!
                        }
                        alt={latestResult && !isHoldingOriginal ? "Generated Artwork" : "Source Original"}
                        className={`w-full h-auto object-contain block mx-auto transition-all ${
                          isWideWorkspace
                            ? "max-h-[500px] xl:max-h-[580px] 2xl:max-h-[640px]"
                            : "max-h-[360px] sm:max-h-[400px]"
                        }`}
                      />
                    </div>

                    {/* Top Overlay Badge & Action Buttons */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                      {latestResult ? (
                        <div className="px-2.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-md">
                          <Sparkles className="w-3 h-3" />
                          <span>AI 艺术成片</span>
                        </div>
                      ) : (
                        <div className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white/90 text-[11px] font-mono">
                          原图底片已就绪
                        </div>
                      )}

                      <div className="flex items-center gap-1.5 pointer-events-auto">
                        {/* Lightbox Maximize Button */}
                        {latestResult && (
                          <button
                            type="button"
                            onClick={() => handleOpenLightbox()}
                            className="px-2.5 py-1 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
                            title="放大全屏查看大图细节与原图对比"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>放大查看</span>
                          </button>
                        )}

                        {/* Press to Peek Original Button */}
                        {latestResult && (
                          <button
                            type="button"
                            onMouseDown={() => setIsHoldingOriginal(true)}
                            onMouseUp={() => setIsHoldingOriginal(false)}
                            onMouseLeave={() => setIsHoldingOriginal(false)}
                            onTouchStart={() => setIsHoldingOriginal(true)}
                            onTouchEnd={() => setIsHoldingOriginal(false)}
                            className="px-2.5 py-1 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 select-none"
                            title="长按即时对比原始照片"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                            <span>{isHoldingOriginal ? "对比中" : "按住看原图"}</span>
                          </button>
                        )}

                        {/* Change Photo Entrance */}
                        <button
                          type="button"
                          onClick={() => setIsMediaPickerOpen(true)}
                          className="px-2.5 py-1 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-medium backdrop-blur-md border border-white/20 flex items-center gap-1 cursor-pointer transition-all shadow-md"
                          title="从素材库或本地更换照片"
                        >
                          <span>更换照片</span>
                        </button>
                      </div>
                    </div>

                    {/* GENERATING LOADING OVERLAY */}
                    {(isGenerating || (isQueueRunning && aiQueue.some(t => t.status === "running"))) && (
                      <div className="absolute inset-0 z-20 bg-zinc-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn text-white">
                        <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping" />
                          <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-indigo-500 border-l-transparent animate-spin" />
                          <Sparkles className="w-7 h-7 text-amber-300 animate-pulse" />
                        </div>

                        <div className="space-y-1 max-w-xs">
                          <div className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">
                            AI GENERATION IN PROGRESS • {genProgress}%
                          </div>
                          <p className="text-sm font-bold text-white tracking-tight">
                            正在意境重构: {activeStyle.name}
                          </p>
                          <p className="text-xs text-zinc-400 leading-relaxed font-sans pt-1">
                            {genStageText}
                          </p>
                        </div>

                        <div className="w-56 bg-zinc-800 rounded-full h-1.5 mt-5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(12, genProgress)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Generated Result Actions: Save to Media Assets & Download */}
                  {latestResult && (
                    <div className="grid grid-cols-2 gap-2 pt-1 animate-fadeIn">
                      <Button
                        variant="secondary"
                        onClick={handleSaveToAssets}
                        className="py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs border-0"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>存入素材</span>
                      </Button>

                      <Button
                        variant="secondary"
                        onClick={() => {
                          const a = document.createElement("a");
                          a.href = latestResult;
                          a.download = `atelier_ai_${activeStyle.id}_${Date.now()}.png`;
                          a.click();
                        }}
                        className="py-2.5 rounded-xl bg-studio-panel hover:bg-studio-hover border border-studio-border text-studio-text text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-emerald-500" />
                        <span>下载高清成片</span>
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FORM CONTROLS: MOOD, TEXT, RATIO */}
            <div className={`space-y-5 ${isWideWorkspace ? "grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0" : ""}`}>
              {/* Left Column in Wide Mode: Direction & Text */}
              <div className="space-y-4">
                {/* Direction & Atmosphere Notes */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-studio-text font-sans">
                      方向与氛围
                    </label>
                    <span className="text-[11px] font-mono text-studio-muted">
                      可选 {mood.length} / 20
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={20}
                    placeholder="例如: 暖阳透过车窗、细雨后的松弛感..."
                    value={mood}
                    onChange={(e) => setMood(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-studio-panel border border-studio-border rounded-xl text-xs text-studio-text placeholder:text-studio-muted/50 focus:outline-none focus:border-[#2563EB] transition-colors"
                  />
                  <p className="text-[11px] text-studio-muted leading-tight">
                    简短描述想传达的感觉，系统会结合照片调整表达，不改变原有创作风格。
                  </p>
                </div>

                {/* Typography Settings */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-studio-text font-sans">
                      画面文字
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIncludeText(true)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          includeText
                            ? "bg-[#2563EB] text-white border-[#2563EB] font-semibold shadow-2xs"
                            : "bg-studio-panel border-studio-border text-studio-muted hover:text-studio-text"
                        }`}
                      >
                        添加文字
                      </button>
                      <button
                        type="button"
                        onClick={() => setIncludeText(false)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          !includeText
                            ? "bg-[#2563EB] text-white border-[#2563EB] font-semibold shadow-2xs"
                            : "bg-studio-panel border-studio-border text-studio-muted hover:text-studio-text"
                        }`}
                      >
                        纯净画面
                      </button>
                    </div>
                  </div>

                  {includeText && (
                    <div className="space-y-1.5 pt-1">
                      <input
                        type="text"
                        maxLength={40}
                        placeholder={
                          isFantasy
                            ? "可指定大标题，例：本人正在加载、生活暂停30秒..."
                            : "可指定英文/中文短句，不填则由系统意境创作..."
                        }
                        value={specifiedText}
                        onChange={(e) => setSpecifiedText(e.target.value)}
                        className="w-full px-3.5 py-2 bg-studio-panel border border-studio-border rounded-xl text-xs text-studio-text placeholder:text-studio-muted/50 focus:outline-none focus:border-[#2563EB] transition-colors"
                      />
                      <p className="text-[11px] text-studio-muted leading-tight">
                        不填写时，系统会根据画面意境创作融入典雅排版；填写后尽量按原文呈现。
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column in Wide Mode: 3x3 Aspect Ratio Grid with Thumbnails */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-studio-text font-sans">
                    画幅比例
                  </label>
                  <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                    {aspectRatio} ({IMAGE_RATIOS.find((r) => r.id === aspectRatio)?.desc})
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-studio-panel rounded-2xl border border-studio-border">
                  {IMAGE_RATIOS.map((r) => {
                    const isSelected = aspectRatio === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setAspectRatio(r.id)}
                        className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer border group ${
                          isSelected
                            ? "bg-[#2563EB] text-white font-bold border-[#2563EB] shadow-xs ring-2 ring-[#2563EB]/25"
                            : "bg-studio-card border-studio-border/70 text-studio-text hover:border-[#2563EB]/40 hover:bg-studio-hover"
                        }`}
                        title={`${r.label} - ${r.desc}`}
                      >
                        <AspectRatioThumbnail ratioId={r.id} isSelected={isSelected} size="md" />
                        <div className="text-center leading-none">
                          <div className={`text-[11px] font-mono font-bold ${isSelected ? "text-white" : "text-studio-text"}`}>
                            {r.label}
                          </div>
                          <div className={`text-[9px] mt-0.5 tracking-tight ${isSelected ? "text-blue-100" : "text-studio-muted"}`}>
                            {r.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Drawer Bottom CTA Button: Supports Direct Generation & Queue Batching */}
          <div className="p-4 sm:p-5 border-t border-studio-border bg-studio-sidebar space-y-2 sticky bottom-0 z-10">
            <button
              type="button"
              onClick={handleGenerateOrEnqueue}
              disabled={!sourceImage}
              className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !sourceImage
                  ? "bg-studio-panel text-studio-muted cursor-not-allowed shadow-none border border-studio-border"
                  : isQueueRunning || isGenerating
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-subtle-glow"
                  : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white active:scale-[0.99] shadow-subtle-glow"
              }`}
            >
              {isQueueRunning || isGenerating ? (
                <>
                  <ListPlus className="w-4 h-4" />
                  <span>+ 加入生成队列 (后台自动排队)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>开始 AI 风格化重构</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* MEDIA PICKER MODAL (PICK FROM USER ASSETS & BATCH QUEUE CREATION) */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelectSingle={handleSelectFromMedia}
        onSelectBatchQueue={handleBatchQueueFromMedia}
        activeStyleName={activeStyle.name}
      />

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL (HIGH RESOLUTION & COMPARISON) */}
      <AiImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        resultImage={lightboxData.result}
        sourceImage={lightboxData.source}
        styleName={lightboxData.styleName}
        onSaveToAssets={handleSaveToAssets}
        onApplyToCanvas={() => {
          if (lightboxData.result) {
            applyStylizedImage(lightboxData.result, "add");
            setIsLightboxOpen(false);
            setActivePanel("templates");
          }
        }}
      />

      {/* FLOATING GENERATION QUEUE DRAWER */}
      <AiGenerationQueueDrawer
        onOpenLightbox={(resImg, srcImg, sName) => {
          setLightboxData({ result: resImg, source: srcImg, styleName: sName });
          setIsLightboxOpen(true);
        }}
        onApplyToCanvas={(resImg) => {
          applyStylizedImage(resImg, "add");
          setActivePanel("templates");
        }}
      />
    </div>
  );
};
"""

with open("src/components/canvas/AiStylizeStudioStage.tsx", "w", encoding="utf-8") as f:
    f.write(new_content)

print("Updated AiStylizeStudioStage.tsx successfully.")
