import React from "react";
import { useEditorStore } from "../../store/useEditorStore";
import {
  Edit3,
  Clock,
  Trash2,
  Compass,
  RotateCcw,
  Plus,
  Layers,
} from "lucide-react";
import { CreativeSessionItem } from "../../types/ai";
import { thumbOf } from "../../lib/thumbs";

/** 一个聊天会话：同一会话内的多轮生成只算作一条历史记录 */
interface CreativeChat {
  id: string;
  rounds: CreativeSessionItem[];
  lastRound: CreativeSessionItem;
  firstRound: CreativeSessionItem;
}

export const AiCreativePanel: React.FC = () => {
  const creativeHistory = useEditorStore((s) => s.creativeHistory);
  const creativeActiveChatId = useEditorStore((s) => s.creativeActiveChatId);
  const reapplyCreativeSession = useEditorStore((s) => s.reapplyCreativeSession);
  const deleteCreativeSession = useEditorStore((s) => s.deleteCreativeSession);
  const clearCreativeHistory = useEditorStore((s) => s.clearCreativeHistory);
  const createNewCreativeSession = useEditorStore((s) => s.createNewCreativeSession);

  const formatTime = (ts: number) => {
    try {
      const d = new Date(ts);
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${month}/${day} ${hh}:${mm}`;
    } catch {
      return "刚刚";
    }
  };

  // 按会话聚合：连续的多轮生成合并为一条记录
  const chats: CreativeChat[] = React.useMemo(() => {
    const map = new Map<string, CreativeSessionItem[]>();
    for (const item of creativeHistory) {
      const key = item.sessionId || item.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([id, rounds]) => ({
      id,
      rounds,
      firstRound: rounds[0],
      lastRound: rounds[rounds.length - 1],
    }));
  }, [creativeHistory]);

  const handleDeleteChat = (chat: CreativeChat) => {
    chat.rounds.forEach((r) => deleteCreativeSession(r.id));
  };

  const totalRounds = creativeHistory.length;

  return (
    <div className="w-full h-full flex flex-col bg-white select-none">
      {/* 头部面板标题 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-950 font-bold">
              <Compass className="w-4 h-4 text-gray-950" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-950 tracking-tight">
                AI 创作工作台
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">
                内置生图大模型 · 自由提示词
              </p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
            就绪
          </span>
        </div>

        {/* 新建聊天 */}
        <button
          id="new-creative-chat-btn"
          onClick={() => createNewCreativeSession()}
          className="mt-3.5 w-full py-2.5 px-3 rounded-xl bg-gray-950 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
          title="开启一个新的创作聊天（会新增一条历史记录）"
        >
          <Plus className="w-4 h-4" />
          <span>新建聊天</span>
        </button>
      </div>

      {/* 内容区域：历史记录列表（按聊天聚合） */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar">
        <div className="flex items-center justify-between px-1 py-0.5 text-xs text-gray-500 font-bold">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>历史记录 ({chats.length})</span>
          </div>
          {totalRounds > chats.length && (
            <span className="text-[10px] text-gray-400 font-medium">
              共 {totalRounds} 轮生成
            </span>
          )}
        </div>

        {chats.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-800">暂无创作历史</p>
            <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
              在底部输入框输入描述即可开始创作；同一聊天里可以连续生成多次
            </p>
          </div>
        ) : (
          chats.map((chat) => {
            const isActive = creativeActiveChatId === chat.id;
            const allImages = chat.rounds.flatMap((r) => r.images || []);
            const isGenerating = chat.rounds.some((r) => r.status === "generating");
            const hasError = !isGenerating && chat.rounds.some((r) => r.status === "error");

            return (
              <div
                key={chat.id}
                className={`group relative bg-white border rounded-2xl p-3 hover:shadow-xs transition-all space-y-2 ${
                  isActive ? "border-gray-900" : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-gray-700 truncate">
                      {chat.firstRound.userName || "danborad"}
                    </span>
                    <span>·</span>
                    <span className="shrink-0">{formatTime(chat.firstRound.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {chat.rounds.length > 1 && (
                      <span className="px-1.5 py-0.5 rounded bg-gray-950 text-white font-bold text-[10px] flex items-center gap-0.5">
                        <Layers className="w-2.5 h-2.5" />
                        {chat.rounds.length} 轮
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 font-bold text-[10px]">
                      {chat.lastRound.aspectRatio} · {chat.lastRound.count}张
                    </span>
                  </div>
                </div>

                {/* 聊天标题 = 首轮提示词；多轮时附带显示最新一轮的追问 */}
                <p className="text-xs text-gray-800 line-clamp-2 leading-relaxed">
                  {chat.firstRound.prompt}
                </p>
                {chat.rounds.length > 1 && (
                  <p className="text-[11px] text-gray-500 line-clamp-1 leading-relaxed pl-2 border-l-2 border-gray-200">
                    {chat.lastRound.prompt}
                  </p>
                )}

                {/* 缩略图横排（汇总该聊天全部轮次） */}
                {allImages.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    {allImages.slice(0, 3).map((img, idx) => (
                      <div
                        key={idx}
                        className="w-12 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0"
                      >
                        <img src={thumbOf(img, 160)} alt="预览" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      </div>
                    ))}
                    {allImages.length > 3 && (
                      <span className="text-[10px] text-gray-400 font-bold">
                        +{allImages.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {isGenerating && (
                  <span className="text-[10px] text-gray-500 font-bold">生成中…</span>
                )}
                {hasError && (
                  <span className="text-[10px] text-red-600 font-bold">有生成未完成，可重试</span>
                )}

                {/* 底部操作条 */}
                <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                  <button
                    onClick={() => reapplyCreativeSession(chat.lastRound)}
                    className="text-xs font-bold text-gray-950 hover:text-black flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3 h-3 text-gray-700" />
                    <span>编辑并重新发送</span>
                  </button>

                  <button
                    onClick={() => handleDeleteChat(chat)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-all"
                    title="删除这条聊天记录"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 底部重置与清空 */}
      {chats.length > 0 && (
        <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            共保留 {chats.length} 条记录
          </span>
          <button
            onClick={() => {
              if (confirm("确定要重置创作历史吗？")) {
                clearCreativeHistory();
              }
            }}
            className="text-[11px] font-bold text-gray-500 hover:text-red-600 transition-colors cursor-pointer flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>重置为默认</span>
          </button>
        </div>
      )}
    </div>
  );
};
