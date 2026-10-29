import React, { useState, useRef, useEffect } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { fileToBase64, imageExtFromUrl } from "../../lib/utils";
import {
  Sparkles,
  ArrowUp,
  Plus,
  Copy,
  Edit3,
  ChevronDown,
  ChevronUp,
  Download,
  FolderHeart,
  SlidersHorizontal,
  Check,
  X,
  Maximize2,
  Loader2,
  Image as ImageIcon,
  RotateCcw,
  Trash2,
  Compass,
  Eye,
} from "lucide-react";
import { CreativeSessionItem } from "../../types/ai";
import { MediaPickerModal } from "../studio/ai/MediaPickerModal";

const RATIO_OPTIONS = [
  { id: "16:9", label: "16:9", desc: "宽屏横画", thumbW: 22, thumbH: 12 },
  { id: "3:4", label: "3:4", desc: "典雅画册", thumbW: 14, thumbH: 19 },
  { id: "4:3", label: "4:3", desc: "标准横屏", thumbW: 19, thumbH: 14 },
  { id: "1:1", label: "1:1", desc: "正方画幅", thumbW: 16, thumbH: 16 },
  { id: "9:16", label: "9:16", desc: "全屏海报", thumbW: 12, thumbH: 22 },
];

const COUNT_OPTIONS = [1, 2, 4];

