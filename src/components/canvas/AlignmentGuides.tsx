import React from 'react';
import { Group, Line } from 'react-konva';
import { AlignmentGuide } from '../../types/document';

interface AlignmentGuidesProps {
  guides: AlignmentGuide[];
  canvasWidth: number;
  canvasHeight: number;
}

export const AlignmentGuides: React.FC<AlignmentGuidesProps> = ({ guides, canvasWidth, canvasHeight }) => {
  if (!guides || guides.length === 0) return null;

  return (
    <Group listening={false}>
      {guides.map((guide, idx) => {
        const points =
          guide.type === 'vertical'
            ? [guide.position, 0, guide.position, canvasHeight]
            : [0, guide.position, canvasWidth, guide.position];

        return (
          <Line
            key={`guide_${idx}_${guide.type}_${guide.position}`}
            points={points}
            stroke="#E5C49F"
            strokeWidth={1}
            dash={[4, 4]}
            opacity={0.85}
          />
        );
      })}
    </Group>
  );
};
