import React from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { Sparkles, ArrowRight, ShieldCheck, Layers, Wand2, Printer, Image as ImageIcon } from "lucide-react";
import { AI_STYLES } from "../../lib/ai-styles";

export const ZineHome: React.FC = () => {
  const setZineTab = useEditorStore((s) => s.setZineTab);
  const setSelectedStyleId = useEditorStore((s) => s.setSelectedAiStyleId);
  const setIsDrawerOpen = useEditorStore((s) => s.setIsZineDrawerOpen);

  const handleStartStyle = (styleId: string) => {
    setSelectedStyleId(styleId);
    setIsDrawerOpen(true);
    setZineTab("create");
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-8 md:p-12 bg-[#F6F4EF] text-[#222] select-none">
      <div className="max-w-5xl mx-auto space-y-10 pb-16">
        
        {/* Brand Hero Section */}
        <div className="space-y-4 pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563EB]/10 text-[#2563EB] text-xs font-mono border border-[#2563EB]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>拾景 zine • 视觉重构艺术工坊</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#18181B] leading-tight">
            从同一张普通照片出发，<br />
            进入七种不同的视觉表达。
          </h1>

          <p className="text-sm sm:text-base text-[#666] max-w-2xl leading-relaxed">
            拾景 zine 将真实摄影作为事实锚点，融合慢门拖影、实景拼贴、影像蒸馏、电影大片排版与东方古版画，打造具有当代高定艺术感的视觉成片。
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={() => setZineTab("create")}
              className="px-6 py-3 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              <span>立即开始创作</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Value Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-5 rounded-2xl bg-white border border-[#E5E0D6] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wand2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#18181B]">极简直观的创作流</h3>
            <p className="text-xs text-[#787369] leading-relaxed">
              只需挑选风格、放入照片并微调氛围，一键完成 AI 艺术重构，无需繁琐拼图排版操作。
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E0D6] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#18181B]">艺术微喷冲印质感</h3>
            <p className="text-xs text-[#787369] leading-relaxed">
              独家微喷显影出片动画与三维原图对比（画框大图、左右并排、滑动卷帘），质感跃然纸上。
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E5E0D6] shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#18181B]">私有沙盒与历史存档</h3>
            <p className="text-xs text-[#787369] leading-relaxed">
              所有上传照片与生成成片独立保存在您的专属空间，支持随时回顾与高清无损下载。
            </p>
          </div>
        </div>

        {/* Featured Styles Showcase */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-[#18181B]">精选艺术风格</h2>
            <button
              onClick={() => setZineTab("create")}
              className="text-xs font-mono text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>查看全部 7 款风格</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {AI_STYLES.slice(0, 4).map((st) => (
              <div
                key={st.id}
                onClick={() => handleStartStyle(st.id)}
                className="group rounded-2xl overflow-hidden bg-white border border-[#E5E0D6] cursor-pointer hover:border-[#2563EB] transition-all p-2 shadow-xs"
              >
                <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-[#F1EFEA] relative">
                  <div
                    dangerouslySetInnerHTML={{ __html: st.previewSvg || "" }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-2 pt-2.5">
                  <h4 className="text-xs font-semibold text-[#18181B] truncate">{st.name}</h4>
                  <p className="text-[10px] text-[#888] font-mono truncate">{st.badge || "艺术首选"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
