import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Shapes, Square, Circle, Minus, Shield, Diamond, Frame } from 'lucide-react';
import { ShapeType } from '../../types/document';

export const ShapesPanel: React.FC = () => {
  const addElement = useEditorStore((s) => s.addElement);
  const canvas = useEditorStore((s) => s.document.canvas);

  const shapes = [
    {
      name: '色块底板 (Rectangle)',
      shapeType: 'rect' as ShapeType,
      width: 400,
      height: 300,
      fill: '#ECE7DE',
      stroke: '#ECE7DE',
      strokeWidth: 0,
      borderRadius: 4,
      icon: Square,
    },
    {
      name: '纯净圆形 (Circle)',
      shapeType: 'circle' as ShapeType,
      width: 300,
      height: 300,
      fill: '#E5C49F',
      stroke: '#E5C49F',
      strokeWidth: 0,
      icon: Circle,
    },
    {
      name: '建筑拱门 (Arch)',
      shapeType: 'arch' as ShapeType,
      width: 280,
      height: 420,
      fill: '#DDD6CC',
      stroke: '#DDD6CC',
      strokeWidth: 0,
      icon: Shield,
    },
    {
      name: '胶囊色块 (Pill)',
      shapeType: 'pill' as ShapeType,
      width: 320,
      height: 120,
      fill: '#B85444',
      stroke: '#B85444',
      strokeWidth: 0,
      icon: Square,
    },
    {
      name: '极简分割线 (Divider)',
      shapeType: 'line' as ShapeType,
      width: 500,
      height: 2,
      fill: '#8E8B82',
      stroke: '#8E8B82',
      strokeWidth: 1,
      icon: Minus,
    },
    {
      name: '线框画框 (Frame)',
      shapeType: 'frame' as ShapeType,
      width: 400,
      height: 500,
      fill: 'transparent',
      stroke: '#E5C49F',
      strokeWidth: 2,
      borderRadius: 4,
      icon: Frame,
    },
  ];

  const handleAddShape = (shape: (typeof shapes)[0]) => {
    addElement({
      type: 'shape',
      name: shape.name,
      x: Math.round((canvas.width - shape.width) / 2),
      y: Math.round((canvas.height - shape.height) / 2),
      width: shape.width,
      height: shape.height,
      rotation: 0,
      opacity: 1,
      shapeType: shape.shapeType,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      borderRadius: shape.borderRadius,
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="pb-2 border-b border-studio-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shapes className="w-4 h-4 text-studio-accent" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-studio-text">
            几何与装饰形状
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {shapes.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              onClick={() => handleAddShape(s)}
              className="p-3 rounded-xl border border-studio-border bg-studio-card/60 hover:bg-studio-card hover:border-studio-accent cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-studio-panel flex items-center justify-center text-studio-muted group-hover:text-studio-accent group-hover:scale-110 transition-all border border-studio-border">
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-studio-text group-hover:text-studio-accent transition-colors">
                {s.name.split(' (')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
