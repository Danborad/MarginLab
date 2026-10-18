import React, { useState } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import {
  Home,
  PlusCircle,
  Clock,
  User,
  Bell,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  LogOut,
  ShieldCheck,
  Settings,
  CreditCard,
} from "lucide-react";
import { AvatarView } from "../ui/AvatarView";

export const ZineSidebar: React.FC = () => {
  const zineTab = useEditorStore((s) => s.zineTab);
  const setZineTab = useEditorStore((s) => s.setZineTab);
  const currentUser = useEditorStore((s) => s.currentUser);
  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
  const userCredits = useEditorStore((s) => s.userCredits);
  const logout = useEditorStore((s) => s.logout);
  const setAuthModalOpen = useEditorStore((s) => s.setAuthModalOpen);
  const setAdminModalOpen = useEditorStore((s) => s.setAdminModalOpen);
  const setAiSettingsModalOpen = useEditorStore((s) => s.setAiSettingsModalOpen);
  const aiHistory = useEditorStore((s) => s.aiHistory);

  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const navItems = [
    { id: "home" as const, label: "首页", icon: Home },
    { id: "create" as const, label: "开始创作", icon: PlusCircle },
    { id: "history" as const, label: "生成记录", icon: Clock, count: aiHistory.length },
    { id: "profile" as const, label: "我的", icon: User },
    { id: "notifications" as const, label: "通知", icon: Bell, badge: "0" },
  ];

  return (
    <aside className="w-56 sm:w-60 md:w-64 h-full bg-[#FAF8F5] border-r border-[#E8E4DC] flex flex-col justify-between select-none shrink-0 text-[#2C2C2C] relative z-20">
      {/* Top Brand Logo */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setZineTab("create")}>
          {/* 4-Gem Geometric Logo */}
          <div className="w-8 h-8 grid grid-cols-2 gap-0.5 p-1 rounded-lg bg-white border border-[#E2DDD5] shadow-xs shrink-0">
            <div className="bg-[#1E40AF] rounded-[2px]" />
            <div className="bg-[#E11D48] rounded-[2px]" />
            <div className="bg-[#F59E0B] rounded-[2px]" />
            <div className="bg-[#2563EB] rounded-[2px]" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-lg font-bold tracking-tight text-[#18181B]">
                拾景<span className="font-sans text-sm font-normal text-[#52525B]">zine</span>
              </span>
            </div>
            <div className="text-[9px] font-mono tracking-widest text-[#8E8A83] uppercase">
              SCENES, GATHERED
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="px-3 space-y-1 flex-1 py-2">
        {navItems.map((item) => {
          const isActive = zineTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "profile" && !isAuthenticated) {
                  setAuthModalOpen(true);
                  return;
                }
                setZineTab(item.id);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? "bg-[#EAE6DF] text-[#18181B] font-semibold shadow-xs"
                  : "text-[#5C5850] hover:text-[#18181B] hover:bg-[#F2EFE9]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? "text-[#2563EB]" : "text-[#787369]"}`} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && item.count > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#E2DDD5] text-[#555]">
                  {item.count}
                </span>
              )}
              {item.badge && (
                <span className="w-4 h-4 rounded-full bg-[#E11D48] text-white text-[10px] flex items-center justify-center font-mono">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Promo & Profile Cards */}
      <div className="p-3.5 space-y-3 border-t border-[#E8E4DC]">
        {/* Invite Promotion Box */}
        <div className="p-3 rounded-2xl bg-[#EDE9E1]/70 border border-[#DFD9CE] text-[11px] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[#2C2C2C]">邀请送积分</span>
            <button
              onClick={handleCopyInvite}
              className="text-[10px] font-mono text-[#2563EB] hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedLink ? "已复制" : "复制链接"}</span>
            </button>
          </div>
          <p className="text-[10px] text-[#716C62] leading-tight">
            前3位好友注册，每位奖励你 15 积分
          </p>
        </div>

        {/* User Account / Login Bar */}
        {isAuthenticated && currentUser ? (
          <div className="p-3 rounded-2xl bg-white border border-[#E2DDD5] shadow-xs space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center font-serif text-sm font-bold shadow-xs shrink-0">
                {currentUser.avatar && currentUser.avatar !== "🎨" ? (
                  <AvatarView avatar={currentUser.avatar} size="sm" />
                ) : (
                  <span>{currentUser.name ? currentUser.name.slice(0, 1) : "拾"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[#18181B] truncate">
                  {currentUser.email || currentUser.username || "1948863412@qq.com"}
                </div>
                <div className="text-[10px] text-[#716C62] flex items-center gap-1.5 mt-0.5 font-mono">
                  <span>剩余积分:</span>
                  <span className="text-[#2563EB] font-bold">{userCredits}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#F0ECE4] text-[11px]">
              <button
                onClick={() => {
                  useEditorStore.getState().setUserCredits(userCredits + 10);
                }}
                className="text-[#2563EB] hover:underline cursor-pointer flex items-center gap-1 font-medium"
              >
                <CreditCard className="w-3 h-3" />
                <span>充值积分</span>
              </button>

              <div className="flex items-center gap-2">
                {currentUser.isAdmin && (
                  <button
                    onClick={() => setAdminModalOpen(true, "users")}
                    className="text-[#D97706] hover:underline cursor-pointer flex items-center gap-0.5"
                    title="管理员控制台"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>管理</span>
                  </button>
                )}

                <button
                  onClick={() => logout()}
                  className="text-[#716C62] hover:text-[#DC2626] cursor-pointer"
                  title="退出登录"
                >
                  退出
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-white border border-[#E2DDD5] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#5C5850]">访客体验模式</span>
              <span className="text-[10px] font-mono text-[#2563EB] font-bold">{userCredits} 积分</span>
            </div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer text-center block"
            >
              登录 / 注册账号
            </button>
          </div>
        )}

        {/* Footer Links */}
        <div className="text-[9px] text-[#9E9A91] space-y-1 pt-1 leading-normal font-sans">
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <span className="hover:text-[#555] cursor-pointer">生成状态</span>
            <span className="hover:text-[#555] cursor-pointer">隐私政策</span>
            <span className="hover:text-[#555] cursor-pointer">用户协议</span>
            <span className="hover:text-[#555] cursor-pointer">数据与投诉</span>
          </div>
          <div>
            <span className="hover:text-[#555] cursor-pointer">联系方式</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
