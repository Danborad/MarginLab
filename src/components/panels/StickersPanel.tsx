import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Stamp, Sparkles, Tag, Film, Crosshair } from 'lucide-react';
import { StickerElement } from '../../types/document';

export const StickersPanel: React.FC = () => {
  const addElement = useEditorStore((s) => s.addElement);
  const canvas = useEditorStore((s) => s.document.canvas);

  const stickers = [
    {
      name: '燕麦色纸胶带',
      stickerType: 'washi-tape' as const,
      width: 140,
      height: 34,
      rotation: -3,
      color: '#E0D6C3',
      label: '',
    },
    {
      name: '香槟金纸胶带',
      stickerType: 'washi-tape' as const,
      width: 150,
      height: 34,
      rotation: 2,
      color: '#E5C49F',
      label: '',
    },
    {
      name: '典藏印章标签 (Archive)',
      stickerType: 'archival-tag' as const,
      width: 170,
      height: 44,
      rotation: 0,
      color: '#1C1B1A',
      accentColor: '#E5C49F',
      label: 'SERIES 08 • SELECTED',
    },
    {
      name: '高定展讯标签 (Exhibition)',
      stickerType: 'archival-tag' as const,
      width: 180,
      height: 44,
      rotation: 0,
      color: '#FAF8F5',
      accentColor: '#1C1B1A',
      label: 'EXHIBITION 2026 • PARIS',
    },
    {
      name: '复古朱红日期戳 (Date Stamp)',
      stickerType: 'date-stamp' as const,
      width: 160,
      height: 40,
      rotation: -2,
      color: '#B85444',
      label: '2026.08 • MARGINLAB',
    },
    {
      name: '胶片齿孔 (35mm Film)',
      stickerType: 'film-strip' as const,
      width: 220,
      height: 52,
      rotation: 0,
      color: '#111113',
      accentColor: '#E5C49F',
      label: 'ISO 400 • FRAME 24',
    },
    {
      name: '十字对齐标 (Crosshair)',
      stickerType: 'grid-cross' as const,
      width: 24,
      height: 24,
      rotation: 0,
      color: '#8E8B82',
      label: '',
    },
  ];

  const handleAddSticker = (s: (typeof stickers)[0]) => {
    addElement({
      type: 'sticker',
      name: s.name,
      x: Math.round((canvas.width - s.width) / 2),
      y: Math.round((canvas.height - s.height) / 2),
      width: s.width,
      height: s.height,
      rotation: s.rotation,
      opacity: 0.9,
      stickerType: s.stickerType,
      label: s.label,
      color: s.color,
      accentColor: s.accentColor,
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="pb-2 border-b border-studio-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Stamp className="w-4 h-4 text-studio-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-studio-text">
            美学贴纸与印章
          </h2>
        </div>
      </div>

      <div className="space-y-2.5">
        <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
          经典艺术点缀物
        </span>

        <div className="space-y-2.5">
          {stickers.map((s, idx) => (
            <div
              key={idx}
              onClick={() => handleAddSticker(s)}
              className="p-3 rounded-xl border border-studio-border bg-studio-card/60 hover:bg-studio-card hover:border-studio-accent cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-7 rounded border border-gray-200 flex items-center justify-center text-[8px] font-mono shadow-sm"
                  style={{ backgroundColor: s.color || '#333' }}
                >
                  {s.stickerType === 'grid-cross' ? '+' : 'TAG'}
                </div>
                <div>
                  <span className="text-xs font-medium text-studio-text group-hover:text-studio-accent transition-colors block">
                    {s.name}
                  </span>
                  {s.label && (
                    <span className="text-[10px] font-mono text-studio-muted block mt-0.5">
                      {s.label}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-studio-accent opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                + 添加
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
