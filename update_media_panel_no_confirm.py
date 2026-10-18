with open("src/components/panels/MediaPanel.tsx", "r") as f:
    text = f.read()

# Add confirmClear state
text = text.replace(
    'const [isUploading, setIsUploading] = useState<boolean>(false);',
    'const [isUploading, setIsUploading] = useState<boolean>(false);\n  const [confirmClear, setConfirmClear] = useState<boolean>(false);'
)

# Replace the confirm() on clearAllMediaAssets
old_clear_btn = """                {mediaAssets.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("确定要清空当前账号上传的所有素材图片吗？")) {
                        clearAllMediaAssets();
                      }
                    }}
                    className="text-studio-muted hover:text-red-400 transition-colors cursor-pointer"
                  >
                    清空素材
                  </button>
                )}"""

new_clear_btn = """                {mediaAssets.length > 0 && (
                  !confirmClear ? (
                    <button
                      onClick={() => setConfirmClear(true)}
                      className="text-studio-muted hover:text-red-400 transition-colors cursor-pointer"
                    >
                      清空素材
                    </button>
                  ) : (
                    <span className="flex items-center gap-1.5 animate-fadeIn">
                      <span className="text-red-400 font-mono text-[9px]">确认清空?</span>
                      <button
                        onClick={() => {
                          clearAllMediaAssets();
                          setConfirmClear(false);
                        }}
                        className="text-red-400 hover:underline font-semibold cursor-pointer text-[10px]"
                      >
                        确认
                      </button>
                      <button
                        onClick={() => setConfirmClear(false)}
                        className="text-studio-muted hover:text-white cursor-pointer text-[10px]"
                      >
                        取消
                      </button>
                    </span>
                  )
                )}"""

text = text.replace(old_clear_btn, new_clear_btn)

with open("src/components/panels/MediaPanel.tsx", "w") as f:
    f.write(text)

print("Updated MediaPanel.tsx (removed confirm popup)!")
