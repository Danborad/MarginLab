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
const SYSTEM_CONFIG_FILE = path.join(DATA_DIR, "system_config.json");
const POINTS_LOG_DIR = path.join(DATA_DIR, "points_log");

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
if (!fs.existsSync(POINTS_LOG_DIR)) {
  fs.mkdirSync(POINTS_LOG_DIR, { recursive: true });
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

/** 站内 public/ 下的静态资源（封面、修图缩略图、画册样张） */
function resolvePublicAssetPath(publicUrl) {
  if (typeof publicUrl !== "string") return null;
  let p = publicUrl.split("?")[0];
  try { p = decodeURIComponent(p); } catch (e) {}
  const m = p.match(/^\/(covers|retouch-thumbs|album_samples|creative-samples)\/([\w.\-]+(?:\/[\w.\-]+)*)$/);
  if (!m) return null;
  const abs = path.join(__dirname, "public", m[1], m[2]);
  const root = path.join(__dirname, "public") + path.sep;
  if (!abs.startsWith(root)) return null;
  return fs.existsSync(abs) ? abs : null;
}

/** 读本地图片为 Buffer；SVG 走 ImageMagick 转 PNG（上游只接受位图） */
async function readLocalImageAsBuffer(absPath) {
  try {
    const ext = path.extname(absPath).toLowerCase();
    if (ext === ".svg") {
      ensureRenderTmpDir();
      const png = path.join(RENDER_TMP_DIR, `svg2png_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`);
      const ok = await runConvert(["-background", "white", "-density", "144", absPath, "-flatten", png], 30000);
      if (ok && fs.existsSync(png)) {
        const buf = fs.readFileSync(png);
        safeUnlink(png);
        return { buffer: buf, mime: "image/png", ext: ".png" };
      }
      return null;
    }
    const mime =
      ext === ".png" ? "image/png"
      : ext === ".webp" ? "image/webp"
      : ext === ".gif" ? "image/gif"
      : "image/jpeg";
    return { buffer: fs.readFileSync(absPath), mime, ext: ext || ".jpg" };
  } catch (e) {
    console.warn("[readLocalImageAsBuffer] failed:", e.message);
    return null;
  }
}

/**
 * 把前端传来的 sourceImage 统一解析成 Buffer。
 * 支持：data URI、/api/thumb?...&src=...、/api/user-media/...、
 *       /api/ai/history-assets/...、public 静态资源、外链 URL、本站绝对地址。
 */
async function resolveSourceImageBuffer(sourceImage) {
  if (!sourceImage || typeof sourceImage !== "string") return null;
  const src = sourceImage.trim();
  if (!src) return null;

  // 1) data URI
  if (src.startsWith("data:")) {
    const m = src.match(/^data:([^;]+);base64,([\s\S]+)$/);
    if (!m) return null;
    return { buffer: Buffer.from(m[2], "base64"), mime: m[1], ext: ".png" };
  }

  // 2) 缩略图接口：递归取内部 src
  if (src.startsWith("/api/thumb")) {
    try {
      const u = new URL(src, "http://localhost");
      const inner = u.searchParams.get("src");
      if (inner) return await resolveSourceImageBuffer(inner);
    } catch (e) {}
    return null;
  }

  // 3) 绝对地址：先尝试当成本站资源直接读盘，读不到再走网络
  if (/^https?:\/\//i.test(src)) {
    try {
      const u = new URL(src);
      const localFromAbs =
        resolveLocalImagePath(u.pathname) || resolvePublicAssetPath(u.pathname);
      if (localFromAbs && fs.existsSync(localFromAbs)) {
        return await readLocalImageAsBuffer(localFromAbs);
      }
      const res = await fetch(src, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) return null;
      const buf = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get("content-type") || "image/jpeg";
      return { buffer: buf, mime: ct.split(";")[0], ext: ".jpg" };
    } catch (e) {
      console.warn("[resolveSourceImageBuffer] remote fetch failed:", e.message);
      return null;
    }
  }

  // 4) 站内相对地址 → 直接读盘
  const localPath = resolveLocalImagePath(src) || resolvePublicAssetPath(src);
  if (localPath && fs.existsSync(localPath)) {
    return await readLocalImageAsBuffer(localPath);
  }

  // 5) 兜底：走本机 HTTP 取一次
  if (src.startsWith("/")) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}${src}`, { signal: AbortSignal.timeout(20000) });
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        const ct = res.headers.get("content-type") || "image/jpeg";
        return { buffer: buf, mime: ct.split(";")[0], ext: ".jpg" };
      }
    } catch (e) {
      console.warn("[resolveSourceImageBuffer] self fetch failed:", e.message);
    }
  }
  return null;
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

// ===========================================================================
// 积分算力 & 云存储空间体系（2026-10 重构）
// ---------------------------------------------------------------------------
// 规则：
//   · 新用户注册赠送 registerPoints（默认 50）积分 + defaultStorageGB（默认 5GB）空间
//   · 每日签到赠送 checkInPoints（默认 10），按自然日去重
//   · 每生成 1 张图消耗 costPerImage（默认 1）积分；预扣 → 成功确认 / 失败原路退还
//   · 存储 = 用户上传素材 + AI 生成结果；达到 100% 拦截上传与生成，90% 黄色预警
// ===========================================================================
const DEFAULT_SYSTEM_CONFIG = {
  registerPoints: 50,
  checkInPoints: 10,
  costPerImage: 1,
  defaultStorageGB: 5,
  siteName: "留白集 MarginLab",
  logoUrl: "",
  termsHtml: "",
  privacyHtml: "",
};

function readSystemConfig() {
  try {
    if (fs.existsSync(SYSTEM_CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(SYSTEM_CONFIG_FILE, "utf-8"));
      return { ...DEFAULT_SYSTEM_CONFIG, ...data };
    }
  } catch (err) {
    console.error("[SystemConfig] Read failed:", err.message);
  }
  return { ...DEFAULT_SYSTEM_CONFIG };
}

function writeSystemConfig(patch) {
  const current = readSystemConfig();
  const updated = { ...current, ...patch, updatedAt: new Date().toISOString() };
  const tmpFile = SYSTEM_CONFIG_FILE + ".tmp";
  fs.writeFileSync(tmpFile, JSON.stringify(updated, null, 2), "utf-8");
  fs.renameSync(tmpFile, SYSTEM_CONFIG_FILE);
  return updated;
}

const GB = 1024 * 1024 * 1024;

/** 积分流水（每个用户一个 JSON 文件，最多保留 300 条） */
function readPointsLog(userId) {
  try {
    const f = path.join(POINTS_LOG_DIR, `${userId}.json`);
    if (fs.existsSync(f)) {
      const arr = JSON.parse(fs.readFileSync(f, "utf-8"));
      return Array.isArray(arr) ? arr : [];
    }
  } catch (err) {
    console.error("[PointsLog] read failed:", err.message);
  }
  return [];
}

function appendPointsLog(userId, entry) {
  try {
    const list = readPointsLog(userId);
    list.unshift(entry);
    const trimmed = list.slice(0, 300);
    const f = path.join(POINTS_LOG_DIR, `${userId}.json`);
    const tmp = f + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(trimmed, null, 2), "utf-8");
    fs.renameSync(tmp, f);
    return trimmed;
  } catch (err) {
    console.error("[PointsLog] write failed:", err.message);
    return [];
  }
}

/** 补全用户资产字段（老账号首次访问时自动初始化，幂等） */
function ensureUserAssets(user) {
  if (!user) return user;
  const cfg = readSystemConfig();
  let changed = false;
  if (typeof user.points !== "number" || !Number.isFinite(user.points)) {
    user.points = cfg.registerPoints;
    changed = true;
  }
  if (typeof user.storageQuota !== "number" || user.storageQuota <= 0) {
    user.storageQuota = Math.round(cfg.defaultStorageGB * GB);
    changed = true;
  }
  if (typeof user.lastCheckInDate !== "string") {
    user.lastCheckInDate = "";
    changed = true;
  }
  return changed ? user : user;
}

/** 保存单个用户（按 id 定位后整体写回） */
function updateUserRecord(userId, mutate) {
  const users = readUsers();
  const idx = users.findIndex((u) => u && u.id === userId);
  if (idx === -1) return null;
  const user = ensureUserAssets({ ...users[idx] });
  mutate(user);
  users[idx] = user;
  writeUsers(users);
  return user;
}

function findUser(userId) {
  if (!userId) return null;
  const users = readUsers();
  return users.find((u) => u && (u.id === userId || u.username === userId)) || null;
}

function todayKey() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** 目录占用（字节） */
function dirSizeInBytes(dir) {
  let total = 0;
  try {
    if (!fs.existsSync(dir)) return 0;
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      let st;
      try {
        st = fs.statSync(p);
      } catch (e) {
        continue;
      }
      if (st.isDirectory()) total += dirSizeInBytes(p);
      else total += st.size;
    }
  } catch (err) {
    console.error("[dirSize] failed:", err.message);
  }
  return total;
}

/** 用户云存储已用量：上传素材目录 + 该用户 AI 历史结果文件 */
function getUserStorageUsed(userId) {
  const mediaBytes = dirSizeInBytes(path.join(USER_MEDIA_DIR, userId));
  let aiBytes = 0;
  try {
    const history = readAiHistory(userId);
    const ids = new Set();
    for (const item of history) {
      if (item && item.id) ids.add(String(item.id));
    }
    if (ids.size > 0 && fs.existsSync(AI_HISTORY_ASSETS_DIR)) {
      for (const name of fs.readdirSync(AI_HISTORY_ASSETS_DIR)) {
        const base = name.split("_").slice(0, -1).join("_");
        // 文件名形如 ai_task_xxx_res.png / ai_task_xxx_src.jpg
        const prefix = name.replace(/_(res|src)\.[A-Za-z0-9]+$/, "");
        if (ids.has(prefix) || ids.has(base)) {
          try {
            aiBytes += fs.statSync(path.join(AI_HISTORY_ASSETS_DIR, name)).size;
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.error("[storage] ai assets scan failed:", err.message);
  }
  return mediaBytes + aiBytes;
}

/** 统一的资产视图（给前端 / 后台） */
function buildAssetView(user) {
  if (!user) return null;
  ensureUserAssets(user);
  const used = getUserStorageUsed(user.id);
  const quota = user.storageQuota || 0;
  return {
    points: user.points,
    storageQuota: quota,
    storageUsed: used,
    storagePercent: quota > 0 ? Math.min(100, Math.round((used / quota) * 1000) / 10) : 0,
    lastCheckInDate: user.lastCheckInDate || "",
    checkedInToday: (user.lastCheckInDate || "") === todayKey(),
  };
}

/** 扣分（返回新余额，失败返回 null） */
function spendPoints(userId, amount, reason) {
  let result = null;
  updateUserRecord(userId, (u) => {
    if (u.points < amount) return;
    u.points -= amount;
    result = u.points;
    appendPointsLog(userId, {
      ts: new Date().toISOString(),
      delta: -amount,
      reason,
      balance: u.points,
    });
  });
  return result;
}

/** 退分 */
function refundPoints(userId, amount, reason) {
  let result = null;
  updateUserRecord(userId, (u) => {
    u.points += amount;
    result = u.points;
    appendPointsLog(userId, {
      ts: new Date().toISOString(),
      delta: amount,
      reason,
      balance: u.points,
    });
  });
  return result;
}


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
  const sysCfg = readSystemConfig();
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
    themeColor: "#22C55E",
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    // 资产初始化：注册奖励积分 + 默认云存储配额
    points: Number(sysCfg.registerPoints) || 0,
    storageQuota: Math.round((Number(sysCfg.defaultStorageGB) || 5) * 1024 * 1024 * 1024),
    lastCheckInDate: "",
  };

  users.push(newUser);
  writeUsers(users);

  if (newUser.points > 0) {
    appendPointsLog(newUserId, {
      ts: new Date().toISOString(),
      delta: newUser.points,
      reason: "新用户注册奖励",
      balance: newUser.points,
    });
  }

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
    message: `恭喜！已成功注册账号「${newUser.name}」，赠送 ${newUser.points} 算力积分与 ${sysCfg.defaultStorageGB}GB 云图库`,
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
  ensureUserAssets(user);
  users[userIndex] = user;
  writeUsers(users);

  console.log(`[API] User logged in: ${user.username} (${user.id})`);
  res.json({
    success: true,
    message: `欢迎回来，${user.name}！`,
    user,
    assets: buildAssetView(user),
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

// ===========================================================================
// 积分 / 签到 / 云存储 用户侧接口
// ===========================================================================
app.get("/api/user/:userId/assets", (req, res) => {
  const user = findUser(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: "用户不存在" });
  ensureUserAssets(user);
  res.json({ success: true, assets: buildAssetView(user) });
});

app.get("/api/user/:userId/points/log", (req, res) => {
  const user = findUser(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: "用户不存在" });
  res.json({ success: true, log: readPointsLog(user.id), points: ensureUserAssets(user).points });
});

app.post("/api/user/:userId/check-in", (req, res) => {
  const user = findUser(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: "用户不存在" });

  const cfg = readSystemConfig();
  const today = todayKey();
  let awarded = 0;
  let balance = 0;
  let already = false;

  const updated = updateUserRecord(user.id, (u) => {
    if ((u.lastCheckInDate || "") === today) {
      already = true;
      balance = u.points;
      return;
    }
    awarded = Number(cfg.checkInPoints) || 0;
    u.points += awarded;
    u.lastCheckInDate = today;
    balance = u.points;
  });

  if (!updated) return res.status(500).json({ success: false, message: "签到失败，请稍后重试" });
  if (already) {
    return res.json({
      success: true,
      already: true,
      message: "今天已经签到过啦，明天再来",
      points: balance,
      assets: buildAssetView(updated),
    });
  }

  appendPointsLog(user.id, {
    ts: new Date().toISOString(),
    delta: awarded,
    reason: "每日签到",
    balance,
  });

  res.json({
    success: true,
    already: false,
    message: `签到成功，算力积分 +${awarded}`,
    points: balance,
    assets: buildAssetView(updated),
  });
});

// 用户中心：上传自定义头像（写入 user_media/<uid>/，返回短 URL）
app.post("/api/user/:userId/avatar", (req, res) => {
  const user = findUser(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: "用户不存在" });
  const { dataUrl } = req.body || {};
  const persisted = persistDataUriToFile(dataUrl, path.join(USER_MEDIA_DIR, user.id), `avatar_${Date.now()}`);
  if (!persisted) return res.status(400).json({ success: false, message: "头像数据无效" });
  const url = `/api/user-media/${user.id}/${persisted}`;
  const updated = updateUserRecord(user.id, (u) => {
    u.avatar = url;
  });
  res.json({ success: true, avatar: url, user: updated });
});

// ===========================================================================
// 管理后台专用接口
// ===========================================================================
app.get("/api/admin/overview", requireAdmin, (req, res) => {
  const users = readUsers().map((u) => ensureUserAssets({ ...u }));
  const today = todayKey();
  let totalStorageUsed = 0;
  let totalStorageQuota = 0;
  let totalPoints = 0;
  let checkInToday = 0;
  for (const u of users) {
    totalStorageQuota += u.storageQuota || 0;
    totalPoints += u.points || 0;
    if ((u.lastCheckInDate || "") === today) checkInToday += 1;
    try {
      totalStorageUsed += getUserStorageUsed(u.id);
    } catch (e) {}
  }
  const historyCount = users.reduce((sum, u) => {
    try {
      return sum + readAiHistory(u.id).length;
    } catch (e) {
      return sum;
    }
  }, 0);

  res.json({
    success: true,
    overview: {
      totalUsers: users.length,
      activeUsers: users.filter((u) => (u.status || "active") === "active").length,
      adminUsers: users.filter((u) => u.isAdmin).length,
      checkInToday,
      totalAiImages: historyCount,
      totalPoints,
      totalStorageUsed,
      totalStorageQuota,
      today,
    },
  });
});

app.post("/api/admin/user/:userId/points", requireAdmin, (req, res) => {
  const target = findUser(req.params.userId);
  if (!target) return res.status(404).json({ success: false, message: "用户不存在" });
  const delta = Number(req.body?.delta);
  const note = String(req.body?.note || "").slice(0, 120);
  if (!Number.isFinite(delta) || delta === 0) {
    return res.status(400).json({ success: false, message: "请输入非零积分变动值" });
  }
  let balance = 0;
  let blocked = false;
  const updated = updateUserRecord(target.id, (u) => {
    if (u.points + delta < 0) {
      blocked = true;
      balance = u.points;
      return;
    }
    u.points += delta;
    balance = u.points;
  });
  if (blocked) {
    return res.status(400).json({ success: false, message: `扣减后积分为负（当前 ${balance}），请调整数值` });
  }
  appendPointsLog(target.id, {
    ts: new Date().toISOString(),
    delta,
    reason: note ? `管理员调整：${note}` : "管理员调整",
    balance,
    operator: req.headers["x-user-id"] || "",
  });
  res.json({ success: true, points: balance, user: updated, assets: buildAssetView(updated) });
});

app.post("/api/admin/user/:userId/quota", requireAdmin, (req, res) => {
  const target = findUser(req.params.userId);
  if (!target) return res.status(404).json({ success: false, message: "用户不存在" });
  const gb = Number(req.body?.storageGB);
  if (!Number.isFinite(gb) || gb < 0.1) {
    return res.status(400).json({ success: false, message: "存储上限至少 0.1 GB" });
  }
  const updated = updateUserRecord(target.id, (u) => {
    u.storageQuota = Math.round(gb * GB);
  });
  res.json({ success: true, user: updated, assets: buildAssetView(updated) });
});

app.get("/api/admin/system/config", requireAdmin, (req, res) => {
  res.json({ success: true, config: readSystemConfig() });
});

app.post("/api/admin/system/config", requireAdmin, (req, res) => {
  const patch = req.body?.config || {};
  const clean = {};
  for (const key of ["registerPoints", "checkInPoints", "costPerImage", "defaultStorageGB"]) {
    if (patch[key] !== undefined) {
      const n = Number(patch[key]);
      if (Number.isFinite(n) && n >= 0) clean[key] = n;
    }
  }
  for (const key of ["siteName", "logoUrl", "termsHtml", "privacyHtml"]) {
    if (typeof patch[key] === "string") clean[key] = patch[key];
  }
  const config = writeSystemConfig(clean);
  res.json({ success: true, config });
});

// 公开读取：登录页/页脚需要的站点信息（不含敏感项）
app.get("/api/system/public", (req, res) => {
  const cfg = readSystemConfig();
  res.json({
    success: true,
    config: {
      registerPoints: cfg.registerPoints,
      checkInPoints: cfg.checkInPoints,
      costPerImage: cfg.costPerImage,
      defaultStorageGB: cfg.defaultStorageGB,
      siteName: cfg.siteName,
      logoUrl: cfg.logoUrl,
      termsHtml: cfg.termsHtml,
      privacyHtml: cfg.privacyHtml,
    },
  });
});

// Get user data (doc, projects, templates, media)
app.get("/api/user/:userId/data", (req, res) => {
  const { userId } = req.params;
  // 首次读取时顺手把历史遗留的 base64 素材搬成文件，之后 JSON 就只有几十 KB
  const data = migrateUserMediaIfNeeded(userId, readUserData(userId));
  const user = findUser(userId);
  res.json({ success: true, data, assets: user ? buildAssetView(user) : null });
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

  // ── 云存储配额前置校验（2026-10 重构）──────────────────────────────────
  const owner = findUser(userId);
  if (owner) {
    ensureUserAssets(owner);
    const view = buildAssetView(owner);
    const incomingBytes = incoming.reduce((sum, a) => {
      if (!a || typeof a !== "object") return sum;
      if (typeof a.src === "string" && a.src.startsWith("data:")) {
        // base64 体积 ≈ 字符数 * 0.75
        return sum + Math.round(a.src.length * 0.75);
      }
      return sum;
    }, 0);
    if (view.storageUsed + incomingBytes > view.storageQuota) {
      return res.status(409).json({
        success: false,
        code: "STORAGE_FULL",
        message: "云端存储空间已满，请前往【图库/历史记录】清理旧图，或联系管理员扩容",
        assets: view,
      });
    }
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
  const users = readUsers().map((u) => ensureUserAssets({ ...u }));
  const enrichedUsers = users.map((u) => {
    const data = readUserData(u.id);
    const aiHist = readAiHistory(u.id);
    const used = getUserStorageUsed(u.id);
    return {
      ...u,
      savedProjectsCount: Array.isArray(data.savedProjects) ? data.savedProjects.length : 0,
      mediaAssetsCount: Array.isArray(data.mediaAssets) ? data.mediaAssets.length : 0,
      aiHistoryCount: aiHist.length,
      storageUsed: used,
      storagePercent: u.storageQuota > 0 ? Math.min(100, Math.round((used / u.storageQuota) * 1000) / 10) : 0,
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
  const resolved = await resolveSourceImageBuffer(imgUrl);
  if (resolved && resolved.buffer && resolved.buffer.length > 0) {
    return `data:${resolved.mime || "image/jpeg"};base64,${resolved.buffer.toString("base64")}`;
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


// ---------------------------------------------------------------------------
// 基于「用户上传照片本身」的本地兜底渲染
// AI 上游超时/失败时，绝不再返回与照片无关的预制占位插画；
// 这里用 ImageMagick 直接对用户这张照片做真实的风格化处理，
// 保证任何兜底结果都与上传图强相关。
// ---------------------------------------------------------------------------
const RENDER_TMP_DIR = path.join(DATA_DIR, "render_tmp");

const PHOTO_FALLBACK_SIZES = {
  "3:4": [900, 1200],
  "9:16": [810, 1440],
  "4:3": [1200, 900],
  "16:9": [1280, 720],
  "1:1": [1024, 1024],
};

function ensureRenderTmpDir() {
  try {
    if (!fs.existsSync(RENDER_TMP_DIR)) fs.mkdirSync(RENDER_TMP_DIR, { recursive: true });
  } catch (e) {
    console.warn("[RenderTmp] mkdir failed:", e.message);
  }
}

/** 把 data URI 写进临时文件，返回绝对路径；失败返回空字符串 */
function writeDataUriToTempFile(dataUri, prefix) {
  try {
    const m = typeof dataUri === "string" && dataUri.match(/^data:image\/([a-z0-9.+-]+);base64,([\s\S]+)$/i);
    if (!m) return "";
    const ext = m[1].includes("png") ? "png" : m[1].includes("webp") ? "webp" : "jpg";
    ensureRenderTmpDir();
    const file = path.join(
      RENDER_TMP_DIR,
      `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
    );
    fs.writeFileSync(file, Buffer.from(m[2], "base64"));
    return file;
  } catch (e) {
    console.warn("[RenderTmp] write failed:", e.message);
    return "";
  }
}

