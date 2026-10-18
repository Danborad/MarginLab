 import React, { useState, useEffect } from "react";
 import { useEditorStore } from "../../store/useEditorStore";
 import {
   X,
   Sparkles,
   Key,
   Globe,
   Cpu,
   Check,
   AlertCircle,
   RefreshCw,
   Sliders,
   CheckCircle2,
   Crown,
   ShieldCheck,
   Lock,
 } from "lucide-react";
 import { Button } from "../ui/Button";
import { IMAGE_RATIOS } from "../../lib/ai-styles";
 
 const COMMON_MODELS = [
   { id: "image2", name: "image2", desc: "OpenAI / image2 原生兼容模型" },
   { id: "dall-e-3", name: "DALL·E 3", desc: "OpenAI 官方超高画质生图" },
   { id: "grok-imagine-image", name: "grok-imagine", desc: "Grok 灵感视觉模型" },
   { id: "flux-pro", name: "FLUX.1 Pro", desc: "FLUX 先锋照片与插画模型" },
   { id: "midjourney-v6", name: "Midjourney v6", desc: "高定艺术美学风格" },
 ];
 
 export const AiSettingsModal: React.FC = () => {
   const open = useEditorStore((s) => s.aiSettingsModalOpen);
   const setOpen = useEditorStore((s) => s.setAiSettingsModalOpen);
   const setAdminModalOpen = useEditorStore((s) => s.setAdminModalOpen);
   const currentUser = useEditorStore((s) => s.currentUser);
   const aiConfig = useEditorStore((s) => s.aiConfig);
   const fetchAiConfig = useEditorStore((s) => s.fetchAiConfig);
   const saveAiConfig = useEditorStore((s) => s.saveAiConfig);
   const testAiConfig = useEditorStore((s) => s.testAiConfig);
 
   const [baseUrl, setBaseUrl] = useState("");
   const [apiKey, setApiKey] = useState("");
   const [model, setModel] = useState("image2");
   const [size, setSize] = useState("auto");
   const [isTesting, setIsTesting] = useState(false);
   const [isSaving, setIsSaving] = useState(false);
   const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
 
   const isAdmin = Boolean(currentUser?.isAdmin);
 
   useEffect(() => {
     if (open) {
       fetchAiConfig().then((cfg) => {
         if (cfg) {
           setBaseUrl(cfg.baseUrl || "https://api.openai.com/v1");
           setModel(cfg.model || "image2");
           setSize(cfg.size || "auto");
           setApiKey(cfg.maskedKey || "");
         }
       });
       setFeedback(null);
     }
   }, [open, fetchAiConfig]);
 
   if (!open) return null;
  // 普通用户不需要自定义 API 功能，仅限管理员进行全局模型与 API 配置
  if (!isAdmin) return null;
 
   const handleTest = async () => {
     setIsTesting(true);
     setFeedback(null);
     const res = await testAiConfig();
     setIsTesting(false);
     setFeedback({
       type: res.success ? "success" : "error",
       text: res.message,
     });
   };
 
   const handleSave = async (e: React.FormEvent) => {
     e.preventDefault();
     setIsSaving(true);
     setFeedback(null);
     const res = await saveAiConfig({
       baseUrl: baseUrl.trim(),
       apiKey: apiKey.trim(),
       model: model.trim(),
       size,
     });
     setIsSaving(false);
     setFeedback({
       type: res.success ? "success" : "error",
       text: res.message,
     });
   };
 
   return (
     <div
       className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
       onClick={() => setOpen(false)}
     >
       <div
         className="w-full max-w-lg bg-studio-sidebar border border-studio-border/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleIn"
         onClick={(e) => e.stopPropagation()}
       >
         {/* Header */}
         <div className="px-5 py-4 border-b border-studio-border/70 flex items-center justify-between bg-studio-panel">
           <div className="flex items-center gap-2.5">
             <div className="w-8 h-8 rounded-xl bg-studio-accent/15 border border-studio-accent/40 flex items-center justify-center text-white shadow-inner">
               <Sparkles className="w-4 h-4" />
             </div>
             <div>
               <h3 className="text-sm font-semibold text-studio-text flex items-center gap-2">
                 OpenAI / image2 图像模型配置
                 {aiConfig?.isConfigured && (
                   <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                     <CheckCircle2 className="w-2.5 h-2.5" /> 已就绪
                   </span>
                 )}
               </h3>
               <p className="text-[11px] text-studio-muted">
                 适配 OpenAI 格式图片模型（image2、DALL·E、FLUX 或自定义中转站）
               </p>
             </div>
           </div>
         <button
           onClick={() => setOpen(false)}
           className="p-1.5 rounded-lg bg-studio-card/80 text-studio-muted hover:text-studio-text border border-studio-border/60 hover:border-studio-border transition-colors cursor-pointer"
         >
           <X className="w-4 h-4" />
         </button>
       </div>

       {/* Body */}
       {!isAdmin ? (
         <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
           {/* Non-Admin Notice */}
           <div className="p-4 rounded-2xl bg-studio-panel border border-studio-border flex items-start gap-3">
             <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 shrink-0">
               <ShieldCheck className="w-5 h-5" />
             </div>
             <div className="space-y-1 flex-1">
               <h4 className="font-semibold text-studio-text text-xs flex items-center gap-2">
                 <span>平台统一全局模型引擎</span>
                 <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 border border-amber-500/30">
                   管理员管控
                 </span>
               </h4>
               <p className="text-studio-muted leading-relaxed text-[11px]">
                 全局 OpenAI / image2 图像大模型已由系统超级管理员统一部署。普通创作者在工作台中可直接一键生成与复刻艺术风格，无需单独输入 API Key。
               </p>
             </div>
           </div>
 
           {/* Model Status Card */}
           <div className="p-3.5 rounded-2xl bg-studio-panel/70 border border-studio-border/70 space-y-2.5">
             <div className="text-[11px] font-mono text-studio-muted uppercase">当前平台模型参数</div>
             <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
               <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                 <span className="text-studio-muted block text-[10px]">模型名称</span>
                 <span className="text-studio-accent font-semibold">{aiConfig?.model || "image2"}</span>
               </div>
               <div className="p-2 rounded-xl bg-black/40 border border-white/5">
                 <span className="text-studio-muted block text-[10px]">部署状态</span>
                 <span className={aiConfig?.isConfigured ? "text-emerald-600" : "text-amber-600"}>
                   {aiConfig?.isConfigured ? "🟢 正常可用" : "🟡 待管理员配置"}
                 </span>
               </div>
             </div>
           </div>
 
           <div className="pt-2 flex items-center justify-between gap-3">
             <span className="text-[10px] text-studio-muted font-mono">
               如需修改或配置新模型，请以超级管理员账号登录后台
             </span>
             <Button
               type="button"
               variant="accent"
               onClick={() => {
                 setOpen(false);
                 useEditorStore.getState().setActivePanel("ai-stylize");
               }}
               className="text-xs py-2 px-4 shadow-subtle-glow cursor-pointer shrink-0"
             >
               <span>前往体验 AI 风格化</span>
             </Button>
           </div>
         </div>
       ) : (
       <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
         {feedback && (
           <div
             className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 animate-fadeIn ${
               feedback.type === "success"
                 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                 : "bg-red-500/10 border-red-500/30 text-red-600"
             }`}
           >
             {feedback.type === "success" ? (
               <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
             ) : (
               <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
             )}
             <span className="leading-relaxed">{feedback.text}</span>
           </div>
         )}

         {/* Base URL */}
           <div>
             <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1.5 flex items-center justify-between">
               <span className="flex items-center gap-1.5">
                 <Globe className="w-3.5 h-3.5 text-studio-accent" />
                 API 接口地址 (Base URL) *
               </span>
               <span className="text-[10px] text-studio-muted">支持 OpenAI 官方或中转站</span>
             </label>
             <input
               type="text"
               required
               value={baseUrl}
               onChange={(e) => setBaseUrl(e.target.value)}
               placeholder="https://api.openai.com/v1"
               className="w-full px-3 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono placeholder:text-studio-muted/40 focus:outline-none transition-colors"
             />
           </div>
 
           {/* API Key */}
           <div>
             <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1.5 flex items-center justify-between">
               <span className="flex items-center gap-1.5">
                 <Key className="w-3.5 h-3.5 text-studio-accent" />
                 API 密钥 (API Key) *
               </span>
               <span className="text-[10px] text-studio-muted">安全加密存储于服务端</span>
             </label>
             <input
               type="password"
               value={apiKey}
               onChange={(e) => setApiKey(e.target.value)}
               placeholder="sk-..."
               className="w-full px-3 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono placeholder:text-studio-muted/40 focus:outline-none transition-colors"
             />
           </div>
 
           {/* Model Selection */}
           <div>
             <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1.5 flex items-center justify-between">
               <span className="flex items-center gap-1.5">
                 <Cpu className="w-3.5 h-3.5 text-studio-accent" />
                 图片模型名称 (Model) *
               </span>
               <span className="text-[10px] text-studio-muted">自定义或点选快捷预设</span>
             </label>
             <input
               type="text"
               required
               value={model}
               onChange={(e) => setModel(e.target.value)}
               placeholder="image2 / dall-e-3"
               className="w-full px-3 py-2 bg-studio-panel border border-studio-border focus:border-studio-accent rounded-xl text-xs text-studio-text font-mono placeholder:text-studio-muted/40 focus:outline-none transition-colors mb-2"
             />
 
             {/* Quick Model Pills */}
             <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5">
               {COMMON_MODELS.map((m) => (
                 <button
                   key={m.id}
                   type="button"
                   onClick={() => setModel(m.id)}
                   className={`px-2 py-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                     model === m.id
                       ? "bg-studio-accent/15 border-studio-accent text-white font-medium shadow-sm"
                       : "bg-studio-panel border-studio-border/60 text-studio-muted hover:text-gray-950 hover:border-studio-border"
                   }`}
                 >
                   <div className="text-[11px] font-mono truncate">{m.name}</div>
                   <div className="text-[9px] text-studio-muted truncate opacity-80">{m.desc}</div>
                 </button>
               ))}
             </div>
           </div>
 
           {/* Aspect Ratio Picker (image2 format) */}
           <div>
             <label className="text-[11px] font-mono text-studio-muted uppercase block mb-1.5 flex items-center justify-between">
               <span className="flex items-center gap-1.5">
                 <Sliders className="w-3.5 h-3.5 text-studio-accent" />
                 默认尺寸或比例 (Aspect Ratio) *
               </span>
               <span className="text-[10px] text-studio-muted font-mono">适配 image2 / chatgpt2api 协议</span>
             </label>

             <div className="grid grid-cols-3 sm:grid-cols-9 gap-1.5 p-2 bg-studio-panel rounded-2xl border border-studio-border/70">
               {IMAGE_RATIOS.map((r) => {
                 const isSelected = (size || "auto") === r.id;
                 return (
                   <button
                     key={r.id}
                     type="button"
                     onClick={() => setSize(r.id)}
                     className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer border ${
                       isSelected
                         ? "bg-studio-accent/20 border-studio-accent text-white font-bold shadow-sm ring-1 ring-studio-accent/40"
                         : "bg-studio-panel border-studio-border/60 text-studio-muted hover:text-gray-950 hover:bg-studio-hover hover:border-studio-border"
                     }`}
                     title={`${r.label} (${r.desc})`}
                   >
                     <div className="w-6 h-6 flex items-center justify-center">
                       {r.isAuto ? (
                         <div
                           className={`border-2 border-dashed rounded-[3px] w-5 h-5 flex items-center justify-center text-[9px] font-mono font-bold transition-colors ${
                             isSelected ? "border-studio-accent text-studio-accent" : "border-zinc-400 text-zinc-400"
                           }`}
                         >
                           Auto
                         </div>
                       ) : (
                         <div
                           className={`border-2 rounded-[2px] transition-colors ${
                             isSelected ? "border-studio-accent" : "border-zinc-400"
                           }`}
                           style={{ width: r.iconW, height: r.iconH }}
                         />
                       )}
                     </div>
                     <span className="text-[10px] font-mono">{r.label}</span>
                   </button>
                 );
               })}
             </div>
           </div>
 
           {/* Footer Action Buttons */}
           <div className="pt-3 border-t border-studio-border/60 flex items-center justify-between gap-3">
             <Button
               type="button"
               variant="secondary"
               disabled={isTesting || !apiKey}
               onClick={handleTest}
               className="text-xs py-2.5 px-3 flex items-center gap-1.5 cursor-pointer"
             >
               <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
               <span>{isTesting ? "正在测试..." : "测试连接"}</span>
             </Button>
 
             <div className="flex items-center gap-2">
               <Button
                 type="button"
                 variant="ghost"
                 onClick={() => setOpen(false)}
                 className="text-xs py-2.5 px-3 cursor-pointer"
               >
                 取消
               </Button>
               <Button
                 type="submit"
                 variant="accent"
                 disabled={isSaving}
                 className="text-xs py-2.5 px-4 font-semibold shadow-subtle-glow flex items-center gap-1.5 cursor-pointer"
               >
                 <Check className="w-4 h-4" />
                 <span>{isSaving ? "正在保存..." : "保存配置"}</span>
               </Button>
             </div>
           </div>
         </form>
       )}
       </div>
     </div>
   );
 };
