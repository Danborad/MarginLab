import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { DEFAULT_JIUZHAIGOU_ALBUM } from '../lib/default-albums';
import { Photobook3D } from '../components/album/book/Photobook3D';
import { FaceContext } from '../components/album/book/BookFaces';
import { PhotobookStage } from '../components/album/PhotobookStage';

type TurnSpec = { kind: 'forward' | 'backward'; from: number; to: number; progress: number; dragging?: boolean } | null;

const album = DEFAULT_JIUZHAIGOU_ALBUM;

const Qa: React.FC = () => {
  const [mode, setMode] = useState<'3d' | 'stage'>('3d');
  const [index, setIndex] = useState(-1);
  const [turn, setTurn] = useState<TurnSpec>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    (window as unknown as Record<string, unknown>).__qa = {
      set3d: (i: number, t: TurnSpec, s: number) => {
        setMode('3d');
        setIndex(i);
        setTurn(t);
        setScale(s ?? 1);
      },
      stage: (i: number) => {
        setMode('stage');
        setIndex(i);
      },
      ready: true,
    };
  }, []);

  const ctx = useMemo<FaceContext>(
    () => ({
      album,
      totalPages: album.spreads.length * 2 + 1,
      onPlaceholderClick: () => {},
      onRestart: () => {},
      interactive: true,
    }),
    []
  );

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#3B3E52' }}>
      {mode === '3d' ? (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: 720, height: 490, transform: `scale(${scale})` }}>
            <Photobook3D album={album} index={index} turn={turn ? { ...turn, dragging: false } : null} ctx={ctx} />
          </div>
        </div>
      ) : (
        <PhotobookStage
          album={album}
          onUpdateTitle={() => {}}
          onUpdateTheme={() => {}}
          onDeleteSpread={() => {}}
          onOpenAddModal={() => {}}
          onOpenExportModal={() => {}}
        />
      )}
    </div>
  );
};

createRoot(document.getElementById('qa-root')!).render(<Qa />);
