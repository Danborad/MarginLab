content = """import React, { useState } from "react";
import { useEditorStore, DEFAULT_ACCOUNTS } from "../../store/useEditorStore";
import { generateCaptchaCode, drawCaptchaCanvas } from "../../lib/captcha";
import { AvatarPicker } from "../ui/AvatarPicker";
import { AvatarView } from "../ui/AvatarView";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Printer,
  LayoutTemplate,
  Crop,
  Layers,
  Palette,
  FolderOpen,
  Maximize2,
  Sparkle,
  Compass,
  ArrowUpRight,
  LogOut,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "../ui/Button";

const AVATAR_OPTIONS = ["🎨", "📷", "✨", "🌿", "☕", "🏛️", "🎞️", "🌸", "⚡", "💎", "🪐", "🎬"];

export const LandingHomePage: React.FC = () => {
  const currentView = useEditorStore((s) => s.currentView);
  const setCurrentView = useEditorStore((s) => s.setCurrentView);
  const enterAsGuest = useEditorStore((s) => s.enterAsGuest);
  const currentUser = useEditorStore((s) => s.currentUser);
  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
  const userAccounts = useEditorStore((s) => s.userAccounts);

  const login = useEditorStore((s) => s.login);
  const register = useEditorStore((s) => s.register);
  const logout = useEditorStore((s) => s.logout);

  // Tab: "login" vs "register"
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  // Login Form
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register Form & Captcha
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPass, setRegConfirmPass] = useState("");
  const [regName, setRegName] = useState("");
  const [regRole, setRegRole] = useState("");
  const [regBio, setRegBio] = useState("");
  const [regAvatar, setRegAvatar] = useState(AVATAR_OPTIONS[0]);
  const [showRegPass, setShowRegPass] = useState(false);
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
      drawCaptchaCanvas(captchaCanvasRef.current, newCode);
    }
  }, []);

  React.useEffect(() => {
    if (authTab === "register" && captchaCanvasRef.current) {
      drawCaptchaCanvas(captchaCanvasRef.current, captchaCode);
    }
  }, [authTab, captchaCode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccess("");

    if (!loginUsername.trim()) {
      setLoginError("请输入登录账号 / 用户名");
      return;
    }
    if (!loginPassword.trim()) {
      setLoginError("请输入密码");
      return;
    }

    setIsLoggingIn(true);
    const res = await login(loginUsername.trim(), loginPassword.trim());
    setIsLoggingIn(false);

    if (res.success) {
      setLoginSuccess(res.message);
    } else {
      setLoginError(res.message);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!regUsername.trim() || regUsername.trim().length < 3) {
      setRegError("登录账号至少需要 3 个字符（支持英文字母与数字）");
      return;
    }
    if (!regPassword.trim() || regPassword.trim().length < 4) {
      setRegError("密码长度至少需要 4 位字符");
      return;
    }
    if (regPassword.trim() !== regConfirmPass.trim()) {
      setRegError("两次输入的密码不一致，请核对");
      return;
    }

    if (!regCaptcha.trim()) {
      setRegError("请输入防刷验证码");
      return;
    }

    if (regCaptcha.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setRegError("验证码输入错误，已自动刷新，请重新输入");
      setRegCaptcha("");
      refreshCaptcha();
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
    } else {
      setRegError(res.message);
    }
  };

  const fillDemoAccount = (username: string, pass: string = "123456") => {
    setAuthTab("login");
    setLoginUsername(username);
    setLoginPassword(pass);
    setLoginError("");
  };

  return (
    <div className="min-h-screen w-full bg-[#0D0D11] text-studio-text flex flex-col selection:bg-studio-accent selection:text-black relative overflow-x-hidden">
      {/* Background Decorative Lighting Gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="h-14 sm:h-16 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl px-3 sm:px-6 md:px-12 flex items-center justify-between z-20 sticky top-0">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-stone-800 to-stone-700 border border-studio-accent/40 flex items-center justify-center text-studio-accent shadow-subtle-glow shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-studio-accent" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-serif tracking-widest text-sm sm:text-base font-bold text-studio-accent">
              ATELIER
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.2 rounded bg-studio-card text-studio-muted border border-studio-border hidden xs:inline-block">
              艺境工坊
            </span>
          </div>
        </div>

        {/* Right Status / Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {isAuthenticated && currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-xl bg-studio-card border border-studio-border text-xs">
                <AvatarView avatar={currentUser.avatar} size="xs" />
                <span className="font-medium text-studio-text max-w-[60px] sm:max-w-[100px] truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-mono text-studio-muted hidden sm:inline-block">
                  (@{currentUser.username})
                </span>
              </div>

              <Button
                variant="accent"
                size="sm"
                onClick={() => setCurrentView("studio")}
                className="flex items-center gap-1 text-xs font-semibold shadow-subtle-glow px-2.5 py-1"
              >
                <span>工作台</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>

              <button
                onClick={() => logout()}
                className="p-1.5 rounded-lg text-studio-muted hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                title="退出当前登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                onClick={enterAsGuest}
                className="text-[11px] sm:text-xs text-studio-muted hover:text-studio-text px-2 sm:px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer whitespace-nowrap"
              >
                访客直接体验 →
              </button>
              <button
                onClick={() => {
                  setAuthTab("register");
                  const el = document.getElementById("auth-portal");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-studio-accent hover:bg-studio-accentHover text-zinc-950 text-[11px] sm:text-xs font-semibold shadow-subtle-glow transition-all cursor-pointer whitespace-nowrap"
              >
                注册新账号
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Hero & Auth Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-12 py-8 sm:py-12 md:py-16 flex flex-col justify-center z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          
          {/* Left Column: Brand Hero & Value Propositions */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-studio-accent/10 border border-studio-accent/30 text-studio-accent text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">独立个人账号 • 专属私有素材与排版沙盒隔离</span>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-white leading-tight sm:leading-[1.18]">
                让每一张照片，都拥有 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5C49F] via-[#F3E5D4] to-[#C8A27A]">
                  先锋艺术海报级的排版呈现
                </span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-studio-muted leading-relaxed max-w-xl">
                为摄影师、设计师与生活创作者定制的高定拼图工坊。集成 Vogue 大字封面、拍立得手记、多图画廊与米家相纸打印自适应。
              </p>
            </div>

            {/* 4 Core Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-studio-accent/30 transition-all flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-studio-accent flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/20">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-studio-text">米家 3寸/6寸 相纸专属适配</h4>
                  <p className="text-[11px] text-studio-muted leading-relaxed mt-0.5">
                    一键切换相纸尺寸，所有排版自适应重排，300DPI 无损高清冲印。
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-studio-accent/30 transition-all flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center shrink-0 mt-0.5 border border-pink-500/20">
                  <LayoutTemplate className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-studio-text">24+ 款先锋海报模板</h4>
                  <p className="text-[11px] text-studio-muted leading-relaxed mt-0.5">
                    全屏大字封面、拍立得手记、多图画廊与极简留白，随心一键套用。
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-studio-accent/30 transition-all flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/20">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-studio-text">独立账号密码与数据隔离</h4>
                  <p className="text-[11px] text-studio-muted leading-relaxed mt-0.5">
                    注册个人独立账号，上传素材与画作草稿 100% 本地沙盒私有存储。
                  </p>
                </div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-zinc-900/60 border border-white/5 hover:border-studio-accent/30 transition-all flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                  <Crop className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-studio-text">交互式框内构图裁切</h4>
                  <p className="text-[11px] text-studio-muted leading-relaxed mt-0.5">
                    照片框内任意缩放平移，双击即调，绝不变形拉伸。
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Guest CTA */}
            <div className="pt-1 flex items-center gap-4">
              <button
                onClick={enterAsGuest}
                className="text-xs text-studio-accent hover:underline font-mono flex items-center gap-1.5 py-1 cursor-pointer"
              >
                <span>免登录以访客身份直接体验全部排版功能</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Column: Prominent Auth Portal Card */}
          <div id="auth-portal" className="lg:col-span-5">
            <div className="bg-zinc-900/90 border border-studio-border/90 rounded-3xl p-4 sm:p-6 md:p-7 shadow-2xl backdrop-blur-xl relative ring-1 ring-white/10">
              
              {/* Form Tab Header */}
              <div className="grid grid-cols-2 gap-1 bg-zinc-950/80 p-1 rounded-2xl border border-white/5 mb-4 sm:mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("login");
                    setLoginError("");
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    authTab === "login"
                      ? "bg-studio-accent text-zinc-950 font-semibold shadow-sm"
                      : "text-studio-muted hover:text-studio-text"
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>创作者登录</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("register");
                    setRegError("");
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    authTab === "register"
                      ? "bg-studio-accent text-zinc-950 font-semibold shadow-sm"
                      : "text-studio-muted hover:text-studio-text"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>注册独立账号</span>
                </button>
              </div>

              {/* TAB 1: LOGIN FORM */}
              {authTab === "login" && (
                <div className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-3.5">
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
                        登录账号 / 用户名
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-studio-muted absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          placeholder="输入账号 (如 atelier / lin / 自建账号)"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-zinc-950 border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/50 focus:outline-none transition-colors font-mono"
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
                          type={showLoginPass ? "text" : "password"}
                          required
                          placeholder="输入密码 (示例账号密码为 123456)"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full pl-9 pr-10 py-2.5 bg-zinc-950 border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/50 focus:outline-none transition-colors font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPass(!showLoginPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-studio-muted hover:text-studio-text p-0.5 cursor-pointer"
                        >
                          {showLoginPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      variant="accent"
                      disabled={isLoggingIn}
                      className="w-full py-3 rounded-xl text-xs font-semibold shadow-subtle-glow flex items-center justify-center gap-2 mt-2 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{isLoggingIn ? "正在验证进入..." : "登 录 并 进 入 工 作 台"}</span>
                    </Button>
                  </form>

                  {/* Demo Accounts Fast Click Fill */}
                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-studio-muted">
                      <span className="font-mono text-studio-accent font-medium">
                        ⚡ 内置演示账号（点击一键填入账号密码）：
                      </span>
                    </div>

                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => fillDemoAccount("atelier", "123456")}
                        className="p-2.5 rounded-xl bg-zinc-950/70 hover:bg-zinc-950 border border-white/5 hover:border-studio-accent transition-all text-left flex items-center gap-2 group cursor-pointer"
                      >
                        <span className="text-lg">🎨</span>
                        <div className="truncate flex-1">
                          <div className="text-[11px] font-medium text-studio-text truncate group-hover:text-studio-accent">
                            Atelier Pro 主理人
                          </div>
                          <div className="text-[9px] font-mono text-studio-muted">
                            账号: atelier | 密码: 123456
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => fillDemoAccount("lin", "123456")}
                        className="p-2.5 rounded-xl bg-zinc-950/70 hover:bg-zinc-950 border border-white/5 hover:border-studio-accent transition-all text-left flex items-center gap-2 group cursor-pointer"
                      >
                        <span className="text-lg">📷</span>
                        <div className="truncate flex-1">
                          <div className="text-[11px] font-medium text-studio-text truncate group-hover:text-studio-accent">
                            Lin • 胶片摄影师
                          </div>
                          <div className="text-[9px] font-mono text-studio-muted">
                            账号: lin | 密码: 123456
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => fillDemoAccount("alex", "123456")}
                        className="p-2.5 rounded-xl bg-zinc-950/70 hover:bg-zinc-950 border border-white/5 hover:border-studio-accent transition-all text-left flex items-center gap-2 group cursor-pointer"
                      >
                        <span className="text-lg">✨</span>
                        <div className="truncate flex-1">
                          <div className="text-[11px] font-medium text-studio-text truncate group-hover:text-studio-accent">
                            Alex • 视觉设计师
                          </div>
                          <div className="text-[9px] font-mono text-studio-muted">
                            账号: alex | 密码: 123456
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => fillDemoAccount("mia", "123456")}
                        className="p-2.5 rounded-xl bg-zinc-950/70 hover:bg-zinc-950 border border-white/5 hover:border-studio-accent transition-all text-left flex items-center gap-2 group cursor-pointer"
                      >
                        <span className="text-lg">🌿</span>
                        <div className="truncate flex-1">
                          <div className="text-[11px] font-medium text-studio-text truncate group-hover:text-studio-accent">
                            Mia • 慢调生活
                          </div>
                          <div className="text-[9px] font-mono text-studio-muted">
                            账号: mia | 密码: 123456
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REGISTER FORM */}
              {authTab === "register" && (
                <div className="space-y-4">
                  <form onSubmit={handleRegister} className="space-y-3">
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                          登录账号 (Username) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="如 my_photo_studio"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-950 border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono placeholder:text-studio-muted/50 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                          创作者昵称 (Name) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="如 极简艺术空间"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-950 border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                          设置登录密码 *
                        </label>
                        <div className="relative">
                          <input
                            type={showRegPass ? "text" : "password"}
                            required
                            placeholder="至少 4 位字符"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full px-3 pr-8 py-2 bg-zinc-950 border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono placeholder:text-studio-muted/50 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPass(!showRegPass)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-studio-muted hover:text-studio-text"
                          >
                            {showRegPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
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
                          value={regConfirmPass}
                          onChange={(e) => setRegConfirmPass(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-950 border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono placeholder:text-studio-muted/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                        选择头像 (支持 12 款艺术 Emoji 或 输入 QQ 号读取头像)
                      </label>
                      <AvatarPicker value={regAvatar} onChange={setRegAvatar} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                          创作者头衔 (可选)
                        </label>
                        <input
                          type="text"
                          placeholder="如：独立摄影师"
                          value={regRole}
                          onChange={(e) => setRegRole(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-950 border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/50 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                          创作者简介 (可选)
                        </label>
                        <input
                          type="text"
                          placeholder="如：35mm 胶片光影"
                          value={regBio}
                          onChange={(e) => setRegBio(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-950 border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text placeholder:text-studio-muted/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Anti-spam Verification Code */}
                    <div>
                      <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                        防刷安全验证码 * (点击图片换一张)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="输入 4 位验证码"
                          value={regCaptcha}
                          onChange={(e) => setRegCaptcha(e.target.value)}
                          className="flex-1 min-w-0 px-3 py-2 bg-zinc-950 border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:text-studio-muted/50 focus:outline-none"
                        />
                        <div
                          onClick={refreshCaptcha}
                          className="relative cursor-pointer group rounded-xl overflow-hidden border border-studio-border/80 hover:border-studio-accent transition-colors shrink-0 bg-zinc-950 flex items-center shadow-inner"
                          title="点击刷新验证码"
                        >
                          <canvas
                            ref={captchaCanvasRef}
                            width={100}
                            height={36}
                            className="block"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] font-mono text-studio-accent gap-1 pointer-events-none">
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
                      className="w-full py-3 rounded-xl text-xs font-semibold shadow-subtle-glow flex items-center justify-center gap-2 mt-1 cursor-pointer"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isRegistering ? "正在创建专属沙盒..." : "注 册 并 进 入 工 作 台"}</span>
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-white/5 bg-zinc-950/60 py-5 px-4 sm:px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between text-xs text-studio-muted gap-3 z-10 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>ATELIER Studio v2.0 • 独立本地沙盒 • 离线安全私密存储</span>
        </div>
        <div>
          <span>支持米家照片打印机 3寸/6寸相纸 • 先锋排版工作坊</span>
        </div>
      </footer>
    </div>
  );
};
"""
with open("src/components/home/LandingHomePage.tsx", "w") as f:
    f.write(content)
print("Updated LandingHomePage.tsx successfully!")
