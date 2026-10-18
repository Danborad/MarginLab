code = """import React, { useState, useEffect } from "react";
import { useEditorStore, DEFAULT_ACCOUNTS, AuthTab } from "../../store/useEditorStore";
import {
  Users,
  X,
  Plus,
  Check,
  Trash2,
  Sparkles,
  ShieldCheck,
  FolderOpen,
  Image as ImageIcon,
  LayoutTemplate,
  ArrowRight,
  UserPlus,
  UserCheck,
  Palette,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  LogOut,
  KeyRound,
  Shield,
  User,
  AlertCircle,
  Clock,
  Sparkle,
} from "lucide-react";
import { Button } from "../ui/Button";

const AVATAR_OPTIONS = ["🎨", "📷", "✨", "🌿", "☕", "🏛️", "🎞️", "🌸", "⚡", "💎", "🪐", "🎬"];

export const AuthModal: React.FC = () => {
  const authModalOpen = useEditorStore((s) => s.authModalOpen || s.userAccountModalOpen);
  const authModalTab = useEditorStore((s) => s.authModalTab);
  const setAuthModalOpen = useEditorStore((s) => s.setAuthModalOpen);
  const currentUser = useEditorStore((s) => s.currentUser);
  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
  const userAccounts = useEditorStore((s) => s.userAccounts);

  const login = useEditorStore((s) => s.login);
  const register = useEditorStore((s) => s.register);
  const logout = useEditorStore((s) => s.logout);
  const updateUserProfile = useEditorStore((s) => s.updateUserProfile);
  const changePassword = useEditorStore((s) => s.changePassword);
  const deleteUserAccount = useEditorStore((s) => s.deleteUserAccount);

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

  // Register Form State
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regRole, setRegRole] = useState("");
  const [regBio, setRegBio] = useState("");
  const [regAvatar, setRegAvatar] = useState(AVATAR_OPTIONS[0]);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

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

  // Handle Quick Demo Account Login Fill
  const fillDemoAccount = (username: string, pass: string = "123456") => {
    setLoginUsername(username);
    setLoginPassword(pass);
    setLoginError("");
  };

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!regUsername.trim() || regUsername.trim().length < 3) {
      setRegError("账号至少需要 3 个字符（支持字母、数字、下划线）");
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

    setIsRegistering(true);
    const res = await register({
      username: regUsername.trim(),
      password: regPassword.trim(),
      name: regName.trim() || regUsername.trim(),
      avatar: regAvatar,
      role: regRole.trim() || "独立创作者",
      bio: regBio.trim() || "专注高定排版与艺术创作",
    });
    setIsRegistering(false);

    if (res.success) {
      setRegSuccess(res.message);
      setTimeout(() => {
        setAuthModalOpen(false);
        setRegUsername("");
        setRegPassword("");
        setRegConfirmPassword("");
        setRegName("");
        setRegRole("");
        setRegBio("");
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
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none animate-fadeIn"
      onClick={() => setAuthModalOpen(false)}
    >
      <div
        className="bg-studio-panel border border-studio-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-soft-float flex flex-col max-h-[92vh] ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="p-4 sm:p-4.5 border-b border-studio-border flex items-center justify-between bg-studio-sidebar/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-stone-800 to-stone-700 flex items-center justify-center text-studio-accent border border-studio-accent/40 shadow-sm text-xl">
              {currentUser ? currentUser.avatar : <Lock className="w-5 h-5 text-studio-accent" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-wider text-studio-text">
                  {tab === "login"
                    ? "创作者账号登录"
                    : tab === "register"
                    ? "注册独立创作者账号"
                    : tab === "changePassword"
                    ? "安全中心 • 修改登录密码"
                    : "创作者个人中心与数据隔离"}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-studio-accent/15 text-studio-accent border border-studio-accent/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-studio-accent" />
                  独立沙盒加密
                </span>
              </div>
              <p className="text-[11px] text-studio-muted mt-0.5">
                {currentUser && isAuthenticated ? (
                  <>
                    当前登录：
                    <span className="text-studio-accent font-medium">{currentUser.name}</span>
                    <span className="font-mono text-[10px] text-studio-muted ml-1">
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
            className="p-1.5 rounded-lg text-studio-muted hover:text-studio-text hover:bg-studio-card transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center border-b border-studio-border bg-studio-card/50 px-4 pt-2 gap-2">
          {isAuthenticated && currentUser ? (
            <>
              <button
                onClick={() => setTab("profile")}
                className={`pb-2.5 px-3 text-xs font-medium flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  tab === "profile"
                    ? "border-studio-accent text-studio-accent font-semibold"
                    : "border-transparent text-studio-muted hover:text-studio-text"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>个人中心 ({currentUser.name.split(" ")[0]})</span>
              </button>
              <button
                onClick={() => setTab("login")}
                className={`pb-2.5 px-3 text-xs font-medium flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  tab === "login"
                    ? "border-studio-accent text-studio-accent font-semibold"
                    : "border-transparent text-studio-muted hover:text-studio-text"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>切换其他账号登录</span>
              </button>
              <button
                onClick={() => setTab("register")}
                className={`pb-2.5 px-3 text-xs font-medium flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  tab === "register"
                    ? "border-studio-accent text-studio-accent font-semibold"
                    : "border-transparent text-studio-muted hover:text-studio-text"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>注册新账号</span>
              </button>
              <button
                onClick={() => setTab("changePassword")}
                className={`pb-2.5 px-3 text-xs font-medium flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  tab === "changePassword"
                    ? "border-studio-accent text-studio-accent font-semibold"
                    : "border-transparent text-studio-muted hover:text-studio-text"
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
                className={`pb-2.5 px-3 text-xs font-medium flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  tab === "login"
                    ? "border-studio-accent text-studio-accent font-semibold"
                    : "border-transparent text-studio-muted hover:text-studio-text"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>账号密码登录</span>
              </button>
              <button
                onClick={() => setTab("register")}
                className={`pb-2.5 px-3 text-xs font-medium flex items-center gap-1.5 transition-all border-b-2 cursor-pointer ${
                  tab === "register"
                    ? "border-studio-accent text-studio-accent font-semibold"
                    : "border-transparent text-studio-muted hover:text-studio-text"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>注册新账号</span>
              </button>
            </>
          )}
        </div>

        {/* Content Area */}
        <div className="p-5 flex-1 overflow-y-auto">
          {/* TAB 1: LOGIN */}
          {tab === "login" && (
            <div className="space-y-4 max-w-md mx-auto py-2">
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {loginError && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
                {loginSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{loginSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                    账号 / 用户名
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-studio-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="请输入账号 (如 atelier / lin / alex / 自建账号)"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-studio-card border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/60 focus:outline-none transition-colors font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                    登录密码
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-studio-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      required
                      placeholder="请输入密码 (默认示例账号密码均为 123456)"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-studio-card border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/60 focus:outline-none transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-studio-muted hover:text-studio-text p-0.5 cursor-pointer"
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
                  className="w-full py-2.5 rounded-xl text-xs font-semibold shadow-subtle-glow flex items-center justify-center gap-1.5 mt-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{isLoggingIn ? "正在安全验证登录..." : "登 录 账 号"}</span>
                </Button>
              </form>

              {/* Demo Accounts Fast-Picker */}
              <div className="pt-3 border-t border-studio-border/60">
                <div className="flex items-center justify-between text-[11px] text-studio-muted mb-2">
                  <span className="font-mono">⚡ 快捷体验测试账号（点击一键填入）</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {userAccounts.slice(0, 4).map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => fillDemoAccount(acc.username || acc.id, acc.passwordHash || "123456")}
                      className="p-2 rounded-xl bg-studio-card/60 hover:bg-studio-card border border-studio-border hover:border-studio-accent transition-all text-left flex items-center gap-2 group cursor-pointer"
                    >
                      <span className="text-base">{acc.avatar}</span>
                      <div className="truncate flex-1">
                        <div className="text-[11px] font-medium text-studio-text truncate group-hover:text-studio-accent">
                          {acc.name}
                        </div>
                        <div className="text-[9px] font-mono text-studio-muted truncate">
                          账号: {acc.username || acc.id}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="text-xs text-studio-accent hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <span>还没有专属账号？立即注册新创作者账号</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REGISTER */}
          {tab === "register" && (
            <div className="space-y-4 max-w-md mx-auto py-1">
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                {regError && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}
                {regSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                      登录账号 (Username) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="如 photo_lin"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full px-3 py-1.5 bg-studio-card border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/60 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                      创作者昵称 (Name) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="如 Lin 摄影工作室"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-studio-card border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/60 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                      设置密码 *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? "text" : "password"}
                        required
                        placeholder="至少 4 位字符"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-3 pr-8 py-1.5 bg-studio-card border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/60 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-studio-muted hover:text-studio-text"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                      确认密码 *
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="再次输入密码"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full px-3 py-1.5 bg-studio-card border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/60 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                    选择个性化头像
                  </label>
                  <div className="grid grid-cols-6 gap-1 bg-studio-card p-1.5 rounded-xl border border-studio-border">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        type="button"
                        key={emoji}
                        onClick={() => setRegAvatar(emoji)}
                        className={`h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                          regAvatar === emoji
                            ? "bg-studio-accent/30 border border-studio-accent scale-110 shadow-sm"
                            : "hover:bg-studio-hover opacity-70 hover:opacity-100"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                    头衔 / 角色 (可选)
                  </label>
                  <input
                    type="text"
                    placeholder="如：独立人像摄影师、视觉设计师"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value)}
                    className="w-full px-3 py-1.5 bg-studio-card border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                    个人简介 / 创作者寄语 (可选)
                  </label>
                  <input
                    type="text"
                    placeholder="如：专注 35mm 胶片与米家 6 寸画报打印"
                    value={regBio}
                    onChange={(e) => setRegBio(e.target.value)}
                    className="w-full px-3 py-1.5 bg-studio-card border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/60 focus:outline-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  disabled={isRegistering}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold shadow-subtle-glow flex items-center justify-center gap-1.5 mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isRegistering ? "正在创建隔离账户..." : "注 册 并 自 动 登 录"}</span>
                </Button>
              </form>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="text-xs text-studio-accent hover:underline flex items-center justify-center gap-1 mx-auto"
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
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{profileMsg}</span>
                </div>
              )}

              {/* User Card */}
              <div className="p-4 rounded-2xl bg-studio-card/80 border border-studio-border shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-studio-border/60">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-studio-panel border border-studio-accent/40 flex items-center justify-center text-2xl shadow-inner">
                      {currentUser.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-studio-text">
                          {currentUser.name}
                        </h3>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          登录中
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-studio-accent mt-0.5">
                        @{currentUser.username} • {currentUser.role}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="text-xs text-studio-accent hover:underline font-mono px-2 py-1 rounded bg-studio-panel border border-studio-border"
                  >
                    {isEditingProfile ? "取消编辑" : "编辑资料"}
                  </button>
                </div>

                {/* Edit Form */}
                {isEditingProfile ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-3 pt-1">
                    <div>
                      <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                        昵称
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-1 bg-studio-panel border border-studio-border rounded-lg text-xs text-studio-text"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                        选择头像
                      </label>
                      <div className="grid grid-cols-6 gap-1 bg-studio-panel p-1 rounded-lg border border-studio-border">
                        {AVATAR_OPTIONS.map((emoji) => (
                          <button
                            type="button"
                            key={emoji}
                            onClick={() => setEditAvatar(emoji)}
                            className={`h-7 rounded text-sm ${
                              editAvatar === emoji ? "bg-studio-accent/30 border border-studio-accent" : ""
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                        头衔角色
                      </label>
                      <input
                        type="text"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="w-full px-3 py-1 bg-studio-panel border border-studio-border rounded-lg text-xs text-studio-text"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                        创作者简介
                      </label>
                      <input
                        type="text"
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="w-full px-3 py-1 bg-studio-panel border border-studio-border rounded-lg text-xs text-studio-text"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button type="submit" variant="accent" size="sm" className="flex-1 text-xs">
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
                    <p className="text-xs text-studio-muted leading-relaxed italic bg-studio-panel/50 p-2.5 rounded-xl border border-studio-border/50">
                      "{currentUser.bio}"
                    </p>
                  )
                )}

                {/* Storage Isolation Overview */}
                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-mono text-studio-muted uppercase tracking-wider block">
                    当前账号专属私有资产统计
                  </span>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-studio-panel border border-studio-border">
                      <ImageIcon className="w-4 h-4 mx-auto text-studio-accent mb-1" />
                      <div className="text-sm font-semibold font-mono text-studio-text">
                        {mediaAssets.length}
                      </div>
                      <div className="text-[9px] font-mono text-studio-muted">私有素材</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-studio-panel border border-studio-border">
                      <FolderOpen className="w-4 h-4 mx-auto text-studio-accent mb-1" />
                      <div className="text-sm font-semibold font-mono text-studio-text">
                        {savedProjects.length}
                      </div>
                      <div className="text-[9px] font-mono text-studio-muted">已存画作</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-studio-panel border border-studio-border">
                      <LayoutTemplate className="w-4 h-4 mx-auto text-studio-accent mb-1" />
                      <div className="text-sm font-semibold font-mono text-studio-text">
                        {customTemplates.length}
                      </div>
                      <div className="text-[9px] font-mono text-studio-muted">自制模板</div>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-studio-panel border border-studio-border/80 text-[11px] text-studio-muted leading-relaxed space-y-1">
                  <div className="text-studio-text font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>独立沙盒隔离机制</span>
                  </div>
                  <p className="text-[10px]">
                    您上传的图片、保存的画作与模板仅对当前账号 (@{currentUser.username}) 可见并加密保存在本地独立命名空间中。退出登录后他人无法访问。
                  </p>
                </div>

                {/* Account Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setTab("changePassword")}
                    className="py-2 px-3 rounded-xl bg-studio-panel hover:bg-studio-hover border border-studio-border text-xs text-studio-text flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-studio-accent" />
                    <span>修改登录密码</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("确定要退出当前账号吗？")) {
                        logout();
                      }
                    }}
                    className="py-2 px-3 rounded-xl bg-studio-panel hover:bg-red-500/15 border border-studio-border hover:border-red-500/40 text-xs text-red-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
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
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{passError}</span>
                  </div>
                )}
                {passSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{passSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                    当前原密码
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="请输入当前账号原密码"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-studio-card border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                    新密码
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      placeholder="至少 4 位字符"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 pr-8 py-2 bg-studio-card border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text focus:outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-studio-muted hover:text-white"
                    >
                      {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                    确认新密码
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="再次输入新密码"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-studio-card border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text focus:outline-none font-mono"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="submit"
                    variant="accent"
                    className="flex-1 py-2 rounded-xl text-xs font-semibold"
                  >
                    确认修改密码
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setTab("profile")}
                    className="text-xs"
                  >
                    返回个人中心
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="p-3.5 border-t border-studio-border bg-studio-sidebar/90 flex items-center justify-between text-xs text-studio-muted">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
            className="text-xs"
          >
            完成
          </Button>
        </div>
      </div>
    </div>
  );
};
"""

with open("src/components/modals/AuthModal.tsx", "w") as f:
    f.write(code)

print("Created src/components/modals/AuthModal.tsx successfully!")
