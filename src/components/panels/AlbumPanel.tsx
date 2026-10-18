import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import {
  BookOpen,
  Plus,
  LayoutTemplate,
  Images,
  Save,
  Download,
  Trash2,
  ChevronDown,
  Edit2,
  Copy,
} from 'lucide-react';
import { AddAlbumPageModal } from '../album/AddAlbumPageModal';
import { AlbumExportModal } from '../album/AlbumExportModal';
import { PageConfigModal, PageConfigTarget } from '../album/PageConfigModal';

interface AlbumPanelProps {
  currentSpreadIndex?: number;
  onSelectSpread?: (index: number) => void;
  /** 切到「照片素材」子页签 */
  onOpenPhotos?: () => void;
}

export const AlbumPanel: React.FC<AlbumPanelProps> = ({
  currentSpreadIndex: propSpreadIndex,
  onSelectSpread,
  onOpenPhotos,
}) => {
  const albums = useEditorStore((s) => s.albums);
  const storeSpreadIndex = useEditorStore((s) => s.currentSpreadIndex);
  const setStoreSpreadIndex = useEditorStore((s) => s.setCurrentSpreadIndex);

  const activeSpreadIndex = propSpreadIndex !== undefined ? propSpreadIndex : storeSpreadIndex;
  const handleSelect = (idx: number) => {
    if (onSelectSpread) onSelectSpread(idx);
    setStoreSpreadIndex(idx);
  };
  const currentAlbumId = useEditorStore((s) => s.currentAlbumId);
  const setCurrentAlbumId = useEditorStore((s) => s.setCurrentAlbumId);
  const createNewAlbum = useEditorStore((s) => s.createNewAlbum);
  const deleteSpreadFromAlbum = useEditorStore((s) => s.deleteSpreadFromAlbum);
  const duplicateSpread = useEditorStore((s) => s.duplicateSpread);
  const saveCanvasToAlbum = useEditorStore((s) => s.saveCanvasToAlbum);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);

  const [pageConfigTarget, setPageConfigTarget] = useState<PageConfigTarget | null>(null);
  const [isPageConfigOpen, setIsPageConfigOpen] = useState(false);

  const handleOpenEditPage = (target: "cover" | "backCover" | "page", spreadIndex?: number, side?: "left" | "right") => {
    setPageConfigTarget({ type: target, spreadIndex, side });
    setIsPageConfigOpen(true);
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSavingCanvas, setIsSavingCanvas] = useState(false);
  const [showAlbumList, setShowAlbumList] = useState(false);

  const currentAlbum =
    albums.find((a) => a.id === currentAlbumId) || albums[0];

  const spreads = currentAlbum?.spreads || [];
  const totalSpreads = spreads.length;
  const totalPages = totalSpreads * 2 + 1;

  // 快捷保存当前画布到画册
  const handleQuickSaveCanvas = async () => {
    if (!currentAlbum) return;
    setIsSavingCanvas(true);
    await saveCanvasToAlbum(currentAlbum.id);
    setIsSavingCanvas(false);
  };

  return (
    <div className="flex flex-col h-full bg-white select-none overflow-hidden">
      {/* 1. Header Bar */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <div>
          <h3 className="text-[15px] font-extrabold text-gray-950">
            艺术相册 · 实体书
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            3D 物理折页 · 纸张质感
          </p>
        </div>

        {/* 导出按钮 */}
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-black transition-colors cursor-pointer"
          title="导出整本画册 PDF / 高清相纸图包"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* 2. 当前相册选择器下拉 */}
      <div className="p-3.5 border-b border-gray-100 bg-gray-50 shrink-0 relative">
        <div
          onClick={() => setShowAlbumList(!showAlbumList)}
          className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-gray-200 hover:border-gray-900 transition-colors cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-11 rounded-sm overflow-hidden bg-gray-200 shrink-0 border border-gray-300">
              <img
                src={currentAlbum?.coverImage}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-extrabold text-gray-950 truncate group-hover:text-black transition-colors">
                {currentAlbum?.title || '艺术相册'}
              </h4>
              <span className="text-[11px] font-semibold text-gray-500 block mt-0.5">
                共 {totalPages} 页 · {totalSpreads} 个对开
              </span>
            </div>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${
              showAlbumList ? 'rotate-180 text-black' : ''
            }`}
          />
        </div>

        {/* 下拉相册列表 */}
        {showAlbumList && (
          <div className="absolute top-full left-3.5 right-3.5 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl p-2 z-30 space-y-1">
            <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase">
              切换画册
            </div>
            {albums.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  setCurrentAlbumId(a.id);
                  setShowAlbumList(false);
                }}
                className={`w-full p-2 rounded-lg text-left flex items-center justify-between transition-colors cursor-pointer ${
                  a.id === currentAlbumId
                    ? 'bg-gray-100 text-gray-950 font-bold border border-gray-200'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xs truncate">{a.title}</span>
                <span className="text-[10px] font-mono text-gray-500">
                  {a.spreads.length * 2 + 1} 页
                </span>
              </button>
            ))}

            <div className="border-t border-gray-100 pt-1 mt-1">
              <button
                onClick={() => {
                  const title = prompt('请输入新画册名称', '高定艺术摄影集');
                  if (title) {
                    createNewAlbum(title);
                  }
                  setShowAlbumList(false);
                }}
                className="w-full p-2 rounded-lg text-xs text-gray-900 hover:bg-gray-100 flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>新建相册</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. 核心功能操作胶囊 (套用模板 / 素材库排版 / 收录画布) */}
      <div className="p-3.5 border-b border-gray-100 bg-white space-y-2.5 shrink-0">
        <div className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
          画册排版快捷工具
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* 选用拼图模板 */}
          <button
            onClick={() => setActivePanel("templates")}
            className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-900 text-left transition-all cursor-pointer group flex flex-col justify-between"
          >
            <LayoutTemplate className="w-4 h-4 text-blue-600 mb-1" />
            <div>
              <div className="text-xs font-bold text-gray-950">
                套用拼图模板
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                47 款高定海报排版
              </div>
            </div>
          </button>

          {/* 从素材库挑选照片 */}
          <button
            onClick={() => (onOpenPhotos ? onOpenPhotos() : setActivePanel("templates"))}
            className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-900 text-left transition-all cursor-pointer group flex flex-col justify-between"
          >
            <Images className="w-4 h-4 text-emerald-600 mb-1" />
            <div>
              <div className="text-xs font-bold text-gray-950">
                照片素材智能排版
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                多图杂志/拍立得
              </div>
            </div>
          </button>
        </div>

        {/* 一键收录当前工作台画布 */}
        <button
          disabled={isSavingCanvas}
          onClick={handleQuickSaveCanvas}
          className="w-full py-2 px-3 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSavingCanvas ? '正在生成对开页...' : '将当前画布收录入册'}</span>
        </button>
      </div>

      {/* 4. 对开页页面总览列表 (大尺寸清晰卡片) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 no-scrollbar">
        <div className="flex items-center justify-between text-xs font-bold text-gray-500">
          <span>页面导航 ({totalPages} 页)</span>
          <span>点击立即对焦</span>
        </div>

        {/* 封面卡片 (独立编辑入口) */}
        <div
          onClick={() => handleSelect(-1)}
          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
            activeSpreadIndex === -1
              ? 'bg-gray-50 border-2 border-gray-900 shadow-xs'
              : 'bg-white hover:bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-14 rounded-md overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
              <img src={currentAlbum?.coverImage} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-900 text-white font-bold inline-block">
                精装封面
              </span>
              <h5 className="text-xs font-bold text-gray-900 truncate mt-1">
                {currentAlbum?.title}
              </h5>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEditPage('cover');
            }}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors cursor-pointer"
            title="独立配置封面画面、排版与装订"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 展开对开页卡片列表 */}
        {spreads.map((sp, idx) => {
          const isSelected = activeSpreadIndex === idx;
          return (
            <div
              key={sp.id}
              className={`rounded-xl border transition-all p-3 space-y-2.5 ${
                isSelected
                  ? 'bg-gray-50 border-2 border-gray-900 shadow-xs'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <div
                  onClick={() => handleSelect(idx)}
                  className="flex items-center gap-2 min-w-0 cursor-pointer flex-1"
                >
                  <span className="text-[11px] font-mono font-bold bg-gray-200 text-gray-900 px-2 py-0.5 rounded">
                    P.{idx * 2 + 1} - {idx * 2 + 2}
                  </span>
                  <h5 className="text-xs font-bold text-gray-900 truncate">
                    {sp.title || `第 ${idx + 1} 对开页`}
                  </h5>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => duplicateSpread(currentAlbum.id, idx)}
                    className="p-1 rounded-md hover:bg-gray-200 text-gray-500 hover:text-black transition-colors cursor-pointer"
                    title="复制此对开页"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`确定要从画册中移除【${sp.title || '此对开页'}】吗？`)) {
                        deleteSpreadFromAlbum(currentAlbum.id, idx);
                      }
                    }}
                    className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="删除此对开页"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 左右页独立卡片并排 */}
              <div className="grid grid-cols-2 gap-2">
                <div
                  onClick={() => {
                    handleSelect(idx);
                    handleOpenEditPage('page', idx, 'left');
                  }}
                  className="p-2 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-900 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-10 rounded overflow-hidden bg-gray-200 border border-gray-300 shrink-0">
                      {sp.leftPage.image ? (
                        <img src={sp.leftPage.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">
                          留白
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold text-gray-500 block">
                        左页 · P.{idx * 2 + 1}
                      </span>
                      <p className="text-[11px] font-bold text-gray-900 truncate mt-0.5">
                        {sp.leftPage.title || "左页"}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    handleSelect(idx);
                    handleOpenEditPage('page', idx, 'right');
                  }}
                  className="p-2 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-900 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-10 rounded overflow-hidden bg-gray-200 border border-gray-300 shrink-0">
                      {sp.rightPage.image ? (
                        <img src={sp.rightPage.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-400">
                          留白
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-bold text-gray-500 block">
                        右页 · P.{idx * 2 + 2}
                      </span>
                      <p className="text-[11px] font-bold text-gray-900 truncate mt-0.5">
                        {sp.rightPage.title || "右页"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* 封底卡片 */}
        <div
          onClick={() => handleSelect(totalSpreads)}
          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
            activeSpreadIndex === totalSpreads
              ? 'bg-gray-50 border-2 border-gray-900 shadow-xs'
              : 'bg-white hover:bg-gray-50 border-gray-200'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-14 rounded-md overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center text-gray-400 font-bold text-xs">
              封底
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-bold">
                画册封底
              </span>
              <h5 className="text-xs font-bold text-gray-800 truncate mt-1">全册完结寄语</h5>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenEditPage('backCover');
            }}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-black transition-colors cursor-pointer"
            title="独立编辑封底寄语与署名"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. 弹窗挂载 */}
      {currentAlbum && (
        <>
          <AddAlbumPageModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            albumId={currentAlbum.id}
          />
          <AlbumExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            album={currentAlbum}
          />
          <PageConfigModal
            isOpen={isPageConfigOpen}
            onClose={() => setIsPageConfigOpen(false)}
            album={currentAlbum}
            target={pageConfigTarget}
          />
        </>
      )}
    </div>
  );
};
