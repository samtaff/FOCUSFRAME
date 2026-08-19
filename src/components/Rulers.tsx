import React from 'react';

interface RulersProps {
  screenshotWidth: number; // width in px of the screenshot container
  screenshotHeight: number; // height in px of the screenshot container
  padding: number; // frame padding in px
  focusX: number; // in px relative to screenshot
  focusY: number; // in px relative to screenshot
  focusW: number; // in px relative to screenshot
  focusH: number; // in px relative to screenshot
  zoom?: number;
  onStartDragNewGuide?: (orientation: 'horizontal' | 'vertical', e: React.PointerEvent) => void;
}

export const Rulers: React.FC<RulersProps> = ({
  screenshotWidth,
  screenshotHeight,
  padding,
  focusX,
  focusY,
  focusW,
  focusH,
  onStartDragNewGuide,
}) => {
  // Total container dimensions including frame padding
  const totalW = screenshotWidth + padding * 2;
  const totalH = screenshotHeight + padding * 2;

  // Generate horizontal ticks across the full width
  const hTicks: { relPos: number; pxFromLeft: number; label?: string; isMajor: boolean; isMid: boolean }[] = [];
  const minX = -Math.ceil(padding / 10) * 10;
  const maxX = screenshotWidth + Math.ceil(padding / 10) * 10 + 10;

  for (let x = minX; x <= maxX; x += 10) {
    const pxFromLeft = padding + x;
    if (pxFromLeft >= 0 && pxFromLeft <= totalW) {
      const isMajor = x % 50 === 0;
      const isMid = !isMajor && x % 20 === 0;
      hTicks.push({
        relPos: x,
        pxFromLeft,
        label: isMajor ? `${x}` : undefined,
        isMajor,
        isMid,
      });
    }
  }

  // Generate vertical ticks across the full height
  const vTicks: { relPos: number; pxFromTop: number; label?: string; isMajor: boolean; isMid: boolean }[] = [];
  const minY = -Math.ceil(padding / 10) * 10;
  const maxY = screenshotHeight + Math.ceil(padding / 10) * 10 + 10;

  for (let y = minY; y <= maxY; y += 10) {
    const pxFromTop = padding + y;
    if (pxFromTop >= 0 && pxFromTop <= totalH) {
      const isMajor = y % 50 === 0;
      const isMid = !isMajor && y % 20 === 0;
      vTicks.push({
        relPos: y,
        pxFromTop,
        label: isMajor ? `${y}` : undefined,
        isMajor,
        isMid,
      });
    }
  }

  // Focus range in absolute container px
  const focusLeft = padding + focusX;
  const focusRight = focusLeft + focusW;
  const focusTop = padding + focusY;
  const focusBottom = focusTop + focusH;

  return (
    <div
      id="canvas-rulers"
      className="absolute inset-0 pointer-events-none z-30 select-none overflow-visible"
    >
      {/* ================= TOP HORIZONTAL GRADUATIONS ================= */}
      <div
        id="ruler-horizontal"
        className="absolute -top-5 left-0 right-0 h-5 pointer-events-auto cursor-row-resize group"
        onPointerDown={(e) => onStartDragNewGuide?.('horizontal', e)}
        title="Graduations horizontales (Glissez vers le bas pour créer un repère)"
      >
        {/* Subtle baseline */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-slate-400/25 group-hover:bg-blue-400/50 transition-colors" />

        {/* Highlighted active focus span indicator on top ruler */}
        {focusW > 0 && (
          <div
            className="absolute bottom-0 h-[2px] bg-blue-500/80 pointer-events-none rounded-full transition-all"
            style={{
              left: `${Math.max(0, focusLeft)}px`,
              width: `${Math.max(2, focusRight - focusLeft)}px`,
            }}
          />
        )}

        {/* Minimalist Graduation Ticks */}
        {hTicks.map((t) => (
          <div
            key={`htick-${t.relPos}`}
            className="absolute bottom-0 flex flex-col items-center pointer-events-none"
            style={{ left: `${t.pxFromLeft}px` }}
          >
            {t.label && (
              <span
                className={`text-[7px] leading-none mb-0.5 -translate-x-1/2 font-mono tracking-tighter transition-colors ${
                  t.relPos === 0
                    ? 'text-blue-500 font-bold'
                    : 'text-slate-500/80 group-hover:text-slate-700'
                }`}
              >
                {t.label}
              </span>
            )}
            <div
              className={`w-[1px] transition-colors ${
                t.isMajor
                  ? t.relPos === 0
                    ? 'h-2 bg-blue-500'
                    : 'h-1.5 bg-slate-500/60 group-hover:bg-slate-700/80'
                  : t.isMid
                  ? 'h-1 bg-slate-400/40'
                  : 'h-0.5 bg-slate-400/25'
              }`}
            />
          </div>
        ))}
      </div>

      {/* ================= LEFT VERTICAL GRADUATIONS ================= */}
      <div
        id="ruler-vertical"
        className="absolute -left-5 top-0 bottom-0 w-5 pointer-events-auto cursor-col-resize group"
        onPointerDown={(e) => onStartDragNewGuide?.('vertical', e)}
        title="Graduations verticales (Glissez vers la droite pour créer un repère)"
      >
        {/* Subtle baseline */}
        <div className="absolute top-0 bottom-0 right-0 w-[1px] bg-slate-400/25 group-hover:bg-blue-400/50 transition-colors" />

        {/* Highlighted active focus span indicator on left ruler */}
        {focusH > 0 && (
          <div
            className="absolute right-0 w-[2px] bg-blue-500/80 pointer-events-none rounded-full transition-all"
            style={{
              top: `${Math.max(0, focusTop)}px`,
              height: `${Math.max(2, focusBottom - focusTop)}px`,
            }}
          />
        )}

        {/* Minimalist Graduation Ticks */}
        {vTicks.map((t) => (
          <div
            key={`vtick-${t.relPos}`}
            className="absolute right-0 flex items-center justify-end pointer-events-none"
            style={{ top: `${t.pxFromTop}px` }}
          >
            {t.label && (
              <span
                className={`text-[7px] leading-none mr-0.5 -translate-y-1/2 font-mono tracking-tighter transition-colors ${
                  t.relPos === 0
                    ? 'text-blue-500 font-bold'
                    : 'text-slate-500/80 group-hover:text-slate-700'
                }`}
              >
                {t.label}
              </span>
            )}
            <div
              className={`h-[1px] transition-colors ${
                t.isMajor
                  ? t.relPos === 0
                    ? 'w-2 bg-blue-500'
                    : 'w-1.5 bg-slate-500/60 group-hover:bg-slate-700/80'
                  : t.isMid
                  ? 'w-1 bg-slate-400/40'
                  : 'w-0.5 bg-slate-400/25'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
