with open("src/components/modals/AuthModal.tsx", "r") as f:
    text = f.read()

# Add captcha import
text = text.replace(
    'import { useEditorStore, DEFAULT_ACCOUNTS, AuthTab } from "../../store/useEditorStore";',
    'import { useEditorStore, DEFAULT_ACCOUNTS, AuthTab } from "../../store/useEditorStore";\nimport { generateCaptchaCode, drawCaptchaCanvas } from "../../lib/captcha";'
)

# Add RefreshCw icon import if needed
text = text.replace('Sparkle,', 'Sparkle,\n  RefreshCw,')

# Add Captcha states in AuthModal
old_state = """  // Register Form State
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
  const [isRegistering, setIsRegistering] = useState(false);"""

new_state = """  // Register Form State & Captcha
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regRole, setRegRole] = useState("");
  const [regBio, setRegBio] = useState("");
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
      drawCaptchaCanvas(captchaCanvasRef.current, newCode);
    }
  }, []);

  React.useEffect(() => {
    if (tab === "register" && captchaCanvasRef.current) {
      drawCaptchaCanvas(captchaCanvasRef.current, captchaCode);
    }
  }, [tab, captchaCode]);"""

text = text.replace(old_state, new_state)

# Add Captcha check in handleRegisterSubmit
old_handle_reg = """    if (regPassword.trim() !== regConfirmPassword.trim()) {
      setRegError("两次输入的密码不一致，请核对");
      return;
    }"""

new_handle_reg = """    if (regPassword.trim() !== regConfirmPassword.trim()) {
      setRegError("两次输入的密码不一致，请核对");
      return;
    }

    if (!regCaptcha.trim()) {
      setRegError("请输入图形验证码");
      return;
    }

    if (regCaptcha.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setRegError("验证码输入错误，已自动刷新，请重新输入");
      setRegCaptcha("");
      refreshCaptcha();
      return;
    }"""

text = text.replace(old_handle_reg, new_handle_reg)

# Add Captcha input field into the Register Form JSX (above the submit button)
target_jsx = """                <Button
                  type="submit"
                  variant="accent"
                  disabled={isRegistering}
                  className="w-full py-2.5 rounded-xl text-xs font-semibold shadow-subtle-glow flex items-center justify-center gap-1.5 mt-2"
                >"""

captcha_jsx = """                {/* Anti-spam Verification Code */}
                <div>
                  <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1">
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
                      className="flex-1 px-3 py-1.5 bg-studio-card border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:text-studio-muted/60 focus:outline-none"
                    />
                    <div
                      onClick={refreshCaptcha}
                      className="relative cursor-pointer group rounded-xl overflow-hidden border border-studio-border hover:border-studio-accent transition-colors shrink-0 bg-studio-card flex items-center shadow-inner"
                      title="点击刷新验证码"
                    >
                      <canvas
                        ref={captchaCanvasRef}
                        width={110}
                        height={34}
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
                  className="w-full py-2.5 rounded-xl text-xs font-semibold shadow-subtle-glow flex items-center justify-center gap-1.5 mt-2"
                >"""

text = text.replace(target_jsx, captcha_jsx)

with open("src/components/modals/AuthModal.tsx", "w") as f:
    f.write(text)

print("Updated AuthModal.tsx with Captcha!")
