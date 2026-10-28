import React, { useState, useEffect, useRef } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { generateCaptchaCode, drawCaptchaCanvas } from "../../lib/captcha";
import { WebsiteLogo } from "../ui/WebsiteLogo";
import { AvatarView } from "../ui/AvatarView";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Check,
  AlertCircle,
  RefreshCw,
  Mail,
  Lock,
  User,
  ArrowRight,
  LayoutGrid,
  BookOpen,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────
   登录视觉轮播素材（左侧展示区）
   后续可由管理员在后台上传替换；此处先用站内既有高清样张。
   ──────────────────────────────────────────────────────────── */
const SLIDES: { img: string; title: string; sub: string }[] = [
  {
    img: "/album_samples/jiuzhaigou/spread_1_full.png",
    title: "留白集 | 一站式 AI 美学风格工作台",
    sub: "注册即享 50 算力积分 + 5GB 专属云图库",
  },
  {
    img: "/album_samples/jiuzhaigou/spread_3_full.png",
    title: "AI 调色 · 风格化 · 艺术拼图排版",
    sub: "为摄影师与设计师准备的极简创作台",
  },
  {
    img: "/album_samples/jiuzhaigou/spread_5_full.png",
    title: "相册成书与米家相纸一键冲印",
    sub: "3 寸 / 6 寸专属适配，300DPI 无损出片",
  },
];

type Tab = "login" | "register" | "forgot";

const SLIDE_INTERVAL = 6000;

