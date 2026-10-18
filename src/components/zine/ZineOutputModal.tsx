import React, { useState, useEffect, useRef } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { getStyleById } from "../../lib/ai-styles";
import {
  X,
  Sparkles,
  Download,
  RotateCcw,
  Check,
  Columns,
  Maximize2,
  Split,
  Image as ImageIcon,
  Clock,
  Printer,
  Sparkle,
} from "lucide-react";

type ComparisonMode = "frame" | "side_by_side" | "split_slider";

export const ZineOutputModal: React.FC = () => {
  const isGenerating = useEditorStore((s) => s.isGeneratingAi);
  const latestResult = useEditorStore((s) => s.latestAiGeneratedImage);
  const setLatestResult = useEditorStore((s) => s.setLatestAiGeneratedImage);
  const sourceImage = useEditorStore((s) => s.aiSourceImage);
  const selectedStyleId = useEditorStore((s) => s.selectedAiStyleId);

  const [isOpen, setIsOpen] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("frame");
  const [splitPos, setSplitPos] = useState(50);
  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);

  // Printing animation progress
  const [printProgress, setPrintProgress] = useState(0);
  const [printStatus, setPrintStatus] = useState("正在初始化艺术微喷相纸...");

  const splitRef = useRef<HTMLDivElement>(null);
  const isDraggingSplit = useRef(false);

  const currentStyle = getStyleById(selectedStyleId);

  // Auto-open modal when generation starts or when latestResult exists
  useEffect(() => {
    if (isGenerating || latestResult) {
      setIsOpen(true);
    }
  }, [isGenerating, latestResult]);

  // Laser printing animation steps
  useEffect(() => {
    if (isGenerating) {
      setPrintProgress(10);
      setPrintStatus("📐 正在解析源照片主体轮廓与色彩结构...");

      const t1 = setTimeout(() => {
        setPrintProgress(30);
        setPrintStatus("🖨️ 艺术微喷相纸送入出纸口，激光扫描定位...");
      }, 2500);

      const t2 = setTimeout(() => {
        setPrintProgress(55);
        setPrintStatus(`🎨 正在调用 AI 图像大模型解构「${currentStyle.name.replace(/^[0-9•\s·]+/, "")}」视觉意境...`);
      }, 7000);

      const t3 = setTimeout(() => {
        setPrintProgress(78);
        setPrintStatus("✨ 正在进行高定留白、光影扩散与材质定影...");
      }, 14000);

      const t4 = setTimeout(() => {
        setPrintProgress(92);
        setPrintStatus("🔤 典雅排版压印、胶片颗粒定影与暗房烘干...");
      }, 20000);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    } else if (latestResult) {
      setPrintProgress(100);
      setPrintStatus("✓ 冲印完成！艺术成品已出片");
    }
  }, [isGenerating, latestResult, currentStyle.name]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSplitMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingSplit.current || !splitRef.current) return;
    const rect = splitRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setSplitPos((x / rect.width) * 100);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-fadeIn"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-4xl bg-[#141418] border border-[#2E2E36] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-zinc-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center text-[#3B82F6]">
              {isGenerating ? <Printer className="w-4 h-4 animate-pulse" /> : <Sparkles className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <span>{isGenerating ? "艺术微喷冲印中..." : `拾景出片 • ${currentStyle.name}`}</span>
                {!isGenerating && (
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ✓ 制作完成
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isGenerating && latestResult && (
              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-white/5 mr-2">
                <button
                  onClick={() => setComparisonMode("frame")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                    comparisonMode === "frame"
                      ? "bg-[#2563EB] text-white font-semibold"
                      : "text-zinc-400 hover:text-gray-950"
                  }`}
                  title="画框大图 + 原图角标"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span className="hidden sm:inline">大图 (原图角标)</span>
                </button>
                <button
                  onClick={() => setComparisonMode("side_by_side")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                    comparisonMode === "side_by_side"
                      ? "bg-[#2563EB] text-white font-semibold"
                      : "text-zinc-400 hover:text-gray-950"
                  }`}
                  title="原图（较小）与生成图左右对比"
                >
                  <Columns className="w-3 h-3" />
                  <span className="hidden sm:inline">左右对比 (原图小)</span>
                </button>
                <button
                  onClick={() => setComparisonMode("split_slider")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono flex items-center gap-1 cursor-pointer transition-colors ${
                    comparisonMode === "split_slider"
                      ? "bg-[#2563EB] text-white font-semibold"
                      : "text-zinc-400 hover:text-gray-950"
                  }`}
                  title="滑动卷帘对比"
                >
                  <Split className="w-3 h-3" />
                  <span className="hidden sm:inline">滑动卷帘</span>
                </button>
              </div>
            )}

            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg bg-zinc-900 text-zinc-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center min-h-[380px]">
          
          {/* ============================================================ */}
          {/* STAGE 1: LASER PHOTO PRINTER ANIMATION (PRINTING IN PROGRESS) */}
          {/* ============================================================ */}
          {isGenerating && (
            <div className="w-full max-w-lg flex flex-col items-center gap-5 my-auto animate-fadeIn">
              {/* Virtual Printer Hardware Chassis */}
              <div className="w-full bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col items-center">
                
                {/* Printer Paper Outlet Slot */}
                <div className="w-full h-8 bg-black rounded-xl border border-white/15 flex items-center justify-between px-3 mb-4 shadow-[inset_0_4px_10px_rgba(0,0,0,0.9)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                    <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                      FINE-ART PRINTER • 正在出片
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">{printProgress}%</span>
                </div>

                {/* Emerging Printed Photographic Paper Sheet */}
                <div
                  className="w-48 sm:w-56 h-64 sm:h-72 bg-white rounded-xl shadow-2xl p-2.5 flex flex-col justify-between border-4 border-zinc-100 transition-all duration-700 relative overflow-hidden"
                  style={{
                    transform: `translateY(${Math.min(0, -60 + printProgress * 0.6)}px)`,
                    boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                  }}
                >
                  {/* Photo area with laser scanning beam */}
                  <div className="relative flex-1 bg-zinc-950 rounded-lg overflow-hidden flex items-center justify-center">
                    {sourceImage && (
                      <img
                        src={sourceImage}
                        alt="Emerging Art"
                        className="w-full h-full object-cover filter contrast-125 transition-opacity"
                        style={{ opacity: 0.3 + (printProgress / 100) * 0.7 }}
                      />
                    )}

                    {/* Animated Laser Scanning Line */}
                    <div
                      className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 via-white to-cyan-400 shadow-[0_0_12px_#38bdf8] pointer-events-none"
                      style={{
                        top: `${(printProgress * 1.5) % 100}%`,
                        transition: "top 0.4s ease-out",
                      }}
                    />
                  </div>

                  {/* Embossed Paper Caption */}
                  <div className="pt-2 text-center text-[9px] font-serif tracking-widest text-zinc-600 uppercase">
                    SCENES GATHERED • ARTISAN PRINT
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full mt-5 space-y-2">
                  <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-white/10">
                    <div
                      className="bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 h-full transition-all duration-500"
                      style={{ width: `${printProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-center text-xs font-mono text-cyan-300 gap-1.5">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>{printStatus}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STAGE 2: GENERATED ARTWORK & COMPARISON MODES */}
          {/* ============================================================ */}
          {!isGenerating && latestResult && (
            <div className="w-full flex flex-col items-center gap-4 my-auto animate-fadeIn">
              
              {/* MODE 1: FRAME MODE (Large Generated Photo + Small Inset Original) */}
              {comparisonMode === "frame" && (
                <div className="relative w-full flex items-center justify-center p-2">
                  {/* Large High-Aesthetic Artwork */}
                  <div className="relative rounded-2xl overflow-hidden border-8 border-white bg-white shadow-2xl max-w-lg w-full">
                    <div className="min-h-[280px] max-h-[50vh] bg-zinc-950 flex items-center justify-center overflow-hidden relative">
                      <img
                        src={isHoldingOriginal && sourceImage ? sourceImage : latestResult}
                        alt="Art Result"
                        className="max-h-[50vh] w-auto max-w-full object-contain"
                      />
                    </div>

                    {/* Paper Footer Tag */}
                    <div className="p-3 bg-white flex items-center justify-between text-zinc-900 font-serif border-t border-zinc-100">
                      <span className="text-xs font-bold tracking-widest uppercase">
                        拾景 • {currentStyle.name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">
                        1024 × 1024 高清微喷
                      </span>
                    </div>
                  </div>

                  {/* Floating Small Original Photo Badge (原图小一点) */}
                  {sourceImage && (
                    <div
                      onMouseDown={() => setIsHoldingOriginal(true)}
                      onMouseUp={() => setIsHoldingOriginal(false)}
                      onMouseLeave={() => setIsHoldingOriginal(false)}
                      className="absolute bottom-4 left-4 sm:left-12 p-2 rounded-2xl bg-zinc-950/90 border border-[#2563EB]/50 shadow-2xl backdrop-blur-md cursor-pointer hover:scale-105 transition-all group z-20"
                      title="按住此卡片可瞬时切换查看原图"
                    >
                      <div className="text-[10px] font-mono text-[#3B82F6] mb-1 flex items-center justify-between gap-2">
                        <span>📷 原始源片</span>
                        <span className="text-[9px] text-zinc-400 group-hover:text-gray-950">按住对比</span>
                      </div>
                      <img
                        src={sourceImage}
                        alt="Source"
                        className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-xl border border-white/10"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: SIDE BY SIDE (Left: Original photo smaller, Right: Generated Large) */}
              {comparisonMode === "side_by_side" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 w-full items-center p-2">
                  
                  {/* Left: Original Photo (Smaller proof) */}
                  <div className="md:col-span-4 flex flex-col items-center space-y-2">
                    <div className="w-full flex items-center justify-between text-xs font-mono text-zinc-400">
                      <span className="flex items-center gap-1 text-gray-900">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-400" /> 原始照片 (参考)
                      </span>
                      <span className="text-[10px]">原片</span>
                    </div>

                    <div className="relative w-full rounded-2xl overflow-hidden border border-zinc-700 bg-zinc-950 shadow-lg">
                      {sourceImage && (
                        <img
                          src={sourceImage}
                          alt="Original"
                          className="w-full h-44 sm:h-52 object-cover"
                        />
                      )}
                      <div className="absolute bottom-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-white">
                        📷 原始源片 (较小)
                      </div>
                    </div>
                  </div>

                  {/* Right: Generated Artwork (Hero Large) */}
                  <div className="md:col-span-8 flex flex-col items-center space-y-2">
                    <div className="w-full flex items-center justify-between text-xs font-mono text-[#3B82F6] font-semibold">
                      <span className="flex items-center gap-1 text-gray-900">
                        <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" /> AI 风格化重构成片
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        ✓ 激光微喷成品
                      </span>
                    </div>

                    <div className="relative w-full rounded-2xl overflow-hidden border-4 border-white/90 bg-black shadow-2xl flex items-center justify-center">
                      <img
                        src={latestResult}
                        alt="Generated Artwork"
                        className="max-h-52 w-auto max-w-full object-contain"
                      />
                      <div className="absolute bottom-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-[#3B82F6] border border-[#2563EB]/40 backdrop-blur-md">
                        ✨ {currentStyle.name}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* MODE 3: SPLIT SLIDER VIEW */}
              {comparisonMode === "split_slider" && sourceImage && (
                <div
                  ref={splitRef}
                  onMouseMove={handleSplitMouseMove}
                  onMouseDown={() => (isDraggingSplit.current = true)}
                  onMouseUp={() => (isDraggingSplit.current = false)}
                  className="relative w-full max-w-lg aspect-[4/3] sm:aspect-[16/10] max-h-[50vh] rounded-3xl overflow-hidden border-4 border-white/90 bg-black shadow-2xl cursor-ew-resize select-none mx-auto"
                >
                  <img
                    src={latestResult}
                    alt="Generated"
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                  />
                  <div
                    className="absolute inset-0 overflow-hidden pointer-events-none"
                    style={{ width: `${splitPos}%` }}
                  >
                    <img
                      src={sourceImage}
                      alt="Original"
                      className="absolute inset-0 w-full h-full object-cover"
                      style={{ width: splitRef.current?.clientWidth || "100%", maxWidth: "none" }}
                    />
                    <div className="absolute bottom-3 left-3 text-[10px] font-mono px-2 py-1 rounded-md bg-black/40 text-white backdrop-blur-md border border-white/20">
                      📷 原始照片
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 text-[10px] font-mono px-2 py-1 rounded-md bg-black/40 text-[#3B82F6] backdrop-blur-md border border-[#2563EB]/40 pointer-events-none">
                    ✨ AI 风格化重构
                  </div>
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)] pointer-events-none"
                    style={{ left: `${splitPos}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-zinc-950 shadow-xl flex items-center justify-center text-xs font-bold">
                      ↔
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        {!isGenerating && latestResult && (
          <div className="p-4 border-t border-white/10 bg-zinc-950/80 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <button
                onClick={() => setLatestResult(null)}
                className="hover:text-gray-950 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重新生成</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={latestResult}
                download={`zine_artwork_${Date.now()}.png`}
                className="py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>下载高清成片</span>
              </a>

              <button
                type="button"
                onClick={handleClose}
                className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer transition-colors"
              >
                完成
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
