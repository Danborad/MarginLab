with open("src/components/canvas/AiStylizeStudioStage.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    """      addMediaAssets([
        {
          name: file.name.replace(/\\.[^/.]+$/, ""),
          src: base64,
        },
      ]).catch(() => {});""",
    """      addMediaAssets([
        {
          name: file.name.replace(/\\.[^/.]+$/, ""),
          src: base64,
          width: 1024,
          height: 1024,
        },
      ]).catch(() => {});"""
)

c = c.replace(
    """      addMediaAssets([
        {
          name: files[0].name.replace(/\\.[^/.]+$/, ""),
          src: base64,
        },
      ]).catch(() => {});""",
    """      addMediaAssets([
        {
          name: files[0].name.replace(/\\.[^/.]+$/, ""),
          src: base64,
          width: 1024,
          height: 1024,
        },
      ]).catch(() => {});"""
)

with open("src/components/canvas/AiStylizeStudioStage.tsx", "w", encoding="utf-8") as f:
    f.write(c)
print("Updated dimensions.")
