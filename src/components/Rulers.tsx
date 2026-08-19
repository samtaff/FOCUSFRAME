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
  const RULER_SIZE = 16; // 16px compact, elegant thickness for graduation ticks

  // Total container dimensions
  const totalW = screenshotWidth + padding * 2;
  const totalH = screenshotHeight + padding * 2;

  // Generate horizontal ticks starting relative to screenshot 0 (left = padding)
  const hTicks: { relPos: number; pxFromLeft: number; label?: string; isMajor: boolean; isMid: boolean }[] = [];
  const minX = -Math.ceil(padding / 10) * 10;
  const maxX = screenshotWidth + Math.ceil(padding / 10) * 10 + 20;

  for (let x = minX; x <= maxX; x += 10) {
    const pxFromLeft = padding + x;
    if (pxFromLeft >= -5 && pxFromLeft <= totalW + 20) {
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

  // Generate vertical ticks starting relative to screenshot 0 (top = padding)
  const vTicks: { relPos: number; pxFromTop: number; label?: string; isMajor: boolean; isMid: boolean }[] = [];
  const minY = -Math.ceil(padding / 10) * 10;
  const maxY = screenshotHeight + Math.ceil(padding / 10) * 10 + 20;

  for (let y = minY; y <= maxY; y += 10) {
    const pxFromTop = padding + y;
    if (pxFromTop >= -5 && pxFromTop <= totalH + 20) {
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

  return (
    <div
      id="canvas-rulers"
      className="absolute inset-0 pointer-events-none z-30 select-none overflow-visible"
      style={{
        left: `-${RULER_SIZE}px`,
        top: `-${RULER_SIZE}px`,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Corner Origin Unit Marker - Minimalist hairline */}
      <div
        className="absolute top-0 left-0 bg-slate-900/80 border-r border-b border-slate-700/50 text-slate-400 flex items-center justify-center font-mono font-medium text-[8px] z-40 rounded-tl-sm backdrop-blur-xs"
        style={{
          width: `${RULER_SIZE}px`,
          height: `${RULER_SIZE}px`,
        }}
        title="Graduations en pixels (Glissez pour tirer un repère guide)"
      >
        0
      </div>

      {/* Top Horizontal Ruler Graduations */}
      <div
        id="ruler-horizontal"
        className="absolute top-0 right-0 bg-slate-900/60 hover:bg-slate-900/85 text-slate-400 border-b border-slate-700/40 font-mono text-[7px] overflow-hidden flex items-end backdrop-blur-xs pointer-events-auto cursor-row-resize transition-colors"
        style={{
          left: `${RULER_SIZE}px`,
          height: `${RULER_SIZE}px`,
          width: `${totalW}px`,
        }}
        onPointerDown={(e) => onStartDragNewGuide?.('horizontal', e)}
        title="Graduations horizontales (Cliquez et glissez vers le bas pour tirer un repère)"
      >
        {/* Subtle Screenshot boundary markers */}
        <div
          className="absolute top-0 bottom-0 border-x border-indigo-400/40 pointer-events-none"
          style={{
            left: `${padding}px`,
            width: `${screenshotWidth}px`,
          }}
        />

        {/* Minimal Horizontal Graduation Ticks */}
        {hTicks.map((t) => (
          <div
            key={`htick-${t.relPos}`}
            className="absolute bottom-0 flex flex-col items-center pointer-events-none"
            style={{ left: `${t.pxFromLeft}px` }}
          >
            {t.label && (
              <span className={`text-[6.5px] leading-none mb-0.5 -translate-x-1/2 font-mono ${
                t.relPos === 0 ? 'text-indigo-300 font-semibold' : 'text-slate-400/80'
              }`}>
                {t.label}
              </span>
            )}
            <div
              className={`w-[1px] ${
                t.isMajor
                  ? t.relPos === 0
                    ? 'h-2 bg-indigo-400'
                    : 'h-2 bg-slate-300/90'
                  : t.isMid
                  ? 'h-1.5 bg-slate-400/60'
                  : 'h-1 bg-slate-500/40'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Left Vertical Ruler Graduations */}
      <div
        id="ruler-vertical"
        className="absolute left-0 bottom-0 bg-slate-900/60 hover:bg-slate-900/85 text-slate-400 border-r border-slate-700/40 font-mono text-[7px] overflow-hidden flex flex-col justify-start backdrop-blur-xs pointer-events-auto cursor-col-resize transition-colors"
        style={{
          top: `${RULER_SIZE}px`,
          width: `${RULER_SIZE}px`,
          height: `${totalH}px`,
        }}
        onPointerDown={(e) => onStartDragNewGuide?.('vertical', e)}
        title="Graduations verticales (Cliquez et glissez vers la droite pour tirer un repère)"
      >
        {/* Subtle Screenshot boundary markers */}
        <div
          className="absolute left-0 right-0 border-y border-indigo-400/40 pointer-events-none"
          style={{
            top: `${padding}px`,
            height: `${screenshotHeight}px`,
          }}
        />

        {/* Minimal Vertical Graduation Ticks */}
        {vTicks.map((t) => (
          <div
            key={`vtick-${t.relPos}`}
            className="absolute right-0 flex items-center justify-end pointer-events-none"
            style={{ top: `${t.pxFromTop}px` }}
          >
            {t.label && (
              <span className={`text-[6.5px] leading-none mr-0.5 -translate-y-1/2 font-mono ${
                t.relPos === 0 ? 'text-indigo-300 font-semibold' : 'text-slate-400/80'
              }`}>
                {t.label}
              </span>
            )}
            <div
              className={`h-[1px] ${
                t.isMajor
                  ? t.relPos === 0
                    ? 'w-2 bg-indigo-400'
                    : 'w-2 bg-slate-300/90'
                  : t.isMid
                  ? 'w-1.5 bg-slate-400/60'
                  : 'w-1 bg-slate-500/40'
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
