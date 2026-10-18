import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from '../../store/useEditorStore';
import { TEMPLATES } from '../../lib/templates';
import { AlbumPageLayout } from '../../types/album';
import {
  X,
  LayoutTemplate,
  Images,
  Upload,
  Check,
  Sparkles,
  Save,
  BookOpen,
  Filter,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface AddAlbumPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  albumId: string;
}

export const AddAlbumPageModal: React.FC<AddAlbumPageModalProps> = ({
  isOpen,
  onClose,
  albumId,
}) => {
  const mediaAssets = useEditorStore((s) => s.mediaAssets);
  const addTemplateToAlbum = useEditorStore((s) => s.addTemplateToAlbum);
  const addAssetsToAlbum = useEditorStore((s) => s.addAssetsToAlbum);
  const saveCanvasToAlbum = useEditorStore((s) => s.saveCanvasToAlbum);
  const editorDoc = useEditorStore((s) => s.document);

  // Active Tab: 'template' | 'assets' | 'canvas'
  const [activeTab, setActiveTab] = useState<'template' | 'assets' | 'canvas'>('template');

  // 模板 Tab 状态
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATES[0].id);
  const [templateCategory, setTemplateCategory] = useState<string>('All');

  // 素材库 Tab 状态
  const [selectedAssetUrls, setSelectedAssetUrls] = useState<string[]>([]);
  const [assetLayout, setAssetLayout] = useState<AlbumPageLayout>('journal');
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');

  // 画布 Tab 状态
  const [isSavingCanvas, setIsSavingCanvas] = useState(false);

  if (!isOpen) return null;

  // 过滤模板分类
  const categories = ['All', 'Gallery', 'Editorial', 'Polaroid', 'Minimalist', 'Full Bleed'];
  const filteredTemplates =
    templateCategory === 'All'
      ? TEMPLATES
      : TEMPLATES.filter((t) => t.category.toLowerCase() === templateCategory.toLowerCase());

  // 切换素材库图片选中
  const toggleSelectAsset = (url: string) => {
    if (selectedAssetUrls.includes(url)) {
      setSelectedAssetUrls(selectedAssetUrls.filter((u) => u !== url));
    } else {
      if (selectedAssetUrls.length >= 6) {
        alert('每次最多选择 6 张照片进行智能画册排版');
        return;
      }
      setSelectedAssetUrls([...selectedAssetUrls, url]);
    }
  };

  // 提交：套用拼图模板
  const handleApplyTemplate = () => {
    addTemplateToAlbum(albumId, selectedTemplateId);
    onClose();
  };

  // 提交：素材库照片生成排版
  const handleApplyAssets = () => {
    if (selectedAssetUrls.length === 0) {
      alert('请先选择至少 1 张素材库照片');
      return;
    }
    addAssetsToAlbum(
      albumId,
      selectedAssetUrls,
      assetLayout,
      customTitle.trim() || undefined
    );
    onClose();
  };

  // 提交：保存当前画布到画册
  const handleSaveCanvas = async () => {
    setIsSavingCanvas(true);
    const success = await saveCanvasToAlbum(albumId);
    setIsSavingCanvas(false);
    if (success) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white border border-gray-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <span>添加画册新页面</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 font-semibold">
                  对开双页
                </span>
              </h3>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                可选用拼图模板生成对开页，或从专属素材库中挑选照片自动智能排版
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-gray-950 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 个主要选项卡导航 */}
        <div className="flex items-center border-b border-gray-200 bg-white px-4 sm:px-6 pt-2.5 gap-2">
          <button
            onClick={() => setActiveTab('template')}
            className={`pb-3 px-3 text-xs flex items-center gap-2 border-b-2 font-semibold transition-all cursor-pointer ${
              activeTab === 'template'
                ? 'border-amber-400 text-amber-600'
                : 'border-transparent text-zinc-400 hover:text-gray-700'
            }`}
          >
            <LayoutTemplate className="w-4 h-4" />
            <span>选用拼图模板库 ({TEMPLATES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`pb-3 px-3 text-xs flex items-center gap-2 border-b-2 font-semibold transition-all cursor-pointer ${
              activeTab === 'assets'
                ? 'border-amber-400 text-amber-600'
                : 'border-transparent text-zinc-400 hover:text-gray-700'
            }`}
          >
            <Images className="w-4 h-4" />
            <span>从素材库挑选照片 ({mediaAssets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('canvas')}
            className={`pb-3 px-3 text-xs flex items-center gap-2 border-b-2 font-semibold transition-all cursor-pointer ${
              activeTab === 'canvas'
                ? 'border-amber-400 text-amber-600'
                : 'border-transparent text-zinc-400 hover:text-gray-700'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>将当前画布直接收录</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: 选用拼图模板 */}
          {activeTab === 'template' && (
            <div className="space-y-4">
              {/* 分类切换 Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTemplateCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      templateCategory === cat
                        ? 'bg-amber-500 text-zinc-950 font-bold shadow-sm'
                        : 'bg-gray-100 text-zinc-400 hover:text-gray-950 hover:bg-gray-100'
                    }`}
                  >
                    {cat === 'All' ? '全部模板' : cat}
                  </button>
                ))}
              </div>

              {/* 模板网格 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredTemplates.map((tpl) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplateId(tpl.id)}
                      className={`group rounded-2xl overflow-hidden border-2 cursor-pointer transition-all bg-gray-100 p-2 relative ${
                        isSelected
                          ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-lg'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-white mb-2 relative">
                        <img
                          src={tpl.preview}
                          alt={tpl.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <h5 className="text-xs font-bold text-gray-900 truncate">{tpl.name}</h5>
                      <p className="text-[10px] text-zinc-400 truncate mt-0.5">{tpl.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: 从素材库挑选照片 */}
          {activeTab === 'assets' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-700 font-medium">
                  已选择{' '}
                  <span className="text-amber-600 font-bold font-mono">
                    {selectedAssetUrls.length}
                  </span>{' '}
                  张照片 (最多 6 张)
                </span>
                <span className="text-[11px] text-zinc-400">
                  点击图片勾选，系统将自动智能排版
                </span>
              </div>

              {/* 排版风格预设切换 */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'journal', label: '📖 杂志图文手札', desc: '主图配以诗意随笔' },
                  { id: 'polaroid', label: '📷 拍立得手记', desc: '经典边框与手写留白' },
                  { id: 'grid-4', label: '🖼️ 多图画廊矩阵', desc: '对称多图网格拼贴' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setAssetLayout(item.id as AlbumPageLayout)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      assetLayout === item.id
                        ? 'bg-amber-500/15 border-amber-400 text-amber-600'
                        : 'bg-gray-100 border-gray-200 text-zinc-400 hover:text-gray-950'
                    }`}
                  >
                    <div className="text-xs font-bold truncate">{item.label}</div>
                    <div className="text-[10px] opacity-70 mt-0.5 truncate">{item.desc}</div>
                  </button>
                ))}
              </div>

              {/* 页面可选自定义标题与随笔 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                    对开页标题 (可选)
                  </label>
                  <input
                    type="text"
                    placeholder="例如：林间微风 · 记忆碎片"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 text-xs text-gray-900 placeholder:text-zinc-500 focus:border-amber-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-zinc-400 block mb-1">
                    手札随笔文本 (可选)
                  </label>
                  <input
                    type="text"
                    placeholder="生活里的细碎美感，在光影里悄然舒展..."
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-100 border border-gray-200 text-xs text-gray-900 placeholder:text-zinc-500 focus:border-amber-400 outline-none"
                  />
                </div>
              </div>

              {/* 素材库网格 */}
              {mediaAssets.length === 0 ? (
                <div className="py-10 text-center rounded-2xl bg-gray-100 border border-dashed border-gray-200">
                  <Images className="w-8 h-8 mx-auto text-zinc-500 mb-2" />
                  <p className="text-xs text-zinc-400 font-medium">素材库暂无照片</p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    您可以在排版工作台中上传本地照片，或在「AI 风格化」中出图后点击存入素材库
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {mediaAssets.map((asset) => {
                    const isSelected = selectedAssetUrls.includes(asset.src);
                    return (
                      <div
                        key={asset.id}
                        onClick={() => toggleSelectAsset(asset.src)}
                        className={`group relative rounded-xl overflow-hidden aspect-square border-2 cursor-pointer transition-all bg-gray-100 ${
                          isSelected
                            ? 'border-amber-400 ring-2 ring-amber-400/40'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <img
                          src={asset.src}
                          alt={asset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center shadow-md">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[9px] text-white truncate px-1.5">
                          {asset.name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 将当前画布存为新一页 */}
          {activeTab === 'canvas' && (
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-2xl bg-gray-100 border border-gray-200 flex items-center gap-4">
                <div className="w-16 h-20 rounded-xl overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center">
                  <LayoutTemplate className="w-8 h-8 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{editorDoc.name || '当前画布作品'}</h4>
                  <p className="text-xs text-zinc-400 mt-1">
                    包含 {editorDoc.elements.length} 个图文元素 · 画布尺寸 {editorDoc.canvas.width}×
                    {editorDoc.canvas.height}
                  </p>
                  <p className="text-[11px] text-amber-600/90 mt-1">
                    点击一键即可将当前画布渲染为高清画册对开新页面
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-white flex items-center justify-between">
          <Button variant="ghost" onClick={onClose} className="text-xs text-zinc-400 hover:text-gray-950">
            取消
          </Button>

          {activeTab === 'template' && (
            <Button
              variant="accent"
              onClick={handleApplyTemplate}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
            >
              套用该模板并生成新页面
            </Button>
          )}

          {activeTab === 'assets' && (
            <Button
              variant="accent"
              disabled={selectedAssetUrls.length === 0}
              onClick={handleApplyAssets}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50"
            >
              智能排版并插入画册 ({selectedAssetUrls.length})
            </Button>
          )}

          {activeTab === 'canvas' && (
            <Button
              variant="accent"
              disabled={isSavingCanvas}
              onClick={handleSaveCanvas}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
            >
              {isSavingCanvas ? '正在渲染收录...' : '收录当前画布入册'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, window.document.body);
};