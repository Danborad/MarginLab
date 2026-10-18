import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { CANVAS_PRESETS, ExtendedCanvasPreset } from '../../lib/presets';
import {
  Maximize2,
  X,
  Check,
  Printer,
  Sparkles,
  Smartphone,
  Sliders,
  Layers,
  ArrowRight,
  FileText,
} from 'lucide-react';

export const PresetSizeModal: React.FC = () => {
  const presetModalOpen = useEditorStore((s) => s.presetModalOpen);
  const setPresetModalOpen = useEditorStore((s) => s.setPresetModalOpen);
  const canvas = useEditorStore((s) => s.document.canvas);
  const updateCanvas = useEditorStore((s) => s.updateCanvas);

  const [activeTab, setActiveTab] = useState<'print' | 'editorial' | 'social' | 'custom' | 'all'>('print');
  const [autoReflow, setAutoReflow] = useState(true);

  // Custom size inputs state
  const [customUnit, setCustomUnit] = useState<'px' | 'mm' | 'in'>('mm');
  const [customDpi, setCustomDpi] = useState<number>(300);
  const [customWidth, setCustomWidth] = useState<number>(100);
  const [customHeight, setCustomHeight] = useState<number>(148);

  if (!presetModalOpen) return null;

  const tabs = [
    { id: 'print', label: '🖨️ 米家 / 相纸冲印', icon: Printer },
    { id: 'editorial', label: '🎨 艺术画报与画册', icon: Sparkles },
    { id: 'social', label: '📱 社交媒体与屏幕', icon: Smartphone },
    { id: 'custom', label: '⚙️ 自定义物理尺寸', icon: Sliders },
    { id: 'all', label: '全部尺寸预设', icon: Layers },
  ];

  const filteredPresets =
    activeTab === 'all'
      ? CANVAS_PRESETS
      : activeTab === 'custom'
      ? []
      : CANVAS_PRESETS.filter((p) => p.category === activeTab || (activeTab === 'print' && p.isPrint));

  const handleSelect = (preset: ExtendedCanvasPreset) => {
    updateCanvas(
      {
        width: preset.width,
        height: preset.height,
        presetName: preset.name,
      },
      autoReflow
    );
    setPresetModalOpen(false);
  };

  const handleApplyCustom = () => {
    let pxW = customWidth;
    let pxH = customHeight;

    if (customUnit === 'mm') {
      pxW = Math.round((customWidth / 25.4) * customDpi);
      pxH = Math.round((customHeight / 25.4) * customDpi);
    } else if (customUnit === 'in') {
      pxW = Math.round(customWidth * customDpi);
      pxH = Math.round(customHeight * customDpi);
    }

    pxW = Math.max(100, Math.min(8000, pxW));
    pxH = Math.max(100, Math.min(8000, pxH));

    const name = '自定义 (' + customWidth + '×' + customHeight + ' ' + customUnit + ')';

    updateCanvas(
      {
        width: pxW,
        height: pxH,
        presetName: name,
      },
      autoReflow
    );
    setPresetModalOpen(false);
  };

  // Compute live pixel size for custom tab
  const getCustomPixels = () => {
    if (customUnit === 'px') return { w: customWidth, h: customHeight };
    if (customUnit === 'mm') {
      return {
        w: Math.round((customWidth / 25.4) * customDpi),
        h: Math.round((customHeight / 25.4) * customDpi),
      };
    }
    return {
      w: Math.round(customWidth * customDpi),
      h: Math.round(customHeight * customDpi),
    };
  };

  const computedCustomPx = getCustomPixels();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 select-none"
      onClick={() => setPresetModalOpen(false)}
    >
      <div
        className="bg-studio-panel border border-studio-border rounded-2xl w-[95vw] max-w-2xl overflow-hidden shadow-soft-float flex flex-col max-h-[88vh] ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4.5 border-b border-studio-border flex items-center justify-between bg-studio-sidebar/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-studio-card flex items-center justify-center text-studio-accent border border-studio-border shadow-sm">
              <Printer className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-studio-text flex items-center gap-2">
                <span>相纸与画布尺寸设置</span>
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-studio-accent/15 text-white border border-studio-accent/30">
                  300 DPI 官方高清冲印
                </span>
              </h2>
              <p className="text-[11px] text-studio-muted mt-0.5">
                支持米家照片打印机 1S / Pro 6寸、3寸口袋相纸、A4、画报及自适应排版
              </p>
            </div>
          </div>
          <button
            id="close-preset-modal-btn"
            onClick={() => setPresetModalOpen(false)}
            className="p-1.5 rounded-lg text-studio-muted hover:text-studio-text hover:bg-studio-card transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Category Tabs */}
        <div className="px-5 pt-3 pb-2 border-b border-studio-border flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-studio-sidebar/40">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ' +
                (activeTab === tab.id
                  ? 'bg-studio-accent text-white shadow-sm font-semibold'
                  : 'text-studio-muted hover:text-studio-text hover:bg-studio-card')
              }
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-2.5 overflow-y-auto flex-1">
          {activeTab === 'custom' ? (
            <div className="space-y-4 p-2">
              <div className="p-4 rounded-xl border border-studio-border bg-studio-card/60 space-y-3.5">
                <span className="text-xs font-semibold text-studio-text block">
                  自定义物理或像素尺寸
                </span>

                {/* Unit & DPI Selection */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1.5">
                      尺寸单位
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-studio-panel p-1 rounded-lg border border-studio-border text-xs">
                      {(['mm', 'in', 'px'] as const).map((u) => (
                        <button
                          key={u}
                          onClick={() => {
                            setCustomUnit(u);
                            if (u === 'mm' && customUnit === 'px') {
                              setCustomWidth(100);
                              setCustomHeight(148);
                            } else if (u === 'in') {
                              setCustomWidth(4);
                              setCustomHeight(6);
                            } else if (u === 'px' && customUnit === 'mm') {
                              setCustomWidth(1181);
                              setCustomHeight(1748);
                            }
                          }}
                          className={
                            'py-1 rounded font-mono uppercase text-center transition-colors ' +
                            (customUnit === u
                              ? 'bg-studio-accent text-white font-bold'
                              : 'text-studio-muted hover:text-studio-text hover:bg-studio-hover')
                          }
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1.5">
                      冲印打印精度 (DPI)
                    </label>
                    <select
                      value={customDpi}
                      onChange={(e) => setCustomDpi(parseInt(e.target.value) || 300)}
                      className="w-full px-3 py-1.5 bg-studio-panel border border-studio-border rounded-lg text-xs text-studio-text focus:outline-none focus:border-studio-accent font-mono"
                    >
                      <option value={300}>300 DPI (官方高保真冲印)</option>
                      <option value={150}>150 DPI (中等印刷画幅)</option>
                      <option value={72}>72 DPI (屏幕与社交媒体)</option>
                    </select>
                  </div>
                </div>

                {/* Width & Height inputs */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1.5">
                      宽度 ({customUnit})
                    </label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-studio-panel border border-studio-border rounded-lg text-xs text-studio-text font-mono focus:outline-none focus:border-studio-accent"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1.5">
                      高度 ({customUnit})
                    </label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-studio-panel border border-studio-border rounded-lg text-xs text-studio-text font-mono focus:outline-none focus:border-studio-accent"
                    />
                  </div>
                </div>

                {/* Live converted pixels tag */}
                <div className="p-3 rounded-lg bg-studio-panel border border-studio-border/80 flex items-center justify-between text-xs font-mono text-studio-muted">
                  <span>实时渲染像素：</span>
                  <span className="text-studio-accent font-semibold">
                    {computedCustomPx.w} × {computedCustomPx.h} px
                  </span>
                </div>

                <button
                  onClick={handleApplyCustom}
                  className="w-full py-2.5 rounded-xl bg-studio-accent text-white font-semibold text-xs flex items-center justify-center gap-2 hover:bg-studio-accentHover transition-all shadow-subtle-glow mt-2"
                >
                  <span>创建自定义画布尺寸</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            filteredPresets.map((p) => {
              const isSelected = canvas.width === p.width && canvas.height === p.height;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className={
                    'p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all duration-150 ' +
                    (isSelected
                      ? 'border-studio-accent bg-studio-card ring-1 ring-studio-accent text-studio-text shadow-subtle-glow'
                      : 'border-studio-border/70 bg-studio-card/40 hover:bg-studio-card hover:border-gray-400 text-studio-muted hover:text-studio-text')
                  }
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-studio-text">{p.name}</span>
                      {p.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-studio-panel border border-studio-border text-studio-accent font-medium">
                          {p.badge}
                        </span>
                      )}
                      {p.physicalSize && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/[0.03] text-gray-700 border border-gray-200">
                          {p.physicalSize}
                        </span>
                      )}
                      {p.dpi && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {p.dpi} DPI
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-studio-muted line-clamp-1">{p.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div className="text-right font-mono text-xs text-studio-muted">
                      {p.width} × {p.height} <span className="text-[10px]">px</span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-studio-accent text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer with Auto-Reflow Toggle */}
        <div className="p-4 border-t border-studio-border bg-studio-sidebar/90 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-studio-text cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoReflow}
              onChange={(e) => setAutoReflow(e.target.checked)}
              className="rounded border-studio-border accent-studio-accent w-4 h-4 cursor-pointer"
            />
            <span>切换尺寸时，自动按比例重排缩放当前画面内容 (自适应排版)</span>
          </label>
        </div>
      </div>
    </div>
  );
};
