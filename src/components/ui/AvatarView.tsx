import React, { useState, useEffect, useMemo } from "react";
import { User, ShieldCheck } from "lucide-react";
import { stripEmoji } from "../../lib/utils";

interface AvatarViewProps {
  avatar?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

// 大厂扁平质感调色板（双主题自适应柔和低饱和底色与字色）
const FLAT_PALETTES = [
  { bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-300" },
  { bg: "bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-300" },
  { bg: "bg-violet-500/15 border-violet-500/30 text-violet-600 dark:text-violet-300" },
  { bg: "bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300" },
  { bg: "bg-teal-500/15 border-teal-500/30 text-teal-600 dark:text-teal-300" },
  { bg: "bg-indigo-500/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-300" },
  { bg: "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-300" },
  { bg: "bg-slate-500/15 border-slate-500/30 text-slate-700 dark:text-slate-300" },
];

function getPaletteIndex(str: string): number {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % FLAT_PALETTES.length;
}

export const AvatarView: React.FC<AvatarViewProps> = ({
  avatar = "",
  name = "",
  size = "md",
  className = "",
}) => {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [avatar]);

  // 判断是否为真实位图文件地址（去除所有 emoji）
  const isImage = useMemo(() => {
    if (!avatar || imgError) return false;
    const trimmed = avatar.trim();
    return (
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://") ||
      trimmed.startsWith("data:image/") ||
      trimmed.startsWith("/api/")
    );
  }, [avatar, imgError]);

  // 尺寸映射（统一优雅大厂扁平圆角）
  const sizeClasses = {
    xs: "w-5 h-5 text-[10px] rounded-lg",
    sm: "w-7 h-7 text-xs rounded-xl",
    md: "w-8 h-8 text-xs rounded-xl",
    lg: "w-11 h-11 text-base rounded-2xl",
    xl: "w-14 h-14 text-xl rounded-2xl",
  };

  const iconSizes = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
    xl: "w-6 h-6",
  };

  if (isImage) {
    return (
      <div
        className={`overflow-hidden shrink-0 flex items-center justify-center bg-studio-card border border-studio-border ${sizeClasses[size]} ${className}`}
      >
        <img
          src={avatar}
          alt={name ? `${name} 头像` : "用户头像"}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // 扁平化展示：提取纯文本首字符，坚决剔除任何 Emoji
  const rawText = stripEmoji(name || avatar || "");
  const cleanChar = rawText.length > 0 ? rawText.charAt(0).toUpperCase() : "";
  const palette = FLAT_PALETTES[getPaletteIndex(rawText || "user")];

  return (
    <div
      className={`shrink-0 flex items-center justify-center font-bold border transition-colors select-none ${palette.bg} ${sizeClasses[size]} ${className}`}
      title={name || "用户"}
    >
      {cleanChar ? (
        <span className="font-mono leading-none tracking-tight">{cleanChar}</span>
      ) : (
        <User className={`${iconSizes[size]} opacity-80`} />
      )}
    </div>
  );
};
