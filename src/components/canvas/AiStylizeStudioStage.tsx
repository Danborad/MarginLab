import React, { useState, useRef, useMemo, useEffect } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { getStyleById } from "../../lib/ai-styles";
import { getRetouchStyleById } from "../../lib/retouch-styles";
import { fileToBase64, getImageDimensions, imageExtFromUrl } from "../../lib/utils";
import {
  Upload,
  Download,
  Wand2,
  RefreshCw,
  Sparkles,
  Clock,
  Trash2,
  FolderHeart,
  Check,
  Images,
  RotateCcw,
  X,
  Search,
  Undo2,
  FolderOpen,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { GenerationTask } from "../../types/ai";
import { UserMediaAsset } from "../../types/document";
import { thumbOf } from "../../lib/thumbs";

export type AiAspectRatio = "3:4" | "4:3" | "16:9" | "9:16" | "1:1";

/** 生成历史默认只渲染最近 10 次，展开时每次再追加 10 次 */
const HISTORY_PAGE_SIZE = 10;

interface AspectRatioOption {
  id: AiAspectRatio;
  label: string;
  desc: string;
  thumbW: number;
  thumbH: number;
  emptyWidth: string;
  emptyHeight: string;
  previewWidth: string;
  previewHeight: string;
}

const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  {
    id: "3:4",
    label: "3:4",
    desc: "竖屏人像",
    thumbW: 15,
    thumbH: 20,
    emptyWidth: "clamp(360px, calc((100vh - 280px) * 0.75), 540px)",
    emptyHeight: "clamp(480px, calc(100vh - 280px), 720px)",
    previewWidth: "clamp(330px, calc((100vh - 340px) * 0.75), 480px)",
    previewHeight: "clamp(440px, calc(100vh - 340px), 640px)",
  },
  {
    id: "4:3",
    label: "4:3",
    desc: "经典横屏",
    thumbW: 20,
    thumbH: 15,
    emptyWidth: "clamp(560px, calc((100vh - 290px) * 1.3333), 840px)",
    emptyHeight: "clamp(420px, calc(100vh - 290px), 630px)",
    previewWidth: "clamp(520px, calc((100vh - 345px) * 1.3333), 760px)",
    previewHeight: "clamp(390px, calc(100vh - 345px), 570px)",
  },
  {
    id: "16:9",
    label: "16:9",
    desc: "宽屏横画",
    thumbW: 22,
    thumbH: 12.5,
    emptyWidth: "clamp(640px, calc((100vh - 310px) * 1.7778), 960px)",
    emptyHeight: "clamp(360px, calc(100vh - 310px), 540px)",
    previewWidth: "clamp(604px, calc((100vh - 355px) * 1.7778), 889px)",
    previewHeight: "clamp(340px, calc(100vh - 355px), 500px)",
  },
  {
    id: "9:16",
    label: "9:16",
    desc: "全屏竖画",
    thumbW: 12.5,
    thumbH: 22,
    emptyWidth: "clamp(315px, calc((100vh - 275px) * 0.5625), 414px)",
    emptyHeight: "clamp(560px, calc(100vh - 275px), 736px)",
    previewWidth: "clamp(292px, calc((100vh - 335px) * 0.5625), 369px)",
    previewHeight: "clamp(520px, calc(100vh - 335px), 656px)",
  },
  {
    id: "1:1",
    label: "1:1",
    desc: "正方画幅",
    thumbW: 17,
    thumbH: 17,
    emptyWidth: "clamp(460px, calc(100vh - 280px), 660px)",
    emptyHeight: "clamp(460px, calc(100vh - 280px), 660px)",
    previewWidth: "clamp(420px, calc(100vh - 340px), 600px)",
    previewHeight: "clamp(420px, calc(100vh - 340px), 600px)",
  },
];

