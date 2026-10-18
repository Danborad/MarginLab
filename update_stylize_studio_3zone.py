import re

with open("update_stylize_stage.py", "r", encoding="utf-8") as f:
    orig_script = f.read()

pos_start = orig_script.find('new_content = """') + len('new_content = """')
pos_end = orig_script.rfind('"""')
full_orig = orig_script[pos_start:pos_end]

main_ret_marker = '  return (\n    <div\n      onDragOver={(e) => e.preventDefault()}'
pos_main_ret = full_orig.find(main_ret_marker)
header_part = full_orig[:pos_main_ret]

new_jsx = """  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="relative w-full h-full flex flex-col bg-studio-bg overflow-hidden select-none"
    >
      {/* MODERN FLOATING TOAST NOTIFICATION (DOES NOT PUSH DOWN DOM) */}
      {statusMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-fadeIn">
          <div
            className={`px-4 sm:px-5 py-2.5 rounded-full border shadow-2xl backdrop-blur-xl flex items-center gap-2.5 text-xs font-medium transition-all ${
              statusMessage.type === "success"
                ? "bg-zinc-900/90 dark:bg-zinc-900/95 border-emerald-500/40 text-emerald-300 shadow-emerald-950/30"
                : "bg-zinc-900/90 dark:bg-zinc-900/95 border-red-500/40 text-red-300 shadow-red-950/30"
            }`}
          >
            {statusMessage.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span className="font-sans">{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="ml-1 text-zinc-400 hover:text-white cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* HIDDEN FILE INPUT */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* UNIFIED 3-ZONE PANORAMIC STUDIO (100% SPACE UTILIZATION, NATURAL SMOOTH TRANSITIONS) */}
      <div className="flex-1 w-full min-h-0 flex flex-col lg:flex-row overflow-hidden z-10">
        
        {/* ============================================================ */}
        {/* ZONE 1: STYLE RAIL / GALLERY STREAM                          */}
        {/* ============================================================ */}
        <div
          className={`h-full overflow-y-auto no-scrollbar transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isWideWorkspace
              ? "w-full lg:w-[260px] xl:w-[280px] 2xl:w-[300px] p-4 border-r border-studio-border bg-studio-sidebar/60 shrink-0"
              : "flex-1 p-4 sm:p-6 lg:p-7 bg-studio-bg"
          }`}
        >
          {/* Section Header */}
          <div className="space-y-1 pb-4 flex items-center justify-between sticky top-0 bg-studio-bg/95 backdrop-blur-sm z-10">
            <div>
              <h2
                className={`font-serif font-bold tracking-tight text-studio-text leading-tight ${
                  isWideWorkspace ? "text-base sm:text-lg" : "text-2xl sm:text-3xl lg:text-4xl"
                }`}
              >
                {isWideWorkspace ? "创作风格" : "选择创作风格"}
              </h2>
              <p className="text-[11px] text-studio-muted font-sans mt-0.5">
                {isWideWorkspace ? "点击实时切换" : "从真实照片出发，通过 AI 意境重构先锋视觉表达"}
              </p>
            </div>

            {isWideWorkspace && (
              <button
                type="button"
                onClick={() => setIsWideWorkspace(false)}
                className="px-2 py-1 rounded-lg text-[11px] bg-studio-panel hover:bg-studio-hover border border-studio-border text-studio-muted hover:text-studio-text flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                title="折叠为全屏大图瀑布流浏览"
              >
                <Columns className="w-3 h-3 text-blue-500" />
                <span className="hidden sm:inline">大图浏览</span>
              </button>
            )}
          </div>

          {/* Style Cards List */}
          {visibleStyles.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-studio-border bg-studio-card/40 text-center space-y-3">
              <Sparkles className="w-7 h-7 text-studio-muted mx-auto" />
              <div>
                <h3 className="text-xs font-semibold text-studio-text">暂无启用的风格模板</h3>
                <p className="text-[10px] text-studio-muted mt-0.5">管理员可在后台控制台开启官方高定风格。</p>
              </div>
            </div>
          ) : isWideWorkspace ? (
            /* WIDE WORKSPACE: ELEGANT VERTICAL STYLE RAIL */
            <div className="space-y-2.5 pb-16">
              {visibleStyles.map((style, idx) => {
                const isSelected = selectedStyleId === style.id;
                const indexStr = String(idx + 1).padStart(2, "0");

                return (
                  <div
                    key={style.id}
                    onClick={() => setSelectedStyleId(style.id)}
                    className={`group p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3 relative shadow-xs ${
                      isSelected
                        ? "bg-blue-50/80 dark:bg-blue-950/40 border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-sm"
                        : "bg-studio-card border-studio-border hover:border-[#2563EB]/40 hover:bg-studio-hover/60"
                    }`}
                  >
                    {/* Small Thumbnail */}
                    <div className="w-14 h-16 rounded-xl overflow-hidden bg-studio-panel shrink-0 relative border border-studio-border/70">
                      <div
                        className={`absolute top-1 left-1 z-10 px-1 py-0.2 rounded text-[9px] font-mono font-bold ${
                          isSelected ? "bg-[#2563EB] text-white" : "bg-black/70 text-white/90"
                        }`}
                      >
                        {indexStr}
                      </div>

                      {style.coverImage ? (
                        <img src={style.coverImage} alt={style.name} className="w-full h-full object-cover" />
                      ) : style.previewSvg ? (
                        <div dangerouslySetInnerHTML={{ __html: style.previewSvg }} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-studio-muted">
                          <Sparkles className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className={`text-xs font-bold truncate ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-studio-text"}`}>
                          {style.name.replace(/^[0-9•\s·]+/, "")}
                        </h4>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[10px] text-studio-muted font-mono truncate">
                        {style.enName.replace(/^[0-9•\s·]+/, "")}
                      </p>
                      {style.badge && (
                        <span className="inline-block text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-studio-panel text-studio-muted border border-studio-border">
                          {style.badge}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* COMPACT MODE: MULTI-COLUMN EXPANSIVE GALLERY */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 pb-20">
              {visibleStyles.map((style, idx) => {
                const isSelected = selectedStyleId === style.id;
                const indexStr = String(idx + 1).padStart(2, "0");

                return (
                  <div
                    key={style.id}
                    onClick={() => {
                      setSelectedStyleId(style.id);
                      if (sourceImage || latestResult) {
                        setIsWideWorkspace(true);
                      }
                    }}
                    className={`group rounded-2xl overflow-hidden bg-studio-card border transition-all duration-200 cursor-pointer flex flex-col relative shadow-xs ${
                      isSelected
                        ? "ring-2 ring-[#2563EB] border-[#2563EB] shadow-md"
                        : "border-studio-border hover:border-[#2563EB]/50 hover:shadow-sm"
                    }`}
                  >
                    <div className="relative w-full aspect-[3/4] overflow-hidden bg-studio-panel">
                      <div
                        className={`absolute top-3 left-3 z-10 px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider transition-colors ${
                          isSelected ? "bg-[#2563EB] text-white shadow-xs" : "bg-[#1E293B]/90 text-white group-hover:bg-[#2563EB]"
                        }`}
                      >
                        {indexStr}
                      </div>

                      {style.coverImage ? (
                        <img src={style.coverImage} alt={style.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                      ) : style.previewSvg ? (
                        <div dangerouslySetInnerHTML={{ __html: style.previewSvg }} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-studio-accent">
                          <Sparkles className="w-10 h-10 mb-2 opacity-50" />
                          <span className="text-xs font-serif tracking-widest">{style.name}</span>
                        </div>
                      )}

                      <div className="absolute bottom-3 right-3 z-10">
                        {isSelected ? (
                          <div className="px-2.5 py-1 rounded-lg bg-[#2563EB] text-white text-[11px] font-bold flex items-center gap-1 shadow-sm">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>正在创作</span>
                          </div>
                        ) : (
                          <div className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-white/90 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            开始创作
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-3.5 flex items-center justify-between border-t border-studio-border bg-studio-card">
                      <div className="min-w-0 pr-2">
                        <h3 className="text-xs sm:text-sm font-semibold text-studio-text font-sans truncate">
                          {style.name}
                        </h3>
                        <p className="text-[10px] text-studio-muted font-mono truncate mt-0.5">
                          {style.enName}
                        </p>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-studio-panel text-studio-muted border border-studio-border shrink-0">
                        {style.badge || "官方高定"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* ZONE 2: CENTER PHOTO CANVAS STAGE (HERO DISPLAY VIEWPORT)   */}
        {/* ============================================================ */}
        {isWideWorkspace ? (
          <main className="flex-1 h-full min-w-0 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#F4F1EA]/60 dark:bg-[#09090C]/80 relative overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
            
            {!sourceImage && !latestResult ? (
              /* EMPTY DROPZONE: CLEAN, CENTERED IN THE MAIN STAGE */
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-xl aspect-[4/3] border-2 border-dashed border-[#2563EB]/40 hover:border-[#2563EB] rounded-3xl p-8 sm:p-12 flex flex-col items-center justify-center gap-4 bg-white/80 dark:bg-zinc-900/60 hover:bg-white dark:hover:bg-zinc-900/90 transition-all cursor-pointer group shadow-sm"
              >
                <div className="w-16 h-16 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <Plus className="w-8 h-8 stroke-[2.5]" />
                </div>

                <div className="text-center space-y-1.5">
                  <h4 className="text-base sm:text-lg font-bold text-studio-text">
                    放入一张真实照片
                  </h4>
                  <p className="text-xs text-studio-muted max-w-sm">
                    点击选择本地文件或直接拖入文件 (JPG / PNG / WebP)
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => setIsMediaPickerOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                    title="从您已上传或已生成的素材照片库中挑选"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>从素材库选择 ({mediaAssets.length} 张可用)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-studio-panel hover:bg-studio-hover border border-studio-border text-xs font-medium text-studio-text flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-blue-500" />
                    <span>本地文件上传</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ACTIVE PHOTO HERO FRAME: FILLS STAGE NATURALLY, NO WASTED GAPS */
              <div className="relative w-full h-full max-h-[calc(100vh-120px)] flex items-center justify-center">
                
                {/* Visual Frame Container */}
                <div
                  onDoubleClick={() => handleOpenLightbox()}
                  className="relative max-h-full max-w-full rounded-2xl overflow-hidden border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#121216] shadow-xl flex items-center justify-center group"
                >
                  <img
                    src={latestResult && !isHoldingOriginal ? latestResult : sourceImage!}
                    alt={latestResult && !isHoldingOriginal ? "Generated Artwork" : "Source Original"}
                    className="max-h-[calc(100vh-140px)] w-auto max-w-full object-contain block mx-auto transition-all select-none"
                  />

                  {/* Top Floating Action Pill Toolbar */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none z-10">
                    {latestResult ? (
                      <div className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md pointer-events-auto">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI 艺术成片</span>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-mono shadow-md pointer-events-auto">
                        原图底片已就绪
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 pointer-events-auto">
                      {/* Lightbox Maximize Button */}
                      {latestResult && (
                        <button
                          type="button"
                          onClick={() => handleOpenLightbox()}
                          className="px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/95 text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95"
                          title="放大全屏查看大图细节与原图对比"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>放大查看</span>
                        </button>
                      )}

                      {/* Press to Peek Original Button */}
                      {latestResult && (
                        <button
                          type="button"
                          onMouseDown={() => setIsHoldingOriginal(true)}
                          onMouseUp={() => setIsHoldingOriginal(false)}
                          onMouseLeave={() => setIsHoldingOriginal(false)}
                          onTouchStart={() => setIsHoldingOriginal(true)}
                          onTouchEnd={() => setIsHoldingOriginal(false)}
                          className="px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/95 text-white text-xs font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1.5 cursor-pointer transition-all shadow-md active:scale-95 select-none"
                          title="长按即时对比原始照片"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>{isHoldingOriginal ? "对比中" : "按住看原图"}</span>
                        </button>
                      )}

                      {/* Change Photo */}
                      <button
                        type="button"
                        onClick={() => setIsMediaPickerOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black/95 text-white text-xs font-medium backdrop-blur-md border border-white/20 flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                        title="从素材库或本地更换照片"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-400" />
                        <span>更换照片</span>
                      </button>

                      {/* Quick Save to Assets & Download in Wide Mode */}
                      {latestResult && (
                        <>
                          <button
                            type="button"
                            onClick={handleSaveToAssets}
                            className="px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-md"
                            title="存入私有素材库"
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                            <span>存入素材</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = latestResult;
                              a.download = `atelier_ai_${activeStyle.id}_${Date.now()}.png`;
                              a.click();
                            }}
                            className="p-1.5 rounded-xl bg-black/75 hover:bg-black/95 text-white backdrop-blur-md border border-white/20 flex items-center justify-center cursor-pointer shadow-md"
                            title="下载高清成片"
                          >
                            <Download className="w-4 h-4 text-emerald-400" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* GENERATING LOADING OVERLAY IN CENTER STAGE */}
                  {(isGenerating || (isQueueRunning && aiQueue.some(t => t.status === "running"))) && (
                    <div className="absolute inset-0 z-20 bg-zinc-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fadeIn text-white">
                      <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping" />
                        <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-indigo-500 border-l-transparent animate-spin" />
                        <Sparkles className="w-7 h-7 text-amber-300 animate-pulse" />
                      </div>

                      <div className="space-y-1.5 max-w-sm">
                        <div className="text-xs font-mono font-bold tracking-widest text-blue-400 uppercase">
                          AI GENERATION IN PROGRESS • {genProgress}%
                        </div>
                        <p className="text-base font-bold text-white tracking-tight">
                          正在意境重构: {activeStyle.name}
                        </p>
                        <p className="text-xs text-zinc-400 leading-relaxed font-sans pt-1">
                          {genStageText}
                        </p>
                      </div>

                      <div className="w-64 bg-zinc-800 rounded-full h-1.5 mt-5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.max(12, genProgress)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        ) : null}

        {/* ============================================================ */}
        {/* ZONE 3: CONTROL & GENERATION PANEL (DEDICATED ERGONOMIC DOCK) */}
        {/* ============================================================ */}
        <aside
          className={`h-full border-t lg:border-t-0 lg:border-l border-studio-border bg-studio-sidebar flex flex-col justify-between overflow-y-auto shrink-0 z-20 shadow-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isWideWorkspace
              ? "w-full lg:w-[350px] xl:w-[380px] 2xl:w-[400px]"
              : "w-full lg:w-[440px] xl:w-[470px] 2xl:w-[500px]"
          }`}
        >
          {/* Dock Header */}
          <div className="p-4 sm:p-5 pb-3 border-b border-studio-border flex items-center justify-between sticky top-0 bg-studio-sidebar/95 backdrop-blur-md z-10">
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <h3 className="text-base sm:text-lg font-bold text-studio-text font-sans tracking-tight truncate">
                制作 · {activeStyle.name.replace(/^[0-9•\s·]+/, "")}
              </h3>
              {activeStyle.badge && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30 shrink-0">
                  {activeStyle.badge}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Toggle Wide Workspace Button */}
              <button
                type="button"
                onClick={() => setIsWideWorkspace(!isWideWorkspace)}
                className="px-2.5 py-1.5 rounded-xl bg-studio-panel hover:bg-studio-hover border border-studio-border text-xs text-studio-muted hover:text-studio-text flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title={isWideWorkspace ? "还原为紧凑视图" : "展开为全屏大制作工作台"}
              >
                {isWideWorkspace ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-blue-500" />
                    <span className="inline">紧凑视图</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-blue-500" />
                    <span className="inline">展开工作台</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSourceImage(null);
                  setLatestResult(null);
                }}
                className="w-7 h-7 rounded-full bg-studio-panel hover:bg-studio-hover border border-studio-border flex items-center justify-center text-studio-muted hover:text-studio-text transition-colors cursor-pointer"
                title="清空重置照片"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dock Form Body */}
          <div className="p-4 sm:p-5 space-y-5 flex-1 overflow-y-auto">
            
            {/* Style Description */}
            <p className="text-xs text-studio-muted leading-relaxed">
              {activeStyle.description}
            </p>

            {/* IN COMPACT MODE: SHOW PHOTO PREVIEW IN THE SIDEBAR */}
            {!isWideWorkspace && (
              <div className="space-y-2">
                {!sourceImage && !latestResult ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#2563EB]/40 hover:border-[#2563EB] rounded-2xl p-6 flex flex-col items-center justify-center gap-2.5 bg-blue-50/20 dark:bg-blue-950/10 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                      <Plus className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div className="text-center space-y-0.5">
                      <h4 className="text-xs font-bold text-studio-text">放入一张真实照片</h4>
                      <p className="text-[10px] text-studio-muted">点击或拖入图片文件</p>
                    </div>
                    <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setIsMediaPickerOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 cursor-pointer"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>素材库选择</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-xl bg-studio-panel hover:bg-studio-hover border border-studio-border text-[11px] font-medium text-studio-text flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-blue-500" />
                        <span>本地上传</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full rounded-2xl overflow-hidden border border-studio-border bg-stone-200/50 dark:bg-zinc-950 shadow-md group">
                    <img
                      src={latestResult && !isHoldingOriginal ? latestResult : sourceImage!}
                      alt="Preview"
                      className="w-full max-h-[280px] object-contain block mx-auto"
                    />
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                      {latestResult ? (
                        <div className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>AI 成片</span>
                        </div>
                      ) : (
                        <div className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-white/90 text-[10px] font-mono">
                          原图已就绪
                        </div>
                      )}
                      <div className="flex items-center gap-1 pointer-events-auto">
                        {latestResult && (
                          <button
                            type="button"
                            onClick={() => handleOpenLightbox()}
                            className="px-2 py-1 rounded-lg bg-black/70 text-white text-[11px] font-semibold backdrop-blur-md border border-white/20 flex items-center gap-1"
                          >
                            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>放大</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsMediaPickerOpen(true)}
                          className="px-2 py-1 rounded-lg bg-black/70 text-white text-[11px] backdrop-blur-md border border-white/20 flex items-center gap-1"
                        >
                          <span>更换</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PARAMETER 1: DIRECTION & AMBIENCE (MOOD) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-studio-text font-sans">
                  方向与氛围
                </label>
                <span className="text-[11px] font-mono text-studio-muted">
                  可选 {mood.length} / 20
                </span>
              </div>
              <input
                type="text"
                maxLength={20}
                placeholder="例如: 暖阳透过车窗、细雨后的松弛感..."
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-studio-panel border border-studio-border rounded-xl text-xs text-studio-text placeholder:text-studio-muted/50 focus:outline-none focus:border-[#2563EB] transition-colors"
              />
              <p className="text-[11px] text-studio-muted leading-tight">
                简短描述想传达的感觉，系统会结合照片调整表达，不改变原有创作风格。
              </p>
            </div>

            {/* PARAMETER 2: TYPOGRAPHY SETTINGS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-studio-text font-sans">
                  画面文字
                </label>
                <div className="flex items-center gap-1.5 bg-studio-panel p-1 rounded-xl border border-studio-border/60">
                  <button
                    type="button"
                    onClick={() => setIncludeText(true)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      includeText
                        ? "bg-[#2563EB] text-white font-semibold shadow-2xs"
                        : "text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    添加文字
                  </button>
                  <button
                    type="button"
                    onClick={() => setIncludeText(false)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      !includeText
                        ? "bg-[#2563EB] text-white font-semibold shadow-2xs"
                        : "text-studio-muted hover:text-studio-text"
                    }`}
                  >
                    纯净画面
                  </button>
                </div>
              </div>

              {includeText && (
                <div className="space-y-1.5 pt-1">
                  <input
                    type="text"
                    maxLength={40}
                    placeholder={
                      isFantasy
                        ? "可指定大标题，例：本人正在加载、生活暂停30秒..."
                        : "可指定英文/中文短句，不填则由系统意境创作..."
                    }
                    value={specifiedText}
                    onChange={(e) => setSpecifiedText(e.target.value)}
                    className="w-full px-3.5 py-2 bg-studio-panel border border-studio-border rounded-xl text-xs text-studio-text placeholder:text-studio-muted/50 focus:outline-none focus:border-[#2563EB] transition-colors"
                  />
                  <p className="text-[11px] text-studio-muted leading-tight">
                    不填写时，系统会根据画面意境创作融入典雅排版；填写后尽量按原文呈现。
                  </p>
                </div>
              )}
            </div>

            {/* PARAMETER 3: ASPECT RATIO 3x3 GRID WITH THUMBNAILS */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-studio-text font-sans">
                  画幅比例
                </label>
                <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                  {aspectRatio} ({IMAGE_RATIOS.find((r) => r.id === aspectRatio)?.desc})
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-studio-panel rounded-2xl border border-studio-border">
                {IMAGE_RATIOS.map((r) => {
                  const isSelected = aspectRatio === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setAspectRatio(r.id)}
                      className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer border group ${
                        isSelected
                          ? "bg-[#2563EB] text-white font-bold border-[#2563EB] shadow-xs ring-2 ring-[#2563EB]/25"
                          : "bg-studio-card border-studio-border/70 text-studio-text hover:border-[#2563EB]/40 hover:bg-studio-hover"
                      }`}
                      title={`${r.label} - ${r.desc}`}
                    >
                      <AspectRatioThumbnail ratioId={r.id} isSelected={isSelected} size="md" />
                      <div className="text-center leading-none">
                        <div className={`text-[11px] font-mono font-bold ${isSelected ? "text-white" : "text-studio-text"}`}>
                          {r.label}
                        </div>
                        <div className={`text-[9px] mt-0.5 tracking-tight ${isSelected ? "text-blue-100" : "text-studio-muted"}`}>
                          {r.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DOCK PINNED BOTTOM GENERATE / QUEUE BUTTON */}
          <div className="p-4 sm:p-5 border-t border-studio-border bg-studio-sidebar space-y-2 sticky bottom-0 z-10">
            <button
              type="button"
              onClick={handleGenerateOrEnqueue}
              disabled={!sourceImage}
              className={`w-full py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !sourceImage
                  ? "bg-studio-panel text-studio-muted cursor-not-allowed shadow-none border border-studio-border"
                  : isQueueRunning || isGenerating
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-subtle-glow"
                  : "bg-[#2563EB] hover:bg-[#1D4ED8] text-white active:scale-[0.99] shadow-subtle-glow"
              }`}
            >
              {isQueueRunning || isGenerating ? (
                <>
                  <ListPlus className="w-4 h-4" />
                  <span>+ 加入生成队列 (后台自动排队)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>开始 AI 风格化重构</span>
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* MEDIA PICKER MODAL */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelectSingle={handleSelectFromMedia}
        onSelectBatchQueue={handleBatchQueueFromMedia}
        activeStyleName={activeStyle.name}
      />

      {/* FULLSCREEN IMAGE LIGHTBOX MODAL */}
      <AiImageLightboxModal
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        resultImage={lightboxData.result}
        sourceImage={lightboxData.source}
        styleName={lightboxData.styleName}
        onSaveToAssets={handleSaveToAssets}
        onApplyToCanvas={() => {
          if (lightboxData.result) {
            applyStylizedImage(lightboxData.result, "add");
            setIsLightboxOpen(false);
            setActivePanel("templates");
          }
        }}
      />

      {/* FLOATING GENERATION QUEUE DRAWER */}
      <AiGenerationQueueDrawer
        onOpenLightbox={(resImg, srcImg, sName) => {
          setLightboxData({ result: resImg, source: srcImg, styleName: sName });
          setIsLightboxOpen(true);
        }}
        onApplyToCanvas={(resImg) => {
          applyStylizedImage(resImg, "add");
          setActivePanel("templates");
        }}
      />
    </div>
  );
};
"""

full_code = header_part + new_jsx

with open("src/components/canvas/AiStylizeStudioStage.tsx", "w", encoding="utf-8") as f:
    f.write(full_code)

print("Updated AiStylizeStudioStage.tsx with exact header!")
