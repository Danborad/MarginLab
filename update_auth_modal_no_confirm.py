with open("src/components/modals/AuthModal.tsx", "r") as f:
    text = f.read()

# Add confirmLogout state
text = text.replace(
    'const [isEditingProfile, setIsEditingProfile] = useState(false);',
    'const [isEditingProfile, setIsEditingProfile] = useState(false);\n  const [confirmLogout, setConfirmLogout] = useState(false);'
)

# Replace the confirm() in logout button
old_logout_btn = """                  <button
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
                  </button>"""

new_logout_btn = """                  {!confirmLogout ? (
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
                  )}"""

text = text.replace(old_logout_btn, new_logout_btn)

with open("src/components/modals/AuthModal.tsx", "w") as f:
    f.write(text)

print("Updated AuthModal.tsx (removed confirm popup)!")
