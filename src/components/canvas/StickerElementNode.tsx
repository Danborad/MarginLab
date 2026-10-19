import React from 'react';
import { Group, Rect, Text, Line, Circle } from 'react-konva';
import Konva from 'konva';
import { StickerElement, WatermarkStyle } from '../../types/document';

let measureCanvas: HTMLCanvasElement | null = null;
let measureCtx: CanvasRenderingContext2D | null = null;

function measureTextWidth(text: string, font: string): number {
  if (!text) return 0;
  if (typeof document === 'undefined') return text.length * 8;
  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas');
    measureCtx = measureCanvas.getContext('2d');
  }
  if (measureCtx) {
    measureCtx.font = font;
    return measureCtx.measureText(text).width;
  }
  return text.length * 8;
}

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
    showDevice = true,
    showDateTime = true,
    showParams = true,
    showLocation = watermarkStyle === 'leica' || watermarkStyle === 'fuji',
    showBrandLogo = true,
    paddingX = 0,
  } = element;

  const isDarkBg = bgTheme === 'dark';
  const isTransparent = bgTheme === 'transparent';

  const textColor = isDarkBg ? '#F4F4F5' : '#18181B';
  const subTextColor = isDarkBg ? '#A1A1AA' : '#71717A';

  const isLegacy =
    stickerType !== 'camera-watermark' &&
    ['washi-tape', 'archival-tag', 'date-stamp', 'film-strip', 'grid-cross'].includes(stickerType || '');

  const leftX = Math.max(0, paddingX);
  const rightMargin = width - Math.max(0, paddingX);

  const handleDblClick = () => {
    window.dispatchEvent(
      new CustomEvent('open-watermark-modal', {
        detail: { elementId: element.id },
      })
    );
  };

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
      onDblClick={handleDblClick}
      onDblTap={handleDblClick}
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
      {/* Camera Watermark Background & Hit-Testing Container */}
      {!isLegacy && (
        <Rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={isTransparent ? 'rgba(0,0,0,0.001)' : isDarkBg ? '#121214' : '#FFFFFF'}
          cornerRadius={isTransparent ? 0 : 4}
          shadowColor="#000000"
          shadowBlur={isTransparent ? 0 : isDarkBg ? 12 : 6}
          shadowOpacity={isTransparent ? 0 : isDarkBg ? 0.25 : 0.08}
          shadowOffsetY={isTransparent ? 0 : 2}
          listening={true}
        />
      )}

      {/* 1. Leica Watermark Style */}
      {!isLegacy && watermarkStyle === 'leica' && (() => {
        const hasLeftBoth = showDevice && showDateTime;
        const yDev = hasLeftBoth ? height * 0.18 : height * 0.34;
        const yDate = hasLeftBoth ? height * 0.54 : height * 0.38;

        const hasP = showParams && !!params;
        const hasL = showLocation && !!location;
        const fontP = `bold ${Math.max(10, Math.round(height * 0.22))}px "Plus Jakarta Sans", "PingFang SC", sans-serif`;
        const fontL = `${Math.max(8, Math.round(height * 0.18))}px "JetBrains Mono", monospace`;
        const wP = hasP ? measureTextWidth(params, fontP) : 0;
        const wL = hasL ? measureTextWidth(location, fontL) : 0;
        const textWidth = Math.max(wP, wL);

        const dotRadius = Math.max(10, Math.round(height * 0.26));
        const textStartX = rightMargin - textWidth;
        const hasRightText = hasP || hasL;
        const sepX = textStartX - Math.max(12, Math.round(height * 0.18));
        const dotX = hasRightText
          ? sepX - Math.max(12, Math.round(height * 0.18)) - dotRadius
          : rightMargin - dotRadius;

        return (
          <Group listening={false}>
            {/* Left Block */}
            {showDevice && (
              <Text
                text={device || 'iPhone 13 Pro'}
                x={leftX}
                y={yDev}
                fill={textColor}
                fontFamily='"Plus Jakarta Sans", "PingFang SC", sans-serif'
                fontSize={Math.max(12, Math.round(height * 0.28))}
                fontStyle="bold"
                listening={false}
              />
            )}
            {showDateTime && (
              <Text
                text={dateTime || '2026.10.19 17:27:50'}
                x={leftX}
                y={yDate}
                fill={subTextColor}
                fontFamily='"JetBrains Mono", monospace'
                fontSize={Math.max(9, Math.round(height * 0.20))}
                listening={false}
              />
            )}

            {/* Right Block */}
            {showBrandLogo && (
              <Group x={dotX} y={height * 0.5}>
                <Circle
                  x={0}
                  y={0}
                  radius={dotRadius}
                  fill="#E4002B"
                  listening={false}
                />
                <Text
                  text="Leica"
                  x={-dotRadius}
                  y={-Math.round(height * 0.14)}
                  width={dotRadius * 2}
                  align="center"
                  fill="#FFFFFF"
                  fontFamily="serif"
                  fontStyle="italic bold"
                  fontSize={Math.max(9, Math.round(height * 0.20))}
                  listening={false}
                />
              </Group>
            )}

            {showBrandLogo && hasRightText && (
              <Line
                points={[
                  sepX,
                  height * 0.22,
                  sepX,
                  height * 0.78,
                ]}
                stroke={subTextColor}
                strokeWidth={1}
                opacity={0.35}
                listening={false}
              />
            )}

            {hasP && (
              <Text
                text={params}
                x={hasL ? textStartX : rightMargin - wP}
                y={hasL ? height * 0.18 : height * 0.36}
                fill={textColor}
                fontFamily='"Plus Jakarta Sans", "PingFang SC", sans-serif'
                fontSize={Math.max(10, Math.round(height * 0.22))}
                fontStyle="bold"
                listening={false}
              />
            )}
            {hasL && (
              <Text
                text={location}
                x={textStartX}
                y={hasP ? height * 0.54 : height * 0.38}
                fill={subTextColor}
                fontFamily='"JetBrains Mono", monospace'
                fontSize={Math.max(8, Math.round(height * 0.18))}
                listening={false}
              />
            )}
          </Group>
        );
      })()}

      {/* 2. Hasselblad Watermark Style */}
      {!isLegacy && watermarkStyle === 'hasselblad' && (() => {
        const hasLeftBoth = showDevice && showDateTime;
        const yDev = hasLeftBoth ? height * 0.18 : height * 0.34;
        const yDate = hasLeftBoth ? height * 0.56 : height * 0.38;

        const hasP = showParams && !!params;
        const fontH = `italic bold ${Math.max(11, Math.round(height * 0.26))}px serif`;
        const fontP = `${Math.max(9, Math.round(height * 0.19))}px "Plus Jakarta Sans", sans-serif`;
        const wH = showBrandLogo ? measureTextWidth('HASSELBLAD', fontH) : 0;
        const wP = hasP ? measureTextWidth(params, fontP) : 0;

        const hX = rightMargin - wH;
        const pX = rightMargin - wP;

        return (
          <Group listening={false}>
            {/* Left Block */}
            {showDevice && (
              <Text
                text={device || 'OPPO Find X6 Pro'}
                x={leftX}
                y={yDev}
                fill={textColor}
                fontFamily='"Plus Jakarta Sans", "PingFang SC", sans-serif'
                fontSize={Math.max(13, Math.round(height * 0.34))}
                fontStyle="bold"
                listening={false}
              />
            )}
            {showDateTime && (
              <Text
                text={dateTime || '2026.10.19'}
                x={leftX}
                y={yDate}
                fill={subTextColor}
                fontFamily='"JetBrains Mono", monospace'
                fontSize={Math.max(9, Math.round(height * 0.19))}
                listening={false}
              />
            )}

            {/* Right Block */}
            {showBrandLogo && (
              <Text
                text="HASSELBLAD"
                x={hX}
                y={hasP ? height * 0.18 : height * 0.34}
                fill={textColor}
                fontFamily="serif"
                fontStyle="italic bold"
                letterSpacing={1.5}
                fontSize={Math.max(11, Math.round(height * 0.26))}
                listening={false}
              />
            )}

            {hasP && (
              <Group>
                <Circle
                  x={pX - 10}
                  y={showBrandLogo ? height * 0.65 : height * 0.5}
                  radius={Math.max(3, Math.round(height * 0.07))}
                  fill="#E65A28"
                  listening={false}
                />
                <Text
                  text={params}
                  x={pX}
                  y={showBrandLogo ? height * 0.54 : height * 0.38}
                  fill={subTextColor}
                  fontFamily='"Plus Jakarta Sans", sans-serif'
                  fontSize={Math.max(9, Math.round(height * 0.19))}
                  listening={false}
                />
              </Group>
            )}
          </Group>
        );
      })()}

      {/* 3. Zeiss Watermark Style */}
      {!isLegacy && watermarkStyle === 'zeiss' && (() => {
        const hasLeftBoth = showDevice && showDateTime;
        const yDev = hasLeftBoth ? height * 0.18 : height * 0.34;
        const yDate = hasLeftBoth ? height * 0.54 : height * 0.38;

        const hasP = showParams && !!params;
        const fontP = `bold ${Math.max(10, Math.round(height * 0.22))}px "Plus Jakarta Sans", sans-serif`;
        const wP = hasP ? measureTextWidth(params, fontP) : 0;
        const paramsX = rightMargin - wP;

        const boxW = Math.round(height * 0.65);
        const boxH = Math.round(height * 0.45);
        const tStarW = 20;
        const badgeEndX = hasP ? paramsX - 12 : rightMargin;
        const tStarX = badgeEndX - tStarW;
        const boxX = tStarX - 4 - boxW;

        return (
          <Group listening={false}>
            {/* Left Block */}
            {showDevice && (
              <Text
                text={device || 'vivo X100 Ultra'}
                x={leftX}
                y={yDev}
                fill={textColor}
                fontFamily='"Plus Jakarta Sans", "PingFang SC", sans-serif'
                fontSize={Math.max(12, Math.round(height * 0.28))}
                fontStyle="bold"
                listening={false}
              />
            )}
            {showDateTime && (
              <Text
                text={dateTime || '2026.10.19 16:42'}
                x={leftX}
                y={yDate}
                fill={subTextColor}
                fontFamily='"JetBrains Mono", monospace'
                fontSize={Math.max(9, Math.round(height * 0.20))}
                listening={false}
              />
            )}

            {/* Right Block */}
            {showBrandLogo && (
              <Group>
                <Rect
                  x={boxX}
                  y={height * 0.26}
                  width={boxW}
                  height={boxH}
                  fill="#002D72"
                  cornerRadius={2}
                  listening={false}
                />
                <Text
                  text="ZEISS"
                  x={boxX}
                  y={height * 0.36}
                  width={boxW}
                  align="center"
                  fill="#FFFFFF"
                  fontFamily="sans-serif"
                  fontStyle="bold"
                  fontSize={Math.max(9, Math.round(height * 0.20))}
                  listening={false}
                />
                <Text
                  text="T*"
                  x={tStarX}
                  y={height * 0.34}
                  fill="#E4002B"
                  fontFamily="sans-serif"
                  fontStyle="bold"
                  fontSize={Math.max(10, Math.round(height * 0.22))}
                  listening={false}
                />
              </Group>
            )}

            {hasP && (
              <Text
                text={params}
                x={paramsX}
                y={height * 0.36}
                fill={textColor}
                fontFamily='"Plus Jakarta Sans", sans-serif'
                fontSize={Math.max(10, Math.round(height * 0.22))}
                fontStyle="bold"
                listening={false}
              />
            )}
          </Group>
        );
      })()}

      {/* 4. Apple Shot on iPhone Style */}
      {!isLegacy && watermarkStyle === 'iphone' && (() => {
        const hasP = showParams && !!params;
        const hasD = showDateTime && !!dateTime;
        const fontP = `${Math.max(9, Math.round(height * 0.22))}px "Plus Jakarta Sans", sans-serif`;
        const fontD = `${Math.max(8, Math.round(height * 0.18))}px "JetBrains Mono", monospace`;
        const wP = hasP ? measureTextWidth(params, fontP) : 0;
        const wD = hasD ? measureTextWidth(dateTime, fontD) : 0;

        const textTitle = showBrandLogo
          ? ` Shot on ${device || 'iPhone 16 Pro'}`
          : `Shot on ${device || 'iPhone 16 Pro'}`;

        return (
          <Group listening={false}>
            {showDevice && (
              <Text
                text={textTitle}
                x={leftX}
                y={height * 0.32}
                fill={textColor}
                fontFamily='"Plus Jakarta Sans", -apple-system, sans-serif'
                fontSize={Math.max(12, Math.round(height * 0.30))}
                fontStyle="bold"
                listening={false}
              />
            )}

            {hasP && (
              <Text
                text={params}
                x={rightMargin - wP}
                y={hasD ? height * 0.18 : height * 0.36}
                fill={textColor}
                fontFamily='"Plus Jakarta Sans", sans-serif'
                fontSize={Math.max(9, Math.round(height * 0.22))}
                listening={false}
              />
            )}
            {hasD && (
              <Text
                text={dateTime}
                x={rightMargin - wD}
                y={hasP ? height * 0.54 : height * 0.38}
                fill={subTextColor}
                fontFamily='"JetBrains Mono", monospace'
                fontSize={Math.max(8, Math.round(height * 0.18))}
                listening={false}
              />
            )}
          </Group>
        );
      })()}

      {/* 5. Fujifilm Simulation Style */}
      {!isLegacy && watermarkStyle === 'fuji' && (() => {
        const hasLeftBoth = showDevice && (showLocation && !!location);
        const yDev = hasLeftBoth ? height * 0.18 : height * 0.34;
        const yLoc = hasLeftBoth ? height * 0.54 : height * 0.38;

        const hasP = showParams && !!params;
        const hasD = showDateTime && !!dateTime;
        const fontP = `bold ${Math.max(9, Math.round(height * 0.22))}px "Plus Jakarta Sans", sans-serif`;
        const fontD = `${Math.max(8, Math.round(height * 0.18))}px "JetBrains Mono", monospace`;
        const wP = hasP ? measureTextWidth(params, fontP) : 0;
        const wD = hasD ? measureTextWidth(dateTime, fontD) : 0;

        return (
          <Group listening={false}>
            {/* Left Block */}
            {showDevice && (
              <Text
                text={showBrandLogo ? `FUJIFILM · ${device || 'X-T5'}` : device || 'X-T5'}
                x={leftX}
                y={yDev}
                fill={textColor}
                fontFamily='"Plus Jakarta Sans", sans-serif'
                fontSize={Math.max(12, Math.round(height * 0.28))}
                fontStyle="bold"
                listening={false}
              />
            )}
            {showLocation && (
              <Text
                text={location || 'CLASSIC CHROME • FILM SIMULATION'}
                x={leftX}
                y={yLoc}
                fill={subTextColor}
                fontFamily='"Plus Jakarta Sans", sans-serif'
                letterSpacing={1.2}
                fontSize={Math.max(8, Math.round(height * 0.17))}
                listening={false}
              />
            )}

            {/* Right Block */}
            {hasP && (
              <Text
                text={params}
                x={rightMargin - wP}
                y={hasD ? height * 0.18 : height * 0.36}
                fill={textColor}
                fontFamily='"Plus Jakarta Sans", sans-serif'
                fontSize={Math.max(9, Math.round(height * 0.22))}
                fontStyle="bold"
                listening={false}
              />
            )}
            {hasD && (
              <Text
                text={dateTime}
                x={rightMargin - wD}
                y={hasP ? height * 0.54 : height * 0.38}
                fill={subTextColor}
                fontFamily='"JetBrains Mono", monospace'
                fontSize={Math.max(8, Math.round(height * 0.18))}
                listening={false}
              />
            )}
          </Group>
        );
      })()}

      {/* 6. Vintage Film Golden LCD Date Stamp */}
      {!isLegacy && watermarkStyle === 'film-date' && (() => {
        const dateStr = dateTime ? dateTime.replace(/-/g, ' ').slice(0, 10) : "'26 10 19";
        const fontDate = `bold ${Math.max(14, Math.round(height * 0.50))}px "JetBrains Mono", monospace`;
        const wDate = measureTextWidth(dateStr, fontDate);
        return (
          <Group listening={false}>
            <Text
              text={dateStr}
              x={rightMargin - wDate - 4}
              y={height * 0.22}
              fill="#FF8A00"
              fontFamily='"JetBrains Mono", monospace'
              fontSize={Math.max(14, Math.round(height * 0.50))}
              fontStyle="bold"
              letterSpacing={3}
              shadowColor="#FF8A00"
              shadowBlur={6}
              shadowOpacity={0.7}
              listening={false}
            />
          </Group>
        );
      })()}

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
