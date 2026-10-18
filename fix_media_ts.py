# Fix in AiStylizeStudioStage.tsx
with open("src/components/canvas/AiStylizeStudioStage.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    '          createdAt: new Date().toISOString(),\n',
    ''
)
with open("src/components/canvas/AiStylizeStudioStage.tsx", "w", encoding="utf-8") as f:
    f.write(c)

# Fix in MediaPickerModal.tsx
with open("src/components/studio/ai/MediaPickerModal.tsx", "r", encoding="utf-8") as f:
    m = f.read()

old_upload = """    const newAssets = [];
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const b64 = await fileToBase64(file);
        newAssets.push({
          width: 1024,
          height: 1024,
          name: file.name.replace(/\\.[^/.]+$/, ""),
          src: b64,
          createdAt: new Date().toISOString(),
        });
      }
    }

    if (newAssets.length > 0) {
      await addMediaAssets(newAssets);
      if (!isBatchMode && newAssets[0]) {
        onSelectSingle(newAssets[0]);
        onClose();
      }
    }"""

new_upload = """    const itemsToAdd: { name: string; src: string; width: number; height: number }[] = [];
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const b64 = await fileToBase64(file);
        itemsToAdd.push({
          width: 1024,
          height: 1024,
          name: file.name.replace(/\\.[^/.]+$/, ""),
          src: b64,
        });
      }
    }

    if (itemsToAdd.length > 0) {
      const created = await addMediaAssets(itemsToAdd);
      if (!isBatchMode && created && created[0]) {
        onSelectSingle(created[0]);
        onClose();
      }
    }"""

if old_upload in m:
    m = m.replace(old_upload, new_upload)
else:
    print("Warning: old_upload not found exactly, doing regex or manual replace.")
    import re
    m = re.sub(
        r'const newAssets = \[\];.*?if \(newAssets\.length > 0\) \{.*?onClose\(\);\s*\}\s*\}',
        new_upload,
        m,
        flags=re.DOTALL
    )

with open("src/components/studio/ai/MediaPickerModal.tsx", "w", encoding="utf-8") as f:
    f.write(m)

print("Fixed media type errors.")
