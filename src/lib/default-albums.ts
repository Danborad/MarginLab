import { Album, AlbumSpreadPage, AlbumTheme, AlbumPageLayout, AlbumPageSide } from "../types/album";
import { TEMPLATES } from "./templates";
import { generateId } from "./utils";

// 默认画册封面：高清山川海子艺术大片
const DEFAULT_ALBUM_COVER =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80";

// 选用系统现有的 47 款精美拼图模板作为画册各页
const tQuiet = TEMPLATES.find((t) => t.id === "quiet-journeys-grid") || TEMPLATES[0];
const tSummer = TEMPLATES.find((t) => t.id === "summer-recap-film") || TEMPLATES[1];
const tVogue = TEMPLATES.find((t) => t.id === "vogue-fullbleed-cover") || TEMPLATES[2];
const tBazaar = TEMPLATES.find((t) => t.id === "bazaar-bold-masthead") || TEMPLATES[3];
const tDazed = TEMPLATES.find((t) => t.id === "dazed-heavy-title") || TEMPLATES[4];
const tParis = TEMPLATES.find((t) => t.id === "paris-fashion-poster") || TEMPLATES[5];
const tCinema = TEMPLATES.find((t) => t.id === "cinema-ultrawide-title") || TEMPLATES[6];
const tKinfolk = TEMPLATES.find((t) => t.id === "kinfolk-slow-living") || TEMPLATES[7];
const tQuad = TEMPLATES.find((t) => t.id === "editorial-quad-grid") || TEMPLATES[15];
const tCouture = TEMPLATES.find((t) => t.id === "couture-split-dual-bleed") || TEMPLATES[12];
const tFilmSheet = TEMPLATES.find((t) => t.id === "film-contact-sheet") || TEMPLATES[19];
const tPolaroidQuad = TEMPLATES.find((t) => t.id === "polaroid-quad-pack") || TEMPLATES[22];
const tZine = TEMPLATES.find((t) => t.id === "zine-cutout-spread") || TEMPLATES[42];
const tMuseum = TEMPLATES.find((t) => t.id === "museum-exhibition-label") || TEMPLATES[46];

