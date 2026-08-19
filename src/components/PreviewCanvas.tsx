import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FrameSettings, FocusRect, GuideLine } from '../types';
import { Rulers } from './Rulers';
import { GuideLinesOverlay } from './GuideLinesOverlay';

interface PreviewCanvasProps {
  settings: FrameSettings;
  imageSrc: string;
  onUpdateFocus: (focus: Partial<FocusRect>, targetIndex?: number) => void;
  onSelectActiveFocus?: (index: number) => void;
  previewRef: React.RefObject<HTMLDivElement | null>;
  isExporting?: boolean;
  onDimensionsChange?: (dims: { width: number; height: number }) => void;
  zoom?: number;
  pan?: { x: number; y: number };
  isSpacePressed?: boolean;
  isHandToolActive?: boolean;
  showRulers?: boolean;
  guides?: GuideLine[];
  onUpdateGuides?: (guides: GuideLine[]) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  settings,
  imageSrc,
  onUpdateFocus,
  onSelectActiveFocus,
  previewRef,
  isExporting = false,
  onDimensionsChange,
  zoom = 1.0,
  pan = { x: 0, y: 0 },
  isSpacePressed = false,
  isHandToolActive = false,
  showRulers = true,
  guides = [],
  onUpdateGuides,
}) => {
  const screenshotBoxRef = useRef<HTMLDivElement>(null);
  const [renderedDimensions, setRenderedDimensions] = useState<{ width: number; height: number }>({
    width: 204,
    height: 450,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<
    'move' | 'nw' | 'ne' | 'se' | 'sw' | 'e' | 'w' | 'n' | 's' | null
  >(null);
  const [dragFocusIndex, setDragFocusIndex] = useState<number>(0);
  const [dragStart, setDragStart] = useState<{
    mouseX: number;
    mouseY: number;
    startFocus: FocusRect;
  } | null>(null);
  const [isSnappedX, setIsSnappedX] = useState(false);
  const [isSnappedY, setIsSnappedY] = useState(false);

  // Normalize focuses array
  const allFocuses: FocusRect[] =
    settings.focuses && settings.focuses.length > 0
      ? settings.focuses
      : [settings.focus];

  const activeFocusIndex = Math.max(
    0,
    Math.min(allFocuses.length - 1, settings.activeFocusIndex ?? 0)
  );
  const activeFocus = allFocuses[activeFocusIndex] || allFocuses[0] || settings.focus;

  // Observe actual screenshot rendered dimensions with subpixel accuracy
  useEffect(() => {
    if (!screenshotBoxRef.current) return;
    const updateDims = () => {
      if (screenshotBoxRef.current) {
        const rect = screenshotBoxRef.current.getBoundingClientRect();
        const w = rect.width || screenshotBoxRef.current.clientWidth || 204;
        const h = rect.height || screenshotBoxRef.current.clientHeight || 450;
        setRenderedDimensions({ width: w, height: h });
        if (onDimensionsChange) {
          onDimensionsChange({ width: w, height: h });
        }
      }
    };

    updateDims();
    const observer = new ResizeObserver(updateDims);
    observer.observe(screenshotBoxRef.current);
    return () => observer.disconnect();
  }, [onDimensionsChange, imageSrc, settings.padding]);

  // Background style computation
  const getBackgroundStyle = () => {
    if (settings.bgType === 'transparent') {
      return { backgroundColor: 'transparent', backgroundImage: 'none' };
    }
    if (settings.bgType === 'solid') {
      return { backgroundColor: settings.bgColor, backgroundImage: 'none' };
    }
    if (settings.bgType === 'gradient') {
      return { backgroundImage: settings.bgGradient };
    }
    return {};
  };

  const getScreenshotShadowStyle = () => {
    if (settings.shadowSettings && settings.shadowSettings.enabled) {
      const { color, opacity, offsetX, offsetY, blur } = settings.shadowSettings;
      const hex = (color || '#000000').replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      return `${offsetX ?? 2}px ${offsetY ?? 3}px ${blur ?? 9}px rgba(${r}, ${g}, ${b}, ${opacity ?? 0.50})`;
    }
    if (settings.shadow === 'none') return 'none';
    return '2px 3px 9px rgba(0, 0, 0, 0.50)';
  };

  // Mouse & Touch handling for direct on-canvas drag & resize with magnetic snapping
  const handlePointerDown = (
    e: React.PointerEvent,
    action: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'e' | 'w' | 'n' | 's',
    focusIdx: number
  ) => {
    const targetFocus = allFocuses[focusIdx];
    if (!targetFocus || !targetFocus.enabled || isExporting) return;
    e.preventDefault();
    e.stopPropagation();

    if (focusIdx !== activeFocusIndex) {
      onSelectActiveFocus?.(focusIdx);
    }

    setIsDragging(true);
    setDragAction(action);
    setDragFocusIndex(focusIdx);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      startFocus: { ...targetFocus },
    });
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !dragStart || !dragAction || !screenshotBoxRef.current) return;

      const rect = screenshotBoxRef.current.getBoundingClientRect();
      const screenW = rect.width || 212;
      const screenH = rect.height || 430;
      const deltaXPercent = ((e.clientX - dragStart.mouseX) / screenW) * 100;
      const deltaYPercent = ((e.clientY - dragStart.mouseY) / screenH) * 100;

      const { startFocus } = dragStart;
      const snapEnabled = startFocus.snapEnabled !== false;
      const snapTolXPct = (6 / screenW) * 100; // ~6px threshold
      const snapTolYPct = (6 / screenH) * 100; // ~6px threshold

      if (dragAction === 'move') {
        let newX = startFocus.x + deltaXPercent;
        let newY = startFocus.y + deltaYPercent;

        let snappedX = false;
        let snappedY = false;

        if (snapEnabled) {
          // Snap horizontal center (50%)
          const centerX = newX + startFocus.width / 2;
          if (Math.abs(centerX - 50) < snapTolXPct) {
            newX = (100 - startFocus.width) / 2;
            snappedX = true;
          }

          // Snap vertical center (50%)
          const centerY = newY + startFocus.height / 2;
          if (Math.abs(centerY - 50) < snapTolYPct) {
            newY = (100 - startFocus.height) / 2;
            snappedY = true;
          }
        }

        setIsSnappedX(snappedX);
        setIsSnappedY(snappedY);

        onUpdateFocus(
          {
            x: Math.round(newX * 1000) / 1000,
            y: Math.round(newY * 1000) / 1000,
          },
          dragFocusIndex
        );
      } else if (dragAction === 'e') {
        // Right edge handle: expands/contracts symmetrically from center
        const startCenterX = startFocus.x + startFocus.width / 2;
        let newW = Math.max(2, startFocus.width + deltaXPercent * 2);
        if (snapEnabled && Math.abs(newW - 100) < snapTolXPct * 2) {
          newW = 100;
        }
        const newX = startCenterX - newW / 2;
        onUpdateFocus(
          {
            x: Math.round(newX * 1000) / 1000,
            width: Math.max(2, Math.round(newW * 1000) / 1000),
          },
          dragFocusIndex
        );
      } else if (dragAction === 'w') {
        // Left edge handle: expands/contracts symmetrically from center
        const startCenterX = startFocus.x + startFocus.width / 2;
        let newW = Math.max(2, startFocus.width - deltaXPercent * 2);
        if (snapEnabled && Math.abs(newW - 100) < snapTolXPct * 2) {
          newW = 100;
        }
        const newX = startCenterX - newW / 2;
        onUpdateFocus(
          {
            x: Math.round(newX * 1000) / 1000,
            width: Math.max(2, Math.round(newW * 1000) / 1000),
          },
          dragFocusIndex
        );
      } else if (dragAction === 's') {
        // Bottom edge handle: expands/contracts symmetrically from center
        const startCenterY = startFocus.y + startFocus.height / 2;
        let newH = Math.max(2, startFocus.height + deltaYPercent * 2);
        if (snapEnabled && Math.abs(newH - 100) < snapTolYPct * 2) {
          newH = 100;
        }
        const newY = startCenterY - newH / 2;
        onUpdateFocus(
          {
            y: Math.round(newY * 1000) / 1000,
            height: Math.max(2, Math.round(newH * 1000) / 1000),
          },
          dragFocusIndex
        );
      } else if (dragAction === 'n') {
        // Top edge handle: expands/contracts symmetrically from center
        const startCenterY = startFocus.y + startFocus.height / 2;
        let newH = Math.max(2, startFocus.height - deltaYPercent * 2);
        if (snapEnabled && Math.abs(newH - 100) < snapTolYPct * 2) {
          newH = 100;
        }
        const newY = startCenterY - newH / 2;
        onUpdateFocus(
          {
            y: Math.round(newY * 1000) / 1000,
            height: Math.max(2, Math.round(newH * 1000) / 1000),
          },
          dragFocusIndex
        );
      } else if (dragAction === 'se') {
        const startCenterX = startFocus.x + startFocus.width / 2;
        const startCenterY = startFocus.y + startFocus.height / 2;
        let newW = Math.max(2, startFocus.width + deltaXPercent * 2);
        let newH = Math.max(2, startFocus.height + deltaYPercent * 2);
        const newX = startCenterX - newW / 2;
        const newY = startCenterY - newH / 2;
        onUpdateFocus(
          {
            x: Math.round(newX * 1000) / 1000,
            y: Math.round(newY * 1000) / 1000,
            width: Math.max(2, Math.round(newW * 1000) / 1000),
            height: Math.max(2, Math.round(newH * 1000) / 1000),
          },
          dragFocusIndex
        );
      } else if (dragAction === 'nw') {
        const startCenterX = startFocus.x + startFocus.width / 2;
        const startCenterY = startFocus.y + startFocus.height / 2;
        let newW = Math.max(2, startFocus.width - deltaXPercent * 2);
        let newH = Math.max(2, startFocus.height - deltaYPercent * 2);
        const newX = startCenterX - newW / 2;
        const newY = startCenterY - newH / 2;
        onUpdateFocus(
          {
            x: Math.round(newX * 1000) / 1000,
            y: Math.round(newY * 1000) / 1000,
            width: Math.max(2, Math.round(newW * 1000) / 1000),
            height: Math.max(2, Math.round(newH * 1000) / 1000),
          },
          dragFocusIndex
        );
      } else if (dragAction === 'ne') {
        const startCenterX = startFocus.x + startFocus.width / 2;
        const startCenterY = startFocus.y + startFocus.height / 2;
        let newW = Math.max(2, startFocus.width + deltaXPercent * 2);
        let newH = Math.max(2, startFocus.height - deltaYPercent * 2);
        const newX = startCenterX - newW / 2;
        const newY = startCenterY - newH / 2;
        onUpdateFocus(
          {
            x: Math.round(newX * 1000) / 1000,
            y: Math.round(newY * 1000) / 1000,
            width: Math.max(2, Math.round(newW * 1000) / 1000),
            height: Math.max(2, Math.round(newH * 1000) / 1000),
          },
          dragFocusIndex
        );
      } else if (dragAction === 'sw') {
        const startCenterX = startFocus.x + startFocus.width / 2;
        const startCenterY = startFocus.y + startFocus.height / 2;
        let newW = Math.max(2, startFocus.width - deltaXPercent * 2);
        let newH = Math.max(2, startFocus.height + deltaYPercent * 2);
        const newX = startCenterX - newW / 2;
        const newY = startCenterY - newH / 2;
        onUpdateFocus(
          {
            x: Math.round(newX * 1000) / 1000,
            y: Math.round(newY * 1000) / 1000,
            width: Math.max(2, Math.round(newW * 1000) / 1000),
            height: Math.max(2, Math.round(newH * 1000) / 1000),
          },
          dragFocusIndex
        );
      }
    },
    [isDragging, dragStart, dragAction, dragFocusIndex, onUpdateFocus]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDragAction(null);
    setDragStart(null);
    setIsSnappedX(false);
    setIsSnappedY(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Exact pixel conversion for active focus
  const curScreenW = renderedDimensions.width || 204;
  const curScreenH = renderedDimensions.height || 450;
  const activeFocusXPx = Math.round((activeFocus.x / 100) * curScreenW);
  const activeFocusYPx = Math.round((activeFocus.y / 100) * curScreenH);
  const activeFocusWPx = Math.round((activeFocus.width / 100) * curScreenW);
  const activeFocusHPx = Math.round((activeFocus.height / 100) * curScreenH);

  // Check centering alignments for active focus
  const isHorizontallyCentered =
    Math.abs(activeFocus.x + activeFocus.width / 2 - 50) < 0.6 || isSnappedX;
  const isVerticallyCentered =
    Math.abs(activeFocus.y + activeFocus.height / 2 - 50) < 0.6 || isSnappedY;

  // Handle dragging out a new guide from ruler
  const handleStartDragNewGuide = (
    orientation: 'horizontal' | 'vertical',
    e: React.PointerEvent
  ) => {
    if (!onUpdateGuides || isExporting) return;
    e.preventDefault();
    e.stopPropagation();

    const newId = 'guide-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const initialPos = orientation === 'horizontal' ? 20 : 20;
    const newGuide: GuideLine = {
      id: newId,
      orientation,
      position: initialPos,
    };
    onUpdateGuides([...guides, newGuide]);
  };

  const hasAnyFocusEnabled = allFocuses.some((f) => f.enabled);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Zoomable & Pannable Container with smooth 60fps/120fps hardware transform */}
      <div
        id="preview-zoom-wrapper"
        className="transition-transform duration-75 flex items-center justify-center select-none"
        style={{
          transform: isExporting
            ? 'none'
            : `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Outer constraint wrapper: strictly max 240px wide with transparent checkboard preview */}
        <div
          id="preview-constraint-wrapper"
          className={`relative flex justify-center items-center select-none rounded-xl p-0.5 ${
            settings.bgType === 'transparent' ? 'bg-checkerboard shadow-inner' : ''
          }`}
          style={{ maxWidth: '240px' }}
        >
          {/* Ruler overlay on canvas */}
          {showRulers && !isExporting && (
            <Rulers
              screenshotWidth={curScreenW}
              screenshotHeight={curScreenH}
              padding={settings.padding}
              focusX={activeFocusXPx}
              focusY={activeFocusYPx}
              focusW={activeFocusWPx}
              focusH={activeFocusHPx}
              zoom={1.0}
              onStartDragNewGuide={handleStartDragNewGuide}
            />
          )}

          {/* Exportable Frame Container customizable (border radius, padding, background) - Global total height 450px max */}
          <div
            ref={previewRef}
            id="exportable-frame"
            className="relative w-full overflow-visible transition-all duration-150 flex flex-col items-center justify-center"
            style={{
              maxWidth: '240px',
              maxHeight: '450px',
              borderRadius: `${settings.borderRadius}px`,
              padding: `${settings.padding}px`,
              backgroundColor: settings.bgType === 'transparent' ? 'transparent' : undefined,
              ...getBackgroundStyle(),
            }}
          >
            {/* Photoshop/Illustrator style fine Guideline Repères */}
            {onUpdateGuides && !isExporting && (
              <GuideLinesOverlay
                guides={guides}
                onUpdateGuides={onUpdateGuides}
                screenshotWidth={curScreenW}
                screenshotHeight={curScreenH}
                padding={settings.padding}
                isExporting={isExporting}
                zoom={zoom}
              />
            )}

            {/* Screenshot container wrapper with shadow applied directly to the image/screenshot */}
            <div
              ref={screenshotBoxRef}
              id="screenshot-wrapper"
              className="relative w-full flex items-center justify-center bg-transparent transition-all duration-150"
              style={{
                borderRadius: `${settings.screenshotRadius}px`,
                maxHeight: `${Math.max(100, 450 - settings.padding * 2)}px`,
                boxShadow: getScreenshotShadowStyle(),
              }}
            >
              {/* Inner screenshot clipping wrapper with screenshot radius */}
              <div
                className="relative w-full overflow-hidden flex items-center justify-center bg-transparent"
                style={{
                  borderRadius: `${settings.screenshotRadius}px`,
                  maxHeight: `${Math.max(100, 450 - settings.padding * 2)}px`,
                }}
              >
                {/* Layer 1: Base Screenshot Image (Always crisp & intact, never split) */}
                <img
                  id="target-screenshot-img"
                  src={imageSrc}
                  alt="Capture d'écran originale"
                  className="w-full h-auto block select-none pointer-events-none object-contain"
                  style={{
                    maxHeight: `${Math.max(100, 450 - settings.padding * 2)}px`,
                  }}
                  crossOrigin="anonymous"
                  draggable={false}
                />

                {/* Layer 2: SVG Mask Dimming Overlay (Dimmable everywhere except cutout shapes) */}
                {settings.screenshotOpacity < 1.0 && (
                  <svg
                    id="focus-dimming-svg"
                    className="absolute inset-0 w-full h-full pointer-events-none z-10"
                    viewBox={`0 0 ${renderedDimensions.width || 204} ${renderedDimensions.height || 450}`}
                  >
                    {hasAnyFocusEnabled ? (
                      <>
                        <defs>
                          <mask id="focus-cutout-mask">
                            {/* White base = fully dimmed background */}
                            <rect
                              x="-100"
                              y="-100"
                              width={(renderedDimensions.width || 204) + 200}
                              height={(renderedDimensions.height || 450) + 200}
                              fill="white"
                            />
                            {/* Black cutout shapes for ALL active focus zones */}
                            {allFocuses.map((f, idx) => {
                              if (!f.enabled) return null;
                              const fExactX = (f.x / 100) * curScreenW;
                              const fExactY = (f.y / 100) * curScreenH;
                              const fExactW = (f.width / 100) * curScreenW;
                              const fExactH = (f.height / 100) * curScreenH;

                              let fRadius = 0;
                              if (f.shape === 'pill' || f.shape === 'circle') {
                                fRadius = Math.min(fExactW, fExactH) / 2;
                              } else if (f.shape === 'rectangle') {
                                fRadius = 0;
                              } else {
                                fRadius = Math.min(f.radius, fExactW / 2, fExactH / 2);
                              }

                              return f.shape === 'circle' ? (
                                <ellipse
                                  key={`cutout-${f.id || idx}`}
                                  cx={fExactX + fExactW / 2}
                                  cy={fExactY + fExactH / 2}
                                  rx={Math.max(0.1, fExactW / 2)}
                                  ry={Math.max(0.1, fExactH / 2)}
                                  fill="black"
                                />
                              ) : (
                                <rect
                                  key={`cutout-${f.id || idx}`}
                                  x={fExactX}
                                  y={fExactY}
                                  width={Math.max(0.1, fExactW)}
                                  height={Math.max(0.1, fExactH)}
                                  rx={fRadius}
                                  ry={fRadius}
                                  fill="black"
                                />
                              );
                            })}
                          </mask>
                        </defs>
                        <rect
                          x="-100"
                          y="-100"
                          width={(renderedDimensions.width || 204) + 200}
                          height={(renderedDimensions.height || 450) + 200}
                          fill={settings.dimmingType === 'light' ? '#ffffff' : '#000000'}
                          opacity={1 - settings.screenshotOpacity}
                          mask="url(#focus-cutout-mask)"
                        />
                      </>
                    ) : (
                      <rect
                        x="-100"
                        y="-100"
                        width={(renderedDimensions.width || 204) + 200}
                        height={(renderedDimensions.height || 450) + 200}
                        fill={settings.dimmingType === 'light' ? '#ffffff' : '#000000'}
                        opacity={1 - settings.screenshotOpacity}
                      />
                    )}
                  </svg>
                )}
              </div>

              {/* Layer 3: Focus Contour Borders for ALL enabled zones with showBorder */}
              <svg
                id="focus-contour-border-svg"
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-20"
                viewBox={`0 0 ${renderedDimensions.width || 204} ${renderedDimensions.height || 450}`}
              >
                {allFocuses.map((f, idx) => {
                  if (!f.enabled || !f.showBorder) return null;
                  const fExactX = (f.x / 100) * curScreenW;
                  const fExactY = (f.y / 100) * curScreenH;
                  const fExactW = (f.width / 100) * curScreenW;
                  const fExactH = (f.height / 100) * curScreenH;

                  let fRadius = 0;
                  if (f.shape === 'pill' || f.shape === 'circle') {
                    fRadius = Math.min(fExactW, fExactH) / 2;
                  } else if (f.shape === 'rectangle') {
                    fRadius = 0;
                  } else {
                    fRadius = Math.min(f.radius, fExactW / 2, fExactH / 2);
                  }

                  return f.shape === 'circle' ? (
                    <ellipse
                      key={`contour-border-${f.id || idx}`}
                      cx={fExactX + fExactW / 2}
                      cy={fExactY + fExactH / 2}
                      rx={Math.max(0.1, fExactW / 2)}
                      ry={Math.max(0.1, fExactH / 2)}
                      fill="none"
                      stroke={f.borderColor || '#cc0000'}
                      strokeWidth={f.borderWidth || 2}
                      strokeDasharray={f.borderStyle === 'dashed' ? '4 4' : undefined}
                    />
                  ) : (
                    <rect
                      key={`contour-border-${f.id || idx}`}
                      x={fExactX}
                      y={fExactY}
                      width={Math.max(0.1, fExactW)}
                      height={Math.max(0.1, fExactH)}
                      rx={fRadius}
                      ry={fRadius}
                      fill="none"
                      stroke={f.borderColor || '#cc0000'}
                      strokeWidth={f.borderWidth || 2}
                      strokeDasharray={f.borderStyle === 'dashed' ? '4 4' : undefined}
                    />
                  );
                })}
              </svg>

              {/* Visual Magnetic Guidelines (Shown when centered or snapped for active focus) */}
              {!isExporting && activeFocus.enabled && (
                <>
                  {/* Horizontal Center Guide (Vertical axis line at X = 50%) */}
                  {isHorizontallyCentered && (
                    <div
                      id="guide-line-center-x"
                      className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-l border-dashed border-blue-500/50 z-25 pointer-events-none"
                    />
                  )}

                  {/* Vertical Center Guide (Horizontal axis line at Y = 50%) */}
                  {isVerticallyCentered && (
                    <div
                      id="guide-line-center-y"
                      className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0 border-t border-dashed border-blue-500/50 z-25 pointer-events-none"
                    />
                  )}
                </>
              )}

              {/* Interactive Visual Focus Boxes for ALL enabled zones */}
              {allFocuses.map((f, idx) => {
                if (!f.enabled) return null;
                const isActive = idx === activeFocusIndex;

                return (
                  <div
                    key={`interactive-box-${f.id || idx}`}
                    id={`interactive-focus-box-${idx}`}
                    className={`absolute z-20 group touch-none select-none box-border ${
                      isSpacePressed || isHandToolActive
                        ? 'pointer-events-none'
                        : isActive && isDragging
                        ? 'cursor-grabbing'
                        : 'cursor-grab'
                    } ${
                      !isActive && !isExporting
                        ? 'hover:ring-1 hover:ring-blue-400/60'
                        : ''
                    }`}
                    style={{
                      left: `${f.x}%`,
                      top: `${f.y}%`,
                      width: `${f.width}%`,
                      height: `${f.height}%`,
                      borderRadius:
                        f.shape === 'pill'
                          ? '9999px'
                          : f.shape === 'circle'
                          ? '50%'
                          : f.shape === 'rectangle'
                          ? '0px'
                          : `${f.radius}px`,
                      border:
                        !f.showBorder && !isExporting
                          ? isActive
                            ? '1px dashed rgba(204, 0, 0, 0.6)'
                            : '1px dashed rgba(100, 116, 139, 0.4)'
                          : 'none',
                      boxShadow: 'none',
                    }}
                    tabIndex={0}
                    role="region"
                    aria-label={`Zone de focus ${f.name || idx + 1}`}
                    onKeyDown={(e) => {
                      if (
                        isActive &&
                        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)
                      ) {
                        e.preventDefault();
                        e.stopPropagation();
                        const stepPx = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
                        const stepXPct = (stepPx / curScreenW) * 100;
                        const stepYPct = (stepPx / curScreenH) * 100;

                        let deltaX = 0;
                        let deltaY = 0;
                        if (e.key === 'ArrowLeft') deltaX = -stepXPct;
                        if (e.key === 'ArrowRight') deltaX = stepXPct;
                        if (e.key === 'ArrowUp') deltaY = -stepYPct;
                        if (e.key === 'ArrowDown') deltaY = stepYPct;

                        onUpdateFocus(
                          {
                            x: Math.round((f.x + deltaX) * 1000) / 1000,
                            y: Math.round((f.y + deltaY) * 1000) / 1000,
                          },
                          idx
                        );
                      }
                    }}
                    onPointerDown={(e) => handlePointerDown(e, 'move', idx)}
                  >
                    {/* Subtle Inner Crosshair on active focus zone */}
                    {!isExporting && isActive && (
                      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0 border-t border-dashed border-slate-500/40 opacity-70" />
                        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-l border-dashed border-slate-500/40 opacity-70" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-slate-600/60 shadow-2xs" />
                      </div>
                    )}

                    {/* Resize Handles (Only for active focus) */}
                    {!isExporting && isActive && f.showHandles !== false && (
                      <>
                        {/* Corners */}
                        <div
                          id="handle-nw"
                          title="Redimensionner coin haut gauche"
                          className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-nwse-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                          onPointerDown={(e) => handlePointerDown(e, 'nw', idx)}
                        />
                        <div
                          id="handle-ne"
                          title="Redimensionner coin haut droit"
                          className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-nesw-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                          onPointerDown={(e) => handlePointerDown(e, 'ne', idx)}
                        />
                        <div
                          id="handle-sw"
                          title="Redimensionner coin bas gauche"
                          className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-nesw-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                          onPointerDown={(e) => handlePointerDown(e, 'sw', idx)}
                        />
                        <div
                          id="handle-se"
                          title="Redimensionner coin bas droit"
                          className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-nwse-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                          onPointerDown={(e) => handlePointerDown(e, 'se', idx)}
                        />

                        {/* Edges */}
                        <div
                          id="handle-e"
                          title="Étirer horizontalement"
                          className="absolute top-1/2 -right-0.5 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-ew-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                          onPointerDown={(e) => handlePointerDown(e, 'e', idx)}
                        />
                        <div
                          id="handle-w"
                          title="Étirer horizontalement"
                          className="absolute top-1/2 -left-0.5 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-ew-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                          onPointerDown={(e) => handlePointerDown(e, 'w', idx)}
                        />
                        <div
                          id="handle-n"
                          title="Étirer verticalement"
                          className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-ns-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                          onPointerDown={(e) => handlePointerDown(e, 'n', idx)}
                        />
                        <div
                          id="handle-s"
                          title="Étirer verticalement"
                          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-ns-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                          onPointerDown={(e) => handlePointerDown(e, 's', idx)}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Info indicator under preview matching theme */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
        <span>
          Screen : <strong className="font-mono text-slate-600 font-semibold">{curScreenW} px × {curScreenH} px</strong>
          {' | '}Focus ({activeFocus.name || `Zone ${activeFocusIndex + 1}`}) : <strong className="font-mono text-emerald-600 font-semibold">{activeFocusWPx} px × {activeFocusHPx} px</strong>
          {' | '}Zones : <strong className="font-mono text-blue-600 font-semibold">{allFocuses.filter(f => f.enabled).length}/{allFocuses.length} active(s)</strong>
        </span>
      </div>
    </div>
  );
};
