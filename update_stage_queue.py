with open("src/components/canvas/AiStylizeStudioStage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update import
old_import = 'import { AiGenerationQueueDrawer } from "../studio/ai/AiGenerationQueueDrawer";'
new_import = 'import { AiQueueInlinePanel } from "../studio/ai/AiQueueInlinePanel";'
content = content.replace(old_import, new_import)

# 2. Add AiQueueInlinePanel right after ratio grid container
old_ratio_end = """                })}
              </div>
            </div>
          </div>

          {/* DOCK PINNED BOTTOM GENERATE / QUEUE BUTTON */}"""

new_ratio_end = """                })}
              </div>
            </div>

            {/* EMBEDDED INLINE QUEUE & BATCH TASK MANAGER (UTILIZING LARGE SPACE UNDER RATIOS) */}
            <AiQueueInlinePanel
              onOpenMediaPicker={() => setIsMediaPickerOpen(true)}
              onOpenLightbox={(resImg, srcImg, sName) => {
                setLightboxData({ result: resImg, source: srcImg, styleName: sName });
                setIsLightboxOpen(true);
              }}
              onSaveToAssets={handleSaveToAssets}
              onApplyToCanvas={(resImg) => {
                applyStylizedImage(resImg, "add");
                setActivePanel("templates");
              }}
            />
          </div>

          {/* DOCK PINNED BOTTOM GENERATE / QUEUE BUTTON */}"""

if old_ratio_end in content:
    content = content.replace(old_ratio_end, new_ratio_end)
    print("Inserted AiQueueInlinePanel under aspect ratio grid.")
else:
    print("Error: old_ratio_end not found!")

# 3. Remove the floating AiGenerationQueueDrawer from the bottom
old_drawer = """      {/* FLOATING GENERATION QUEUE DRAWER */}
      <AiGenerationQueueDrawer
        onOpenLightbox={(resImg, srcImg, sName) => {
          setLightboxData({ result: resImg, source: srcImg, styleName: sName });
          setIsLightboxOpen(true);
        }}
        onApplyToCanvas={(resImg) => {
          applyStylizedImage(resImg, "add");
          setActivePanel("templates");
        }}
      />"""

if old_drawer in content:
    content = content.replace(old_drawer, "")
    print("Removed floating AiGenerationQueueDrawer from bottom.")
else:
    print("Error: old_drawer not found!")

with open("src/components/canvas/AiStylizeStudioStage.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("AiStylizeStudioStage.tsx updated successfully!")
