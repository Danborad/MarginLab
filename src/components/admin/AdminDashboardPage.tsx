import React, { useEffect, useMemo, useState } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import {
  LayoutDashboard,
  Users,
  Palette,
  Cpu,
  Settings,
  ArrowLeft,
  Search,
  Coins,
  HardDrive,
  Ban,
  CheckCircle2,
  ShieldCheck,
  Crown,
  RefreshCw,
  Plus,
  Minus,
  Trash2,
  KeyRound,
  Loader2,
  TrendingUp,
  Image as ImageIcon,
  CalendarCheck,
  X,
  Edit3,
  ToggleLeft,
  ToggleRight,
  RotateCcw,
  Upload,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  Mail,
  Globe,
  Shield,
  Send,
  ListFilter,
  Key,
  Sliders,
} from "lucide-react";
import type { SiteFilingConfig, EmailConfig } from "../../lib/api";
import type { AiConfig } from "../../types/ai";
import { IMAGE_RATIOS } from "../../lib/ai-styles";
import { AvatarView } from "../ui/AvatarView";
import { WebsiteLogo } from "../ui/WebsiteLogo";
import { stripEmoji } from "../../lib/utils";
import { STYLE_CATEGORIES } from "../../lib/ai-styles";
import type { StylePreset } from "../../types/ai";
import {
  apiAdminOverview,
  apiAdminGetUsers,
  apiAdminAdjustPoints,
  apiAdminSetQuota,
  apiAdminGetSystemConfig,
  apiAdminSaveSystemConfig,
  apiAdminSetUserStatus,
  apiAdminSetUserRole,
  apiAdminResetPassword,
  apiAdminDeleteUser,
} from "../../lib/api";
import type { AdminOverview } from "../../lib/api";
import type { UserAccount } from "../../types/document";

type AdminSection = "dashboard" | "users" | "styles" | "models" | "filing" | "email" | "settings";

const SECTIONS: { id: AdminSection; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "dashboard", label: "数据概览", icon: LayoutDashboard, desc: "平台核心指标" },
  { id: "users", label: "用户与资源", icon: Users, desc: "账号 · 积分 · 存储" },
  { id: "styles", label: "模板与风格", icon: Palette, desc: "风格库全生命周期" },
  { id: "models", label: "AI 模型网关", icon: Cpu, desc: "接口密钥与计费" },
  { id: "filing", label: "备案信息设置", icon: Globe, desc: "ICP · 公安部备案号" },
  { id: "email", label: "发信与邮箱通道", icon: Mail, desc: "SMTP 服务 · 域名白名单" },
  { id: "settings", label: "全局规则设置", icon: Settings, desc: "积分流水 · 默认配额" },
];