export const AuthPortalPage: React.FC = () => {
  const login = useEditorStore((s) => s.login);
  const register = useEditorStore((s) => s.register);
  const sendVerificationCode = useEditorStore((s) => s.sendVerificationCode);
  const publicEmailConfig = useEditorStore((s) => s.publicEmailConfig);
  const fetchPublicEmailConfig = useEditorStore((s) => s.fetchPublicEmailConfig);
  const setCurrentView = useEditorStore((s) => s.setCurrentView);
  const setAlbumModalOpen = useEditorStore((s) => s.setAlbumModalOpen);
  const systemConfig = useEditorStore((s) => s.systemConfig);
  const fetchSystemConfig = useEditorStore((s) => s.fetchSystemConfig);
  const themeMode = useEditorStore((s) => s.themeMode);
  const siteFilingConfig = useEditorStore((s) => s.siteFilingConfig);

  const [tab, setTab] = useState<Tab>("login");
  const [slide, setSlide] = useState(0);

  // 登录
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 注册
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [regName, setRegName] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [showRegPass, setShowRegPass] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaCode, setCaptchaCode] = useState(() => generateCaptchaCode());
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [legalOpen, setLegalOpen] = useState<null | "terms" | "privacy">(null);

  // 找回密码
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPass, setResetPass] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  const captchaRef = useRef<HTMLCanvasElement>(null);

  const registerPoints = systemConfig?.registerPoints ?? 50;
  const storageGB = systemConfig?.defaultStorageGB ?? 5;

  useEffect(() => {
    fetchPublicEmailConfig();
    fetchSystemConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 轮播
  useEffect(() => {
    const t = setInterval(() => setSlide((i) => (i + 1) % SLIDES.length), SLIDE_INTERVAL);
    return () => clearInterval(t);
  }, []);

  // 验证码绘制
  useEffect(() => {
    if (captchaRef.current) drawCaptchaCanvas(captchaRef.current, captchaCode, themeMode);
  }, [captchaCode, themeMode, tab]);

  // 冷却
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const t = setInterval(() => setResetCooldown((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [resetCooldown]);

  const emailDomain = email.includes("@") ? email.split("@")[1].trim().toLowerCase() : "";
  const domainAllowed =
    !publicEmailConfig.whitelistEnabled ||
    !publicEmailConfig.whitelistDomains?.length ||
    !emailDomain ||
    publicEmailConfig.whitelistDomains.includes(emailDomain);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccess("");
    if (!username.trim()) return setLoginError("请输入登录账号");
    if (!password.trim()) return setLoginError("请输入密码");
    setIsLoggingIn(true);
    const res = await login(username.trim(), password.trim());
    setIsLoggingIn(false);
    if (res.success) setLoginSuccess(res.message);
    else setLoginError(res.message);
  };

  const handleSendCode = async () => {
    setRegError("");
    setRegSuccess("");
    const clean = email.trim().toLowerCase();
    if (!clean) return setRegError("请先输入注册邮箱");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return setRegError("邮箱格式不正确");
    if (!domainAllowed) return setRegError(`邮箱域名 @${emailDomain} 不在允许名单内`);
    setIsSendingCode(true);
    const res = await sendVerificationCode(clean, "register");
    setIsSendingCode(false);
    if (res.success) {
      setRegSuccess(res.message);
      setCooldown(60);
    } else setRegError(res.message);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");
    const clean = email.trim().toLowerCase();
    if (!clean) return setRegError("请输入注册邮箱");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return setRegError("请输入有效的邮箱地址");
    if (!domainAllowed) return setRegError(`邮箱域名 @${emailDomain} 不在允许名单内`);
    if (publicEmailConfig.enabled && !emailCode.trim()) return setRegError("请输入邮箱验证码");
    if (!regPass.trim() || regPass.trim().length < 4) return setRegError("密码至少 4 位字符");
    if (regPass !== regConfirm) return setRegError("两次输入的密码不一致");
    if (!captcha.trim()) return setRegError("请输入图片验证码");
    if (captcha.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setCaptchaCode(generateCaptchaCode());
      setCaptcha("");
      return setRegError("图片验证码错误，请重新输入");
    }
    if (!agreeTerms) return setRegError("请先阅读并勾选用户服务协议与隐私政策");

    setIsRegistering(true);
    const res = await register({
      username: clean.split("@")[0],
      password: regPass.trim(),
      name: regName.trim() || clean.split("@")[0],
      email: clean,
      code: emailCode.trim(),
    });
    setIsRegistering(false);
    if (res.success) setRegSuccess(res.message);
    else {
      setRegError(res.message);
      setCaptchaCode(generateCaptchaCode());
      setCaptcha("");
    }
  };

  const handleSendResetCode = async () => {
    setResetError("");
    setResetSuccess("");
    const clean = resetEmail.trim().toLowerCase();
    if (!clean) return setResetError("请输入注册邮箱");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return setResetError("邮箱格式不正确");
    const res = await sendVerificationCode(clean, "reset");
    if (res.success) {
      setResetSuccess(res.message);
      setResetCooldown(60);
    } else setResetError(res.message);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    if (!resetEmail.trim()) return setResetError("请输入注册邮箱");
    if (!resetCode.trim()) return setResetError("请输入邮箱验证码");
    if (!resetPass.trim() || resetPass.trim().length < 4) return setResetError("新密码至少 4 位字符");
    setIsResetting(true);
    const res = await useEditorStore.getState().resetPasswordWithEmail(
      resetEmail.trim().toLowerCase(),
      resetCode.trim(),
      resetPass.trim()
    );
    setIsResetting(false);
    if (res.success) {
      setResetSuccess(res.message);
      setTimeout(() => {
        setTab("login");
        setUsername(resetEmail.split("@")[0]);
      }, 1200);
    } else setResetError(res.message);
  };

  const inputCls =
    "w-full pl-10 pr-3 py-3 input-dark text-sm font-medium placeholder:text-studio-dim";
  const labelCls = "text-[11px] font-bold text-studio-muted block mb-1.5 whitespace-nowrap";
  const primaryBtn =
    "w-full py-3 rounded-xl btn-aurora text-sm font-bold flex items-center justify-center gap-2";

  return (
    <div className="min-h-screen w-full bg-studio-bg text-studio-text flex items-center justify-center p-3 sm:p-6 relative overflow-y-auto no-scrollbar">
      {/* 极光氛围 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[720px] h-[520px] rounded-full bg-[#0D254C] opacity-70 blur-[130px] animate-aurora" />
        <div className="absolute top-1/4 -right-32 w-[560px] h-[560px] rounded-full bg-violet-600/25 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[520px] h-[380px] rounded-full bg-emerald-500/12 blur-[150px]" />
      </div>

      {/* 主卡片：左图右表 5.5 : 4.5 */}
      <div className="relative z-10 w-full max-w-6xl my-auto rounded-3xl overflow-hidden glass-float shadow-glass-lg flex flex-col lg:flex-row lg:max-h-[calc(100vh-72px)]">
        {/* ── 左：视觉展示区 ── */}
        <div className="relative lg:w-[55%] h-36 sm:h-48 lg:h-auto lg:min-h-[560px] overflow-hidden bg-black shrink-0">
          {SLIDES.map((s, i) => (
            <img
              key={s.img}
              src={s.img}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                i === slide ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
          {/* 渐变遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/20" />

          {/* 品牌角标 */}
          <div className="absolute top-5 left-5 flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 flex items-center justify-center text-emerald-400">
              <WebsiteLogo className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-bold text-white tracking-wide">留白集</p>
              <p className="text-[9px] font-mono tracking-[0.24em] text-white/60">MARGINLAB</p>
            </div>
          </div>

          {/* 左右切换 */}
          <button
            onClick={() => setSlide((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="上一张"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSlide((i) => (i + 1) % SLIDES.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="下一张"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* 底部 Slogan + 圆点 */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8">
            <h2 className="text-base sm:text-2xl font-bold text-white leading-snug">
              {SLIDES[slide].title}
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-white/70">{SLIDES[slide].sub}</p>
            <div className="flex items-center gap-1.5 mt-4">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === slide ? "w-6 bg-emerald-400" : "w-1.5 bg-white/35 hover:bg-white/60"
                  }`}
                  aria-label={`第 ${i + 1} 张`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── 右：交互表单区 ── */}
        <div className="lg:w-[45%] p-5 sm:p-8 flex flex-col justify-center bg-studio-panel/60 lg:overflow-y-auto no-scrollbar">
          <div className="w-full max-w-sm mx-auto">
            {/* 标题 */}
            <h1 className="text-xl sm:text-2xl font-bold text-studio-text">
              {tab === "login" ? "欢迎登录留白集" : tab === "register" ? "创建你的专属账号" : "找回密码"}
            </h1>
            <p className="mt-1 text-xs text-studio-muted">
              {tab === "login"
                ? "登录后继续你的 AI 创作与排版工作"
                : tab === "register"
                ? `注册即享 ${registerPoints} 算力积分 + ${storageGB}GB 专属云图库`
                : "通过注册邮箱验证码重置登录密码"}
            </p>

            {/* 表单切换 */}
            {tab !== "forgot" && (
              <div className="mt-5 grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/5 border border-studio-border">
                {(
                  [
                    { id: "login" as Tab, label: "登录", icon: LogIn },
                    { id: "register" as Tab, label: "注册", icon: UserPlus },
                  ]
                ).map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setTab(t.id);
                        setLoginError("");
                        setRegError("");
                      }}
                      className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        tab === t.id
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/35"
                          : "text-studio-muted hover:text-studio-text border border-transparent"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── 登录 ── */}
            {tab === "login" && (
              <form onSubmit={handleLogin} className="mt-5 space-y-3.5">
                {loginError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-medium flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
                {loginSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{loginSuccess}</span>
                  </div>
                )}

                <div>
                  <label className={labelCls}>登录账号 / 邮箱</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-studio-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="landing-login-username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="请输入用户名或邮箱"
                      className={inputCls}
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>登录密码</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-studio-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="landing-login-password"
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入登录密码"
                      className={`${inputCls} pr-10`}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-studio-dim hover:text-studio-text cursor-pointer"
                    >
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setTab("forgot")}
                    className="text-[11px] font-semibold text-studio-muted hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    忘记密码？
                  </button>
                  <span className="text-[10px] text-studio-dim">每日签到可获算力积分</span>
                </div>

                <button type="submit" disabled={isLoggingIn} className={primaryBtn}>
                  <LogIn className="w-4 h-4" />
                  {isLoggingIn ? "登录中…" : "登 录"}
                </button>
              </form>
            )}

            {/* ── 注册 ── */}
            {tab === "register" && (
              <form onSubmit={handleRegister} className="mt-5 space-y-3">
                {regError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] font-medium flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}
                {regSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                <div>
                  <label className={labelCls}>注册邮箱 *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-studio-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="landing-reg-email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputCls}
                      autoComplete="email"
                    />
                  </div>
                  {emailDomain && (
                    <p
                      className={`mt-1 text-[10px] ${
                        domainAllowed ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {domainAllowed ? `@${emailDomain} 可注册` : `@${emailDomain} 不在允许名单`}
                    </p>
                  )}
                </div>

                {publicEmailConfig.enabled && (
                  <div>
                    <label className={labelCls}>邮箱验证码 *</label>
                    <div className="flex items-center gap-2">
                      <input
                        id="landing-reg-emailcode"
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value)}
                        placeholder="6 位验证码"
                        maxLength={6}
                        className="flex-1 min-w-0 px-3 py-3 input-dark text-sm font-mono tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={isSendingCode || cooldown > 0}
                        className="shrink-0 px-3 py-3 rounded-xl btn-glass text-[11px] font-bold whitespace-nowrap cursor-pointer disabled:opacity-50"
                      >
                        {cooldown > 0 ? `${cooldown}s` : isSendingCode ? "发送中" : "发送验证码"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className={labelCls}>昵称</label>
                    <input
                      id="landing-reg-name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="选填"
                      className="w-full px-3 py-3 input-dark text-sm"
                    />
                  </div>
                  <div>
                    <label className={labelCls}>密码 *</label>
                    <div className="relative">
                      <input
                        id="landing-reg-password"
                        type={showRegPass ? "text" : "password"}
                        value={regPass}
                        onChange={(e) => setRegPass(e.target.value)}
                        placeholder="至少 4 位"
                        className="w-full px-3 pr-9 py-3 input-dark text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPass(!showRegPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-studio-dim hover:text-studio-text cursor-pointer"
                      >
                        {showRegPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>确认密码 *</label>
                  <input
                    id="landing-reg-confirm"
                    type="password"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    placeholder="再次输入密码"
                    className="w-full px-3 py-3 input-dark text-sm"
                  />
                </div>

                <div>
                  <label className={labelCls}>图片验证码 *</label>
                  <div className="flex items-center gap-2">
                    <input
                      id="landing-reg-captcha"
                      value={captcha}
                      onChange={(e) => setCaptcha(e.target.value)}
                      placeholder="输入验证码"
                      maxLength={6}
                      className="flex-1 min-w-0 px-3 py-3 input-dark text-sm font-mono uppercase tracking-widest"
                    />
                    <div
                      onClick={() => setCaptchaCode(generateCaptchaCode())}
                      className="relative cursor-pointer rounded-xl overflow-hidden border border-studio-border hover:border-emerald-500/50 transition-colors shrink-0 bg-studio-card flex items-center"
                      title="点击换一张"
                    >
                      <canvas ref={captchaRef} width={100} height={38} className="block" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-emerald-300 gap-1 pointer-events-none">
                        <RefreshCw className="w-3 h-3" />
                        换一张
                      </div>
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 w-3.5 h-3.5 rounded border-studio-border accent-emerald-500 cursor-pointer shrink-0"
                  />
                  <span className="text-[10px] leading-relaxed text-studio-muted">
                    已阅读并同意
                    <button
                      type="button"
                      onClick={() => setLegalOpen("terms")}
                      className="text-emerald-400 hover:underline mx-0.5 cursor-pointer"
                    >
                      《用户服务协议》
                    </button>
                    与
                    <button
                      type="button"
                      onClick={() => setLegalOpen("privacy")}
                      className="text-emerald-400 hover:underline mx-0.5 cursor-pointer"
                    >
                      《隐私政策》
                    </button>
                    ，并知悉 AI 功能使用须知
                  </span>
                </label>

                <button type="submit" disabled={isRegistering} className={primaryBtn}>
                  <UserPlus className="w-4 h-4" />
                  {isRegistering ? "创建中…" : "注册并进入工作台"}
                </button>
              </form>
            )}

            {/* ── 找回密码 ── */}
            {tab === "forgot" && (
              <form onSubmit={handleResetPassword} className="mt-5 space-y-3.5">
                {resetError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}
                {resetSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>{resetSuccess}</span>
                  </div>
                )}

                <div>
                  <label className={labelCls}>注册邮箱</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-studio-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className={labelCls}>邮箱验证码</label>
                  <div className="flex items-center gap-2">
                    <input
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="6 位验证码"
                      maxLength={6}
                      className="flex-1 min-w-0 px-3 py-3 input-dark text-sm font-mono tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={handleSendResetCode}
                      disabled={resetCooldown > 0}
                      className="shrink-0 px-3 py-3 rounded-xl btn-glass text-[11px] font-bold whitespace-nowrap cursor-pointer disabled:opacity-50"
                    >
                      {resetCooldown > 0 ? `${resetCooldown}s` : "发送验证码"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className={labelCls}>新密码</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-studio-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={resetPass}
                      onChange={(e) => setResetPass(e.target.value)}
                      placeholder="至少 4 位字符"
                      className={inputCls}
                    />
                  </div>
                </div>

                <button type="submit" disabled={isResetting} className={primaryBtn}>
                  <ShieldCheck className="w-4 h-4" />
                  {isResetting ? "重置中…" : "重置密码"}
                </button>

                <button
                  type="button"
                  onClick={() => setTab("login")}
                  className="w-full text-[11px] font-semibold text-studio-muted hover:text-emerald-300 transition-colors cursor-pointer"
                >
                  返回登录
                </button>
              </form>
            )}

            {/* 第三方登录位（占位，后续接入） */}
            <div className="mt-5">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-studio-border" />
                <span className="text-[10px] text-studio-dim whitespace-nowrap">其他登录方式</span>
                <div className="flex-1 h-px bg-studio-border" />
              </div>
              <div className="mt-3 flex items-center justify-center gap-3">
                {["微信", "抖音", "GitHub"].map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled
                    title={`${n}登录即将开放`}
                    className="w-10 h-10 rounded-xl bg-white/5 border border-studio-border flex items-center justify-center text-studio-dim hover:text-studio-text hover:border-studio-border/80 transition-colors cursor-not-allowed opacity-60"
                  >
                    <span className="text-[10px] font-bold">{n.slice(0, 1)}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 游客浏览入口 */}
            <div className="mt-5 pt-4 border-t border-studio-border flex flex-col gap-2">
              <button
                onClick={() => setCurrentView("studio")}
                className="w-full px-3 py-2 rounded-xl btn-glass text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                进入工作台浏览（只读速览）
              </button>
              <button
                onClick={() => setAlbumModalOpen(true)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-studio-border text-[11px] font-semibold text-studio-muted hover:text-studio-text flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                翻阅 3D 艺术画册《九寨沟旅记》
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 协议 / 隐私 弹层 */}
      {legalOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLegalOpen(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[80vh] glass-float rounded-2xl flex flex-col overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3 border-b border-studio-border flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-studio-text">
                {legalOpen === "terms" ? "用户服务协议" : "隐私政策"}
              </h3>
              <button
                onClick={() => setLegalOpen(null)}
                className="px-2.5 py-1 rounded-lg btn-glass text-[11px] font-semibold cursor-pointer"
              >
                关闭
              </button>
            </div>
            <div className="p-5 overflow-y-auto text-[12px] leading-relaxed text-studio-muted whitespace-pre-wrap">
              {(legalOpen === "terms" ? systemConfig?.termsHtml : systemConfig?.privacyHtml) ||
                (legalOpen === "terms"
                  ? "本协议尚未由管理员配置。默认条款：用户需合法使用本平台提供的 AI 图像处理与排版能力，不得上传侵犯他人权利的素材；AI 生成内容由用户自行承担使用责任。"
                  : "本隐私政策尚未由管理员配置。默认说明：平台仅保存你上传的素材、生成结果与账号信息，用于提供创作与云端存储服务，不会向第三方出售你的个人数据。")}
            </div>
          </div>
        </div>
      )}

      {/* 页脚备案 */}
      <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-studio-dim px-4">
        <span>留白集 MarginLab · 独立沙盒存储</span>
        {siteFilingConfig.icpEnabled && siteFilingConfig.icpNumber && (
          <a
            href={siteFilingConfig.icpLink}
            target="_blank"
            rel="noreferrer"
            className="ml-2 hover:text-studio-muted"
          >
            {siteFilingConfig.icpNumber}
          </a>
        )}
        {siteFilingConfig.policeEnabled && siteFilingConfig.policeNumber && (
          <a
            href={siteFilingConfig.policeLink}
            target="_blank"
            rel="noreferrer"
            className="ml-2 hover:text-studio-muted"
          >
            {siteFilingConfig.policeNumber}
          </a>
        )}
      </div>
    </div>
  );
};

export default AuthPortalPage;