function safeUnlink(file) {
  if (!file) return;
  try { fs.unlinkSync(file); } catch (e) {}
}

/**
 * 用 ImageMagick 对上传照片做真实风格化，返回 data:image/jpeg;base64
 * 无法处理时返回空字符串。
 */
async function renderPhotoDerivedFallback({ styleId = "", styleName = "", sourceImage = "", aspectRatio = "3:4" }) {
  const resolved = await resolveImageAsBase64(sourceImage);
  const src = writeDataUriToTempFile(resolved, "fb_src");
  if (!src) return "";
  const [W, H] = PHOTO_FALLBACK_SIZES[aspectRatio] || PHOTO_FALLBACK_SIZES["3:4"];
  const out = path.join(RENDER_TMP_DIR, `fb_out_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`);
  const id = String(styleId || "");
  const name = String(styleName || "");

  const isRiso =
    id === "retro_print_illustration" ||
    name.includes("Riso") ||
    name.includes("复古实验平面插画");
  const isPostcard =
    id === "travel_postcard_collage" ||
    name.includes("旅行明信片") ||
    name.includes("旅行手账");
  const isOutOfFrame =
    id === "out_of_frame_3d" ||
    name.includes("破框");
  const isMono =
    id === "street_photo_black_ink" || name.includes("黑白");

  const m = 40; // 纸张留白边距
  let args = [];

  if (isRiso) {
    // Riso 孔版：灰阶限色 → 深墨/米纸双色 → 细颗粒 → 纸张留白 + 版式
    args = [
      "-size", `${W}x${H}`, "xc:#F2EBD9",
      "(", src, "-auto-orient",
        "-resize", `${W - m * 2}x${H - m * 2 - 72}^`, "-gravity", "center", "-extent", `${W - m * 2}x${H - m * 2 - 72}`,
        "-colorspace", "gray", "-level", "7%,93%", "-contrast-stretch", "0.5%x0.5%", "-posterize", "4",
        "+level-colors", "#1B1F2A,#F7F1E0",
        "-attenuate", "0.08", "+noise", "Gaussian",
        "-fill", "#D9633B", "-colorize", "12%",
      ")",
      "-gravity", "north", "-geometry", `+0+${m}`, "-composite",
      "-gravity", "south", "-fill", "#1B1F2A", "-pointsize", "24",
      "-font", "Helvetica-Bold", "-annotate", "+0+30", "RISOGRAPH  EDITION  /  MARGINLAB",
      out
    ];
  } else if (isPostcard) {
    // 旅行明信片：上半真实摄影，下半绘画化同源画面
    const halfH = Math.round(H / 2);
    args = [
      "(", src, "-auto-orient", "-resize", `${W}x${halfH}^`, "-gravity", "center", "-extent", `${W}x${halfH}`, ")",
      "(",
        src, "-auto-orient", "-resize", `${W}x${halfH}^`, "-gravity", "center", "-extent", `${W}x${halfH}`,
        "-paint", "3", "-blur", "0x1.2", "-level", "5%,95%", "-modulate", "104,112,100",
        "-fill", "#F3EAD8", "-colorize", "22%",
      ")",
      "-append",
      out
    ];
  } else if (isOutOfFrame) {
    // 破框而出：深色底 + 同一张照片的虚化光晕 + 白色画框
    args = [
      "-size", `${W}x${H}`, "xc:#0F1317",
      "(", src, "-auto-orient", "-resize", `${W}x${H}^`, "-gravity", "center", "-extent", `${W}x${H}`,
        "-blur", "0x22", "-modulate", "78,72,100", ")",
      "-gravity", "center", "-composite",
      "(", src, "-auto-orient", "-resize", `${Math.round(W * 0.62)}x${Math.round(H * 0.7)}^`,
        "-gravity", "center", "-extent", `${Math.round(W * 0.62)}x${Math.round(H * 0.7)}`,
        "-bordercolor", "white", "-border", "14", ")",
      "-gravity", "center", "-geometry", "+0+30", "-composite",
      out
    ];
  } else {
    // 通用：只做影调/色彩重塑，保留原始内容与构图
    args = [
      src, "-auto-orient", "-resize", `${W}x${H}^`, "-gravity", "center", "-extent", `${W}x${H}`,
      "-modulate", "101,110,100", "-level", "3%,97%",
      "-unsharp", "0x0.7+0.6+0.01",
      ...(isMono ? ["-colorspace", "gray"] : []),
      out
    ];
  }

  try {
    const ok = await runConvert(args, 60000);
    if (!ok || !fs.existsSync(out)) return "";
    const stat = fs.statSync(out);
    if (!stat.size) return "";
    const buf = fs.readFileSync(out);
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch (e) {
    console.warn("[PhotoFallback] render failed:", e.message);
    return "";
  } finally {
    safeUnlink(src);
    safeUnlink(out);
  }
}

// POST /api/ai/generate: Generate stylized image using configured image2 / OpenAI model
app.post("/api/ai/generate", async (req, res) => {
  const { prompt, styleId, styleName, sourceImage, aspectRatio, userId, customNotes, specifiedText } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ success: false, message: "缺少生图 Prompt 提示词" });
  }

  // ── 积分与云存储前置校验（2026-10 重构）────────────────────────────────
  // 规则：预扣费 → 成功确认 / 失败原路退还；存储满额拦截生成。
  const sysCfg = readSystemConfig();
  const cost = Math.max(0, Number(sysCfg.costPerImage) || 0);
  const billingUser = userId && userId !== "default" ? findUser(userId) : null;
  let chargedPoints = 0;

  if (billingUser) {
    ensureUserAssets(billingUser);
    if (billingUser.status === "banned") {
      return res.status(403).json({ success: false, message: "账号已被封禁，无法发起生成任务" });
    }
    const assetView = buildAssetView(billingUser);
    if (assetView.storagePercent >= 100) {
      return res.status(409).json({
        success: false,
        code: "STORAGE_FULL",
        message: "云端存储空间已满，请前往【图库/生成历史】清理旧图，或联系管理员扩容",
      });
    }
    if (cost > 0) {
      if (billingUser.points < cost) {
        return res.status(402).json({
          success: false,
          code: "POINTS_INSUFFICIENT",
          message: "积分不足，请明日签到或联系管理员获取",
          points: billingUser.points,
        });
      }
      const remaining = spendPoints(billingUser.id, cost, `AI 生图（${styleName || styleId || "风格化"}）`);
      if (remaining === null) {
        return res.status(402).json({
          success: false,
          code: "POINTS_INSUFFICIENT",
          message: "积分不足，请明日签到或联系管理员获取",
        });
      }
      chargedPoints = cost;
      console.log(`[AI Gen] Points pre-charged: -${cost} (balance ${remaining}) for ${billingUser.id}`);
    }
  }

  const config = readAiConfig();
  const taskId = "ai_task_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

  console.log(`[AI Gen] Starting generation: style=${styleId || "custom"}, prompt=${prompt.slice(0, 80)}...`);

  // Check if API Key is configured
  if (!config.apiKey || config.apiKey.trim().length === 0) {
    if (chargedPoints > 0) refundPoints(billingUser.id, chargedPoints, "生图失败自动退还（未配置 API Key）");
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

      // 统一解析：data URI / /api/user-media/... / /api/ai/history-assets/... /
      //           /api/thumb?...&src=... / public 静态资源 / 外链 —— 全部还原成二进制
      const resolved = await resolveSourceImageBuffer(sourceImage);
      if (!resolved || !resolved.buffer || resolved.buffer.length === 0) {
        throw new Error("无法解析源图片数据，请重新选择或上传照片");
      }
      const imageBlob = new Blob([resolved.buffer], { type: resolved.mime || "image/jpeg" });
      const imageFilename = `source${resolved.ext || ".jpg"}`;

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
        signal: AbortSignal.timeout(240000), // 240s timeout for AI generation
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
        signal: AbortSignal.timeout(240000), // 240s timeout
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
      assets: billingUser ? buildAssetView(findUser(billingUser.id)) : null,
    });
  } catch (err) {
    console.error("[AI Gen] Upstream generation error:", err.message);
    // AI 自由创作（custom_creative）必须返回真实大模型结果：失败即如实报错，
    // 不再用占位插画/示例样片冒充成片，供前端展示失败态并允许重试。
    if (styleId === "custom_creative") {
      if (chargedPoints > 0) refundPoints(billingUser.id, chargedPoints, "生图失败自动退还（上游报错）");
      return res.status(502).json({
        success: false,
        message: `图像大模型生成失败：${err.message || "大模型服务无响应"}`,
      });
    }
    // 兜底：必须基于用户上传照片本身做真实风格化，
    // 绝不返回与照片无关的预制矢量占位图。
    try {
      let fallbackImage = "";
      if (sourceImage && String(sourceImage).trim().length > 0) {
        fallbackImage = await renderPhotoDerivedFallback({
          styleId,
          styleName,
          sourceImage,
          aspectRatio: aspectRatio || "3:4",
        });
        if (fallbackImage) {
          console.log("[AI Gen] Photo-derived local fallback rendered for style:", styleId);
        }
      }
      if (!fallbackImage) {
        // 没有任何源图时无从做「同款风格化」，如实报错，不伪造结果。
        if (chargedPoints > 0) refundPoints(billingUser.id, chargedPoints, "生图失败自动退还（无可用源图）");
        return res.status(502).json({
          success: false,
          message: `AI 生图调用失败：${err.message || "大模型服务无响应"}。本地兜底渲染也需要上传原图，请重新上传照片后重试。`,
        });
      }
      const historyItem = {
        id: taskId,
        userId: userId || "default",
        styleId: styleId || "retro_print_illustration",
        styleName: styleName || "复古实验平面插画 · Riso印刷",
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
      const persisted = persistHistoryDataUri(fallbackImage, `${taskId}_res`);
      return res.json({
        success: true,
        message: "AI 上游超时，已用本地渲染基于你的原图生成同款风格效果",
        image: fallbackImage,
        imageUrl: persisted,
        thumbUrl: toThumbUrl(persisted),
        task: toClientHistoryItem({ ...historyItem, resultUrl: persisted }),
        assets: billingUser ? buildAssetView(findUser(billingUser.id)) : null,
      });
    } catch (fbErr) {
      console.error("[AI Gen] Photo-derived fallback also failed:", fbErr.message);
    }
    if (chargedPoints > 0) refundPoints(billingUser.id, chargedPoints, "生图失败自动退还（兜底渲染失败）");
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
