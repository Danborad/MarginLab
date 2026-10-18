import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Group, Image as KonvaImage, Rect } from 'react-konva';
import Konva from 'konva';
import { ImageElement } from '../../types/document';

interface ImageElementNodeProps {
  element: ImageElement;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<ImageElement>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDoubleClick?: () => void;
}

export const ImageElementNode: React.FC<ImageElementNodeProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  onDragMove,
  onDragEnd,
  onDoubleClick,
}) => {
  const imageRef = useRef<Konva.Image>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [hasError, setHasError] = useState(false);

  // Load image
  useEffect(() => {
    let isMounted = true;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.src = element.src;

    img.onload = () => {
      if (isMounted) {
        setImageObj(img);
        setHasError(false);
      }
    };
    img.onerror = () => {
      if (isMounted) {
        setHasError(true);
      }
    };

    return () => {
      isMounted = false;
    };
  }, [element.src]);

  // Calculate crop rectangle with perfect aspect ratio preservation
  const cropConfig = useMemo(() => {
    if (!imageObj) return undefined;
    const nw = imageObj.naturalWidth || element.originalWidth || element.width;
    const nh = imageObj.naturalHeight || element.originalHeight || element.height;
    if (nw <= 0 || nh <= 0) return undefined;

    if (element.crop) {
      const sx = Math.max(0, Math.min(nw - 1, element.crop.x));
      const sy = Math.max(0, Math.min(nh - 1, element.crop.y));
      const maxW = nw - sx;
      const maxH = nh - sy;
      const sw = Math.max(1, Math.min(maxW, element.crop.width));
      const sh = Math.max(1, Math.min(maxH, element.crop.height));
      return { x: sx, y: sy, width: sw, height: sh };
    }

    if (element.fit === 'contain') {
      return undefined;
    }

    // Default 'cover' calculation
    const aspectContainer = element.width / element.height;
    const aspectImage = nw / nh;

    let cropWidth = nw;
    let cropHeight = nh;
    let cropX = 0;
    let cropY = 0;

    if (aspectContainer > aspectImage) {
      cropHeight = nw / aspectContainer;
      cropY = (nh - cropHeight) / 2;
    } else {
      cropWidth = nh * aspectContainer;
      cropX = (nw - cropWidth) / 2;
    }

    const safeCropX = Math.max(0, Math.min(nw - 1, cropX));
    const safeCropY = Math.max(0, Math.min(nh - 1, cropY));
    const safeCropW = Math.max(1, Math.min(nw - safeCropX, cropWidth));
    const safeCropH = Math.max(1, Math.min(nh - safeCropY, cropHeight));

    return {
      x: safeCropX,
      y: safeCropY,
      width: safeCropW,
      height: safeCropH,
    };
  }, [imageObj, element.width, element.height, element.fit, element.crop, element.originalWidth, element.originalHeight]);

  // Apply filters & manage Konva canvas cache
  useEffect(() => {
    if (imageRef.current && imageObj) {
      const node = imageRef.current;
      node.clearCache();

      const filtersList = [];
      if (element.filters?.grayscale) filtersList.push(Konva.Filters.Grayscale);
      if (element.filters?.sepia) filtersList.push(Konva.Filters.Sepia);
      if (element.filters?.brightness) filtersList.push(Konva.Filters.Brighten);
      if (element.filters?.contrast) filtersList.push(Konva.Filters.Contrast);
      if (element.filters?.blur) filtersList.push(Konva.Filters.Blur);
      if (element.filters?.invert) filtersList.push(Konva.Filters.Invert);

      if (filtersList.length > 0) {
        node.filters(filtersList);
        if (element.filters?.brightness) node.brightness(element.filters.brightness);
        if (element.filters?.contrast) node.contrast(element.filters.contrast);
        if (element.filters?.blur) node.blurRadius(element.filters.blur);
        try {
          node.cache();
        } catch (e) {}
      }
      node.getLayer()?.batchDraw();
    }
  }, [imageObj, element.filters, cropConfig]);

  const isFlippedX = !!element.crop?.flipX;
  const isFlippedY = !!element.crop?.flipY;

  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      width={element.width}
      height={element.height}
      rotation={element.rotation}
      opacity={element.opacity}
      draggable={!element.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onDoubleClick}
      onDblTap={onDoubleClick}
      onDragMove={onDragMove}
      onDragEnd={(e) => {
        onChange({
          x: Math.round(e.target.x()),
          y: Math.round(e.target.y()),
        });
        if (onDragEnd) onDragEnd(e);
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        node.scaleX(1);
        node.scaleY(1);

        const newW = Math.max(20, Math.round(node.width() * scaleX));
        const newH = Math.max(20, Math.round(node.height() * scaleY));

        onChange({
          x: Math.round(node.x()),
          y: Math.round(node.y()),
          width: newW,
          height: newH,
          rotation: Math.round(node.rotation()),
        });
      }}
      clipFunc={(ctx) => {
        const r = element.borderRadius || 0;
        const w = element.width;
        const h = element.height;
        if (r <= 0) {
          ctx.rect(0, 0, w, h);
          return;
        }
        const radius = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(radius, 0);
        ctx.lineTo(w - radius, 0);
        ctx.quadraticCurveTo(w, 0, w, radius);
        ctx.lineTo(w, h - radius);
        ctx.quadraticCurveTo(w, h, w - radius, h);
        ctx.lineTo(radius, h);
        ctx.quadraticCurveTo(0, h, 0, h - radius);
        ctx.lineTo(0, radius);
        ctx.quadraticCurveTo(0, 0, radius, 0);
        ctx.closePath();
      }}
    >
      {/* Background card / fallback shadow */}
      <Rect
        x={0}
        y={0}
        width={element.width}
        height={element.height}
        fill="#FAFAFA"
        shadowColor={element.shadowColor || '#000000'}
        shadowBlur={element.shadowBlur || 0}
        shadowOffsetX={element.shadowOffsetX || 0}
        shadowOffsetY={element.shadowOffsetY || 0}
        shadowOpacity={element.shadowOpacity ?? 0.2}
      />

      {/* Render Image with flip & crop */}
      {imageObj && !hasError && (
        <KonvaImage
          ref={imageRef}
          image={imageObj}
          x={isFlippedX ? element.width : 0}
          y={isFlippedY ? element.height : 0}
          scaleX={isFlippedX ? -1 : 1}
          scaleY={isFlippedY ? -1 : 1}
          width={element.width}
          height={element.height}
          crop={cropConfig}
        />
      )}

      {/* Border overlay */}
      {element.borderWidth && element.borderWidth > 0 && (
        <Rect
          x={0}
          y={0}
          width={element.width}
          height={element.height}
          stroke={element.borderColor || '#FFFFFF'}
          strokeWidth={element.borderWidth * 2}
          listening={false}
        />
      )}
    </Group>
  );
};
