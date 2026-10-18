import React, { useState, useRef, useCallback } from "react";
import { useEditorStore } from "../../../store/useEditorStore";
import { apiGenerateStylizedImage } from "../../../lib/api";
import { fileToBase64 } from "../../../lib/utils";
import {
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Download,
  FolderPlus,
  Layers,
  BookPlus,
  Eye,
  Sliders,
  X,
  AlertCircle,
  HelpCircle,
  Maximize2,
  ArrowRight,
  Star,
  StarOff,
  Copy,
} from "lucide-react";
import { Button } from "../../ui/Button";
import { MediaPickerModal } from "./MediaPickerModal";
import { AiImageLightboxModal } from "./AiImageLightboxModal";
import { AspectRatioThumbnail } from "../../ui/AspectRatioThumbnail";
import { IMAGE_RATIOS } from "../../../lib/ai-styles";
import { ImageAspectRatio } from "../../../types/ai";

// 预设提示词灵感药丸
const PROMPT_INSPIRATIONS = [
  { label: "🎬 电影慢门叙事光影", prompt: "电影级慢门摄影，温暖暮色漫反射光，高级冷暖对比，细腻胶片颗粒感，大师级构图，8k 高清" },
  { label: "🎨 先锋杂志拼贴艺术", prompt: "前卫时尚杂志封面风格，几何留白排版，现代波普拼贴，高对比度，色彩纯净饱满" },
  { label: "🌆 赛博霓虹街头先锋", prompt: "赛博朋克夜市街道，雨后湿润倒影，青蓝色与品红色霓虹光芒，未来科技感与复古机械融合" },
  { label: "🌾 日系温暖胶片手帐", prompt: "富士色彩风格，日光通透微暖，奶油色调柔和散景，清新生活随笔手账感" },
  { label: "✒️ 黑白粗线条潮酷插画", prompt: "先锋黑白手绘墨线，鲜明手绘速写轮廓，大胆纯黑阴影与白色负空间，涂鸦街头感" },
  { label: "🌸 梦幻水彩诗意插画", prompt: "透明水彩晕染，柔和边缘光晕，诗意漫步氛围，梦幻漂浮花瓣与微光" },
  { label: "📸 高定秀场时装大片", prompt: "巴黎时装周秀场大片，硬核打光，高质感面料肌理，极简高级冷淡风" },
  { label: "🏛️ 新中式水墨意境", prompt: "当代新中式水墨艺术，宣纸肌理微凹，苍茫远山雾霭，朱砂印章点缀，东方诗学" },
];



/**
 * 将多张图片智能拼合成一张高质量参考画布底图
 */
async function combineMultipleImages(images: string[]): Promise<string> {
  if (images.length === 0) return "";
  if (images.length === 1) return images[0];

  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const cols = images.length <= 2 ? 2 : images.length <= 4 ? 2 : 3;
    const rows = Math.ceil(images.length / cols);
    const cellW = 512;
    const cellH = 512;
    canvas.width = cols * cellW;
    canvas.height = rows * cellH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(images[0]);

    ctx.fillStyle = "#F8F6F0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let loaded = 0;
    images.forEach((src, idx) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const x = col * cellW;
        const y = row * cellH;
        // 居中裁切等比填充
        let sx = 0, sy = 0, sw = img.width, sh = img.height;
        const sAspect = img.width / img.height;
        if (sAspect > 1) {
          sw = img.height;
          sx = (img.width - sw) / 2;
        } else {
          sh = img.width;
          sy = (img.height - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, x + 4, y + 4, cellW - 8, cellH - 8);
        loaded++;
        if (loaded === images.length) {
          resolve(canvas.toDataURL("image/jpeg", 0.92));
        }
      };
      img.onerror = () => {
        loaded++;
        if (loaded === images.length) {
          resolve(canvas.toDataURL("image/jpeg", 0.92));
        }
      };
      img.src = src;
    });
  });
}