export const DEFAULT_JIUZHAIGOU_ALBUM: Album = {
  id: "album_jiuzhaigou",
  title: "九寨秘境 · 川西行记",
  subtitle: "牟尼沟 · 二道海 · 松潘古城",
  author: "MarginLab Travel & Photography",
  description: "全册 7 对开精装画册，深度融合系统 47 款高定拼图海报排版与旅行手札",
  coverImage: DEFAULT_ALBUM_COVER,
  theme: "indigo",
  coverConfig: {
    style: "minimal",
    verticalTitle: "九寨。秘境",
    tagline: "没有到不了的，你要去相信，",
    tagline2: "愿有人陪你颠沛流离，如果没有，愿你成为自己的太阳。",
    scriptText: "there is no tomorrow",
    secondaryImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
    publisher: "百花洲文艺出版社",
    badge: "FINE ART PHOTOBOOK",
    obiHeadline: "川西行记 · 典藏摄影手札",
    obiText: "散落于岁月长河中的微光片段，在此拼贴为一本流动的艺术画册。",
    obiBadge: "心 體 最\n理 驗 優\n學",
  },
  createdAt: 1718000000000,
  updatedAt: 1718000000000,
  backCover: {
    title: "九寨秘境 · 典藏终章",
    subtitle: "四川 · 阿坝藏族羌族自治州",
    bodyText: "山川从不语，却道尽万千深情。每一次远行，都是为了在未知的光影中重逢最真实的自己。全册七篇对开高定拼图手札，至此圆满收官。",
    signoff: "MarginLab Fine Art Printing • 2026",
  },
  spreads: [
    {
      id: "sp_jzg_1",
      title: "旅途留白与夏日叠瀑",
      subtitle: "18 图艺术网格与高原钙华瀑布群",
      leftPage: {
        id: "p_jzg_1_l",
        image: tQuiet.preview,
        layoutType: "template",
        templateId: tQuiet.id,
        title: "Quiet Journeys • 旅途留白",
        caption: "Canva 经典 18 图文艺旅行矩阵，4×5 优雅网格留白与中心诗意随笔卡片",
      },
      rightPage: {
        id: "p_jzg_1_r",
        image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&auto=format&fit=crop&q=80",
        layoutType: "journal",
        title: "牟尼叠瀑漫步手札",
        subtitle: "MU NI GOU WATERFALL",
        caption: "川西高原上的翡翠玉带，水声如琴弦轻拂松林",
        bodyText: "沿栈道拾级而上，高原阳光穿透薄雾，水沫在石阶旁泛起微光。小牛与黑羊悠闲踱步，随手撕下纸巾贴上门票小卡，生活里的诗意悄然定格。",
      },
      sourceType: "template",
      createdAt: 1718000001000,
    },
    {
      id: "sp_jzg_2",
      title: "夏日胶片与慢调生活",
      subtitle: "三联暗房胶片与二道海幽深碧水",
      leftPage: {
        id: "p_jzg_2_l",
        image: tSummer.preview,
        layoutType: "template",
        templateId: tSummer.id,
        title: "Summer Recap • 夏日胶片手帐",
        caption: "三联高定暗房胶片边框与手写随笔",
      },
      rightPage: {
        id: "p_jzg_2_r",
        image: tKinfolk.preview,
        layoutType: "template",
        templateId: tKinfolk.id,
        title: "Kinfolk Slow Living • 慢调生活",
        caption: "二道海幽深碧蓝湖水与原始云杉林留白",
      },
      sourceType: "template",
      createdAt: 1718000002000,
    },
    {
      id: "sp_jzg_3",
      title: "时尚先锋与绿意仙境",
      subtitle: "画廊级全屏视觉与林间斑驳光影",
      leftPage: {
        id: "p_jzg_3_l",
        image: tVogue.preview,
        layoutType: "template",
        templateId: tVogue.id,
        title: "Vogue Full-Bleed • 封面大片",
        caption: "全屏时尚大片与高定烫金字号",
      },
      rightPage: {
        id: "p_jzg_3_r",
        image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80",
        layoutType: "polaroid",
        title: "爱丽丝绿意仙境",
        caption: "光影斑驳下的原始云杉林",
        bodyText: "树影随风摇曳，光线在幽蓝水面折射出金色的涟漪。空气中满是松脂与潮湿苔藓的清甜气息，恍若掉入了童话中的精灵森林。",
      },
      sourceType: "template",
      createdAt: 1718000003000,
    },
    {
      id: "sp_jzg_4",
      title: "四图画廊与双联画卷",
      subtitle: "高山深潭连拍与客栈窗外的远山",
      leftPage: {
        id: "p_jzg_4_l",
        image: tQuad.preview,
        layoutType: "template",
        templateId: tQuad.id,
        title: "Editorial Quad • 四图几何画廊",
        caption: "四联几何画廊与杂志排版",
      },
      rightPage: {
        id: "p_jzg_4_r",
        image: tCouture.preview,
        layoutType: "template",
        templateId: tCouture.id,
        title: "Haute Couture Split • 双联画册",
        caption: "高定双联大片，远山与林海呼吸感",
      },
      sourceType: "template",
      createdAt: 1718000004000,
    },
    {
      id: "sp_jzg_5",
      title: "暗房印相与高山古道",
      subtitle: "35mm 接触印样与九寨登山步履",
      leftPage: {
        id: "p_jzg_5_l",
        image: tFilmSheet.preview,
        layoutType: "template",
        templateId: tFilmSheet.id,
        title: "35mm Contact Sheet • 暗房印相",
        caption: "经典暗房 6 联印相，记录登山全历程",
      },
      rightPage: {
        id: "p_jzg_5_r",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
        layoutType: "journal",
        title: "一山放出一山拦",
        subtitle: "ALPINE EXPEDITION",
        caption: "背起行囊，走向海拔三千多米的静谧蓝境",
        bodyText: "正入万山圈子里，一山放出一山拦。每一次气喘吁吁爬过陡坡，眼前总会跃出一片意料之外的高山湿地或五彩飞瀑，疲倦瞬间烟消云散。",
      },
      sourceType: "template",
      createdAt: 1718000005000,
    },
    {
      id: "sp_jzg_6",
      title: "时光碎片与电影宽画幅",
      subtitle: "拍立得组合与松潘古城斜阳",
      leftPage: {
        id: "p_jzg_6_l",
        image: tPolaroidQuad.preview,
        layoutType: "template",
        templateId: tPolaroidQuad.id,
        title: "Polaroid Quad Pack • 四联拍立得",
        caption: "散落生活细碎美感，古街斜阳",
      },
      rightPage: {
        id: "p_jzg_6_r",
        image: tCinema.preview,
        layoutType: "template",
        templateId: tCinema.id,
        title: "Cinema Anamorphic • 电影宽银幕",
        caption: "21:9 超宽银幕画幅，镜海水色如幻",
      },
      sourceType: "template",
      createdAt: 1718000006000,
    },
    {
      id: "sp_jzg_7",
      title: "独立杂志拼贴与同行展签",
      subtitle: "手撕纸胶带与难忘岁月定格",
      leftPage: {
        id: "p_jzg_7_l",
        image: tZine.preview,
        layoutType: "template",
        templateId: tZine.id,
        title: "Zine Cutout • 独立杂志拼贴",
        caption: "手撕纸胶带、斜角照片与旅行随笔印记",
      },
      rightPage: {
        id: "p_jzg_7_r",
        image: tMuseum.preview,
        layoutType: "template",
        templateId: tMuseum.id,
        title: "Museum Label • 博物馆展签",
        caption: "同行伙伴与难忘时光 · 艺术典藏展签",
      },
      sourceType: "template",
      createdAt: 1718000007000,
    },
  ],
};

