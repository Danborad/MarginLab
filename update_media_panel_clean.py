with open("src/components/panels/MediaPanel.tsx", "r") as f:
    text = f.read()

# Add replaceElementImage, selectedIds, document elements hooks
text = text.replace(
    'const clearAllMediaAssets = useEditorStore((s) => s.clearAllMediaAssets);',
    'const clearAllMediaAssets = useEditorStore((s) => s.clearAllMediaAssets);\n  const selectedIds = useEditorStore((s) => s.selectedIds);\n  const replaceElementImage = useEditorStore((s) => s.replaceElementImage);\n  const elements = useEditorStore((s) => s.document.elements);'
)

# In handleFileUpload, remove auto-insert to canvas!
old_auto_insert = """      // Auto-insert first uploaded image onto canvas
      if (created.length > 0) {
        const first = created[0];
        const w = Math.round(canvas.width * 0.45);
        const h = Math.round(w / first.aspectRatio);

        addElement({
          type: "image",
          name: first.name,
          x: Math.round((canvas.width - w) / 2),
          y: Math.round((canvas.height - h) / 2),
          width: w,
          height: h,
          rotation: 0,
          opacity: 1,
          src: first.src,
          originalWidth: first.width,
          originalHeight: first.height,
          fit: "cover",
          borderRadius: 2,
          shadowBlur: 20,
          shadowOpacity: 0.15,
        });
      }"""

new_auto_insert = """      // Note: As requested, uploaded photos ONLY save to media library without polluting canvas!"""

text = text.replace(old_auto_insert, new_auto_insert)

with open("src/components/panels/MediaPanel.tsx", "w") as f:
    f.write(text)

print("Updated MediaPanel.tsx (removed auto-insert to canvas)!")
