import React, { useState, useEffect } from "react";
import { useEditorStore, AuthTab } from "../../store/useEditorStore";
import { generateCaptchaCode, drawCaptchaCanvas } from "../../lib/captcha";
import { AvatarPicker } from "../ui/AvatarPicker";
import { AvatarView } from "../ui/AvatarView";
import {
  X,
  Check,
  ShieldCheck,
  FolderOpen,
  Image as ImageIcon,
  LayoutTemplate,
  ArrowRight,
  UserPlus,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  KeyRound,
  User,
  AlertCircle,
  RefreshCw,
  Crown,
  Mail,
} from "lucide-react";
import { Button } from "../ui/Button";

const AVATAR_OPTIONS = ["🎨", "📷", "✨", "🌿", "☕", "🏛️", "🎞️", "🌸", "⚡", "💎", "🪐", "🎬"];

export const AuthModal: React.FC = () => {
  const authModalOpen = useEditorStore((s) => s.authModalOpen || s.userAccountModalOpen);
  const authModalTab = useEditorStore((s) => s.authModalTab);
  const setAuthModalOpen = useEditorStore((s) => s.setAuthModalOpen);
  const setAdminModalOpen = useEditorStore((s) => s.setAdminModalOpen);
  const currentUser = useEditorStore((s) => s.currentUser);
  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
  const themeMode = useEditorStore((s) => s.themeMode);

  const login = useEditorStore((s) => s.login);
  const register = useEditorStore((s) => s.register);
  const sendVerificationCode = useEditorStore((s) => s.sendVerificationCode);
  const publicEmailConfig = useEditorStore((s) => s.publicEmailConfig);
  const fetchPublicEmailConfig = useEditorStore((s) => s.fetchPublicEmailConfig);
  const logout = useEditorStore((s) => s.logout);
  const updateUserProfile = useEditorStore((s) => s.updateUserProfile);
  const changePassword = useEditorStore((s) => s.changePassword);

  const savedProjects = useEditorStore((s) => s.savedProjects);
  const customTemplates = useEditorStore((s) => s.customTemplates);
  const mediaAssets = useEditorStore((s) => s.mediaAssets);

  // Active Tab state
  const [tab, setTab] = useState<AuthTab>(
    authModalTab || (isAuthenticated ? "profile" : "login")
  );

  useEffect(() => {
    if (authModalTab) {
      setTab(authModalTab);
    } else {
      setTab(isAuthenticated ? "profile" : "login");
    }
  }, [authModalTab, authModalOpen, isAuthenticated]);

  // Login Form State
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register Form State & Captcha
  const [regEmail, setRegEmail] = useState("");
  const [regEmailCode, setRegEmailCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regAvatar, setRegAvatar] = useState(AVATAR_OPTIONS[0]);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regCaptcha, setRegCaptcha] = useState("");
  const [captchaCode, setCaptchaCode] = useState(() => generateCaptchaCode(4));
  const captchaCanvasRef = React.useRef<HTMLCanvasElement>(null);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const refreshCaptcha = React.useCallback(() => {
    const newCode = generateCaptchaCode(4);
    setCaptchaCode(newCode);
    if (captchaCanvasRef.current) {
      drawCaptchaCanvas(captchaCanvasRef.current, newCode, themeMode);
    }
  }, [themeMode]);

  React.useEffect(() => {
    if (tab === "register" && captchaCanvasRef.current) {
      drawCaptchaCanvas(captchaCanvasRef.current, captchaCode, themeMode);
    }
  }, [tab, captchaCode, themeMode]);

  useEffect(() => {
    if (authModalOpen) {
      fetchPublicEmailConfig();
    }
  }, [authModalOpen]);

  useEffect(() => {
    if (emailCooldown <= 0) return;
    const timer = setInterval(() => {
      setEmailCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCooldown]);

  const emailDomain = regEmail.includes("@") ? regEmail.split("@")[1].trim().toLowerCase() : "";
  const isEmailDomainValid =
    !publicEmailConfig.whitelistEnabled ||
    !publicEmailConfig.whitelistDomains?.length ||
    !emailDomain ||
    publicEmailConfig.whitelistDomains.includes(emailDomain);

  const handleSendEmailCode = async () => {
    setRegError("");
    setRegSuccess("");
    const cleanEmail = regEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setRegError("请先输入注册电子邮箱");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setRegError("请输入格式正确的电子邮箱（如 creator@163.com）");
      return;
    }
    const domain = cleanEmail.split("@")[1];
    if (publicEmailConfig.whitelistEnabled && publicEmailConfig.whitelistDomains?.length) {
      const allowed = publicEmailConfig.whitelistDomains.some(
        (d) => d && d.trim().toLowerCase() === domain
      );
      if (!allowed) {
        setRegError(`邮箱域名 @${domain} 未在允许注册名单内。目前仅支持日常常用邮箱（如 QQ、163、Gmail、Outlook 等）`);
        return;
      }
    }

    setIsSendingCode(true);
    const res = await sendVerificationCode(cleanEmail, "register");
    setIsSendingCode(false);

    if (res.success) {
      setRegSuccess(res.message);
      setEmailCooldown(60);
    } else {
      setRegError(res.message);
    }
  };

  // Profile Edit State
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");

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
      setEditRole(currentUser.role || "");
      setEditBio(currentUser.bio || "");
      setEditAvatar(currentUser.avatar || AVATAR_OPTIONS[0]);
    }
  }, [currentUser]);

  if (!authModalOpen) return null;

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccess("");
    if (!loginUsername.trim()) {
      setLoginError("请输入登录账号 / 用户名");
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError("请输入登录密码");
      return;
    }

    setIsLoggingIn(true);
    const res = await login(loginUsername.trim(), loginPassword.trim());
    setIsLoggingIn(false);

    if (res.success) {
      setLoginSuccess(res.message);
      setTimeout(() => {
        setAuthModalOpen(false);
        setLoginUsername("");
        setLoginPassword("");
        setLoginSuccess("");
      }, 700);
    } else {
      setLoginError(res.message);
    }
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    const cleanEmail = regEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setRegError("请输入注册电子邮箱");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setRegError("请输入有效的电子邮箱地址");
      return;
    }

    const domain = cleanEmail.split("@")[1];
    if (publicEmailConfig.whitelistEnabled && publicEmailConfig.whitelistDomains?.length) {
      const allowed = publicEmailConfig.whitelistDomains.some(
        (d) => d && d.trim().toLowerCase() === domain
      );
      if (!allowed) {
        setRegError(`邮箱域名 @${domain} 未在允许注册名单内。目前仅支持日常常用邮箱（如 QQ、163、Gmail、Outlook 等）`);
        return;
      }
    }

    if (publicEmailConfig.enabled && !regEmailCode.trim()) {
      setRegError("请输入收到的 6 位邮箱验证码");
      return;
    }

    if (!regPassword.trim() || regPassword.trim().length < 4) {
      setRegError("密码长度至少 4 位");
      return;
    }
    if (regPassword.trim() !== regConfirmPassword.trim()) {
      setRegError("两次输入的密码不一致，请核对");
      return;
    }

    if (!regCaptcha.trim()) {
      setRegError("请输入防刷安全验证码");
      return;
    }

    if (regCaptcha.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setRegError("防刷验证码输入错误，已自动刷新，请重新输入");
      setRegCaptcha("");
      refreshCaptcha();
      return;
    }

    setIsRegistering(true);
    const effectiveUsername = regUsername.trim() || cleanEmail.split("@")[0].trim();
    const effectiveName = regName.trim() || effectiveUsername;
    const res = await register({
      email: cleanEmail,
      code: regEmailCode.trim(),
      username: effectiveUsername,
      name: effectiveName,
      password: regPassword.trim(),
      avatar: regAvatar,
      role: "创作者",
      bio: "专注高定排版与艺术创作",
    });
    setIsRegistering(false);

    if (res.success) {
      setRegSuccess(res.message);
      setTimeout(() => {
        setAuthModalOpen(false);
        setRegEmail("");
        setRegEmailCode("");
        setRegUsername("");
        setRegPassword("");
        setRegConfirmPassword("");
        setRegName("");
        setRegSuccess("");
      }, 800);
    } else {
      setRegError(res.message);
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
              {currentUser ? <AvatarView avatar={currentUser.avatar} size="lg" /> : <Lock className="w-5 h-5 text-amber-300" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-wider text-zinc-900 dark:text-zinc-100">
                  {tab === "login"
                    ? "账号密码登录"
                    : tab === "register"
                    ? "注册新账号"
                    : tab === "changePassword"
                    ? "安全中心 • 修改登录密码"
                    : "个人中心与数据隔离"}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  独立沙盒加密
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                {currentUser && isAuthenticated ? (
                  <>
                    当前登录：
                    <span className="text-amber-700 dark:text-amber-400 font-bold">{currentUser.name}</span>
                    <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 ml-1">
                      (@{currentUser.username})
                    </span>{" "}
                    • 素材库与作品库严格私有隔离
                  </>
                ) : (
                  "支持账号密码登录与新用户注册，多用户私有素材与作品完全独立隔离"
                )}
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
        <div className="flex items-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-900/60 px-3 sm:px-4 pt-2 gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {isAuthenticated && currentUser ? (
            <>
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
                onClick={() => setTab("login")}
                className={`pb-2.5 px-3 text-xs flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  tab === "login"
                    ? "border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-300 font-bold"
                    : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>切换其他账号登录</span>
              </button>
              <button
                onClick={() => setTab("register")}
                className={`pb-2.5 px-3 text-xs flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  tab === "register"
                    ? "border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-300 font-bold"
                    : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>注册新账号</span>
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
            </>
          ) : (
            <>
              <button
                onClick={() => setTab("login")}
                className={`pb-2.5 px-3 text-xs flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  tab === "login"
                    ? "border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-300 font-bold"
                    : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>账号密码登录</span>
              </button>
              <button
                onClick={() => setTab("register")}
                className={`pb-2.5 px-3 text-xs flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  tab === "register"
                    ? "border-amber-600 dark:border-amber-400 text-amber-700 dark:text-amber-300 font-bold"
                    : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>注册新账号</span>
              </button>
            </>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto">
          {/* TAB 1: LOGIN */}
          {tab === "login" && (
            <div className="space-y-4 max-w-md mx-auto py-2">
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {loginError && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
                {loginSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{loginSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                    账号 / 用户名
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-500 dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="请输入登录账号 / 用户名"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:focus:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-white dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                    登录密码
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      placeholder="请输入登录密码"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:focus:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-white dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                      title={showLoginPassword ? "隐藏密码" : "显示密码"}
                    >
                      {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  disabled={isLoggingIn}
                  className="w-full py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 mt-2 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-white transition-all cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoggingIn ? "正在安全验证登录..." : "登 录 账 号"}</span>
                </Button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <span>还没有专属账号？立即注册新账号</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER */}
          {tab === "register" && (
            <div className="space-y-4 max-w-md mx-auto py-1">
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {regError && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}
                {regSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                {/* 1. 电子邮箱输入框 & 实时域名白名单检测 */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block">
                      注册电子邮箱 (Email) *
                    </label>
                    {publicEmailConfig.whitelistEnabled && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        仅限日常常用邮箱
                      </span>
                    )}
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="如 creator@163.com 或 name@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none font-mono transition-colors"
                  />
                  {regEmail.includes("@") && (
                    <div className="mt-1 text-[11px] font-mono">
                      {isEmailDomainValid ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>邮箱域名 @{emailDomain} 属于允许注册名单</span>
                        </span>
                      ) : (
                        <span className="text-red-500 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>未在允许注册名单中（支持 @qq.com, @163.com, @gmail.com, @outlook.com 等）</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. 邮箱验证码输入框 + 获取验证码按钮 */}
                <div>
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                    邮箱验证码 *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      required={publicEmailConfig.enabled}
                      placeholder="输入 6 位验证码"
                      value={regEmailCode}
                      onChange={(e) => setRegEmailCode(e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 placeholder:font-normal placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none tracking-widest"
                    />
                    <button
                      type="button"
                      disabled={isSendingCode || emailCooldown > 0 || !regEmail.trim()}
                      onClick={handleSendEmailCode}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-xs whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                    >
                      <Mail className={`w-3.5 h-3.5 ${isSendingCode ? "animate-spin" : ""}`} />
                      <span>
                        {isSendingCode
                          ? "发送中..."
                          : emailCooldown > 0
                          ? `${emailCooldown}s 后重发`
                          : "获取验证码"}
                      </span>
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                    {publicEmailConfig.enabled
                      ? "验证码将投递至您的邮箱，10 分钟内有效"
                      : "提示：发信服务暂未开启，若无需验证码可直接注册"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      登录账号 (选填，默认同邮箱前缀)
                    </label>
                    <input
                      type="text"
                      placeholder={regEmail ? regEmail.split("@")[0] : "如 photo_lin"}
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      用户昵称 (Name)
                    </label>
                    <input
                      type="text"
                      placeholder="如 Lin 摄影工作室"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      设置密码 *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        required
                        placeholder="至少 4 位字符"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-3 pr-8 py-2 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-0.5"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                      确认密码 *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="再次输入密码"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                    选择头像 (精选卡通形象 / 本地上传)
                  </label>
                  <AvatarPicker value={regAvatar} onChange={setRegAvatar} />
                </div>

                {/* Anti-spam Verification Code */}
                <div>
                  <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                    防刷安全验证码 * (点击图片换一张)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="输入右侧 4 位验证码"
                      value={regCaptcha}
                      onChange={(e) => setRegCaptcha(e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-mono font-bold text-white dark:text-zinc-100 uppercase tracking-widest placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none"
                    />
                    <div
                      onClick={refreshCaptcha}
                      className="relative cursor-pointer group rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-600 hover:border-amber-600 transition-colors shrink-0 bg-zinc-100 dark:bg-zinc-950 flex items-center shadow-xs"
                      title="点击刷新验证码"
                    >
                      <canvas
                        ref={captchaCanvasRef}
                        width={110}
                        height={36}
                        className="block"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-mono text-amber-300 gap-1 pointer-events-none">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>换一张</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  disabled={isRegistering}
                  className="w-full py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 mt-2 bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-white transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isRegistering ? "正在创建隔离账户..." : "注 册 并 自 动 登 录"}</span>
                </Button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <span>已有账号？返回登录</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: PROFILE & DASHBOARD */}
          {tab === "profile" && currentUser && (
            <div className="space-y-4 max-w-lg mx-auto py-1">
              {profileMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{profileMsg}</span>
                </div>
              )}

              {/* User Card */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-800 border border-amber-500/40 flex items-center justify-center text-2xl shadow-xs">
                      <AvatarView avatar={currentUser.avatar} size="xl" />
                    </div>
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
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-xs text-white dark:text-zinc-100"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                        选择头像 (精选卡通形象 / 本地上传)
                      </label>
                      <AvatarPicker value={editAvatar} onChange={setEditAvatar} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                        创作者简介
                      </label>
                      <input
                        type="text"
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded-lg text-xs text-white dark:text-zinc-100"
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

          {/* TAB 4: CHANGE PASSWORD */}
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
              {currentUser
                ? `当前账号：${currentUser.name} (@${currentUser.username})`
                : "未登录状态 • 请登录或注册"}
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
