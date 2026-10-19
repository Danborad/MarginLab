import React, { useState, useRef } from "react";
import { Upload, Image as ImageIcon, Sparkles, Check, Trash2, RotateCw } from "lucide-react";

export const CARTOON_AVATARS = [
  { emoji: "🐱", name: "橘猫波波", bg: "bg-amber-100 dark:bg-amber-950/40 text-amber-600" },
  { emoji: "🐶", name: "元气柴犬", bg: "bg-orange-100 dark:bg-orange-950/40 text-orange-600" },
  { emoji: "🦊", name: "灵动小狐", bg: "bg-red-100 dark:bg-red-950/40 text-red-600" },
  { emoji: "🐼", name: "乐天滚滚", bg: "bg-zinc-200 dark:bg-zinc-800 text-zinc-700" },
  { emoji: "🐰", name: "软萌白兔", bg: "bg-pink-100 dark:bg-pink-950/40 text-pink-600" },
  { emoji: "🐻", name: "森林暖熊", bg: "bg-amber-200 dark:bg-amber-900/40 text-amber-800" },
  { emoji: "🐨", name: "悠闲考拉", bg: "bg-slate-100 dark:bg-slate-800 text-slate-700" },
  { emoji: "🦖", name: "逗趣小龙", bg: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600" },
  { emoji: "🦁", name: "阳光小狮", bg: "bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600" },
  { emoji: "🐧", name: "极地企鹅", bg: "bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600" },
  { emoji: "🦉", name: "夜巡猫鹰", bg: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600" },
  { emoji: "🐬", name: "浪花海豚", bg: "bg-sky-100 dark:bg-sky-950/40 text-sky-600" },
  { emoji: "🧑‍🎨", name: "调色画师", bg: "bg-purple-100 dark:bg-purple-950/40 text-purple-600" },
  { emoji: "📷", name: "纪实摄影", bg: "bg-rose-100 dark:bg-rose-950/40 text-rose-600" },
  { emoji: "🧑‍🚀", name: "星际漫步", bg: "bg-violet-100 dark:bg-violet-950/40 text-violet-600" },
  { emoji: "☕", name: "手冲咖啡", bg: "bg-stone-200 dark:bg-stone-800 text-stone-700" },
];

interface AvatarPickerProps {
  value: string;
  onChange: (avatarUrlOrEmoji: string) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({ value, onChange }) => {
  const isCustomImage = Boolean(
    value &&
    (value.startsWith("data:image") || value.startsWith("http://") || value.startsWith("https://"))
  );

  const [mode, setMode] = useState<"cartoon" | "upload">(() => (isCustomImage ? "upload" : "cartoon"));
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
    reader.onerror = () => setIsProcessing(false);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2 select-none">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700/60 text-[11px]">
        <button
          type="button"
          onClick={() => {
            setMode("cartoon");
            if (isCustomImage) {
              onChange(CARTOON_AVATARS[0].emoji);
            }
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === "cartoon"
              ? "bg-amber-600 dark:bg-amber-500 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>精选卡通形象 (16款)</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === "upload"
              ? "bg-amber-600 dark:bg-amber-500 text-white shadow-xs"
              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>本地上传头像</span>
          {isCustomImage && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
          )}
        </button>
      </div>

      {/* Mode 1: Cartoon Avatars */}
      {mode === "cartoon" && (
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 bg-zinc-50 dark:bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700/60 animate-fadeIn">
          {CARTOON_AVATARS.map((item) => {
            const isSelected = value === item.emoji;
            return (
              <button
                type="button"
                key={item.name}
                onClick={() => onChange(item.emoji)}
                title={item.name}
                className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer group ${
                  isSelected
                    ? "bg-amber-500/15 border-2 border-amber-600 dark:border-amber-400 scale-105 shadow-xs"
                    : "hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 border border-transparent"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-xl transition-transform group-hover:scale-110 shadow-xs ${item.bg}`}
                >
                  {item.emoji}
                </div>
                <span className="text-[10px] text-zinc-600 dark:text-zinc-400 font-medium mt-1 truncate max-w-full">
                  {item.name}
                </span>
                {isSelected && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Mode 2: Custom Local Upload */}
      {mode === "upload" && (
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-700/60 animate-fadeIn">
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
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden border-2 border-amber-500 shadow-md shrink-0 bg-white">
                <img
                  src={value}
                  alt="Custom Avatar"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">自定义专属头像</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/20 text-emerald-600 font-mono">
                    已加载
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  已裁剪为 1:1 正方形并自动进行尺寸与画质优化
                </p>
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="px-2.5 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCw className={`w-3 h-3 ${isProcessing ? "animate-spin" : ""}`} />
                    <span>更换图片</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(CARTOON_AVATARS[0].emoji);
                      setMode("cartoon");
                    }}
                    className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>恢复内置卡通</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-amber-500 dark:hover:border-amber-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white dark:bg-zinc-900/60 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {isProcessing ? "正在处理并裁剪图片..." : "点击选择本地图片上传"}
              </div>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                支持 JPG、PNG、WebP，自动居中裁切为 1:1 高清头像
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
