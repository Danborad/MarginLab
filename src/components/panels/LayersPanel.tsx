import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import {
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Type,
  Square,
  Stamp,
} from 'lucide-react';
import { CollageElement } from '../../types/document';

export const LayersPanel: React.FC = () => {
  const elements = useEditorStore((s) => s.document.elements);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const toggleSelectElement = useEditorStore((s) => s.toggleSelectElement);
  const toggleLock = useEditorStore((s) => s.toggleLock);
  const toggleVisibility = useEditorStore((s) => s.toggleVisibility);
  const reorderElement = useEditorStore((s) => s.reorderElement);
  const deleteElements = useEditorStore((s) => s.deleteElements);

  // In layers panel, highest zIndex should be shown at the top
  const sortedLayers = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  const getElementIcon = (el: CollageElement) => {
    switch (el.type) {
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-blue-600" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-amber-600" />;
      case 'shape':
        return <Square className="w-3.5 h-3.5 text-emerald-600" />;
      case 'sticker':
        return <Stamp className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="pb-2 border-b border-studio-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-studio-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-studio-text">
            图层管理
          </h2>
        </div>
        <span className="text-[11px] font-mono text-studio-muted">{elements.length} 个对象</span>
      </div>

      {elements.length === 0 ? (
        <div className="text-center py-12 text-studio-muted text-xs">
          画布为空，点击左侧添加元素
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {sortedLayers.map((el) => {
            const isSelected = selectedIds.includes(el.id);
            return (
              <div
                key={el.id}
                onClick={(e) => toggleSelectElement(el.id, e.shiftKey)}
                className={`group px-2.5 py-2 rounded-lg border flex items-center justify-between text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'border-studio-accent bg-studio-hover text-studio-text ring-1 ring-studio-accent/40'
                    : 'border-studio-border/60 bg-studio-card/40 hover:bg-studio-card text-studio-muted hover:text-studio-text'
                } ${!el.visible ? 'opacity-40' : ''}`}
              >
                {/* Element Type Icon & Name */}
                <div className="flex items-center gap-2 truncate min-w-0 flex-1">
                  {getElementIcon(el)}
                  <span className="truncate font-medium text-[11px] select-none">
                    {el.name || el.type}
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderElement(el.id, 'forward');
                    }}
                    title="上移一层"
                    className="p-1 hover:text-studio-text rounded hover:bg-studio-hover"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reorderElement(el.id, 'backward');
                    }}
                    title="下移一层"
                    className="p-1 hover:text-studio-text rounded hover:bg-studio-hover"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLock(el.id);
                    }}
                    title={el.locked ? '解锁' : '锁定'}
                    className={`p-1 rounded hover:bg-studio-hover ${
                      el.locked ? 'text-amber-600 opacity-100' : 'hover:text-studio-text'
                    }`}
                  >
                    {el.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(el.id);
                    }}
                    title={el.visible ? '隐藏' : '显示'}
                    className="p-1 hover:text-studio-text rounded hover:bg-studio-hover"
                  >
                    {el.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteElements([el.id]);
                    }}
                    title="删除"
                    className="p-1 text-red-600/70 hover:text-red-600 rounded hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