export const AiImageEditorStudio: React.FC = () => {
  const currentUser = useEditorStore((s) => s.currentUser);
  const addMediaAssets = useEditorStore((s) => s.addMediaAssets);
  const applyStylizedImage = useEditorStore((s) => s.applyStylizedImageToCanvas);
  const addSpreadToAlbum = useEditorStore((s) => s.addSpreadToAlbum);
  const currentAlbumId = useEditorStore((s) => s.currentAlbumId);
  const albums = useEditorStore((s) => s.albums);
  const setAdminModalOpen = useEditorStore((s) => s.setAdminModalOpen);

  // 上传的参考图片列表 (支持 1 ~ 6 张，默认空)
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [primaryImageIdx, setPrimaryImageIdx] = useState<number>(0);

  // 提示词输入与参数
  const [prompt, setPrompt] = useState<string>(
    "将人物置于浪漫的黄昏海滩，温暖柔和的金色侧逆光，微风吹拂发丝，唯美胶片画质，电影感故事氛围，8k 高清细节"
  );
  const [negativePrompt, setNegativePrompt] = useState<string>("模糊, 畸变, 低质, 水印, 割裂, 杂乱背景");
  const [showNegative, setShowNegative] = useState<boolean>(false);
  const [selectedRatio, setSelectedRatio] = useState<ImageAspectRatio>("3:4");
  const [creativityLevel, setCreativityLevel] = useState<"faithful" | "balanced" | "imaginative">("balanced");

  // 生成状态与结果
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 模态框控制
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件上传 (支持多选)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];
    for (let i = 0; i < Math.min(files.length, 6); i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        const base64 = await fileToBase64(file);
        newImages.push(base64);
      }
    }

    if (newImages.length > 0) {
      setUploadedImages((prev) => [...prev, ...newImages].slice(0, 6));
    }
    e.target.value = "";
  };

  // 移除单张参考图片
  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);
      if (primaryImageIdx >= updated.length) {
        setPrimaryImageIdx(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  };

  // 点击灵感药丸添加提示词
  const handleAppendInspiration = (text: string) => {
    setPrompt((prev) => (prev ? `${prev}，${text}` : text));
  };

  // 触发 AI 生成
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setErrorMessage("请输入描述画面创意的提示词");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setStatusMessage("正在解析参考图片与视觉特征...");

    try {
      // 1. 合并多张参考图片为高质量底图
      let finalSourceImage = "";
      if (uploadedImages.length > 0) {
        setStatusMessage(uploadedImages.length > 1 ? "正在将多张参考图片进行融合编码..." : "正在编码参考图像...");
        finalSourceImage = await combineMultipleImages(uploadedImages);
      }

      // 2. 组装增强提示词 (注入负面词与创意级别指令)
      let fullPrompt = prompt.trim();
      if (creativityLevel === "faithful") {
        fullPrompt += "，严格保留原参考人物轮廓与主体核心构图，仅重塑光影细节与画风";
      } else if (creativityLevel === "imaginative") {
        fullPrompt += "，大胆艺术重构，梦幻超现实色彩流转，视觉张力饱满";
      }

      if (negativePrompt.trim()) {
        fullPrompt += ` --no ${negativePrompt.trim()}`;
      }

      setStatusMessage("AI 图像模型深度生成中，这通常需要 5~15 秒...");

      // 3. 调用后端真实的 /api/ai/generate
      const res = await apiGenerateStylizedImage({
        prompt: fullPrompt,
        styleId: "custom_editor",
        styleName: "AI 自由图像编辑",
        sourceImage: finalSourceImage,
        aspectRatio: selectedRatio,
        userId: currentUser?.id,
      });

      if (res.success && res.image) {
        setGeneratedImage(res.image);
        setStatusMessage("生成完毕！已为您呈现全新艺术重构大片。");

        // 自动保存到用户素材库
        addMediaAssets([
          {
            name: `AI自由生成 · ${prompt.slice(0, 16)}`,
            src: res.image,
            width: 1024,
            height: 1024,
          },
        ]).catch(() => {});
      } else if (res.needsConfig) {
        setErrorMessage("平台尚未配置 AI 图像模型 API Key，请联系管理员在系统后台配置后即可直接生成。");
      } else {
        setErrorMessage(res.message || "生成遇到问题，请重试或修改提示词");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "网络请求异常，请检查后端服务连接");
    } finally {
      setIsGenerating(false);
    }
  };

  // 放入当前拼图画布
  const handleApplyToCanvas = async () => {
    if (!generatedImage) return;
    await applyStylizedImage(generatedImage, "add");
  };

  // 收录入相册画册
  const handleAddToAlbum = () => {
    if (!generatedImage) return;
    const targetAlbum = albums.find((a) => a.id === currentAlbumId) || albums[0];
    if (targetAlbum) {
      addSpreadToAlbum(targetAlbum.id, {
        id: "spread_" + Date.now(),
        title: "AI 自由编辑大片",
        createdAt: Date.now(),
        leftPage: {
          id: "page_left_" + Date.now(),
          layoutType: "full",
          image: generatedImage,
          title: "AI 创意重构",
          subtitle: prompt.slice(0, 20),
        },
        rightPage: {
          id: "page_right_" + Date.now(),
          layoutType: "journal",
          image: uploadedImages[0] || "",
          title: "灵感手札",
          bodyText: `创意提示词：${prompt}`,
        },
      });
      alert("已将生成的艺术大片作为新对开页收录入《" + targetAlbum.title + "》画册！");
    }
  };

  // 下载高清图片
  const handleDownload = () => {
    if (!generatedImage) return;
    const a = document.createElement("a");
    a.href = generatedImage;
    a.download = `atelier-ai-edit-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col lg:flex-row overflow-hidden select-none bg-studio-bg animate-fadeIn">
      {/* 隐藏的本地图片上传 input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp,image/jpg"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* ══════════════════════════════════════════════════════════════════
       * 左侧：多图上传与参数配置控制台 (Scrollable Workspace Cockpit)
       * ══════════════════════════════════════════════════════════════════ */}
      <div className="w-full lg:w-[460px] xl:w-[500px] h-full flex flex-col border-r border-studio-border bg-studio-card/40 shrink-0 overflow-y-auto no-scrollbar p-5 space-y-5">
        {/* 控制台顶部标头 */}
        <div className="space-y-1 pb-3 border-b border-studio-border/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-500">
                <Wand2 className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-studio-text tracking-tight font-serif">
                AI 自由图片编辑
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-semibold border border-blue-500/20">
              API 图生图 / 多图融合
            </span>
          </div>
          <p className="text-xs text-studio-muted leading-relaxed">
            上传一张或多张真实照片作为构图/意境参考，输入创意提示词，调用 AI 大模型重塑视觉表达。
          </p>
        </div>

        {/* ── 1. 多图参考素材池 (Multiple Reference Images) ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-studio-text flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              参考底图素材 ({uploadedImages.length}/6)
            </span>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setIsMediaPickerOpen(true)}
                className="text-blue-500 hover:underline cursor-pointer"
              >
                从素材库挑选
              </button>
              {uploadedImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setUploadedImages([])}
                  className="text-studio-muted hover:text-red-400 cursor-pointer"
                >
                  清空
                </button>
              )}
            </div>
          </div>

          {/* 图片卡片流 + 添加卡片 */}
          {uploadedImages.length === 0 ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-5 px-4 rounded-2xl border-2 border-dashed border-studio-border hover:border-blue-500 hover:bg-blue-50/5 dark:hover:bg-blue-950/20 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer text-studio-muted hover:text-blue-500 group"
            >
              <div className="w-9 h-9 rounded-xl bg-studio-panel border border-studio-border flex items-center justify-center text-studio-muted group-hover:text-blue-500 group-hover:scale-105 transition-all">
                <Upload className="w-4 h-4" />
              </div>
              <div className="text-center leading-tight">
                <div className="text-xs font-semibold text-studio-text group-hover:text-blue-500">点击上传参考照片</div>
                <div className="text-[10px] text-studio-muted mt-1">支持多选或从右上角素材库挑选，最多 6 张（可选）</div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5">
              {uploadedImages.map((src, idx) => {
                const isPrimary = idx === primaryImageIdx;
                return (
                  <div
                    key={idx}
                    onClick={() => setPrimaryImageIdx(idx)}
                    className={`group relative aspect-square rounded-xl overflow-hidden border cursor-pointer transition-all ${
                      isPrimary
                        ? "ring-2 ring-blue-500 border-blue-500 shadow-sm"
                        : "border-studio-border hover:border-blue-400/60"
                    }`}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover" />

                    {/* 悬停与角标 */}
                    <div className="absolute top-1 left-1 z-10">
                      {isPrimary ? (
                        <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-blue-600 text-white shadow-xs flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" /> 主图
                        </span>
                      ) : (
                        <span className="px-1 py-0.2 rounded text-[8px] font-mono bg-black/60 text-white/80">
                          #{idx + 1}
                        </span>
                      )}
                    </div>

                    {/* 悬停删除 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(idx);
                      }}
                      className="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/40 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
                      title="移除此图"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                  </div>
                );
              })}

              {/* 上传新增按钮 */}
              {uploadedImages.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed border-studio-border hover:border-blue-500 hover:bg-blue-50/5 dark:hover:bg-blue-950/20 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer text-studio-muted hover:text-blue-500"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-[10px] font-medium">继续添加</span>
                </button>
              )}
            </div>
          )}
          <p className="text-[10px] font-mono text-studio-muted/80">
            💡 支持单张主体重绘，或上传多张图片进行多主体/背景融合重构。
          </p>
        </div>

        {/* ── 2. 创意提示词编辑区 (Prompt Editor) ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-studio-text flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              创意提示词 (Prompt)
            </span>
            <span className="text-[10px] font-mono text-studio-muted">{prompt.length} 字</span>
          </div>

          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="请输入你想生成的场景、光影、画面细节或艺术意境..."
              rows={4}
              className="w-full bg-studio-panel/80 border border-studio-border focus:border-blue-500 rounded-xl p-3 text-xs text-studio-text placeholder:text-studio-muted/60 focus:outline-none transition-colors resize-none leading-relaxed"
            />
            {prompt && (
              <button
                type="button"
                onClick={() => setPrompt("")}
                className="absolute top-2.5 right-2.5 text-studio-muted hover:text-studio-text p-1"
                title="清空提示词"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* 快捷灵感药丸 */}
          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-mono text-studio-muted">点击追加灵感风格词：</span>
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_INSPIRATIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAppendInspiration(item.prompt)}
                  className="px-2 py-1 rounded-lg text-[10px] bg-studio-panel hover:bg-blue-50/10 hover:text-blue-500 border border-studio-border hover:border-blue-400/40 text-studio-muted transition-all cursor-pointer whitespace-nowrap"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 负面提示词展开开关 */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowNegative(!showNegative)}
              className="text-[11px] text-studio-muted hover:text-studio-text flex items-center gap-1 cursor-pointer font-mono"
            >
              <span>{showNegative ? "收起过滤词 (Negative Prompt)" : "+ 展开画面过滤词"}</span>
            </button>
            {showNegative && (
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="例如：模糊, 畸变, 杂乱背景, 低质..."
                className="w-full mt-1.5 bg-studio-panel/60 border border-studio-border rounded-lg px-3 py-1.5 text-[11px] text-studio-text focus:outline-none focus:border-blue-500"
              />
            )}
          </div>
        </div>

        {/* ── 3. 画幅比例 ── */}
        <div className="space-y-3 pt-2 border-t border-studio-border/70">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-studio-text flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-blue-500" />
                画幅比例
              </span>
              <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                {selectedRatio}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-studio-panel rounded-2xl border border-studio-border">
              {IMAGE_RATIOS.map((r) => {
                const isSelected = selectedRatio === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRatio(r.id)}
                    className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border group ${
                      isSelected
                        ? "bg-[#2563EB] text-white font-bold border-[#2563EB] shadow-xs ring-2 ring-[#2563EB]/25"
                        : "bg-studio-card border-studio-border/70 text-studio-text hover:border-[#2563EB]/40 hover:bg-studio-hover"
                    }`}
                    title={r.label}
                  >
                    <AspectRatioThumbnail ratioId={r.id} isSelected={isSelected} size="md" />
                    <div className="text-center leading-none">
                      <div className={`text-[11px] font-mono font-bold ${isSelected ? "text-gray-900" : "text-studio-text"}`}>
                        {r.label}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 引导强度 / 创意自由度 */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-studio-text">创意自由度 / 原图贴合度</span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setCreativityLevel("faithful")}
                className={`py-1.5 px-2 rounded-lg border text-center text-[11px] transition-all cursor-pointer ${
                  creativityLevel === "faithful"
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-studio-panel text-studio-muted hover:text-studio-text border-studio-border"
                }`}
              >
                构图优先
              </button>
              <button
                type="button"
                onClick={() => setCreativityLevel("balanced")}
                className={`py-1.5 px-2 rounded-lg border text-center text-[11px] transition-all cursor-pointer ${
                  creativityLevel === "balanced"
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-studio-panel text-studio-muted hover:text-studio-text border-studio-border"
                }`}
              >
                平衡重构 (推荐)
              </button>
              <button
                type="button"
                onClick={() => setCreativityLevel("imaginative")}
                className={`py-1.5 px-2 rounded-lg border text-center text-[11px] transition-all cursor-pointer ${
                  creativityLevel === "imaginative"
                    ? "bg-blue-600 text-white font-bold"
                    : "bg-studio-panel text-studio-muted hover:text-studio-text border-studio-border"
                }`}
              >
                概念发散
              </button>
            </div>
          </div>
        </div>

        {/* ── 4. 提交生成大按钮 ── */}
        <div className="pt-2 space-y-2">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-1">
                <p>{errorMessage}</p>
                {errorMessage.includes("API Key") && (
                  <button
                    type="button"
                    onClick={() => setAdminModalOpen(true, "ai_config")}
                    className="text-[11px] font-bold text-blue-500 hover:underline cursor-pointer block mt-1"
                  >
                    前往管理后台配置 API Key →
                  </button>
                )}
              </div>
            </div>
          )}

          <Button
            variant="accent"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>AI 正在全力重塑生成中...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>调用 API 开始 AI 图像生成</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
       * 右侧：高保真结果大画幅舞台 (Hero Display Stage)
       * ══════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 h-full min-w-0 flex flex-col items-center justify-center p-6 lg:p-10 bg-[#FAF7F2]/60 dark:bg-[#09090C]/80 relative overflow-hidden">
        {/* 生成进度气泡浮窗 */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md z-40 flex flex-col items-center justify-center p-6 text-center space-y-4 animate-fadeIn">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
              <Sparkles className="w-6 h-6 text-blue-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div className="space-y-1 text-gray-900">
              <h3 className="text-base font-bold font-serif">AI 意境重构中</h3>
              <p className="text-xs text-zinc-300 font-mono">{statusMessage}</p>
            </div>
          </div>
        )}

        {/* 画面展示区域 */}
        {generatedImage ? (
          <div className="relative max-w-full max-h-full flex flex-col items-center justify-center gap-4">
            {/* 顶栏对比与全屏工具 */}
            <div className="w-full flex items-center justify-between px-2 text-xs">
              <span className="font-mono text-studio-muted flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                AI 渲染结果完成 ({selectedRatio})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onMouseDown={() => setCompareMode(true)}
                  onMouseUp={() => setCompareMode(false)}
                  onMouseLeave={() => setCompareMode(false)}
                  className="px-2.5 py-1 rounded-lg bg-studio-card border border-studio-border hover:border-blue-500 text-studio-text text-xs flex items-center gap-1 cursor-pointer"
                  title="按住对比原参考图"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-500" />
                  <span>按住对比原图</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxImage(generatedImage)}
                  className="p-1 rounded-lg bg-studio-card border border-studio-border hover:bg-studio-hover text-studio-muted hover:text-studio-text cursor-pointer"
                  title="放大查看"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 核心大图展示卡片 */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-black/10 bg-black max-h-[64vh] aspect-[3/4] flex items-center justify-center">
              <img
                src={compareMode && uploadedImages[0] ? uploadedImages[0] : generatedImage}
                alt="AI Generated"
                className="w-full h-full object-contain select-none"
              />

              {compareMode && (
                <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/40 text-amber-300 font-mono text-[10px] font-bold">
                  原参考图对比中
                </div>
              )}
            </div>

            {/* 底部动作工具坞 */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <Button
                variant="accent"
                size="sm"
                onClick={handleApplyToCanvas}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>放入当前拼图画布</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddToAlbum}
                className="px-4 py-2 bg-studio-card hover:bg-studio-hover text-studio-text font-semibold text-xs rounded-xl flex items-center gap-1.5 border border-studio-border cursor-pointer"
              >
                <BookPlus className="w-3.5 h-3.5 text-amber-500" />
                <span>收录入 3D 画册</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                className="px-3.5 py-2 bg-studio-card hover:bg-studio-hover text-studio-text font-semibold text-xs rounded-xl flex items-center gap-1.5 border border-studio-border cursor-pointer"
                title="保存到本地"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载原图</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-3.5 py-2 bg-studio-card hover:bg-studio-hover text-studio-text font-semibold text-xs rounded-xl flex items-center gap-1.5 border border-studio-border cursor-pointer"
                title="微调重新生成"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>微调重绘</span>
              </Button>
            </div>
          </div>
        ) : (
          /* 初始占位与灵感引导 */
          <div className="max-w-md text-center space-y-4 p-8 rounded-3xl border border-dashed border-studio-border/80 bg-studio-card/30">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 mx-auto flex items-center justify-center">
              <Wand2 className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold font-serif text-studio-text">
                准备就绪，开启 AI 意境重构
              </h3>
              <p className="text-xs text-studio-muted leading-relaxed">
                在左侧上传照片并填写创意提示词，系统将调用大模型 API 解析画面构图，生成高分辨率先锋艺术大片。
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="accent"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>上传照片开始创作</span>
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* 素材库弹窗 */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelectSingle={(asset) => {
          setUploadedImages((prev) => [...prev, asset.src].slice(0, 6));
          setIsMediaPickerOpen(false);
        }}
        onSelectBatchQueue={(assets) => {
          setUploadedImages((prev) => [...prev, ...assets.map((a) => a.src)].slice(0, 6));
          setIsMediaPickerOpen(false);
        }}
        activeStyleName="AI 自由图像编辑"
      />

      {/* 高清大图弹窗 */}
      <AiImageLightboxModal
        isOpen={!!lightboxImage}
        onClose={() => setLightboxImage(null)}
        resultImage={lightboxImage}
        sourceImage={uploadedImages[0] || null}
        styleName="AI 自由图像编辑"
        onSaveToAssets={() => {}}
        onApplyToCanvas={handleApplyToCanvas}
      />
    </div>
  );
};
