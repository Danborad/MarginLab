import React, { useState } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { AI_STYLES, getStyleById, IMAGE_RATIOS, ImageAspectRatio } from "../../lib/ai-styles";
import {
  X,
  Sparkles,
  Wand2,
  RefreshCw,
  Image as ImageIcon,
  Check,
  Crown,
  LayoutTemplate,
  Sliders,
  Layers,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "../ui/Button";
import { AspectRatioThumbnail } from "../ui/AspectRatioThumbnail";
import { ImageElement } from "../../types/document";

export const AiStylizeModal: React.FC = () => {
  const open = useEditorStore((s) => s.aiStylizeModalOpen);
  const setOpen = useEditorStore((s) => s.closeAiStylizeModal);
  const targetElementId = useEditorStore((s) => s.aiStylizeTargetElementId);
  const currentUser = useEditorStore((s) => s.currentUser);
  const setAdminModalOpen = useEditorStore((s) => s.setAdminModalOpen);

  const selectedStyleId = useEditorStore((s) => s.selectedAiStyleId);
  const setSelectedStyleId = useEditorStore((s) => s.setSelectedAiStyleId);
  const sourceImage = useEditorStore((s) => s.aiSourceImage);
  const setSourceImage = useEditorStore((s) => s.setAiSourceImage);
  const isGenerating = useEditorStore((s) => s.isGeneratingAi);
  const generateAiImage = useEditorStore((s) => s.generateAiImage);
  const applyStylizedImage = useEditorStore((s) => s.applyStylizedImageToCanvas);
  const aiConfig = useEditorStore((s) => s.aiConfig);

  const [customNotes, setCustomNotes] = useState("");
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("auto");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [latestResult, setLatestResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"compose" | "preview">("compose");

  if (!open) return null;

  const activeStyle = getStyleById(selectedStyleId);

  const handleGenerate = async () => {
    setStatusMessage(null);
    const res = await generateAiImage({
      styleId: activeStyle.id,
      customNotes,
      aspectRatio,
      sourceImage: sourceImage || undefined,
    });

    if (res.success && res.image) {
      setLatestResult(res.image);
      setActiveTab("preview");
      setStatusMessage({ type: "success", text: res.message || "生成成功！已加入作品素材库" });
    } else {
      setStatusMessage({
        type: "error",
        text: res.message || "生成失败，请检查 AI 模型配置与网络连接",
      });
      if (res.needsConfig) {
        if (currentUser?.isAdmin) {
          setTimeout(() => setAdminModalOpen(true, "ai_config"), 800);
        } else {
          setStatusMessage({
            type: "error",
            text: "平台全局 AI 图像大模型正在维护中，请联系管理员配置后使用。",
          });
        }
      }
    }
  };

  const handleApply = async (mode: "add" | "replace" | "template") => {
    if (!latestResult) return;
    await applyStylizedImage(latestResult, mode, targetElementId || undefined);
    setOpen();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => setOpen()}
    >
      <div
        className="w-full max-w-2xl bg-studio-sidebar border border-studio-border/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-studio-border/70 flex items-center justify-between bg-studio-panel">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-studio-accent/15 border border-studio-accent/40 flex items-center justify-center text-white shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-studio-text flex items-center gap-2">
                AI 艺术风格化重构
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-studio-accent/20 text-white">
                  {activeStyle.name.split("•")[0]}
                </span>
              </h3>
              <p className="text-[11px] text-studio-muted">
                基于当前图片与提示词深度重塑艺术质感
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser?.isAdmin && (
              <button
                onClick={() => setAdminModalOpen(true, "ai_config")}
                className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-xs font-mono text-amber-300 hover:bg-amber-500/25 border border-amber-500/40 flex items-center gap-1 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>模型配置</span>
              </button>
            )}
            <button
              onClick={() => setOpen()}
              className="p-1.5 rounded-lg bg-studio-card text-studio-muted hover:text-studio-text border border-studio-border/60 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-fadeIn ${
                statusMessage.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              {statusMessage.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Style Selector Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-studio-muted uppercase block">
              选择重塑艺术风格
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AI_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedStyleId === style.id
                      ? "bg-studio-accent/15 border-studio-accent text-white shadow-sm"
                      : "bg-studio-panel border-studio-border/60 text-studio-muted hover:text-gray-950 hover:border-studio-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{style.name.split("•")[0]}</span>
                    {style.badge && (
                      <span className="text-[9px] font-mono px-1 rounded bg-studio-accent/20 text-white">
                        {style.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-studio-muted line-clamp-1 mt-0.5">
                    {style.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Aspect Ratio & Custom Prompts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-mono text-studio-muted uppercase flex items-center justify-between">
                <span>尺寸或画幅比例 (Aspect Ratio)</span>
                <span className="text-studio-accent">{aspectRatio}</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 bg-studio-panel p-1.5 rounded-xl border border-studio-border">
                {IMAGE_RATIOS.map((r) => {
                  const isSelected = aspectRatio === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setAspectRatio(r.id)}
                      className={`py-1.5 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer border ${
                        isSelected
                          ? "bg-studio-accent/20 border-studio-accent text-white font-semibold"
                          : "border-transparent text-studio-muted hover:text-gray-950"
                      }`}
                    >
                      <AspectRatioThumbnail ratioId={r.id} isSelected={isSelected} size="sm" />
                      <span className="text-[10px] font-mono">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                微调补充词 (Prompt Notes)
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="如：突出月光冷蓝调、水粉更柔和..."
                className="w-full px-3 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/40 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="pt-2">
            <Button
              variant="accent"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="w-full py-3 text-xs font-semibold shadow-subtle-glow flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI 图像大模型正在绘制生成中...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>开始生成风格化作品</span>
                </>
              )}
            </Button>
          </div>

          {/* Generated Result Preview */}
          {latestResult && (
            <div className="p-4 rounded-2xl bg-studio-panel border border-studio-accent/40 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs font-semibold text-studio-accent">
                <span>生成成果预览</span>
                <span className="text-[10px] text-emerald-400 font-mono">1024×1024 高清重塑</span>
              </div>

              <div className="rounded-xl overflow-hidden bg-black max-h-72 flex items-center justify-center border border-white/10">
                <img
                  src={latestResult}
                  alt="AI Generated"
                  className="max-h-72 object-contain mx-auto"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleApply("replace")}
                  className="text-xs"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>替换原图相框</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleApply("add")}
                  className="text-xs"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>作为新图层插入</span>
                </Button>

                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => handleApply("template")}
                  className="text-xs col-span-2 sm:col-span-1"
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span>应用双联排版</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
