import re

# 1. Update Header.tsx
with open("src/components/layout/Header.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Update imports to include User, KeyRound, LogOut
content = content.replace(
    'import {\n  Sparkles,',
    'import {\n  Sparkles,\n  User,\n  KeyRound,\n  LogOut,'
)

# Add userMenuOpen and userMenuRef state and click-outside handler
state_block = '''  const [justSaved, setJustSaved] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);'''

content = content.replace(
    '''  const [justSaved, setJustSaved] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);''',
    state_block
)

# Replace the User Account Button with Dropdown
old_user_button = '''        {/* User Account / Auth Button */}
        {isAuthenticated && currentUser ? (
          <button
            onClick={() => setAuthModalOpen(true, "profile")}
            className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg bg-studio-card hover:bg-studio-hover border border-studio-border text-xs text-studio-text hover:text-studio-accent transition-all cursor-pointer group shadow-sm shrink-0"
            title={`当前账号：${currentUser.name} (@${currentUser.username}) • 点击进入个人中心`}
          >
            <AvatarView avatar={currentUser.avatar} size="xs" />
            <span className="font-medium max-w-[50px] xs:max-w-[75px] sm:max-w-[100px] truncate text-[11px] sm:text-xs">
              {currentUser.name.split(" ")[0]}
            </span>
            <ChevronDown className="w-3 h-3 text-studio-muted group-hover:text-studio-accent opacity-70 hidden sm:inline-block" />
          </button>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true, "login")}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-studio-accent hover:bg-studio-accentHover text-zinc-950 text-[11px] sm:text-xs font-semibold shadow-subtle-glow transition-all cursor-pointer shrink-0"
            title="登录或注册专属个人账号"
          >
            <LogIn className="w-3 h-3" />
            <span>登录</span>
          </button>
        )}'''

new_user_button = '''        {/* User Account Dropdown (Direct profile edit & 1-click logout) */}
        {isAuthenticated && currentUser ? (
          <div className="relative shrink-0" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={
                "flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs text-studio-text transition-all cursor-pointer shadow-sm shrink-0 " +
                (userMenuOpen
                  ? "bg-studio-card border-studio-accent text-studio-accent ring-1 ring-studio-accent/40"
                  : "bg-studio-card hover:bg-studio-hover border-studio-border hover:text-studio-accent")
              }
              title={`当前账号：${currentUser.name} (@${currentUser.username}) • 点击快捷操作`}
            >
              <AvatarView avatar={currentUser.avatar} size="xs" />
              <span className="font-medium max-w-[55px] xs:max-w-[85px] sm:max-w-[110px] truncate text-[11px] sm:text-xs">
                {currentUser.name.split(" ")[0]}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-studio-muted transition-transform duration-200 ${
                  userMenuOpen ? "rotate-180 text-studio-accent" : "opacity-80"
                }`}
              />
            </button>

            {/* Quick Dropdown Menu */}
            {userMenuOpen && (
              <div
                className="absolute left-0 top-full mt-1.5 w-64 bg-zinc-900/98 backdrop-blur-xl border border-studio-border rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn ring-1 ring-white/10 space-y-1"
                onClick={(e) => e.stopPropagation()}
              >
                {/* User Info Header */}
                <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-white/5 flex items-center gap-2.5 mb-1">
                  <div className="w-9 h-9 rounded-xl bg-studio-panel border border-studio-accent/40 flex items-center justify-center text-lg shrink-0 shadow-inner">
                    <AvatarView avatar={currentUser.avatar} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-semibold text-studio-text truncate">
                        {currentUser.name}
                      </h4>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                        在线
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-studio-accent truncate mt-0.5">
                      @{currentUser.username} • {currentUser.role || "独立创作者"}
                    </p>
                  </div>
                </div>

                {/* Option 1: Edit Profile / Personal Center */}
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setAuthModalOpen(true, "profile");
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs text-studio-text hover:text-studio-accent hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-lg bg-studio-panel flex items-center justify-center text-studio-muted group-hover:text-studio-accent border border-studio-border/60">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">编辑账号与个人中心</span>
                    <span className="text-[10px] text-studio-muted block">修改昵称、头像、简介</span>
                  </div>
                </button>

                {/* Option 2: Change Password */}
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setAuthModalOpen(true, "changePassword");
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs text-studio-text hover:text-studio-accent hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-lg bg-studio-panel flex items-center justify-center text-studio-muted group-hover:text-studio-accent border border-studio-border/60">
                    <KeyRound className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">修改登录密码</span>
                    <span className="text-[10px] text-studio-muted block">更新安全密码凭证</span>
                  </div>
                </button>

                {/* Option 3: Switch / Login Other Account */}
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setAuthModalOpen(true, "login");
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs text-studio-text hover:text-studio-accent hover:bg-white/10 flex items-center gap-2.5 transition-colors cursor-pointer group"
                >
                  <div className="w-6 h-6 rounded-lg bg-studio-panel flex items-center justify-center text-studio-muted group-hover:text-studio-accent border border-studio-border/60">
                    <LogIn className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">切换其他账号登录</span>
                    <span className="text-[10px] text-studio-muted block">进入其他创作者空间</span>
                  </div>
                </button>

                <div className="h-[1px] bg-studio-border/80 my-1 mx-1" />

                {/* Option 4: Instant 1-Click Logout */}
                <button
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await logout();
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs text-red-400 hover:text-red-300 hover:bg-red-500/15 border border-transparent hover:border-red-500/30 flex items-center gap-2.5 transition-colors cursor-pointer group"
                  title="一键退出当前登录，返回首页"
                >
                  <div className="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold">退出当前登录</span>
                    <span className="text-[10px] text-red-400/70 block">直接退出并返回登录页</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setAuthModalOpen(true, "login")}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-studio-accent hover:bg-studio-accentHover text-zinc-950 text-[11px] sm:text-xs font-semibold shadow-subtle-glow transition-all cursor-pointer shrink-0"
            title="登录或注册专属个人账号"
          >
            <LogIn className="w-3 h-3" />
            <span>登录</span>
          </button>
        )}'''

content = content.replace(old_user_button, new_user_button)

with open("src/components/layout/Header.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Header.tsx updated with dropdown menu!")

# 2. Update AuthModal.tsx to also have direct 1-click logout without tedious confirms
with open("src/components/modals/AuthModal.tsx", "r", encoding="utf-8") as f:
    auth_content = f.read()

# Replace confirmLogout logic in AuthModal
old_auth_logout = '''                  {!confirmLogout ? (
                    <button
                      type="button"
                      onClick={() => setConfirmLogout(true)}
                      className="py-2 px-3 rounded-xl bg-studio-panel hover:bg-red-500/15 border border-studio-border hover:border-red-500/40 text-xs text-red-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-400" />
                      <span>退出当前登录</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 animate-fadeIn">
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmLogout(false);
                          logout();
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-md"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>确认退出</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmLogout(false)}
                        className="py-2 px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
                      >
                        取消
                      </button>
                    </div>
                  )}'''

new_auth_logout = '''                  <button
                    type="button"
                    onClick={async () => {
                      setAuthModalOpen(false);
                      await logout();
                    }}
                    className="py-2 px-3 rounded-xl bg-studio-panel hover:bg-red-500/15 border border-studio-border hover:border-red-500/40 text-xs text-red-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="直接退出当前登录并返回首页"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>退出当前登录</span>
                  </button>'''

auth_content = auth_content.replace(old_auth_logout, new_auth_logout)

with open("src/components/modals/AuthModal.tsx", "w", encoding="utf-8") as f:
    f.write(auth_content)

print("AuthModal.tsx updated with direct logout!")
