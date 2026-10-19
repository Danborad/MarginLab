import { Album, AlbumSpreadPage, AlbumCoverConfig, AlbumTheme, AlbumPageLayout, AlbumPageSide, AlbumBackCover } from '../types/album';
import { getStoredAlbums, saveStoredAlbums, createSpreadFromTemplate, createSpreadFromAssets } from '../lib/default-albums';
import { create } from "zustand";
import { get, set } from "idb-keyval";
import {
  CollageDocument,
  CollageElement,
  CanvasSettings,
  AlignmentGuide,
  ImageElement,
  TextElement,
  ShapeElement,
  StickerElement,
  NewElementData,
  SavedProject,
  CustomTemplate,
  UserMediaAsset,
  UserAccount,
} from "../types/document";
import { TEMPLATES } from "../lib/templates";
import { CANVAS_PRESETS } from "../lib/presets";
import { generateId, clamp, generateCanvasThumbnail } from "../lib/utils";
import { AiConfig, GenerationTask, StylePreset, GenerationQueueTask, StyleWorkspaceState, CreativeSessionItem } from "../types/ai";
import { AI_STYLES, DEFAULT_AI_STYLES, getStyleById, buildStylePrompt, getDreamyQuoteForImage } from "../lib/ai-styles";
import {
  apiFetchAccounts,
  apiRegister,
  apiLogin,
  apiUpdateProfile,
  apiChangePassword,
  apiDeleteAccount,
  apiSyncAccounts,
  apiGetUserData,
  apiSaveUserData,
  apiGetUserMedia,
  apiSaveUserMedia,
  apiDeleteUserMedia,
  apiClearUserMedia,
   apiGetAiConfig,
   apiSaveAiConfig,
   apiTestAiConfig,
  apiFetchAiModels,
   apiGenerateStylizedImage,
   apiGetAiHistory,
   apiDeleteAiHistory,
  apiGetAiStyles,
  apiAdminSaveAiStyle,
  apiAdminToggleAiStyle,
  apiAdminDeleteAiStyle,
  apiAdminResetAiStyles,
   apiAdminGetUsers,
   apiAdminSetUserStatus,
   apiAdminSetUserRole,
   apiAdminResetPassword,
   apiAdminCreateUser,
   apiAdminDeleteUser,
   apiGetSiteFilingConfig,
   apiAdminSaveSiteFilingConfig,
   apiGetPublicEmailConfig,
   apiSendVerificationCode,
   apiGetEmailConfig,
   apiSaveEmailConfig,
   apiTestEmailConfig,
 } from "../lib/api";
import type { SiteFilingConfig, EmailConfig, PublicEmailConfig } from "../lib/api";
import { DEFAULT_SITE_FILING_CONFIG } from "../lib/api";
import { CARTOON_AVATARS } from "../components/ui/AvatarPicker";
 
 // Multi-user & Auth Storage Keys (Strictly isolated per registered user)
 const STORAGE_ACCOUNTS_KEY = "atelier_registered_accounts_v4";
 const STORAGE_ACTIVE_USER_ID_KEY = "atelier_active_user_id_v4";
 
 const getStorageUserDocKey = (userId: string) => `atelier_user_${userId}_current_doc_v4`;
 const getStorageUserProjectsKey = (userId: string) => `atelier_user_${userId}_saved_projects_v4`;
 const getStorageUserTemplatesKey = (userId: string) => `atelier_user_${userId}_custom_templates_v4`;
 const getStorageUserMediaKey = (userId: string) => `atelier_user_${userId}_media_assets_v4`;
 
 // Default demo accounts (Pre-configured for instant access / testing)
 export const DEFAULT_ACCOUNTS: UserAccount[] = [
   {
     id: "user_admin",
     username: "admin",
     passwordHash: "admin123",
     name: "系统超级管理员",
     avatar: "👑",
     role: "超级管理员 / 系统管控",
     isAdmin: true,
     status: "active",
     bio: "平台全局掌控，管理创作者账号与全局 AI 图像大模型配置",
     themeColor: "#E5C49F",
     createdAt: "2026-01-01T00:00:00.000Z",
     lastLoginAt: "2026-09-01T12:00:00.000Z",
   },
   {
     id: "user_pro",
     username: "atelier",
     passwordHash: "123456",
     name: "MarginLab Pro 主理人",
     avatar: "🎨",
     role: "主理人 / 艺术指导",
     isAdmin: true,
     status: "active",
     bio: "专注于先锋时尚、大字封面与高定艺术海报设计",
     themeColor: "#E5C49F",
     createdAt: "2026-01-01T00:00:00.000Z",
     lastLoginAt: "2026-08-24T12:00:00.000Z",
   },
   {
     id: "user_photographer",
     username: "lin",
     passwordHash: "123456",
     name: "Lin • 胶片摄影师",
     avatar: "📷",
     role: "独立人文摄影师",
     isAdmin: false,
     status: "active",
     bio: "专注 35mm 胶片印相、旅行双联与明信片冲印",
     themeColor: "#93C5FD",
     createdAt: "2026-01-02T00:00:00.000Z",
     lastLoginAt: "2026-08-23T18:00:00.000Z",
   },
   {
     id: "user_designer",
     username: "alex",
     passwordHash: "123456",
     name: "Alex • 视觉设计师",
     avatar: "✨",
     role: "品牌视觉设计师",
     isAdmin: false,
     status: "active",
     bio: "专注瑞士国际主义排版、几何构图与现代画册",
     themeColor: "#F472B6",
     createdAt: "2026-01-03T00:00:00.000Z",
     lastLoginAt: "2026-08-23T12:00:00.000Z",
   },
   {
     id: "user_life",
     username: "mia",
     passwordHash: "123456",
     name: "Mia • 慢调生活",
     avatar: "🌿",
     role: "生活方式博主",
     isAdmin: false,
     status: "active",
     bio: "米家 3 寸口袋相纸、拍立得手记与日常灵感拼贴",
     themeColor: "#34D399",
     createdAt: "2026-01-04T00:00:00.000Z",
     lastLoginAt: "2026-08-22T10:00:00.000Z",
   },
 ];

// Helper: Merge accounts safely avoiding duplicate IDs or usernames
export const mergeAccounts = (...accountLists: (UserAccount[] | null | undefined)[]): UserAccount[] => {
  const accountMap = new Map<string, UserAccount>();

  // 1. Seed with default demo accounts
  for (const acc of DEFAULT_ACCOUNTS) {
    if (acc && acc.id) {
      accountMap.set(acc.id, acc);
    }
  }

  // 2. Merge each account list preserving custom users and updates
  for (const list of accountLists) {
    if (!Array.isArray(list)) continue;
    for (const acc of list) {
      if (!acc || !acc.id || !acc.username) continue;
      const existing = accountMap.get(acc.id);
      if (existing) {
        accountMap.set(acc.id, { ...existing, ...acc });
      } else {
        // Also check if existing entry has same lowercase username
        const matchByUsername = Array.from(accountMap.values()).find(
          (u) => u.username && u.username.toLowerCase() === acc.username.toLowerCase()
        );
        if (matchByUsername) {
          accountMap.set(matchByUsername.id, { ...matchByUsername, ...acc });
        } else {
          accountMap.set(acc.id, acc);
        }
      }
    }
  }

  return Array.from(accountMap.values());
};

// Helper: Synchronous localStorage helpers for robust resilience
export const getLocalStoredAccounts = (): UserAccount[] => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_ACCOUNTS_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return mergeAccounts(DEFAULT_ACCOUNTS, parsed);
      }
    }
    // Check backwards migration keys
    for (const oldKey of ["atelier_registered_accounts_v3", "atelier_registered_accounts_v2", "atelier_registered_accounts"]) {
      const oldRaw = typeof localStorage !== "undefined" ? localStorage.getItem(oldKey) : null;
      if (oldRaw) {
        const oldParsed = JSON.parse(oldRaw);
        if (Array.isArray(oldParsed) && oldParsed.length > 0) {
          return mergeAccounts(DEFAULT_ACCOUNTS, oldParsed);
        }
      }
    }
  } catch (e) {}
  return DEFAULT_ACCOUNTS;
};

export const setLocalStoredAccounts = (accounts: UserAccount[]) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
    }
  } catch (e) {}
};

export const getLocalActiveUserId = (): string | null => {
  try {
    if (typeof localStorage === "undefined") return null;
    const id = localStorage.getItem(STORAGE_ACTIVE_USER_ID_KEY);
    return id && id !== "guest_user" && id !== "null" && id !== "" ? id : null;
  } catch (e) {
    return null;
  }
};

export const setLocalActiveUserId = (userId: string | null) => {
  try {
    if (typeof localStorage === "undefined") return;
    if (userId && userId !== "guest_user" && userId !== "null") {
      localStorage.setItem(STORAGE_ACTIVE_USER_ID_KEY, userId);
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_USER_ID_KEY);
    }
  } catch (e) {}
};

export type ActivePanel =
  | "ai-create"
  | "ai-retouch"
  | "templates"
  | "ai-stylize"
  | "album"
  | "media"
  | "text"
  | "shapes"
  | "stickers"
  | "background"
  | "layers";

export type AuthTab = "login" | "register" | "profile" | "changePassword";

export type StudioView = "home" | "studio";

export type ThemeMode = "dark" | "light";

export const STORAGE_CREATIVE_HISTORY_KEY = "atelier_creative_history_v3";
export const STORAGE_CREATIVE_ACTIVE_CHAT_KEY = "atelier_creative_active_chat_v1";

// 说明：创作工作台不再内置任何示例会话/示例样片，历史记录只展示用户真实生成结果。
export const LEGACY_SEED_SESSION_IDS = ["creative_seed_001"];

const stripDemoArtifacts = (list: CreativeSessionItem[]): CreativeSessionItem[] =>
  list
    .filter((item) => !!item && !LEGACY_SEED_SESSION_IDS.includes(item.id))
    .map((item) => ({
      ...item,
      images: (item.images || []).filter((src) => !String(src).includes("/creative-samples/")),
      // 刷新/关闭页面会中断进行中的请求：把残留的 generating 会话落为可重试的失败态，
      // 避免出现永远转圈、计时器恒为 0s 的假运行状态。
      ...(item.status === "generating"
        ? { status: "error" as const, errorMessage: "生成过程中页面被刷新或关闭，请点击重试" }
        : {}),
    }))
    .filter((item) => item.status !== "success" || item.images.length > 0);

export const getStoredCreativeHistory = (): CreativeSessionItem[] => {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw =
      localStorage.getItem(STORAGE_CREATIVE_HISTORY_KEY) ||
      localStorage.getItem("atelier_creative_history_v2");
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return stripDemoArtifacts(list);
      }
    }
  } catch (e) {}
  return [];
};

export const setStoredCreativeHistory = (list: CreativeSessionItem[]) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_CREATIVE_HISTORY_KEY, JSON.stringify(list));
    }
  } catch (e) {}
};

export const setStoredCreativeActiveChatId = (id: string | null) => {
  try {
    if (typeof localStorage !== "undefined") {
      // 空字符串 = 明确处于「新建聊天」状态，避免刷新后又挂回上一条记录
      localStorage.setItem(STORAGE_CREATIVE_ACTIVE_CHAT_KEY, id || "");
    }
  } catch (e) {}
};

const getLatestCreativeChatId = (list: CreativeSessionItem[]): string | null => {
  const last = list[list.length - 1];
  return last ? last.sessionId || last.id : null;
};

/**
 * 读取当前所在聊天：
 * - 有显式保存过的状态就沿用（含「新建聊天」的空态）
 * - 否则续在历史里最近一次聊天上，保证「同一聊天多次生成 = 一条历史记录」
 * - 保存的会话已经被删除/清理时，回退到最近一次聊天
 */
export const getStoredCreativeActiveChatId = (
  history: CreativeSessionItem[]
): string | null => {
  const fallback = getLatestCreativeChatId(history);
  try {
    if (typeof localStorage === "undefined") return fallback;
    const raw = localStorage.getItem(STORAGE_CREATIVE_ACTIVE_CHAT_KEY);
    if (raw === null) return fallback;
    if (raw === "") return null;
    const exists = history.some((item) => (item.sessionId || item.id) === raw);
    return exists ? raw : fallback;
  } catch (e) {
    return fallback;
  }
};

const initialCreativeHistory = getStoredCreativeHistory();

export const createCreativeFallbackArtwork = async (
  prompt: string,
  aspectRatio: string,
  variantIndex: number = 0
): Promise<string> => {
  let width = 1280;
  let height = 720;
  if (aspectRatio === "3:4") { width = 900; height = 1200; }
  else if (aspectRatio === "4:3") { width = 1200; height = 900; }
  else if (aspectRatio === "9:16") { width = 720; height = 1280; }
  else if (aspectRatio === "1:1") { width = 1024; height = 1024; }

  // 注意：此处不得再返回任何"示例截图/预制样片"，避免真实模型输出被占位图替换。

  const warmColor = variantIndex % 2 === 0 ? "#E08B3E" : "#D46B2C";
  const coolColor = variantIndex % 2 === 0 ? "#4A7C9B" : "#2E5C8A";
  const darkBg = "#0E1116";
  const cleanPrompt = prompt.replace(/[<>&"]/g, " ").slice(0, 100);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <radialGradient id="warm_glow_${variantIndex}" cx="28%" cy="65%" r="45%">
        <stop offset="0%" stop-color="${warmColor}" stop-opacity="0.95"/>
        <stop offset="45%" stop-color="#73381B" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${darkBg}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="cool_glow_${variantIndex}" cx="75%" cy="32%" r="50%">
        <stop offset="0%" stop-color="${coolColor}" stop-opacity="0.85"/>
        <stop offset="50%" stop-color="#1B2D3D" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="${darkBg}" stop-opacity="0"/>
      </radialGradient>
      <filter id="blur_${variantIndex}">
        <feGaussianBlur stdDeviation="32"/>
      </filter>
      <linearGradient id="win_grad_${variantIndex}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#8BBEE8" stop-opacity="0.08"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="${darkBg}"/>
    <rect width="${width}" height="${height}" fill="url(#cool_glow_${variantIndex})"/>
    <rect width="${width}" height="${height}" fill="url(#warm_glow_${variantIndex})"/>
    <g opacity="0.75">
      <rect x="${width * 0.55}" y="${height * 0.08}" width="${width * 0.4}" height="${height * 0.42}" rx="8" fill="url(#win_grad_${variantIndex})" stroke="#8BBEE8" stroke-width="2"/>
      <line x1="${width * 0.65}" y1="${height * 0.08}" x2="${width * 0.65}" y2="${height * 0.5}" stroke="#8BBEE8" stroke-width="1.5" opacity="0.6"/>
      <line x1="${width * 0.75}" y1="${height * 0.08}" x2="${width * 0.75}" y2="${height * 0.5}" stroke="#8BBEE8" stroke-width="1.5" opacity="0.6"/>
      <line x1="${width * 0.85}" y1="${height * 0.08}" x2="${width * 0.85}" y2="${height * 0.5}" stroke="#8BBEE8" stroke-width="1.5" opacity="0.6"/>
    </g>
    <ellipse cx="${width * 0.28}" cy="${height * 0.75}" rx="${width * 0.22}" ry="${height * 0.14}" fill="#FFAA44" opacity="0.35" filter="url(#blur_${variantIndex})"/>
    <circle cx="${width * 0.26}" cy="${height * 0.62}" r="${width * 0.035}" fill="#FFF4D0" opacity="0.9" filter="url(#blur_${variantIndex})"/>
    <circle cx="${width * 0.26}" cy="${height * 0.62}" r="${width * 0.015}" fill="#FFFFFF"/>
    <path d="M0 ${height * 0.5} Q${width * 0.5} ${height * 0.45} ${width} ${height * 0.55} L${width} ${height} L0 ${height} Z" fill="#0A0C10" opacity="0.65"/>
    <text x="40" y="${height - 64}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#E2D1BA" letter-spacing="2">MARGINLAB IMAGE WORKSHOP • CINEMATIC CHIAROSCURO</text>
    <text x="40" y="${height - 38}" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#9CA3AF">${cleanPrompt}...</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const STORAGE_THEME_KEY = "atelier_theme_mode_v7";
export const getStoredTheme = (): ThemeMode => {
  // 工作台统一为纯白极简视觉，恒定浅色
  return "light";
};

export const applyThemeClass = (mode: ThemeMode) => {
  if (typeof document !== "undefined") {
    if (mode === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    }
  }
};

const STORAGE_VIEW_KEY = "atelier_current_view_v4";
const STORAGE_ACTIVE_PANEL_KEY = "atelier_active_panel_v4";

export const getStoredView = (): StudioView => {
  try {
    if (typeof localStorage === "undefined") return "home";
    const activeId = getLocalActiveUserId();
    const accounts = getLocalStoredAccounts();
    const activeUser = activeId ? accounts.find((a) => a.id === activeId && a.status !== "banned") : null;
    if (!activeUser) return "home";

    const explicitView = localStorage.getItem(STORAGE_VIEW_KEY) as StudioView | null;
    return explicitView === "home" ? "home" : "studio";
  } catch (e) {
    return "home";
  }
};

export const setStoredView = (view: StudioView) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_VIEW_KEY, view);
    }
  } catch (e) {}
};

