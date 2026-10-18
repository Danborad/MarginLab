import React, { useState, useEffect } from "react";
import { User } from "lucide-react";

const AVATAR_OPTIONS = ["🎨", "📷", "✨", "🌿", "☕", "🏛️", "🎞️", "🌸", "⚡", "💎", "🪐", "🎬"];

interface AvatarPickerProps {
  value: string;
  onChange: (avatarUrlOrEmoji: string) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({ value, onChange }) => {
  const [mode, setMode] = useState<"emoji" | "qq">(() =>
    value && (value.includes("qlogo.cn") || value.includes("dst_uin") || value.startsWith("http"))
      ? "qq"
      : "emoji"
  );
  const [qqNumber, setQqNumber] = useState(() => {
    if (value && (value.includes("qlogo.cn") || value.includes("dst_uin"))) {
      const match = value.match(/nk=(\d+)/) || value.match(/dst_uin=(\d+)/);
      return match ? match[1] : "";
    }
    return "";
  });

  useEffect(() => {
    if (value && (value.includes("qlogo.cn") || value.includes("dst_uin"))) {
      const match = value.match(/nk=(\d+)/) || value.match(/dst_uin=(\d+)/);
      if (match) {
        setQqNumber(match[1]);
        setMode("qq");
      }
    }
  }, [value]);

  const handleQqChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    setQqNumber(clean);
    if (clean.length >= 5) {
      const url = `https://q1.qlogo.cn/g?b=qq&nk=${clean}&s=640`;
      onChange(url);
    }
  };

  return (
    <div className="space-y-2">
      {/* Sub Tabs */}
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-white p-1 rounded-xl border border-zinc-200 dark:border-gray-200 text-[11px]">
        <button
          type="button"
          onClick={() => {
            setMode("emoji");
            if (value.startsWith("http")) {
              onChange(AVATAR_OPTIONS[0]);
            }
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-colors cursor-pointer ${
            mode === "emoji"
              ? "bg-amber-600 dark:bg-amber-500 text-white dark:text-white shadow-xs"
              : "text-zinc-700 dark:text-gray-700 hover:text-gray-950 dark:hover:text-gray-950"
          }`}
        >
          ✨ 艺术 Emoji (12款)
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("qq");
            if (qqNumber.length >= 5) {
              onChange(`https://q1.qlogo.cn/g?b=qq&nk=${qqNumber}&s=640`);
            }
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg font-semibold transition-colors cursor-pointer ${
            mode === "qq"
              ? "bg-amber-600 dark:bg-amber-500 text-white dark:text-white shadow-xs"
              : "text-zinc-700 dark:text-gray-700 hover:text-gray-950 dark:hover:text-gray-950"
          }`}
        >
          🐧 读取 QQ 号头像
        </button>
      </div>

      {/* Mode 1: Emoji */}
      {mode === "emoji" && (
        <div className="grid grid-cols-6 gap-1.5 bg-zinc-50 dark:bg-white p-2 rounded-xl border border-zinc-200 dark:border-gray-200">
          {AVATAR_OPTIONS.map((emoji) => (
            <button
              type="button"
              key={emoji}
              onClick={() => onChange(emoji)}
              className={`h-8 rounded-lg flex items-center justify-center text-base transition-all cursor-pointer ${
                value === emoji
                  ? "bg-amber-500/20 border-2 border-amber-600 dark:border-amber-400 scale-110 shadow-xs"
                  : "hover:bg-zinc-200/60 dark:hover:bg-black/[0.05] opacity-80 hover:opacity-100"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Mode 2: QQ Avatar */}
      {mode === "qq" && (
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-white border border-zinc-200 dark:border-gray-200 space-y-2 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white dark:bg-white border border-zinc-300 dark:border-gray-200 overflow-hidden shrink-0 flex items-center justify-center shadow-inner">
              {qqNumber.length >= 5 ? (
                <img
                  src={`https://q1.qlogo.cn/g?b=qq&nk=${qqNumber}&s=640`}
                  alt="QQ Avatar"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://q1.qlogo.cn/g?b=qq&nk=10001&s=640";
                  }}
                />
              ) : (
                <User className="w-5 h-5 text-zinc-400" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder="输入 5~11 位 QQ 号码 (如 123456789)"
                value={qqNumber}
                onChange={(e) => handleQqChange(e.target.value)}
                maxLength={12}
                className="w-full px-3 py-2 bg-white dark:bg-white border border-zinc-300 dark:border-gray-200 focus:border-amber-600 dark:focus:border-amber-400 rounded-lg text-xs text-zinc-900 dark:text-gray-700 font-mono placeholder:text-zinc-400 focus:outline-none"
              />
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 block font-mono">
                {qqNumber.length >= 5
                  ? "✅ 已自动同步提取高清 QQ 头像"
                  : "输入 QQ 号码即可一键读取同步头像"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
