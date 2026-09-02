export type BackgroundType = 'transparent' | 'solid' | 'gradient';

export type ShadowStyle = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type BorderStyle = 'solid' | 'dashed' | 'glow';

export type FocusShape = 'rounded' | 'pill' | 'circle' | 'rectangle';

export type ZoneMode = 'focus' | 'blur';

export type BlurStyle = 'gaussian' | 'frost' | 'dark';

export interface CustomShadowSettings {
  enabled: boolean;
  color: string; // default: '#000000'
  opacity: number; // 0 to 1, default: 0.20 (20%)
  offsetX: number; // in px, default: 2
  offsetY: number; // in px, default: 4
  blur: number; // in px, default: 9
}

export interface FocusRect {
  id?: string;
  name?: string;
  enabled: boolean;
  mode?: ZoneMode; // 'focus' (Mise en valeur) | 'blur' (Floutage / Censure)
  blurAmount?: number; // in px, default: 10 (range 2 - 30)
  blurOpacity?: number; // 0.05 to 1.0 (5% to 100%, default: 1.0)
  blurStyle?: BlurStyle; // 'gaussian' | 'frost' | 'dark'
  shape?: FocusShape; // 'rounded' | 'pill' | 'circle' | 'rectangle'
  x: number; // percentage (supports negative and > 100 for overflow)
  y: number; // percentage
  width: number; // percentage
  height: number; // percentage
  margin?: number; // default margin in px (e.g. 5)
  radius: number; // in px
  showBorder: boolean;
  borderColor: string;
  borderWidth: number;
  borderStyle: BorderStyle;
  snapEnabled?: boolean;
  lockSignature?: boolean;
  showHandles?: boolean;
}

export type ExportFormatPreset = 'height_450' | 'custom';

export interface ArrowAnnotation {
  id: string;
  name?: string;
  enabled: boolean;
  x: number; // percentage (0-100) center on screenshot
  y: number; // percentage (0-100)
  size: number; // length in px (default 70, range 20 - 250)
  thickness: number; // shaft thickness in px (default 16, range 4 - 50)
  headWidth: number; // arrowhead wing width in px (default 40, range 10 - 100)
  headLength: number; // arrowhead length in px (default 30, range 10 - 100)
  rotation: number; // degrees (0 = right, 90 = down, 180 = left, 270 = up)
  color: string; // default red '#cc0000'
  opacity: number; // 0.1 to 1.0 (default 1.0)
  hasShadow?: boolean; // shadow effect
  showHandles?: boolean;
  cornerRadius?: number; // corner roundness in px (default 7, range 0 - 24)
  roundedTail?: boolean; // round tail cap (départ arrondi, default true)
}

export interface FrameSettings {
  borderRadius: number; // in px (0 - 48)
  padding: number; // in px (0 - 40)
  bgType: BackgroundType;
  bgColor: string;
  bgGradient: string;
  screenshotOpacity: number; // 0.05 to 1.0 (5% to 100%)
  backgroundBlur?: number; // in px (0 - 20, default: 0)
  dimmingType?: 'dark' | 'light';
  screenshotRadius: number; // in px (0 - 24)
  shadow: ShadowStyle;
  shadowSettings: CustomShadowSettings;
  focus: FocusRect;
  focuses?: FocusRect[];
  activeFocusIndex?: number;
  arrows?: ArrowAnnotation[];
  activeArrowIndex?: number;
  exportScale: number; // 1, 2, 3, 4
  exportFormat: ExportFormatPreset;
  exportCustomHeight: number; // in px (e.g. 450, 800, 1080)
  exportFileName?: string;
  showWatermark?: boolean;
}

export interface SampleImage {
  id: string;
  name: string;
  description: string;
  dataUrl: string;
}

export interface GuideLine {
  id: string;
  orientation: 'horizontal' | 'vertical';
  position: number; // in px relative to screenshot (0, 0)
}
