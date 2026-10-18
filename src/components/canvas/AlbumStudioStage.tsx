import React, { useState } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { Album } from '../../types/album';
import { PhotobookStage } from '../album/PhotobookStage';
import { AddAlbumPageModal } from '../album/AddAlbumPageModal';
import { AlbumExportModal } from '../album/AlbumExportModal';

export const AlbumStudioStage: React.FC = () => {
  const albums = useEditorStore((s) => s.albums);
  const currentAlbumId = useEditorStore((s) => s.currentAlbumId);
  const updateAlbumTitle = useEditorStore((s) => s.updateAlbumTitle);
  const updateAlbumTheme = useEditorStore((s) => s.updateAlbumTheme);
  const deleteSpreadFromAlbum = useEditorStore((s) => s.deleteSpreadFromAlbum);

  const currentAlbum: Album =
    albums.find((a) => a.id === currentAlbumId) || albums[0];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  return (
    <div className="relative flex-1 w-full h-full flex flex-col overflow-hidden select-none">
      <PhotobookStage
        album={currentAlbum}
        onUpdateTitle={(newTitle) => updateAlbumTitle(currentAlbum.id, newTitle)}
        onUpdateTheme={(newTheme) => updateAlbumTheme(currentAlbum.id, newTheme)}
        onDeleteSpread={(idx) => deleteSpreadFromAlbum(currentAlbum.id, idx)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
      />

      {/* 弹窗 */}
      {currentAlbum && (
        <>
          <AddAlbumPageModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            albumId={currentAlbum.id}
          />
          <AlbumExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            album={currentAlbum}
          />
        </>
      )}
    </div>
  );
};
