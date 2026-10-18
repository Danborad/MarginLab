import React, { useEffect, useState } from "react";
import { ElementPropertyPanel } from "../panels/ElementPropertyPanel";
import { TextPanel } from "../panels/TextPanel";
import { BackgroundPanel } from "../panels/BackgroundPanel";
import { ShapesPanel } from "../panels/ShapesPanel";
import { StickersPanel } from "../panels/StickersPanel";
import { LayersPanel } from "../panels/LayersPanel";
import { AccordionSection } from "../ui/AccordionSection";
import { useEditorStore } from "../../store/useEditorStore";
import { Sliders, Type, Palette, Shapes, Camera, Layers } from "lucide-react";

type GroupId = "properties" | "text" | "background" | "shapes" | "stickers" | "layers";

const GROUPS: {
  id: GroupId;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  Comp: React.ComponentType;
}[] = [
  { id: "properties", label: "属性面板", subtitle: "选中元素位置与外观调整", icon: Sliders, Comp: ElementPropertyPanel },
  { id: "text", label: "文字", subtitle: "标题预设与排版字体", icon: Type, Comp: TextPanel },
  { id: "background", label: "相纸", subtitle: "开本规格与底色材质", icon: Palette, Comp: BackgroundPanel },
  { id: "shapes", label: "形状", subtitle: "几何色块与装饰线条", icon: Shapes, Comp: ShapesPanel },
  { id: "stickers", label: "时间水印", subtitle: "手机厂商相机与时间水印", icon: Camera, Comp: StickersPanel },
  { id: "layers", label: "图层", subtitle: "元素层级与顺序管理", icon: Layers, Comp: LayersPanel },
];

export const RightSidebar: React.FC = () => {
  const activePanel = useEditorStore((s) => s.activePanel);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const [openGroup, setOpenGroup] = useState<GroupId | null>("properties");

  // 当用户在画布上新选中某个元素时，展开「属性面板」并收起其他项
  useEffect(() => {
    if (selectedIds.length > 0) {
      setOpenGroup("properties");
    }
  }, [selectedIds]);

  // 与左侧一阶导航联动：文字/相纸/形状/贴纸/图层 被选中时自动展开对应折叠组
  useEffect(() => {
    const hit = GROUPS.find((g) => g.id === activePanel);
    if (hit) setOpenGroup(hit.id);
  }, [activePanel]);

  return (
    <aside className="hidden lg:flex w-80 h-full border-l border-gray-200 bg-white select-none z-20 flex-col shrink-0">
      {/* 拼图功能折叠组（含属性面板）：一次只展开一个 */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {GROUPS.map((g) => {
          const isOpen = openGroup === g.id;
          const Comp = g.Comp;
          return (
            <AccordionSection
              key={g.id}
              title={g.label}
              subtitle={g.subtitle}
              icon={g.icon}
              isOpen={isOpen}
              onToggle={() => setOpenGroup(isOpen ? null : g.id)}
            >
              <Comp />
            </AccordionSection>
          );
        })}
      </div>
    </aside>
  );
};
