import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Type, Sparkles } from 'lucide-react';
import { FONTS } from '../../lib/fonts';

export const TextPanel: React.FC = () => {
  const addElement = useEditorStore((s) => s.addElement);
  const canvas = useEditorStore((s) => s.document.canvas);

  const textPresets = [
    {
      title: '法式衬线大标题',
      text: 'HAUTE COUTURE',
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 56,
      fontWeight: 700,
      fontStyle: 'normal' as const,
      letterSpacing: 4,
      lineHeight: 1.1,
      textTransform: 'uppercase' as const,
      color: canvas.backgroundColor === '#121214' ? '#FAF8F5' : '#1C1B1A',
    },
    {
      title: '建筑碑文大写体',
      text: 'MONOLITHIC ESSENCE',
      fontFamily: '"Cinzel", serif',
      fontSize: 42,
      fontWeight: 700,
      fontStyle: 'normal' as const,
      letterSpacing: 6,
      lineHeight: 1.15,
      textTransform: 'uppercase' as const,
      color: canvas.backgroundColor === '#121214' ? '#E5C49F' : '#22201D',
    },
    {
      title: '斜体时尚陈述句',
      text: '“Poetry written across empty spaces”',
      fontFamily: '"Instrument Serif", serif',
      fontSize: 34,
      fontWeight: 400,
      fontStyle: 'italic' as const,
      letterSpacing: 1,
      lineHeight: 1.3,
      textTransform: 'none' as const,
      color: canvas.backgroundColor === '#121214' ? '#E5C49F' : '#33312E',
    },
    {
      title: '瑞士现代主义粗体',
      text: 'BAUHAUS 1968',
      fontFamily: '"Space Grotesk", sans-serif',
      fontSize: 48,
      fontWeight: 700,
      fontStyle: 'normal' as const,
      letterSpacing: -1,
      lineHeight: 1.0,
      textTransform: 'uppercase' as const,
      color: '#E03E22',
    },
    {
      title: '东方意境思源宋体',
      text: '天地有大美而不言',
      fontFamily: '"Noto Serif SC", serif',
      fontSize: 32,
      fontWeight: 600,
      fontStyle: 'normal' as const,
      letterSpacing: 10,
      lineHeight: 1.4,
      textTransform: 'none' as const,
      color: canvas.backgroundColor === '#121214' ? '#F4F4F6' : '#211F1D',
    },
    {
      title: '档案索引编号 (Mono)',
      text: '№ 0824 / STUDIO ARCHIVE EDITION',
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: 12,
      fontWeight: 500,
      fontStyle: 'normal' as const,
      letterSpacing: 2,
      lineHeight: 1.2,
      textTransform: 'uppercase' as const,
      color: '#8E8B82',
    },
    {
      title: '极简正文段落',
      text: 'The quiet dialogue between negative space and delicate typography creates a timeless rhythm on the canvas.',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      fontSize: 14,
      fontWeight: 400,
      fontStyle: 'normal' as const,
      letterSpacing: 0.3,
      lineHeight: 1.6,
      textTransform: 'none' as const,
      color: canvas.backgroundColor === '#121214' ? '#C2C2CC' : '#45433F',
    },
  ];

  const handleAddText = (preset: (typeof textPresets)[0]) => {
    addElement({
      type: 'text',
      name: preset.title,
      x: Math.round((canvas.width - 500) / 2),
      y: Math.round((canvas.height - 100) / 2),
      width: 500,
      height: 100,
      rotation: 0,
      opacity: 1,
      text: preset.text,
      fontFamily: preset.fontFamily,
      fontSize: preset.fontSize,
      fontWeight: preset.fontWeight,
      fontStyle: preset.fontStyle,
      letterSpacing: preset.letterSpacing,
      lineHeight: preset.lineHeight,
      textAlign: 'center',
      textTransform: preset.textTransform,
      color: preset.color,
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="pb-2 border-b border-studio-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4 text-studio-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-studio-text">
            排版与文字
          </h2>
        </div>
      </div>

      <div className="space-y-2.5">
        <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
          精选排版预设
        </span>

        <div className="space-y-2.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
          {textPresets.map((preset, idx) => (
            <div
              key={idx}
              onClick={() => handleAddText(preset)}
              className="p-3.5 rounded-xl border border-studio-border bg-studio-card/70 hover:bg-studio-card hover:border-studio-accent cursor-pointer transition-all duration-200 group"
            >
              <div className="text-[10px] font-mono text-studio-muted group-hover:text-studio-accent transition-colors mb-1.5 flex items-center justify-between">
                <span>{preset.title}</span>
                <span className="opacity-0 group-hover:opacity-100 text-studio-accent">+ 添加</span>
              </div>
              <div
                style={{
                  fontFamily: preset.fontFamily,
                  fontSize: Math.min(22, preset.fontSize * 0.55),
                  fontWeight: preset.fontWeight,
                  fontStyle: preset.fontStyle,
                  letterSpacing: preset.letterSpacing * 0.5,
                  textTransform: preset.textTransform,
                }}
                className="text-studio-text leading-tight truncate"
              >
                {preset.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
