import React from 'react';
import { Rect } from 'react-konva';
import { CanvasSettings } from '../../types/document';

interface CanvasBackgroundProps {
  canvas: CanvasSettings;
}

export const CanvasBackground: React.FC<CanvasBackgroundProps> = ({ canvas }) => {
  const { width, height, backgroundColor } = canvas;

  return (
    <Rect
      name="canvas-background-rect"
      x={0}
      y={0}
      width={width}
      height={height}
      fill={backgroundColor || '#FFFFFF'}
      shadowColor="rgba(0, 0, 0, 0.45)"
      shadowBlur={35}
      shadowOffsetX={0}
      shadowOffsetY={15}
      shadowOpacity={0.25}
      listening={true}
    />
  );
};
