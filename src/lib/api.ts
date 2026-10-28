 import { UserAccount, SavedProject, CustomTemplate, UserMediaAsset, CollageDocument } from "../types/document";
 
 const API_BASE = "";
 
 async function safeFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
   try {
     const res = await fetch(url, {
       ...options,
       headers: {
         "Content-Type": "application/json",
         ...(options?.headers || {}),
       },
     });
     if (!res.ok) {
       const errorBody = await res.json().catch(() => null);
       throw new Error(errorBody?.message || `HTTP error ${res.status}`);
     }
     return await res.json();
   } catch (err: any) {
     console.warn(`[API] request to ${url} failed:`, err.message || err);
     return null;
   }
 }
 
 export async function apiFetchAccounts(): Promise<UserAccount[] | null> {
   const res = await safeFetch<{ success: boolean; accounts: UserAccount[] }>("/api/auth/accounts");
   if (res && res.success && Array.isArray(res.accounts)) {
     return res.accounts;
   }
   return null;
 }
 
 export async function apiRegister(data: {
   username?: string;
   password: string;
   name?: string;
   avatar?: string;
   role?: string;
   bio?: string;
   email?: string;
   code?: string;
 }): Promise<{ success: boolean; message: string; user?: UserAccount }> {
   try {
     const res = await fetch("/api/auth/register", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify(data),
     });
     const json = await res.json();
     return json;
   } catch (err: any) {
     return { success: false, message: err.message || "网络请求失败，请检查服务连接" };
   }
 }
 
 export async function apiLogin(
   username: string,
   password: string
 ): Promise<{ success: boolean; message: string; user?: UserAccount }> {
   try {
     const res = await fetch("/api/auth/login", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ username, password }),
     });
     const json = await res.json();
     return json;
   } catch (err: any) {
     return { success: false, message: err.message || "网络请求失败，请检查服务连接" };
   }
 }
 
 export async function apiUpdateProfile(
   userId: string,
   updates: Partial<UserAccount>
 ): Promise<{ success: boolean; message: string; user?: UserAccount }> {
   try {
     const res = await fetch("/api/auth/update-profile", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ userId, updates }),
     });
     return await res.json();
   } catch (err: any) {
     return { success: false, message: err.message || "更新失败" };
   }
 }
 
 export async function apiChangePassword(
   userId: string,
   oldPassword: string,
   newPassword: string
 ): Promise<{ success: boolean; message: string }> {
   try {
     const res = await fetch("/api/auth/change-password", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ userId, oldPassword, newPassword }),
     });
     return await res.json();
   } catch (err: any) {
     return { success: false, message: err.message || "修改密码请求失败" };
   }
 }
 
 export async function apiDeleteAccount(userId: string): Promise<{ success: boolean; message: string }> {
   try {
     const res = await fetch("/api/auth/delete-account", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ userId }),
     });
     return await res.json();
   } catch (err: any) {
     return { success: false, message: err.message || "注销账号失败" };
   }
 }
 
 export async function apiSyncAccounts(localAccounts: UserAccount[]): Promise<UserAccount[] | null> {
   const res = await safeFetch<{ success: boolean; accounts: UserAccount[] }>("/api/auth/sync-accounts", {
     method: "POST",
     body: JSON.stringify({ accounts: localAccounts }),
   });
   if (res && res.success && Array.isArray(res.accounts)) {
     return res.accounts;
   }
   return null;
 }
 
 export async function apiGetUserData(userId: string): Promise<{
   document: CollageDocument | null;
   savedProjects: SavedProject[];
   customTemplates: CustomTemplate[];
   mediaAssets: UserMediaAsset[];
 } | null> {
   const res = await safeFetch<{
     success: boolean;
     data: {
       document: CollageDocument | null;
       savedProjects: SavedProject[];
       customTemplates: CustomTemplate[];
       mediaAssets: UserMediaAsset[];
     };
   }>(`/api/user/${encodeURIComponent(userId)}/data`);
   if (res && res.success && res.data) {
     return res.data;
   }
   return null;
 }
 
import { AiConfig, GenerationTask, StylePreset } from "../types/ai";

