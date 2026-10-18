import React from "react";
import { Bell, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { useEditorStore } from "../../store/useEditorStore";

export const ZineNotifications: React.FC = () => {
  const setZineTab = useEditorStore((s) => s.setZineTab);

  const notifications = [
    {
      id: "notif_1",
      title: "新功能上线：边缘留影与 s21 梦幻动态电影海报",
      time: "今天 12:00",
      content: "重磅上线 s21 艺术指令体系与边缘留影，支持真实慢门拖影、光影流动、手写典雅排版与大面积诗意留白。",
      tag: "功能更新",
    },
    {
      id: "notif_2",
      title: "OpenAI / image2 艺术大模型微喷引擎全面升级",
      time: "昨天 18:30",
      content: "新增 1:1、3:4、16:9 等多种画幅比例自适应，重构生成速度提升 40%，出片更细腻。",
      tag: "系统公告",
    },
    {
      id: "notif_3",
      title: "新用户注册即赠送 10 积分体验额度",
      time: "2026-09-01",
      content: "欢迎来到拾景zine，开启您的第一张艺术海报创作之旅。",
      tag: "活动福利",
    },
  ];

  return (
    <div className="flex-1 h-full overflow-y-auto p-4 sm:p-8 bg-[#F6F4EF] text-[#222] select-none">
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div className="pb-3 border-b border-[#E5E0D6]">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#18181B]">
            系统通知与公告
          </h1>
          <p className="text-xs sm:text-sm text-[#736E65] mt-1 font-sans">
            关注最新艺术风格、算法模型升级与功能发布。
          </p>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="p-5 rounded-2xl bg-white border border-[#E5E0D6] shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#2563EB]/10 text-[#2563EB] font-semibold border border-[#2563EB]/20">
                    {n.tag}
                  </span>
                  <h3 className="text-sm font-bold text-[#18181B]">{n.title}</h3>
                </div>
                <span className="text-[10px] font-mono text-[#8E8A83]">{n.time}</span>
              </div>
              <p className="text-xs text-[#666] leading-relaxed">{n.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
