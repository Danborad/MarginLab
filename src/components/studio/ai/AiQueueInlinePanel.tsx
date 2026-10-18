import React, { useState } from "react";
import { useEditorStore } from "../../../store/useEditorStore";
import {
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  X,
  RotateCcw,
  Eye,
  Layers,
  FolderPlus,
  Trash2,
  ListPlus,
  Clock,
  CheckCircle2,
  FolderDown,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

/** 生成记录默认只渲染最近 10 次，展开时每次再追加 10 次 */
const HISTORY_PAGE_SIZE = 10;

interface AiQueueInlinePanelProps {
  activeStyleId?: string;
  onOpenMediaPicker: () => void;
  onOpenLightbox: (resultImg: string, sourceImg: string, styleName: string) => void;
  onSaveToAssets: (resultImg: string, styleName?: string) => void;
  onApplyToCanvas: (resultImg: string) => void;
  onSelectStyle?: (styleId: string) => void;
  onLoadToWorkbench?: (task: {
    styleId: string;
    sourceImage?: string;
    resultImage?: string;
    resultUrl?: string;
    aspectRatio?: string;
    mood?: string;
    specifiedText?: string;
    includeText?: boolean;
    styleName?: string;
  }) => void;
}

export const AiQueueInlinePanel: React.FC<AiQueueInlinePanelProps> = ({
  activeStyleId,
  onOpenMediaPicker,
  onOpenLightbox,
  onSaveToAssets,
  onApplyToCanvas,
  onSelectStyle,
  onLoadToWorkbench,
}) => {
  const [activeTab, setActiveTab] = useState<"queue" | "history">("queue");
  const aiQueue = useEditorStore((s) => s.aiQueue);
  const isQueueRunning = useEditorStore((s) => s.isQueueRunning);
  const retryQueueTask = useEditorStore((s) => s.retryQueueTask);
  const removeQueueTask = useEditorStore((s) => s.removeQueueTask);
  const clearCompletedQueue = useEditorStore((s) => s.clearCompletedQueue);
  const aiHistory = useEditorStore((s) => s.aiHistory);
  const deleteAiHistoryItem = useEditorStore((s) => s.deleteAiHistoryItem);
  // 生成记录折叠：默认只渲染最近 10 次，手动展开时每次再追加 10 次
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(HISTORY_PAGE_SIZE);

  const visibleHistory = aiHistory.slice(0, visibleHistoryCount);
  const hiddenHistoryCount = Math.max(0, aiHistory.length - visibleHistory.length);

  const runningTask = aiQueue.find((t) => t.status === "running");
  const pendingTasks = aiQueue.filter((t) => t.status === "pending");
  const successTasks = aiQueue.filter((t) => t.status === "success");
  const errorTasks = aiQueue.filter((t) => t.status === "error");

  const successCount = successTasks.length;
  const errorCount = errorTasks.length;
  const totalQueueCount = aiQueue.length;
  const historyCount = aiHistory.length;

  return (
    <div className="space-y-2.5 pt-2.5 border-t border-studio-border/70">
      {/* 1. Header & Dual Mode Segmented Controls */}
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1 bg-studio-panel p-0.5 rounded-xl border border-studio-border/70">
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "queue"
                ? "bg-[#2563EB] text-white shadow-2xs"
                : "text-studio-muted hover:text-studio-text"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>排队队列</span>
            {totalQueueCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeTab === "queue" ? "bg-white/25 text-gray-900" : "bg-studio-border text-studio-muted"
                }`}
              >
                {totalQueueCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "history"
                ? "bg-[#2563EB] text-white shadow-2xs"
                : "text-studio-muted hover:text-studio-text"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>生成记录</span>
            {historyCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  activeTab === "history" ? "bg-white/25 text-gray-900" : "bg-studio-border text-studio-muted"
                }`}
              >
                {historyCount}
              </span>
            )}
          </button>
        </div>

        {/* Action buttons */}
        {activeTab === "queue" ? (
          <div className="flex items-center gap-1 shrink-0">
            {successCount > 0 && (
              <button
                type="button"
                onClick={clearCompletedQueue}
                className="text-[10px] text-studio-muted hover:text-studio-text flex items-center gap-1 px-1.5 py-0.5 rounded-lg hover:bg-studio-panel transition-colors cursor-pointer border border-transparent hover:border-studio-border"
                title="清除队列中已完成任务（仍在生成记录中永久保留）"
              >
                <Trash2 className="w-3 h-3" />
                <span>清空完成</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenMediaPicker}
              className="text-[10px] font-semibold text-[#2563EB] hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#2563EB]/10 hover:bg-[#2563EB]/15 border border-[#2563EB]/25 transition-colors cursor-pointer"
              title="从素材库挑选多张照片连续排队生成"
            >
              <ListPlus className="w-3 h-3" />
              <span>+ 批量排队</span>
            </button>
          </div>
        ) : (
          <div className="text-[10px] font-mono text-studio-muted">
            已存 {historyCount} 件作品
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* TAB 1: GENERATION QUEUE (ALL CURRENT IN-PROGRESS / FINISHED) */}
      {/* ============================================================ */}
      {activeTab === "queue" && (
        <div className="space-y-2">
          {/* Status summary pill */}
          <div className="flex items-center justify-between text-[11px] font-sans px-1">
            <span className="text-studio-muted flex items-center gap-1">
              {isQueueRunning ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                  <span className="font-medium text-studio-text">
                    正在执行: {runningTask?.styleName || "AI风格化"}
                  </span>
                </>
              ) : errorCount > 0 ? (
                <span className="text-red-500 font-medium">{errorCount} 项生成异常</span>
              ) : totalQueueCount > 0 ? (
                <span className="text-emerald-500 font-medium">队列已就绪 · 全部完成</span>
              ) : (
                <span>生成队列空闲，放入照片后点击开始即可生成</span>
              )}
            </span>

            {totalQueueCount > 0 && (
              <span className="font-mono text-[10px] text-studio-muted">
                已成片 {successCount} / 总计 {totalQueueCount}
              </span>
            )}
          </div>

          {/* Task List (Unified Single List - No duplicates) */}
          {totalQueueCount > 0 ? (
            <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar pr-0.5">
              {aiQueue.map((task) => {
                const isRunning = task.status === "running";
                const isSuccess = task.status === "success";
                const isError = task.status === "error";
                const isPending = task.status === "pending";

                // If task is running, render rich prominent progress card directly in list
                if (isRunning) {
                  return (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/35 shadow-xs space-y-2 animate-fadeIn ring-1 ring-[#2563EB]/20"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* Left: Thumbnail & Meta & Stage */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8.5 h-8.5 rounded-lg overflow-hidden bg-black/40 border border-[#2563EB]/40 shrink-0 relative">
                            <img
                              src={task.sourceImage}
                              alt={task.styleName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-blue-950/20 flex items-center justify-center">
                              <Loader2 className="w-3 h-3 animate-spin text-gray-900" />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-studio-text truncate">
                                {task.styleName}
                              </span>
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#2563EB]/20 text-[#2563EB] dark:text-blue-300 font-semibold shrink-0">
                                {task.aspectRatio || "auto"}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#2563EB] dark:text-blue-400 font-medium truncate mt-0.5">
                              {task.stageText || "正在分析素材结构与意境特征..."}
                            </p>
                          </div>
                        </div>

                        {/* Right: Progress % and Action */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#2563EB] dark:text-blue-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{task.progress}%</span>
                          </div>

                          {onSelectStyle && (
                            <button
                              type="button"
                              onClick={() => onSelectStyle(task.styleId)}
                              className="px-2 py-0.5 rounded-md bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/35 text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 cursor-pointer transition-colors"
                              title="查看该风格工作台与生成进度"
                            >
                              <span>{activeStyleId && task.styleId !== activeStyleId ? "切到该风格" : "查看"}</span>
                              {activeStyleId && task.styleId !== activeStyleId && <ArrowRight className="w-2.5 h-2.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Smooth Animated Progress Bar */}
                      <div className="w-full bg-studio-panel/80 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 h-full rounded-full transition-all duration-300 shadow-xs"
                          style={{ width: `${Math.max(12, task.progress)}%` }}
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={task.id}
                    className={`p-2 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      isRunning
                        ? "bg-[#2563EB]/5 border-[#2563EB]/30 ring-1 ring-[#2563EB]/15"
                        : isSuccess
                        ? "bg-studio-panel/70 border-studio-border hover:border-studio-border/90"
                        : isError
                        ? "bg-red-500/10 border-red-500/30"
                        : "bg-studio-panel/40 border-studio-border/60"
                    }`}
                  >
                    {/* Left: Thumbnail & Meta */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-md overflow-hidden bg-black/30 border border-studio-border/70 shrink-0 flex items-center justify-center relative">
                        <img
                          src={isSuccess && task.resultImage ? task.resultImage : task.sourceImage}
                          alt={task.styleName}
                          className="w-full h-full object-cover"
                        />
                        {isSuccess && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-tl-sm" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-studio-text truncate">
                            {task.styleName}
                          </span>
                          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-studio-card text-studio-muted border border-studio-border shrink-0">
                            {task.aspectRatio || "auto"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-[9px] text-studio-muted truncate mt-0.2">
                          {isRunning ? (
                            <span className="text-blue-500 font-medium flex items-center gap-1">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" /> 处理中 {task.progress}%
                            </span>
                          ) : isSuccess ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> 成片已就绪
                            </span>
                          ) : isError ? (
                            <span className="text-red-500 dark:text-red-400 font-medium flex items-center gap-1">
                              <AlertCircle className="w-2.5 h-2.5" /> 生成失败: {task.errorMessage || "超时"}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-studio-muted">
                              <Clock className="w-2.5 h-2.5" /> 排队等待处理
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isSuccess && task.resultImage && (
                        <>
                          {onLoadToWorkbench && (
                            <button
                              type="button"
                              onClick={() =>
                                onLoadToWorkbench({
                                  styleId: task.styleId,
                                  sourceImage: task.sourceImage,
                                  resultImage: task.resultImage,
                                  aspectRatio: task.aspectRatio,
                                  mood: task.mood,
                                  specifiedText: task.specifiedText,
                                  styleName: task.styleName,
                                })
                              }
                              className="px-2 py-0.5 rounded-md bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/35 text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
                              title="在中央工作台打开此风格并查看对比"
                            >
                              <span>在工作台打开</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              onOpenLightbox(task.resultImage!, task.sourceImage, task.styleName)
                            }
                            className="p-1 rounded-md bg-studio-card hover:bg-studio-hover text-studio-muted hover:text-amber-500 border border-studio-border transition-colors cursor-pointer"
                            title="放大查看成片与对比"
                          >
                            <Eye className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onSaveToAssets(task.resultImage!, task.styleName)}
                            className="p-1 rounded-md bg-studio-card hover:bg-studio-hover text-studio-muted hover:text-emerald-500 border border-studio-border transition-colors cursor-pointer"
                            title="保存到素材库"
                          >
                            <FolderPlus className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onApplyToCanvas(task.resultImage!)}
                            className="p-1 rounded-md bg-studio-card hover:bg-studio-hover text-studio-muted hover:text-blue-500 border border-studio-border transition-colors cursor-pointer"
                            title="插入当前拼图画布"
                          >
                            <Layers className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => removeQueueTask(task.id)}
                            className="p-1 rounded-md hover:bg-studio-hover text-studio-muted hover:text-studio-text transition-colors cursor-pointer"
                            title="从队列视图中移除"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      )}



                      {isError && (
                        <>
                          <button
                            type="button"
                            onClick={() => retryQueueTask(task.id)}
                            className="px-1.5 py-0.5 rounded-md bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-600 dark:text-red-300 text-[9px] font-semibold flex items-center gap-1 cursor-pointer"
                            title="重新重试该任务"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>重试</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeQueueTask(task.id)}
                            className="p-1 rounded-md hover:bg-studio-hover text-studio-muted hover:text-studio-text cursor-pointer"
                            title="移除"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      )}

                      {isPending && (
                        <button
                          type="button"
                          onClick={() => removeQueueTask(task.id)}
                          className="p-1 rounded-md hover:bg-studio-hover text-studio-muted hover:text-studio-text cursor-pointer"
                          title="取消该排队任务"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty Queue Guidance */
            <div className="p-2.5 rounded-xl bg-studio-panel/60 border border-dashed border-studio-border/90 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-studio-muted">
                <Layers className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="text-xs font-bold text-studio-text">生成队列空闲</span>
              </div>
              <p className="text-[11px] text-studio-muted leading-tight font-sans px-1">
                点击下方按钮即可重构当前照片；如需处理多张照片，可点击「批量排队」连续生成。
              </p>
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={onOpenMediaPicker}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-studio-card hover:bg-studio-hover border border-studio-border text-[11px] text-studio-text font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  <FolderDown className="w-3 h-3 text-[#2563EB]" />
                  <span>从素材库批量选图加入队列</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: AI HISTORY GALLERY (SAVED ON SERVER, NEVER LOST)       */}
      {/* ============================================================ */}
      {activeTab === "history" && (
        <div className="space-y-2">
          {historyCount > 0 ? (
            <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar pr-0.5">
              {visibleHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-xl bg-studio-panel/70 border border-studio-border hover:border-studio-border/90 transition-all flex items-center justify-between gap-2"
                >
                  {/* Left: Thumbnail & Details */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-md overflow-hidden bg-black/30 border border-studio-border/80 shrink-0 relative">
                      <img
                        src={item.resultUrl || item.sourceImage}
                        alt={item.styleName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-studio-text truncate">
                          {item.styleName}
                        </span>
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-studio-card text-studio-muted border border-studio-border shrink-0">
                          {item.aspectRatio || "auto"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[9px] text-studio-muted truncate mt-0.5">
                        <span className="font-mono">
                          {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "已生成"}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-500 font-medium">已入库</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {onLoadToWorkbench && item.resultUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          onLoadToWorkbench({
                            styleId: item.styleId,
                            sourceImage: item.sourceImage,
                            resultUrl: item.resultUrl,
                            aspectRatio: item.aspectRatio,
                            mood: item.customNotes,
                            styleName: item.styleName,
                          })
                        }
                        className="px-2 py-0.5 rounded-md bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/35 text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 cursor-pointer transition-colors"
                        title="在工作台载入此成片并与原图对比"
                      >
                        <span>在工作台打开</span>
                      </button>
                    )}

                    {item.resultUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          onOpenLightbox(item.resultUrl!, item.sourceImage || "", item.styleName)
                        }
                        className="p-1 rounded-md bg-studio-card hover:bg-studio-hover text-studio-muted hover:text-amber-500 border border-studio-border transition-colors cursor-pointer"
                        title="放大查看对比"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                    )}

                    {item.resultUrl && (
                      <button
                        type="button"
                        onClick={() => onSaveToAssets(item.resultUrl!, item.styleName)}
                        className="p-1 rounded-md bg-studio-card hover:bg-studio-hover text-studio-muted hover:text-emerald-500 border border-studio-border transition-colors cursor-pointer"
                        title="存入个人素材库"
                      >
                        <FolderPlus className="w-3 h-3" />
                      </button>
                    )}

                    {item.resultUrl && (
                      <button
                        type="button"
                        onClick={() => onApplyToCanvas(item.resultUrl!)}
                        className="p-1 rounded-md bg-studio-card hover:bg-studio-hover text-studio-muted hover:text-blue-500 border border-studio-border transition-colors cursor-pointer"
                        title="插入当前拼图画布"
                      >
                        <Layers className="w-3 h-3" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteAiHistoryItem(item.id)}
                      className="p-1 rounded-md hover:bg-studio-hover text-studio-muted hover:text-red-500 transition-colors cursor-pointer"
                      title="删除此生成记录"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {(hiddenHistoryCount > 0 ||
                visibleHistoryCount > HISTORY_PAGE_SIZE) && (
                <div className="pt-0.5 space-y-1">
                  {hiddenHistoryCount > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleHistoryCount((count) => count + HISTORY_PAGE_SIZE)
                      }
                      className="w-full py-1.5 rounded-lg bg-studio-panel/70 hover:bg-studio-hover border border-studio-border text-[11px] font-semibold text-studio-text flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title={`再加载 ${Math.min(
                        HISTORY_PAGE_SIZE,
                        hiddenHistoryCount
                      )} 次更早的生成记录`}
                    >
                      <ChevronDown className="w-3 h-3" />
                      <span>展开更多（还剩 {hiddenHistoryCount} 次）</span>
                    </button>
                  )}
                  {visibleHistoryCount > HISTORY_PAGE_SIZE && (
                    <button
                      type="button"
                      onClick={() => setVisibleHistoryCount(HISTORY_PAGE_SIZE)}
                      className="w-full py-1 rounded-lg text-[10px] font-semibold text-studio-muted hover:text-studio-text hover:bg-studio-hover flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="折叠回最近 10 次"
                    >
                      <ChevronUp className="w-3 h-3" />
                      <span>收起，只看最近 10 次</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-studio-panel/60 border border-dashed border-studio-border/90 text-center space-y-1">
              <Clock className="w-4 h-4 text-studio-muted mx-auto" />
              <div className="text-xs font-semibold text-studio-text">暂无历史生成记录</div>
              <p className="text-[11px] text-studio-muted">
                完成风格化重构后，历史作品将永久保存在此，随时可调出对比与下载。
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
