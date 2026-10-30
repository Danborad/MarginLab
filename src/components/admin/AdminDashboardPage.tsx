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
} from "lucide-react";
import { AvatarView } from "../ui/AvatarView";
import { WebsiteLogo } from "../ui/WebsiteLogo";
import { stripEmoji } from "../../lib/utils";
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

type AdminSection = "dashboard" | "users" | "styles" | "models" | "settings";

const SECTIONS: { id: AdminSection; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "dashboard", label: "数据概览", icon: LayoutDashboard, desc: "平台核心指标" },
  { id: "users", label: "用户与资源", icon: Users, desc: "账号 · 积分 · 存储" },
  { id: "styles", label: "模板与风格", icon: Palette, desc: "风格库全生命周期" },
  { id: "models", label: "AI 模型网关", icon: Cpu, desc: "接口密钥与计费" },
  { id: "settings", label: "全局规则设置", icon: Settings, desc: "积分 · 存储 · 站点" },
];

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

  // 支持 /admin?tab=users / ai_config / styles / filing / email 直接落到对应页
  const initialSection = (() => {
    try {
      const t = new URLSearchParams(window.location.search).get("tab") || "";
      const map: Record<string, AdminSection> = {
        users: "users",
        ai_config: "models",
        styles: "styles",
        filing: "settings",
        email: "settings",
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
    fetchAiConfig().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, currentUser?.isAdmin]);

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

          {/* ── 模板与风格 ── */}
          {section === "styles" && (
            <div className="space-y-3">
              <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold text-studio-text">风格库总览</h2>
                  <p className="text-[11px] text-studio-muted mt-0.5">
                    共 {aiStyles.length} 款 · 已上架 {aiStyles.filter((s) => s.enabled !== false).length} 款
                  </p>
                </div>
                <button
                  onClick={() => useEditorStore.getState().setAdminModalOpen(true, "styles")}
                  className="px-3 py-1.5 rounded-xl btn-aurora text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  打开完整风格管理
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {aiStyles.slice(0, 30).map((s) => (
                  <div
                    key={s.id}
                    className="glass-panel rounded-xl overflow-hidden group hover-aurora"
                  >
                    <div className="aspect-[3/4] bg-studio-panel overflow-hidden">
                      {s.coverImage ? (
                        <img
                          src={s.coverImage}
                          alt={s.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-studio-dim">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-[11px] font-bold text-studio-text truncate">{s.name}</p>
                      <p className="text-[10px] text-studio-dim truncate">{s.enName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AI 模型网关 ── */}
          {section === "models" && (
            <div className="space-y-3">
              <div className="glass-panel rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-4 h-4 text-violet-400" />
                  <h2 className="text-xs font-bold text-studio-text">当前接入模型</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/5 border border-studio-border">
                    <p className="text-[10px] text-studio-dim mb-0.5">Base URL</p>
                    <p className="font-mono text-studio-text truncate">{aiConfig?.baseUrl || "—"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-studio-border">
                    <p className="text-[10px] text-studio-dim mb-0.5">模型</p>
                    <p className="font-mono text-studio-text truncate">{aiConfig?.model || "—"}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-studio-border">
                    <p className="text-[10px] text-studio-dim mb-0.5">API Key</p>
                    <p className="font-mono text-studio-text truncate">
                      {aiConfig?.apiKey ? `${aiConfig.apiKey.slice(0, 8)}••••` : "未配置"}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-studio-border">
                    <p className="text-[10px] text-studio-dim mb-0.5">状态</p>
                    <p
                      className={`font-bold ${
                        aiConfig?.apiKey ? "text-emerald-300" : "text-amber-300"
                      }`}
                    >
                      {aiConfig?.apiKey ? "已连通配置" : "待配置"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => useEditorStore.getState().setAdminModalOpen(true, "ai_config")}
                  className="mt-3 px-3 py-1.5 rounded-xl btn-aurora text-xs font-bold cursor-pointer"
                >
                  打开完整模型配置
                </button>
              </div>
            </div>
          )}

          {/* ── 全局规则设置 ── */}
          {section === "settings" && (
            <div className="space-y-3 max-w-3xl">
              <div className="glass-panel rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Settings className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-xs font-bold text-studio-text">积分与存储全局默认值</h2>
                </div>
                {sysCfg ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: "registerPoints", label: "新用户注册赠送积分", unit: "分" },
                      { key: "checkInPoints", label: "每日签到赠送积分", unit: "分" },
                      { key: "costPerImage", label: "单张图片生成消耗", unit: "分" },
                      { key: "defaultStorageGB", label: "新用户默认存储空间", unit: "GB" },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="text-[11px] font-semibold text-studio-muted block mb-1 whitespace-nowrap">
                          {f.label}（{f.unit}）
                        </label>
                        <input
                          type="number"
                          value={sysCfg[f.key] ?? ""}
                          onChange={(e) =>
                            setSysCfg({ ...sysCfg, [f.key]: e.target.value === "" ? "" : Number(e.target.value) })
                          }
                          className="w-full input-dark px-3 py-2 text-xs font-mono"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-studio-muted">加载中…</p>
                )}
                <button
                  onClick={saveSysConfig}
                  disabled={cfgSaving || !sysCfg}
                  className="mt-3 px-4 py-2 rounded-xl btn-aurora text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {cfgSaving ? "保存中…" : "保存全局规则"}
                </button>
              </div>

              <div className="glass-panel rounded-2xl p-4">
                <h2 className="text-xs font-bold text-studio-text mb-2">站点与备案</h2>
                <p className="text-[11px] text-studio-muted mb-3">
                  ICP 备案号、公安备案号、发信邮箱等配置，请前往「完整控制台」对应页签设置。
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => useEditorStore.getState().setAdminModalOpen(true, "filing")}
                    className="px-3 py-1.5 rounded-xl btn-glass text-xs font-semibold cursor-pointer"
                  >
                    备案设置
                  </button>
                  <button
                    onClick={() => useEditorStore.getState().setAdminModalOpen(true, "email")}
                    className="px-3 py-1.5 rounded-xl btn-glass text-xs font-semibold cursor-pointer"
                  >
                    发信与邮箱
                  </button>
                </div>
              </div>
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
    </div>
  );
};

export default AdminDashboardPage;
