with open("src/components/layout/Header.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add ArrowLeft import if not present
if "ArrowLeft," not in content:
    content = content.replace("Undo2,\n", "Undo2,\n  ArrowLeft,\n")

# 2. Hide Save button in stylize mode
old_save_btn = """      {/* Save Status / Quick Save Button */}
       <button
         onClick={handleQuickSave}"""

new_save_btn = """      {/* Save Status / Quick Save Button (Hidden in AI Stylize Stage) */}
      {activePanel !== "ai-stylize" && (
       <button
         onClick={handleQuickSave}"""

if old_save_btn in content:
    content = content.replace(old_save_btn, new_save_btn)
    # close the condition after button
    target_btn_close = """          title="保存画作到当前账号作品库"
        >
          {justSaved ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline-block">已保存</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline-block">{isDirty ? "保存*" : "保存"}</span>
            </>
          )}
        </button>"""
    if target_btn_close in content:
        content = content.replace(target_btn_close, target_btn_close + "\n      )}")
        print("Updated Save button visibility in Header.")
    else:
        print("Warning: target_btn_close not found.")

# 3. Hide center controls (Undo/Redo/Zoom) in stylize mode
old_center_controls = """      {/* Center Controls: Undo / Redo / Zoom (Desktop md+) */}
      <div className="hidden md:flex items-center gap-1 bg-studio-panel border border-studio-border p-1 rounded-lg">"""

new_center_controls = """      {/* Center Controls: Undo / Redo / Zoom (Hidden in AI Stylize Stage) */}
      {activePanel !== "ai-stylize" && (
      <div className="hidden md:flex items-center gap-1 bg-studio-panel border border-studio-border p-1 rounded-lg">"""

if old_center_controls in content:
    content = content.replace(old_center_controls, new_center_controls)
    # Close condition after zoom controls div
    zoom_div_end = """        <button
          onClick={() => setZoom((z) => Math.min(4.0, z + 0.08))}
          className="p-1.5 rounded hover:bg-studio-hover text-studio-muted hover:text-studio-text transition-colors cursor-pointer"
          title="放大"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>"""
    if zoom_div_end in content:
        content = content.replace(zoom_div_end, zoom_div_end + "\n      )}")
        print("Updated Zoom & Undo controls visibility in Header.")
    else:
        print("Warning: zoom_div_end not found.")

# 4. Clean right buttons in stylize mode:
# When activePanel === "ai-stylize":
# Hide '拼图排版' toggle, hide '智能排版', hide '导出 / 冲印'
# Instead show a clear '返回拼图画布' button
old_right_buttons = """        <Button
          variant={activePanel === "ai-stylize" ? "accent" : "secondary"}
          size="sm"
          onClick={() => setActivePanel(activePanel === "ai-stylize" ? "templates" : "ai-stylize")}
          className={`hidden md:flex items-center gap-1.5 text-xs font-medium shadow-sm transition-all ${
            activePanel === "ai-stylize"
              ? "bg-studio-accent text-zinc-950 font-bold border-studio-accent shadow-subtle-glow"
              : "text-studio-accent border-studio-accent/40 bg-studio-accent/10 hover:bg-studio-accent/20"
          }`}
          title={activePanel === "ai-stylize" ? "返回拼图排版画布" : "打开 AI 风格化创作工作台"}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{activePanel === "ai-stylize" ? "拼图排版" : "AI 风格化"}</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setAutoLayoutModalOpen(true)}
          className="hidden md:flex items-center gap-1 text-studio-text border-studio-border text-xs"
        >
          <Wand2 className="w-3.5 h-3.5 text-studio-accent" />
          <span>智能排版</span>
        </Button>"""

new_right_buttons = """        {activePanel === "ai-stylize" ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActivePanel("templates")}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:border-amber-600 text-zinc-800 dark:text-zinc-200 hover:bg-amber-500/10 transition-all cursor-pointer shadow-xs"
            title="返回拼图画布与版式编辑"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>返回拼图画布</span>
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setActivePanel("ai-stylize")}
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold shadow-xs transition-all text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20"
              title="打开 AI 艺术风格化创作工作台"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI 风格化</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAutoLayoutModalOpen(true)}
              className="hidden md:flex items-center gap-1 text-studio-text border-studio-border text-xs"
            >
              <Wand2 className="w-3.5 h-3.5 text-studio-accent" />
              <span>智能排版</span>
            </Button>
          </>
        )}"""

if old_right_buttons in content:
    content = content.replace(old_right_buttons, new_right_buttons)
    print("Updated right actions (Removed collage buttons in stylize mode).")
else:
    print("Warning: old_right_buttons not found directly.")

# Also hide export button in stylize mode
old_export_btn = """        {/* Main CTA: Export */}
        <Button
          variant="accent"
          size="sm"
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-1 shadow-subtle-glow px-2 sm:px-3 text-xs font-semibold py-1 sm:py-1.5 shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">导出 / 冲印</span>
          <span className="xs:hidden">导出</span>
        </Button>"""

new_export_btn = """        {/* Main CTA: Export (Hidden in AI Stylize) */}
        {activePanel !== "ai-stylize" && (
          <Button
            variant="accent"
            size="sm"
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1 shadow-subtle-glow px-2 sm:px-3 text-xs font-semibold py-1 sm:py-1.5 shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">导出 / 冲印</span>
            <span className="xs:hidden">导出</span>
          </Button>
        )}"""

if old_export_btn in content:
    content = content.replace(old_export_btn, new_export_btn)
    print("Updated Export button visibility.")
else:
    print("Warning: old_export_btn not found.")

with open("src/components/layout/Header.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Header.tsx updated successfully.")
