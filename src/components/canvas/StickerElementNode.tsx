import React from 'react';
import { Group, Rect, Text, Line } from 'react-konva';
import Konva from 'konva';
import { StickerElement } from '../../types/document';

interface StickerElementNodeProps {
  element: StickerElement;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<StickerElement>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export const StickerElementNode: React.FC<StickerElementNodeProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  onDragMove,
  onDragEnd,
}) => {
  const { stickerType, width, height, label, color, accentColor } = element;

  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      width={width}
      height={height}
      rotation={element.rotation}
      opacity={element.opacity}
      draggable={!element.locked}
      onClick={onSelect}
      onTap={onSelect}
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

        onChange({
          x: Math.round(node.x()),
          y: Math.round(node.y()),
          width: Math.max(30, Math.round(node.width() * scaleX)),
          height: Math.max(15, Math.round(node.height() * scaleY)),
          rotation: Math.round(node.rotation()),
        });
      }}
    >
      {/* 1. Washi Tape */}
      {stickerType === 'washi-tape' && (
        <Group>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={color || '#E8DEC8'}
            opacity={0.8}
            shadowColor="#000000"
            shadowBlur={6}
            shadowOpacity={0.12}
            shadowOffsetY={2}
          />
          {/* Subtle tape texture line */}
          <Line
            points={[4, height / 2, width - 4, height / 2]}
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth={1}
            dash={[4, 6]}
          />
        </Group>
      )}

      {/* 2. Archival Tag */}
      {stickerType === 'archival-tag' && (
        <Group>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={color || '#1A1918'}
            stroke={accentColor || '#E5C49F'}
            strokeWidth={1}
            cornerRadius={2}
            shadowColor="#000000"
            shadowBlur={10}
            shadowOpacity={0.2}
          />
          <Text
            text={label || 'ARCHIVE № 2026'}
            x={8}
            y={height / 2 - 6}
            width={width - 16}
            align="center"
            fill={accentColor || '#E5C49F'}
            fontFamily="JetBrains Mono, monospace"
            fontSize={Math.max(9, Math.min(13, height * 0.35))}
            letterSpacing={1.5}
          />
        </Group>
      )}

      {/* 3. Vintage Date Stamp */}
      {stickerType === 'date-stamp' && (
        <Group>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            stroke={color || '#B85444'}
            strokeWidth={1.5}
            cornerRadius={4}
            dash={[6, 3]}
          />
          <Text
            text={label || '2026.08 • MARGINLAB'}
            x={6}
            y={height / 2 - 6}
            width={width - 12}
            align="center"
            fill={color || '#B85444'}
            fontFamily="Space Grotesk, sans-serif"
            fontSize={Math.max(10, Math.min(14, height * 0.35))}
            fontStyle="bold"
            letterSpacing={1}
          />
        </Group>
      )}

      {/* 4. Grid Crosshair */}
      {stickerType === 'grid-cross' && (
        <Group>
          <Line points={[width / 2, 0, width / 2, height]} stroke={color || '#8E8E9A'} strokeWidth={1} />
          <Line points={[0, height / 2, width, height / 2]} stroke={color || '#8E8E9A'} strokeWidth={1} />
        </Group>
      )}

      {/* 5. Film Strip Stamp */}
      {stickerType === 'film-strip' && (
        <Group>
          <Rect x={0} y={0} width={width} height={height} fill="#111113" cornerRadius={2} />
          {/* Perforations */}
          {Array.from({ length: Math.floor(width / 24) }).map((_, i) => (
            <React.Fragment key={i}>
              <Rect x={8 + i * 24} y={4} width={10} height={6} fill="#FAF8F5" cornerRadius={1} />
              <Rect x={8 + i * 24} y={height - 10} width={10} height={6} fill="#FAF8F5" cornerRadius={1} />
            </React.Fragment>
          ))}
          <Text
            text={label || 'ISO 400 • 35MM'}
            x={10}
            y={height / 2 - 5}
            width={width - 20}
            align="center"
            fill="#E5C49F"
            fontFamily="JetBrains Mono, monospace"
            fontSize={10}
            letterSpacing={2}
          />
        </Group>
      )}
    </Group>
  );
};
