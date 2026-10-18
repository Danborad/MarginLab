with open("src/components/modals/AuthModal.tsx", "r") as f:
    text = f.read()

# Add AvatarPicker and AvatarView imports
text = text.replace(
    'import { generateCaptchaCode, drawCaptchaCanvas } from "../../lib/captcha";',
    'import { generateCaptchaCode, drawCaptchaCanvas } from "../../lib/captcha";\nimport { AvatarPicker } from "../ui/AvatarPicker";\nimport { AvatarView } from "../ui/AvatarView";'
)

# Replace Register form avatar grid in AuthModal
old_reg_avatar = """                <div>
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
                </div>"""

new_reg_avatar = """                <div>
                  <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
                    选择头像 (艺术 Emoji / 读取 QQ 头像)
                  </label>
                  <AvatarPicker value={regAvatar} onChange={setRegAvatar} />
                </div>"""

text = text.replace(old_reg_avatar, new_reg_avatar)

# Replace Edit Profile avatar grid in AuthModal
old_edit_avatar = """                    <div>
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
                    </div>"""

new_edit_avatar = """                    <div>
                      <label className="text-[10px] font-mono text-studio-muted uppercase block mb-1">
                        选择头像 (艺术 Emoji / 读取 QQ 头像)
                      </label>
                      <AvatarPicker value={editAvatar} onChange={setEditAvatar} />
                    </div>"""

text = text.replace(old_edit_avatar, new_edit_avatar)

# Update avatar rendering in top header, profile card, and demo accounts
text = text.replace(
    '{currentUser ? currentUser.avatar : <Lock className="w-5 h-5 text-studio-accent" />}',
    '{currentUser ? <AvatarView avatar={currentUser.avatar} size="lg" /> : <Lock className="w-5 h-5 text-studio-accent" />}'
)

text = text.replace(
    '<span className="text-base">{acc.avatar}</span>',
    '<AvatarView avatar={acc.avatar} size="sm" />'
)

text = text.replace(
    '{currentUser.avatar}',
    '<AvatarView avatar={currentUser.avatar} size="xl" />'
)

with open("src/components/modals/AuthModal.tsx", "w") as f:
    f.write(text)

print("Updated AuthModal.tsx with AvatarPicker & AvatarView!")
