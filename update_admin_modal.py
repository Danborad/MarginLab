with open("src/components/modals/AdminManagementModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace grid class if needed
content = content.replace(
    '<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2.5 pt-0.5">',
    '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 pt-0.5">'
)

# New cards to insert before chatgpt2api
cards_snippet = """                {/* Repo 4: Culture Fragment Poster Engine */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between gap-2.5 hover:border-amber-500/40 transition-all group">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>文化碎片海报引擎</span>
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        dacnay816y62
                      </span>
                    </div>
                    <p className="text-[11px] text-studio-muted/90 line-clamp-1">
                      传统视觉基因提炼 · 东方梵想与高奢商业 KV
                    </p>
                    <p className="text-[10px] font-mono text-zinc-400 truncate select-all">
                      https://github.com/dacnay816y62-hub/culture-fragment-poster-engine
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl("https://github.com/dacnay816y62-hub/culture-fragment-poster-engine")}
                      className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                      title="复制完整地址"
                    >
                      {copiedUrl === "https://github.com/dacnay816y62-hub/culture-fragment-poster-engine" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>复制</span>
                        </>
                      )}
                    </button>

                    <a
                      href="https://github.com/dacnay816y62-hub/culture-fragment-poster-engine"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-[11px] font-mono font-semibold flex items-center gap-1 transition-all"
                    >
                      <span>打开仓库</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Repo 5: Eastern Ink Photo Diptych */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between gap-2.5 hover:border-stone-400/40 transition-all group">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-stone-300" />
                        <span>东方水墨摄影二分画</span>
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-700 text-stone-200 border border-stone-600">
                        Hiseaa
                      </span>
                    </div>
                    <p className="text-[11px] text-studio-muted/90 line-clamp-1">
                      上实景摄影、下极简写意 · 3:5 竖版画册海报
                    </p>
                    <p className="text-[10px] font-mono text-zinc-400 truncate select-all">
                      https://github.com/Hiseaa/eastern-ink-photo-diptych
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl("https://github.com/Hiseaa/eastern-ink-photo-diptych")}
                      className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                      title="复制完整地址"
                    >
                      {copiedUrl === "https://github.com/Hiseaa/eastern-ink-photo-diptych" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>复制</span>
                        </>
                      )}
                    </button>

                    <a
                      href="https://github.com/Hiseaa/eastern-ink-photo-diptych"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-stone-700/60 hover:bg-stone-600 text-stone-200 hover:text-white border border-stone-500/40 text-[11px] font-mono font-semibold flex items-center gap-1 transition-all"
                    >
                      <span>打开仓库</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Repo 6: Reality Restaged */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between gap-2.5 hover:border-rose-500/40 transition-all group">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-rose-400" />
                        <span>纪实重构 · 超现实舞台</span>
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        traveler0621
                      </span>
                    </div>
                    <p className="text-[11px] text-studio-muted/90 line-clamp-1">
                      现实第一超现实第二 · One impossible thing 舞台
                    </p>
                    <p className="text-[10px] font-mono text-zinc-400 truncate select-all">
                      https://github.com/traveler0621/reality-restaged
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl("https://github.com/traveler0621/reality-restaged")}
                      className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                      title="复制完整地址"
                    >
                      {copiedUrl === "https://github.com/traveler0621/reality-restaged" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>复制</span>
                        </>
                      )}
                    </button>

                    <a
                      href="https://github.com/traveler0621/reality-restaged"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-200 border border-rose-500/40 text-[11px] font-mono font-semibold flex items-center gap-1 transition-all"
                    >
                      <span>打开仓库</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

"""

chatgpt_target = '{/* Repo 4: chatgpt2api 反代服务 */}'
if chatgpt_target not in content:
    chatgpt_target = '<span>chatgpt2api · 生图反代服务</span>'

target_div = '<div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between gap-2.5 hover:border-emerald-500/40 transition-all group">'

if target_div in content:
    content = content.replace(target_div, cards_snippet + target_div, 1)
    print("Inserted 3 new GitHub reference repo cards into AdminManagementModal.tsx.")
else:
    print("Warning: target_div not found in AdminManagementModal.tsx.")

with open("src/components/modals/AdminManagementModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("AdminManagementModal.tsx updated.")
