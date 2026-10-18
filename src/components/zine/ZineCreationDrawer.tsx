import React, { useState, useRef } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { getStyleById, IMAGE_RATIOS, ImageAspectRatio, DREAMY_SAMPLE_PHOTOS } from "../../lib/ai-styles";
import {
  X,
  Plus,
  Sparkles,
  Upload,
  RotateCcw,
  Check,
  ChevronDown,
  Image as ImageIcon,
  Type,
  Minus,
  Trash2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { fileToBase64 } from "../../lib/utils";

interface Props {
  onStartGenerating: () => void;
}

export const ZineCreationDrawer: React.FC<Props> = ({ onStartGenerating }) => {
  const isDrawerOpen = useEditorStore((s) => s.isZineDrawerOpen);
  const setIsDrawerOpen = useEditorStore((s) => s.setIsZineDrawerOpen);
  const selectedStyleId = useEditorStore((s) => s.selectedAiStyleId);
  const sourceImage = useEditorStore((s) => s.aiSourceImage);
  const setSourceImage = useEditorStore((s) => s.setAiSourceImage);
  const setLatestResult = useEditorStore((s) => s.setLatestAiGeneratedImage);
  const generateAiImage = useEditorStore((s) => s.generateAiImage);
  const isGenerating = useEditorStore((s) => s.isGeneratingAi);
  const userCredits = useEditorStore((s) => s.userCredits);
  const setUserCredits = useEditorStore((s) => s.setUserCredits);

  // Form State
  const [mood, setMood] = useState("");
  const [includeText, setIncludeText] = useState(true);
  const [specifiedText, setSpecifiedText] = useState("");
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("auto");
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isDrawerOpen) return null;

  const currentStyle = getStyleById(selectedStyleId);

  // Handle Photo File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await fileToBase64(file);
      setSourceImage(base64);
      setLatestResult(null);
      setErrorMessage("");
    } catch (err) {
      setErrorMessage("读取照片失败，请重新选择");
    }
  };

  // Handle Photo Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const base64 = await fileToBase64(file);
      setSourceImage(base64);
      setLatestResult(null);
      setErrorMessage("");
    }
  };

  // Submit Generation
  const handleSubmit = async () => {
    if (!sourceImage) {
      setErrorMessage("请先放入一张真实照片作为创作基底");
      return;
    }

    setErrorMessage("");
    onStartGenerating();

    const res = await generateAiImage({
      styleId: currentStyle.id,
      mood: mood.trim(),
      includeText,
      specifiedText: specifiedText.trim(),
      aspectRatio,
      sourceImage,
    });

    if (res.success) {
      // Deduct 3 credits
      if (userCredits >= 3) {
        setUserCredits(userCredits - 3);
      }
    } else {
      setErrorMessage(res.message || "生成失败，请检查网络或大模型服务");
    }
  };

  return (
    <aside
      className="w-full sm:w-[380px] md:w-[420px] lg:w-[440px] h-full bg-white border-l border-[#E5E0D6] flex flex-col justify-between select-none shrink-0 shadow-lg z-30 overflow-y-auto"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Top Header */}
      <div className="p-5 pb-3 border-b border-[#F0EBE1] flex items-center justify-between sticky top-0 bg-white z-10">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#18181B] font-sans flex items-center gap-2">
            <span>制作{currentStyle.name.replace(/^[0-9•\s·]+/, "")}</span>
          </h2>
        </div>
        <button
          onClick={() => setIsDrawerOpen(false)}
          className="p-1.5 rounded-lg text-[#888] hover:text-[#18181B] hover:bg-[#F4F1EA] transition-colors cursor-pointer"
          title="关闭抽屉"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Drawer Form Body */}
      <div className="p-5 space-y-5 flex-1 text-xs">
        
        {/* Style Editorial Description */}
        <p className="text-[11px] text-[#736E65] leading-relaxed">
          {currentStyle.description || "照片是事实锚点。默认跟随原片自适应，也可以指定常用画幅；指定比例会重新安排留白，不会拉伸照片。"}
        </p>

        {/* PHOTO DROPZONE */}
        <div>
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden p-6 text-center group ${
              sourceImage
                ? "border-[#2563EB]/40 bg-[#F8FAFC]"
                : "border-[#DDD7CC] hover:border-[#2563EB] bg-[#F9F8F5] hover:bg-[#F3EFE7]"
            }`}
            style={{
              backgroundImage: !sourceImage
                ? "radial-gradient(#E2DDD5 1px, transparent 1px)"
                : undefined,
              backgroundSize: "16px 16px",
            }}
          >
            {sourceImage ? (
              <div className="space-y-3">
                <div className="relative max-h-44 w-full rounded-xl overflow-hidden shadow-xs border border-[#E2DDD5] mx-auto bg-black">
                  <img
                    src={sourceImage}
                    alt="Source"
                    className="w-full h-36 sm:h-40 object-contain"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/40 text-white text-[10px] font-mono">
                    ✓ 已载入原片
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-3 py-1 rounded-lg bg-white border border-[#DDD7CC] hover:border-[#2563EB] text-[#222] text-[11px] font-medium shadow-2xs transition-colors"
                  >
                    更换照片
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSourceImage(null);
                    }}
                    className="px-3 py-1 rounded-lg bg-white border border-[#DDD7CC] hover:border-red-400 text-[#DC2626] text-[11px] font-medium shadow-2xs transition-colors"
                  >
                    清除
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center mx-auto shadow-sm group-hover:scale-105 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#18181B] group-hover:text-[#2563EB] transition-colors">
                    放入一张真实照片
                  </h4>
                  <p className="text-[11px] text-[#787369] mt-0.5">
                    点击选择或拖入文件
                  </p>
                </div>
                <div className="text-[10px] font-mono text-[#A19D94]">
                  JPG / PNG / WebP / HEIC • 最大 15 MB
                </div>
              </div>
            )}
          </div>

          {/* Sample Photos Pills */}
          <div className="pt-2">
            <div className="text-[10px] text-[#8C877E] font-mono mb-1.5 flex items-center justify-between">
              <span>或点选快速测试样张：</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {DREAMY_SAMPLE_PHOTOS.slice(0, 6).map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => {
                    setSourceImage(sample.src);
                    setLatestResult(null);
                    setErrorMessage("");
                  }}
                  className="px-2 py-1.5 rounded-xl border border-[#E2DDD5] bg-[#FAF8F5] hover:bg-white hover:border-[#2563EB] text-left transition-all cursor-pointer truncate text-[11px] flex items-center gap-1.5"
                >
                  <img
                    src={sample.src}
                    alt={sample.name}
                    className="w-4 h-4 rounded-full object-cover shrink-0"
                  />
                  <span className="truncate text-[#444]">{sample.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* INPUT 1: 方向与氛围 可选 */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#18181B]">方向与氛围 <span className="text-[#8E8A83] font-normal font-mono">可选</span></span>
            <span className="text-[10px] font-mono text-[#8E8A83]">{mood.length} / 20</span>
          </div>
          <input
            type="text"
            maxLength={20}
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="例如：雨后的松弛感"
            className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CC] focus:border-[#2563EB] focus:bg-white rounded-xl text-xs text-[#18181B] placeholder:text-[#A19D94] focus:outline-none transition-colors"
          />
          <p className="text-[10px] text-[#8C877E] leading-normal">
            简短描述想传达的感觉，系统会结合照片调整表达，不改变原有创作风格。
          </p>
        </div>

        {/* INPUT 2: 画面文字 TOGGLE */}
        <div className="space-y-1.5">
          <label className="font-semibold text-[#18181B] block">画面文字</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setIncludeText(true)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                includeText
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#1E40AF] font-semibold ring-1 ring-[#2563EB]/30"
                  : "border-[#DDD7CC] bg-[#FAF8F5] text-[#555] hover:bg-white"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-sm">Aa</span>
                <span className="text-xs">添加文字</span>
              </div>
              <span className="text-[9px] text-[#787369] mt-0.5 leading-tight">
                系统创作，或使用指定文字
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIncludeText(false)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                !includeText
                  ? "border-[#2563EB] bg-[#EFF6FF] text-[#1E40AF] font-semibold ring-1 ring-[#2563EB]/30"
                  : "border-[#DDD7CC] bg-[#FAF8F5] text-[#555] hover:bg-white"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Minus className="w-3.5 h-3.5" />
                <span className="text-xs">不添加文字</span>
              </div>
              <span className="text-[9px] text-[#787369] mt-0.5 leading-tight">
                保持纯画面，不出现字符
              </span>
            </button>
          </div>
        </div>

        {/* INPUT 3: 指定文字 可选 (when includeText is true) */}
        {includeText && (
          <div className="space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#18181B]">指定文字 <span className="text-[#8E8A83] font-normal font-mono">可选</span></span>
              <span className="text-[10px] font-mono text-[#8E8A83]">{specifiedText.length} / 40</span>
            </div>
            <input
              type="text"
              maxLength={40}
              value={specifiedText}
              onChange={(e) => setSpecifiedText(e.target.value)}
              placeholder="例如：After the rain"
              className="w-full px-3.5 py-2.5 bg-[#FAF8F5] border border-[#DDD7CC] focus:border-[#2563EB] focus:bg-white rounded-xl text-xs text-[#18181B] placeholder:text-[#A19D94] focus:outline-none transition-colors"
            />
            <p className="text-[10px] text-[#8C877E] leading-normal">
              不填写时，系统会根据画面创作一句短文字；填写后将尽量按原文呈现。
            </p>
          </div>
        )}

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Drawer Bottom Action & Metadata Footer */}
      <div className="p-5 border-t border-[#F0EBE1] bg-[#FAF8F5] space-y-3 sticky bottom-0 z-10">
        
        {/* Metadata Line */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-[#736E65] pb-1">
          {/* Aspect Ratio Selector */}
          <div className="text-left">
            <span className="block text-[#999] text-[9px]">构图</span>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as ImageAspectRatio)}
              className="bg-transparent font-semibold text-[#18181B] outline-none cursor-pointer text-[11px] truncate max-w-full"
            >
              <option value="auto">自适应比例</option>
              <option value="1:1">1:1 正方形</option>
              <option value="3:2">3:2 横画</option>
              <option value="2:3">2:3 竖画</option>
              <option value="4:3">4:3 横画</option>
              <option value="3:4">3:4 经典海报</option>
              <option value="16:9">16:9 宽屏</option>
              <option value="21:9">21:9 超宽</option>
              <option value="9:16">9:16 全屏</option>
            </select>
          </div>

          <div>
            <span className="block text-[#999] text-[9px]">分辨率</span>
            <span className="font-semibold text-[#18181B]">1K • 3 积分</span>
          </div>

          <div className="text-right">
            <span className="block text-[#999] text-[9px]">时间</span>
            <span className="font-semibold text-[#18181B]">通常约 20-30秒</span>
          </div>
        </div>

        {/* Big Start Generate Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isGenerating || !sourceImage}
          className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
            !sourceImage || isGenerating
              ? "bg-[#CBD5E1] text-[#64748B] cursor-not-allowed shadow-none"
              : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white active:scale-[0.99]"
          }`}
        >
          <Sparkles className="w-4 h-4 text-gray-900" />
          <span>{isGenerating ? "正在艺术微喷重构..." : "开始生成"}</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </aside>
  );
};