export const AiStylizeStudioStage: React.FC = () => {
  const selectedStyleId = useEditorStore((s) => s.selectedAiStyleId);
  const selectedRatio = useEditorStore((s) => s.selectedAiAspectRatio);
  const setSelectedRatio = useEditorStore((s) => s.setSelectedAiAspectRatio);
  const sourceImage = useEditorStore((s) => s.aiSourceImage);
  const setSourceImage = useEditorStore((s) => s.setAiSourceImage);
  const latestResult = useEditorStore((s) => s.latestAiGeneratedImage);
  const setLatestResult = useEditorStore((s) => s.setLatestAiGeneratedImage);
  const isGenerating = useEditorStore((s) => s.isGeneratingAi);
  const generateAiImage = useEditorStore((s) => s.generateAiImage);
  const aiHistory = useEditorStore((s) => s.aiHistory);
  const fetchAiHistory = useEditorStore((s) => s.fetchAiHistory);
  const deleteAiHistoryItem = useEditorStore((s) => s.deleteAiHistoryItem);
  const loadTaskToWorkbench = useEditorStore((s) => s.loadTaskToWorkbench);
  const addMediaAssets = useEditorStore((s) => s.addMediaAssets);
  const mediaAssets = useEditorStore((s) => s.mediaAssets);
  const fetchUserMedia = useEditorStore((s) => s.fetchUserMedia);

  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [galleryTab, setGalleryTab] = useState<"all" | "upload" | "generated">("all");
  const [gallerySearch, setGallerySearch] = useState("");
  // 生成历史折叠：默认只渲染最近 10 次，手动展开时每次再追加 10 次
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(HISTORY_PAGE_SIZE);
  const currentUser = useEditorStore((s) => s.currentUser);
  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
  const setAuthModalOpen = useEditorStore((s) => s.setAuthModalOpen);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // 折叠历史的数据切片：只把需要展示的记录交给 React 渲染
  const visibleHistory = useMemo(
    () => aiHistory.slice(0, visibleHistoryCount),
    [aiHistory, visibleHistoryCount]
  );
  const hiddenHistoryCount = Math.max(0, aiHistory.length - visibleHistory.length);

  // 记录被删除到不足一页时，自动折叠回默认的最近 10 次
  useEffect(() => {
    if (
      visibleHistoryCount > HISTORY_PAGE_SIZE &&
      aiHistory.length <= HISTORY_PAGE_SIZE
    ) {
      setVisibleHistoryCount(HISTORY_PAGE_SIZE);
    }
  }, [aiHistory.length, visibleHistoryCount]);

  // 画框内缩放与位移状态
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imgNaturalAspect, setImgNaturalAspect] = useState<number>(0.75);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, startX: 0, startY: 0 });

  const currentFrameAspect = useMemo(() => {
    if (selectedRatio === "4:3") return 4 / 3;
    if (selectedRatio === "16:9") return 16 / 9;
    if (selectedRatio === "9:16") return 9 / 16;
    if (selectedRatio === "1:1") return 1;
    return 3 / 4;
  }, [selectedRatio]);

  // 当主图源变更时，重置构图缩放与位移
  useEffect(() => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  }, [sourceImage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const currentRatioOption = useMemo(
    () => ASPECT_RATIO_OPTIONS.find((o) => o.id === selectedRatio) || ASPECT_RATIO_OPTIONS[0],
    [selectedRatio]
  );

  const startHoldingOriginal = () => {
    setIsHoldingOriginal(true);
    const stop = () => {
      setIsHoldingOriginal(false);
      window.removeEventListener("mouseup", stop);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("touchend", stop);
    };
    window.addEventListener("mouseup", stop);
    window.addEventListener("pointerup", stop);
    window.addEventListener("touchend", stop);
  };

  useEffect(() => {
    fetchAiHistory().catch(() => {});
    fetchUserMedia().catch(() => {});
  }, [fetchAiHistory, fetchUserMedia, currentUser?.id]);

  // 汇总图库中可供选择的全部图片（上传原图 + 历史原图 + AI生成成片）
  const galleryItems = useMemo(() => {
    const list: (UserMediaAsset & { isHistorySource?: boolean })[] = [];
    const seen = new Set<string>();

    for (const a of mediaAssets) {
      if (!a.src || seen.has(a.src)) continue;
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
      // 优先归档历史记录中的拍摄原图，方便随时复用原图修其他效果
      if (h.sourceImage && !seen.has(h.sourceImage)) {
        seen.add(h.sourceImage);
        list.push({
          id: `src_${h.id}`,
          userId: h.userId || "default",
          name: `原图 · ${h.styleName || "历史底图"}`,
          src: h.sourceImage,
          thumb: h.sourceImage,
          width: 1024,
          height: 1024,
          aspectRatio: 0.75,
          category: "upload",
          createdAt: h.createdAt,
          isHistorySource: true,
        });
      }
      const resImg = h.resultUrl || h.resultBase64;
      if (resImg && !seen.has(resImg)) {
        seen.add(resImg);
        list.push({
          id: `gen_${h.id}`,
          userId: h.userId || "default",
          name: `AI成片 · ${h.styleName || "修图"}`,
          src: resImg,
          thumb: resImg,
          width: 1024,
          height: 1024,
          aspectRatio: 0.75,
          category: "generated",
          createdAt: h.createdAt,
        });
      }
    }
    return list;
  }, [mediaAssets, aiHistory]);

  const filteredGalleryItems = useMemo(() => {
    return galleryItems.filter((item) => {
      if (galleryTab === "upload" && item.category !== "upload") return false;
      if (galleryTab === "generated" && item.category !== "generated") return false;
      if (gallerySearch.trim()) {
        return item.name.toLowerCase().includes(gallerySearch.trim().toLowerCase());
      }
      return true;
    });
  }, [galleryItems, galleryTab, gallerySearch]);

  const handleOpenGalleryModal = () => {
    fetchUserMedia().catch(() => {});
    fetchAiHistory().catch(() => {});
    setIsGalleryModalOpen(true);
  };

  const handlePickFromGallery = (item: UserMediaAsset) => {
    setSourceImage(item.src);
    setLatestResult(null);
    setIsGalleryModalOpen(false);
    showToast(`已从图库载入「${item.name}」，可选择左侧任意风格生成`);
  };

  // 从生成历史中仅重新加载原图（清空已生成结果，便于直接切换左侧其他风格调用）
  const handleReloadOriginalFromHistory = (item: GenerationTask) => {
    const rawImg = item.sourceImage || item.resultUrl || item.resultBase64;
    if (!rawImg) return;
    setSourceImage(rawImg);
    setLatestResult(null);
    if (item.aspectRatio && ["3:4", "4:3", "16:9", "9:16", "1:1"].includes(item.aspectRatio)) {
      setSelectedRatio(item.aspectRatio as AiAspectRatio);
    }
    showToast(`已重新加载原图，现在可点击左侧任意风格应用新效果`);
  };

  const retouchStyle = useMemo(
    () => getRetouchStyleById(selectedStyleId),
    [selectedStyleId]
  );
  const aiStyles = useEditorStore((s) => s.aiStyles);
  const activeStyle = useMemo(
    () => retouchStyle || getStyleById(selectedStyleId, aiStyles),
    [selectedStyleId, retouchStyle, aiStyles]
  );

  const saveUploadedFileToGallery = async (file: File, b64: string) => {
    try {
      const dims = await getImageDimensions(b64).catch(() => ({ width: 1200, height: 1200 }));
      await addMediaAssets([
        {
          name: file.name.replace(/\.[^/.]+$/, "") || "上传原图",
          src: b64,
          width: dims.width,
          height: dims.height,
          aspectRatio: dims.width / (dims.height || 1),
          sizeBytes: file.size,
          category: "upload",
        },
      ]);
    } catch (e) {
      console.warn("Save uploaded image to gallery notice:", e);
    }
  };

  // 构图导出：若用户调整了画框缩放或位移，导出对应裁切区域作为生图输入
  const exportFramedImage = async (
    rawImg: string,
    containerEl: HTMLDivElement | null,
    scale: number,
    ox: number,
    oy: number
  ): Promise<string> => {
    if (scale === 1 && ox === 0 && oy === 0) return rawImg;
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const containerW = containerEl?.clientWidth || 800;
        const containerH = containerEl?.clientHeight || 600;
        const targetAspect = containerW / containerH;

        let outW = 1536;
        let outH = Math.round(1536 / targetAspect);
        if (targetAspect < 1) {
          outH = 1536;
          outW = Math.round(1536 * targetAspect);
        }

        const canvas = document.createElement("canvas");
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(rawImg);

        const imgAspect = img.width / img.height;
        let baseW = containerW;
        let baseH = containerH;
        if (imgAspect > targetAspect) {
          baseW = containerH * imgAspect;
          baseH = containerH;
        } else {
          baseW = containerW;
          baseH = containerW / imgAspect;
        }

        const ratio = outW / containerW;
        const drawW = baseW * scale * ratio;
        const drawH = baseH * scale * ratio;
        const drawX = (outW - drawW) / 2 + ox * ratio;
        const drawY = (outH - drawH) / 2 + oy * ratio;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, outW, outH);
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        resolve(canvas.toDataURL("image/jpeg", 0.95));
      };
      img.onerror = () => resolve(rawImg);
      img.src = rawImg;
    });
  };

  const handleGenerateWithFraming = async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true, "register");
      return;
    }
    if (isGenerating) return;
    let finalSource = sourceImage || undefined;
    if (sourceImage && (zoomScale !== 1 || panOffset.x !== 0 || panOffset.y !== 0)) {
      finalSource = await exportFramedImage(
        sourceImage,
        previewContainerRef.current,
        zoomScale,
        panOffset.x,
        panOffset.y
      );
    }
    generateAiImage({
      sourceImage: finalSource,
      aspectRatio: selectedRatio,
    });
  };

  // 画布拖拽位移与滚轮缩放事件
  const handleImagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isGenerating) return;
    if ((e.target as HTMLElement).closest("button")) return;
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDraggingImage(true);
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startPanX = panOffset.x;
    const startPanY = panOffset.y;

    const onMove = (moveEvt: PointerEvent | MouseEvent) => {
      const dx = moveEvt.clientX - startMouseX;
      const dy = moveEvt.clientY - startMouseY;
      setPanOffset({
        x: Math.round(startPanX + dx),
        y: Math.round(startPanY + dy),
      });
    };

    const onUp = () => {
      setIsDraggingImage(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    setZoomScale((prev) => Math.min(3.0, Math.max(0.6, Number((prev + delta).toFixed(2)))));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      setSourceImage(b64);
      setLatestResult(null);
      saveUploadedFileToGallery(file, b64);
    } catch (err) {
      console.error(err);
    }
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (!isAuthenticated) {
      setAuthModalOpen(true, "register");
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    try {
      const b64 = await fileToBase64(file);
      setSourceImage(b64);
      setLatestResult(null);
      saveUploadedFileToGallery(file, b64);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = (imgUrl?: string, namePrefix?: string) => {
    const target = imgUrl || latestResult || sourceImage;
    if (!target) return;
    const a = document.createElement("a");
    a.href = target;
    // 文件名后缀跟随真实编码，否则相册/米家会判定格式不支持
    a.download = `${namePrefix || activeStyle?.name || "atelier-ai"}-${Date.now()}.${imageExtFromUrl(target)}`;
    a.click();
  };

  const handleSaveToGallery = async () => {
    const target = latestResult || sourceImage;
    if (!target) return;
    try {
      const dims = await getImageDimensions(target).catch(() => ({ width: 1024, height: 1024 }));
      await addMediaAssets([
        {
          name: `AI成片 · ${activeStyle?.name || "精修"}`,
          src: target,
          width: dims.width,
          height: dims.height,
          aspectRatio: dims.width / (dims.height || 1),
          category: "generated",
        },
      ]);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2200);
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return "刚刚";
    try {
      const d = new Date(iso);
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    } catch {
      return "刚刚";
    }
  };

  // 当前展示的图片：如果有生成结果且未按住对比，显示结果图；否则显示原图
  const displayedImage = latestResult && !isHoldingOriginal ? latestResult : sourceImage;

  return (
    <div className="flex-1 w-full h-full bg-white flex overflow-hidden relative select-none">
      {/* 顶部轻提示 Toast */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 bg-gray-950/90 backdrop-blur-md text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 animate-fadeIn pointer-events-none">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 左侧/中央：主创作舞台 */}
      <div className="flex-1 h-full px-4 py-3.5 sm:px-6 sm:py-4 flex flex-col items-center justify-between overflow-y-auto no-scrollbar relative min-w-0">
        {/* 顶部区域：风格介绍卡片 + 生成尺寸设置栏 */}
        <div className="w-full max-w-5xl space-y-2.5 shrink-0">
          {/* 1. 选中的风格介绍卡片 */}
          <div className="w-full bg-gray-50/80 border border-gray-200 rounded-2xl p-3.5 sm:p-4 flex items-center gap-4 transition-all">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              {/* 风格缩略图 */}
              <div className="w-14 h-18 sm:w-16 sm:h-20 rounded-xl overflow-hidden bg-gray-200 border border-gray-300 shrink-0 shadow-2xs">
                <img
                  src={activeStyle?.coverImage || activeStyle?.previewUrl || "/covers/01_dreamy_motion_editorial.webp"}
                  alt={activeStyle?.name}
                  decoding="async"
                  className="w-full h-full object-cover scale-[1.06]"
                />
              </div>

              {/* 风格名称与文案介绍 */}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-base sm:text-[17px] font-extrabold text-gray-950 truncate">
                    {activeStyle?.name || "未指定风格"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-gray-200/80 text-gray-800 text-[11px] font-bold shrink-0">
                    {(activeStyle as any)?.retouchCategoryLabel || activeStyle?.badge || activeStyle?.tags?.[0] || "AI精修"}
                  </span>
                </div>
                <p className="text-xs sm:text-[13px] text-gray-700 font-medium leading-relaxed line-clamp-1">
                  {activeStyle?.description || "一键应用大师级 AI 质感修图"}
                </p>
                <p className="text-[11px] text-gray-400 font-mono truncate hidden sm:block">
                  提示词：{(activeStyle as any)?.rawPrompt || activeStyle?.tags?.join(" · ")}
                </p>
              </div>
            </div>
          </div>

          {/* 2. 生成尺寸设置（日常尺寸选项 + 比例缩略图） */}
          <div className="w-full bg-white border border-gray-200 rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-gray-900 tracking-tight">
                生成尺寸设置
              </span>
              <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                默认 3:4 竖屏 · 切换自动适配画幅
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {ASPECT_RATIO_OPTIONS.map((opt) => {
                const isSelected = selectedRatio === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedRatio(opt.id)}
                    className={`group flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-gray-950 border-gray-950 text-white shadow-xs"
                        : "bg-gray-50/90 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-950"
                    }`}
                  >
                    {/* 尺寸缩略图 (带画面小山与太阳的几何比例缩略图) */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? "bg-white/15" : "bg-white border border-gray-200/80"
                      }`}
                    >
                      <div
                        style={{ width: `${opt.thumbW}px`, height: `${opt.thumbH}px` }}
                        className={`rounded-[3px] border-[1.5px] relative overflow-hidden flex items-end justify-center transition-colors ${
                          isSelected
                            ? "border-emerald-400 bg-emerald-400/20"
                            : "border-gray-500 bg-gray-100 group-hover:border-gray-800"
                        }`}
                      >
                        {/* 缩略图内部微型太阳与山峰剪影 */}
                        <span
                          className={`absolute top-[2px] right-[2px] w-[3px] h-[3px] rounded-full ${
                            isSelected ? "bg-emerald-300" : "bg-gray-400"
                          }`}
                        />
                        <svg
                          viewBox="0 0 16 8"
                          className={`w-full h-[5px] ${
                            isSelected ? "text-emerald-400/75" : "text-gray-400/80"
                          }`}
                          fill="currentColor"
                          preserveAspectRatio="none"
                        >
                          <path d="M0 8L5 2L9 6L12 3.5L16 8H0Z" />
                        </svg>
                      </div>
                    </div>

                    {/* 比例文字与描述 */}
                    <div className="leading-tight pr-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-extrabold tracking-tight">
                          {opt.label}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-medium block ${
                          isSelected ? "text-gray-300" : "text-gray-400"
                        }`}
                      >
                        {opt.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 只读速览提示条 */}
        {!isAuthenticated && (
          <div className="mx-auto mb-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs font-semibold flex items-center gap-2 shadow-xs shrink-0 animate-fadeIn">
            <Eye className="w-3.5 h-3.5 text-amber-600" />
            <span>AI 修图只读速览中 · 浏览质感风格与提示词 · 注册登录开启专属修图</span>
            <button
              onClick={() => setAuthModalOpen(true, "register")}
              className="ml-1 px-2.5 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold cursor-pointer transition-all active:scale-95"
            >
              立即注册
            </button>
          </div>
        )}

        {/* 中部核心区域：默认 3:4 竖屏图片尺寸（随所选尺寸实时变化） */}
        {!sourceImage ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDraggingOver(true);
            }}
            onDragLeave={() => setIsDraggingOver(false)}
            onDrop={handleDrop}
            onClick={() => {
              if (!isAuthenticated) {
                setAuthModalOpen(true, "register");
                return;
              }
              fileInputRef.current?.click();
            }}
            style={{
              width: currentRatioOption.emptyWidth,
              height: currentRatioOption.emptyHeight,
              maxWidth: "100%",
            }}
            className={`my-auto shrink-0 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center px-6 py-8 text-center cursor-pointer transition-all duration-300 relative ${
              isDraggingOver
                ? "border-gray-950 bg-gray-50 scale-[1.01]"
                : "border-gray-300 bg-white hover:border-gray-900 hover:bg-gray-50/60"
            }`}
          >
            {/* 顶部当前画幅尺寸角标 */}
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>
                {currentRatioOption.label} · {currentRatioOption.desc}
              </span>
            </div>

            <div className="relative mb-5">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#22C55E] text-white flex items-center justify-center text-base font-extrabold shadow-sm">
                +
              </div>
            </div>

            <p className="text-base sm:text-lg text-gray-900 font-extrabold mb-1.5 tracking-tight">
              上传照片，切换风格自动保留
            </p>
            <p className="text-xs sm:text-[13px] text-gray-500 mb-6 leading-relaxed max-w-[300px]">
              支持 JPG / PNG / WebP 原图，默认 {currentRatioOption.label} {currentRatioOption.desc}尺寸，自动归档至「图库」
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAuthenticated) {
                    setAuthModalOpen(true, "register");
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 whitespace-nowrap"
              >
                <Upload className="w-4 h-4" />
                <span>上传图片</span>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenGalleryModal();
                }}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition-all whitespace-nowrap"
              >
                <Images className="w-4 h-4 text-gray-700" />
                <span>从图库选图</span>
              </button>
            </div>
          </div>
        ) : (
          /* 已载入图片（含：待生成 / 正在模糊动态生成中 / 已生成完成按住对比） */
          <div className="my-auto flex flex-col items-center justify-center relative w-full">
            <div
              ref={previewContainerRef}
              onPointerDown={handleImagePointerDown}
              onWheel={handleWheelZoom}
              style={{
                width: currentRatioOption.previewWidth,
                height: currentRatioOption.previewHeight,
                maxWidth: "100%",
              }}
              className={`relative shrink-0 rounded-3xl overflow-hidden border border-gray-200 shadow-xl bg-gray-100 select-none group transition-all duration-300 flex items-center justify-center ${
                isDraggingImage ? "cursor-grabbing" : "cursor-grab"
              }`}
            >
              <div className="w-full h-full overflow-hidden relative flex items-center justify-center pointer-events-none">
                <img
                  src={displayedImage || sourceImage}
                  alt="Stage Preview"
                  draggable={false}
                  onLoad={(e) => {
                    const nw = e.currentTarget.naturalWidth;
                    const nh = e.currentTarget.naturalHeight;
                    if (nw && nh) {
                      setImgNaturalAspect(nw / nh);
                    }
                  }}
                  style={{
                    width: imgNaturalAspect < currentFrameAspect ? "100%" : "auto",
                    height: imgNaturalAspect < currentFrameAspect ? "auto" : "100%",
                    maxWidth: "none",
                    maxHeight: "none",
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomScale})`,
                    transformOrigin: "center center",
                    transition: isDraggingImage ? "none" : "transform 0.1s ease-out",
                  }}
                  className={`select-none shrink-0 ${
                    isGenerating ? "blur-xl scale-105 brightness-90" : "blur-0"
                  }`}
                />
              </div>

              {/* 悬浮画框缩放与位移构图工具栏 */}
              <div
                className="absolute bottom-3.5 left-3.5 z-20 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-black/65 hover:bg-black/85 backdrop-blur-md border border-white/20 text-white shadow-lg transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.max(0.6, Number((z - 0.1).toFixed(2))))}
                  className="w-6 h-6 rounded-lg hover:bg-white/20 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                  title="缩小图片"
                >
                  -
                </button>
                <span className="text-[11px] font-mono font-bold px-1 select-none min-w-[34px] text-center">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.min(3.0, Number((z + 0.1).toFixed(2))))}
                  className="w-6 h-6 rounded-lg hover:bg-white/20 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
                  title="放大图片"
                >
                  +
                </button>

                {(zoomScale !== 1 || panOffset.x !== 0 || panOffset.y !== 0) && (
                  <>
                    <div className="w-[1px] h-3.5 bg-white/30 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => {
                        setZoomScale(1);
                        setPanOffset({ x: 0, y: 0 });
                      }}
                      className="text-[10px] font-bold text-gray-200 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/20 transition-colors cursor-pointer"
                      title="重置缩放与位移，恢复默认居中"
                    >
                      重置
                    </button>
                  </>
                )}

                <span className="text-[10px] text-white/60 hidden sm:inline pl-1 border-l border-white/20 select-none">
                  拖动位移 · 滚轮缩放
                </span>
              </div>

              {/* 左上角实时标签：原图 vs AI 成片 */}
              <div className="absolute top-3.5 left-3.5 z-10 pointer-events-none">
                {!latestResult || isHoldingOriginal ? (
                  <div className="px-3 py-1 rounded-lg bg-black/65 backdrop-blur-xs text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>{isHoldingOriginal ? "对比中：原图 RAW" : "已载入原图 RAW"}</span>
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-lg bg-black/65 backdrop-blur-xs text-white text-xs font-bold flex items-center gap-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>AI 成片 · {activeStyle?.name}</span>
                  </div>
                )}
              </div>

              {/* 右上角实时尺寸标签 */}
              <div className="absolute top-3.5 right-3.5 z-10 pointer-events-none">
                <div className="px-2.5 py-1 rounded-lg bg-black/55 backdrop-blur-xs text-white text-[11px] font-bold shadow-xs">
                  {currentRatioOption.label} · {currentRatioOption.desc}
                </div>
              </div>

              {/* 生成完成后的右下角悬浮按住对比图标按钮 */}
              {latestResult && !isGenerating && (
                <button
                  type="button"
                  id="hold-compare-icon-btn"
                  title="按住对比原图"
                  aria-label="按住对比原图"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    startHoldingOriginal();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    startHoldingOriginal();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    startHoldingOriginal();
                  }}
                  className={`absolute bottom-3.5 right-3.5 z-20 w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center shadow-lg transition-all cursor-pointer select-none ${
                    isHoldingOriginal
                      ? "bg-white text-gray-950 border-white scale-90 ring-4 ring-white/30"
                      : "bg-black/55 hover:bg-black/75 text-white border-white/20 hover:scale-105 active:scale-95"
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 5H6.5C5.39543 5 4.5 5.89543 4.5 7V17C4.5 18.1046 5.39543 19 6.5 19H9V5Z"
                      fill="currentColor"
                    />
                    <line
                      x1="12"
                      y1="3.5"
                      x2="12"
                      y2="20.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M15 5H17.5C18.6046 5 19.5 5.89543 19.5 7V17C19.5 18.1046 18.6046 19 17.5 19H15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}

              {/* 生成时的模糊动态显示遮罩 */}
              {isGenerating && (
                <div className="absolute inset-0 z-20 bg-white/25 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                  <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-white/60 border-t-emerald-500 animate-spin shadow-xs" />
                    <div className="w-11 h-11 rounded-full bg-white/95 text-emerald-600 flex items-center justify-center shadow-md border border-white/90 backdrop-blur-sm">
                      <Sparkles className="w-5 h-5 animate-pulse text-emerald-600" />
                    </div>
                  </div>
                  <p className="text-sm sm:text-base font-extrabold text-gray-950 tracking-tight mb-1">
                    AI 正在深度渲染「{activeStyle?.name}」...
                  </p>
                  <p className="text-xs text-gray-700 font-medium max-w-xs">
                    正在重构光影层次与细腻质感，请稍候片刻
                  </p>
                </div>
              )}
            </div>

            {/* 底部操作栏：未生成 vs 已生成 */}
            {!latestResult ? (
              <div className="mt-3.5 flex items-center flex-wrap justify-center gap-2.5">
                <button
                  onClick={handleOpenGalleryModal}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Images className="w-3.5 h-3.5 text-gray-700" />
                  <span>从图库选图</span>
                </button>

                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      setAuthModalOpen(true, "register");
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>上传新图</span>
                </button>

                <button
                  disabled={isGenerating}
                  onClick={handleGenerateWithFraming}
                  className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Wand2 className="w-4 h-4 text-emerald-400" />
                  <span>{isGenerating ? "正在处理中..." : `立即应用「${activeStyle?.name}」(${selectedRatio})`}</span>
                </button>
              </div>
            ) : (
              /* 生成完成后的操作条：保存到图库 + 下载 + 用原图换风格 + 重新生成 + 从图库换图 + 上传新图 */
              <div className="mt-3.5 flex items-center flex-wrap justify-center gap-2 bg-white border border-gray-200 rounded-2xl px-3.5 py-2 shadow-sm">
                <button
                  onClick={handleSaveToGallery}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    savedToast
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-900 hover:bg-black text-white"
                  }`}
                >
                  {savedToast ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>已保存到图库</span>
                    </>
                  ) : (
                    <>
                      <FolderHeart className="w-3.5 h-3.5 text-emerald-400" />
                      <span>保存到图库</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleDownload(latestResult, activeStyle?.name)}
                  className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>下载图片</span>
                </button>

                <button
                  onClick={() => {
                    setLatestResult(null);
                    showToast("已切回原图底图，可在左侧选择任意其他风格生成");
                  }}
                  className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="恢复为此照片原图，方便在左侧切换其他修图效果"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>加载原图换效果</span>
                </button>

                <div className="h-4 w-[1px] bg-gray-200 mx-0.5" />

                <button
                  disabled={isGenerating}
                  onClick={handleGenerateWithFraming}
                  className="px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
                  <span>{isGenerating ? "正在处理中..." : "重新生成"}</span>
                </button>

                <button
                  onClick={handleOpenGalleryModal}
                  className="px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="从图库中选择其他图片进行修图"
                >
                  <Images className="w-3.5 h-3.5 text-gray-700" />
                  <span>从图库换图</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="从本地电脑上传新图片"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>本地上传</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="shrink-0 h-2" />
      </div>

      {/* 右侧：生成历史栏（可重复调用显示） */}
      <aside className="hidden lg:flex w-68 h-full border-l border-gray-200 bg-gray-50/50 flex-col shrink-0 select-none">
        <div className="px-4 py-3.5 border-b border-gray-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-900" />
            <h3 className="text-xs font-extrabold text-gray-950 tracking-tight">
              生成历史
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[11px] font-bold">
            {aiHistory.length} 条
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar">
          {aiHistory.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center px-4">
              <div className="w-11 h-11 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-gray-700 mb-1">
                暂无生成历史
              </p>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                每次 AI 修图或风格化生成的结果都会保存在这里，点击即可随时调出对比与下载
              </p>
            </div>
          ) : (
            <>
              {visibleHistory.map((item) => {
              const resultImg = item.resultUrl || item.resultBase64 || "";
              const isCurrent = Boolean(latestResult && resultImg && latestResult === resultImg);
              const isOriginalActive = Boolean(
                !latestResult && sourceImage && item.sourceImage && sourceImage === item.sourceImage
              );
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    loadTaskToWorkbench({
                      styleId: item.styleId,
                      sourceImage: item.sourceImage || sourceImage || undefined,
                      resultUrl: resultImg,
                      aspectRatio: item.aspectRatio,
                    });
                  }}
                  className={`group relative rounded-xl p-2 bg-white border transition-all cursor-pointer flex items-center gap-3 ${
                    isCurrent
                      ? "border-gray-950 ring-2 ring-gray-950/10 shadow-xs"
                      : isOriginalActive
                      ? "border-blue-600 ring-2 ring-blue-600/10 shadow-xs"
                      : "border-gray-200 hover:border-gray-400 hover:shadow-xs"
                  }`}
                >
                  <div className="w-14 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 relative">
                    {resultImg ? (
                      <img
                        src={item.thumbUrl || thumbOf(resultImg, 160)}
                        alt={item.styleName}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                        无预览
                      </div>
                    )}
                    {isCurrent && (
                      <div className="absolute bottom-0 inset-x-0 bg-gray-950/80 text-white text-[9px] font-bold text-center py-0.5">
                        当前显示
                      </div>
                    )}
                    {!isCurrent && isOriginalActive && (
                      <div className="absolute bottom-0 inset-x-0 bg-blue-600/90 text-white text-[9px] font-bold text-center py-0.5">
                        原图已载入
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-extrabold text-gray-900 truncate">
                        {item.styleName || "AI 修图"}
                      </p>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-medium">
                      {formatTime(item.createdAt)}
                    </p>
                    <div className="mt-1.5 flex items-center flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadTaskToWorkbench({
                            styleId: item.styleId,
                            sourceImage: item.sourceImage || sourceImage || undefined,
                            resultUrl: resultImg,
                            aspectRatio: item.aspectRatio,
                          });
                        }}
                        className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                        title="调出此条历史生成结果"
                      >
                        调出成片
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReloadOriginalFromHistory(item);
                        }}
                        className="text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-0.5"
                        title="重新加载这张照片的原图，以便点击左侧调用其他风格效果"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>加载原图</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(resultImg, item.styleName);
                        }}
                        className="text-[10px] font-bold text-gray-600 hover:text-gray-950 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                        title="下载此历史结果"
                      >
                        下载
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAiHistoryItem(item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer shrink-0"
                    title="删除此条记录"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                );
              })}

              {(hiddenHistoryCount > 0 ||
                visibleHistoryCount > HISTORY_PAGE_SIZE) && (
                <div className="pt-1 space-y-1.5">
                  {hiddenHistoryCount > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleHistoryCount((count) => count + HISTORY_PAGE_SIZE)
                      }
                      className="w-full py-2 rounded-xl bg-white border border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-[11px] font-bold text-gray-700 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title={`再加载 ${Math.min(
                        HISTORY_PAGE_SIZE,
                        hiddenHistoryCount
                      )} 次更早的生成记录`}
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>展开更多（还剩 {hiddenHistoryCount} 次）</span>
                    </button>
                  )}
                  {visibleHistoryCount > HISTORY_PAGE_SIZE && (
                    <button
                      type="button"
                      onClick={() => setVisibleHistoryCount(HISTORY_PAGE_SIZE)}
                      className="w-full py-1.5 rounded-xl text-[11px] font-bold text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="折叠回最近 10 次"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>收起，只看最近 10 次</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* 从图库选择图片弹窗 (支持更换图片时直接从图库选图) */}
      {isGalleryModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
          onClick={() => setIsGalleryModalOpen(false)}
        >
          <div
            className="w-full max-w-4xl max-h-[82vh] bg-white rounded-3xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 弹窗头部 */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-900">
                  <Images className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-950">
                    从图库选择图片
                  </h3>
                  <p className="text-xs text-gray-500">
                    点击任意照片即可载入画布作为底图，自由应用左侧修图与风格化效果
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => {
                    setIsGalleryModalOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>上传本地新图</span>
                </button>

                <button
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-950 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 弹窗筛选与搜索条 */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center justify-between flex-wrap gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGalleryTab("all")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    galleryTab === "all"
                      ? "bg-gray-950 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:text-gray-950"
                  }`}
                >
                  全部图片 ({galleryItems.length})
                </button>
                <button
                  onClick={() => setGalleryTab("upload")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    galleryTab === "upload"
                      ? "bg-gray-950 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:text-gray-950"
                  }`}
                >
                  上传与历史原图 ({galleryItems.filter((i) => i.category === "upload").length})
                </button>
                <button
                  onClick={() => setGalleryTab("generated")}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    galleryTab === "generated"
                      ? "bg-gray-950 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:text-gray-950"
                  }`}
                >
                  AI 生成成片 ({galleryItems.filter((i) => i.category === "generated").length})
                </button>
              </div>

              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={gallerySearch}
                  onChange={(e) => setGallerySearch(e.target.value)}
                  placeholder="搜索图片名称..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-900"
                />
                {gallerySearch && (
                  <button
                    onClick={() => setGallerySearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* 弹窗图片网格 */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              {filteredGalleryItems.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 mb-3">
                    <FolderOpen className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-extrabold text-gray-800 mb-1">
                    图库中暂无匹配的图片
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    您可以直接点击右上角「上传本地新图」添加照片
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
                  {filteredGalleryItems.map((item) => {
                    const isSelected = sourceImage === item.src;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handlePickFromGallery(item)}
                        className={`group relative rounded-2xl overflow-hidden border bg-white cursor-pointer transition-all hover:shadow-lg flex flex-col ${
                          isSelected
                            ? "border-gray-950 ring-2 ring-gray-950"
                            : "border-gray-200 hover:border-gray-950"
                        }`}
                      >
                        <div className="aspect-3/4 w-full bg-gray-100 relative overflow-hidden">
                          <img
                            src={thumbOf(item.src, 480)}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2">
                            {item.category === "generated" ? (
                              <span className="px-2 py-0.5 rounded-md bg-black/75 text-emerald-400 text-[10px] font-bold">
                                AI成片
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-blue-600/85 text-white text-[10px] font-bold">
                                原图
                              </span>
                            )}
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                            <span className="px-3.5 py-1.5 rounded-xl bg-white text-gray-950 text-xs font-extrabold shadow-md">
                              选择此图
                            </span>
                          </div>
                        </div>
                        <div className="p-2.5 bg-white border-t border-gray-100">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {item.name}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
