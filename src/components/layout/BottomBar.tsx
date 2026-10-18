import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Layers, MousePointer } from 'lucide-react';

export const BottomBar: React.FC = () => {
  const document = useEditorStore((s) => s.document);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const zoom = useEditorStore((s) => s.zoom);

  return (
    <div className="hidden sm:flex h-8 border-t border-studio-border bg-studio-sidebar/90 px-4 items-center justify-between text-[11px] font-mono text-studio-muted select-none z-20 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-studio-accent" />
          <span>{document.elements.length} 图层</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1.5">
          <MousePointer className="w-3 h-3 text-studio-accent" />
          <span>{selectedIds.length > 0 ? `已选中 ${selectedIds.length} 项` : '就绪'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span>按住 Space 拖拽平移</span>
        <span>•</span>
        <span>双击图片裁切</span>
        <span>•</span>
        <span className="text-studio-text font-medium">
          {document.canvas.width} × {document.canvas.height} px
        </span>
      </div>
    </div>
  );
};
