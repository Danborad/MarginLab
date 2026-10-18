import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '../../store/useEditorStore';
import { CanvasBackground } from './CanvasBackground';
import { ImageElementNode } from './ImageElementNode';
import { TextElementNode } from './TextElementNode';
import { ShapeElementNode } from './ShapeElementNode';
import { StickerElementNode } from './StickerElementNode';
import { TransformController } from './TransformController';
import { AlignmentGuides } from './AlignmentGuides';
import { InteractiveCropLayer } from './InteractiveCropLayer';
import { AlignmentGuide, ImageElement, TextElement, ShapeElement, StickerElement } from '../../types/document';
import {
  Crop,
  ImagePlus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Wand2,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { fileToBase64, getImageDimensions } from '../../lib/utils';

export const CanvasStage: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const quickBarRef = useRef<HTMLDivElement>(null);

  const document = useEditorStore((s) => s.document);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const zoom = useEditorStore((s) => s.zoom);
  const pan = useEditorStore((s) => s.pan);
  const editingCropId = useEditorStore((s) => s.editingCropId);
  const guides = useEditorStore((s) => s.guides);
  const showGrid = useEditorStore((s) => s.showGrid);
  const gridSize = useEditorStore((s) => s.gridSize);
  const snapToObjects = useEditorStore((s) => s.snapToObjects);

  const setZoom = useEditorStore((s) => s.setZoom);
  const setPan = useEditorStore((s) => s.setPan);
  const selectElements = useEditorStore((s) => s.selectElements);
  const toggleSelectElement = useEditorStore((s) => s.toggleSelectElement);
  const clearSelection = useEditorStore((s) => s.clearSelection);
  const updateElement = useEditorStore((s) => s.updateElement);
  const setEditingCropId = useEditorStore((s) => s.setEditingCropId);
  const openReplacePhotoModal = useEditorStore((s) => s.openReplacePhotoModal);
  const openAiStylizeModal = useEditorStore((s) => s.openAiStylizeModal);
  const setGuides = useEditorStore((s) => s.setGuides);
  const clearGuides = useEditorStore((s) => s.clearGuides);
  const addElement = useEditorStore((s) => s.addElement);
  const deleteElements = useEditorStore((s) => s.deleteElements);
  const duplicateElements = useEditorStore((s) => s.duplicateElements);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const selectAll = useEditorStore((s) => s.selectAll);
  const setAutoLayoutModalOpen = useEditorStore((s) => s.setAutoLayoutModalOpen);

  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanningWithMouse, setIsPanningWithMouse] = useState(false);
  // Half of the floating quick action bar width (+ margin), measured so the bar
  // can never be pushed past the left/right edge of the canvas container.
  const [quickBarHalf, setQuickBarHalf] = useState(140);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Touch gesture pinch & pan tracking
  const touchStateRef = useRef<{
    lastDist: number;
    lastCenter: { x: number; y: number };
    isPinching: boolean;
  }>({
    lastDist: 0,
    lastCenter: { x: 0, y: 0 },
    isPinching: false,
  });

  // Update container size on resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keep the quick action bar fully inside the canvas container on every viewport
  const isQuickBarVisible = selectedIds.length === 1 && !editingCropId;
  useEffect(() => {
    if (!isQuickBarVisible) return;
    const measure = () => {
      const el = quickBarRef.current;
      if (el) setQuickBarHalf(el.offsetWidth / 2 + 12);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (quickBarRef.current) observer.observe(quickBarRef.current);
    return () => observer.disconnect();
  }, [isQuickBarVisible]);

  // Center canvas initially or when canvas dimensions change
  useEffect(() => {
    if (containerRef.current) {
      const containerW = containerRef.current.clientWidth;
      const containerH = containerRef.current.clientHeight;
      
      // Auto fit zoom for mobile screens
      let targetZoom = zoom;
      if (containerW < 600) {
        const fitScale = Math.min((containerW * 0.88) / document.canvas.width, (containerH * 0.75) / document.canvas.height);
        targetZoom = Math.max(0.15, Math.min(fitScale, 0.45));
        setZoom(targetZoom);
      }

      const targetW = document.canvas.width * targetZoom;
      const targetH = document.canvas.height * targetZoom;

      setPan({
        x: (containerW - targetW) / 2,
        y: (containerH - targetH) / 2,
      });
    }
  }, [document.canvas.width, document.canvas.height]);

  // Center & Fit Canvas Action
  const handleFitCenter = () => {
    if (containerRef.current) {
      const containerW = containerRef.current.clientWidth;
      const containerH = containerRef.current.clientHeight;
      const fitScale = Math.min(
        (containerW * 0.88) / document.canvas.width,
        (containerH * 0.78) / document.canvas.height
      );
      const newZoom = Math.max(0.15, Math.min(fitScale, 1.2));
      setZoom(newZoom);
      setPan({
        x: (containerW - document.canvas.width * newZoom) / 2,
        y: (containerH - document.canvas.height * newZoom) / 2,
      });
    }
  };

  // Touch Gesture Listeners (Pinch to Zoom + Two-Finger Pan)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const centerX = (t1.clientX + t2.clientX) / 2;
      const centerY = (t1.clientY + t2.clientY) / 2;

      touchStateRef.current = {
        lastDist: dist,
        lastCenter: { x: centerX, y: centerY },
        isPinching: true,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStateRef.current.isPinching && containerRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const centerX = (t1.clientX + t2.clientX) / 2;
      const centerY = (t1.clientY + t2.clientY) / 2;

      const rect = containerRef.current.getBoundingClientRect();
      const pointerX = centerX - rect.left;
      const pointerY = centerY - rect.top;

      // Calculate scale change
      const scaleFactor = dist / (touchStateRef.current.lastDist || dist);
      const newZoom = Math.min(Math.max(zoom * scaleFactor, 0.1), 4.0);

      // Calculate pan delta
      const dx = centerX - touchStateRef.current.lastCenter.x;
      const dy = centerY - touchStateRef.current.lastCenter.y;

      const pointTo = {
        x: (pointerX - pan.x) / zoom,
        y: (pointerY - pan.y) / zoom,
      };

      setPan({
        x: pointerX - pointTo.x * newZoom + dx,
        y: pointerY - pointTo.y * newZoom + dy,
      });
      setZoom(newZoom);

      touchStateRef.current.lastDist = dist;
      touchStateRef.current.lastCenter = { x: centerX, y: centerY };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchStateRef.current.isPinching = false;
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable;

      if (e.code === 'Space' && !isInput) {
        setIsSpacePressed(true);
      }

      if (isInput) return;

      const isMeta = e.metaKey || e.ctrlKey;

      if (isMeta && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (isMeta && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (isMeta && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateElements();
      } else if (isMeta && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteElements();
      } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        if (selectedIds.length > 0) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
          const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

          selectedIds.forEach((id) => {
            const el = document.elements.find((item) => item.id === id);
            if (el && !el.locked) {
              updateElement(id, { x: el.x + dx, y: el.y + dy }, false);
            }
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanningWithMouse(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedIds, document.elements, undo, redo, duplicateElements, deleteElements, selectAll, updateElement]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const pointerX = e.clientX - rect.left;
    const pointerY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.1), 4.0);

    const mousePointTo = {
      x: (pointerX - pan.x) / zoom,
      y: (pointerY - pan.y) / zoom,
    };

    setPan({
      x: pointerX - mousePointTo.x * newZoom,
      y: pointerY - mousePointTo.y * newZoom,
    });
    setZoom(newZoom);
  };

  // Pan interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed || e.button === 1) {
      setIsPanningWithMouse(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanningWithMouse) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanningWithMouse(false);
  };

  // Stage click: clear selection if clicked on background
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === stageRef.current || e.target.name() === 'canvas-background-rect') {
      clearSelection();
    }
  };

  // Magnetic Snapping calculation during element drag
  const handleElementDragMove = (draggedId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    if (!snapToObjects) return;

    const node = e.target;
    const currentX = node.x();
    const currentY = node.y();
    const currentW = node.width();
    const currentH = node.height();

    const SNAP_DIST = 6;
    const newGuides: AlignmentGuide[] = [];

    const otherElements = document.elements.filter((el) => el.id !== draggedId && el.visible);

    const snapPointsX = [0, document.canvas.width / 2, document.canvas.width];
    const snapPointsY = [0, document.canvas.height / 2, document.canvas.height];

    otherElements.forEach((el) => {
      snapPointsX.push(el.x, el.x + el.width / 2, el.x + el.width);
      snapPointsY.push(el.y, el.y + el.height / 2, el.y + el.height);
    });

    const myCenterX = currentX + currentW / 2;
    const myCenterY = currentY + currentH / 2;

    snapPointsX.forEach((snapX) => {
      if (Math.abs(currentX - snapX) < SNAP_DIST) {
        node.x(snapX);
        newGuides.push({ type: 'vertical', position: snapX, start: 0, end: document.canvas.height });
      } else if (Math.abs(myCenterX - snapX) < SNAP_DIST) {
        node.x(snapX - currentW / 2);
        newGuides.push({ type: 'vertical', position: snapX, start: 0, end: document.canvas.height });
      } else if (Math.abs(currentX + currentW - snapX) < SNAP_DIST) {
        node.x(snapX - currentW);
        newGuides.push({ type: 'vertical', position: snapX, start: 0, end: document.canvas.height });
      }
    });

    snapPointsY.forEach((snapY) => {
      if (Math.abs(currentY - snapY) < SNAP_DIST) {
        node.y(snapY);
        newGuides.push({ type: 'horizontal', position: snapY, start: 0, end: document.canvas.width });
      } else if (Math.abs(myCenterY - snapY) < SNAP_DIST) {
        node.y(snapY - currentH / 2);
        newGuides.push({ type: 'horizontal', position: snapY, start: 0, end: document.canvas.width });
      } else if (Math.abs(currentY + currentH - snapY) < SNAP_DIST) {
        node.y(snapY - currentH);
        newGuides.push({ type: 'horizontal', position: snapY, start: 0, end: document.canvas.width });
      }
    });

    setGuides(newGuides);
  };

  const handleElementDragEnd = () => {
    clearGuides();
  };

  // Drag & drop files onto canvas
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dropX = (e.clientX - rect.left - pan.x) / zoom;
    const dropY = (e.clientY - rect.top - pan.y) / zoom;

    const stockPhotoData = e.dataTransfer.getData('application/json');
    if (stockPhotoData) {
      try {
        const photo = JSON.parse(stockPhotoData);
        const w = 480;
        const h = Math.round(w / (photo.aspectRatio || 1));

        addElement({
          type: 'image',
          name: photo.title || 'Image',
          x: Math.round(dropX - w / 2),
          y: Math.round(dropY - h / 2),
          width: w,
          height: h,
          rotation: 0,
          opacity: 1,
          src: photo.full || photo.thumb,
          originalWidth: 1600,
          originalHeight: Math.round(1600 / (photo.aspectRatio || 1)),
          fit: 'cover',
          borderRadius: 2,
          shadowBlur: 20,
          shadowOpacity: 0.15,
        });
        return;
      } catch (err) {
        console.error(err);
      }
    }

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
          const base64 = await fileToBase64(file);
          const dims = await getImageDimensions(base64);
          const aspect = dims.width / dims.height;
          const w = 480;
          const h = Math.round(w / aspect);

          addElement({
            type: 'image',
            name: file.name.replace(/\.[^/.]+$/, ''),
            x: Math.round(dropX - w / 2 + i * 30),
            y: Math.round(dropY - h / 2 + i * 30),
            width: w,
            height: h,
            rotation: 0,
            opacity: 1,
            src: base64,
            originalWidth: dims.width,
            originalHeight: dims.height,
            fit: 'cover',
            borderRadius: 2,
            shadowBlur: 20,
            shadowOpacity: 0.15,
          });
        }
      }
    }
  };

  const sortedElements = [...document.elements].sort((a, b) => a.zIndex - b.zIndex);

  const singleSelectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const singleSelectedElement = singleSelectedId
    ? document.elements.find((el) => el.id === singleSelectedId)
    : null;
  const isSingleImageSelected = singleSelectedElement && singleSelectedElement.type === 'image';

  const handleReplacePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && singleSelectedElement && singleSelectedElement.type === 'image') {
      const base64 = await fileToBase64(file);
      const dims = await getImageDimensions(base64);
      updateElement(singleSelectedElement.id, {
        src: base64,
        originalWidth: dims.width,
        originalHeight: dims.height,
        crop: undefined,
      });
    }
    if (replaceInputRef.current) replaceInputRef.current.value = '';
  };

  // Calculate safe floating action bar coordinates
  const floatingLeft = singleSelectedElement
    ? Math.max(quickBarHalf, Math.min(containerSize.width - quickBarHalf, pan.x + (singleSelectedElement.x + singleSelectedElement.width / 2) * zoom))
    : 0;
  const floatingTop = singleSelectedElement
    ? Math.max(12, Math.min(containerSize.height - 120, pan.y + singleSelectedElement.y * zoom - 44))
    : 0;

  return (
    <div
      ref={containerRef}
      id="atelier-canvas-container"
      className={`relative w-full h-full overflow-hidden bg-studio-canvasBg touch-none ${
        isSpacePressed || isPanningWithMouse ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {/* Background Canvas Grid Pattern */}
      {showGrid && (
        <div
          className="absolute inset-0 pointer-events-none opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle, #E5C49F 1px, transparent 1px)`,
            backgroundSize: `${gridSize * zoom}px ${gridSize * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />
      )}

      {/* Main Konva Stage */}
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        x={pan.x}
        y={pan.y}
        scaleX={zoom}
        scaleY={zoom}
        onClick={handleStageClick}
        onTap={handleStageClick}
      >
        {/* Layer 1: Canvas Paper & Background */}
        <Layer>
          <CanvasBackground canvas={document.canvas} />
        </Layer>

        {/* Layer 2: Graphic Elements */}
        <Layer>
          {sortedElements.map((element) => {
            if (!element.visible) return null;
            const isSelected = selectedIds.includes(element.id);

            if (element.type === 'image') {
              return (
                <ImageElementNode
                  key={element.id}
                  element={element as ImageElement}
                  isSelected={isSelected}
                  onSelect={(e) => toggleSelectElement(element.id, e.evt.shiftKey)}
                  onChange={(updates) => updateElement(element.id, updates)}
                  onDragMove={(e) => handleElementDragMove(element.id, e)}
                  onDragEnd={handleElementDragEnd}
                  onDoubleClick={() => setEditingCropId(element.id)}
                />
              );
            }

            if (element.type === 'text') {
              return (
                <TextElementNode
                  key={element.id}
                  element={element as TextElement}
                  isSelected={isSelected}
                  onSelect={(e) => toggleSelectElement(element.id, e.evt.shiftKey)}
                  onChange={(updates) => updateElement(element.id, updates)}
                  onDragMove={(e) => handleElementDragMove(element.id, e)}
                  onDragEnd={handleElementDragEnd}
                />
              );
            }

            if (element.type === 'shape') {
              return (
                <ShapeElementNode
                  key={element.id}
                  element={element as ShapeElement}
                  isSelected={isSelected}
                  onSelect={(e) => toggleSelectElement(element.id, e.evt.shiftKey)}
                  onChange={(updates) => updateElement(element.id, updates)}
                  onDragMove={(e) => handleElementDragMove(element.id, e)}
                  onDragEnd={handleElementDragEnd}
                />
              );
            }

            if (element.type === 'sticker') {
              return (
                <StickerElementNode
                  key={element.id}
                  element={element as StickerElement}
                  isSelected={isSelected}
                  onSelect={(e) => toggleSelectElement(element.id, e.evt.shiftKey)}
                  onChange={(updates) => updateElement(element.id, updates)}
                  onDragMove={(e) => handleElementDragMove(element.id, e)}
                  onDragEnd={handleElementDragEnd}
                />
              );
            }

            return null;
          })}

          {/* Alignment Snap Guides */}
          <AlignmentGuides
            guides={guides}
            canvasWidth={document.canvas.width}
            canvasHeight={document.canvas.height}
          />

          {/* Transformer Controller */}
          <TransformController selectedIds={selectedIds} stageRef={stageRef} />
        </Layer>
      </Stage>

      {/* Floating Quick Action Bar for Selected Image */}
      {isSingleImageSelected && !editingCropId && (
        <div
          ref={quickBarRef}
          className="absolute z-30 flex items-center gap-1.5 bg-studio-card border border-studio-border shadow-2xl px-2.5 sm:px-3 py-1.5 rounded-xl text-xs text-studio-text transition-all pointer-events-auto select-none whitespace-nowrap"
          style={{
            left: floatingLeft,
            top: floatingTop,
            transform: 'translateX(-50%)',
          }}
        >
          <button
            id="quick-stylize-action-btn"
            onClick={() => openAiStylizeModal(singleSelectedElement.src, singleSelectedElement.id)}
            className="flex items-center gap-1 text-studio-accent hover:text-studio-text px-2 py-1 rounded-lg hover:bg-studio-hover font-semibold transition-colors text-xs cursor-pointer"
            title="使用 AI 风格化重构当前相片"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>风格化</span>
          </button>
          <div className="h-3 w-[1px] bg-studio-border" />
          <button
            id="quick-crop-action-btn"
            onClick={() => setEditingCropId(singleSelectedElement.id)}
            className="flex items-center gap-1 text-studio-accent hover:text-studio-text px-2 py-1 rounded-lg hover:bg-studio-hover font-semibold transition-colors text-xs cursor-pointer"
            title="进入框内裁切与位置微调 (也可双击图片)"
          >
            <Crop className="w-3.5 h-3.5" />
            <span>裁切</span>
          </button>
          <div className="h-3 w-[1px] bg-studio-border" />
          <button
            id="quick-replace-action-btn"
            onClick={() => openReplacePhotoModal(singleSelectedElement.id)}
            className="flex items-center gap-1 text-studio-muted hover:text-studio-text px-2 py-1 rounded-lg hover:bg-studio-hover transition-colors text-xs cursor-pointer"
            title="从素材库挑选或上传新图片替换"
          >
            <ImagePlus className="w-3.5 h-3.5 text-studio-accent" />
            <span>替换</span>
          </button>
          <div className="h-3 w-[1px] bg-studio-border" />
          <button
            onClick={() => deleteElements([singleSelectedElement.id])}
            className="p-1.5 text-red-600 hover:text-red-600 rounded-lg hover:bg-red-500/15 transition-colors cursor-pointer"
            title="删除图片"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Canvas Controls Widget on Mobile & Touch Screens */}
      <div className="md:hidden absolute bottom-18 right-3 z-30 flex flex-col items-center gap-1.5 bg-studio-card border border-studio-border p-1 rounded-xl shadow-2xl">
        <button
          onClick={() => setZoom((z) => Math.min(4.0, z + 0.08))}
          className="p-2 rounded-lg text-studio-muted hover:text-studio-text hover:bg-studio-hover cursor-pointer active:scale-95 transition-all"
          title="放大"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitCenter}
          className="px-1.5 py-1 rounded-lg text-[10px] font-mono text-studio-accent hover:bg-studio-hover cursor-pointer font-bold"
          title="居中适应"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(0.1, z - 0.08))}
          className="p-2 rounded-lg text-studio-muted hover:text-studio-text hover:bg-studio-hover cursor-pointer active:scale-95 transition-all"
          title="缩小"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-5 h-[1px] bg-studio-border/80 my-0.5" />
        <button
          onClick={() => setAutoLayoutModalOpen(true)}
          className="p-2 rounded-xl text-white hover:bg-studio-accent/20 cursor-pointer active:scale-95 transition-all"
          title="智能一键排版"
        >
          <Wand2 className="w-4 h-4" />
        </button>
      </div>

      {/* Hidden File Input for Replace Photo */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleReplacePhoto}
      />

      {/* Non-destructive interactive frame crop modal layer */}
      <InteractiveCropLayer />
    </div>
  );
};
