import React, { useState, useEffect, useCallback } from 'react';
import { GuideLine } from '../types';
import { X } from 'lucide-react';

interface GuideLinesOverlayProps {
  guides: GuideLine[];
  onUpdateGuides: (guides: GuideLine[]) => void;
  screenshotWidth: number;
  screenshotHeight: number;
  padding: number;
  isExporting?: boolean;
  zoom?: number;
}

export const GuideLinesOverlay: React.FC<GuideLinesOverlayProps> = ({
  guides,
  onUpdateGuides,
  screenshotWidth,
  screenshotHeight,
  padding,
  isExporting = false,
  zoom = 1.0,
}) => {
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [draggingGuide, setDraggingGuide] = useState<{
    id: string;
    orientation: 'horizontal' | 'vertical';
    startPos: number;
    startMouseX: number;
    startMouseY: number;
  } | null>(null);

  const totalW = screenshotWidth + padding * 2;
  const totalH = screenshotHeight + padding * 2;

  // Handle pointer down on an existing guideline
  const handleGuidePointerDown = (
    e: React.PointerEvent,
    guide: GuideLine
  ) => {
    if (isExporting) return;
    e.preventDefault();
    e.stopPropagation();

    setActiveGuideId(guide.id);
    setDraggingGuide({
      id: guide.id,
      orientation: guide.orientation,
      startPos: guide.position,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
    });
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingGuide) return;

      const deltaX = (e.clientX - draggingGuide.startMouseX) / zoom;
      const deltaY = (e.clientY - draggingGuide.startMouseY) / zoom;

      let newPos: number;
      if (draggingGuide.orientation === 'horizontal') {
        newPos = Math.round(draggingGuide.startPos + deltaY);
        // Snap to common landmarks (0, center, screenshot height)
        const snapThreshold = 4;
        if (Math.abs(newPos - 0) < snapThreshold) newPos = 0;
        else if (Math.abs(newPos - Math.round(screenshotHeight / 2)) < snapThreshold)
          newPos = Math.round(screenshotHeight / 2);
        else if (Math.abs(newPos - screenshotHeight) < snapThreshold)
          newPos = screenshotHeight;
      } else {
        newPos = Math.round(draggingGuide.startPos + deltaX);
        // Snap to common landmarks (0, center, screenshot width)
        const snapThreshold = 4;
        if (Math.abs(newPos - 0) < snapThreshold) newPos = 0;
        else if (Math.abs(newPos - Math.round(screenshotWidth / 2)) < snapThreshold)
          newPos = Math.round(screenshotWidth / 2);
        else if (Math.abs(newPos - screenshotWidth) < snapThreshold)
          newPos = screenshotWidth;
      }

      onUpdateGuides(
        guides.map((g) =>
          g.id === draggingGuide.id ? { ...g, position: newPos } : g
        )
      );
    },
    [draggingGuide, guides, onUpdateGuides, screenshotHeight, screenshotWidth, zoom]
  );

  const handlePointerUp = useCallback(() => {
    if (draggingGuide) {
      // If dragged way outside the frame (e.g. into the ruler or past 60px), remove the guide (Photoshop behavior)
      const current = guides.find((g) => g.id === draggingGuide.id);
      if (current) {
        const isOutOfBounds =
          current.orientation === 'horizontal'
            ? current.position < -padding - 20 || current.position > screenshotHeight + padding + 20
            : current.position < -padding - 20 || current.position > screenshotWidth + padding + 20;

        if (isOutOfBounds) {
          onUpdateGuides(guides.filter((g) => g.id !== draggingGuide.id));
        }
      }
      setDraggingGuide(null);
    }
  }, [draggingGuide, guides, onUpdateGuides, padding, screenshotHeight, screenshotWidth]);

  useEffect(() => {
    if (draggingGuide) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [draggingGuide, handlePointerMove, handlePointerUp]);

  const handleDeleteGuide = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateGuides(guides.filter((g) => g.id !== id));
  };

  if (isExporting || guides.length === 0) {
    return null;
  }

  return (
    <div
      id="guidelines-layer"
      className="absolute inset-0 pointer-events-none z-25 overflow-visible select-none"
    >
      {guides.map((guide) => {
        const isHorizontal = guide.orientation === 'horizontal';
        const isDraggingThis = draggingGuide?.id === guide.id;
        const posPx = isHorizontal
          ? padding + guide.position
          : padding + guide.position;

        return (
          <div
            key={guide.id}
            id={`guide-${guide.id}`}
            className={`absolute pointer-events-auto group ${
              isHorizontal
                ? 'left-0 right-0 h-3 -translate-y-1/2 cursor-row-resize'
                : 'top-0 bottom-0 w-3 -translate-x-1/2 cursor-col-resize'
            }`}
            style={
              isHorizontal
                ? { top: `${posPx}px` }
                : { left: `${posPx}px` }
            }
            onPointerDown={(e) => handleGuidePointerDown(e, guide)}
            onDoubleClick={(e) => handleDeleteGuide(guide.id, e)}
            title={`Repère ${isHorizontal ? 'horizontal' : 'vertical'} : ${guide.position} px (Double-clic pour supprimer)`}
          >
            {/* The Fine 1px hairline repère line (Photoshop / Illustrator Cyan #00ffff / #06b6d4) */}
            <div
              className={`absolute transition-colors ${
                isHorizontal
                  ? 'top-1/2 left-0 right-0 h-[1px] -translate-y-1/2'
                  : 'left-1/2 top-0 bottom-0 w-[1px] -translate-x-1/2'
              } ${
                isDraggingThis
                  ? 'bg-cyan-300 shadow-[0_0_4px_#22d3ee]'
                  : 'bg-cyan-400/90 group-hover:bg-cyan-300 group-hover:shadow-[0_0_3px_#22d3ee]'
              }`}
            />

            {/* Position Pill & Delete Button on Hover / Drag */}
            <div
              className={`absolute flex items-center gap-1 z-30 transition-all ${
                isHorizontal
                  ? 'top-[-18px] right-2 -translate-y-0'
                  : 'left-1 top-2'
              } ${
                isDraggingThis ? 'opacity-100 scale-105' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              <div className="bg-slate-900/95 text-cyan-300 text-[8.5px] font-mono px-1.5 py-0.5 rounded shadow-md border border-cyan-500/40 flex items-center gap-1">
                <span>
                  {isHorizontal ? `Y: ${guide.position}px` : `X: ${guide.position}px`}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDeleteGuide(guide.id, e)}
                  title="Supprimer ce repère"
                  className="text-slate-400 hover:text-rose-300 transition-colors p-0.5"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
