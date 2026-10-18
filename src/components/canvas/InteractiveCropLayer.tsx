import React, { useState, useEffect, useRef } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { ImageElement } from '../../types/document';
import {
  Check,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Crop as CropIcon,
  X,
  Move,
  FlipHorizontal,
  FlipVertical,
} from 'lucide-react';
import { clamp } from '../../lib/utils';

export const InteractiveCropLayer: React.FC = () => {
  const editingCropId = useEditorStore((s) => s.editingCropId);
  const setEditingCropId = useEditorStore((s) => s.setEditingCropId);
  const elements = useEditorStore((s) => s.document.elements);
  const updateElement = useEditorStore((s) => s.updateElement);
  const zoom = useEditorStore((s) => s.zoom);
  const pan = useEditorStore((s) => s.pan);

  const targetElement = elements.find((el) => el.id === editingCropId) as ImageElement | undefined;

  const [naturalSize, setNaturalSize] = useState({ width: 1200, height: 800 });
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 }); // frame pixels offset
  const [flipX, setFlipX] = useState<boolean>(false);
  const [flipY, setFlipY] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Dragging state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ clientX: 0, clientY: 0, startOffsetX: 0, startOffsetY: 0 });
  const frameRef = useRef<HTMLDivElement>(null);

  // Load natural dimensions & setup initial state
  useEffect(() => {
    if (!targetElement || targetElement.type !== 'image') return;

    setIsLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleImgLoad = () => {
      const nw = img.naturalWidth || targetElement.originalWidth || targetElement.width || 1200;
      const nh = img.naturalHeight || targetElement.originalHeight || targetElement.height || 800;
      setNaturalSize({ width: nw, height: nh });

      const frameW = targetElement.width;
      const frameH = targetElement.height;
      const baseScale = Math.max(frameW / nw, frameH / nh);

      if (targetElement.crop) {
        const initialScale = targetElement.crop.scale || 1.0;
        const z = clamp(initialScale, 1.0, 4.0);
        setScale(z);
        setFlipX(!!targetElement.crop.flipX);
        setFlipY(!!targetElement.crop.flipY);

        const currentRenderW = nw * baseScale * z;
        const currentRenderH = nh * baseScale * z;
        const maxX = Math.max(0, currentRenderW - frameW);
        const maxY = Math.max(0, currentRenderH - frameH);

        const loadedOffsetX = targetElement.crop.x * baseScale * z;
        const loadedOffsetY = targetElement.crop.y * baseScale * z;

        setOffset({
          x: clamp(loadedOffsetX, 0, maxX),
          y: clamp(loadedOffsetY, 0, maxY),
        });
      } else {
        setScale(1.0);
        setFlipX(false);
        setFlipY(false);
        const totalW = nw * baseScale;
        const totalH = nh * baseScale;
        setOffset({
          x: Math.max(0, (totalW - frameW) / 2),
          y: Math.max(0, (totalH - frameH) / 2),
        });
      }
      setIsLoaded(true);
    };

    img.onload = handleImgLoad;
    img.onerror = () => {
      handleImgLoad();
    };
    img.src = targetElement.src;
  }, [targetElement?.id]);

  // Global pointer move & up listeners
  useEffect(() => {
    const handleGlobalPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !targetElement) return;

      const frameW = targetElement.width;
      const frameH = targetElement.height;
      const nw = naturalSize.width;
      const nh = naturalSize.height;
      const baseScale = Math.max(frameW / nw, frameH / nh);
      const currentRenderW = nw * baseScale * scale;
      const currentRenderH = nh * baseScale * scale;

      const maxOffsetX = Math.max(0, currentRenderW - frameW);
      const maxOffsetY = Math.max(0, currentRenderH - frameH);

      const dx = (e.clientX - dragStartRef.current.clientX) / zoom;
      const dy = (e.clientY - dragStartRef.current.clientY) / zoom;

      const newOffsetX = clamp(dragStartRef.current.startOffsetX - dx, 0, maxOffsetX);
      const newOffsetY = clamp(dragStartRef.current.startOffsetY - dy, 0, maxOffsetY);

      setOffset({ x: newOffsetX, y: newOffsetY });
    };

    const handleGlobalPointerUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [naturalSize, scale, zoom, targetElement]);

  // Keyboard shortcut listener: Enter to save, Escape to cancel
  useEffect(() => {
    if (!editingCropId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingCropId(null);
      } else if (e.key === 'Enter') {
        handleSaveCrop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingCropId, offset, scale, naturalSize, targetElement, flipX, flipY]);

  if (!targetElement || targetElement.type !== 'image') {
    return null;
  }

  const frameW = targetElement.width;
  const frameH = targetElement.height;
  const nw = naturalSize.width;
  const nh = naturalSize.height;

  // Base cover scale factor mapping natural pixel to frame pixel at zoom 1.0
  const baseScale = Math.max(frameW / nw, frameH / nh);
  const currentRenderW = nw * baseScale * scale;
  const currentRenderH = nh * baseScale * scale;

  const maxOffsetX = Math.max(0, currentRenderW - frameW);
  const maxOffsetY = Math.max(0, currentRenderH - frameH);

  // Screen coordinates
  const screenX = pan.x + targetElement.x * zoom;
  const screenY = pan.y + targetElement.y * zoom;
  const screenW = frameW * zoom;
  const screenH = frameH * zoom;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
    isDraggingRef.current = true;
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    };
  };

  const handleScaleChange = (newScale: number) => {
    const clampedScale = clamp(newScale, 1.0, 4.0);

    const currentCenterX = offset.x + frameW / 2;
    const currentCenterY = offset.y + frameH / 2;
    const ratioX = currentRenderW > 0 ? currentCenterX / currentRenderW : 0.5;
    const ratioY = currentRenderH > 0 ? currentCenterY / currentRenderH : 0.5;

    const nextRenderW = nw * baseScale * clampedScale;
    const nextRenderH = nh * baseScale * clampedScale;
    const nextMaxX = Math.max(0, nextRenderW - frameW);
    const nextMaxY = Math.max(0, nextRenderH - frameH);

    const nextCenterX = ratioX * nextRenderW;
    const nextCenterY = ratioY * nextRenderH;

    const nextOffsetX = clamp(nextCenterX - frameW / 2, 0, nextMaxX);
    const nextOffsetY = clamp(nextCenterY - frameH / 2, 0, nextMaxY);

    setScale(clampedScale);
    setOffset({ x: nextOffsetX, y: nextOffsetY });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const zoomStep = e.deltaY < 0 ? 0.08 : -0.08;
    handleScaleChange(scale + zoomStep);
  };

  const handleSaveCrop = () => {
    const naturalCropX = offset.x / (baseScale * scale);
    const naturalCropY = offset.y / (baseScale * scale);
    const naturalCropW = frameW / (baseScale * scale);
    const naturalCropH = frameH / (baseScale * scale);

    const sx = Math.max(0, Math.min(nw - 1, Math.round(naturalCropX)));
    const sy = Math.max(0, Math.min(nh - 1, Math.round(naturalCropY)));
    const sw = Math.max(10, Math.min(nw - sx, Math.round(naturalCropW)));
    const sh = Math.max(10, Math.min(nh - sy, Math.round(naturalCropH)));

    updateElement(targetElement.id, {
      crop: {
        x: sx,
        y: sy,
        width: sw,
        height: sh,
        scale: scale,
        flipX,
        flipY,
      },
      fit: 'cover',
    });
    setEditingCropId(null);
  };

  const handleReset = () => {
    setScale(1.0);
    setFlipX(false);
    setFlipY(false);
    const baseW = nw * baseScale;
    const baseH = nh * baseScale;
    setOffset({
      x: Math.max(0, (baseW - frameW) / 2),
      y: Math.max(0, (baseH - frameH) / 2),
    });
  };

  const handleClose = () => {
    setEditingCropId(null);
  };

  return (
    <div
      className="absolute inset-0 pointer-events-auto z-40 bg-black/40 select-none flex items-center justify-center overflow-hidden"
      onClick={handleClose}
      onWheel={handleWheel}
    >
      {/* Top Floating Responsive Control Bar */}
      <div
        className="fixed top-3 sm:top-14 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-2 bg-studio-card border border-studio-border p-2 sm:px-5 sm:py-2.5 rounded-xl shadow-2xl z-50 text-xs text-studio-text select-none max-w-[95vw] w-auto shrink-0 animate-slideDown"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 pr-1 shrink-0">
          <CropIcon className="w-4 h-4 text-studio-accent" />
          <span className="font-serif text-studio-accent font-semibold tracking-wider text-[11px] sm:text-xs">
            框内裁切
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 shrink-0 bg-studio-panel px-2 py-1 rounded-lg border border-studio-border">
          <button
            onClick={() => handleScaleChange(scale - 0.1)}
            className="p-1 rounded-lg hover:bg-studio-card text-studio-muted hover:text-studio-text"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <input
            type="range"
            min="1"
            max="4"
            step="0.02"
            value={scale}
            onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
            className="w-16 xs:w-24 sm:w-28 accent-studio-accent h-1 bg-gray-100 rounded cursor-pointer"
          />
          <button
            onClick={() => handleScaleChange(scale + 0.1)}
            className="p-1 rounded-lg hover:bg-studio-card text-studio-muted hover:text-studio-text"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[10px] sm:text-[11px] text-studio-accent font-medium w-8 text-right shrink-0">
            {Math.round(scale * 100)}%
          </span>
        </div>

        {/* Flip Controls */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setFlipX(!flipX)}
            className={`p-1.5 rounded-lg border ${
              flipX ? 'bg-studio-accent text-white border-studio-accent font-bold' : 'text-studio-muted hover:text-gray-950 bg-studio-panel border-studio-border'
            }`}
            title="水平镜像翻转"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setFlipY(!flipY)}
            className={`p-1.5 rounded-lg border ${
              flipY ? 'bg-studio-accent text-white border-studio-accent font-bold' : 'text-studio-muted hover:text-gray-950 bg-studio-panel border-studio-border'
            }`}
            title="垂直镜像翻转"
          >
            <FlipVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-studio-muted hover:text-studio-text px-2 py-1 rounded-lg bg-studio-panel border border-studio-border text-[11px] shrink-0 cursor-pointer"
          title="居中重置"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden xs:inline">重置</span>
        </button>

        {/* Confirm Save */}
        <button
          id="confirm-crop-btn"
          onClick={handleSaveCrop}
          className="flex items-center gap-1.5 bg-studio-accent text-white font-semibold px-3 sm:px-4 py-1.5 rounded-lg hover:bg-studio-accentHover transition-all shadow-subtle-glow text-xs cursor-pointer shrink-0"
        >
          <Check className="w-3.5 h-3.5" />
          <span>完成</span>
        </button>

        <button
          onClick={handleClose}
          className="p-1.5 text-studio-muted hover:text-studio-text rounded-lg bg-studio-panel hover:bg-studio-card transition-colors cursor-pointer shrink-0"
          title="取消"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Crop Frame Viewport */}
      <div
        ref={frameRef}
        className="absolute overflow-hidden cursor-grab active:cursor-grabbing border-2 border-studio-accent shadow-2xl ring-4 ring-black/70 touch-none"
        style={{
          left: screenX,
          top: screenY,
          width: screenW,
          height: screenH,
          borderRadius: (targetElement.borderRadius || 0) * zoom,
        }}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleSaveCrop}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Live Image inside Frame */}
        <img
          src={targetElement.src}
          alt="Cropping Target"
          draggable={false}
          className="absolute max-w-none select-none pointer-events-none transition-none"
          style={{
            width: currentRenderW * zoom,
            height: currentRenderH * zoom,
            left: -offset.x * zoom,
            top: -offset.y * zoom,
            transform: `scaleX(${flipX ? -1 : 1}) scaleY(${flipY ? -1 : 1})`,
          }}
        />

        {/* Rule of Thirds Grid Overlay */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-60">
          <div className="border-r border-b border-white/60 shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
          <div className="border-r border-b border-white/60 shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
          <div className="border-b border-white/60 shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
          <div className="border-r border-b border-white/60 shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
          <div className="border-r border-b border-white/60 shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
          <div className="border-b border-white/60 shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
          <div className="border-r border-b border-white/60 shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
          <div className="border-r border-b border-white/60 shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
          <div />
        </div>

        {/* Corner Accents */}
        <div className="absolute top-1 left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-studio-accent pointer-events-none" />
        <div className="absolute top-1 right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-studio-accent pointer-events-none" />
        <div className="absolute bottom-1 left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-studio-accent pointer-events-none" />
        <div className="absolute bottom-1 right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-studio-accent pointer-events-none" />

        {/* Drag Hint Tag */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-white text-[9px] sm:text-[10px] font-mono text-studio-accent pointer-events-none border border-gray-200 shadow-lg flex items-center gap-1 whitespace-nowrap">
          <Move className="w-3 h-3" />
          <span>拖动画幅 • 缩放微调构图</span>
        </div>
      </div>
    </div>
  );
};
