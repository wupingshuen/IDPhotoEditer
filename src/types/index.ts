export interface FaceData {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  eyeAngle: number;
  faceCenter: { x: number; y: number };
  landmarks: Array<{ x: number; y: number; z: number }>;
}

export interface ProcessingState {
  originalImage: HTMLImageElement | null;
  rotatedImage: HTMLCanvasElement | null;
  segmentationMask: ImageData | null;
  finalImage: HTMLCanvasElement | null;
}

export interface Adjustments {
  zoom: number;
  verticalOffset: number;
  rotation: number;
}

export interface SizePreset {
  name: string;
  width: number;
  height: number;
  dpi: number;
  widthPx: number;
  heightPx: number;
}

export interface ExportSettings {
  format: 'png' | 'jpeg';
  quality: number;
}

export const SIZE_PRESETS: SizePreset[] = [
  {
    name: 'US Passport (2x2 in)',
    width: 2,
    height: 2,
    dpi: 300,
    widthPx: 600,
    heightPx: 600,
  },
  {
    name: 'EU/Schengen (35x45 mm)',
    width: 35,
    height: 45,
    dpi: 300,
    widthPx: Math.round((35 / 25.4) * 300),
    heightPx: Math.round((45 / 25.4) * 300),
  },
  {
    name: 'China Visa (33x48 mm)',
    width: 33,
    height: 48,
    dpi: 300,
    widthPx: Math.round((33 / 25.4) * 300),
    heightPx: Math.round((48 / 25.4) * 300),
  },
];
