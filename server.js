import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import crypto from "crypto";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "::";

// Data directory
const DATA_DIR = path.join(__dirname, "server_data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const USERDATA_DIR = path.join(DATA_DIR, "userdata");
const AI_CONFIG_FILE = path.join(DATA_DIR, "ai_config.json");
const SITE_CONFIG_FILE = path.join(DATA_DIR, "site_config.json");
const EMAIL_CONFIG_FILE = path.join(DATA_DIR, "email_config.json");
const AI_STYLES_FILE = path.join(DATA_DIR, "ai_styles.json");
const AI_HISTORY_DIR = path.join(DATA_DIR, "ai_history");
const AI_HISTORY_ASSETS_DIR = path.join(DATA_DIR, "ai_history_assets");
const AI_THUMBS_DIR = path.join(DATA_DIR, "ai_history_thumbs");
const USER_MEDIA_DIR = path.join(DATA_DIR, "user_media");
const THUMB_CACHE_DIR = path.join(DATA_DIR, "thumb_cache");

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(USERDATA_DIR)) {
  fs.mkdirSync(USERDATA_DIR, { recursive: true });
}
if (!fs.existsSync(AI_THUMBS_DIR)) {
  fs.mkdirSync(AI_THUMBS_DIR, { recursive: true });
}
if (!fs.existsSync(USER_MEDIA_DIR)) {
  fs.mkdirSync(USER_MEDIA_DIR, { recursive: true });
}
if (!fs.existsSync(THUMB_CACHE_DIR)) {
  fs.mkdirSync(THUMB_CACHE_DIR, { recursive: true });
}
if (!fs.existsSync(AI_HISTORY_DIR)) {
  fs.mkdirSync(AI_HISTORY_DIR, { recursive: true });
}
if (!fs.existsSync(AI_HISTORY_ASSETS_DIR)) {
  fs.mkdirSync(AI_HISTORY_ASSETS_DIR, { recursive: true });
}

