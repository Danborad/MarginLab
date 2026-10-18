import { TemplateThumbnail } from "../panels/TemplateThumbnail";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useEditorStore } from "../../store/useEditorStore";
import { Album, AlbumPageLayout, AlbumPageSide, AlbumTheme } from "../../types/album";
import { TEMPLATES, TemplateDefinition } from "../../lib/templates";
import { AlbumPageRenderer } from "./AlbumPageRenderer";
import { BookCoverRenderer } from "./book/BookCoverRenderer";
import { AlbumCoverStyle, AlbumCoverConfig } from "../../types/album";
import {
  X,
  Check,
  Image as ImageIcon,
  LayoutTemplate,
  Type,
  Upload,
  Sparkles,
  Search,
  Bookmark,
  FileText,
  Layers,
  Sliders,
  Grid,
} from "lucide-react";
import { generateCanvasThumbnail } from "../../lib/utils";

export interface PageConfigTarget {
  type: "cover" | "backCover" | "page";
  spreadIndex?: number;
  side?: "left" | "right";
}

export interface PageConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: Album;
  target: PageConfigTarget | null;
}

// 常用精美高清摄影素材（高山、叠瀑、湖泊、林海、古城、人文），告别模糊截图
const PRESET_SAMPLE_PHOTOS = [
  { url: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&auto=format&fit=crop&q=80", name: "九寨叠瀑清流" },
  { url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80", name: "高山翡翠海子" },
  { url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80", name: "原始云杉林间光影" },
  { url: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80", name: "川西高原公路" },
  { url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=800&auto=format&fit=crop&q=80", name: "高原木屋客栈" },
  { url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80", name: "松潘古城斜阳" },
  { url: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop&q=80", name: "秋日金黄林海" },
  { url: "https://images.unsplash.com/photo-1511497584788-87676104235f?w=800&auto=format&fit=crop&q=80", name: "古道青苔清泉" },
  { url: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80", name: "碧蓝幽深湖镜" },
  { url: "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?w=800&auto=format&fit=crop&q=80", name: "旅途复古胶片" },
  { url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop&q=80", name: "山川远足剪影" },
  { url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=80", name: "同行欢聚定格" },
  { url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80", name: "慢调生活角落" },
  { url: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80", name: "时尚杂志大片" },
  { url: "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?w=800&auto=format&fit=crop&q=80", name: "东方意境留白" },
];

export const PageConfigModal: React.FC<PageConfigModalProps> = ({
  isOpen,
  onClose,
  album,
  target,
}) => {
  const mediaAssets = useEditorStore((s) => s.mediaAssets);
  const documentState = useEditorStore((s) => s.document);
  const updateAlbumCover = useEditorStore((s) => s.updateAlbumCover);
  const updateAlbumBackCover = useEditorStore((s) => s.updateAlbumBackCover);
  const updateAlbumPage = useEditorStore((s) => s.updateAlbumPage);

  const [activeTab, setActiveTab] = useState<"templates" | "image" | "layout" | "text" | "cover" | "cover-style" | "cover-images" | "cover-text" | "cover-theme">("cover-style");
  const [templateFilter, setTemplateFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // 本地草稿状态
  const [image, setImage] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [layoutType, setLayoutType] = useState<AlbumPageLayout>("template");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [caption, setCaption] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [theme, setTheme] = useState<AlbumTheme>("indigo");
  // 封面高级定制配置状态
  const [coverStyle, setCoverStyle] = useState<AlbumCoverStyle>("minimal");
  const [verticalTitle, setVerticalTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [tagline2, setTagline2] = useState("");
  const [scriptText, setScriptText] = useState("");
  const [secondaryImage, setSecondaryImage] = useState("");
  const [publisher, setPublisher] = useState("");
  const [obiHeadline, setObiHeadline] = useState("");
  const [obiText, setObiText] = useState("");
  const [obiBadge, setObiBadge] = useState("");
  const [coverBadge, setCoverBadge] = useState("");

  const [author, setAuthor] = useState("");
  const [signoff, setSignoff] = useState("");

  const [isCapturingCanvas, setIsCapturingCanvas] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 过滤模板列表
  const filteredTemplates = useMemo(() => {
    return TEMPLATES.filter((t) => {
      const matchesCat = templateFilter === "All" || t.category.toLowerCase() === templateFilter.toLowerCase();
      const matchesSearch =
        !searchQuery.trim() ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [templateFilter, searchQuery]);

  // 获取当前选中的模板对象
  const currentTpl = useMemo(() => {
    return TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  }, [templateId]);

  // 初始化草稿数据
  useEffect(() => {
    if (!isOpen || !target) return;

    if (target.type === "cover") {
      setImage(album.coverImage || "");
      setTitle(album.title || "艺术画册");
      setSubtitle(album.subtitle || "");
      setAuthor(album.author || "");
      setCaption(album.description || "");
      setTheme(album.theme || "indigo");
      const cfg = album.coverConfig;
      setCoverStyle(cfg?.style || "minimal");
      setVerticalTitle(cfg?.verticalTitle || album.title || "明。天");
      setTagline(cfg?.tagline || "没有到不了的，你要去相信，");
      setTagline2(cfg?.tagline2 || "愿有人陪你颠沛流离，如果没有，愿你成为自己的太阳。");
      setScriptText(cfg?.scriptText || (cfg?.style === "obi" ? "M - E - N - T - A - L   F - L - O - W" : "there is no tomorrow"));
      setSecondaryImage(cfg?.secondaryImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80");
      setPublisher(cfg?.publisher || "百花洲文艺出版社");
      setObiHeadline(cfg?.obiHeadline || "心流理論之父、積極心理學奠基人 开山之作！");
      setObiText(cfg?.obiText || "散落于岁月长河中的微光片段，在此拼贴为一本流动的艺术画册。");
      setObiBadge(cfg?.obiBadge || "心 體 最\n理 驗 優\n學");
      setCoverBadge(cfg?.badge || "FINE ART PHOTOBOOK");
      setActiveTab("cover-style");
    } else if (target.type === "backCover") {
      setTitle(album.backCover?.title || `${album.title} · 封底`);
      setSubtitle(album.backCover?.subtitle || "全册翻阅完毕");
      setBodyText(album.backCover?.bodyText || "山川从不语，却道尽万千深情。每一次远行，都是为了在未知的光影中重逢最真实的自己。");
      setSignoff(album.backCover?.signoff || "MarginLab Fine Art Printing");
      setActiveTab("text");
    } else if (target.type === "page" && target.spreadIndex !== undefined && target.side) {
      const spread = album.spreads[target.spreadIndex];
      const pageSide = target.side === "left" ? spread?.leftPage : spread?.rightPage;
      if (pageSide) {
        setImage(pageSide.image || "");
        setPhotos(pageSide.photos || []);
        setLayoutType(pageSide.layoutType || (pageSide.templateId ? "template" : "journal"));
        setTitle(pageSide.title || "");
        setSubtitle(pageSide.subtitle || "");
        setCaption(pageSide.caption || "");
        setBodyText(pageSide.bodyText || "");
        setTemplateId(pageSide.templateId || "quiet-journeys-grid");
        // 默认进入模板库，便于用户尽情选用 47 款拼图
        setActiveTab(pageSide.layoutType === "template" || pageSide.templateId ? "templates" : "layout");
      }
    }
  }, [isOpen, target, album]);

  if (!isOpen || !target) return null;


  // 保存配置
  const handleSave = () => {
    if (target.type === "cover") {
      updateAlbumCover(album.id, {
        coverImage: image,
        title: title.trim() || album.title,
        subtitle: subtitle.trim(),
        author: author.trim(),
        description: caption.trim(),
        theme,
        coverConfig: {
          style: coverStyle,
          verticalTitle: verticalTitle.trim(),
          tagline: tagline.trim(),
          tagline2: tagline2.trim(),
          scriptText: scriptText.trim(),
          secondaryImage: secondaryImage.trim(),
          publisher: publisher.trim(),
          obiHeadline: obiHeadline.trim(),
          obiText: obiText.trim(),
          obiBadge: obiBadge.trim(),
          badge: coverBadge.trim(),
        },
      });
    } else if (target.type === "backCover") {
      updateAlbumBackCover(album.id, {
        title: title.trim(),
        subtitle: subtitle.trim(),
        bodyText: bodyText.trim(),
        signoff: signoff.trim(),
      });
    } else if (target.type === "page" && target.spreadIndex !== undefined && target.side) {
      updateAlbumPage(album.id, target.spreadIndex, target.side, {
        image,
        photos: photos.length > 0 ? photos : undefined,
        layoutType,
        title: title.trim(),
        subtitle: subtitle.trim(),
        caption: caption.trim(),
        bodyText: bodyText.trim(),
        templateId: layoutType === "template" ? templateId : undefined,
      });
    }
    onClose();
  };

  // 本地文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // 一键获取当前工作台画布
  const handleUseCurrentCanvas = async () => {
    setIsCapturingCanvas(true);
    try {
      const thumb = await generateCanvasThumbnail(documentState);
      setImage(thumb);
      if (!title) setTitle(documentState.name || "画布作品");
    } catch (err) {
      console.error("Failed to capture canvas:", err);
    } finally {
      setIsCapturingCanvas(false);
    }
  };

  // 套用模板
  const handleSelectTemplate = (tpl: TemplateDefinition) => {
    setTemplateId(tpl.id);
    setLayoutType("template");
    setImage(tpl.preview);
    setPhotos([]);
    setTitle(tpl.name);
    setCaption(tpl.description);
  };

  // 计算当前编辑的页码
  const pageNum =
    target.type === "page" && target.spreadIndex !== undefined && target.side
      ? target.spreadIndex * 2 + (target.side === "left" ? 1 : 2)
      : null;

  // 模拟单页预览对象
  const previewPageSide: AlbumPageSide = {
    id: "preview_page",
    image,
    photos: photos.length > 0 ? photos : undefined,
    layoutType,
    title,
    subtitle,
    caption,
    bodyText,
    templateId,
  };


  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-5xl h-[90vh] max-h-[760px] bg-studio-sidebar border border-studio-border rounded-2xl shadow-2xl flex flex-col overflow-hidden text-studio-text">
        {/* ── 1. 顶部标头 ───────────────────────────────────── */}
        <div className="px-5 py-3 border-b border-studio-border/70 flex items-center justify-between bg-studio-panel/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 border border-amber-500/30 flex items-center justify-center">
              {target.type === "cover" ? (
                <Bookmark className="w-4 h-4" />
              ) : target.type === "backCover" ? (
                <FileText className="w-4 h-4" />
              ) : (
                <Layers className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-studio-text flex items-center gap-2">
                {target.type === "cover" && "编辑画册封面与装订"}
                {target.type === "backCover" && "编辑画册封底寄语"}
                {target.type === "page" && `独立配置第 ${pageNum} 页 (${target.side === "left" ? "左页" : "右页"})`}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-600 font-semibold">
                  单页独立自定义
                </span>
              </h3>
              <p className="text-[11px] text-studio-muted mt-0.5">
                支持全面套用系统 47 款高级海报模板、替换画面素材、自定义文字手札，实时呈现于 3D 实体书
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-studio-hover text-studio-muted hover:text-studio-text transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── 2. 中部主体（左侧配置表单 + 右侧实时预览） ─────────── */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
          {/* 左侧配置栏 */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-studio-border/60 overflow-hidden bg-studio-card/20">
            {/* 标签导航栏 */}
            <div className="flex items-center gap-1 px-4 pt-2.5 border-b border-studio-border/50 shrink-0 bg-studio-panel/40 overflow-x-auto no-scrollbar">
              {target.type === "cover" ? (
                <>
                  <button
                    onClick={() => setActiveTab("cover-style")}
                    className={`px-3.5 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "cover-style"
                        ? "border-amber-500 text-amber-600 bg-studio-sidebar/50"
                        : "border-transparent text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>封面风格 (5款)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("cover-images")}
                    className={`px-3.5 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "cover-images"
                        ? "border-amber-500 text-amber-600 bg-studio-sidebar/50"
                        : "border-transparent text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>画面与切片</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("cover-text")}
                    className={`px-3.5 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "cover-text"
                        ? "border-amber-500 text-amber-600 bg-studio-sidebar/50"
                        : "border-transparent text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>诗意文案 & 签名</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("cover-theme")}
                    className={`px-3.5 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "cover-theme"
                        ? "border-amber-500 text-amber-600 bg-studio-sidebar/50"
                        : "border-transparent text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>装订材质</span>
                  </button>
                </>
              ) : null}

              {target.type === "page" ? (
                <>
                  <button
                    onClick={() => setActiveTab("templates")}
                    className={`px-3.5 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "templates"
                        ? "border-amber-500 text-amber-600 bg-studio-sidebar/50"
                        : "border-transparent text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>拼图模板 (47款)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("layout")}
                    className={`px-3.5 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "layout"
                        ? "border-amber-500 text-amber-600 bg-studio-sidebar/50"
                        : "border-transparent text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    <LayoutTemplate className="w-3.5 h-3.5" />
                    <span>版式排版</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("image")}
                    className={`px-3.5 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === "image"
                        ? "border-amber-500 text-amber-600 bg-studio-sidebar/50"
                        : "border-transparent text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>画面素材</span>
                  </button>
                </>
              ) : null}

              <button
                onClick={() => setActiveTab("text")}
                className={`px-3.5 py-1.5 rounded-t-lg text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "text"
                    ? "border-amber-500 text-amber-600 bg-studio-sidebar/50"
                    : "border-transparent text-studio-muted hover:text-studio-text"
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <span>文案手札</span>
              </button>
            </div>

            {/* 标签页内容 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {/* ── Tab 1: 拼图模板 (47款高定拼图海报) ── */}
              {activeTab === "templates" && (
                <div className="space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-studio-text flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>套用系统 47 款精美拼图海报模板</span>
                      </h4>
                      <p className="text-[10px] text-studio-muted mt-0.5">
                        点击一键套用，多图网格、杂志大字号、胶片边框与手札随笔瞬间装订成书
                      </p>
                    </div>

                    {/* 搜索框 */}
                    <div className="relative">
                      <Search className="w-3 h-3 text-studio-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="搜索模板名称/类别..."
                        className="w-36 sm:w-44 pl-7 pr-2.5 py-1 rounded-lg bg-studio-panel border border-studio-border text-[11px] text-studio-text outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* 分类快捷筛选 */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {[
                      { id: "All", label: "全部 (47)" },
                      { id: "Gallery", label: "画廊矩阵" },
                      { id: "Full Bleed", label: "全屏时尚" },
                      { id: "Editorial", label: "杂志排版" },
                      { id: "Lookbook", label: "造型画册" },
                      { id: "Polaroid", label: "时光拍立得" },
                      { id: "Minimalist", label: "极简留白" },
                      { id: "Brutalist", label: "先锋字构" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setTemplateFilter(cat.id)}
                        className={`text-[10px] font-mono px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                          templateFilter === cat.id
                            ? "bg-amber-500 text-zinc-950 font-bold shadow-xs"
                            : "bg-studio-panel text-studio-muted hover:text-studio-text border border-studio-border"
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* 模板卡片网格 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1 no-scrollbar">
                    {filteredTemplates.map((tpl) => {
                      const isSelected = layoutType === "template" && templateId === tpl.id;
                      return (
                        <div
                          key={tpl.id}
                          data-template-id={tpl.id}
                          onClick={() => handleSelectTemplate(tpl)}
                          className={`group rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-studio-panel flex flex-col relative ${
                            isSelected
                              ? "border-amber-500 ring-2 ring-amber-500/40 shadow-md scale-[1.01]"
                              : "border-studio-border hover:border-amber-500/60 hover:shadow-sm"
                          }`}
                        >
                          <div className="aspect-[3/4] overflow-hidden relative bg-white">
                            <img
                              src={tpl.preview}
                              alt={tpl.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
                            />
                            {/* 悬浮或选中标识 */}
                            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[9px] font-mono text-gray-500">
                              {tpl.category}
                            </div>
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-amber-500/90 text-zinc-950 text-[9px] font-mono font-bold">
                              {tpl.photoCount} 图
                            </div>

                            {isSelected && (
                              <div className="absolute inset-0 bg-amber-500/15 border-2 border-amber-500 flex items-center justify-center">
                                <div className="px-2.5 py-1 rounded-full bg-amber-500 text-zinc-950 text-[10px] font-bold flex items-center gap-1 shadow-lg">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  <span>当前选用</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="p-2 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="text-[11px] font-bold text-studio-text truncate">
                                {tpl.name}
                              </div>
                              <p className="text-[9px] text-studio-muted line-clamp-2 mt-0.5 leading-relaxed">
                                {tpl.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Tab 2: 版式排版 (单页) ── */}
              {activeTab === "layout" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-studio-text block mb-1">
                      选择本页页面排版版式
                    </label>
                    <p className="text-[11px] text-studio-muted mb-2">
                      支持在单图全幅、杂志图文、拍立得、双图/四图网格与 47 款拼图海报模板之间自由切换
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      {
                        type: "template" as AlbumPageLayout,
                        name: "拼图海报模板 (Template)",
                        desc: "套用系统 47 款高级杂志海报，带专属版式徽章与排版",
                        icon: "✨",
                        badge: "强烈推荐",
                      },
                      {
                        type: "full" as AlbumPageLayout,
                        name: "全幅大片 (Full Bleed)",
                        desc: "单图铺满整页，经典画廊级视觉冲击，下方带柔和图说",
                        icon: "🖼️",
                      },
                      {
                        type: "journal" as AlbumPageLayout,
                        name: "杂志图文手札 (Journal)",
                        desc: "上方艺术摄影，下方搭配典雅标题、副标与手写诗意长手札",
                        icon: "📖",
                      },
                      {
                        type: "polaroid" as AlbumPageLayout,
                        name: "时光拍立得 (Polaroid)",
                        desc: "经典微倾白边拍立得相纸，散落生活细碎美感",
                        icon: "📷",
                      },
                      {
                        type: "grid-2" as AlbumPageLayout,
                        name: "双图对称 (Diptych)",
                        desc: "上下双图画廊排版，适合展现旅途前后或细节对比",
                        icon: "♊",
                      },
                      {
                        type: "grid-4" as AlbumPageLayout,
                        name: "四图画廊 (Quad Grid)",
                        desc: "四宫格紧凑相簿，记录连拍动作或同系列景致",
                        icon: "🪟",
                      },
                    ].map((item) => (
                      <div
                        key={item.type}
                        onClick={() => {
                          setLayoutType(item.type);
                          if (item.type === "template" && !templateId) {
                            setTemplateId("quiet-journeys-grid");
                          }
                        }}
                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          layoutType === item.type
                            ? "border-amber-500 bg-amber-500/10 shadow-xs ring-1 ring-amber-500/30"
                            : "border-studio-border hover:border-amber-500/40 bg-studio-panel/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-lg">{item.icon}</span>
                          <div className="flex items-center gap-1">
                            {item.badge && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 border border-amber-500/30 font-bold">
                                {item.badge}
                              </span>
                            )}
                            {layoutType === item.type && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500 text-zinc-950 font-bold">
                                当前选用
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-studio-text">{item.name}</div>
                          <p className="text-[10px] text-studio-muted mt-1 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 如果选用了模板排版，展示当前模板并提供快速切换区 */}
                  {layoutType === "template" && (
                    <div className="mt-4 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs font-bold text-studio-text">
                            当前套用模板：{currentTpl.name}
                          </span>
                        </div>
                        <button
                          onClick={() => setActiveTab("templates")}
                          className="text-[11px] text-amber-600 hover:text-amber-600 font-semibold cursor-pointer"
                        >
                          浏览全部 47 款模板 →
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        {TEMPLATES.slice(0, 4).map((t) => (
                          <div
                            key={t.id}
                            onClick={() => handleSelectTemplate(t)}
                            className={`aspect-[3/4] rounded-lg overflow-hidden border cursor-pointer relative ${
                              templateId === t.id ? "border-amber-500 ring-2 ring-amber-500/50" : "border-studio-border"
                            }`}
                          >
                            <TemplateThumbnail template={t} />
                            <div className="absolute inset-x-0 bottom-0 bg-black/40 p-1 text-[8px] font-mono text-white truncate z-10">
                              {t.name.split("•")[0]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 3: 画面与素材 (单页) ── */}
              {activeTab === "image" && (
                <div className="space-y-4">
                  {/* 快捷操作栏：上传、当前画布、清除 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-600 dark:text-amber-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>上传本地新照片</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      onClick={handleUseCurrentCanvas}
                      disabled={isCapturingCanvas}
                      className="flex-1 py-2 px-3 rounded-xl bg-studio-panel hover:bg-studio-hover border border-studio-border text-studio-text text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>{isCapturingCanvas ? "收录中..." : "导入当前排版画布"}</span>
                    </button>

                    {image && (
                      <button
                        onClick={() => {
                          setImage("");
                          setPhotos([]);
                        }}
                        className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 text-xs font-semibold transition-all cursor-pointer"
                        title="设为纯白相纸"
                      >
                        清空图片
                      </button>
                    )}
                  </div>

                  {/* 预设自然与摄影实景图 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-studio-text">
                        高清山水与旅行实景图 (15选)
                      </span>
                      <span className="text-[10px] font-mono text-studio-muted">
                        点击一键换入本页
                      </span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {PRESET_SAMPLE_PHOTOS.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setImage(p.url);
                            if (!title) setTitle(p.name);
                          }}
                          className={`aspect-[3/4] rounded-lg overflow-hidden border-2 cursor-pointer transition-all relative group ${
                            image === p.url
                              ? "border-amber-500 ring-2 ring-amber-500/40"
                              : "border-studio-border hover:border-amber-500/50"
                          }`}
                        >
                          <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-[8px] font-sans text-gray-900 truncate">
                            {p.name}
                          </div>
                          {image === p.url && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 用户媒体库图片 */}
                  {mediaAssets.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-studio-text block mb-2">
                        我的素材库照片 ({mediaAssets.length})
                      </span>
                      <div className="grid grid-cols-5 gap-2 max-h-44 overflow-y-auto no-scrollbar">
                        {mediaAssets.map((asset) => (
                          <div
                            key={asset.id}
                            onClick={() => setImage(asset.src)}
                            className={`aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all relative ${
                              image === asset.src
                                ? "border-amber-500 ring-2 ring-amber-500/40"
                                : "border-studio-border hover:border-amber-500/50"
                            }`}
                          >
                            <img src={asset.src} alt="" className="w-full h-full object-cover" />
                            {image === asset.src && (
                              <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab: 封面风格 (5款设计感预设) ── */}
              {activeTab === "cover-style" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-studio-text">
                      选择高定封面风格 (所见即所得实时渲染)
                    </label>
                    <span className="text-[10px] font-mono text-amber-600 font-bold bg-amber-500/15 px-2 py-0.5 rounded-full">
                      高审美出版物装帧
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        id: "literary",
                        title: "📖 文艺书影",
                        tag: "参考图 1 款",
                        desc: "纯净特种纸底 · 照片剪贴双切片 · 竖排散文诗行 · 贯穿式手写体花体英文 · 百花洲出版社官方圆印",
                        highlight: true,
                      },
                      {
                        id: "obi",
                        title: "🎗️ 现代书腰",
                        tag: "参考图 2 款",
                        desc: "全幅艺术流体大片 · 顶部圆环符号 · 空灵竖排巨字 · 底部实体纸质半截腰封 · 水印与宣发摘录",
                        highlight: true,
                      },
                      {
                        id: "gallery",
                        title: "🖼️ 画廊全幅",
                        tag: "高定杂志",
                        desc: "满版极致摄影 · 双细金框几何装订 · 典雅衬线字体 · 博物馆级艺术藏号",
                        highlight: false,
                      },
                      {
                        id: "minimal",
                        title: "🎋 东方留白",
                        tag: "文人水墨",
                        desc: "米白宣纸大面积留白 · 细长画卷纵向切片 · 宋体竖排书法标题 · 朱砂方正印章",
                        highlight: false,
                      },
                      {
                        id: "classic",
                        title: "🏛️ 经典精装",
                        tag: "典藏布封",
                        desc: "主题色布纹皮面 · 烫金居中深凹开窗画框 · 法式精装装订槽（绝无粗糙假柱）",
                        highlight: false,
                      },
                    ].map((st) => (
                      <div
                        key={st.id}
                        onClick={() => setCoverStyle(st.id as AlbumCoverStyle)}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          coverStyle === st.id
                            ? "border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30"
                            : "border-studio-border hover:border-amber-500/50 bg-studio-panel/40"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-xs font-bold text-studio-text flex items-center gap-1.5">
                            <span>{st.title}</span>
                            {st.highlight && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-red-500/20 text-red-600 font-semibold border border-red-500/30">
                                {st.tag}
                              </span>
                            )}
                          </h4>
                          {coverStyle === st.id && (
                            <div className="w-4 h-4 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-studio-muted leading-relaxed">
                          {st.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-studio-text flex items-center justify-between">
                    <span>已选风格：<strong className="text-amber-600">{coverStyle}</strong>。切换上方标签可微调画面、切片、散文诗与书腰文案。</span>
                    <button
                      onClick={() => setActiveTab("cover-text")}
                      className="px-3 py-1 rounded-lg bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 transition-colors cursor-pointer text-xs shrink-0 ml-2"
                    >
                      配置文案与签名 →
                    </button>
                  </div>
                </div>
              )}

              {/* ── Tab: 封面图片与副切片 ── */}
              {activeTab === "cover-images" && (
                <div className="space-y-4">
                  {/* 主封面照片 */}
                  <div>
                    <label className="text-xs font-semibold text-studio-text block mb-1.5">
                      主封面照片 (Core Cover Photo)
                    </label>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-studio-panel border border-studio-border">
                      <div className="w-16 h-20 rounded-lg overflow-hidden border border-studio-border bg-stone-100 shrink-0 relative">
                        <img src={image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={image}
                          onChange={(e) => setImage(e.target.value)}
                          placeholder="输入主图 URL 或从下方预设库点选"
                          className="w-full px-3 py-1.5 rounded-lg bg-studio-card border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500"
                        />
                        <div className="flex items-center gap-2">
                          <label className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs cursor-pointer inline-flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            <span>本地上传主图</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const r = new FileReader();
                                r.onload = () => {
                                  if (typeof r.result === "string") setImage(r.result);
                                };
                                r.readAsDataURL(file);
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={handleUseCurrentCanvas}
                            className="px-2.5 py-1 rounded-lg bg-studio-panel border border-studio-border hover:border-amber-500 text-xs text-studio-text cursor-pointer"
                          >
                            使用当前画板原图
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 文艺书影风格专用：副切片照片 */}
                  {coverStyle === "literary" && (
                    <div>
                      <label className="text-xs font-semibold text-studio-text block mb-1.5">
                        右上角副切片照片 (文艺书影风格专属)
                      </label>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-studio-panel border border-studio-border">
                        <div className="w-16 h-18 rounded-lg overflow-hidden border border-studio-border bg-stone-100 shrink-0 relative">
                          <img src={secondaryImage} alt="" className="w-full h-full object-cover filter grayscale" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={secondaryImage}
                            onChange={(e) => setSecondaryImage(e.target.value)}
                            placeholder="输入副切片图片 URL"
                            className="w-full px-3 py-1.5 rounded-lg bg-studio-card border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500"
                          />
                          <label className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-100 text-gray-900 font-semibold text-xs cursor-pointer inline-flex items-center gap-1">
                            <Upload className="w-3 h-3" />
                            <span>上传切片图</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const r = new FileReader();
                                r.onload = () => {
                                  if (typeof r.result === "string") setSecondaryImage(r.result);
                                };
                                r.readAsDataURL(file);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 精选高质量摄影预设库 */}
                  <div>
                    <span className="text-xs font-semibold text-studio-text block mb-2">
                      从精选艺术摄影点选设为主图
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto no-scrollbar">
                      {PRESET_SAMPLE_PHOTOS.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => setImage(p.url)}
                          className={`aspect-[4/5] rounded-lg overflow-hidden border-2 cursor-pointer transition-all relative group ${
                            image === p.url
                              ? "border-amber-500 ring-2 ring-amber-500/40"
                              : "border-studio-border hover:border-amber-500/50"
                          }`}
                        >
                          <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                          {image === p.url && (
                            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab: 封面文案与签名 ── */}
              {activeTab === "cover-text" && (
                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1 no-scrollbar">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-studio-text block mb-1">
                        画册主标题 (Title)
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="例：九寨秘境 · 川西行记"
                        className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-studio-text block mb-1">
                        竖排大字标题 (Vertical Title)
                      </label>
                      <input
                        type="text"
                        value={verticalTitle}
                        onChange={(e) => setVerticalTitle(e.target.value)}
                        placeholder="例：明。天 或 心 流"
                        className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-studio-text block mb-1">
                        副标题 / 地点 (Subtitle)
                      </label>
                      <input
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="例：牟尼沟 · 二道海 · 松潘古城"
                        className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-studio-text block mb-1">
                        作者署名 (Author)
                      </label>
                      <input
                        type="text"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        placeholder="例：卢思浩 或 MarginLab Studio"
                        className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* 散文诗句与英文手写体 */}
                  <div className="p-3.5 rounded-xl bg-studio-panel border border-studio-border space-y-3">
                    <span className="text-xs font-bold text-amber-600 block">
                      文艺散文诗排版与手写花体签名 (参考图 1 核心视觉)
                    </span>

                    <div>
                      <label className="text-[11px] text-studio-muted block mb-1">
                        竖排诗意主句 (Tagline 1)
                      </label>
                      <input
                        type="text"
                        value={tagline}
                        onChange={(e) => setTagline(e.target.value)}
                        placeholder="例：没有到不了的，你要去相信，"
                        className="w-full px-3 py-1.5 rounded-lg bg-studio-card border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-studio-muted block mb-1">
                        竖排诗意辅句 (Tagline 2)
                      </label>
                      <input
                        type="text"
                        value={tagline2}
                        onChange={(e) => setTagline2(e.target.value)}
                        placeholder="例：愿有人陪你颠沛流离，如果没有，愿你成为自己的太阳。"
                        className="w-full px-3 py-1.5 rounded-lg bg-studio-card border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-studio-muted block mb-1">
                        斜向花体英文签名 (Script Calligraphy)
                      </label>
                      <input
                        type="text"
                        value={scriptText}
                        onChange={(e) => setScriptText(e.target.value)}
                        placeholder="例：there is no tomorrow 或 mental flow"
                        className="w-full px-3 py-1.5 rounded-lg bg-studio-card border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-studio-muted block mb-1">
                        出版社 / 藏书印章名 (Publisher)
                      </label>
                      <input
                        type="text"
                        value={publisher}
                        onChange={(e) => setPublisher(e.target.value)}
                        placeholder="例：百花洲文艺出版社 或 MarginLab Press"
                        className="w-full px-3 py-1.5 rounded-lg bg-studio-card border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* 现代书腰专属配置 */}
                  {coverStyle === "obi" && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3">
                      <span className="text-xs font-bold text-red-600 block">
                        现代书腰 (腰封) 专属文案配置 (参考图 2 核心视觉)
                      </span>

                      <div>
                        <label className="text-[11px] text-studio-muted block mb-1">
                          书腰红色主标语 (Obi Headline)
                        </label>
                        <input
                          type="text"
                          value={obiHeadline}
                          onChange={(e) => setObiHeadline(e.target.value)}
                          placeholder="例：心流理論之父、積極心理學奠基人 开山之作！"
                          className="w-full px-3 py-1.5 rounded-lg bg-studio-card border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-studio-muted block mb-1">
                          书腰摘录与书评 (Obi Quote)
                        </label>
                        <textarea
                          rows={2}
                          value={obiText}
                          onChange={(e) => setObiText(e.target.value)}
                          placeholder="书腰摘录文案..."
                          className="w-full px-3 py-1.5 rounded-lg bg-studio-card border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] text-studio-muted block mb-1">
                          书腰左侧印章字 (Obi Badge)
                        </label>
                        <input
                          type="text"
                          value={obiBadge}
                          onChange={(e) => setObiBadge(e.target.value)}
                          placeholder="例：心 體 最\n理 驗 優\n學"
                          className="w-full px-3 py-1.5 rounded-lg bg-studio-card border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab: 装订材质与底色 ── */}
              {activeTab === "cover-theme" && (
                <div className="space-y-4">
                  <label className="text-xs font-semibold text-studio-text block mb-1.5">
                    精装硬壳装订材质与底色调
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: "indigo", label: "经典靛金 (Indigo Gold)", color: "#3C3325", border: "#E6C687" },
                      { id: "slate", label: "玄青冷灰 (Slate Silver)", color: "#2E3240", border: "#E0E6F0" },
                      { id: "dark", label: "曜黑极简 (Obsidian Dark)", color: "#222328", border: "#D0D0D8" },
                      { id: "neutral", label: "特种原色 (Ivory Parchment)", color: "#EAE7DE", border: "#6A5636" },
                      { id: "burgundy", label: "勃艮第红 (Burgundy Wine)", color: "#4F1B25", border: "#E8BA7B" },
                      { id: "forest", label: "冷杉墨绿 (Forest Spruce)", color: "#1C3C2C", border: "#E2C37E" },
                    ].map((th) => (
                      <button
                        key={th.id}
                        onClick={() => setTheme(th.id as AlbumTheme)}
                        className={`p-3 rounded-xl border-2 text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                          theme === th.id
                            ? "border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/10 text-amber-600 font-bold"
                            : "border-studio-border hover:border-amber-500/40 text-studio-text bg-studio-panel/40"
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full border-2 shrink-0 shadow-xs"
                          style={{ backgroundColor: th.color, borderColor: th.border }}
                        />
                        <span className="text-xs">{th.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-studio-panel border border-studio-border text-xs text-studio-muted leading-relaxed">
                    💡 提示：封面已升级为无缝法式装订槽工艺，<strong>彻底移除了合起时的生硬假侧边柱</strong>。特种纸质感、堵头布与硬壳包边阴影已全部生效。
                  </div>
                </div>
              )}
              {/* ── Tab: 文案手札 ── */}
              {activeTab === "text" && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-studio-text block mb-1.5">
                      页面标题
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="例：牟尼沟叠瀑群"
                      className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-studio-text block mb-1.5">
                      副标 / 图说摘要
                    </label>
                    <input
                      type="text"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="例：川西高原上的翡翠玉带，水声如琴弦轻拂松林"
                      className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-studio-text block mb-1.5">
                      诗意手札随笔 / 正文
                    </label>
                    <textarea
                      value={bodyText}
                      onChange={(e) => setBodyText(e.target.value)}
                      rows={4}
                      placeholder="写下当天的漫步心情、同行者的笑语或对光影的感悟..."
                      className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500 resize-none leading-relaxed"
                    />
                  </div>

                  {target.type === "backCover" && (
                    <div>
                      <label className="text-xs font-semibold text-studio-text block mb-1.5">
                        出版 / 尾声印记
                      </label>
                      <input
                        type="text"
                        value={signoff}
                        onChange={(e) => setSignoff(e.target.value)}
                        placeholder="例：MarginLab Fine Art Printing • 2026"
                        className="w-full px-3 py-2 rounded-xl bg-studio-panel border border-studio-border text-xs text-studio-text outline-none focus:border-amber-500"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 右侧实时卡片预览 */}
          <div className="w-full md:w-[380px] bg-studio-panel/40 p-5 flex flex-col items-center justify-between border-t md:border-t-0 md:border-l border-studio-border/60 shrink-0">
            <div className="w-full text-center">
              <span className="text-[10px] font-mono text-studio-muted uppercase tracking-wider block mb-1">
                所见即所得 · 3D 书本真实效果
              </span>
              <h4 className="text-xs font-bold text-studio-text">
                {target.type === "cover" && "画册封面预览"}
                {target.type === "backCover" && "画册封底预览"}
                {target.type === "page" && `第 ${pageNum} 页 · 单页排版效果`}
              </h4>
            </div>

            {/* 单页真实画框 */}
            <div className="w-[230px] h-[312px] my-auto rounded-md overflow-hidden shadow-2xl border border-black/15 bg-[#FAF8F5] relative flex items-center justify-center">
              {target.type === "cover" ? (
                <div
                  style={{
                    width: 360,
                    height: 490,
                    transform: "scale(0.638)",
                    transformOrigin: "center center",
                  }}
                >
                  <BookCoverRenderer
                    album={{
                      ...album,
                      title: title || album.title,
                      subtitle,
                      author,
                      coverImage: image || album.coverImage,
                      theme,
                    }}
                    coverConfig={{
                      style: coverStyle,
                      verticalTitle: verticalTitle || title,
                      tagline,
                      tagline2,
                      scriptText,
                      secondaryImage,
                      publisher,
                      obiHeadline,
                      obiText,
                      obiBadge,
                      badge: coverBadge,
                    }}
                    theme={theme}
                    previewMode={true}
                  />
                </div>
              ) : target.type === "backCover" ? (
                <div className="w-full h-full bg-[#1E1913] p-5 text-white flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-600 font-bold">
                      画册封底
                    </span>
                    <h3 className="text-sm font-serif font-bold text-amber-100 mt-2">{title}</h3>
                    <p className="text-[9px] text-gray-500 mt-0.5">{subtitle}</p>
                  </div>
                  <p className="text-[9px] text-gray-500 italic line-clamp-4 leading-relaxed">
                    "{bodyText}"
                  </p>
                  <div className="text-[8px] font-mono text-gray-500 border-t border-gray-200 pt-2">
                    {signoff}
                  </div>
                </div>
              ) : (
                <AlbumPageRenderer
                  page={previewPageSide}
                  side={target.side || "left"}
                  pageNumber={pageNum || 1}
                />
              )}
            </div>

            {/* 底部保存按钮 */}
            <div className="w-full flex items-center gap-2 pt-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-3 rounded-xl border border-studio-border text-studio-muted hover:text-studio-text hover:bg-studio-hover text-xs font-semibold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-all cursor-pointer shadow-md hover:scale-102 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>保存并应用</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
};
