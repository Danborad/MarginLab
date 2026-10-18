import React, { useRef } from 'react';
import { Group, Text, Rect } from 'react-konva';
import Konva from 'konva';
import { TextElement } from '../../types/document';

interface TextElementNodeProps {
  element: TextElement;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<TextElement>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDoubleClick?: () => void;
}

export const TextElementNode: React.FC<TextElementNodeProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  onDragMove,
  onDragEnd,
  onDoubleClick,
}) => {
  const textRef = useRef<Konva.Text>(null);

  // Process text transformations
  let displayText = element.text;
  if (element.textTransform === 'uppercase') {
    displayText = displayText.toUpperCase();
  } else if (element.textTransform === 'lowercase') {
    displayText = displayText.toLowerCase();
  }

  // Clean font family string, keeping fallbacks for smooth rendering
  const cleanFont = (element.fontFamily || 'sans-serif').replace(/['"]/g, '');
  
  const isBold =
    typeof element.fontWeight === 'number'
      ? element.fontWeight >= 600
      : parseInt(String(element.fontWeight || 400), 10) >= 600;

  const isItalic = element.fontStyle === 'italic';

  // Valid Konva fontStyle: 'normal', 'bold', 'italic', or 'bold italic'
  const konvaFontStyle = isBold && isItalic ? 'bold italic' : isBold ? 'bold' : isItalic ? 'italic' : 'normal';

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
        node.scaleX(1);
        node.scaleY(1);

        const newW = Math.max(40, Math.round(node.width() * scaleX));

        onChange({
          x: Math.round(node.x()),
          y: Math.round(node.y()),
          width: newW,
          rotation: Math.round(node.rotation()),
        });
      }}
    >
      {/* Background color pill if enabled */}
      {element.backgroundColor && (
        <Rect
          x={-(element.backgroundPadding || 0)}
          y={-(element.backgroundPadding || 0)}
          width={element.width + (element.backgroundPadding || 0) * 2}
          height={element.height + (element.backgroundPadding || 0) * 2}
          fill={element.backgroundColor}
          cornerRadius={element.backgroundRadius || 4}
          listening={false}
        />
      )}

      <Text
        ref={textRef}
        text={displayText}
        fontFamily={cleanFont}
        fontSize={element.fontSize || 24}
        fontStyle={konvaFontStyle}
        letterSpacing={element.letterSpacing || 0}
        lineHeight={element.lineHeight || 1.2}
        align={element.textAlign || 'left'}
        fill={element.color || '#FFFFFF'}
        width={element.width}
        wrap="word"
        stroke={element.strokeColor}
        strokeWidth={element.strokeWidth || 0}
        shadowColor={element.shadowColor || '#000000'}
        shadowBlur={element.shadowBlur || 0}
        shadowOffsetX={element.shadowOffsetX || 0}
        shadowOffsetY={element.shadowOffsetY || 0}
        shadowOpacity={element.shadowOpacity ?? 0.2}
      />
    </Group>
  );
};