export const DEFAULT_ATELIER_ALBUM: Album = {
  id: "album_atelier_collage",
  title: "MarginLab 典藏拼图纪念册",
  subtitle: "47 款高定排版艺术与摄影视觉印记",
  author: "MarginLab Collage Studio",
  description: "由 MarginLab 高定拼图工坊排版集结的艺术摄影纪念画册",
  coverImage: tQuiet.preview,
  theme: "indigo",
  coverConfig: {
    style: "minimal",
    verticalTitle: "典藏。纪念",
  },
  createdAt: 1718000000000,
  updatedAt: 1718000000000,
  backCover: {
    title: "MarginLab 摄影工坊 · 终章",
    subtitle: "Artisan Collage & Photobook Binding",
    bodyText: "留白是艺术创作中呼吸的空间。每一张空白相纸，都在等待下一次灵感按下快门的瞬间。愿生活里的美学印记，永远在书册间流动。",
    signoff: "Designed by MarginLab Studio • 2026",
  },
  spreads: [
    {
      id: "sp_atelier_1",
      title: "旅途留白与夏日手帐",
      leftPage: {
        id: "p_at_1_l",
        image: tQuiet.preview,
        layoutType: "template",
        templateId: tQuiet.id,
        title: tQuiet.name,
        caption: tQuiet.description,
      },
      rightPage: {
        id: "p_at_1_r",
        image: tSummer.preview,
        layoutType: "template",
        templateId: tSummer.id,
        title: tSummer.name,
        caption: tSummer.description,
      },
      sourceType: "template",
      createdAt: 1718000001000,
    },
    {
      id: "sp_atelier_2",
      title: "先锋大片与时尚字号",
      leftPage: {
        id: "p_at_2_l",
        image: tVogue.preview,
        layoutType: "template",
        templateId: tVogue.id,
        title: tVogue.name,
        caption: tVogue.description,
      },
      rightPage: {
        id: "p_at_2_r",
        image: tBazaar.preview,
        layoutType: "template",
        templateId: tBazaar.id,
        title: tBazaar.name,
        caption: tBazaar.description,
      },
      sourceType: "template",
      createdAt: 1718000002000,
    },
    {
      id: "sp_atelier_3",
      title: "先锋艺术与时装周刊",
      leftPage: {
        id: "p_at_3_l",
        image: tDazed.preview,
        layoutType: "template",
        templateId: tDazed.id,
        title: tDazed.name,
        caption: tDazed.description,
      },
      rightPage: {
        id: "p_at_3_r",
        image: tParis.preview,
        layoutType: "template",
        templateId: tParis.id,
        title: tParis.name,
        caption: tParis.description,
      },
      sourceType: "template",
      createdAt: 1718000003000,
    },
    {
      id: "sp_atelier_4",
      title: "电影宽幅与慢调生活",
      leftPage: {
        id: "p_at_4_l",
        image: tCinema.preview,
        layoutType: "template",
        templateId: tCinema.id,
        title: tCinema.name,
        caption: tCinema.description,
      },
      rightPage: {
        id: "p_at_4_r",
        image: tKinfolk.preview,
        layoutType: "template",
        templateId: tKinfolk.id,
        title: tKinfolk.name,
        caption: tKinfolk.description,
      },
      sourceType: "template",
      createdAt: 1718000004000,
    },
    {
      id: "sp_atelier_5",
      title: "空白创作与时光留白",
      leftPage: {
        id: "p_at_5_l",
        image: "",
        layoutType: "journal",
        title: "纯白相纸 · 虚位以待",
        caption: "点击左侧工具栏或下方加号，可随时将您当前画布排版或素材库图片加入此页。",
        bodyText: "留白是艺术创作中呼吸的空间。每一张空白相纸，都在等待下一次灵感按下快门的瞬间。",
      },
      rightPage: {
        id: "p_at_5_r",
        image: "",
        layoutType: "polaroid",
        title: "拍立得留念",
        bodyText: "生活里的细碎美感，在此结集成册。",
      },
      sourceType: "template",
      createdAt: 1718000005000,
    },
  ],
};

