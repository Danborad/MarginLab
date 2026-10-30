import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Sparkles, Check, Trash2, RotateCw, Palette, User } from "lucide-react";

// 扁平化高定调色板预设（完全去除 Emoji 表情包，符合大厂极简审美）
export const FLAT_AVATAR_PRESETS = [
  { id: "emerald", name: "极光翡翠", bg: "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300", hex: "#22C55E" },
  { id: "blue", name: "冰川群青", bg: "bg-blue-500/20 border-blue-500/40 text-blue-600 dark:text-blue-300", hex: "#3B82F6" },
  { id: "violet", name: "暮山淡紫", bg: "bg-violet-500/20 border-violet-500/40 text-violet-600 dark:text-violet-300", hex: "#8B5CF6" },
  { id: "amber", name: "琥珀暖橙", bg: "bg-amber-500/20 border-amber-500/40 text-amber-700 dark:text-amber-300", hex: "#F59E0B" },
  { id: "cyan", name: "天霁湖蓝", bg: "bg-cyan-500/20 border-cyan-500/40 text-cyan-600 dark:text-cyan-300", hex: "#06B6D4" },
  { id: "rose", name: "绯红霞光", bg: "bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-300", hex: "#F43F5E" },
  { id: "indigo", name: "星海深蓝", bg: "bg-indigo-500/20 border-indigo-500/40 text-indigo-600 dark:text-indigo-300", hex: "#6366F1" },
  { id: "slate", name: "曜石质感", bg: "bg-slate-500/20 border-slate-500/40 text-slate-700 dark:text-slate-300", hex: "#64748B" },
];

// 向后兼容导出
export const CARTOON_AVATARS = FLAT_AVATAR_PRESETS.map((p) => ({
  emoji: "",
  name: p.name,
  bg: p.bg,
}));

interface AvatarPickerProps {
  value: string;
  onChange: (avatarUrlOrPreset: string) => void;
  userName?: string;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({ value, onChange, userName = "创作者" }) => {
  const isCustomImage = Boolean(
    value &&
    (value.startsWith("data:image") || value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/api/"))
  );

  const [mode, setMode] = useState<"preset" | "upload">(() => (isCustomImage ? "upload" : "preset"));
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const size = 200;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.imageSmoothingQuality = "high";
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
            const optimized = canvas.toDataURL("image/jpeg", 0.88);
            onChange(optimized);
            setMode("upload");
          }
        } catch (err) {
          console.error("Failed to crop avatar:", err);
          onChange(src);
        } finally {
          setIsProcessing(false);
        }
      };
      img.onerror = () => setIsProcessing(false);
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const initialChar = userName.trim() ? userName.trim().charAt(0).toUpperCase() : "U";

  return (
    <div className="space-y-3">
      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-studio-card p-1 rounded-xl border border-studio-border text-[11px]">
        <button
          type="button"
          onClick={() => {
            setMode("preset");
            if (isCustomImage) {
              onChange("");
            }
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === "preset"
              ? "bg-emerald-500 text-black shadow-xs font-bold"
              : "text-studio-muted hover:text-studio-text"
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>极简扁平徽章 (8色)</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === "upload"
              ? "bg-emerald-500 text-black shadow-xs font-bold"
              : "text-studio-muted hover:text-studio-text"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>本地上传相片</span>
          {isCustomImage && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
          )}
        </button>
      </div>

      {/* Mode 1: Flat Presets */}
      {mode === "preset" && (
        <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 bg-studio-card/60 p-3 rounded-2xl border border-studio-border animate-fadeIn">
          {FLAT_AVATAR_PRESETS.map((item) => {
            const isSelected = !isCustomImage && (value === item.id || (!value && item.id === "emerald"));
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => onChange(item.id)}
                title={item.name}
                className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer border ${
                  isSelected
                    ? "bg-emerald-500/15 border-emerald-500 shadow-aurora scale-[1.03]"
                    : "border-studio-border hover:border-studio-border-strong bg-studio-panel/60"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-mono font-bold border transition-transform shadow-xs ${item.bg}`}
                >
                  {initialChar}
                </div>
                <span className="text-[10px] text-studio-muted font-medium mt-1 truncate max-w-full">
                  {item.name}
                </span>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Mode 2: Custom Local Upload */}
      {mode === "upload" && (
        <div className="p-3.5 rounded-2xl bg-studio-card/60 border border-studio-border animate-fadeIn">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
          />

          {isCustomImage ? (
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-md shrink-0 bg-studio-panel">
                <img
                  src={value}
                  alt="Custom Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-studio-text">自定义图片头像</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                    已加载
                  </span>
                </div>
                <p className="text-[10px] text-studio-dim">
                  已裁剪为 1:1 正方形并自动进行尺寸优化
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-2.5 py-1 rounded-lg btn-glass text-studio-text text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCw className={`w-3 h-3 ${isProcessing ? "animate-spin" : ""}`} />
                    <span>更换图片</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setMode("preset");
                    }}
                    className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="移除图片头像"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="py-6 border-2 border-dashed border-studio-border hover:border-emerald-500/50 rounded-xl flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all hover:bg-studio-hover"
            >
              <div className="w-10 h-10 rounded-xl bg-studio-panel border border-studio-border flex items-center justify-center text-studio-muted">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-studio-text">点击上传本地相片</p>
                <p className="text-[10px] text-studio-dim mt-0.5">支持 JPG、PNG、WebP 原图</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
