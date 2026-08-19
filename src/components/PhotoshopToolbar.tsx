import React, { useState, useRef, useEffect } from 'react';
import { FocusRect } from '../types';
import {
  Square,
  Circle,
  Eye,
  EyeOff,
  Crosshair,
  GripHorizontal,
  Move,
  FolderDown,
  Plus,
  Trash2,
  Hand,
} from 'lucide-react';

interface PhotoshopToolbarProps {
  focus: FocusRect;
  focuses?: FocusRect[];
  activeFocusIndex?: number;
  onUpdateFocus: (updates: Partial<FocusRect>, targetIndex?: number) => void;
  onSelectActiveFocus?: (index: number) => void;
  onAddFocusZone?: () => void;
  onRemoveFocusZone?: (index: number) => void;
  screenW?: number;
  screenH?: number;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onSaveAs?: () => void;
  isHandToolActive?: boolean;
  onToggleHandTool?: () => void;
}

export const PhotoshopToolbar: React.FC<PhotoshopToolbarProps> = ({
  focus,
  focuses,
  activeFocusIndex = 0,
  onUpdateFocus,
  onSelectActiveFocus,
  onAddFocusZone,
  onRemoveFocusZone,
  screenW = 204,
  screenH = 450,
  containerRef,
  onSaveAs,
  isHandToolActive = false,
  onToggleHandTool,
}) => {
  const allFocuses = focuses && focuses.length > 0 ? focuses : [focus];
  const curActiveIndex = Math.max(0, Math.min(allFocuses.length - 1, activeFocusIndex));
  const activeFocus = allFocuses[curActiveIndex] || focus;

  // Draggable position state (in pixels relative to parent stage)
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 16, y: 16 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState<boolean>(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number }>({
    mouseX: 0,
    mouseY: 0,
    startX: 16,
    startY: 16,
  });
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Drag start handler
  const handleDragStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingToolbar(true);
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

      // Clamp within parent container if available
      if (containerRef?.current && toolbarRef.current) {
        const parentRect = containerRef.current.getBoundingClientRect();
        const toolbarRect = toolbarRef.current.getBoundingClientRect();
        const maxX = parentRect.width - toolbarRect.width - 8;
        const maxY = parentRect.height - toolbarRect.height - 8;
        nextX = Math.max(8, Math.min(maxX, nextX));
        nextY = Math.max(8, Math.min(maxY, nextY));
      } else {
        nextX = Math.max(8, nextX);
        nextY = Math.max(8, nextY);
      }

      setPosition({ x: nextX, y: nextY });
    };

    const handlePointerUp = () => {
      setIsDraggingToolbar(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingToolbar, containerRef]);

  // Active shape determination
  const isPillH = (activeFocus.shape === 'pill' || !activeFocus.shape) && activeFocus.width > activeFocus.height;
  const isPillV = (activeFocus.shape === 'pill' || !activeFocus.shape) && activeFocus.height >= activeFocus.width;
  const isCircle = activeFocus.shape === 'circle';
  const isRounded = activeFocus.shape === 'rounded';
  const isRectangle = activeFocus.shape === 'rectangle';

  // Apply Pill H (Hauteur par défaut 35px)
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

  // Apply Pill V (35px de largeur et 128px de hauteur)
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

  // Apply Rectangle Arrondi (35px de largeur)
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

  // Apply Rectangle Net (35px de largeur)
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

  // Apply Circle (55px x 55px par défaut)
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

  return (
    <div
      ref={toolbarRef}
      id="photoshop-shape-toolbar"
      aria-label="Barre d'outils formes LiquidGlass"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        position: 'absolute',
        top: 0,
        left: 0,
      }}
      className={`hidden md:flex flex-col items-center gap-1.5 p-2 rounded-2xl select-none z-30 transition-shadow duration-200 ${
        isDraggingToolbar
          ? 'cursor-grabbing shadow-[0_20px_50px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.8)] ring-2 ring-indigo-500/40'
          : 'shadow-[0_12px_36px_rgba(0,0,0,0.12),inset_0_1px_1px_rgba(255,255,255,0.6)]'
      } bg-white/40 backdrop-blur-2xl border border-white/60 text-slate-800`}
    >
      {/* Liquid Glass specular header / Drag Handle */}
      <div
        onPointerDown={handleDragStart}
        title="Glisser pour déplacer la barre d'outils n'importe où"
        className="w-full flex flex-col items-center justify-center pt-0.5 pb-1 border-b border-black/[0.06] cursor-grab active:cursor-grabbing group transition-all"
      >
        <div className="flex items-center gap-0.5 text-slate-400 group-hover:text-slate-700 transition-colors">
          <GripHorizontal className="w-4 h-4" />
        </div>
        <span className="text-[8px] font-mono font-bold tracking-wider text-slate-500 uppercase mt-0.5">
          OUTILS
        </span>
      </div>

      {/* Multi-Focus Zone Switcher (Zone 1, Zone 2, + Add Zone) */}
      <div className="flex flex-col items-center gap-1 w-full pb-1 border-b border-black/[0.06]">
        <div className="flex items-center gap-1">
          {allFocuses.map((f, idx) => (
            <button
              key={f.id || `tb-zone-${idx}`}
              type="button"
              onClick={() => onSelectActiveFocus?.(idx)}
              title={`Activer ${f.name || `Zone ${idx + 1}`}`}
              className={`w-6 h-6 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center justify-center cursor-pointer ${
                idx === curActiveIndex
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white/60 text-slate-700 hover:bg-white'
              }`}
            >
              Z{idx + 1}
            </button>
          ))}
          {onAddFocusZone && (
            <button
              type="button"
              id="btn-tb-add-focus"
              onClick={onAddFocusZone}
              title="Ajouter une nouvelle zone focus"
              className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center cursor-pointer transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tool 1: Pilule Verticale (35px × 128px) */}
      <button
        type="button"
        id="ps-tool-pill-v"
        onClick={selectPillV}
        title="Pilule Verticale (35px × 128px)"
        className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer group active:scale-95 ${
          isPillV && activeFocus.enabled
            ? 'bg-slate-900 text-white shadow-md font-bold'
            : 'text-slate-700 hover:bg-white/60 hover:text-slate-900'
        }`}
      >
        <div
          className={`w-2 h-4.5 rounded-full border ${
            isPillV && activeFocus.enabled ? 'border-white bg-white/40' : 'border-slate-700'
          }`}
        />
        <span className="sr-only">Pilule Verticale 35x128</span>
      </button>

      {/* Tool 2: Pilule Horizontale (Hauteur 35px) */}
      <button
        type="button"
        id="ps-tool-pill-h"
        onClick={selectPillH}
        title="Pilule Horizontale (Hauteur 35px)"
        className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer group active:scale-95 ${
          isPillH && activeFocus.enabled
            ? 'bg-slate-900 text-white shadow-md font-bold'
            : 'text-slate-700 hover:bg-white/60 hover:text-slate-900'
        }`}
      >
        <div
          className={`w-4.5 h-2 rounded-full border ${
            isPillH && activeFocus.enabled ? 'border-white bg-white/40' : 'border-slate-700'
          }`}
        />
        <span className="sr-only">Pilule Horizontale (H: 35px)</span>
      </button>

      {/* Tool 3: Rectangle Arrondi (35px) */}
      <button
        type="button"
        id="ps-tool-rounded"
        onClick={selectRounded}
        title="Rectangle Arrondi (35px)"
        className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer group active:scale-95 ${
          isRounded && activeFocus.enabled
            ? 'bg-slate-900 text-white shadow-md font-bold'
            : 'text-slate-700 hover:bg-white/60 hover:text-slate-900'
        }`}
      >
        <div
          className={`w-3.5 h-4.5 rounded-md border ${
            isRounded && activeFocus.enabled ? 'border-white bg-white/40' : 'border-slate-700'
          }`}
        />
        <span className="sr-only">Rectangle Arrondi</span>
      </button>

      {/* Tool 4: Rectangle Net (35px) */}
      <button
        type="button"
        id="ps-tool-rectangle"
        onClick={selectRectangle}
        title="Rectangle Net (35px)"
        className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer group active:scale-95 ${
          isRectangle && activeFocus.enabled
            ? 'bg-slate-900 text-white shadow-md font-bold'
            : 'text-slate-700 hover:bg-white/60 hover:text-slate-900'
        }`}
      >
        <Square className="w-3.5 h-4" />
        <span className="sr-only">Rectangle Net</span>
      </button>

      {/* Tool 5: Cercle / Rond (55px × 55px) */}
      <button
        type="button"
        id="ps-tool-circle"
        onClick={selectCircle}
        title="Cercle / Rond (55px × 55px)"
        className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer group active:scale-95 ${
          isCircle && activeFocus.enabled
            ? 'bg-slate-900 text-white shadow-md font-bold'
            : 'text-slate-700 hover:bg-white/60 hover:text-slate-900'
        }`}
      >
        <Circle className="w-3.5 h-3.5" />
        <span className="sr-only">Cercle 55x55</span>
      </button>

      {/* Liquid Glass Divider */}
      <div className="w-5 h-[1px] bg-black/[0.08] my-0.5" />

      {/* Tool Hand: Outil Main / Pan (Déplacer le canevas au clic gauche - Raccourci: Espace ou H) */}
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
          className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
            isHandToolActive
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-700 hover:bg-white/60 hover:text-slate-900'
          }`}
        >
          <Hand className="w-4 h-4" />
          <span className="sr-only">Outil Main</span>
        </button>
      )}

      {/* Tool 6: Quick Recentrer 🎯 */}
      <button
        type="button"
        id="ps-tool-center"
        onClick={centerBoth}
        title="Recentrer la zone de focus active (Centre X & Y)"
        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 hover:bg-white/60 hover:text-slate-900 transition-all cursor-pointer active:scale-95"
      >
        <Crosshair className="w-4 h-4" />
        <span className="sr-only">Recentrer</span>
      </button>

      {/* Tool 7: Toggle Poignées (Show/Hide Handles) */}
      <button
        type="button"
        id="ps-tool-toggle-handles"
        onClick={() => onUpdateFocus({ showHandles: activeFocus.showHandles === false ? true : false }, curActiveIndex)}
        title={activeFocus.showHandles !== false ? 'Masquer les poignées de redimensionnement' : 'Afficher les poignées de redimensionnement'}
        className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
          activeFocus.showHandles !== false
            ? 'bg-white/80 text-indigo-600 shadow-2xs border border-indigo-200'
            : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'
        }`}
      >
        <Move className="w-3.5 h-3.5" />
        <span className="sr-only">Poignées ON/OFF</span>
      </button>

      {/* Tool 8: Toggle Contour 🔴 */}
      <button
        type="button"
        id="ps-tool-toggle-border"
        onClick={() => onUpdateFocus({ showBorder: !activeFocus.showBorder }, curActiveIndex)}
        title={activeFocus.showBorder ? 'Masquer le contour' : 'Afficher le contour'}
        className={`relative w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
          activeFocus.showBorder
            ? 'bg-rose-500/20 text-rose-700 border border-rose-400/50'
            : 'text-slate-400 hover:bg-white/60 hover:text-slate-700'
        }`}
      >
        <div
          className={`w-3.5 h-3.5 rounded-sm border-2 ${
            activeFocus.showBorder ? 'border-rose-600 bg-rose-500/30' : 'border-slate-400'
          }`}
        />
        <span className="sr-only">Contour</span>
      </button>

      {/* Tool 9: Toggle Focus On/Off 👁️ */}
      <button
        type="button"
        id="ps-tool-toggle-focus"
        onClick={() => onUpdateFocus({ enabled: !activeFocus.enabled }, curActiveIndex)}
        title={activeFocus.enabled ? 'Désactiver la zone focus active' : 'Activer la zone focus active'}
        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
          activeFocus.enabled
            ? 'text-emerald-700 hover:bg-emerald-500/20'
            : 'text-slate-400 hover:bg-white/60 hover:text-slate-600'
        }`}
      >
        {activeFocus.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        <span className="sr-only">Activer/Désactiver</span>
      </button>

      {/* Delete Active Zone button if more than 1 */}
      {allFocuses.length > 1 && onRemoveFocusZone && (
        <button
          type="button"
          id="ps-tool-remove-zone"
          onClick={() => onRemoveFocusZone(curActiveIndex)}
          title={`Supprimer la ${activeFocus.name || `Zone ${curActiveIndex + 1}`}`}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-rose-600 hover:bg-rose-500/20 transition-all cursor-pointer active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="sr-only">Supprimer zone</span>
        </button>
      )}

      {/* Tool 10: Enregistrer sous... (FolderDown SVG) */}
      {onSaveAs && (
        <>
          <div className="w-5 h-[1px] bg-black/[0.08] my-0.5" />
          <button
            type="button"
            id="ps-tool-save-as"
            onClick={onSaveAs}
            title="Enregistrer sous... (Choisir le répertoire de destination)"
            className="relative w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 hover:bg-white/80 hover:text-slate-900 transition-all cursor-pointer active:scale-95 group shadow-2xs"
          >
            <FolderDown className="w-4 h-4 text-slate-800 group-hover:scale-110 transition-transform" />
            <span className="sr-only">Enregistrer sous...</span>
          </button>
        </>
      )}
    </div>
  );
};
