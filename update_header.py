content = """import React, { useState } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import {
  Sparkles,
  Download,
  Undo2,
  Redo2,
  Maximize2,
  Wand2,
  Keyboard,
  ZoomIn,
  ZoomOut,
  FolderOpen,
  Save,
  Check,
  ChevronDown,
  LogIn,
  MoreVertical,
  Layers,
} from "lucide-react";
import { Button } from "../ui/Button";
import { AvatarView } from "../ui/AvatarView";

export const Header: React.FC = () => {
  const document = useEditorStore((s) => s.document);
  const setDocument = useEditorStore((s) => s.setDocument);
  const isDirty = useEditorStore((s) => s.isDirty);
  const currentUser = useEditorStore((s) => s.currentUser);
  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
  const savedProjects = useEditorStore((s) => s.savedProjects);
  const saveCurrentProject = useEditorStore((s) => s.saveCurrentProject);
  const setProjectModalOpen = useEditorStore((s) => s.setProjectModalOpen);
  const setAuthModalOpen = useEditorStore((s) => s.setAuthModalOpen);
  const setCurrentView = useEditorStore((s) => s.setCurrentView);
  const logout = useEditorStore((s) => s.logout);

  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore((s) => s.canUndo());
  const canRedo = useEditorStore((s) => s.canRedo());
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const setExportModalOpen = useEditorStore((s) => s.setExportModalOpen);
  const setPresetModalOpen = useEditorStore((s) => s.setPresetModalOpen);
  const setShortcutModalOpen = useEditorStore((s) => s.setShortcutModalOpen);
  const setAutoLayoutModalOpen = useEditorStore((s) => s.setAutoLayoutModalOpen);

  const [justSaved, setJustSaved] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleQuickSave = async () => {
    if (!currentUser || !isAuthenticated) {
      setAuthModalOpen(true, "login");
      return;
    }
    await saveCurrentProject(document.name);
    setJustSaved(true);
    setShowSaveToast(true);
    setTimeout(() => {
      setJustSaved(false);
      setShowSaveToast(false);
    }, 2200);
  };

  const handleResetZoom = () => {
    setZoom(0.55);
  };

  return (
    <header className="h-13 sm:h-14 border-b border-studio-border bg-studio-sidebar/95 backdrop-blur-md px-2 sm:px-4 flex items-center justify-between select-none z-30 relative shrink-0">
      {/* Left: Brand, User Avatar, Preset & Project */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Brand Home Link */}
        <button
          onClick={() => setCurrentView("home")}
          className="flex items-center gap-1 hover:opacity-85 transition-opacity cursor-pointer text-left shrink-0"
          title="点击返回登录与产品首页"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-stone-800 to-stone-600 border border-studio-accent/40 flex items-center justify-center text-studio-accent shadow-sm">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <span className="font-serif tracking-widest text-xs sm:text-sm font-semibold text-studio-accent hidden xs:inline-block">
            ATELIER
          </span>
        </button>

        {/* User Account / Auth Button */}
        {isAuthenticated && currentUser ? (
          <button
            onClick={() => setAuthModalOpen(true, "profile")}
            className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg bg-studio-card hover:bg-studio-hover border border-studio-border text-xs text-studio-text hover:text-studio-accent transition-all cursor-pointer group shadow-sm shrink-0"
            title={`当前账号：${currentUser.name} (@${currentUser.username}) • 点击进入个人中心`}
          >
            <AvatarView avatar={currentUser.avatar} size="xs" />
            <span className="font-medium max-w-[50px] xs:max-w-[75px] sm:max-w-[100px] truncate text-[11px] sm:text-xs">
              {currentUser.name.split(" ")[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-studio-muted group-hover:text-studio-accent opacity-70 hidden sm:inline-block" />
          </button>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true, "login")}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-studio-accent hover:bg-studio-accentHover text-zinc-950 text-[11px] sm:text-xs font-semibold shadow-subtle-glow transition-all cursor-pointer shrink-0"
            title="登录或注册专属个人账号"
          >
            <LogIn className="w-3 h-3" />
            <span>登录</span>
          </button>
        )}

        {/* Preset Size Pill */}
        <button
          onClick={() => setPresetModalOpen(true)}
          className="flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-full bg-studio-card hover:bg-studio-hover border border-studio-border text-[10px] sm:text-[11px] font-mono text-studio-muted hover:text-studio-text transition-colors cursor-pointer shrink-0 max-w-[90px] xs:max-w-[120px] sm:max-w-[150px]"
          title="修改相纸或画布尺寸 (米家6寸/3寸、A4等)"
        >
          <Maximize2 className="w-3 h-3 text-studio-accent shrink-0" />
          <span className="truncate">
            {document.canvas.presetName?.split(" ")[0] || "尺寸"}
          </span>
        </button>

        {/* Project Gallery Button */}
        <button
          onClick={() => setProjectModalOpen(true)}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-studio-card hover:bg-studio-hover border border-studio-border text-xs text-studio-text hover:text-studio-accent transition-colors cursor-pointer shrink-0"
          title="打开我的作品库与自制模板"
        >
          <FolderOpen className="w-3.5 h-3.5 text-studio-accent" />
          <span className="font-medium">作品库</span>
          {savedProjects.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-studio-accent/20 text-studio-accent font-semibold">
              {savedProjects.length}
            </span>
          )}
        </button>

        {/* Save Status / Quick Save Button */}
        <button
          onClick={handleQuickSave}
          className={
            "flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-lg text-xs transition-all border cursor-pointer shrink-0 " +
            (justSaved
              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 font-semibold"
              : isDirty
              ? "bg-studio-accent/20 border-studio-accent/60 text-studio-accent hover:bg-studio-accent/30 font-medium animate-pulse"
              : "bg-studio-card border-studio-border text-studio-muted hover:text-studio-text")
          }
          title="保存画作到当前账号作品库"
        >
          {justSaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline-block">已保存</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline-block">{isDirty ? "保存*" : "保存"}</span>
            </>
          )}
        </button>
      </div>

      {/* Center Controls: Undo / Redo / Zoom (Desktop md+) */}
      <div className="hidden md:flex items-center gap-1 bg-studio-panel border border-studio-border p-1 rounded-lg">
        <button
          onClick={undo}
          disabled={!canUndo}
          title="撤销 (Cmd/Ctrl+Z)"
          className="p-1.5 rounded hover:bg-studio-hover text-studio-muted hover:text-studio-text disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          title="重做 (Cmd/Ctrl+Shift+Z)"
          className="p-1.5 rounded hover:bg-studio-hover text-studio-muted hover:text-studio-text disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-3 w-[1px] bg-studio-border mx-1" />

        <button
          onClick={() => setZoom((z) => Math.max(0.1, z - 0.08))}
          className="p-1.5 rounded hover:bg-studio-hover text-studio-muted hover:text-studio-text transition-colors cursor-pointer"
          title="缩小"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleResetZoom}
          className="px-2 py-0.5 rounded text-[11px] font-mono text-studio-muted hover:text-studio-text hover:bg-studio-hover transition-colors min-w-[48px] text-center cursor-pointer"
          title="重置居中缩放"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => setZoom((z) => Math.min(4.0, z + 0.08))}
          className="p-1.5 rounded hover:bg-studio-hover text-studio-muted hover:text-studio-text transition-colors cursor-pointer"
          title="放大"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {/* Mobile quick undo/redo in header for mobile screens */}
        <div className="flex md:hidden items-center bg-studio-card border border-studio-border rounded-lg p-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            title="撤销"
            className="p-1 rounded text-studio-muted hover:text-studio-text disabled:opacity-25 transition-colors cursor-pointer"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            title="重做"
            className="p-1 rounded text-studio-muted hover:text-studio-text disabled:opacity-25 transition-colors cursor-pointer"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setAutoLayoutModalOpen(true)}
          className="hidden md:flex items-center gap-1 text-studio-text border-studio-border text-xs"
        >
          <Wand2 className="w-3.5 h-3.5 text-studio-accent" />
          <span>智能排版</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShortcutModalOpen(true)}
          title="快捷键指南"
          className="hidden sm:flex"
        >
          <Keyboard className="w-4 h-4" />
        </Button>

        {/* Mobile More Options Dropdown Trigger */}
        <div className="relative sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-studio-card hover:bg-studio-hover border border-studio-border text-studio-muted hover:text-studio-text cursor-pointer"
            title="更多工具"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>

          {mobileMenuOpen && (
            <div
              className="absolute right-0 top-9 w-44 bg-zinc-900 border border-studio-border rounded-xl shadow-2xl p-1.5 space-y-1 z-50 animate-fadeIn"
              onClick={() => setMobileMenuOpen(false)}
            >
              <button
                onClick={() => setProjectModalOpen(true)}
                className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-studio-text hover:bg-white/10 flex items-center gap-2"
              >
                <FolderOpen className="w-3.5 h-3.5 text-studio-accent" />
                <span>我的作品库 ({savedProjects.length})</span>
              </button>
              <button
                onClick={() => setAutoLayoutModalOpen(true)}
                className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-studio-text hover:bg-white/10 flex items-center gap-2"
              >
                <Wand2 className="w-3.5 h-3.5 text-studio-accent" />
                <span>智能一键排版</span>
              </button>
              <button
                onClick={() => setShortcutModalOpen(true)}
                className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-studio-text hover:bg-white/10 flex items-center gap-2"
              >
                <Keyboard className="w-3.5 h-3.5 text-studio-accent" />
                <span>手势与操作指南</span>
              </button>
            </div>
          )}
        </div>

        {/* Main CTA: Export */}
        <Button
          variant="accent"
          size="sm"
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-1 shadow-subtle-glow px-2 sm:px-3 text-xs font-semibold py-1 sm:py-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">导出 / 冲印</span>
          <span className="xs:hidden">导出</span>
        </Button>
      </div>

      {/* Instant Toast Notification */}
      {showSaveToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-zinc-900/95 border border-emerald-500/40 text-emerald-300 text-xs font-mono shadow-2xl flex items-center gap-2 z-50 backdrop-blur-md animate-fadeIn whitespace-nowrap">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>
            已存档至「{currentUser ? currentUser.name : "本地"}」作品库
          </span>
        </div>
      )}
    </header>
  );
};
"""
with open("src/components/layout/Header.tsx", "w") as f:
    f.write(content)
print("Updated Header.tsx successfully!")
