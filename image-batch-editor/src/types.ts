// TypeScript 타입 정의

export type ResizeMode = 'fixed' | 'longest-side' | 'upscale';
export type UpscaleMultiplier = 2 | 3 | 4;
export type AspectRatio = 'free' | '1:1' | '4:3' | '16:9';
export type OutputFormat = 'jpeg' | 'png' | 'webp';
export type ProcessStatus = 'pending' | 'processing' | 'done' | 'error';

export interface ResizeOptions {
  mode: ResizeMode;
  width?: number;
  height?: number;
  longestSide?: number;
  keepAspect: boolean;
  upscaleMultiplier?: UpscaleMultiplier; // 2x, 3x, 4x
}

export interface CropOptions {
  enabled: boolean;
  aspect: AspectRatio;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RotateOptions {
  degrees: number;
}

export interface OutputOptions {
  format: OutputFormat;
  quality: number;
  targetSizeKB?: number;
  background?: string;
}

export interface ProcessFlags {
  stripMetadata: boolean;
  overwrite: boolean;
  recursive: boolean;
}

export interface NamingOptions {
  prefix: string;
  suffix: string;
  startIndex: number;
  pad: number;
  keepOriginal: boolean;
}

export interface BatchOptions {
  resize: ResizeOptions;
  crop: CropOptions;
  rotate: RotateOptions;
  output: OutputOptions;
  flags: ProcessFlags;
  naming: NamingOptions;
}

export interface ImageFile {
  id: string;
  path: string;
  name: string;
  size: number;
  width: number;
  height: number;
  format: string;
  status: ProcessStatus;
  error?: string;
  outputPath?: string;
  outputSize?: number;
  outputWidth?: number;
  outputHeight?: number;
  savedBytes?: number;
}

export interface ProgressEvent {
  total: number;
  done: number;
  currentFile: string;
  percent: number;
  currentFilePercent: number;
}

export interface ItemDoneEvent {
  file: string;
  outFile: string;
  savedBytes: number;
  outSizeBytes: number;
  outWidth: number;
  outHeight: number;
}

export interface ItemErrorEvent {
  file: string;
  message: string;
}

export interface BatchDoneEvent {
  total: number;
  success: number;
  failed: number;
  totalSavedBytes: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'error';
  message: string;
}
