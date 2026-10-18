import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Palette, Grid, Maximize2, Printer, Smartphone } from 'lucide-react';
import { COLOR_PALETTES, CANVAS_PRESETS } from '../../lib/presets';
import { ColorPicker } from '../ui/ColorPicker';

export const BackgroundPanel: React.FC = () => {
  const canvas = useEditorStore((s) => s.document.canvas);
  const updateCanvas = useEditorStore((s) => s.updateCanvas);
  const showGrid = useEditorStore((s) => s.showGrid);
  const toggleGrid = useEditorStore((s) => s.toggleGrid);
  const setPresetModalOpen = useEditorStore((s) => s.setPresetModalOpen);

  return (
    <div className="p-4 space-y-5">
      <div className="pb-2 border-b border-studio-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-studio-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-studio-text">
            相纸规格与底色
          </h2>
        </div>
      </div>

      {/* Canvas Dimensions & Print Specs Box */}
      <div className="p-3.5 rounded-xl border border-studio-border bg-studio-card/70 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider">
            当前相纸 / 画布尺寸
          </span>
          <button
            onClick={() => setPresetModalOpen(true)}
            className="text-[11px] text-studio-accent hover:underline flex items-center gap-1 font-medium"
          >
            <Maximize2 className="w-3 h-3" />
            更多尺寸
          </button>
        </div>

        <div className="flex items-baseline justify-between pt-0.5">
          <span className="text-xs font-semibold text-studio-text truncate max-w-[170px]">
            {canvas.presetName || '自定义尺寸'}
          </span>
          <span className="text-xs font-mono text-studio-accent">
            {canvas.width} × {canvas.height} px
          </span>
        </div>

        {/* Quick Mijia Presets Shortcut Buttons */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          {[
            { id: 'mijia-6inch-vertical', label: '米家 6 寸 (竖版)', Icon: Printer, w: 1181, h: 1748 },
            { id: 'mijia-6inch-horizontal', label: '米家 6 寸 (横版)', Icon: Printer, w: 1748, h: 1181 },
            { id: 'mijia-3inch-pocket', label: '米家 3 寸 (口袋卡)', Icon: Printer, w: 591, h: 898 },
            { id: 'portrait-post', label: '小红书 (3:4)', Icon: Smartphone, w: 900, h: 1200 },
          ].map((item) => {
            const isActive = canvas.width === item.w && canvas.height === item.h;
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const p = CANVAS_PRESETS.find((cp) => cp.id === item.id) || {
                    name: item.label,
                    width: item.w,
                    height: item.h,
                  };
                  updateCanvas({ width: item.w, height: item.h, presetName: p.name }, true);
                }}
                className={`py-2 px-2 rounded-lg border text-[10px] font-mono flex items-center justify-center gap-1.5 transition-all ${
                  isActive
                    ? 'border-studio-accent bg-studio-accent/10 text-studio-accent font-semibold ring-1 ring-studio-accent/30'
                    : 'bg-studio-panel hover:bg-studio-hover border-studio-border text-studio-text'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-studio-accent' : 'text-studio-muted'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Palettes Swatches */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
          艺术感相纸底色
        </span>
        <div className="grid grid-cols-2 gap-2">
          {COLOR_PALETTES.map((p) => {
            const isSelected = (canvas.backgroundColor || '#FFFFFF').toLowerCase() === p.bg.toLowerCase();
            return (
              <button
                key={p.name}
                onClick={() => updateCanvas({ backgroundColor: p.bg })}
                className={'p-2 rounded-lg border text-left flex items-center gap-2.5 transition-all ' +
                  (isSelected
                    ? 'border-studio-accent bg-studio-card ring-1 ring-studio-accent'
                    : 'border-studio-border bg-studio-card/40 hover:bg-studio-card hover:border-gray-400')}
              >
                <div
                  className="w-5 h-5 rounded-md border border-black/10 shadow-sm shrink-0"
                  style={{ backgroundColor: p.bg }}
                />
                <div className="truncate">
                  <div className="text-[11px] font-medium text-studio-text truncate">{p.name}</div>
                  <div className="text-[9px] font-mono text-studio-muted truncate">{p.bg}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Picker */}
      <ColorPicker
        label="自定义底色"
        color={canvas.backgroundColor || '#FFFFFF'}
        onChange={(bg) => updateCanvas({ backgroundColor: bg })}
      />

      {/* Grid & Snapping Tools */}
      <div className="space-y-2.5 pt-2 border-t border-studio-border">
        <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
          辅助网格与对齐
        </span>

        <div className="flex items-center justify-between p-2.5 rounded-lg border border-studio-border bg-studio-card/40">
          <div className="flex items-center gap-2 text-xs text-studio-text">
            <Grid className="w-3.5 h-3.5 text-studio-muted" />
            <span>点阵对齐参考网格</span>
          </div>
          <button
            onClick={toggleGrid}
            className={'w-9 h-5 rounded-full transition-colors relative ' +
              (showGrid ? 'bg-studio-accent text-white' : 'bg-studio-border')}
          >
            <div
              className={'w-3.5 h-3.5 rounded-full bg-studio-bg transition-transform absolute top-0.5 ' +
                (showGrid ? 'left-5' : 'left-1')}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
