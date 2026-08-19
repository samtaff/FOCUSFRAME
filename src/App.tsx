import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PreviewCanvas } from './components/PreviewCanvas';
import { ControlPanel } from './components/ControlPanel';
import { FrameSettings, FocusRect, GuideLine } from './types';
import { SAMPLE_IMAGES, GRADIENT_PRESETS } from './presets';
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
} from 'lucide-react';

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
  focus: {
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
  },
  exportScale: 1,
  exportFormat: 'height_450',
  exportCustomHeight: 450,
  exportFileName: 'focusframe-export',
};

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
  const [showRulers, setShowRulers] = useState<boolean>(true);
  const [guides, setGuides] = useState<GuideLine[]>([]);

  const previewFrameRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);

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
    setZoom((prev) => Math.min(2.5, Math.round((prev + 0.25) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(0.5, Math.round((prev - 0.25) * 100) / 100));
  };

  const handleResetZoom = () => {
    setZoom(1.0);
  };

  // Optional Ctrl/Cmd + Wheel to zoom inside stage
  useEffect(() => {
    const stageEl = stageContainerRef.current;
    if (!stageEl) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoom((prev) => Math.min(2.5, Math.round((prev + 0.1) * 100) / 100));
        } else {
          setZoom((prev) => Math.max(0.5, Math.round((prev - 0.1) * 100) / 100));
        }
      }
    };

    stageEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => stageEl.removeEventListener('wheel', handleWheel);
  }, []);

  const handleUpdateSettings = (newSettings: Partial<FrameSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const handleUpdateFocus = (newFocus: Partial<FocusRect>) => {
    setSettings((prev) => ({
      ...prev,
      focus: { ...prev.focus, ...newFocus },
    }));
  };

  const handleImportImage = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Veuillez sélectionner un fichier image valide.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        setCurrentImageSrc(e.target.result);
        showToast('Capture d\'écran importée avec succès !', 'success');
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

        const effectiveScale = homotheticRatio * scaleMultiplier;

        const frameW = baseW * effectiveScale;
        const frameH = totalBaseH * effectiveScale;
        const pad = padBase * effectiveScale;
        const innerW = innerWBase * effectiveScale;
        const innerH = innerHBase * effectiveScale;

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
          const gradient = ctx.createLinearGradient(0, 0, frameW, frameH);
          gradient.addColorStop(0, '#10b981');
          gradient.addColorStop(1, '#059669');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(0, 0, frameW, frameH, (settings.borderRadius || 0) * effectiveScale);
          ctx.fill();
          ctx.restore();
        }

        // 2. Draw Screenshot Drop Shadow if enabled (inset caster path by 2px so it never peeks out at screenshot borders)
        const sRadius = (settings.screenshotRadius || 0) * effectiveScale;
        if (settings.shadowSettings ? settings.shadowSettings.enabled : (settings.shadow && settings.shadow !== 'none')) {
          const shadowConf = settings.shadowSettings || {
            color: '#000000',
            opacity: 0.50,
            offsetX: 2,
            offsetY: 3,
            blur: 9,
          };
          const hex = shadowConf.color.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16) || 0;
          const g = parseInt(hex.substring(2, 4), 16) || 0;
          const b = parseInt(hex.substring(4, 6), 16) || 0;
          
          ctx.save();
          ctx.shadowColor = `rgba(${r}, ${g}, ${b}, ${shadowConf.opacity})`;
          ctx.shadowOffsetX = (shadowConf.offsetX ?? 2) * effectiveScale;
          ctx.shadowOffsetY = (shadowConf.offsetY ?? 3) * effectiveScale;
          ctx.shadowBlur = (shadowConf.blur ?? 9) * effectiveScale;
          ctx.beginPath();
          const insetPad = 2 * effectiveScale;
          ctx.roundRect(
            pad + insetPad,
            pad + insetPad,
            Math.max(1, innerW - insetPad * 2),
            Math.max(1, innerH - insetPad * 2),
            Math.max(0, sRadius - insetPad)
          );
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
          ctx.fill();
          ctx.restore();
        }

        // 3. Draw Base Image with Bicubic High Quality and seamless EvenOdd Dimming Veil
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(pad, pad, innerW, innerH, sRadius);
        ctx.clip();

        // Draw Base Image
        ctx.drawImage(img, pad, pad, innerW, innerH);

        // Draw Dimming Veil over everything EXCEPT the focus area using evenodd cutout
        if (settings.focus.enabled) {
          const imgFocusX = pad + (innerW * settings.focus.x) / 100;
          const imgFocusY = pad + (innerH * settings.focus.y) / 100;
          const imgFocusW = (innerW * settings.focus.width) / 100;
          const imgFocusH = (innerH * settings.focus.height) / 100;
          
          let fr = Math.min(imgFocusH / 2, (settings.focus.radius || 12) * effectiveScale);
          if (settings.focus.shape === 'pill') {
            fr = Math.min(imgFocusW, imgFocusH) / 2;
          } else if (settings.focus.shape === 'rectangle') {
            fr = 0;
          }

          ctx.beginPath();
          // Outer bounds of screenshot with bleed to prevent subpixel edge lines
          ctx.rect(pad - 2, pad - 2, innerW + 4, innerH + 4);
          // Inner focus cutout (preserves 100% crisp focus image without double drawing or halo)
          if (settings.focus.shape === 'circle') {
            ctx.ellipse(
              imgFocusX + imgFocusW / 2,
              imgFocusY + imgFocusH / 2,
              imgFocusW / 2,
              imgFocusH / 2,
              0,
              0,
              Math.PI * 2
            );
          } else {
            ctx.roundRect(imgFocusX, imgFocusY, imgFocusW, imgFocusH, fr);
          }

          ctx.fillStyle = settings.dimmingType === 'light' 
            ? `rgba(255, 255, 255, ${1 - settings.screenshotOpacity})`
            : `rgba(0, 0, 0, ${1 - settings.screenshotOpacity})`;
          ctx.fill('evenodd');
        } else {
          ctx.fillStyle = settings.dimmingType === 'light' 
            ? `rgba(255, 255, 255, ${1 - settings.screenshotOpacity})`
            : `rgba(0, 0, 0, ${1 - settings.screenshotOpacity})`;
          ctx.fillRect(pad - 2, pad - 2, innerW + 4, innerH + 4);
        }
        ctx.restore();

        // 4. Draw Focus Border with exact coordinates & crisp stroke if enabled
        if (settings.focus.enabled && settings.focus.showBorder) {
          const boxX = pad + (innerW * settings.focus.x) / 100;
          const boxY = pad + (innerH * settings.focus.y) / 100;
          const boxW = (innerW * settings.focus.width) / 100;
          const boxH = (innerH * settings.focus.height) / 100;
          
          let boxR = Math.min(boxH / 2, (settings.focus.radius || 12) * effectiveScale);
          if (settings.focus.shape === 'pill') {
            boxR = Math.min(boxW, boxH) / 2;
          } else if (settings.focus.shape === 'rectangle') {
            boxR = 0;
          }

          ctx.save();
          const bWidth = (settings.focus.borderWidth || 2) * effectiveScale;

          ctx.beginPath();
          if (settings.focus.shape === 'circle') {
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
          ctx.strokeStyle = settings.focus.borderColor || '#cc0000';
          ctx.lineWidth = bWidth;
          if (settings.focus.borderStyle === 'dashed') {
            ctx.setLineDash([4 * effectiveScale, 4 * effectiveScale]);
          }
          ctx.stroke();
          ctx.restore();
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
      await new Promise((r) => setTimeout(r, 120));
      const baseScale = settings.exportScale || 2;
      const effectiveRatio = getHomotheticPixelRatio(baseScale);
      let blob: Blob | null = null;

      // Primary: High-fidelity DOM to PNG via html-to-image (preserves full resolution, subpixel crisp fonts and smooth shadows)
      try {
        blob = await toBlob(previewFrameRef.current, {
          pixelRatio: effectiveRatio,
          cacheBust: true,
          style: {
            transform: 'none',
            background: settings.bgType === 'transparent' ? 'transparent' : undefined,
            backgroundColor: settings.bgType === 'transparent' ? 'transparent' : undefined,
            backgroundImage: settings.bgType === 'transparent' ? 'none' : undefined,
          },
        });
      } catch (domErr) {
        console.warn('html-to-image toBlob fallback to canvas:', domErr);
        const dataUrl = await renderFallbackCanvas(baseScale);
        const res = await fetch(dataUrl);
        blob = await res.blob();
      }

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
      await new Promise((r) => setTimeout(r, 120));
      const baseScale = settings.exportScale || 2;
      const effectiveRatio = getHomotheticPixelRatio(baseScale);
      let blob: Blob | null = null;

      try {
        blob = await toBlob(previewFrameRef.current, {
          pixelRatio: effectiveRatio,
          cacheBust: true,
          style: {
            transform: 'none',
            background: settings.bgType === 'transparent' ? 'transparent' : undefined,
            backgroundColor: settings.bgType === 'transparent' ? 'transparent' : undefined,
            backgroundImage: settings.bgType === 'transparent' ? 'none' : undefined,
          },
        });
      } catch {
        const dataUrl = await renderFallbackCanvas(baseScale);
        const res = await fetch(dataUrl);
        blob = await res.blob();
      }

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
            <span className="text-sm font-semibold tracking-tight text-slate-900">FocusFrame</span>
            <span className="text-[11px] px-2.5 py-0.5 bg-black/[0.04] border border-black/[0.06] text-slate-700 rounded-md font-medium">
              240px Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-white/60 backdrop-blur-xl border border-black/[0.06] px-3.5 py-1 rounded-full shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium">Prévisualisation max 240px</span>
          </div>
        </div>
      </header>

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

                {/* Zoom Level Presets / Display */}
                <div className="flex items-center gap-0.5">
                  {[0.75, 1.0, 1.5].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setZoom(z)}
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                        zoom === z
                          ? 'macos-segmented-item-active text-slate-900 font-semibold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {Math.round(z * 100)}%
                    </button>
                  ))}
                  {![0.75, 1.0, 1.5].includes(zoom) && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md macos-segmented-item-active text-slate-900 font-semibold">
                      {Math.round(zoom * 100)}%
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  id="btn-zoom-in"
                  onClick={handleZoomIn}
                  disabled={zoom >= 2.5}
                  title="Zoom avant (max 250%)"
                  className="p-1 rounded-md text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                {zoom !== 1.0 && (
                  <button
                    type="button"
                    id="btn-reset-zoom"
                    onClick={handleResetZoom}
                    title="Réinitialiser le zoom (100%)"
                    className="p-1 rounded-md text-slate-500 hover:bg-white hover:text-slate-900 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Canvas Background with Grid Dots and Scroll Viewport */}
          <div
            ref={stageContainerRef}
            className="w-full flex-1 flex flex-col items-center justify-center py-8 relative overflow-auto min-h-[580px] xl:min-h-[680px]"
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
                previewRef={previewFrameRef}
                isExporting={isExporting}
                onDimensionsChange={setScreenDimensions}
                zoom={zoom}
                showRulers={showRulers}
                guides={guides}
                onUpdateGuides={setGuides}
              />
            </div>
          </div>

          {/* Canvas Bottom Tips */}
          <div className="w-full mt-4 pt-3 border-t border-black/[0.06] text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Focus className="w-3.5 h-3.5 text-slate-700" />
              Déplacez et redimensionnez la zone de focus à la souris. Zoom : Ctrl + Molette.
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
            onImportImage={handleImportImage}
            onSelectSample={handleSelectSample}
            onExport={handleExportPng}
            onCopyClipboard={handleCopyClipboard}
            onReset={handleReset}
            isExporting={isExporting}
            copiedSuccess={copiedSuccess}
          />
        </section>
      </main>

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
