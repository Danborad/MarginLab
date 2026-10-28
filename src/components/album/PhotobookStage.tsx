import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Album, AlbumTheme } from '../../types/album';
import { useEditorStore } from '../../store/useEditorStore';
import { Photobook3D } from './book/Photobook3D';
import { PageConfigModal, PageConfigTarget } from "./PageConfigModal";
import { FaceContext } from './book/BookFaces';
import { usePageTurn } from './book/usePageTurn';
import {
  BLOCK_MAX,
  BOARD_OVH,
  PAGE_H,
  PAGE_W,
  clampIndex,
} from './book/bookModel';
import {
  BookOpen,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Upload,
  Trash2,
  Plus,
  Play,
  Pause,
  Edit2,
  Check,
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  LogIn,
  Eye,
} from 'lucide-react';

export interface PhotobookStageProps {
  album: Album;
  onUpdateTitle: (title: string) => void;
  onUpdateTheme: (theme: AlbumTheme) => void;
  onDeleteSpread: (index: number) => void;
  onOpenAddModal: () => void;
  onOpenExportModal: () => void;
  onClose?: () => void;
}

/* ── 主题桌面背景 ──────────────────────────────────────────────── */
const THEME_SKIN: Record<AlbumTheme, { bg: string; isLight: boolean }> = {
  // 2026-10 重构：书页仍是米白纸张，但「书桌/舞台」统一为暗色，避免整块白底刺眼
  indigo: { bg: '#0B0D11', isLight: false },
  slate: { bg: '#0B0D11', isLight: false },
  dark: { bg: '#0B0D11', isLight: false },
  neutral: { bg: '#0B0D11', isLight: false },
  burgundy: { bg: '#0B0D11', isLight: false },
  forest: { bg: '#0B0D11', isLight: false },
};

const THEME_COLOR: Record<AlbumTheme, string> = {
  indigo: '#3B3E52',
  slate: '#272935',
  dark: '#15161D',
  neutral: '#E3E3E8',
  burgundy: '#4A1521',
  forest: '#1B3B2B',
};

/* 舞台留白：保证硬壳包边、翻页掠影与闭合侧转都不会被裁切 */
const BOUND_PAD_X = BOARD_OVH + BLOCK_MAX + 18;
const BOUND_PAD_Y = BOARD_OVH + BLOCK_MAX + 18;

