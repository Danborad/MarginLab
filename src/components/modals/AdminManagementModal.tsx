import React, { useState, useEffect } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import {
  X,
  Crown,
  Users,
  Sparkles,
  Search,
  RefreshCw,
  UserPlus,
  Shield,
  ShieldCheck,
  Key,
  Trash2,
  Globe,
  Cpu,
  Sliders,
  Check,
  AlertCircle,
  FolderKanban,
  Image as ImageIcon,
  History,
  Ban,
  UserCheck,
  Palette,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Plus,
  Eye,
  EyeOff,
  Upload,
  RotateCcw,
  ExternalLink,
  Copy,
  BookOpen,
  Camera,
} from "lucide-react";
import { StylePreset, StyleCategory } from "../../types/ai";
import { STYLE_CATEGORIES } from "../../lib/ai-styles";
import { fileToBase64 } from "../../lib/utils";
import { Button } from "../ui/Button";
import { AvatarView } from "../ui/AvatarView";
import { AvatarPicker } from "../ui/AvatarPicker";
import { UserAccount } from "../../types/document";
import { IMAGE_RATIOS } from "../../lib/ai-styles";
import type { SiteFilingConfig } from "../../lib/api";

/** 备案开关（两个备案各用一个，互不影响） */
const FilingSwitch: React.FC<{
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
      checked ? "bg-amber-500 border-amber-600" : "bg-studio-card border-studio-border"
    }`}
  >
    <span
      className={`absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all ${
        checked ? "left-[22px]" : "left-[2px]"
      }`}
    />
  </button>
);

const COMMON_MODELS = [
  { id: "image2", name: "image2", desc: "OpenAI / image2 原生兼容大模型" },
  { id: "dall-e-3", name: "DALL·E 3", desc: "OpenAI 官方超高画质生图" },
  { id: "grok-imagine-image", name: "grok-imagine", desc: "Grok 灵感视觉模型" },
  { id: "flux-pro", name: "FLUX.1 Pro", desc: "FLUX 先锋照片与插画模型" },
  { id: "midjourney-v6", name: "Midjourney v6", desc: "高定艺术美学风格" },
];


const GithubIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
    />
  </svg>
);

export const AdminManagementModal: React.FC = () => {
  const open = useEditorStore((s) => s.adminModalOpen);
  const setOpen = useEditorStore((s) => s.setAdminModalOpen);
  const activeTab = useEditorStore((s) => s.adminModalTab);
  const currentUser = useEditorStore((s) => s.currentUser);

  const adminUsersList = useEditorStore((s) => s.adminUsersList);
  const adminStats = useEditorStore((s) => s.adminStats);
  const fetchAdminUsers = useEditorStore((s) => s.fetchAdminUsers);
  const adminSetUserStatus = useEditorStore((s) => s.adminSetUserStatus);
  const adminSetUserRole = useEditorStore((s) => s.adminSetUserRole);
  const adminResetPassword = useEditorStore((s) => s.adminResetPassword);
  const adminCreateUser = useEditorStore((s) => s.adminCreateUser);
  const adminDeleteUser = useEditorStore((s) => s.adminDeleteUser);

  const aiConfig = useEditorStore((s) => s.aiConfig);
  const fetchAiConfig = useEditorStore((s) => s.fetchAiConfig);
  const saveAiConfig = useEditorStore((s) => s.saveAiConfig);
  const testAiConfig = useEditorStore((s) => s.testAiConfig);
  const fetchAiModels = useEditorStore((s) => s.fetchAiModels);

  const aiStyles = useEditorStore((s) => s.aiStyles);
  const fetchAiStyles = useEditorStore((s) => s.fetchAiStyles);
  const adminSaveAiStyle = useEditorStore((s) => s.adminSaveAiStyle);
  const adminToggleAiStyle = useEditorStore((s) => s.adminToggleAiStyle);
  const adminDeleteAiStyle = useEditorStore((s) => s.adminDeleteAiStyle);
  const adminResetAiStyles = useEditorStore((s) => s.adminResetAiStyles);

  // ---------------------------------------------------------------------
  // 备案信息（ICP 备案 / 公安部备案号）—— 两个独立开关
  // ---------------------------------------------------------------------
  const siteFilingConfig = useEditorStore((s) => s.siteFilingConfig);
  const saveSiteFilingConfig = useEditorStore((s) => s.saveSiteFilingConfig);

  const [icpEnabled, setIcpEnabled] = useState(siteFilingConfig.icpEnabled);
  const [icpNumber, setIcpNumber] = useState(siteFilingConfig.icpNumber);
  const [icpLink, setIcpLink] = useState(siteFilingConfig.icpLink);
  const [policeEnabled, setPoliceEnabled] = useState(siteFilingConfig.policeEnabled);
  const [policeNumber, setPoliceNumber] = useState(siteFilingConfig.policeNumber);
  const [policeCode, setPoliceCode] = useState(siteFilingConfig.policeCode);
  const [policeLink, setPoliceLink] = useState(siteFilingConfig.policeLink);
  const [filingSaving, setFilingSaving] = useState<null | "icp" | "police">(null);
  const [filingFeedback, setFilingFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    setIcpEnabled(siteFilingConfig.icpEnabled);
    setIcpNumber(siteFilingConfig.icpNumber);
    setIcpLink(siteFilingConfig.icpLink);
    setPoliceEnabled(siteFilingConfig.policeEnabled);
    setPoliceNumber(siteFilingConfig.policeNumber);
    setPoliceCode(siteFilingConfig.policeCode);
    setPoliceLink(siteFilingConfig.policeLink);
  }, [siteFilingConfig, open]);

  const persistFiling = async (
    which: "icp" | "police",
    patch: Partial<SiteFilingConfig>,
    successText: string
  ) => {
    setFilingSaving(which);
    const res = await saveSiteFilingConfig(patch);
    setFilingSaving(null);
    setFilingFeedback(
      res.success
        ? { type: "success", text: successText }
        : { type: "error", text: res.message || "备案信息保存失败" }
    );
    window.setTimeout(() => setFilingFeedback(null), 2600);
  };

  const toggleIcp = (next: boolean) => {
    setIcpEnabled(next);
    persistFiling(
      "icp",
      { icpEnabled: next, icpNumber, icpLink },
      next ? "ICP 备案展示已开启" : "ICP 备案展示已关闭"
    );
  };

  const togglePolice = (next: boolean) => {
    setPoliceEnabled(next);
    persistFiling(
      "police",
      { policeEnabled: next, policeNumber, policeCode, policeLink },
      next ? "公安部备案展示已开启" : "公安部备案展示已关闭"
    );
  };

  const showIcpInFooter = icpEnabled && icpNumber.trim().length > 0;
  const showPoliceInFooter = policeEnabled && policeNumber.trim().length > 0;

  // Style templates filter & edit states
  const [styleSearchQuery, setStyleSearchQuery] = useState("");
  const [styleCategoryFilter, setStyleCategoryFilter] = useState<string>("all");
  const [styleStatusFilter, setStyleStatusFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [isRefreshingStyles, setIsRefreshingStyles] = useState(false);
  const [styleFeedback, setStyleFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit / Create Style Drawer/Modal
  const [editingStyle, setEditingStyle] = useState<StylePreset | null>(null);
  
  const [isSavingStyle, setIsSavingStyle] = useState(false);

  // Form Fields for Style
  const [styleName, setStyleName] = useState("");
  const [styleEnName, setStyleEnName] = useState("");
  const [styleBadge, setStyleBadge] = useState("");
  const [styleCategory, setStyleCategory] = useState<StyleCategory>("editorial");
  const [styleDescription, setStyleDescription] = useState("");
  const [stylePromptTemplate, setStylePromptTemplate] = useState("");
  const [styleNegativePrompt, setStyleNegativePrompt] = useState("");
  const [styleTagsInput, setStyleTagsInput] = useState("");
  const [styleEnabled, setStyleEnabled] = useState(true);
  const [styleCoverImage, setStyleCoverImage] = useState<string>("");
  const [stylePreviewSvg, setStylePreviewSvg] = useState<string>("");
  const [styleOrder, setStyleOrder] = useState<number>(1);
  const [styleGithubUrl, setStyleGithubUrl] = useState<string>("");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const handleCopyUrl = (url: string) => {
    try {
      navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setStyleFeedback({ type: "success", text: `已复制 GitHub 仓库地址: ${url}` });
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch (e) {
      setStyleFeedback({ type: "success", text: `GitHub 地址: ${url}` });
    }
  };

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "active" | "banned" | "admin">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Action states
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // In-App Confirmation Dialog State (No native window.confirm / alert)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    confirmLabel?: string;
    confirmVariant?: "danger" | "accent";
    onConfirm: () => void;
  } | null>(null);

  // New User Form Modal
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState("🎨");
  const [newRole, setNewRole] = useState("创作者");
  const [newBio, setNewBio] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Password Reset Prompt
  const [resetTargetUser, setResetTargetUser] = useState<UserAccount | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // AI Config Form
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("image2");
  const [size, setSize] = useState("auto");
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [isSavingAi, setIsSavingAi] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
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

   useEffect(() => {
     if (open) {
       fetchAdminUsers();
       fetchAiStyles(true);
       fetchAiConfig().then((cfg) => {
         if (cfg) {
           setBaseUrl(cfg.baseUrl || "https://api.openai.com/v1");
           setModel(cfg.model || "image2");
           setSize(cfg.size || "auto");
           setApiKey(cfg.maskedKey || "");
         }
       });
       setFeedback(null);
       setAiFeedback(null);
       setStyleFeedback(null);
     }
   }, [open, fetchAdminUsers, fetchAiConfig, fetchAiStyles]);
 
   if (!open || !currentUser?.isAdmin) return null;
 
   const handleRefreshUsers = async () => {
    setIsRefreshing(true);
    await fetchAdminUsers();
    setIsRefreshing(false);
  };

  const handleToggleStatus = async (user: UserAccount) => {
    const nextStatus = user.status === "banned" ? "active" : "banned";
    if (nextStatus === "banned") {
      setConfirmDialog({
        title: "封禁创作者账号",
        description: `确定要封禁创作者【${user.name}】(@${user.username}) 吗？封禁后该账号将无法登录工作台。`,
        confirmLabel: "确认封禁",
        confirmVariant: "danger",
        onConfirm: async () => {
          const res = await adminSetUserStatus(user.id, nextStatus);
          setFeedback({
            type: res.success ? "success" : "error",
            text: res.message,
          });
        },
      });
      return;
    }
    const res = await adminSetUserStatus(user.id, nextStatus);
    setFeedback({
      type: res.success ? "success" : "error",
      text: res.message,
    });
  };

  const handleToggleAdminRole = async (user: UserAccount) => {
    const nextAdmin = !user.isAdmin;
    if (user.id === "user_admin") return;
    const res = await adminSetUserRole(user.id, user.role, nextAdmin);
    setFeedback({
      type: res.success ? "success" : "error",
      text: res.message,
    });
  };

  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser || !newPasswordInput.trim()) return;
    setIsResetting(true);
    const res = await adminResetPassword(resetTargetUser.id, newPasswordInput.trim());
    setIsResetting(false);
    if (res.success) {
      const uName = resetTargetUser.name;
      setResetTargetUser(null);
      setNewPasswordInput("");
      setFeedback({ type: "success", text: `创作者【${uName}】的密码已成功重置！` });
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  const handleDeleteUser = async (user: UserAccount) => {
    if (user.id === "user_admin") {
      setFeedback({ type: "error", text: "系统超级管理员账号不可删除！" });
      return;
    }
    setConfirmDialog({
      title: "危险操作：彻底删除创作者",
      description: `确定要彻底删除创作者【${user.name}】(@${user.username}) 吗？该操作不可撤销，且会抹除其所有素材与项目！`,
      confirmLabel: "确认彻底删除",
      confirmVariant: "danger",
      onConfirm: async () => {
        const res = await adminDeleteUser(user.id);
        setFeedback({
          type: res.success ? "success" : "error",
          text: res.message,
        });
      },
    });
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;
    setIsCreatingUser(true);
    const res = await adminCreateUser({
      username: newUsername.trim(),
      password: newPassword.trim(),
      name: newName.trim() || newUsername.trim(),
      avatar: newAvatar,
      role: newRole.trim() || "创作者",
      bio: newBio.trim(),
      isAdmin: newIsAdmin,
    });
    setIsCreatingUser(false);
    if (res.success) {
      setShowAddUser(false);
      setNewUsername("");
      setNewPassword("");
      setNewName("");
      setNewBio("");
      setFeedback({ type: "success", text: res.message });
    } else {
      setFeedback({ type: "error", text: res.message });
    }
  };

  const handleFetchModels = async () => {
    setIsFetchingModels(true);
    setAiFeedback(null);
    const res = await fetchAiModels({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
    });
    setIsFetchingModels(false);
    if (res.success && res.models && res.models.length > 0) {
      setFetchedModels(res.models);
      setAiFeedback({
        type: "success",
        text: res.message || `成功拉取 ${res.models.length} 个可用模型`,
      });
    } else {
      setAiFeedback({
        type: "error",
        text: res.message || "拉取模型列表失败，请检查 Base URL 与 API Key",
      });
    }
  };

  const handleTestAi = async () => {
    setIsTestingAi(true);
    setAiFeedback(null);
    const res = await testAiConfig();
    setIsTestingAi(false);
    setAiFeedback({
      type: res.success ? "success" : "error",
      text: res.message,
    });
  };

  const handleSaveAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAi(true);
    setAiFeedback(null);
    const res = await saveAiConfig({
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      model: model.trim(),
      size,
    });
    setIsSavingAi(false);
    setAiFeedback({
      type: res.success ? "success" : "error",
      text: res.message,
    });
  };


  const handleOpenEditStyle = (style: StylePreset) => {
    
    setEditingStyle(style);
    setStyleName(style.name);
    setStyleEnName(style.enName);
    setStyleBadge(style.badge || "");
    setStyleCategory(style.category || "editorial");
    setStyleDescription(style.description || "");
    setStylePromptTemplate(style.promptTemplate || "");
    setStyleNegativePrompt(style.negativePrompt || "");
    setStyleTagsInput((style.tags || []).join(", "));
    setStyleEnabled(style.enabled !== false);
    setStyleCoverImage(style.coverImage || "");
    setStylePreviewSvg(style.previewSvg || "");
    setStyleOrder(style.order || 1);
    setStyleGithubUrl(style.githubUrl || "");
    setStyleFeedback(null);
  };

  const handleToggleStyleStatus = async (style: StylePreset) => {
    const nextEnabled = style.enabled === false ? true : false;
    const res = await adminToggleAiStyle(style.id, nextEnabled);
    setStyleFeedback({
      type: res.success ? "success" : "error",
      text: res.message,
    });
  };

  const handleResetStyles = async () => {
    setConfirmDialog({
      title: "恢复官方默认风格模板",
      description: "确定要恢复默认官方风格模板吗？系统将保留所有已收录的官方高定风格，并重设默认启用状态。",
      confirmLabel: "确认恢复",
      confirmVariant: "accent",
      onConfirm: async () => {
        const res = await adminResetAiStyles();
        setStyleFeedback({
          type: res.success ? "success" : "error",
          text: res.message,
        });
      },
    });
  };

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      setStyleCoverImage(b64);
    } catch (err) {
      setStyleFeedback({ type: "error", text: "读取图片文件失败，请重新选择" });
    }
  };

  const handleSaveStyleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!styleName.trim()) {
      setStyleFeedback({ type: "error", text: "请输入风格模板名称" });
      return;
    }

    setIsSavingStyle(true);
    setStyleFeedback(null);

    const tags = styleTagsInput
      .split(/[,，\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: Partial<StylePreset> & { id: string } = {
      id: editingStyle ? editingStyle.id : "",
      name: styleName.trim(),
      enName: styleEnName.trim() || styleName.trim(),
      badge: styleBadge.trim(),
      category: styleCategory,
      description: styleDescription.trim(),
      promptTemplate: stylePromptTemplate.trim(),
      negativePrompt: styleNegativePrompt.trim(),
      tags,
      enabled: styleEnabled,
      coverImage: styleCoverImage,
      previewSvg: stylePreviewSvg,
      order: Number(styleOrder) || 1,
      githubUrl: styleGithubUrl.trim(),
    };

    const res = await adminSaveAiStyle(payload);
    setIsSavingStyle(false);

    if (res.success) {
      setEditingStyle(null);
      
      setStyleFeedback({ type: "success", text: res.message });
    } else {
      setStyleFeedback({ type: "error", text: res.message });
    }
  };

  const filteredStyles = aiStyles.filter((style) => {
    const q = styleSearchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      style.name.toLowerCase().includes(q) ||
      style.enName.toLowerCase().includes(q) ||
      style.description.toLowerCase().includes(q) ||
      (style.tags && style.tags.some((t) => t.toLowerCase().includes(q)));

    if (!matchQuery) return false;
    if (styleCategoryFilter !== "all" && style.category !== styleCategoryFilter) return false;
    if (styleStatusFilter === "enabled" && style.enabled === false) return false;
    if (styleStatusFilter === "disabled" && style.enabled !== false) return false;
    return true;
  });

  const filteredUsers = adminUsersList.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      u.username.toLowerCase().includes(q) ||
      u.name.toLowerCase().includes(q) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q));

    if (!matchQuery) return false;
    if (filterType === "active") return u.status !== "banned";
    if (filterType === "banned") return u.status === "banned";
    if (filterType === "admin") return u.isAdmin;
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn select-none"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-4xl bg-studio-sidebar border border-studio-border/90 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-studio-border/80 bg-studio-panel flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-inner">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-studio-text tracking-wide whitespace-nowrap">
                  平台管控中心 • 管理员控制台
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 border border-amber-500/40 whitespace-nowrap shrink-0">
                  超级管理权限
                </span>
              </div>
              <p className="text-[11px] text-studio-muted mt-0.5">
                管理创作者账号与权限封禁，配置全平台全局 AI 图像大模型
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-2 rounded-xl bg-studio-card/80 text-studio-muted hover:text-studio-text border border-studio-border/60 hover:border-studio-border transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation —— 标签一律单行显示，窗口变窄时横向滚动而不是换行 */}
        <div className="px-5 pt-3 border-b border-studio-border/60 bg-studio-panel flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
            <button
              onClick={() => setOpen(true, "users")}
              className={`pb-3 px-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                activeTab === "users"
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-studio-muted hover:text-studio-text"
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">
                创作者账号 ({adminStats.total || adminUsersList.length})
              </span>
            </button>

            <button
              onClick={() => setOpen(true, "ai_config")}
              className={`pb-3 px-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                activeTab === "ai_config"
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-studio-muted hover:text-studio-text"
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">全局 AI 模型配置</span>
              {aiConfig?.isConfigured && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              )}
            </button>

            <button
              onClick={() => setOpen(true, "styles")}
              className={`pb-3 px-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                activeTab === "styles"
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-studio-muted hover:text-studio-text"
              }`}
            >
              <Palette className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">风格化模板 ({aiStyles.length})</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-blue-500/20 text-blue-600 border border-blue-500/40 whitespace-nowrap shrink-0">
                {aiStyles.filter((s) => s.enabled !== false).length} 开启
              </span>
            </button>

            <button
              onClick={() => setOpen(true, "filing")}
              className={`pb-3 px-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                activeTab === "filing"
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-studio-muted hover:text-studio-text"
              }`}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">备案设置</span>
              {(siteFilingConfig.icpEnabled || siteFilingConfig.policeEnabled) && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-600 border border-emerald-500/40 whitespace-nowrap shrink-0">
                  {[siteFilingConfig.icpEnabled, siteFilingConfig.policeEnabled].filter(Boolean).length} 开启
                </span>
              )}
            </button>
          </div>

          <div className="text-[11px] text-studio-muted/80 font-mono hidden xl:block whitespace-nowrap shrink-0">
            当前管理员: <span className="text-studio-accent font-semibold">{currentUser?.name}</span>
          </div>
        </div>

        {/* Tab 1: USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Feedback Alert */}
            {feedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-fadeIn ${
                  feedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                    : "bg-red-500/10 border-red-500/30 text-red-600"
                }`}
              >
                <div className="flex items-center gap-2">
                  {feedback.type === "success" ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{feedback.text}</span>
                </div>
                <button
                  onClick={() => setFeedback(null)}
                  className="text-studio-muted hover:text-studio-text p-1 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-studio-card border border-studio-border/70 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-studio-muted font-mono">总创作者</div>
                  <div className="text-base font-bold text-studio-text font-mono">
                    {adminStats.total || adminUsersList.length}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-studio-card border border-studio-border/70 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-studio-muted font-mono">状态正常</div>
                  <div className="text-base font-bold text-emerald-600 font-mono">
                    {adminStats.activeCount || adminUsersList.filter((u) => u.status !== "banned").length}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-studio-card border border-studio-border/70 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-600 flex items-center justify-center">
                  <Ban className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-studio-muted font-mono">已封禁</div>
                  <div className="text-base font-bold text-red-600 font-mono">
                    {adminStats.bannedCount || adminUsersList.filter((u) => u.status === "banned").length}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-studio-card border border-studio-border/70 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-studio-muted font-mono">管理员</div>
                  <div className="text-base font-bold text-amber-600 font-mono">
                    {adminStats.adminCount || adminUsersList.filter((u) => u.isAdmin).length}
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Action Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-studio-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索用户名 / 昵称 / 角色 / 邮箱..."
                    className="w-full pl-9 pr-3 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/50 focus:outline-none transition-colors"
                  />
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRefreshUsers}
                  disabled={isRefreshing}
                  className="px-3 shrink-0 cursor-pointer"
                  title="刷新用户列表"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-studio-accent" : ""}`} />
                </Button>
              </div>

              {/* Status Filter Tabs & Add User Button */}
              <div className="flex items-center gap-2 justify-between sm:justify-end">
                <div className="flex items-center gap-1 bg-studio-panel p-1 rounded-xl border border-studio-border/60 text-xs">
                  {[
                    { id: "all", label: "全部" },
                    { id: "active", label: "正常" },
                    { id: "banned", label: "已封禁" },
                    { id: "admin", label: "管理员" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterType(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                        filterType === tab.id
                          ? "bg-studio-accent text-white font-semibold"
                          : "text-studio-muted hover:text-gray-950"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => setShowAddUser(!showAddUser)}
                  className="flex items-center gap-1.5 text-xs py-2 px-3 shrink-0 cursor-pointer shadow-subtle-glow"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{showAddUser ? "收起表单" : "新建用户"}</span>
                </Button>
              </div>
            </div>

            {/* Add User Accordion */}
            {showAddUser && (
              <form
                onSubmit={handleCreateUserSubmit}
                className="p-4 rounded-2xl bg-studio-panel border border-studio-accent/40 space-y-3 animate-fadeIn"
              >
                <div className="flex items-center justify-between pb-2 border-b border-studio-border/60">
                  <div className="text-xs font-semibold text-studio-accent flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4" />
                    <span>添加新创作者账号</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddUser(false)}
                    className="text-xs text-studio-muted hover:text-studio-text"
                  >
                    取消
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                      登录用户名 *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="如 studio_01"
                      className="w-full px-3 py-2 bg-studio-sidebar border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                      初始登录密码 *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="至少 4 位字符"
                      className="w-full px-3 py-2 bg-studio-sidebar border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                      创作者昵称
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="显示名称"
                      className="w-full px-3 py-2 bg-studio-sidebar border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                      角色标签
                    </label>
                    <input
                      type="text"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      placeholder="如 独立摄影师 / 视觉总监"
                      className="w-full px-3 py-2 bg-studio-sidebar border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                      头像选择
                    </label>
                    <AvatarPicker value={newAvatar} onChange={setNewAvatar} />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs text-studio-text cursor-pointer py-2">
                      <input
                        type="checkbox"
                        checked={newIsAdmin}
                        onChange={(e) => setNewIsAdmin(e.target.checked)}
                        className="rounded border-studio-border text-amber-600 focus:ring-amber-400"
                      />
                      <span className="text-amber-600 text-[11px] font-medium flex items-center gap-1">
                        <Crown className="w-3 h-3" /> 赋予管理员权限
                      </span>
                    </label>

                    <Button
                      type="submit"
                      variant="accent"
                      disabled={isCreatingUser}
                      className="text-xs py-2 px-4 shadow-sm shrink-0 cursor-pointer"
                    >
                      {isCreatingUser ? "创建中..." : "确认创建账号"}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* Users List Cards */}
            <div className="space-y-2.5">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-studio-panel border border-dashed border-studio-border/70 text-studio-muted text-xs">
                  未检索到符合条件的创作者账号
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isRootAdmin = user.id === "user_admin";
                  const isCurrent = user.id === currentUser?.id;
                  const isBanned = user.status === "banned";

                  return (
                    <div
                      key={user.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isBanned
                          ? "bg-red-950/10 border-red-500/20 opacity-80"
                          : "bg-studio-panel border-studio-border/70 hover:border-studio-border"
                      }`}
                    >
                      {/* Left: User Avatar & Basic Info */}
                      <div className="flex items-center gap-3 min-w-[240px]">
                        <div className="relative">
                          <AvatarView avatar={user.avatar} size="md" />
                          {user.isAdmin && (
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-zinc-950 flex items-center justify-center text-[9px] shadow font-bold">
                              👑
                            </span>
                          )}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-studio-text">
                              {user.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-studio-accent/20 text-white border border-studio-accent/30">
                                当前登录
                              </span>
                            )}
                            {isBanned ? (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-600 border border-red-500/30 flex items-center gap-0.5">
                                <Ban className="w-2.5 h-2.5" /> 已封禁
                              </span>
                            ) : (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                                正常
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-studio-muted font-mono">
                            <span>@{user.username}</span>
                            <span>•</span>
                            <span className="text-studio-accent/90">{user.role || "创作者"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Usage Stats */}
                      <div className="flex items-center gap-4 text-[10px] text-studio-muted font-mono px-2 py-1 rounded-xl bg-studio-panel border border-studio-border">
                        <div className="flex items-center gap-1" title="已保存项目数">
                          <FolderKanban className="w-3 h-3 text-studio-accent" />
                          <span>{user.savedProjectsCount || 0} 作品</span>
                        </div>
                        <div className="flex items-center gap-1" title="上传私有素材数">
                          <ImageIcon className="w-3 h-3 text-blue-600" />
                          <span>{user.mediaAssetsCount || 0} 素材</span>
                        </div>
                        <div className="flex items-center gap-1" title="AI 生图调用数">
                          <History className="w-3 h-3 text-purple-400" />
                          <span>{user.aiHistoryCount || 0} AI 作画</span>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 self-end md:self-center">
                        {/* Reset Password Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setResetTargetUser(user);
                            setNewPasswordInput("");
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-studio-card/80 hover:bg-studio-card border border-studio-border/60 hover:border-studio-border text-[11px] text-studio-text flex items-center gap-1 transition-colors cursor-pointer"
                          title="重置登录密码"
                        >
                          <Key className="w-3 h-3 text-amber-600" />
                          <span>重设密码</span>
                        </button>

                        {/* Toggle Admin Role (Protected for root admin) */}
                        {!isRootAdmin && (
                          <button
                            type="button"
                            onClick={() => handleToggleAdminRole(user)}
                            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                              user.isAdmin
                                ? "bg-amber-100 border-amber-500/30 text-amber-600 hover:bg-amber-500/25"
                                : "bg-studio-card/80 border-studio-border/60 text-studio-muted hover:text-studio-text"
                            }`}
                            title={user.isAdmin ? "撤销管理员权限" : "赋予管理员权限"}
                          >
                            <Shield className="w-3 h-3" />
                            <span>{user.isAdmin ? "撤销管理" : "设为管理"}</span>
                          </button>
                        )}

                        {/* Ban / Unban Button (Protected for root admin) */}
                        {!isRootAdmin && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user)}
                            className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                              isBanned
                                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/25"
                                : "bg-red-500/15 border-red-500/30 text-red-600 hover:bg-red-500/25"
                            }`}
                            title={isBanned ? "解封账号" : "封禁账号"}
                          >
                            {isBanned ? <UserCheck className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                            <span>{isBanned ? "解封" : "封禁"}</span>
                          </button>
                        )}

                        {/* Delete User (Protected for root admin) */}
                        {!isRootAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 rounded-lg bg-studio-card/80 hover:bg-red-500/20 border border-studio-border/60 hover:border-red-500/30 text-studio-muted hover:text-red-600 transition-colors cursor-pointer"
                            title="注销此创作者账号"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: GLOBAL AI MODEL CONFIGURATION */}
        {activeTab === "ai_config" && (
          <form onSubmit={handleSaveAi} className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Global Notice Banner */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed flex items-start gap-3">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="font-semibold text-amber-600 text-xs mb-1 flex items-center gap-2">
                  <span>全平台统一 AI 图像引擎（OpenAI / image2 兼容协议）</span>
                  {aiConfig?.isConfigured && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                      ✓ 平台已就绪
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-amber-200/80">
                  由管理员在此统一部署 OpenAI / image2 图像大模型配置及 API Key。配置完成后，所有创作者可直接在排版画布与「风格化」面板中一键调用高定海报风格复刻，无需用户自行提供密钥。
                </p>
              </div>
            </div>

            {aiFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
                  aiFeedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                    : "bg-red-500/10 border-red-500/30 text-red-600"
                }`}
              >
                {aiFeedback.type === "success" ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{aiFeedback.text}</span>
              </div>
            )}

            {/* Base URL */}
            <div>
              <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-studio-accent" />
                  API 接口地址 (Base URL) *
                </span>
                <span className="text-[10px] text-studio-muted">支持 OpenAI 官方或本地/中转网关</span>
              </label>
              <input
                type="text"
                required
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full px-3.5 py-2.5 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono placeholder:text-studio-muted/40 focus:outline-none transition-colors"
              />
            </div>

            {/* API Key */}
            <div>
              <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-studio-accent" />
                  API 密钥 (API Key) *
                </span>
                <span className="text-[10px] text-studio-muted">安全加密保存在服务端沙盒</span>
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3.5 py-2.5 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono placeholder:text-studio-muted/40 focus:outline-none transition-colors"
              />
            </div>

            {/* Model Selection & Dynamic Fetching */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-mono text-studio-muted uppercase flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-studio-accent" />
                  <span>图像生成模型名称 (Model) *</span>
                </label>

                {/* Fetch Models Button */}
                <button
                  type="button"
                  id="admin-fetch-models-btn"
                  onClick={handleFetchModels}
                  disabled={isFetchingModels}
                  className="px-2.5 py-1 rounded-lg bg-studio-accent/15 hover:bg-studio-accent/25 border border-studio-accent/40 text-white text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  title="从当前配置的 Base URL 与 API Key 接口拉取支持的模型列表"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isFetchingModels ? "animate-spin text-studio-accent" : ""}`} />
                  <span>{isFetchingModels ? "正在拉取网关模型..." : "⚡ 实时拉取模型列表"}</span>
                </button>
              </div>

              {/* Model Input */}
              <div className="relative">
                <input
                  type="text"
                  required
                  id="admin-model-input"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="输入或从下方拉取并点选模型 (如 image2 / dall-e-3 / flux-pro)"
                  className="w-full pl-3.5 pr-28 py-2.5 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono placeholder:text-studio-muted/40 focus:outline-none transition-colors"
                />
                {model && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-2 py-0.5 rounded bg-studio-accent/20 text-white border border-studio-accent/30 pointer-events-none truncate max-w-[100px]">
                    ✓ {model}
                  </span>
                )}
              </div>

              {/* Filter Search when model count > 6 */}
              {fetchedModels.length > 6 && (
                <div className="relative pt-0.5">
                  <Search className="w-3.5 h-3.5 text-studio-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={modelSearchFilter}
                    onChange={(e) => setModelSearchFilter(e.target.value)}
                    placeholder="按名称过滤模型 (如 dalle, flux, grok)..."
                    className="w-full pl-8 pr-3 py-1.5 bg-studio-card border border-studio-border/60 focus:border-studio-accent rounded-lg text-[11px] text-studio-text placeholder:text-studio-muted/50 focus:outline-none font-mono"
                  />
                </div>
              )}

              {/* Model Cards Selector Grid */}
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[10px] font-mono text-studio-muted">
                  <span>点击快速选用模型 ({fetchedModels.filter(m => !modelSearchFilter || m.toLowerCase().includes(modelSearchFilter.toLowerCase())).length} 个可用)</span>
                  <span>当前激活: <span className="text-studio-accent font-semibold">{model}</span></span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-studio-card rounded-xl border border-studio-border/60">
                  {fetchedModels
                    .filter((m) => !modelSearchFilter || m.toLowerCase().includes(modelSearchFilter.toLowerCase()))
                    .map((mId) => {
                      const isSelected = model.toLowerCase() === mId.toLowerCase();
                      const isImageFocused = ["image", "dall", "flux", "diffusion", "grok", "midjourney", "sd", "draw", "art"].some((k) =>
                        mId.toLowerCase().includes(k)
                      );

                      return (
                        <button
                          key={mId}
                          type="button"
                          onClick={() => setModel(mId)}
                          className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-studio-accent/20 border-studio-accent text-white shadow-sm"
                              : "bg-studio-panel/70 border-studio-border/50 text-studio-muted hover:text-gray-950 hover:border-studio-border"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[11px] font-mono font-semibold truncate ${isSelected ? "text-studio-accent" : ""}`}>
                              {mId}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-studio-accent shrink-0" />}
                          </div>

                          <div className="flex items-center gap-1 mt-1">
                            {isImageFocused && (
                              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-600">
                                图像生图
                              </span>
                            )}
                            <span className="text-[9px] text-studio-muted/70 font-mono truncate">
                              OpenAI 协议
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Aspect Ratio Picker (image2 / chatgpt2api format) */}
            <div>
              <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-studio-accent" />
                  默认尺寸或比例 (Size / Aspect Ratio) *
                </span>
                <span className="text-[10px] text-studio-muted font-mono">适配 image2 协议，支持自动与 8 种画幅比例</span>
              </label>

              {/* 8 Wireframe Ratio Buttons matching chatgpt2api */}
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 p-2 bg-studio-card rounded-2xl border border-studio-border/70">
                {IMAGE_RATIOS.map((r) => {
                  const isSelected = (size || "auto") === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSize(r.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-studio-accent/20 border-studio-accent text-white shadow-sm"
                          : "bg-studio-panel/80 border-studio-border/60 text-studio-muted hover:text-gray-950 hover:border-studio-border"
                      }`}
                      title={`${r.label} - ${r.desc}`}
                    >
                      {/* Wireframe Rect Icon */}
                      <div className="w-7 h-7 flex items-center justify-center">
                        {r.isAuto ? (
                          <div
                            className={`w-6 h-6 rounded border-2 border-dashed flex items-center justify-center text-[9px] font-mono font-bold ${
                              isSelected ? "border-studio-accent text-studio-accent" : "border-studio-muted/70 text-studio-muted"
                            }`}
                          >
                            Auto
                          </div>
                        ) : (
                          <div
                            className={`rounded-sm border-2 ${
                              isSelected ? "border-studio-accent bg-studio-accent/20" : "border-studio-muted/70 bg-transparent"
                            } text-white`}
                            style={{ width: r.iconW, height: r.iconH }}
                          />
                        )}
                      </div>
                      <span className="text-[11px] font-mono tracking-tight">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-studio-border/60 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={isTestingAi || !apiKey}
                onClick={handleTestAi}
                className="text-xs py-2.5 px-4 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingAi ? "animate-spin text-studio-accent" : ""}`} />
                <span>{isTestingAi ? "正在连通测试..." : "测试 API 连通性"}</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="text-xs py-2.5 px-3 cursor-pointer"
                >
                  关闭
                </Button>
                <Button
                  type="submit"
                  variant="accent"
                  disabled={isSavingAi}
                  className="text-xs py-2.5 px-5 font-semibold shadow-subtle-glow flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingAi ? "正在保存..." : "保存全平台配置"}</span>
                </Button>
              </div>
            </div>
          </form>
        )}


        {/* Tab 3: STYLE TEMPLATES MANAGEMENT */}
        {activeTab === "styles" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Feedback Alert */}
            {styleFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-fadeIn ${
                  styleFeedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                    : "bg-red-500/10 border-red-500/30 text-red-600"
                }`}
              >
                <div className="flex items-center gap-2">
                  {styleFeedback.type === "success" ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{styleFeedback.text}</span>
                </div>
                <button
                  onClick={() => setStyleFeedback(null)}
                  className="text-studio-muted hover:text-studio-text p-1 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Metrics Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-studio-card border border-studio-border/70 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-studio-muted font-mono">全部风格模板</div>
                  <div className="text-base font-bold text-studio-text font-mono">
                    {aiStyles.length}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-studio-card border border-studio-border/70 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-studio-muted font-mono">开启展示（用户可见）</div>
                  <div className="text-base font-bold text-emerald-600 font-mono">
                    {aiStyles.filter((s) => s.enabled !== false).length}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-studio-card border border-studio-border/70 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-500/15 text-studio-muted flex items-center justify-center">
                  <EyeOff className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-studio-muted font-mono">已停用（用户隐藏）</div>
                  <div className="text-base font-bold text-studio-muted font-mono">
                    {aiStyles.filter((s) => s.enabled === false).length}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-studio-card border border-studio-border/70 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[11px] text-studio-muted font-mono">官方复刻标杆</div>
                  <div className="text-base font-bold text-amber-600 font-mono truncate">
                    s21 梦幻动态
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Action Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2 flex-1 max-w-lg">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-studio-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={styleSearchQuery}
                    onChange={(e) => setStyleSearchQuery(e.target.value)}
                    placeholder="搜索模板名称 / 英文名 / 标签 / 描述..."
                    className="w-full pl-9 pr-3 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/50 focus:outline-none transition-colors"
                  />
                </div>

                {/* Category select */}
                <select
                  value={styleCategoryFilter}
                  onChange={(e) => setStyleCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-studio-panel border border-studio-border rounded-xl text-xs text-studio-text focus:outline-none cursor-pointer"
                >
                  <option value="all">全部分类</option>
                  {STYLE_CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    setIsRefreshingStyles(true);
                    await fetchAiStyles(true);
                    setIsRefreshingStyles(false);
                  }}
                  disabled={isRefreshingStyles}
                  className="px-3 shrink-0 cursor-pointer"
                  title="刷新模板列表"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStyles ? "animate-spin text-studio-accent" : ""}`} />
                </Button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1 bg-studio-panel p-1 rounded-xl border border-studio-border/60">
                  <button
                    onClick={() => setStyleStatusFilter("all")}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      styleStatusFilter === "all"
                        ? "bg-studio-accent text-white font-semibold"
                        : "text-studio-muted hover:text-gray-950"
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => setStyleStatusFilter("enabled")}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      styleStatusFilter === "enabled"
                        ? "bg-studio-accent text-white font-semibold"
                        : "text-studio-muted hover:text-gray-950"
                    }`}
                  >
                    仅开启
                  </button>
                  <button
                    onClick={() => setStyleStatusFilter("disabled")}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                      styleStatusFilter === "disabled"
                        ? "bg-studio-accent text-white font-semibold"
                        : "text-studio-muted hover:text-gray-950"
                    }`}
                  >
                    仅停用
                  </button>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleResetStyles}
                  className="text-xs text-studio-muted hover:text-amber-600 border-studio-border hover:border-amber-500/40 cursor-pointer"
                  title="恢复为仅保留 s21 开启的默认配置"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  <span>恢复默认</span>
                </Button>


              </div>
            </div>

            {/* Style Templates List */}
            <div className="space-y-3 pb-8">
              {filteredStyles.map((style) => {
                const isEnabled = style.enabled !== false;
                const isCore = style.id === "dreamy_motion_editorial" || style.id === "fantasy_qiqiguaiguai";

                return (
                  <div
                    key={style.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start justify-between gap-4 ${
                      isEnabled
                        ? "bg-studio-card border-studio-border/80 hover:border-studio-border"
                        : "bg-studio-panel/50 border-studio-border/40 opacity-70"
                    }`}
                  >
                    {/* Left: Cover Preview + Main Meta */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Cover Thumbnail Preview */}
                      <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden bg-studio-panel border border-studio-border/80 shrink-0 relative group">
                        {style.coverImage ? (
                          <img
                            src={style.coverImage}
                            alt={style.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : style.previewSvg ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: style.previewSvg }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-studio-muted">
                            <Sparkles className="w-6 h-6 mb-1 text-studio-accent" />
                            <span className="text-[9px] font-mono">无封面</span>
                          </div>
                        )}

                        {style.badge && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-500/90 text-black text-[9px] font-bold font-mono">
                            {style.badge}
                          </div>
                        )}
                      </div>

                      {/* Info & Prompts */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-studio-text tracking-wide">
                            {style.name}
                          </h4>
                          <span className="text-[10px] font-mono text-studio-muted">
                            ({style.enName})
                          </span>

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 border border-studio-border text-studio-muted">
                            {STYLE_CATEGORIES.find((c) => c.id === style.category)?.label || style.category}
                          </span>

                          {isEnabled ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-600 border border-emerald-500/40 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              已开启（创作者可见）
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-studio-panel text-studio-muted border border-gray-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                              已停用（创作者不可见）
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-studio-muted leading-relaxed line-clamp-2">
                          {style.description}
                        </p>

                        {/* Tags */}
                        {Array.isArray(style.tags) && style.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {style.tags.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-studio-panel border border-studio-border text-studio-muted"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Prompt Excerpt */}
                        <div className="text-[10px] font-mono text-studio-muted/70 bg-studio-panel px-2.5 py-1.5 rounded-lg border border-studio-border truncate max-w-2xl">
                          <span className="text-studio-accent/80 font-semibold mr-1">PROMPT:</span>
                          {style.promptTemplate}
                        </div>

                        {/* GitHub Reference Link */}
                        {style.githubUrl && (
                          <div className="pt-0.5 flex items-center gap-2">
                            <a
                              href={style.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-100 text-gray-700 text-[11px] font-mono border border-gray-200 hover:border-gray-400 transition-colors shadow-2xs group/link"
                              title="点击在新窗口打开 GitHub 官方参考仓库"
                            >
                              <GithubIcon className="w-3.5 h-3.5 text-studio-accent" />
                              <span className="font-semibold text-gray-700">参考仓库:</span>
                              <span className="text-gray-700 group-hover/link:text-white truncate max-w-[280px] sm:max-w-[400px]">
                                {style.githubUrl.replace(/^https?:\/\/github\.com\//, "")}
                              </span>
                              <ExternalLink className="w-3 h-3 text-studio-muted group-hover/link:text-studio-accent" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions & Toggle Switch */}
                    <div className="flex md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2.5 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-studio-border">
                      {/* Toggle Enable/Disable Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleStyleStatus(style)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isEnabled
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/25"
                            : "bg-studio-panel border-studio-border text-studio-muted hover:text-studio-text"
                        }`}
                        title={isEnabled ? "点击停用此风格" : "点击开启此风格"}
                      >
                        {isEnabled ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-600" />
                            <span>开启中</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-studio-muted" />
                            <span>已停用</span>
                          </>
                        )}
                      </button>

                      {/* Edit & Delete Action Buttons */}
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleOpenEditStyle(style)}
                          className="text-xs px-2.5 py-1 text-studio-text hover:text-studio-accent border-studio-border cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>编辑</span>
                        </Button>

                        
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredStyles.length === 0 && (
                <div className="p-12 text-center rounded-2xl border border-dashed border-studio-border bg-studio-panel text-studio-muted text-xs">
                  未找到符合条件的风格化模板
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: 备案信息设置（ICP 备案 / 公安部备案号，各自独立开关） */}
        {activeTab === "filing" && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="p-3.5 rounded-xl bg-studio-panel border border-studio-border flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-[11px] text-studio-muted leading-relaxed">
                ICP 备案与公安部备案号各带一个<span className="text-studio-text font-semibold">独立开关</span>：
                开关打开且填写了号码，才会显示在网站页脚；两项互不影响，可只开其中一项，关闭后立刻从页脚隐藏。
              </div>
            </div>

            {filingFeedback && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn ${
                  filingFeedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                    : "bg-red-500/10 border-red-500/30 text-red-600"
                }`}
              >
                {filingFeedback.type === "success" ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{filingFeedback.text}</span>
              </div>
            )}

            {/* 1) ICP 备案设置 */}
            <div className="bg-studio-panel border border-studio-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-studio-border/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-studio-text whitespace-nowrap">ICP 备案设置</div>
                    <div className="text-[10px] text-studio-muted font-mono whitespace-nowrap">MIIT · 工信部网站备案号</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-mono font-semibold ${
                      icpEnabled ? "text-emerald-600" : "text-studio-muted"
                    }`}
                  >
                    {icpEnabled ? "已开启" : "已关闭"}
                  </span>
                  <FilingSwitch checked={icpEnabled} onChange={toggleIcp} label="ICP 备案展示开关" />
                </div>
              </div>

              <div className={`p-4 space-y-3 transition-opacity ${icpEnabled ? "" : "opacity-55"}`}>
                <div>
                  <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                    ICP 备案号
                  </label>
                  <input
                    type="text"
                    value={icpNumber}
                    onChange={(e) => setIcpNumber(e.target.value)}
                    placeholder="京ICP备00000000号"
                    className="w-full px-3 py-2.5 bg-studio-sidebar border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                    备案查询链接
                  </label>
                  <input
                    type="text"
                    value={icpLink}
                    onChange={(e) => setIcpLink(e.target.value)}
                    placeholder="https://beian.miit.gov.cn/"
                    className="w-full px-3 py-2.5 bg-studio-sidebar border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[10px] text-studio-muted whitespace-nowrap">页脚点击备案号将跳转到该链接</span>
                  <Button
                    variant="accent"
                    size="sm"
                    className="cursor-pointer"
                    disabled={filingSaving === "icp"}
                    onClick={() =>
                      persistFiling("icp", { icpEnabled, icpNumber, icpLink }, "ICP 备案信息已保存")
                    }
                  >
                    {filingSaving === "icp" ? "保存中..." : "保存 ICP 备案"}
                  </Button>
                </div>
              </div>
            </div>

            {/* 2) 公安部备案号设置 */}
            <div className="bg-studio-panel border border-studio-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-studio-border/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-studio-text whitespace-nowrap">公安部备案号设置</div>
                    <div className="text-[10px] text-studio-muted font-mono whitespace-nowrap">MPS · 全国互联网安全管理服务平台</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-mono font-semibold ${
                      policeEnabled ? "text-emerald-600" : "text-studio-muted"
                    }`}
                  >
                    {policeEnabled ? "已开启" : "已关闭"}
                  </span>
                  <FilingSwitch checked={policeEnabled} onChange={togglePolice} label="公安部备案展示开关" />
                </div>
              </div>

              <div className={`p-4 space-y-3 transition-opacity ${policeEnabled ? "" : "opacity-55"}`}>
                <div>
                  <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                    公安备案号
                  </label>
                  <input
                    type="text"
                    value={policeNumber}
                    onChange={(e) => setPoliceNumber(e.target.value)}
                    placeholder="京公网安备 11010502000000号"
                    className="w-full px-3 py-2.5 bg-studio-sidebar border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                    备案编号（选填，用于查询跳转）
                  </label>
                  <input
                    type="text"
                    value={policeCode}
                    onChange={(e) => setPoliceCode(e.target.value)}
                    placeholder="11010502000000"
                    className="w-full px-3 py-2.5 bg-studio-sidebar border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                    备案查询链接
                  </label>
                  <input
                    type="text"
                    value={policeLink}
                    onChange={(e) => setPoliceLink(e.target.value)}
                    placeholder="https://beian.mps.gov.cn/#/query/webSearch"
                    className="w-full px-3 py-2.5 bg-studio-sidebar border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="text-[10px] text-studio-muted whitespace-nowrap">
                    与 ICP 备案互不影响，可单独开启 / 关闭
                  </span>
                  <Button
                    variant="accent"
                    size="sm"
                    className="cursor-pointer"
                    disabled={filingSaving === "police"}
                    onClick={() =>
                      persistFiling(
                        "police",
                        { policeEnabled, policeNumber, policeCode, policeLink },
                        "公安部备案信息已保存"
                      )
                    }
                  >
                    {filingSaving === "police" ? "保存中..." : "保存公安备案"}
                  </Button>
                </div>
              </div>
            </div>

            {/* 页脚展示预览 */}
            <div className="bg-studio-panel border border-studio-border rounded-xl p-4 space-y-2.5">
              <div className="text-xs font-semibold text-studio-text flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-studio-muted shrink-0" />
                <span className="whitespace-nowrap">网站页脚展示预览</span>
              </div>
              <div className="rounded-xl border border-studio-border bg-studio-sidebar px-4 py-3 flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono">
                {showIcpInFooter ? (
                  <span className="text-studio-muted">{icpNumber}</span>
                ) : (
                  <span className="text-studio-muted/60">ICP 备案未开启</span>
                )}
                <span className="text-studio-border">|</span>
                {showPoliceInFooter ? (
                  <span className="text-studio-muted">{policeNumber}</span>
                ) : (
                  <span className="text-studio-muted/60">公安部备案未开启</span>
                )}
              </div>
              <p className="text-[10px] text-studio-muted leading-relaxed">
                只有「开关打开 + 已填号码」的备案才会出现在落地页页脚，两个开关彼此独立。
              </p>
            </div>
          </div>
        )}

        {/* Style Edit / Create Sub-Modal */}
        {editingStyle && (
          <div
            className="fixed inset-0 z-60 bg-black/40 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn"
            onClick={() => {
              setEditingStyle(null);
              
            }}
          >
            <div
              className="w-full max-w-2xl bg-studio-sidebar border border-studio-border rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-5 py-4 border-b border-studio-border/80 bg-studio-panel flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-studio-text">
                      {editingStyle ? `编辑风格化模板 · ${editingStyle.name}` : "编辑风格化模板"}
                    </h3>
                    <p className="text-[11px] text-studio-muted">
                      配置风格名称、英文标识、推荐角标、封面图片及 AI 提示词配方
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditingStyle(null);
                    
                  }}
                  className="p-1.5 rounded-lg text-studio-muted hover:text-studio-text hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveStyleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* 1. Basic Info Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                      风格模板名称 *
                    </label>
                    <input
                      type="text"
                      required
                      value={styleName}
                      onChange={(e) => setStyleName(e.target.value)}
                      placeholder="例: s21 · 梦幻动态电影海报"
                      className="w-full px-3 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                      英文标识 / 副标题
                    </label>
                    <input
                      type="text"
                      value={styleEnName}
                      onChange={(e) => setStyleEnName(e.target.value)}
                      placeholder="例: 01 · Dreamy Motion Editorial"
                      className="w-full px-3 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* 2. Category & Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                      风格分类 (内置固定不可更改)
                    </label>
                    <div className="w-full px-3 py-2 bg-studio-panel/60 border border-studio-border rounded-xl text-xs text-studio-muted font-mono flex items-center justify-between">
                      <span className="font-semibold text-studio-text">
                        {STYLE_CATEGORIES.find((c) => c.id === (editingStyle?.category || styleCategory))?.label || styleCategory}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-studio-border text-studio-muted">
                        官方固定
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                      推荐角标
                    </label>
                    <input
                      type="text"
                      value={styleBadge}
                      onChange={(e) => setStyleBadge(e.target.value)}
                      placeholder="例: s21 顶荐, 新上架, 热门"
                      className="w-full px-3 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                      排序序号
                    </label>
                    <input
                      type="number"
                      value={styleOrder}
                      onChange={(e) => setStyleOrder(Number(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* 3. Cover Image Management */}
                <div className="p-3.5 rounded-2xl bg-studio-card border border-studio-border/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-studio-text">风格封面设置</h4>
                      <p className="text-[10px] text-studio-muted">
                        支持上传本地图片文件（自动生成预览），或填入图片 URL / 矢量 SVG 代码
                      </p>
                    </div>

                    {styleCoverImage && (
                      <button
                        type="button"
                        onClick={() => setStyleCoverImage("")}
                        className="text-[10px] text-red-600 hover:underline cursor-pointer"
                      >
                        清除已上传封面
                      </button>
                    )}
                  </div>

                  <div className="flex items-start gap-3">
                    {/* Live Thumbnail Box */}
                    <div className="w-20 h-28 rounded-xl bg-studio-panel border border-studio-border overflow-hidden shrink-0 flex items-center justify-center relative">
                      {styleCoverImage ? (
                        <img src={styleCoverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                      ) : stylePreviewSvg ? (
                        <div dangerouslySetInnerHTML={{ __html: stylePreviewSvg }} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-2 text-studio-muted">
                          <ImageIcon className="w-5 h-5 mx-auto mb-1 opacity-50" />
                          <span className="text-[9px]">默认封面</span>
                        </div>
                      )}
                    </div>

                    {/* Upload button & URL input */}
                    <div className="flex-1 space-y-2">
                      <div>
                        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-studio-panel hover:bg-studio-hover border border-gray-200 text-xs text-gray-700 font-medium cursor-pointer shadow-xs transition-colors">
                          <Upload className="w-3.5 h-3.5 text-studio-accent" />
                          <span>上传自定义封面图片文件 (PNG / JPG / WEBP)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={styleCoverImage.startsWith("data:") ? "[已上传本地图片文件 Base64]" : styleCoverImage}
                          onChange={(e) => setStyleCoverImage(e.target.value)}
                          placeholder="或直接输入图片 URL 地址..."
                          className="w-full px-3 py-1.5 bg-studio-panel border border-studio-border rounded-lg text-xs text-studio-text font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* GitHub Reference Repo URL */}
                <div>
                  <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <GithubIcon className="w-3.5 h-3.5 text-studio-accent" />
                      <span className="font-semibold text-studio-text">风格化参考 GitHub 仓库地址 (GitHub URL)</span>
                    </span>
                    <span className="text-[10px] text-studio-muted">可选，保存开源规范与参考仓库以防丢失</span>
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={styleGithubUrl}
                      onChange={(e) => setStyleGithubUrl(e.target.value)}
                      placeholder="例: https://github.com/dacnay816y62-hub/fantasy-qiqiguaiguai-skill"
                      className="w-full pl-3.5 pr-24 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono placeholder:text-studio-muted/40 focus:outline-none"
                    />
                    {styleGithubUrl && (
                      <a
                        href={styleGithubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-100 text-studio-accent text-[11px] font-mono border border-gray-200 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="测试在新标签页打开"
                      >
                        <span>测试打开</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* 4. Description */}
                <div>
                  <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                    风格详细介绍 *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={styleDescription}
                    onChange={(e) => setStyleDescription(e.target.value)}
                    placeholder="简述该风格的视觉特征、留白比例、动态拖影或艺术排版特色..."
                    className="w-full px-3 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text leading-relaxed focus:outline-none"
                  />
                </div>

                {/* 5. Prompt Template */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-mono text-studio-muted uppercase">
                      AI 提示词配方模板 (PROMPT TEMPLATE) *
                    </label>
                    <span className="text-[10px] font-mono text-studio-accent">
                      支持插槽: {"{moodNotes}"}, {"{textInstruction}"}
                    </span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={stylePromptTemplate}
                    onChange={(e) => setStylePromptTemplate(e.target.value)}
                    placeholder="输入发送给 AI 大模型的艺术风格引导提示词..."
                    className="w-full px-3 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono leading-relaxed focus:outline-none"
                  />
                </div>

                {/* 6. Negative Prompt */}
                <div>
                  <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                    负向提示词 (NEGATIVE PROMPT)
                  </label>
                  <textarea
                    rows={2}
                    value={styleNegativePrompt}
                    onChange={(e) => setStyleNegativePrompt(e.target.value)}
                    placeholder="例: distorted faces, ugly fingers, excessive fog, watermark..."
                    className="w-full px-3 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono leading-relaxed focus:outline-none"
                  />
                </div>

                {/* 7. Tags & Enabled Switch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                      风格标签 (逗号分隔)
                    </label>
                    <input
                      type="text"
                      value={styleTagsInput}
                      onChange={(e) => setStyleTagsInput(e.target.value)}
                      placeholder="例: 慢门拖影, 动态留白, 电影质感"
                      className="w-full px-3 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-studio-panel border border-studio-border">
                    <div>
                      <div className="text-xs font-semibold text-studio-text">模板展示状态</div>
                      <div className="text-[10px] text-studio-muted">
                        {styleEnabled ? "创作者在创作界面可见并可用" : "隐藏状态，创作者不可见"}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setStyleEnabled(!styleEnabled)}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        styleEnabled
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/25"
                          : "bg-studio-card border-studio-border text-studio-muted hover:text-studio-text"
                      }`}
                    >
                      {styleEnabled ? <ToggleRight className="w-4 h-4 text-emerald-600" /> : <ToggleLeft className="w-4 h-4" />}
                      <span>{styleEnabled ? "开启" : "关闭"}</span>
                    </button>
                  </div>
                </div>

                {/* Submit / Cancel Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-studio-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingStyle(null);
                      
                    }}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    variant="accent"
                    size="sm"
                    disabled={isSavingStyle || !styleName.trim()}
                    className="cursor-pointer shadow-subtle-glow"
                  >
                    {isSavingStyle ? "保存中..." : "保存风格模板"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reset Password Modal Sub-dialog */}
        {resetTargetUser && (
          <div
            className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setResetTargetUser(null)}
          >
            <div
              className="w-full max-w-md bg-studio-panel border border-studio-border rounded-2xl p-5 shadow-2xl space-y-4 animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-studio-border/60">
                <div className="text-xs font-semibold text-studio-text flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-600" />
                  <span>重置「{resetTargetUser.name}」的登录密码</span>
                </div>
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="text-studio-muted hover:text-studio-text"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConfirmResetPassword} className="space-y-3">
                <div className="text-[11px] text-studio-muted">
                  账号: <span className="font-mono text-studio-text">@{resetTargetUser.username}</span>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                    输入新密码 *
                  </label>
                  <input
                    type="text"
                    required
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="输入新密码 (至少 4 位字符)"
                    className="w-full px-3 py-2.5 bg-studio-sidebar border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setResetTargetUser(null)}
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    variant="accent"
                    size="sm"
                    disabled={isResetting || !newPasswordInput.trim()}
                    className="cursor-pointer"
                  >
                    {isResetting ? "重置中..." : "确认重置"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
            {/* CUSTOM IN-APP CONFIRMATION DIALOG (MARGINLAB SYSTEM THEMED) */}
        {confirmDialog && (
          <div
            className="fixed inset-0 z-70 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn select-none"
            onClick={() => setConfirmDialog(null)}
          >
            <div
              className="bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleIn ring-1 ring-black/5 dark:ring-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    confirmDialog.confirmVariant === "danger"
                      ? "bg-red-500/15 border-red-500/30 text-red-600"
                      : "bg-amber-100 border-amber-500/30 text-amber-600 dark:text-amber-400"
                  }`}
                >
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {confirmDialog.title}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                    {confirmDialog.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-white dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const action = confirmDialog.onConfirm;
                    setConfirmDialog(null);
                    action();
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
                    confirmDialog.confirmVariant === "danger"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-white"
                  }`}
                >
                  {confirmDialog.confirmLabel || "确认执行"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};
