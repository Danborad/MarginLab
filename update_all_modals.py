import os

modal_files = [
    ("src/components/modals/ReplacePhotoModal.tsx", "w-full max-w-3xl", "w-[95vw] max-w-3xl"),
    ("src/components/modals/ExportModal.tsx", "w-full max-w-3xl", "w-[95vw] max-w-3xl"),
    ("src/components/modals/PresetSizeModal.tsx", "w-full max-w-2xl", "w-[95vw] max-w-2xl"),
    ("src/components/modals/ProjectManagerModal.tsx", "w-full max-w-3xl", "w-[95vw] max-w-3xl"),
    ("src/components/modals/AutoLayoutModal.tsx", "w-full max-w-lg", "w-[95vw] max-w-lg"),
    ("src/components/modals/ShortCutModal.tsx", "w-full max-w-lg", "w-[95vw] max-w-lg"),
]

for path, old_s, new_s in modal_files:
    if os.path.exists(path):
        with open(path, "r") as f:
            c = f.read()
        c = c.replace(old_s, new_s)
        with open(path, "w") as f:
            f.write(c)
        print(f"Updated {path}")