export const AiCreativeStudioStage: React.FC = () => {
  const systemConfig = useEditorStore((s) => s.systemConfig);
  const fetchSystemConfig = useEditorStore((s) => s.fetchSystemConfig);
  const userAssets = useEditorStore((s) => s.userAssets);
  const costPerImage = Math.max(0, Number(systemConfig?.costPerImage ?? 1));
  const creativeHistory = useEditorStore((s) => s.creativeHistory);
  const creativePromptDraft = useEditorStore((s) => s.creativePromptDraft);
  const creativeAspectRatio = useEditorStore((s) => s.creativeAspectRatio);
  const creativeCount = useEditorStore((s) => s.creativeCount);
  const creativeReferenceImage = useEditorStore((s) => s.creativeReferenceImage);
  const isGenerating = useEditorStore((s) => s.isGeneratingCreative);

  const setCreativePromptDraft = useEditorStore((s) => s.setCreativePromptDraft);
  const setCreativeAspectRatio = useEditorStore((s) => s.setCreativeAspectRatio);
  const setCreativeCount = useEditorStore((s) => s.setCreativeCount);
  const setCreativeReferenceImage = useEditorStore((s) => s.setCreativeReferenceImage);
  const reapplyCreativeSession = useEditorStore((s) => s.reapplyCreativeSession);
  const submitCreativeGeneration = useEditorStore((s) => s.submitCreativeGeneration);
  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
  const setAuthModalOpen = useEditorStore((s) => s.setAuthModalOpen);
  const createNewCreativeSession = useEditorStore((s) => s.createNewCreativeSession);
  const addMediaAssets = useEditorStore((s) => s.addMediaAssets);
  const currentUser = useEditorStore((s) => s.currentUser);

  const [elapsed, setElapsed] = useState(0);
  const [collapsedSessionIds, setCollapsedSessionIds] = useState<Set<string>>(new Set());
  const [isConfigPopoverOpen, setIsConfigPopoverOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const refFileInputRef = useRef<HTMLInputElement>(null);
  const configPopoverRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // 首次进入时拉取全局配置（每张消耗积分等）
  useEffect(() => {
    if (!systemConfig) fetchSystemConfig().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom on mount or new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [creativeHistory.length, isGenerating]);

  // 画幅/张数选择窗口：点击外部自动关闭
  useEffect(() => {
    if (!isConfigPopoverOpen) return;
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (configPopoverRef.current && !configPopoverRef.current.contains(e.target as Node)) {
        setIsConfigPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [isConfigPopoverOpen]);

  // ESC：优先退出大图预览，其次关闭选择窗口
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (lightboxImageUrl) {
        setLightboxImageUrl(null);
      } else if (isConfigPopoverOpen) {
        setIsConfigPopoverOpen(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [lightboxImageUrl, isConfigPopoverOpen]);

  // 真实大模型出图耗时计时（通常 30~60s）
  useEffect(() => {
    if (!isGenerating) {
      setElapsed(0);
      return;
    }
    const timer = setInterval(() => setElapsed((v) => v + 1), 1000);
    return () => clearInterval(timer);
  }, [isGenerating]);

  const toggleCollapse = (id: string) => {
    setCollapsedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyPrompt = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast("已复制提示词到剪贴板");
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      showToast("复制失败，请手动选取复制");
    }
  };

  const handleRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true, "register");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      setCreativeReferenceImage(b64);
      showToast("已添加参考图");
    } catch (err) {
      console.error(err);
    }
    e.target.value = "";
  };

  const handleDownloadImage = (url: string, index: number) => {
    // 服务器出图是 PNG，后缀必须跟着真实编码走，否则相册/米家会判定格式不支持
    const a = document.createElement("a");
    a.href = url;
    a.download = `atelier-creative-${Date.now()}-${index + 1}.${imageExtFromUrl(url)}`;
    a.click();
    showToast(`已开始下载图像 #${index + 1}`);
  };

  const handleSaveToGallery = async (url: string, index: number, prompt: string) => {
    if (!isAuthenticated) {
      setAuthModalOpen(true, "register");
      return;
    }
    try {
      await addMediaAssets([
        {
          name: `AI创作 · ${prompt.slice(0, 10)} #${index + 1}`,
          src: url,
          width: creativeAspectRatio === "16:9" ? 1280 : 900,
          height: creativeAspectRatio === "16:9" ? 720 : 1200,
          category: "generated",
          aspectRatio: creativeAspectRatio === "16:9" ? 16 / 9 : 3 / 4,
        },
      ]);
      showToast("已保存到素材图库");
    } catch (e) {
      console.error(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (!isGenerating && creativePromptDraft.trim()) {
        submitCreativeGeneration();
      }
    }
  };

  const formatTime = (ts: number) => {
    try {
      const d = new Date(ts);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${month}月${day}日 ${hh}:${mm}`;
    } catch {
      return "刚刚";
    }
  };

  const currentRatioMeta = RATIO_OPTIONS.find((r) => r.id === creativeAspectRatio) || RATIO_OPTIONS[0];

  return (
    <div className="flex-1 w-full h-full bg-studio-canvas-bg flex flex-col overflow-hidden relative select-none">
      {/* 顶部会话栏：标题与新建聊天按钮 */}
      <div className="w-full bg-studio-sidebar border-b border-studio-border px-4 sm:px-8 py-2.5 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-extrabold text-studio-text tracking-tight">AI 自由创作对话</span>
          <span className="text-[11px] text-studio-dim font-medium hidden sm:inline">
            · 自由提示词生图
          </span>
        </div>

        <button
          id="stage-new-chat-btn"
          onClick={() => {
            if (!isAuthenticated) {
              setAuthModalOpen(true, "register");
              return;
            }
            createNewCreativeSession();
          }}
          className="px-3 py-1.5 rounded-xl btn-aurora text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
          title="开启一次新的创作对话"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>新建聊天</span>
        </button>
      </div>

      {/* 顶部全局提示 Toast */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 glass-float px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn pointer-events-none">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 隐藏的参考图上传控件 */}
      <input
        ref={refFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleRefUpload}
        className="hidden"
      />

      {/* 中央主消息流 / 创作会话记录（像聊天对话一样左右排布） */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-6 sm:px-8 lg:px-12 no-scrollbar">
        {/* 只读速览提示条 */}
        {!isAuthenticated && (
          <div className="max-w-4xl mx-auto mb-4 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs font-semibold flex items-center justify-between shadow-xs shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span>AI 自由创作只读速览中 · 浏览会话与提示词 · 注册登录开启专属生图</span>
            </div>
            <button
              onClick={() => setAuthModalOpen(true, "register")}
              className="ml-2 px-2.5 py-0.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold cursor-pointer transition-all active:scale-95"
            >
              立即注册
            </button>
          </div>
        )}
        <div className="max-w-4xl mx-auto space-y-7 pb-8">
          {creativeHistory.map((item) => {
            const isCollapsed = collapsedSessionIds.has(item.id);
            const isItemGenerating = item.status === "generating";

            return (
              <div key={item.id} className="space-y-6 animate-fadeIn">
                {/* 1. 用户 Prompt 消息卡片（右侧，像聊天对话一样） */}
                <div className="flex justify-end items-start gap-3 w-full">
                  <div className="flex flex-col items-end max-w-[85%] sm:max-w-2xl">
                    {/* 头部元数据：时间与用户名 */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-1.5">
                      <span>{formatTime(item.createdAt)}</span>
                      <span className="font-bold text-gray-700">{item.userName || "danborad"}</span>
                    </div>

                    {/* Prompt 气泡卡片 */}
                    <div className="group relative bg-white border border-gray-200/90 rounded-2xl rounded-tr-sm p-4 sm:p-5 shadow-xs transition-all hover:shadow-md text-left w-full">
                      {item.referenceImage && (
                        <div className="mb-3 flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
                          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
                            <img src={item.referenceImage} alt="参考图" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[11px] text-gray-600 font-medium">
                            附带参考内容
                          </span>
                        </div>
                      )}

                      <p className="text-[14px] sm:text-[15px] leading-relaxed text-gray-900 font-normal select-text">
                        {item.prompt}
                      </p>

                      {/* 底部信息与快捷操作 */}
                      <div className="mt-3.5 flex items-center justify-between border-t border-gray-100 pt-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-medium">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-bold">{item.aspectRatio}</span>
                          <span>·</span>
                          <span>{item.count} 张</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopyPrompt(item.prompt, item.id)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-950 hover:bg-gray-100 transition-colors cursor-pointer"
                            title="复制提示词"
                          >
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => reapplyCreativeSession(item)}
                            className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 shadow-2xs flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="将此提示词与画幅参数回填到输入框并修改"
                          >
                            <Edit3 className="w-3 h-3 text-gray-600" />
                            <span>编辑重发</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 用户头像（最右侧） */}
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-900 to-gray-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm mt-1">
                    {currentUser?.avatar || "👤"}
                  </div>
                </div>

                {/* 2. AI 图像生成成片卡片（左侧，像聊天对话一样） */}
                <div className="flex justify-start items-start gap-3 w-full">
                  {/* AI 头像（最左侧） */}
                  <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-900 shrink-0 shadow-2xs mt-1">
                    <Sparkles className="w-4 h-4 text-gray-950" />
                  </div>

                  {/* AI 消息卡片 */}
                  <div className="flex flex-col items-start max-w-[92%] sm:max-w-3xl w-full">
                    {/* AI 助手名字与时间 */}
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-1.5">
                      <span className="font-bold text-gray-900">AI 创作助手</span>
                      <span>·</span>
                      <span>{formatTime(item.createdAt)}</span>
                    </div>

                    <div className="w-full bg-white border border-gray-200/90 rounded-2xl rounded-tl-sm p-4 sm:p-5 shadow-xs transition-all">
                      {/* 标题栏 */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm sm:text-base font-extrabold text-gray-950">
                            图像生成
                          </span>
                          <span className="text-xs sm:text-sm font-medium text-gray-500">
                            {isItemGenerating ? "正在绘制创作成片..." : "你的图像已生成"}
                          </span>
                        </div>

                        <button
                          onClick={() => toggleCollapse(item.id)}
                          className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
                        >
                          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                        </button>
                      </div>

                      {/* 内容体：正在生成状态 vs 生成完成多图网格 */}
                      {!isCollapsed && (
                        <>
                          {isItemGenerating ? (
                            <div className="w-full py-12 flex flex-col items-center justify-center text-center bg-gray-50/70 border border-gray-200/80 rounded-2xl">
                              <div className="w-10 h-10 rounded-full border-2 border-gray-300 border-t-gray-950 animate-spin mb-3" />
                              <p className="text-sm font-bold text-gray-900">
                                AI 正在绘制艺术大作
                              </p>
                              <p className="text-[11px] text-gray-400 mt-1.5 font-medium tabular-nums">
                                已用时 {elapsed}s · 高保真出图通常需要 30~60 秒
                              </p>
                            </div>
                          ) : item.status === "error" ? (
                            <div className="w-full p-5 bg-red-50/60 border border-red-200 rounded-2xl flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-red-900">生成未能完成</p>
                                <p className="text-[11px] text-red-600 mt-0.5">{item.errorMessage || "请检查接口响应状态"}</p>
                              </div>
                              <button
                                onClick={() => reapplyCreativeSession(item)}
                                className="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-xs font-bold text-red-700 hover:bg-red-50 cursor-pointer"
                              >
                                重试
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3.5">
                              {/* 生成成片横排网格 */}
                              <div
                                className={`grid gap-3.5 ${
                                  item.images.length === 1
                                    ? "grid-cols-1 max-w-xl mx-auto"
                                    : item.images.length === 2
                                    ? "grid-cols-1 sm:grid-cols-2"
                                    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                                }`}
                              >
                                {item.images.map((imgUrl, imgIdx) => (
                                  <div
                                    key={imgIdx}
                                    className={`group relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-xs transition-all hover:shadow-md ${
                                      item.aspectRatio === "16:9"
                                        ? "aspect-video"
                                        : item.aspectRatio === "3:4"
                                        ? "aspect-3/4"
                                        : item.aspectRatio === "4:3"
                                        ? "aspect-4/3"
                                        : item.aspectRatio === "9:16"
                                        ? "aspect-9/16"
                                        : "aspect-square"
                                    }`}
                                  >
                                    <img
                                      src={imgUrl}
                                      alt={`创作结果 ${imgIdx + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-500 ease-out"
                                    />

                                    {/* 鼠标悬停：图片放大 + 该张图独立的小按钮组（放大/下载/存图库/作参考） */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-2.5">
                                      <div className="flex items-center gap-1.5 px-1.5 py-1 rounded-xl bg-white/95 border border-white/60 shadow-lg">
                                        <button
                                          onClick={() => setLightboxImageUrl(imgUrl)}
                                          className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-gray-950 flex items-center justify-center cursor-pointer transition-all active:scale-90"
                                          title="全屏放大查看"
                                        >
                                          <Maximize2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDownloadImage(imgUrl, imgIdx)}
                                          className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-gray-950 flex items-center justify-center cursor-pointer transition-all active:scale-90"
                                          title="下载这一张"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleSaveToGallery(imgUrl, imgIdx, item.prompt)}
                                          className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-gray-950 flex items-center justify-center cursor-pointer transition-all active:scale-90"
                                          title="将这一张保存到图库"
                                        >
                                          <FolderHeart className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setCreativeReferenceImage(imgUrl);
                                            showToast("已将这一张作为参考图");
                                          }}
                                          className="w-7 h-7 rounded-lg bg-white/90 hover:bg-white text-gray-950 flex items-center justify-center cursor-pointer transition-all active:scale-90"
                                          title="把这一张作为参考图"
                                        >
                                          <ImageIcon className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* 序号角标，多图时便于区分 */}
                                    {item.images.length > 1 && (
                                      <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                                        {imgIdx + 1}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* 每张图的操作已移到图片悬停浮层上，这里只保留张数说明 */}
                              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-gray-100 text-xs">
                                <span className="text-gray-400 font-medium">
                                  共 {item.images.length} 张 · 悬停图片可单独下载 / 保存 / 作为参考
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 底部吸底浮动输入卡片（与消息列共用同一居中轴，不再相对整个视口居中） */}
      <div className="shrink-0 sticky bottom-0 z-30 px-4 sm:px-8 lg:px-12 pb-3 pt-2 bg-gradient-to-t from-studio-canvas-bg via-studio-canvas-bg to-transparent">
        <div className="w-full max-w-4xl mx-auto bg-studio-card border border-studio-border-strong rounded-2xl shadow-glass-lg p-3 sm:p-4 transition-all">
          {/* 提示词输入区域 */}
          <div className="relative">
            <textarea
              id="creative-prompt-input"
              ref={textareaRef}
              rows={1}
              value={creativePromptDraft}
              onChange={(e) => {
                setCreativePromptDraft(e.target.value);
                const el = e.target as HTMLTextAreaElement;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="描述画面、人物、场景、构图与风格，Enter 发送"
              className="w-full bg-transparent resize-none border-none outline-none text-sm sm:text-[15px] text-studio-text placeholder:text-studio-dim min-h-[28px] max-h-[120px] leading-relaxed py-1"
            />
          </div>

          {/* 参考图胶囊插槽 */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {creativeReferenceImage ? (
              <div className="flex items-center gap-2 bg-white/5 rounded-xl px-2.5 py-1 border border-studio-border">
                <div className="w-6 h-6 rounded-md overflow-hidden bg-studio-hover">
                  <img src={creativeReferenceImage} alt="参考图" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs font-bold text-studio-text">已选参考图</span>
                <button
                  onClick={() => setIsMediaPickerOpen(true)}
                  className="text-[11px] font-bold text-studio-muted hover:text-emerald-400 cursor-pointer px-1"
                  title="从图库换成另一张"
                >
                  换图
                </button>
                <button
                  onClick={() => setCreativeReferenceImage(null)}
                  className="p-0.5 rounded-full hover:bg-white/10 text-studio-muted hover:text-studio-text cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      setAuthModalOpen(true, "register");
                      return;
                    }
                    refFileInputRef.current?.click();
                  }}
                  className="px-3 py-1 rounded-xl btn-glass text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>上传参考图</span>
                </button>
                <button
                  id="creative-ref-gallery-btn"
                  onClick={() => {
                    if (!isAuthenticated) {
                      setAuthModalOpen(true, "register");
                      return;
                    }
                    setIsMediaPickerOpen(true);
                  }}
                  className="px-3 py-1 rounded-xl btn-glass text-xs font-bold flex items-center gap-1 cursor-pointer"
                  title="从图库中选择一张作为参考图"
                >
                  <FolderHeart className="w-3.5 h-3.5" />
                  <span>从图库选图</span>
                </button>
              </>
            )}
          </div>

          {/* 底栏控制条：参考内容与比例参数 · 开始创作（已去掉类型选择） */}
          <div className="flex items-center justify-between pt-2 border-t border-studio-border">
            {/* 左侧：仅保留画幅比例与生成张数设置 */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* 画幅与张数设置胶囊（带比例几何缩略图） */}
              <div className="relative" ref={configPopoverRef}>
                <button
                  id="creative-ratio-trigger-btn"
                  onClick={() => setIsConfigPopoverOpen(!isConfigPopoverOpen)}
                  className="px-3 py-1.5 rounded-xl btn-glass text-xs font-bold flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <div
                      style={{
                        width: `${Math.round(currentRatioMeta.thumbW * 0.7)}px`,
                        height: `${Math.round(currentRatioMeta.thumbH * 0.7)}px`,
                      }}
                      className="border-[1.5px] border-studio-dim rounded-[1.5px] bg-studio-hover"
                    />
                  </div>
                  <span>{creativeAspectRatio} · {creativeCount} 张</span>
                  <ChevronDown className="w-3 h-3 text-studio-dim" />
                </button>

                {/* 比例与张数下拉面板（带几何比例缩略图） */}
                {isConfigPopoverOpen && (
                  <div
                    className="absolute bottom-full mb-2 left-0 w-72 glass-float rounded-2xl p-3.5 z-50 space-y-3.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <span className="text-[11px] font-extrabold text-studio-dim uppercase tracking-wider block mb-2">
                        画幅比例
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {RATIO_OPTIONS.map((opt) => {
                          const isSelected = creativeAspectRatio === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => {
                                setCreativeAspectRatio(opt.id);
                                setIsConfigPopoverOpen(false);
                              }}
                              className={`p-2 rounded-xl text-xs font-bold text-left transition-all cursor-pointer flex items-center gap-2.5 border ${
                                isSelected
                                  ? "bg-emerald-500/18 text-emerald-300 border-emerald-500/55"
                                  : "bg-white/5 text-studio-muted hover:bg-white/10 hover:text-studio-text border-studio-border"
                              }`}
                            >
                              {/* 比例几何缩略图 */}
                              <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                <div
                                  style={{ width: `${opt.thumbW}px`, height: `${opt.thumbH}px` }}
                                  className={`rounded-[2px] border-[1.5px] ${
                                    isSelected
                                      ? "border-emerald-400 bg-emerald-400/25"
                                      : "border-studio-dim bg-white/15"
                                  }`}
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="block leading-tight font-extrabold">{opt.label}</span>
                                <span className={`text-[10px] block leading-tight truncate mt-0.5 ${
                                  isSelected ? "text-emerald-300/80" : "text-studio-dim font-normal"
                                }`}>
                                  {opt.desc}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] font-extrabold text-studio-dim uppercase tracking-wider block mb-2">
                        生成张数
                      </span>
                      <div className="flex items-center gap-2">
                        {COUNT_OPTIONS.map((c) => (
                          <button
                            key={c}
                            onClick={() => {
                              setCreativeCount(c);
                              setIsConfigPopoverOpen(false);
                            }}
                            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              creativeCount === c
                                ? "bg-emerald-500 text-black border-emerald-400 shadow-aurora"
                                : "bg-white/5 text-studio-muted hover:bg-white/10 hover:text-studio-text border-studio-border"
                            }`}
                          >
                            {c} 张
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧：开始创作按钮 */}
            <div className="flex items-center gap-3">
              <span
                className="text-xs font-bold text-studio-muted items-center gap-1 hidden sm:flex whitespace-nowrap shrink-0"
                title={`本次生成消耗：${creativeCount * costPerImage} 积分（${costPerImage} 积分/张 × ${creativeCount} 张）`}
              >
                <span>⚡</span>
                <span className="font-mono">{creativeCount * costPerImage}</span>
                <span className="text-[10px] font-normal text-studio-dim whitespace-nowrap">积分</span>
              </span>

              <button
                disabled={isGenerating || !creativePromptDraft.trim()}
                onClick={() => submitCreativeGeneration()}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shrink-0 ${
                  creativePromptDraft.trim() && !isGenerating
                    ? "btn-aurora"
                    : "bg-studio-hover text-studio-dim"
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span className="tabular-nums">创作中 {elapsed}s</span>
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-4 h-4" />
                    <span>开始创作</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 从图库选择参考图 */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelectSingle={(asset) => {
          setCreativeReferenceImage(asset.src);
          setIsMediaPickerOpen(false);
          showToast(`已选用「${asset.name || "图库图片"}」作为参考图`);
        }}
        onSelectBatchQueue={(assets) => {
          if (assets[0]) {
            setCreativeReferenceImage(assets[0].src);
            showToast(`已选用「${assets[0].name || "图库图片"}」作为参考图`);
          }
          setIsMediaPickerOpen(false);
        }}
        activeStyleName="AI 自由创作"
      />

      {/* 全屏放大预览 Lightbox 模态框 */}
      {lightboxImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxImageUrl(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <img
              src={lightboxImageUrl}
              alt="成片大图预览"
              className="max-w-full max-h-[82vh] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-4 flex items-center gap-3" onClick={(e) => e.stopPropagation()}>

              <button
                onClick={() => handleDownloadImage(lightboxImageUrl, 0)}
                className="px-4 py-2 rounded-xl bg-white text-gray-950 text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer hover:bg-gray-100"
              >
                <Download className="w-4 h-4" />
                <span>下载图片</span>
              </button>
              <button
                onClick={() => setLightboxImageUrl(null)}
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
