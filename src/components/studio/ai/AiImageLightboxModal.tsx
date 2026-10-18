import React, { useState, useEffect } from "react";
import {
  X,
  Download,
  FolderPlus,
  Layers,
  Eye,
  Columns,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
} from "lucide-react";
import { Button } from "../../ui/Button";
import { imageExtFromUrl } from "../../../lib/utils";

interface AiImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  resultImage: string | null;
  sourceImage: string | null;
  styleName: string;
  onSaveToAssets: () => void;
  onApplyToCanvas: () => void;
}

export const AiImageLightboxModal: React.FC<AiImageLightboxModalProps> = ({
  isOpen,
  onClose,
  resultImage,
  sourceImage,
  styleName,
  onSaveToAssets,
  onApplyToCanvas,
}) => {
  const [viewMode, setViewMode] = useState<"result" | "split" | "peek">("result");
  const [isPeekingOriginal, setIsPeekingOriginal] = useState(false);
  const [isZoomed100, setIsZoomed100] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !resultImage) return null;

  const handleDownload = () => {
    const a = window.document.createElement("a");
    a.href = resultImage;
    a.download = `atelier_ai_${Date.now()}.${imageExtFromUrl(resultImage)}`;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white animate-fadeIn select-none backdrop-blur-md">
      {/* Top Bar */}
      <div className="h-16 px-4 sm:px-6 border-b border-white/10 flex items-center justify-between bg-black/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
              <span>{styleName} · 高清成片大图预览</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-gray-900/80 border border-white/15">
                原尺寸无损呈现
              </span>
            </h3>
            <p className="text-[11px] text-gray-900/50">支持原片对照、存入素材库与无损下载</p>
          </div>
        </div>

        {/* Action Buttons in Header */}
        <div className="flex items-center gap-2">
          {sourceImage && (
            <div className="hidden sm:flex items-center bg-white/10 rounded-xl p-0.5 border border-white/10 mr-2">
              <button
                type="button"
                onClick={() => setViewMode("result")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === "result" ? "bg-white/20 text-gray-900" : "text-gray-900/60 hover:text-gray-950"
                }`}
              >
                成片视图
              </button>
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  viewMode === "split" ? "bg-white/20 text-gray-900" : "text-gray-900/60 hover:text-gray-950"
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>左右对比</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsZoomed100(!isZoomed100)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-900/80 hover:text-gray-950 transition-colors cursor-pointer"
            title={isZoomed100 ? "适应窗口" : "100% 原始尺寸"}
          >
            {isZoomed100 ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onSaveToAssets}
            className="hidden sm:flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 border-white/20 text-gray-900 cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>存入素材库</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onApplyToCanvas}
            className="hidden sm:flex items-center gap-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-300 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>插入画布</span>
          </Button>

          <Button
            variant="accent"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-1.5 text-xs bg-[#2563EB] hover:bg-blue-600 text-white cursor-pointer shadow-md"
          >
            <Download className="w-3.5 h-3.5" />
            <span>下载成片</span>
          </Button>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-900/80 hover:text-gray-950 transition-colors cursor-pointer ml-1"
            title="关闭 (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center relative">
        {viewMode === "split" && sourceImage ? (
          <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-center gap-4 sm:gap-6">
            {/* Left: Source Original */}
            <div className="flex-1 w-full flex flex-col items-center space-y-2">
              <span className="text-xs font-mono text-gray-900/60 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                📷 原图照片
              </span>
              <div className="rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-zinc-900/50 flex items-center justify-center max-h-[75vh]">
                <img
                  src={sourceImage}
                  alt="Original"
                  className="max-h-[72vh] max-w-full object-contain"
                />
              </div>
            </div>

            {/* Right: AI Result */}
            <div className="flex-1 w-full flex flex-col items-center space-y-2">
              <span className="text-xs font-mono text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                ✨ AI 风格化成片
              </span>
              <div className="rounded-2xl overflow-hidden border border-blue-500/40 shadow-2xl bg-zinc-900/50 flex items-center justify-center max-h-[75vh]">
                <img
                  src={resultImage}
                  alt="AI Result"
                  className="max-h-[72vh] max-w-full object-contain"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col items-center justify-center max-w-full max-h-full">
            <div
              className={`rounded-2xl overflow-hidden shadow-2xl border border-white/15 transition-all flex items-center justify-center ${
                isZoomed100 ? "max-h-none" : "max-h-[80vh]"
              }`}
            >
              <img
                src={isPeekingOriginal && sourceImage ? sourceImage : resultImage}
                alt="Fullscreen Artwork"
                className={`object-contain transition-transform duration-200 ${
                  isZoomed100 ? "scale-125 cursor-zoom-out" : "max-h-[80vh] max-w-[90vw] cursor-zoom-in"
                }`}
                onClick={() => setIsZoomed100(!isZoomed100)}
              />
            </div>

            {/* Floating Quick Peek Button at Bottom */}
            {sourceImage && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <button
                  type="button"
                  onMouseDown={() => setIsPeekingOriginal(true)}
                  onMouseUp={() => setIsPeekingOriginal(false)}
                  onMouseLeave={() => setIsPeekingOriginal(false)}
                  onTouchStart={() => setIsPeekingOriginal(true)}
                  onTouchEnd={() => setIsPeekingOriginal(false)}
                  className="px-4 py-2 rounded-full bg-black/40 hover:bg-black/95 text-white/90 border border-white/20 text-xs font-semibold backdrop-blur-md shadow-2xl flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isPeekingOriginal ? "正在对比原图..." : "按住查看原图"}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Bar */}
      <div className="sm:hidden p-3 border-t border-white/10 bg-black/60 flex items-center justify-around gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={onSaveToAssets}
          className="flex-1 text-xs bg-white/10 border-white/20 text-gray-900"
        >
          <FolderPlus className="w-3.5 h-3.5 mr-1" />
          <span>存素材</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onApplyToCanvas}
          className="flex-1 text-xs bg-amber-500/20 border-amber-500/40 text-amber-300"
        >
          <Layers className="w-3.5 h-3.5 mr-1" />
          <span>进画布</span>
        </Button>
        <Button
          variant="accent"
          size="sm"
          onClick={handleDownload}
          className="flex-1 text-xs bg-blue-600 text-white"
        >
          <Download className="w-3.5 h-3.5 mr-1" />
          <span>下载</span>
        </Button>
      </div>
    </div>
  );
};
