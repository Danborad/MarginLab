import React, { useState, useEffect } from "react";
import { useEditorStore } from "../../../store/useEditorStore";
import { UserMediaAsset } from "../../../types/document";
import {
  X,
  FolderOpen,
  Upload,
  Check,
  Sparkles,
  Layers,
  Plus,
  Image as ImageIcon,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "../../ui/Button";
import { fileToBase64 } from "../../../lib/utils";
import { thumbOf } from "../../../lib/thumbs";

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSingle: (asset: UserMediaAsset) => void;
  onSelectBatchQueue: (assets: UserMediaAsset[]) => void;
  activeStyleName: string;
}

export const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectSingle,
  onSelectBatchQueue,
  activeStyleName,
}) => {
  const mediaAssets = useEditorStore((s) => s.mediaAssets);
  const addMediaAssets = useEditorStore((s) => s.addMediaAssets);
  const fetchUserMedia = useEditorStore((s) => s.fetchUserMedia);

  useEffect(() => {
    if (isOpen) {
      fetchUserMedia().catch(() => {});
    }
  }, [isOpen, fetchUserMedia]);

  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filteredAssets = mediaAssets.filter((a) =>
    searchQuery ? (a.name || "").toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const handleUploadNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

        const itemsToAdd: { name: string; src: string; width: number; height: number }[] = [];
    for (const file of files) {
      if (file.type.startsWith("image/")) {
        const b64 = await fileToBase64(file);
        itemsToAdd.push({
          width: 1024,
          height: 1024,
          name: file.name.replace(/\.[^/.]+$/, ""),
          src: b64,
        });
      }
    }

    if (itemsToAdd.length > 0) {
      const created = await addMediaAssets(itemsToAdd);
      if (!isBatchMode && created && created[0]) {
        onSelectSingle(created[0]);
        onClose();
      }
    }
  };

  const toggleSelectId = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchConfirm = () => {
    const chosen = mediaAssets.filter((a) => selectedIds.includes(a.id));
    if (chosen.length > 0) {
      onSelectBatchQueue(chosen);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-3xl bg-studio-card border border-studio-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-studio-border flex items-center justify-between bg-studio-sidebar/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-studio-text flex items-center gap-2">
                <span>从素材库选择照片</span>
                <span className="text-[11px] font-mono font-normal text-studio-muted">
                  ({mediaAssets.length} 张可用)
                </span>
              </h3>
              <p className="text-[11px] text-studio-muted mt-0.5">
                选择已有素材用于「{activeStyleName}」，或开启多选批量生成。
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsBatchMode(!isBatchMode);
                setSelectedIds([]);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isBatchMode
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-studio-panel border-studio-border text-studio-muted hover:text-studio-text"
              }`}
            >
              {isBatchMode ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
              <span>{isBatchMode ? "退出多选" : "多选批量加入队列"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-studio-panel hover:bg-studio-hover border border-studio-border flex items-center justify-center text-studio-muted hover:text-studio-text transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Toolbar */}
        <div className="px-5 py-3 border-b border-studio-border bg-studio-panel/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <input
            type="text"
            placeholder="搜索素材照片名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 bg-studio-card border border-studio-border rounded-xl text-xs text-studio-text focus:outline-none focus:border-amber-600"
          />

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUploadNew}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>上传新照片入库</span>
            </Button>
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 no-scrollbar">
          {filteredAssets.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <ImageIcon className="w-10 h-10 text-studio-muted mx-auto opacity-50" />
              <p className="text-xs text-studio-muted">素材库暂无照片，请先上传照片入库</p>
              <Button
                variant="accent"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs"
              >
                立即上传照片
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredAssets.map((asset) => {
                const isSelected = selectedIds.includes(asset.id);
                return (
                  <div
                    key={asset.id}
                    onClick={() => {
                      if (isBatchMode) {
                        toggleSelectId(asset.id);
                      } else {
                        onSelectSingle(asset);
                        onClose();
                      }
                    }}
                    className={`group relative rounded-2xl overflow-hidden border bg-studio-panel cursor-pointer transition-all duration-200 aspect-[3/4] flex flex-col ${
                      isSelected
                        ? "ring-2 ring-blue-600 border-blue-600 shadow-md"
                        : "border-studio-border hover:border-amber-500 hover:shadow-sm"
                    }`}
                  >
                    <img
                      src={thumbOf(asset.thumb || asset.src, 480)}
                      alt={asset.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />

                    {/* Batch Selection Checkbox */}
                    {isBatchMode && (
                      <div className="absolute top-2 right-2 z-10">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center border shadow-md transition-colors ${
                            isSelected
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-black/50 border-white/60 text-transparent"
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end">
                      <p className="text-[11px] font-medium text-gray-900 truncate drop-shadow-sm">
                        {asset.name || "未命名照片"}
                      </p>
                      <span className="text-[9px] text-gray-900/70 font-mono">
                        {isBatchMode ? "点击勾选" : "点击立即载入创作"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer (Batch Action) */}
        {isBatchMode && (
          <div className="p-4 border-t border-studio-border bg-studio-sidebar/95 flex items-center justify-between">
            <span className="text-xs text-studio-muted">
              已选中 <strong className="text-blue-600 font-bold">{selectedIds.length}</strong> 张照片
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedIds([])}
                disabled={selectedIds.length === 0}
                className="text-xs"
              >
                重置选择
              </Button>
              <Button
                variant="accent"
                size="sm"
                onClick={handleBatchConfirm}
                disabled={selectedIds.length === 0}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                <span>加入「{activeStyleName}」生成队列 ({selectedIds.length})</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
