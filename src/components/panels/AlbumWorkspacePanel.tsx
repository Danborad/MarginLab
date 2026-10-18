import React, { useState } from "react";
import { AlbumPanel } from "./AlbumPanel";
import { MediaPanel } from "./MediaPanel";
import { BookOpen, Images } from "lucide-react";

type AlbumTab = "book" | "photos";

/**
 * 相册工作区：同一入口下收纳「3D 实体画册」与「照片素材库」。
 */
export const AlbumWorkspacePanel: React.FC = () => {
  const [tab, setTab] = useState<AlbumTab>("book");

  return (
    <div className="flex flex-col h-full bg-white select-none overflow-hidden">
      {/* 二级切换：画册 / 照片素材 */}
      <div className="p-3 border-b border-gray-200 bg-white shrink-0">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-100">
          <button
            onClick={() => setTab("book")}
            className={`py-2 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              tab === "book" ? "bg-white text-gray-950 shadow-2xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>3D 实体画册</span>
          </button>
          <button
            onClick={() => setTab("photos")}
            className={`py-2 rounded-lg text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              tab === "photos" ? "bg-white text-gray-950 shadow-2xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Images className="w-4 h-4" />
            <span>照片素材</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {tab === "book" ? <AlbumPanel onOpenPhotos={() => setTab("photos")} /> : <MediaPanel />}
      </div>
    </div>
  );
};
