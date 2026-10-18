import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Keyboard, X } from 'lucide-react';

export const ShortCutModal: React.FC = () => {
  const shortcutModalOpen = useEditorStore((s) => s.shortcutModalOpen);
  const setShortcutModalOpen = useEditorStore((s) => s.setShortcutModalOpen);

  if (!shortcutModalOpen) return null;

  const shortcuts = [
    { key: 'Space + 拖拽', desc: '抓手工具，自由平移画布' },
    { key: '滚轮 / 触控板缩放', desc: '以鼠标为中心平滑缩放画布' },
    { key: '双击图片', desc: '进入框内无损交互裁切' },
    { key: 'Cmd / Ctrl + Z', desc: '撤销上一步操作' },
    { key: 'Cmd / Ctrl + Shift + Z', desc: '重做下一步操作' },
    { key: 'Cmd / Ctrl + D', desc: '快速复制选中元素' },
    { key: 'Cmd / Ctrl + A', desc: '全选画布上所有未锁定对象' },
    { key: 'Delete / Backspace', desc: '删除选中元素' },
    { key: '方向键 (↑ ↓ ← →)', desc: '微调位置 (按住 Shift 移动 10px)' },
    { key: 'Shift + 点击', desc: '多选多个图层对象' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-studio-panel border border-studio-border rounded-2xl w-[95vw] max-w-lg overflow-hidden shadow-soft-float">
        <div className="p-4 border-b border-studio-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-studio-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-studio-text">
              快捷键指南
            </h2>
          </div>
          <button
            onClick={() => setShortcutModalOpen(false)}
            className="p-1 rounded-lg text-studio-muted hover:text-studio-text hover:bg-studio-card transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-2.5 max-h-[70vh] overflow-y-auto">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-lg bg-studio-card/50 border border-studio-border"
            >
              <span className="text-xs text-studio-muted">{s.desc}</span>
              <kbd className="px-2 py-1 rounded bg-studio-panel border border-studio-border text-[11px] font-mono text-studio-accent font-medium shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
