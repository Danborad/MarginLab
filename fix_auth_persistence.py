import re

# Read useEditorStore.ts
with open("src/store/useEditorStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the top helpers
helpers_code = '''// Multi-user & Auth Storage Keys (Strictly isolated per registered user)
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
};'''

# Replace from `// Multi-user & Auth Storage Keys` up to `export type ActivePanel`
pattern_top = re.compile(
    r"// Multi-user & Auth Storage Keys.*?export type ActivePanel",
    re.DOTALL
)
content = pattern_top.sub(helpers_code + "\n\nexport type ActivePanel", content, count=1)

# Now replace initial userAccounts in store creation
pattern_init = re.compile(
    r"userAccounts:\s*DEFAULT_ACCOUNTS,",
)
content = pattern_init.sub("userAccounts: getLocalStoredAccounts(),", content)

# Now replace login, register, logout, and other auth methods in useEditorStore.ts
auth_methods = '''    // Real Authentication: Login with Username & Password
    login: async (username, password) => {
      const state = getStore();

      // 1. Sync accounts from localStorage, IndexedDB, and memory to ensure no account is lost
      const localAccs = getLocalStoredAccounts();
      let idbAccs: UserAccount[] = [];
      try {
        idbAccs = (await get<UserAccount[]>(STORAGE_ACCOUNTS_KEY)) || [];
      } catch (e) {}
      const mergedAccounts = mergeAccounts(DEFAULT_ACCOUNTS, localAccs, idbAccs, state.userAccounts);

      // 2. Normalize input: clean spaces, strip '@' prefix, match username/nickname/email/id
      const rawUser = username.trim();
      const cleanUser = rawUser.toLowerCase();
      const cleanWithoutAt = cleanUser.startsWith("@") ? cleanUser.slice(1).trim() : cleanUser;

      const user = mergedAccounts.find((u) => {
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

      if (!user) {
        return { success: false, message: "账号不存在，请核对用户名或先注册新账号" };
      }

      // Check password
      const passTrim = password.trim();
      const passRaw = password;
      if (user.passwordHash && user.passwordHash !== passTrim && user.passwordHash !== passRaw) {
        return { success: false, message: "密码错误，请重新输入" };
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

      const updatedAccounts = mergedAccounts.map((u) =>
        u.id === user.id ? updatedUser : u
      );

      // Persist accounts & active user synchronously + asynchronously
      setLocalStoredAccounts(updatedAccounts);
      setLocalActiveUserId(user.id);
      try {
        await set(STORAGE_ACCOUNTS_KEY, updatedAccounts);
        await set(STORAGE_ACTIVE_USER_ID_KEY, user.id);
      } catch (e) {}

      // Load target user's isolated data with safe fallback
      let targetDoc: CollageDocument | undefined;
      let targetProjects: SavedProject[] = [];
      let targetTemplates: CustomTemplate[] = [];
      let targetMedia: UserMediaAsset[] = [];

      try {
        targetDoc = await get<CollageDocument>(getStorageUserDocKey(user.id));
        targetProjects = (await get<SavedProject[]>(getStorageUserProjectsKey(user.id))) || [];
        targetTemplates = (await get<CustomTemplate[]>(getStorageUserTemplatesKey(user.id))) || [];
        targetMedia = (await get<UserMediaAsset[]>(getStorageUserMediaKey(user.id))) || [];
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
    register: async ({ username, password, name, avatar, role, bio, email }) => {
      const state = getStore();
      const rawUser = username.trim();
      const cleanUser = rawUser.toLowerCase();
      const cleanWithoutAt = cleanUser.startsWith("@") ? cleanUser.slice(1).trim() : cleanUser;

      if (!cleanWithoutAt || cleanWithoutAt.length < 3) {
        return { success: false, message: "登录账号至少需要 3 个字符（支持英文字母与数字）" };
      }

      if (!password || password.trim().length < 4) {
        return { success: false, message: "密码至少需要 4 位字符" };
      }

      // Sync latest accounts from all storages
      const localAccs = getLocalStoredAccounts();
      let idbAccs: UserAccount[] = [];
      try {
        idbAccs = (await get<UserAccount[]>(STORAGE_ACCOUNTS_KEY)) || [];
      } catch (e) {}
      const mergedAccounts = mergeAccounts(DEFAULT_ACCOUNTS, localAccs, idbAccs, state.userAccounts);

      // Check username uniqueness
      const exists = mergedAccounts.some(
        (u) => (u.username && u.username.toLowerCase() === cleanWithoutAt)
      );

      if (exists) {
        return { success: false, message: `账号 “${rawUser}” 已被注册，请更换其他用户名或直接登录` };
      }

      // Save previous state if logged in
      if (state.currentUser) {
        try {
          await state.saveToStorage();
        } catch (e) {}
      }

      const newUserId = generateId("user");
      const newAccount: UserAccount = {
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

      const updatedAccounts = [...mergedAccounts, newAccount];
      const initialNewDoc = TEMPLATES[0].createDocument();

      // Persist synchronously and asynchronously
      setLocalStoredAccounts(updatedAccounts);
      setLocalActiveUserId(newUserId);

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
        try {
          await state.saveToStorage();
        } catch (e) {}
      }

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
        currentView: "home",
      });
    },'''

# Replace from `// Real Authentication: Login with Username & Password` up to `// Update Profile Information`
pattern_auth = re.compile(
    r"// Real Authentication: Login with Username & Password.*?// Update Profile Information",
    re.DOTALL
)
content = pattern_auth.sub(auth_methods + "\n\n    // Update Profile Information", content, count=1)

# Now replace saveToStorage and loadFromStorage at bottom
storage_methods = '''    saveToStorage: async () => {
      try {
        const { document, currentUser, savedProjects, customTemplates, mediaAssets, userAccounts } = getStore();
        
        // Always merge accounts to guarantee registered users are never wiped out
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
      try {
        const localAccs = getLocalStoredAccounts();
        let idbAccs: UserAccount[] = [];
        try {
          idbAccs = (await get<UserAccount[]>(STORAGE_ACCOUNTS_KEY)) || [];
        } catch (e) {}

        const accounts = mergeAccounts(DEFAULT_ACCOUNTS, localAccs, idbAccs);
        setLocalStoredAccounts(accounts);
        try {
          await set(STORAGE_ACCOUNTS_KEY, accounts);
        } catch (e) {}

        // Check active user ID from localStorage or IndexedDB
        let activeId = getLocalActiveUserId();
        if (!activeId) {
          try {
            activeId = await get<string>(STORAGE_ACTIVE_USER_ID_KEY);
          } catch (e) {}
        }

        let activeUser = activeId ? accounts.find((a) => a.id === activeId) : null;

        if (activeUser) {
          setLocalActiveUserId(activeUser.id);
          let userDoc: CollageDocument | undefined;
          let savedProjects: SavedProject[] = [];
          let customTemplates: CustomTemplate[] = [];
          let mediaAssets: UserMediaAsset[] = [];

          try {
            userDoc = await get<CollageDocument>(getStorageUserDocKey(activeUser.id));
            savedProjects = (await get<SavedProject[]>(getStorageUserProjectsKey(activeUser.id))) || [];
            customTemplates = (await get<CustomTemplate[]>(getStorageUserTemplatesKey(activeUser.id))) || [];
            mediaAssets = (await get<UserMediaAsset[]>(getStorageUserMediaKey(activeUser.id))) || [];
          } catch (e) {}

          setStore({
            userAccounts: accounts,
            currentUser: activeUser,
            isAuthenticated: true,
            currentView: "studio",
            savedProjects: Array.isArray(savedProjects) ? savedProjects : [],
            customTemplates: Array.isArray(customTemplates) ? customTemplates : [],
            mediaAssets: Array.isArray(mediaAssets) ? mediaAssets : [],
          });

          if (userDoc && userDoc.canvas && Array.isArray(userDoc.elements)) {
            setStore({ document: userDoc, past: [], future: [] });
          } else {
            setStore({ document: TEMPLATES[0].createDocument(), past: [], future: [] });
          }
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
    },'''

pattern_storage = re.compile(
    r"saveToStorage:\s*async\s*\(\)\s*=>\s*\{.*?loadFromStorage:\s*async\s*\(\)\s*=>\s*\{.*?\n\s*return false;\s*\n\s*\},",
    re.DOTALL
)
content = pattern_storage.sub(storage_methods, content, count=1)

with open("src/store/useEditorStore.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated useEditorStore.ts successfully!")