const ALBUM_STORAGE_KEY = "atelier_user_albums_v9";

/**
 * 校验并修复画册完整性，清洗旧视频截图数据
 */
function sanitizeAlbum(album: Album): Album {
  const hasOldVideoScreenshots =
    (album.coverImage && album.coverImage.includes("/album_samples/")) ||
    (album.spreads || []).some(
      (sp) =>
        (sp.leftPage?.image && sp.leftPage.image.includes("/album_samples/")) ||
        (sp.rightPage?.image && sp.rightPage.image.includes("/album_samples/"))
    );

  if (album.id === "album_jiuzhaigou" && hasOldVideoScreenshots) {
    // 旧缓存中残留视频截图，重置为高定模板九寨行记
    return DEFAULT_JIUZHAIGOU_ALBUM;
  }

  // 确保每个对开的 leftPage 和 rightPage 都有完整字段
  const sanitizedSpreads = (album.spreads || []).map((sp, idx) => ({
    ...sp,
    id: sp.id || `sp_${idx}`,
    title: sp.title || `第 ${idx + 1} 对开页`,
    leftPage: {
      id: sp.leftPage?.id || `p_${idx}_l`,
      image: (sp.leftPage?.image && sp.leftPage.image.includes("/album_samples/"))
        ? tQuiet.preview
        : (sp.leftPage?.image || ""),
      layoutType: sp.leftPage?.layoutType || (sp.leftPage?.templateId ? "template" : "journal"),
      title: sp.leftPage?.title || `左页 · P.${idx * 2 + 1}`,
      caption: sp.leftPage?.caption || "",
      bodyText: sp.leftPage?.bodyText || "",
      templateId: sp.leftPage?.templateId,
      photos: sp.leftPage?.photos,
    },
    rightPage: {
      id: sp.rightPage?.id || `p_${idx}_r`,
      image: (sp.rightPage?.image && sp.rightPage.image.includes("/album_samples/"))
        ? tSummer.preview
        : (sp.rightPage?.image || ""),
      layoutType: sp.rightPage?.layoutType || (sp.rightPage?.templateId ? "template" : "journal"),
      title: sp.rightPage?.title || `右页 · P.${idx * 2 + 2}`,
      caption: sp.rightPage?.caption || "",
      bodyText: sp.rightPage?.bodyText || "",
      templateId: sp.rightPage?.templateId,
      photos: sp.rightPage?.photos,
    },
  }));

  return {
    ...album,
    coverImage: (album.coverImage && album.coverImage.includes("/album_samples/"))
      ? DEFAULT_ALBUM_COVER
      : (album.coverImage || DEFAULT_ALBUM_COVER),
    theme: album.theme || "indigo",
    coverConfig: album.coverConfig
      ? {
          ...album.coverConfig,
          style: album.coverConfig.style || "minimal",
        }
      : {
          style: "minimal",
          verticalTitle: album.title || "九寨。秘境",
          tagline: "没有到不了的，你要去相信，",
          tagline2: "愿有人陪你颠沛流离，如果没有，愿你成为自己的太阳。",
          scriptText: "there is no tomorrow",
          secondaryImage: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80",
          publisher: "百花洲文艺出版社",
          badge: "FINE ART PHOTOBOOK",
          obiHeadline: "川西行记 · 典藏摄影手札",
          obiText: "散落于岁月长河中的微光片段，在此拼贴为一本流动的艺术画册。",
          obiBadge: "心 體 最\n理 驗 優\n學",
        },
    spreads: sanitizedSpreads,
    backCover: album.backCover || {
      title: `${album.title || "艺术画册"} · 封底`,
      subtitle: "全册翻阅完毕",
      bodyText: "散落于岁月长河中的微光片段，拼贴为一本流动的艺术画册。",
      signoff: "MarginLab Fine Art Printing",
    },
  };
}

