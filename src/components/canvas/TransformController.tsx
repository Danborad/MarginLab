import React, { useEffect, useRef } from 'react';
import { Transformer } from 'react-konva';
import Konva from 'konva';
import { useEditorStore } from '../../store/useEditorStore';

interface TransformControllerProps {
  selectedIds: string[];
  stageRef: React.RefObject<Konva.Stage | null>;
}

export const TransformController: React.FC<TransformControllerProps> = ({ selectedIds, stageRef }) => {
  const editingCropId = useEditorStore((s) => s.editingCropId);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (!trRef.current || !stageRef.current) return;

    const stage = stageRef.current;
    const transformer = trRef.current;

    if (selectedIds.length === 0 || editingCropId) {
      transformer.nodes([]);
      transformer.getLayer()?.batchDraw();
      return;
    }

    // Find all Konva nodes corresponding to selectedIds
    const nodes: Konva.Node[] = [];
    selectedIds.forEach((id) => {
      const node = stage.findOne('#' + id);
      if (node) {
        nodes.push(node);
      }
    });

    transformer.nodes(nodes);
    transformer.getLayer()?.batchDraw();
  }, [selectedIds, editingCropId, stageRef]);

  if (selectedIds.length === 0 || editingCropId) {
    return null;
  }

  return (
    <Transformer
      ref={trRef}
      boundBoxFunc={(oldBox, newBox) => {
        // Enforce minimum width/height so elements don't collapse to 0
        if (newBox.width < 10 || newBox.height < 10) {
          return oldBox;
        }
        return newBox;
      }}
      rotateAnchorOffset={24}
      rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
      borderStroke="#E5C49F"
      borderStrokeWidth={1.5}
      borderDash={[4, 3]}
      anchorFill="#FAF8F5"
      anchorStroke="#1A1918"
      anchorStrokeWidth={1.5}
      anchorSize={8}
      anchorCornerRadius={2}
      keepRatio={false}
      enabledAnchors={[
        'top-left',
        'top-center',
        'top-right',
        'middle-right',
        'bottom-right',
        'bottom-center',
        'bottom-left',
        'middle-left',
      ]}
    />
  );
};
