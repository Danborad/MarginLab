import { DEFAULT_AI_STYLES, buildStylePrompt } from "./src/lib/ai-styles.ts";

const rrStyle = DEFAULT_AI_STYLES.find((s) => s.id === "reality_restaged");
console.log("Style name:", rrStyle.name);
console.log("Description:", rrStyle.description);
console.log("Negative Prompt:", rrStyle.negativePrompt);

console.log("\n--- Generated Prompt (with Tiananmen image description, pure artwork) ---");
const promptPure = buildStylePrompt(rrStyle, {
  includeText: false,
  sourceDescription: "北京天安门城楼、红墙黄瓦琉璃飞檐、白玉石雕栏杆与传统中式殿宇建筑",
  mood: "浓郁克莱因蓝巨幅高墙与朱红纯平地面的剧场化对峙，硬朗斜射剧场阳光，极简静谧",
});
console.log(promptPure);