export const getStoredAlbums = (): Album[] => {
  const defaults = [DEFAULT_JIUZHAIGOU_ALBUM, DEFAULT_ATELIER_ALBUM];
  if (typeof window === "undefined") return defaults;
  try {
    // 迁移旧版本 key
    localStorage.removeItem("atelier_user_albums_v8");
    localStorage.removeItem("atelier_user_albums_v5");
    localStorage.removeItem("atelier_user_albums_v4");
    localStorage.removeItem("atelier_user_albums_v3");
    localStorage.removeItem("atelier_user_albums_v2");

    const raw = localStorage.getItem(ALBUM_STORAGE_KEY);
    if (!raw) {
      saveStoredAlbums(defaults);
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const sanitized = parsed.map(sanitizeAlbum);
      if (!sanitized.some((a) => a.id === "album_jiuzhaigou")) {
        sanitized.unshift(DEFAULT_JIUZHAIGOU_ALBUM);
      }
      return sanitized;
    }
  } catch (e) {
    console.warn("Failed to load stored albums:", e);
  }
  return defaults;
};

export const saveStoredAlbums = (albums: Album[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ALBUM_STORAGE_KEY, JSON.stringify(albums));
  } catch (e) {
    console.warn("Failed to persist albums:", e);
  }
};

export const createSpreadFromTemplate = (templateId: string, customTitle?: string): AlbumSpreadPage => {
  const tpl = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
  const pageId = generateId();

  return {
    id: `sp_${pageId}`,
    title: customTitle || tpl.name,
    subtitle: tpl.category,
    leftPage: {
      id: `p_${pageId}_l`,
      image: tpl.preview,
      title: tpl.name,
      caption: tpl.description,
      layoutType: "template",
      templateId: tpl.id,
    },
    rightPage: {
      id: `p_${pageId}_r`,
      image: tpl.preview,
      title: `${tpl.name} · 细览`,
      caption: `套用 ${tpl.name} 经典版式 · 照片框与排版手札`,
      layoutType: "journal",
      templateId: tpl.id,
    },
    sourceType: "template",
    createdAt: Date.now(),
  };
};

export const createSpreadFromAssets = (
  assetUrls: string[],
  layoutType: AlbumPageLayout = "journal",
  customTitle?: string
): AlbumSpreadPage => {
  const pageId = generateId();
  const photos = assetUrls.length > 0 ? assetUrls : [""];
  const title = customTitle || "光影印记 · 私人相册页";

  if (photos.length === 1) {
    return {
      id: `sp_${pageId}`,
      title,
      leftPage: {
        id: `p_${pageId}_l`,
        image: photos[0],
        layoutType: photos[0] ? "full" : "journal",
        title: "定格瞬间",
        caption: "镜头捕捉的光影情绪",
      },
      rightPage: {
        id: `p_${pageId}_r`,
        image: photos[0],
        layoutType: "polaroid",
        title: "手札寄语",
        bodyText: "生活里的细碎美感，在光影里悄然舒展。每一次按下快门，都是与世界的一次私密对话。",
      },
      sourceType: "assets",
      createdAt: Date.now(),
    };
  }

  const half = Math.ceil(photos.length / 2);
  const leftPhotos = photos.slice(0, half);
  const rightPhotos = photos.slice(half);

  return {
    id: `sp_${pageId}`,
    title,
    leftPage: {
      id: `p_${pageId}_l`,
      image: leftPhotos[0],
      photos: leftPhotos,
      layoutType: leftPhotos.length > 1 ? "grid-2" : "full",
      title: "视觉焦点",
    },
    rightPage: {
      id: `p_${pageId}_r`,
      image: rightPhotos[0] || leftPhotos[0],
      photos: rightPhotos,
      layoutType: rightPhotos.length > 1 ? "grid-4" : "journal",
      title: "时光手札",
      bodyText: "散落于岁月长河中的微光片段，拼贴为一本流动的艺术画册。",
    },
    sourceType: "assets",
    createdAt: Date.now(),
  };
};
