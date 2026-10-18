export type AlbumCoverStyle =
  | 'literary'  // 文艺书影 (参考图1: 照片剪贴拼贴、竖排散文诗、手写签名、出版社圆印)
  | 'obi'       // 现代书腰 (参考图2: 艺术大片/流体底纹、空灵竖排大字、实体书腰带)
  | 'gallery'   // 画廊全幅 (极简大片、高定几何细金框、典雅衬线)
  | 'minimal'   // 东方留白 (暖白特种纸、宋体竖排标题、朱砂印章、细幅切片)
  | 'classic';  // 经典精装 (布面肌理、烫金居中开窗、藏书票)

export interface AlbumCoverConfig {
  style?: AlbumCoverStyle;
  badge?: string;           // 顶标/藏书标 (例: 'FINE ART PHOTOBOOK', 'COLLECTION N° 07')
  verticalTitle?: string;   // 竖排大字标题 (例: '明。天' 或 '心 流')
  tagline?: string;         // 竖排散文诗主句 (例: '没有到不了的，你要去相信，')
  tagline2?: string;        // 竖排散文诗辅句 (例: '愿有人陪你颠沛流离，如果没有，愿你成为自己的太阳。')
  scriptText?: string;      // 手写体英文签名 (例: 'there is no tomorrow' 或 'mental flow')
  secondaryImage?: string;  // 副切片图 (用于文艺书影右上角黑白/氛围切片)
  publisher?: string;       // 出版社/藏书印 (例: '百花洲文艺出版社')
  obiHeadline?: string;     // 书腰大字标语 (例: '心流理論之父、積極心理學奠基人 开山之作！')
  obiText?: string;         // 书腰书评/摘录 (例: '散落于岁月长河中的微光片段...')
  obiBadge?: string;        // 书腰左侧方章/竖排字 (例: '心 體 最\n理 驗 優\n學')
}

export type AlbumTheme = 'indigo' | 'slate' | 'neutral' | 'dark' | 'burgundy' | 'forest';

export type AlbumPageLayout =
  | 'full'        // 单图全幅展示
  | 'polaroid'    // 拍立得手记
  | 'journal'     // 杂志图文编排
  | 'grid-2'      // 双图对称排版
  | 'grid-4'      // 四图画廊矩阵
  | 'template';   // 套用拼图模板

export interface AlbumPageSide {
  id: string;
  image?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  bodyText?: string;
  layoutType: AlbumPageLayout;
  templateId?: string;
  photos?: string[];
  author?: string;
  date?: string;
}

export interface AlbumBackCover {
  title?: string;
  subtitle?: string;
  bodyText?: string;
  image?: string;
  signoff?: string;
}

export interface AlbumSpreadPage {
  id: string;
  title?: string;
  subtitle?: string;
  // 高清全景对开图（可选）
  fullSpreadImage?: string;
  leftPage: AlbumPageSide;
  rightPage: AlbumPageSide;
  sourceType?: 'builtin' | 'template' | 'canvas' | 'assets' | 'upload';
  createdAt: number;
}

export interface Album {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  author?: string;
  coverImage: string;
  theme: AlbumTheme;
  coverConfig?: AlbumCoverConfig;
  backCover?: AlbumBackCover;
  spreads: AlbumSpreadPage[];
  createdAt: number;
  updatedAt: number;
}