// Default demo accounts
const DEFAULT_ACCOUNTS = [
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
    name: "Atelier Pro 主理人",
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

function readAiStyles() {
  try {
    if (fs.existsSync(AI_STYLES_FILE)) {
      const data = fs.readFileSync(AI_STYLES_FILE, "utf-8");
      const list = JSON.parse(data);
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch (err) {
    console.error("[Styles] Read failed:", err.message);
  }
  return [];
}

function writeAiStyles(styles) {
  try {
    fs.writeFileSync(AI_STYLES_FILE, JSON.stringify(styles, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[Styles] Write failed:", err.message);
    return false;
  }
}

// Default AI Configuration
const DEFAULT_AI_CONFIG = {
  provider: "openai_compatible",
  baseUrl: process.env.IMAGE2API_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  apiKey: process.env.IMAGE2API_KEY || process.env.OPENAI_API_KEY || "",
  model: process.env.IMAGE_MODEL || "image2",
  size: "auto",
  quality: "standard",
  systemPromptPrefix: "",
};

function readAiConfig() {
  try {
    if (fs.existsSync(AI_CONFIG_FILE)) {
      const data = fs.readFileSync(AI_CONFIG_FILE, "utf-8");
      return { ...DEFAULT_AI_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error("Error reading AI config:", err);
  }
  return DEFAULT_AI_CONFIG;
}

function writeAiConfig(config) {
  const current = readAiConfig();
  const updated = { ...current, ...config, updatedAt: new Date().toISOString() };
  const tmpFile = AI_CONFIG_FILE + ".tmp";
  fs.writeFileSync(tmpFile, JSON.stringify(updated, null, 2), "utf-8");
  fs.renameSync(tmpFile, AI_CONFIG_FILE);
  return updated;
}

// ---------------------------------------------------------------------------
// 备案信息（ICP 备案 / 公安部备案号）：全站统一配置，两个独立开关
// ---------------------------------------------------------------------------
const DEFAULT_SITE_CONFIG = {
  icpEnabled: false,
  icpNumber: "",
  icpLink: "https://beian.miit.gov.cn/",
  policeEnabled: false,
  policeNumber: "",
  policeCode: "",
  policeLink: "https://beian.mps.gov.cn/#/query/webSearch",
};

function readSiteConfig() {
  try {
    if (fs.existsSync(SITE_CONFIG_FILE)) {
      const data = fs.readFileSync(SITE_CONFIG_FILE, "utf-8");
      return { ...DEFAULT_SITE_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error("[SiteConfig] Read failed:", err.message);
  }
  return { ...DEFAULT_SITE_CONFIG };
}

function writeSiteConfig(config) {
  const current = readSiteConfig();
  const updated = { ...current, ...config, updatedAt: new Date().toISOString() };
  const tmpFile = SITE_CONFIG_FILE + ".tmp";
  fs.writeFileSync(tmpFile, JSON.stringify(updated, null, 2), "utf-8");
  fs.renameSync(tmpFile, SITE_CONFIG_FILE);
  return updated;
}

// ---------------------------------------------------------------------------
// 邮件发信通道 (SMTP) & 邮箱域名白名单配置
// ---------------------------------------------------------------------------
const DEFAULT_EMAIL_CONFIG = {
  channelName: "飞书企业邮 (mexai.cc)",
  host: "",
  port: 465,
  encryption: "tls", // "tls" | "starttls" | "none"
  enabled: false,
  user: "",
  pass: "",
  fromEmail: "",
  fromName: "留白集 MarginLab",
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
};

function readEmailConfig() {
  try {
    if (fs.existsSync(EMAIL_CONFIG_FILE)) {
      const data = fs.readFileSync(EMAIL_CONFIG_FILE, "utf-8");
      return { ...DEFAULT_EMAIL_CONFIG, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error("[EmailConfig] Read failed:", err.message);
  }
  return { ...DEFAULT_EMAIL_CONFIG };
}

function writeEmailConfig(config) {
  const current = readEmailConfig();
  const updated = { ...current, ...config, updatedAt: new Date().toISOString() };
  const tmpFile = EMAIL_CONFIG_FILE + ".tmp";
  fs.writeFileSync(tmpFile, JSON.stringify(updated, null, 2), "utf-8");
  fs.renameSync(tmpFile, EMAIL_CONFIG_FILE);
  return updated;
}

function createMailTransporter(cfg) {
  const port = Number(cfg.port) || 465;
  const isDirectTls = cfg.encryption === "tls" || (!cfg.encryption && port === 465);

  return nodemailer.createTransport({
    host: cfg.host,
    port: port,
    secure: isDirectTls,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 12000,
    greetingTimeout: 10000,
  });
}

function getVerificationEmailHtml(code, email, type = "register") {
  const actionText = type === "reset" ? "重置登录密码" : "注册新创作者账号";
  return `
    <div style="max-width: 520px; margin: 0 auto; padding: 36px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #18181b; border: 1px solid #e4e4e7; border-radius: 20px; box-shadow: 0 4px 24px rgba(0,0,0,0.04);">
      <div style="text-align: center; margin-bottom: 28px;">
        <div style="display: inline-block; font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #18181b;">留白集 · MARGINLAB</div>
        <div style="font-size: 11px; color: #71717a; margin-top: 4px; letter-spacing: 1px;">极简图片 AI 调色风格化与艺术拼图排版</div>
      </div>
      <div style="border-top: 1px solid #f4f4f5; margin-bottom: 24px;"></div>
      <h2 style="font-size: 16px; font-weight: 700; margin: 0 0 12px 0; color: #18181b;">您好，欢迎加入留白集</h2>
      <p style="font-size: 13px; line-height: 1.6; color: #52525b; margin: 0 0 20px 0;">您正在申请\${actionText}，请在验证页面输入下方 6 位数字验证码：</p>
      <div style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 24px;">
        <span style="font-family: 'JetBrains Mono', Consolas, Monaco, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #d97706;">\${code}</span>
        <div style="font-size: 11px; color: #a1a1aa; margin-top: 10px;">验证码 10 分钟内有效，请勿向任何人泄露</div>
      </div>
      <p style="font-size: 12px; line-height: 1.6; color: #a1a1aa; margin: 0 0 24px 0;">若您未曾发起此操作，请忽略此邮件，您的账号或邮箱安全不会受到任何影响。</p>
      <div style="border-top: 1px solid #f4f4f5; padding-top: 18px; text-align: center; font-size: 11px; color: #a1a1aa;">
        © 2026 留白集 MarginLab · 保持留白，给创作留足想象
      </div>
    </div>
  `;
}

// 内存验证码缓存：email -> { code, expiresAt, lastSentAt, type }
const verificationCodeStore = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [email, item] of verificationCodeStore.entries()) {
    if (now > item.expiresAt + 60000) {
      verificationCodeStore.delete(email);
    }
  }
}, 60000);

function readAiHistory(userId = "default") {
  const userHistoryFile = path.join(AI_HISTORY_DIR, `${userId}.json`);
  try {
    if (fs.existsSync(userHistoryFile)) {
      const data = fs.readFileSync(userHistoryFile, "utf-8");
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (err) {
    console.error("Error reading AI history:", err);
  }
  return [];
}

// ---------------------------------------------------------------------------
// 图片瘦身：原图落盘 + 缩略图（列表/历史栏不再加载数 MB 原图）
// ---------------------------------------------------------------------------
const THUMB_MAX_EDGE = 480;
const SAFE_NAME_RE = /^[A-Za-z0-9._-]+$/;

const EXT_BY_MIME = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

function runConvert(args, timeoutMs = 25000) {
  return new Promise((resolve) => {
    execFile("convert", args, { timeout: timeoutMs, maxBuffer: 1 << 28 }, (err) => resolve(!err));
  });
}

/** 读取图片信息，返回 identify 的输出（失败返回空字符串） */
function runIdentify(args, timeoutMs = 15000) {
  return new Promise((resolve) => {
    execFile("identify", args, { timeout: timeoutMs, maxBuffer: 1 << 20 }, (err, stdout) => {
      resolve(err ? "" : String(stdout).trim());
    });
  });
}

/** 从 SVG 里取出内嵌的位图（AI 生成的 SVG 海报其实就是"位图 + 版式"），失败返回 null */
function extractEmbeddedRaster(svgAbsPath) {
  try {
    const svg = fs.readFileSync(svgAbsPath, "utf-8");
    const m = svg.match(/data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)/);
    if (!m) return null;
    const ext = m[1] === "jpg" ? "jpeg" : m[1];
    return { ext, buf: Buffer.from(m[2].replace(/\s+/g, ""), "base64") };
  } catch (e) {
    return null;
  }
}

/** 串行限流，避免一次性 fork 几十个 ImageMagick 进程把 NAS 拖慢 */
let thumbBusy = 0;
const thumbWaiters = [];
function withThumbSlot(task) {
  return new Promise((resolve, reject) => {
    const run = () => {
      thumbBusy++;
      Promise.resolve()
        .then(task)
        .then(resolve, reject)
        .finally(() => {
          thumbBusy--;
          const next = thumbWaiters.shift();
          if (next) next();
        });
    };
    if (thumbBusy < 3) run();
    else thumbWaiters.push(run);
  });
}

async function renderThumb(srcAbs, outAbs, size = THUMB_MAX_EDGE) {
  let input = srcAbs;
  let tmpFile = null;
  try {
    if (/\.svg$/i.test(srcAbs)) {
      const raster = extractEmbeddedRaster(srcAbs);
      if (raster) {
        tmpFile = path.join(THUMB_CACHE_DIR, `.tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${raster.ext}`);
        fs.writeFileSync(tmpFile, raster.buf);
        input = tmpFile;
      }
    }
    const ok = await runConvert([
      `${input}[0]`,
      "-auto-orient",
      "-background",
      "white",
      "-flatten",
      "-thumbnail",
      `${size}x${size}>`,
      "-strip",
      "-quality",
      "72",
      outAbs,
    ]);
    return ok && fs.existsSync(outAbs);
  } catch (e) {
    return false;
  } finally {
    if (tmpFile) {
      try {
        fs.unlinkSync(tmpFile);
      } catch (e) {}
    }
  }
}

function thumbCacheName(absPath, size = THUMB_MAX_EDGE) {
  const key = crypto.createHash("sha1").update(`${absPath}|${size}`).digest("hex").slice(0, 16);
  const base = path.basename(absPath, path.extname(absPath)).slice(0, 40).replace(/[^A-Za-z0-9._-]/g, "_");
  return `${base}_${key}_w${size}.webp`;
}

/** 把站内图片地址解析为磁盘路径（只允许我们自己的两个静态目录） */
function resolveLocalImagePath(publicUrl) {
  if (typeof publicUrl !== "string") return null;
  let p = publicUrl;
  try {
    p = decodeURIComponent(publicUrl.split("?")[0]);
  } catch (e) {}
  const historyMatch = p.match(/^\/api\/ai\/history-assets\/([^/]+)$/);
  if (historyMatch && SAFE_NAME_RE.test(historyMatch[1])) {
    return path.join(AI_HISTORY_ASSETS_DIR, historyMatch[1]);
  }
  const mediaMatch = p.match(/^\/api\/user-media\/([^/]+)\/([^/]+)$/);
  if (mediaMatch && SAFE_NAME_RE.test(mediaMatch[1]) && SAFE_NAME_RE.test(mediaMatch[2])) {
    return path.join(USER_MEDIA_DIR, mediaMatch[1], mediaMatch[2]);
  }
  return null;
}

/** 给任意站内图片地址生成缩略图地址；非站内地址原样返回 */
function toThumbUrl(publicUrl, size = THUMB_MAX_EDGE) {
  if (typeof publicUrl !== "string" || !publicUrl) return "";
  if (!resolveLocalImagePath(publicUrl)) return publicUrl;
  return `/api/thumb?w=${size}&src=${encodeURIComponent(publicUrl)}`;
}

/** 把 data URI 落盘为真实文件，返回文件名（失败返回 null） */
function persistDataUriToFile(uri, dir, baseName) {
  if (typeof uri !== "string" || !uri.startsWith("data:")) return null;
  try {
    fs.mkdirSync(dir, { recursive: true });
    let buf = null;
    let ext = "png";
    if (uri.startsWith("data:image/svg+xml;utf8,")) {
      buf = Buffer.from(decodeURIComponent(uri.slice("data:image/svg+xml;utf8,".length)), "utf8");
      ext = "svg";
    } else if (uri.startsWith("data:image/svg+xml;base64,")) {
      buf = Buffer.from(uri.slice("data:image/svg+xml;base64,".length), "base64");
      ext = "svg";
    } else {
      const m = uri.match(/^data:([^;]+);base64,([\s\S]+)$/);
      if (!m) return null;
      buf = Buffer.from(m[2], "base64");
      ext = EXT_BY_MIME[m[1]] || "png";
    }
    const filename = `${baseName}.${ext}`;
    fs.writeFileSync(path.join(dir, filename), buf);
    return filename;
  } catch (err) {
    console.error("[persistDataUriToFile] failed:", err.message);
    return null;
  }
}

/**
 * 用户素材瘦身：把 base64 原图写成文件，src/thumb 只留短 URL。
 * 以前 userdata/*.json 里塞着上百 MB 的 base64，登录/打开页面都要整包传输，
 * 这是"打开很慢"的根因。
 */
function normalizeMediaAssets(userId, assets) {
  if (!Array.isArray(assets)) return assets;
  const dir = path.join(USER_MEDIA_DIR, userId);
  let changed = false;

  const normalized = assets.map((asset) => {
    if (!asset || typeof asset !== "object") return asset;
    const next = { ...asset };
    const id = String(asset.id || `asset_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

    if (typeof next.src === "string" && next.src.startsWith("data:")) {
      const filename = persistDataUriToFile(next.src, dir, id);
      if (filename) {
        next.src = `/api/user-media/${userId}/${filename}`;
        changed = true;
      }
    }

    if (typeof next.thumb === "string" && next.thumb.startsWith("data:")) {
      // thumb 不再保留整张 base64，统一指向缩略图接口
      if (typeof next.src === "string" && next.src.startsWith("/api/user-media/")) {
        next.thumb = toThumbUrl(next.src);
        changed = true;
      } else {
        const filename = persistDataUriToFile(next.thumb, dir, `${id}_thumb`);
        if (filename) {
          next.src = next.src || `/api/user-media/${userId}/${filename}`;
          next.thumb = toThumbUrl(next.src);
          changed = true;
        }
      }
    }

    if (typeof next.src === "string" && next.src.startsWith("/api/")) {
      const expectThumb = toThumbUrl(next.src);
      if (expectThumb && next.thumb !== expectThumb && (!next.thumb || next.thumb.startsWith("data:"))) {
        next.thumb = expectThumb;
        changed = true;
      }
    }

    return next;
  });

  return changed ? normalized : assets;
}

/** 读取用户数据时顺手完成一次历史 base64 素材的搬移（幂等） */
function migrateUserMediaIfNeeded(userId, data) {
  if (!data || !Array.isArray(data.mediaAssets) || data.mediaAssets.length === 0) return data;
  try {
    const normalized = normalizeMediaAssets(userId, data.mediaAssets);
    if (normalized !== data.mediaAssets) {
      data.mediaAssets = normalized;
      writeUserData(userId, data);
      console.log(`[Media] ${userId}: base64 素材已搬移为文件（共 ${normalized.length} 项）`);
    }
  } catch (err) {
    console.error("[Media] migrate failed:", err.message);
  }
  return data;
}

function persistHistoryDataUri(uri, namePrefix) {
  if (!uri || typeof uri !== "string" || !uri.startsWith("data:")) return uri;
  try {
    if (uri.startsWith("data:image/svg+xml;utf8,")) {
      const svgContent = decodeURIComponent(uri.slice("data:image/svg+xml;utf8,".length));
      const filename = `${namePrefix}.svg`;
      fs.writeFileSync(path.join(AI_HISTORY_ASSETS_DIR, filename), svgContent, "utf8");
      return `/api/ai/history-assets/${filename}`;
    }
    const match = uri.match(/^data:([^;]+);base64,([\s\S]+)$/);
    if (match) {
      const mime = match[1];
      const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : mime.includes("svg") ? "svg" : "jpg";
      const filename = `${namePrefix}.${ext}`;
      fs.writeFileSync(path.join(AI_HISTORY_ASSETS_DIR, filename), Buffer.from(match[2], "base64"));
      return `/api/ai/history-assets/${filename}`;
    }
  } catch (err) {
    console.error("[persistHistoryDataUri] Failed:", err);
  }
  return uri;
}

function saveAiHistoryItem(userId = "default", item) {
  if (item && item.id) {
    if (item.sourceImage && item.sourceImage.startsWith("data:")) {
      item.sourceImage = persistHistoryDataUri(item.sourceImage, `${item.id}_src`);
    }
    if (item.resultUrl && item.resultUrl.startsWith("data:")) {
      item.resultUrl = persistHistoryDataUri(item.resultUrl, `${item.id}_res`);
    }
  }
  const history = readAiHistory(userId);
  history.unshift(item);
  const trimmed = history.slice(0, 50);
  const userHistoryFile = path.join(AI_HISTORY_DIR, `${userId}.json`);
  const tmpFile = userHistoryFile + ".tmp";
  fs.writeFileSync(tmpFile, JSON.stringify(trimmed, null, 2), "utf-8");
  fs.renameSync(tmpFile, userHistoryFile);
  return trimmed;
}

/** 返回给前端时补上缩略图地址：历史栏/列表只加载小图 */
function toClientHistoryItem(item) {
  if (!item || typeof item !== "object") return item;
  const result = item.resultUrl || item.resultBase64 || "";
  const source = item.sourceImage || "";
  return {
    ...item,
    thumbUrl: toThumbUrl(result),
    sourceThumbUrl: toThumbUrl(source),
  };
}

function toClientHistory(history) {
  return Array.isArray(history) ? history.map(toClientHistoryItem) : [];
}

function deleteAiHistoryItem(userId = "default", itemId) {
  const history = readAiHistory(userId);
  const filtered = history.filter((h) => h.id !== itemId);
  const userHistoryFile = path.join(AI_HISTORY_DIR, `${userId}.json`);
  fs.writeFileSync(userHistoryFile, JSON.stringify(filtered, null, 2), "utf-8");
  return filtered;
}

// Helper to read users atomically
function readUsers() {
  try {
    let list = [];
    if (!fs.existsSync(USERS_FILE)) {
      list = DEFAULT_ACCOUNTS;
      fs.writeFileSync(USERS_FILE, JSON.stringify(DEFAULT_ACCOUNTS, null, 2), "utf-8");
    } else {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      list = Array.isArray(parsed) ? parsed : DEFAULT_ACCOUNTS;
    }

    // Merge default accounts to guarantee seed accounts exist
    const map = new Map();
    for (const acc of DEFAULT_ACCOUNTS) {
      map.set(acc.id, acc);
    }
    for (const acc of list) {
      if (acc && acc.id) {
        const isAdm = acc.isAdmin !== undefined ? acc.isAdmin : (acc.id === "user_admin" || acc.id === "user_pro" || acc.username === "admin");
        map.set(acc.id, {
          ...map.get(acc.id),
          ...acc,
          isAdmin: isAdm,
          status: acc.status || "active",
        });
      }
    }
    const result = Array.from(map.values());
    const adminIdx = result.findIndex(u => u.id === "user_admin");
    if (adminIdx > 0) {
      const [adm] = result.splice(adminIdx, 1);
      result.unshift(adm);
    }
    return result;
  } catch (err) {
    console.error("Error reading users:", err);
    return DEFAULT_ACCOUNTS;
  }
}

// Helper to write users safely
function writeUsers(users) {
  const tmpFile = USERS_FILE + ".tmp";
  fs.writeFileSync(tmpFile, JSON.stringify(users, null, 2), "utf-8");
  fs.renameSync(tmpFile, USERS_FILE);
}

// Check if a user ID / username is an admin
function isUserAdmin(userId) {
  if (!userId) return false;
  const users = readUsers();
  const cleanId = String(userId).trim().toLowerCase();
  const u = users.find((acc) => {
    if (!acc) return false;
    const uid = (acc.id || "").toLowerCase();
    const uname = (acc.username || "").toLowerCase();
    return uid === cleanId || uname === cleanId;
  });
  return Boolean(u && (u.isAdmin || u.id === "user_admin" || u.username === "admin" || u.id === "user_pro"));
}

// Helper to read user data file
function readUserData(userId) {
  const userFile = path.join(USERDATA_DIR, `${userId}.json`);
  try {
    if (fs.existsSync(userFile)) {
      const data = fs.readFileSync(userFile, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error(`Error reading user data for ${userId}:`, err);
  }
  return { document: null, savedProjects: [], customTemplates: [], mediaAssets: [] };
}

// Helper to write user data file
function writeUserData(userId, data) {
  const userFile = path.join(USERDATA_DIR, `${userId}.json`);
  const tmpFile = userFile + ".tmp";
  fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmpFile, userFile);
}

// Ensure users file is initialized
writeUsers(readUsers());

// Middlewares
app.use(cors());
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Get all accounts (for public display / sync)
app.get("/api/auth/accounts", (req, res) => {
  const users = readUsers();
  res.json({ success: true, accounts: users });
});

// 公开的发信与白名单状态（注册页使用）
app.get("/api/email/public-config", (req, res) => {
  const cfg = readEmailConfig();
  res.json({
    success: true,
    enabled: Boolean(cfg.enabled && cfg.host && cfg.user),
    whitelistEnabled: Boolean(cfg.whitelistEnabled),
    whitelistDomains: cfg.whitelistDomains || [],
  });
});

// 发送邮箱验证码 (注册 / 找回密码)
app.post("/api/auth/send-code", async (req, res) => {
  const { email, type = "register" } = req.body || {};
  const cleanEmail = (email || "").trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanEmail || !emailRegex.test(cleanEmail)) {
    return res.status(400).json({ success: false, message: "请输入有效的电子邮箱地址" });
  }

  const domain = cleanEmail.split("@")[1];
  const emailConfig = readEmailConfig();

  // 1. 域名白名单限制检测
  if (emailConfig.whitelistEnabled && Array.isArray(emailConfig.whitelistDomains) && emailConfig.whitelistDomains.length > 0) {
    const isAllowed = emailConfig.whitelistDomains.some(
      (d) => d && d.trim().toLowerCase() === domain
    );
    if (!isAllowed) {
      return res.status(400).json({
        success: false,
        message: `邮箱域名 @${domain} 未在允许注册名单中。目前仅支持日常常用邮箱（如 QQ、163、Gmail、Outlook 等）`,
      });
    }
  }

  // 2. 注册时查重
  if (type === "register") {
    const users = readUsers();
    const exists = users.some((u) => u.email && u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return res.status(409).json({
        success: false,
        message: `邮箱 “${cleanEmail}” 已注册过账号，请直接登录`,
      });
    }
  }

  // 3. 频率限制 (60 秒防刷)
  const existing = verificationCodeStore.get(cleanEmail);
  const now = Date.now();
  if (existing && now - existing.lastSentAt < 60000) {
    const waitSec = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
    return res.status(429).json({
      success: false,
      message: `验证码发送过于频繁，请等待 ${waitSec} 秒后再试`,
    });
  }

  // 4. 发信通道是否就绪
  if (!emailConfig.enabled || !emailConfig.host || !emailConfig.user) {
    return res.status(503).json({
      success: false,
      needConfig: true,
      message: "发信邮箱服务未配置或未启用，请联系管理员在后台「发信与邮箱」中配置 SMTP 参数",
    });
  }

  // 5. 生成 6 位纯数字验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const transporter = createMailTransporter(emailConfig);
    const fromAddr = emailConfig.fromEmail || emailConfig.user;
    const fromName = emailConfig.fromName || "留白集 MarginLab";

    await transporter.sendMail({
      from: `"${fromName}" <${fromAddr}>`,
      to: cleanEmail,
      subject: `【留白集 MarginLab】验证码：${code} (10分钟内有效)`,
      html: getVerificationEmailHtml(code, cleanEmail, type),
    });

    verificationCodeStore.set(cleanEmail, {
      code,
      expiresAt: now + 10 * 60 * 1000,
      lastSentAt: now,
      type,
    });

    console.log(`[Email] Verification code sent to ${cleanEmail}`);
    res.json({
      success: true,
      message: `验证码已发送至 ${cleanEmail}，请查收（10分钟有效）`,
    });
  } catch (err) {
    console.error(`[Email] Send failed to ${cleanEmail}:`, err.message);
    res.status(500).json({
      success: false,
      message: `邮件发送失败：${err.message}，请核对 SMTP 授权码与发信配置`,
    });
  }
});

// Register new account (支持邮箱注册 + 验证码 + 域名白名单)
app.post("/api/auth/register", (req, res) => {
  const { username, password, name, avatar, role, bio, email, code } = req.body || {};
  const cleanEmail = (email || "").trim().toLowerCase();
  const rawUser = (username || "").trim() || (cleanEmail ? cleanEmail.split("@")[0] : "");
  const cleanUser = rawUser.toLowerCase().replace(/^@/, "").trim();

  // 若提供了邮箱，执行严格邮箱校验
  if (cleanEmail) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: "请输入有效的电子邮箱地址" });
    }

    const domain = cleanEmail.split("@")[1];
    const emailConfig = readEmailConfig();

    // 白名单校验
    if (emailConfig.whitelistEnabled && Array.isArray(emailConfig.whitelistDomains) && emailConfig.whitelistDomains.length > 0) {
      const isAllowed = emailConfig.whitelistDomains.some(
        (d) => d && d.trim().toLowerCase() === domain
      );
      if (!isAllowed) {
        return res.status(400).json({
          success: false,
          message: `邮箱域名 @${domain} 未在允许注册名单内。目前仅支持日常常用邮箱（如 QQ、163、Gmail、Outlook 等）`,
        });
      }
    }

    // 邮箱唯一性校验
    const users = readUsers();
    if (users.some((u) => u.email && u.email.toLowerCase() === cleanEmail)) {
      return res.status(409).json({
        success: false,
        message: `邮箱 “${cleanEmail}” 已被注册，请直接登录`,
      });
    }

    // 若发信通道已启用，强制验证邮箱验证码
    if (emailConfig.enabled && emailConfig.host && emailConfig.user) {
      const stored = verificationCodeStore.get(cleanEmail);
      if (!stored || Date.now() > stored.expiresAt) {
        return res.status(400).json({ success: false, message: "邮箱验证码不存在或已过期，请重新获取" });
      }
      if (stored.code !== (code || "").trim()) {
        return res.status(400).json({ success: false, message: "邮箱验证码错误，请重新核对" });
      }
      verificationCodeStore.delete(cleanEmail);
    }
  } else {
    // 未提供邮箱时，退回传统用户名模式
    if (!cleanUser || cleanUser.length < 3) {
      return res.status(400).json({ success: false, message: "登录账号至少需要 3 个字符（支持英文字母与数字）" });
    }
  }

  if (!password || password.trim().length < 4) {
    return res.status(400).json({ success: false, message: "密码至少需要 4 位字符" });
  }

  const users = readUsers();
  // 确保 username 唯一
  let finalUsername = cleanUser || "user_" + Date.now().toString().slice(-4);
  let counter = 1;
  while (users.some((u) => u.username && u.username.toLowerCase() === finalUsername)) {
    finalUsername = `${cleanUser}_${counter++}`;
  }

  const newUserId = "user_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const newUser = {
    id: newUserId,
    username: finalUsername,
    passwordHash: password.trim(),
    name: (name || "").trim() || (cleanEmail ? cleanEmail.split("@")[0] : finalUsername),
    avatar: avatar || ["🐱", "🐶", "🦊", "🐼", "🐰", "🐻", "🐨", "🦖", "🦁", "🐧", "🦉", "🐬", "🧑‍🎨", "📷", "🧑‍🚀", "☕"][Math.floor(Math.random() * 16)],
    role: (role || "").trim() || "独立创作者",
    isAdmin: false,
    status: "active",
    bio: (bio || "").trim() || "专注高定排版与艺术创作",
    email: cleanEmail,
    themeColor: "#E5C49F",
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);

  // Initialize empty user data
  writeUserData(newUserId, {
    document: null,
    savedProjects: [],
    customTemplates: [],
    mediaAssets: [],
  });

  console.log(`[API] Registered new user: ${cleanEmail || finalUsername} (${newUserId})`);
  res.json({
    success: true,
    message: `恭喜！已成功注册账号「${newUser.name}」`,
    user: newUser,
  });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const rawUser = (username || "").trim();
  const cleanUser = rawUser.toLowerCase().replace(/^@/, "").trim();

  if (!cleanUser) {
    return res.status(400).json({ success: false, message: "请输入用户名或登录账号" });
  }
  if (!password) {
    return res.status(400).json({ success: false, message: "请输入密码" });
  }

  const users = readUsers();
  const userIndex = users.findIndex((u) => {
    if (!u) return false;
    const uName = (u.username || "").toLowerCase();
    const dName = (u.name || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    return (
      uName === cleanUser ||
      dName === cleanUser ||
      (email && email === cleanUser) ||
      u.id === rawUser
    );
  });

  if (userIndex === -1) {
    return res.status(404).json({ success: false, message: "账号不存在，请核对用户名或先注册新账号" });
  }

  const user = users[userIndex];
  if (user.status === "banned") {
    return res.status(403).json({ success: false, message: "该账号已被管理员封禁，无法登录系统" });
  }

  const passTrim = password.trim();
  if (user.passwordHash && user.passwordHash !== passTrim && user.passwordHash !== password) {
    return res.status(401).json({ success: false, message: "密码错误，请重新输入" });
  }

  user.lastLoginAt = new Date().toISOString();
  users[userIndex] = user;
  writeUsers(users);

  console.log(`[API] User logged in: ${user.username} (${user.id})`);
  res.json({
    success: true,
    message: `欢迎回来，${user.name}！`,
    user,
  });
});

// Update profile
app.post("/api/auth/update-profile", (req, res) => {
  const { userId, updates } = req.body || {};
  if (!userId) {
    return res.status(400).json({ success: false, message: "缺少用户 ID" });
  }

  const users = readUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }

  const updatedUser = { ...users[index], ...updates };
  users[index] = updatedUser;
  writeUsers(users);

  res.json({ success: true, message: "个人资料更新成功", user: updatedUser });
});

// Change password
app.post("/api/auth/change-password", (req, res) => {
  const { userId, oldPassword, newPassword } = req.body || {};
  if (!userId) {
    return res.status(400).json({ success: false, message: "缺少用户 ID" });
  }
  if (!newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ success: false, message: "新密码长度至少需要 4 位字符" });
  }

  const users = readUsers();
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }

  const user = users[index];
  if (user.passwordHash && user.passwordHash !== oldPassword?.trim()) {
    return res.status(401).json({ success: false, message: "原密码不正确，请重新输入" });
  }

  user.passwordHash = newPassword.trim();
  users[index] = user;
  writeUsers(users);

  res.json({ success: true, message: "密码修改成功，请牢记新密码", user });
});

// Delete account
app.post("/api/auth/delete-account", (req, res) => {
  const { userId } = req.body || {};
  const users = readUsers();
  if (users.length <= 1) {
    return res.status(400).json({ success: false, message: "系统中至少需要保留一个账号" });
  }

  if (userId === "user_admin") {
    return res.status(400).json({ success: false, message: "系统超级管理员账号不可注销" });
  }

  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }

  const deleted = users.splice(index, 1)[0];
  writeUsers(users);

  // Delete user data file if exists
  const userFile = path.join(USERDATA_DIR, `${userId}.json`);
  if (fs.existsSync(userFile)) {
    try {
      fs.unlinkSync(userFile);
    } catch (e) {}
  }

  res.json({ success: true, message: `账号「${deleted.name || userId}」已注销` });
});

// Sync / Merge accounts from client storage to server
app.post("/api/auth/sync-accounts", (req, res) => {
  const { accounts } = req.body || {};
  if (!Array.isArray(accounts)) {
    return res.json({ success: true, accounts: readUsers() });
  }

  const users = readUsers();
  const map = new Map();
  for (const u of users) {
    if (u && u.id) map.set(u.id, u);
  }

  let hasNew = false;
  for (const acc of accounts) {
    if (!acc || !acc.id || !acc.username) continue;
    if (!map.has(acc.id)) {
      const matchByUsername = Array.from(map.values()).find(
        (u) => u.username && u.username.toLowerCase() === acc.username.toLowerCase()
      );
      if (!matchByUsername) {
        map.set(acc.id, acc);
        hasNew = true;
      }
    }
  }

  const merged = Array.from(map.values());
  if (hasNew) {
    writeUsers(merged);
  }

  res.json({ success: true, accounts: merged });
});

// Get user data (doc, projects, templates, media)
app.get("/api/user/:userId/data", (req, res) => {
  const { userId } = req.params;
  // 首次读取时顺手把历史遗留的 base64 素材搬成文件，之后 JSON 就只有几十 KB
  const data = migrateUserMediaIfNeeded(userId, readUserData(userId));
  res.json({ success: true, data });
});

// Save user data (with safe media protection)
app.post("/api/user/:userId/data", (req, res) => {
  const { userId } = req.params;
  const incoming = req.body || {};
  const current = readUserData(userId);

  // Handle mediaAssets resolution safely
  let resolvedMediaAssets = current.mediaAssets || [];
  if (incoming.clearMediaAssets === true) {
    resolvedMediaAssets = [];
  } else if (incoming.deletedAssetId) {
    resolvedMediaAssets = (current.mediaAssets || []).filter((a) => a.id !== incoming.deletedAssetId);
  } else if (Array.isArray(incoming.mediaAssets)) {
    if (incoming.mediaAssets.length > 0) {
      // Merge by ID to protect existing assets across multiple browsers
      const mediaMap = new Map();
      for (const a of (current.mediaAssets || [])) {
        if (a && a.id) mediaMap.set(a.id, a);
      }
      for (const a of incoming.mediaAssets) {
        if (a && a.id) mediaMap.set(a.id, a);
      }
      resolvedMediaAssets = Array.from(mediaMap.values());
    } else {
      // Empty array without clear flag does not wipe existing cloud assets
      resolvedMediaAssets = current.mediaAssets || [];
    }
  }

  const merged = {
    document: incoming.document !== undefined ? incoming.document : current.document,
    savedProjects: incoming.savedProjects !== undefined ? incoming.savedProjects : current.savedProjects,
    customTemplates: incoming.customTemplates !== undefined ? incoming.customTemplates : current.customTemplates,
    // 新上传的 base64 一律落盘成文件，避免 JSON 再次膨胀到上百 MB
    mediaAssets: normalizeMediaAssets(userId, resolvedMediaAssets),
    updatedAt: new Date().toISOString(),
  };

  writeUserData(userId, merged);
  res.json({ success: true, message: "数据已保存至服务器", count: resolvedMediaAssets.length });
});

// Dedicated Media Asset Endpoints (fast, isolated, robust)
app.get("/api/user/:userId/media", (req, res) => {
  const { userId } = req.params;
  const data = migrateUserMediaIfNeeded(userId, readUserData(userId));
  res.json({ success: true, mediaAssets: data.mediaAssets || [] });
});

app.post("/api/user/:userId/media", (req, res) => {
  const { userId } = req.params;
  const { assets, mediaAssets } = req.body || {};
  const incoming = assets || mediaAssets || [];
  if (!Array.isArray(incoming)) {
    return res.status(400).json({ success: false, message: "Invalid assets array" });
  }

  const current = readUserData(userId);
  const mediaMap = new Map();
  for (const a of (current.mediaAssets || [])) {
    if (a && a.id) mediaMap.set(a.id, a);
  }
  for (const a of incoming) {
    if (a && a.id) mediaMap.set(a.id, a);
  }
  // 上传的 base64 直接落盘成文件，JSON 里只留短 URL
  const mergedMedia = normalizeMediaAssets(userId, Array.from(mediaMap.values()));
  current.mediaAssets = mergedMedia;
  current.updatedAt = new Date().toISOString();
  writeUserData(userId, current);

  res.json({ success: true, mediaAssets: mergedMedia, count: mergedMedia.length });
});

app.delete("/api/user/:userId/media/:assetId", (req, res) => {
  const { userId, assetId } = req.params;
  const current = readUserData(userId);
  const filtered = (current.mediaAssets || []).filter((a) => a.id !== assetId);
  current.mediaAssets = filtered;
  current.updatedAt = new Date().toISOString();
  writeUserData(userId, current);

  res.json({ success: true, mediaAssets: filtered, count: filtered.length });
});

app.delete("/api/user/:userId/media", (req, res) => {
  const { userId } = req.params;
  const current = readUserData(userId);
  current.mediaAssets = [];
  current.updatedAt = new Date().toISOString();
  writeUserData(userId, current);

  res.json({ success: true, mediaAssets: [], count: 0 });
});

// =========================================================================
// ADMIN MANAGEMENT ENDPOINTS
// =========================================================================

// Helper middleware / check for admin requests
function requireAdmin(req, res, next) {
  const adminUserId = req.headers["x-user-id"] || req.body?.adminUserId || req.query?.adminUserId;
  if (!adminUserId || !isUserAdmin(adminUserId)) {
    return res.status(403).json({
      success: false,
      message: "权限不足：此操作仅限系统超级管理员执行",
    });
  }
  next();
}

// GET /api/admin/users: Fetch all users with usage statistics
app.get("/api/admin/users", requireAdmin, (req, res) => {
  const users = readUsers();
  const enrichedUsers = users.map((u) => {
    const data = readUserData(u.id);
    const aiHist = readAiHistory(u.id);
    return {
      ...u,
      savedProjectsCount: Array.isArray(data.savedProjects) ? data.savedProjects.length : 0,
      mediaAssetsCount: Array.isArray(data.mediaAssets) ? data.mediaAssets.length : 0,
      aiHistoryCount: aiHist.length,
    };
  });

  res.json({
    success: true,
    users: enrichedUsers,
    total: enrichedUsers.length,
    activeCount: enrichedUsers.filter((u) => u.status !== "banned").length,
    bannedCount: enrichedUsers.filter((u) => u.status === "banned").length,
    adminCount: enrichedUsers.filter((u) => u.isAdmin).length,
  });
});

// POST /api/admin/users/status: Ban or unban user
app.post("/api/admin/users/status", requireAdmin, (req, res) => {
  const { targetUserId, status } = req.body || {};
  if (!targetUserId || !["active", "banned"].includes(status)) {
    return res.status(400).json({ success: false, message: "参数错误" });
  }

  if (targetUserId === "user_admin" && status === "banned") {
    return res.status(400).json({ success: false, message: "系统超级管理员不可封禁" });
  }

  const users = readUsers();
  const idx = users.findIndex((u) => u.id === targetUserId);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }

  users[idx].status = status;
  writeUsers(users);

  res.json({
    success: true,
    message: `用户「${users[idx].name}」已${status === "banned" ? "封禁" : "恢复正常"}`,
    user: users[idx],
  });
});

// POST /api/admin/users/role: Set admin role / creator role
app.post("/api/admin/users/role", requireAdmin, (req, res) => {
  const { targetUserId, role, isAdmin } = req.body || {};
  if (!targetUserId) {
    return res.status(400).json({ success: false, message: "缺少 targetUserId" });
  }

  if (targetUserId === "user_admin" && isAdmin === false) {
    return res.status(400).json({ success: false, message: "不可撤销超级管理员的管理权限" });
  }

  const users = readUsers();
  const idx = users.findIndex((u) => u.id === targetUserId);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }

  if (role !== undefined) users[idx].role = String(role).trim();
  if (isAdmin !== undefined) users[idx].isAdmin = Boolean(isAdmin);
  writeUsers(users);

  res.json({
    success: true,
    message: `用户「${users[idx].name}」权限已更新`,
    user: users[idx],
  });
});

// POST /api/admin/users/reset-password: Admin reset user password
app.post("/api/admin/users/reset-password", requireAdmin, (req, res) => {
  const { targetUserId, newPassword } = req.body || {};
  if (!targetUserId || !newPassword || newPassword.trim().length < 4) {
    return res.status(400).json({ success: false, message: "新密码至少需要 4 位字符" });
  }

  const users = readUsers();
  const idx = users.findIndex((u) => u.id === targetUserId);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }

  users[idx].passwordHash = newPassword.trim();
  writeUsers(users);

  res.json({
    success: true,
    message: `已重置「${users[idx].name}」的登录密码`,
    user: users[idx],
  });
});

// POST /api/admin/users/create: Admin directly creates an account
app.post("/api/admin/users/create", requireAdmin, (req, res) => {
  const { username, password, name, avatar, role, bio, email, isAdmin } = req.body || {};
  const rawUser = (username || "").trim();
  const cleanUser = rawUser.toLowerCase().replace(/^@/, "").trim();

  if (!cleanUser || cleanUser.length < 3) {
    return res.status(400).json({ success: false, message: "用户名至少 3 个字符" });
  }
  if (!password || password.trim().length < 4) {
    return res.status(400).json({ success: false, message: "密码至少 4 位" });
  }

  const users = readUsers();
  if (users.some((u) => u.username && u.username.toLowerCase() === cleanUser)) {
    return res.status(409).json({ success: false, message: `账号 “${cleanUser}” 已存在` });
  }

  const newUserId = "user_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const newUser = {
    id: newUserId,
    username: cleanUser,
    passwordHash: password.trim(),
    name: (name || "").trim() || cleanUser,
    avatar: avatar || "🎨",
    role: (role || "").trim() || "创作者",
    isAdmin: Boolean(isAdmin),
    status: "active",
    bio: (bio || "").trim() || "平台创作者",
    email: (email || "").trim(),
    themeColor: "#E5C49F",
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  users.push(newUser);
  writeUsers(users);
  writeUserData(newUserId, { document: null, savedProjects: [], customTemplates: [], mediaAssets: [] });

  res.json({
    success: true,
    message: `已成功创建新账号「${newUser.name}」`,
    user: newUser,
  });
});

// DELETE /api/admin/users/:id: Admin deletes a user account
app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  if (id === "user_admin") {
    return res.status(400).json({ success: false, message: "不能删除超级管理员账号" });
  }

  const users = readUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }

  const deleted = users.splice(idx, 1)[0];
  writeUsers(users);

  // Clean userdata file
  const userFile = path.join(USERDATA_DIR, `${id}.json`);
  if (fs.existsSync(userFile)) {
    try { fs.unlinkSync(userFile); } catch (e) {}
  }
  const histFile = path.join(AI_HISTORY_DIR, `${id}.json`);
  if (fs.existsSync(histFile)) {
    try { fs.unlinkSync(histFile); } catch (e) {}
  }

  res.json({ success: true, message: `用户「${deleted.name}」已删除` });
});

// =========================================================================
// AI Stylize & Model Integration Endpoints
// =========================================================================

// =========================================================================
// AI Style Templates Management Endpoints
// =========================================================================

// GET /api/ai/styles: Get all style presets
app.get("/api/ai/styles", (req, res) => {
  const styles = readAiStyles();
  res.json({
    success: true,
    styles,
    total: styles.length,
    enabledCount: styles.filter((s) => s.enabled !== false).length,
  });
});

// POST /api/admin/styles/save: Create or update style template
app.post("/api/admin/styles/save", requireAdmin, (req, res) => {
  const incoming = req.body || {};
  if (!incoming.name || !incoming.name.trim()) {
    return res.status(400).json({ success: false, message: "风格名称不可为空" });
  }

  const styles = readAiStyles();
  let styleId = (incoming.id || "").trim();
  const existingIndex = styles.findIndex((s) => s.id === styleId);

  // If custom base64 cover image was uploaded, persist to file to avoid 20MB+ JSON bloat
  if (incoming.coverImage && typeof incoming.coverImage === "string" && incoming.coverImage.startsWith("data:image/")) {
    try {
      const match = incoming.coverImage.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (match) {
        const ext = match[1] === "jpeg" ? "jpg" : match[1];
        const buffer = Buffer.from(match[2], "base64");
        const safeId = (styleId || "custom").replace(/[^a-zA-Z0-9_]/g, "_");
        const filename = `${safeId}_${Date.now()}.${ext}`;
        const coversDir = path.join(__dirname, "public", "covers");
        if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });
        fs.writeFileSync(path.join(coversDir, filename), buffer);
        const distCoversDir = path.join(__dirname, "dist", "covers");
        if (fs.existsSync(distCoversDir)) {
          fs.writeFileSync(path.join(distCoversDir, filename), buffer);
        }
        incoming.coverImage = `/covers/${filename}`;
      }
    } catch (err) {
      console.error("[Styles] Failed to save custom cover image:", err);
    }
  }

  if (existingIndex === -1) {
    styleId = styleId || "style_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const newStyle = {
      id: styleId,
      name: incoming.name.trim(),
      enName: (incoming.enName || "").trim() || incoming.name.trim(),
      category: incoming.category || "editorial",
      badge: (incoming.badge || "").trim(),
      description: (incoming.description || "").trim(),
      coverImage: incoming.coverImage || "",
      previewSvg: incoming.previewSvg || "",
      aspectRatio: incoming.aspectRatio || "auto",
      githubUrl: (incoming.githubUrl || "").trim(),
      recommendedTemplateId: incoming.recommendedTemplateId || "",
      promptTemplate: (incoming.promptTemplate || "").trim(),
      negativePrompt: (incoming.negativePrompt || "").trim(),
      tags: Array.isArray(incoming.tags)
        ? incoming.tags
        : typeof incoming.tags === "string"
        ? incoming.tags.split(/[,，\s]+/).filter(Boolean)
        : [],
      enabled: incoming.enabled !== undefined ? Boolean(incoming.enabled) : true,
      order: incoming.order !== undefined ? Number(incoming.order) : styles.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    styles.push(newStyle);
  } else {
    styles[existingIndex] = {
      ...styles[existingIndex],
      name: incoming.name.trim(),
      enName: incoming.enName !== undefined ? incoming.enName.trim() : styles[existingIndex].enName,
      category: incoming.category || styles[existingIndex].category,
      badge: incoming.badge !== undefined ? incoming.badge.trim() : styles[existingIndex].badge,
      description: incoming.description !== undefined ? incoming.description.trim() : styles[existingIndex].description,
      coverImage: incoming.coverImage !== undefined ? incoming.coverImage : styles[existingIndex].coverImage,
      previewSvg: incoming.previewSvg !== undefined ? incoming.previewSvg : styles[existingIndex].previewSvg,
      aspectRatio: incoming.aspectRatio || styles[existingIndex].aspectRatio,
      githubUrl: incoming.githubUrl !== undefined ? incoming.githubUrl.trim() : (styles[existingIndex].githubUrl || ""),
      recommendedTemplateId:
        incoming.recommendedTemplateId !== undefined
          ? incoming.recommendedTemplateId
          : styles[existingIndex].recommendedTemplateId,
      promptTemplate:
        incoming.promptTemplate !== undefined
          ? incoming.promptTemplate.trim()
          : styles[existingIndex].promptTemplate,
      negativePrompt:
        incoming.negativePrompt !== undefined
          ? incoming.negativePrompt.trim()
          : styles[existingIndex].negativePrompt,
      tags:
        incoming.tags !== undefined
          ? Array.isArray(incoming.tags)
            ? incoming.tags
            : typeof incoming.tags === "string"
            ? incoming.tags.split(/[,，\s]+/).filter(Boolean)
            : styles[existingIndex].tags
          : styles[existingIndex].tags,
      enabled: incoming.enabled !== undefined ? Boolean(incoming.enabled) : styles[existingIndex].enabled,
      order: incoming.order !== undefined ? Number(incoming.order) : styles[existingIndex].order,
      updatedAt: new Date().toISOString(),
    };
  }

  writeAiStyles(styles);
  res.json({
    success: true,
    message: `风格模板「${incoming.name.trim()}」已成功保存`,
    styles,
  });
});

// POST /api/admin/styles/toggle: Quick toggle style visibility
app.post("/api/admin/styles/toggle", requireAdmin, (req, res) => {
  const { styleId, enabled } = req.body || {};
  if (!styleId) {
    return res.status(400).json({ success: false, message: "缺少 styleId" });
  }
  const styles = readAiStyles();
  const idx = styles.findIndex((s) => s.id === styleId);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "未找到该风格模板" });
  }

  styles[idx].enabled = Boolean(enabled);
  styles[idx].updatedAt = new Date().toISOString();
  writeAiStyles(styles);

  res.json({
    success: true,
    message: `风格模板「${styles[idx].name}」已${styles[idx].enabled ? "开启（创作者可见）" : "关闭（创作者不可见）"}`,
    styles,
  });
});

// DELETE /api/admin/styles/:id: Delete style template
app.delete("/api/admin/styles/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const styles = readAiStyles();
  const idx = styles.findIndex((s) => s.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "未找到该风格模板" });
  }

  const deleted = styles.splice(idx, 1)[0];
  writeAiStyles(styles);

  res.json({
    success: true,
    message: `风格模板「${deleted.name}」已删除`,
    styles,
  });
});

// POST /api/admin/styles/reset: Reset style templates
app.post("/api/admin/styles/reset", requireAdmin, (req, res) => {
  const current = readAiStyles();
  const resetStyles = current.map((s) => {
    return {
      ...s,
      enabled: true,
      badge: s.badge || (s.tags && s.tags[0]) || "先锋风格",
      updatedAt: new Date().toISOString(),
    };
  });
  writeAiStyles(resetStyles);

  res.json({
    success: true,
    message: `已重置风格模板列表（所有 ${resetStyles.length} 款官方高定与开源先锋风格均保持开启）`,
    styles: resetStyles,
  });
});

// GET /api/ai/config: Fetch current AI config
app.get("/api/ai/config", (req, res) => {
  const config = readAiConfig();
  const requesterId = req.headers["x-user-id"] || req.query?.userId || req.query?.adminUserId;
  const isAdmin = isUserAdmin(requesterId);
  const hasKey = Boolean(config.apiKey && config.apiKey.trim().length > 0);

  let maskedKey = "";
  if (hasKey) {
    const k = config.apiKey.trim();
    maskedKey = k.length > 8 ? `${k.slice(0, 3)}****${k.slice(-4)}` : "********";
  }

  res.json({
    success: true,
    isAdmin,
    config: {
      provider: config.provider || "openai_compatible",
      baseUrl: config.baseUrl || "https://api.openai.com/v1",
      model: config.model || "image2",
      size: config.size || "auto",
      quality: config.quality || "standard",
      isConfigured: hasKey,
      maskedKey,
      // Provide raw key only to verified admin requests
      apiKey: isAdmin ? config.apiKey : maskedKey,
      updatedAt: config.updatedAt,
    },
  });
});

// POST /api/ai/config: Save AI settings (Strictly restricted to Admin)
app.post("/api/ai/config", requireAdmin, (req, res) => {
  const { baseUrl, apiKey, model, size, quality, provider } = req.body || {};
  const current = readAiConfig();

  const newConfig = {
    ...current,
    ...(provider ? { provider } : {}),
    ...(baseUrl ? { baseUrl: baseUrl.trim().replace(/\/+$/, "") } : {}),
    ...(model ? { model: model.trim() } : {}),
    ...(size ? { size } : {}),
    ...(quality ? { quality } : {}),
  };

  // Only update apiKey if non-empty and not masked placeholder
  if (apiKey && typeof apiKey === "string" && !apiKey.includes("****")) {
    newConfig.apiKey = apiKey.trim();
  }

  const updated = writeAiConfig(newConfig);
  console.log(`[AI Config] Admin updated: model=${updated.model}, baseUrl=${updated.baseUrl}`);

  res.json({
    success: true,
    message: "平台全局 AI 图像模型配置已成功保存",
    config: {
      provider: updated.provider,
      baseUrl: updated.baseUrl,
      model: updated.model,
      size: updated.size,
      quality: updated.quality,
      isConfigured: Boolean(updated.apiKey && updated.apiKey.length > 0),
    },
  });
});

// GET /api/site/config: 读取全站备案信息（公开，落地页页脚需要）
app.get("/api/site/config", (req, res) => {
  res.json({ success: true, config: readSiteConfig() });
});

// POST /api/admin/site/config: 保存备案信息（仅管理员）
app.post("/api/admin/site/config", requireAdmin, (req, res) => {
  const body = req.body || {};
  const patch = {};

  if (typeof body.icpEnabled === "boolean") patch.icpEnabled = body.icpEnabled;
  if (typeof body.icpNumber === "string") patch.icpNumber = body.icpNumber.trim();
  if (typeof body.icpLink === "string" && body.icpLink.trim()) patch.icpLink = body.icpLink.trim();

  if (typeof body.policeEnabled === "boolean") patch.policeEnabled = body.policeEnabled;
  if (typeof body.policeNumber === "string") patch.policeNumber = body.policeNumber.trim();
  if (typeof body.policeCode === "string") patch.policeCode = body.policeCode.trim();
  if (typeof body.policeLink === "string" && body.policeLink.trim()) patch.policeLink = body.policeLink.trim();

  const updated = writeSiteConfig(patch);
  console.log(
    `[Site Config] Admin updated: ICP=${updated.icpEnabled ? "on" : "off"}(${updated.icpNumber || "-"}), ` +
      `公安=${updated.policeEnabled ? "on" : "off"}(${updated.policeNumber || "-"})`
  );

  res.json({
    success: true,
    message: "备案信息已保存",
    config: updated,
  });
});

// ---------------------------------------------------------------------------
// 管理员：发信邮箱 (SMTP) 与 域名白名单管理
// ---------------------------------------------------------------------------

// GET /api/admin/email/config: 读取发信配置 (管理员)
app.get("/api/admin/email/config", requireAdmin, (req, res) => {
  const cfg = readEmailConfig();
  res.json({
    success: true,
    config: {
      channelName: cfg.channelName || "飞书企业邮 (mexai.cc)",
      host: cfg.host || "",
      port: cfg.port || 465,
      encryption: cfg.encryption || "tls",
      enabled: Boolean(cfg.enabled),
      user: cfg.user || "",
      hasPass: Boolean(cfg.pass && cfg.pass.length > 0),
      fromEmail: cfg.fromEmail || "",
      fromName: cfg.fromName || "留白集 MarginLab",
      whitelistEnabled: Boolean(cfg.whitelistEnabled),
      whitelistDomains: cfg.whitelistDomains || [],
      updatedAt: cfg.updatedAt,
    },
  });
});

// POST /api/admin/email/config: 保存发信配置 (管理员)
app.post("/api/admin/email/config", requireAdmin, (req, res) => {
  const body = req.body || {};
  const current = readEmailConfig();
  const patch = {};

  if (typeof body.channelName === "string") patch.channelName = body.channelName.trim();
  if (typeof body.host === "string") patch.host = body.host.trim();
  if (body.port !== undefined) patch.port = Number(body.port) || 465;
  if (typeof body.encryption === "string") patch.encryption = body.encryption.trim();
  if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
  if (typeof body.user === "string") patch.user = body.user.trim();
  if (typeof body.pass === "string" && body.pass.trim()) {
    patch.pass = body.pass.trim();
  }
  if (typeof body.fromEmail === "string") patch.fromEmail = body.fromEmail.trim();
  if (typeof body.fromName === "string") patch.fromName = body.fromName.trim();
  if (typeof body.whitelistEnabled === "boolean") patch.whitelistEnabled = body.whitelistEnabled;
  if (Array.isArray(body.whitelistDomains)) {
    patch.whitelistDomains = body.whitelistDomains
      .map((d) => (typeof d === "string" ? d.trim().toLowerCase() : ""))
      .filter(Boolean);
  }

  const updated = writeEmailConfig(patch);
  console.log(
    `[Email Config] Admin updated: enabled=${updated.enabled}, host=${updated.host}, whitelist=${updated.whitelistEnabled ? "on" : "off"}`
  );

  res.json({
    success: true,
    message: "发信邮箱与白名单设置已成功保存！",
    config: {
      channelName: updated.channelName,
      host: updated.host,
      port: updated.port,
      encryption: updated.encryption,
      enabled: updated.enabled,
      user: updated.user,
      hasPass: Boolean(updated.pass),
      fromEmail: updated.fromEmail,
      fromName: updated.fromName,
      whitelistEnabled: updated.whitelistEnabled,
      whitelistDomains: updated.whitelistDomains,
      updatedAt: updated.updatedAt,
    },
  });
});

// POST /api/admin/email/test: 即时连通性测试并发送测试邮件 (管理员)
app.post("/api/admin/email/test", requireAdmin, async (req, res) => {
  const { targetEmail, channelName, host, port, encryption, user, pass, fromEmail, fromName } = req.body || {};
  const cleanTarget = (targetEmail || "").trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!cleanTarget || !emailRegex.test(cleanTarget)) {
    return res.status(400).json({ success: false, message: "请输入合法有效的测试收件邮箱地址" });
  }

  const currentCfg = readEmailConfig();
  const testCfg = {
    channelName: channelName || currentCfg.channelName || "发信测试通道",
    host: host !== undefined ? (host || "").trim() : currentCfg.host,
    port: port !== undefined ? Number(port) || 465 : currentCfg.port,
    encryption: encryption || currentCfg.encryption || "tls",
    user: user !== undefined ? (user || "").trim() : currentCfg.user,
    pass: (pass && pass.trim()) ? pass.trim() : currentCfg.pass,
    fromEmail: fromEmail !== undefined ? (fromEmail || "").trim() : (currentCfg.fromEmail || currentCfg.user),
    fromName: fromName !== undefined ? (fromName || "").trim() : (currentCfg.fromName || "留白集 MarginLab"),
  };

  if (!testCfg.host) {
    return res.status(400).json({ success: false, message: "请填写 SMTP 主机（例如 smtp.larksuite.com 或 smtp.qq.com）" });
  }
  if (!testCfg.user) {
    return res.status(400).json({ success: false, message: "请填写 SMTP 登录账号" });
  }
  if (!testCfg.pass) {
    return res.status(400).json({ success: false, message: "请填写 SMTP 密码或专用授权码" });
  }

  try {
    const transporter = createMailTransporter(testCfg);
    console.log(`[Email Test] Verifying SMTP connection to ${testCfg.host}:${testCfg.port}...`);
    await transporter.verify();

    const fromAddr = testCfg.fromEmail || testCfg.user;
    const testTime = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });

    await transporter.sendMail({
      from: `"${testCfg.fromName || "留白集 MarginLab"}" <${fromAddr}>`,
      to: cleanTarget,
      subject: `【留白集 MarginLab】SMTP 发信通道连通性测试成功`,
      html: `
        <div style="max-width: 520px; margin: 0 auto; padding: 32px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff; color: #18181b; border: 1px solid #e4e4e7; border-radius: 16px;">
          <div style="font-size: 18px; font-weight: 700; margin-bottom: 8px; color: #059669;">
            ✅ SMTP 发信通道连通性测试成功
          </div>
          <p style="font-size: 13px; color: #52525b; line-height: 1.6; margin: 0 0 16px 0;">
            恭喜！您在 <strong>留白集 MarginLab</strong> 管理后台配置的发信通道「${testCfg.channelName}」已成功通过认证并完成投递测试。
          </p>
          <div style="background-color: #f4f4f5; border-radius: 10px; padding: 16px; font-size: 12px; color: #3f3f46; line-height: 1.8; font-family: 'JetBrains Mono', Consolas, monospace;">
            <div><strong>通道名称：</strong>\${testCfg.channelName}</div>
            <div><strong>SMTP 主机：</strong>\${testCfg.host}:\${testCfg.port}</div>
            <div><strong>连接加密：</strong>\${testCfg.encryption.toUpperCase()}</div>
            <div><strong>发件邮箱：</strong>\${fromAddr}</div>
            <div><strong>测试收件：</strong>\${cleanTarget}</div>
            <div><strong>验证时间：</strong>\${testTime}</div>
          </div>
          <p style="font-size: 11px; color: #a1a1aa; margin-top: 18px; margin-bottom: 0;">
            这是一封系统自动发送的测试验证邮件，收到此邮件说明发信功能已随时可用于发送注册验证码。
          </p>
        </div>
      `,
    });

    console.log(`[Email Test] Test email sent successfully to ${cleanTarget}`);
    res.json({
      success: true,
      message: `连通性测试成功！测试邮件已成功投递至「${cleanTarget}」，请查收确认。`,
    });
  } catch (err) {
    console.error(`[Email Test] Connection failed:`, err);
    res.status(500).json({
      success: false,
      message: `发信连接失败：${err.message}。请核对 SMTP 主机、端口、SSL/TLS 加密设置及专用授权码。`,
    });
  }
});

// POST /api/ai/test: Test connectivity to configured AI API

// POST /api/ai/models: Fetch model list from OpenAI/proxy endpoint
app.post("/api/ai/models", async (req, res) => {
  const { baseUrl: reqBaseUrl, apiKey: reqApiKey } = req.body || {};
  const config = readAiConfig();
  const baseUrl = (reqBaseUrl || config.baseUrl || "https://api.openai.com/v1").trim().replace(/\/+$/, "");
  const apiKey = (reqApiKey && !reqApiKey.includes("****") ? reqApiKey : config.apiKey || "").trim();

  if (!apiKey) {
    return res.status(400).json({
      success: false,
      message: "缺少 API Key，请先输入 API 密钥后再拉取模型列表",
    });
  }

  try {
    let testUrl = baseUrl;
    if (!testUrl.includes("/models")) {
      testUrl = testUrl.endsWith("/v1") ? `${testUrl}/models` : `${testUrl}/v1/models`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const apiRes = await fetch(testUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      throw new Error(`HTTP ${apiRes.status}: ${errText.slice(0, 150)}`);
    }

    const data = await apiRes.json();
    let modelList = [];

    if (Array.isArray(data.data)) {
      modelList = data.data.map((item) => (typeof item === "string" ? item : item.id)).filter(Boolean);
    } else if (Array.isArray(data.models)) {
      modelList = data.models.map((item) => (typeof item === "string" ? item : item.id || item.name)).filter(Boolean);
    } else if (Array.isArray(data)) {
      modelList = data.map((item) => (typeof item === "string" ? item : item.id || item.name)).filter(Boolean);
    }

    // Deduplicate
    modelList = Array.from(new Set(modelList));

    // Sort so image generation models appear first
    const imageKeywords = ["image", "dall", "flux", "diffusion", "midjourney", "sd", "draw", "art", "grok", "gpt-4o", "creative"];
    const isImageModel = (id) => imageKeywords.some((kw) => id.toLowerCase().includes(kw));

    modelList.sort((a, b) => {
      const aIsImg = isImageModel(a);
      const bIsImg = isImageModel(b);
      if (aIsImg && !bIsImg) return -1;
      if (!aIsImg && bIsImg) return 1;
      return a.localeCompare(b);
    });

    if (modelList.length === 0) {
      throw new Error("接口返回的数据中未解析出有效的模型列表");
    }

    return res.json({
      success: true,
      message: `成功从网关拉取到 ${modelList.length} 个可用模型`,
      models: modelList,
      count: modelList.length,
    });
  } catch (err) {
    console.warn("[AI Models] Remote fetch failed, returning curated fallback models:", err.message);
    const fallbackList = [
      "image2",
      "dall-e-3",
      "dall-e-2",
      "flux-pro",
      "flux-dev",
      "flux-schnell",
      "grok-imagine",
      "midjourney-v6",
      "stable-diffusion-3-medium",
      "sdxl-turbo",
      "gpt-4o-image",
    ];
    return res.json({
      success: true,
      message: `网关直连受限 (${err.message})，已为您加载预置高定与主流图像大模型列表`,
      models: fallbackList,
      isFallback: true,
      count: fallbackList.length,
    });
  }
});


app.post("/api/ai/test", async (req, res) => {
  const config = readAiConfig();
  if (!config.apiKey) {
    return res.status(400).json({
      success: false,
      message: "尚未配置 API Key，请在管理员后台设置中配置有效的 OpenAI / image2 密钥",
    });
  }

  try {
    const baseUrl = config.baseUrl.replace(/\/+$/, "");
    const testUrl = baseUrl.endsWith("/v1") ? `${baseUrl}/models` : `${baseUrl}/v1/models`;

    const response = await fetch(testUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (response.ok) {
      return res.json({
        success: true,
        message: `连接成功！已顺利连接至 ${config.baseUrl}，当前模型: ${config.model}`,
      });
    } else {
      const errorText = await response.text();
      return res.status(response.status).json({
        success: false,
        message: `API 连接测试反馈 (HTTP ${response.status}): ${errorText.slice(0, 120)}`,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `网络连接异常: ${err.message}`,
    });
  }
});

// POST /api/ai/generate: Generate stylized image using configured image2 / OpenAI model

function escapeXml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function resolveImageAsBase64(imgUrl) {
  if (!imgUrl || typeof imgUrl !== "string") return "";
  if (imgUrl.startsWith("data:")) return imgUrl;
  if (imgUrl.startsWith("/api/ai/history-assets/")) {
    try {
      const localFile = path.join(AI_HISTORY_ASSETS_DIR, path.basename(imgUrl));
      if (fs.existsSync(localFile)) {
        const ext = path.extname(localFile).toLowerCase();
        if (ext === ".svg") {
          return "data:image/svg+xml;utf8," + encodeURIComponent(fs.readFileSync(localFile, "utf8"));
        }
        const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
        return `data:${mime};base64,${fs.readFileSync(localFile).toString("base64")}`;
      }
    } catch (e) {
      console.warn("[resolveImageAsBase64] Local file read notice:", e.message);
    }
  }
  if (imgUrl.startsWith("http://") || imgUrl.startsWith("https://")) {
    try {
      const res = await fetch(imgUrl, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const mime = res.headers.get("content-type") || "image/jpeg";
        return `data:${mime};base64,${Buffer.from(buf).toString("base64")}`;
      }
    } catch (e) {
      console.warn("[resolveImageAsBase64] Notice:", e.message);
    }
  }
  return imgUrl;
}

// 画幅比例 -> 上游图像模型的请求尺寸
// 说明：上游会严格保持请求尺寸的宽高比并放大输出（例如 1536x864 -> 1672x941，仍是 16:9），
// 因此必须按用户选择的画幅传入具体尺寸，否则会自动出成任意比例、与所选画幅不符。
const ASPECT_RATIO_SIZES = {
  "16:9": "1536x864",
  "4:3": "1024x768",
  "3:4": "768x1024",
  "9:16": "864x1536",
  "1:1": "1024x1024",
};

function resolveImageSize(aspectRatio, fallback) {
  if (aspectRatio && ASPECT_RATIO_SIZES[aspectRatio]) {
    return ASPECT_RATIO_SIZES[aspectRatio];
  }
  return fallback || "1024x1024";
}

async function generateFallbackStylizedArtwork(styleId, styleName, sourceImage, prompt, specifiedText, customNotes, aspectRatio = "3:4") {
  const resolvedImg = await resolveImageAsBase64(sourceImage);
  const isRetouch = Boolean(styleId && String(styleId).startsWith("retouch_"));
  const isDreamy = !isRetouch && (styleId === 'dreamy_motion_editorial' || (styleName && styleName.includes('梦幻')));
  const isFantasy = styleId === 'fantasy_qiqiguaiguai' || (styleName && (styleName.includes('奇奇怪怪') || styleName.includes('FANTASY')));
  const isBlackInk = styleId === 'street_photo_black_ink' || (styleName && (styleName.includes('黑白手绘') || styleName.includes('BLACK INK')));
  const isColorChibi = styleId === 'street_photo_color_chibi' || (styleName && (styleName.includes('彩色轻Q') || styleName.includes('COLOR CHIBI')));
  const isSplit = styleId === 'split_gouache_editorial';
  const isBauhaus = styleId === 'bauhaus_geometry';
  const isFilm = styleId === 'vintage_film_contact';
  const isCyber = styleId === 'cyberpunk_neon_noir';
  const isCreative = styleId === 'custom_creative';
  const isEasternInk =
    styleId === 'eastern_ink_diptych' ||
    styleId === 'eastern_ink_diptych_scenery' ||
    styleId === 'eastern_ink_diptych_arch' ||
    (styleName && (styleName.includes('水墨二分') || styleName.includes('Eastern Ink')));

  // AI 自由创作工作台回退艺术生成
  if (isCreative) {
    let svgW = 1280;
    let svgH = 720;
    if (aspectRatio === "3:4") { svgW = 900; svgH = 1200; }
    else if (aspectRatio === "4:3") { svgW = 1200; svgH = 900; }
    else if (aspectRatio === "9:16") { svgW = 720; svgH = 1280; }
    else if (aspectRatio === "1:1") { svgW = 1024; svgH = 1024; }

    const cleanImg = resolvedImg ? escapeXml(resolvedImg) : "";
    const cleanPrompt = escapeXml((prompt || "AI 自由创作").slice(0, 100));
    const creativeSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}">
      <defs>
        <radialGradient id="cr_warm" cx="28%" cy="65%" r="45%">
          <stop offset="0%" stop-color="#E08B3E" stop-opacity="0.95"/>
          <stop offset="45%" stop-color="#73381B" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#0E1116" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="cr_cool" cx="75%" cy="32%" r="50%">
          <stop offset="0%" stop-color="#4A7C9B" stop-opacity="0.85"/>
          <stop offset="50%" stop-color="#1B2D3D" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#0E1116" stop-opacity="0"/>
        </radialGradient>
        <filter id="cr_blur">
          <feGaussianBlur stdDeviation="32"/>
        </filter>
        <linearGradient id="cr_window" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#8BBEE8" stop-opacity="0.08"/>
        </linearGradient>
      </defs>
      <rect width="${svgW}" height="${svgH}" fill="#0E1116"/>
      <rect width="${svgW}" height="${svgH}" fill="url(#cr_cool)"/>
      <rect width="${svgW}" height="${svgH}" fill="url(#cr_warm)"/>
      ${
        cleanImg
          ? `<image href="${cleanImg}" xlink:href="${cleanImg}" x="0" y="0" width="${svgW}" height="${svgH}" preserveAspectRatio="xMidYMid slice" opacity="0.45"/>`
          : `<g opacity="0.75">
               <rect x="${svgW * 0.55}" y="${svgH * 0.08}" width="${svgW * 0.4}" height="${svgH * 0.42}" rx="8" fill="url(#cr_window)" stroke="#8BBEE8" stroke-width="2"/>
               <line x1="${svgW * 0.65}" y1="${svgH * 0.08}" x2="${svgW * 0.65}" y2="${svgH * 0.5}" stroke="#8BBEE8" stroke-width="1.5" opacity="0.6"/>
               <line x1="${svgW * 0.75}" y1="${svgH * 0.08}" x2="${svgW * 0.75}" y2="${svgH * 0.5}" stroke="#8BBEE8" stroke-width="1.5" opacity="0.6"/>
               <line x1="${svgW * 0.85}" y1="${svgH * 0.08}" x2="${svgW * 0.85}" y2="${svgH * 0.5}" stroke="#8BBEE8" stroke-width="1.5" opacity="0.6"/>
             </g>
             <ellipse cx="${svgW * 0.28}" cy="${svgH * 0.75}" rx="${svgW * 0.22}" ry="${svgH * 0.14}" fill="#FFAA44" opacity="0.35" filter="url(#cr_blur)"/>
             <circle cx="${svgW * 0.26}" cy="${svgH * 0.62}" r="${svgW * 0.035}" fill="#FFF4D0" opacity="0.9" filter="url(#cr_blur)"/>
             <circle cx="${svgW * 0.26}" cy="${svgH * 0.62}" r="${svgW * 0.015}" fill="#FFFFFF"/>
             <path d="M0 ${svgH * 0.5} Q${svgW * 0.5} ${svgH * 0.45} ${svgW} ${svgH * 0.55} L${svgW} ${svgH} L0 ${svgH} Z" fill="#0A0C10" opacity="0.65"/>`
      }
      <text x="40" y="${svgH - 64}" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="#E2D1BA" letter-spacing="2">MARGINLAB STUDIO • CINEMATIC CHIAROSCURO</text>
      <text x="40" y="${svgH - 38}" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#9CA3AF">${cleanPrompt}...</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(creativeSvg)}`;
  }

  // 东方水墨二分画：严格基于输入照片本身合成，绝不复用与照片无关的预制场景
  if (isEasternInk && resolvedImg) {
    const cleanImg = escapeXml(resolvedImg);
    const isArch = styleId === 'eastern_ink_diptych_arch' || (styleName && (styleName.includes('黑白篇') || styleName.includes('构筑')));

    let svgW = 900;
    let svgH = 1200;
    if (aspectRatio === "4:3") { svgW = 1200; svgH = 900; }
    else if (aspectRatio === "16:9") { svgW = 1280; svgH = 720; }
    else if (aspectRatio === "9:16") { svgW = 810; svgH = 1440; }
    else if (aspectRatio === "1:1") { svgW = 1024; svgH = 1024; }

    const margin = Math.round(svgW * 0.055);
    const innerW = svgW - margin * 2;
    const gap = Math.round(svgH * 0.026);
    const bottomBand = Math.round(svgH * 0.095);
    const panelH = Math.round((svgH - margin * 2 - gap - bottomBand) / 2);
    const topY = margin;
    const dividerY = margin + panelH + gap / 2;
    const lowerY = margin + panelH + gap;
    const titleY = svgH - margin - Math.round(bottomBand * 0.34);
    const subTitleY = titleY + Math.round(bottomBand * 0.30);
    const tagW = Math.round(innerW * 0.2);
    const tagH = Math.round(bottomBand * 0.42);
    const tagX = svgW - margin - tagW;
    const tagY = svgH - margin - tagH;
    const paper = isArch ? '#F6F4ED' : '#F8F5EE';
    // 下半部水墨面板：对同一张照片做轻微推近裁切，形成"同一主体 · 另一媒介"的二分对照
    const inkZoom = 1.12;
    const inkW = Math.round(innerW * inkZoom);
    const inkH = Math.round(panelH * inkZoom);
    const inkX = Math.round(margin - (inkW - innerW) / 2);
    const inkY = Math.round(lowerY - (inkH - panelH) / 2);

    const easternInkSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}">
      <defs>
        <filter id="ei_paper" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="${Math.round(svgH * 0.003)}" stdDeviation="${Math.round(svgW * 0.006)}" flood-color="#000000" flood-opacity="0.16"/>
        </filter>
        <filter id="ei_gray" x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix type="matrix" values="0.33 0.59 0.11 0 0  0.33 0.59 0.11 0 0  0.33 0.59 0.11 0 0  0 0 0 1 0"/>
          <feComponentTransfer>
            <feFuncR type="linear" slope="1.24" intercept="0.03"/>
            <feFuncG type="linear" slope="1.24" intercept="0.03"/>
            <feFuncB type="linear" slope="1.24" intercept="0.03"/>
          </feComponentTransfer>
          <feGaussianBlur stdDeviation="1.3"/>
        </filter>
        <filter id="ei_saturate" x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix type="saturate" values="0.34"/>
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.55" intercept="0.42"/>
            <feFuncG type="linear" slope="0.55" intercept="0.42"/>
            <feFuncB type="linear" slope="0.55" intercept="0.42"/>
          </feComponentTransfer>
        </filter>
        <radialGradient id="ei_paper_light" cx="50%" cy="38%" r="72%">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.55"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.03"/>
        </radialGradient>
        <linearGradient id="ei_ink_wash" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${paper}" stop-opacity="0.46"/>
          <stop offset="100%" stop-color="${paper}" stop-opacity="0.26"/>
        </linearGradient>
      </defs>
      <rect width="${svgW}" height="${svgH}" fill="${paper}"/>
      <rect x="${Math.round(margin * 0.45)}" y="${Math.round(margin * 0.42)}" width="${svgW - Math.round(margin * 0.9)}" height="${svgH - Math.round(margin * 0.84)}" fill="none" stroke="#E2DDD2" stroke-width="1"/>

      <!-- 上半部：输入照片的真实摄影内容（原样保留，等比例裁切） -->
      <g filter="url(#ei_paper)">
        <clipPath id="ei_top_clip"><rect x="${margin}" y="${topY}" width="${innerW}" height="${panelH}" rx="3"/></clipPath>
        <image href="${cleanImg}" xlink:href="${cleanImg}" x="${margin}" y="${topY}" width="${innerW}" height="${panelH}" preserveAspectRatio="xMidYMid slice" clip-path="url(#ei_top_clip)"/>
      </g>

      <!-- 中部细分割线 -->
      <line x1="${margin + Math.round(innerW * 0.04)}" y1="${dividerY}" x2="${svgW - margin - Math.round(innerW * 0.04)}" y2="${dividerY}" stroke="#CFC7B7" stroke-width="1" stroke-dasharray="3,4"/>

      <!-- 下半部：同一张照片提炼的水墨写意面板（内容与原图完全一致） -->
      <g filter="url(#ei_paper)">
        <clipPath id="ei_low_clip"><rect x="${margin}" y="${lowerY}" width="${innerW}" height="${panelH}" rx="3"/></clipPath>
        <rect x="${margin}" y="${lowerY}" width="${innerW}" height="${panelH}" fill="${paper}"/>
        <g clip-path="url(#ei_low_clip)">
          <image href="${cleanImg}" xlink:href="${cleanImg}" x="${inkX}" y="${inkY}" width="${inkW}" height="${inkH}" preserveAspectRatio="xMidYMid slice" filter="url(#ei_gray)"/>
          ${isArch ? '' : `<image href="${cleanImg}" xlink:href="${cleanImg}" x="${inkX}" y="${inkY}" width="${inkW}" height="${inkH}" preserveAspectRatio="xMidYMid slice" filter="url(#ei_saturate)" opacity="0.22" style="mix-blend-mode:multiply"/>`}
          <rect x="${margin}" y="${lowerY}" width="${innerW}" height="${panelH}" fill="url(#ei_ink_wash)"/>
          <rect x="${margin}" y="${lowerY}" width="${innerW}" height="${panelH}" fill="url(#ei_paper_light)"/>
        </g>
        <rect x="${margin}" y="${lowerY}" width="${innerW}" height="${panelH}" fill="none" stroke="#DAD3C4" stroke-width="1" rx="3"/>
      </g>

      <!-- 底部边距：小字号细衬线英文标题 -->
      <text x="${svgW / 2}" y="${titleY}" font-family="'Times New Roman', 'Songti SC', serif" font-size="${Math.round(svgW * 0.024)}" font-weight="bold" fill="#292524" text-anchor="middle" letter-spacing="${Math.round(svgW * 0.008)}">EASTERN INK DIPTYCH</text>
      <text x="${svgW / 2}" y="${subTitleY}" font-family="'Helvetica Neue', sans-serif" font-size="${Math.round(svgW * 0.0135)}" font-weight="500" fill="#78716C" text-anchor="middle" letter-spacing="${Math.round(svgW * 0.003)}">${isArch ? 'ARCHITECTURE STUDY' : 'SCENERY STUDY'} · KEPT FAITHFUL TO THE ORIGINAL PHOTO</text>
      <rect x="${tagX}" y="${tagY}" width="${tagW}" height="${tagH}" rx="4" fill="${isArch ? '#78350F' : '#374151'}"/>
      <text x="${tagX + tagW / 2}" y="${tagY + tagH * 0.68}" font-family="sans-serif" font-size="${Math.round(svgW * 0.021)}" font-weight="bold" fill="${isArch ? '#FEF3C7' : '#F3F4F6'}" text-anchor="middle">${isArch ? '水墨构筑' : '水墨二分'}</text>
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(easternInkSvg);
  }

  if (isRetouch && resolvedImg) {
    const cleanImg = escapeXml(resolvedImg);
    const sId = String(styleId);
    const isBW = sId.includes("bw") || (styleName && styleName.includes("黑白"));
    const isWarm = sId.includes("hair_light") || sId.includes("sunset") || sId.includes("golden") || sId.includes("warm") || sId.includes("vintage") || sId.includes("autumn");
    const isCool = sId.includes("blue") || sId.includes("cyber") || sId.includes("cold") || sId.includes("snow") || sId.includes("fuji");
    const isBright = sId.includes("flash") || sId.includes("water") || sId.includes("beauty") || sId.includes("clear") || sId.includes(" brighten");

    const matrixValues = isBW
      ? "0.33 0.59 0.11 0 0.02  0.33 0.59 0.11 0 0.02  0.33 0.59 0.11 0 0.02  0 0 0 1 0"
      : isWarm
      ? "1.12 0.04 0 0 0.03  0.02 1.04 0 0 0.01  0 0 0.90 0 0  0 0 0 1 0"
      : isCool
      ? "0.94 0 0.04 0 0  0 1.03 0.05 0 0.01  0.02 0.05 1.14 0 0.03  0 0 0 1 0"
      : isBright
      ? "1.08 0.02 0.02 0 0.04  0.02 1.08 0.02 0 0.04  0.02 0.02 1.08 0 0.04  0 0 0 1 0"
      : "1.06 0.02 0 0 0.02  0 1.05 0.01 0 0.02  0 0.01 1.04 0 0.02  0 0 0 1 0";

    const overlayGlow = isWarm
      ? `<radialGradient id="rt_glow" cx="75%" cy="20%" r="65%"><stop offset="0%" stop-color="#FDE68A" stop-opacity="0.38"/><stop offset="55%" stop-color="#F59E0B" stop-opacity="0.12"/><stop offset="100%" stop-color="#000000" stop-opacity="0"/></radialGradient>`
      : isCool
      ? `<radialGradient id="rt_glow" cx="50%" cy="25%" r="70%"><stop offset="0%" stop-color="#BAE6FD" stop-opacity="0.28"/><stop offset="60%" stop-color="#38BDF8" stop-opacity="0.08"/><stop offset="100%" stop-color="#000000" stop-opacity="0"/></radialGradient>`
      : `<radialGradient id="rt_glow" cx="50%" cy="35%" r="65%"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.22"/><stop offset="100%" stop-color="#000000" stop-opacity="0.06"/></radialGradient>`;

    let svgW = 768;
    let svgH = 1024;
    if (aspectRatio === "4:3") { svgW = 1024; svgH = 768; }
    else if (aspectRatio === "16:9") { svgW = 1280; svgH = 720; }
    else if (aspectRatio === "9:16") { svgW = 720; svgH = 1280; }
    else if (aspectRatio === "1:1") { svgW = 1024; svgH = 1024; }
    else { svgW = 768; svgH = 1024; }

    const retouchSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}">
      <defs>
        <filter id="rt_filter" x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix type="matrix" values="${matrixValues}"/>
        </filter>
        ${overlayGlow}
      </defs>
      <image href="${cleanImg}" xlink:href="${cleanImg}" x="0" y="0" width="${svgW}" height="${svgH}" preserveAspectRatio="xMidYMid slice" filter="url(#rt_filter)"/>
      <rect x="0" y="0" width="${svgW}" height="${svgH}" fill="url(#rt_glow)"/>
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(retouchSvg);
  }

  if (isFantasy) {
    let fTitle = "本人正在加载";
    let fSub = "临时外包电源 • 请勿强制启动";
    let fTag1 = "⚡ 续命装置";
    let fTag2 = "电量: 18%";
    let fPercent = "68%";

    const lowerP = (prompt || "").toLowerCase();
    const lowerS = (sourceImage || "").toLowerCase();
    const lowerN = (customNotes || "").toLowerCase();

    if (specifiedText && specifiedText.trim().length > 0) {
      fTitle = specifiedText.trim();
    } else if (lowerP.includes("猫") || lowerP.includes("狗") || lowerP.includes("宠") || lowerP.includes("pet") || lowerS.includes("dog") || lowerS.includes("cat") || lowerN.includes("猫") || lowerN.includes("狗")) {
      fTitle = "家庭首席批准官";
      fSub = "今日决策：拆！业务已全票通过";
      fTag1 = "🐾 业务审批";
      fTag2 = "超支已核准";
      fPercent = "100%";
    } else if (lowerP.includes("雨") || lowerP.includes("伞") || lowerP.includes("rain") || lowerP.includes("weather")) {
      fTitle = "临时气象外包";
      fSub = "今日降水服务：全靠我撑场子";
      fTag1 = "🌧️ 靠天吃饭";
      fTag2 = "勉强有效";
      fPercent = "80%";
    } else if (lowerP.includes("行李") || lowerP.includes("箱") || lowerP.includes("焦虑") || lowerP.includes("travel")) {
      fTitle = "把焦虑托运一下";
      fSub = "换个城市，换个心情，下一站未知";
      fTag1 = "🧳 行李: 超重";
      fTag2 = "计划: 已变形";
      fPercent = "95%";
    } else if (lowerP.includes("街") || lowerP.includes("停") || lowerP.includes("红灯") || lowerP.includes("city")) {
      fTitle = "城市暂停三十秒";
      fSub = "行人缓存中 • 信号待定";
      fTag1 = "🚦 等待模式";
      fTag2 = "肉体仍在工位";
      fPercent = "45%";
    }

    if (customNotes && customNotes.trim().length > 0 && !lowerP.includes("猫") && !lowerP.includes("狗")) {
      fSub = `${customNotes.trim()} • 正在加载中`;
    }

    const cleanImg = resolvedImg ? escapeXml(resolvedImg) : "";
    const cleanTitle = escapeXml(fTitle);
    const cleanSub = escapeXml(fSub);
    const cleanTag1 = escapeXml(fTag1);
    const cleanTag2 = escapeXml(fTag2);

    const fantasySvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 768 1024" width="768" height="1024" style="background:#0F172A;">
      <defs>
        <linearGradient id="fq_blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#38BDF8"/>
          <stop offset="100%" stop-color="#2563EB"/>
        </linearGradient>
        <linearGradient id="fq_amber" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#FDE047"/>
          <stop offset="100%" stop-color="#F59E0B"/>
        </linearGradient>
        <linearGradient id="fq_overlay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.45"/>
          <stop offset="35%" stop-color="#000000" stop-opacity="0.05"/>
          <stop offset="70%" stop-color="#000000" stop-opacity="0.15"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.75"/>
        </linearGradient>
        <filter id="fq_sticker_shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000000" flood-opacity="0.5"/>
        </filter>
      </defs>

      <!-- FULL-BLEED 3:4 PHOTOGRAPH (T3 Image Overlay / T1 Portrait Editorial) -->
      ${
        cleanImg && cleanImg.length > 0
          ? `<image href="${cleanImg}" xlink:href="${cleanImg}" x="0" y="0" width="768" height="1024" preserveAspectRatio="xMidYMid slice"/>`
          : `<rect width="768" height="1024" fill="#1E293B"/>`
      }

      <!-- Vignette Gradient for High Editorial Contrast -->
      <rect width="768" height="1024" fill="url(#fq_overlay)"/>

      <!-- Top Left Tape Sticker -->
      <g transform="rotate(-4 140 60)" filter="url(#fq_sticker_shadow)">
        <rect x="40" y="38" width="180" height="42" fill="#FEF08A" rx="2" opacity="0.96"/>
        <text x="130" y="65" font-family="'Courier New', monospace" font-size="15" font-weight="900" fill="#854D0E" text-anchor="middle" letter-spacing="1.5">FANTASY / 3:4</text>
      </g>

      <!-- Top Right Receipt / Status Tag -->
      <g transform="translate(560, 45) rotate(3)" filter="url(#fq_sticker_shadow)">
        <rect x="0" y="0" width="160" height="60" rx="6" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/>
        <text x="80" y="24" font-family="monospace" font-size="11" font-weight="bold" fill="#64748B" text-anchor="middle">STATUS CHECK</text>
        <text x="80" y="46" font-family="'PingFang SC', sans-serif" font-size="14" font-weight="900" fill="#0F172A" text-anchor="middle">已全票通过 ✓</text>
      </g>

      <!-- Giant Sticker Title Layered Across Image with Thick White Cutout Outline -->
      <g filter="url(#fq_sticker_shadow)">
        <text x="384" y="190" font-family="'PingFang SC', 'Microsoft YaHei', 'Arial Black', sans-serif" font-size="${fTitle.length > 7 ? 58 : 76}" font-weight="900" fill="#FFFFFF" text-anchor="middle" stroke="#FFFFFF" stroke-width="${fTitle.length > 7 ? 16 : 22}" stroke-linejoin="round" letter-spacing="3">${cleanTitle}</text>
        <text x="384" y="190" font-family="'PingFang SC', 'Microsoft YaHei', 'Arial Black', sans-serif" font-size="${fTitle.length > 7 ? 58 : 76}" font-weight="900" fill="#0F172A" text-anchor="middle" letter-spacing="3">${cleanTitle}</text>
      </g>

      <!-- Battery / Progress Bar Pill on Photo -->
      <g transform="translate(144, 230)" filter="url(#fq_sticker_shadow)">
        <rect x="0" y="0" width="480" height="46" rx="23" fill="#0F172A" stroke="#FFFFFF" stroke-width="3"/>
        <rect x="6" y="6" width="${Math.round(4.68 * parseInt(fPercent))}" height="34" rx="17" fill="url(#fq_amber)"/>
        <text x="240" y="29" font-family="'Courier New', monospace" font-size="16" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">LOADING ${fPercent}</text>
      </g>

      <!-- Functional Tag 1 (Washi Badge Left) -->
      <g transform="translate(48, 480) rotate(-5)" filter="url(#fq_sticker_shadow)">
        <rect x="0" y="0" width="220" height="68" rx="10" fill="#FEF08A" stroke="#FFFFFF" stroke-width="3"/>
        <text x="18" y="28" font-family="'PingFang SC', sans-serif" font-size="16" font-weight="900" fill="#713F12">${cleanTag1}</text>
        <text x="18" y="52" font-family="'PingFang SC', sans-serif" font-size="13" font-weight="bold" fill="#854D0E">${cleanTag2}</text>
      </g>

      <!-- Functional Tag 2 (Warning Stamp Right) -->
      <g transform="translate(510, 520) rotate(4)" filter="url(#fq_sticker_shadow)">
        <rect x="0" y="0" width="210" height="56" rx="8" fill="#EF4444" stroke="#FFFFFF" stroke-width="3"/>
        <text x="105" y="35" font-family="'PingFang SC', sans-serif" font-size="17" font-weight="900" fill="#FFFFFF" text-anchor="middle">⚠️ 情绪已超标</text>
      </g>

      <!-- Bottom Editorial Punchline Subtitle Block -->
      <g transform="translate(54, 880)" filter="url(#fq_sticker_shadow)">
        <rect x="0" y="0" width="660" height="88" rx="14" fill="#0F172A" stroke="#FFFFFF" stroke-width="3"/>
        <text x="330" y="40" font-family="'Songti SC', 'STSong', serif" font-size="22" font-weight="900" fill="#F8FAFC" text-anchor="middle" letter-spacing="2">“${cleanSub}”</text>
        <text x="330" y="68" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#38BDF8" text-anchor="middle" letter-spacing="3">FANTASY SOCIAL EDITORIAL • EDITION 02</text>
      </g>
    </svg>`;

    return "data:image/svg+xml;utf8," + encodeURIComponent(fantasySvg);
  }
  if (isBlackInk) {
    const cleanImg = resolvedImg ? escapeXml(resolvedImg) : "";
    let envTitle = specifiedText && specifiedText.trim().length > 0 ? escapeXml(specifiedText.trim()) : "SHIBUYA CROSSING • 16:40";
    let envNote = customNotes && customNotes.trim().length > 0 ? escapeXml(customNotes.trim()) : "STREET CHRONICLES • 街角慢速漫游";

    const blackInkSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 768 1024" width="768" height="1024" style="background:#111827;">
      <defs>
        <filter id="bi_shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.55"/>
        </filter>
        <linearGradient id="bi_photo_veil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.25"/>
          <stop offset="40%" stop-color="#000000" stop-opacity="0.05"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.6"/>
        </linearGradient>
      </defs>

      <!-- 100% PHOTOGRAPHIC REAL ENVIRONMENT (NO REDRAWING) -->
      ${
        cleanImg && cleanImg.length > 0
          ? `<image href="${cleanImg}" xlink:href="${cleanImg}" x="0" y="0" width="768" height="1024" preserveAspectRatio="xMidYMid slice"/>`
          : `<rect width="768" height="1024" fill="#1F2937"/>`
      }
      <rect width="768" height="1024" fill="url(#bi_photo_veil)"/>

      <!-- Environment Negative Space Typography (Upper Sky / Negative Space) -->
      <g filter="url(#bi_shadow)">
        <text x="56" y="90" font-family="'PingFang SC', 'Helvetica Neue', 'Arial Black', sans-serif" font-size="28" font-weight="900" fill="#FFFFFF" letter-spacing="3">${envTitle}</text>
        <text x="56" y="118" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#F1F5F9" letter-spacing="2">BLACK INK EDITORIAL / PHOTOGRAPHIC COEXISTENCE</text>
        <line x1="56" y1="130" x2="360" y2="130" stroke="#FFFFFF" stroke-width="2" opacity="0.8"/>
      </g>

      <!-- Top Right Style Badge Tag -->
      <g transform="translate(560, 48) rotate(2)" filter="url(#bi_shadow)">
        <rect x="0" y="0" width="160" height="42" fill="#FFFFFF" rx="4"/>
        <text x="80" y="27" font-family="'Courier New', monospace" font-size="14" font-weight="900" fill="#0F172A" text-anchor="middle" letter-spacing="1">BLACK INK</text>
      </g>

      <!-- Character Replacement Layer: Pure White Fill + Crisp Black Lines + Thick White Sticker Outline -->
      <g transform="translate(240, 240)" filter="url(#bi_shadow)">
        <!-- Crisp White Sticker Border (Layer 1) -->
        <g stroke="#FFFFFF" stroke-width="26" stroke-linejoin="round" stroke-linecap="round" fill="#FFFFFF">
          <ellipse cx="144" cy="110" rx="60" ry="74"/>
          <path d="M96 170 C60 210, 50 380, 80 470 L208 470 C238 380, 228 210, 192 170 Z"/>
          <path d="M80 470 L70 680 L120 680 L134 470 Z"/>
          <path d="M154 470 L168 680 L218 680 L208 470 Z"/>
          <path d="M70 210 L20 360 L50 375 L90 250 Z"/>
          <path d="M218 210 L268 360 L238 375 L198 250 Z"/>
        </g>

        <!-- Pure White Interior Fill (Layer 2) -->
        <g fill="#FFFFFF">
          <ellipse cx="144" cy="110" rx="58" ry="72"/>
          <path d="M96 170 C60 210, 50 380, 80 470 L208 470 C238 380, 228 210, 192 170 Z"/>
          <path d="M80 470 L70 680 L120 680 L134 470 Z"/>
          <path d="M154 470 L168 680 L218 680 L208 470 Z"/>
          <path d="M70 210 L20 360 L50 375 L90 250 Z"/>
          <path d="M218 210 L268 360 L238 375 L198 250 Z"/>
        </g>

        <!-- Crisp Black Linework (Layer 3) -->
        <g stroke="#0F172A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <!-- Head contour & hair silhouette -->
          <ellipse cx="144" cy="110" rx="58" ry="72"/>
          <path d="M86 100 C80 40, 208 40, 202 100 C180 75, 110 75, 86 100 Z" fill="#0F172A"/>
          
          <!-- Mandatory Dot Eyes & Tiny Smile (No Realistic Facial Features) -->
          <circle cx="126" cy="118" r="6" fill="#0F172A"/>
          <circle cx="162" cy="118" r="6" fill="#0F172A"/>
          <path d="M138 138 Q144 144 150 138" stroke-width="4"/>

          <!-- Body / Garment Silhouette & Minimal Structure Lines -->
          <path d="M96 170 C60 210, 50 380, 80 470 L208 470 C238 380, 228 210, 192 170 Z"/>
          <path d="M144 170 L144 470"/>
          <path d="M100 280 L188 280"/>
          <path d="M70 210 L20 360 L50 375 L90 250 Z"/>
          <path d="M218 210 L268 360 L238 375 L198 250 Z"/>

          <!-- Legs & Clean Shoes (Faithful Adult Silhouette) -->
          <path d="M80 470 L70 680 L120 680 L134 470 Z"/>
          <path d="M154 470 L168 680 L218 680 L208 470 Z"/>
          <rect x="64" y="675" width="60" height="20" rx="6" fill="#0F172A"/>
          <rect x="164" y="675" width="60" height="20" rx="6" fill="#0F172A"/>
        </g>
      </g>

      <!-- Bottom Editorial Anchor Banner -->
      <g transform="translate(54, 910)" filter="url(#bi_shadow)">
        <rect x="0" y="0" width="660" height="64" rx="12" fill="#0F172A" stroke="#FFFFFF" stroke-width="2"/>
        <text x="36" y="38" font-family="'PingFang SC', sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" letter-spacing="1">黑白手绘实景插画 • BLACK INK</text>
        <text x="624" y="38" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#94A3B8" text-anchor="end">${envNote}</text>
      </g>
    </svg>`;

    return "data:image/svg+xml;utf8," + encodeURIComponent(blackInkSvg);
  }

  if (isColorChibi) {
    const cleanImg = resolvedImg ? escapeXml(resolvedImg) : "";
    let envTitle = specifiedText && specifiedText.trim().length > 0 ? escapeXml(specifiedText.trim()) : "SUMMER AFTERNOON • 15:30";
    let envNote = customNotes && customNotes.trim().length > 0 ? escapeXml(customNotes.trim()) : "LIFESTYLE CHIBI • 城市漫游";

    const colorChibiSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 768 1024" width="768" height="1024" style="background:#0284C7;">
      <defs>
        <filter id="cc_shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#000000" flood-opacity="0.45"/>
        </filter>
        <linearGradient id="cc_photo_veil" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.2"/>
          <stop offset="50%" stop-color="#000000" stop-opacity="0.05"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0.55"/>
        </linearGradient>
      </defs>

      <!-- 100% PHOTOGRAPHIC REAL ENVIRONMENT (NO REDRAWING) -->
      ${
        cleanImg && cleanImg.length > 0
          ? `<image href="${cleanImg}" xlink:href="${cleanImg}" x="0" y="0" width="768" height="1024" preserveAspectRatio="xMidYMid slice"/>`
          : `<rect width="768" height="1024" fill="#0369A1"/>`
      }
      <rect width="768" height="1024" fill="url(#cc_photo_veil)"/>

      <!-- Environment Negative Space Typography (Upper Sky / Negative Space) -->
      <g filter="url(#cc_shadow)">
        <text x="56" y="90" font-family="'PingFang SC', 'Helvetica Neue', 'Arial Black', sans-serif" font-size="28" font-weight="900" fill="#FFFFFF" letter-spacing="3">${envTitle}</text>
        <text x="56" y="118" font-family="'Courier New', monospace" font-size="13" font-weight="bold" fill="#FEF08A" letter-spacing="2">COLOR CHIBI EDITORIAL / 5-HEAD FASHION SILHOUETTE</text>
        <line x1="56" y1="130" x2="380" y2="130" stroke="#FEF08A" stroke-width="2" opacity="0.9"/>
      </g>

      <!-- Top Right Style Badge Tag -->
      <g transform="translate(560, 48) rotate(-2)" filter="url(#cc_shadow)">
        <rect x="0" y="0" width="160" height="42" fill="#FEF08A" rx="4"/>
        <text x="80" y="27" font-family="'Courier New', monospace" font-size="14" font-weight="900" fill="#854D0E" text-anchor="middle" letter-spacing="1">COLOR CHIBI</text>
      </g>

      <!-- Character Replacement Layer: 5-Head Proportion + Vibrant Outfit + White Sticker Outline -->
      <g transform="translate(230, 240)" filter="url(#cc_shadow)">
        <!-- Crisp White Sticker Border (Layer 1) -->
        <g stroke="#FFFFFF" stroke-width="26" stroke-linejoin="round" stroke-linecap="round" fill="#FFFFFF">
          <ellipse cx="154" cy="115" rx="66" ry="78"/>
          <path d="M102 180 C70 220, 60 380, 92 460 L216 460 C248 380, 238 220, 206 180 Z"/>
          <path d="M92 460 L80 680 L130 680 L144 460 Z"/>
          <path d="M164 460 L178 680 L228 680 L216 460 Z"/>
          <path d="M76 220 L24 360 L56 375 L98 260 Z"/>
          <path d="M232 220 L284 360 L252 375 L210 260 Z"/>
        </g>

        <!-- Clothing Colors & Head Fills (Layer 2) -->
        <!-- Skin & Face -->
        <ellipse cx="154" cy="115" rx="64" ry="76" fill="#FED7AA"/>
        <!-- Hair (Chestnut brown stylish cut) -->
        <path d="M90 105 C85 35, 225 35, 218 105 C190 75, 115 75, 90 105 Z" fill="#92400E"/>
        <!-- Yellow Knit Sweater -->
        <path d="M102 180 C70 220, 60 380, 92 460 L216 460 C248 380, 238 220, 206 180 Z" fill="#FDE047"/>
        <!-- Denim Blue Shorts / Skirt -->
        <rect x="100" y="440" width="108" height="60" rx="8" fill="#2563EB"/>
        <!-- Legs (Skin tone, 5 heads proportion) -->
        <path d="M92 490 L82 670 L128 670 L138 490 Z" fill="#FED7AA"/>
        <path d="M170 490 L180 670 L226 670 L216 490 Z" fill="#FED7AA"/>
        <!-- Red Crossbody Bag -->
        <path d="M84 260 L60 360 L92 375 Z" fill="#EF4444"/>

        <!-- Crisp Outlines, Dot Eyes & Pink Blush (Layer 3) -->
        <g stroke="#0F172A" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none">
          <ellipse cx="154" cy="115" rx="64" ry="76"/>
          <path d="M90 105 C85 35, 225 35, 218 105 C190 75, 115 75, 90 105 Z"/>

          <!-- Abstract Dot Eyes, Light Blush, Tiny Smile (No Anime Shiny Eyes) -->
          <circle cx="134" cy="122" r="6" fill="#0F172A"/>
          <circle cx="174" cy="122" r="6" fill="#0F172A"/>
          <path d="M148 142 Q154 148 160 142" stroke-width="3.5"/>
          <ellipse cx="120" cy="134" rx="9" ry="5" fill="#F43F5E" opacity="0.6" stroke="none"/>
          <ellipse cx="188" cy="134" rx="9" ry="5" fill="#F43F5E" opacity="0.6" stroke="none"/>

          <!-- Body Silhouette Lines -->
          <path d="M102 180 C70 220, 60 380, 92 460 L216 460 C248 380, 238 220, 206 180 Z"/>
          <path d="M76 220 L24 360 L56 375 L98 260 Z"/>
          <path d="M232 220 L284 360 L252 375 L210 260 Z"/>
          <path d="M92 490 L82 670 L128 670 L138 490 Z"/>
          <path d="M170 490 L180 670 L226 670 L216 490 Z"/>

          <!-- White Sneaker Shoes -->
          <rect x="76" y="665" width="56" height="22" rx="6" fill="#FFFFFF"/>
          <rect x="176" y="665" width="56" height="22" rx="6" fill="#FFFFFF"/>
        </g>
      </g>

      <!-- Bottom Editorial Anchor Banner -->
      <g transform="translate(54, 910)" filter="url(#cc_shadow)">
        <rect x="0" y="0" width="660" height="64" rx="12" fill="#0F172A" stroke="#38BDF8" stroke-width="2"/>
        <text x="36" y="38" font-family="'PingFang SC', sans-serif" font-size="16" font-weight="900" fill="#FFFFFF" letter-spacing="1">彩色轻Q实景插画 • COLOR CHIBI</text>
        <text x="624" y="38" font-family="'Courier New', monospace" font-size="12" font-weight="bold" fill="#38BDF8" text-anchor="end">${envNote}</text>
      </g>
    </svg>`;

    return "data:image/svg+xml;utf8," + encodeURIComponent(colorChibiSvg);
  }


  let quoteText = "光影穿梭，电车奔赴旧梦";
  let subText = "DREAMY MOTION EDITORIAL • S21";
  let mechanismTag = "CROWD DRIFT • SLOW SHUTTER";

  if ((sourceImage && sourceImage.includes("1444464666168")) || (prompt && prompt.includes("长空"))) {
    quoteText = "长空万里，风为飞鸟留白";
    mechanismTag = "BACKLIT HALATION • NEGATIVE SPACE";
  } else if ((sourceImage && sourceImage.includes("1519741497674")) || (prompt && prompt.includes("风拂"))) {
    quoteText = "风拂裙摆，时光温柔慢行";
    mechanismTag = "PASSING GESTURE • DYNAMIC VEIL";
  } else if ((sourceImage && sourceImage.includes("1517841905240")) || (prompt && prompt.includes("玻璃"))) {
    quoteText = "玻璃倒影，倒流岁月清浅";
    mechanismTag = "GLASS MEMORY • REFLECTION LAYER";
  } else if ((sourceImage && sourceImage.includes("1490750967868")) || (prompt && prompt.includes("繁花"))) {
    quoteText = "繁花如织，时光驻足此刻";
    mechanismTag = "FLORAL DIFFUSION • FOREGROUND BLUR";
  } else if ((sourceImage && sourceImage.includes("1506744038136")) || (prompt && prompt.includes("山川"))) {
    quoteText = "山川远阔，人间草木";
    mechanismTag = "COLOR FIELD • WABI-SABI ALPINE";
  }

  const cleanImg = resolvedImg ? escapeXml(resolvedImg) : "";
  const cleanQuote = escapeXml(quoteText);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 1024" width="1024" height="1024">
    <defs>
      <linearGradient id="dm_bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#181B22"/>
        <stop offset="40%" stop-color="#323C46"/>
        <stop offset="70%" stop-color="#8F6A43"/>
        <stop offset="100%" stop-color="#E2D1BA"/>
      </linearGradient>
      <linearGradient id="dm_sun" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="#FCD34D" stop-opacity="0.2"/>
      </linearGradient>
      <filter id="blur_heavy">
        <feGaussianBlur stdDeviation="8"/>
      </filter>
      <filter id="motion_blur">
        <feGaussianBlur in="SourceGraphic" stdDeviation="16,2"/>
      </filter>
    </defs>
    <rect width="1024" height="1024" fill="${isDreamy ? 'url(#dm_bg)' : isCyber ? '#0A0B10' : isBauhaus ? '#EDE9DF' : '#F4F1EA'}"/>
    ${
      isDreamy
        ? `<!-- Window Frame Silhouette with Photo Embedded -->
           <clipPath id="dm_photo_clip">
             <rect x="80" y="80" width="560" height="620" rx="36"/>
           </clipPath>
           <rect x="80" y="80" width="560" height="620" rx="36" fill="#13171D" opacity="0.8" stroke="#3A4652" stroke-width="8"/>
           <g clip-path="url(#dm_photo_clip)">
             ${
               cleanImg && cleanImg.length > 0
                 ? `<image href="${cleanImg}" xlink:href="${cleanImg}" x="80" y="80" width="560" height="620" preserveAspectRatio="xMidYMid slice"/>
                    <rect x="80" y="80" width="560" height="620" fill="#181B22" opacity="0.25"/>`
                 : `<path d="M80 460 Q240 360 400 440 T640 420 L640 700 L80 700 Z" fill="#3D5060" opacity="0.85"/>`
             }
           </g>
           <!-- Glowing Golden Sun Lake Reflection with Motion Blur -->
           <circle cx="480" cy="280" r="65" fill="url(#dm_sun)" filter="url(#blur_heavy)"/>
           <circle cx="480" cy="280" r="110" fill="#FDE68A" opacity="0.25"/>
           <!-- Directional Slow Shutter Motion Streaks -->
           <path d="M40 500 L980 620 L880 740 L0 600 Z" fill="#FFECC8" opacity="0.35" filter="url(#motion_blur)"/>
           <path d="M120 320 L860 460" stroke="#FFFFFF" stroke-width="12" stroke-linecap="round" opacity="0.4" filter="url(#motion_blur)"/>
           <path d="M60 620 L940 760" stroke="#E5C49F" stroke-width="18" stroke-linecap="round" opacity="0.5" filter="url(#motion_blur)"/>
           <!-- Train Passenger Seats with Warm Halation Edge -->
           <rect x="580" y="260" width="340" height="460" rx="24" fill="#3F2B1D" opacity="0.95" stroke="#E5C49F" stroke-width="4"/>
           <rect x="650" y="320" width="220" height="340" rx="16" fill="#6B4628"/>
           <!-- S21 Poetic Calligraphy Titles -->
           <text x="100" y="820" font-family="'Songti SC', 'STSong', serif" font-size="52" font-weight="bold" fill="#FFFFFF" letter-spacing="6">${cleanQuote}</text>
           <text x="100" y="880" font-family="'Helvetica Neue', sans-serif" font-size="22" font-weight="700" fill="#E2D1BA" letter-spacing="8">DREAMY MOTION EDITORIAL • S21</text>
           <text x="100" y="925" font-family="monospace" font-size="18" fill="#C59B6D" letter-spacing="4">KINETIC NEGATIVE SPACE • PHOTOGRAPH BY MARGINLAB</text>`
        : isSplit
        ? `<rect x="64" y="64" width="896" height="420" rx="16" fill="#3D4B53"/>
           <circle cx="800" cy="180" r="48" fill="#E8D5B5" opacity="0.8"/>
           <path d="M64 360 L240 240 L420 340 L650 200 L960 380 L960 484 L64 484 Z" fill="#6A7F8A" opacity="0.6"/>
           <rect x="64" y="520" width="896" height="340" rx="16" fill="#EAE5DC"/>
           <rect x="140" y="600" width="120" height="220" rx="8" fill="#5B6E77"/>
           <rect x="280" y="560" width="150" height="260" rx="8" fill="#889DA7"/>
           <rect x="450" y="630" width="100" height="190" rx="8" fill="#B3A28F"/>
           <circle cx="780" cy="620" r="28" fill="#D49B58"/>
           <text x="120" y="910" font-family="'Didot', 'Playfair Display', serif" font-size="32" font-weight="bold" fill="#1C1D20" letter-spacing="4">HAUTE COUTURE EDITORIAL</text>
           <text x="120" y="945" font-family="monospace" font-size="16" fill="#787C80" letter-spacing="2">VOL. 08 • CONTEMPORARY GOUACHE ARCHITECTURE</text>`
        : isBauhaus
        ? `<circle cx="340" cy="380" r="220" fill="#DE4B39"/>
           <rect x="420" y="380" width="380" height="400" fill="#1C3879"/>
           <polygon points="120,800 420,800 270,500" fill="#F1B838"/>
           <line x1="80" y1="840" x2="944" y2="840" stroke="#1A1A1A" stroke-width="12"/>
           <text x="100" y="920" font-family="'Helvetica Neue', sans-serif" font-size="44" font-weight="900" fill="#1A1A1A" letter-spacing="8">BAUHAUS 1923</text>
           <text x="100" y="960" font-family="monospace" font-size="20" fill="#555" letter-spacing="4">STAATLICHES BAUHAUS WEIMAR</text>`
        : isCyber
        ? `<rect x="120" y="140" width="180" height="680" fill="#141824"/>
           <rect x="340" y="80" width="220" height="740" fill="#171C2B"/>
           <rect x="600" y="200" width="160" height="620" fill="#111520"/>
           <line x1="210" y1="200" x2="210" y2="600" stroke="#00F0FF" stroke-width="12" filter="drop-shadow(0 0 16px #00F0FF)"/>
           <line x1="450" y1="160" x2="450" y2="520" stroke="#FF007F" stroke-width="12" filter="drop-shadow(0 0 16px #FF007F)"/>
           <rect x="0" y="780" width="1024" height="244" fill="#08090D"/>
           <ellipse cx="450" cy="880" rx="300" ry="60" fill="#FF007F" opacity="0.3"/>
           <ellipse cx="210" cy="900" rx="180" ry="40" fill="#00F0FF" opacity="0.3"/>
           <text x="80" y="950" font-family="sans-serif" font-size="38" font-weight="900" fill="#00F0FF" letter-spacing="6">NEO TOKYO 2077</text>`
        : `<rect x="64" y="64" width="896" height="896" rx="20" fill="#242220"/>
           <circle cx="512" cy="450" r="260" fill="#C34A36" opacity="0.85"/>
           <path d="M64 680 Q256 520 512 680 T960 620 L960 960 L64 960 Z" fill="#2E5266"/>
           <text x="120" y="910" font-family="serif" font-size="36" font-weight="bold" fill="#E5C49F" letter-spacing="4">EASTERN ARTISAN VOGUE</text>`
    }
  </svg>`;

  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

// POST /api/ai/generate: Generate stylized image using configured image2 / OpenAI model
app.post("/api/ai/generate", async (req, res) => {
  const { prompt, styleId, styleName, sourceImage, aspectRatio, userId, customNotes, specifiedText } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ success: false, message: "缺少生图 Prompt 提示词" });
  }

  const config = readAiConfig();
  const taskId = "ai_task_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

  console.log(`[AI Gen] Starting generation: style=${styleId || "custom"}, prompt=${prompt.slice(0, 80)}...`);

  // Check if API Key is configured
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    return res.status(400).json({
      success: false,
      needsConfig: true,
      message: "平台尚未配置 AI 图像大模型 API Key，请管理员前往「系统管理 -> 全局 AI 图像大模型配置」进行部署。",
    });
  }

  try {
    const rawBaseUrl = config.baseUrl.replace(/\/+$/, "");
    const isV1 = rawBaseUrl.endsWith("/v1");
    const v1Base = isV1 ? rawBaseUrl : `${rawBaseUrl}/v1`;

    let finalImage = "";

    // If sourceImage is provided, use /v1/images/edits with multipart form data
    if (sourceImage && sourceImage.trim().length > 0) {
      console.log("[AI Gen] Source image detected, calling /v1/images/edits for image-to-image stylization...");
      
      let imageBlob = null;
      let imageFilename = "source.jpg";

      if (sourceImage.startsWith("data:")) {
        const matches = sourceImage.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          const ext = mimeType.includes("png") ? "png" : "jpg";
          imageBlob = new Blob([buffer], { type: mimeType });
          imageFilename = `source.${ext}`;
        }
      } else if (sourceImage.startsWith("/api/ai/history-assets/")) {
        const localFile = path.join(AI_HISTORY_ASSETS_DIR, path.basename(sourceImage));
        if (fs.existsSync(localFile)) {
          const ext = path.extname(localFile).toLowerCase();
          const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
          const buffer = fs.readFileSync(localFile);
          imageBlob = new Blob([buffer], { type: mimeType });
          imageFilename = `source${ext || ".jpg"}`;
        }
      } else if (sourceImage.startsWith("http://") || sourceImage.startsWith("https://")) {
        const imgRes = await fetch(sourceImage, { signal: AbortSignal.timeout(15000) });
        if (!imgRes.ok) throw new Error(`获取源图片失败 (HTTP ${imgRes.status})`);
        const arrayBuf = await imgRes.arrayBuffer();
        const contentType = imgRes.headers.get("content-type") || "image/jpeg";
        const ext = contentType.includes("png") ? "png" : "jpg";
        imageBlob = new Blob([arrayBuf], { type: contentType });
        imageFilename = `source.${ext}`;
      }

      if (!imageBlob) {
        throw new Error("无法解析源图片数据，请重新选择或上传照片");
      }

      const formData = new FormData();
      formData.append("model", config.model || "gpt-image-2");
      formData.append("prompt", prompt);
      formData.append("n", "1");
      formData.append("image", imageBlob, imageFilename);
      // 图生图同样按所选画幅比例传尺寸，保持与用户选择一致
      if (aspectRatio && ASPECT_RATIO_SIZES[aspectRatio]) {
        formData.append("size", ASPECT_RATIO_SIZES[aspectRatio]);
      } else if (config.size && config.size !== "auto") {
        formData.append("size", config.size);
      }

      const editsUrl = `${v1Base}/images/edits`;
      console.log(`[AI Gen] Requesting ${editsUrl} with model=${config.model || "gpt-image-2"}...`);

      const apiRes = await fetch(editsUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        body: formData,
        signal: AbortSignal.timeout(150000), // 150s timeout for AI generation
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        console.error("[AI Gen] /images/edits returned error:", apiRes.status, errText);
        throw new Error(`API 报错 (HTTP ${apiRes.status}): ${errText.slice(0, 200)}`);
      }

      const data = await apiRes.json();
      if (data.data && data.data[0]) {
        if (data.data[0].b64_json) {
          finalImage = `data:image/png;base64,${data.data[0].b64_json}`;
        } else if (data.data[0].url) {
          finalImage = data.data[0].url;
        }
      } else if (data.images && data.images[0]) {
        finalImage = data.images[0].url || data.images[0];
      }
    } else {
      // Text-to-Image generation
      console.log("[AI Gen] No source image, calling /v1/images/generations for text-to-image...");
      const genUrl = `${v1Base}/images/generations`;

      const requestPayload = {
        model: config.model || "gpt-image-2",
        prompt: prompt,
        n: 1,
        // 关键：按用户选择的画幅比例传具体尺寸，保证成片比例与所选画幅一致
        size: resolveImageSize(aspectRatio, config.size),
        response_format: "b64_json",
      };

      const apiRes = await fetch(genUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey.trim()}`,
        },
        body: JSON.stringify(requestPayload),
        signal: AbortSignal.timeout(150000), // 150s timeout
      });

      if (!apiRes.ok) {
        const errText = await apiRes.text();
        console.error("[AI Gen] /images/generations returned error:", apiRes.status, errText);
        throw new Error(`API 报错 (HTTP ${apiRes.status}): ${errText.slice(0, 200)}`);
      }

      const data = await apiRes.json();
      if (data.data && data.data[0]) {
        if (data.data[0].b64_json) {
          finalImage = `data:image/png;base64,${data.data[0].b64_json}`;
        } else if (data.data[0].url) {
          finalImage = data.data[0].url;
        }
      } else if (data.images && data.images[0]) {
        finalImage = data.images[0].url || data.images[0];
      }
    }

    if (!finalImage) {
      throw new Error("未从 AI 模型响应中解析到有效图片地址或 base64 数据");
    }

    // Ensure URL results are resolved to self-contained Base64 to prevent client CORS or LAN routing issues
    if (finalImage && (finalImage.startsWith("http://") || finalImage.startsWith("https://"))) {
      finalImage = await resolveImageAsBase64(finalImage);
    }

    const historyItem = {
      id: taskId,
      userId: userId || "default",
      styleId: styleId || "dreamy_motion_editorial",
      styleName: styleName || "s21 · 梦幻动态电影海报",
      sourceImage: sourceImage || undefined,
      prompt,
      customNotes,
      aspectRatio: aspectRatio || "auto",
      status: "success",
      resultUrl: finalImage,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    saveAiHistoryItem(userId || "default", historyItem);
    console.log("[AI Gen] Successfully generated and saved to history:", taskId);

    // 落盘为静态资源，返回短 URL：前端历史记录存 URL 即可，
    // 无需把数 MB 的 base64 塞进 localStorage（会触发配额溢出导致图片丢失）
    const persistedUrl = persistHistoryDataUri(finalImage, `${taskId}_res`);

    return res.json({
      success: true,
      message: "AI 艺术风格化生成成功！已加入您的作品素材库",
      image: finalImage,
      imageUrl: persistedUrl,
      thumbUrl: toThumbUrl(persistedUrl),
      task: toClientHistoryItem({ ...historyItem, resultUrl: persistedUrl }),
    });
  } catch (err) {
    console.error("[AI Gen] Upstream generation error:", err.message);
    // AI 自由创作（custom_creative）必须返回真实大模型结果：失败即如实报错，
    // 不再用占位插画/示例样片冒充成片，供前端展示失败态并允许重试。
    if (styleId === "custom_creative") {
      return res.status(502).json({
        success: false,
        message: `图像大模型生成失败：${err.message || "大模型服务无响应"}`,
      });
    }
    try {
      const fallbackImage = await generateFallbackStylizedArtwork(styleId, styleName, sourceImage, prompt, specifiedText, customNotes, aspectRatio || "3:4");
      if (fallbackImage) {
        console.log("[AI Gen] Generated high-fidelity vector stylized artwork fallback for style:", styleId);
        const historyItem = {
          id: taskId,
          userId: userId || "default",
          styleId: styleId || "fantasy_qiqiguaiguai",
          styleName: styleName || "FANTASY · 奇奇怪怪",
          sourceImage: sourceImage || undefined,
          prompt,
          customNotes,
          aspectRatio: aspectRatio || "3:4",
          status: "success",
          resultUrl: fallbackImage,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        };
        saveAiHistoryItem(userId || "default", historyItem);
        return res.json({
          success: true,
          message: "AI 风格化海报生成成功！已加入您的作品素材库",
          image: fallbackImage,
          thumbUrl: toThumbUrl(historyItem.resultUrl),
          task: toClientHistoryItem(historyItem),
        });
      }
    } catch (fbErr) {
      console.error("[AI Gen] Fallback generation also failed:", fbErr.message);
    }
    return res.status(500).json({
      success: false,
      message: `AI 生图调用失败: ${err.message || "大模型服务无响应"}`,
    });
  }
});

app.get("/api/ai/history", (req, res) => {
  let { userId } = req.query;
  // 当未传用户ID、或以访客/默认身份首次请求时，优先返回超级管理员历史记录，避免刷新首屏空白
  if (!userId || userId === "default" || userId === "undefined" || userId === "null" || userId === "guest_default") {
    const adminHistory = readAiHistory("user_admin");
    if (adminHistory && adminHistory.length > 0) {
      return res.json({ success: true, history: toClientHistory(adminHistory) });
    }
    userId = "default";
  }
  const history = readAiHistory(userId);
  res.json({ success: true, history: toClientHistory(history) });
});

// DELETE /api/ai/history/:id: Delete history item
app.delete("/api/ai/history/:id", (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;
  const updated = deleteAiHistoryItem(userId || "default", id);
  res.json({ success: true, history: updated });
});

// Static files serving for public assets and built frontend
app.use("/api/ai/history-assets", express.static(AI_HISTORY_ASSETS_DIR, { maxAge: "7d" }));
app.use("/api/user-media", express.static(USER_MEDIA_DIR, { maxAge: "7d" }));

// ============================================================
// 照片 EXIF 元数据解析 /api/media-exif
// ============================================================
function formatExposureTime(sec) {
  if (!sec || isNaN(sec)) return "";
  if (sec >= 1) {
    return Number.isInteger(sec) ? `${sec}s` : `${sec.toFixed(1)}s`;
  }
  const denominator = Math.round(1 / sec);
  return `1/${denominator}s`;
}

function formatGps(coords, ref) {
  if (!coords || coords.length < 3) return "";
  const deg = Math.floor(coords[0]);
  const min = Math.floor(coords[1]);
  const sec = Math.round(coords[2]);
  return `${deg}°${min}′${sec}″${ref}`;
}

function parseExifBuffer(buffer) {
  try {
    const view = new DataView(buffer);
    if (view.byteLength < 32) return null;
    if (view.getUint16(0, false) !== 0xFFD8) return null;

    let offset = 2;
    let tiffOffset = -1;

    while (offset < view.byteLength - 4) {
      const marker = view.getUint16(offset, false);
      offset += 2;
      if (marker === 0xFFE1) {
        const length = view.getUint16(offset, false);
        const id0 = view.getUint32(offset + 2, false);
        const id1 = view.getUint16(offset + 6, false);
        if (id0 === 0x45786966 && id1 === 0x0000) {
          tiffOffset = offset + 8;
          break;
        }
        offset += length;
      } else if ((marker & 0xFF00) === 0xFF00) {
        if (marker === 0xFFDA || marker === 0xFFD9) break;
        const length = view.getUint16(offset, false);
        offset += length;
      } else {
        break;
      }
    }

    if (tiffOffset < 0 || tiffOffset + 8 > view.byteLength) return null;

    const isLittle = view.getUint16(tiffOffset, false) === 0x4949;
    const ifd0Offset = view.getUint32(tiffOffset + 4, isLittle);
    const tags = {};
    const u8 = new Uint8Array(buffer);

    function readIFD(dirOffset) {
      if (tiffOffset + dirOffset + 2 > view.byteLength) return;
      const count = view.getUint16(tiffOffset + dirOffset, isLittle);
      for (let i = 0; i < count; i++) {
        const entryOffset = tiffOffset + dirOffset + 2 + i * 12;
        if (entryOffset + 12 > view.byteLength) break;
        const tag = view.getUint16(entryOffset, isLittle);
        const type = view.getUint16(entryOffset + 2, isLittle);
        const valCount = view.getUint32(entryOffset + 4, isLittle);
        const valOffset = view.getUint32(entryOffset + 8, isLittle);

        let val = null;
        if (type === 2) {
          const strOffset = valCount > 4 ? tiffOffset + valOffset : entryOffset + 8;
          if (strOffset < view.byteLength) {
            const end = Math.min(view.byteLength, strOffset + valCount);
            let s = "";
            for (let k = strOffset; k < end; k++) {
              if (u8[k] === 0) break;
              s += String.fromCharCode(u8[k]);
            }
            val = s.trim();
          }
        } else if (type === 3) {
          val = view.getUint16(entryOffset + 8, isLittle);
        } else if (type === 4) {
          val = valOffset;
        } else if (type === 5) {
          if (valCount === 1) {
            const num = view.getUint32(tiffOffset + valOffset, isLittle);
            const den = view.getUint32(tiffOffset + valOffset + 4, isLittle);
            val = den ? num / den : 0;
          } else if (valCount === 3) {
            const vals = [];
            for (let j = 0; j < 3; j++) {
              const num = view.getUint32(tiffOffset + valOffset + j * 8, isLittle);
              const den = view.getUint32(tiffOffset + valOffset + j * 8 + 4, isLittle);
              vals.push(den ? num / den : 0);
            }
            val = vals;
          }
        }
        tags[tag] = val;

        if (tag === 0x8769 || tag === 0x8825) {
          readIFD(valOffset);
        }
      }
    }

    readIFD(ifd0Offset);

    const make = (tags[0x010F] || "").trim();
    let model = (tags[0x0110] || "").trim();
    let deviceName = model;
    if (!deviceName && make) deviceName = make;
    if (make && deviceName && !deviceName.toLowerCase().includes(make.toLowerCase())) {
      deviceName = `${make} ${deviceName}`;
    }

    let rawDateTime = tags[0x9003] || tags[0x0132] || "";
    let formattedDateTime = "";
    if (rawDateTime) {
      const parts = rawDateTime.split(" ");
      if (parts.length === 2) {
        formattedDateTime = `${parts[0].replace(/:/g, ".")} ${parts[1]}`;
      } else {
        formattedDateTime = rawDateTime.replace(/:/g, ".");
      }
    }

    const focal35 = tags[0xA405] || (tags[0x920A] ? Math.round(tags[0x920A]) : null);
    const fNumber = tags[0x829D];
    const expTime = tags[0x829A];
    const iso = tags[0x8827] || tags[0x8833];

    const paramParts = [];
    if (focal35) paramParts.push(`${focal35}mm`);
    if (fNumber) paramParts.push(`f/${Number.isInteger(fNumber) ? fNumber : fNumber.toFixed(1)}`);
    if (expTime) paramParts.push(formatExposureTime(expTime));
    if (iso) paramParts.push(`ISO${iso}`);
    const params = paramParts.join(" ");

    let locationStr = "";
    const latRef = tags[0x0001] || "N";
    const lat = tags[0x0002];
    const lngRef = tags[0x0003] || "E";
    const lng = tags[0x0004];
    if (Array.isArray(lat) && Array.isArray(lng)) {
      locationStr = `${formatGps(lat, latRef)} ${formatGps(lng, lngRef)}`;
    }

    let style = "leica";
    const combinedBrand = `${make} ${model}`.toLowerCase();
    if (combinedBrand.includes("xiaomi") || combinedBrand.includes("leica")) {
      style = "leica";
    } else if (combinedBrand.includes("oppo") || combinedBrand.includes("oneplus") || combinedBrand.includes("hasselblad")) {
      style = "hasselblad";
    } else if (combinedBrand.includes("vivo") || combinedBrand.includes("zeiss") || combinedBrand.includes("sony")) {
      style = "zeiss";
    } else if (combinedBrand.includes("apple") || combinedBrand.includes("iphone")) {
      style = "iphone";
    } else if (combinedBrand.includes("fujifilm") || combinedBrand.includes("fuji")) {
      style = "fuji";
    }

    return {
      make,
      model,
      device: deviceName || "智能手机",
      dateTime: formattedDateTime,
      params,
      location: locationStr,
      watermarkStyle: style
    };
  } catch (err) {
    console.error("[EXIF] parse error:", err);
    return null;
  }
}

app.get("/api/media-exif", (req, res) => {
  const url = typeof req.query.url === "string" ? req.query.url : "";
  const abs = resolveLocalImagePath(url);
  if (!abs || !fs.existsSync(abs)) {
    return res.status(404).json({ error: "图片文件不存在" });
  }

  try {
    const fd = fs.openSync(abs, "r");
    const buf = Buffer.alloc(262144);
    const bytesRead = fs.readSync(fd, buf, 0, 262144, 0);
    fs.closeSync(fd);

    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + bytesRead);
    const parsed = parseExifBuffer(ab);
    if (!parsed) {
      return res.json({ success: false, message: "未检测到 EXIF 元数据" });
    }
    return res.json({ success: true, ...parsed });
  } catch (err) {
    console.error("[EXIF] read error:", err.message);
    return res.status(500).json({ error: "EXIF 读取失败: " + err.message });
  }
});

// GET /api/thumb?src=<站内图片地址>&w=<边长>: 按需生成并缓存缩略图
app.get("/api/thumb", async (req, res) => {
  const src = typeof req.query.src === "string" ? req.query.src : "";
  const rawW = parseInt(String(req.query.w || THUMB_MAX_EDGE), 10);
  const size = Number.isFinite(rawW) ? Math.min(Math.max(rawW, 64), 1600) : THUMB_MAX_EDGE;

  const abs = resolveLocalImagePath(src);
  if (!abs || !fs.existsSync(abs)) {
    return res.status(404).json({ success: false, message: "缩略图源文件不存在" });
  }

  const cacheName = thumbCacheName(abs, size);
  const cacheAbs = path.join(THUMB_CACHE_DIR, cacheName);

  res.setHeader("Cache-Control", "public, max-age=604800");
  res.setHeader("Content-Type", "image/webp");

  if (fs.existsSync(cacheAbs)) {
    return res.sendFile(cacheAbs);
  }

  try {
    const ok = await withThumbSlot(() => renderThumb(abs, cacheAbs, size));
    if (ok && fs.existsSync(cacheAbs)) {
      return res.sendFile(cacheAbs);
    }
  } catch (err) {
    console.error("[Thumb] render failed:", err.message);
  }

  // 缩略图生成失败：退回原图，功能不中断
  return res.sendFile(abs);
});

// ============================================================
// 相纸冲印导出 /api/print/export
// 浏览器 canvas 直接 toDataURL('image/jpeg') 出来的文件没有 JFIF 密度标记、
// 通常还内嵌一段 ICC 色彩描述文件，米家 App 的相册选择器会判定「不支持的格式」。
// 这里把整页图交给 ImageMagick 重编码成标准冲印 JPEG：
// 8 位 / sRGB / 无 ICC、EXIF / 基线非渐进 / 写入 300 DPI 密度。
// ============================================================
const PRINT_EXPORT_DIR = path.join(DATA_DIR, "print_exports");
if (!fs.existsSync(PRINT_EXPORT_DIR)) {
  fs.mkdirSync(PRINT_EXPORT_DIR, { recursive: true });
}
app.use("/api/print-exports", express.static(PRINT_EXPORT_DIR, { maxAge: "1h" }));

app.post("/api/print/export", async (req, res) => {
  try {
    const body = req.body || {};
    const image = typeof body.image === "string" ? body.image : "";
    const dpiRaw = parseInt(String(body.dpi || 300), 10);
    const dpi = Number.isFinite(dpiRaw) ? Math.min(Math.max(dpiRaw, 150), 900) : 300;
    const qualityRaw = parseInt(String(body.quality || 92), 10);
    const quality = Number.isFinite(qualityRaw) ? Math.min(Math.max(qualityRaw, 60), 100) : 92;

    const match = image.match(/^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=\s]+)$/);
    if (!match) {
      return res.status(400).json({ success: false, message: "缺少可导出的整页图像数据" });
    }
    const buf = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
    if (!buf.length || buf.length > 80 * 1024 * 1024) {
      return res.status(400).json({ success: false, message: "图像数据为空或过大" });
    }

    const rawUser = typeof body.userId === "string" ? body.userId : "default";
    const safeUser = rawUser.replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 48) || "default";
    const userDir = path.join(PRINT_EXPORT_DIR, safeUser);
    fs.mkdirSync(userDir, { recursive: true });

    const stamp = `${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
    const inAbs = path.join(userDir, `.in_${stamp}.png`);
    const outName = `print_${stamp}.jpg`;
    const outAbs = path.join(userDir, outName);
    fs.writeFileSync(inAbs, buf);

    const ok = await withThumbSlot(() =>
      runConvert(
        [
          `${inAbs}[0]`,
          "-auto-orient",
          "-background",
          "white",
          "-flatten",
          "-colorspace",
          "sRGB",
          "-depth",
          "8",
          "-units",
          "PixelsPerInch",
          "-density",
          String(dpi),
          "-strip",
          "-interlace",
          "none",
          "-sampling-factor",
          "4:2:0",
          "-quality",
          String(quality),
          outAbs,
        ],
        45000
      )
    );

    try {
      fs.unlinkSync(inAbs);
    } catch (e) {}

    if (!ok || !fs.existsSync(outAbs)) {
      return res.status(500).json({ success: false, message: "冲印 JPEG 编码失败" });
    }

    const stat = fs.statSync(outAbs);
    const dims = await runIdentify(["-format", "%w %h", outAbs]);
    const [w, h] = dims.split(/\s+/).map((n) => parseInt(n, 10));

    res.json({
      success: true,
      url: `/api/print-exports/${encodeURIComponent(safeUser)}/${outName}`,
      bytes: stat.size,
      width: Number.isFinite(w) ? w : null,
      height: Number.isFinite(h) ? h : null,
      dpi,
    });
  } catch (err) {
    console.error("[PrintExport] failed:", err);
    res.status(500).json({ success: false, message: "冲印导出失败" });
  }
});

const PUBLIC_DIR = path.join(__dirname, "public");
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR, {
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      if (filePath.includes("/covers/") || filePath.includes("/retouch-thumbs/")) {
        res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
      }
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, must-revalidate");
      }
    },
  }));
}

const DIST_DIR = path.join(__dirname, "dist");
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, {
    maxAge: "1d",
    setHeaders: (res, filePath) => {
      if (filePath.includes("/covers/") || filePath.includes("/retouch-thumbs/")) {
        res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
      }
      // Never cache the HTML shell, so a new build is picked up immediately.
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, must-revalidate");
      }
    },
  }));
  app.use((req, res) => {
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
}

const server = app.listen(PORT, HOST, () => {
  console.log(`=============================================`);
  console.log(`  MarginLab 留白集 · Collage Server & Cloud Persistence`);
  console.log(`  Running on http://[${HOST}]:${PORT} (Dual-Stack IPv4/IPv6)`);
  console.log(`=============================================`);
});

server.on("error", (err) => {
  if (err.code === "EADDRNOTAVAIL" && HOST === "::") {
    console.warn("IPv6 not available, falling back to 0.0.0.0");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`  Running fallback on http://0.0.0.0:${PORT}`);
    });
    return;
  }
  // 端口被占用 / 监听失败时直接退出，交给 systemd 的 Restart=always 重新拉起，
  // 避免出现「进程还活着但 3001 没人监听」的僵尸状态。
  console.error("[FATAL] Server listen failed:", err);
  process.exit(1);
});

// 监听句柄意外关闭时也退出，让守护进程重建，而不是静默失联。
server.on("close", () => {
  console.warn("[FATAL] HTTP server closed, exiting for supervisor restart");
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  console.error("[FATAL] uncaughtException:", err);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error("[FATAL] unhandledRejection:", err);
  process.exit(1);
});