export const getStoredActivePanel = (): ActivePanel => {
  try {
    if (typeof localStorage === "undefined") return "ai-retouch";
    const p = localStorage.getItem(STORAGE_ACTIVE_PANEL_KEY) as ActivePanel | null;
    if (p && ["ai-create", "ai-retouch", "ai-stylize", "album", "templates", "media", "text", "shapes", "stickers", "background", "layers"].includes(p)) {
      return p;
    }
  } catch (e) {}
  return "ai-retouch";
};

export const setStoredActivePanel = (panel: ActivePanel) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_ACTIVE_PANEL_KEY, panel);
    }
  } catch (e) {}
};

export const getInitialViewState = (): {
  currentView: StudioView;
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
} => {
  try {
    const activeId = getLocalActiveUserId();
    const accounts = getLocalStoredAccounts();
    if (activeId) {
      const activeUser = accounts.find((a) => a.id === activeId && a.status !== "banned") || null;
      if (activeUser) {
        const view = getStoredView();
        return {
          currentUser: activeUser,
          isAuthenticated: true,
          currentView: view,
        };
      }
    }
  } catch (e) {}
  return {
    currentUser: null,
    isAuthenticated: false,
    currentView: "home" as StudioView,
  };
};


export interface EditorState {
  // Navigation View (Home Landing Page vs Studio Workspace)
  currentView: StudioView;
  setCurrentView: (view: StudioView) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  enterAsGuest: () => void;
  // Authentication & Multi-user state
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  userAccounts: UserAccount[];
  authModalOpen: boolean;
  authModalTab: AuthTab;
  userAccountModalOpen: boolean; // Alias for backward compatibility
  setUserAccountModalOpen: (open: boolean, tab?: AuthTab) => void;
  setAuthModalOpen: (open: boolean, tab?: AuthTab) => void;

