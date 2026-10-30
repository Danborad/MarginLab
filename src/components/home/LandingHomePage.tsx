import React, { useState, useEffect } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { generateCaptchaCode, drawCaptchaCanvas } from "../../lib/captcha";
import { stripEmoji } from "../../lib/utils";
import { CARTOON_AVATARS } from "../ui/AvatarPicker";
import { AvatarView } from "../ui/AvatarView";
import { WebsiteLogo } from "../ui/WebsiteLogo";
import {
  Sparkles,
  BookOpen,
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
  Printer,
  LayoutTemplate,
  LayoutGrid,
  Crop,
  LogOut,
  RefreshCw,
  Sun,
  Moon,
  Mail,
} from "lucide-react";
import { Button } from "../ui/Button";

export const LandingHomePage: React.FC = () => {
  const setCurrentView = useEditorStore((s) => s.setCurrentView);
  const enterAsGuest = useEditorStore((s) => s.enterAsGuest);
  const setAlbumModalOpen = useEditorStore((s) => s.setAlbumModalOpen);
  const currentUser = useEditorStore((s) => s.currentUser);
  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);

  const login = useEditorStore((s) => s.login);
  const register = useEditorStore((s) => s.register);
  const sendVerificationCode = useEditorStore((s) => s.sendVerificationCode);
  const publicEmailConfig = useEditorStore((s) => s.publicEmailConfig);
  const fetchPublicEmailConfig = useEditorStore((s) => s.fetchPublicEmailConfig);
  const logout = useEditorStore((s) => s.logout);
  const themeMode = useEditorStore((s) => s.themeMode);
  const toggleThemeMode = useEditorStore((s) => s.toggleThemeMode);
  const landingAuthTab = useEditorStore((s) => s.landingAuthTab);
  const setLandingAuthTab = useEditorStore((s) => s.setLandingAuthTab);

  // 全站备案信息（管理员后台可独立开关）
  const siteFilingConfig = useEditorStore((s) => s.siteFilingConfig);
  const showIcpFiling = siteFilingConfig.icpEnabled && siteFilingConfig.icpNumber.trim().length > 0;
  const showPoliceFiling =
    siteFilingConfig.policeEnabled && siteFilingConfig.policeNumber.trim().length > 0;

  // Tab: "login" vs "register"
  const [authTab, setAuthTab] = useState<"login" | "register">("login");

  useEffect(() => {
    if (landingAuthTab) {
      setAuthTab(landingAuthTab);
    }
  }, [landingAuthTab]);

  // Login Form
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register Form & Captcha
  const [regEmail, setRegEmail] = useState("");
  const [regEmailCode, setRegEmailCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPass, setRegConfirmPass] = useState("");
  const [regName, setRegName] = useState("");
  const [regAvatar, setRegAvatar] = useState("");
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
      drawCaptchaCanvas(captchaCanvasRef.current, newCode, themeMode);
    }
  }, [themeMode]);

  React.useEffect(() => {
    if (authTab === "register" && captchaCanvasRef.current) {
      drawCaptchaCanvas(captchaCanvasRef.current, captchaCode, themeMode);
    }
  }, [authTab, captchaCode, themeMode]);

  useEffect(() => {
    fetchPublicEmailConfig();
  }, []);

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
      setRegError("密码长度至少需要 4 位字符");
      return;
    }
    if (regPassword.trim() !== regConfirmPass.trim()) {
      setRegError("两次输入的密码不一致，请核对");
      return;
    }

    if (!regCaptcha.trim()) {
      setRegError("请输入防刷安全验证码");
      return;
    }

    if (regCaptcha.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setRegError("验证码输入错误，已自动刷新，请重新输入");
      setRegCaptcha("");
      refreshCaptcha();
      return;
    }

    setIsRegistering(true);
    const effectiveUsername = regUsername.trim() || cleanEmail.split("@")[0].trim();
    const effectiveName = stripEmoji(regName.trim() || effectiveUsername);
    const res = await register({
      email: cleanEmail,
      code: regEmailCode.trim(),
      username: effectiveUsername,
      name: effectiveName,
      password: regPassword.trim(),
      avatar: "",
      role: "创作者",
      bio: "专注高定排版与艺术创作",
    });
    setIsRegistering(false);

    if (res.success) {
      setRegSuccess(res.message);
    } else {
      setRegError(res.message);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] dark:bg-[#0D0D11] text-zinc-900 dark:text-zinc-100 flex flex-col selection:bg-studio-accent selection:text-black relative overflow-x-hidden transition-colors duration-200">
      {/* Background Decorative Lighting Gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[500px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="h-14 sm:h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/85 backdrop-blur-xl px-3 sm:px-6 md:px-12 flex items-center justify-between z-20 sticky top-0 transition-colors">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-900 border border-amber-500/30 dark:border-amber-400/40 flex items-center justify-center text-amber-400 dark:text-studio-accent shadow-xs shrink-0">
            <WebsiteLogo className="w-4.5 h-4.5 sm:w-5 sm:h-5" strokeWidth={1.8} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-serif tracking-widest text-sm sm:text-base font-bold text-amber-700 dark:text-studio-accent">
              留白集
            </span>
            <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600 hidden xs:inline-block font-semibold">
              MarginLab
            </span>
          </div>
        </div>

        {/* Right Status / Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleThemeMode}
            className="p-2 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-transparent hover:border-zinc-300 dark:hover:border-zinc-700"
            title={themeMode === "light" ? "切换为夜间深色模式" : "切换为高定浅色纸感模式"}
          >
            {themeMode === "light" ? (
              <Moon className="w-4 h-4 text-amber-700" />
            ) : (
              <Sun className="w-4 h-4 text-amber-300" />
            )}
          </button>
          {isAuthenticated && currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 text-xs shadow-xs">
                <AvatarView avatar={currentUser.avatar} size="xs" />
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 max-w-[60px] sm:max-w-[100px] truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 hidden sm:inline-block">
                  (@{currentUser.username})
                </span>
              </div>

              <Button
                variant="accent"
                size="sm"
                onClick={() => setCurrentView("studio")}
                className="flex items-center gap-1 text-xs font-bold shadow-sm px-3 py-1.5"
              >
                <span>工作台</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>

              <button
                onClick={() => logout()}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="退出当前登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button
                onClick={() => setCurrentView("studio")}
                className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
                title="进入工作台速览各项功能（只读模式）"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-zinc-500" />
                <span>进入工作台浏览</span>
              </button>

                            <button
                id="landing-album-btn"
                onClick={() => setAlbumModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-all cursor-pointer"
                title="沉浸式翻阅 3D 实体艺术画册"
              >
                <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>3D 艺术画册</span>
              </button>

              <button
                id="landing-header-login-btn"
                onClick={() => {
                  setAuthTab("login");
                  setLandingAuthTab("login");
                  const el = document.getElementById("auth-portal");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white text-[11px] sm:text-xs font-semibold hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-all cursor-pointer whitespace-nowrap"
              >
                账号登录
              </button>

              <button
                id="landing-header-register-btn"
                onClick={() => {
                  setAuthTab("register");
                  setLandingAuthTab("register");
                  const el = document.getElementById("auth-portal");
                  el?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="px-3 sm:px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950 text-[11px] sm:text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
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
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span className="truncate">独立账号加密 • 专属私有素材与排版数据隔离</span>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-serif font-bold tracking-tight text-zinc-900 dark:text-white leading-tight sm:leading-[1.18]">
                留白
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 dark:from-[#E5C49F] dark:via-[#F3E5D4] dark:to-[#C8A27A]">
                  集
                </span>
                <span className="ml-2 sm:ml-3 align-middle text-[11px] sm:text-sm font-mono font-semibold tracking-[0.28em] text-zinc-500 dark:text-zinc-400 uppercase">
                  MarginLab
                </span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
                极简图片AI调色风格化与艺术拼图排版工具
              </p>
              <p className="text-xs sm:text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-xl">
                AI 调色修图与风格化、艺术拼图排版、相册成书，以及米家相纸一键冲印。为摄影师、设计师与艺术创作者准备的极简工作台。
              </p>
            </div>

            {/* 4 Core Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/40 shadow-xs transition-all flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/20">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">米家 3寸/6寸 相纸专属适配</h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mt-0.5 font-normal">
                    一键切换相纸尺寸，所有排版自适应重排，300DPI 无损高清冲印。
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 hover:border-pink-500/40 shadow-xs transition-all flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-pink-500/15 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0 mt-0.5 border border-pink-500/20">
                  <LayoutTemplate className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">44+ 款高级排版模板</h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mt-0.5 font-normal">
                    全屏大字封面、拍立得手记、多图画廊与极简留白，随心一键套用。
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/40 shadow-xs transition-all flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/20">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">独立账号密码与数据隔离</h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mt-0.5 font-normal">
                    注册个人独立账号，上传素材与画作草稿 100% 本地沙盒私有存储。
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 shadow-xs transition-all flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                  <Crop className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">交互式框内构图裁切</h4>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed mt-0.5 font-normal">
                    照片框内任意缩放平移，双击即调，绝不变形拉伸。
                  </p>
                </div>
              </div>
            </div>

            {/* 工作台只读浏览与 3D 实体画册速览入口 */}
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <button
                id="landing-enter-studio-btn"
                onClick={() => setCurrentView("studio")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-950 hover:bg-black text-white text-xs font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                title="进入工作台速览 AI修图、风格化、自由生图与拼图排版"
              >
                <LayoutGrid className="w-4 h-4 text-emerald-400" />
                <span>进入工作台浏览</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-normal">只读速览</span>
              </button>

              <button
                id="landing-album-btn"
                onClick={() => setAlbumModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-900 dark:text-amber-200 text-xs font-semibold transition-all cursor-pointer shadow-xs hover:scale-[1.02]"
                title="沉浸式速览 3D 实体艺术画册"
              >
                <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>沉浸式翻阅 3D 艺术画册《九寨沟旅记》</span>
              </button>
            </div>
          </div>

          {/* Right Column: Prominent Auth Portal Card */}
          <div id="auth-portal" className="lg:col-span-5">
            <div className="bg-white dark:bg-[#18181B] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 md:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl relative ring-1 ring-black/5 dark:ring-white/10 transition-colors">
              
             {/* Form Tab Header */}
             <div className="grid grid-cols-2 gap-1.5 bg-zinc-100 dark:bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-5">
               <button
                 type="button"
                 onClick={() => {
                   setAuthTab("login");
                   setLoginError("");
                 }}
                 className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                   authTab === "login"
                     ? "bg-amber-600 dark:bg-amber-500 text-white dark:text-zinc-950 shadow-sm"
                     : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                 }`}
               >
                 <LogIn className="w-3.5 h-3.5" />
                 <span>账号登录</span>
               </button>
               <button
                 type="button"
                 onClick={() => {
                   setAuthTab("register");
                   setRegError("");
                 }}
                 className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                   authTab === "register"
                     ? "bg-amber-600 dark:bg-amber-500 text-white dark:text-zinc-950 shadow-sm"
                     : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                 }`}
               >
                 <UserPlus className="w-3.5 h-3.5" />
                 <span>注册新账号</span>
               </button>
             </div>

              {/* TAB 1: LOGIN FORM */}
              {authTab === "login" && (
                <div className="space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
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
                        登录账号 / 用户名
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-zinc-500 dark:text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          id="landing-login-username"
                          type="text"
                          required
                          placeholder="请输入登录账号"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 dark:hover:bg-zinc-800/80 dark:focus:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none transition-colors"
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
                          id="landing-login-password"
                          type={showLoginPass ? "text" : "password"}
                          required
                          placeholder="请输入登录密码"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 dark:hover:bg-zinc-800/80 dark:focus:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPass(!showLoginPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
                        >
                          {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      id="landing-login-submit"
                      type="submit"
                      variant="accent"
                      disabled={isLoggingIn}
                      className="w-full py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 mt-2 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 transition-all"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>{isLoggingIn ? "正在验证进入..." : "登 录 并 进 入 工 作 台"}</span>
                    </Button>
                  </form>
                </div>
              )}

              {/* TAB 2: REGISTER FORM */}
              {authTab === "register" && (
                <div className="space-y-4">
                  <form onSubmit={handleRegister} className="space-y-3">
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
                        id="landing-reg-email"
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
                          id="landing-reg-emailcode"
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                          登录账号 (选填，默认同邮箱)
                        </label>
                        <input
                          id="landing-reg-username"
                          type="text"
                          placeholder={regEmail ? regEmail.split("@")[0] : "请输入账号"}
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none transition-colors font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                          用户昵称 (Name)
                        </label>
                        <input
                          id="landing-reg-name"
                          type="text"
                          placeholder="请输入昵称"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                          设置登录密码 *
                        </label>
                        <div className="relative">
                          <input
                            id="landing-reg-password"
                            type={showRegPass ? "text" : "password"}
                            required
                            placeholder="至少 4 位字符"
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            className="w-full px-3 pr-8 py-2 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPass(!showRegPass)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 p-0.5"
                          >
                            {showRegPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                          确认密码 *
                        </label>
                        <input
                          id="landing-reg-confirm"
                          type="password"
                          required
                          placeholder="再次输入密码"
                          value={regConfirmPass}
                          onChange={(e) => setRegConfirmPass(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>



                    {/* Anti-spam Verification Code */}
                    <div>
                      <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1.5">
                        防刷安全验证码 * (点击图片换一张)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          id="landing-reg-captcha"
                          type="text"
                          required
                          maxLength={6}
                          placeholder="输入 4 位验证码"
                          value={regCaptcha}
                          onChange={(e) => setRegCaptcha(e.target.value)}
                          className="flex-1 min-w-0 px-3 py-2 bg-zinc-50 hover:bg-white focus:bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-600 focus:border-amber-600 dark:focus:border-amber-400 rounded-xl text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none transition-colors"
                        />
                        <div
                          onClick={refreshCaptcha}
                          className="relative cursor-pointer group rounded-xl overflow-hidden border border-zinc-300 dark:border-zinc-600 hover:border-amber-600 transition-colors shrink-0 bg-zinc-100 dark:bg-zinc-950 flex items-center shadow-xs"
                          title="点击刷新验证码"
                        >
                          <canvas
                            ref={captchaCanvasRef}
                            width={100}
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
                      id="landing-reg-submit"
                      type="submit"
                      variant="accent"
                      disabled={isRegistering}
                      className="w-full py-3 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 mt-2 cursor-pointer bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isRegistering ? "正在创建账号..." : "注 册 并 进 入 工 作 台"}</span>
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/60 py-4 px-4 sm:px-6 md:px-12 flex flex-col gap-2.5 text-xs text-zinc-600 dark:text-zinc-400 z-10 text-center transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>留白集 MarginLab • 独立本地沙盒 • 离线安全私密存储</span>
          </div>
          <div>
            <span>支持米家照片打印机 3寸/6寸相纸 • 先锋排版工作坊</span>
          </div>
        </div>

        {/* 备案信息：ICP 备案 / 公安部备案号，由管理员后台各自独立开关控制 */}
        {(showIcpFiling || showPoliceFiling) && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            {showIcpFiling && (
              <a
                href={siteFilingConfig.icpLink || "https://beian.miit.gov.cn/"}
                target="_blank"
                rel="noreferrer"
                className="hover:text-amber-700 dark:hover:text-studio-accent transition-colors"
              >
                {siteFilingConfig.icpNumber}
              </a>
            )}
            {showPoliceFiling && (
              <a
                href={siteFilingConfig.policeLink || "https://beian.mps.gov.cn/#/query/webSearch"}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-amber-700 dark:hover:text-studio-accent transition-colors"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>{siteFilingConfig.policeNumber}</span>
              </a>
            )}
          </div>
        )}
      </footer>
    </div>
  );
};