/** 备案开关（自适应深浅主题） */
const AdminToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}> = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    title={checked ? "已开启" : "已关闭"}
    onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full border transition-colors cursor-pointer shrink-0 ${
      checked
        ? "bg-emerald-500 border-emerald-400"
        : "bg-studio-panel border-studio-border"
    }`}
  >
    <span
      className={`absolute top-[2px] w-[18px] h-[18px] rounded-full shadow-xs transition-all ${
        checked ? "left-[22px] bg-white" : "left-[2px] bg-studio-dim"
      }`}
    />
  </button>
);

function formatGB(bytes: number): string {
  if (!bytes || bytes < 0) return "0";
  const gb = bytes / 1073741824;
  if (gb >= 1) return `${gb.toFixed(2)}G`;
  const mb = bytes / 1048576;
  return `${mb.toFixed(0)}M`;
}

const StatCard: React.FC<{
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ElementType;
  accent?: string;
}> = ({ label, value, hint, icon: Icon, accent = "text-emerald-400" }) => (
  <div className="glass-panel rounded-2xl p-4 flex items-start justify-between gap-3 hover-aurora">
    <div className="min-w-0">
      <p className="text-[11px] text-studio-muted font-medium whitespace-nowrap">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-studio-text font-mono tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-[10px] text-studio-dim truncate">{hint}</p>}
    </div>
    <div className={`w-9 h-9 rounded-xl bg-white/5 border border-studio-border flex items-center justify-center shrink-0 ${accent}`}>
      <Icon className="w-4 h-4" />
    </div>
  </div>
);

export const AdminDashboardPage: React.FC = () => {
  const currentUser = useEditorStore((s) => s.currentUser);
  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
  const setCurrentView = useEditorStore((s) => s.setCurrentView);
  const aiStyles = useEditorStore((s) => s.aiStyles);
  const aiConfig = useEditorStore((s) => s.aiConfig);
  const fetchAiStyles = useEditorStore((s) => s.fetchAiStyles);
  const fetchAiConfig = useEditorStore((s) => s.fetchAiConfig);
  const saveAiConfig = useEditorStore((s) => s.saveAiConfig);
  const testAiConfig = useEditorStore((s) => s.testAiConfig);
  const fetchAiModels = useEditorStore((s) => s.fetchAiModels);
  const adminToggleAiStyle = useEditorStore((s) => s.adminToggleAiStyle);
  const adminSaveAiStyle = useEditorStore((s) => s.adminSaveAiStyle);
  const adminDeleteAiStyle = useEditorStore((s) => s.adminDeleteAiStyle);
  const adminResetAiStyles = useEditorStore((s) => s.adminResetAiStyles);

  // 备案与发信 Store 接口
  const siteFilingConfig = useEditorStore((s) => s.siteFilingConfig);
  const saveSiteFilingConfig = useEditorStore((s) => s.saveSiteFilingConfig);
  const fetchSiteFilingConfig = useEditorStore((s) => s.fetchSiteFilingConfig);
  const adminEmailConfig = useEditorStore((s) => s.adminEmailConfig);
  const fetchAdminEmailConfig = useEditorStore((s) => s.fetchAdminEmailConfig);
  const saveAdminEmailConfig = useEditorStore((s) => s.saveAdminEmailConfig);
  const testAdminEmailConfig = useEditorStore((s) => s.testAdminEmailConfig);

  // 支持 /admin?tab=users / ai_config / styles / filing / email 直接落到对应页
  const initialSection = (() => {
    try {
      const t = new URLSearchParams(window.location.search).get("tab") || "";
      const map: Record<string, AdminSection> = {
        users: "users",
        ai_config: "models",
        styles: "styles",
        filing: "filing",
        email: "email",
        settings: "settings",
      };
      return map[t] || "dashboard";
    } catch (e) {
      return "dashboard";
    }
  })();
  const [section, setSection] = useState<AdminSection>(initialSection);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string>("");
  const [toast, setToast] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // 搜索与筛选
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned" | "admin">("all");

  // 弹窗
  const [pointsTarget, setPointsTarget] = useState<UserAccount | null>(null);
  const [pointsDelta, setPointsDelta] = useState("");
  const [pointsNote, setPointsNote] = useState("");
  const [quotaTarget, setQuotaTarget] = useState<UserAccount | null>(null);
  const [quotaGB, setQuotaGB] = useState("");
  const [pwdTarget, setPwdTarget] = useState<UserAccount | null>(null);
  const [pwdValue, setPwdValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null);

  // ── AI 模型网关表单状态 ──
  const [gatewayBaseUrl, setGatewayBaseUrl] = useState("https://api.openai.com/v1");
  const [gatewayApiKey, setGatewayApiKey] = useState("");
  const [gatewayModel, setGatewayModel] = useState("image2");
  const [gatewaySize, setGatewaySize] = useState("auto");
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [isSavingAi, setIsSavingAi] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([
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
  ]);
  const [modelSearchFilter, setModelSearchFilter] = useState("");

  // ── 备案信息设置状态 ──
  const [icpEnabled, setIcpEnabled] = useState(false);
  const [icpNumber, setIcpNumber] = useState("");
  const [icpLink, setIcpLink] = useState("https://beian.miit.gov.cn/");
  const [policeEnabled, setPoliceEnabled] = useState(false);
  const [policeNumber, setPoliceNumber] = useState("");
  const [policeCode, setPoliceCode] = useState("");
  const [policeLink, setPoliceLink] = useState("https://beian.mps.gov.cn/#/query/webSearch");
  const [filingSaving, setFilingSaving] = useState<null | "icp" | "police">(null);

  // ── 发信邮箱与域名白名单状态 ──
  const [emailChannelName, setEmailChannelName] = useState("企业发信通道 (mexai.cc)");
  const [emailHost, setEmailHost] = useState("");
  const [emailPort, setEmailPort] = useState(465);
  const [emailEncryption, setEmailEncryption] = useState<"tls" | "starttls" | "none">("tls");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailUser, setEmailUser] = useState("");
  const [emailPass, setEmailPass] = useState("");
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [emailFrom, setEmailFrom] = useState("");
  const [emailFromName, setEmailFromName] = useState("留白集 MarginLab");
  const [whitelistEnabled, setWhitelistEnabled] = useState(true);
  const [whitelistText, setWhitelistText] = useState("");
  const [testTargetEmail, setTestTargetEmail] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  // ── 风格模板管理状态 ──
  const [styleSearchQuery, setStyleSearchQuery] = useState("");
  const [styleCategoryFilter, setStyleCategoryFilter] = useState("all");
  const [styleStatusFilter, setStyleStatusFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [editingStyle, setEditingStyle] = useState<StylePreset | null>(null);
  const [isCreatingStyle, setIsCreatingStyle] = useState(false);

  // 风格编辑表单字段
  const [formStyleName, setFormStyleName] = useState("");
  const [formStyleEnName, setFormStyleEnName] = useState("");
  const [formStyleCategory, setFormStyleCategory] = useState("editorial");
  const [formStyleBadge, setFormStyleBadge] = useState("");
  const [formStyleOrder, setFormStyleOrder] = useState(1);
  const [formStyleCover, setFormStyleCover] = useState("");
  const [formStyleDesc, setFormStyleDesc] = useState("");
  const [formStylePrompt, setFormStylePrompt] = useState("");
  const [formStyleNegative, setFormStyleNegative] = useState("");
  const [formStyleTags, setFormStyleTags] = useState("");
  const [formStyleEnabled, setFormStyleEnabled] = useState(true);
  const [savingStyle, setSavingStyle] = useState(false);
  const [styleResetting, setStyleResetting] = useState(false);

  const handleOpenEditStyle = (s: StylePreset) => {
    setEditingStyle(s);
    setIsCreatingStyle(false);
    setFormStyleName(s.name || "");
    setFormStyleEnName(s.enName || "");
    setFormStyleCategory(s.category || "editorial");
    setFormStyleBadge(s.badge || "");
    setFormStyleOrder(s.order || 1);
    setFormStyleCover(s.coverImage || "");
    setFormStyleDesc(s.description || "");
    setFormStylePrompt(s.promptTemplate || "");
    setFormStyleNegative(s.negativePrompt || "");
    setFormStyleTags(Array.isArray(s.tags) ? s.tags.join(", ") : "");
    setFormStyleEnabled(s.enabled !== false);
  };

  const handleOpenCreateStyle = () => {
    setEditingStyle(null);
    setIsCreatingStyle(true);
    setFormStyleName("");
    setFormStyleEnName("");
    setFormStyleCategory("editorial");
    setFormStyleBadge("新上架");
    setFormStyleOrder(aiStyles.length + 1);
    setFormStyleCover("");
    setFormStyleDesc("");
    setFormStylePrompt("");
    setFormStyleNegative("ugly face, distorted, blur, low quality, watermark");
    setFormStyleTags("");
    setFormStyleEnabled(true);
  };

  const handleSaveStyle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStyleName.trim()) {
      showToast("err", "请输入风格名称");
      return;
    }
    setSavingStyle(true);
    const tagsArray = formStyleTags
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
    const payload: Partial<StylePreset> & { id: string } = {
      id: editingStyle ? editingStyle.id : `style_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: formStyleName.trim(),
      enName: formStyleEnName.trim(),
      category: formStyleCategory as any,
      badge: formStyleBadge.trim(),
      order: Number(formStyleOrder) || 1,
      coverImage: formStyleCover.trim(),
      description: formStyleDesc.trim(),
      promptTemplate: formStylePrompt.trim(),
      negativePrompt: formStyleNegative.trim(),
      tags: tagsArray,
      enabled: formStyleEnabled,
    };
    const res = await adminSaveAiStyle(payload);
    setSavingStyle(false);
    if (res.success) {
      showToast("ok", editingStyle ? "风格配置已更新" : "新建风格成功");
      setEditingStyle(null);
      setIsCreatingStyle(false);
      fetchAiStyles(true);
    } else {
      showToast("err", res.message || "保存失败");
    }
  };

  const handleToggleStyle = async (s: StylePreset) => {
    const next = s.enabled === false;
    const res = await adminToggleAiStyle(s.id, next);
    if (res.success) {
      showToast("ok", next ? `「${s.name}」已上架（创作者可见）` : `「${s.name}」已停用（已隐藏）`);
      fetchAiStyles(true);
    } else {
      showToast("err", res.message || "切换失败");
    }
  };

  const handleDeleteStyle = async (s: StylePreset) => {
    if (s.id === "dreamy_motion_editorial") {
      showToast("err", "官方核心标杆风格受保护，不可删除");
      return;
    }
    if (!window.confirm(`确认彻底删除风格「${s.name}」吗？`)) return;
    const res = await adminDeleteAiStyle(s.id);
    if (res.success) {
      showToast("ok", "风格已删除");
      fetchAiStyles(true);
    } else {
      showToast("err", res.message || "删除失败");
    }
  };

  const handleResetStyles = async () => {
    if (!window.confirm("确认将风格列表恢复为官方默认配置吗？自定义修改将被重置。")) return;
    setStyleResetting(true);
    const res = await adminResetAiStyles();
    setStyleResetting(false);
    if (res.success) {
      showToast("ok", "已恢复为官方默认配置");
      fetchAiStyles(true);
    } else {
      showToast("err", res.message || "恢复失败");
    }
  };

  const filteredAiStyles = useMemo(() => {
    return aiStyles.filter((s) => {
      if (styleCategoryFilter !== "all" && s.category !== styleCategoryFilter) return false;
      if (styleStatusFilter === "enabled" && s.enabled === false) return false;
      if (styleStatusFilter === "disabled" && s.enabled !== false) return false;
      if (!styleSearchQuery.trim()) return true;
      const q = styleSearchQuery.trim().toLowerCase();
      return (
        s.name?.toLowerCase().includes(q) ||
        s.enName?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.badge?.toLowerCase().includes(q) ||
        (Array.isArray(s.tags) && s.tags.some((t) => t.toLowerCase().includes(q)))
      );
    });
  }, [aiStyles, styleCategoryFilter, styleStatusFilter, styleSearchQuery]);

  // 系统规则
  const [sysCfg, setSysCfg] = useState<Record<string, any> | null>(null);
  const [cfgSaving, setCfgSaving] = useState(false);

  const adminId = currentUser?.id || "";

  const showToast = (type: "ok" | "err", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 2600);
  };

  const reload = async () => {
    if (!adminId) return;
    setLoading(true);
    const [ov, list] = await Promise.all([apiAdminOverview(adminId), apiAdminGetUsers(adminId)]);
    if (ov) setOverview(ov);
    if (list?.users) setUsers(list.users);
    setLoading(false);
  };

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.isAdmin) {
      setCurrentView("home");
      return;
    }
    reload();
    fetchAiStyles().catch(() => {});
    fetchAiConfig().then((cfg) => {
      if (cfg) {
        setGatewayBaseUrl(cfg.baseUrl || "https://api.openai.com/v1");
        setGatewayModel(cfg.model || "image2");
        setGatewaySize(cfg.size || "auto");
        setGatewayApiKey(cfg.maskedKey || "");
      }
    }).catch(() => {});
    fetchSiteFilingConfig().then((cfg) => {
      if (cfg) {
        setIcpEnabled(cfg.icpEnabled);
        setIcpNumber(cfg.icpNumber || "");
        setIcpLink(cfg.icpLink || "https://beian.miit.gov.cn/");
        setPoliceEnabled(cfg.policeEnabled);
        setPoliceNumber(cfg.policeNumber || "");
        setPoliceCode(cfg.policeCode || "");
        setPoliceLink(cfg.policeLink || "https://beian.mps.gov.cn/#/query/webSearch");
      }
    }).catch(() => {});
    fetchAdminEmailConfig().then((cfg) => {
      if (cfg) {
        setEmailChannelName(cfg.channelName || "企业发信通道");
        setEmailHost(cfg.host || "");
        setEmailPort(cfg.port || 465);
        setEmailEncryption(cfg.encryption || "tls");
        setEmailEnabled(Boolean(cfg.enabled));
        setEmailUser(cfg.user || "");
        setEmailFrom(cfg.fromEmail || "");
        setEmailFromName(cfg.fromName || "留白集 MarginLab");
        setWhitelistEnabled(Boolean(cfg.whitelistEnabled));
        if (Array.isArray(cfg.whitelistDomains)) {
          setWhitelistText(cfg.whitelistDomains.join("\n"));
        }
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUser?.isAdmin]);

  // AI 接口保存与测试
  const handleSaveAiGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAi(true);
    const res = await saveAiConfig({
      baseUrl: gatewayBaseUrl.trim(),
      apiKey: gatewayApiKey.trim(),
      model: gatewayModel.trim(),
      size: gatewaySize,
    });
    setIsSavingAi(false);
    showToast(res.success ? "ok" : "err", res.message || (res.success ? "AI 模型网关配置已更新" : "保存失败"));
  };

  const handleTestAiGateway = async () => {
    setIsTestingAi(true);
    const res = await testAiConfig();
    setIsTestingAi(false);
    showToast(res.success ? "ok" : "err", res.message || (res.success ? "AI 接口连通性测试通过！" : "接口测试失败"));
  };

  const handleFetchAiModels = async () => {
    setIsFetchingModels(true);
    const res = await fetchAiModels({
      baseUrl: gatewayBaseUrl.trim(),
      apiKey: gatewayApiKey.trim(),
    });
    setIsFetchingModels(false);
    if (res.success && res.models && res.models.length > 0) {
      setFetchedModels(res.models);
      showToast("ok", `成功拉取 ${res.models.length} 个可用模型`);
    } else {
      showToast("err", res.message || "拉取模型列表失败，请检查 Base URL 与 API Key");
    }
  };

  // 备案保存
  const persistFiling = async (
    which: "icp" | "police",
    patch: Partial<SiteFilingConfig>,
    successText: string
  ) => {
    setFilingSaving(which);
    const res = await saveSiteFilingConfig(patch);
    setFilingSaving(null);
    showToast(res.success ? "ok" : "err", res.success ? successText : res.message || "备案保存失败");
  };

  // 邮箱保存与测试
  const handleSaveEmailConfig = async () => {
    setSavingEmail(true);
    const domains = whitelistText
      .split("\n")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const res = await saveAdminEmailConfig({
      channelName: emailChannelName.trim(),
      host: emailHost.trim(),
      port: Number(emailPort) || 465,
      encryption: emailEncryption,
      enabled: emailEnabled,
      user: emailUser.trim(),
      ...(emailPass.trim() ? { pass: emailPass.trim() } : {}),
      fromEmail: emailFrom.trim(),
      fromName: emailFromName.trim(),
      whitelistEnabled,
      whitelistDomains: domains,
    });
    setSavingEmail(false);
    showToast(res.success ? "ok" : "err", res.success ? (res.message || "发信通道设置已保存！") : (res.message || "保存失败"));
    if (res.success) setEmailPass("");
  };

  const handleTestEmail = async () => {
    if (!testTargetEmail.trim()) {
      setTestResult({ success: false, message: "请先输入接收测试邮件的目标邮箱地址" });
      return;
    }
    setTestingEmail(true);
    setTestResult(null);
    const res = await testAdminEmailConfig({
      targetEmail: testTargetEmail.trim(),
      channelName: emailChannelName.trim(),
      host: emailHost.trim(),
      port: Number(emailPort) || 465,
      encryption: emailEncryption,
      user: emailUser.trim(),
      pass: emailPass.trim(),
      fromEmail: emailFrom.trim(),
      fromName: emailFromName.trim(),
    });
    setTestingEmail(false);
    setTestResult({
      success: res.success,
      message: res.message,
    });
  };

  const handleFillCommonDomains = () => {
    const defaults = [
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
    ];
    setWhitelistText(defaults.join("\n"));
    showToast("ok", "已快捷填入主流邮箱白名单");
  };

  useEffect(() => {
    if (section === "settings" && adminId) {
      apiAdminGetSystemConfig(adminId).then((cfg) => cfg && setSysCfg(cfg));
    }
  }, [section, adminId]);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (statusFilter === "active" && u.status === "banned") return false;
      if (statusFilter === "banned" && u.status !== "banned") return false;
      if (statusFilter === "admin" && !u.isAdmin) return false;
      if (!q) return true;
      return (
        (u.name || "").toLowerCase().includes(q) ||
        (u.username || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
      );
    });
  }, [users, query, statusFilter]);

  const doAdjustPoints = async () => {
    if (!pointsTarget) return;
    const delta = Number(pointsDelta);
    if (!Number.isFinite(delta) || delta === 0) {
      showToast("err", "请输入非零积分变动值");
      return;
    }
    setBusy("points");
    const res = await apiAdminAdjustPoints(adminId, pointsTarget.id, delta, pointsNote);
    setBusy("");
    if (res.success) {
      showToast("ok", `积分已调整为 ${res.points}`);
      setPointsTarget(null);
      setPointsDelta("");
      setPointsNote("");
      reload();
    } else {
      showToast("err", res.message || "调整失败");
    }
  };

  const doSetQuota = async () => {
    if (!quotaTarget) return;
    const gb = Number(quotaGB);
    if (!Number.isFinite(gb) || gb < 0.1) {
      showToast("err", "存储上限至少 0.1 GB");
      return;
    }
    setBusy("quota");
    const res = await apiAdminSetQuota(adminId, quotaTarget.id, gb);
    setBusy("");
    if (res.success) {
      showToast("ok", `存储上限已设为 ${gb} GB`);
      setQuotaTarget(null);
      setQuotaGB("");
      reload();
    } else {
      showToast("err", res.message || "修改失败");
    }
  };

  const doToggleStatus = async (u: UserAccount) => {
    const next = u.status === "banned" ? "active" : "banned";
    setBusy(`status-${u.id}`);
    const res = await apiAdminSetUserStatus(adminId, u.id, next);
    setBusy("");
    showToast(res.success ? "ok" : "err", res.message);
    if (res.success) reload();
  };

  const doToggleAdmin = async (u: UserAccount) => {
    if (u.id === "user_admin") return;
    setBusy(`role-${u.id}`);
    const res = await apiAdminSetUserRole(adminId, u.id, u.role || "独立创作者", !u.isAdmin);
    setBusy("");
    showToast(res.success ? "ok" : "err", res.message);
    if (res.success) reload();
  };

  const doResetPassword = async () => {
    if (!pwdTarget || !pwdValue.trim()) return;
    setBusy("pwd");
    const res = await apiAdminResetPassword(adminId, pwdTarget.id, pwdValue.trim());
    setBusy("");
    showToast(res.success ? "ok" : "err", res.message);
    if (res.success) {
      setPwdTarget(null);
      setPwdValue("");
    }
  };

  const doDeleteUser = async () => {
    if (!deleteTarget) return;
    setBusy("delete");
    const res = await apiAdminDeleteUser(adminId, deleteTarget.id);
    setBusy("");
    showToast(res.success ? "ok" : "err", res.message);
    if (res.success) {
      setDeleteTarget(null);
      reload();
    }
  };

  const saveSysConfig = async () => {
    if (!sysCfg) return;
    setCfgSaving(true);
    const res = await apiAdminSaveSystemConfig(adminId, sysCfg);
    setCfgSaving(false);
    showToast(res.success ? "ok" : "err", res.success ? "全局规则已保存" : res.message || "保存失败");
  };

  const handleReturnToStudio = () => {
    setCurrentView("studio");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", "/");
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  };

  return (
    <div className="w-screen h-screen bg-studio-bg text-studio-text flex overflow-hidden select-none">
      {/* ── 左侧固定导航 ── */}
      <aside className="w-60 shrink-0 h-full bg-studio-sidebar border-r border-studio-border flex flex-col">
        <button
          type="button"
          onClick={handleReturnToStudio}
          className="h-16 px-4 flex items-center gap-2.5 border-b border-studio-border shrink-0 hover:bg-white/5 transition-all text-left cursor-pointer group"
          title="点击返回留白集前台创作与拼图工作台"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <WebsiteLogo className="w-4 h-4" strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-studio-text whitespace-nowrap group-hover:text-emerald-400 transition-colors">
              留白集 · 控制台
            </p>
            <p className="text-[10px] font-mono text-studio-dim tracking-wider">MARGINLAB ADMIN</p>
          </div>
        </button>

        <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto no-scrollbar">
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                  active
                    ? "bg-emerald-500/12 border border-emerald-500/35 text-emerald-300"
                    : "border border-transparent text-studio-muted hover:bg-white/5 hover:text-studio-text"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold whitespace-nowrap">{s.label}</p>
                  <p className="text-[10px] text-studio-dim truncate">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="p-2.5 border-t border-studio-border shrink-0">
          <button
            onClick={handleReturnToStudio}
            className="w-full px-3 py-2 rounded-xl text-xs font-bold text-studio-muted hover:text-studio-text hover:bg-white/5 border border-studio-border flex items-center gap-2 transition-colors cursor-pointer"
            title="回到留白集前台排版与创作舞台"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
            <span className="whitespace-nowrap">返回前台工作台</span>
          </button>
        </div>
      </aside>

      {/* ── 右侧工作区 ── */}
      <main className="flex-1 h-full flex flex-col overflow-hidden aurora-bg">
        <header className="h-16 px-6 border-b border-studio-border flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-studio-text whitespace-nowrap">
              {SECTIONS.find((s) => s.id === section)?.label}
            </h1>
            <p className="text-[11px] text-studio-muted truncate">
              {SECTIONS.find((s) => s.id === section)?.desc}
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleReturnToStudio}
              className="px-3.5 py-1.5 rounded-xl btn-aurora text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
              title="返回前台创作与拼图工作台"
            >
              <ArrowLeft className="w-3.5 h-3.5 stroke-[2.2]" />
              <span>返回前台</span>
            </button>
            <button
              onClick={reload}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl btn-glass text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>刷新</span>
            </button>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/5 border border-studio-border">
              <AvatarView avatar={currentUser?.avatar} name={stripEmoji(currentUser?.name || "管理员")} size="xs" />
              <span className="text-xs font-semibold text-studio-text whitespace-nowrap">
                {stripEmoji(currentUser?.name || "管理员")}
              </span>
              {currentUser?.isAdmin && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-500">
                  超级管理员
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {/* ── 数据概览 ── */}
          {section === "dashboard" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <StatCard
                  label="平台总用户"
                  value={overview?.totalUsers ?? "—"}
                  hint={`活跃 ${overview?.activeUsers ?? 0} · 管理员 ${overview?.adminUsers ?? 0}`}
                  icon={Users}
                />
                <StatCard
                  label="今日签到"
                  value={overview?.checkInToday ?? "—"}
                  hint={`自然日 ${overview?.today ?? ""}`}
                  icon={CalendarCheck}
                  accent="text-cyan-400"
                />
                <StatCard
                  label="AI 生图总量"
                  value={overview?.totalAiImages ?? "—"}
                  hint={`累计消耗 ${overview?.totalAiImages ?? 0} 积分`}
                  icon={ImageIcon}
                  accent="text-violet-400"
                />
                <StatCard
                  label="云存储占用"
                  value={formatGB(overview?.totalStorageUsed ?? 0)}
                  hint={`总配额 ${formatGB(overview?.totalStorageQuota ?? 0)}`}
                  icon={HardDrive}
                  accent="text-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="glass-panel rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-xs font-bold text-studio-text">积分池与存储水位</h2>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-studio-muted">全平台积分总量</span>
                        <span className="font-mono text-emerald-300">{overview?.totalPoints ?? 0} 分</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: "100%" }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-studio-muted">云存储使用率</span>
                        <span className="font-mono text-amber-300">
                          {overview && overview.totalStorageQuota > 0
                            ? `${((overview.totalStorageUsed / overview.totalStorageQuota) * 100).toFixed(2)}%`
                            : "0%"}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-amber-400"
                          style={{
                            width: `${
                              overview && overview.totalStorageQuota > 0
                                ? Math.min(100, (overview.totalStorageUsed / overview.totalStorageQuota) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Crown className="w-4 h-4 text-amber-400" />
                    <h2 className="text-xs font-bold text-studio-text">快捷入口</h2>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "users" as AdminSection, label: "管理用户积分" },
                      { id: "users" as AdminSection, label: "调整存储配额" },
                      { id: "models" as AdminSection, label: "AI 接口配置" },
                      { id: "settings" as AdminSection, label: "全局规则" },
                    ].map((q) => (
                      <button
                        key={q.label}
                        onClick={() => setSection(q.id)}
                        className="px-3 py-2 rounded-xl btn-glass text-[11px] font-semibold text-left cursor-pointer"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 用户与资源 ── */}
          {section === "users" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-studio-dim absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="搜索用户名 / 昵称 / 邮箱"
                    className="w-full input-dark pl-9 pr-3 py-2 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-studio-border">
                  {(
                    [
                      { id: "all", label: "全部" },
                      { id: "active", label: "正常" },
                      { id: "banned", label: "已封禁" },
                      { id: "admin", label: "管理员" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setStatusFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                        statusFilter === f.id
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "text-studio-muted hover:text-studio-text"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-studio-border text-[11px]">
                        <th className="px-4 py-2.5 font-semibold whitespace-nowrap">用户</th>
                        <th className="px-3 py-2.5 font-semibold whitespace-nowrap">状态</th>
                        <th className="px-3 py-2.5 font-semibold whitespace-nowrap">积分</th>
                        <th className="hidden lg:table-cell px-3 py-2.5 font-semibold whitespace-nowrap">存储</th>
                        <th className="hidden xl:table-cell px-3 py-2.5 font-semibold whitespace-nowrap">作品/素材</th>
                        <th className="hidden 2xl:table-cell px-3 py-2.5 font-semibold whitespace-nowrap">注册时间</th>
                        <th className="px-4 py-2.5 font-semibold whitespace-nowrap text-right">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-studio-border/60 last:border-0 hover:bg-white/[0.03]">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <AvatarView avatar={u.avatar} name={stripEmoji(u.name || u.username)} size="sm" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-studio-text truncate max-w-[140px]">
                                    {stripEmoji(u.name || u.username)}
                                  </p>
                                  {u.isAdmin && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-500 shrink-0">
                                      管理员
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-studio-dim font-mono truncate max-w-[180px]">
                                  @{u.username}
                                  {u.email ? ` · ${u.email}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                                u.status === "banned"
                                  ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                                  : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              }`}
                            >
                              {u.status === "banned" ? "已封禁" : "正常"}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-mono font-bold text-emerald-300">
                              {u.points ?? 0}
                            </span>
                          </td>
                          <td className="hidden lg:table-cell px-3 py-2.5">
                            <div className="w-full max-w-[150px]">
                              <div className="flex items-center justify-between text-[10px] font-mono text-studio-dim mb-0.5">
                                <span>{formatGB(u.storageUsed || 0)}</span>
                                <span>{formatGB(u.storageQuota || 0)}</span>
                              </div>
                              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    (u.storagePercent || 0) >= 90 ? "bg-amber-400" : "bg-emerald-500"
                                  }`}
                                  style={{ width: `${Math.min(100, u.storagePercent || 0)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="hidden xl:table-cell px-3 py-2.5">
                            <span className="text-[11px] font-mono text-studio-muted whitespace-nowrap">
                              {u.savedProjectsCount ?? 0} / {u.mediaAssetsCount ?? 0}
                            </span>
                          </td>
                          <td className="hidden 2xl:table-cell px-3 py-2.5">
                            <span className="text-[10px] font-mono text-studio-dim whitespace-nowrap">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString("zh-CN") : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setPointsTarget(u);
                                  setPointsDelta("");
                                  setPointsNote("");
                                }}
                                title="调整积分"
                                className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-400 cursor-pointer"
                              >
                                <Coins className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setQuotaTarget(u);
                                  setQuotaGB(((u.storageQuota || 0) / 1073741824).toFixed(1));
                                }}
                                title="修改存储上限"
                                className="p-1.5 rounded-lg hover:bg-white/10 text-amber-400 cursor-pointer"
                              >
                                <HardDrive className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setPwdTarget(u);
                                  setPwdValue("");
                                }}
                                title="重设密码"
                                className="p-1.5 rounded-lg hover:bg-white/10 text-cyan-400 cursor-pointer"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => doToggleAdmin(u)}
                                disabled={u.id === "user_admin"}
                                title={u.isAdmin ? "撤销管理员" : "设为管理员"}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-violet-400 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => doToggleStatus(u)}
                                disabled={u.id === "user_admin"}
                                title={u.status === "banned" ? "解封" : "封禁"}
                                className="p-1.5 rounded-lg hover:bg-white/10 text-amber-300 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                {u.status === "banned" ? (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                ) : (
                                  <Ban className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button
                                onClick={() => setDeleteTarget(u)}
                                disabled={u.id === "user_admin"}
                                title="删除账号"
                                className="p-1.5 rounded-lg hover:bg-white/10 text-rose-400 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-4 py-10 text-center text-xs text-studio-muted">
                            没有匹配的用户
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── 模板与风格（全面扁平化管理，卡片尺寸适中，支持编辑/上下架/新增/恢复） ── */}
          {section === "styles" && (
            <div className="space-y-3.5">
              {/* 顶部指标统计与操作工具栏 */}
              <div className="glass-panel rounded-2xl p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <div>
                    <h2 className="text-sm font-bold text-studio-text">风格与排版模板管理</h2>
                    <p className="text-[11px] text-studio-muted mt-0.5">
                      集中管控 AI 风格化核心模型配方、提示词、推荐角标与上下架状态
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-0 lg:ml-2">
                    <span className="px-2.5 py-1 rounded-lg bg-studio-panel border border-studio-border text-[11px] font-mono text-studio-text">
                      全部 <strong className="text-emerald-500 font-bold">{aiStyles.length}</strong> 款
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      已上架 <strong className="font-bold">{aiStyles.filter((s) => s.enabled !== false).length}</strong>
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-studio-panel border border-studio-border text-[11px] font-mono text-studio-dim">
                      已停用 <strong className="font-bold">{aiStyles.filter((s) => s.enabled === false).length}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleResetStyles}
                    disabled={styleResetting}
                    className="px-3 py-1.5 rounded-xl btn-glass text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="重置为官方预设的 25 款标杆风格配置"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${styleResetting ? "animate-spin" : ""}`} />
                    <span>恢复官方默认</span>
                  </button>
                  <button
                    onClick={handleOpenCreateStyle}
                    className="px-3.5 py-1.5 rounded-xl btn-aurora text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>新建自定义风格</span>
                  </button>
                </div>
              </div>

              {/* 搜索与分类状态筛选工具条 */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 flex-1 max-w-xl">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-studio-dim absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={styleSearchQuery}
                      onChange={(e) => setStyleSearchQuery(e.target.value)}
                      placeholder="搜索风格名称、英文标识、标签或描述..."
                      className="w-full bg-studio-input border border-studio-border focus:border-emerald-500 rounded-xl pl-8 pr-7 py-2 text-xs text-studio-text placeholder:text-studio-dim focus:outline-none transition-all font-medium"
                    />
                    {styleSearchQuery && (
                      <button
                        onClick={() => setStyleSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-studio-dim hover:text-studio-text cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* 分类下拉 */}
                  <select
                    value={styleCategoryFilter}
                    onChange={(e) => setStyleCategoryFilter(e.target.value)}
                    className="px-3 py-2 bg-studio-card border border-studio-border rounded-xl text-xs text-studio-text focus:outline-none cursor-pointer shrink-0 font-medium"
                  >
                    <option value="all">全部分类 ({aiStyles.length})</option>
                    {STYLE_CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label} ({aiStyles.filter((s) => s.category === cat.id).length})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 状态筛选胶囊 */}
                <div className="flex items-center gap-1 bg-studio-card p-1 rounded-xl border border-studio-border shrink-0 text-xs">
                  <button
                    onClick={() => setStyleStatusFilter("all")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      styleStatusFilter === "all"
                        ? "bg-emerald-500 text-black shadow-xs"
                        : "text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setStyleStatusFilter("enabled")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      styleStatusFilter === "enabled"
                        ? "bg-emerald-500 text-black shadow-xs"
                        : "text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    仅上架
                  </button>
                  <button
                    onClick={() => setStyleStatusFilter("disabled")}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      styleStatusFilter === "disabled"
                        ? "bg-emerald-500 text-black shadow-xs"
                        : "text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    仅停用
                  </button>
                </div>
              </div>

              {/* 风格管理卡片网格（适中紧凑尺寸，展示全部控制按钮与信息） */}
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3">
                {filteredAiStyles.map((s) => {
                  const isEnabled = s.enabled !== false;
                  const isCore = s.id === "dreamy_motion_editorial";

                  return (
                    <div
                      key={s.id}
                      className={`glass-panel rounded-2xl p-3 flex flex-col justify-between border transition-all ${
                        isEnabled
                          ? "border-studio-border hover:border-emerald-500/50 hover:shadow-glass"
                          : "border-studio-border/50 opacity-65 bg-studio-panel/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* 适中紧凑的缩略图 (不再是巨图) */}
                        <div className="w-18 h-24 sm:w-20 sm:h-28 rounded-xl overflow-hidden bg-studio-panel border border-studio-border shrink-0 relative group">
                          {s.coverImage ? (
                            <img
                              src={s.coverImage}
                              alt={s.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : s.previewSvg ? (
                            <div
                              dangerouslySetInnerHTML={{ __html: s.previewSvg }}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-studio-dim">
                              <ImageIcon className="w-5 h-5 mb-1" />
                              <span className="text-[9px] font-mono">无封面</span>
                            </div>
                          )}
                          {s.badge && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/75 text-white backdrop-blur-xs font-mono">
                              {s.badge}
                            </span>
                          )}
                        </div>

                        {/* 主体元数据 */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <h3 className="text-xs font-bold text-studio-text truncate">
                                {s.name}
                              </h3>
                              {isCore && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-500 shrink-0">
                                  标杆
                                </span>
                              )}
                            </div>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 whitespace-nowrap ${
                                isEnabled
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                                  : "bg-studio-panel text-studio-dim border border-studio-border"
                              }`}
                            >
                              {isEnabled ? "已上架" : "已隐藏"}
                            </span>
                          </div>

                          <p className="text-[10px] text-studio-dim font-mono truncate">
                            {s.enName || s.id}
                          </p>

                          <p className="text-[11px] text-studio-muted line-clamp-2 leading-relaxed">
                            {s.description || "无详细描述"}
                          </p>

                          {/* 提示词片段缩略 */}
                          {s.promptTemplate && (
                            <div className="bg-studio-panel/80 p-1.5 rounded-lg border border-studio-border/50 text-[10px] font-mono text-studio-dim truncate">
                              <span className="text-emerald-500 font-bold mr-1">PROMPT:</span>
                              {s.promptTemplate}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 底部管理操作控制条 */}
                      <div className="mt-3 pt-2.5 border-t border-studio-border/70 flex items-center justify-between gap-2">
                        {/* 左：一键上架/下架切换开关 */}
                        <button
                          onClick={() => handleToggleStyle(s)}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            isEnabled
                              ? "bg-emerald-500/12 border-emerald-500/35 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-studio-panel border-studio-border text-studio-dim hover:text-studio-text"
                          }`}
                          title={isEnabled ? "点击下架停用（创作者不可见）" : "点击上架启用（创作者可见）"}
                        >
                          {isEnabled ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-500" />
                              <span>上架中</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-studio-dim" />
                              <span>已停用</span>
                            </>
                          )}
                        </button>

                        {/* 右：编辑与删除按钮 */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditStyle(s)}
                            className="px-2.5 py-1 rounded-lg btn-glass text-[11px] font-bold text-studio-text flex items-center gap-1 cursor-pointer hover:border-emerald-500/50"
                            title="打开风格模板详细设置（提示词、角标、分类、封面等）"
                          >
                            <Edit3 className="w-3 h-3 text-emerald-400" />
                            <span>编辑设置</span>
                          </button>
                          {!isCore && (
                            <button
                              onClick={() => handleDeleteStyle(s)}
                              className="p-1 rounded-lg text-studio-dim hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="彻底删除此风格"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredAiStyles.length === 0 && (
                <div className="py-16 text-center text-studio-dim text-xs glass-panel rounded-2xl space-y-2">
                  <Palette className="w-8 h-8 mx-auto text-studio-dim opacity-50" />
                  <p className="font-bold text-studio-text">未找到符合条件的风格模板</p>
                  <p className="text-[11px]">请尝试重置搜索关键字或切换分类标签</p>
                </div>
              )}
            </div>
          )}

          {/* ── AI 模型网关（全功能部署表单） ── */}
          {section === "models" && (
            <div className="space-y-4 max-w-4xl">
              <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-studio-text">AI 图像大模型网关部署</h2>
                  <p className="text-[11px] text-studio-muted mt-0.5">
                    全平台统一部署上游 OpenAI / image2 兼容协议接口，所有创作者共享算力，无需用户自备密钥
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border ${
                      aiConfig?.isConfigured
                        ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/12 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {aiConfig?.isConfigured ? "✓ 网关已就绪" : "待配置密钥"}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveAiGateway} className="glass-panel rounded-2xl p-5 space-y-4">
                {/* 1. Base URL */}
                <div>
                  <label className="text-xs font-bold text-studio-text block mb-1">
                    API 接口地址 (Base URL) *
                  </label>
                  <input
                    type="text"
                    required
                    value={gatewayBaseUrl}
                    onChange={(e) => setGatewayBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1 或中转接口代理"
                    className="w-full input-dark px-3.5 py-2.5 text-xs font-mono"
                  />
                  <p className="text-[11px] text-studio-muted mt-1">
                    支持 OpenAI 官方或任何标准兼容网关（如 image2 / one-api / new-api 等）
                  </p>
                </div>

                {/* 2. API Key */}
                <div>
                  <label className="text-xs font-bold text-studio-text block mb-1">
                    API 密钥 (API Key) *
                  </label>
                  <input
                    type="password"
                    value={gatewayApiKey}
                    onChange={(e) => setGatewayApiKey(e.target.value)}
                    placeholder={aiConfig?.apiKey ? "••••••••••••••••  (已保存，留空保留原密钥)" : "sk-..."}
                    className="w-full input-dark px-3.5 py-2.5 text-xs font-mono"
                  />
                  <p className="text-[11px] text-studio-muted mt-1">
                    密钥仅保存在服务端加密沙盒内，前端脱敏返回，保障资金与接口安全
                  </p>
                </div>

                {/* 3. 模型名称 & 实时拉取 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-studio-text">
                      图像模型名称 (Model) *
                    </label>
                    <button
                      type="button"
                      onClick={handleFetchAiModels}
                      disabled={isFetchingModels}
                      className="px-2.5 py-1 rounded-lg btn-glass text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-emerald-500 dark:text-emerald-400"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isFetchingModels ? "animate-spin" : ""}`} />
                      <span>{isFetchingModels ? "正在拉取网关模型..." : "实时拉取网关模型列表"}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    required
                    value={gatewayModel}
                    onChange={(e) => setGatewayModel(e.target.value)}
                    placeholder="例如: image2 / dall-e-3 / flux-pro"
                    className="w-full input-dark px-3.5 py-2.5 text-xs font-mono"
                  />

                  {/* 快捷点选网格 */}
                  <div className="pt-1 space-y-1">
                    <span className="text-[11px] text-studio-muted block">点击快速选用推荐与已拉取模型：</span>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-studio-panel rounded-xl border border-studio-border">
                      {fetchedModels.map((m) => {
                        const isSelected = gatewayModel.toLowerCase() === m.toLowerCase();
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setGatewayModel(m)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer border ${
                              isSelected
                                ? "bg-emerald-500 text-black border-emerald-400 font-bold shadow-xs"
                                : "bg-studio-card border-studio-border text-studio-muted hover:text-studio-text"
                            }`}
                          >
                            {m}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 4. 默认生成画幅比例 */}
                <div>
                  <label className="text-xs font-bold text-studio-text block mb-1.5">
                    默认推荐画幅比例 (Size / Aspect Ratio)
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 p-2 bg-studio-panel rounded-xl border border-studio-border">
                    {IMAGE_RATIOS.map((r) => {
                      const isSelected = gatewaySize === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setGatewaySize(r.id)}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                            isSelected
                              ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold"
                              : "bg-studio-card border-studio-border text-studio-muted hover:text-studio-text"
                          }`}
                        >
                          <div className="text-[11px] font-mono">{r.label}</div>
                          <div className="text-[9px] text-studio-dim truncate">{r.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. 测试与保存按钮 */}
                <div className="pt-3 border-t border-studio-border flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={isTestingAi}
                    onClick={handleTestAiGateway}
                    className="px-4 py-2 rounded-xl btn-glass text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingAi ? "animate-spin" : ""}`} />
                    <span>{isTestingAi ? "测试中…" : "测试 API 连通性"}</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingAi}
                    className="px-5 py-2 rounded-xl btn-aurora text-xs font-bold cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isSavingAi ? "保存中…" : "保存全平台模型配置"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── 备案信息设置（独立全功能页签） ── */}
          {section === "filing" && (
            <div className="space-y-4 max-w-4xl">
              <div className="glass-panel rounded-2xl p-4">
                <h2 className="text-sm font-bold text-studio-text">网站备案信息设置</h2>
                <p className="text-[11px] text-studio-muted mt-0.5 leading-relaxed">
                  ICP 备案与公安部备案号各带一个<strong>独立开关</strong>。开关打开且填写真实号码后，才会显示在落地页页脚；关闭后即刻从前台隐藏。两项互不影响，可只开其中一项。
                </p>
              </div>

              {/* 1) ICP 备案设置 */}
              <div className="glass-panel rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-studio-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-500 flex items-center justify-center font-bold">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-studio-text">ICP 网站备案设置 (工信部)</h3>
                      <p className="text-[10px] text-studio-dim font-mono">MIIT · 工业和信息化部政务服务平台</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-studio-text">
                      {icpEnabled ? "已开启展示" : "已关闭隐藏"}
                    </span>
                    <AdminToggleSwitch
                      checked={icpEnabled}
                      onChange={(next) => {
                        setIcpEnabled(next);
                        persistFiling("icp", { icpEnabled: next, icpNumber, icpLink }, next ? "ICP 备案展示已开启" : "ICP 备案展示已关闭");
                      }}
                      label="ICP 备案展示开关"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-studio-muted block mb-1">
                      ICP 备案号
                    </label>
                    <input
                      type="text"
                      value={icpNumber}
                      onChange={(e) => setIcpNumber(e.target.value)}
                      placeholder="例如: 皖ICP备19011861号-4"
                      className="w-full input-dark px-3 py-2 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-studio-muted block mb-1">
                      工信部查询跳转链接
                    </label>
                    <input
                      type="text"
                      value={icpLink}
                      onChange={(e) => setIcpLink(e.target.value)}
                      placeholder="https://beian.miit.gov.cn/"
                      className="w-full input-dark px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-studio-dim">页脚点击备案号将新窗口跳转到工信部核验</span>
                    <button
                      type="button"
                      disabled={filingSaving === "icp"}
                      onClick={() => persistFiling("icp", { icpEnabled, icpNumber, icpLink }, "ICP 备案配置已成功保存！")}
                      className="px-4 py-2 rounded-xl btn-aurora text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {filingSaving === "icp" ? "保存中…" : "保存 ICP 备案设置"}
                    </button>
                  </div>
                </div>
              </div>

              {/* 2) 公安部备案号设置 */}
              <div className="glass-panel rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-studio-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center font-bold">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-studio-text">全国公安机关互联网站安全管理服务平台备案</h3>
                      <p className="text-[10px] text-studio-dim font-mono">MPS · 全国公安机关互联网站安全管理</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-studio-text">
                      {policeEnabled ? "已开启展示" : "已关闭隐藏"}
                    </span>
                    <AdminToggleSwitch
                      checked={policeEnabled}
                      onChange={(next) => {
                        setPoliceEnabled(next);
                        persistFiling("police", { policeEnabled: next, policeNumber, policeCode, policeLink }, next ? "公安备案展示已开启" : "公安备案展示已关闭");
                      }}
                      label="公安部备案展示开关"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-studio-muted block mb-1">
                        公安备案号
                      </label>
                      <input
                        type="text"
                        value={policeNumber}
                        onChange={(e) => setPoliceNumber(e.target.value)}
                        placeholder="例如: 京公网安备 11010502000000号"
                        className="w-full input-dark px-3 py-2 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-studio-muted block mb-1">
                        备案编号代码（选填，用于跳转定位）
                      </label>
                      <input
                        type="text"
                        value={policeCode}
                        onChange={(e) => setPoliceCode(e.target.value)}
                        placeholder="11010502000000"
                        className="w-full input-dark px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-studio-muted block mb-1">
                      公安备案查询链接
                    </label>
                    <input
                      type="text"
                      value={policeLink}
                      onChange={(e) => setPoliceLink(e.target.value)}
                      placeholder="https://beian.mps.gov.cn/#/query/webSearch"
                      className="w-full input-dark px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-studio-dim">与 ICP 备案独立管控，保存后即刻生效</span>
                    <button
                      type="button"
                      disabled={filingSaving === "police"}
                      onClick={() => persistFiling("police", { policeEnabled, policeNumber, policeCode, policeLink }, "公安部备案配置已成功保存！")}
                      className="px-4 py-2 rounded-xl btn-aurora text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {filingSaving === "police" ? "保存中…" : "保存公安备案设置"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 发信与邮箱通道设置（独立全功能页签） ── */}
          {section === "email" && (
            <div className="space-y-4 max-w-4xl">
              <div className="glass-panel rounded-2xl p-4">
                <h2 className="text-sm font-bold text-studio-text">发信与邮箱通道设置</h2>
                <p className="text-[11px] text-studio-muted mt-0.5 leading-relaxed">
                  配置系统标准 SMTP 发信通道，用于用户自主注册发送 6 位验证码，以及密码找回安全验证
                </p>
              </div>

              {/* CARD 1: SMTP 服务通道配置 */}
              <div className="glass-panel rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-studio-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400 flex items-center justify-center font-bold">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-studio-text">SMTP 发信服务设置</h3>
                      <p className="text-[10px] text-studio-dim font-mono">标准发信客户端配置</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-studio-text">
                      {emailEnabled ? "发信已启用" : "已停用"}
                    </span>
                    <AdminToggleSwitch
                      checked={emailEnabled}
                      onChange={(next) => setEmailEnabled(next)}
                      label="发信服务全局开关"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="text-[11px] font-bold text-studio-muted block mb-1">
                      通道识别名称
                    </label>
                    <input
                      type="text"
                      value={emailChannelName}
                      onChange={(e) => setEmailChannelName(e.target.value)}
                      placeholder="例: 飞书企业邮 / 腾讯企业邮"
                      className="w-full input-dark px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[11px] font-bold text-studio-muted block mb-1">
                      SMTP 服务器地址 *
                    </label>
                    <input
                      type="text"
                      value={emailHost}
                      onChange={(e) => setEmailHost(e.target.value)}
                      placeholder="smtp.larksuite.com 或 smtp.qq.com"
                      className="w-full input-dark px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-[11px] font-bold text-studio-muted block mb-1">
                      端口 (Port) *
                    </label>
                    <input
                      type="number"
                      value={emailPort}
                      onChange={(e) => setEmailPort(Number(e.target.value))}
                      placeholder="465"
                      className="w-full input-dark px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-studio-muted block mb-1">
                      加密方式
                    </label>
                    <select
                      value={emailEncryption}
                      onChange={(e) => setEmailEncryption(e.target.value as any)}
                      className="w-full input-dark px-3 py-2 text-xs cursor-pointer font-medium"
                    >
                      <option value="tls">直接 TLS (默认 465)</option>
                      <option value="starttls">STARTTLS (通常 587)</option>
                      <option value="none">无加密 (不安全)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-studio-muted block mb-1">
                      SMTP 认证账号
                    </label>
                    <input
                      type="text"
                      value={emailUser}
                      onChange={(e) => setEmailUser(e.target.value)}
                      placeholder="通常是完整登录邮箱"
                      className="w-full input-dark px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-studio-muted block mb-1">
                      SMTP 授权密码 (留空保留已配置)
                    </label>
                    <div className="relative">
                      <input
                        type={showEmailPass ? "text" : "password"}
                        value={emailPass}
                        onChange={(e) => setEmailPass(e.target.value)}
                        placeholder={adminEmailConfig?.hasPass ? "•••••••••••• (已保存)" : "输入应用专属授权码"}
                        className="w-full input-dark px-3 pr-8 py-2 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmailPass(!showEmailPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-studio-dim hover:text-studio-text cursor-pointer"
                      >
                        {showEmailPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-studio-muted block mb-1">
                      发件人邮箱 (From) *
                    </label>
                    <input
                      type="text"
                      value={emailFrom}
                      onChange={(e) => setEmailFrom(e.target.value)}
                      placeholder="mexai@mexai.cc"
                      className="w-full input-dark px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-studio-muted block mb-1">
                      发件人显示名称
                    </label>
                    <input
                      type="text"
                      value={emailFromName}
                      onChange={(e) => setEmailFromName(e.target.value)}
                      placeholder="留白集 MarginLab"
                      className="w-full input-dark px-3 py-2 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* 即时发送连通性测试卡片 */}
                <div className="p-3.5 rounded-xl bg-studio-panel border border-studio-border space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-studio-text flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-emerald-500" />
                      <span>即时发信连通性测试</span>
                    </span>
                    <span className="text-[10px] text-studio-dim font-mono">发送真实 6 位验证码以验证 SMTP 通道</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={testTargetEmail}
                      onChange={(e) => setTestTargetEmail(e.target.value)}
                      placeholder="输入接收测试邮件的目标邮箱 (如 duck@ugreen.tv)"
                      className="flex-1 input-dark px-3 py-2 text-xs font-mono"
                    />
                    <button
                      type="button"
                      disabled={testingEmail}
                      onClick={handleTestEmail}
                      className="px-4 py-2 rounded-xl btn-aurora text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <Send className={`w-3.5 h-3.5 ${testingEmail ? "animate-spin" : ""}`} />
                      <span>{testingEmail ? "发送中…" : "发送测试邮件"}</span>
                    </button>
                  </div>
                  {testResult && (
                    <div
                      className={`p-2.5 rounded-lg border text-xs font-medium ${
                        testResult.success
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      }`}
                    >
                      {testResult.success ? "✓ 连通性测试通过！邮件已成功投递。" : `✗ 连通性测试失败：${testResult.message}`}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={savingEmail}
                    onClick={handleSaveEmailConfig}
                    className="px-5 py-2.5 rounded-xl btn-aurora text-xs font-bold cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {savingEmail ? "保存中…" : "保存发信邮箱配置"}
                  </button>
                </div>
              </div>

              {/* CARD 2: 电子邮件域名白名单 */}
              <div className="glass-panel rounded-2xl p-5 space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b border-studio-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center font-bold">
                      <ListFilter className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-studio-text">允许注册邮箱域名白名单</h3>
                      <p className="text-[10px] text-studio-dim">不在白名单内的邮箱后缀将被拦截，保障平台安全</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-studio-text">
                      {whitelistEnabled ? "白名单限制已开启" : "白名单已关闭（允许任意邮箱）"}
                    </span>
                    <AdminToggleSwitch
                      checked={whitelistEnabled}
                      onChange={(next) => setWhitelistEnabled(next)}
                      label="域名白名单开关"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-studio-muted">
                      每行填写一个合法域名（如 163.com、qq.com、gmail.com 等）
                    </label>
                    <button
                      type="button"
                      onClick={handleFillCommonDomains}
                      className="text-xs font-bold text-emerald-500 hover:underline cursor-pointer"
                    >
                      + 快捷填入常用主流邮箱 (163/QQ/Gmail等)
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={whitelistText}
                    onChange={(e) => setWhitelistText(e.target.value)}
                    placeholder="163.com\nqq.com\ngmail.com\noutlook.com"
                    className="w-full input-dark p-3 text-xs font-mono leading-relaxed"
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={savingEmail}
                      onClick={handleSaveEmailConfig}
                      className="px-4 py-2 rounded-xl btn-aurora text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {savingEmail ? "保存中…" : "保存域名白名单"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 全局规则设置（积分与存储配额） ── */}
          {section === "settings" && (
            <div className="space-y-4 max-w-3xl">
              <div className="glass-panel rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Settings className="w-4 h-4 text-emerald-500" />
                  <h2 className="text-sm font-bold text-studio-text">积分与云存储全局默认规则</h2>
                </div>
                <p className="text-[11px] text-studio-muted">
                  控制新用户注册初始算力与默认云盘空间，所有后续生成的扣减规则均由此控制
                </p>
              </div>

              {sysCfg ? (
                <div className="glass-panel rounded-2xl p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {[
                      { key: "registerPoints", label: "新用户注册赠送积分", unit: "分", desc: "首次注册立即到账" },
                      { key: "checkInPoints", label: "每日签到奖励积分", unit: "分", desc: "每日自然日首登领取" },
                      { key: "costPerImage", label: "单张图片生成消耗", unit: "分/张", desc: "AI生图扣减单价" },
                      { key: "defaultStorageGB", label: "新用户默认存储配额", unit: "GB", desc: "初始云盘可用空间" },
                    ].map((f) => (
                      <div key={f.key} className="p-3 rounded-xl bg-studio-panel border border-studio-border">
                        <label className="text-xs font-bold text-studio-text block mb-0.5">
                          {f.label}（{f.unit}）
                        </label>
                        <p className="text-[10px] text-studio-dim mb-2">{f.desc}</p>
                        <input
                          type="number"
                          value={sysCfg[f.key] ?? ""}
                          onChange={(e) =>
                            setSysCfg({ ...sysCfg, [f.key]: e.target.value === "" ? "" : Number(e.target.value) })
                          }
                          className="w-full input-dark px-3 py-2 text-xs font-mono font-bold"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-studio-border flex justify-end">
                    <button
                      onClick={saveSysConfig}
                      disabled={cfgSaving || !sysCfg}
                      className="px-5 py-2.5 rounded-xl btn-aurora text-xs font-bold cursor-pointer disabled:opacity-50 shadow-xs"
                    >
                      {cfgSaving ? "保存中…" : "保存全局规则配置"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-panel rounded-2xl p-8 text-center text-xs text-studio-muted">
                  正在读取系统全局配置…
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl glass-float text-xs font-semibold z-[200] animate-fadeIn whitespace-nowrap ${
            toast.type === "ok" ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* ── 调整积分弹窗 ── */}
      {pointsTarget && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-float rounded-2xl p-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-studio-text">调整积分 · {stripEmoji(pointsTarget.name || pointsTarget.username)}</h3>
              <button onClick={() => setPointsTarget(null)} className="p-1 rounded-lg hover:bg-white/10 cursor-pointer">
                <X className="w-3.5 h-3.5 text-studio-muted" />
              </button>
            </div>
            <p className="text-[11px] text-studio-muted mb-2">
              当前余额 <span className="font-mono text-emerald-300">{pointsTarget.points ?? 0}</span> 分
            </p>
            <div className="flex items-center gap-1.5 mb-2">
              <button
                onClick={() => setPointsDelta(`-${Math.abs(Number(pointsDelta) || 0)}`)}
                className="p-1.5 rounded-lg btn-glass cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                value={pointsDelta}
                onChange={(e) => setPointsDelta(e.target.value)}
                placeholder="如 100 或 -20"
                className="flex-1 input-dark px-3 py-2 text-xs font-mono"
              />
              <button
                onClick={() => setPointsDelta(`${Math.abs(Number(pointsDelta) || 0)}`)}
                className="p-1.5 rounded-lg btn-glass cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              value={pointsNote}
              onChange={(e) => setPointsNote(e.target.value)}
              placeholder="备注（选填，将记入积分流水）"
              className="w-full input-dark px-3 py-2 text-xs mb-3"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPointsTarget(null)}
                className="px-3 py-1.5 rounded-xl btn-glass text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={doAdjustPoints}
                disabled={busy === "points"}
                className="px-3 py-1.5 rounded-xl btn-aurora text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {busy === "points" ? "提交中…" : "确认调整"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 修改存储配额弹窗 ── */}
      {quotaTarget && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-float rounded-2xl p-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-studio-text">修改存储上限 · {stripEmoji(quotaTarget.name || quotaTarget.username)}</h3>
              <button onClick={() => setQuotaTarget(null)} className="p-1 rounded-lg hover:bg-white/10 cursor-pointer">
                <X className="w-3.5 h-3.5 text-studio-muted" />
              </button>
            </div>
            <p className="text-[11px] text-studio-muted mb-2">
              已用 {formatGB(quotaTarget.storageUsed || 0)} · 当前上限{" "}
              {formatGB(quotaTarget.storageQuota || 0)}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="number"
                value={quotaGB}
                onChange={(e) => setQuotaGB(e.target.value)}
                className="flex-1 input-dark px-3 py-2 text-xs font-mono"
              />
              <span className="text-xs text-studio-muted">GB</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[5, 10, 20, 50, 100].map((g) => (
                <button
                  key={g}
                  onClick={() => setQuotaGB(String(g))}
                  className="px-2.5 py-1 rounded-lg btn-glass text-[11px] font-mono cursor-pointer"
                >
                  {g}G
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setQuotaTarget(null)}
                className="px-3 py-1.5 rounded-xl btn-glass text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={doSetQuota}
                disabled={busy === "quota"}
                className="px-3 py-1.5 rounded-xl btn-aurora text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {busy === "quota" ? "提交中…" : "确认修改"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 重设密码弹窗 ── */}
      {pwdTarget && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-float rounded-2xl p-4 animate-fadeIn">
            <h3 className="text-xs font-bold text-studio-text mb-3">重设密码 · {stripEmoji(pwdTarget.name || pwdTarget.username)}</h3>
            <input
              value={pwdValue}
              onChange={(e) => setPwdValue(e.target.value)}
              placeholder="输入新密码（至少 4 位）"
              className="w-full input-dark px-3 py-2 text-xs mb-3"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPwdTarget(null)}
                className="px-3 py-1.5 rounded-xl btn-glass text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={doResetPassword}
                disabled={busy === "pwd"}
                className="px-3 py-1.5 rounded-xl btn-aurora text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {busy === "pwd" ? "提交中…" : "确认重设"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 删除账号确认 ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm glass-float rounded-2xl p-4 animate-fadeIn">
            <h3 className="text-xs font-bold text-rose-300 mb-2">彻底删除账号</h3>
            <p className="text-[11px] text-studio-muted mb-3">
              将永久删除「{stripEmoji(deleteTarget.name || deleteTarget.username)}」(@{deleteTarget.username}) 的账号与其作品、素材、AI 历史，不可恢复。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-xl btn-glass text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={doDeleteUser}
                disabled={busy === "delete"}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {busy === "delete" ? "删除中…" : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 风格模板深度设置弹窗（编辑与新建） ── */}
      {(editingStyle || isCreatingStyle) && (
        <div
          className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
          onClick={() => {
            setEditingStyle(null);
            setIsCreatingStyle(false);
          }}
        >
          <div
            className="w-full max-w-2xl bg-studio-sidebar border border-studio-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-studio-border bg-studio-panel flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-studio-text">
                    {editingStyle ? `编辑风格模板 · ${editingStyle.name}` : "新建先锋艺术风格模板"}
                  </h3>
                  <p className="text-[11px] text-studio-muted mt-0.5">
                    配置风格核心名称、所属分类、封面微缩图、AI 引导提示词配方与上下架状态
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditingStyle(null);
                  setIsCreatingStyle(false);
                }}
                className="p-1.5 rounded-lg text-studio-dim hover:text-studio-text hover:bg-white/5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveStyle} className="flex-1 overflow-y-auto p-5 space-y-4 no-scrollbar">
              {/* 1. 基本信息 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-studio-muted block mb-1">
                    风格名称 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formStyleName}
                    onChange={(e) => setFormStyleName(e.target.value)}
                    placeholder="例如: s21 · 梦幻动态电影海报"
                    className="w-full input-dark px-3 py-2 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-studio-muted block mb-1">
                    英文标识 / 副标题
                  </label>
                  <input
                    type="text"
                    value={formStyleEnName}
                    onChange={(e) => setFormStyleEnName(e.target.value)}
                    placeholder="例如: 01 · Dreamy Motion Editorial"
                    className="w-full input-dark px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              {/* 2. 分类、角标、排序 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-studio-muted block mb-1">
                    风格分类
                  </label>
                  <select
                    value={formStyleCategory}
                    onChange={(e) => setFormStyleCategory(e.target.value)}
                    className="w-full input-dark px-3 py-2 text-xs font-medium cursor-pointer"
                  >
                    {STYLE_CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-studio-muted block mb-1">
                    推荐角标
                  </label>
                  <input
                    type="text"
                    value={formStyleBadge}
                    onChange={(e) => setFormStyleBadge(e.target.value)}
                    placeholder="例: s21 顶荐 / 新上架 / 热门"
                    className="w-full input-dark px-3 py-2 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-studio-muted block mb-1">
                    排序权重
                  </label>
                  <input
                    type="number"
                    value={formStyleOrder}
                    onChange={(e) => setFormStyleOrder(Number(e.target.value) || 1)}
                    className="w-full input-dark px-3 py-2 text-xs font-mono"
                  />
                </div>
              </div>

              {/* 3. 封面微缩图设置 */}
              <div className="p-3.5 rounded-2xl bg-studio-card border border-studio-border space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-studio-text">风格封面预览与上传</h4>
                  {formStyleCover && (
                    <button
                      type="button"
                      onClick={() => setFormStyleCover("")}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      清除当前封面
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="w-18 h-24 sm:w-20 sm:h-28 rounded-xl bg-studio-panel border border-studio-border overflow-hidden shrink-0 flex items-center justify-center relative">
                    {formStyleCover ? (
                      <img src={formStyleCover} alt="Cover Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2 text-studio-dim">
                        <ImageIcon className="w-5 h-5 mx-auto mb-1 opacity-50" />
                        <span className="text-[9px]">暂无封面</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl btn-glass text-xs text-studio-text font-bold cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      <span>上传封面相片 (JPG / PNG / WebP)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => setFormStyleCover(ev.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                          e.target.value = "";
                        }}
                      />
                    </label>

                    <input
                      type="text"
                      value={formStyleCover.startsWith("data:") ? "[已读取本地相片 Base64 缓存]" : formStyleCover}
                      onChange={(e) => setFormStyleCover(e.target.value)}
                      placeholder="或粘贴图片绝对 URL 地址..."
                      className="w-full input-dark px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 4. 详细介绍说明 */}
              <div>
                <label className="text-[11px] font-bold text-studio-muted block mb-1">
                  风格详细介绍说明 *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formStyleDesc}
                  onChange={(e) => setFormStyleDesc(e.target.value)}
                  placeholder="简述该风格的视觉特征、光影质感、留白构图与排版特色..."
                  className="w-full input-dark px-3 py-2 text-xs leading-relaxed"
                />
              </div>

              {/* 5. 提示词配方模板 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-studio-muted">
                    AI 核心提示词配方模板 (PROMPT TEMPLATE) *
                  </label>
                  <span className="text-[10px] font-mono text-emerald-500 font-bold">
                    可用插槽: {"{moodNotes}"}, {"{textInstruction}"}
                  </span>
                </div>
                <textarea
                  required
                  rows={4}
                  value={formStylePrompt}
                  onChange={(e) => setFormStylePrompt(e.target.value)}
                  placeholder="输入发送给上游大模型的艺术风格提示词模板..."
                  className="w-full input-dark px-3 py-2 text-xs font-mono leading-relaxed"
                />
              </div>

              {/* 6. 负向提示词 */}
              <div>
                <label className="text-[11px] font-bold text-studio-muted block mb-1">
                  负向提示词 (NEGATIVE PROMPT)
                </label>
                <textarea
                  rows={2}
                  value={formStyleNegative}
                  onChange={(e) => setFormStyleNegative(e.target.value)}
                  placeholder="例如: distorted faces, ugly fingers, excessive fog, watermark..."
                  className="w-full input-dark px-3 py-2 text-xs font-mono leading-relaxed"
                />
              </div>

              {/* 7. 标签与展示状态 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-studio-muted block mb-1">
                    风格标签 (逗号分隔)
                  </label>
                  <input
                    type="text"
                    value={formStyleTags}
                    onChange={(e) => setFormStyleTags(e.target.value)}
                    placeholder="例: 慢门拖影, 动态留白, 电影质感"
                    className="w-full input-dark px-3 py-2 text-xs font-medium"
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-studio-card border border-studio-border">
                  <div>
                    <div className="text-xs font-bold text-studio-text">模板展示状态</div>
                    <div className="text-[10px] text-studio-dim">
                      {formStyleEnabled ? "创作者在前台修图/风格化面板可见并可直接使用" : "处于隐藏状态，仅管理员后台可见"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormStyleEnabled(!formStyleEnabled)}
                    className={`px-3 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      formStyleEnabled
                        ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                        : "bg-studio-panel border-studio-border text-studio-dim hover:text-studio-text"
                    }`}
                  >
                    {formStyleEnabled ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4" />}
                    <span>{formStyleEnabled ? "已上架" : "已隐藏"}</span>
                  </button>
                </div>
              </div>

              {/* 弹窗底部操作 */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-studio-border">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStyle(null);
                    setIsCreatingStyle(false);
                  }}
                  className="px-4 py-2 rounded-xl btn-glass text-xs font-semibold cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={savingStyle}
                  className="px-5 py-2 rounded-xl btn-aurora text-xs font-bold cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {savingStyle ? "正在保存…" : editingStyle ? "保存修改配置" : "确认新建风格"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
