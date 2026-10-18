import React, { useState, useRef } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { CANVAS_PRESETS } from '../../lib/presets';
import {
  FolderOpen,
  X,
  Plus,
  Save,
  Download,
  Upload,
  Trash2,
  Copy,
  Clock,
  Sparkles,
  LayoutTemplate,
  FileCheck,
  Edit2,
  Check,
  Maximize2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../ui/Button';

export const ProjectManagerModal: React.FC = () => {
  const projectModalOpen = useEditorStore((s) => s.projectModalOpen);
  const setProjectModalOpen = useEditorStore((s) => s.setProjectModalOpen);
  const savedProjects = useEditorStore((s) => s.savedProjects);
  const customTemplates = useEditorStore((s) => s.customTemplates);
  const currentProjectId = useEditorStore((s) => s.currentProjectId);
  const document = useEditorStore((s) => s.document);

  const saveCurrentProject = useEditorStore((s) => s.saveCurrentProject);
  const saveAsNewProject = useEditorStore((s) => s.saveAsNewProject);
  const saveAsCustomTemplate = useEditorStore((s) => s.saveAsCustomTemplate);
  const loadSavedProject = useEditorStore((s) => s.loadSavedProject);
  const deleteSavedProject = useEditorStore((s) => s.deleteSavedProject);
  const duplicateSavedProject = useEditorStore((s) => (s as any).duplicateSavedProject);
  const renameSavedProject = useEditorStore((s) => (s as any).renameSavedProject);
  const deleteCustomTemplate = useEditorStore((s) => s.deleteCustomTemplate);
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const createNewProject = useEditorStore((s) => s.createNewProject);
  const exportProjectFile = useEditorStore((s) => s.exportProjectFile);
  const importProjectFile = useEditorStore((s) => s.importProjectFile);
  const setExportModalOpen = useEditorStore((s) => s.setExportModalOpen);

  const [activeTab, setActiveTab] = useState<'projects' | 'customTemplates' | 'saveAs' | 'newProject'>('projects');
  const [newProjectName, setNewProjectName] = useState(document.name);
  const [templateName, setTemplateName] = useState(document.name + ' 模板');
  const [templateDesc, setTemplateDesc] = useState('用户自制排版模板');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const [editingProjId, setEditingProjId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!projectModalOpen) return null;

  const handleSaveCurrent = async () => {
    setIsSaving(true);
    try {
      await saveCurrentProject(document.name);
      setSaveSuccessMsg('当前画作已成功保存至作品库！');
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsNew = async () => {
    if (!newProjectName.trim()) return;
    setIsSaving(true);
    try {
      await saveAsNewProject(newProjectName.trim());
      setSaveSuccessMsg(`已另存为新作品「${newProjectName.trim()}」！`);
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setActiveTab('projects');
      }, 1000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!templateName.trim()) return;
    setIsSaving(true);
    try {
      await saveAsCustomTemplate(templateName.trim(), templateDesc.trim());
      setSaveSuccessMsg(`已存为自制模板「${templateName.trim()}」！`);
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setActiveTab('customTemplates');
      }, 1000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartRename = (id: string, currentName: string) => {
    setEditingProjId(id);
    setEditingTitle(currentName);
  };

  const handleConfirmRename = async (id: string) => {
    if (editingTitle.trim() && renameSavedProject) {
      await renameSavedProject(id, editingTitle.trim());
    }
    setEditingProjId(null);
  };

  const handleDuplicate = async (id: string) => {
    if (duplicateSavedProject) {
      await duplicateSavedProject(id);
      setSaveSuccessMsg('已创建作品副本！');
      setTimeout(() => setSaveSuccessMsg(null), 2000);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ok = await importProjectFile(file);
      if (ok) {
        setSaveSuccessMsg('工程文件导入成功！');
        setTimeout(() => {
          setSaveSuccessMsg(null);
          setProjectModalOpen(false);
        }, 1200);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4 select-none"
      onClick={() => setProjectModalOpen(false)}
    >
      <div
        className="bg-studio-panel border border-studio-border rounded-2xl w-[95vw] max-w-3xl overflow-hidden shadow-soft-float flex flex-col max-h-[88vh] ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4.5 border-b border-studio-border flex items-center justify-between bg-studio-sidebar/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-studio-card flex items-center justify-center text-studio-accent border border-studio-border shadow-sm">
              <FolderOpen className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-studio-text flex items-center gap-2">
                <span>我的作品库与画报存档</span>
                {saveSuccessMsg && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                    <FileCheck className="w-3 h-3" />
                    {saveSuccessMsg}
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-studio-muted mt-0.5">
                独立存档记录，随时加载与多版本管理，绝不破坏系统预设模板
              </p>
            </div>
          </div>
          <button
            id="close-project-modal-btn"
            onClick={() => setProjectModalOpen(false)}
            className="p-1.5 rounded-lg text-studio-muted hover:text-studio-text hover:bg-studio-card transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-2 border-b border-studio-border flex items-center justify-between bg-studio-sidebar/40 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'projects', label: `画作存档 (${savedProjects.length})`, icon: FolderOpen },
              { id: 'newProject', label: '➕ 新建空白', icon: Plus },
              { id: 'customTemplates', label: `自制模板 (${customTemplates.length})`, icon: LayoutTemplate },
              { id: 'saveAs', label: '💾 另存与备份', icon: Save },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-studio-accent text-white shadow-sm font-semibold'
                      : 'text-studio-muted hover:text-gray-950 hover:bg-studio-card'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveCurrent}
              disabled={isSaving}
              className="flex items-center gap-1 text-[11px] h-7 border-studio-border shrink-0"
            >
              <Save className="w-3 h-3 text-studio-accent" />
              <span>快速保存当前</span>
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {/* TAB 1: SAVED PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-3">
              {savedProjects.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-studio-card flex items-center justify-center mx-auto text-studio-muted border border-studio-border">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-studio-text">暂无已保存作品</p>
                    <p className="text-[11px] text-studio-muted">
                      编辑画作后点击「快速保存当前」或「另存为」，即可保留你的排版记录
                    </p>
                  </div>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={handleSaveCurrent}
                    className="mt-2"
                  >
                    保存当前画作到作品库
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {savedProjects.map((proj) => {
                    const isCurrent = currentProjectId === proj.id;
                    const dateStr = new Date(proj.updatedAt).toLocaleString('zh-CN', {
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    });

                    return (
                      <div
                        key={proj.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between group ${
                          isCurrent
                            ? 'border-studio-accent bg-studio-card ring-1 ring-studio-accent/40 shadow-subtle-glow'
                            : 'border-studio-border bg-studio-card/60 hover:bg-studio-card hover:border-gray-400'
                        }`}
                      >
                        <div className="space-y-2.5">
                          {/* Thumbnail / Header */}
                          <div className="flex items-start gap-3">
                            {proj.preview ? (
                              <div className="w-16 h-20 rounded-lg overflow-hidden bg-black border border-gray-200 shrink-0 shadow-sm flex items-center justify-center">
                                <img
                                  src={proj.preview}
                                  alt={proj.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-20 rounded-lg bg-studio-panel border border-studio-border shrink-0 flex flex-col items-center justify-center text-studio-muted">
                                <Layers className="w-5 h-5 text-studio-accent/70 mb-1" />
                                <span className="text-[9px] font-mono">
                                  {proj.canvasWidth}×{proj.canvasHeight}
                                </span>
                              </div>
                            )}

                            <div className="flex-1 min-w-0 space-y-1">
                              {editingProjId === proj.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleConfirmRename(proj.id)}
                                    autoFocus
                                    className="w-full px-2 py-0.5 bg-studio-panel border border-studio-accent rounded text-xs text-studio-text focus:outline-none"
                                  />
                                  <button
                                    onClick={() => handleConfirmRename(proj.id)}
                                    className="p-1 rounded bg-studio-accent text-white"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-1">
                                  <h3 className="text-xs font-semibold text-studio-text truncate">
                                    {proj.name}
                                  </h3>
                                  <button
                                    onClick={() => handleStartRename(proj.id, proj.name)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-studio-muted hover:text-studio-accent transition-opacity"
                                    title="重命名"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 text-[10px] font-mono text-studio-muted flex-wrap">
                                <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-studio-accent">
                                  {proj.presetName || '自定义'}
                                </span>
                                <span>{proj.canvasWidth}×{proj.canvasHeight} px</span>
                              </div>

                              <div className="flex items-center gap-1 text-[10px] font-mono text-studio-muted">
                                <Clock className="w-3 h-3" />
                                <span>{dateStr}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-3 mt-2.5 border-t border-studio-border/60 flex items-center justify-between">
                          <button
                            onClick={() => {
                              loadSavedProject(proj.id);
                              setProjectModalOpen(false);
                            }}
                            className="px-3 py-1 rounded-lg bg-studio-accent text-white text-[11px] font-semibold hover:bg-studio-accentHover transition-colors flex items-center gap-1"
                          >
                            <span>载入画作</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDuplicate(proj.id)}
                              className="p-1.5 rounded hover:bg-studio-panel text-studio-muted hover:text-studio-text transition-colors"
                              title="创建副本"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteSavedProject(proj.id)}
                              className="p-1.5 rounded hover:bg-red-500/10 text-studio-muted hover:text-red-600 transition-colors"
                              title="删除存档"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: NEW BLANK PROJECT */}
          {activeTab === 'newProject' && (
            <div className="space-y-3 max-w-xl mx-auto py-2">
              <span className="text-xs font-semibold text-studio-text block">
                选择新建画作尺寸 (清空画布并新建)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CANVAS_PRESETS.slice(0, 8).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      createNewProject(preset.id);
                      setProjectModalOpen(false);
                    }}
                    className="p-3 rounded-xl border border-studio-border bg-studio-card/60 hover:bg-studio-card hover:border-studio-accent text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-studio-text group-hover:text-studio-accent">
                        {preset.name}
                      </span>
                      {preset.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-studio-panel text-studio-accent">
                          {preset.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-studio-muted mt-1 font-mono">
                      {preset.width} × {preset.height} px {preset.physicalSize ? `(${preset.physicalSize})` : ''}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM TEMPLATES */}
          {activeTab === 'customTemplates' && (
            <div className="space-y-3">
              {customTemplates.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-studio-card flex items-center justify-center mx-auto text-studio-muted border border-studio-border">
                    <LayoutTemplate className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-studio-text">暂无自制模板</p>
                    <p className="text-[11px] text-studio-muted">
                      你可以将当前排版结构保存为自制模板，随时复用且不破坏系统预设模板
                    </p>
                  </div>
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => setActiveTab('saveAs')}
                    className="mt-2"
                  >
                    存为我的模板
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {customTemplates.map((tpl) => (
                    <div
                      key={tpl.id}
                      className="p-3.5 rounded-xl border border-studio-border bg-studio-card/60 hover:bg-studio-card hover:border-gray-400 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-semibold text-studio-text">{tpl.name}</h3>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-studio-panel border border-studio-border text-studio-accent">
                            {tpl.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-studio-muted line-clamp-1">{tpl.description}</p>
                      </div>

                      <div className="pt-3 mt-2 border-t border-studio-border/60 flex items-center justify-between">
                        <button
                          onClick={() => {
                            loadTemplate(tpl.id, true);
                            setProjectModalOpen(false);
                          }}
                          className="px-3 py-1 rounded-lg bg-studio-accent text-white text-[11px] font-semibold hover:bg-studio-accentHover transition-colors"
                        >
                          套用此模板
                        </button>

                        <button
                          onClick={() => deleteCustomTemplate(tpl.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-studio-muted hover:text-red-600 transition-colors"
                          title="删除模板"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SAVE AS & IMPORT/EXPORT */}
          {activeTab === 'saveAs' && (
            <div className="space-y-4 max-w-xl mx-auto py-2">
              {/* Option A: Save As New Project */}
              <div className="p-4 rounded-xl border border-studio-border bg-studio-card/60 space-y-3">
                <span className="text-xs font-semibold text-studio-text flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-studio-accent" />
                  <span>另存为新作品存档 (创建新版本)</span>
                </span>
                <p className="text-[11px] text-studio-muted">
                  将当前画布内容另存为一个新作品，保留当前所有图层、位置与文字。
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="输入新作品名称..."
                    className="flex-1 px-3 py-1.5 bg-studio-panel border border-studio-border rounded-lg text-xs text-studio-text focus:outline-none focus:border-studio-accent"
                  />
                  <Button
                    variant="accent"
                    size="sm"
                    onClick={handleSaveAsNew}
                    disabled={isSaving || !newProjectName.trim()}
                  >
                    另存新档
                  </Button>
                </div>
              </div>

              {/* Option B: Save As Custom Template */}
              <div className="p-4 rounded-xl border border-studio-border bg-studio-card/60 space-y-3">
                <span className="text-xs font-semibold text-studio-text flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-studio-accent" />
                  <span>存为自制排版模板 (不覆盖系统模板)</span>
                </span>
                <p className="text-[11px] text-studio-muted">
                  将当前排版版式存入自制模板库，方便日后一键套用自制布局。
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="模板名称..."
                    className="w-full px-3 py-1.5 bg-studio-panel border border-studio-border rounded-lg text-xs text-studio-text focus:outline-none focus:border-studio-accent"
                  />
                  <input
                    type="text"
                    value={templateDesc}
                    onChange={(e) => setTemplateDesc(e.target.value)}
                    placeholder="模板描述..."
                    className="w-full px-3 py-1.5 bg-studio-panel border border-studio-border rounded-lg text-xs text-studio-text focus:outline-none focus:border-studio-accent"
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSaveAsTemplate}
                    disabled={isSaving || !templateName.trim()}
                    className="w-full"
                  >
                    保存为自制模板
                  </Button>
                </div>
              </div>

              {/* Option C: File Export & Import */}
              <div className="p-4 rounded-xl border border-studio-border bg-studio-card/60 space-y-3">
                <span className="text-xs font-semibold text-studio-text flex items-center gap-2">
                  <Download className="w-4 h-4 text-studio-accent" />
                  <span>工程文件备份与导入 (.atelier)</span>
                </span>
                <p className="text-[11px] text-studio-muted">
                  将完整工程打包下载为本地文件，或在任意设备导入继续排版。
                </p>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={exportProjectFile}
                    className="flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>导出工程文件</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>导入工程文件</span>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".atelier,.json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
