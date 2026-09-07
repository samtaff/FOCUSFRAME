import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PreviewCanvas } from './components/PreviewCanvas';
import { ControlPanel } from './components/ControlPanel';
import { PhotoshopToolbar } from './components/PhotoshopToolbar';
import { ExportPreviewModal } from './components/ExportPreviewModal';
import { FrameSettings, FocusRect, GuideLine, ArrowAnnotation } from './types';
import { SAMPLE_IMAGES, GRADIENT_PRESETS } from './presets';
import { drawArrowShape } from './utils/arrow';
import { toPng, toBlob } from 'html-to-image';
import {
  Focus,
  Info,
  Maximize,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Ruler,
  Rows,
  Columns,
  Trash2,
  Hand,
  Eye,
  SquareDashed,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  MousePointer,
} from 'lucide-react';

const INITIAL_FOCUS_1: FocusRect = {
  id: 'focus-1',
  name: 'Zone 1',
  enabled: true,
  shape: 'pill',
  x: 41.4,
  y: 25.0,
  width: 17.2,
  height: 50.0,
  margin: 5,
  radius: 999,
  showBorder: true,
  borderColor: '#cc0000',
  borderWidth: 2,
  borderStyle: 'solid',
  snapEnabled: true,
  lockSignature: false,
};

const DEFAULT_SETTINGS: FrameSettings = {
  borderRadius: 16,
  padding: 12,
  bgType: 'transparent',
  bgColor: 'transparent',
  bgGradient: '',
  screenshotOpacity: 0.50,
  dimmingType: 'light',
  screenshotRadius: 15,
  shadow: 'lg',
  shadowSettings: {
    enabled: true,
    color: '#000000',
    opacity: 0.50,
    offsetX: 2,
    offsetY: 3,
    blur: 9,
  },
  focus: INITIAL_FOCUS_1,
  focuses: [INITIAL_FOCUS_1],
  activeFocusIndex: 0,
  arrows: [],
  activeArrowIndex: 0,
  exportScale: 1,
  exportFormat: 'height_450',
  exportCustomHeight: 450,
  exportFileName: 'focusframe-export',
};

// Helper to parse CSS linear-gradient into HTML5 CanvasGradient
function createLinearGradientFromCss(
  ctx: CanvasRenderingContext2D,
  cssGradient: string,
  width: number,
  height: number
): CanvasGradient | string {
  try {
    const match = cssGradient.match(/linear-gradient\s*\((.*)\)/i);
    if (!match) return '#ffffff';

    const content = match[1].trim();
    const tokens: string[] = [];
    let current = '';
    let parenDepth = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;

      if (char === ',' && parenDepth === 0) {
        tokens.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim()) tokens.push(current.trim());

    if (tokens.length < 2) return '#ffffff';

    let angleDeg = 135;
    let stopStartIndex = 0;

    const firstToken = tokens[0].toLowerCase();
    if (firstToken.includes('deg')) {
      angleDeg = parseFloat(firstToken) || 135;
      stopStartIndex = 1;
    } else if (firstToken.includes('to top right') || firstToken.includes('to right top')) {
      angleDeg = 45;
      stopStartIndex = 1;
    } else if (firstToken.includes('to bottom right') || firstToken.includes('to right bottom')) {
      angleDeg = 135;
      stopStartIndex = 1;
    } else if (firstToken.includes('to bottom left') || firstToken.includes('to left bottom')) {
      angleDeg = 225;
      stopStartIndex = 1;
    } else if (firstToken.includes('to top left') || firstToken.includes('to left top')) {
      angleDeg = 315;
      stopStartIndex = 1;
    } else if (firstToken.includes('to top')) {
      angleDeg = 0;
      stopStartIndex = 1;
    } else if (firstToken.includes('to right')) {
      angleDeg = 90;
      stopStartIndex = 1;
    } else if (firstToken.includes('to bottom')) {
      angleDeg = 180;
      stopStartIndex = 1;
    } else if (firstToken.includes('to left')) {
      angleDeg = 270;
      stopStartIndex = 1;
    }

    const rad = ((angleDeg - 90) * Math.PI) / 180;
    const cx = width / 2;
    const cy = height / 2;
    const length = Math.abs(width * Math.cos(rad)) + Math.abs(height * Math.sin(rad));
    const halfLen = length / 2;

    const x0 = cx - Math.cos(rad) * halfLen;
    const y0 = cy - Math.sin(rad) * halfLen;
    const x1 = cx + Math.cos(rad) * halfLen;
    const y1 = cy + Math.sin(rad) * halfLen;

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);

    const stopTokens = tokens.slice(stopStartIndex);
    stopTokens.forEach((token, idx) => {
      const parts = token.trim().split(/\s+(?=[0-9%]+$)/);
      const color = parts[0];
      let offset = idx / Math.max(1, stopTokens.length - 1);
      if (parts.length > 1 && parts[1].endsWith('%')) {
        offset = parseFloat(parts[1]) / 100;
      }
      offset = Math.max(0, Math.min(1, offset));
      grad.addColorStop(offset, color);
    });

    return grad;
  } catch (err) {
    console.warn('Could not parse CSS gradient, using fallback:', err);
    return '#ffffff';
  }
}

