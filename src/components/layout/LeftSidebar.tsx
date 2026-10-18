import React, { useState, useEffect } from "react";
import { useEditorStore, ActivePanel } from "../../store/useEditorStore";
import { LayoutTemplate, X, Sparkles, Wand2, BookOpen, Images, Compass } from "lucide-react";
import { TemplatePanel } from "../panels/TemplatePanel";
import { AiRetouchPanel } from "../panels/AiRetouchPanel";
import { AiStylizePanel } from "../panels/AiStylizePanel";
import { AlbumWorkspacePanel } from "../panels/AlbumWorkspacePanel";
import { MediaPanel } from "../panels/MediaPanel";
import { AiCreativePanel } from "../panels/AiCreativePanel";

/** 一阶导航（6大板块）：创作 → AI修图 → 风格化 → 拼图 → 相册 → 图库 */
const NAV_ITEMS: {
  id: string;
  label: string;
  badge?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "ai-create", label: "创作", badge: true, icon: Compass },
  { id: "ai-retouch", label: "AI修图", badge: true, icon: Sparkles },
  { id: "ai-stylize", label: "风格化", icon: Wand2 },
  { id: "templates", label: "拼图", icon: LayoutTemplate },
  { id: "album", label: "相册", icon: BookOpen },
  { id: "media", label: "图库", icon: Images },
];

export const LeftSidebar: React.FC = () => {
  const activePanel = useEditorStore((s) => s.activePanel);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const selectedAiStyleId = useEditorStore((s) => s.selectedAiStyleId);
  const setSelectedAiStyleId = useEditorStore((s) => s.setSelectedAiStyleId);

  const authModalOpen = useEditorStore((s) => s.authModalOpen || s.userAccountModalOpen);
  const exportModalOpen = useEditorStore((s) => s.exportModalOpen);
  const presetModalOpen = useEditorStore((s) => s.presetModalOpen);
  const projectModalOpen = useEditorStore((s) => s.projectModalOpen);
  const replacePhotoModalOpen = useEditorStore((s) => s.replacePhotoModalOpen);
  const editingCropId = useEditorStore((s) => s.editingCropId);

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<string>("ai-retouch");

  useEffect(() => {
    if (
      authModalOpen ||
      exportModalOpen ||
      presetModalOpen ||
      projectModalOpen ||
      replacePhotoModalOpen ||
      editingCropId
    ) {
      setMobileDrawerOpen(false);
    }
  }, [authModalOpen, exportModalOpen, presetModalOpen, projectModalOpen, replacePhotoModalOpen, editingCropId]);

  // 一阶高亮：拼图的子功能区（文字/相纸/形状/贴纸/图层）统一归属「拼图」
  const railActiveId =
    activePanel === "ai-create"
      ? "ai-create"
      : activePanel === "ai-retouch"
      ? "ai-retouch"
      : activePanel === "ai-stylize"
      ? "ai-stylize"
      : activePanel === "album"
      ? "album"
      : activePanel === "media"
      ? "media"
      : "templates";

  const handleNavClick = (id: string) => {
    setActivePanel(id as ActivePanel);
    if (id === "ai-retouch" && !selectedAiStyleId.startsWith("retouch_")) {
      setSelectedAiStyleId("retouch_01_dreamy_hair_light");
    } else if (id === "ai-stylize" && selectedAiStyleId.startsWith("retouch_")) {
      setSelectedAiStyleId("dreamy_motion_editorial");
    }
  };

  const mobileTitle =
    mobileActiveTab === "ai-create"
      ? "AI 创作工作台 · 自由生图"
      : mobileActiveTab === "ai-retouch"
      ? "AI 修同款 · 36款修图风格"
      : mobileActiveTab === "ai-stylize"
      ? "AI 先锋艺术风格化"
      : mobileActiveTab === "album"
      ? "相册 · 3D 实体书与照片素材"
      : mobileActiveTab === "media"
      ? "我的图库 · 上传与生成的文件"
      : "拼图排版工作台";

  return (
    <>
      {/* 1. 桌面端左侧一阶导航（80px）+ 二阶功能面板（380px） */}
      <div className="hidden md:flex h-full bg-white select-none z-20 shrink-0 relative">
        <div className="w-20 h-full flex flex-col items-center py-3 border-r border-gray-200 bg-white shrink-0 z-20 overflow-y-auto no-scrollbar">
          <div className="flex-1 space-y-2 w-full px-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = railActiveId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full py-3 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer relative ${
                    isActive
                      ? "bg-gray-100 text-gray-950 font-bold"
                      : "text-gray-600 hover:text-gray-950 hover:bg-gray-50 font-semibold"
                  }`}
                  title={item.label}
                >
                  {item.badge && <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500" />}
                  <Icon className={`w-6 h-6 ${isActive ? "text-gray-950" : "text-gray-600"}`} />
                  <span className="text-[13px] tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {activePanel !== "media" && (
        <div className="h-full bg-white border-r border-gray-200 relative flex flex-col shrink-0 w-[380px] min-w-[380px] max-w-[380px]">
          <div className="flex-1 min-h-0 overflow-y-auto bg-white no-scrollbar">
            {activePanel === "ai-create" ? (
              <AiCreativePanel />
            ) : activePanel === "ai-retouch" ? (
              <AiRetouchPanel />
            ) : activePanel === "ai-stylize" ? (
              <AiStylizePanel />
            ) : activePanel === "album" ? (
              <AlbumWorkspacePanel />
            ) : (
              <TemplatePanel />
            )}
          </div>
        </div>
        )}
      </div>

      {/* 2. 移动端底部一阶导航 */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 z-40 px-1 flex items-center justify-around select-none pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center w-full justify-around">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = mobileDrawerOpen && mobileActiveTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => {
                  if (mobileDrawerOpen && mobileActiveTab === item.id) {
                    setMobileDrawerOpen(false);
                  } else {
                    setActivePanel(item.id as ActivePanel);
                    setMobileActiveTab(item.id);
                    setMobileDrawerOpen(true);
                  }
                }}
                className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  isActive ? "text-gray-950 font-bold" : "text-gray-600 hover:text-gray-950"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-semibold tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 移动端上滑抽屉 */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50 flex flex-col justify-end" onClick={() => setMobileDrawerOpen(false)}>
          <div
            className="bg-white border-t border-gray-200 rounded-t-3xl shadow-2xl flex flex-col max-h-[88vh] h-[84vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-center pt-2 pb-1 bg-white">
              <div className="w-12 h-1.5 rounded-full bg-gray-300" />
            </div>

            <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-gray-950">{mobileTitle}</h3>
              <button
                id="close-mobile-drawer-btn"
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:text-gray-950 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto bg-white">
              {mobileActiveTab === "ai-create" && <AiCreativePanel />}
              {mobileActiveTab === "ai-retouch" && <AiRetouchPanel />}
              {mobileActiveTab === "ai-stylize" && <AiStylizePanel />}
              {mobileActiveTab === "album" && <AlbumWorkspacePanel />}
              {mobileActiveTab === "media" && <MediaPanel />}
              {mobileActiveTab === "templates" && <TemplatePanel />}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
