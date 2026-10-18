import re

with open("src/store/useEditorStore.ts", "r") as f:
    orig = f.read()

# Let's extract the methods starting from `// Core Canvas Document Actions`
core_actions_idx = orig.find("// Core Canvas Document Actions")
if core_actions_idx == -1:
    raise Exception("Could not find Core Canvas Document Actions")

core_actions_and_below = orig[core_actions_idx:]

# Let's replace any direct `state.currentUser.id` or `currentUser.id` in `core_actions_and_below`
# with safe access `state.currentUser?.id || "guest_user"` if applicable
core_actions_and_below = core_actions_and_below.replace("const userId = state.currentUser.id;", 'const userId = state.currentUser?.id || "guest_user";')
core_actions_and_below = core_actions_and_below.replace("const userId = currentUser.id;", 'const userId = currentUser?.id || "guest_user";')
core_actions_and_below = core_actions_and_below.replace("exportedBy: currentUser.name,", 'exportedBy: currentUser?.name || "匿名创作者",')

# Now let's construct the top and interface
header_and_store = """import { create } from "zustand";
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
    id: "user_pro",
    username: "atelier",
    passwordHash: "123456",
    name: "Atelier Pro 主理人",
    avatar: "🎨",
    role: "主理人 / 艺术指导",
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
    bio: "米家 3 寸口袋相纸、拍立得手记与日常灵感拼贴",
    themeColor: "#34D399",
    createdAt: "2026-01-04T00:00:00.000Z",
    lastLoginAt: "2026-08-22T10:00:00.000Z",
  },
];

export type ActivePanel =
  | "templates"
  | "media"
  | "text"
  | "shapes"
  | "stickers"
  | "background"
  | "layers";

export type AuthTab = "login" | "register" | "profile" | "changePassword";

export interface EditorState {
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
    username: string;
    password: string;
    name: string;
    avatar?: string;
    role?: string;
    bio?: string;
    email?: string;
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
    items: { name: string; src: string; width: number; height: number; aspectRatio?: number; sizeBytes?: number }[]
  ) => Promise<UserMediaAsset[]>;
  deleteMediaAsset: (assetId: string) => Promise<void>;
  clearAllMediaAssets: () => Promise<void>;

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

  // UI State
  activePanel: ActivePanel;
  isExporting: boolean;
  exportModalOpen: boolean;
  presetModalOpen: boolean;
  shortcutModalOpen: boolean;
  autoLayoutModalOpen: boolean;
  projectModalOpen: boolean;
  saveTemplateModalOpen: boolean;

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
  setIsExporting: (exporting: boolean) => void;

  // Templates & New Project
  loadTemplate: (templateId: string, adaptToCurrentCanvas?: boolean) => void;
  createNewProject: (presetId?: string) => void;

  // Project Persistence & Custom Templates
  saveCurrentProject: (customName?: string) => Promise<SavedProject>;
  saveAsNewProject: (name: string) => Promise<SavedProject>;
  saveAsCustomTemplate: (name: string, description?: string, category?: string) => Promise<CustomTemplate>;
  loadSavedProject: (projectId: string) => Promise<void>;
  duplicateSavedProject: (projectId: string) => Promise<SavedProject | null>;
  renameSavedProject: (projectId: string, newName: string) => Promise<void>;
  deleteSavedProject: (projectId: string) => Promise<void>;
  deleteCustomTemplate: (templateId: string) => Promise<void>;
  exportProjectFile: () => void;
  importProjectFile: (file: File) => Promise<boolean>;

  // History Undo / Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Storage
  saveToStorage: () => Promise<void>;
  loadFromStorage: () => Promise<boolean>;
}

// Initial default template
const initialDoc: CollageDocument = TEMPLATES[0].createDocument();

export const useEditorStore = create<EditorState>((setStore, getStore) => {
  const pushSnapshot = (currentDoc: CollageDocument) => {
    const { past } = getStore();
    const newPast = [...past.slice(-30), JSON.parse(JSON.stringify(currentDoc))];
    return { past: newPast, future: [], isDirty: true };
  };

  return {
    // Multi-user initial state
    currentUser: DEFAULT_ACCOUNTS[0],
    isAuthenticated: true,
    userAccounts: DEFAULT_ACCOUNTS,
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

    activePanel: "templates",
    isExporting: false,
    exportModalOpen: false,
    presetModalOpen: false,
    shortcutModalOpen: false,
    autoLayoutModalOpen: false,
    projectModalOpen: false,
    saveTemplateModalOpen: false,

    past: [],
    future: [],

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
      const trimmedUser = username.trim().toLowerCase();
      const user = state.userAccounts.find(
        (u) => (u.username && u.username.toLowerCase() === trimmedUser) || (u.id === username.trim())
      );

      if (!user) {
        return { success: false, message: "账号不存在，请检查或先注册新账号" };
      }

      if (user.passwordHash && user.passwordHash !== password.trim()) {
        return { success: false, message: "密码错误，请重新输入" };
      }

      // Auto-save previous session if any
      if (state.currentUser) {
        await state.saveToStorage();
      }

      const updatedUser = {
        ...user,
        lastLoginAt: new Date().toISOString(),
      };

      const updatedAccounts = state.userAccounts.map((u) =>
        u.id === user.id ? updatedUser : u
      );

      // Load target user's isolated data
      try {
        const targetDoc = await get<CollageDocument>(getStorageUserDocKey(user.id));
        const targetProjects = (await get<SavedProject[]>(getStorageUserProjectsKey(user.id))) || [];
        const targetTemplates = (await get<CustomTemplate[]>(getStorageUserTemplatesKey(user.id))) || [];
        const targetMedia = (await get<UserMediaAsset[]>(getStorageUserMediaKey(user.id))) || [];

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
        });

        await set(STORAGE_ACCOUNTS_KEY, updatedAccounts);
        await set(STORAGE_ACTIVE_USER_ID_KEY, user.id);
        return { success: true, message: `欢迎回来，${user.name}！`, user: updatedUser };
      } catch (err) {
        console.error("Login load failed:", err);
        return { success: false, message: "加载账号数据失败，请重试" };
      }
    },

    // Real Authentication: Register New Individual Account
    register: async ({ username, password, name, avatar, role, bio, email }) => {
      const state = getStore();
      const trimmedUser = username.trim().toLowerCase();

      if (!trimmedUser || trimmedUser.length < 3) {
        return { success: false, message: "登录账号至少需要 3 个字符" };
      }

      if (!password || password.trim().length < 4) {
        return { success: false, message: "密码至少需要 4 位字符" };
      }

      // Check username uniqueness
      const exists = state.userAccounts.some(
        (u) => (u.username && u.username.toLowerCase() === trimmedUser)
      );

      if (exists) {
        return { success: false, message: `账号 “${username.trim()}” 已被注册，请更换其他用户名或直接登录` };
      }

      // Save previous state if logged in
      if (state.currentUser) {
        await state.saveToStorage();
      }

      const newUserId = generateId("user");
      const newAccount: UserAccount = {
        id: newUserId,
        username: username.trim(),
        passwordHash: password.trim(),
        name: name.trim() || username.trim(),
        avatar: avatar || "🎨",
        role: role?.trim() || "独立创作者",
        bio: bio?.trim() || "专注高定排版与艺术创作",
        email: email?.trim() || "",
        themeColor: "#E5C49F",
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      const updatedAccounts = [...state.userAccounts, newAccount];
      const initialNewDoc = TEMPLATES[0].createDocument();

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
      });

      try {
        await set(STORAGE_ACCOUNTS_KEY, updatedAccounts);
        await set(STORAGE_ACTIVE_USER_ID_KEY, newUserId);
        await set(getStorageUserDocKey(newUserId), initialNewDoc);
        await set(getStorageUserProjectsKey(newUserId), []);
        await set(getStorageUserTemplatesKey(newUserId), []);
        await set(getStorageUserMediaKey(newUserId), []);
      } catch (err) {
        console.warn("Storage init for new user failed:", err);
      }

      return { success: true, message: `恭喜！已成功注册并登录账号「${newAccount.name}」`, user: newAccount };
    },

    // Logout: Clears current active session and prompts login
    logout: async () => {
      const state = getStore();
      if (state.currentUser) {
        await state.saveToStorage();
      }

      setStore({
        currentUser: null,
        isAuthenticated: false,
        mediaAssets: [],
        savedProjects: [],
        customTemplates: [],
        selectedIds: [],
        authModalOpen: true,
        authModalTab: "login",
        userAccountModalOpen: true,
      });

      await set(STORAGE_ACTIVE_USER_ID_KEY, null);
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

      await set(STORAGE_ACCOUNTS_KEY, updatedAccounts);
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

      await set(STORAGE_ACCOUNTS_KEY, updatedAccounts);
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
      await set(STORAGE_ACCOUNTS_KEY, updatedAccounts);

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
        const targetDoc = await get<CollageDocument>(getStorageUserDocKey(targetUserId));
        const targetProjects = (await get<SavedProject[]>(getStorageUserProjectsKey(targetUserId))) || [];
        const targetTemplates = (await get<CustomTemplate[]>(getStorageUserTemplatesKey(targetUserId))) || [];
        const targetMedia = (await get<UserMediaAsset[]>(getStorageUserMediaKey(targetUserId))) || [];

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
        });

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

    // User Uploaded Media Assets (Isolated)
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
        createdAt: new Date().toISOString(),
      }));

      const updatedList = [...createdList, ...state.mediaAssets];
      setStore({ mediaAssets: updatedList });

      try {
        await set(getStorageUserMediaKey(userId), updatedList);
      } catch (err) {
        console.warn("Failed to persist user media asset:", err);
      }

      return createdList;
    },

    deleteMediaAsset: async (assetId) => {
      const state = getStore();
      const userId = state.currentUser?.id || "guest_user";
      const updatedList = state.mediaAssets.filter((a) => a.id !== assetId);
      setStore({ mediaAssets: updatedList });

      try {
        await set(getStorageUserMediaKey(userId), updatedList);
      } catch (err) {
        console.warn("Failed to delete media asset:", err);
      }
    },

    clearAllMediaAssets: async () => {
      const state = getStore();
      const userId = state.currentUser?.id || "guest_user";
      setStore({ mediaAssets: [] });

      try {
        await set(getStorageUserMediaKey(userId), []);
      } catch (err) {
        console.warn("Failed to clear media assets:", err);
      }
    },

"""

# Now write full file
full_code = header_and_store + core_actions_and_below

with open("src/store/useEditorStore.ts", "w") as f:
    f.write(full_code)

print("Generated new src/store/useEditorStore.ts successfully!")
