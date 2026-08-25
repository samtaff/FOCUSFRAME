import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FolderDown,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Image as ImageIcon,
  Sparkles,
  Layers,
  FileCheck,
} from 'lucide-react';
import { FrameSettings } from '../types';

interface ExportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (saveAs?: boolean) => Promise<void>;
  onCopyClipboard: () => Promise<void>;
  generatePreviewDataUrl: (scale: number) => Promise<string>;
  settings: FrameSettings;
  copiedSuccess?: boolean;
}

export const ExportPreviewModal: React.FC<ExportPreviewModalProps> = ({
  isOpen,
  onClose,
  onExport,
  onCopyClipboard,
  generatePreviewDataUrl,
  settings,
  copiedSuccess = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [zoomMode, setZoomMode] = useState<'fit' | '100' | '150' | '200'>('fit');
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; sizeBytes?: number } | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Generate preview image on open or settings/scale change
  useEffect(() => {
    if (!isOpen) {
      setPreviewUrl(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    generatePreviewDataUrl(settings.exportScale || 2)
      .then((dataUrl) => {
        if (!isMounted) return;
        setPreviewUrl(dataUrl);

        // Load image to get true pixel dimensions
        const testImg = new Image();
        testImg.onload = () => {
          if (!isMounted) return;
          setImageMeta({
            width: testImg.naturalWidth,
            height: testImg.naturalHeight,
            // Approximate base64 size to bytes
            sizeBytes: Math.round((dataUrl.length * 3) / 4),
          });
          setIsLoading(false);
        };
        testImg.src = dataUrl;
      })
      .catch((err) => {
        console.error('Erreur lors de la génération de l\'aperçu:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, settings.exportScale, settings.exportFormat, settings.exportCustomHeight, settings.padding, generatePreviewDataUrl]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = async (saveAs: boolean) => {
    setIsDownloading(true);
    try {
      await onExport(saveAs);
    } finally {
      setIsDownloading(false);
    }
  };

  const formattedSize = imageMeta?.sizeBytes
    ? imageMeta.sizeBytes > 1024 * 1024
      ? `${(imageMeta.sizeBytes / (1024 * 1024)).toFixed(2)} Mo`
      : `${Math.round(imageMeta.sizeBytes / 1024)} Ko`
    : 'PNG';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-5xl h-[90vh] max-h-[850px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.08] dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xs">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 id="preview-modal-title" className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Aperçu avant exportation</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold border border-emerald-500/20">
                  {settings.exportScale}x HD
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {imageMeta ? (
                  <span>
                    Rendu final : <strong className="font-mono text-slate-700 dark:text-slate-200">{imageMeta.width} × {imageMeta.height} px</strong>
                    {' • '}Taille estimée : <strong className="font-mono text-slate-700 dark:text-slate-200">{formattedSize}</strong>
                  </span>
                ) : (
                  'Génération du rendu haute fidélité...'
                )}
              </p>
            </div>
          </div>

          {/* Zoom controls & Close button */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg border border-black/5 dark:border-white/5 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setZoomMode('fit')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  zoomMode === 'fit'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Ajuster
              </button>
              <button
                type="button"
                onClick={() => setZoomMode('100')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  zoomMode === '100'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                100%
              </button>
              <button
                type="button"
                onClick={() => setZoomMode('150')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  zoomMode === '150'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                150%
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Fermer (Échap)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Canvas Workspace */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-slate-100/70 dark:bg-slate-950 relative checkerboard-pattern">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <div className="w-8 h-8 border-3 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Calcul du rendu HD avec anticrénelage...</p>
            </div>
          ) : previewUrl ? (
            <div
              className={`transition-all duration-200 flex items-center justify-center ${
                zoomMode === 'fit'
                  ? 'max-w-full max-h-full'
                  : zoomMode === '100'
                  ? 'w-auto h-auto'
                  : 'scale-150 transform-gpu'
              }`}
            >
              <img
                src={previewUrl}
                alt="Aperçu du rendu final avant export"
                className={`rounded-lg object-contain shadow-2xl border border-black/5 dark:border-white/10 ${
                  zoomMode === 'fit' ? 'max-h-[60vh] max-w-[85vw]' : ''
                }`}
                style={{ imageRendering: 'auto' }}
              />
            </div>
          ) : (
            <p className="text-xs text-rose-500">Impossible de générer l'aperçu de l'image.</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-black/[0.08] dark:border-white/[0.08] bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm select-none">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <FileCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Fichier : <strong className="font-mono text-slate-800 dark:text-slate-200">{settings.exportFileName || 'focusframe-export'}.png</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Copy button */}
            <button
              type="button"
              onClick={onCopyClipboard}
              className="py-2.5 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              {copiedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier l'image</span>
                </>
              )}
            </button>

            {/* Save as folder */}
            <button
              type="button"
              disabled={isDownloading || isLoading}
              onClick={() => handleDownload(true)}
              className="py-2.5 px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              <FolderDown className="w-3.5 h-3.5" />
              <span>Enregistrer sous...</span>
            </button>

            {/* Direct download PNG */}
            <button
              type="button"
              disabled={isDownloading || isLoading}
              onClick={() => handleDownload(false)}
              className="flex-1 sm:flex-none py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md disabled:opacity-50 active:scale-98"
            >
              {isDownloading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Exportation...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger PNG</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
