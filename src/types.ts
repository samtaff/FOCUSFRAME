export type BackgroundType = 'transparent' | 'solid' | 'gradient';

export type ShadowStyle = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type BorderStyle = 'solid' | 'dashed' | 'glow';

export type FocusShape = 'rounded' | 'pill' | 'circle' | 'rectangle';

export interface CustomShadowSettings {
  enabled: boolean;
  color: string; // default: '#000000'
  opacity: number; // 0 to 1, default: 0.20 (20%)
  offsetX: number; // in px, default: 2
  offsetY: number; // in px, default: 4
  blur: number; // in px, default: 9
}

export interface FocusRect {
  enabled: boolean;
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

export interface FrameSettings {
  borderRadius: number; // in px (0 - 48)
  padding: number; // in px (0 - 40)
  bgType: BackgroundType;
  bgColor: string;
  bgGradient: string;
  screenshotOpacity: number; // 0.05 to 1.0 (5% to 100%)
  dimmingType?: 'dark' | 'light';
  screenshotRadius: number; // in px (0 - 24)
  shadow: ShadowStyle;
  shadowSettings: CustomShadowSettings;
  focus: FocusRect;
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
