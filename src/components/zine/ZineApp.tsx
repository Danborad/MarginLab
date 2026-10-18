import React, { useEffect } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { ZineSidebar } from "./ZineSidebar";
import { ZineGallery } from "./ZineGallery";
import { ZineCreationDrawer } from "./ZineCreationDrawer";
import { ZineOutputModal } from "./ZineOutputModal";
import { ZineHistory } from "./ZineHistory";
import { ZineHome } from "./ZineHome";
import { ZineProfile } from "./ZineProfile";
import { ZineNotifications } from "./ZineNotifications";
import { AuthModal } from "../modals/AuthModal";
import { AdminManagementModal } from "../modals/AdminManagementModal";
import { AiSettingsModal } from "../modals/AiSettingsModal";

export const ZineApp: React.FC = () => {
  const zineTab = useEditorStore((s) => s.zineTab);
  const isDrawerOpen = useEditorStore((s) => s.isZineDrawerOpen);
  const loadFromStorage = useEditorStore((s) => s.loadFromStorage);
  const fetchAiHistory = useEditorStore((s) => s.fetchAiHistory);

  useEffect(() => {
    loadFromStorage();
    fetchAiHistory();
  }, [loadFromStorage, fetchAiHistory]);

  return (
    <div className="flex h-screen w-screen bg-[#F6F4EF] overflow-hidden text-[#18181B] font-sans select-none antialiased">
      {/* 1. Left Navigation Sidebar */}
      <ZineSidebar />

      {/* 2. Main Work Area */}
      <main className="flex-1 flex h-full overflow-hidden relative">
        {zineTab === "create" && (
          <>
            <ZineGallery />
            {isDrawerOpen && (
              <ZineCreationDrawer onStartGenerating={() => {}} />
            )}
          </>
        )}

        {zineTab === "home" && <ZineHome />}
        {zineTab === "history" && <ZineHistory />}
        {zineTab === "profile" && <ZineProfile />}
        {zineTab === "notifications" && <ZineNotifications />}
      </main>

      {/* 3. Global Floating Modals & Animation Layers */}
      <ZineOutputModal />
      <AuthModal />
      <AdminManagementModal />
      <AiSettingsModal />
    </div>
  );
};
