with open("src/store/useEditorStore.ts", "r") as f:
    text = f.read()

target = "setSaveTemplateModalOpen: (open: boolean) => void;\n  setIsExporting: (exporting: boolean) => void;"
replacement = """setSaveTemplateModalOpen: (open: boolean) => void;
  replacePhotoModalOpen: boolean;
  replaceTargetElementId: string | null;
  openReplacePhotoModal: (elementId?: string) => void;
  closeReplacePhotoModal: () => void;
  replaceElementImage: (elementId: string, src: string, name?: string, naturalWidth?: number, naturalHeight?: number) => void;
  setIsExporting: (exporting: boolean) => void;"""

text = text.replace(target, replacement)

with open("src/store/useEditorStore.ts", "w") as f:
    f.write(text)

print("Updated EditorState interface in useEditorStore.ts!")
