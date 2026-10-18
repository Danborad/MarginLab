import React, { useState } from "react";
import { useEditorStore } from "../../../store/useEditorStore";
import { GenerationQueueTask } from "../../../types/ai";
import {
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  X,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Trash2,
  Layers,
  Download,
  Eye,
} from "lucide-react";
import { Button } from "../../ui/Button";

interface AiGenerationQueueDrawerProps {
  onOpenLightbox: (resultImg: string, sourceImg: string, styleName: string) => void;
  onApplyToCanvas: (resultImg: string) => void;
}

export const AiGenerationQueueDrawer: React.FC<AiGenerationQueueDrawerProps> = ({
  onOpenLightbox,
  onApplyToCanvas,
}) => {
  const aiQueue = useEditorStore((s) => s.aiQueue);
  const isQueueRunning = useEditorStore((s) => s.isQueueRunning);
  const activeQueueTaskId = useEditorStore((s) => s.activeQueueTaskId);
  const retryQueueTask = useEditorStore((s) => s.retryQueueTask);
  const removeQueueTask = useEditorStore((s) => s.removeQueueTask);
  const clearCompletedQueue = useEditorStore((s) => s.clearCompletedQueue);

  const [isOpen, setIsOpen] = useState(false);

  const runningTask = aiQueue.find((t) => t.status === "running");
  const pendingCount = aiQueue.filter((t) => t.status === "pending").length;
  const runningCount = aiQueue.filter((t) => t.status === "running").length;
  const successCount = aiQueue.filter((t) => t.status === "success").length;
  const errorCount = aiQueue.filter((t) => t.status === "error").length;

  // If no tasks in queue, do not show floating bar unless user has tasks
  if (aiQueue.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {/* Floating Capsule Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2.5 rounded-full border shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-xl cursor-pointer transition-all duration-300 ${
          isQueueRunning
            ? "bg-zinc-900/95 text-blue-300 border-blue-500/50 shadow-blue-500/20 ring-2 ring-blue-500/30 animate-pulse"
            : errorCount > 0
            ? "bg-zinc-900/95 text-amber-300 border-amber-500/40 shadow-xl"
            : "bg-zinc-900/90 text-zinc-100 border-zinc-700/80 hover:border-zinc-500 shadow-xl"
        }`}
      >
        {isQueueRunning ? (
          <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 text-amber-400" />
        )}

        <span>
          {isQueueRunning
            ? `正在生成: ${runningTask?.styleName || "AI 艺术成片"} (${runningTask?.progress || 15}%)`
            : `生成队列 (${aiQueue.length})`}
        </span>

        {pendingCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono">
            {pendingCount} 排队
          </span>
        )}

        {successCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">
            {successCount} 完成
          </span>
        )}

        {errorCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-red-500/20 text-red-300 text-[10px] font-mono">
            {errorCount} 异常
          </span>
        )}

        {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronUp className="w-4 h-4 text-zinc-400" />}
      </button>

      {/* Expanded Queue Drawer Panel */}
      {isOpen && (
        <div className="mt-3 w-80 sm:w-96 bg-zinc-900/95 border border-zinc-700/80 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl flex flex-col max-h-[500px] animate-scaleIn text-zinc-100">
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold tracking-wide">AI 风格化生成队列</h4>
              <span className="text-[10px] font-mono text-zinc-400">
                ({runningCount > 0 ? "并发处理中" : "就绪"})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {successCount > 0 && (
                <button
                  type="button"
                  onClick={clearCompletedQueue}
                  className="px-2 py-1 rounded-lg text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-1 cursor-pointer transition-colors"
                  title="清除所有已完成任务"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>清除完成</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar">
            {aiQueue.map((task) => {
              const isRunning = task.status === "running";
              const isSuccess = task.status === "success";
              const isError = task.status === "error";

              return (
                <div
                  key={task.id}
                  className={`p-2.5 rounded-2xl border transition-all flex flex-col gap-2 ${
                    isRunning
                      ? "bg-blue-950/30 border-blue-500/50 shadow-sm"
                      : isSuccess
                      ? "bg-zinc-950/40 border-zinc-800 hover:border-zinc-700"
                      : isError
                      ? "bg-red-950/20 border-red-500/40"
                      : "bg-zinc-950/30 border-zinc-800/80 opacity-80"
                  }`}
                >
                  {/* Task Card Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Thumbnail (Show result if success, otherwise source) */}
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700 shrink-0 flex items-center justify-center">
                        <img
                          src={isSuccess && task.resultImage ? task.resultImage : task.sourceImage}
                          alt={task.styleName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-xs font-semibold text-zinc-100 truncate">
                            {task.styleName}
                          </h5>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
                            {task.aspectRatio || "auto"}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                          {task.stageText || (isRunning ? "处理中..." : isSuccess ? "生成完成" : "等待处理")}
                        </p>
                      </div>
                    </div>

                    {/* Status Icon or Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isRunning && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-blue-400 font-bold">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{task.progress}%</span>
                        </div>
                      )}

                      {isSuccess && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenLightbox(task.resultImage!, task.sourceImage, task.styleName)
                            }
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
                            title="放大查看成片"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onApplyToCanvas(task.resultImage!)}
                            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
                            title="插入拼图画布"
                          >
                            <Layers className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQueueTask(task.id)}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                            title="移除"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {isError && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => retryQueueTask(task.id)}
                            className="p-1.5 rounded-lg bg-red-900/40 hover:bg-red-800 text-red-300 cursor-pointer flex items-center gap-1 text-[10px]"
                            title="重试任务"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>重试</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQueueTask(task.id)}
                            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      {task.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => removeQueueTask(task.id)}
                          className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                          title="取消排队"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Running Progress Bar */}
                  {isRunning && (
                    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${Math.max(10, task.progress)}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
