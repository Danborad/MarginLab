with open("src/components/layout/Header.tsx", "r") as f:
    text = f.read()

# Add setCurrentView from store
old_store_hooks = """  const setAuthModalOpen = useEditorStore((s) => s.setAuthModalOpen);
  const logout = useEditorStore((s) => s.logout);"""

new_store_hooks = """  const setAuthModalOpen = useEditorStore((s) => s.setAuthModalOpen);
  const setCurrentView = useEditorStore((s) => s.setCurrentView);
  const logout = useEditorStore((s) => s.logout);"""

text = text.replace(old_store_hooks, new_store_hooks)

# Add Home button in the header brand area
old_brand = """        <div className=\"flex items-center gap-2\">
          <div className=\"w-8 h-8 rounded-lg bg-gradient-to-tr from-stone-800 to-stone-600 border border-studio-accent/40 flex items-center justify-center text-studio-accent shadow-sm\">
            <Sparkles className=\"w-4 h-4\" />
          </div>
          <div>
            <div className=\"flex items-center gap-1.5\">
              <span className=\"font-serif tracking-widest text-sm font-semibold text-studio-accent\">
                ATELIER
              </span>
              <span className=\"text-[10px] font-mono px-1.5 py-0.5 rounded bg-studio-card text-studio-muted border border-studio-border hidden sm:inline-block\">
                艺境
              </span>
            </div>
          </div>
        </div>"""

new_brand = """        <button
          onClick={() => setCurrentView("home")}
          className=\"flex items-center gap-2 hover:opacity-85 transition-opacity cursor-pointer text-left\"
          title=\"点击返回登录与产品首页\"
        >
          <div className=\"w-8 h-8 rounded-lg bg-gradient-to-tr from-stone-800 to-stone-600 border border-studio-accent/40 flex items-center justify-center text-studio-accent shadow-sm\">
            <Sparkles className=\"w-4 h-4\" />
          </div>
          <div>
            <div className=\"flex items-center gap-1.5\">
              <span className=\"font-serif tracking-widest text-sm font-semibold text-studio-accent\">
                ATELIER
              </span>
              <span className=\"text-[10px] font-mono px-1.5 py-0.5 rounded bg-studio-card text-studio-muted border border-studio-border hidden sm:inline-block\">
                首页 ↗
              </span>
            </div>
          </div>
        </button>"""

text = text.replace(old_brand, new_brand)

with open("src/components/layout/Header.tsx", "w") as f:
    f.write(text)

print("Updated Header.tsx with Home button!")
