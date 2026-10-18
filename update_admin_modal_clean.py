import re

with open("src/components/modals/AdminManagementModal.tsx", "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add confirmDialog state
old_state_def = """  // Action states
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);"""

new_state_def = """  // Action states
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // In-App Confirmation Dialog State (No native window.confirm / alert)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    confirmLabel?: string;
    confirmVariant?: "danger" | "accent";
    onConfirm: () => void;
  } | null>(null);"""

code = code.replace(old_state_def, new_state_def)

# 2. Replace handleCopyUrl
old_copy_url = """  const handleCopyUrl = (url: string) => {
    try {
      navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (e) {
      alert("已复制: " + url);
    }
  };"""

new_copy_url = """  const handleCopyUrl = (url: string) => {
    try {
      navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setStyleFeedback({ type: "success", text: `已复制 GitHub 仓库地址: ${url}` });
      setTimeout(() => setCopiedUrl(null), 2500);
    } catch (e) {
      setStyleFeedback({ type: "success", text: `GitHub 地址: ${url}` });
    }
  };"""

code = code.replace(old_copy_url, new_copy_url)

# 3. Replace handleToggleStatus
old_toggle_status = """  const handleToggleStatus = async (user: UserAccount) => {
    const nextStatus = user.status === "banned" ? "active" : "banned";
    if (nextStatus === "banned" && !window.confirm(`确定要封禁创作者「${user.name}」(@${user.username}) 吗？封禁后该账号将无法登录系统。`)) {
      return;
    }
    const res = await adminSetUserStatus(user.id, nextStatus);
    setFeedback({
      type: res.success ? "success" : "error",
      text: res.message,
    });
  };"""

new_toggle_status = """  const handleToggleStatus = async (user: UserAccount) => {
    const nextStatus = user.status === "banned" ? "active" : "banned";
    if (nextStatus === "banned") {
      setConfirmDialog({
        title: "封禁创作者账号",
        description: `确定要封禁创作者「${user.name}」(@${user.username}) 吗？封禁后该账号将无法登录系统。`,
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
  };"""

code = code.replace(old_toggle_status, new_toggle_status)

# 4. Replace handleDeleteUser
old_del_user = """  const handleDeleteUser = async (user: UserAccount) => {
    if (user.id === "user_admin") {
      alert("系统超级管理员账号不可删除！");
      return;
    }
    if (!window.confirm(`⚠️ 危险操作：确定要彻底删除创作者「${user.name}」(@${user.username}) 及其所有云端作品与素材吗？此操作不可撤销！`)) {
      return;
    }
    const res = await adminDeleteUser(user.id);
    setFeedback({
      type: res.success ? "success" : "error",
      text: res.message,
    });
  };"""

new_del_user = """  const handleDeleteUser = async (user: UserAccount) => {
    if (user.id === "user_admin") {
      setFeedback({ type: "error", text: "系统超级管理员账号不可删除！" });
      return;
    }
    setConfirmDialog({
      title: "危险操作：彻底删除创作者",
      description: `确定要彻底删除创作者「${user.name}」(@${user.username}) 及其所有私有作品与素材吗？此操作不可撤销！`,
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
  };"""

code = code.replace(old_del_user, new_del_user)

# 5. Replace handleDeleteStyle, handleResetStyles, handleCoverFileUpload
old_style_actions = """  const handleDeleteStyle = async (style: StylePreset) => {
    if (style.id === "dreamy_motion_editorial" || style.id === "fantasy_qiqiguaiguai") {
      alert(`「${style.name}」为官方核心复刻模板，不可删除。您可以选择停用它。`);
      return;
    }
    if (!window.confirm(`确定要彻底删除风格化模板「${style.name}」吗？此操作不可撤销！`)) {
      return;
    }
    const res = await adminDeleteAiStyle(style.id);
    setStyleFeedback({
      type: res.success ? "success" : "error",
      text: res.message,
    });
  };

  const handleResetStyles = async () => {
    if (!window.confirm("确定要恢复默认官方风格模板吗？这将保留 s21 为开启状态，并将其余未复刻模板设为停用。")) {
      return;
    }
    const res = await adminResetAiStyles();
    setStyleFeedback({
      type: res.success ? "success" : "error",
      text: res.message,
    });
  };

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await fileToBase64(file);
      setStyleCoverImage(b64);
    } catch (err) {
      alert("读取图片文件失败");
    }
  };"""

new_style_actions = """  const handleResetStyles = async () => {
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
  };"""

code = code.replace(old_style_actions, new_style_actions)

# 6. Remove handleOpenCreateStyle
code = re.sub(r'  const handleOpenCreateStyle = \(\) => \{[^}]+setStyleFeedback\(null\);\s+\};\n\n', '', code)

# 7. Remove "+ 新建风格模板" button
old_create_btn = """                <Button
                  variant="accent"
                  size="sm"
                  onClick={handleOpenCreateStyle}
                  className="text-xs flex items-center gap-1.5 shadow-subtle-glow cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>新建风格模板</span>
                </Button>"""

code = code.replace(old_create_btn, "")

# 8. Remove trash can delete button on style card
code = re.sub(
    r'<button\s+type="button"\s+onClick=\{\(\) => handleDeleteStyle\(style\)\}[^>]+>\s*<Trash2 className="w-3\.5 h-3\.5" \/>\s*<\/button>',
    '',
    code
)

# 9. Remove big GitHub cards block
# Pattern: from `{/* GitHub Official Reference Repositories & Skill Docs Banner */}` to `{/* Metrics Overview Cards */}`
gh_pattern = r'\{/\*\s*GitHub Official Reference Repositories & Skill Docs Banner\s*\*\/\}.*?(?=\{/\*\s*Metrics Overview Cards\s*\*\/})'
code = re.sub(gh_pattern, '', code, flags=re.DOTALL)

# 10. In Style Edit Modal: Replace Category select with read-only badge
old_cat_select = """                  <div>
                    <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                      风格分类
                    </label>
                    <select
                      value={styleCategory}
                      onChange={(e) => setStyleCategory(e.target.value as StyleCategory)}
                      className="w-full px-3 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text focus:outline-none cursor-pointer"
                    >
                      {STYLE_CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>"""

new_cat_badge = """                  <div>
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
                  </div>"""

code = code.replace(old_cat_select, new_cat_badge)

# 11. Update Style Edit Modal title
code = code.replace(
    '{isCreatingStyle ? "新建风格化模板" : `编辑风格化模板 · ${editingStyle?.name}`}',
    '`编辑风格化模板 · ${editingStyle?.name}`'
)
code = code.replace('{(editingStyle || isCreatingStyle) && (', '{editingStyle && (')
code = code.replace('const [isCreatingStyle, setIsCreatingStyle] = useState(false);', '')
code = code.replace('setIsCreatingStyle(false);', '')

# 12. Add the custom in-app confirm dialog before the final closing </div>
confirm_dialog_jsx = """
        {/* CUSTOM IN-APP CONFIRMATION DIALOG (ATELIER SYSTEM THEMED) */}
        {confirmDialog && (
          <div
            className="fixed inset-0 z-70 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn select-none"
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
                      ? "bg-red-500/15 border-red-500/30 text-red-500"
                      : "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
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
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
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
                      : "bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-zinc-950"
                  }`}
                >
                  {confirmDialog.confirmLabel || "确认执行"}
                </button>
              </div>
            </div>
          </div>
        )}
"""

# Place confirm_dialog_jsx right before the last closing tags
code = code[:-10] + confirm_dialog_jsx + code[-10:]

with open("src/components/modals/AdminManagementModal.tsx", "w", encoding="utf-8") as f:
    f.write(code)

print("AdminManagementModal updated successfully!")
