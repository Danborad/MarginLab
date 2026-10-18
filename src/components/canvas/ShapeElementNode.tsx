import React from 'react';
import { Group, Rect, Circle, Line, Path } from 'react-konva';
import Konva from 'konva';
import { ShapeElement } from '../../types/document';

interface ShapeElementNodeProps {
  element: ShapeElement;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<ShapeElement>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export const ShapeElementNode: React.FC<ShapeElementNodeProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  onDragMove,
  onDragEnd,
}) => {
  const { shapeType, width, height, fill, stroke, strokeWidth, strokeDash, borderRadius } = element;

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

        const newW = Math.max(10, Math.round(node.width() * scaleX));
        const newH = Math.max(2, Math.round(node.height() * scaleY));

        onChange({
          x: Math.round(node.x()),
          y: Math.round(node.y()),
          width: newW,
          height: newH,
          rotation: Math.round(node.rotation()),
        });
      }}
    >
      {shapeType === 'rect' && (
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          dash={strokeDash}
          cornerRadius={borderRadius || 0}
          shadowColor={element.shadowColor || '#000000'}
          shadowBlur={element.shadowBlur || 0}
          shadowOffsetX={element.shadowOffsetX || 0}
          shadowOffsetY={element.shadowOffsetY || 0}
        />
      )}

      {shapeType === 'circle' && (
        <Circle
          x={width / 2}
          y={height / 2}
          radius={Math.min(width, height) / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          dash={strokeDash}
          shadowColor={element.shadowColor || '#000000'}
          shadowBlur={element.shadowBlur || 0}
          shadowOffsetX={element.shadowOffsetX || 0}
          shadowOffsetY={element.shadowOffsetY || 0}
        />
      )}

      {shapeType === 'line' && (
        <Line
          points={
            width >= height
              ? [0, height / 2, width, height / 2]
              : [width / 2, 0, width / 2, height]
          }
          stroke={stroke || fill || '#FFFFFF'}
          strokeWidth={strokeWidth || (width >= height ? Math.max(1, height) : Math.max(1, width))}
          dash={strokeDash}
          lineCap="butt"
        />
      )}

      {shapeType === 'pill' && (
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          dash={strokeDash}
          cornerRadius={Math.min(width, height) / 2}
        />
      )}

      {shapeType === 'arch' && (
        <Path
          data={`M 0,${height} L 0,${width / 2} A ${width / 2},${width / 2} 0 0,1 ${width},${width / 2} L ${width},${height} Z`}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          dash={strokeDash}
        />
      )}

      {shapeType === 'frame' && (
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="transparent"
          stroke={stroke || fill}
          strokeWidth={strokeWidth || 2}
          dash={strokeDash}
          cornerRadius={borderRadius || 0}
        />
      )}
    </Group>
  );
};
