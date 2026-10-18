with open("src/store/useEditorStore.ts", "r") as f:
    text = f.read()

# Add interface fields
old_interface = """  // UI State
  activePanel: ActivePanel;
  isExporting: boolean;
  exportModalOpen: boolean;
  presetModalOpen: boolean;
  shortcutModalOpen: boolean;
  autoLayoutModalOpen: boolean;
  projectModalOpen: boolean;
  saveTemplateModalOpen: boolean;
  setIsExporting: (exporting: boolean) => void;"""

new_interface = """  // UI State & Replace Photo Modal
  activePanel: ActivePanel;
  isExporting: boolean;
  exportModalOpen: boolean;
  presetModalOpen: boolean;
  shortcutModalOpen: boolean;
  autoLayoutModalOpen: boolean;
  projectModalOpen: boolean;
  saveTemplateModalOpen: boolean;
  replacePhotoModalOpen: boolean;
  replaceTargetElementId: string | null;
  openReplacePhotoModal: (elementId?: string) => void;
  closeReplacePhotoModal: () => void;
  replaceElementImage: (elementId: string, src: string, name?: string, naturalWidth?: number, naturalHeight?: number) => void;
  setIsExporting: (exporting: boolean) => void;"""

text = text.replace(old_interface, new_interface)

# Add store initial values & methods
old_initials = """    activePanel: "templates",
    isExporting: false,
    exportModalOpen: false,
    presetModalOpen: false,
    shortcutModalOpen: false,
    autoLayoutModalOpen: false,
    projectModalOpen: false,
    saveTemplateModalOpen: false,"""

new_initials = """    activePanel: "templates",
    isExporting: false,
    exportModalOpen: false,
    presetModalOpen: false,
    shortcutModalOpen: false,
    autoLayoutModalOpen: false,
    projectModalOpen: false,
    saveTemplateModalOpen: false,
    replacePhotoModalOpen: false,
    replaceTargetElementId: null,

    openReplacePhotoModal: (elementId) => {
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

    replaceElementImage: (elementId, src, name, naturalWidth, naturalHeight) => {
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
        crop: undefined, // reset crop for fresh image
      });

      setStore({
        replacePhotoModalOpen: false,
        replaceTargetElementId: null,
      });
    },"""

text = text.replace(old_initials, new_initials)

with open("src/store/useEditorStore.ts", "w") as f:
    f.write(text)

print("Updated useEditorStore.ts with replace photo actions!")
