import React, { useState } from "react";
import { useEditorStore } from "../../store/useEditorStore";
import { User, ShieldCheck, KeyRound, LogOut, Check, AlertCircle, CreditCard, Sparkles, Shield } from "lucide-react";
import { AvatarView } from "../ui/AvatarView";

export const ZineProfile: React.FC = () => {
  const currentUser = useEditorStore((s) => s.currentUser);
  const isAuthenticated = useEditorStore((s) => s.isAuthenticated);
  const userCredits = useEditorStore((s) => s.userCredits);
  const setUserCredits = useEditorStore((s) => s.setUserCredits);
  const logout = useEditorStore((s) => s.logout);
  const changePassword = useEditorStore((s) => s.changePassword);
  const setAdminModalOpen = useEditorStore((s) => s.setAdminModalOpen);
  const setAuthModalOpen = useEditorStore((s) => s.setAuthModalOpen);
  const aiHistory = useEditorStore((s) => s.aiHistory);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passMsg, setPassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (!oldPassword.trim()) {
      setPassMsg({ type: "error", text: "请输入原密码" });
      return;
    }
    if (!newPassword.trim() || newPassword.length < 4) {
      setPassMsg({ type: "error", text: "新密码至少 4 位字符" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: "error", text: "两次输入的新密码不一致" });
      return;
    }

    setIsChanging(true);
    const res = await changePassword(oldPassword, newPassword);
    setIsChanging(false);

    if (res.success) {
      setPassMsg({ type: "success", text: "密码修改成功！" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPassMsg({ type: "error", text: res.message || "修改失败，请核对原密码" });
    }
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="flex-1 h-full overflow-y-auto p-8 bg-[#F6F4EF] flex items-center justify-center select-none">
        <div className="p-8 rounded-3xl bg-white border border-[#E5E0D6] shadow-sm text-center space-y-4 max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto">
            <User className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-[#18181B]">未登录账号</h2>
          <p className="text-xs text-[#787369]">
            请先登录或注册个人专属账号，管理素材与作品。
          </p>
          <button
            onClick={() => setAuthModalOpen(true)}
            className="w-full py-3 rounded-xl bg-[#2563EB] text-white text-xs font-semibold hover:bg-[#1D4ED8] cursor-pointer"
          >
            立即登录 / 注册
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-8 bg-[#F6F4EF] text-[#222] select-none">
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        
        {/* Header */}
        <div className="pb-3 border-b border-[#E5E0D6]">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#18181B]">
            个人中心
          </h1>
          <p className="text-xs sm:text-sm text-[#736E65] mt-1 font-sans">
            管理您的个人档案与账户安全。
          </p>
        </div>

        {/* User Profile Card */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E0D6] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center text-2xl font-serif font-bold shadow-sm">
                {currentUser.avatar && currentUser.avatar !== "🎨" ? (
                  <AvatarView avatar={currentUser.avatar} size="lg" />
                ) : (
                  <span>{currentUser.name ? currentUser.name.slice(0, 1) : "拾"}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#18181B]">{currentUser.name}</h2>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                    已验证
                  </span>
                </div>
                <p className="text-xs text-[#787369] font-mono mt-0.5">
                  {currentUser.email || currentUser.username}
                </p>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="px-3 py-1.5 rounded-xl border border-[#DDD7CC] hover:border-red-400 text-xs text-[#DC2626] hover:bg-red-50 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>退出登录</span>
            </button>
          </div>

          {/* Credits and Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[#F0ECE4]">
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EBE7DF] text-center">
              <div className="text-lg font-bold font-mono text-[#2563EB]">{userCredits}</div>
              <div className="text-[10px] font-mono text-[#787369]">剩余积分</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EBE7DF] text-center">
              <div className="text-lg font-bold font-mono text-[#18181B]">{aiHistory.length}</div>
              <div className="text-[10px] font-mono text-[#787369]">已生成画作</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EBE7DF] text-center">
              <div className="text-lg font-bold font-mono text-emerald-600">100%</div>
              <div className="text-[10px] font-mono text-[#787369]">私有沙盒加密</div>
            </div>
          </div>

          {/* Admin Entry if Admin */}
          {currentUser.isAdmin && (
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-amber-600" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">系统超级管理员权限</h4>
                  <p className="text-[10px] text-amber-700">可管理用户账号、权限及全局 AI 图像大模型配置</p>
                </div>
              </div>
              <button
                onClick={() => setAdminModalOpen(true, "users")}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                进入管理后台
              </button>
            </div>
          )}
        </div>

        {/* Change Password Form */}
        <div className="p-6 rounded-3xl bg-white border border-[#E5E0D6] shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#18181B]">修改登录密码</h3>
          </div>

          {passMsg && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                passMsg.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {passMsg.type === "success" ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span>{passMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-3 max-w-md">
            <div>
              <label className="text-[11px] font-mono text-[#787369] block mb-1">当前原密码</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="请输入原密码"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CC] focus:border-[#2563EB] rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#787369] block mb-1">新密码</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少 4 位字符"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CC] focus:border-[#2563EB] rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-[#787369] block mb-1">确认新密码</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CC] focus:border-[#2563EB] rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isChanging}
              className="py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors"
            >
              {isChanging ? "正在提交..." : "确认修改密码"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
