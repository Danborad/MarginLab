content = """import React, { useState, useEffect } from "react";
import { useEditorStore, ActivePanel } from "../../store/useEditorStore";
import {
  LayoutTemplate,
  Image as ImageIcon,
  Type,
  Shapes,
  Stamp,
  Palette,
  Layers,
  X,
  Sliders,
} from "lucide-react";
import { TemplatePanel } from "../panels/TemplatePanel";
import { MediaPanel } from "../panels/MediaPanel";
import { TextPanel } from "../panels/TextPanel";
import { ShapesPanel } from "../panels/ShapesPanel";
import { StickersPanel } from "../panels/StickersPanel";
import { BackgroundPanel } from "../panels/BackgroundPanel";
import { LayersPanel } from "../panels/LayersPanel";
import { ElementPropertyPanel } from "../panels/ElementPropertyPanel";

export const LeftSidebar: React.FC = () => {
  const activePanel = useEditorStore((s) => s.activePanel);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  
  // Modals state to auto-close drawer when modals open
  const authModalOpen = useEditorStore((s) => s.authModalOpen || s.userAccountModalOpen);
  const exportModalOpen = useEditorStore((s) => s.exportModalOpen);
  const presetModalOpen = useEditorStore((s) => s.presetModalOpen);
  const projectModalOpen = useEditorStore((s) => s.projectModalOpen);
  const replacePhotoModalOpen = useEditorStore((s) => s.replacePhotoModalOpen);
  const editingCropId = useEditorStore((s) => s.editingCropId);

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<ActivePanel | "properties">("templates");

  // Automatically close drawer when any modal or crop mode opens
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
  }, [
    authModalOpen,
    exportModalOpen,
    presetModalOpen,
    projectModalOpen,
    replacePhotoModalOpen,
    editingCropId,
  ]);

  const navItems: { id: ActivePanel | "properties"; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "templates", label: "模板", icon: LayoutTemplate },
    { id: "media", label: "素材", icon: ImageIcon },
    { id: "text", label: "文字", icon: Type },
    { id: "shapes", label: "形状", icon: Shapes },
    { id: "stickers", label: "贴纸", icon: Stamp },
    { id: "background", label: "背景", icon: Palette },
    { id: "layers", label: "图层", icon: Layers },
    { id: "properties", label: "属性", icon: Sliders },
  ];

  const handleMobileNavClick = (tab: ActivePanel | "properties") => {
    if (mobileDrawerOpen && mobileActiveTab === tab) {
      // Toggle closed if clicking same active tab
      setMobileDrawerOpen(false);
    } else {
      if (tab === "properties") {
        setMobileActiveTab("properties");
        setMobileDrawerOpen(true);
      } else {
        setActivePanel(tab as ActivePanel);
        setMobileActiveTab(tab);
        setMobileDrawerOpen(true);
      }
    }
  };

  const handleCloseDrawer = () => {
    setMobileDrawerOpen(false);
  };

  return (
    <>
      {/* 1. Desktop Left Sidebar (Visible on md+ screens) */}
      <div className="hidden md:flex h-full border-r border-studio-border bg-studio-sidebar select-none z-20 shrink-0">
        {/* Slim Vertical Icon Bar */}
        <div className="w-16 h-full flex flex-col items-center py-3 border-r border-studio-border/60 bg-studio-panel/50 shrink-0">
          <div className="flex-1 space-y-2 w-full px-2">
            {navItems.filter(item => item.id !== "properties").map((item) => {
              const Icon = item.icon;
              const isActive = activePanel === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePanel(item.id as ActivePanel)}
                  className={`w-full py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    isActive
                      ? "bg-studio-accent text-zinc-950 shadow-sm font-semibold"
                      : "text-studio-muted hover:text-studio-text hover:bg-studio-card/80"
                  }`}
                  title={item.label}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px] tracking-wider font-mono">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Expanded Sub-Panel (Desktop) */}
        <div className="w-[348px] h-full overflow-y-auto bg-studio-sidebar/90 backdrop-blur-md">
          {activePanel === "templates" && <TemplatePanel />}
          {activePanel === "media" && <MediaPanel />}
          {activePanel === "text" && <TextPanel />}
          {activePanel === "shapes" && <ShapesPanel />}
          {activePanel === "stickers" && <StickersPanel />}
          {activePanel === "background" && <BackgroundPanel />}
          {activePanel === "layers" && <LayersPanel />}
        </div>
      </div>

      {/* 2. Mobile Fixed Bottom Navigation Bar (Visible on <md screens with Safe-Area Inset) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-15 bg-zinc-950/95 border-t border-studio-border/80 backdrop-blur-xl z-40 px-1 flex items-center justify-around select-none pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center w-full justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = mobileDrawerOpen && mobileActiveTab === item.id;
            const hasSelection = item.id === "properties" && selectedIds.length > 0;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => handleMobileNavClick(item.id)}
                className={`flex-1 py-1 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer relative ${
                  isActive
                    ? "text-studio-accent font-semibold scale-105"
                    : "text-studio-muted hover:text-studio-text"
                }`}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {hasSelection && !isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-studio-accent animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] font-mono tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Mobile Slide-Up Bottom Sheet Drawer */}
      {mobileDrawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end animate-fadeIn"
          onClick={handleCloseDrawer}
        >
          <div
            className="bg-[#131317] border-t border-studio-border/90 rounded-t-3xl shadow-2xl flex flex-col max-h-[82vh] h-[78vh] overflow-hidden animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Top Grab Handle */}
            <div className="w-full flex items-center justify-center pt-2 pb-1 bg-zinc-950/90">
              <div className="w-12 h-1.5 rounded-full bg-zinc-700/80" />
            </div>

            {/* Sheet Header */}
            <div className="px-4 py-2.5 border-b border-studio-border/60 bg-zinc-950/90 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-studio-accent animate-pulse" />
                <h3 className="text-xs font-semibold text-studio-text tracking-wider uppercase flex items-center gap-1.5">
                  {mobileActiveTab === "templates"
                    ? "艺术排版模板库"
                    : mobileActiveTab === "media"
                    ? "图片素材库"
                    : mobileActiveTab === "text"
                    ? "排版与文字预设"
                    : mobileActiveTab === "shapes"
                    ? "几何与装饰形状"
                    : mobileActiveTab === "stickers"
                    ? "美学贴纸与印章"
                    : mobileActiveTab === "background"
                    ? "相纸规格与底色"
                    : mobileActiveTab === "layers"
                    ? "图层管理"
                    : "元素属性调整"}
                </h3>
                {mobileActiveTab === "properties" && selectedIds.length > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-studio-accent/20 text-studio-accent">
                    已选 {selectedIds.length} 项
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="close-mobile-drawer-btn"
                  onClick={handleCloseDrawer}
                  className="p-1.5 rounded-lg bg-zinc-900 text-studio-muted hover:text-white border border-studio-border cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Secondary Tab Strip inside Drawer for Instant Switching */}
            <div className="px-3 py-1.5 border-b border-studio-border/50 bg-zinc-950/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {navItems.map((item) => {
                const isActive = mobileActiveTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`drawer-tab-${item.id}`}
                    onClick={() => handleMobileNavClick(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? "bg-studio-accent text-zinc-950 font-bold shadow-sm"
                        : "bg-studio-card/60 text-studio-muted hover:text-studio-text border border-studio-border/60"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Sheet Body Scroll Area with Bottom Padding */}
            <div className="flex-1 overflow-y-auto p-2 pb-20 bg-studio-bg">
              {mobileActiveTab === "templates" && <TemplatePanel />}
              {mobileActiveTab === "media" && <MediaPanel />}
              {mobileActiveTab === "text" && <TextPanel />}
              {mobileActiveTab === "shapes" && <ShapesPanel />}
              {mobileActiveTab === "stickers" && <StickersPanel />}
              {mobileActiveTab === "background" && <BackgroundPanel />}
              {mobileActiveTab === "layers" && <LayersPanel />}
              {mobileActiveTab === "properties" && <ElementPropertyPanel />}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
"""
with open("src/components/layout/LeftSidebar.tsx", "w") as f:
    f.write(content)
print("Updated LeftSidebar.tsx with auto-close & toggle")
