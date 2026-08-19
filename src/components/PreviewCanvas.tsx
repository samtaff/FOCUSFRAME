import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FrameSettings, GuideLine } from '../types';
import { Crosshair } from 'lucide-react';
import { Rulers } from './Rulers';
import { GuideLinesOverlay } from './GuideLinesOverlay';

interface PreviewCanvasProps {
  settings: FrameSettings;
  imageSrc: string;
  onUpdateFocus: (focus: Partial<FrameSettings['focus']>) => void;
  previewRef: React.RefObject<HTMLDivElement | null>;
  isExporting?: boolean;
  onDimensionsChange?: (dims: { width: number; height: number }) => void;
  zoom?: number;
  showRulers?: boolean;
  guides?: GuideLine[];
  onUpdateGuides?: (guides: GuideLine[]) => void;
}

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  settings,
  imageSrc,
  onUpdateFocus,
  previewRef,
  isExporting = false,
  onDimensionsChange,
  zoom = 1.0,
  showRulers = true,
  guides = [],
  onUpdateGuides,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const screenshotBoxRef = useRef<HTMLDivElement>(null);
  const [renderedDimensions, setRenderedDimensions] = useState<{ width: number; height: number }>({
    width: 204,
    height: 450,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<
    'move' | 'nw' | 'ne' | 'se' | 'sw' | 'e' | 'w' | 'n' | 's' | null
  >(null);
  const [dragStart, setDragStart] = useState<{
    mouseX: number;
    mouseY: number;
    startFocus: FrameSettings['focus'];
  } | null>(null);
  const [isSnappedX, setIsSnappedX] = useState(false);
  const [isSnappedY, setIsSnappedY] = useState(false);

  const { focus } = settings;

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
    action: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'e' | 'w' | 'n' | 's'
  ) => {
    if (!focus.enabled || isExporting) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    setDragAction(action);
    setDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      startFocus: { ...focus },
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
      const snapEnabled = focus.snapEnabled !== false;
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

        onUpdateFocus({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
        });
      } else if (dragAction === 'e') {
        // Right edge handle: expands/contracts symmetrically from center
        const startCenterX = startFocus.x + startFocus.width / 2;
        let newW = Math.max(2, startFocus.width + deltaXPercent * 2);
        if (snapEnabled && Math.abs(newW - 100) < snapTolXPct * 2) {
          newW = 100;
        }
        const newX = startCenterX - newW / 2;
        onUpdateFocus({
          x: Math.round(newX * 10) / 10,
          width: Math.max(2, Math.round(newW * 10) / 10),
        });
      } else if (dragAction === 'w') {
        // Left edge handle: expands/contracts symmetrically from center
        const startCenterX = startFocus.x + startFocus.width / 2;
        let newW = Math.max(2, startFocus.width - deltaXPercent * 2);
        if (snapEnabled && Math.abs(newW - 100) < snapTolXPct * 2) {
          newW = 100;
        }
        const newX = startCenterX - newW / 2;
        onUpdateFocus({
          x: Math.round(newX * 10) / 10,
          width: Math.max(2, Math.round(newW * 10) / 10),
        });
      } else if (dragAction === 's') {
        // Bottom edge handle: expands/contracts symmetrically from center
        const startCenterY = startFocus.y + startFocus.height / 2;
        let newH = Math.max(2, startFocus.height + deltaYPercent * 2);
        if (snapEnabled && Math.abs(newH - 100) < snapTolYPct * 2) {
          newH = 100;
        }
        const newY = startCenterY - newH / 2;
        onUpdateFocus({
          y: Math.round(newY * 10) / 10,
          height: Math.max(2, Math.round(newH * 10) / 10),
        });
      } else if (dragAction === 'n') {
        // Top edge handle: expands/contracts symmetrically from center
        const startCenterY = startFocus.y + startFocus.height / 2;
        let newH = Math.max(2, startFocus.height - deltaYPercent * 2);
        if (snapEnabled && Math.abs(newH - 100) < snapTolYPct * 2) {
          newH = 100;
        }
        const newY = startCenterY - newH / 2;
        onUpdateFocus({
          y: Math.round(newY * 10) / 10,
          height: Math.max(2, Math.round(newH * 10) / 10),
        });
      } else if (dragAction === 'se') {
        const startCenterX = startFocus.x + startFocus.width / 2;
        const startCenterY = startFocus.y + startFocus.height / 2;
        let newW = Math.max(2, startFocus.width + deltaXPercent * 2);
        let newH = Math.max(2, startFocus.height + deltaYPercent * 2);
        const newX = startCenterX - newW / 2;
        const newY = startCenterY - newH / 2;
        onUpdateFocus({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.max(2, Math.round(newW * 10) / 10),
          height: Math.max(2, Math.round(newH * 10) / 10),
        });
      } else if (dragAction === 'nw') {
        const startCenterX = startFocus.x + startFocus.width / 2;
        const startCenterY = startFocus.y + startFocus.height / 2;
        let newW = Math.max(2, startFocus.width - deltaXPercent * 2);
        let newH = Math.max(2, startFocus.height - deltaYPercent * 2);
        const newX = startCenterX - newW / 2;
        const newY = startCenterY - newH / 2;
        onUpdateFocus({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.max(2, Math.round(newW * 10) / 10),
          height: Math.max(2, Math.round(newH * 10) / 10),
        });
      } else if (dragAction === 'ne') {
        const startCenterX = startFocus.x + startFocus.width / 2;
        const startCenterY = startFocus.y + startFocus.height / 2;
        let newW = Math.max(2, startFocus.width + deltaXPercent * 2);
        let newH = Math.max(2, startFocus.height - deltaYPercent * 2);
        const newX = startCenterX - newW / 2;
        const newY = startCenterY - newH / 2;
        onUpdateFocus({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.max(2, Math.round(newW * 10) / 10),
          height: Math.max(2, Math.round(newH * 10) / 10),
        });
      } else if (dragAction === 'sw') {
        const startCenterX = startFocus.x + startFocus.width / 2;
        const startCenterY = startFocus.y + startFocus.height / 2;
        let newW = Math.max(2, startFocus.width - deltaXPercent * 2);
        let newH = Math.max(2, startFocus.height + deltaYPercent * 2);
        const newX = startCenterX - newW / 2;
        const newY = startCenterY - newH / 2;
        onUpdateFocus({
          x: Math.round(newX * 10) / 10,
          y: Math.round(newY * 10) / 10,
          width: Math.max(2, Math.round(newW * 10) / 10),
          height: Math.max(2, Math.round(newH * 10) / 10),
        });
      }
    },
    [isDragging, dragStart, dragAction, onUpdateFocus, focus.snapEnabled]
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

  // CSS clip-path for 100% opacity focus zone
  const clipInsetTop = focus.y;
  const clipInsetRight = 100 - (focus.x + focus.width);
  const clipInsetBottom = 100 - (focus.y + focus.height);
  const clipInsetLeft = focus.x;
  const clipPathStyle = focus.enabled
    ? `inset(${clipInsetTop}% ${clipInsetRight}% ${clipInsetBottom}% ${clipInsetLeft}% round ${focus.radius}px)`
    : 'none';

  // Exact pixel conversion for display and guidelines
  const curScreenW = renderedDimensions.width || 204;
  const curScreenH = renderedDimensions.height || 450;
  const focusXPx = Math.round((focus.x / 100) * curScreenW);
  const focusYPx = Math.round((focus.y / 100) * curScreenH);
  const focusWPx = Math.round((focus.width / 100) * curScreenW);
  const focusHPx = Math.round((focus.height / 100) * curScreenH);

  // Exact floating point coordinates for 0-offset SVG mask cutout and contour border stroke
  const exactFocusX = (focus.x / 100) * curScreenW;
  const exactFocusY = (focus.y / 100) * curScreenH;
  const exactFocusW = (focus.width / 100) * curScreenW;
  const exactFocusH = (focus.height / 100) * curScreenH;

  let exactRadius = 0;
  if (focus.shape === 'pill') {
    exactRadius = Math.min(exactFocusW, exactFocusH) / 2;
  } else if (focus.shape === 'rectangle') {
    exactRadius = 0;
  } else if (focus.shape === 'circle') {
    exactRadius = Math.min(exactFocusW, exactFocusH) / 2;
  } else {
    exactRadius = Math.min(focus.radius, exactFocusW / 2, exactFocusH / 2);
  }

  // Check centering alignments
  const isHorizontallyCentered = Math.abs((focus.x + focus.width / 2) - 50) < 0.6 || isSnappedX;
  const isVerticallyCentered = Math.abs((focus.y + focus.height / 2) - 50) < 0.6 || isSnappedY;

  // Handle dragging out a new guide from ruler
  const handleStartDragNewGuide = (orientation: 'horizontal' | 'vertical', e: React.PointerEvent) => {
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

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Zoomable Container with smooth transition */}
      <div
        id="preview-zoom-wrapper"
        className="transition-transform duration-150 flex items-center justify-center origin-top select-none"
        style={{
          transform: isExporting ? 'none' : `scale(${zoom})`,
          transformOrigin: 'top center',
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
              focusX={focusXPx}
              focusY={focusYPx}
              focusW={focusWPx}
              focusH={focusHPx}
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
                {/* Layer 1: Single Native Base Screenshot (100% crystal clear original quality with natural aspect ratio) */}
                <img
                  id="base-screenshot"
                  src={imageSrc}
                  alt="Capture d'écran importée"
                  className="w-full h-auto block select-none pointer-events-none object-contain"
                  style={{
                    borderRadius: `${settings.screenshotRadius}px`,
                    maxHeight: `${Math.max(100, 450 - settings.padding * 2)}px`,
                  }}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />

                {/* Layer 2: Seamless Dimming Veil with Cutout Mask (Clipped to screenshot radius) */}
                {settings.screenshotOpacity < 1 && (
                  <svg
                    id="focus-dimming-veil-svg"
                    className="absolute inset-0 w-full h-full pointer-events-none block overflow-visible z-10"
                    style={{ borderRadius: `${settings.screenshotRadius}px` }}
                    viewBox={`0 0 ${renderedDimensions.width || 204} ${renderedDimensions.height || 450}`}
                    preserveAspectRatio="none"
                  >
                    {focus.enabled ? (
                      <>
                        <defs>
                          <mask
                            id="focus-cutout-mask"
                            maskUnits="userSpaceOnUse"
                            x="-100"
                            y="-100"
                            width={(renderedDimensions.width || 204) + 200}
                            height={(renderedDimensions.height || 450) + 200}
                          >
                            {/* White covers everywhere with the dimming veil */}
                            <rect
                              x="-100"
                              y="-100"
                              width={(renderedDimensions.width || 204) + 200}
                              height={(renderedDimensions.height || 450) + 200}
                              fill="white"
                            />
                            {/* Black cutout creates a 100% clear window over the exact focus area shape */}
                            {focus.shape === 'circle' ? (
                              <ellipse
                                cx={exactFocusX + exactFocusW / 2}
                                cy={exactFocusY + exactFocusH / 2}
                                rx={Math.max(0.1, exactFocusW / 2)}
                                ry={Math.max(0.1, exactFocusH / 2)}
                                fill="black"
                              />
                            ) : (
                              <rect
                                x={exactFocusX}
                                y={exactFocusY}
                                width={Math.max(0.1, exactFocusW)}
                                height={Math.max(0.1, exactFocusH)}
                                rx={exactRadius}
                                ry={exactRadius}
                                fill="black"
                              />
                            )}
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

              {/* Layer 3: Focus Contour Border (Placed outside overflow-hidden so it can overflow/bleed beyond screenshot edges freely) */}
              {focus.enabled && focus.showBorder && (
                <svg
                  id="focus-contour-border-svg"
                  className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-20"
                  viewBox={`0 0 ${renderedDimensions.width || 204} ${renderedDimensions.height || 450}`}
                >
                  {focus.shape === 'circle' ? (
                    <ellipse
                      cx={exactFocusX + exactFocusW / 2}
                      cy={exactFocusY + exactFocusH / 2}
                      rx={Math.max(0.1, exactFocusW / 2)}
                      ry={Math.max(0.1, exactFocusH / 2)}
                      fill="none"
                      stroke={focus.borderColor || '#cc0000'}
                      strokeWidth={focus.borderWidth || 2}
                      strokeDasharray={focus.borderStyle === 'dashed' ? '4 4' : undefined}
                    />
                  ) : (
                    <rect
                      x={exactFocusX}
                      y={exactFocusY}
                      width={Math.max(0.1, exactFocusW)}
                      height={Math.max(0.1, exactFocusH)}
                      rx={exactRadius}
                      ry={exactRadius}
                      fill="none"
                      stroke={focus.borderColor || '#cc0000'}
                      strokeWidth={focus.borderWidth || 2}
                      strokeDasharray={focus.borderStyle === 'dashed' ? '4 4' : undefined}
                    />
                  )}
                </svg>
              )}

              {/* Visual Magnetic Guidelines (Shown when centered or snapped, subtle dashed line without text badges) */}
              {!isExporting && focus.enabled && (
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

              {/* Layer 3: Interactive Visual Focus Box (Hitbox and resize handles, perfectly aligned) */}
              {focus.enabled && (
                <div
                  id="interactive-focus-box"
                  className={`absolute z-20 group touch-none select-none box-border ${
                    isDragging ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                  style={{
                    left: `${focus.x}%`,
                    top: `${focus.y}%`,
                    width: `${focus.width}%`,
                    height: `${focus.height}%`,
                    borderRadius:
                      focus.shape === 'pill'
                        ? '9999px'
                        : focus.shape === 'circle'
                        ? '50%'
                        : focus.shape === 'rectangle'
                        ? '0px'
                        : `${focus.radius}px`,
                    border: !focus.showBorder && !isExporting ? '1px dashed rgba(204, 0, 0, 0.5)' : 'none',
                    boxShadow: 'none',
                  }}
                  tabIndex={0}
                  role="region"
                  aria-label="Zone de focus interactive (utilisez les flèches du clavier pour déplacer)"
                  onKeyDown={(e) => {
                    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
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

                      onUpdateFocus({
                        x: Math.round((focus.x + deltaX) * 1000) / 1000,
                        y: Math.round((focus.y + deltaY) * 1000) / 1000,
                      });
                    }
                  }}
                  onPointerDown={(e) => handlePointerDown(e, 'move')}
                >
                  {/* Subtle Inner Crosshair / Center Lines (Discreet & thin, non-exporting) */}
                  {!isExporting && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[inherit]">
                      {/* Horizontal center axis line */}
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0 border-t border-dashed border-slate-500/40 opacity-70" />
                      {/* Vertical center axis line */}
                      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0 border-l border-dashed border-slate-500/40 opacity-70" />
                      {/* Center intersection dot */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-slate-600/60 shadow-2xs" />
                    </div>
                  )}

                  {/* Resize Handles (Corners & Edges, discreet square without contour) */}
                  {!isExporting && focus.showHandles !== false && (
                    <>
                      {/* Corners */}
                      <div
                        id="handle-nw"
                        title="Redimensionner coin haut gauche"
                        className="absolute -top-0.5 -left-0.5 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-nwse-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                        onPointerDown={(e) => handlePointerDown(e, 'nw')}
                      />
                      <div
                        id="handle-ne"
                        title="Redimensionner coin haut droit"
                        className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-nesw-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                        onPointerDown={(e) => handlePointerDown(e, 'ne')}
                      />
                      <div
                        id="handle-sw"
                        title="Redimensionner coin bas gauche"
                        className="absolute -bottom-0.5 -left-0.5 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-nesw-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                        onPointerDown={(e) => handlePointerDown(e, 'sw')}
                      />
                      <div
                        id="handle-se"
                        title="Redimensionner coin bas droit"
                        className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-nwse-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                        onPointerDown={(e) => handlePointerDown(e, 'se')}
                      />

                      {/* Edges */}
                      <div
                        id="handle-e"
                        title="Étirer horizontalement"
                        className="absolute top-1/2 -right-0.5 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-ew-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                        onPointerDown={(e) => handlePointerDown(e, 'e')}
                      />
                      <div
                        id="handle-w"
                        title="Étirer horizontalement"
                        className="absolute top-1/2 -left-0.5 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-ew-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                        onPointerDown={(e) => handlePointerDown(e, 'w')}
                      />
                      <div
                        id="handle-n"
                        title="Étirer verticalement"
                        className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-ns-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                        onPointerDown={(e) => handlePointerDown(e, 'n')}
                      />
                      <div
                        id="handle-s"
                        title="Étirer verticalement"
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-none shadow-xs cursor-ns-resize z-30 opacity-80 group-hover:opacity-100 hover:!opacity-100 hover:scale-125 transition-transform touch-none after:content-[''] after:absolute after:-inset-2"
                        onPointerDown={(e) => handlePointerDown(e, 's')}
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info indicator under 240px preview matching theme */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-slate-400">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
        <span>
          Screen : <strong className="font-mono text-slate-600 font-semibold">{curScreenW} px × {curScreenH} px</strong>
          {' | '}Focus : <strong className="font-mono text-emerald-600 font-semibold">{focusWPx} px × {focusHPx} px</strong>
          {' | '}Format cible : <strong className="font-mono text-indigo-600 font-semibold">{settings.exportFormat === 'max_250x450' ? 'Max 250×450 px' : settings.exportFormat === 'height_490' ? 'H 490 px' : settings.exportFormat === 'height_800' ? 'H 800 px' : settings.exportFormat === 'height_1080' ? 'H 1080 px' : settings.exportFormat === 'custom' ? `H ${settings.exportCustomHeight} px` : 'Auto'}</strong>
        </span>
      </div>
    </div>
  );
};

