import React, { useEffect } from "react";
import { useEditorStore } from "./store/useEditorStore";
import { Header } from "./components/layout/Header";
import { LeftSidebar } from "./components/layout/LeftSidebar";
import { RightSidebar } from "./components/layout/RightSidebar";
import { BottomBar } from "./components/layout/BottomBar";
import { CanvasStage } from "./components/canvas/CanvasStage";
import { AiStylizeStudioStage } from "./components/canvas/AiStylizeStudioStage";
import { AiCreativeStudioStage } from "./components/canvas/AiCreativeStudioStage";
import { AlbumStudioStage } from "./components/canvas/AlbumStudioStage";
import { MediaGalleryStudioStage } from "./components/canvas/MediaGalleryStudioStage";
import { LandingHomePage } from "./components/home/LandingHomePage";
import { AdminDashboardPage } from "./components/admin/AdminDashboardPage";
import { AuthPortalPage } from "./components/auth/AuthPortalPage";

// Global Modals
import { AuthModal } from "./components/modals/AuthModal";
import { ProjectManagerModal } from "./components/modals/ProjectManagerModal";
import { PresetSizeModal } from "./components/modals/PresetSizeModal";
import { ExportModal } from "./components/modals/ExportModal";
import { AutoLayoutModal } from "./components/modals/AutoLayoutModal";
import { ReplacePhotoModal } from "./components/modals/ReplacePhotoModal";
import { ShortCutModal } from "./components/modals/ShortCutModal";
import { AiSettingsModal } from "./components/modals/AiSettingsModal";
import { AdminManagementModal } from "./components/modals/AdminManagementModal";
import { AiStylizeModal } from "./components/modals/AiStylizeModal";
import { AlbumModal } from "./components/album/AlbumModal";
import { WatermarkEditModal } from "./components/modals/WatermarkEditModal";

export function App() {
  (window as any).__store = useEditorStore;
  const pathname = typeof window !== "undefined" ? window.location.pathname.replace(/\/+$/, "") : "";

  const currentView = useEditorStore((s) => s.currentView);
  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
  const activePanel = useEditorStore((s) => s.activePanel);
  const loadFromStorage = useEditorStore((s) => s.loadFromStorage);
  const fetchAiHistory = useEditorStore((s) => s.fetchAiHistory);
  const fetchAiConfig = useEditorStore((s) => s.fetchAiConfig);
  const fetchSiteFilingConfig = useEditorStore((s) => s.fetchSiteFilingConfig);

  useEffect(() => {
    loadFromStorage();
    fetchAiHistory();
    fetchAiConfig();
    // 全站备案信息（落地页页脚展示）
    fetchSiteFilingConfig();
  }, [loadFromStorage, fetchAiHistory, fetchAiConfig, fetchSiteFilingConfig]);

  // 全局回撤与重做快捷键监听 (Ctrl+Z / Cmd+Z / Ctrl+Y / Cmd+Shift+Z)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable;
      if (isInput) return;

      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === "z") {
        e.preventDefault();
        const store = useEditorStore.getState();
        if (e.shiftKey) {
          store.redo();
        } else {
          store.undo();
        }
      } else if (isMeta && e.key.toLowerCase() === "y") {
        e.preventDefault();
        useEditorStore.getState().redo();
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, []);

  // 0. Admin Dashboard（独立全屏路由 /admin，2026-10 重构）
  if (pathname === "/admin") {
    return <AdminDashboardPage />;
  }

  // 1. Auth Portal（2026-10 重构：左图右表全屏登录视图）
  if (currentView === "home") {
    if (!isAuthenticated) {
      return (
        <div className="w-screen h-screen overflow-hidden bg-studio-bg select-none">
          <AuthPortalPage />
          <AlbumModal />
        </div>
      );
    }
  }

  // 1b. Landing Home View（已登录访问首页）
  if (currentView === "home") {
    return (
      <div className="w-screen h-screen overflow-hidden bg-studio-bg select-none">
        <LandingHomePage />
        <AdminManagementModal />
        <AiSettingsModal />
        <AlbumModal />
      </div>
    );
  }

  // 2. Studio Workspace View (Collage Studio + AI Stylize Studio)
  return (
    <div className="flex flex-col h-screen w-screen bg-studio-bg overflow-hidden text-studio-text select-none">
      {/* Top Global Navigation Header */}
      <Header />

      {/* Main Studio Area */}
      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        <LeftSidebar />

        {/* Center Stage: AI Stylize Studio Stage vs Konva Canvas Collage Stage */}
        <main className="flex-1 h-full relative overflow-hidden flex flex-col bg-studio-canvas-bg">
          {activePanel === "ai-create" ? (
            <AiCreativeStudioStage />
          ) : activePanel === "ai-retouch" || activePanel === "ai-stylize" ? (
            <AiStylizeStudioStage />
          ) : activePanel === "album" ? (
            <AlbumStudioStage />
          ) : activePanel === "media" ? (
            <MediaGalleryStudioStage />
          ) : (
            <CanvasStage />
          )}
        </main>

        {/* Right Sidebar: Properties (Visible in Collage mode) */}
        {activePanel !== "ai-create" && activePanel !== "ai-retouch" && activePanel !== "ai-stylize" && activePanel !== "album" && activePanel !== "media" && <RightSidebar />}
      </div>

      {/* Bottom Status Bar (Collage mode) */}
      {activePanel !== "ai-create" && activePanel !== "ai-retouch" && activePanel !== "ai-stylize" && activePanel !== "album" && activePanel !== "media" && <BottomBar />}

      {/* Global Modals */}
      <AuthModal />
      <ProjectManagerModal />
      <PresetSizeModal />
      <ExportModal />
      <AutoLayoutModal />
      <ReplacePhotoModal />
      <ShortCutModal />
      <AiSettingsModal />
      <AdminManagementModal />
      <AiStylizeModal />
      <AlbumModal />
      <WatermarkEditModal />
    </div>
  );
}

export default App;
