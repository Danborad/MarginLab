import React from 'react';
import { Group, Rect, Text, Line, Circle } from 'react-konva';
import Konva from 'konva';
import { StickerElement } from '../../types/document';

interface StickerElementNodeProps {
  element: StickerElement;
  isSelected: boolean;
  onSelect: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onChange: (updates: Partial<StickerElement>) => void;
  onDragMove?: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onDragEnd?: (e: Konva.KonvaEventObject<DragEvent>) => void;
}

export const StickerElementNode: React.FC<StickerElementNodeProps> = ({
  element,
  isSelected,
  onSelect,
  onChange,
  onDragMove,
  onDragEnd,
}) => {
  const {
    stickerType = 'camera-watermark',
    watermarkStyle = 'leica',
    device = 'iPhone 13 Pro',
    dateTime = '2026.10.19 17:27:50',
    params = '26mm f/1.5 1/24 ISO1000',
    location = '52°13\'14"N 124°41\'31"W',
    bgTheme = 'white',
    width,
    height,
    label,
    color,
    accentColor,
  } = element;

  const isDarkBg = bgTheme === 'dark';
  const isTransparent = bgTheme === 'transparent';

  const textColor = isDarkBg ? '#F4F4F5' : '#18181B';
  const subTextColor = isDarkBg ? '#A1A1AA' : '#71717A';

  const isLegacy =
    stickerType !== 'camera-watermark' &&
    ['washi-tape', 'archival-tag', 'date-stamp', 'film-strip', 'grid-cross'].includes(stickerType || '');

  return (
    <Group
      id={element.id}
      x={element.x}
      y={element.y}
      width={width}
      height={height}
      rotation={element.rotation}
      opacity={element.opacity}
      draggable={!element.locked}
      onClick={onSelect}
      onTap={onSelect}
      onDragMove={onDragMove}
      onDragEnd={(e) => {
        onChange({
          x: Math.round(e.target.x()),
          y: Math.round(e.target.y()),
        });
        if (onDragEnd) onDragEnd(e);
      }}
      onTransformEnd={(e) => {
        const node = e.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        onChange({
          x: Math.round(node.x()),
          y: Math.round(node.y()),
          width: Math.max(60, Math.round(node.width() * scaleX)),
          height: Math.max(25, Math.round(node.height() * scaleY)),
          rotation: Math.round(node.rotation()),
        });
      }}
    >
      {/* Camera Watermark Background Container */}
      {!isLegacy && !isTransparent && (
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={isDarkBg ? '#121214' : '#FFFFFF'}
          cornerRadius={4}
          shadowColor="#000000"
          shadowBlur={isDarkBg ? 12 : 6}
          shadowOpacity={isDarkBg ? 0.25 : 0.08}
          shadowOffsetY={2}
        />
      )}

      {/* 1. Leica Watermark Style */}
      {!isLegacy && watermarkStyle === 'leica' && (
        <Group>
          <Text
            text={device || 'iPhone 13 Pro'}
            x={Math.max(16, width * 0.03)}
            y={height * 0.18}
            fill={textColor}
            fontFamily='"Plus Jakarta Sans", "PingFang SC", sans-serif'
            fontSize={Math.max(12, Math.round(height * 0.28))}
            fontStyle="bold"
            listening={false}
          />
          <Text
            text={dateTime || '2026.10.19 17:27:50'}
            x={Math.max(16, width * 0.03)}
            y={height * 0.54}
            fill={subTextColor}
            fontFamily='"JetBrains Mono", monospace'
            fontSize={Math.max(9, Math.round(height * 0.20))}
            listening={false}
          />

          <Group x={width - Math.max(190, width * 0.38)} y={height * 0.5}>
            <Circle
              x={0}
              y={0}
              radius={Math.max(10, Math.round(height * 0.26))}
              fill="#E4002B"
              listening={false}
            />
            <Text
              text="Leica"
              x={-Math.max(10, Math.round(height * 0.26))}
              y={-Math.round(height * 0.14)}
              width={Math.max(20, Math.round(height * 0.52))}
              align="center"
              fill="#FFFFFF"
              fontFamily="serif"
              fontStyle="italic bold"
              fontSize={Math.max(9, Math.round(height * 0.20))}
              listening={false}
            />
            <Line
              points={[
                Math.max(18, Math.round(height * 0.38)),
                -Math.round(height * 0.28),
                Math.max(18, Math.round(height * 0.38)),
                Math.round(height * 0.28),
              ]}
              stroke={subTextColor}
              strokeWidth={1}
              opacity={0.35}
              listening={false}
            />
            <Text
              text={params || '26mm f/1.5 1/24 ISO1000'}
              x={Math.max(26, Math.round(height * 0.48))}
              y={-Math.round(height * 0.32)}
              fill={textColor}
              fontFamily='"Plus Jakarta Sans", "PingFang SC", sans-serif'
              fontSize={Math.max(10, Math.round(height * 0.22))}
              fontStyle="bold"
              listening={false}
            />
            <Text
              text={location || '52°13\'14"N 124°41\'31"W'}
              x={Math.max(26, Math.round(height * 0.48))}
              y={Math.round(height * 0.04)}
              fill={subTextColor}
              fontFamily='"JetBrains Mono", monospace'
              fontSize={Math.max(8, Math.round(height * 0.18))}
              listening={false}
            />
          </Group>
        </Group>
      )}

      {/* 2. Hasselblad Watermark Style */}
      {!isLegacy && watermarkStyle === 'hasselblad' && (
        <Group>
          <Text
            text={device || 'OPPO Find X6 Pro'}
            x={Math.max(16, width * 0.03)}
            y={height * 0.28}
            fill={textColor}
            fontFamily='"Plus Jakarta Sans", "PingFang SC", sans-serif'
            fontSize={Math.max(14, Math.round(height * 0.36))}
            fontStyle="bold"
            listening={false}
          />

          <Group x={width - Math.max(170, width * 0.34)} y={height * 0.2}>
            <Text
              text="HASSELBLAD"
              x={0}
              y={0}
              fill={textColor}
              fontFamily="serif"
              fontStyle="italic bold"
              letterSpacing={2}
              fontSize={Math.max(11, Math.round(height * 0.26))}
              listening={false}
            />
            <Circle
              x={6}
              y={Math.round(height * 0.44)}
              radius={Math.max(3, Math.round(height * 0.07))}
              fill="#E65A28"
              listening={false}
            />
            <Text
              text={params || '144mm f/2.6 1/1108 ISO100'}
              x={16}
              y={Math.round(height * 0.35)}
              fill={subTextColor}
              fontFamily='"Plus Jakarta Sans", sans-serif'
              fontSize={Math.max(9, Math.round(height * 0.19))}
              listening={false}
            />
          </Group>
        </Group>
      )}

      {/* 3. Zeiss Watermark Style */}
      {!isLegacy && watermarkStyle === 'zeiss' && (
        <Group>
          <Text
            text={device || 'vivo X100 Ultra'}
            x={Math.max(16, width * 0.03)}
            y={height * 0.18}
            fill={textColor}
            fontFamily='"Plus Jakarta Sans", "PingFang SC", sans-serif'
            fontSize={Math.max(12, Math.round(height * 0.28))}
            fontStyle="bold"
            listening={false}
          />
          <Text
            text={dateTime || '2026.10.19 16:42'}
            x={Math.max(16, width * 0.03)}
            y={height * 0.54}
            fill={subTextColor}
            fontFamily='"JetBrains Mono", monospace'
            fontSize={Math.max(9, Math.round(height * 0.20))}
            listening={false}
          />

          <Group x={width - Math.max(190, width * 0.38)} y={height * 0.25}>
            <Rect
              x={0}
              y={0}
              width={Math.round(height * 0.65)}
              height={Math.round(height * 0.45)}
              fill="#002D72"
              cornerRadius={2}
              listening={false}
            />
            <Text
              text="ZEISS"
              x={2}
              y={Math.round(height * 0.10)}
              width={Math.round(height * 0.61)}
              align="center"
              fill="#FFFFFF"
              fontFamily="sans-serif"
              fontStyle="bold"
              fontSize={Math.max(9, Math.round(height * 0.20))}
              listening={false}
            />
            <Text
              text="T*"
              x={Math.round(height * 0.72)}
              y={Math.round(height * 0.08)}
              fill="#E4002B"
              fontFamily="sans-serif"
              fontStyle="bold"
              fontSize={Math.max(9, Math.round(height * 0.22))}
              listening={false}
            />
            <Text
              text={params || '85mm f/2.57 1/250 ISO125'}
              x={Math.round(height * 1.05)}
              y={Math.round(height * 0.09)}
              fill={textColor}
              fontFamily='"Plus Jakarta Sans", sans-serif'
              fontSize={Math.max(10, Math.round(height * 0.22))}
              fontStyle="bold"
              listening={false}
            />
          </Group>
        </Group>
      )}

      {/* 4. Apple Shot on iPhone Style */}
      {!isLegacy && watermarkStyle === 'iphone' && (
        <Group>
          <Text
            text={` Shot on ${device || 'iPhone 16 Pro'}`}
            x={Math.max(16, width * 0.03)}
            y={height * 0.3}
            fill={textColor}
            fontFamily='"Plus Jakarta Sans", -apple-system, sans-serif'
            fontSize={Math.max(12, Math.round(height * 0.30))}
            fontStyle="bold"
            listening={false}
          />
          <Group x={width - Math.max(170, width * 0.34)} y={height * 0.2}>
            <Text
              text={params || '24mm • f/1.78 • 1/120s • ISO64'}
              x={0}
              y={0}
              fill={textColor}
              fontFamily='"Plus Jakarta Sans", sans-serif'
              fontSize={Math.max(9, Math.round(height * 0.22))}
              listening={false}
            />
            <Text
              text={dateTime || '2026.10.19'}
              x={0}
              y={height * 0.35}
              fill={subTextColor}
              fontFamily='"JetBrains Mono", monospace'
              fontSize={Math.max(8, Math.round(height * 0.18))}
              listening={false}
            />
          </Group>
        </Group>
      )}

      {/* 5. Fujifilm Simulation Style */}
      {!isLegacy && watermarkStyle === 'fuji' && (
        <Group>
          <Text
            text={`FUJIFILM · ${device || 'X-T5'}`}
            x={Math.max(16, width * 0.03)}
            y={height * 0.18}
            fill={textColor}
            fontFamily='"Plus Jakarta Sans", sans-serif'
            fontSize={Math.max(12, Math.round(height * 0.28))}
            fontStyle="bold"
            listening={false}
          />
          <Text
            text={location || 'CLASSIC CHROME • FILM SIMULATION'}
            x={Math.max(16, width * 0.03)}
            y={height * 0.54}
            fill={subTextColor}
            fontFamily='"Plus Jakarta Sans", sans-serif'
            letterSpacing={1.2}
            fontSize={Math.max(8, Math.round(height * 0.17))}
            listening={false}
          />
          <Group x={width - Math.max(170, width * 0.34)} y={height * 0.2}>
            <Text
              text={params || '35mm f/1.4 1/500 ISO160'}
              x={0}
              y={0}
              fill={textColor}
              fontFamily='"Plus Jakarta Sans", sans-serif'
              fontSize={Math.max(9, Math.round(height * 0.22))}
              fontStyle="bold"
              listening={false}
            />
            <Text
              text={dateTime || '2026.10.19'}
              x={0}
              y={height * 0.35}
              fill={subTextColor}
              fontFamily='"JetBrains Mono", monospace'
              fontSize={Math.max(8, Math.round(height * 0.18))}
              listening={false}
            />
          </Group>
        </Group>
      )}

      {/* 6. Vintage Film Golden LCD Date Stamp */}
      {!isLegacy && watermarkStyle === 'film-date' && (
        <Group>
          <Text
            text={dateTime ? dateTime.replace(/-/g, ' ').slice(0, 10) : "'26 10 19"}
            x={width * 0.05}
            y={height * 0.22}
            width={width * 0.9}
            align="right"
            fill="#FF8A00"
            fontFamily='"JetBrains Mono", monospace'
            fontSize={Math.max(14, Math.round(height * 0.50))}
            fontStyle="bold"
            letterSpacing={4}
            shadowColor="#FF8A00"
            shadowBlur={6}
            shadowOpacity={0.7}
            listening={false}
          />
        </Group>
      )}

      {/* Legacy Stickers Fallback */}
      {isLegacy && stickerType === 'washi-tape' && (
        <Group>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={color || '#E8DEC8'}
            opacity={0.8}
            shadowColor="#000000"
            shadowBlur={6}
            shadowOpacity={0.12}
            shadowOffsetY={2}
          />
          <Line
            points={[4, height / 2, width - 4, height / 2]}
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth={1}
            dash={[4, 6]}
          />
        </Group>
      )}

      {isLegacy && stickerType === 'archival-tag' && (
        <Group>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill={color || '#1A1918'}
            stroke={accentColor || '#E5C49F'}
            strokeWidth={1}
            cornerRadius={2}
            shadowColor="#000000"
            shadowBlur={10}
            shadowOpacity={0.2}
          />
          <Text
            text={label || 'ARCHIVE № 2026'}
            x={8}
            y={height / 2 - 6}
            width={width - 16}
            align="center"
            fill={accentColor || '#E5C49F'}
            fontFamily="JetBrains Mono, monospace"
            fontSize={Math.max(9, Math.min(13, height * 0.35))}
            letterSpacing={1.5}
          />
        </Group>
      )}

      {isLegacy && stickerType === 'date-stamp' && (
        <Group>
          <Rect
            x={0}
            y={0}
            width={width}
            height={height}
            stroke={color || '#B85444'}
            strokeWidth={1.5}
            cornerRadius={4}
            dash={[6, 3]}
          />
          <Text
            text={label || '2026.08 • MARGINLAB'}
            x={6}
            y={height / 2 - 6}
            width={width - 12}
            align="center"
            fill={color || '#B85444'}
            fontFamily="Space Grotesk, sans-serif"
            fontSize={Math.max(10, Math.min(14, height * 0.35))}
            fontStyle="bold"
            letterSpacing={1}
          />
        </Group>
      )}

      {isLegacy && stickerType === 'grid-cross' && (
        <Group>
          <Line points={[width / 2, 0, width / 2, height]} stroke={color || '#8E8E9A'} strokeWidth={1} />
          <Line points={[0, height / 2, width, height / 2]} stroke={color || '#8E8E9A'} strokeWidth={1} />
        </Group>
      )}

      {isLegacy && stickerType === 'film-strip' && (
        <Group>
          <Rect x={0} y={0} width={width} height={height} fill="#111113" cornerRadius={2} />
          {Array.from({ length: Math.floor(width / 24) }).map((_, i) => (
            <React.Fragment key={i}>
              <Rect x={8 + i * 24} y={4} width={10} height={6} fill="#FAF8F5" cornerRadius={1} />
              <Rect x={8 + i * 24} y={height - 10} width={10} height={6} fill="#FAF8F5" cornerRadius={1} />
            </React.Fragment>
          ))}
          <Text
            text={label || 'ISO 400 • 35MM'}
            x={10}
            y={height / 2 - 5}
            width={width - 20}
            align="center"
            fill="#E5C49F"
            fontFamily="JetBrains Mono, monospace"
            fontSize={10}
            letterSpacing={2}
          />
        </Group>
      )}
    </Group>
  );
};
