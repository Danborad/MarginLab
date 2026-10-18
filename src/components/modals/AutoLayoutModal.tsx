import React from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Wand2, X, Columns, Sparkles, LayoutGrid, Rows3, Columns3 } from 'lucide-react';

export const AutoLayoutModal: React.FC = () => {
  const autoLayoutModalOpen = useEditorStore((s) => s.autoLayoutModalOpen);
  const setAutoLayoutModalOpen = useEditorStore((s) => s.setAutoLayoutModalOpen);
  const applyAutoLayout = useEditorStore((s) => s.applyAutoLayout);

  if (!autoLayoutModalOpen) return null;

  const layoutTypes = [
    {
      id: 'hero-asymmetric' as const,
      name: '非对称主次焦点 (Hero & Grid)',
      desc: '自动挑出一张大画幅视觉焦点，其余图片紧凑排布，兼具视觉冲击力与秩序感',
      icon: Columns,
    },
    {
      id: 'grid' as const,
      name: '整齐秩序画廊 (Rational Grid)',
      desc: '严谨等距网格阵列，根据当前画布宽高比与图片数量自动计算最优行列与裁切',
      icon: LayoutGrid,
    },
    {
      id: 'triptych-column' as const,
      name: '竖向多联分栏 (Column Strips)',
      desc: '纵向等宽并列排版，适合展现对比人像、连贯动作与建筑立面',
      icon: Columns3,
    },
    {
      id: 'film-strip' as const,
      name: '横向时间流底片 (Film Stack)',
      desc: '横向画幅纵向层叠，形成如电影胶卷般的时间流叙事效果',
      icon: Rows3,
    },
    {
      id: 'polaroid-scatter' as const,
      name: '有机宝丽来散落 (Polaroid Scatter)',
      desc: '自带白边相框与微旋角度，错落叠放呈现温暖的手账灵感板效果',
      icon: Sparkles,
    },
  ];

  const handleApply = (
    type: 'grid' | 'hero-asymmetric' | 'polaroid-scatter' | 'triptych-column' | 'film-strip'
  ) => {
    applyAutoLayout(type);
    setAutoLayoutModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-studio-panel border border-studio-border rounded-2xl w-[95vw] max-w-lg overflow-hidden shadow-soft-float">
        <div className="p-4 border-b border-studio-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-studio-accent" />
            <h2 className="text-sm font-semibold uppercase tracking-wider text-studio-text">
              智能一键排版算法
            </h2>
          </div>
          <button
            onClick={() => setAutoLayoutModalOpen(false)}
            className="p-1 rounded-lg text-studio-muted hover:text-studio-text hover:bg-studio-card transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-studio-muted mb-2">
            选择一种算法，将画布上所有图片自动重新组织为具有高级秩序感的排版（自适应当前画布尺寸）：
          </p>

          {layoutTypes.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.id}
                onClick={() => handleApply(t.id)}
                className="p-3.5 rounded-xl border border-studio-border bg-studio-card/50 hover:bg-studio-card hover:border-studio-accent cursor-pointer transition-all flex items-start gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-lg bg-studio-panel border border-studio-border flex items-center justify-center text-studio-muted group-hover:text-studio-accent group-hover:scale-105 transition-all shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-studio-text group-hover:text-studio-accent transition-colors">
                    {t.name}
                  </h3>
                  <p className="text-[11px] text-studio-muted mt-0.5 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