export async function apiSaveUserData(
  userId: string,
  data: {
    document?: CollageDocument | null;
    savedProjects?: SavedProject[];
    customTemplates?: CustomTemplate[];
    mediaAssets?: UserMediaAsset[];
    deletedAssetId?: string;
    clearMediaAssets?: boolean;
  }
): Promise<boolean> {
  const res = await safeFetch<{ success: boolean }>(`/api/user/${encodeURIComponent(userId)}/data`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return !!res?.success;
}

export async function apiGetUserMedia(userId: string): Promise<UserMediaAsset[] | null> {
  const res = await safeFetch<{ success: boolean; mediaAssets: UserMediaAsset[] }>(
    `/api/user/${encodeURIComponent(userId)}/media`
  );
  if (res && res.success && Array.isArray(res.mediaAssets)) {
    return res.mediaAssets;
  }
  return null;
}

export async function apiSaveUserMedia(
  userId: string,
  mediaAssets: UserMediaAsset[]
): Promise<UserMediaAsset[] | null> {
  const res = await safeFetch<{ success: boolean; mediaAssets: UserMediaAsset[] }>(
    `/api/user/${encodeURIComponent(userId)}/media`,
    {
      method: "POST",
      body: JSON.stringify({ mediaAssets }),
    }
  );
  if (res && res.success && Array.isArray(res.mediaAssets)) {
    return res.mediaAssets;
  }
  return null;
}

export async function apiDeleteUserMedia(userId: string, assetId: string): Promise<boolean> {
  const res = await safeFetch<{ success: boolean }>(
    `/api/user/${encodeURIComponent(userId)}/media/${encodeURIComponent(assetId)}`,
    {
      method: "DELETE",
    }
  );
  return !!res?.success;
}

export async function apiClearUserMedia(userId: string): Promise<boolean> {
  const res = await safeFetch<{ success: boolean }>(
    `/api/user/${encodeURIComponent(userId)}/media`,
    {
      method: "DELETE",
    }
  );
  return !!res?.success;
}

// =========================================================================
// AI Model & Stylize APIs
// =========================================================================

 export async function apiGetAiStyles(all?: boolean, adminUserId?: string): Promise<StylePreset[] | null> {
  const params = new URLSearchParams();
  if (all) params.append("all", "true");
  if (adminUserId) params.append("adminUserId", adminUserId);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const res = await safeFetch<{ success: boolean; styles: StylePreset[] }>(`/api/ai/styles${qs}`);
  if (res && res.success && Array.isArray(res.styles)) {
    return res.styles;
  }
  return null;
}

export async function apiAdminSaveAiStyle(
  adminUserId: string,
  style: Partial<StylePreset> & { id: string }
): Promise<{ success: boolean; message: string; styles?: StylePreset[] }> {
  try {
    const res = await fetch("/api/admin/styles/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": adminUserId,
      },
      body: JSON.stringify({ ...style, adminUserId }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "保存风格模板失败" };
  }
}

export async function apiAdminToggleAiStyle(
  adminUserId: string,
  styleId: string,
  enabled: boolean
): Promise<{ success: boolean; message: string; styles?: StylePreset[] }> {
  try {
    const res = await fetch("/api/admin/styles/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": adminUserId,
      },
      body: JSON.stringify({ adminUserId, styleId, enabled }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "切换风格模板状态失败" };
  }
}

export async function apiAdminDeleteAiStyle(
  adminUserId: string,
  styleId: string
): Promise<{ success: boolean; message: string; styles?: StylePreset[] }> {
  try {
    const res = await fetch(`/api/admin/styles/${encodeURIComponent(styleId)}?adminUserId=${encodeURIComponent(adminUserId)}`, {
      method: "DELETE",
      headers: {
        "x-user-id": adminUserId,
      },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "删除风格模板失败" };
  }
}

export async function apiAdminResetAiStyles(
  adminUserId: string
): Promise<{ success: boolean; message: string; styles?: StylePreset[] }> {
  try {
    const res = await fetch("/api/admin/styles/reset", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": adminUserId,
      },
      body: JSON.stringify({ adminUserId }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "重置风格模板失败" };
  }
}

export async function apiGetAiConfig(): Promise<AiConfig | null> {
   const res = await safeFetch<{ success: boolean; config: AiConfig }>("/api/ai/config");
   if (res && res.success && res.config) {
     return res.config;
   }
   return null;
 }
 
 export async function apiSaveAiConfig(config: Partial<AiConfig>, adminUserId?: string): Promise<{ success: boolean; message: string; config?: AiConfig }> {
   try {
     const res = await fetch("/api/ai/config", {
       method: "POST",
       headers: {
         "Content-Type": "application/json",
         ...(adminUserId ? { "x-user-id": adminUserId } : {}),
       },
       body: JSON.stringify({ ...config, adminUserId }),
     });
     return await res.json();
   } catch (err: any) {
     return { success: false, message: err.message || "保存配置失败" };
   }
 }
 
/* ------------------------------------------------------------------ *
 * 备案信息（ICP 备案 / 公安部备案号）：全站统一，管理员可开关
 * ------------------------------------------------------------------ */

export interface SiteFilingConfig {
  icpEnabled: boolean;
  icpNumber: string;
  icpLink: string;
  policeEnabled: boolean;
  policeNumber: string;
  policeCode: string;
  policeLink: string;
  updatedAt?: string;
}

export const DEFAULT_SITE_FILING_CONFIG: SiteFilingConfig = {
  icpEnabled: false,
  icpNumber: "",
  icpLink: "https://beian.miit.gov.cn/",
  policeEnabled: false,
  policeNumber: "",
  policeCode: "",
  policeLink: "https://beian.mps.gov.cn/#/query/webSearch",
};

export async function apiGetSiteFilingConfig(): Promise<SiteFilingConfig | null> {
  const res = await safeFetch<{ success: boolean; config: SiteFilingConfig }>("/api/site/config");
  if (res && res.success && res.config) {
    return { ...DEFAULT_SITE_FILING_CONFIG, ...res.config };
  }
  return null;
}

export async function apiAdminSaveSiteFilingConfig(
  config: Partial<SiteFilingConfig>,
  adminUserId?: string
): Promise<{ success: boolean; message: string; config?: SiteFilingConfig }> {
  try {
    const res = await fetch("/api/admin/site/config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(adminUserId ? { "x-user-id": adminUserId } : {}),
      },
      body: JSON.stringify({ ...config, adminUserId }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "保存备案信息失败" };
  }
}

 export async function apiTestAiConfig(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("/api/ai/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "测试连接失败" };
  }
}

export async function apiFetchAiModels(params?: {
  baseUrl?: string;
  apiKey?: string;
}): Promise<{ success: boolean; message: string; models?: string[]; count?: number; isFallback?: boolean }> {
  try {
    const res = await fetch("/api/ai/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params || {}),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "拉取模型列表失败" };
  }
}

export async function apiGenerateStylizedImage(data: {
  prompt: string;
  styleId: string;
  styleName?: string;
  sourceImage?: string;
  aspectRatio?: string;
  customNotes?: string;
  specifiedText?: string;
  userId?: string;
}): Promise<{ success: boolean; message: string; image?: string; imageUrl?: string; task?: GenerationTask; needsConfig?: boolean }> {
  try {
    const res = await fetch("/api/ai/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "生成请求失败，请检查服务网络" };
  }
}

export async function apiGetAiHistory(userId?: string): Promise<GenerationTask[]> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  const res = await safeFetch<{ success: boolean; history: GenerationTask[] }>(`/api/ai/history${query}`);
  if (res && res.success && Array.isArray(res.history)) {
    return res.history;
  }
  return [];
}

 export async function apiDeleteAiHistory(id: string, userId?: string): Promise<GenerationTask[]> {
   const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
   const res = await safeFetch<{ success: boolean; history: GenerationTask[] }>(`/api/ai/history/${id}${query}`, {
     method: "DELETE",
   });
   if (res && res.success && Array.isArray(res.history)) {
     return res.history;
   }
   return [];
 }
 
 // =========================================================================
 // Admin Management APIs
 // =========================================================================
 
 export async function apiAdminGetUsers(adminUserId: string): Promise<{
   success: boolean;
   users: UserAccount[];
   total: number;
   activeCount: number;
   bannedCount: number;
   adminCount: number;
   message?: string;
 } | null> {
   try {
     const res = await fetch(`/api/admin/users?adminUserId=${encodeURIComponent(adminUserId)}`, {
       headers: { "x-user-id": adminUserId },
     });
     if (!res.ok) {
       const err = await res.json().catch(() => null);
       throw new Error(err?.message || `HTTP ${res.status}`);
     }
     return await res.json();
   } catch (err: any) {
     console.warn("[Admin API] Failed to get users:", err.message);
     return null;
   }
 }
 
 export async function apiAdminSetUserStatus(
   adminUserId: string,
   targetUserId: string,
   status: "active" | "banned"
 ): Promise<{ success: boolean; message: string; user?: UserAccount }> {
   try {
     const res = await fetch("/api/admin/users/status", {
       method: "POST",
       headers: { "Content-Type": "application/json", "x-user-id": adminUserId },
       body: JSON.stringify({ adminUserId, targetUserId, status }),
     });
     return await res.json();
   } catch (err: any) {
     return { success: false, message: err.message || "修改状态失败" };
   }
 }
 
 export async function apiAdminSetUserRole(
   adminUserId: string,
   targetUserId: string,
   role: string,
   isAdmin: boolean
 ): Promise<{ success: boolean; message: string; user?: UserAccount }> {
   try {
     const res = await fetch("/api/admin/users/role", {
       method: "POST",
       headers: { "Content-Type": "application/json", "x-user-id": adminUserId },
       body: JSON.stringify({ adminUserId, targetUserId, role, isAdmin }),
     });
     return await res.json();
   } catch (err: any) {
     return { success: false, message: err.message || "更新权限失败" };
   }
 }
 
 export async function apiAdminResetPassword(
   adminUserId: string,
   targetUserId: string,
   newPassword: string
 ): Promise<{ success: boolean; message: string; user?: UserAccount }> {
   try {
     const res = await fetch("/api/admin/users/reset-password", {
       method: "POST",
       headers: { "Content-Type": "application/json", "x-user-id": adminUserId },
       body: JSON.stringify({ adminUserId, targetUserId, newPassword }),
     });
     return await res.json();
   } catch (err: any) {
     return { success: false, message: err.message || "重置密码失败" };
   }
 }
 
 export async function apiAdminCreateUser(
   adminUserId: string,
   userData: {
     username: string;
     password: string;
     name?: string;
     avatar?: string;
     role?: string;
     bio?: string;
     email?: string;
     isAdmin?: boolean;
   }
 ): Promise<{ success: boolean; message: string; user?: UserAccount }> {
   try {
     const res = await fetch("/api/admin/users/create", {
       method: "POST",
       headers: { "Content-Type": "application/json", "x-user-id": adminUserId },
       body: JSON.stringify({ ...userData, adminUserId }),
     });
     return await res.json();
   } catch (err: any) {
     return { success: false, message: err.message || "创建用户失败" };
   }
 }
 
 export async function apiAdminDeleteUser(
   adminUserId: string,
   targetUserId: string
 ): Promise<{ success: boolean; message: string }> {
   try {
     const res = await fetch(`/api/admin/users/${encodeURIComponent(targetUserId)}?adminUserId=${encodeURIComponent(adminUserId)}`, {
       method: "DELETE",
       headers: { "x-user-id": adminUserId },
     });
     return await res.json();
   } catch (err: any) {
     return { success: false, message: err.message || "删除用户失败" };
   }
 }


// =========================================================================
// Email / SMTP Configuration & Whitelist APIs
// =========================================================================

export interface EmailConfig {
  channelName: string;
  host: string;
  port: number;
  encryption: "tls" | "starttls" | "none";
  enabled: boolean;
  user: string;
  hasPass?: boolean;
  pass?: string;
  fromEmail: string;
  fromName: string;
  whitelistEnabled: boolean;
  whitelistDomains: string[];
  updatedAt?: string;
}

export interface PublicEmailConfig {
  enabled: boolean;
  whitelistEnabled: boolean;
  whitelistDomains: string[];
}

export async function apiGetPublicEmailConfig(): Promise<PublicEmailConfig | null> {
  const res = await safeFetch<{
    success: boolean;
    enabled: boolean;
    whitelistEnabled: boolean;
    whitelistDomains: string[];
  }>("/api/email/public-config");
  if (res && res.success) {
    return {
      enabled: !!res.enabled,
      whitelistEnabled: !!res.whitelistEnabled,
      whitelistDomains: Array.isArray(res.whitelistDomains) ? res.whitelistDomains : [],
    };
  }
  return null;
}

export async function apiSendVerificationCode(
  email: string,
  type: "register" | "reset" = "register"
): Promise<{ success: boolean; message: string; needConfig?: boolean }> {
  try {
    const res = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "请求发送验证码失败" };
  }
}

export async function apiGetEmailConfig(adminUserId: string): Promise<EmailConfig | null> {
  const res = await safeFetch<{ success: boolean; config: EmailConfig }>("/api/admin/email/config", {
    headers: { "x-user-id": adminUserId },
  });
  if (res && res.success && res.config) {
    return res.config;
  }
  return null;
}

export async function apiSaveEmailConfig(
  adminUserId: string,
  config: Partial<EmailConfig>
): Promise<{ success: boolean; message: string; config?: EmailConfig }> {
  try {
    const res = await fetch("/api/admin/email/config", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": adminUserId },
      body: JSON.stringify({ ...config, adminUserId }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "保存发信配置失败" };
  }
}

export async function apiTestEmailConfig(
  adminUserId: string,
  data: { targetEmail: string; [key: string]: any }
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch("/api/admin/email/test", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": adminUserId },
      body: JSON.stringify({ ...data, adminUserId }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "连通性测试请求失败" };
  }
}

// ===========================================================================
// 积分算力 & 云存储（2026-10 重构）
// ===========================================================================
export interface UserAssets {
  points: number;
  storageQuota: number;
  storageUsed: number;
  storagePercent: number;
  lastCheckInDate: string;
  checkedInToday: boolean;
}

export interface PointsLogEntry {
  ts: string;
  delta: number;
  reason: string;
  balance: number;
  operator?: string;
}

export async function apiGetUserAssets(userId: string): Promise<UserAssets | null> {
  try {
    const res = await fetch(`/api/user/${encodeURIComponent(userId)}/assets`);
    const data = await res.json();
    return data?.success ? (data.assets as UserAssets) : null;
  } catch (e) {
    return null;
  }
}

export async function apiCheckIn(userId: string): Promise<{
  success: boolean;
  message: string;
  already?: boolean;
  points?: number;
  assets?: UserAssets;
}> {
  try {
    const res = await fetch(`/api/user/${encodeURIComponent(userId)}/check-in`, { method: "POST" });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "签到失败，请稍后重试" };
  }
}

export async function apiGetPointsLog(userId: string): Promise<{
  success: boolean;
  log: PointsLogEntry[];
  points: number;
}> {
  try {
    const res = await fetch(`/api/user/${encodeURIComponent(userId)}/points/log`);
    return await res.json();
  } catch (err: any) {
    return { success: false, log: [], points: 0 };
  }
}

export async function apiUploadAvatar(userId: string, dataUrl: string): Promise<{
  success: boolean;
  avatar?: string;
  message?: string;
}> {
  try {
    const res = await fetch(`/api/user/${encodeURIComponent(userId)}/avatar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "头像上传失败" };
  }
}

export interface SystemPublicConfig {
  registerPoints: number;
  checkInPoints: number;
  costPerImage: number;
  defaultStorageGB: number;
  siteName: string;
  logoUrl: string;
  termsHtml: string;
  privacyHtml: string;
}

export async function apiGetSystemPublicConfig(): Promise<SystemPublicConfig | null> {
  try {
    const res = await fetch("/api/system/public");
    const data = await res.json();
    return data?.success ? (data.config as SystemPublicConfig) : null;
  } catch (e) {
    return null;
  }
}

export interface AdminOverview {
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  checkInToday: number;
  totalAiImages: number;
  totalPoints: number;
  totalStorageUsed: number;
  totalStorageQuota: number;
  today: string;
}

export async function apiAdminOverview(adminUserId: string): Promise<AdminOverview | null> {
  try {
    const res = await fetch("/api/admin/overview", { headers: { "x-user-id": adminUserId } });
    const data = await res.json();
    return data?.success ? (data.overview as AdminOverview) : null;
  } catch (e) {
    return null;
  }
}

export async function apiAdminAdjustPoints(
  adminUserId: string,
  userId: string,
  delta: number,
  note: string
): Promise<{ success: boolean; message?: string; points?: number; assets?: UserAssets }> {
  try {
    const res = await fetch(`/api/admin/user/${encodeURIComponent(userId)}/points`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": adminUserId },
      body: JSON.stringify({ delta, note }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "调整积分失败" };
  }
}

export async function apiAdminSetQuota(
  adminUserId: string,
  userId: string,
  storageGB: number
): Promise<{ success: boolean; message?: string; assets?: UserAssets }> {
  try {
    const res = await fetch(`/api/admin/user/${encodeURIComponent(userId)}/quota`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": adminUserId },
      body: JSON.stringify({ storageGB }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "修改存储配额失败" };
  }
}

export async function apiAdminGetSystemConfig(adminUserId: string): Promise<Record<string, any> | null> {
  try {
    const res = await fetch("/api/admin/system/config", { headers: { "x-user-id": adminUserId } });
    const data = await res.json();
    return data?.success ? data.config : null;
  } catch (e) {
    return null;
  }
}

export async function apiAdminSaveSystemConfig(
  adminUserId: string,
  config: Record<string, any>
): Promise<{ success: boolean; config?: Record<string, any>; message?: string }> {
  try {
    const res = await fetch("/api/admin/system/config", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": adminUserId },
      body: JSON.stringify({ config }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, message: err.message || "保存系统配置失败" };
  }
}
