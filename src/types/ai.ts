export type StyleCategory =
  | "all"
  | "editorial"     // 高定画册 / 双联海报
  | "illustration"  // 艺术插画 / 水粉水彩
  | "photography"   // 电影胶片 / 人文摄影
  | "vintage"       // 复古版画 / 东方美学
  | "modern"        // 现代几何 / 粗野主义
  | "custom";       // 自定义风格

export type ImageAspectRatio =
  | "auto"
  | "1:1"
  | "3:2"
  | "2:3"
  | "4:3"
  | "3:4"
  | "16:9"
  | "21:9"
  | "9:16";

export interface AspectRatioOption {
  id: ImageAspectRatio;
  label: string;
  desc: string;
  width: number;
  height: number;
  iconW: number;
  iconH: number;
  isAuto?: boolean;
}

export const IMAGE_RATIOS: AspectRatioOption[] = [
  { id: "auto", label: "自动", desc: "自适应原图", width: 1, height: 1, iconW: 16, iconH: 16, isAuto: true },
  { id: "1:1", label: "1:1", desc: "正方形", width: 1, height: 1, iconW: 16, iconH: 16 },
  { id: "3:2", label: "3:2", desc: "经典横幅", width: 3, height: 2, iconW: 20, iconH: 13 },
  { id: "2:3", label: "2:3", desc: "经典竖构图", width: 2, height: 3, iconW: 13, iconH: 20 },
  { id: "4:3", label: "4:3", desc: "标准横幅", width: 4, height: 3, iconW: 19, iconH: 14 },
  { id: "3:4", label: "3:4", desc: "典雅画册", width: 3, height: 4, iconW: 14, iconH: 19 },
  { id: "16:9", label: "16:9", desc: "宽屏横画", width: 16, height: 9, iconW: 22, iconH: 12 },
  { id: "21:9", label: "21:9", desc: "电影超宽", width: 21, height: 9, iconW: 24, iconH: 10 },
  { id: "9:16", label: "9:16", desc: "全屏海报", width: 9, height: 16, iconW: 12, iconH: 22 },
];

export interface StylePreset {
  id: string;
  name: string;
  enName: string;
  category: StyleCategory;
  badge?: string;
  description: string;
  coverImage?: string; // custom uploaded base64 or URL
  previewUrl?: string;
  previewSvg?: string;
  aspectRatio: ImageAspectRatio;
  recommendedTemplateId?: string;
  promptTemplate: string;
  negativePrompt?: string;
  tags: string[];
  enabled?: boolean; // toggle whether user can see/use this style
  githubUrl?: string; // GitHub reference repo / Skill documentation URL
  order?: number;
  sampleBefore?: string;
  sampleAfter?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AiConfig {
  provider: string; // e.g. "openai_compatible", "image2", "custom"
  baseUrl: string;  // e.g. "https://api.openai.com/v1" or custom proxy
  apiKey: string;   // masked on client
  maskedKey?: string;
  model: string;    // e.g. "image2", "dall-e-3", "gpt-4o-image"
  size: string;     // e.g. "auto", "1:1", "3:4"
  quality?: "standard" | "hd";
  isConfigured: boolean;
  updatedAt?: string;
}

export interface GenerationTask {
  id: string;
  userId?: string;
  styleId: string;
  styleName: string;
  sourceImage?: string; // base64 or url
  sourceThumb?: string;
  prompt: string;
  customNotes?: string;
  aspectRatio: string;
  status: "pending" | "processing" | "success" | "error";
  resultUrl?: string;
  resultBase64?: string;
  /** 结果图缩略图（服务端生成并缓存，列表里用这个） */
  thumbUrl?: string;
  /** 原图缩略图 */
  sourceThumbUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

export interface GenerationQueueTask {
  id: string;
  styleId: string;
  styleName: string;
  badge?: string;
  sourceImage: string;
  aspectRatio: string;
  mood?: string;
  customNotes?: string;
  includeText?: boolean;
  specifiedText?: string;
  status: "pending" | "running" | "success" | "error";
  progress: number;
  stageText: string;
  resultImage?: string;
  errorMessage?: string;
  createdAt: number;
  completedAt?: number;
}

export interface StyleWorkspaceState {
  sourceImage: string | null;
  latestResult: string | null;
  aspectRatio?: ImageAspectRatio;
  mood?: string;
  specifiedText?: string;
  includeText?: boolean;
}

export interface CreativeSessionItem {
  id: string;
  /** 所属聊天会话 id：同一聊天内多次生成为多轮，但只算作一条历史记录 */
  sessionId?: string;
  /** 该聊天会话内的轮次序号（从 1 开始） */
  roundIndex?: number;
  userId?: string;
  userName?: string;
  prompt: string;
  aspectRatio: string;
  count: number;
  referenceImage?: string;
  images: string[];
  status: "generating" | "success" | "error";
  errorMessage?: string;
  createdAt: number;
}
