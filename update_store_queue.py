with open("src/store/useEditorStore.ts", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    'import { AiConfig, GenerationTask, StylePreset } from "../types/ai";',
    'import { AiConfig, GenerationTask, StylePreset, GenerationQueueTask } from "../types/ai";'
)

# 2. Add interface definitions to EditorState
queue_interface = """  aiQueue: GenerationQueueTask[];
  isQueueRunning: boolean;
  activeQueueTaskId: string | null;
  addToAiQueue: (task: Omit<GenerationQueueTask, "id" | "status" | "progress" | "stageText" | "createdAt">) => string;
  addBatchToAiQueue: (tasks: Array<Omit<GenerationQueueTask, "id" | "status" | "progress" | "stageText" | "createdAt">>) => void;
  processNextQueueTask: () => Promise<void>;
  retryQueueTask: (taskId: string) => void;
  removeQueueTask: (taskId: string) => void;
  clearCompletedQueue: () => void;
"""

target_interface = "  isGeneratingAi: boolean;\n  aiHistory: GenerationTask[];\n"
if target_interface in content:
    content = content.replace(target_interface, target_interface + queue_interface)
    print("Added queue interface to EditorState.")
else:
    print("Warning: target_interface not found.")

# 3. Add initial state and implementation
queue_impl = """     aiQueue: [],
     isQueueRunning: false,
     activeQueueTaskId: null,

     addToAiQueue: (taskData) => {
       const id = "task_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
       const newTask: GenerationQueueTask = {
         ...taskData,
         id,
         status: "pending",
         progress: 0,
         stageText: "等待处理...",
         createdAt: Date.now(),
       };
       setStore((state) => ({ aiQueue: [...state.aiQueue, newTask] }));
       // Trigger queue processing in next tick
       setTimeout(() => {
         getStore().processNextQueueTask();
       }, 50);
       return id;
     },

     addBatchToAiQueue: (tasksData) => {
       const newTasks: GenerationQueueTask[] = tasksData.map((taskData, idx) => ({
         ...taskData,
         id: "task_" + (Date.now() + idx) + "_" + Math.random().toString(36).substring(2, 7),
         status: "pending",
         progress: 0,
         stageText: "等待处理...",
         createdAt: Date.now() + idx,
       }));
       setStore((state) => ({ aiQueue: [...state.aiQueue, ...newTasks] }));
       setTimeout(() => {
         getStore().processNextQueueTask();
       }, 50);
     },

     retryQueueTask: (taskId: string) => {
       setStore((state) => ({
         aiQueue: state.aiQueue.map((t) =>
           t.id === taskId
             ? { ...t, status: "pending", progress: 0, stageText: "重新排队中...", errorMessage: undefined }
             : t
         ),
       }));
       setTimeout(() => {
         getStore().processNextQueueTask();
       }, 50);
     },

     removeQueueTask: (taskId: string) => {
       setStore((state) => ({
         aiQueue: state.aiQueue.filter((t) => t.id !== taskId),
       }));
     },

     clearCompletedQueue: () => {
       setStore((state) => ({
         aiQueue: state.aiQueue.filter((t) => t.status !== "success"),
       }));
     },

     processNextQueueTask: async () => {
       const state = getStore();
       if (state.isQueueRunning) return;

       const pendingTask = state.aiQueue.find((t) => t.status === "pending");
       if (!pendingTask) return;

       const taskId = pendingTask.id;
       const targetStyle = getStyleById(pendingTask.styleId);
       const prompt = buildStylePrompt(targetStyle, {
         customNotes: pendingTask.customNotes,
         mood: pendingTask.mood,
         includeText: pendingTask.includeText !== false,
         specifiedText: pendingTask.specifiedText,
       });

       setStore((s) => ({
         isQueueRunning: true,
         isGeneratingAi: true,
         activeQueueTaskId: taskId,
         aiQueue: s.aiQueue.map((t) =>
           t.id === taskId ? { ...t, status: "running", progress: 15, stageText: "正在分析素材结构与意境特征..." } : t
         ),
       }));

       // Simulated progress updates while API is running
       const p1 = setTimeout(() => {
         setStore((s) => ({
           aiQueue: s.aiQueue.map((t) =>
             t.id === taskId ? { ...t, progress: 45, stageText: `正在重构「${targetStyle.name}」先锋视觉...` } : t
           ),
         }));
       }, 3000);

       const p2 = setTimeout(() => {
         setStore((s) => ({
           aiQueue: s.aiQueue.map((t) =>
             t.id === taskId ? { ...t, progress: 75, stageText: "正在执行高解析度光影与质感定影..." } : t
           ),
         }));
       }, 15000);

       try {
         const res = await apiGenerateStylizedImage({
           prompt,
           styleId: targetStyle.id,
           styleName: targetStyle.name,
           sourceImage: pendingTask.sourceImage,
           aspectRatio: pendingTask.aspectRatio || targetStyle.aspectRatio,
           customNotes: pendingTask.customNotes,
           specifiedText: pendingTask.specifiedText,
           userId: state.currentUser?.id,
         });

         clearTimeout(p1);
         clearTimeout(p2);

         if (res.success && res.image) {
           setStore((s) => ({
             isQueueRunning: false,
             isGeneratingAi: false,
             activeQueueTaskId: null,
             latestAiGeneratedImage: res.image,
             aiQueue: s.aiQueue.map((t) =>
               t.id === taskId
                 ? {
                     ...t,
                     status: "success",
                     progress: 100,
                     stageText: "✓ 成片已就绪并入库",
                     resultImage: res.image,
                     completedAt: Date.now(),
                   }
                 : t
             ),
           }));

           // Auto-save to user media assets
           getStore().addMediaAssets([
             {
               name: `AI风格 · ${targetStyle.name}`,
               src: res.image,
               width: 1024,
               height: 1024,
             },
           ]).catch(() => {});

           // Refresh AI history
           getStore().fetchAiHistory().catch(() => {});
         } else {
           setStore((s) => ({
             isQueueRunning: false,
             isGeneratingAi: false,
             activeQueueTaskId: null,
             aiQueue: s.aiQueue.map((t) =>
               t.id === taskId
                 ? {
                     ...t,
                     status: "error",
                     progress: 0,
                     stageText: res.message || "生成失败",
                     errorMessage: res.message || "生成未返回图片",
                   }
                 : t
             ),
           }));
         }
       } catch (err: any) {
         clearTimeout(p1);
         clearTimeout(p2);
         setStore((s) => ({
           isQueueRunning: false,
           isGeneratingAi: false,
           activeQueueTaskId: null,
           aiQueue: s.aiQueue.map((t) =>
             t.id === taskId
               ? {
                   ...t,
                   status: "error",
                   progress: 0,
                   stageText: err.message || "网络请求异常",
                   errorMessage: err.message || "请求失败",
                 }
               : t
           ),
         }));
       }

       // Automatically process next in queue
       setTimeout(() => {
         getStore().processNextQueueTask();
       }, 200);
     },
"""

target_impl = "     isGeneratingAi: false,\n     aiHistory: [],\n"
if target_impl in content:
    content = content.replace(target_impl, target_impl + queue_impl)
    print("Added queue implementation to useEditorStore.")
else:
    print("Warning: target_impl not found.")

with open("src/store/useEditorStore.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Finished updating useEditorStore.ts.")
