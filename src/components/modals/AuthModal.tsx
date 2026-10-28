import React, { useState, useEffect } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { AvatarView } from "../ui/AvatarView";
import {
  X,
  Check,
  ShieldCheck,
  FolderOpen,
  Image as ImageIcon,
  LayoutTemplate,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  KeyRound,
  User,
  AlertCircle,
  Crown,
  Upload,
  Coins,
  HardDrive,
} from "lucide-react";
import { Button } from "../ui/Button";

export const AuthModal: React.FC = () => {
  const authModalOpen = useEditorStore((s) => s.authModalOpen || s.userAccountModalOpen);
  const authModalTab = useEditorStore((s) => s.authModalTab);
  const setAuthModalOpen = useEditorStore((s) => s.setAuthModalOpen);
  const setAdminModalOpen = useEditorStore((s) => s.setAdminModalOpen);
  const currentUser = useEditorStore((s) => s.currentUser);
  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
  const navigateToHomeAuth = useEditorStore((s) => s.navigateToHomeAuth);

  const logout = useEditorStore((s) => s.logout);
  const updateUserProfile = useEditorStore((s) => s.updateUserProfile);
  const changePassword = useEditorStore((s) => s.changePassword);

  const userAssets = useEditorStore((s) => s.userAssets);
  const uploadAvatar = useEditorStore((s) => s.uploadAvatar);
  const fetchUserAssets = useEditorStore((s) => s.fetchUserAssets);

  const savedProjects = useEditorStore((s) => s.savedProjects);
  const customTemplates = useEditorStore((s) => s.customTemplates);
  const mediaAssets = useEditorStore((s) => s.mediaAssets);

  const [tab, setTab] = useState<"profile" | "changePassword">(
    authModalTab === "changePassword" ? "changePassword" : "profile"
  );

  useEffect(() => {
    if (authModalOpen && isAuthenticated) fetchUserAssets().catch(() => {});
  }, [authModalOpen, isAuthenticated, fetchUserAssets]);

  useEffect(() => {
    if (authModalTab === "changePassword") {
      setTab("changePassword");
    } else {
      setTab("profile");
    }
  }, [authModalTab, authModalOpen]);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // Change Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");

  useEffect(() => {
    if (currentUser) {
      setEditName(currentUser.name || "");
      setEditRole(currentUser.role || "创作者");
      setEditBio(currentUser.bio || "");
      setEditAvatar(currentUser.avatar || "🎨");
    }
  }, [currentUser]);

  if (!authModalOpen || !isAuthenticated || !currentUser) {
    return null;
  }

  /** 上传自定义头像：居中裁方形 256px → 上传 → 刷新全局头像 */
  const handleAvatarFile = async (file: File) => {
    setAvatarError("");
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      setAvatarError("仅支持 JPG / PNG / WebP");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setAvatarError("图片不能超过 8MB");
      return;
    }
    setAvatarUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("读取失败"));
        reader.readAsDataURL(file);
      });
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error("图片解析失败"));
        i.src = dataUrl;
      });
      const size = 256;
      const side = Math.min(img.width, img.height);
      const sx = (img.width - side) / 2;
      const sy = (img.height - side) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("画布不可用");
      ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
      const out = canvas.toDataURL("image/jpeg", 0.9);
      const res = await uploadAvatar(out);
      if (res.success) {
        setEditAvatar(res.message ? "" : "");
        setProfileMsg("头像已更新");
        setTimeout(() => setProfileMsg(""), 2000);
      } else {
        setAvatarError(res.message);
      }
    } catch (err: any) {
      setAvatarError(err.message || "头像上传失败");
    } finally {
      setAvatarUploading(false);
    }
  };

  // Handle Profile Update Submit
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    const res = await updateUserProfile({
      name: editName.trim(),
      role: editRole.trim() || "创作者",
      bio: editBio.trim(),
      avatar: editAvatar,
    });
    if (res.success) {
      setProfileMsg("资料已保存！");
      setIsEditingProfile(false);
      setTimeout(() => setProfileMsg(""), 2000);
    }
  };

  // Handle Change Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (!oldPassword.trim()) {
      setPassError("请输入当前原密码");
      return;
    }
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      setPassError("新密码长度至少 4 位");
      return;
    }
    if (newPassword.trim() !== confirmNewPassword.trim()) {
      setPassError("两次输入的新密码不一致");
      return;
    }

    const res = await changePassword(oldPassword.trim(), newPassword.trim());
    if (res.success) {
      setPassSuccess(res.message);
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setTab("profile"), 1500);
    } else {
      setPassError(res.message);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn"
      onClick={() => setAuthModalOpen(false)}
    >
      <div
        className="bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-2xl w-[95vw] max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] ring-1 ring-black/5 dark:ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-4.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-stone-800 to-stone-700 flex items-center justify-center text-amber-300 border border-amber-500/40 shadow-sm text-xl">
              <AvatarView avatar={currentUser.avatar} size="lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wider text-zinc-900 dark:text-zinc-100">
                  {tab === "changePassword"
                    ? "安全中心 • 修改登录密码"
                    : "个人中心与账号设置"}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  独立沙盒加密
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                当前登录：
                <span className="text-amber-700 dark:text-amber-400 font-bold">{currentUser.name}</span>
                <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 ml-1">
                  (@{currentUser.username})
                </span>{" "}
                • 素材库与作品库严格私有隔离
              </p>
            </div>
          </div>

          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/60 px-3 sm:px-4 pt-2 gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTab("profile")}
              className={`pb-2.5 px-3 text-xs flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                tab === "profile"
                  ? "border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-300 font-bold"
                  : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>个人中心 ({currentUser.name.split(" ")[0]})</span>
            </button>
            <button
              onClick={() => setTab("changePassword")}
              className={`pb-2.5 px-3 text-xs flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                tab === "changePassword"
                  ? "border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-300 font-bold"
                  : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>修改密码</span>
            </button>
          </div>

          <button
            onClick={() => {
              setAuthModalOpen(false);
              navigateToHomeAuth("login");
            }}
            className="pb-2.5 px-2.5 text-xs flex items-center gap-1.5 text-zinc-500 hover:text-amber-700 dark:hover:text-amber-400 font-medium transition-colors cursor-pointer"
            title="前往首页切换其他账号登录"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>切换其他账号</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* TAB 1: PROFILE & DASHBOARD */}
          {tab === "profile" && (
            <div className="space-y-4 max-w-lg mx-auto py-1">
              {profileMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{profileMsg}</span>
                </div>
              )}

              {avatarError && (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{avatarError}</span>
                </div>
              )}

              {/* User Card */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <label
                      className="relative w-12 h-12 rounded-full bg-white dark:bg-zinc-800 border border-amber-500/40 flex items-center justify-center text-2xl shadow-xs overflow-hidden cursor-pointer group shrink-0"
                      title="点击上传自定义头像（JPG/PNG/WebP）"
                    >
                      <AvatarView avatar={currentUser.avatar} size="xl" />
                      <span className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                        <Upload className="w-3.5 h-3.5" />
                        <span className="text-[8px] font-bold mt-0.5">
                          {avatarUploading ? "上传中" : "更换"}
                        </span>
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={avatarUploading}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleAvatarFile(f);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {currentUser.name}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold">
                          登录中
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-amber-700 dark:text-amber-400 mt-0.5 font-medium">
                        @{currentUser.username}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline font-mono px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 cursor-pointer"
                  >
                    {isEditingProfile ? "取消编辑" : "编辑资料"}
                  </button>
                </div>

                {/* Edit Form */}
                {isEditingProfile ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                        昵称
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-xs text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                        创作者头衔
                      </label>
                      <input
                        type="text"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-xs text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                        创作者简介
                      </label>
                      <input
                        type="text"
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-xs text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button type="submit" variant="accent" size="sm" className="flex-1 text-xs font-bold">
                        保存资料
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingProfile(false)}
                      >
                        取消
                      </Button>
                    </div>
                  </form>
                ) : (
                  currentUser.bio && (
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed italic bg-white/70 dark:bg-zinc-800/50 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      "{currentUser.bio}"
                    </p>
                  )
                )}

                {/* Storage Isolation Overview */}
                <div className="space-y-2 pt-2">
                  {/* 积分 & 云存储（2026-10 重构） */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600">
                      <div className="flex items-center gap-1 mb-1">
                        <Coins className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                          算力积分
                        </span>
                      </div>
                      <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {userAssets?.points ?? 0}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600">
                      <div className="flex items-center justify-between mb-1">
                        <span className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                          <HardDrive className="w-3.5 h-3.5" />
                          云存储
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                          {((userAssets?.storageUsed || 0) / 1073741824).toFixed(2)}G /
                          {((userAssets?.storageQuota || 0) / 1073741824).toFixed(1)}G
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (userAssets?.storagePercent || 0) >= 90 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(100, userAssets?.storagePercent || 0)}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[9px] text-zinc-500 dark:text-zinc-400">
                        已用 {userAssets?.storagePercent ?? 0}%
                        {(userAssets?.storagePercent || 0) >= 90 ? " · 空间紧张" : ""}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block font-bold">
                    当前账号专属私有资产统计
                  </span>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600">
                      <ImageIcon className="w-4 h-4 mx-auto text-amber-600 dark:text-amber-400 mb-1" />
                      <div className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        {mediaAssets.length}
                      </div>
                      <div className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400">私有素材</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600">
                      <FolderOpen className="w-4 h-4 mx-auto text-amber-600 dark:text-amber-400 mb-1" />
                      <div className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        {savedProjects.length}
                      </div>
                      <div className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400">已存画作</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600">
                      <LayoutTemplate className="w-4 h-4 mx-auto text-amber-600 dark:text-amber-400 mb-1" />
                      <div className="text-sm font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        {customTemplates.length}
                      </div>
                      <div className="text-[9px] font-mono text-zinc-500 dark:text-zinc-400">自制模板</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-600 text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed space-y-1">
                  <div className="text-zinc-900 dark:text-zinc-100 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>独立沙盒隔离机制</span>
                  </div>
                  <p className="text-[10px]">
                    您上传的图片、保存的画作与模板仅对当前账号 (@{currentUser.username}) 可见并加密保存在本地独立命名空间中。退出登录后他人无法访问。
                  </p>
                </div>

                {/* Admin Special Entry */}
                {currentUser.isAdmin && (
                  <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-amber-800 dark:text-amber-300">管理员管控权限已激活</div>
                        <div className="text-[10px] text-amber-700/80 dark:text-amber-200/70">可封禁/解封创作者账号、重设密码及配置全局大模型</div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="accent"
                      size="sm"
                      onClick={() => {
                        setAuthModalOpen(false);
                        setAdminModalOpen(true, "users");
                      }}
                      className="text-[11px] py-1.5 px-3 shadow-xs shrink-0 cursor-pointer font-bold"
                    >
                      进入管理后台
                    </Button>
                  </div>
                )}

                {/* Account Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTab("changePassword")}
                    className="py-2.5 px-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>修改登录密码</span>
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      setAuthModalOpen(false);
                      await logout();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-white dark:bg-zinc-800 hover:bg-red-500/10 border border-zinc-300 dark:border-zinc-600 hover:border-red-500/30 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="直接退出当前登录并返回首页"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-500" />
                    <span>退出当前登录</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CHANGE PASSWORD */}
          {tab === "changePassword" && (
            <div className="space-y-4 max-w-md mx-auto py-2">
              <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
                {passError && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{passError}</span>
                  </div>
                )}
                {passSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{passSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                    当前原密码
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="请输入当前账号原密码"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                    新密码
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      placeholder="至少 4 位字符"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 pr-10 py-2.5 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                    确认新密码
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="再次输入新密码"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    variant="accent"
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-white shadow-sm"
                  >
                    确认修改密码
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setTab("profile")}
                    className="text-xs font-semibold"
                  >
                    返回个人中心
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-mono">
              当前账号：{currentUser.name} (@{currentUser.username})
            </span>
          </div>
          <Button
            variant="accent"
            size="sm"
            onClick={() => setAuthModalOpen(false)}
            className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-white px-3 py-1.5 rounded-lg"
          >
            完成
          </Button>
        </div>
      </div>
    </div>
  );
};