  // Real Auth Actions (Login / Register / Logout / Profile)
  login: (username: string, password: string) => Promise<{ success: boolean; message: string; user?: UserAccount }>;
  register: (data: {
    username?: string;
    password: string;
    name?: string;
    avatar?: string;
    role?: string;
    bio?: string;
    email?: string;
    code?: string;
  }) => Promise<{ success: boolean; message: string; user?: UserAccount }>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserAccount>) => Promise<{ success: boolean; message: string }>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  deleteUserAccount: (userId: string) => Promise<{ success: boolean; message: string }>;
  switchUserAccount: (userId: string) => Promise<void>;
  createUserAccount: (name: string, role?: string, avatar?: string, bio?: string, themeColor?: string) => Promise<UserAccount>;

  // User uploaded media assets (Isolated per user)
  mediaAssets: UserMediaAsset[];
  addMediaAssets: (
    items: { name: string; src: string; width: number; height: number; aspectRatio?: number; sizeBytes?: number; category?: "upload" | "generated" }[]
  ) => Promise<UserMediaAsset[]>;
  deleteMediaAsset: (assetId: string) => Promise<void>;
  clearAllMediaAssets: () => Promise<void>;
  fetchUserMedia: () => Promise<void>;

  // Document data
  document: CollageDocument;
  currentProjectId: string | null;
  isDirty: boolean;
  lastSavedTime: string | null;
  savedProjects: SavedProject[];
  customTemplates: CustomTemplate[];

  selectedIds: string[];
  hoveredId: string | null;
  editingCropId: string | null;

  // Viewport & Canvas
  zoom: number;
  pan: { x: number; y: number };
  isPanning: boolean;
  guides: AlignmentGuide[];
  showGrid: boolean;
  gridSize: number;
  snapToGrid: boolean;
  snapToObjects: boolean;

  // Zine Product navigation and state
  zineTab: "home" | "create" | "history" | "profile" | "notifications";
  setZineTab: (tab: "home" | "create" | "history" | "profile" | "notifications") => void;
  isZineDrawerOpen: boolean;
  setIsZineDrawerOpen: (open: boolean) => void;
  userCredits: number;
  setUserCredits: (credits: number) => void;

  // UI State
  activePanel: ActivePanel;
  isExporting: boolean;
  exportModalOpen: boolean;
  presetModalOpen: boolean;
  shortcutModalOpen: boolean;
  autoLayoutModalOpen: boolean;
  projectModalOpen: boolean;
  saveTemplateModalOpen: boolean;
  watermarkModalOpen: boolean;

  // History
  past: CollageDocument[];
  future: CollageDocument[];

  // Actions
  setDocument: (doc: CollageDocument, pushToHistory?: boolean) => void;
  updateCanvas: (settings: Partial<CanvasSettings>, autoReflowContent?: boolean) => void;
  addElement: (element: NewElementData) => string;
  updateElement: (id: string, updates: Partial<CollageElement>, pushToHistory?: boolean) => void;
  updateElements: (updates: { id: string; updates: Partial<CollageElement> }[], pushToHistory?: boolean) => void;
  deleteElements: (ids?: string[]) => void;
  duplicateElements: (ids?: string[]) => void;
  selectElements: (ids: string[]) => void;
  toggleSelectElement: (id: string, multi?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setHoveredId: (id: string | null) => void;
  setEditingCropId: (id: string | null) => void;

  // Z-Index & Hierarchy
  reorderElement: (id: string, action: "front" | "back" | "forward" | "backward") => void;
  toggleLock: (id: string) => void;
  toggleVisibility: (id: string) => void;

  // Alignment & Layout
  alignElements: (
    direction: "left" | "center" | "right" | "top" | "middle" | "bottom" | "distribute-h" | "distribute-v"
  ) => void;
  applyAutoLayout: (
    type: "grid" | "hero-asymmetric" | "polaroid-scatter" | "triptych-column" | "film-strip"
  ) => void;
  reflowContentToCanvas: (oldW: number, oldH: number, newW: number, newH: number) => void;

  // Viewport
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  setPan: (pan: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => void;
  setIsPanning: (isPanning: boolean) => void;
  setGuides: (guides: AlignmentGuide[]) => void;
  clearGuides: () => void;
  toggleGrid: () => void;

  // Modals & Panels
  setActivePanel: (panel: ActivePanel) => void;
  setExportModalOpen: (open: boolean) => void;
  setPresetModalOpen: (open: boolean) => void;
  setShortcutModalOpen: (open: boolean) => void;
  setAutoLayoutModalOpen: (open: boolean) => void;
  setProjectModalOpen: (open: boolean) => void;
  setSaveTemplateModalOpen: (open: boolean) => void;
  setWatermarkModalOpen: (open: boolean) => void;
  replacePhotoModalOpen: boolean;
  replaceTargetElementId: string | null;
  openReplacePhotoModal: (elementId?: string) => void;
  closeReplacePhotoModal: () => void;
  replaceElementImage: (elementId: string, src: string, name?: string, naturalWidth?: number, naturalHeight?: number) => void;
  setIsExporting: (exporting: boolean) => void;

  // Templates & New Project
  loadTemplate: (templateId: string, adaptToCurrentCanvas?: boolean) => void;
  createNewProject: (presetId?: string) => void;

  // Project Persistence & Custom Templates
  saveCurrentProject: (customName?: string) => Promise<SavedProject>;

   // AI Stylize & Model Integration
   aiSettingsModalOpen: boolean;
   setAiSettingsModalOpen: (open: boolean) => void;
   aiStylizeModalOpen: boolean;
   aiStylizeTargetElementId: string | null;
   openAiStylizeModal: (sourceImage?: string, targetElementId?: string) => void;
   closeAiStylizeModal: () => void;

   // Admin System Management
   adminModalOpen: boolean;
   adminModalTab: "users" | "ai_config" | "styles" | "filing" | "email";
   setAdminModalOpen: (open: boolean, tab?: "users" | "ai_config" | "styles" | "filing" | "email") => void;
   publicEmailConfig: PublicEmailConfig;
   fetchPublicEmailConfig: () => Promise<PublicEmailConfig | null>;
   sendVerificationCode: (email: string, type?: "register" | "reset") => Promise<{ success: boolean; message: string; needConfig?: boolean }>;
   adminEmailConfig: EmailConfig | null;
   fetchAdminEmailConfig: () => Promise<EmailConfig | null>;
   saveAdminEmailConfig: (cfg: Partial<EmailConfig>) => Promise<{ success: boolean; message: string; config?: EmailConfig }>;
   testAdminEmailConfig: (data: { targetEmail: string; [key: string]: any }) => Promise<{ success: boolean; message: string }>;
   aiStyles: StylePreset[];
   fetchAiStyles: (all?: boolean) => Promise<StylePreset[]>;
   adminSaveAiStyle: (style: Partial<StylePreset> & { id: string }) => Promise<{ success: boolean; message: string; styles?: StylePreset[] }>;
   adminToggleAiStyle: (styleId: string, enabled: boolean) => Promise<{ success: boolean; message: string; styles?: StylePreset[] }>;
   adminDeleteAiStyle: (styleId: string) => Promise<{ success: boolean; message: string; styles?: StylePreset[] }>;
   adminResetAiStyles: () => Promise<{ success: boolean; message: string; styles?: StylePreset[] }>;
   adminUsersList: UserAccount[];
   adminStats: {
     total: number;
     activeCount: number;
     bannedCount: number;
     adminCount: number;
   };
   fetchAdminUsers: () => Promise<UserAccount[]>;
   adminSetUserStatus: (targetUserId: string, status: "active" | "banned") => Promise<{ success: boolean; message: string }>;
   adminSetUserRole: (targetUserId: string, role: string, isAdmin: boolean) => Promise<{ success: boolean; message: string }>;
   adminResetPassword: (targetUserId: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
   adminCreateUser: (userData: {
     username: string;
     password: string;
     name?: string;
     avatar?: string;
     role?: string;
     bio?: string;
     email?: string;
     isAdmin?: boolean;
   }) => Promise<{ success: boolean; message: string; user?: UserAccount }>;
   adminDeleteUser: (targetUserId: string) => Promise<{ success: boolean; message: string }>;

   aiConfig: AiConfig | null;
   aiConfigLoading: boolean;
   siteFilingConfig: SiteFilingConfig;
   siteFilingSaving: boolean;
   selectedAiStyleId: string;
   setSelectedAiStyleId: (id: string) => void;
  selectedAiAspectRatio: "3:4" | "4:3" | "16:9" | "9:16" | "1:1";
  setSelectedAiAspectRatio: (ratio: "3:4" | "4:3" | "16:9" | "9:16" | "1:1") => void;
   aiSourceImage: string | null;
   setAiSourceImage: (src: string | null) => void;
   latestAiGeneratedImage: string | null;
   setLatestAiGeneratedImage: (img: string | null) => void;
   isGeneratingAi: boolean;
   aiHistory: GenerationTask[];
   aiQueue: GenerationQueueTask[];
   isQueueRunning: boolean;
   activeQueueTaskId: string | null;
   addToAiQueue: (task: Omit<GenerationQueueTask, "id" | "status" | "progress" | "stageText" | "createdAt">) => string;
   addBatchToAiQueue: (tasks: Array<Omit<GenerationQueueTask, "id" | "status" | "progress" | "stageText" | "createdAt">>) => void;
   processNextQueueTask: () => Promise<void>;
   retryQueueTask: (taskId: string) => void;
   removeQueueTask: (taskId: string) => void;
   clearCompletedQueue: () => void;
   styleWorkspaces: Record<string, StyleWorkspaceState>;
   setStyleWorkspace: (styleId: string, partial: Partial<StyleWorkspaceState>) => void;
   loadTaskToWorkbench: (task: {
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

   fetchAiConfig: () => Promise<AiConfig | null>;
   fetchSiteFilingConfig: () => Promise<SiteFilingConfig | null>;
   saveSiteFilingConfig: (config: Partial<SiteFilingConfig>) => Promise<{ success: boolean; message: string; config?: SiteFilingConfig }>;
   saveAiConfig: (config: Partial<AiConfig>) => Promise<{ success: boolean; message: string; config?: AiConfig }>;
   testAiConfig: () => Promise<{ success: boolean; message: string }>;
   fetchAiModels: (params?: { baseUrl?: string; apiKey?: string }) => Promise<{ success: boolean; message: string; models?: string[]; count?: number }>;
   fetchAiHistory: (explicitUserId?: string) => Promise<void>;
   deleteAiHistoryItem: (id: string) => Promise<void>;
   generateAiImage: (params?: {
     styleId?: string;
     customNotes?: string;
     mood?: string;
     includeText?: boolean;
     specifiedText?: string;
     sourceImage?: string;
     aspectRatio?: string;
   }) => Promise<{ success: boolean; message: string; image?: string; task?: GenerationTask; needsConfig?: boolean }>;
   applyStylizedImageToCanvas: (
     imageUrl: string,
     mode?: "add" | "replace" | "template",
     targetElementId?: string
   ) => Promise<void>;
   saveAsNewProject: (name: string) => Promise<SavedProject>;
   saveAsCustomTemplate: (name: string, description?: string, category?: string) => Promise<CustomTemplate>;
   loadSavedProject: (projectId: string) => Promise<void>;
   duplicateSavedProject: (projectId: string) => Promise<SavedProject | null>;
   renameSavedProject: (projectId: string, newName: string) => Promise<void>;
   deleteSavedProject: (projectId: string) => Promise<void>;
   deleteCustomTemplate: (templateId: string) => Promise<void>;
   exportProjectFile: () => void;
   importProjectFile: (file: File) => Promise<boolean>;

   // Album & Photobook Management
   albums: Album[];
   currentAlbumId: string;
   currentSpreadIndex: number;
   albumModalOpen: boolean;
   setCurrentSpreadIndex: (index: number) => void;
   setAlbumModalOpen: (open: boolean) => void;
   setCurrentAlbumId: (id: string) => void;
   addSpreadToAlbum: (albumId: string, spread: AlbumSpreadPage) => void;
   deleteSpreadFromAlbum: (albumId: string, spreadIndex: number) => void;
   updateAlbumTitle: (albumId: string, title: string) => void;
   updateAlbumTheme: (albumId: string, theme: AlbumTheme) => void;
   updateAlbumCover: (albumId: string, data: { coverImage?: string; title?: string; subtitle?: string; description?: string; author?: string; theme?: AlbumTheme; coverConfig?: AlbumCoverConfig }) => void;
   updateAlbumBackCover: (albumId: string, data: AlbumBackCover) => void;
   updateAlbumPage: (albumId: string, spreadIndex: number, side: "left" | "right", data: Partial<AlbumPageSide>) => void;
   updateSpread: (albumId: string, spreadIndex: number, data: Partial<AlbumSpreadPage>) => void;
   duplicateSpread: (albumId: string, spreadIndex: number) => void;
   createNewAlbum: (title?: string) => string;
   addTemplateToAlbum: (albumId: string, templateId: string, title?: string) => void;
   addAssetsToAlbum: (albumId: string, assetUrls: string[], layout?: AlbumPageLayout, title?: string) => void;
   saveCanvasToAlbum: (albumId?: string) => Promise<boolean>;

   // Creative Studio
   creativeHistory: CreativeSessionItem[];
   creativePromptDraft: string;
   creativeAspectRatio: string;
   creativeCount: number;
   creativeReferenceImage: string | null;
   isGeneratingCreative: boolean;
   creativeSelectedSessionId: string | null;
   /** 当前正在对话的聊天会话 id；为空时下一次生成会开一个新会话 */
   creativeActiveChatId: string | null;
   setCreativePromptDraft: (draft: string) => void;
   setCreativeAspectRatio: (ratio: string) => void;
   setCreativeCount: (count: number) => void;
   setCreativeReferenceImage: (img: string | null) => void;
   reapplyCreativeSession: (item: CreativeSessionItem) => void;
   deleteCreativeSession: (id: string) => void;
   clearCreativeHistory: () => void;
   createNewCreativeSession: () => void;
   submitCreativeGeneration: () => Promise<void>;

   // History Undo / Redo
   undo: () => void;
   redo: () => void;
   canUndo: () => boolean;
   canRedo: () => boolean;

   // Storage
   saveToStorage: () => Promise<void>;
   loadFromStorage: () => Promise<boolean>;
}

let saveStorageTimeout: ReturnType<typeof setTimeout> | null = null;
export const debouncedSaveToStorage = () => {
  if (saveStorageTimeout) {
    clearTimeout(saveStorageTimeout);
  }
  saveStorageTimeout = setTimeout(() => {
    saveStorageTimeout = null;
    useEditorStore.getState().saveToStorage();
  }, 600);
};

// Initial default template: standard Mijia 6-inch vertical (1181 x 1748)
const rawInitialDoc = TEMPLATES[0].createDocument(1181, 1748);
const initialDoc: CollageDocument = {
  ...rawInitialDoc,
  canvas: {
    ...rawInitialDoc.canvas,
    width: 1181,
    height: 1748,
    presetName: "米家 6 寸相纸 (竖版)",
  },
};
const initialViewState = getInitialViewState();
const initialActivePanel = getStoredActivePanel();

export const useEditorStore = create<EditorState>((setStore, getStore) => {
  const pushSnapshot = (currentDoc: CollageDocument) => {
    const { past } = getStore();
    const newPast = [...past.slice(-30), JSON.parse(JSON.stringify(currentDoc))];
    return { past: newPast, future: [], isDirty: true };
  };

  return {
    // Navigation & Multi-user initial state (Synchronously restores logged-in session on F5 refresh)
    currentView: initialViewState.currentView,
    themeMode: getStoredTheme(),
    currentUser: initialViewState.currentUser,
    isAuthenticated: initialViewState.isAuthenticated,
    userAccounts: getLocalStoredAccounts(),
    authModalOpen: false,
    authModalTab: "login",
    userAccountModalOpen: false,
    mediaAssets: [],

    document: initialDoc,
    currentProjectId: null,
    isDirty: false,
    lastSavedTime: null,
    savedProjects: [],
    customTemplates: [],

    selectedIds: [],
    hoveredId: null,
    editingCropId: null,

    zoom: 0.55,
    pan: { x: 0, y: 0 },
    isPanning: false,
    guides: [],
    showGrid: false,
    gridSize: 20,
    snapToGrid: true,
    snapToObjects: true,

    zineTab: "create",
    setZineTab: (tab) => setStore({ zineTab: tab }),
    isZineDrawerOpen: true,
    setIsZineDrawerOpen: (open) => setStore({ isZineDrawerOpen: open }),
    userCredits: 10,
    setUserCredits: (credits) => setStore({ userCredits: credits }),
    activePanel: initialActivePanel,
    isExporting: false,
    exportModalOpen: false,
    presetModalOpen: false,
    shortcutModalOpen: false,
    autoLayoutModalOpen: false,
    projectModalOpen: false,
    saveTemplateModalOpen: false,
    watermarkModalOpen: false,
    replacePhotoModalOpen: false,
    replaceTargetElementId: null,

    // AI Stylize Modal Initial State
    aiSettingsModalOpen: false,
    setAiSettingsModalOpen: (open) => setStore({ aiSettingsModalOpen: open }),
    aiStylizeModalOpen: false,
    aiStylizeTargetElementId: null,
    openAiStylizeModal: (sourceImage, targetElementId) =>
      setStore({
        aiStylizeModalOpen: true,
        aiStylizeTargetElementId: targetElementId || null,
        ...(sourceImage ? { aiSourceImage: sourceImage } : {}),
      }),
    closeAiStylizeModal: () => setStore({ aiStylizeModalOpen: false, aiStylizeTargetElementId: null }),

    // Album & Photobook State
    albums: getStoredAlbums(),
    currentAlbumId: 'album_jiuzhaigou',
    currentSpreadIndex: -1,
    albumModalOpen: false,
    setCurrentSpreadIndex: (index) => setStore({ currentSpreadIndex: index }),
    setAlbumModalOpen: (open) => setStore({ albumModalOpen: open, ...(open ? { currentSpreadIndex: -1 } : {}) }),
    setCurrentAlbumId: (id) => setStore({ currentAlbumId: id }),

    addSpreadToAlbum: (albumId, spread) => {
      const { albums } = getStore();
      const updated = albums.map((a) => {
        if (a.id !== albumId) return a;
        return {
          ...a,
          spreads: [...a.spreads, spread],
          updatedAt: Date.now(),
        };
      });
      saveStoredAlbums(updated);
      setStore({ albums: updated });
    },

    deleteSpreadFromAlbum: (albumId, spreadIndex) => {
      const { albums } = getStore();
      const updated = albums.map((a) => {
        if (a.id !== albumId) return a;
        const newSpreads = a.spreads.filter((_, i) => i !== spreadIndex);
        return {
          ...a,
          spreads: newSpreads,
          updatedAt: Date.now(),
        };
      });
      saveStoredAlbums(updated);
      setStore({ albums: updated });
    },

    updateAlbumTitle: (albumId, title) => {
      const { albums } = getStore();
      const updated = albums.map((a) => {
        if (a.id !== albumId) return a;
        return {
          ...a,
          title: title.trim() || '未命名画册',
          updatedAt: Date.now(),
        };
      });
      saveStoredAlbums(updated);
      setStore({ albums: updated });
    },

    updateAlbumTheme: (albumId, theme) => {
      const { albums } = getStore();
      const updated = albums.map((a) => {
        if (a.id !== albumId) return a;
        return {
          ...a,
          theme,
          updatedAt: Date.now(),
        };
      });
      saveStoredAlbums(updated);
      setStore({ albums: updated });
    },

    updateAlbumCover: (albumId, data) => {
      const { albums } = getStore();
      const updated = albums.map((a) => {
        if (a.id !== albumId) return a;
        return {
          ...a,
          ...(data.coverImage !== undefined ? { coverImage: data.coverImage } : {}),
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.subtitle !== undefined ? { subtitle: data.subtitle } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.author !== undefined ? { author: data.author } : {}),
          ...(data.theme !== undefined ? { theme: data.theme } : {}),
          ...(data.coverConfig !== undefined ? { coverConfig: { ...(a.coverConfig || {}), ...data.coverConfig } } : {}),
          updatedAt: Date.now(),
        };
      });
      saveStoredAlbums(updated);
      setStore({ albums: updated });
    },

    updateAlbumBackCover: (albumId, data) => {
      const { albums } = getStore();
      const updated = albums.map((a) => {
        if (a.id !== albumId) return a;
        return {
          ...a,
          backCover: {
            ...a.backCover,
            ...data,
          },
          updatedAt: Date.now(),
        };
      });
      saveStoredAlbums(updated);
      setStore({ albums: updated });
    },

    updateAlbumPage: (albumId, spreadIndex, side, data) => {
      const { albums } = getStore();
      const updated = albums.map((a) => {
        if (a.id !== albumId) return a;
        const newSpreads = a.spreads.map((sp, i) => {
          if (i !== spreadIndex) return sp;
          const pageKey = side === "left" ? "leftPage" : "rightPage";
          return {
            ...sp,
            fullSpreadImage: undefined, // 用户自定义单页时，清除双联大图覆盖
            [pageKey]: {
              ...sp[pageKey],
              ...data,
            },
          };
        });
        return {
          ...a,
          spreads: newSpreads,
          updatedAt: Date.now(),
        };
      });
      saveStoredAlbums(updated);
      setStore({ albums: updated });
    },

    updateSpread: (albumId, spreadIndex, data) => {
      const { albums } = getStore();
      const updated = albums.map((a) => {
        if (a.id !== albumId) return a;
        const newSpreads = a.spreads.map((sp, i) => {
          if (i !== spreadIndex) return sp;
          return {
            ...sp,
            ...data,
          };
        });
        return {
          ...a,
          spreads: newSpreads,
          updatedAt: Date.now(),
        };
      });
      saveStoredAlbums(updated);
      setStore({ albums: updated });
    },

    duplicateSpread: (albumId, spreadIndex) => {
      const { albums } = getStore();
      const updated = albums.map((a) => {
        if (a.id !== albumId) return a;
        const target = a.spreads[spreadIndex];
        if (!target) return a;
        const newId = generateId();
        const clone: AlbumSpreadPage = {
          ...target,
          id: `sp_${newId}`,
          title: `${target.title || "对开"} (副本)`,
          leftPage: {
            ...target.leftPage,
            id: `p_${newId}_l`,
          },
          rightPage: {
            ...target.rightPage,
            id: `p_${newId}_r`,
          },
          createdAt: Date.now(),
        };
        const newSpreads = [...a.spreads];
        newSpreads.splice(spreadIndex + 1, 0, clone);
        return {
          ...a,
          spreads: newSpreads,
          updatedAt: Date.now(),
        };
      });
      saveStoredAlbums(updated);
      setStore({ albums: updated });
    },

    createNewAlbum: (title) => {
      const { albums } = getStore();
      const newId = 'album_' + generateId();
      const newAlbum: Album = {
        id: newId,
        title: title?.trim() || '我的高定艺术画册',
        description: '记录灵感、拼图与生活视觉印记',
        coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
        theme: 'indigo',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        spreads: [],
      };
      const updated = [newAlbum, ...albums];
      saveStoredAlbums(updated);
      setStore({ albums: updated, currentAlbumId: newId });
      return newId;
    },

    addTemplateToAlbum: (albumId, templateId, title) => {
      const spread = createSpreadFromTemplate(templateId, title);
      getStore().addSpreadToAlbum(albumId, spread);
    },

    addAssetsToAlbum: (albumId, assetUrls, layout, title) => {
      const spread = createSpreadFromAssets(assetUrls, layout, title);
      getStore().addSpreadToAlbum(albumId, spread);
    },

    saveCanvasToAlbum: async (albumId) => {
      try {
        const { document, albums, currentAlbumId } = getStore();
        const targetAlbumId = albumId || currentAlbumId || albums[0]?.id || 'album_jiuzhaigou';
        
        const thumb = await generateCanvasThumbnail(document);
        
        const pageId = generateId();
        const spread: AlbumSpreadPage = {
          id: 'sp_' + pageId,
          title: document.name || '画布排版作品',
          subtitle: '由 MarginLab 画布实时收录',
          leftPage: {
            id: 'p_' + pageId + '_l',
            image: thumb,
            title: document.name || '排版海报',
            caption: '来源于当前工作台画布',
            layoutType: 'full',
          },
          rightPage: {
            id: 'p_' + pageId + '_r',
            image: thumb,
            title: '作品留念与手札',
            caption: '画布完成时间：' + new Date().toLocaleDateString(),
            bodyText: '每一次创意构想，在此结集成册。',
            layoutType: 'journal',
          },
          sourceType: 'canvas',
          createdAt: Date.now(),
        };

        getStore().addSpreadToAlbum(targetAlbumId, spread);
        return true;
      } catch (e) {
        console.error('Failed to save canvas to album:', e);
        return false;
      }
    },

  // Admin System Management initial state & actions
     adminModalOpen: false,
     adminModalTab: "users",
     setAdminModalOpen: (open, tab) => {
       setStore({
         adminModalOpen: open,
         ...(tab ? { adminModalTab: tab } : {}),
       });
       if (open) {
         getStore().fetchAdminUsers();
         getStore().fetchAiConfig();
         getStore().fetchSiteFilingConfig();
         getStore().fetchAiStyles(true);
         getStore().fetchAdminEmailConfig();
       }
     },
     adminUsersList: [],
     adminStats: { total: 0, activeCount: 0, bannedCount: 0, adminCount: 0 },
 
     publicEmailConfig: {
       enabled: false,
       whitelistEnabled: true,
       whitelistDomains: [
         "gmail.com",
         "163.com",
         "126.com",
         "qq.com",
         "outlook.com",
         "hotmail.com",
         "foxmail.com",
         "sina.com",
         "139.com",
         "189.cn",
         "aliyun.com",
       ],
     },
     adminEmailConfig: null,

     fetchPublicEmailConfig: async () => {
       const cfg = await apiGetPublicEmailConfig();
       if (cfg) {
         setStore({ publicEmailConfig: cfg });
         return cfg;
       }
       return null;
     },

     sendVerificationCode: async (email: string, type: "register" | "reset" = "register") => {
       return await apiSendVerificationCode(email, type);
     },

     fetchAdminEmailConfig: async () => {
       const state = getStore();
       const adminId = state.currentUser?.id || "user_admin";
       const cfg = await apiGetEmailConfig(adminId);
       if (cfg) {
         setStore({ adminEmailConfig: cfg });
         return cfg;
       }
       return null;
     },

     saveAdminEmailConfig: async (cfg: Partial<EmailConfig>) => {
       const state = getStore();
       const adminId = state.currentUser?.id || "user_admin";
       const res = await apiSaveEmailConfig(adminId, cfg);
       if (res.success && res.config) {
         setStore({ adminEmailConfig: res.config });
         getStore().fetchPublicEmailConfig();
       }
       return res;
     },

     testAdminEmailConfig: async (data: { targetEmail: string; [key: string]: any }) => {
       const state = getStore();
       const adminId = state.currentUser?.id || "user_admin";
       return await apiTestEmailConfig(adminId, data);
     },

     fetchAdminUsers: async () => {
       const state = getStore();
       const adminId = state.currentUser?.id || (state.currentUser?.isAdmin ? "user_admin" : "user_admin");
       const res = await apiAdminGetUsers(adminId);
       if (res && res.success && Array.isArray(res.users)) {
         setStore({
           adminUsersList: res.users,
           adminStats: {
             total: res.total,
             activeCount: res.activeCount,
             bannedCount: res.bannedCount,
             adminCount: res.adminCount,
           },
         });
         return res.users;
       }
       return [];
     },
 
     adminSetUserStatus: async (targetUserId, status) => {
       const state = getStore();
       const adminId = state.currentUser?.id || "user_admin";
       const res = await apiAdminSetUserStatus(adminId, targetUserId, status);
       if (res.success) {
         await state.fetchAdminUsers();
         const accounts = await apiFetchAccounts();
         if (accounts) {
           setStore({ userAccounts: accounts });
         }
       }
       return res;
     },
 
     adminSetUserRole: async (targetUserId, role, isAdmin) => {
       const state = getStore();
       const adminId = state.currentUser?.id || "user_admin";
       const res = await apiAdminSetUserRole(adminId, targetUserId, role, isAdmin);
       if (res.success) {
         await state.fetchAdminUsers();
         const accounts = await apiFetchAccounts();
         if (accounts) {
           setStore({ userAccounts: accounts });
         }
       }
       return res;
     },
 
     adminResetPassword: async (targetUserId, newPassword) => {
       const state = getStore();
       const adminId = state.currentUser?.id || "user_admin";
       const res = await apiAdminResetPassword(adminId, targetUserId, newPassword);
       if (res.success) {
         await state.fetchAdminUsers();
       }
       return res;
     },
 
     adminCreateUser: async (userData) => {
       const state = getStore();
       const adminId = state.currentUser?.id || "user_admin";
       const res = await apiAdminCreateUser(adminId, userData);
       if (res.success) {
         await state.fetchAdminUsers();
         const accounts = await apiFetchAccounts();
         if (accounts) {
           setStore({ userAccounts: accounts });
         }
       }
       return res;
     },
 
     adminDeleteUser: async (targetUserId) => {
       const state = getStore();
       const adminId = state.currentUser?.id || "user_admin";
       const res = await apiAdminDeleteUser(adminId, targetUserId);
       if (res.success) {
         await state.fetchAdminUsers();
         const accounts = await apiFetchAccounts();
         if (accounts) {
           setStore({ userAccounts: accounts });
         }
       }
       return res;
     },
 
     aiConfig: null,
     aiConfigLoading: false,
     siteFilingConfig: { ...DEFAULT_SITE_FILING_CONFIG },
     siteFilingSaving: false,
     selectedAiStyleId: "retouch_01_dreamy_hair_light",
    selectedAiAspectRatio: "3:4",
    setSelectedAiAspectRatio: (ratio) => setStore({ selectedAiAspectRatio: ratio }),
     styleWorkspaces: {},
     setStyleWorkspace: (styleId, partial) =>
       setStore((state) => {
         const existing = state.styleWorkspaces[styleId] || { sourceImage: null, latestResult: null };
         const updated = {
           ...state.styleWorkspaces,
           [styleId]: { ...existing, ...partial },
         };
         const extraUpdates: any = {};
         if (state.selectedAiStyleId === styleId) {
           if (partial.sourceImage !== undefined) extraUpdates.aiSourceImage = partial.sourceImage;
           if (partial.latestResult !== undefined) extraUpdates.latestAiGeneratedImage = partial.latestResult;
         }
         return {
           styleWorkspaces: updated,
           ...extraUpdates,
         };
       }),

     loadTaskToWorkbench: (task) => {
       const { styleId, sourceImage, resultImage, resultUrl, aspectRatio, mood, specifiedText, includeText } = task;
       const finalResult = resultImage || resultUrl || null;
       const isRetouch = Boolean(styleId && String(styleId).startsWith("retouch_"));
       setStore((state) => {
         const existing = state.styleWorkspaces[styleId] || { sourceImage: null, latestResult: null };
         const finalSource = sourceImage || existing.sourceImage || state.aiSourceImage || null;
         const updated = {
           ...state.styleWorkspaces,
           [styleId]: {
             ...existing,
             sourceImage: finalSource,
             latestResult: finalResult || existing.latestResult || null,
             ...(aspectRatio ? { aspectRatio: aspectRatio as any } : {}),
             ...(mood !== undefined ? { mood } : {}),
             ...(specifiedText !== undefined ? { specifiedText } : {}),
             ...(includeText !== undefined ? { includeText } : {}),
           },
         };
        const validRatios = ["3:4", "4:3", "16:9", "9:16", "1:1"];
        const nextRatio = aspectRatio && validRatios.includes(aspectRatio)
          ? (aspectRatio as "3:4" | "4:3" | "16:9" | "9:16" | "1:1")
          : state.selectedAiAspectRatio;
         return {
           activePanel: isRetouch ? "ai-retouch" : "ai-stylize",
           selectedAiStyleId: styleId,
          selectedAiAspectRatio: nextRatio,
           aiSourceImage: finalSource,
           latestAiGeneratedImage: finalResult || existing.latestResult || null,
           styleWorkspaces: updated,
         };
       });
     },

     setSelectedAiStyleId: (id) =>
       setStore((state) => {
         if (state.selectedAiStyleId === id) return {};
         const currId = state.selectedAiStyleId;
         const currentWs = state.styleWorkspaces[currId] || { sourceImage: null, latestResult: null };
         const updatedWorkspaces = {
           ...state.styleWorkspaces,
           [currId]: {
             ...currentWs,
             sourceImage: state.aiSourceImage,
             latestResult: state.latestAiGeneratedImage,
           },
         };

         const targetWs = updatedWorkspaces[id];
         const preservedSourceImage = state.aiSourceImage || targetWs?.sourceImage || null;
         const preservedLatestResult =
           preservedSourceImage && targetWs?.sourceImage === preservedSourceImage
             ? (targetWs?.latestResult || null)
             : null;
         return {
           selectedAiStyleId: id,
           styleWorkspaces: updatedWorkspaces,
           aiSourceImage: preservedSourceImage,
           latestAiGeneratedImage: preservedLatestResult,
         };
       }),

     aiStyles: DEFAULT_AI_STYLES,
     aiSourceImage: null,
     setAiSourceImage: (src) =>
       setStore((state) => {
         const currId = state.selectedAiStyleId;
         const existingWs = state.styleWorkspaces[currId] || { sourceImage: null, latestResult: null };
         const updatedWorkspaces = {
           ...state.styleWorkspaces,
           [currId]: {
             ...existingWs,
             sourceImage: src,
             latestResult: null,
           },
         };
         return {
           aiSourceImage: src,
           latestAiGeneratedImage: null,
           styleWorkspaces: updatedWorkspaces,
         };
       }),

     latestAiGeneratedImage: null,
     setLatestAiGeneratedImage: (img) =>
       setStore((state) => {
         const currId = state.selectedAiStyleId;
         const existingWs = state.styleWorkspaces[currId] || { sourceImage: null, latestResult: null };
         return {
           latestAiGeneratedImage: img,
           styleWorkspaces: {
             ...state.styleWorkspaces,
             [currId]: {
               ...existingWs,
               latestResult: img,
             },
           },
         };
       }),

     isGeneratingAi: false,
     aiHistory: [],
     aiQueue: [],
     isQueueRunning: false,
     activeQueueTaskId: null,

     // Creative Studio initial state
     creativeHistory: initialCreativeHistory,
     creativePromptDraft: "",
     creativeAspectRatio: "16:9",
     creativeCount: 2,
     creativeReferenceImage: null,
     isGeneratingCreative: false,
     creativeSelectedSessionId: null,
     // 刷新后仍然续在最近一次聊天里：避免「同一个聊天再生成一次」被拆成新的历史记录
     creativeActiveChatId: getStoredCreativeActiveChatId(initialCreativeHistory),

     setCreativePromptDraft: (draft) => setStore({ creativePromptDraft: draft }),
     setCreativeAspectRatio: (ratio) => setStore({ creativeAspectRatio: ratio }),
     setCreativeCount: (count) => setStore({ creativeCount: count }),
     setCreativeReferenceImage: (img) => setStore({ creativeReferenceImage: img }),

     reapplyCreativeSession: (item) => {
       const chatId = item.sessionId || item.id;
       setStoredCreativeActiveChatId(chatId);
       setStore({
         creativePromptDraft: item.prompt,
         creativeAspectRatio: item.aspectRatio || "16:9",
         creativeCount: item.count || 2,
         creativeReferenceImage: item.referenceImage || null,
         creativeSelectedSessionId: item.id,
         // 续在该轮所属的聊天会话里，避免重发又变成一条新记录
         creativeActiveChatId: chatId,
       });
       setTimeout(() => {
         const inputEl = document.getElementById("creative-prompt-input") as HTMLTextAreaElement | null;
         if (inputEl) {
           inputEl.focus();
           inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
         }
       }, 100);
     },

     deleteCreativeSession: (id) => {
       const curr = getStore().creativeHistory;
       const updated = curr.filter((item) => item.id !== id);
       setStore({ creativeHistory: updated });
       setStoredCreativeHistory(updated);
       // 删掉的正好是当前所在聊天时，顺手把当前聊天切到剩下的最新一条，
       // 不要继续往一条已经不存在的会话里追加轮次。
       const activeId = getStore().creativeActiveChatId;
       const stillExists = !!activeId && updated.some((it) => (it.sessionId || it.id) === activeId);
       if (!stillExists) {
         const nextId = getLatestCreativeChatId(updated);
         setStoredCreativeActiveChatId(nextId);
         setStore({ creativeActiveChatId: nextId });
       }
     },

     clearCreativeHistory: () => {
       setStore({ creativeHistory: [] });
       setStoredCreativeHistory([]);
       setStoredCreativeActiveChatId(null);
       setStore({ creativeActiveChatId: null });
     },

     createNewCreativeSession: () => {
       setStoredCreativeActiveChatId(null);
       setStore({
         creativePromptDraft: "",
         creativeReferenceImage: null,
         creativeSelectedSessionId: null,
         // 清空当前会话：下一次生成才会开启新的一条历史记录
         creativeActiveChatId: null,
       });
       setTimeout(() => {
         const inputEl = document.getElementById("creative-prompt-input") as HTMLTextAreaElement | null;
         if (inputEl) {
           inputEl.focus();
           inputEl.scrollIntoView({ behavior: "smooth", block: "center" });
         }
       }, 50);
     },

     submitCreativeGeneration: async () => {
       const state = getStore();
       const prompt = state.creativePromptDraft.trim();
       if (!prompt || state.isGeneratingCreative) return;

       const count = state.creativeCount || 2;
       const ratio = state.creativeAspectRatio || "16:9";
       const refImg = state.creativeReferenceImage || undefined;
       const currentUser = state.currentUser;
       const userName = currentUser?.name || currentUser?.username || "danborad";

       // 同一个聊天里可以连续生成多次：复用当前会话 id，只有点了「新建聊天」
       // 才会开启新的会话，从而只产生一条新的历史记录。
       const chatId =
         state.creativeActiveChatId ||
         "chat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
       const roundIndex =
         state.creativeHistory.filter((it) => (it.sessionId || it.id) === chatId).length + 1;

       const newSession: CreativeSessionItem = {
         id: "creative_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
         sessionId: chatId,
         roundIndex,
         userId: currentUser?.id,
         userName: userName,
         prompt: prompt,
         aspectRatio: ratio,
         count: count,
         referenceImage: refImg,
         images: [],
         status: "generating",
         createdAt: Date.now(),
       };

       const updatedHistory = [...state.creativeHistory, newSession];
       setStoredCreativeActiveChatId(chatId);
       setStore({
         creativeHistory: updatedHistory,
         isGeneratingCreative: true,
         creativePromptDraft: "",
         // 发送之后清空参考图，避免下一轮又带着上一张参考继续跑
         creativeReferenceImage: null,
         creativeActiveChatId: chatId,
       });
       setStoredCreativeHistory(updatedHistory);

       try {
         // 直接调用内置图像大模型：真实出图约 30~60s，此处不做短超时竞速，
         // 也不再用任何占位/示例图片替代真实模型输出。
         const generateOne = async (index: number): Promise<string> => {
           const res = await apiGenerateStylizedImage({
             prompt: prompt + (count > 1 ? ` (第 ${index + 1} 张 · 独立构图镜位)` : ""),
             styleId: "custom_creative",
             styleName: "AI 自由创作",
             aspectRatio: ratio,
             sourceImage: refImg,
             userId: currentUser?.id,
           });
           if (res && res.success && (res.imageUrl || res.image)) {
             // 优先使用服务端落盘后的短 URL：历史记录因此可长期保留，
             // 不会因为 base64 体积撑爆 localStorage 而在刷新后丢失成片。
             return res.imageUrl || res.image!;
           }
           throw new Error(
             res?.message || "图像大模型未返回有效图片，请在「系统管理 → 全局 AI 图像大模型配置」检查模型服务"
           );
         };

         const generatedImages = await Promise.all(
           Array.from({ length: count }, (_, idx) => generateOne(idx))
         );

         const completedSession: CreativeSessionItem = {
           ...newSession,
           images: generatedImages,
           status: "success",
         };

         const finalHistory = getStore().creativeHistory.map((item) =>
           item.id === newSession.id ? completedSession : item
         );

         setStore({
           creativeHistory: finalHistory,
           isGeneratingCreative: false,
         });
         setStoredCreativeHistory(finalHistory);

         try {
           const mediaItems = generatedImages.map((src, idx) => ({
             name: `AI创作 · ${prompt.slice(0, 10)} (${idx + 1})`,
             src,
             width: ratio === "16:9" ? 1280 : 900,
             height: ratio === "16:9" ? 720 : 1200,
             category: "generated" as const,
             aspectRatio: ratio === "16:9" ? 16 / 9 : ratio === "3:4" ? 3 / 4 : ratio === "4:3" ? 4 / 3 : ratio === "9:16" ? 9 / 16 : 1,
           }));
           getStore().addMediaAssets(mediaItems).catch(() => {});
         } catch (e) {}
       } catch (err: any) {
         console.error("Creative generation error:", err);
         const failedSession: CreativeSessionItem = {
           ...newSession,
           status: "error",
           errorMessage: err?.message || "生图服务响应异常，请重试",
         };
         const finalHistory = getStore().creativeHistory.map((item) =>
           item.id === newSession.id ? failedSession : item
         );
         setStore({
           creativeHistory: finalHistory,
           isGeneratingCreative: false,
         });
         setStoredCreativeHistory(finalHistory);
       }
     },

     addToAiQueue: (taskData) => {
       const id = "task_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
       const newTask: GenerationQueueTask = {
         ...taskData,
         id,
         status: "pending",
         progress: 0,
         stageText: "等待处理...",
         createdAt: Date.now(),
       };
       const nextQueue = [...getStore().aiQueue, newTask];
       setStore({ aiQueue: nextQueue });
       set("atelier_ai_queue", nextQueue).catch(() => {});

       // Trigger queue processing in next tick
       setTimeout(() => {
         getStore().processNextQueueTask();
       }, 50);
       return id;
     },

     addBatchToAiQueue: (tasksData) => {
       const newTasks: GenerationQueueTask[] = tasksData.map((taskData, idx) => ({
         ...taskData,
         id: "task_" + (Date.now() + idx) + "_" + Math.random().toString(36).substring(2, 7),
         status: "pending",
         progress: 0,
         stageText: "等待处理...",
         createdAt: Date.now() + idx,
       }));
       const nextQueue = [...getStore().aiQueue, ...newTasks];
       setStore({ aiQueue: nextQueue });
       set("atelier_ai_queue", nextQueue).catch(() => {});

       setTimeout(() => {
         getStore().processNextQueueTask();
       }, 50);
     },

     retryQueueTask: (taskId: string) => {
       const nextQueue = getStore().aiQueue.map((t) =>
         t.id === taskId
           ? { ...t, status: "pending" as const, progress: 0, stageText: "重新排队中...", errorMessage: undefined }
           : t
       );
       setStore({ aiQueue: nextQueue });
       set("atelier_ai_queue", nextQueue).catch(() => {});

       setTimeout(() => {
         getStore().processNextQueueTask();
       }, 50);
     },

     removeQueueTask: (taskId: string) => {
       const nextQueue = getStore().aiQueue.filter((t) => t.id !== taskId);
       setStore({ aiQueue: nextQueue });
       set("atelier_ai_queue", nextQueue).catch(() => {});
     },

     clearCompletedQueue: () => {
       const nextQueue = getStore().aiQueue.filter((t) => t.status !== "success");
       setStore({ aiQueue: nextQueue });
       set("atelier_ai_queue", nextQueue).catch(() => {});
     },

     processNextQueueTask: async () => {
       const state = getStore();
       if (state.isQueueRunning) return;

       const pendingTask = state.aiQueue.find((t) => t.status === "pending");
       if (!pendingTask) return;

       const taskId = pendingTask.id;
       const targetStyle = getStyleById(pendingTask.styleId, state.aiStyles);
       const prompt = buildStylePrompt(targetStyle, {
         customNotes: pendingTask.customNotes,
         mood: pendingTask.mood,
         includeText: pendingTask.includeText !== false,
         specifiedText: pendingTask.specifiedText,
        aspectRatio: pendingTask.aspectRatio || state.selectedAiAspectRatio || "3:4",
       });

       const runningQueue = state.aiQueue.map((t) =>
         t.id === taskId ? { ...t, status: "running" as const, progress: 15, stageText: "正在分析素材结构与意境特征..." } : t
       );
       setStore({
         isQueueRunning: true,
         isGeneratingAi: true,
         activeQueueTaskId: taskId,
         aiQueue: runningQueue,
       });
       set("atelier_ai_queue", runningQueue).catch(() => {});

       // Simulated progress updates while API is running
       const p1 = setTimeout(() => {
         setStore((s) => {
           const q = s.aiQueue.map((t) =>
             t.id === taskId ? { ...t, progress: 45, stageText: `正在重构「${targetStyle.name}」先锋视觉...` } : t
           );
           set("atelier_ai_queue", q).catch(() => {});
           return { aiQueue: q };
         });
       }, 3000);

       const p2 = setTimeout(() => {
         setStore((s) => {
           const q = s.aiQueue.map((t) =>
             t.id === taskId ? { ...t, progress: 75, stageText: "正在执行高解析度光影与质感定影..." } : t
           );
           set("atelier_ai_queue", q).catch(() => {});
           return { aiQueue: q };
         });
       }, 15000);

       try {
         const res = await apiGenerateStylizedImage({
           prompt,
           styleId: targetStyle.id,
           styleName: targetStyle.name,
           sourceImage: pendingTask.sourceImage,
           aspectRatio: pendingTask.aspectRatio || targetStyle.aspectRatio,
           customNotes: pendingTask.customNotes,
           specifiedText: pendingTask.specifiedText,
           userId: state.currentUser?.id,
         });

         clearTimeout(p1);
         clearTimeout(p2);

         if (res.success && res.image) {
           const finalImage = res.image;
           setStore((s) => {
             const existingWs = s.styleWorkspaces[pendingTask.styleId] || { sourceImage: null, latestResult: null };
             const updatedWorkspaces = {
               ...s.styleWorkspaces,
               [pendingTask.styleId]: {
                 ...existingWs,
                 sourceImage: pendingTask.sourceImage,
                 latestResult: finalImage,
                 aspectRatio: pendingTask.aspectRatio as any,
               },
             };

             const isTargetActive = s.selectedAiStyleId === pendingTask.styleId;
             const updatedQueue = s.aiQueue.map((t) =>
               t.id === taskId
                 ? {
                     ...t,
                     status: "success" as const,
                     progress: 100,
                     stageText: "✓ 成片已就绪并入库",
                     resultImage: finalImage,
                     completedAt: Date.now(),
                   }
                 : t
             );

             set("atelier_ai_queue", updatedQueue).catch(() => {});

             return {
               isQueueRunning: false,
               isGeneratingAi: false,
               activeQueueTaskId: null,
               styleWorkspaces: updatedWorkspaces,
               latestAiGeneratedImage: isTargetActive ? finalImage : s.latestAiGeneratedImage,
               aiQueue: updatedQueue,
             };
           });

           // Auto-save to user media assets
           getStore().addMediaAssets([
             {
               name: `AI风格 · ${targetStyle.name}`,
               src: res.image,
               width: 1024,
               height: 1024,
             },
           ]).catch(() => {});

           // Refresh AI history
           getStore().fetchAiHistory().catch(() => {});
         } else {
           setStore((s) => {
             const updatedQueue = s.aiQueue.map((t) =>
               t.id === taskId
                 ? {
                     ...t,
                     status: "error" as const,
                     progress: 0,
                     stageText: res.message || "生成失败",
                     errorMessage: res.message || "生成未返回图片",
                   }
                 : t
             );
             set("atelier_ai_queue", updatedQueue).catch(() => {});
             return {
               isQueueRunning: false,
               isGeneratingAi: false,
               activeQueueTaskId: null,
               aiQueue: updatedQueue,
             };
           });
         }
       } catch (err: any) {
         clearTimeout(p1);
         clearTimeout(p2);
         setStore((s) => {
           const updatedQueue = s.aiQueue.map((t) =>
             t.id === taskId
               ? {
                   ...t,
                   status: "error" as const,
                   progress: 0,
                   stageText: err.message || "网络请求异常",
                   errorMessage: err.message || "请求失败",
                 }
               : t
           );
           set("atelier_ai_queue", updatedQueue).catch(() => {});
           return {
             isQueueRunning: false,
             isGeneratingAi: false,
             activeQueueTaskId: null,
             aiQueue: updatedQueue,
           };
         });
       }

       // Automatically process next in queue
       setTimeout(() => {
         getStore().processNextQueueTask();
       }, 200);
     },


     fetchAiStyles: async (all = true) => {
       const state = getStore();
       const adminId = state.currentUser?.id || (state.currentUser?.isAdmin ? "user_admin" : undefined);
       const styles = await apiGetAiStyles(all, adminId);
       if (styles && Array.isArray(styles) && styles.length > 0) {
         setStore({ aiStyles: styles });
         return styles;
       }
       return state.aiStyles;
     },

     adminSaveAiStyle: async (styleData) => {
       const state = getStore();
       const adminId = state.currentUser?.id || "user_admin";
       const res = await apiAdminSaveAiStyle(adminId, styleData);
       if (res.success && res.styles) {
         setStore({ aiStyles: res.styles });
       } else {
         await state.fetchAiStyles(true);
       }
       return res;
     },

     adminToggleAiStyle: async (styleId, enabled) => {
       const state = getStore();
       const adminId = state.currentUser?.id || "user_admin";
       const res = await apiAdminToggleAiStyle(adminId, styleId, enabled);
       if (res.success && res.styles) {
         setStore({ aiStyles: res.styles });
       } else {
         await state.fetchAiStyles(true);
       }
       return res;
     },

     adminDeleteAiStyle: async (styleId) => {
       const state = getStore();
       const adminId = state.currentUser?.id || "user_admin";
       const res = await apiAdminDeleteAiStyle(adminId, styleId);
       if (res.success && res.styles) {
         setStore({ aiStyles: res.styles });
       } else {
         await state.fetchAiStyles(true);
       }
       return res;
     },

     adminResetAiStyles: async () => {
       const state = getStore();
       const adminId = state.currentUser?.id || "user_admin";
       const res = await apiAdminResetAiStyles(adminId);
       if (res.success && res.styles) {
         setStore({ aiStyles: res.styles });
       } else {
         await state.fetchAiStyles(true);
       }
       return res;
     },
 
     fetchAiConfig: async () => {
       setStore({ aiConfigLoading: true });
       const cfg = await apiGetAiConfig();
       setStore({ aiConfig: cfg, aiConfigLoading: false });
       return cfg;
     },
 
     fetchSiteFilingConfig: async () => {
       const cfg = await apiGetSiteFilingConfig();
       if (cfg) {
         setStore({ siteFilingConfig: cfg });
         return cfg;
       }
       return null;
     },

     saveSiteFilingConfig: async (cfg) => {
       const state = getStore();
       const adminId = state.currentUser?.id || (state.currentUser?.isAdmin ? "user_admin" : undefined);
       setStore({ siteFilingSaving: true });
       const res = await apiAdminSaveSiteFilingConfig(cfg, adminId);
       if (res.success && res.config) {
         setStore({ siteFilingConfig: { ...DEFAULT_SITE_FILING_CONFIG, ...res.config } });
       }
       setStore({ siteFilingSaving: false });
       return res;
     },

     saveAiConfig: async (cfg) => {
       const state = getStore();
       const adminId = state.currentUser?.id || (state.currentUser?.isAdmin ? "user_admin" : undefined);
       const res = await apiSaveAiConfig(cfg, adminId);
       if (res.success && res.config) {
         setStore({ aiConfig: res.config });
       }
       return res;
     },

    testAiConfig: async () => {
      return await apiTestAiConfig();
    },

    fetchAiModels: async (params) => {
      return await apiFetchAiModels(params);
    },

    fetchAiHistory: async (explicitUserId?: string) => {
      const state = getStore();
      const targetUserId =
        explicitUserId ||
        state.currentUser?.id ||
        getLocalActiveUserId() ||
        "user_admin";
      const history = await apiGetAiHistory(targetUserId);
      if (Array.isArray(history)) {
        setStore({ aiHistory: history });
      }
    },

    deleteAiHistoryItem: async (id) => {
      const state = getStore();
      const history = await apiDeleteAiHistory(id, state.currentUser?.id);
      setStore({ aiHistory: history });
    },

    generateAiImage: async ({ styleId, customNotes, mood, includeText, specifiedText, sourceImage, aspectRatio } = {}) => {
      const state = getStore();
      const targetStyleId = styleId || state.selectedAiStyleId || "dreamy_motion_editorial";
      const style = getStyleById(targetStyleId, state.aiStyles);
      const srcImg = sourceImage !== undefined ? sourceImage : state.aiSourceImage || undefined;
      const targetRatio = aspectRatio || state.selectedAiAspectRatio || "3:4";
      const prompt = buildStylePrompt(style, { customNotes, mood, includeText, specifiedText, aspectRatio: targetRatio });

      setStore({ isGeneratingAi: true });
      const res = await apiGenerateStylizedImage({
        prompt,
        styleId: style.id,
        styleName: style.name,
        sourceImage: srcImg,
        aspectRatio: targetRatio,
        customNotes,
        specifiedText,
        userId: state.currentUser?.id,
      });

      setStore({ isGeneratingAi: false });

      if (res.success && res.image) {
        const generatedImg: string = res.image;
        const newTaskItem: GenerationTask = res.task || {
          id: "task_" + Date.now(),
          styleId: style.id,
          styleName: style.name,
          sourceImage: srcImg,
          prompt,
          aspectRatio: aspectRatio || style.aspectRatio || "auto",
          status: "success",
          resultUrl: generatedImg,
          createdAt: new Date().toISOString(),
        };
        if (!newTaskItem.sourceImage && srcImg) {
          newTaskItem.sourceImage = srcImg;
        }

        setStore((prev) => ({
          latestAiGeneratedImage: generatedImg,
          aiHistory: [newTaskItem, ...prev.aiHistory.filter((t) => t.id !== newTaskItem.id)],
          styleWorkspaces: {
            ...prev.styleWorkspaces,
            [targetStyleId]: {
              ...(prev.styleWorkspaces[targetStyleId] || {}),
              sourceImage: srcImg || null,
              latestResult: generatedImg,
            },
          },
        }));

        // Auto-save to user media assets
        state.addMediaAssets([
          {
            name: `AI风格 · ${style.name}`,
            src: res.image,
            width: 1024,
            height: 1024,
            category: "generated",
          },
        ]).catch(() => {});

        // Refresh AI history
        state.fetchAiHistory().catch(() => {});
      }

      return res;
    },

    applyStylizedImageToCanvas: async (imageUrl, mode = "add", targetElementId) => {
      const state = getStore();
      const targetId = targetElementId || state.aiStylizeTargetElementId || state.selectedIds[0];

      if (mode === "replace" && targetId) {
        state.replaceElementImage(targetId, imageUrl, "AI风格化重构图片");
        setStore({ aiStylizeModalOpen: false, aiStylizeTargetElementId: null, activePanel: "templates" });
        return;
      }

      if (mode === "template") {
        const style = getStyleById(state.selectedAiStyleId);
        const targetTplId = "couture-split-dual-bleed";
        state.loadTemplate(targetTplId, false);
        // After loading template, replace both original reference and generated hero image
        setTimeout(() => {
          const freshDoc = getStore().document;
          const imgElements = freshDoc.elements.filter((e) => e.type === "image");
          if (imgElements.length >= 2) {
            if (state.aiSourceImage) {
              getStore().replaceElementImage(imgElements[0].id, state.aiSourceImage, "原始输入照片");
            }
            getStore().replaceElementImage(imgElements[1].id, imageUrl, `AI风格 · ${style.name}`);
          } else if (imgElements.length === 1) {
            getStore().replaceElementImage(imgElements[0].id, imageUrl, `AI风格 · ${style.name}`);
          }

          // If Dreamy Motion Editorial, synchronize poetic calligraphy title with the source photo / quote
          if (style.id === "dreamy_motion_editorial" || targetTplId.startsWith("s21-dreamy-motion")) {
            const titleEl = freshDoc.elements.find((e) => e.type === "text" && (e.name.includes("Title") || e.name.includes("Calligraphy") || e.name.includes("Poetic")));
            if (titleEl) {
              const quote = getDreamyQuoteForImage(state.aiSourceImage);
              getStore().updateElement(titleEl.id, { text: quote });
            }
          }
        }, 100);
        setStore({ aiStylizeModalOpen: false, aiStylizeTargetElementId: null, activePanel: "templates" });
        return;
      }

      // Default: add image element to canvas
      const canvasW = state.document.canvas.width;
      const canvasH = state.document.canvas.height;
      const elW = Math.min(canvasW * 0.8, 600);
      const elH = elW * (4 / 3);

      state.addElement({
        type: "image",
        name: "AI风格化艺术作品",
        x: Math.round((canvasW - elW) / 2),
        y: Math.round((canvasH - elH) / 2),
        width: Math.round(elW),
        height: Math.round(elH),
        src: imageUrl,
        originalWidth: 1024,
        originalHeight: 1024,
        fit: "cover",
        rotation: 0,
        opacity: 1,
        borderRadius: 2,
        shadowBlur: 20,
        shadowOpacity: 0.15,
      });

      setStore({ aiStylizeModalOpen: false, aiStylizeTargetElementId: null, activePanel: "templates" });
    },

    openReplacePhotoModal: (elementId) => {
      const state = getStore();
      if (!state.isAuthenticated) {
        setStore({ authModalOpen: true, authModalTab: "register" });
        return;
      }
      const targetId = elementId || state.selectedIds[0] || null;
      setStore({
        replacePhotoModalOpen: true,
        replaceTargetElementId: targetId,
      });
    },

    closeReplacePhotoModal: () => {
      setStore({
        replacePhotoModalOpen: false,
        replaceTargetElementId: null,
      });
    },

    replaceElementImage: (elementId, src, name, naturalWidth, naturalHeight) => {
      const state = getStore();
      const el = state.document.elements.find((e) => e.id === elementId);
      if (!el || el.type !== "image") return;

      const w = naturalWidth || (el as ImageElement).originalWidth || 1200;
      const h = naturalHeight || (el as ImageElement).originalHeight || 800;

      state.updateElement(elementId, {
        src,
        name: name || el.name,
        originalWidth: w,
        originalHeight: h,
        crop: undefined, // reset crop for fresh image
      });

      setStore({
        replacePhotoModalOpen: false,
        replaceTargetElementId: null,
      });
    },

    past: [],
    future: [],

    // View & Navigation Actions
    setCurrentView: (view) => {
      const state = getStore();
      if (view === "studio" && !state.isAuthenticated) {
        setStore({ authModalOpen: true, authModalTab: "register" });
        return;
      }
      setStoredView(view);
      setStore({ currentView: view });
    },
    setThemeMode: (mode) => {
      try {
        localStorage.setItem(STORAGE_THEME_KEY, mode);
      } catch (e) {}
      applyThemeClass(mode);
      setStore({ themeMode: mode });
    },
    toggleThemeMode: () => {
      // 纯白极简工作台：恒定浅色，不再切换到深色
      try {
        localStorage.setItem(STORAGE_THEME_KEY, "light");
      } catch (e) {}
      applyThemeClass("light");
      setStore({ themeMode: "light" });
    },
    enterAsGuest: () => {
      setStore({ authModalOpen: true, authModalTab: "register" });
    },

    // Multi-user & Auth Modal Controls
    setAuthModalOpen: (open, tab) =>
      setStore({
        authModalOpen: open,
        userAccountModalOpen: open,
        ...(tab ? { authModalTab: tab } : {}),
      }),

    setUserAccountModalOpen: (open, tab) =>
      setStore({
        authModalOpen: open,
        userAccountModalOpen: open,
        ...(tab ? { authModalTab: tab } : {}),
      }),

        // Real Authentication: Login with Username & Password
    login: async (username, password) => {
      const state = getStore();
      const rawUser = username.trim();
      const cleanUser = rawUser.toLowerCase();
      const cleanWithoutAt = cleanUser.startsWith("@") ? cleanUser.slice(1).trim() : cleanUser;

     // 1. First try server-side login
     const serverRes = await apiLogin(cleanWithoutAt, password);
     let user: UserAccount | undefined;
 
     if (serverRes) {
       if (!serverRes.success) {
         return { success: false, message: serverRes.message || "登录失败" };
       }
       if (serverRes.user) {
         user = serverRes.user;
       }
     }
 
     if (!user) {
       // Fallback: check local storage in case offline
       const localAccs = getLocalStoredAccounts();
       let idbAccs: UserAccount[] = [];
       try {
         idbAccs = (await get<UserAccount[]>(STORAGE_ACCOUNTS_KEY)) || [];
       } catch (e) {}
       const mergedAccounts = mergeAccounts(DEFAULT_ACCOUNTS, localAccs, idbAccs, state.userAccounts);
 
       const localUser = mergedAccounts.find((u) => {
         if (!u) return false;
         const uName = (u.username || "").toLowerCase();
         const dName = (u.name || "").toLowerCase();
         const email = (u.email || "").toLowerCase();
         return (
           uName === cleanUser ||
           uName === cleanWithoutAt ||
           dName === cleanUser ||
           dName === cleanWithoutAt ||
           (email && email === cleanUser) ||
           u.id === rawUser
         );
       });
 
       if (!localUser) {
         return { success: false, message: serverRes?.message || "账号不存在，请核对用户名或先注册新账号" };
       }
 
       if (localUser.status === "banned") {
         return { success: false, message: "该账号已被管理员封禁，无法登录系统" };
       }
 
       const passTrim = password.trim();
       if (localUser.passwordHash && localUser.passwordHash !== passTrim && localUser.passwordHash !== password) {
         return { success: false, message: "密码错误，请重新输入" };
       }
       user = localUser;
     }

      // Auto-save previous session if any
      if (state.currentUser) {
        try {
          await state.saveToStorage();
        } catch (e) {}
      }

      const updatedUser: UserAccount = {
        ...user,
        lastLoginAt: new Date().toISOString(),
      };

      const localAccs = getLocalStoredAccounts();
      const updatedAccounts = mergeAccounts(DEFAULT_ACCOUNTS, localAccs, state.userAccounts, [updatedUser]);

      // Persist accounts & active user synchronously + asynchronously
      setStoredView("studio");
      setLocalStoredAccounts(updatedAccounts);
      setLocalActiveUserId(user.id);
      try {
        await set(STORAGE_ACCOUNTS_KEY, updatedAccounts);
        await set(STORAGE_ACTIVE_USER_ID_KEY, user.id);
      } catch (e) {}

      // Load target user isolated data with server sync and safe fallback
      let targetDoc: CollageDocument | undefined;
      let targetProjects: SavedProject[] = [];
      let targetTemplates: CustomTemplate[] = [];
      let targetMedia: UserMediaAsset[] = [];

      try {
        // 1. Fetch remote data from server
        const remoteData = await apiGetUserData(user.id);
        if (remoteData) {
          if (remoteData.document) targetDoc = remoteData.document;
          if (Array.isArray(remoteData.savedProjects)) targetProjects = remoteData.savedProjects;
          if (Array.isArray(remoteData.customTemplates)) targetTemplates = remoteData.customTemplates;
          if (Array.isArray(remoteData.mediaAssets)) targetMedia = remoteData.mediaAssets;
        }

        // 2. Local fallback and bidirectional media sync
        if (!targetDoc) {
          targetDoc = await get<CollageDocument>(getStorageUserDocKey(user.id));
        }
        if (targetProjects.length === 0) {
          const localProj = await get<SavedProject[]>(getStorageUserProjectsKey(user.id));
          if (Array.isArray(localProj)) targetProjects = localProj;
        }
        if (targetTemplates.length === 0) {
          const localTpl = await get<CustomTemplate[]>(getStorageUserTemplatesKey(user.id));
          if (Array.isArray(localTpl)) targetTemplates = localTpl;
        }

        const localMedia = (await get<UserMediaAsset[]>(getStorageUserMediaKey(user.id))) || [];
        const validLocalMedia = Array.isArray(localMedia) ? localMedia : [];

        // Bidirectional merge by ID: preserve both server and local assets
        const mediaMap = new Map<string, UserMediaAsset>();
        for (const m of validLocalMedia) {
          if (m && m.id) mediaMap.set(m.id, m);
        }
        for (const m of targetMedia) {
          if (m && m.id) mediaMap.set(m.id, m);
        }
        const mergedMedia = Array.from(mediaMap.values());
        targetMedia = mergedMedia;

        // If local had unsynced assets that were not on server, push them to server now!
        if (validLocalMedia.length > 0 && mergedMedia.length > (remoteData?.mediaAssets?.length || 0)) {
          apiSaveUserMedia(user.id, mergedMedia).catch(() => {});
        }

        // Cache to current browser IndexedDB
        await set(getStorageUserMediaKey(user.id), mergedMedia);
      } catch (err) {
        console.warn("Login isolated data load notice:", err);
      }

      const newDoc =
        targetDoc && targetDoc.canvas && Array.isArray(targetDoc.elements)
          ? targetDoc
          : TEMPLATES[0].createDocument();

      setStore({
        currentUser: updatedUser,
        isAuthenticated: true,
        userAccounts: updatedAccounts,
        document: newDoc,
        savedProjects: Array.isArray(targetProjects) ? targetProjects : [],
        customTemplates: Array.isArray(targetTemplates) ? targetTemplates : [],
        mediaAssets: Array.isArray(targetMedia) ? targetMedia : [],
        currentProjectId: null,
        isDirty: false,
        selectedIds: [],
        hoveredId: null,
        editingCropId: null,
        past: [],
        future: [],
        authModalOpen: false,
        userAccountModalOpen: false,
        currentView: "studio",
      });

      return { success: true, message: `欢迎回来，${user.name}！`, user: updatedUser };
    },

    // Real Authentication: Register New Individual Account
    register: async ({ username = "", password, name = "", avatar, role, bio, email = "", code = "" }) => {
      const state = getStore();
      const cleanEmail = email.trim().toLowerCase();
      const rawUser = username.trim() || (cleanEmail ? cleanEmail.split("@")[0].trim() : "");
      const cleanUser = rawUser.toLowerCase();
      const cleanWithoutAt = cleanUser.startsWith("@") ? cleanUser.slice(1).trim() : cleanUser;

      if (!cleanEmail && (!cleanWithoutAt || cleanWithoutAt.length < 3)) {
        return { success: false, message: "登录账号至少需要 3 个字符（支持英文字母与数字）" };
      }

      if (!password || password.trim().length < 4) {
        return { success: false, message: "密码至少需要 4 位字符" };
      }

      // Save previous state if logged in
      if (state.currentUser) {
        try {
          await state.saveToStorage();
        } catch (e) {}
      }

      // Try server registration
      const serverRes = await apiRegister({
        username: cleanWithoutAt,
        password: password.trim(),
        name: name.trim() || (cleanEmail ? cleanEmail.split("@")[0] : cleanWithoutAt),
        avatar: avatar || (CARTOON_AVATARS[Math.floor(Math.random() * CARTOON_AVATARS.length)]?.emoji || "🐱"),
        role: role?.trim() || "独立创作者",
        bio: bio?.trim() || "专注高定排版与艺术创作",
        email: cleanEmail,
        code: code.trim(),
      });

      let newAccount: UserAccount;
      if (serverRes && serverRes.success && serverRes.user) {
        newAccount = serverRes.user;
      } else if (serverRes && serverRes.message && serverRes.message.includes("已被注册")) {
        return { success: false, message: serverRes.message };
      } else {
        // Local fallback register
        const localAccs = getLocalStoredAccounts();
        let idbAccs: UserAccount[] = [];
        try {
          idbAccs = (await get<UserAccount[]>(STORAGE_ACCOUNTS_KEY)) || [];
        } catch (e) {}
        const mergedAccounts = mergeAccounts(DEFAULT_ACCOUNTS, localAccs, idbAccs, state.userAccounts);

        const exists = mergedAccounts.some(
          (u) => (u.username && u.username.toLowerCase() === cleanWithoutAt)
        );
        if (exists) {
          return { success: false, message: `账号 “${rawUser}” 已被注册，请更换其他用户名或直接登录` };
        }

        const newUserId = generateId("user");
        newAccount = {
          id: newUserId,
          username: cleanWithoutAt,
          passwordHash: password.trim(),
          name: name.trim() || cleanWithoutAt,
          avatar: avatar || "🎨",
          role: role?.trim() || "独立创作者",
          bio: bio?.trim() || "专注高定排版与艺术创作",
          email: email?.trim() || "",
          themeColor: "#E5C49F",
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
      }

      const localAccs = getLocalStoredAccounts();
      const updatedAccounts = mergeAccounts(DEFAULT_ACCOUNTS, localAccs, state.userAccounts, [newAccount]);
      const initialNewDoc = TEMPLATES[0].createDocument();

      // Persist synchronously and asynchronously
      setStoredView("studio");
      setLocalStoredAccounts(updatedAccounts);
      setLocalActiveUserId(newAccount.id);

      setStore({
        userAccounts: updatedAccounts,
        currentUser: newAccount,
        isAuthenticated: true,
        savedProjects: [],
        customTemplates: [],
        mediaAssets: [],
        document: initialNewDoc,
        currentProjectId: null,
        isDirty: false,
        selectedIds: [],
        past: [],
        future: [],
        authModalOpen: false,
        userAccountModalOpen: false,
        currentView: "studio",
      });

      try {
        await set(STORAGE_ACCOUNTS_KEY, updatedAccounts);
        await set(STORAGE_ACTIVE_USER_ID_KEY, newAccount.id);
        await set(getStorageUserDocKey(newAccount.id), initialNewDoc);
        await set(getStorageUserProjectsKey(newAccount.id), []);
        await set(getStorageUserTemplatesKey(newAccount.id), []);
        await set(getStorageUserMediaKey(newAccount.id), []);
      } catch (err) {
        console.warn("Storage init for new user failed:", err);
      }

      return { success: true, message: `恭喜！已成功注册并登录账号「${newAccount.name}」`, user: newAccount };
    },

    // Logout: Clears current active session and prompts login
    logout: async () => {
      const state = getStore();
      if (state.currentUser) {
        try {
          await state.saveToStorage();
        } catch (e) {}
      }

      setStoredView("home");
      setLocalActiveUserId(null);
      try {
        await set(STORAGE_ACTIVE_USER_ID_KEY, null);
      } catch (e) {}

     setStore({
       currentUser: null,
       isAuthenticated: false,
       mediaAssets: [],
       savedProjects: [],
       customTemplates: [],
       selectedIds: [],
       authModalOpen: false,
       userAccountModalOpen: false,
       adminModalOpen: false,
       aiSettingsModalOpen: false,
       currentView: "home",
     });
    },

    // Update Profile Information
    updateUserProfile: async (updates) => {
      const state = getStore();
      if (!state.currentUser) return { success: false, message: "请先登录" };

      const currentId = state.currentUser.id;
      const updatedUser: UserAccount = { ...state.currentUser, ...updates };
      const updatedAccounts = state.userAccounts.map((u) =>
        u.id === currentId ? updatedUser : u
      );

      setStore({
        userAccounts: updatedAccounts,
        currentUser: updatedUser,
      });

      setLocalStoredAccounts(updatedAccounts);
      await set(STORAGE_ACCOUNTS_KEY, updatedAccounts);
      await set(STORAGE_ACTIVE_USER_ID_KEY, currentId);

      // Async sync to server
      apiUpdateProfile(currentId, updates).catch(() => {});

      return { success: true, message: "个人资料更新成功" };
    },

    // Change Password
    changePassword: async (oldPass, newPass) => {
      const state = getStore();
      if (!state.currentUser) return { success: false, message: "请先登录" };

      if (state.currentUser.passwordHash && state.currentUser.passwordHash !== oldPass.trim()) {
        return { success: false, message: "原密码不正确，请重新输入" };
      }

      if (!newPass || newPass.trim().length < 4) {
        return { success: false, message: "新密码长度至少需要 4 位字符" };
      }

      const currentId = state.currentUser.id;
      const updatedUser: UserAccount = { ...state.currentUser, passwordHash: newPass.trim() };
      const updatedAccounts = state.userAccounts.map((u) =>
        u.id === currentId ? updatedUser : u
      );

      setStore({
        userAccounts: updatedAccounts,
        currentUser: updatedUser,
      });

      setLocalStoredAccounts(updatedAccounts);
      await set(STORAGE_ACCOUNTS_KEY, updatedAccounts);

      // Async sync to server
      apiChangePassword(currentId, oldPass, newPass).catch(() => {});

      return { success: true, message: "密码修改成功，请牢记新密码" };
    },

    // Delete Account
    deleteUserAccount: async (userId) => {
      const state = getStore();
      if (state.userAccounts.length <= 1) {
        return { success: false, message: "系统中至少需要保留一个账号" };
      }

      const target = state.userAccounts.find((u) => u.id === userId);
      const updatedAccounts = state.userAccounts.filter((a) => a.id !== userId);
      setStore({ userAccounts: updatedAccounts });
      setLocalStoredAccounts(updatedAccounts);
      await set(STORAGE_ACCOUNTS_KEY, updatedAccounts);

      apiDeleteAccount(userId).catch(() => {});

      // If deleted current user, switch to first available user
      if (state.currentUser && state.currentUser.id === userId) {
        const nextUser = updatedAccounts[0];
        await getStore().switchUserAccount(nextUser.id);
      }

      return { success: true, message: `账号「${target?.name || userId}」已注销` };
    },

    // Switch Account Helper
    switchUserAccount: async (targetUserId) => {
      const state = getStore();
      if (state.currentUser && state.currentUser.id === targetUserId) return;

      if (state.currentUser) {
        await state.saveToStorage();
      }

      const targetUser = state.userAccounts.find((u) => u.id === targetUserId);
      if (!targetUser) return;

      try {
        let targetDoc: CollageDocument | undefined;
        let targetProjects: SavedProject[] = [];
        let targetTemplates: CustomTemplate[] = [];
        let targetMedia: UserMediaAsset[] = [];

        // 1. Fetch remote data from server
        const remoteData = await apiGetUserData(targetUserId);
        if (remoteData) {
          if (remoteData.document) targetDoc = remoteData.document;
          if (Array.isArray(remoteData.savedProjects)) targetProjects = remoteData.savedProjects;
          if (Array.isArray(remoteData.customTemplates)) targetTemplates = remoteData.customTemplates;
          if (Array.isArray(remoteData.mediaAssets)) targetMedia = remoteData.mediaAssets;
        }

        // 2. Local fallback and bidirectional media sync
        if (!targetDoc) {
          targetDoc = await get<CollageDocument>(getStorageUserDocKey(targetUserId));
        }
        if (targetProjects.length === 0) {
          const localProj = await get<SavedProject[]>(getStorageUserProjectsKey(targetUserId));
          if (Array.isArray(localProj)) targetProjects = localProj;
        }
        if (targetTemplates.length === 0) {
          const localTpl = await get<CustomTemplate[]>(getStorageUserTemplatesKey(targetUserId));
          if (Array.isArray(localTpl)) targetTemplates = localTpl;
        }

        const localMedia = (await get<UserMediaAsset[]>(getStorageUserMediaKey(targetUserId))) || [];
        const validLocal = Array.isArray(localMedia) ? localMedia : [];
        const mediaMap = new Map<string, UserMediaAsset>();
        for (const a of validLocal) {
          if (a && a.id) mediaMap.set(a.id, a);
        }
        for (const a of targetMedia) {
          if (a && a.id) mediaMap.set(a.id, a);
        }
        const mergedMedia = Array.from(mediaMap.values());
        targetMedia = mergedMedia;

        if (validLocal.length > 0 && mergedMedia.length > (remoteData?.mediaAssets?.length || 0)) {
          apiSaveUserMedia(targetUserId, mergedMedia).catch(() => {});
        }
        await set(getStorageUserMediaKey(targetUserId), mergedMedia);

        const newDoc =
          targetDoc && targetDoc.canvas && Array.isArray(targetDoc.elements)
            ? targetDoc
            : TEMPLATES[0].createDocument();

        setStore({
          currentUser: targetUser,
          isAuthenticated: true,
          document: newDoc,
          savedProjects: Array.isArray(targetProjects) ? targetProjects : [],
          customTemplates: Array.isArray(targetTemplates) ? targetTemplates : [],
          mediaAssets: Array.isArray(targetMedia) ? targetMedia : [],
          currentProjectId: null,
          isDirty: false,
          selectedIds: [],
          hoveredId: null,
          editingCropId: null,
          past: [],
          future: [],
          authModalOpen: false,
          userAccountModalOpen: false,
          currentView: "studio",
        });

        setStoredView("studio");
        await set(STORAGE_ACTIVE_USER_ID_KEY, targetUserId);
      } catch (err) {
        console.warn("Failed to switch user account:", err);
      }
    },

    createUserAccount: async (name, role = "创作者", avatar = "✨", bio = "", themeColor = "#E5C49F") => {
      const state = getStore();
      const newUserId = generateId("user");
      const username = `user_${Date.now().toString(36)}`;
      const newAccount: UserAccount = {
        id: newUserId,
        username,
        passwordHash: "123456",
        name: name.trim() || "新用户",
        role: role.trim() || "创作者",
        avatar,
        bio: bio.trim(),
        themeColor,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      const updatedAccounts = [...state.userAccounts, newAccount];
      setStore({ userAccounts: updatedAccounts });
      await set(STORAGE_ACCOUNTS_KEY, updatedAccounts);

      await getStore().switchUserAccount(newUserId);
      return newAccount;
    },

    // User Uploaded Media Assets (Isolated & Cloud Synced)
    addMediaAssets: async (items) => {
      const state = getStore();
      const userId = state.currentUser?.id || "guest_user";

      const createdList: UserMediaAsset[] = items.map((item) => ({
        id: generateId("asset"),
        userId,
        name: item.name || "素材图片",
        src: item.src,
        thumb: item.src,
        width: item.width || 1200,
        height: item.height || 800,
        aspectRatio: item.aspectRatio || (item.width && item.height ? item.width / item.height : 1.5),
        sizeBytes: item.sizeBytes,
        category: item.category || (item.name.startsWith("AI") ? "generated" : "upload"),
        createdAt: new Date().toISOString(),
      }));

      const updatedList = [...createdList, ...state.mediaAssets];
      setStore({ mediaAssets: updatedList });

      try {
        await set(getStorageUserMediaKey(userId), updatedList);
      } catch (err) {
        console.warn("Failed to persist user media asset to local storage:", err);
      }

      // Cloud sync to server for logged-in user so assets follow the account across browsers!
      if (state.currentUser && state.isAuthenticated) {
        apiSaveUserMedia(userId, createdList)
          .then((serverAssets) => {
            // 服务端会把 base64 原图落盘成短 URL（并给出缩略图地址）：
            // 回填后本地不再攥着几 MB 的 base64，列表也能只加载小图。
            if (Array.isArray(serverAssets) && serverAssets.length > 0) {
              const byId = new Map(serverAssets.map((a) => [a.id, a]));
              setStore((prev) => ({
                mediaAssets: prev.mediaAssets.map((a) => byId.get(a.id) || a),
              }));
              set(getStorageUserMediaKey(userId), getStore().mediaAssets).catch(() => {});
            }
          })
          .catch((err) => {
            console.warn("Cloud media upload sync notice:", err);
          });
      }

      return createdList;
    },

    fetchUserMedia: async () => {
      const state = getStore();
      const userId = state.currentUser?.id;
      if (!userId || !state.isAuthenticated) {
        try {
          const guestMedia = (await get<UserMediaAsset[]>(getStorageUserMediaKey("guest_user"))) || [];
          if (Array.isArray(guestMedia) && guestMedia.length > 0) {
            setStore({ mediaAssets: guestMedia });
          }
        } catch {}
        return;
      }

      try {
        const remoteAssets = await apiGetUserMedia(userId);
        const lm = (await get<UserMediaAsset[]>(getStorageUserMediaKey(userId))) || [];
        const validLocal = Array.isArray(lm) ? lm : [];
        const mediaMap = new Map<string, UserMediaAsset>();
        for (const a of validLocal) {
          if (a && a.id) mediaMap.set(a.id, a);
        }
        if (Array.isArray(remoteAssets)) {
          for (const a of remoteAssets) {
            if (a && a.id) mediaMap.set(a.id, a);
          }
        }
        for (const a of state.mediaAssets) {
          if (a && a.id) mediaMap.set(a.id, a);
        }
        const merged = Array.from(mediaMap.values());
        setStore({ mediaAssets: merged });
        await set(getStorageUserMediaKey(userId), merged);
      } catch (err) {
        console.warn("fetchUserMedia failed:", err);
      }
    },

    deleteMediaAsset: async (assetId) => {
      const state = getStore();
      const userId = state.currentUser?.id || "guest_user";
      const updatedList = state.mediaAssets.filter((a) => a.id !== assetId);
      setStore({ mediaAssets: updatedList });

      try {
        await set(getStorageUserMediaKey(userId), updatedList);
      } catch (err) {
        console.warn("Failed to delete media asset from local storage:", err);
      }

      if (state.currentUser && state.isAuthenticated) {
        apiDeleteUserMedia(userId, assetId).catch((err) => {
          console.warn("Cloud media delete sync notice:", err);
        });
      }
    },

    clearAllMediaAssets: async () => {
      const state = getStore();
      const userId = state.currentUser?.id || "guest_user";
      setStore({ mediaAssets: [] });

      try {
        await set(getStorageUserMediaKey(userId), []);
      } catch (err) {
        console.warn("Failed to clear media assets from local storage:", err);
      }

      if (state.currentUser && state.isAuthenticated) {
        apiClearUserMedia(userId).catch((err) => {
          console.warn("Cloud media clear sync notice:", err);
        });
      }
    },

// Core Canvas Document Actions
    setDocument: (doc, pushToHistory = true) => {
      const state = getStore();
      const historyUpdate = pushToHistory ? pushSnapshot(state.document) : {};
      setStore({
        document: doc,
        ...historyUpdate,
      });
      getStore().saveToStorage();
    },

    updateCanvas: (settings, autoReflowContent = false) => {
      const state = getStore();
      const oldW = state.document.canvas.width;
      const oldH = state.document.canvas.height;
      const newW = settings.width ?? oldW;
      const newH = settings.height ?? oldH;

      const historyUpdate = pushSnapshot(state.document);
      const newCanvas: CanvasSettings = { ...state.document.canvas, ...settings };
      const newDoc: CollageDocument = {
        ...state.document,
        canvas: newCanvas,
        updatedAt: new Date().toISOString(),
      };

      setStore({
        document: newDoc,
        ...historyUpdate,
      });

      if (autoReflowContent && (oldW !== newW || oldH !== newH)) {
        getStore().reflowContentToCanvas(oldW, oldH, newW, newH);
      } else {
        getStore().saveToStorage();
      }
    },

    addElement: (elementData) => {
      const state = getStore();
      const historyUpdate = pushSnapshot(state.document);
      const id = generateId(elementData.type.slice(0, 3));
      const maxZIndex = state.document.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);

      const newElement = {
        ...elementData,
        id,
        zIndex: maxZIndex + 1,
        locked: false,
        visible: true,
      } as CollageElement;

      const newDoc: CollageDocument = {
        ...state.document,
        elements: [...state.document.elements, newElement],
        updatedAt: new Date().toISOString(),
      };

      setStore({
        document: newDoc,
        selectedIds: [id],
        ...historyUpdate,
      });
      getStore().saveToStorage();
      return id;
    },

    updateElement: (id, updates, pushToHistory = false) => {
      const state = getStore();
      const historyUpdate = pushToHistory ? pushSnapshot(state.document) : {};
      const newElements = state.document.elements.map((el) => {
        if (el.id === id) {
          return { ...el, ...updates } as CollageElement;
        }
        return el;
      });

      setStore({
        document: {
          ...state.document,
          elements: newElements,
          updatedAt: new Date().toISOString(),
        },
        ...historyUpdate,
      });
      debouncedSaveToStorage();
    },

    updateElements: (updatesList, pushToHistory = false) => {
      const state = getStore();
      const historyUpdate = pushToHistory ? pushSnapshot(state.document) : {};
      const updateMap = new Map(updatesList.map((u) => [u.id, u.updates]));

      const newElements = state.document.elements.map((el) => {
        if (updateMap.has(el.id)) {
          return { ...el, ...updateMap.get(el.id) } as CollageElement;
        }
        return el;
      });

      setStore({
        document: {
          ...state.document,
          elements: newElements,
          updatedAt: new Date().toISOString(),
        },
        ...historyUpdate,
      });
      debouncedSaveToStorage();
    },

    deleteElements: (ids) => {
      const state = getStore();
      const targetIds = ids || state.selectedIds;
      if (targetIds.length === 0) return;

      const historyUpdate = pushSnapshot(state.document);
      const remainingElements = state.document.elements.filter((el) => !targetIds.includes(el.id));

      setStore({
        document: {
          ...state.document,
          elements: remainingElements,
          updatedAt: new Date().toISOString(),
        },
        selectedIds: [],
        editingCropId: null,
        ...historyUpdate,
      });
      getStore().saveToStorage();
    },

    duplicateElements: (ids) => {
      const state = getStore();
      const targetIds = ids || state.selectedIds;
      if (targetIds.length === 0) return;

      const historyUpdate = pushSnapshot(state.document);
      const maxZIndex = state.document.elements.reduce((max, el) => Math.max(max, el.zIndex), 0);

      const duplicated: CollageElement[] = [];
      const newSelectedIds: string[] = [];

      targetIds.forEach((targetId, index) => {
        const original = state.document.elements.find((el) => el.id === targetId);
        if (!original) return;

        const newId = generateId(original.type.slice(0, 3));
        const clone = {
          ...JSON.parse(JSON.stringify(original)),
          id: newId,
          x: original.x + 24,
          y: original.y + 24,
          zIndex: maxZIndex + index + 1,
          name: `${original.name} (副本)`,
        };

        duplicated.push(clone);
        newSelectedIds.push(newId);
      });

      setStore({
        document: {
          ...state.document,
          elements: [...state.document.elements, ...duplicated],
          updatedAt: new Date().toISOString(),
        },
        selectedIds: newSelectedIds,
        ...historyUpdate,
      });
      getStore().saveToStorage();
    },

    selectElements: (ids) => setStore({ selectedIds: ids }),

    toggleSelectElement: (id, multi = false) => {
      const { selectedIds } = getStore();
      if (!multi) {
        setStore({ selectedIds: [id] });
      } else {
        if (selectedIds.includes(id)) {
          setStore({ selectedIds: selectedIds.filter((item) => item !== id) });
        } else {
          setStore({ selectedIds: [...selectedIds, id] });
        }
      }
    },

    selectAll: () => {
      const allIds = getStore().document.elements.map((el) => el.id);
      setStore({ selectedIds: allIds });
    },

    clearSelection: () => setStore({ selectedIds: [], editingCropId: null }),
    setHoveredId: (id) => setStore({ hoveredId: id }),
    setEditingCropId: (id) => setStore({ editingCropId: id }),

    reorderElement: (id, action) => {
      const state = getStore();
      const elements = [...state.document.elements].sort((a, b) => a.zIndex - b.zIndex);
      const index = elements.findIndex((el) => el.id === id);
      if (index === -1) return;

      const historyUpdate = pushSnapshot(state.document);
      const target = elements[index];

      if (action === "front") {
        elements.splice(index, 1);
        elements.push(target);
      } else if (action === "back") {
        elements.splice(index, 1);
        elements.unshift(target);
      } else if (action === "forward") {
        if (index < elements.length - 1) {
          elements[index] = elements[index + 1];
          elements[index + 1] = target;
        }
      } else if (action === "backward") {
        if (index > 0) {
          elements[index] = elements[index - 1];
          elements[index - 1] = target;
        }
      }

      const reindexed = elements.map((el, idx) => ({ ...el, zIndex: idx + 1 }));
      setStore({
        document: {
          ...state.document,
          elements: reindexed,
          updatedAt: new Date().toISOString(),
        },
        ...historyUpdate,
      });
      getStore().saveToStorage();
    },

    toggleLock: (id) => {
      const state = getStore();
      const newElements = state.document.elements.map((el) => {
        if (el.id === id) return { ...el, locked: !el.locked };
        return el;
      });
      setStore({
        document: { ...state.document, elements: newElements },
      });
      getStore().saveToStorage();
    },

    toggleVisibility: (id) => {
      const state = getStore();
      const newElements = state.document.elements.map((el) => {
        if (el.id === id) return { ...el, visible: !el.visible };
        return el;
      });
      setStore({
        document: { ...state.document, elements: newElements },
      });
      getStore().saveToStorage();
    },

    alignElements: (direction) => {
      const state = getStore();
      const selected = state.document.elements.filter((el) => state.selectedIds.includes(el.id));
      if (selected.length === 0) return;

      const historyUpdate = pushSnapshot(state.document);
      const isSingle = selected.length === 1;
      const canvas = state.document.canvas;

      let bounds = {
        minX: Math.min(...selected.map((el) => el.x)),
        maxX: Math.max(...selected.map((el) => el.x + el.width)),
        minY: Math.min(...selected.map((el) => el.y)),
        maxY: Math.max(...selected.map((el) => el.y + el.height)),
      };

      if (isSingle) {
        bounds = { minX: 0, maxX: canvas.width, minY: 0, maxY: canvas.height };
      }

      const updates: { id: string; updates: Partial<CollageElement> }[] = [];

      selected.forEach((el) => {
        let newX = el.x;
        let newY = el.y;

        switch (direction) {
          case "left":
            newX = bounds.minX;
            break;
          case "center":
            newX = bounds.minX + (bounds.maxX - bounds.minX) / 2 - el.width / 2;
            break;
          case "right":
            newX = bounds.maxX - el.width;
            break;
          case "top":
            newY = bounds.minY;
            break;
          case "middle":
            newY = bounds.minY + (bounds.maxY - bounds.minY) / 2 - el.height / 2;
            break;
          case "bottom":
            newY = bounds.maxY - el.height;
            break;
        }

        updates.push({ id: el.id, updates: { x: Math.round(newX), y: Math.round(newY) } });
      });

      if (direction === "distribute-h" && selected.length > 2) {
        const sorted = [...selected].sort((a, b) => a.x - b.x);
        const totalW = sorted.reduce((sum, el) => sum + el.width, 0);
        const span = bounds.maxX - bounds.minX;
        const gap = (span - totalW) / (sorted.length - 1);
        let currX = bounds.minX;

        sorted.forEach((el) => {
          updates.push({ id: el.id, updates: { x: Math.round(currX) } });
          currX += el.width + gap;
        });
      } else if (direction === "distribute-v" && selected.length > 2) {
        const sorted = [...selected].sort((a, b) => a.y - b.y);
        const totalH = sorted.reduce((sum, el) => sum + el.height, 0);
        const span = bounds.maxY - bounds.minY;
        const gap = (span - totalH) / (sorted.length - 1);
        let currY = bounds.minY;

        sorted.forEach((el) => {
          updates.push({ id: el.id, updates: { y: Math.round(currY) } });
          currY += el.height + gap;
        });
      }

      getStore().updateElements(updates, true);
    },

    applyAutoLayout: (type) => {
      const state = getStore();
      const images = state.document.elements.filter((el) => el.type === "image") as ImageElement[];
      if (images.length === 0) return;

      const historyUpdate = pushSnapshot(state.document);
      const canvasW = state.document.canvas.width;
      const canvasH = state.document.canvas.height;
      const pad = Math.round(canvasW * 0.05);
      const gap = 16;
      const availW = canvasW - pad * 2;
      const availH = canvasH - pad * 2;

      const updates: { id: string; updates: Partial<CollageElement> }[] = [];

      if (type === "grid" || images.length === 4) {
        const cols = images.length <= 2 ? images.length : images.length <= 4 ? 2 : 3;
        const rows = Math.ceil(images.length / cols);
        const cellW = (availW - gap * (cols - 1)) / cols;
        const cellH = (availH - gap * (rows - 1)) / rows;

        images.forEach((img, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          updates.push({
            id: img.id,
            updates: {
              x: Math.round(pad + col * (cellW + gap)),
              y: Math.round(pad + row * (cellH + gap)),
              width: Math.round(cellW),
              height: Math.round(cellH),
              rotation: 0,
            },
          });
        });
      } else if (type === "hero-asymmetric") {
        if (images.length === 1) {
          updates.push({
            id: images[0].id,
            updates: { x: pad, y: pad, width: availW, height: availH, rotation: 0 },
          });
        } else {
          const heroW = Math.round(availW * 0.62);
          const sideW = availW - heroW - gap;
          updates.push({
            id: images[0].id,
            updates: { x: pad, y: pad, width: heroW, height: availH, rotation: 0 },
          });

          const remaining = images.slice(1);
          const sideH = (availH - gap * (remaining.length - 1)) / remaining.length;
          remaining.forEach((img, i) => {
            updates.push({
              id: img.id,
              updates: {
                x: Math.round(pad + heroW + gap),
                y: Math.round(pad + i * (sideH + gap)),
                width: Math.round(sideW),
                height: Math.round(sideH),
                rotation: 0,
              },
            });
          });
        }
      }

      getStore().updateElements(updates, true);
    },

    reflowContentToCanvas: (oldW, oldH, newW, newH) => {
      const state = getStore();
      const elements = state.document.elements;
      if (!elements || elements.length === 0) return;

      // Identify full-bleed background elements (elements covering entire old canvas)
      const fullBleedIds = new Set<string>();
      elements.forEach((el) => {
        if (el.x === 0 && el.y === 0 && Math.abs(el.width - oldW) < 5 && Math.abs(el.height - oldH) < 5) {
          fullBleedIds.add(el.id);
        }
      });

      const contentElements = elements.filter((el) => !fullBleedIds.has(el.id));

      let updatedElements: CollageElement[] = [];

      if (contentElements.length === 0) {
        updatedElements = elements.map((el) => ({
          ...el,
          width: newW,
          height: newH,
        }));
      } else {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const el of contentElements) {
          minX = Math.min(minX, el.x);
          minY = Math.min(minY, el.y);
          maxX = Math.max(maxX, el.x + el.width);
          maxY = Math.max(maxY, el.y + el.height);
        }

        const contentW = Math.max(10, maxX - minX);
        const contentH = Math.max(10, maxY - minY);

        // Fit nicely within 94% of the target canvas dimension
        const maxTargetW = newW * 0.94;
        const maxTargetH = newH * 0.94;

        const scale = Math.min(maxTargetW / contentW, maxTargetH / contentH);
        const scaledW = contentW * scale;
        const scaledH = contentH * scale;

        const targetMinX = Math.round((newW - scaledW) / 2);
        const targetMinY = Math.round((newH - scaledH) / 2);

        updatedElements = elements.map((el) => {
          if (fullBleedIds.has(el.id)) {
            return { ...el, width: newW, height: newH };
          }

          const relX = el.x - minX;
          const relY = el.y - minY;

          const newX = Math.round(targetMinX + relX * scale);
          const newY = Math.round(targetMinY + relY * scale);
          const newWidth = Math.max(10, Math.round(el.width * scale));
          const newHeight = Math.max(10, Math.round(el.height * scale));

          if (el.type === "text") {
            const textEl = el as TextElement;
            return {
              ...textEl,
              x: newX,
              y: newY,
              width: newWidth,
              height: newHeight,
              fontSize: Math.max(10, Math.round(textEl.fontSize * scale)),
            };
          }

          return {
            ...el,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          };
        });
      }

      setStore({
        document: {
          ...state.document,
          elements: updatedElements as CollageElement[],
          updatedAt: new Date().toISOString(),
        },
      });
      getStore().saveToStorage();
    },

    // Viewport
    setZoom: (zoom) =>
      setStore((s) => ({ zoom: typeof zoom === "function" ? zoom(s.zoom) : zoom })),
    setPan: (pan) =>
      setStore((s) => ({ pan: typeof pan === "function" ? pan(s.pan) : pan })),
    setIsPanning: (isPanning) => setStore({ isPanning }),
    setGuides: (guides) => setStore({ guides }),
    clearGuides: () => setStore({ guides: [] }),
    toggleGrid: () => setStore((s) => ({ showGrid: !s.showGrid })),

    // UI Panels & Modals
    setActivePanel: (panel) => {
      setStoredActivePanel(panel);
      setStore({ activePanel: panel });
    },
    setExportModalOpen: (open) => setStore({ exportModalOpen: open }),
    setPresetModalOpen: (open) => setStore({ presetModalOpen: open }),
    setShortcutModalOpen: (open) => setStore({ shortcutModalOpen: open }),
    setAutoLayoutModalOpen: (open) => setStore({ autoLayoutModalOpen: open }),
    setProjectModalOpen: (open) => setStore({ projectModalOpen: open }),
    setSaveTemplateModalOpen: (open) => setStore({ saveTemplateModalOpen: open }),
    setWatermarkModalOpen: (open) => setStore({ watermarkModalOpen: open }),
    setIsExporting: (exporting) => setStore({ isExporting: exporting }),

    // Templates & New Project
    loadTemplate: (templateId, adaptToCurrentCanvas = true) => {
      const state = getStore();
      const target = TEMPLATES.find((t) => t.id === templateId);
      if (target) {
        const currentW = state.document.canvas.width;
        const currentH = state.document.canvas.height;
        // 自适应只调整尺寸，不沿用当前画布背景，避免所有模板被当前白色背景覆盖。
        // 每个模板会使用自己的默认背景色/背景配置。
        const newDoc = adaptToCurrentCanvas
          ? target.createDocument(currentW, currentH)
          : target.createDocument();

        setStore({
          document: newDoc,
          currentProjectId: null,
          isDirty: true,
          selectedIds: [],
          editingCropId: null,
          past: [],
          future: [],
        });
        getStore().saveToStorage();
        return;
      }

      const custom = state.customTemplates.find((t) => t.id === templateId);
      if (custom) {
        const cloned: CollageDocument = JSON.parse(JSON.stringify(custom.document));
        cloned.id = generateId("doc");
        setStore({
          document: cloned,
          currentProjectId: null,
          isDirty: true,
          selectedIds: [],
          editingCropId: null,
          past: [],
          future: [],
        });
        getStore().saveToStorage();
      }
    },

    createNewProject: (presetId) => {
      const preset = CANVAS_PRESETS.find((p) => p.id === presetId) || CANVAS_PRESETS[0];
      const newDoc: CollageDocument = {
        id: generateId("doc"),
        version: 1,
        name: "未命名画报作品",
        canvas: {
          width: preset.width,
          height: preset.height,
          unit: "px",
          backgroundType: "color",
          backgroundColor: "#FFFFFF",
          presetName: preset.name,
        },
        elements: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setStore({
        document: newDoc,
        currentProjectId: null,
        isDirty: true,
        selectedIds: [],
        editingCropId: null,
        past: [],
        future: [],
      });
      getStore().saveToStorage();
    },

    // Project Persistence & Custom Templates
    saveCurrentProject: async (customName) => {
      const state = getStore();
      const currentDoc = state.document;
      const projName = customName || currentDoc.name || "未命名画报";
      const userId = state.currentUser?.id || "guest_user";

      const projectId = state.currentProjectId || generateId("proj");
      const now = new Date().toISOString();
      let previewThumbnail = "";
      try {
        previewThumbnail = await generateCanvasThumbnail(currentDoc, 280);
      } catch (e) {}

      const savedItem: SavedProject = {
        id: projectId,
        name: projName,
        preview: previewThumbnail || undefined,
        canvasWidth: currentDoc.canvas.width,
        canvasHeight: currentDoc.canvas.height,
        presetName: currentDoc.canvas.presetName,
        document: {
          ...JSON.parse(JSON.stringify(currentDoc)),
          name: projName,
          updatedAt: now,
        },
        createdAt: state.savedProjects.find((p) => p.id === projectId)?.createdAt || now,
        updatedAt: now,
      };

      const updatedList = [
        savedItem,
        ...state.savedProjects.filter((p) => p.id !== projectId),
      ];

      setStore({
        savedProjects: updatedList,
        currentProjectId: projectId,
        isDirty: false,
        lastSavedTime: new Date().toLocaleTimeString(),
        document: { ...currentDoc, name: projName },
      });

      try {
        await set(getStorageUserProjectsKey(userId), updatedList);
        await set(getStorageUserDocKey(userId), currentDoc);
      } catch (e) {
        console.warn("Storage save failed:", e);
      }

      return savedItem;
    },

    saveAsNewProject: async (name) => {
      const state = getStore();
      const newProjId = generateId("proj");
      const now = new Date().toISOString();
      const userId = state.currentUser?.id || "guest_user";

      const newDoc: CollageDocument = {
        ...JSON.parse(JSON.stringify(state.document)),
        id: generateId("doc"),
        name: name.trim() || "未命名画报",
        updatedAt: now,
      };

      let previewThumbnail = "";
      try {
        previewThumbnail = await generateCanvasThumbnail(newDoc, 280);
      } catch (e) {}

      const savedItem: SavedProject = {
        id: newProjId,
        name: newDoc.name,
        preview: previewThumbnail || undefined,
        canvasWidth: newDoc.canvas.width,
        canvasHeight: newDoc.canvas.height,
        presetName: newDoc.canvas.presetName,
        document: newDoc,
        createdAt: now,
        updatedAt: now,
      };

      const updatedList = [savedItem, ...state.savedProjects];

      setStore({
        document: newDoc,
        savedProjects: updatedList,
        currentProjectId: newProjId,
        isDirty: false,
        lastSavedTime: new Date().toLocaleTimeString(),
      });

      try {
        await set(getStorageUserProjectsKey(userId), updatedList);
        await set(getStorageUserDocKey(userId), newDoc);
      } catch (e) {
        console.warn("Storage save failed:", e);
      }

      return savedItem;
    },

    saveAsCustomTemplate: async (name, description = "用户自制排版模板", category = "我的模板") => {
      const state = getStore();
      const templateId = generateId("tpl_custom");
      const now = new Date().toISOString();
      const userId = state.currentUser?.id || "guest_user";

      const newTemplate: CustomTemplate = {
        id: templateId,
        name: name.trim() || "我的自制模板",
        description,
        category,
        document: JSON.parse(JSON.stringify(state.document)),
        createdAt: now,
      };

      const updatedList = [newTemplate, ...state.customTemplates];
      setStore({ customTemplates: updatedList });

      try {
        await set(getStorageUserTemplatesKey(userId), updatedList);
      } catch (e) {
        console.warn("Storage save custom template failed:", e);
      }

      return newTemplate;
    },

    loadSavedProject: async (projectId) => {
      const state = getStore();
      const proj = state.savedProjects.find((p) => p.id === projectId);
      if (!proj) return;

      const loadedDoc: CollageDocument = JSON.parse(JSON.stringify(proj.document));
      setStore({
        document: loadedDoc,
        currentProjectId: proj.id,
        isDirty: false,
        selectedIds: [],
        editingCropId: null,
        past: [],
        future: [],
      });

      await getStore().saveToStorage();
    },

    duplicateSavedProject: async (projectId) => {
      const state = getStore();
      const proj = state.savedProjects.find((p) => p.id === projectId);
      if (!proj) return null;
      const userId = state.currentUser?.id || "guest_user";

      const newId = generateId("proj");
      const now = new Date().toISOString();
      const clonedDoc: CollageDocument = JSON.parse(JSON.stringify(proj.document));
      clonedDoc.id = generateId("doc");
      clonedDoc.name = `${proj.name} (副本)`;
      clonedDoc.updatedAt = now;

      const duplicatedItem: SavedProject = {
        id: newId,
        name: clonedDoc.name,
        preview: proj.preview,
        canvasWidth: proj.canvasWidth,
        canvasHeight: proj.canvasHeight,
        presetName: proj.presetName,
        document: clonedDoc,
        createdAt: now,
        updatedAt: now,
      };

      const updatedList = [duplicatedItem, ...state.savedProjects];
      setStore({ savedProjects: updatedList });

      try {
        await set(getStorageUserProjectsKey(userId), updatedList);
      } catch (e) {
        console.warn(e);
      }
      return duplicatedItem;
    },

    renameSavedProject: async (projectId, newName) => {
      const state = getStore();
      const userId = state.currentUser?.id || "guest_user";
      const updatedList = state.savedProjects.map((p) => {
        if (p.id === projectId) {
          const updatedDoc = { ...p.document, name: newName.trim() };
          return { ...p, name: newName.trim(), document: updatedDoc, updatedAt: new Date().toISOString() };
        }
        return p;
      });

      setStore({
        savedProjects: updatedList,
        document: state.currentProjectId === projectId ? { ...state.document, name: newName.trim() } : state.document,
      });

      try {
        await set(getStorageUserProjectsKey(userId), updatedList);
      } catch (e) {
        console.warn(e);
      }
    },

    deleteSavedProject: async (projectId) => {
      const state = getStore();
      const userId = state.currentUser?.id || "guest_user";
      const updated = state.savedProjects.filter((p) => p.id !== projectId);
      setStore({
        savedProjects: updated,
        currentProjectId: state.currentProjectId === projectId ? null : state.currentProjectId,
      });

      try {
        await set(getStorageUserProjectsKey(userId), updated);
      } catch (e) {
        console.warn(e);
      }
    },

    deleteCustomTemplate: async (templateId) => {
      const state = getStore();
      const userId = state.currentUser?.id || "guest_user";
      const updated = state.customTemplates.filter((t) => t.id !== templateId);
      setStore({ customTemplates: updated });

      try {
        await set(getStorageUserTemplatesKey(userId), updated);
      } catch (e) {
        console.warn(e);
      }
    },

    exportProjectFile: () => {
      const { document, currentUser } = getStore();
      const exportData = {
        format: "atelier_project",
        version: 2,
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser?.name || "匿名创作者",
        document,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${(document.name || "atelier_project").toLowerCase().replace(/\s+/g, "_")}.atelier`;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },

    importProjectFile: async (file) => {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        let docToLoad: CollageDocument | null = null;

        if (data.format === "atelier_project" && data.document) {
          docToLoad = data.document;
        } else if (data.canvas && Array.isArray(data.elements)) {
          docToLoad = data as CollageDocument;
        }

        if (docToLoad) {
          getStore().setDocument(docToLoad, true);
          return true;
        }
      } catch (err) {
        console.error("Import failed:", err);
      }
      return false;
    },

    undo: () => {
      const { past, future, document } = getStore();
      if (past.length === 0) return;

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      const newFuture = [JSON.parse(JSON.stringify(document)), ...future];

      setStore({
        document: previous,
        past: newPast,
        future: newFuture,
        selectedIds: [],
        isDirty: true,
      });
      getStore().saveToStorage();
    },

    redo: () => {
      const { past, future, document } = getStore();
      if (future.length === 0) return;

      const next = future[0];
      const newFuture = future.slice(1);
      const newPast = [...past, JSON.parse(JSON.stringify(document))];

      setStore({
        document: next,
        past: newPast,
        future: newFuture,
        selectedIds: [],
        isDirty: true,
      });
      getStore().saveToStorage();
    },

    canUndo: () => getStore().past.length > 0,
    canRedo: () => getStore().future.length > 0,

        saveToStorage: async () => {
      if (saveStorageTimeout) {
        clearTimeout(saveStorageTimeout);
        saveStorageTimeout = null;
      }
      try {
        const { document, currentUser, savedProjects, customTemplates, mediaAssets, userAccounts } = getStore();
        
        const localAccs = getLocalStoredAccounts();
        const mergedAccounts = mergeAccounts(DEFAULT_ACCOUNTS, localAccs, userAccounts);
        setLocalStoredAccounts(mergedAccounts);
        try {
          await set(STORAGE_ACCOUNTS_KEY, mergedAccounts);
        } catch (e) {}

        if (currentUser) {
          const userId = currentUser.id;
          setLocalActiveUserId(userId);
          try {
            await set(STORAGE_ACTIVE_USER_ID_KEY, userId);
            await set(getStorageUserDocKey(userId), document);
            await set(getStorageUserProjectsKey(userId), savedProjects);
            await set(getStorageUserTemplatesKey(userId), customTemplates);
            await set(getStorageUserMediaKey(userId), mediaAssets);
          } catch (e) {}

          // Cloud sync to server
          apiSaveUserData(userId, {
            document,
            savedProjects,
            customTemplates,
            mediaAssets,
          }).catch(() => {});
        } else {
          // Guest session persistence
          try {
            await set(getStorageUserDocKey("guest_user"), document);
          } catch (e) {}
        }
      } catch (err) {
        console.warn("Failed to auto-save to storage:", err);
      }
    },

    loadFromStorage: async () => {
      applyThemeClass(getStoredTheme());
      try {
        const localAccs = getLocalStoredAccounts();
        let idbAccs: UserAccount[] = [];
        try {
          idbAccs = (await get<UserAccount[]>(STORAGE_ACCOUNTS_KEY)) || [];
        } catch (e) {}

        // Fetch server accounts
        let serverAccs: UserAccount[] | null = null;
        try {
          serverAccs = await apiFetchAccounts();
        } catch (e) {}

        const accounts = mergeAccounts(DEFAULT_ACCOUNTS, localAccs, idbAccs, serverAccs);
        setLocalStoredAccounts(accounts);
        try {
          await set(STORAGE_ACCOUNTS_KEY, accounts);
        } catch (e) {}

        // Sync local accounts to server in background
        apiSyncAccounts(accounts).catch(() => {});
        getStore().fetchAiStyles().catch(() => {});
        getStore().fetchAiHistory().catch(() => {});

        // Restore persisted queue from IndexedDB
        try {
          const savedQueue = await get<GenerationQueueTask[]>("atelier_ai_queue");
          if (Array.isArray(savedQueue) && savedQueue.length > 0) {
            const cleaned = savedQueue.map((t) =>
              t.status === "running" ? { ...t, status: "pending" as const, stageText: "准备重试..." } : t
            );
            setStore({ aiQueue: cleaned });
            setTimeout(() => {
              getStore().processNextQueueTask();
            }, 800);
          }
        } catch (e) {}

        // Check active user ID from localStorage or IndexedDB
        let activeId: string | null | undefined = getLocalActiveUserId();
        if (!activeId) {
          try {
            activeId = (await get<string>(STORAGE_ACTIVE_USER_ID_KEY)) || null;
          } catch (e) {}
        }

       let activeUser = activeId ? accounts.find((a) => a.id === activeId) : null;
       if (activeUser && activeUser.status === "banned") {
         activeUser = null;
         setLocalActiveUserId(null);
       }
 
       if (activeUser) {
         setLocalActiveUserId(activeUser.id);
          let userDoc: CollageDocument | undefined;
          let savedProjects: SavedProject[] = [];
          let customTemplates: CustomTemplate[] = [];
          let mediaAssets: UserMediaAsset[] = [];

          // Try server fetch
          try {
            const remoteData = await apiGetUserData(activeUser.id);
            if (remoteData) {
              if (remoteData.document) userDoc = remoteData.document;
              if (Array.isArray(remoteData.savedProjects)) savedProjects = remoteData.savedProjects;
              if (Array.isArray(remoteData.customTemplates)) customTemplates = remoteData.customTemplates;
              if (Array.isArray(remoteData.mediaAssets)) mediaAssets = remoteData.mediaAssets;
            }
          } catch (e) {}

          // Fallback to IndexedDB if empty & bidirectional media merge
          try {
            if (!userDoc) {
              userDoc = await get<CollageDocument>(getStorageUserDocKey(activeUser.id));
            }
            if (savedProjects.length === 0) {
              const lp = await get<SavedProject[]>(getStorageUserProjectsKey(activeUser.id));
              if (Array.isArray(lp)) savedProjects = lp;
            }
            if (customTemplates.length === 0) {
              const lt = await get<CustomTemplate[]>(getStorageUserTemplatesKey(activeUser.id));
              if (Array.isArray(lt)) customTemplates = lt;
            }

            const lm = (await get<UserMediaAsset[]>(getStorageUserMediaKey(activeUser.id))) || [];
            const validLocal = Array.isArray(lm) ? lm : [];
            const mediaMap = new Map<string, UserMediaAsset>();
            for (const a of validLocal) {
              if (a && a.id) mediaMap.set(a.id, a);
            }
            for (const a of mediaAssets) {
              if (a && a.id) mediaMap.set(a.id, a);
            }
            const mergedMedia = Array.from(mediaMap.values());
            if (validLocal.length > 0 && mergedMedia.length > mediaAssets.length) {
              apiSaveUserMedia(activeUser.id, mergedMedia).catch(() => {});
            }
            await set(getStorageUserMediaKey(activeUser.id), mergedMedia);
            mediaAssets = mergedMedia;
          } catch (e) {}

          const currentSavedView = getStoredView();
          setStore({
            userAccounts: accounts,
            currentUser: activeUser,
            isAuthenticated: true,
            currentView: currentSavedView === "home" ? "home" : "studio",
            savedProjects: Array.isArray(savedProjects) ? savedProjects : [],
            customTemplates: Array.isArray(customTemplates) ? customTemplates : [],
            mediaAssets: Array.isArray(mediaAssets) ? mediaAssets : [],
          });

          if (userDoc && userDoc.canvas && Array.isArray(userDoc.elements)) {
            // Upgrade old default 1200x1600 canvas to standard Mijia 6-inch vertical (1181x1748)
            if (userDoc.canvas.width === 1200 && userDoc.canvas.height === 1600) {
              userDoc.canvas.width = 1181;
              userDoc.canvas.height = 1748;
              if (!userDoc.canvas.presetName || userDoc.canvas.presetName === 'Quiet Journeys (Gallery)' || userDoc.canvas.presetName === '九宫格') {
                userDoc.canvas.presetName = '米家 6 寸相纸 (竖版)';
              }
            }
            setStore({ document: userDoc, past: [], future: [] });
          } else {
            setStore({ document: initialDoc, past: [], future: [] });
          }

          // 立即同步拉取当前用户的生成历史，确保首屏打开立刻展示
          getStore().fetchAiHistory(activeUser.id).catch(() => {});
        } else {
          setLocalActiveUserId(null);
          setStore({
            userAccounts: accounts,
            currentUser: null,
            isAuthenticated: false,
            currentView: "home",
          });
        }
        return true;
      } catch (err) {
        console.warn("Failed to load from storage:", err);
      }
      return false;
    },
  };
});

if (typeof window !== "undefined") {
  (window as any).__MAR_STORE__ = useEditorStore;
}
