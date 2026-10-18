with open("src/components/home/LandingHomePage.tsx", "r") as f:
    text = f.read()

# Add AvatarPicker and AvatarView imports
text = text.replace(
    'import { generateCaptchaCode, drawCaptchaCanvas } from "../../lib/captcha";',
    'import { generateCaptchaCode, drawCaptchaCanvas } from "../../lib/captcha";\nimport { AvatarPicker } from "../ui/AvatarPicker";\nimport { AvatarView } from "../ui/AvatarView";'
)

# Replace Emoji grid in LandingHomePage with AvatarPicker
old_avatar_grid = """                    <div>
                      <label className=\"text-[11px] font-mono text-studio-muted uppercase block mb-1\">
                        挑选专属头像
                      </label>
                      <div className=\"grid grid-cols-6 gap-1 bg-zinc-950 p-1.5 rounded-xl border border-studio-border\">
                        {AVATAR_OPTIONS.map((emoji) => (
                          <button
                            type=\"button\"
                            key={emoji}
                            onClick={() => setRegAvatar(emoji)}
                            className={`h-8 rounded-lg flex items-center justify-center text-base transition-all ${
                              regAvatar === emoji
                                ? \"bg-studio-accent/30 border border-studio-accent scale-110 shadow-sm\"
                                : \"hover:bg-white/5 opacity-70 hover:opacity-100\"
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>"""

new_avatar_grid = """                    <div>
                      <label className=\"text-[11px] font-mono text-studio-muted uppercase block mb-1\">
                        选择头像 (支持 12 款艺术 Emoji 或 输入 QQ 号读取头像)
                      </label>
                      <AvatarPicker value={regAvatar} onChange={setRegAvatar} />
                    </div>"""

text = text.replace(old_avatar_grid, new_avatar_grid)

# Update avatar rendering in top header and demo accounts
text = text.replace(
    '<span className="text-base">{currentUser.avatar}</span>',
    '<AvatarView avatar={currentUser.avatar} size="sm" />'
)

text = text.replace(
    '<span className="text-lg">{acc.avatar}</span>',
    '<AvatarView avatar={acc.avatar} size="sm" />'
)

with open("src/components/home/LandingHomePage.tsx", "w") as f:
    f.write(text)

print("Updated LandingHomePage.tsx with AvatarPicker & AvatarView!")
