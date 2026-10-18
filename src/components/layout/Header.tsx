import React, { useState } from "react";
import { useEditorStore } from "../../store/useEditorStore";
 import {
   Sparkles,
  BookOpen,
   User,
   KeyRound,
   LogOut,
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
   Settings,
   Crown,
   ShieldCheck,
  Sun,
  Moon,
 } from "lucide-react";
 import { Button } from "../ui/Button";
 import { AvatarView } from "../ui/AvatarView";
import { WebsiteLogo } from "../ui/WebsiteLogo";
 
 export const Header: React.FC = () => {
   const document = useEditorStore((s) => s.document);
   const setDocument = useEditorStore((s) => s.setDocument);
   const isDirty = useEditorStore((s) => s.isDirty);
   const currentUser = useEditorStore((s) => s.currentUser);
   const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
   const savedProjects = useEditorStore((s) => s.savedProjects);
   const saveCurrentProject = useEditorStore((s) => s.saveCurrentProject);
   const setProjectModalOpen = useEditorStore((s) => s.setProjectModalOpen);
  const setAlbumModalOpen = useEditorStore((s) => s.setAlbumModalOpen);
   const setAuthModalOpen = useEditorStore((s) => s.setAuthModalOpen);
   const setCurrentView = useEditorStore((s) => s.setCurrentView);
   const logout = useEditorStore((s) => s.logout);
   const openAiStylizeModal = useEditorStore((s) => s.openAiStylizeModal);
   const setAiSettingsModalOpen = useEditorStore((s) => s.setAiSettingsModalOpen);
   const setAdminModalOpen = useEditorStore((s) => s.setAdminModalOpen);
   const activePanel = useEditorStore((s) => s.activePanel);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
 
  const isAiCreate = activePanel === "ai-create";
  const isAiStage = activePanel === "ai-retouch" || activePanel === "ai-stylize";
  const isGalleryMode = activePanel === "media";
  const isCollageMode = !isAiStage && !isAiCreate && activePanel !== "album" && !isGalleryMode;

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
  const themeMode = useEditorStore((s) => s.themeMode);
  const toggleThemeMode = useEditorStore((s) => s.toggleThemeMode);

  const [justSaved, setJustSaved] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          className="flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer text-left shrink-0 group py-0.5"
          title="点击返回登录与产品首页"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-amber-500/30 dark:border-amber-400/40 flex items-center justify-center text-amber-600 dark:text-studio-accent shadow-xs group-hover:border-amber-400 transition-colors">
            <WebsiteLogo className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.8} />
          </div>
          <span className="font-serif tracking-widest text-xs sm:text-sm font-bold text-stone-900 dark:text-studio-accent hidden xs:inline-block">
            留白集
          </span>
          <span className="hidden md:inline-block text-[9px] font-mono font-semibold tracking-[0.2em] uppercase text-stone-400 dark:text-stone-500 border border-stone-200 dark:border-stone-700 rounded px-1 py-0.5 leading-none">
            MarginLab
          </span>
        </button>

        {/* User Account Dropdown (Direct profile edit & 1-click logout) */}
        {isAuthenticated && currentUser ? (
          <div className="relative shrink-0" ref={userMenuRef}>
            <button
              id="header-user-dropdown-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={
                "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs text-studio-text transition-all cursor-pointer shadow-sm shrink-0 " +
                (userMenuOpen
                  ? "bg-studio-card border-studio-accent text-studio-accent ring-1 ring-studio-accent/40"
                  : "bg-studio-card hover:bg-studio-hover border-studio-border hover:text-studio-accent")
              }
              title={`当前账号：${currentUser.name} (@${currentUser.username}) • 点击快捷操作`}
            >
              <AvatarView avatar={currentUser.avatar} size="xs" />
              <span className="font-medium max-w-[55px] xs:max-w-[85px] sm:max-w-[110px] truncate text-[11px] sm:text-xs">
                {currentUser.name.split(" ")[0]}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-studio-muted transition-transform duration-200 ${
                  userMenuOpen ? "rotate-180 text-studio-accent" : "opacity-80"
                }`}
              />
            </button>

            {/* Quick Dropdown Menu */}
            {userMenuOpen && (
              <div
                id="header-user-dropdown-menu"
                className="absolute left-0 top-full mt-1.5 w-64 bg-studio-card border border-studio-border rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn space-y-1"
                onClick={(e) => e.stopPropagation()}
              >
               {/* User Info Header */}
               <div className="p-2.5 rounded-xl bg-studio-panel border border-studio-border flex items-center gap-2.5 mb-1">
                 <div className="w-9 h-9 rounded-xl bg-studio-card border border-studio-accent/40 flex items-center justify-center text-lg shrink-0 shadow-inner">
                   <AvatarView avatar={currentUser.avatar} size="sm" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex items-center justify-between gap-1">
                     <h4 className="text-xs font-semibold text-studio-text truncate">
                       {currentUser.name}
                     </h4>
                     <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-600 border border-emerald-500/30 shrink-0">
                       在线
                     </span>
                   </div>
                   <p className="text-[10px] font-mono text-studio-accent truncate mt-0.5">
                     @{currentUser.username} • {currentUser.role || "独立创作者"}
                   </p>
                 </div>
               </div>
 
               {/* Admin Control Center Option (Only for Admins) */}
               {currentUser.isAdmin && (
                 <>
                   <button
                     id="header-admin-control-btn"
                     onClick={() => {
                       setUserMenuOpen(false);
                       setAdminModalOpen(true, "users");
                     }}
                     className="w-full px-2.5 py-2 rounded-xl text-left text-xs bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-600 border border-amber-500/40 flex items-center gap-2.5 transition-colors cursor-pointer group"
                   >
                     <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-600 border border-amber-500/30">
                       <Crown className="w-3.5 h-3.5" />
                     </div>
                     <div className="flex-1">
                       <span className="font-semibold flex items-center gap-1.5">
                         系统管理与创作者管控
                         <span className="text-[9px] font-mono px-1 rounded bg-amber-500/30 text-amber-800 dark:text-amber-600">ADMIN</span>
                       </span>
                       <span className="text-[10px] text-amber-800/80 dark:text-amber-200/70 block">账号封禁、重设密码、AI 模型配置</span>
                     </div>
                   </button>
                   <div className="h-[1px] bg-studio-border my-1 mx-1" />
                 </>
               )}
 
               {/* Option 1: Edit Profile / Personal Center */}
               <button
                 onClick={() => {
                   setUserMenuOpen(false);
                   setAuthModalOpen(true, "profile");
                 }}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs text-studio-text hover:text-studio-accent hover:bg-studio-hover flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-lg bg-studio-panel flex items-center justify-center text-studio-muted group-hover:text-studio-accent border border-studio-border/60">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">编辑账号与个人中心</span>
                    <span className="text-[10px] text-studio-muted block">修改昵称、头像、简介</span>
                  </div>
                </button>

                {/* Option 2: Change Password */}
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setAuthModalOpen(true, "changePassword");
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs text-studio-text hover:text-studio-accent hover:bg-studio-hover flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-lg bg-studio-panel flex items-center justify-center text-studio-muted group-hover:text-studio-accent border border-studio-border/60">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">修改登录密码</span>
                    <span className="text-[10px] text-studio-muted block">更新安全密码凭证</span>
                  </div>
                </button>

               {/* Option 3: Switch / Login Other Account */}
               <button
                 onClick={() => {
                   setUserMenuOpen(false);
                   setAuthModalOpen(true, "login");
                 }}
                 className="w-full px-2.5 py-2 rounded-xl text-left text-xs text-studio-text hover:text-studio-accent hover:bg-studio-hover flex items-center gap-2.5 transition-colors cursor-pointer group"
               >
                 <div className="w-6 h-6 rounded-lg bg-studio-panel flex items-center justify-center text-studio-muted group-hover:text-studio-accent border border-studio-border/60">
                   <LogIn className="w-3.5 h-3.5" />
                 </div>
                 <div className="flex-1">
                   <span className="font-medium">切换其他账号登录</span>
                   <span className="text-[10px] text-studio-muted block">进入其他创作者空间</span>
                 </div>
               </button>
 
               <div className="h-[1px] bg-studio-border my-1 mx-1" />
 
               {/* Option 5: Instant 1-Click Logout */}
                <button
                  id="header-user-logout-btn"
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await logout();
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs text-red-600 dark:text-red-600 hover:text-red-700 dark:hover:text-red-600 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 flex items-center gap-2.5 transition-colors cursor-pointer group"
                  title="一键退出当前登录，返回首页"
                >
                  <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-600 border border-red-500/20">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold">退出当前登录</span>
                    <span className="text-[10px] text-red-600/80 dark:text-red-600/70 block">直接退出并返回登录页</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true, "login")}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-studio-accent hover:bg-studio-accentHover text-white text-[11px] sm:text-xs font-semibold shadow-subtle-glow transition-all cursor-pointer shrink-0"
            title="登录或注册专属个人账号"
          >
            <LogIn className="w-3 h-3" />
            <span>登录</span>
          </button>
        )}

        {/* Collage Specific Tools: Canvas Preset, Projects, Admin Quick, Quick Save */}
        {isCollageMode && (
          <>
            {/* Preset Size Pill */}
            <button
              onClick={() => setPresetModalOpen(true)}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-studio-card hover:bg-studio-hover border border-studio-border text-[11px] sm:text-xs font-mono text-studio-muted hover:text-studio-text transition-colors cursor-pointer shrink-0 max-w-[110px] xs:max-w-[145px] sm:max-w-[180px]"
              title="修改相纸或画布尺寸 (米家6寸/3寸、A4等)"
            >
              <Maximize2 className="w-3 h-3 text-studio-accent shrink-0" />
              <span className="truncate">
                {document.canvas.presetName || "画布规格"}
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
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-studio-accent/20 text-white font-semibold">
                  {savedProjects.length}
                </span>
              )}
            </button>

            {/* Admin Control Center Quick Button (Only for Admins in collage mode) */}
            {currentUser?.isAdmin && (
              <button
                id="header-admin-quick-btn"
                onClick={() => setAdminModalOpen(true, "users")}
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-600 font-medium transition-all cursor-pointer shrink-0 shadow-xs"
                title="打开系统管理后台（创作者账号与全局 AI 大模型管控）"
              >
                <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-600" />
                <span>管理后台</span>
              </button>
            )}

            {/* Save Status / Quick Save Button */}
            <button
              onClick={handleQuickSave}
              className={
                "flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs transition-all border cursor-pointer shrink-0 " +
                (justSaved
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-600 font-semibold"
                  : isDirty
                  ? "bg-amber-500/15 border-amber-500/50 text-amber-800 dark:text-amber-600 hover:bg-amber-500/25 font-medium"
                  : "bg-studio-card border-studio-border text-studio-muted hover:text-studio-text")
              }
              title="保存画作到当前账号作品库"
            >
              {justSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-600" />
                  <span className="hidden sm:inline-block">已保存</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 text-studio-accent" />
                  <span className="hidden sm:inline-block">{isDirty ? "保存*" : "保存"}</span>
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Center AI Retouch / Stylize Breadcrumb Indicator */}
      {isAiCreate && (
        <div className="hidden sm:flex items-center gap-2 text-xs font-serif tracking-widest text-stone-600 dark:text-gray-700">
          <span className="opacity-60">留白集</span>
          <span className="opacity-40">/</span>
          <span className="font-semibold text-gray-900">
            AI 自由创作生图工作台
          </span>
        </div>
      )}

      {isAiStage && (
        <div className="hidden sm:flex items-center gap-2 text-xs font-serif tracking-widest text-stone-600 dark:text-gray-700">
          <span className="opacity-60">留白集</span>
          <span className="opacity-40">/</span>
          <span className="font-semibold text-gray-900">
            {activePanel === "ai-retouch" ? "AI 质感修图工作台" : "AI 先锋风格化工作台"}
          </span>
        </div>
      )}

      {/* Center Gallery Breadcrumb Indicator */}
      {isGalleryMode && (
        <div className="hidden sm:flex items-center gap-2 text-xs font-serif tracking-widest text-stone-600 dark:text-gray-700">
          <span className="opacity-60">留白集</span>
          <span className="opacity-40">/</span>
          <span className="font-semibold text-gray-900">
            我的图库 · 文件资产浏览器
          </span>
        </div>
      )}

      {/* Center Controls: Undo / Redo / Zoom (Collage Mode Only) */}
      {isCollageMode && (
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
      )}

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

        {/* Collage Mode Only: Quick AI Stylize & Auto Layout */}
        {isCollageMode && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActivePanel("ai-retouch")}
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold shadow-xs transition-all text-amber-800 dark:text-amber-600 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
              title="打开 AI 质感修图创作工作台"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 修图</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAutoLayoutModalOpen(true)}
              className="hidden md:flex items-center gap-1 text-studio-text border-studio-border text-xs"
            >
              <Wand2 className="w-3.5 h-3.5 text-studio-accent" />
              <span>智能排版</span>
            </Button>
          </>
        )}

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
              className="absolute right-0 top-9 w-44 bg-studio-card border border-studio-border rounded-xl shadow-2xl p-1.5 space-y-1 z-50 animate-fadeIn"
              onClick={() => setMobileMenuOpen(false)}
            >
              <button
                onClick={() => setProjectModalOpen(true)}
                className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-studio-text hover:bg-studio-hover flex items-center gap-2 cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5 text-studio-accent" />
                <span>我的作品库 ({savedProjects.length})</span>
              </button>
              <button
                onClick={() => setAutoLayoutModalOpen(true)}
                className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-studio-text hover:bg-studio-hover flex items-center gap-2 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5 text-studio-accent" />
                <span>智能一键排版</span>
              </button>
              <button
                onClick={() => setShortcutModalOpen(true)}
                className="w-full px-2.5 py-1.5 rounded-lg text-left text-xs text-studio-text hover:bg-studio-hover flex items-center gap-2 cursor-pointer"
              >
                <Keyboard className="w-3.5 h-3.5 text-studio-accent" />
                <span>手势与操作指南</span>
              </button>
            </div>
          )}
        </div>

        {/* Main CTA: Export (Hidden in AI Stylize) */}
        {isCollageMode && (
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
        )}
      </div>

      {/* Instant Toast Notification */}
      {showSaveToast && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-white border border-emerald-500/40 text-emerald-600 text-xs font-mono shadow-2xl flex items-center gap-2 z-50 backdrop-blur-md animate-fadeIn whitespace-nowrap">
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            已存档至「{currentUser ? currentUser.name : "本地"}」作品库
          </span>
        </div>
      )}
    </header>
  );
};
