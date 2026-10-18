import React, { useEffect } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { Clock, Download, Trash2, Sparkles, Image as ImageIcon, ArrowRight } from "lucide-react";

export const ZineHistory: React.FC = () => {
  const aiHistory = useEditorStore((s) => s.aiHistory);
  const fetchAiHistory = useEditorStore((s) => s.fetchAiHistory);
  const deleteAiHistoryItem = useEditorStore((s) => s.deleteAiHistoryItem);
  const setLatestResult = useEditorStore((s) => s.setLatestAiGeneratedImage);
  const setSourceImage = useEditorStore((s) => s.setAiSourceImage);
  const setZineTab = useEditorStore((s) => s.setZineTab);

  useEffect(() => {
    fetchAiHistory();
  }, [fetchAiHistory]);

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#F6F4EF] text-[#222] select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E0D6]">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-[#18181B]">
              生成记录与作品库
            </h1>
            <p className="text-xs sm:text-sm text-[#736E65] mt-1 font-sans">
              您创作的所有艺术风格化海报均已安全保存在本地与私有云端。
            </p>
          </div>

          <button
            onClick={() => setZineTab("create")}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>创作新作品</span>
          </button>
        </div>

        {/* Empty State */}
        {aiHistory.length === 0 ? (
          <div className="py-20 text-center space-y-3 bg-white/70 rounded-3xl border border-[#E5E0D6] p-8">
            <div className="w-14 h-14 rounded-2xl bg-[#EDE9E1] text-[#7A756D] flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-[#18181B]">暂无生成记录</h3>
            <p className="text-xs text-[#736E65] max-w-sm mx-auto">
              挑选喜欢的艺术风格，上传一张照片，开启您的第一张拾景zine创作吧。
            </p>
            <button
              onClick={() => setZineTab("create")}
              className="mt-2 px-4 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] cursor-pointer"
            >
              立即前往开始创作 →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 pb-12">
            {aiHistory.map((item) => {
              const imgUrl = item.resultUrl || item.resultBase64;
              return (
                <div
                  key={item.id}
                  className="group relative rounded-2xl overflow-hidden bg-white border border-[#E5E0D6] shadow-xs hover:shadow-md transition-all flex flex-col"
                >
                  <div className="relative aspect-[3/4] bg-black overflow-hidden">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={item.styleName || "Artwork"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-600">
                        <ImageIcon className="w-8 h-8" />
                      </div>
                    )}

                    {/* Overlay Action Buttons on Hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {imgUrl && (
                        <>
                          <button
                            onClick={() => {
                              if (imgUrl) setLatestResult(imgUrl);
                              if (item.sourceImage) setSourceImage(item.sourceImage);
                            }}
                            className="p-2 rounded-xl bg-white text-zinc-900 text-xs font-medium shadow-md hover:bg-zinc-100 cursor-pointer"
                            title="对比查看"
                          >
                            对比查看
                          </button>
                          <a
                            href={imgUrl}
                            download={`zine_${item.styleId || "art"}_${Date.now()}.png`}
                            className="p-2 rounded-xl bg-[#2563EB] text-white text-xs font-medium shadow-md hover:bg-[#1D4ED8] cursor-pointer"
                            title="下载成片"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </>
                      )}
                      <button
                        onClick={() => deleteAiHistoryItem(item.id)}
                        className="p-2 rounded-xl bg-red-600 text-white text-xs font-medium shadow-md hover:bg-red-700 cursor-pointer"
                        title="删除记录"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-white flex items-center justify-between border-t border-[#EAE6DD]">
                    <div className="min-w-0 flex-1 mr-2">
                      <h4 className="text-xs font-semibold text-[#18181B] truncate">
                        {item.styleName || "AI 风格化作品"}
                      </h4>
                      <p className="text-[10px] text-[#7A756D] font-mono mt-0.5 truncate">
                        {new Date(item.createdAt).toLocaleString("zh-CN", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F0EDE6] text-[#666]">
                      {item.aspectRatio || "auto"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
