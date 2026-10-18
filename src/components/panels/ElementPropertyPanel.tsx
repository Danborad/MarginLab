import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import {
  ImageElement,
  TextElement,
  ShapeElement,
  StickerElement,
  CollageElement,
} from '../../types/document';
import { Slider } from '../ui/Slider';
import { Input } from '../ui/Input';
import { ColorPicker } from '../ui/ColorPicker';
import { Select } from '../ui/Select';
import { FONTS } from '../../lib/fonts';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowUpToLine,
  ArrowDownToLine,
  Layers,
  Crop,
  Copy,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  MoveVertical,
  MoveHorizontal,
  Bold,
  Italic,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';

export const ElementPropertyPanel: React.FC = () => {
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const elements = useEditorStore((s) => s.document.elements);
  const updateElement = useEditorStore((s) => s.updateElement);
  const deleteElements = useEditorStore((s) => s.deleteElements);
  const duplicateElements = useEditorStore((s) => s.duplicateElements);
  const alignElements = useEditorStore((s) => s.alignElements);
  const reorderElement = useEditorStore((s) => s.reorderElement);
  const toggleLock = useEditorStore((s) => s.toggleLock);
  const setEditingCropId = useEditorStore((s) => s.setEditingCropId);
  const openAiStylizeModal = useEditorStore((s) => s.openAiStylizeModal);
  const openReplacePhotoModal = useEditorStore((s) => s.openReplacePhotoModal);

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));

  if (selectedElements.length === 0) {
    return (
      <div className="p-5 text-center text-studio-muted text-xs space-y-2">
        <div className="w-10 h-10 rounded-full bg-studio-card flex items-center justify-center mx-auto text-studio-border">
          <Layers className="w-5 h-5" />
        </div>
        <p className="font-medium text-studio-text">未选中对象</p>
        <p className="text-[11px] leading-relaxed text-studio-muted">
          在画布上点击任意图片、文字或形状以调整排版与视觉属性
        </p>
      </div>
    );
  }

  // Multi-selection view
  if (selectedElements.length > 1) {
    return (
      <div className="p-4 space-y-5">
        <div className="pb-2 border-b border-studio-border flex items-center justify-between">
          <span className="text-xs font-semibold text-studio-text">
            已选中 {selectedElements.length} 个对象
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => duplicateElements()}
              className="p-1.5 rounded hover:bg-studio-card text-studio-muted hover:text-studio-text"
              title="批量复制"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => deleteElements()}
              className="p-1.5 rounded hover:bg-red-500/10 text-red-600"
              title="批量删除"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Alignment Matrix */}
        <div className="space-y-2">
          <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
            对齐与分布
          </span>
          <div className="grid grid-cols-4 gap-1.5 bg-studio-card p-1.5 rounded-lg border border-studio-border">
            <button
              onClick={() => alignElements('left')}
              className="p-1.5 rounded hover:bg-studio-panel text-studio-muted hover:text-studio-text flex items-center justify-center"
              title="左对齐"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => alignElements('center')}
              className="p-1.5 rounded hover:bg-studio-panel text-studio-muted hover:text-studio-text flex items-center justify-center"
              title="水平居中"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => alignElements('right')}
              className="p-1.5 rounded hover:bg-studio-panel text-studio-muted hover:text-studio-text flex items-center justify-center"
              title="右对齐"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => alignElements('distribute-h')}
              className="p-1.5 rounded hover:bg-studio-panel text-studio-muted hover:text-studio-text flex items-center justify-center"
              title="水平等间距分布"
            >
              <MoveHorizontal className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => alignElements('top')}
              className="p-1.5 rounded hover:bg-studio-panel text-studio-muted hover:text-studio-text flex items-center justify-center"
              title="顶对齐"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => alignElements('middle')}
              className="p-1.5 rounded hover:bg-studio-panel text-studio-muted hover:text-studio-text flex items-center justify-center"
              title="垂直居中"
            >
              <AlignCenter className="w-3.5 h-3.5 rotate-90" />
            </button>
            <button
              onClick={() => alignElements('bottom')}
              className="p-1.5 rounded hover:bg-studio-panel text-studio-muted hover:text-studio-text flex items-center justify-center"
              title="底对齐"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => alignElements('distribute-v')}
              className="p-1.5 rounded hover:bg-studio-panel text-studio-muted hover:text-studio-text flex items-center justify-center"
              title="垂直等间距分布"
            >
              <MoveVertical className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Single element view
  const element = selectedElements[0];

  return (
    <div className="p-4 space-y-5 max-h-[calc(100vh-120px)] overflow-y-auto pr-1">
      {/* Header with Title & Quick actions */}
      <div className="pb-2 border-b border-studio-border flex items-center justify-between">
        <span className="text-xs font-semibold text-studio-text truncate max-w-[150px]">
          {element.name}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => duplicateElements([element.id])}
            className="p-1.5 rounded hover:bg-studio-card text-studio-muted hover:text-studio-text"
            title="复制"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => toggleLock(element.id)}
            className={`p-1.5 rounded hover:bg-studio-card ${
              element.locked ? 'text-amber-600' : 'text-studio-muted hover:text-studio-text'
            }`}
            title={element.locked ? '解锁' : '锁定'}
          >
            {element.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => deleteElements([element.id])}
            className="p-1.5 rounded hover:bg-red-500/10 text-red-600"
            title="删除"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Position & Size Grid */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
          变换与几何
        </span>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="X"
            type="number"
            value={element.x}
            onChange={(e) => updateElement(element.id, { x: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="Y"
            type="number"
            value={element.y}
            onChange={(e) => updateElement(element.id, { y: parseInt(e.target.value) || 0 })}
          />
          <Input
            label="宽 (W)"
            type="number"
            value={element.width}
            onChange={(e) => updateElement(element.id, { width: Math.max(10, parseInt(e.target.value) || 10) })}
          />
          <Input
            label="高 (H)"
            type="number"
            value={element.height}
            onChange={(e) => updateElement(element.id, { height: Math.max(10, parseInt(e.target.value) || 10) })}
          />
        </div>
      </div>

      {/* Rotation & Opacity */}
      <div className="space-y-3">
        <Slider
          label="旋转角度"
          value={element.rotation}
          min={0}
          max={360}
          unit="°"
          onChange={(val) => updateElement(element.id, { rotation: val })}
        />
        <Slider
          label="不透明度"
          value={Math.round(element.opacity * 100)}
          min={0}
          max={100}
          unit="%"
          onChange={(val) => updateElement(element.id, { opacity: val / 100 })}
        />
      </div>

      {/* Layer Order Actions */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
          图层层级
        </span>
        <div className="grid grid-cols-4 gap-1.5 bg-studio-card p-1.5 rounded-lg border border-studio-border text-[11px]">
          <button
            onClick={() => reorderElement(element.id, 'front')}
            className="p-1.5 rounded hover:bg-studio-panel text-studio-muted hover:text-studio-text text-center"
            title="置于顶层"
          >
            置顶
          </button>
          <button
            onClick={() => reorderElement(element.id, 'forward')}
            className="p-1.5 rounded hover:bg-studio-panel text-studio-muted hover:text-studio-text text-center"
            title="上移一层"
          >
            上移
          </button>
          <button
            onClick={() => reorderElement(element.id, 'backward')}
            className="p-1.5 rounded hover:bg-studio-panel text-studio-muted hover:text-studio-text text-center"
            title="下移一层"
          >
            下移
          </button>
          <button
            onClick={() => reorderElement(element.id, 'back')}
            className="p-1.5 rounded hover:bg-studio-panel text-studio-muted hover:text-studio-text text-center"
            title="置于底层"
          >
            置底
          </button>
        </div>
      </div>

      {/* Type-Specific Panels */}

      {/* IMAGE PROPS */}
      {element.type === 'image' && (
        <div className="space-y-4 pt-2 border-t border-studio-border">
          <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
            图片属性与修饰
          </span>

          {/* AI Stylize & Quick Actions */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => openAiStylizeModal((element as any).src, element.id)}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-studio-accent/15 hover:bg-studio-accent/25 border border-studio-accent/40 rounded-lg text-xs font-semibold text-white transition-colors shadow-sm cursor-pointer"
              title="使用 AI 风格化重构当前相片"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 风格化</span>
            </button>

            <button
              onClick={() => openReplacePhotoModal(element.id)}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-studio-card hover:bg-studio-hover border border-studio-border rounded-lg text-xs font-medium text-studio-text hover:text-studio-accent transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>替换照片</span>
            </button>
          </div>

          {/* Interactive Crop Button */}
          <button
            onClick={() => setEditingCropId(element.id)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-studio-card hover:bg-studio-hover border border-studio-border rounded-lg text-xs font-medium text-studio-accent transition-colors"
          >
            <Crop className="w-4 h-4" />
            <span>进入框内交互裁切 (双击)</span>
          </button>

          <Slider
            label="圆角半径"
            value={element.borderRadius || 0}
            min={0}
            max={100}
            unit="px"
            onChange={(val) => updateElement(element.id, { borderRadius: val })}
          />

          <Slider
            label="边框宽度"
            value={element.borderWidth || 0}
            min={0}
            max={20}
            unit="px"
            onChange={(val) => updateElement(element.id, { borderWidth: val })}
          />

          {element.borderWidth && element.borderWidth > 0 ? (
            <ColorPicker
              label="边框颜色"
              color={element.borderColor || '#FFFFFF'}
              onChange={(c) => updateElement(element.id, { borderColor: c })}
            />
          ) : null}

          {/* Drop Shadow */}
          <Slider
            label="阴影模糊"
            value={element.shadowBlur || 0}
            min={0}
            max={60}
            unit="px"
            onChange={(val) => updateElement(element.id, { shadowBlur: val })}
          />

          {/* Filter presets */}
          <div className="space-y-2 pt-2 border-t border-studio-border">
            <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
              艺术滤镜
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() =>
                  updateElement(element.id, {
                    filters: { ...element.filters, grayscale: element.filters?.grayscale ? 0 : 1 },
                  })
                }
                className={`py-1.5 px-2 rounded border text-center font-mono ${
                  element.filters?.grayscale
                    ? 'border-studio-accent bg-studio-card text-studio-accent'
                    : 'border-studio-border bg-studio-card/40 text-studio-muted'
                }`}
              >
                黑白胶片 (B&W)
              </button>
              <button
                onClick={() =>
                  updateElement(element.id, {
                    filters: { ...element.filters, sepia: element.filters?.sepia ? 0 : 0.8 },
                  })
                }
                className={`py-1.5 px-2 rounded border text-center font-mono ${
                  element.filters?.sepia
                    ? 'border-studio-accent bg-studio-card text-studio-accent'
                    : 'border-studio-border bg-studio-card/40 text-studio-muted'
                }`}
              >
                暖色复古 (Sepia)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEXT PROPS */}
      {element.type === 'text' && (
        <div className="space-y-4 pt-2 border-t border-studio-border">
          <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
            排版与文字
          </span>

          {/* Textarea */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-studio-muted uppercase">文本内容</label>
            <textarea
              rows={3}
              value={element.text}
              onChange={(e) => updateElement(element.id, { text: e.target.value })}
              className="w-full px-2.5 py-1.5 bg-studio-card border border-studio-border rounded-md text-xs text-studio-text focus:outline-none focus:border-studio-accent resize-none font-sans"
            />
          </div>

          {/* Font Family */}
          <Select
            label="字体族 (Font Family)"
            value={element.fontFamily}
            options={FONTS.map((f) => ({ label: `${f.name} (${f.category})`, value: f.family }))}
            onChange={(e) => updateElement(element.id, { fontFamily: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="字号 (PX)"
              type="number"
              value={element.fontSize}
              onChange={(e) => updateElement(element.id, { fontSize: parseInt(e.target.value) || 12 })}
            />
            <Select
              label="字重"
              value={element.fontWeight}
              options={[
                { label: '300 Light', value: 300 },
                { label: '400 Regular', value: 400 },
                { label: '600 Medium', value: 600 },
                { label: '700 Bold', value: 700 },
                { label: '900 Black', value: 900 },
              ]}
              onChange={(e) => updateElement(element.id, { fontWeight: parseInt(e.target.value) || 400 })}
            />
          </div>

          {/* Align & Style toggles */}
          <div className="flex items-center justify-between gap-1 bg-studio-card p-1.5 rounded-lg border border-studio-border">
            <div className="flex items-center gap-1">
              <button
                onClick={() => updateElement(element.id, { textAlign: 'left' })}
                className={`p-1.5 rounded ${
                  element.textAlign === 'left'
                    ? 'bg-studio-panel text-studio-accent'
                    : 'text-studio-muted hover:text-studio-text'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateElement(element.id, { textAlign: 'center' })}
                className={`p-1.5 rounded ${
                  element.textAlign === 'center'
                    ? 'bg-studio-panel text-studio-accent'
                    : 'text-studio-muted hover:text-studio-text'
                }`}
              >
                <AlignCenter className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => updateElement(element.id, { textAlign: 'right' })}
                className={`p-1.5 rounded ${
                  element.textAlign === 'right'
                    ? 'bg-studio-panel text-studio-accent'
                    : 'text-studio-muted hover:text-studio-text'
                }`}
              >
                <AlignRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  updateElement(element.id, {
                    fontStyle: element.fontStyle === 'italic' ? 'normal' : 'italic',
                  })
                }
                className={`p-1.5 rounded ${
                  element.fontStyle === 'italic'
                    ? 'bg-studio-panel text-studio-accent'
                    : 'text-studio-muted hover:text-studio-text'
                }`}
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() =>
                  updateElement(element.id, {
                    textTransform: element.textTransform === 'uppercase' ? 'none' : 'uppercase',
                  })
                }
                className={`px-2 py-1 rounded text-[10px] font-mono ${
                  element.textTransform === 'uppercase'
                    ? 'bg-studio-panel text-studio-accent font-bold'
                    : 'text-studio-muted hover:text-studio-text'
                }`}
              >
                AA
              </button>
            </div>
          </div>

          <Slider
            label="字间距 (Tracking)"
            value={element.letterSpacing || 0}
            min={-2}
            max={20}
            step={0.5}
            unit="px"
            onChange={(val) => updateElement(element.id, { letterSpacing: val })}
          />

          <Slider
            label="行高 (Line Height)"
            value={element.lineHeight || 1.2}
            min={0.8}
            max={2.5}
            step={0.05}
            onChange={(val) => updateElement(element.id, { lineHeight: val })}
          />

          <ColorPicker
            label="文字颜色"
            color={element.color}
            onChange={(c) => updateElement(element.id, { color: c })}
          />
        </div>
      )}

      {/* SHAPE PROPS */}
      {element.type === 'shape' && (
        <div className="space-y-4 pt-2 border-t border-studio-border">
          <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
            形状样式
          </span>

          <ColorPicker
            label="填充颜色 (Fill)"
            color={element.fill}
            onChange={(c) => updateElement(element.id, { fill: c })}
          />

          <Slider
            label="描边宽度"
            value={element.strokeWidth || 0}
            min={0}
            max={20}
            unit="px"
            onChange={(val) => updateElement(element.id, { strokeWidth: val })}
          />

          {element.strokeWidth && element.strokeWidth > 0 ? (
            <ColorPicker
              label="描边颜色 (Stroke)"
              color={element.stroke}
              onChange={(c) => updateElement(element.id, { stroke: c })}
            />
          ) : null}

          {element.shapeType === 'rect' && (
            <Slider
              label="圆角半径"
              value={element.borderRadius || 0}
              min={0}
              max={100}
              unit="px"
              onChange={(val) => updateElement(element.id, { borderRadius: val })}
            />
          )}
        </div>
      )}

      {/* STICKER PROPS */}
      {element.type === 'sticker' && (
        <div className="space-y-4 pt-2 border-t border-studio-border">
          <span className="text-[11px] font-mono text-studio-muted uppercase tracking-wider block">
            贴纸印章属性
          </span>

          {element.label !== undefined && (
            <Input
              label="标签文字"
              value={element.label}
              onChange={(e) => updateElement(element.id, { label: e.target.value })}
            />
          )}

          <ColorPicker
            label="底色"
            color={element.color || '#1A1918'}
            onChange={(c) => updateElement(element.id, { color: c })}
          />

          {element.accentColor && (
            <ColorPicker
              label="高亮强调色"
              color={element.accentColor}
              onChange={(c) => updateElement(element.id, { accentColor: c })}
            />
          )}
        </div>
      )}
    </div>
  );
};
