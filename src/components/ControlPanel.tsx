import React, { useRef, useState } from 'react';
import {
  FrameSettings,
  BackgroundType,
  ShadowStyle,
  BorderStyle,
  ExportFormatPreset,
  ZoneMode,
  BlurStyle,
} from '../types';
import {
  GRADIENT_PRESETS,
  SOLID_PRESETS,
  SAMPLE_IMAGES,
} from '../presets';
import {
  Upload,
  Layers,
  Square,
  Sparkles,
  Download,
  RotateCcw,
  Sliders,
  Eye,
  Crosshair,
  Copy,
  Check,
  Palette,
  Image as ImageIcon,
  Magnet,
  Maximize2,
  Scaling,
  Monitor,
  FolderDown,
  FolderOpen,
  ChevronDown,
  Plus,
  Trash2,
  Droplet,
  EyeOff,
} from 'lucide-react';
import { PreciseNumberInput } from './PreciseNumberInput';
import { FocusRect } from '../types';

interface ControlPanelProps {
  settings: FrameSettings;
  screenDimensions?: { width: number; height: number };
  onUpdateSettings: (settings: Partial<FrameSettings>) => void;
  onUpdateFocus: (focus: Partial<FocusRect>, targetIndex?: number) => void;
  onSelectActiveFocus?: (index: number) => void;
  onAddFocusZone?: () => void;
  onAddBlurZone?: () => void;
  onRemoveFocusZone?: (index: number) => void;
  onDuplicateFocusZone?: (index: number) => void;
  onImportImage: (file: File) => void;
  onSelectSample: (sampleId: string) => void;
  onExport: (chooseDirectory?: boolean) => void;
  onCopyClipboard: () => void;
  onReset: () => void;
  isExporting: boolean;
  copiedSuccess: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  screenDimensions = { width: 204, height: 450 },
  onUpdateSettings,
  onUpdateFocus,
  onSelectActiveFocus,
  onAddFocusZone,
  onAddBlurZone,
  onRemoveFocusZone,
  onDuplicateFocusZone,
  onImportImage,
  onSelectSample,
  onExport,
  onCopyClipboard,
  onReset,
  isExporting,
  copiedSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [unit, setUnit] = useState<'px' | '%'>('px');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    source: false, // Toutes les sections fermées par défaut
    container: false,
    focus: false,
    export: false,
  });

  const allFocuses = settings.focuses && settings.focuses.length > 0 ? settings.focuses : [settings.focus];
  const activeFocusIndex = Math.max(0, Math.min(allFocuses.length - 1, settings.activeFocusIndex ?? 0));
  const focus = allFocuses[activeFocusIndex] || settings.focus;

  const updateActiveFocus = (updates: Partial<FocusRect>) => {
    onUpdateFocus(updates, activeFocusIndex);
  };

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const screenW = screenDimensions.width || 204;
  const screenH = screenDimensions.height || 450;

  // Convert percentage state to pixels for display (supports decimals e.g. 20.5)
  const focusXPx = Math.round(((focus.x / 100) * screenW) * 10) / 10;
  const focusYPx = Math.round(((focus.y / 100) * screenH) * 10) / 10;
  const focusWPx = Math.round(((focus.width / 100) * screenW) * 10) / 10;
  const focusHPx = Math.round(((focus.height / 100) * screenH) * 10) / 10;

  const handleCenterHorizontal = () => {
    onUpdateFocus({
      x: Math.round(((100 - focus.width) / 2) * 10) / 10,
    });
  };

  const handleCenterVertical = () => {
    onUpdateFocus({
      y: Math.round(((100 - focus.height) / 2) * 10) / 10,
    });
  };

  const handleCenterBoth = () => {
    onUpdateFocus({
      x: Math.round(((100 - focus.width) / 2) * 10) / 10,
      y: Math.round(((100 - focus.height) / 2) * 10) / 10,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportImage(e.target.files[0]);
    }
  };

  return (
    <div
      id="control-panel"
      className="w-full macos-window overflow-hidden flex flex-col"
    >
      {/* Panel Header (macOS Smoked Glass Style) */}
      <div className="p-4 px-5 macos-panel-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 shadow-xs" />
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-slate-900 uppercase">Paramètres du Studio</h2>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide">Configuration & Précision</p>
          </div>
        </div>

        <button
          id="btn-reset-settings"
          type="button"
          onClick={onReset}
          className="macos-btn-white px-3 py-1.5 text-xs text-slate-700 flex items-center gap-1.5 font-medium cursor-pointer"
          title="Réinitialiser les réglages par défaut"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Réinitialiser</span>
        </button>
      </div>

      <div className="p-5 space-y-6 overflow-y-auto max-h-[calc(100vh-160px)]">
        {/* ================= SECTION 1: SOURCE ASSETS / IMPORT ================= */}
        <section className="space-y-3">
          <button
            type="button"
            onClick={() => toggleSection('source')}
            className="w-full flex items-center justify-between text-left group cursor-pointer select-none"
            aria-expanded={openSections.source}
          >
            <h3 className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 uppercase tracking-wider transition-colors">
              1. Capture Source
            </h3>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
                openSections.source ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </button>

          {openSections.source && (
            <div className="grid grid-cols-1 gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                id="file-upload-input"
              />
              <button
                id="btn-upload-screenshot"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 macos-btn-white text-sm font-medium text-slate-900 transition-all cursor-pointer active:scale-[0.99]"
              >
                <Upload className="w-4 h-4 text-slate-700" />
                <span>Importer Screenshot</span>
              </button>
            </div>
          )}
        </section>

        {/* ================= SECTION 2: CADRE & FOND ================= */}
        <section className="pt-4 border-t border-black/[0.06] space-y-4">
          <button
            type="button"
            onClick={() => toggleSection('container')}
            className="w-full flex items-center justify-between text-left group cursor-pointer select-none"
            aria-expanded={openSections.container}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 uppercase tracking-wider transition-colors">
                2. Style du Conteneur
              </h3>
              {!openSections.container && (
                <span className="text-[10px] text-slate-400 font-mono bg-black/[0.04] px-1.5 py-0.5 rounded">
                  Fermé
                </span>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
                openSections.container ? 'rotate-0' : '-rotate-90'
              }`}
            />
          </button>

          {openSections.container && (
            <div className="space-y-4">
              {/* Type de fond : Toujours Transparent */}
              <div className="flex items-center justify-between p-3 macos-card text-xs">
                <span className="text-slate-700 font-medium flex items-center gap-1.5">
                  <span>🏁</span>
                  <span>Remplissage de fond</span>
                </span>
                <span className="text-[11px] font-mono font-semibold text-slate-800 bg-white/95 px-2.5 py-0.5 rounded-md border border-black/10 shadow-2xs">
                  Transparent (PNG)
                </span>
              </div>

          {/* Ombre portée personnalisée */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-800 block">Ombre portée</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-shadow-reset-default"
                  onClick={() =>
                    onUpdateSettings({
                      shadow: 'lg',
                      shadowSettings: {
                        enabled: true,
                        color: '#000000',
                        opacity: 0.50,
                        offsetX: 2,
                        offsetY: 3,
                        blur: 9,
                      },
                    })
                  }
                  className="text-[10px] text-slate-600 hover:text-slate-900 font-medium cursor-pointer underline"
                >
                  Défaut (X: 2, Y: 3, Blur: 9, 50%)
                </button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="toggle-shadow-enabled"
                    type="checkbox"
                    checked={settings.shadowSettings ? settings.shadowSettings.enabled : settings.shadow !== 'none'}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      onUpdateSettings({
                        shadow: enabled ? 'lg' : 'none',
                        shadowSettings: {
                          ...(settings.shadowSettings || {
                            color: '#000000',
                            opacity: 0.50,
                            offsetX: 2,
                            offsetY: 3,
                            blur: 9,
                          }),
                          enabled,
                        },
                      });
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-slate-900 shadow-inner"></div>
                </label>
              </div>
            </div>

            {(settings.shadowSettings ? settings.shadowSettings.enabled : settings.shadow !== 'none') && (
              <div className="space-y-2.5 p-3.5 macos-card text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Couleur & Opacité */}
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-700 font-medium">Couleur</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={settings.shadowSettings?.color || '#000000'}
                        onChange={(e) =>
                          onUpdateSettings({
                            shadowSettings: {
                              ...(settings.shadowSettings || {
                                enabled: true,
                                opacity: 0.50,
                                offsetX: 2,
                                offsetY: 3,
                                blur: 9,
                              }),
                              color: e.target.value,
                            },
                          })
                        }
                        className="w-7 h-7 rounded-md border border-black/10 cursor-pointer p-0.5 shadow-2xs"
                      />
                      <span className="font-mono text-[11px] text-slate-700 uppercase">
                        {settings.shadowSettings?.color || '#000000'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-600 font-medium">Opacité</span>
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="1"
                          value={Math.round((settings.shadowSettings?.opacity ?? 0.50) * 100)}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, Number(e.target.value) || 0)) / 100;
                            onUpdateSettings({
                              shadowSettings: {
                                ...(settings.shadowSettings || {
                                  enabled: true,
                                  color: '#000000',
                                  offsetX: 2,
                                  offsetY: 3,
                                  blur: 9,
                                }),
                                opacity: val,
                              },
                            });
                          }}
                          className="w-12 h-5 text-center font-mono font-semibold text-[11px] macos-input"
                        />
                        <span className="text-slate-400 font-mono text-[10px]">%</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={settings.shadowSettings?.opacity ?? 0.50}
                      onChange={(e) =>
                        onUpdateSettings({
                          shadowSettings: {
                            ...(settings.shadowSettings || {
                              enabled: true,
                              color: '#000000',
                              offsetX: 2,
                              offsetY: 3,
                              blur: 9,
                            }),
                            opacity: Number(e.target.value),
                          },
                        })
                      }
                      className="macos-slider"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {/* Décalage X */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Cote X</span>
                      <input
                        type="number"
                        min="-50"
                        max="50"
                        step="1"
                        value={settings.shadowSettings?.offsetX ?? 2}
                        onChange={(e) =>
                          onUpdateSettings({
                            shadowSettings: {
                              ...(settings.shadowSettings || {
                                enabled: true,
                                color: '#000000',
                                opacity: 0.50,
                                offsetY: 3,
                                blur: 9,
                              }),
                              offsetX: Number(e.target.value),
                            },
                          })
                        }
                        className="w-10 h-5 text-center font-mono font-semibold text-[10.5px] macos-input"
                      />
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="30"
                      step="1"
                      value={settings.shadowSettings?.offsetX ?? 2}
                      onChange={(e) =>
                        onUpdateSettings({
                          shadowSettings: {
                            ...(settings.shadowSettings || {
                              enabled: true,
                              color: '#000000',
                              opacity: 0.50,
                              offsetY: 3,
                              blur: 9,
                            }),
                            offsetX: Number(e.target.value),
                          },
                        })
                      }
                      className="macos-slider"
                    />
                  </div>

                  {/* Décalage Y */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Cote Y</span>
                      <input
                        type="number"
                        min="-50"
                        max="50"
                        step="1"
                        value={settings.shadowSettings?.offsetY ?? 3}
                        onChange={(e) =>
                          onUpdateSettings({
                            shadowSettings: {
                              ...(settings.shadowSettings || {
                                enabled: true,
                                color: '#000000',
                                opacity: 0.50,
                                offsetX: 2,
                                blur: 9,
                              }),
                              offsetY: Number(e.target.value),
                            },
                          })
                        }
                        className="w-10 h-5 text-center font-mono font-semibold text-[10.5px] macos-input"
                      />
                    </div>
                    <input
                      type="range"
                      min="-20"
                      max="30"
                      step="1"
                      value={settings.shadowSettings?.offsetY ?? 3}
                      onChange={(e) =>
                        onUpdateSettings({
                          shadowSettings: {
                            ...(settings.shadowSettings || {
                              enabled: true,
                              color: '#000000',
                              opacity: 0.50,
                              offsetX: 2,
                              blur: 9,
                            }),
                            offsetY: Number(e.target.value),
                          },
                        })
                      }
                      className="macos-slider"
                    />
                  </div>

                  {/* Atténuation (Blur) */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>Atténuation</span>
                      <input
                        type="number"
                        min="0"
                        max="60"
                        step="1"
                        value={settings.shadowSettings?.blur ?? 9}
                        onChange={(e) =>
                          onUpdateSettings({
                            shadowSettings: {
                              ...(settings.shadowSettings || {
                                enabled: true,
                                color: '#000000',
                                opacity: 0.50,
                                offsetX: 2,
                                offsetY: 3,
                              }),
                              blur: Number(e.target.value),
                            },
                          })
                        }
                        className="w-10 h-5 text-center font-mono font-semibold text-[10.5px] macos-input"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="1"
                      value={settings.shadowSettings?.blur ?? 9}
                      onChange={(e) =>
                        onUpdateSettings({
                          shadowSettings: {
                            ...(settings.shadowSettings || {
                              enabled: true,
                              color: '#000000',
                              opacity: 0.50,
                              offsetX: 2,
                              offsetY: 3,
                            }),
                            blur: Number(e.target.value),
                          },
                        })
                      }
                      className="macos-slider"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Curseur: Border-radius du conteneur */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-700 font-medium">Border Radius (Conteneur)</span>
              <span className="text-slate-500 font-mono text-[11px]">{settings.borderRadius}px</span>
            </div>
            <input
              id="slider-container-radius"
              type="range"
              min="0"
              max="40"
              step="1"
              value={settings.borderRadius}
              onChange={(e) => onUpdateSettings({ borderRadius: Number(e.target.value) })}
              className="macos-slider"
            />
          </div>

          {/* Marge de sécurité du cadre (12px obligatoire) */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-700 font-medium">Marge de sécurité du cadre</span>
              <span className="text-slate-700 font-mono font-semibold bg-black/[0.04] border border-black/10 px-2 py-0.5 rounded text-[11px]">
                12px (Fixe)
              </span>
            </div>
            <p className="text-[10.5px] text-slate-500">
              Marge de sécurité obligatoirement fixée à 12px pour garantir un cadrage parfait sans coupure.
            </p>
          </div>

          {/* Style d'atténuation (Sombre vs Clair) */}
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-700 font-medium">Style d'atténuation du fond</span>
              <span className="text-slate-400 font-mono text-[11px]">{settings.dimmingType === 'light' ? 'Blanc / Clair' : 'Noir / Sombre (macOS)'}</span>
            </div>
            <div className="macos-segmented p-1 grid grid-cols-2 gap-1">
              <button
                type="button"
                id="btn-dimming-dark"
                onClick={() => onUpdateSettings({ dimmingType: 'dark' })}
                className={`py-1.5 px-2.5 rounded-md text-xs font-medium cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  settings.dimmingType !== 'light'
                    ? 'macos-segmented-item-active text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-black inline-block shadow-2xs" />
                <span>Sombre (macOS)</span>
              </button>

              <button
                type="button"
                id="btn-dimming-light"
                onClick={() => onUpdateSettings({ dimmingType: 'light' })}
                className={`py-1.5 px-2.5 rounded-md text-xs font-medium cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  settings.dimmingType === 'light'
                    ? 'macos-segmented-item-active text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-black/20 inline-block shadow-2xs" />
                <span>Clair (Blanc)</span>
              </button>
            </div>
          </div>

          {/* Curseur: Opacité globale du screenshot */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-700 font-medium">Opacité de l'arrière-plan</span>
              <span className="text-slate-500 font-mono text-[11px]">{Math.round(settings.screenshotOpacity * 100)}%</span>
            </div>
            <input
              id="slider-screenshot-opacity"
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={settings.screenshotOpacity}
              onChange={(e) => onUpdateSettings({ screenshotOpacity: Number(e.target.value) })}
              className="macos-slider"
            />
          </div>

          {/* Curseur: Flou d'arrière-plan du screenshot (Background Blur) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-700 font-medium flex items-center gap-1.5">
                <Droplet className="w-3.5 h-3.5 text-blue-500" />
                <span>Flou de l'arrière-plan</span>
              </span>
              <span className="text-slate-600 font-mono font-semibold text-[11px]">
                {settings.backgroundBlur ? `${settings.backgroundBlur}px` : 'Désactivé (0px)'}
              </span>
            </div>
            <input
              id="slider-background-blur"
              type="range"
              min="0"
              max="20"
              step="1"
              value={settings.backgroundBlur || 0}
              onChange={(e) => onUpdateSettings({ backgroundBlur: Number(e.target.value) })}
              className="macos-slider"
            />
            <div className="flex gap-1.5 pt-0.5">
              {[
                { label: '0px (Net)', val: 0 },
                { label: '4px (Léger)', val: 4 },
                { label: '8px (Moyen)', val: 8 },
                { label: '14px (Intense)', val: 14 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onUpdateSettings({ backgroundBlur: preset.val })}
                  className={`text-[10px] px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                    (settings.backgroundBlur || 0) === preset.val
                      ? 'bg-blue-600 text-white border-blue-600 font-medium shadow-2xs'
                      : 'bg-white/80 text-slate-700 border-black/10 hover:bg-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Arrondi du screenshot intérieur */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-700 font-medium">Rayon des coins du screenshot</span>
              <span className="text-slate-600 font-mono font-semibold text-[11px]">{settings.screenshotRadius}px</span>
            </div>
            <input
              id="slider-screenshot-radius"
              type="range"
              min="0"
              max="32"
              step="1"
              value={settings.screenshotRadius}
              onChange={(e) => onUpdateSettings({ screenshotRadius: Number(e.target.value) })}
              className="macos-slider"
            />
            <div className="flex gap-1.5 pt-0.5">
              {[
                { label: '0px', val: 0 },
                { label: '8px', val: 8 },
                { label: '15px (Défaut)', val: 15 },
                { label: '24px', val: 24 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onUpdateSettings({ screenshotRadius: preset.val })}
                  className={`text-[10px] px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                    settings.screenshotRadius === preset.val
                      ? 'bg-slate-900 text-white border-slate-900 font-medium shadow-2xs'
                      : 'bg-white/80 text-slate-700 border-black/10 hover:bg-white'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
            </div>
          )}
        </section>

        {/* ================= SECTION 3: FOCUS ZONE ================= */}
        <section className="pt-4 border-t border-black/[0.06] space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => toggleSection('focus')}
              className="flex items-center gap-2 text-left group cursor-pointer select-none"
              aria-expanded={openSections.focus}
            >
              <h3 className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 uppercase tracking-wider transition-colors">
                3. Zone de Focus (100% Opacité)
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-black/[0.05] border border-black/10 text-slate-700 text-[10px] font-mono font-semibold">
                {unit.toUpperCase()}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
                  openSections.focus ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>

            {/* macOS Switch */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="toggle-focus-enabled"
                type="checkbox"
                checked={focus.enabled}
                onChange={(e) => onUpdateFocus({ enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-slate-900 shadow-inner"></div>
            </label>
          </div>

          {openSections.focus && (
            <>
              {focus.enabled ? (
            <div className="space-y-4 macos-card p-4 rounded-xl">
              {/* Multi-Zone Focus Header & Selector */}
              <div className="flex flex-col gap-2 bg-white/90 p-2.5 rounded-xl border border-black/10 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Zones actives ({allFocuses.length})
                  </span>
                  <div className="flex items-center gap-1.5">
                    {onAddFocusZone && (
                      <button
                        type="button"
                        id="btn-add-new-zone"
                        onClick={onAddFocusZone}
                        className="px-2 py-0.5 text-[11px] font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Plus className="w-3 h-3" />
                        <span>+ Focus</span>
                      </button>
                    )}
                    {onAddBlurZone && (
                      <button
                        type="button"
                        id="btn-add-blur-zone"
                        onClick={onAddBlurZone}
                        className="px-2 py-0.5 text-[11px] font-medium bg-sky-600 hover:bg-sky-700 text-white rounded-md flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                      >
                        <Droplet className="w-3 h-3" />
                        <span>+ Flou</span>
                      </button>
                    )}
                    {allFocuses.length > 1 && onDuplicateFocusZone && (
                      <button
                        type="button"
                        id="btn-dup-zone"
                        onClick={() => onDuplicateFocusZone(activeFocusIndex)}
                        title="Dupliquer la zone active"
                        className="px-1.5 py-0.5 text-[11px] text-slate-600 hover:text-slate-900 bg-black/[0.04] hover:bg-black/[0.08] rounded-md flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                    {allFocuses.length > 1 && onRemoveFocusZone && (
                      <button
                        type="button"
                        id="btn-del-zone"
                        onClick={() => onRemoveFocusZone(activeFocusIndex)}
                        title="Supprimer la zone active"
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Zone switcher tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  {allFocuses.map((f, idx) => (
                    <button
                      key={f.id || `zone-tab-${idx}`}
                      type="button"
                      onClick={() => onSelectActiveFocus?.(idx)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                        idx === activeFocusIndex
                          ? f.mode === 'blur'
                            ? 'bg-sky-700 text-white shadow-xs'
                            : 'bg-slate-900 text-white shadow-xs'
                          : 'bg-black/[0.04] text-slate-700 hover:bg-black/[0.08]'
                      }`}
                    >
                      <span>{f.mode === 'blur' ? '💧' : '🎯'}</span>
                      <span>{f.name || `Zone ${idx + 1}`}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Selector for Active Zone (Focus vs Flou) */}
              <div className="space-y-1.5 bg-white/90 p-2.5 rounded-xl border border-black/10 shadow-2xs">
                <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider">
                  <span className="font-semibold">Type d'effet de la zone</span>
                  <span className="font-mono font-bold text-[11px] text-slate-800">
                    {focus.mode === 'blur' ? 'Floutage / Censure' : 'Mise en valeur (Focus)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  {/* Focus Mode Button */}
                  <button
                    type="button"
                    id="zone-mode-focus"
                    onClick={() => {
                      updateActiveFocus({
                        mode: 'focus',
                        name: focus.name?.replace('Zone Flou', 'Zone Focus') || 'Zone Focus',
                        showBorder: true,
                        borderColor: '#cc0000',
                      });
                      if (settings.screenshotOpacity === 1.0) {
                        onUpdateSettings({ screenshotOpacity: 0.35 });
                      }
                    }}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all flex items-center justify-center gap-2 ${
                      focus.mode !== 'blur'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white/80 text-slate-700 border-black/10 hover:bg-white'
                    }`}
                  >
                    <span className="text-sm">🎯</span>
                    <div className="text-left">
                      <div className="font-semibold text-[11px]">Mode Focus</div>
                      <div className={`text-[9px] ${focus.mode !== 'blur' ? 'text-slate-300' : 'text-slate-500'}`}>
                        Mise en valeur nette
                      </div>
                    </div>
                  </button>

                  {/* Blur Mode Button */}
                  <button
                    type="button"
                    id="zone-mode-blur"
                    onClick={() => {
                      const hasOtherFocusZones = allFocuses.some(
                        (f, idx) => idx !== activeFocusIndex && f.enabled && f.mode !== 'blur'
                      );
                      updateActiveFocus({
                        mode: 'blur',
                        blurAmount: focus.blurAmount || 10,
                        blurOpacity: focus.blurOpacity ?? 1.0,
                        blurStyle: focus.blurStyle || 'gaussian',
                        name: focus.name?.replace('Zone Focus', 'Zone Flou') || 'Zone Flou',
                        showBorder: false,
                        borderColor: '#0284c7',
                      });
                      if (!hasOtherFocusZones && settings.screenshotOpacity < 1.0) {
                        onUpdateSettings({ screenshotOpacity: 1.0 });
                      }
                    }}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-all flex items-center justify-center gap-2 ${
                      focus.mode === 'blur'
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white/80 text-slate-700 border-black/10 hover:bg-white'
                    }`}
                  >
                    <Droplet className="w-4 h-4 text-sky-200" />
                    <div className="text-left">
                      <div className="font-semibold text-[11px]">Mode Flou</div>
                      <div className={`text-[9px] ${focus.mode === 'blur' ? 'text-sky-100' : 'text-slate-500'}`}>
                        Censure & Floutage
                      </div>
                    </div>
                  </button>
                </div>

                {/* If Blur Mode is Active: Blur Settings & Presets */}
                {focus.mode === 'blur' && (
                  <div className="mt-2.5 pt-2.5 border-t border-black/[0.08] space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-700 font-medium flex items-center gap-1">
                        <Droplet className="w-3.5 h-3.5 text-sky-600" />
                        <span>Intensité du flou</span>
                      </span>
                      <span className="text-sky-700 font-mono font-bold text-[11px]">
                        {focus.blurAmount ?? 10}px
                      </span>
                    </div>

                    <input
                      id="slider-zone-blur"
                      type="range"
                      min="2"
                      max="30"
                      step="1"
                      value={focus.blurAmount ?? 10}
                      onChange={(e) => updateActiveFocus({ blurAmount: Number(e.target.value) })}
                      className="macos-slider"
                    />

                    {/* Quick Blur Presets */}
                    <div className="flex gap-1 pt-0.5">
                      {[
                        { label: 'Léger (4px)', val: 4 },
                        { label: 'Normal (8px)', val: 8 },
                        { label: 'Fort (14px)', val: 14 },
                        { label: 'Secret (24px)', val: 24 },
                      ].map((bPreset) => (
                        <button
                          key={bPreset.label}
                          type="button"
                          onClick={() => updateActiveFocus({ blurAmount: bPreset.val })}
                          className={`text-[10px] px-2 py-1 rounded-md border transition-all cursor-pointer flex-1 text-center ${
                            (focus.blurAmount ?? 10) === bPreset.val
                              ? 'bg-sky-600 text-white border-sky-600 font-semibold shadow-2xs'
                              : 'bg-white/80 text-slate-700 border-black/10 hover:bg-white'
                          }`}
                        >
                          {bPreset.label}
                        </button>
                      ))}
                    </div>

                    {/* Style d'occultation */}
                    <div className="pt-1 space-y-1">
                      <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                        Style du flou :
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'gaussian', label: 'Gaussien' },
                          { id: 'frost', label: 'Dépoli' },
                          { id: 'dark', label: 'Sombre' },
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => updateActiveFocus({ blurStyle: st.id as BlurStyle })}
                            className={`text-[10px] py-1 px-1 rounded-md border transition-all cursor-pointer text-center ${
                              (focus.blurStyle || 'gaussian') === st.id
                                ? 'bg-slate-800 text-white border-slate-800 font-semibold shadow-2xs'
                                : 'bg-white/80 text-slate-700 border-black/10 hover:bg-white'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Opacité de la zone de flou */}
                    <div className="pt-1.5 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-700 font-medium flex items-center gap-1">
                          <span>Opacité du flou</span>
                        </span>
                        <span className="text-slate-700 font-mono font-bold text-[11px]">
                          {Math.round((focus.blurOpacity ?? 1) * 100)}%
                        </span>
                      </div>

                      <input
                        id="slider-zone-blur-opacity"
                        type="range"
                        min="0.05"
                        max="1"
                        step="0.05"
                        value={focus.blurOpacity ?? 1}
                        onChange={(e) => updateActiveFocus({ blurOpacity: Number(e.target.value) })}
                        className="macos-slider"
                      />

                      {/* Opacity presets */}
                      <div className="flex gap-1 pt-0.5">
                        {[
                          { label: '25%', val: 0.25 },
                          { label: '50%', val: 0.5 },
                          { label: '75%', val: 0.75 },
                          { label: '100%', val: 1.0 },
                        ].map((opPreset) => (
                          <button
                            key={opPreset.label}
                            type="button"
                            onClick={() => updateActiveFocus({ blurOpacity: opPreset.val })}
                            className={`text-[10px] px-1.5 py-0.5 rounded-md border transition-all cursor-pointer flex-1 text-center ${
                              Math.abs((focus.blurOpacity ?? 1) - opPreset.val) < 0.04
                                ? 'bg-slate-800 text-white border-slate-800 font-semibold shadow-2xs'
                                : 'bg-white/80 text-slate-700 border-black/10 hover:bg-white'
                            }`}
                          >
                            {opPreset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Unit Selector & Screen Dimensions info banner */}
              <div className="flex items-center justify-between bg-white/80 p-2 rounded-lg border border-black/10 text-xs">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <span className="text-[11px] font-medium text-slate-500">Unité :</span>
                  <div className="macos-segmented p-0.5 flex" role="group">
                    <button
                      type="button"
                      id="unit-toggle-px"
                      onClick={() => setUnit('px')}
                      className={`px-2.5 py-0.5 text-[11px] font-medium rounded-md cursor-pointer transition-all ${
                        unit === 'px'
                          ? 'macos-segmented-item-active text-slate-900 font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Pixels (px)
                    </button>
                    <button
                      type="button"
                      id="unit-toggle-pct"
                      onClick={() => setUnit('%')}
                      className={`px-2.5 py-0.5 text-[11px] font-medium rounded-md cursor-pointer transition-all ${
                        unit === '%'
                          ? 'macos-segmented-item-active text-slate-900 font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Pourcentage (%)
                    </button>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-500 text-right">
                  Screen : <strong className="text-slate-800">{screenW}×{screenH} px</strong>
                </div>
              </div>

              {/* Shape Selector for Focus Zone */}
              <div className="space-y-1.5 bg-white/80 p-2.5 rounded-lg border border-black/10">
                <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider">
                  <span className="font-semibold">Forme de la zone focus</span>
                  <span className="text-slate-800 font-mono font-bold text-[11px]">
                    {focus.shape === 'circle'
                      ? 'Rond / Cercle'
                      : (focus.width > focus.height)
                      ? 'Pilule Horizontale'
                      : 'Pilule Verticale (35px)'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  {/* Pilule Verticale */}
                  <button
                    type="button"
                    id="shape-btn-pill-v"
                    onClick={() => {
                      const pillWidthPct = (35 / screenW) * 100;
                      const pillHeightPct = (128 / screenH) * 100;
                      const pillXPct = ((screenW - 35) / 2 / screenW) * 100;
                      const pillYPct = ((screenH - 128) / 2 / screenH) * 100;
                      onUpdateFocus({
                        shape: 'pill',
                        radius: 999,
                        width: Math.round(pillWidthPct * 10) / 10,
                        height: Math.round(pillHeightPct * 10) / 10,
                        x: Math.round(pillXPct * 10) / 10,
                        y: Math.round(pillYPct * 10) / 10,
                        margin: 5,
                      });
                    }}
                    className={`py-2 px-1 rounded-lg border text-xs font-medium cursor-pointer transition-all flex flex-col items-center justify-center gap-1 text-center ${
                      (focus.shape === 'pill' || !focus.shape) && (focus.height >= focus.width)
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white/90 text-slate-700 border-black/10 hover:bg-white'
                    }`}
                  >
                    <div className={`w-2.5 h-4.5 rounded-full border ${
                      (focus.shape === 'pill' || !focus.shape) && (focus.height >= focus.width)
                        ? 'border-white bg-white/30'
                        : 'border-slate-500 bg-slate-100'
                    }`} />
                    <span className="text-[10px] leading-tight">Pilule V (35×128)</span>
                  </button>

                  {/* Pilule Horizontale */}
                  <button
                    type="button"
                    id="shape-btn-pill-h"
                    onClick={() => {
                      const pillHeightPct = (35 / screenH) * 100;
                      const pillWidthPct = ((screenW + 10) / screenW) * 100;
                      const pillXPct = (-5 / screenW) * 100;
                      onUpdateFocus({
                        shape: 'pill',
                        radius: 999,
                        width: Math.round(pillWidthPct * 10) / 10,
                        height: Math.round(pillHeightPct * 10) / 10,
                        x: Math.round(pillXPct * 10) / 10,
                        y: 35,
                        margin: 5,
                      });
                    }}
                    className={`py-2 px-1 rounded-lg border text-xs font-medium cursor-pointer transition-all flex flex-col items-center justify-center gap-1 text-center ${
                      (focus.shape === 'pill' || !focus.shape) && (focus.width > focus.height)
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white/90 text-slate-700 border-black/10 hover:bg-white'
                    }`}
                  >
                    <div className={`w-5 h-2.5 rounded-full border ${
                      (focus.shape === 'pill' || !focus.shape) && (focus.width > focus.height)
                        ? 'border-white bg-white/30'
                        : 'border-slate-500 bg-slate-100'
                    }`} />
                    <span className="text-[10px] leading-tight">Pilule H (35px)</span>
                  </button>

                  {/* Rond / Cercle (55px x 55px) */}
                  <button
                    type="button"
                    id="shape-btn-circle"
                    onClick={() => {
                      const circleSizeWPct = (55 / screenW) * 100;
                      const circleSizeHPct = (55 / screenH) * 100;
                      const currentCenterX = focus.x + focus.width / 2;
                      const currentCenterY = focus.y + focus.height / 2;
                      const newX = currentCenterX - circleSizeWPct / 2;
                      const newY = currentCenterY - circleSizeHPct / 2;
                      onUpdateFocus({
                        shape: 'circle',
                        width: Math.round(circleSizeWPct * 10) / 10,
                        height: Math.round(circleSizeHPct * 10) / 10,
                        x: Math.round(newX * 10) / 10,
                        y: Math.round(newY * 10) / 10,
                        margin: 0,
                      });
                    }}
                    className={`py-2 px-1 rounded-lg border text-xs font-medium cursor-pointer transition-all flex flex-col items-center justify-center gap-1 text-center ${
                      focus.shape === 'circle'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white/90 text-slate-700 border-black/10 hover:bg-white'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border ${focus.shape === 'circle' ? 'border-white bg-white/30' : 'border-slate-500 bg-slate-100'}`} />
                    <span className="text-[10px] leading-tight">Rond (55px)</span>
                  </button>
                </div>
              </div>

              {/* Magnétisme & Repères de centrage switch */}
              <div className="flex items-center justify-between bg-white/80 p-2.5 rounded-lg border border-black/10">
                <div className="flex items-center gap-2">
                  <Magnet className={`w-3.5 h-3.5 ${focus.snapEnabled !== false ? 'text-slate-900' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Magnétisme & Repères de centrage
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Lignes guides visuelles & attraction automatique aux axes X et Y
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="toggle-snap-enabled"
                    type="checkbox"
                    checked={focus.snapEnabled !== false}
                    onChange={(e) => onUpdateFocus({ snapEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-slate-900 shadow-inner"></div>
                </label>
              </div>

              {/* Afficher / Masquer les poignées switch */}
              <div className="flex items-center justify-between bg-white/80 p-2.5 rounded-lg border border-black/10">
                <div className="flex items-center gap-2">
                  <Maximize2 className={`w-3.5 h-3.5 ${focus.showHandles !== false ? 'text-slate-900' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      Poignées de redimensionnement
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Afficher les petits carrés de manipulation sur la forme
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="toggle-show-handles"
                    type="checkbox"
                    checked={focus.showHandles !== false}
                    onChange={(e) => onUpdateFocus({ showHandles: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-slate-900 shadow-inner"></div>
                </label>
              </div>

              {/* Manual numeric inputs & Sliders for Position X and Position Y */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider">
                    <span className="font-semibold">Position X</span>
                    <div className="flex items-center gap-0.5">
                      <PreciseNumberInput
                        id="input-focus-x"
                        min={unit === 'px' ? -400 : -200}
                        max={unit === 'px' ? 800 : 300}
                        value={unit === 'px' ? focusXPx : focus.x}
                        onChange={(num) => {
                          const newXPct = unit === 'px' ? (num / screenW) * 100 : num;
                          onUpdateFocus({ x: Math.round(newXPct * 1000) / 1000 });
                        }}
                        className="w-16 h-6 px-1 text-center font-mono font-semibold text-xs macos-input"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">{unit}</span>
                    </div>
                  </div>
                  <input
                    id="slider-focus-x"
                    type="range"
                    min={unit === 'px' ? Math.round(-screenW * 0.4) : -50}
                    max={unit === 'px' ? Math.round(screenW * 1.3) : 150}
                    step="0.5"
                    value={unit === 'px' ? focusXPx : focus.x}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      const newXPct = unit === 'px' ? (num / screenW) * 100 : num;
                      onUpdateFocus({ x: Math.round(newXPct * 1000) / 1000 });
                    }}
                    className="macos-slider"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>{unit === 'px' ? `${Math.round(-screenW * 0.4)}px` : '-50%'}</span>
                    <span>{unit === 'px' ? `${Math.round(screenW * 1.3)}px` : '150%'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider">
                    <span className="font-semibold">Position Y</span>
                    <div className="flex items-center gap-0.5">
                      <PreciseNumberInput
                        id="input-focus-y"
                        min={unit === 'px' ? -400 : -200}
                        max={unit === 'px' ? 1200 : 300}
                        value={unit === 'px' ? focusYPx : focus.y}
                        onChange={(num) => {
                          const newYPct = unit === 'px' ? (num / screenH) * 100 : num;
                          onUpdateFocus({ y: Math.round(newYPct * 1000) / 1000 });
                        }}
                        className="w-16 h-6 px-1 text-center font-mono font-semibold text-xs macos-input"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">{unit}</span>
                    </div>
                  </div>
                  <input
                    id="slider-focus-y"
                    type="range"
                    min={unit === 'px' ? Math.round(-screenH * 0.4) : -50}
                    max={unit === 'px' ? Math.round(screenH * 1.3) : 150}
                    step="0.5"
                    value={unit === 'px' ? focusYPx : focus.y}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      const newYPct = unit === 'px' ? (num / screenH) * 100 : num;
                      onUpdateFocus({ y: Math.round(newYPct * 1000) / 1000 });
                    }}
                    className="macos-slider"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>{unit === 'px' ? `${Math.round(-screenH * 0.4)}px` : '-50%'}</span>
                    <span>{unit === 'px' ? `${Math.round(screenH * 1.3)}px` : '150%'}</span>
                  </div>
                </div>
              </div>

              {/* Manual numeric inputs & Sliders for Largeur (W) and Hauteur (H) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider">
                    <span className="font-semibold">Largeur (W)</span>
                    <div className="flex items-center gap-0.5">
                      <PreciseNumberInput
                        id="input-focus-width"
                        min={0.1}
                        max={unit === 'px' ? 1200 : 500}
                        value={unit === 'px' ? focusWPx : focus.width}
                        onChange={(num) => {
                          const newWPct = unit === 'px' ? (num / screenW) * 100 : num;
                          const currentCenterX = focus.x + focus.width / 2;
                          const clampedW = Math.max(0.1, newWPct);
                          const newX = currentCenterX - clampedW / 2;
                          onUpdateFocus({
                            width: Math.round(clampedW * 1000) / 1000,
                            x: Math.round(newX * 1000) / 1000,
                          });
                        }}
                        className="w-16 h-6 px-1 text-center font-mono font-semibold text-xs macos-input"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">{unit}</span>
                    </div>
                  </div>
                  <input
                    id="slider-focus-width"
                    type="range"
                    min="1"
                    max={unit === 'px' ? Math.round(screenW * 1.8) : 200}
                    step="0.5"
                    value={unit === 'px' ? focusWPx : focus.width}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      const newWPct = unit === 'px' ? (num / screenW) * 100 : num;
                      const currentCenterX = focus.x + focus.width / 2;
                      const clampedW = Math.max(0.1, newWPct);
                      const newX = currentCenterX - clampedW / 2;
                      onUpdateFocus({
                        width: Math.round(clampedW * 1000) / 1000,
                        x: Math.round(newX * 1000) / 1000,
                      });
                    }}
                    className="macos-slider"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>{unit === 'px' ? '1px' : '1%'}</span>
                    <span>{unit === 'px' ? `${Math.round(screenW * 1.8)}px` : '200%'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider">
                    <span className="font-semibold">Hauteur (H)</span>
                    <div className="flex items-center gap-0.5">
                      <PreciseNumberInput
                        id="input-focus-height"
                        min={0.1}
                        max={unit === 'px' ? 1500 : 500}
                        value={unit === 'px' ? focusHPx : focus.height}
                        onChange={(num) => {
                          const newHPct = unit === 'px' ? (num / screenH) * 100 : num;
                          const currentCenterY = focus.y + focus.height / 2;
                          const clampedH = Math.max(0.1, newHPct);
                          const newY = currentCenterY - clampedH / 2;
                          onUpdateFocus({
                            height: Math.round(clampedH * 1000) / 1000,
                            y: Math.round(newY * 1000) / 1000,
                          });
                        }}
                        className="w-16 h-6 px-1 text-center font-mono font-semibold text-xs macos-input"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">{unit}</span>
                    </div>
                  </div>
                  <input
                    id="slider-focus-height"
                    type="range"
                    min="1"
                    max={unit === 'px' ? Math.round(screenH * 1.8) : 200}
                    step="0.5"
                    value={unit === 'px' ? focusHPx : focus.height}
                    onChange={(e) => {
                      const num = Number(e.target.value);
                      const newHPct = unit === 'px' ? (num / screenH) * 100 : num;
                      const currentCenterY = focus.y + focus.height / 2;
                      const clampedH = Math.max(0.1, newHPct);
                      const newY = currentCenterY - clampedH / 2;
                      onUpdateFocus({
                        height: Math.round(clampedH * 1000) / 1000,
                        y: Math.round(newY * 1000) / 1000,
                      });
                    }}
                    className="macos-slider"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-slate-400">
                    <span>{unit === 'px' ? '1px' : '1%'}</span>
                    <span>{unit === 'px' ? `${Math.round(screenH * 1.8)}px` : '200%'}</span>
                  </div>
                </div>
              </div>

              {/* Raccourcis d'alignement et centrage avec repères */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                  Alignements & Centrage Magnétique
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    id="btn-center-x"
                    onClick={handleCenterHorizontal}
                    className="text-[10px] px-2 py-1.5 rounded-md border border-black/10 bg-white/90 text-slate-800 hover:bg-white transition-all cursor-pointer font-medium flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <span>🎯</span> Centrer X
                  </button>
                  <button
                    type="button"
                    id="btn-center-y"
                    onClick={handleCenterVertical}
                    className="text-[10px] px-2 py-1.5 rounded-md border border-black/10 bg-white/90 text-slate-800 hover:bg-white transition-all cursor-pointer font-medium flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <span>🎯</span> Centrer Y
                  </button>
                  <button
                    type="button"
                    id="btn-center-both"
                    onClick={handleCenterBoth}
                    className="text-[10px] px-2 py-1.5 rounded-md border border-black/10 bg-white/90 text-slate-800 hover:bg-white transition-all cursor-pointer font-medium flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <span>🎯</span> Recentrer
                  </button>
                </div>

                {/* Marge de débordement : Uniquement pour la forme Pilule */}
                {(focus.shape === 'pill' || !focus.shape) && (
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      <span>Marge de débordement ({focus.width > focus.height ? 'Pilule H' : 'Pilule V'})</span>
                      <div className="flex items-center gap-1">
                        <PreciseNumberInput
                          id="input-focus-margin-cote"
                          min={0}
                          max={60}
                          value={focus.margin ?? 5}
                          onChange={(newMargin) => {
                            const isHoriz = focus.width > focus.height;
                            if (isHoriz) {
                              const baseH = 35;
                              const baseW = screenW + 10;
                              const newHPx = baseH + newMargin * 2;
                              const newWPx = baseW + newMargin * 2;
                              const newWPct = (newWPx / screenW) * 100;
                              const newHPct = (newHPx / screenH) * 100;
                              const newXPct = ((-5 - newMargin) / screenW) * 100;
                              const currentCenterY = focus.y + focus.height / 2;
                              const newYPct = currentCenterY - newHPct / 2;
                              onUpdateFocus({
                                x: Math.round(newXPct * 1000) / 1000,
                                y: Math.max(0, Math.round(newYPct * 1000) / 1000),
                                width: Math.round(newWPct * 1000) / 1000,
                                height: Math.round(newHPct * 1000) / 1000,
                                margin: newMargin,
                                radius: 999,
                              });
                            } else {
                              const baseW = 35;
                              const baseH = 128;
                              const newWPx = baseW + newMargin * 2;
                              const newHPx = baseH + newMargin * 2;
                              const newWPct = (newWPx / screenW) * 100;
                              const newHPct = (newHPx / screenH) * 100;
                              const newXPct = ((screenW - newWPx) / 2 / screenW) * 100;
                              const currentCenterY = focus.y + focus.height / 2;
                              const newYPct = currentCenterY - newHPct / 2;
                              onUpdateFocus({
                                x: Math.round(newXPct * 1000) / 1000,
                                y: Math.max(0, Math.round(newYPct * 1000) / 1000),
                                width: Math.round(newWPct * 1000) / 1000,
                                height: Math.round(newHPct * 1000) / 1000,
                                margin: newMargin,
                                radius: 999,
                              });
                            }
                          }}
                          className="w-12 h-5 text-center font-mono font-semibold text-[10.5px] macos-input"
                        />
                        <span className="text-[10px] text-slate-400 font-mono">px</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-0.5">
                      {[
                        { label: '0px (Rogné)', val: 0 },
                        { label: '+5px (Défaut)', val: 5, highlight: true },
                        { label: '+10px', val: 10 },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          id={`btn-margin-${item.val}`}
                          onClick={() => {
                            const isHoriz = focus.width > focus.height;
                            if (isHoriz) {
                              const baseH = 35;
                              const baseW = screenW + 10;
                              const newHPx = baseH + item.val * 2;
                              const newWPx = baseW + item.val * 2;
                              const newWPct = (newWPx / screenW) * 100;
                              const newHPct = (newHPx / screenH) * 100;
                              const newXPct = ((-5 - item.val) / screenW) * 100;
                              const currentCenterY = focus.y + focus.height / 2;
                              const newYPct = currentCenterY - newHPct / 2;
                              onUpdateFocus({
                                x: Math.round(newXPct * 10) / 10,
                                y: Math.max(0, Math.round(newYPct * 10) / 10),
                                width: Math.round(newWPct * 10) / 10,
                                height: Math.round(newHPct * 10) / 10,
                                margin: item.val,
                                radius: 999,
                              });
                            } else {
                              const baseW = 35;
                              const baseH = 128;
                              const newWPx = baseW + item.val * 2;
                              const newHPx = baseH + item.val * 2;
                              const newWPct = (newWPx / screenW) * 100;
                              const newHPct = (newHPx / screenH) * 100;
                              const newXPct = ((screenW - newWPx) / 2 / screenW) * 100;
                              const currentCenterY = focus.y + focus.height / 2;
                              const newYPct = currentCenterY - newHPct / 2;
                              onUpdateFocus({
                                x: Math.round(newXPct * 10) / 10,
                                y: Math.max(0, Math.round(newYPct * 10) / 10),
                                width: Math.round(newWPct * 10) / 10,
                                height: Math.round(newHPct * 10) / 10,
                                margin: item.val,
                                radius: 999,
                              });
                            }
                          }}
                          className={`text-[10px] px-1.5 py-1 rounded-md border transition-all cursor-pointer font-medium text-center ${
                            (focus.margin ?? 5) === item.val
                              ? 'bg-slate-900 text-white border-slate-900 font-bold shadow-2xs'
                              : 'bg-white/90 text-slate-700 border-black/10 hover:bg-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Border Radius du rectangle de focus avec saisie manuelle */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider mb-1">
                  <span className="font-semibold">Arrondi du focus</span>
                  <div className="flex items-center gap-0.5">
                    <input
                      id="input-focus-radius"
                      type="number"
                      min="0"
                      max="999"
                      step="1"
                      value={focus.radius}
                      onChange={(e) => onUpdateFocus({ radius: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-14 h-6 px-1 text-center font-mono font-semibold text-xs macos-input"
                    />
                    <span className="text-[10px] text-slate-400">px</span>
                  </div>
                </div>
                <input
                  id="slider-focus-radius"
                  type="range"
                  min="0"
                  max="120"
                  step="1"
                  value={Math.min(120, focus.radius)}
                  onChange={(e) => onUpdateFocus({ radius: Number(e.target.value) })}
                  className="macos-slider"
                />
                <div className="flex gap-1.5 pt-0.5">
                  {[
                    { label: '0 (Carré)', val: 0 },
                    { label: '8px', val: 8 },
                    { label: '16px', val: 16 },
                    { label: '32px', val: 32 },
                    { label: 'Max Pilule', val: 999 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => onUpdateFocus({ radius: preset.val })}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        focus.radius === preset.val || (preset.val === 999 && focus.radius >= 100)
                          ? 'bg-slate-900 text-white border-slate-900 font-medium'
                          : 'bg-white/90 text-slate-700 border-black/10 hover:bg-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options de bordure visuelle de la zone */}
              <div className="pt-3 border-t border-black/[0.06] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="toggle-focus-border" className="font-semibold text-slate-800 cursor-pointer">
                      Bordure intérieure de focus
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      (sans ombre portée)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="toggle-focus-border"
                      type="checkbox"
                      checked={focus.showBorder}
                      onChange={(e) => onUpdateFocus({ showBorder: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-4 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-slate-900 shadow-inner"></div>
                  </label>
                </div>

                {focus.showBorder && (
                  <div className="space-y-3 bg-white/80 p-3 rounded-lg border border-black/10">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block mb-1">
                          Style du trait
                        </label>
                        <select
                          id="select-focus-border-style"
                          value={focus.borderStyle}
                          onChange={(e) => onUpdateFocus({ borderStyle: e.target.value as BorderStyle })}
                          className="w-full text-xs py-1.5 px-2 border border-black/10 rounded-md bg-white text-slate-800 cursor-pointer focus:outline-none"
                        >
                          <option value="solid">Ligne continue</option>
                          <option value="dashed">Tirets</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">
                          <span>Cote d'épaisseur</span>
                          <div className="flex items-center gap-0.5">
                            <input
                              id="input-focus-border-width-cote"
                              type="number"
                              min="1"
                              max="24"
                              step="1"
                              value={focus.borderWidth || 2}
                              onChange={(e) => onUpdateFocus({ borderWidth: Math.max(1, Number(e.target.value) || 1) })}
                              className="w-12 h-5 text-center font-mono font-semibold text-xs macos-input"
                            />
                            <span className="text-[10px] text-slate-400 font-mono">px</span>
                          </div>
                        </div>
                        <input
                          id="slider-focus-border-width"
                          type="range"
                          min="1"
                          max="16"
                          step="1"
                          value={focus.borderWidth || 2}
                          onChange={(e) => onUpdateFocus({ borderWidth: Number(e.target.value) })}
                          className="macos-slider"
                        />
                        <div className="flex gap-1 pt-0.5">
                          {[1, 2, 3, 4, 6, 8].map((w) => (
                            <button
                              key={w}
                              type="button"
                              onClick={() => onUpdateFocus({ borderWidth: w })}
                              className={`text-[9.5px] px-1.5 py-0.5 rounded-md border transition-all cursor-pointer ${
                                (focus.borderWidth || 2) === w
                                  ? 'bg-slate-900 text-white border-slate-900 font-semibold shadow-2xs'
                                  : 'bg-white/90 text-slate-700 border-black/10 hover:bg-white'
                              }`}
                            >
                              {w}px
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Couleur de la bordure avec sélecteur natif, champ Hex et pastilles */}
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5">
                        <span>Couleur de la bordure</span>
                        <span className="font-mono text-red-600 font-semibold">{focus.borderColor}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Native color picker box */}
                        <div className="relative flex items-center justify-center w-7 h-7 rounded-md border border-black/10 shadow-2xs overflow-hidden cursor-pointer hover:scale-105 transition-all">
                          <input
                            id="input-focus-border-color"
                            type="color"
                            value={focus.borderColor}
                            onChange={(e) => onUpdateFocus({ borderColor: e.target.value })}
                            className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
                            title="Choisir une couleur personnalisée"
                          />
                        </div>

                        {/* Hex text input */}
                        <input
                          id="input-focus-border-color-hex"
                          type="text"
                          value={focus.borderColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith('#') || val.length <= 7) {
                              onUpdateFocus({ borderColor: val });
                            }
                          }}
                          placeholder="#CC0000"
                          className="w-24 h-7 px-2 text-xs font-mono font-semibold border border-black/10 rounded-md bg-white text-slate-800 uppercase focus:outline-none"
                        />

                        {/* Quick preset color swatches */}
                        <div className="flex items-center gap-1.5 flex-1 justify-end">
                          {[
                            { name: 'Rouge (#cc0000)', color: '#CC0000' },
                            { name: 'Émeraude', color: '#10B981' },
                            { name: 'Bleu', color: '#007AFF' },
                            { name: 'Ambre', color: '#F59E0B' },
                            { name: 'Rose', color: '#EC4899' },
                            { name: 'Blanc', color: '#FFFFFF' },
                            { name: 'Noir', color: '#0F172A' },
                          ].map((swatch) => (
                            <button
                              key={swatch.color}
                              type="button"
                              onClick={() => onUpdateFocus({ borderColor: swatch.color })}
                              title={swatch.name}
                              className={`w-5 h-5 rounded-full border cursor-pointer transition-all ${
                                focus.borderColor.toLowerCase() === swatch.color.toLowerCase()
                                  ? 'ring-2 ring-slate-900 ring-offset-1 scale-110 border-white'
                                  : 'border-black/20 hover:scale-110'
                              }`}
                              style={{ backgroundColor: swatch.color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Contrôle direct de marge anti-rognage du contour */}
                    <div className="pt-2.5 border-t border-black/[0.06] space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        <span>Marge de sécurité du cadre (Évite le rognage)</span>
                        <span className="font-mono text-slate-700 font-semibold">{settings.padding}px</span>
                      </div>
                      <input
                        id="slider-focus-anti-crop-padding"
                        type="range"
                        min="0"
                        max="60"
                        step="2"
                        value={settings.padding}
                        onChange={(e) => onUpdateSettings({ padding: Number(e.target.value) })}
                        className="macos-slider"
                      />
                      <p className="text-[10px] text-slate-400">
                        Agrandit la marge du conteneur pour que les contours épais ou dépassants ne soient pas coupés.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 px-3 macos-card text-xs text-slate-500">
              Activez le commutateur pour délimiter une zone nette à 100% d'opacité.
            </div>
          )}
            </>
          )}
        </section>

        {/* ================= SECTION 4: EXPORT PNG ================= */}
        <section className="pt-4 border-t border-black/[0.06] space-y-3.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => toggleSection('export')}
              className="flex items-center gap-2 text-left group cursor-pointer select-none"
              aria-expanded={openSections.export}
            >
              <h3 className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 uppercase tracking-wider transition-colors">
                4. Exportation & Format
              </h3>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform duration-200 ${
                  openSections.export ? 'rotate-0' : '-rotate-90'
                }`}
              />
            </button>
            
            {/* Export scale multiplier */}
            <div className="macos-segmented p-0.5 flex gap-0.5">
              {[
                { scale: 1, label: '1x' },
                { scale: 2, label: '2x (HD)' },
                { scale: 3, label: '3x (4K)' },
              ].map((item) => (
                <button
                  key={item.scale}
                  id={`export-scale-${item.scale}`}
                  type="button"
                  onClick={() => onUpdateSettings({ exportScale: item.scale })}
                  className={`px-2 py-0.5 text-[11px] rounded-md font-medium transition-all cursor-pointer ${
                    settings.exportScale === item.scale
                      ? 'macos-segmented-item-active text-slate-900 font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {openSections.export && (
            <div className="space-y-3.5">
              {/* Options de format homotétique */}
              <div className="space-y-2 macos-card p-3 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Scaling className="w-3.5 h-3.5 text-slate-800" />
                <span>Format de sortie (Homothétique)</span>
              </div>
              <span className="text-[10.5px] font-mono font-bold text-slate-800 bg-white/90 px-2 py-0.5 rounded-md border border-black/10">
                {settings.exportFormat === 'height_450' && 'Standard (450 px max)'}
                {settings.exportFormat === 'custom' && `Sur mesure (H: ${settings.exportCustomHeight} px)`}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Conserve strictement les proportions de votre capture d'écran tout en calibrant la hauteur sur un standard de <strong>450 px max</strong>.
            </p>

            {/* Presets Grid - Standard 450px max and Custom */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                id="btn-format-450"
                onClick={() => onUpdateSettings({ exportFormat: 'height_450', exportCustomHeight: 450 })}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  settings.exportFormat === 'height_450'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white/90 text-slate-700 border-black/10 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Standard (450px max)</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                    settings.exportFormat === 'height_450' ? 'bg-white/20 text-white' : 'bg-black/5 text-slate-600'
                  }`}>
                    Défaut
                  </span>
                </div>
                <div className={`text-[10px] mt-1 ${
                  settings.exportFormat === 'height_450' ? 'text-slate-300' : 'text-slate-400'
                }`}>
                  Visuel global 450px max (homothétique)
                </div>
              </button>

              <button
                type="button"
                id="btn-format-custom"
                onClick={() => onUpdateSettings({ exportFormat: 'custom' })}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  settings.exportFormat === 'custom'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white/90 text-slate-700 border-black/10 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">Sur mesure</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium ${
                    settings.exportFormat === 'custom' ? 'bg-white/20 text-white' : 'bg-black/5 text-slate-600'
                  }`}>
                    Libre
                  </span>
                </div>
                <div className={`text-[10px] mt-1 ${
                  settings.exportFormat === 'custom' ? 'text-slate-300' : 'text-slate-400'
                }`}>
                  Hauteur libre ({settings.exportCustomHeight}px)
                </div>
              </button>
            </div>

            {/* Custom Height Slider & Input when 'custom' is active */}
            {settings.exportFormat === 'custom' && (
              <div className="mt-2.5 pt-2.5 border-t border-black/[0.06] space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-700 font-medium">Hauteur cible personnalisée :</span>
                  <div className="flex items-center gap-1">
                    <input
                      id="input-custom-height"
                      type="number"
                      min="100"
                      max="3000"
                      step="10"
                      value={settings.exportCustomHeight}
                      onChange={(e) => onUpdateSettings({ exportCustomHeight: Math.max(100, Math.min(4000, Number(e.target.value) || 450)) })}
                      className="w-18 px-2 py-0.5 text-xs font-mono font-bold text-center macos-input"
                    />
                    <span className="text-xs text-slate-500 font-mono">px</span>
                  </div>
                </div>
                <input
                  id="slider-custom-height"
                  type="range"
                  min="150"
                  max="2160"
                  step="10"
                  value={settings.exportCustomHeight}
                  onChange={(e) => onUpdateSettings({ exportCustomHeight: Number(e.target.value) })}
                  className="macos-slider"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>150 px</span>
                  <span>450 px</span>
                  <span>1080 px</span>
                  <span>2160 px</span>
                </div>
              </div>
            )}
          </div>

          {/* Nom du média à l'export */}
          <div className="space-y-1.5 macos-card p-3.5 rounded-xl">
            <div className="flex items-center justify-between">
              <label htmlFor="input-export-filename" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <span>Nom du média à l'export</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">Format PNG automatique</span>
            </div>
            <div className="flex items-center rounded-lg border border-black/10 bg-white overflow-hidden shadow-2xs">
              <input
                id="input-export-filename"
                type="text"
                value={settings.exportFileName || ''}
                onChange={(e) => onUpdateSettings({ exportFileName: e.target.value })}
                placeholder="focusframe-export"
                className="w-full text-xs px-3 py-2 text-slate-800 focus:outline-none font-medium bg-transparent"
              />
              <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-2 font-mono border-l border-black/10 select-none">
                .png
              </span>
            </div>

            {/* Quality & Resampling indicator */}
            <div className="flex items-center justify-between pt-1 text-[10px] text-slate-500">
              <span className="flex items-center gap-1 text-slate-700 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Rendu : Haute Définition (HD / Retina)
              </span>
              <span className="text-slate-400 font-mono">Bords nets sans artefact</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            {/* Primary macOS Button: Choose Destination Directory & Save As */}
            <button
              id="btn-save-as-folder"
              type="button"
              disabled={isExporting}
              onClick={() => onExport(true)}
              className="w-full py-3.5 macos-btn-dark text-white font-medium text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50 active:scale-[0.99]"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Exportation en cours...</span>
                </>
              ) : (
                <>
                  <FolderDown className="w-4 h-4" />
                  <span>
                    Enregistrer sous... (Choisir le répertoire)
                  </span>
                </>
              )}
            </button>

            {/* Astuce navigateur sur le choix du dossier */}
            <div className="p-3.5 macos-card text-[11px] text-slate-700 leading-snug space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5 text-slate-900">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-900 inline-block" />
                <span>Comment choisir votre dossier de destination :</span>
              </div>
              <p className="text-slate-600">
                • <strong>Méthode 1</strong> : Dans les paramètres de votre navigateur Chrome/Edge, activez l'option <em>« Toujours demander où enregistrer chaque fichier »</em> (Paramètres &gt; Téléchargements). La fenêtre de choix du dossier s'ouvrira systématiquement.
              </p>
              <p className="text-slate-600">
                • <strong>Méthode 2</strong> : Ouvrez l'application dans un <strong>nouvel onglet</strong> pour autoriser le sélecteur natif du système de fichiers.
              </p>
            </div>

            {/* Secondary Direct Download & Copy Buttons (macOS White Button Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                id="btn-export-direct"
                type="button"
                disabled={isExporting}
                onClick={() => onExport(false)}
                className="py-2.5 px-3 macos-btn-white font-medium text-xs text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-slate-700" />
                <span>Téléchargement direct</span>
              </button>

              {/* Copy to Clipboard */}
              <button
                id="btn-copy-clipboard"
                type="button"
                disabled={isExporting}
                onClick={onCopyClipboard}
                className="py-2.5 px-3 macos-btn-white font-medium text-xs text-slate-800 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-700" />
                    <span>Copier l'image</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="macos-card p-3 text-[10.5px] text-slate-500 flex items-start gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-0.5" />
            <p>
              <strong>Répertoire de destination :</strong> Le bouton <em>« Enregistrer sous... »</em> ouvre l'explorateur de fichiers de votre système pour choisir exactement le dossier de destination et renommer votre fichier.
            </p>
          </div>
          <p className="text-[10px] text-slate-400 text-center font-medium">
            Proportions 100% préservées • Canal Alpha transparent garanti
          </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ControlPanel;
