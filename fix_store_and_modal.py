# 1. Fix AuthModal.tsx
with open("src/components/modals/AuthModal.tsx", "r") as f:
    auth_code = f.read()

auth_code = auth_code.replace(
    '{currentUser ? <AvatarView avatar=<AvatarView avatar={currentUser.avatar} size="xl" /> size="lg" /> : <Lock className="w-5 h-5 text-studio-accent" />}',
    '{currentUser ? <AvatarView avatar={currentUser.avatar} size="lg" /> : <Lock className="w-5 h-5 text-studio-accent" />}'
)

with open("src/components/modals/AuthModal.tsx", "w") as f:
    f.write(auth_code)

# 2. Fix useEditorStore.ts
with open("src/store/useEditorStore.ts", "r") as f:
    store_code = f.read()

# Make sure EditorState interface contains replacePhotoModalOpen, etc.
if "replacePhotoModalOpen: boolean;" not in store_code:
    store_code = store_code.replace(
        "saveTemplateModalOpen: boolean;\n  setIsExporting:",
        "saveTemplateModalOpen: boolean;\n  replacePhotoModalOpen: boolean;\n  replaceTargetElementId: string | null;\n  openReplacePhotoModal: (elementId?: string) => void;\n  closeReplacePhotoModal: () => void;\n  replaceElementImage: (elementId: string, src: string, name?: string, naturalWidth?: number, naturalHeight?: number) => void;\n  setIsExporting:"
    )

# Make sure store body contains them with typed parameters
if "replacePhotoModalOpen: false," not in store_code:
    store_code = store_code.replace(
        "saveTemplateModalOpen: false,\n\n    past: [],",
        """saveTemplateModalOpen: false,
    replacePhotoModalOpen: false,
    replaceTargetElementId: null,

    openReplacePhotoModal: (elementId?: string) => {
      const state = getStore();
      const targetId = elementId || state.selectedIds[0] || null;
      setStore({
        replacePhotoModalOpen: true,
        replaceTargetElementId: targetId,
      });
    },

    closeReplacePhotoModal: () => {
      setStore({
        replacePhotoModalOpen: false,
        replaceTargetElementId: null,
      });
    },

    replaceElementImage: (elementId: string, src: string, name?: string, naturalWidth?: number, naturalHeight?: number) => {
      const state = getStore();
      const el = state.document.elements.find((e) => e.id === elementId);
      if (!el || el.type !== "image") return;

      const w = naturalWidth || (el as ImageElement).originalWidth || 1200;
      const h = naturalHeight || (el as ImageElement).originalHeight || 800;

      state.updateElement(elementId, {
        src,
        name: name || el.name,
        originalWidth: w,
        originalHeight: h,
        crop: undefined,
      });

      setStore({
        replacePhotoModalOpen: false,
        replaceTargetElementId: null,
      });
    },

    past: [],"""
    )

with open("src/store/useEditorStore.ts", "w") as f:
    f.write(store_code)

print("Applied fixes to AuthModal.tsx and useEditorStore.ts!")