export default function App() {
  const [settings, setSettings] = useState<FrameSettings>(DEFAULT_SETTINGS);
  const [currentImageSrc, setCurrentImageSrc] = useState<string>(SAMPLE_IMAGES[0].dataUrl);
  const [screenDimensions, setScreenDimensions] = useState<{ width: number; height: number }>({
    width: 204,
    height: 450,
  });
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isDragOverPage, setIsDragOverPage] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [isSpacePressed, setIsSpacePressed] = useState<boolean>(false);
  const [isHandToolActive, setIsHandToolActive] = useState<boolean>(false);
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [showHandles, setShowHandles] = useState<boolean>(true);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);

  const previewFrameRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ mouseX: number; mouseY: number; startPanX: number; startPanY: number }>({
    mouseX: 0,
    mouseY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddHorizontalGuide = () => {
    const newGuide: GuideLine = {
      id: 'guide-' + Date.now(),
      orientation: 'horizontal',
      position: Math.round(screenDimensions.height / 2),
    };
    setGuides((prev) => [...prev, newGuide]);
    showToast(`Repère horizontal ajouté à ${newGuide.position}px`, 'info');
  };

  const handleAddVerticalGuide = () => {
    const newGuide: GuideLine = {
      id: 'guide-' + Date.now(),
      orientation: 'vertical',
      position: Math.round(screenDimensions.width / 2),
    };
    setGuides((prev) => [...prev, newGuide]);
    showToast(`Repère vertical ajouté à ${newGuide.position}px`, 'info');
  };

  const handleClearGuides = () => {
    setGuides([]);
    showToast('Tous les repères ont été effacés', 'info');
  };

  const handleZoomIn = () => {
    setZoom((prev) => {
      const step = prev >= 2.0 ? 0.5 : 0.25;
      return Math.min(5.0, Math.round((prev + step) * 100) / 100);
    });
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const step = prev > 2.0 ? 0.5 : 0.25;
      return Math.max(0.5, Math.round((prev - step) * 100) / 100);
    });
  };

  const handleResetZoomAndPan = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    showToast('Vue recentrée (100%)', 'info');
  };

  const handleToggleHandTool = () => {
    setIsHandToolActive((prev) => {
      const next = !prev;
      showToast(
        next
          ? 'Outil Main activé (Glissez avec le clic gauche pour vous déplacer)'
          : 'Outil Sélection réactivé',
        'info'
      );
      return next;
    });
  };

  // Keyboard spacebar and 'H' hotkeys for Photoshop-style pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName) ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
      if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleToggleHandTool();
      }
      if (e.key === 'Escape' && isHandToolActive) {
        setIsHandToolActive(false);
        showToast('Outil Sélection réactivé', 'info');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isHandToolActive]);

  // Stage pointer dragging for panning canvas (Photoshop style)
  const handleStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only pan if middle click (button 1), spacebar held, hand tool active, or clicking stage background
    const isBackground =
      e.target === stageContainerRef.current ||
      (e.target as HTMLElement).id === 'canvas-pan-surface' ||
      (e.target as HTMLElement).classList.contains('bg-canvas-dots') ||
      (e.target as HTMLElement).closest('#canvas-pan-surface') !== null;

    if (isSpacePressed || isHandToolActive || e.button === 1 || (isBackground && (zoom > 1.0 || pan.x !== 0 || pan.y !== 0))) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
    }
  };

  useEffect(() => {
    if (!isPanning) return;

    const handleGlobalPointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - panStartRef.current.mouseX;
      const deltaY = e.clientY - panStartRef.current.mouseY;
      setPan({
        x: Math.round(panStartRef.current.startPanX + deltaX),
        y: Math.round(panStartRef.current.startPanY + deltaY),
      });
    };

    const handleGlobalPointerUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('pointermove', handleGlobalPointerMove);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [isPanning]);

  // Ctrl/Cmd + Wheel to zoom, and standard wheel to pan when zoomed
  useEffect(() => {
    const stageEl = stageContainerRef.current;
    if (!stageEl) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoom((prev) => Math.min(5.0, Math.round((prev + (prev >= 2.0 ? 0.25 : 0.1)) * 100) / 100));
        } else {
          setZoom((prev) => Math.max(0.5, Math.round((prev - (prev > 2.0 ? 0.25 : 0.1)) * 100) / 100));
        }
      } else if (zoom > 1.0 || isHandToolActive || isSpacePressed) {
        // Natural pan scrolling
        e.preventDefault();
        setPan((prev) => ({
          x: Math.round(prev.x - e.deltaX),
          y: Math.round(prev.y - e.deltaY),
        }));
      }
    };

    stageEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => stageEl.removeEventListener('wheel', handleWheel);
  }, [zoom, isHandToolActive, isSpacePressed]);

  const handleUpdateSettings = (newSettings: Partial<FrameSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleUpdateFocus = (newFocus: Partial<FocusRect>, targetIndex?: number) => {
    setSettings((prev) => {
      const idx = targetIndex !== undefined ? targetIndex : prev.activeFocusIndex ?? 0;
      const curFocuses = prev.focuses && prev.focuses.length > 0 ? [...prev.focuses] : [{ ...prev.focus }];
      const safeIdx = Math.max(0, Math.min(curFocuses.length - 1, idx));
      curFocuses[safeIdx] = { ...curFocuses[safeIdx], ...newFocus };

      return {
        ...prev,
        focuses: curFocuses,
        focus: curFocuses[safeIdx],
      };
    });
  };

  const handleSelectActiveFocus = (index: number) => {
    setSettings((prev) => {
      const curFocuses = prev.focuses && prev.focuses.length > 0 ? prev.focuses : [prev.focus];
      const safeIdx = Math.max(0, Math.min(curFocuses.length - 1, index));
      return {
        ...prev,
        activeFocusIndex: safeIdx,
        focus: curFocuses[safeIdx],
      };
    });
  };

  const handleAddFocusZone = () => {
    setSettings((prev) => {
      const curFocuses = prev.focuses && prev.focuses.length > 0 ? [...prev.focuses] : [{ ...prev.focus }];
      const newZoneNumber = curFocuses.length + 1;
      const screenW = screenDimensions.width || 204;
      const screenH = screenDimensions.height || 450;

      // Create a default 55px x 55px Circle or Pill zone offset vertically
      const circleSizeWPct = (55 / screenW) * 100;
      const circleSizeHPct = (55 / screenH) * 100;
      const newXPct = ((screenW - 55) / 2 / screenW) * 100;
      const offsetTop = Math.min(75, 20 + (curFocuses.length % 4) * 18);

      const newZone: FocusRect = {
        id: 'focus-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: `Zone ${newZoneNumber}`,
        enabled: true,
        shape: 'circle',
        x: Math.round(newXPct * 10) / 10,
        y: Math.round(offsetTop * 10) / 10,
        width: Math.round(circleSizeWPct * 10) / 10,
        height: Math.round(circleSizeHPct * 10) / 10,
        margin: 0,
        radius: 999,
        showBorder: true,
        borderColor: '#cc0000',
        borderWidth: 2,
        borderStyle: 'solid',
        snapEnabled: true,
        lockSignature: false,
      };

      const updated = [...curFocuses, newZone];
      return {
        ...prev,
        focuses: updated,
        activeFocusIndex: updated.length - 1,
        focus: newZone,
      };
    });
    showToast('Nouvelle zone de focus ajoutée !', 'success');
  };

  const handleAddBlurZone = () => {
    setSettings((prev) => {
      const curFocuses = prev.focuses && prev.focuses.length > 0 ? [...prev.focuses] : [{ ...prev.focus }];
      const newZoneNumber = curFocuses.length + 1;
      const screenW = screenDimensions.width || 204;
      const screenH = screenDimensions.height || 450;

      // Default blur area: horizontal pill / rounded rect across text or metrics
      const blurW = Math.min(screenW * 0.75, 140);
      const blurH = Math.min(screenH * 0.15, 36);
      const blurWPct = (blurW / screenW) * 100;
      const blurHPct = (blurH / screenH) * 100;
      const newXPct = ((screenW - blurW) / 2 / screenW) * 100;
      const offsetTop = Math.min(75, 25 + (curFocuses.length % 4) * 16);

      const newZone: FocusRect = {
        id: 'blur-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: `Zone Flou ${newZoneNumber}`,
        enabled: true,
        mode: 'blur',
        blurAmount: 10,
        blurStyle: 'gaussian',
        shape: 'rounded',
        x: Math.round(newXPct * 10) / 10,
        y: Math.round(offsetTop * 10) / 10,
        width: Math.round(blurWPct * 10) / 10,
        height: Math.round(blurHPct * 10) / 10,
        margin: 0,
        radius: 8,
        showBorder: false,
        borderColor: '#0284c7',
        borderWidth: 1.5,
        borderStyle: 'dashed',
        snapEnabled: true,
        lockSignature: false,
      };

      const updated = [...curFocuses, newZone];
      return {
        ...prev,
        focuses: updated,
        activeFocusIndex: updated.length - 1,
        focus: newZone,
      };
    });
    showToast('Zone de flou / censure ajoutée !', 'info');
  };

  const handleRemoveFocusZone = (indexToRemove: number) => {
    setSettings((prev) => {
      const curFocuses = prev.focuses && prev.focuses.length > 0 ? [...prev.focuses] : [{ ...prev.focus }];
      if (curFocuses.length <= 1) {
        showToast('Impossible de supprimer la seule zone.', 'info');
        return prev;
      }
      const updated = curFocuses.filter((_, i) => i !== indexToRemove);
      const nextActive = Math.max(0, Math.min(updated.length - 1, (prev.activeFocusIndex ?? 0) >= indexToRemove ? (prev.activeFocusIndex ?? 0) - 1 : (prev.activeFocusIndex ?? 0)));
      return {
        ...prev,
        focuses: updated,
        activeFocusIndex: nextActive,
        focus: updated[nextActive],
      };
    });
    showToast('Zone de focus supprimée', 'info');
  };

  const handleDuplicateFocusZone = (indexToDup: number) => {
    setSettings((prev) => {
      const curFocuses = prev.focuses && prev.focuses.length > 0 ? [...prev.focuses] : [{ ...prev.focus }];
      const source = curFocuses[indexToDup] || curFocuses[0];
      const newZoneNumber = curFocuses.length + 1;
      const dup: FocusRect = {
        ...source,
        id: 'focus-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: `Zone ${newZoneNumber}`,
        y: Math.min(80, source.y + 8),
      };
      const updated = [...curFocuses, dup];
      return {
        ...prev,
        focuses: updated,
        activeFocusIndex: updated.length - 1,
        focus: dup,
      };
    });
    showToast('Zone de focus dupliquée !', 'success');
  };

  // Arrow Annotations Handlers
  const handleAddArrow = (presetAngle?: number) => {
    setSettings((prev) => {
      const curArrows = prev.arrows ? [...prev.arrows] : [];
      const newNum = curArrows.length + 1;

      // Smart positioning: place pointing to the active focus or centered
      const activeF =
        prev.focuses && prev.focuses.length > 0
          ? prev.focuses[prev.activeFocusIndex ?? 0] || prev.focus
          : prev.focus;

      let defaultX = 65.0;
      let defaultY = 50.0;
      let defaultRotation = presetAngle !== undefined ? presetAngle : 180; // 180 = Left pointing arrow like user sample!

      if (activeF && activeF.enabled) {
        if (activeF.x > 35) {
          // If zone is on right/center, arrow on right pointing left towards it
          defaultX = Math.min(92, Math.max(10, activeF.x + activeF.width + 12));
          defaultY = Math.min(90, Math.max(10, activeF.y + activeF.height / 2));
          defaultRotation = 180; // Pointing left towards focus
        } else {
          // If zone is on left, arrow on right of it pointing left, or left pointing right
          defaultX = Math.min(92, Math.max(10, activeF.x + activeF.width + 14));
          defaultY = Math.min(90, Math.max(10, activeF.y + activeF.height / 2));
          defaultRotation = 180;
        }
      }

      if (presetAngle !== undefined) {
        defaultRotation = presetAngle;
      }

      const newArrow: ArrowAnnotation = {
        id: 'arrow-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: `Flèche ${newNum}`,
        enabled: true,
        x: Math.round(defaultX * 10) / 10,
        y: Math.round(defaultY * 10) / 10,
        size: 40,
        thickness: 7,
        headWidth: 16,
        headLength: 15,
        rotation: defaultRotation,
        color: '#cc0000', // Rouge vif fixe 40x16px
        opacity: 1.0,
        hasShadow: false,
        showHandles: false,
        cornerRadius: 0,
        roundedTail: true, // Départ arrondi demi-cercle
      };

      const updated = [...curArrows, newArrow];
      return {
        ...prev,
        arrows: updated,
        activeArrowIndex: updated.length - 1,
      };
    });
    showToast('Flèche rouge ajoutée !', 'success');
  };

  const handleUpdateArrow = (updates: Partial<ArrowAnnotation>, targetIndex?: number) => {
    setSettings((prev) => {
      const curArrows = prev.arrows ? [...prev.arrows] : [];
      if (curArrows.length === 0) return prev;
      const idx = targetIndex !== undefined ? targetIndex : prev.activeArrowIndex ?? 0;
      const safeIdx = Math.max(0, Math.min(curArrows.length - 1, idx));
      curArrows[safeIdx] = { ...curArrows[safeIdx], ...updates };
      return {
        ...prev,
        arrows: curArrows,
      };
    });
  };

  const handleSelectActiveArrow = (index: number) => {
    setSettings((prev) => {
      const curArrows = prev.arrows || [];
      const safeIdx = Math.max(0, Math.min(Math.max(0, curArrows.length - 1), index));
      return {
        ...prev,
        activeArrowIndex: safeIdx,
      };
    });
  };

  const handleRemoveArrow = (indexToRemove: number) => {
    setSettings((prev) => {
      const curArrows = prev.arrows ? [...prev.arrows] : [];
      const updated = curArrows.filter((_, i) => i !== indexToRemove);
      const nextActive = Math.max(
        0,
        Math.min(
          Math.max(0, updated.length - 1),
          (prev.activeArrowIndex ?? 0) >= indexToRemove
            ? (prev.activeArrowIndex ?? 0) - 1
            : (prev.activeArrowIndex ?? 0)
        )
      );
      return {
        ...prev,
        arrows: updated,
        activeArrowIndex: nextActive,
      };
    });
    showToast('Flèche supprimée', 'info');
  };

  const handleDuplicateArrow = (indexToDup: number) => {
    setSettings((prev) => {
      const curArrows = prev.arrows ? [...prev.arrows] : [];
      const source = curArrows[indexToDup] || curArrows[0];
      if (!source) return prev;
      const newNum = curArrows.length + 1;
      const dup: ArrowAnnotation = {
        ...source,
        id: 'arrow-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: `Flèche ${newNum}`,
        x: Math.min(92, source.x + 4),
        y: Math.min(92, source.y + 4),
      };
      const updated = [...curArrows, dup];
      return {
        ...prev,
        arrows: updated,
        activeArrowIndex: updated.length - 1,
      };
    });
    showToast('Flèche dupliquée !', 'success');
  };

  const handleImportImage = (file: File) => {
    const isImage = file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.svg');
    if (!isImage) {
      showToast('Veuillez sélectionner un fichier image valide (PNG, JPG, SVG, WebP...).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setCurrentImageSrc(e.target.result);
        showToast('Image importée avec succès (format compatible) !', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sampleId: string) => {
    const sample = SAMPLE_IMAGES.find((s) => s.id === sampleId);
    if (sample) {
      setCurrentImageSrc(sample.dataUrl);
      showToast(`Exemple « ${sample.name} » chargé`, 'info');
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    showToast('Paramètres réinitialisés par défaut.', 'info');
  };

  // Drag & drop whole page support
  const handlePageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverPage(true);
  };

  const handlePageDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverPage(false);
  };

  const handlePageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverPage(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImportImage(e.dataTransfer.files[0]);
    }
  };

  // High Fidelity Bicubic Sharper Canvas Generator (100% clean, no white or black edge artifacts)
  const renderFallbackCanvas = async (scaleMultiplier: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Base preview width is 240
        const baseW = 240;
        const padBase = settings.padding || 0;
        const innerWBase = baseW - padBase * 2;
        const aspect = img.naturalHeight / img.naturalWidth || 1.8;
        const innerHBase = innerWBase * aspect;
        const totalBaseH = innerHBase + padBase * 2;

        // Determine homothetic ratio
        let homotheticRatio = 1.0;
        if (settings.exportFormat === 'height_450') {
          homotheticRatio = 450 / totalBaseH;
        } else if (settings.exportFormat === 'custom') {
          homotheticRatio = (settings.exportCustomHeight || 450) / totalBaseH;
        }

        const targetScale = homotheticRatio * scaleMultiplier;
        const targetW = Math.max(1, Math.round(baseW * targetScale));
        const targetH = Math.max(1, Math.round(totalBaseH * targetScale));

        // Vector & Stroke Anti-Aliasing via Super-Sampled Anti-Aliasing (SSAA):
        // When exporting at standard or compact formats (such as the required height 450px format),
        // drawing curved strokes (pills, circles, rounded corners) directly on a 1x canvas
        // causes harsh stair-stepping (crénelage) because the low-resolution pixel grid
        // only offers a few discrete pixels along the curve.
        // By rendering vector contours, focus borders, cutouts, and images inside a high-density
        // buffer (target minimum ~1800px height) and then downscaling via multi-pass bicubic
        // area-averaging, we completely eliminate aliasing/crénelage on curves while strictly
        // preserving the EXACT target dimensions and export format requested by the user.
        const oversample = Math.max(1, Math.min(4, Math.ceil(1800 / targetH)));
        const effectiveScale = targetScale * oversample;

        const frameW = targetW * oversample;
        const frameH = targetH * oversample;
        const pad = padBase * effectiveScale;
        const innerW = innerWBase * effectiveScale;
        const innerH = innerHBase * effectiveScale;
        const allFocuses = settings.focuses && settings.focuses.length > 0 ? settings.focuses : [settings.focus];

        const canvas = document.createElement('canvas');
        canvas.width = Math.round(frameW);
        canvas.height = Math.round(frameH);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        // Configure Bicubic High Quality Resampling (Native Browser Bicubic)
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 1. Draw Container Background (Transparent, Solid or Gradient)
        if (settings.bgType === 'solid') {
          ctx.save();
          ctx.fillStyle = settings.bgColor || '#ffffff';
          ctx.beginPath();
          ctx.roundRect(0, 0, frameW, frameH, (settings.borderRadius || 0) * effectiveScale);
          ctx.fill();
          ctx.restore();
        } else if (settings.bgType === 'gradient') {
          ctx.save();
          const gradientStyle = createLinearGradientFromCss(
            ctx,
            settings.bgGradient || 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            frameW,
            frameH
          );
          ctx.fillStyle = gradientStyle;
          ctx.beginPath();
          ctx.roundRect(0, 0, frameW, frameH, (settings.borderRadius || 0) * effectiveScale);
          ctx.fill();
          ctx.restore();
        }

        // 2. Draw Screenshot Drop Shadow if enabled (exact boundary matching CSS box-shadow)
        const sRadius = (settings.screenshotRadius || 0) * effectiveScale;
        const shadowEnabled = settings.shadowSettings
          ? settings.shadowSettings.enabled
          : settings.shadow && settings.shadow !== 'none';

        if (shadowEnabled) {
          const shadowConf = settings.shadowSettings || {
            color: '#000000',
            opacity: 0.50,
            offsetX: 2,
            offsetY: 3,
            blur: 9,
          };
          const hex = (shadowConf.color || '#000000').replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16) || 0;
          const g = parseInt(hex.substring(2, 4), 16) || 0;
          const b = parseInt(hex.substring(4, 6), 16) || 0;
          const opacity = shadowConf.opacity ?? 0.50;
          const shadowBlur = (shadowConf.blur ?? 9) * effectiveScale;
          const shadowOffsetX = (shadowConf.offsetX ?? 2) * effectiveScale;
          const shadowOffsetY = (shadowConf.offsetY ?? 3) * effectiveScale;

          // CSS box-shadow standard: The shadow is cast strictly OUTSIDE the border-box.
          // To prevent any solid black fill or shadow bleed under the screenshot (which caused
          // a dark outline / "liseré noir" along edges and rounded corners):
          // 1. Clip out the screenshot interior using 'evenodd' winding rule on a surrounding box.
          // 2. Cast the shadow from geometry shifted far offscreen so only the soft shadow is drawn.
          ctx.save();
          ctx.beginPath();
          const margin = shadowBlur * 4 + 200;
          ctx.rect(-margin, -margin, frameW + margin * 2, frameH + margin * 2);
          ctx.roundRect(pad, pad, innerW, innerH, sRadius);
          ctx.clip('evenodd');

          const shiftX = 10000;
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
          ctx.shadowOffsetX = shadowOffsetX + shiftX;
          ctx.shadowOffsetY = shadowOffsetY;
          ctx.shadowBlur = shadowBlur;

          ctx.beginPath();
          ctx.roundRect(pad - shiftX, pad, innerW, innerH, sRadius);
          ctx.fillStyle = '#000000';
          ctx.fill();
          ctx.restore();
        }

        // 3. Composite Screenshot (Base Image + Focus Brightness + Blur Zones) onto an offscreen canvas
        const screenCompCanvas = document.createElement('canvas');
        screenCompCanvas.width = Math.max(1, Math.round(innerW));
        screenCompCanvas.height = Math.max(1, Math.round(innerH));
        const scCtx = screenCompCanvas.getContext('2d', { willReadFrequently: true });

        if (scCtx) {
          scCtx.imageSmoothingEnabled = true;
          scCtx.imageSmoothingQuality = 'high';

          const focusCutoutZones = allFocuses.filter((f) => f.enabled && f.mode !== 'blur');

          // A. Draw base image with optional background blur
          if (settings.backgroundBlur && settings.backgroundBlur > 0) {
            const bgBlurPx = (settings.backgroundBlur * effectiveScale) / 2;
            scCtx.save();
            scCtx.filter = `blur(${bgBlurPx}px)`;
            scCtx.drawImage(img, 0, 0, innerW, innerH);
            scCtx.restore();

            // Draw crisp unblurred cutouts for active focus zones
            if (focusCutoutZones.length > 0) {
              scCtx.save();
              scCtx.beginPath();
              for (const f of focusCutoutZones) {
                const imgFocusX = (innerW * f.x) / 100;
                const imgFocusY = (innerH * f.y) / 100;
                const imgFocusW = (innerW * f.width) / 100;
                const imgFocusH = (innerH * f.height) / 100;

                let fr = Math.min(imgFocusH / 2, (f.radius || 12) * effectiveScale);
                if (f.shape === 'pill' || f.shape === 'circle') {
                  fr = Math.min(imgFocusW, imgFocusH) / 2;
                } else if (f.shape === 'rectangle') {
                  fr = 0;
                }

                if (f.shape === 'circle') {
                  scCtx.moveTo(imgFocusX + imgFocusW, imgFocusY + imgFocusH / 2);
                  scCtx.ellipse(
                    imgFocusX + imgFocusW / 2,
                    imgFocusY + imgFocusH / 2,
                    imgFocusW / 2,
                    imgFocusH / 2,
                    0,
                    0,
                    Math.PI * 2
                  );
                } else {
                  scCtx.roundRect(imgFocusX, imgFocusY, imgFocusW, imgFocusH, fr);
                }
              }
              scCtx.clip();
              scCtx.drawImage(img, 0, 0, innerW, innerH);
              scCtx.restore();
            }
          } else {
            scCtx.drawImage(img, 0, 0, innerW, innerH);
          }

          // B. Draw Dimming Veil: cut out ONLY active FOCUS (non-blur) zones so focus zones stay 100% bright
          if (focusCutoutZones.length > 0 && settings.screenshotOpacity < 1.0) {
            scCtx.beginPath();
            // Outer bounds with bleed
            scCtx.rect(-2, -2, innerW + 4, innerH + 4);

            for (const f of focusCutoutZones) {
              const imgFocusX = (innerW * f.x) / 100;
              const imgFocusY = (innerH * f.y) / 100;
              const imgFocusW = (innerW * f.width) / 100;
              const imgFocusH = (innerH * f.height) / 100;

              let fr = Math.min(imgFocusH / 2, (f.radius || 12) * effectiveScale);
              if (f.shape === 'pill' || f.shape === 'circle') {
                fr = Math.min(imgFocusW, imgFocusH) / 2;
              } else if (f.shape === 'rectangle') {
                fr = 0;
              }

              if (f.shape === 'circle') {
                scCtx.moveTo(imgFocusX + imgFocusW, imgFocusY + imgFocusH / 2);
                scCtx.ellipse(
                  imgFocusX + imgFocusW / 2,
                  imgFocusY + imgFocusH / 2,
                  imgFocusW / 2,
                  imgFocusH / 2,
                  0,
                  0,
                  Math.PI * 2
                );
              } else {
                scCtx.roundRect(imgFocusX, imgFocusY, imgFocusW, imgFocusH, fr);
              }
            }

            scCtx.fillStyle = settings.dimmingType === 'light' 
              ? `rgba(255, 255, 255, ${1 - settings.screenshotOpacity})`
              : `rgba(0, 0, 0, ${1 - settings.screenshotOpacity})`;
            scCtx.fill('evenodd');
          }

          // C. Draw Selective Localized Blur Zones (Blurs the composited screenshot at that location: bright if in focus, dimmed if outside)
          const blurZones = allFocuses.filter((f) => f.enabled && f.mode === 'blur');
          for (const f of blurZones) {
            const bExactX = (innerW * f.x) / 100;
            const bExactY = (innerH * f.y) / 100;
            const bExactW = (innerW * f.width) / 100;
            const bExactH = (innerH * f.height) / 100;
            if (bExactW <= 1 || bExactH <= 1) continue;

            const blurPx = Math.max(1, Math.round((f.blurAmount ?? 10) * (effectiveScale / 1.5 || 1)));

            // Extract localized patch from the composited screenshot with bleed
            const bleed = Math.max(24, Math.round(blurPx * 3));
            const cropX0 = Math.max(0, bExactX - bleed);
            const cropY0 = Math.max(0, bExactY - bleed);
            const cropX1 = Math.min(innerW, bExactX + bExactW + bleed);
            const cropY1 = Math.min(innerH, bExactY + bExactH + bleed);
            const cropW = cropX1 - cropX0;
            const cropH = cropY1 - cropY0;
            if (cropW <= 1 || cropH <= 1) continue;

            const patchCanvas = document.createElement('canvas');
            patchCanvas.width = Math.round(cropW);
            patchCanvas.height = Math.round(cropH);
            const pCtx = patchCanvas.getContext('2d');
            if (!pCtx) continue;

            pCtx.imageSmoothingEnabled = true;
            pCtx.imageSmoothingQuality = 'high';
            // Draw from composited screenshot (where focus areas are bright and background is dimmed)
            pCtx.drawImage(screenCompCanvas, cropX0, cropY0, cropW, cropH, 0, 0, cropW, cropH);

            // Blur the patch
            const blurredPatchCanvas = document.createElement('canvas');
            blurredPatchCanvas.width = Math.round(cropW);
            blurredPatchCanvas.height = Math.round(cropH);
            const bpCtx = blurredPatchCanvas.getContext('2d');
            if (!bpCtx) continue;

            bpCtx.imageSmoothingEnabled = true;
            bpCtx.imageSmoothingQuality = 'high';
            bpCtx.filter = `blur(${blurPx}px)`;
            bpCtx.drawImage(patchCanvas, 0, 0);
            bpCtx.filter = 'none';

            let bRadius = Math.min(bExactH / 2, (f.radius || 8) * effectiveScale);
            if (f.shape === 'pill' || f.shape === 'circle') {
              bRadius = Math.min(bExactW, bExactH) / 2;
            } else if (f.shape === 'rectangle') {
              bRadius = 0;
            }

            scCtx.save();
            scCtx.beginPath();
            if (f.shape === 'circle') {
              scCtx.ellipse(
                bExactX + bExactW / 2,
                bExactY + bExactH / 2,
                bExactW / 2,
                bExactH / 2,
                0,
                0,
                Math.PI * 2
              );
            } else {
              scCtx.roundRect(bExactX, bExactY, bExactW, bExactH, bRadius);
            }
            scCtx.clip();

            scCtx.globalAlpha = f.blurOpacity ?? 1.0;
            scCtx.drawImage(blurredPatchCanvas, cropX0, cropY0);

            if (f.blurStyle === 'dark') {
              scCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
              scCtx.fill();
            } else if (f.blurStyle === 'frost') {
              scCtx.fillStyle = 'rgba(255, 255, 255, 0.30)';
              scCtx.fill();
            }
            scCtx.restore();
          }

          // D. Draw the composited screenshot onto the main frame canvas with rounded corner clipping
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(pad, pad, innerW, innerH, sRadius);
          ctx.clip();
          ctx.drawImage(screenCompCanvas, pad, pad, innerW, innerH);
          ctx.restore();
        }

        // 4. Draw Focus Borders with exact coordinates & crisp stroke if enabled
        for (const f of allFocuses) {
          if (f.enabled && f.showBorder) {
            const boxX = pad + (innerW * f.x) / 100;
            const boxY = pad + (innerH * f.y) / 100;
            const boxW = (innerW * f.width) / 100;
            const boxH = (innerH * f.height) / 100;

            let boxR = Math.min(boxH / 2, (f.radius || 12) * effectiveScale);
            if (f.shape === 'pill' || f.shape === 'circle') {
              boxR = Math.min(boxW, boxH) / 2;
            } else if (f.shape === 'rectangle') {
              boxR = 0;
            }

            ctx.save();
            const bWidth = (f.borderWidth || 2) * effectiveScale;

            ctx.beginPath();
            if (f.shape === 'circle') {
              ctx.ellipse(
                boxX + boxW / 2,
                boxY + boxH / 2,
                boxW / 2,
                boxH / 2,
                0,
                0,
                Math.PI * 2
              );
            } else {
              ctx.roundRect(boxX, boxY, boxW, boxH, boxR);
            }
            ctx.strokeStyle = f.borderColor || '#cc0000';
            ctx.lineWidth = bWidth;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            if (f.borderStyle === 'dashed') {
              ctx.setLineDash([4 * effectiveScale, 4 * effectiveScale]);
            }
            ctx.stroke();
            ctx.restore();
          }
        }

        // 5. Draw Arrow Annotations (Pointeurs & Callout Arrows)
        if (settings.arrows && settings.arrows.length > 0) {
          for (const arrow of settings.arrows) {
            if (!arrow.enabled) continue;
            const arrowCenterX = pad + (innerW * arrow.x) / 100;
            const arrowCenterY = pad + (innerH * arrow.y) / 100;

            drawArrowShape(
              ctx,
              arrowCenterX,
              arrowCenterY,
              arrow.size || 40,
              arrow.thickness || 7,
              arrow.headWidth || 16,
              arrow.headLength || 15,
              arrow.rotation ?? 180,
              arrow.color || '#cc0000',
              arrow.opacity ?? 1.0,
              arrow.hasShadow ?? false,
              effectiveScale,
              arrow.cornerRadius ?? 0,
              arrow.roundedTail !== false
            );
          }
        }

        if (oversample > 1) {
          // Downscale from the supersampled high-density buffer to the exact requested export dimensions.
          // This applies continuous area-weighted bicubic anti-aliasing to all curved strokes,
          // borders, and vectors, completely eliminating jagged stairs (crénelage).
          const finalCanvas = document.createElement('canvas');
          finalCanvas.width = targetW;
          finalCanvas.height = targetH;
          const finalCtx = finalCanvas.getContext('2d');
          if (finalCtx) {
            finalCtx.imageSmoothingEnabled = true;
            finalCtx.imageSmoothingQuality = 'high';

            if (oversample === 4) {
              // 2-pass step-down (4x -> 2x -> 1x) to achieve maximum edge smoothness and optical sharpness
              const midW = Math.max(1, Math.round(targetW * 2));
              const midH = Math.max(1, Math.round(targetH * 2));
              const midCanvas = document.createElement('canvas');
              midCanvas.width = midW;
              midCanvas.height = midH;
              const midCtx = midCanvas.getContext('2d');
              if (midCtx) {
                midCtx.imageSmoothingEnabled = true;
                midCtx.imageSmoothingQuality = 'high';
                midCtx.drawImage(canvas, 0, 0, midW, midH);
                finalCtx.drawImage(midCanvas, 0, 0, targetW, targetH);
                resolve(finalCanvas.toDataURL('image/png'));
                return;
              }
            }

            finalCtx.drawImage(canvas, 0, 0, targetW, targetH);
            resolve(finalCanvas.toDataURL('image/png'));
            return;
          }
        }

        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = currentImageSrc;
    });
  };

  // Helper to compute effective pixelRatio to achieve homothetic target dimension with high DPI
  const getHomotheticPixelRatio = (baseScale: number): number => {
    if (!previewFrameRef.current) return Math.max(2, baseScale);
    const currentElemH = previewFrameRef.current.offsetHeight || 450;

    let homotheticRatio = 1.0;
    if (settings.exportFormat === 'height_450') {
      homotheticRatio = 450 / currentElemH;
    } else if (settings.exportFormat === 'custom') {
      homotheticRatio = (settings.exportCustomHeight || 450) / currentElemH;
    }

    return Math.max(1, homotheticRatio * (baseScale || 2));
  };

  // High quality PNG Export with support for Destination Folder Selection
  const handleExportPng = async (chooseDirectory = false) => {
    if (!previewFrameRef.current) return;
    setIsExporting(true);

    try {
      await new Promise((r) => setTimeout(r, 60));
      const baseScale = settings.exportScale || 2;
      
      // Generate pixel-perfect high resolution export using unified Canvas 2D engine
      const dataUrl = await renderFallbackCanvas(baseScale);
      const res = await fetch(dataUrl);
      const blob: Blob = await res.blob();

      if (!blob) {
        throw new Error('Impossible de générer le fichier image');
      }

      let sanitizedName = (settings.exportFileName || 'focusframe-export').trim();
      if (!sanitizedName) sanitizedName = `screenshot-focus-${Date.now()}`;
      if (!sanitizedName.toLowerCase().endsWith('.png')) {
        sanitizedName += '.png';
      }
      const exportFilename = sanitizedName;

      // If directory picker requested, attempt File System Access API (showSaveFilePicker or showDirectoryPicker)
      let savedViaPicker = false;
      if (chooseDirectory && typeof window !== 'undefined') {
        // 1. Try showSaveFilePicker (Native OS "Save As" Dialog allowing folder navigation & file naming)
        if ('showSaveFilePicker' in window) {
          try {
            const handle = await (window as any).showSaveFilePicker({
              suggestedName: exportFilename,
              types: [
                {
                  description: 'Image PNG (*.png)',
                  accept: { 'image/png': ['.png'] },
                },
              ],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            savedViaPicker = true;
            showToast(`Image « ${exportFilename} » enregistrée dans le dossier choisi !`, 'success');
          } catch (pickerErr: any) {
            if (pickerErr.name === 'AbortError') {
              // User cancelled the file picker dialog
              setIsExporting(false);
              return;
            }
            console.warn('showSaveFilePicker error or blocked by iframe environment:', pickerErr);
          }
        }

        // 2. Try showDirectoryPicker if showSaveFilePicker failed or wasn't supported
        if (!savedViaPicker && 'showDirectoryPicker' in window) {
          try {
            const dirHandle = await (window as any).showDirectoryPicker({
              mode: 'readwrite',
            });
            const fileHandle = await dirHandle.getFileHandle(exportFilename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            savedViaPicker = true;
            showToast(`Image « ${exportFilename} » enregistrée avec succès dans le dossier sélectionné !`, 'success');
          } catch (dirErr: any) {
            if (dirErr.name === 'AbortError') {
              setIsExporting(false);
              return;
            }
            console.warn('showDirectoryPicker error or blocked by iframe:', dirErr);
          }
        }
      }

      if (!savedViaPicker) {
        const objectUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');
        downloadLink.download = exportFilename;
        downloadLink.href = objectUrl;
        downloadLink.click();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

        if (chooseDirectory) {
          showToast(
            `Fichier « ${exportFilename} » téléchargé ! Note : Dans l'aperçu web, ouvrez l'application dans un nouvel onglet ou activez « Toujours demander l'emplacement » dans Chrome pour choisir le dossier.`,
            'info'
          );
        } else {
          showToast(`PNG « ${exportFilename} » exporté en haute qualité !`, 'success');
        }
      }
    } catch (err) {
      console.error('Erreur lors de l\'export PNG:', err);
      showToast('Échec lors de l\'exportation de l\'image.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy to Clipboard
  const handleCopyClipboard = async () => {
    if (!previewFrameRef.current) return;
    setIsExporting(true);

    try {
      await new Promise((r) => setTimeout(r, 60));
      const baseScale = settings.exportScale || 2;
      
      const dataUrl = await renderFallbackCanvas(baseScale);
      const res = await fetch(dataUrl);
      const blob = await res.blob();

      if (blob && navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedSuccess(true);
        showToast('Image copiée en haute définition dans le presse-papier !', 'success');
        setTimeout(() => setCopiedSuccess(false), 3000);
      } else {
        throw new Error('Clipboard API non disponible');
      }
    } catch (err) {
      console.error('Erreur de copie:', err);
      showToast('Presse-papier restreint. Utilisez « Exporter au format PNG ».', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      id="app-root"
      onDragOver={handlePageDragOver}
      onDragLeave={handlePageDragLeave}
      onDrop={handlePageDrop}
      className="min-h-screen bg-gradient-to-b from-[#edf0f4] via-[#f4f6f9] to-[#ffffff] text-slate-800 font-sans flex flex-col relative selection:bg-slate-900 selection:text-white"
    >
      {/* Subtle macOS Ambient Depth Glows for Smoked Glass Refraction */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-32 left-1/4 w-[750px] h-[550px] bg-slate-300/45 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-20 w-[650px] h-[650px] bg-slate-200/60 rounded-full blur-[130px]" />
        <div className="absolute -bottom-24 left-10 w-[850px] h-[550px] bg-slate-300/35 rounded-full blur-[130px]" />
      </div>

      {/* Drag Over Overlay */}
      {isDragOverPage && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-md flex flex-col items-center justify-center text-white pointer-events-none">
          <div className="p-8 bg-white/15 rounded-3xl border border-white/30 text-center flex flex-col items-center gap-3 shadow-2xl backdrop-blur-2xl">
            <Focus className="w-12 h-12 animate-bounce text-white" />
            <p className="text-lg font-bold">Déposez votre capture d'écran ici</p>
            <p className="text-xs text-white/80">Supporte PNG, JPG, WEBP, SVG</p>
          </div>
        </div>
      )}

      {/* App Header with macOS Smoked Glass finish */}
      <header className="h-14 border-b border-black/[0.06] px-6 flex items-center justify-between bg-white/40 backdrop-blur-2xl shrink-0 sticky top-0 z-30 shadow-[0_1px_3px_0_rgba(0,0,0,0.02),inset_0_1px_0_rgba(255,255,255,0.8)]">
        <div className="flex items-center gap-4">
          {/* macOS Window Traffic Lights */}
          <div className="flex items-center gap-1.5" title="macOS Window Controls">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]/80 inline-block shadow-2xs hover:opacity-80 cursor-pointer transition-opacity" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]/80 inline-block shadow-2xs hover:opacity-80 cursor-pointer transition-opacity" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]/80 inline-block shadow-2xs hover:opacity-80 cursor-pointer transition-opacity" />
          </div>

          <div className="w-[1px] h-4 bg-slate-300/80 mx-0.5" />

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Focus className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold tracking-wider text-slate-900 uppercase">FOCUSFRAME</span>
          </div>
        </div>
      </header>

      {/* Photoshop-style Vertical Shape Toolbar (Global Floating Overlay with highest z-index) */}
      <PhotoshopToolbar
        focus={settings.focus}
        focuses={settings.focuses}
        activeFocusIndex={settings.activeFocusIndex}
        onUpdateFocus={handleUpdateFocus}
        onSelectActiveFocus={handleSelectActiveFocus}
        onAddFocusZone={handleAddFocusZone}
        onAddBlurZone={handleAddBlurZone}
        onRemoveFocusZone={handleRemoveFocusZone}
        arrows={settings.arrows}
        activeArrowIndex={settings.activeArrowIndex}
        onAddArrow={handleAddArrow}
        onUpdateArrow={handleUpdateArrow}
        onSelectActiveArrow={handleSelectActiveArrow}
        onRemoveArrow={handleRemoveArrow}
        screenW={screenDimensions.width}
        screenH={screenDimensions.height}
        containerRef={stageContainerRef}
        onSaveAs={() => handleExportPng(true)}
        onPreviewExport={() => setIsPreviewModalOpen(true)}
        showHandles={showHandles}
        onToggleShowHandles={() => {
          setShowHandles((prev) => {
            const next = !prev;
            showToast(next ? 'Poignées & repères activés' : 'Poignées & repères masqués (rendu épuré)', 'info');
            return next;
          });
        }}
        isHandToolActive={isHandToolActive}
        onToggleHandTool={handleToggleHandTool}
      />

      {/* Main Workspace Layout */}
      <main className="relative z-10 flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* CENTER STAGE: Canvas Preview Workspace (macOS Window Panel) */}
        <section
          id="preview-section"
          className="lg:col-span-6 xl:col-span-7 flex flex-col items-center justify-between macos-window p-6 sm:p-8 lg:p-10 relative min-h-[720px] xl:min-h-[820px] overflow-visible"
        >
          {/* Top Stage Header with Controls */}
          <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-black/[0.06] text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-800">
              <span className="font-semibold tracking-tight uppercase">Scène de Prévisualisation</span>
              <span className="text-[10px] px-2 py-0.5 bg-black/[0.04] border border-black/10 text-slate-600 rounded-md font-mono font-medium shadow-2xs">
                240 px
              </span>
            </div>

            {/* Stage Toolbar: Zoom, Rulers & Guides (macOS Segmented Style) */}
            <div className="flex flex-wrap items-center gap-1.5 macos-segmented p-1 shadow-2xs">
              {/* Quick Preview Modal Button */}
              <button
                type="button"
                id="btn-quick-preview-modal"
                onClick={() => setIsPreviewModalOpen(true)}
                title="Aperçu du rendu final avant export (Taille réelle HD)"
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50/80 transition-all cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold">Aperçu HD</span>
              </button>

              <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

              {/* Toggle Zone Handles & Outlines Button (Focus & Blur) */}
              <button
                type="button"
                id="btn-toggle-handles"
                onClick={() => {
                  setShowHandles((prev) => {
                    const nextVal = !prev;
                    showToast(nextVal ? 'Poignées & repères affichés' : 'Poignées & repères masqués (rendu épuré)', 'info');
                    return nextVal;
                  });
                }}
                title={showHandles ? 'Masquer toutes les poignées et contours pointillés' : 'Afficher les poignées de contrôle'}
                className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  showHandles
                    ? 'macos-segmented-item-active text-slate-900 font-semibold'
                    : 'text-amber-800 bg-amber-100 hover:bg-amber-200/80 font-bold border border-amber-300 shadow-2xs'
                }`}
              >
                <SquareDashed className="w-3.5 h-3.5" />
                <span>{showHandles ? 'Poignées ON' : 'Poignées OFF'}</span>
              </button>

              <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

              {/* Toggle Rulers Button */}
              <button
                type="button"
                id="btn-toggle-rulers"
                onClick={() => setShowRulers((prev) => !prev)}
                title={showRulers ? 'Masquer les règles' : 'Afficher les règles de mesure'}
                className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  showRulers
                    ? 'macos-segmented-item-active text-slate-900 font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{showRulers ? 'Règles ON' : 'Règles'}</span>
              </button>

              {/* Guidelines Quick Add Buttons */}
              <div className="flex items-center gap-1 bg-white/80 px-2 py-0.5 rounded-md border border-black/10 shadow-2xs">
                <button
                  type="button"
                  id="btn-add-h-guide"
                  onClick={handleAddHorizontalGuide}
                  title="Ajouter un repère horizontal fin (ou glisser depuis la règle du haut)"
                  className="flex items-center gap-1 text-[10px] font-medium text-slate-700 hover:text-slate-900 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                >
                  <Rows className="w-3 h-3 text-slate-700" />
                  <span>+ Repère H</span>
                </button>
                <button
                  type="button"
                  id="btn-add-v-guide"
                  onClick={handleAddVerticalGuide}
                  title="Ajouter un repère vertical fin (ou glisser depuis la règle de gauche)"
                  className="flex items-center gap-1 text-[10px] font-medium text-slate-700 hover:text-slate-900 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                >
                  <Columns className="w-3 h-3 text-slate-700" />
                  <span>+ Repère V</span>
                </button>
                {guides.length > 0 && (
                  <button
                    type="button"
                    id="btn-clear-guides"
                    onClick={handleClearGuides}
                    title="Effacer tous les repères"
                    className="flex items-center gap-0.5 text-[10px] font-medium text-rose-600 hover:bg-rose-50 px-1.5 py-0.5 rounded transition-all cursor-pointer"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>({guides.length})</span>
                  </button>
                )}
              </div>

              <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

              {/* Hand Tool / Pan Mode Toggle Button */}
              <button
                type="button"
                id="btn-toggle-hand-tool"
                onClick={handleToggleHandTool}
                title={
                  isHandToolActive
                    ? 'Outil Main ACTIF : Déplacer le canevas au clic gauche (Raccourci: H ou Espace)'
                    : 'Outil Main : Déplacer le canevas au clic gauche (Raccourci: H ou Espace)'
                }
                className={`flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  isHandToolActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Hand className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Main</span>
              </button>

              <div className="w-[1px] h-4 bg-slate-300 mx-0.5" />

              {/* Zoom Controls (macOS Group) */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="btn-zoom-out"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  title="Zoom arrière (min 50%)"
                  className="p-1 rounded-md text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                {/* Zoom Level Presets / Display (50% to 500%) */}
                <div className="flex items-center gap-0.5">
                  {[1.0, 2.0, 3.0, 5.0].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setZoom(z)}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                        zoom === z
                          ? 'macos-segmented-item-active text-slate-900 font-semibold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {Math.round(z * 100)}%
                    </button>
                  ))}
                  {![1.0, 2.0, 3.0, 5.0].includes(zoom) && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md macos-segmented-item-active text-slate-900 font-semibold">
                      {Math.round(zoom * 100)}%
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  id="btn-zoom-in"
                  onClick={handleZoomIn}
                  disabled={zoom >= 5.0}
                  title="Zoom avant (max 500%)"
                  className="p-1 rounded-md text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                {(zoom !== 1.0 || pan.x !== 0 || pan.y !== 0) && (
                  <button
                    type="button"
                    id="btn-reset-zoom-pan"
                    onClick={handleResetZoomAndPan}
                    title="Recentrer la vue et réinitialiser le zoom (100%)"
                    className="flex items-center gap-1 px-1.5 py-1 text-[11px] rounded-md text-blue-600 hover:bg-blue-50 font-medium transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="text-[10px]">Recentrer</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Canvas Background with Grid Dots and Infinite Drag Pan Viewport */}
          <div
            ref={stageContainerRef}
            id="canvas-pan-surface"
            onPointerDown={handleStagePointerDown}
            className={`w-full flex-1 flex flex-col items-center justify-center py-8 relative overflow-hidden select-none min-h-[580px] xl:min-h-[680px] touch-none ${
              isSpacePressed || isHandToolActive
                ? isPanning
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : zoom > 1.0 || pan.x !== 0 || pan.y !== 0
                ? isPanning
                  ? 'cursor-grabbing'
                  : 'cursor-grab'
                : ''
            }`}
          >
            {/* Container for the 240px constrained card (macOS Frosted Tile) */}
            <div
              className={`relative z-10 w-full flex flex-col items-center justify-center p-8 sm:p-10 lg:p-12 macos-card bg-canvas-dots transition-all duration-150 min-h-[540px] xl:min-h-[620px] ${
                zoom > 1.0 ? 'max-w-none' : 'max-w-[480px] xl:max-w-[540px]'
              }`}
            >
              <PreviewCanvas
                settings={settings}
                imageSrc={currentImageSrc}
                onUpdateFocus={handleUpdateFocus}
                onSelectActiveFocus={handleSelectActiveFocus}
                arrows={settings.arrows}
                activeArrowIndex={settings.activeArrowIndex}
                onUpdateArrow={handleUpdateArrow}
                onSelectActiveArrow={handleSelectActiveArrow}
                onRemoveArrow={handleRemoveArrow}
                onDuplicateArrow={handleDuplicateArrow}
                previewRef={previewFrameRef}
                isExporting={isExporting}
                onDimensionsChange={setScreenDimensions}
                zoom={zoom}
                pan={pan}
                isSpacePressed={isSpacePressed}
                isHandToolActive={isHandToolActive}
                showRulers={showRulers}
                showHandles={showHandles}
                guides={guides}
                onUpdateGuides={setGuides}
              />
            </div>
          </div>

          {/* Canvas Bottom Tips */}
          <div className="w-full mt-4 pt-3 border-t border-black/[0.06] text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Focus className="w-3.5 h-3.5 text-slate-700" />
              Navigation : Maintenez <kbd className="px-1.5 py-0.5 bg-black/[0.06] border border-black/10 rounded font-mono text-[10px] text-slate-700">Espace</kbd> + Clic gauche pour vous déplacer librement. Zoom : <kbd className="px-1.5 py-0.5 bg-black/[0.06] border border-black/10 rounded font-mono text-[10px] text-slate-700">Ctrl</kbd> + Molette.
            </span>
            <span className="font-mono text-[11px] text-slate-400">Export PNG HD</span>
          </div>
        </section>

        {/* RIGHT STAGE: Control Panel */}
        <section id="controls-section" className="lg:col-span-6 xl:col-span-5 w-full">
          <ControlPanel
            settings={settings}
            screenDimensions={screenDimensions}
            onUpdateSettings={handleUpdateSettings}
            onUpdateFocus={handleUpdateFocus}
            onSelectActiveFocus={handleSelectActiveFocus}
            onAddFocusZone={handleAddFocusZone}
            onAddBlurZone={handleAddBlurZone}
            onRemoveFocusZone={handleRemoveFocusZone}
            onDuplicateFocusZone={handleDuplicateFocusZone}
            arrows={settings.arrows}
            activeArrowIndex={settings.activeArrowIndex}
            onAddArrow={handleAddArrow}
            onUpdateArrow={handleUpdateArrow}
            onSelectActiveArrow={handleSelectActiveArrow}
            onRemoveArrow={handleRemoveArrow}
            onDuplicateArrow={handleDuplicateArrow}
            onImportImage={handleImportImage}
            onSelectSample={handleSelectSample}
            onExport={handleExportPng}
            onPreviewExport={() => setIsPreviewModalOpen(true)}
            showHandles={showHandles}
            onToggleShowHandles={() => {
              setShowHandles((prev) => {
                const next = !prev;
                showToast(next ? 'Poignées & repères affichés' : 'Poignées & repères masqués (rendu épuré)', 'info');
                return next;
              });
            }}
            onCopyClipboard={handleCopyClipboard}
            onReset={handleReset}
            isExporting={isExporting}
            copiedSuccess={copiedSuccess}
          />
        </section>
      </main>

      {/* High-Resolution Export Preview Modal */}
      <ExportPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        onExport={async (saveAs) => {
          await handleExportPng(saveAs);
          setIsPreviewModalOpen(false);
        }}
        onCopyClipboard={handleCopyClipboard}
        generatePreviewDataUrl={renderFallbackCanvas}
        settings={settings}
        copiedSuccess={copiedSuccess}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="toast-notification"
          className={`fixed bottom-5 right-5 z-50 py-3 px-4 rounded-xl shadow-lg border text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 transition-all ${
            toastMessage.type === 'success'
              ? 'bg-slate-900 text-white border-slate-800'
              : toastMessage.type === 'error'
              ? 'bg-rose-950 text-rose-100 border-rose-800'
              : 'bg-slate-900 text-slate-100 border-slate-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <Info className="w-4 h-4 text-indigo-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
