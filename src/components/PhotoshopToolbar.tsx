import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FocusRect } from '../types';
import {
  Square,
  Circle,
  Eye,
  EyeOff,
  Crosshair,
  GripHorizontal,
  GripVertical,
  Move,
  FolderDown,
  Plus,
  Trash2,
  Hand,
  Droplet,
  Layers,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

interface PhotoshopToolbarProps {
  focus: FocusRect;
  focuses?: FocusRect[];
  activeFocusIndex?: number;
  onUpdateFocus: (updates: Partial<FocusRect>, targetIndex?: number) => void;
  onSelectActiveFocus?: (index: number) => void;
  onAddFocusZone?: () => void;
  onAddBlurZone?: () => void;
  onRemoveFocusZone?: (index: number) => void;
  screenW?: number;
  screenH?: number;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onSaveAs?: () => void;
  isHandToolActive?: boolean;
  onToggleHandTool?: () => void;
}

const STORAGE_KEY = 'focusframe_toolbar_position_v2';
const DEFAULT_POS = { x: 24, y: 88 };

export const PhotoshopToolbar: React.FC<PhotoshopToolbarProps> = ({
  focus,
  focuses,
  activeFocusIndex = 0,
  onUpdateFocus,
  onSelectActiveFocus,
  onAddFocusZone,
  onAddBlurZone,
  onRemoveFocusZone,
  screenW = 204,
  screenH = 450,
  onSaveAs,
  isHandToolActive = false,
  onToggleHandTool,
}) => {
  const allFocuses = focuses && focuses.length > 0 ? focuses : [focus];
  const curActiveIndex = Math.max(0, Math.min(allFocuses.length - 1, activeFocusIndex));
  const activeFocus = allFocuses[curActiveIndex] || focus;

  // Position state (viewport absolute coordinates for free movement anywhere on page)
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          // Verify it's within viewport bounds
          const maxX = Math.max(20, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 60);
          const maxY = Math.max(20, (typeof window !== 'undefined' ? window.innerHeight : 800) - 200);
          return {
            x: Math.max(8, Math.min(maxX, parsed.x)),
            y: Math.max(8, Math.min(maxY, parsed.y)),
          };
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_POS;
  });

  const [isDraggingToolbar, setIsDraggingToolbar] = useState<boolean>(false);
  const [showZonePicker, setShowZonePicker] = useState<boolean>(false);
  const [isHorizontal, setIsHorizontal] = useState<boolean>(false);

  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: DEFAULT_POS.x,
    startY: DEFAULT_POS.y,
  });
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Save position when changed
  const savePosition = useCallback((newPos: { x: number; y: number }) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPos));
    } catch {
      // ignore
    }
  }, []);

  // Drag start handler
  const handleDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingToolbar(true);
    setShowZonePicker(false);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: position.x,
      startY: position.y,
    };
  };

  // Drag move & up handlers attached to window
  useEffect(() => {
    if (!isDraggingToolbar) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;

      let nextX = dragStartRef.current.startX + deltaX;
      let nextY = dragStartRef.current.startY + deltaY;

      // Free movement anywhere across the entire browser viewport
      const toolbarW = toolbarRef.current?.offsetWidth || 44;
      const toolbarH = toolbarRef.current?.offsetHeight || 380;
      const maxX = window.innerWidth - toolbarW - 8;
      const maxY = window.innerHeight - toolbarH - 8;

      nextX = Math.max(8, Math.min(maxX, nextX));
      nextY = Math.max(8, Math.min(maxY, nextY));

      setPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      setIsDraggingToolbar(false);
      savePosition(position);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingToolbar, position, savePosition]);

  // Reset to default position
  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPosition(DEFAULT_POS);
    savePosition(DEFAULT_POS);
  };

  // Active shape determination
  const isPillH = (activeFocus.shape === 'pill' || !activeFocus.shape) && activeFocus.width > activeFocus.height;
  const isPillV = (activeFocus.shape === 'pill' || !activeFocus.shape) && activeFocus.height >= activeFocus.width;
  const isCircle = activeFocus.shape === 'circle';
  const isRounded = activeFocus.shape === 'rounded';
  const isRectangle = activeFocus.shape === 'rectangle';

  // Apply Pill H (Hauteur 35px)
  const selectPillH = () => {
    const pillHeightPct = (35 / screenH) * 100;
    const pillWidthPct = ((screenW + 10) / screenW) * 100;
    const pillXPct = (-5 / screenW) * 100;
    onUpdateFocus({
      enabled: true,
      shape: 'pill',
      radius: 999,
      width: Math.round(pillWidthPct * 10) / 10,
      height: Math.round(pillHeightPct * 10) / 10,
      x: Math.round(pillXPct * 10) / 10,
      y: 35,
      margin: 5,
    }, curActiveIndex);
  };

  // Apply Pill V (35px × 128px)
  const selectPillV = () => {
    const pillWidthPct = (35 / screenW) * 100;
    const pillHeightPct = (128 / screenH) * 100;
    const pillXPct = ((screenW - 35) / 2 / screenW) * 100;
    const pillYPct = ((screenH - 128) / 2 / screenH) * 100;
    onUpdateFocus({
      enabled: true,
      shape: 'pill',
      radius: 999,
      width: Math.round(pillWidthPct * 10) / 10,
      height: Math.round(pillHeightPct * 10) / 10,
      x: Math.round(pillXPct * 10) / 10,
      y: Math.round(pillYPct * 10) / 10,
      margin: 5,
    }, curActiveIndex);
  };

  // Apply Rectangle Arrondi (35px)
  const selectRounded = () => {
    const roundedWPct = (35 / screenW) * 100;
    const roundedHPct = (128 / screenH) * 100;
    const currentCenterX = activeFocus.x + activeFocus.width / 2;
    const currentCenterY = activeFocus.y + activeFocus.height / 2;
    const newX = currentCenterX - roundedWPct / 2;
    const newY = currentCenterY - roundedHPct / 2;
    onUpdateFocus({
      enabled: true,
      shape: 'rounded',
      radius: 12,
      width: Math.round(roundedWPct * 10) / 10,
      height: Math.round(roundedHPct * 10) / 10,
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10,
      margin: 0,
    }, curActiveIndex);
  };

  // Apply Rectangle Net (35px)
  const selectRectangle = () => {
    const rectWPct = (35 / screenW) * 100;
    const rectHPct = (128 / screenH) * 100;
    const currentCenterX = activeFocus.x + activeFocus.width / 2;
    const currentCenterY = activeFocus.y + activeFocus.height / 2;
    const newX = currentCenterX - rectWPct / 2;
    const newY = currentCenterY - rectHPct / 2;
    onUpdateFocus({
      enabled: true,
      shape: 'rectangle',
      radius: 0,
      width: Math.round(rectWPct * 10) / 10,
      height: Math.round(rectHPct * 10) / 10,
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10,
      margin: 0,
    }, curActiveIndex);
  };

  // Apply Circle (55px × 55px)
  const selectCircle = () => {
    const circleSizeWPct = (55 / screenW) * 100;
    const circleSizeHPct = (55 / screenH) * 100;
    const currentCenterX = activeFocus.x + activeFocus.width / 2;
    const currentCenterY = activeFocus.y + activeFocus.height / 2;
    const newX = currentCenterX - circleSizeWPct / 2;
    const newY = currentCenterY - circleSizeHPct / 2;
    onUpdateFocus({
      enabled: true,
      shape: 'circle',
      width: Math.round(circleSizeWPct * 10) / 10,
      height: Math.round(circleSizeHPct * 10) / 10,
      x: Math.round(newX * 10) / 10,
      y: Math.round(newY * 10) / 10,
      margin: 0,
    }, curActiveIndex);
  };

  // Center both
  const centerBoth = () => {
    onUpdateFocus({
      x: Math.round(((100 - activeFocus.width) / 2) * 10) / 10,
      y: Math.round(((100 - activeFocus.height) / 2) * 10) / 10,
    }, curActiveIndex);
  };

  // Cycle through zones quickly
  const cycleZone = () => {
    if (allFocuses.length <= 1) return;
    const nextIdx = (curActiveIndex + 1) % allFocuses.length;
    onSelectActiveFocus?.(nextIdx);
  };

  return (
    <div
      ref={toolbarRef}
      id="photoshop-shape-toolbar"
      aria-label="Barre d'outils flottante"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        position: 'fixed',
        top: 0,
        left: 0,
      }}
      className={`z-[999] select-none transition-shadow duration-150 ${
        isHorizontal
          ? 'flex flex-row items-center gap-1 p-1 rounded-2xl h-[42px]'
          : 'flex flex-col items-center gap-1 p-1 rounded-2xl w-[42px]'
      } ${
        isDraggingToolbar
          ? 'cursor-grabbing shadow-[0_24px_50px_rgba(0,0,0,0.30),0_4px_12px_rgba(0,0,0,0.15)] ring-2 ring-indigo-500/50 scale-[1.02]'
          : 'shadow-[0_12px_32px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.20)]'
      } bg-white/85 backdrop-blur-2xl border border-slate-200/80 text-slate-800`}
    >
      {/* Sleek Drag Handle */}
      <div
        onPointerDown={handleDragStart}
        onDoubleClick={handleResetPosition}
        title="Glisser pour déplacer n'importe où dans la page (Double-clic pour réinitialiser)"
        className={`flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-700 transition-colors ${
          isHorizontal
            ? 'px-1 py-1.5 border-r border-black/[0.08]'
            : 'w-full py-1 border-b border-black/[0.08]'
        }`}
      >
        {isHorizontal ? (
          <GripVertical className="w-3.5 h-3.5" />
        ) : (
          <GripHorizontal className="w-3.5 h-3.5" />
        )}
      </div>

      {/* Compact Active Zone Pill with flyout on click */}
      <div className="relative">
        <button
          type="button"
          id="btn-tb-zone-badge"
          onClick={() => {
            if (allFocuses.length > 1) {
              setShowZonePicker((prev) => !prev);
            } else {
              setShowZonePicker(true);
            }
          }}
          title={`Zone active: ${activeFocus.name || `Zone ${curActiveIndex + 1}`} (${activeFocus.mode === 'blur' ? '💧 Flou' : '🎯 Focus'}) - Cliquez pour gérer les zones`}
          className={`w-7 h-7 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center justify-center cursor-pointer shadow-2xs ${
            activeFocus.mode === 'blur'
              ? 'bg-sky-600 text-white hover:bg-sky-700'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {activeFocus.mode === 'blur' ? '💧' : `Z${curActiveIndex + 1}`}
        </button>

        {/* Floating Zone Picker Flyout Panel */}
        {showZonePicker && (
          <div
            className={`absolute z-50 p-2 bg-white/95 backdrop-blur-xl border border-black/10 rounded-xl shadow-xl flex flex-col gap-1.5 w-44 animate-in fade-in zoom-in-95 ${
              isHorizontal ? 'top-full left-0 mt-2' : 'left-full top-0 ml-2'
            }`}
          >
            <div className="flex items-center justify-between pb-1 border-b border-black/[0.06] text-[11px] font-semibold text-slate-800">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-slate-600" />
                <span>Zones ({allFocuses.length})</span>
              </span>
              <button
                type="button"
                onClick={() => setShowZonePicker(false)}
                className="text-slate-400 hover:text-slate-700 text-xs px-1"
              >
                ✕
              </button>
            </div>

            {/* List of Zones */}
            <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-0.5">
              {allFocuses.map((f, idx) => (
                <div
                  key={f.id || `tb-fly-zone-${idx}`}
                  className={`flex items-center justify-between px-2 py-1 rounded-lg text-xs transition-all ${
                    idx === curActiveIndex
                      ? 'bg-slate-900 text-white font-medium shadow-2xs'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelectActiveFocus?.(idx);
                      setShowZonePicker(false);
                    }}
                    className="flex items-center gap-1.5 flex-1 text-left cursor-pointer"
                  >
                    <span>{f.mode === 'blur' ? '💧' : '🎯'}</span>
                    <span className="truncate">{f.name || `Zone ${idx + 1}`}</span>
                  </button>
                  {allFocuses.length > 1 && onRemoveFocusZone && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFocusZone(idx);
                      }}
                      title="Supprimer cette zone"
                      className={`p-0.5 rounded transition-colors ${
                        idx === curActiveIndex
                          ? 'text-rose-300 hover:text-white'
                          : 'text-slate-400 hover:text-rose-600'
                      }`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Zone Buttons */}
            <div className="pt-1 border-t border-black/[0.06] flex gap-1">
              {onAddFocusZone && (
                <button
                  type="button"
                  onClick={() => {
                    onAddFocusZone();
                    setShowZonePicker(false);
                  }}
                  className="flex-1 py-1 px-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Focus</span>
                </button>
              )}
              {onAddBlurZone && (
                <button
                  type="button"
                  onClick={() => {
                    onAddBlurZone();
                    setShowZonePicker(false);
                  }}
                  className="flex-1 py-1 px-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-2xs"
                >
                  <Droplet className="w-3 h-3" />
                  <span>Flou</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Slim Divider */}
      <div
        className={
          isHorizontal
            ? 'h-5 w-[1px] bg-black/[0.08] mx-0.5'
            : 'w-5 h-[1px] bg-black/[0.08] my-0.5'
        }
      />

      {/* Shape Tool 1: Pilule Verticale (35px × 128px) */}
      <button
        type="button"
        id="ps-tool-pill-v"
        onClick={selectPillV}
        title="Pilule Verticale (35px × 128px)"
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer group active:scale-95 ${
          isPillV && activeFocus.enabled
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div
          className={`w-1.5 h-3.5 rounded-full border ${
            isPillV && activeFocus.enabled ? 'border-white bg-white/40' : 'border-slate-700'
          }`}
        />
      </button>

      {/* Shape Tool 2: Pilule Horizontale (Hauteur 35px) */}
      <button
        type="button"
        id="ps-tool-pill-h"
        onClick={selectPillH}
        title="Pilule Horizontale (Hauteur 35px)"
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer group active:scale-95 ${
          isPillH && activeFocus.enabled
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div
          className={`w-3.5 h-1.5 rounded-full border ${
            isPillH && activeFocus.enabled ? 'border-white bg-white/40' : 'border-slate-700'
          }`}
        />
      </button>

      {/* Shape Tool 3: Rectangle Arrondi */}
      <button
        type="button"
        id="ps-tool-rounded"
        onClick={selectRounded}
        title="Rectangle Arrondi"
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer group active:scale-95 ${
          isRounded && activeFocus.enabled
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <div
          className={`w-3 h-3.5 rounded-[4px] border ${
            isRounded && activeFocus.enabled ? 'border-white bg-white/40' : 'border-slate-700'
          }`}
        />
      </button>

      {/* Shape Tool 4: Rectangle Net */}
      <button
        type="button"
        id="ps-tool-rectangle"
        onClick={selectRectangle}
        title="Rectangle Net (Coins droits)"
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer group active:scale-95 ${
          isRectangle && activeFocus.enabled
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <Square className="w-3 h-3" />
      </button>

      {/* Shape Tool 5: Cercle (55px × 55px) */}
      <button
        type="button"
        id="ps-tool-circle"
        onClick={selectCircle}
        title="Cercle / Rond (55px × 55px)"
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer group active:scale-95 ${
          isCircle && activeFocus.enabled
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <Circle className="w-3 h-3" />
      </button>

      {/* Slim Divider */}
      <div
        className={
          isHorizontal
            ? 'h-5 w-[1px] bg-black/[0.08] mx-0.5'
            : 'w-5 h-[1px] bg-black/[0.08] my-0.5'
        }
      />

      {/* Tool Hand: Pan Mode */}
      {onToggleHandTool && (
        <button
          type="button"
          id="ps-tool-hand"
          onClick={onToggleHandTool}
          title={
            isHandToolActive
              ? 'Outil Main ACTIF : Cliquez et glissez pour déplacer le canevas (Raccourci: H ou Espace)'
              : 'Outil Main : Déplacer le canevas au clic gauche (Raccourci: H ou Espace)'
          }
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
            isHandToolActive
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Hand className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Mode Switch: Focus 🎯 vs Blur 💧 */}
      <button
        type="button"
        id="ps-tool-toggle-mode"
        onClick={() => {
          const isCurrentlyBlur = activeFocus.mode === 'blur';
          onUpdateFocus(
            {
              mode: isCurrentlyBlur ? 'focus' : 'blur',
              blurAmount: activeFocus.blurAmount || 10,
              name: isCurrentlyBlur
                ? activeFocus.name?.replace('Zone Flou', 'Zone') || 'Zone Focus'
                : activeFocus.name?.replace('Zone', 'Zone Flou') || 'Zone Flou',
              showBorder: isCurrentlyBlur,
              borderColor: isCurrentlyBlur ? '#cc0000' : '#0284c7',
            },
            curActiveIndex
          );
        }}
        title={
          activeFocus.mode === 'blur'
            ? 'Zone en Mode Flou (Censure) - Cliquez pour basculer en Focus'
            : 'Zone en Mode Focus (Mise en valeur) - Cliquez pour basculer en Flou'
        }
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
          activeFocus.mode === 'blur'
            ? 'bg-sky-600 text-white shadow-xs'
            : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        {activeFocus.mode === 'blur' ? (
          <Droplet className="w-3.5 h-3.5 text-white fill-white/20" />
        ) : (
          <span className="text-[11px]">🎯</span>
        )}
      </button>

      {/* Quick Recenter */}
      <button
        type="button"
        id="ps-tool-center"
        onClick={centerBoth}
        title="Recentrer la zone active au milieu"
        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer active:scale-95"
      >
        <Crosshair className="w-3.5 h-3.5" />
      </button>

      {/* Toggle Border / Contour */}
      <button
        type="button"
        id="ps-tool-toggle-border"
        onClick={() => onUpdateFocus({ showBorder: !activeFocus.showBorder }, curActiveIndex)}
        title={activeFocus.showBorder ? 'Masquer le contour' : 'Afficher le contour'}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
          activeFocus.showBorder
            ? 'bg-rose-500/20 text-rose-700 border border-rose-400/50'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <div
          className={`w-2.5 h-2.5 rounded-[2px] border-2 ${
            activeFocus.showBorder ? 'border-rose-600 bg-rose-500/30' : 'border-slate-500'
          }`}
        />
      </button>

      {/* Toggle Visibility ON/OFF */}
      <button
        type="button"
        id="ps-tool-toggle-focus"
        onClick={() => onUpdateFocus({ enabled: !activeFocus.enabled }, curActiveIndex)}
        title={activeFocus.enabled ? 'Désactiver la zone' : 'Activer la zone'}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
          activeFocus.enabled
            ? 'text-emerald-700 hover:bg-emerald-50'
            : 'text-slate-300 hover:bg-slate-100 hover:text-slate-600'
        }`}
      >
        {activeFocus.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      </button>

      {/* Save As button */}
      {onSaveAs && (
        <>
          <div
            className={
              isHorizontal
                ? 'h-5 w-[1px] bg-black/[0.08] mx-0.5'
                : 'w-5 h-[1px] bg-black/[0.08] my-0.5'
            }
          />
          <button
            type="button"
            id="ps-tool-save-as"
            onClick={onSaveAs}
            title="Enregistrer sous... (PNG HD)"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-700 hover:bg-slate-900 hover:text-white transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <FolderDown className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
};