export const PhotobookStage: React.FC<PhotobookStageProps> = ({
  album,
  onUpdateTitle,
  onUpdateTheme,
  onDeleteSpread,
  onOpenAddModal,
  onOpenExportModal,
  onClose,
}) => {
  const spreads = useMemo(() => album.spreads || [], [album.spreads]);
  const totalSpreads = spreads.length;
  const totalPages = totalSpreads * 2 + 1;
  const nRef = useRef(totalSpreads);
  nRef.current = totalSpreads;

  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
  const setAuthModalOpen = useEditorStore((s) => s.setAuthModalOpen);

  /* ── 基础 UI 状态 ─────────────────────────────────────────── */
  const [viewMode, setViewMode] = useState<'book' | 'grid'>('book');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(album.title);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pageConfigTarget, setPageConfigTarget] = useState<PageConfigTarget | null>(null);
  const [isPageConfigOpen, setIsPageConfigOpen] = useState(false);

  const handleOpenEditPage = useCallback(
    (target: "cover" | "backCover" | "page", spreadIndex?: number, side?: "left" | "right") => {
      if (!isAuthenticated) {
        setToast("当前为只读速览模式，请注册专属账号后开启排版编辑");
        setAuthModalOpen(true, "register");
        return;
      }
      setPageConfigTarget({ type: target, spreadIndex, side });
      setIsPageConfigOpen(true);
    },
    [isAuthenticated, setAuthModalOpen]
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);

  /* ── 阅读位置：与全局 store 双向同步 ─────────────────────── */
  const storeIndex = useEditorStore((s) => s.currentSpreadIndex);
  const setStoreIndex = useEditorStore((s) => s.setCurrentSpreadIndex);
  const [index, setIndex] = useState(() => clampIndex(storeIndex ?? -1, totalSpreads));

  useEffect(() => {
    if (isEditingTitle) return;
    setTitleDraft(album.title);
  }, [album.title, isEditingTitle]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  /* ── 视口自适应缩放 ───────────────────────────────────────── */
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const compute = () => {
      const sw = stage.clientWidth;
      const sh = stage.clientHeight;
      if (!sw || !sh) return;
      const padX = sw > 780 ? 132 : 24;
      const boundW = PAGE_W * 2 + 2 * BOUND_PAD_X;
      const boundH = PAGE_H + 2 * BOUND_PAD_Y + 46;
      const s = Math.min((sw - padX) / boundW, (sh - 44) / boundH);
      setScale(Math.min(1.14, Math.max(0.3, s)));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(stage);
    window.addEventListener('resize', compute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', compute);
    };
  }, [viewMode]);

  /* ── 翻页控制 ─────────────────────────────────────────────── */
  const onCommit = useCallback(
    (next: number) => {
      setIndex(next);
      setStoreIndex(next);
    },
    [setStoreIndex]
  );

  /* 轻点由舞台判定左右：点击右半页前进、左半页后退 */
  const turnRefApi = useRef<{ next: () => void; prev: () => void }>({
    next: () => {},
    prev: () => {},
  });
  const handleTap = useCallback(
    (clientX: number) => {
      if (totalSpreads <= 0) return;
      if (index === -1) return turnRefApi.current.next();
      if (index >= totalSpreads) return turnRefApi.current.prev();
      const rect = bookRef.current?.getBoundingClientRect();
      if (!rect) return;
      if (clientX > rect.left + rect.width / 2) turnRefApi.current.next();
      else turnRefApi.current.prev();
    },
    [index, totalSpreads]
  );

  const turnApi = usePageTurn({
    index,
    totalSpreads,
    scale,
    onCommit,
    onTap: handleTap,
  });
  const { turn, goNext, goPrev, jump } = turnApi;
  turnRefApi.current = { next: goNext, prev: goPrev };

  const turnActive = !!turn;

  /* store 外部变更（如相册面板跳页）同步到本地 */
  useEffect(() => {
    if (turnActive) return;
    const target = clampIndex(storeIndex ?? -1, totalSpreads);
    setIndex((prev) => (prev === target ? prev : target));
  }, [storeIndex, totalSpreads, turnActive]);

  /* 页数变化时收敛当前页，避免越界空白 */
  useEffect(() => {
    setIndex((prev) => {
      const clamped = clampIndex(prev, totalSpreads);
      if (clamped !== prev) setStoreIndex(clamped);
      return clamped;
    });
  }, [totalSpreads, setStoreIndex]);

  /* ── 键盘 & 自动放映 ─────────────────────────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditingTitle) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        if (viewMode === 'grid') setViewMode('book');
        else onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, viewMode, isEditingTitle, onClose]);

  useEffect(() => {
    if (!isPlaying || turnActive) return;
    if (index >= totalSpreads) {
      setIsPlaying(false);
      return;
    }
    const t = window.setTimeout(() => goNext(), 3200);
    return () => window.clearTimeout(t);
  }, [isPlaying, turnActive, index, totalSpreads, goNext]);

  /* ── 全屏 ─────────────────────────────────────────────────── */
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  /* ── 标题 / 删除 ──────────────────────────────────────────── */
  const handleSaveTitle = () => {
    if (titleDraft.trim()) onUpdateTitle(titleDraft.trim());
    setIsEditingTitle(false);
  };

  const handleDeleteCurrent = () => {
    if (index < 0 || index >= totalSpreads) {
      setToast('封面与封底为画册装订，不可删除');
      setConfirmDelete(false);
      return;
    }
    onDeleteSpread(index);
    setConfirmDelete(false);
    setToast('已删除当前对开页');
    // 删掉的是最后一个对开页时向前收一页，避免停在空白处
    const remain = Math.max(-1, totalSpreads - 1);
    onCommit(clampIndex(Math.min(index, totalSpreads - 2), remain));
  };

  /* ── 主题样式 ─────────────────────────────────────────────── */
  const skin = THEME_SKIN[album.theme || 'indigo'] ?? THEME_SKIN.indigo;
  const isLight = skin.isLight;
  // 舞台统一为暗色，工具条走磨砂玻璃，书页本身仍保留米白纸张
  const currentThemeCls = isLight ? 'text-zinc-900' : 'text-white';
  const subTextCls = isLight ? 'text-zinc-600' : 'text-white/55';
  const frostedPillCls = isLight
    ? 'bg-white border border-black/10 shadow-lg text-zinc-900'
    : 'glass-float text-white';
  const toolBtnCls = isLight
    ? 'bg-black/5 hover:bg-black/10 text-zinc-700 hover:text-white'
    : 'bg-white/10 hover:bg-white/20 text-white';

  /* ── 从头翻开画册 (彻底重置至封面 -1 并更新状态) ────────── */
  const handleRestart = useCallback(() => {
    setIsPlaying(false);
    jump(-1);
    onCommit(-1);
    setToast("已返回画册封面");
  }, [jump, onCommit]);

  const onRestart = handleRestart;
  const faceCtx = useMemo<FaceContext>(
    () => ({
      album,
      totalPages,
      onPlaceholderClick: isAuthenticated
        ? onOpenAddModal
        : () => {
            setToast("当前为只读画册速览，请注册专属账号后开启排版编辑");
            setAuthModalOpen(true, "register");
          },
      onRestart,
      onEditPage: isAuthenticated ? handleOpenEditPage : undefined,
      interactive: !turn,
    }),
    [album, totalPages, isAuthenticated, setAuthModalOpen, onOpenAddModal, onRestart, handleOpenEditPage, turn]
  );

  const pageLabel =
    index === -1
      ? '画册封面 · 闭合精装'
      : index >= totalSpreads
      ? '画册封底 · 翻阅完毕'
      : `第 ${index * 2 + 1} - ${index * 2 + 2} 页 · 共 ${totalPages} 页`;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 w-full h-full flex flex-col overflow-hidden select-none transition-colors duration-500"
      style={{ background: skin.bg }}
    >
      {/* ── 顶部控制栏 ─────────────────────────────────────── */}
      <div className="relative z-30 px-4 sm:px-6 pt-3 pb-2 flex items-center justify-between shrink-0 gap-3">
        <div className={`flex items-center gap-1 p-1 rounded-xl ${frostedPillCls}`}>
          <button
            onClick={() => setViewMode('book')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
              viewMode === 'book'
                ? isLight
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'bg-white/20 text-gray-900 shadow-sm ring-1 ring-white/30'
                : isLight
                ? 'text-zinc-500 hover:text-zinc-900'
                : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">对开翻书</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
              viewMode === 'grid'
                ? isLight
                  ? 'bg-white text-zinc-900 shadow-sm'
                  : 'bg-white/20 text-gray-900 shadow-sm ring-1 ring-white/30'
                : isLight
                ? 'text-zinc-500 hover:text-zinc-900'
                : 'text-gray-500 hover:text-gray-950'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">全书速览</span>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center text-center min-w-0">
          {isEditingTitle ? (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl ${frostedPillCls}`}>
              <input
                type="text"
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                className={`bg-transparent text-sm sm:text-base font-serif font-bold outline-none text-center w-44 sm:w-60 ${currentThemeCls}`}
              />
              <button
                onClick={handleSaveTitle}
                className="p-1 rounded-lg bg-amber-500 text-zinc-950 hover:bg-amber-400 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                if (!isAuthenticated) {
                  setToast("当前为只读速览模式，请注册专属账号后开启排版编辑");
                  setAuthModalOpen(true, "register");
                  return;
                }
                setIsEditingTitle(true);
              }}
              className="group flex items-center gap-1.5 cursor-pointer max-w-[46vw]"
              title={isAuthenticated ? "点击编辑相册标题" : "当前为只读模式"}
            >
              <h2 className={`text-base sm:text-lg font-serif font-bold tracking-wider truncate ${currentThemeCls}`}>
                {album.title || '艺术相册'}
              </h2>
              <Edit2
                className={`w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                  isLight ? 'text-zinc-400' : 'text-gray-500'
                }`}
              />
            </div>
          )}

          <div className={`flex items-center gap-1.5 text-[11px] font-sans mt-0.5 ${subTextCls}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{pageLabel}</span>
            <span className="ml-1 opacity-70 hidden sm:inline">· 拖动或点击翻页</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAuthenticated && (
            <button
              onClick={() => setAuthModalOpen(true, "login")}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>登录 / 注册</span>
            </button>
          )}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl transition-all cursor-pointer ${toolBtnCls} ${
              isLight ? 'border border-black/10' : 'border border-gray-200'
            }`}
            title={isFullscreen ? '退出全屏' : '全屏翻阅'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all cursor-pointer ${toolBtnCls} ${
                isLight ? 'border border-black/10' : 'border border-gray-200'
              }`}
              title="关闭画册"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── 主舞台 ─────────────────────────────────────────── */}
      <div ref={stageRef} className="relative flex-1 w-full min-h-0 flex items-center justify-center overflow-hidden">
        {viewMode === 'grid' ? (
          <div className="w-full h-full overflow-y-auto px-4 sm:px-6 py-4 no-scrollbar animate-fadeIn">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto pb-4">
              <div
                onClick={() => {
                  jump(-1);
                  setViewMode('book');
                }}
                className={`group rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                  isLight ? 'bg-white shadow-md' : 'bg-black/40 shadow-xl'
                } ${
                  index === -1
                    ? 'border-amber-400 ring-2 ring-amber-400/30'
                    : isLight
                    ? 'border-black/10 hover:border-black/30'
                    : 'border-gray-200 hover:border-white/40'
                }`}
              >
                <div className="aspect-[3/2] overflow-hidden relative flex items-center justify-center p-2 bg-white">
                  <div className="h-full aspect-[3/4.2] rounded-r-md overflow-hidden shadow-md relative">
                    <img
                      src={album.coverImage}
                      alt=""
                      draggable={false}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-2 text-gray-900 flex items-end justify-between">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 font-bold">
                      画册封面
                    </span>
                    <h5 className="text-[11px] font-bold font-serif truncate max-w-[120px]">{album.title}</h5>
                  </div>
                </div>
              </div>

              {spreads.map((sp, idx) => (
                <div
                  key={sp.id}
                  onClick={() => {
                    jump(idx);
                    setViewMode('book');
                  }}
                  className={`group rounded-xl overflow-hidden border-2 cursor-pointer transition-all relative ${
                    isLight ? 'bg-white shadow-md' : 'bg-black/40 shadow-xl'
                  } ${
                    index === idx
                      ? 'border-amber-400 ring-2 ring-amber-400/30'
                      : isLight
                      ? 'border-black/10 hover:border-black/30'
                      : 'border-gray-200 hover:border-white/40'
                  }`}
                >
                  <div className="aspect-[3/2] overflow-hidden relative flex bg-stone-100">
                    {/* 左半页缩略 */}
                    <div className="w-1/2 h-full overflow-hidden border-r border-black/10 relative bg-[#FAF8F5]">
                      {sp.leftPage.image ? (
                        <img
                          src={sp.leftPage.image}
                          alt=""
                          draggable={false}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full p-2 flex flex-col justify-between select-none">
                          <span className="text-[8px] font-mono text-amber-700 bg-amber-500/15 px-1 py-0.2 rounded w-max">
                            {sp.leftPage.layoutType}
                          </span>
                          <span className="text-[9px] font-serif text-stone-600 truncate">{sp.leftPage.title || "纯白相纸"}</span>
                        </div>
                      )}
                    </div>

                    {/* 右半页缩略 */}
                    <div className="w-1/2 h-full overflow-hidden relative bg-[#FAF8F5]">
                      {sp.rightPage.image ? (
                        <img
                          src={sp.rightPage.image}
                          alt=""
                          draggable={false}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full p-2 flex flex-col justify-between select-none">
                          <span className="text-[8px] font-mono text-amber-700 bg-amber-500/15 px-1 py-0.2 rounded w-max">
                            {sp.rightPage.layoutType}
                          </span>
                          <span className="text-[9px] font-serif text-stone-600 truncate">{sp.rightPage.title || "纯白相纸"}</span>
                        </div>
                      )}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 text-gray-900 flex items-end justify-between z-10">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/20">
                        P.{idx * 2 + 1} - {idx * 2 + 2}
                      </span>
                      <h5 className="text-[11px] font-bold font-serif truncate max-w-[110px]">
                        {sp.title || `对开 ${idx + 1}`}
                      </h5>
                    </div>

                    {/* 悬停快捷编辑按键 */}
                    {isAuthenticated && (
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditPage('page', idx, 'left');
                        }}
                        className="p-1 rounded-lg bg-white hover:bg-gray-100 text-gray-900 text-[10px] flex items-center gap-0.5 shadow-md border border-white/20"
                        title="编辑左页"
                      >
                        <Edit2 className="w-2.5 h-2.5 text-amber-600" />
                        <span>左</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditPage('page', idx, 'right');
                        }}
                        className="p-1 rounded-lg bg-white hover:bg-gray-100 text-gray-900 text-[10px] flex items-center gap-0.5 shadow-md border border-white/20"
                        title="编辑右页"
                      >
                        <Edit2 className="w-2.5 h-2.5 text-amber-600" />
                        <span>右</span>
                      </button>
                    </div>
                    )}
                  </div>
                </div>
              ))}

              {/* 封底速览卡片 */}
              <div
                onClick={() => {
                  jump(totalSpreads);
                  setViewMode('book');
                }}
                className={`group rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                  isLight ? 'bg-white shadow-md' : 'bg-black/40 shadow-xl'
                } ${
                  index >= totalSpreads
                    ? 'border-amber-400 ring-2 ring-amber-400/30'
                    : isLight
                    ? 'border-black/10 hover:border-black/30'
                    : 'border-gray-200 hover:border-white/40'
                }`}
              >
                <div className="aspect-[3/2] overflow-hidden relative flex items-center justify-center p-2 bg-white">
                  <div className="h-full aspect-[3/4.2] rounded-l-md overflow-hidden shadow-md relative bg-[#1E1913] p-3 flex flex-col justify-between text-white">
                    <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 w-max">
                      封底
                    </span>
                    <p className="text-[8px] italic text-gray-500 line-clamp-3">
                      "{album.backCover?.bodyText || "散落于岁月长河中的微光片段，在此拼贴为一本流动的艺术画册。"}"
                    </p>
                    <span className="text-[7px] font-mono text-gray-500 truncate">
                      {album.backCover?.signoff || "MarginLab Printing"}
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-2 text-gray-900 flex items-end justify-between">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-600 text-gray-900 font-bold">
                      画册封底
                    </span>
                    <h5 className="text-[11px] font-bold font-serif truncate max-w-[120px]">全册完结</h5>
                  </div>
                </div>
              </div>

              <div
                onClick={() => {
                  if (!isAuthenticated) {
                    setToast("当前为只读画册速览，请注册专属账号后开启排版编辑");
                    setAuthModalOpen(true, "register");
                    return;
                  }
                  onOpenAddModal();
                }}
                className={`rounded-xl border-2 border-dashed aspect-[3/2] flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all group ${
                  isLight
                    ? 'border-black/15 hover:border-amber-500 bg-white/60 hover:bg-white'
                    : 'border-white/25 hover:border-amber-400 bg-black/[0.03] hover:bg-black/[0.05]'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-amber-500/20 group-hover:bg-amber-500 text-amber-600 group-hover:text-zinc-950 flex items-center justify-center transition-colors">
                  <Plus className="w-4 h-4" />
                </div>
                <span className={`text-xs font-semibold ${isLight ? 'text-zinc-600' : 'text-gray-500'}`}>
                  添加新页面
                </span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 页面快速独立配置浮动操作栏 */}
            {!turn && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 animate-fadeIn pointer-events-auto">
                {!isAuthenticated ? (
                  <button
                    onClick={() => {
                      setToast("当前为只读画册速览，请注册专属账号后开启排版编辑");
                      setAuthModalOpen(true, "register");
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white/95 hover:bg-white text-gray-900 text-[11px] font-semibold flex items-center gap-1.5 shadow-xl border border-white/20 transition-all hover:scale-105 cursor-pointer backdrop-blur-md"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-600" />
                    <span>画册速览浏览中 · 注册登录开启专属编辑</span>
                  </button>
                ) : (
                  <>
                    {index === -1 && (
                      <button
                        onClick={() => handleOpenEditPage('cover')}
                        className="px-3 py-1 rounded-lg bg-white hover:bg-gray-100 text-gray-900 text-[11px] font-semibold flex items-center gap-1.5 shadow-xl border border-white/20 transition-all hover:scale-105 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>自定义封面与装订</span>
                      </button>
                    )}

                    {index >= totalSpreads && (
                      <button
                        onClick={() => handleOpenEditPage('backCover')}
                        className="px-3 py-1 rounded-lg bg-white hover:bg-gray-100 text-gray-900 text-[11px] font-semibold flex items-center gap-1.5 shadow-xl border border-white/20 transition-all hover:scale-105 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                        <span>自定义封底寄语</span>
                      </button>
                    )}

                    {index >= 0 && index < totalSpreads && (
                      <>
                        <button
                          onClick={() => handleOpenEditPage('page', index, 'left')}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-100 text-gray-900 text-[11px] font-semibold flex items-center gap-1 shadow-xl border border-white/20 transition-all hover:scale-105 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-amber-600" />
                          <span>配置左页 (P.{index * 2 + 1})</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditPage('page', index, 'right')}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-100 text-gray-900 text-[11px] font-semibold flex items-center gap-1 shadow-xl border border-white/20 transition-all hover:scale-105 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-amber-600" />
                          <span>配置右页 (P.{index * 2 + 2})</span>
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            <div
              ref={bookRef}
              className="relative"
              style={{
                width: PAGE_W * 2,
                height: PAGE_H,
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                touchAction: 'none',
                cursor: turnApi.dragging ? 'grabbing' : 'grab',
              }}
              {...turnApi.pointerHandlers}
              onDragStart={(e) => e.preventDefault()}
            >
              <Photobook3D album={album} index={index} turn={turn} ctx={faceCtx} />
            </div>

            {/* 左右翻页按钮 */}
            <button
              onClick={goPrev}
              disabled={!turnApi.canPrev}
              className={`hidden sm:block absolute left-5 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all backdrop-blur-md z-40 ${
                isLight
                  ? 'bg-white/80 hover:bg-white text-zinc-700 hover:text-gray-950 border border-black/10 shadow-md'
                  : 'bg-black/40 hover:bg-black/40 text-gray-500 hover:text-gray-950 border border-white/20 shadow-xl'
              } ${!turnApi.canPrev ? 'opacity-20 cursor-default' : 'cursor-pointer hover:scale-105'}`}
              title="上一页"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              disabled={!turnApi.canNext}
              className={`hidden sm:block absolute right-5 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all backdrop-blur-md z-40 ${
                isLight
                  ? 'bg-white/80 hover:bg-white text-zinc-700 hover:text-gray-950 border border-black/10 shadow-md'
                  : 'bg-black/40 hover:bg-black/40 text-gray-500 hover:text-gray-950 border border-white/20 shadow-xl'
              } ${!turnApi.canNext ? 'opacity-20 cursor-default' : 'cursor-pointer hover:scale-105'}`}
              title="下一页"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {toast && (
          <div
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-semibold animate-fadeIn z-50 ${
              isLight ? 'bg-white text-gray-900 shadow-xl' : 'bg-white/95 text-zinc-950 shadow-2xl'
            }`}
          >
            {toast}
          </div>
        )}
      </div>

      {/* ── 单页独立配置弹窗 ─────────────────────────────── */}
      <PageConfigModal
        isOpen={isPageConfigOpen}
        onClose={() => setIsPageConfigOpen(false)}
        album={album}
        target={pageConfigTarget}
      />

      {/* ── 底部工具坞 ─────────────────────────────────────── */}
      <div className="relative z-30 pb-5 pt-2 flex items-center justify-center shrink-0">
        <div className={`relative flex items-center gap-3 sm:gap-4 p-2 rounded-xl ${frostedPillCls}`}>
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu((v) => !v)}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${toolBtnCls}`}
              title="更多画册设置与桌面背景"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {showMoreMenu && (
              <div
                className={`absolute bottom-full mb-3 left-0 sm:left-1/2 sm:-translate-x-1/2 w-52 rounded-xl p-2.5 text-xs space-y-1 z-50 animate-scaleIn shadow-2xl ${
                  isLight
                    ? 'bg-white border border-black/10 text-zinc-900'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <button
                  onClick={() => {
                    handleRestart();
                    setShowMoreMenu(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-colors ${
                    isLight ? 'hover:bg-black/5' : 'hover:bg-black/[0.05]'
                  }`}
                >
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>从头翻开画册</span>
                </button>

                <button
                  onClick={() => {
                    setIsPlaying((v) => !v);
                    setShowMoreMenu(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-colors ${
                    isLight ? 'hover:bg-black/5' : 'hover:bg-black/[0.05]'
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Play className="w-4 h-4 text-amber-600" />
                  )}
                  <span>{isPlaying ? '暂停自动翻页' : '自动翻页放映'}</span>
                </button>

                <div className={`h-[1px] my-1 ${isLight ? 'bg-black/10' : 'bg-black/[0.05]'}`} />

                <div className={`px-2.5 py-1 text-[10px] font-mono uppercase ${isLight ? 'text-zinc-400' : 'text-gray-500'}`}>
                  桌面背景
                </div>
                <div className="grid grid-cols-4 gap-1.5 px-2 pb-1">
                  {(['indigo', 'slate', 'dark', 'neutral'] as AlbumTheme[]).map((thm) => (
                    <button
                      key={thm}
                      onClick={() => {
                        onUpdateTheme(thm);
                        setShowMoreMenu(false);
                      }}
                      className={`h-6 rounded-lg border transition-colors cursor-pointer ${
                        (album.theme || 'indigo') === thm
                          ? 'border-amber-500 ring-2 ring-amber-500/40'
                          : isLight
                          ? 'border-black/15 hover:border-black/30'
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      style={{ backgroundColor: THEME_COLOR[thm] }}
                      title={thm}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={onOpenExportModal}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${toolBtnCls}`}
            title="导出整本画册 PDF / 高清原图"
          >
            <Upload className="w-4 h-4" />
          </button>

          {isAuthenticated && (
          <button
            onClick={() => setConfirmDelete(true)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              isLight
                ? 'bg-black/5 hover:bg-red-500 hover:text-gray-950 text-zinc-700'
                : 'bg-white/20 hover:bg-red-500/85 text-gray-900'
            }`}
            title="删除当前对开页"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          )}

          {index >= totalSpreads ? (
            <button
              onClick={handleRestart}
              className="px-3.5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105 cursor-pointer animate-fadeIn"
              title="从头重新翻开画册封面"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>从头翻开画册</span>
            </button>
          ) : (
            <button
              onClick={handleRestart}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${toolBtnCls}`}
              title="从头翻开画册封面"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {isAuthenticated && (
            <button
              onClick={onOpenAddModal}
              className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center transition-colors cursor-pointer font-bold shadow-md hover:scale-105"
              title="添加新画册页面"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </button>
          )}

          {confirmDelete && (
            <div
              className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-64 rounded-xl p-4 z-50 animate-scaleIn shadow-2xl ${
                isLight
                  ? 'bg-white/95 border border-black/10 text-zinc-900 shadow-2xl'
                  : 'bg-white border border-gray-200 text-gray-900 shadow-2xl'
              }`}
            >
              <p className="text-xs font-semibold leading-relaxed">
                删除当前对开页？
                <br />
                <span className={`font-normal ${isLight ? 'text-zinc-500' : 'text-gray-500'}`}>
                  「
                  {spreads[index]?.title || `第 ${index * 2 + 1}-${index * 2 + 2} 页`}
                  」将被移除
                </span>
              </p>
              <div className="flex items-center gap-2 mt-3.5">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    isLight ? 'bg-black/5 hover:bg-black/10' : 'bg-black/[0.05] hover:bg-white/20'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={handleDeleteCurrent}
                  className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-400 text-gray-900 cursor-pointer transition-colors shadow-sm"
                >
                  确认删除
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
