import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { PhotobookStage } from './PhotobookStage';
import { AddAlbumPageModal } from './AddAlbumPageModal';
import { AlbumExportModal } from './AlbumExportModal';

export const AlbumModal: React.FC = () => {
  const isOpen = useEditorStore((s) => s.albumModalOpen);
  const setIsOpen = useEditorStore((s) => s.setAlbumModalOpen);
  const albums = useEditorStore((s) => s.albums);
  const currentAlbumId = useEditorStore((s) => s.currentAlbumId);
  const updateAlbumTitle = useEditorStore((s) => s.updateAlbumTitle);
  const updateAlbumTheme = useEditorStore((s) => s.updateAlbumTheme);
  const deleteSpreadFromAlbum = useEditorStore((s) => s.deleteSpreadFromAlbum);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  if (!isOpen) return null;

  const currentAlbum =
    albums.find((a) => a.id === currentAlbumId) || albums[0] || {
      id: 'album_fallback',
      title: '艺术相册',
      coverImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
      theme: 'indigo',
      spreads: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden animate-fadeIn">
      <PhotobookStage
        album={currentAlbum}
        onUpdateTitle={(newTitle) => updateAlbumTitle(currentAlbum.id, newTitle)}
        onUpdateTheme={(newTheme) => updateAlbumTheme(currentAlbum.id, newTheme)}
        onDeleteSpread={(idx) => deleteSpreadFromAlbum(currentAlbum.id, idx)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onClose={() => setIsOpen(false)}
      />

      {/* 添加新页面弹窗 (拼图模板 / 素材库照片) */}
      <AddAlbumPageModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        albumId={currentAlbum.id}
      />

      {/* 导出画册弹窗 */}
      <AlbumExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        album={currentAlbum}
      />
    </div>
  );
};
