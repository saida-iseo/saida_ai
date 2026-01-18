export type UpscaleMode = 'photo' | 'anime' | 'text';
export type UpscalePreset = 'fast' | 'balanced' | 'high';

export type TilePolicy = {
    auto: boolean;
    size: number;
    overlap: number;
    maxPixels: number;
};

export type UpscaleOptions = {
    mode: UpscaleMode;
    scale: 2 | 4;
    preset: UpscalePreset;
    fidelity: number; // 0..1
    useGPU: boolean;
    faceRestore: boolean;
    targetSize?: { width: number; height: number };
    tile: TilePolicy;
    output: {
        format: 'image/png' | 'image/jpeg' | 'image/webp';
        quality: number;
    };
};

export type ProgressUpdate = {
    totalTiles: number;
    doneTiles: number;
    etaSec?: number;
    stage: 'decode' | 'upscale' | 'blend' | 'encode';
};

export type UpscaleDiagnostics = {
    runtime?: 'onnx' | 'classic';
    provider?: 'webgpu' | 'wasm' | 'webgl' | 'cpu';
    modelId?: string;
    modelUrl?: string;
    path?: string;
    lastError?: string;
    fallback?: string;
};

export type WorkerRequest =
    | { type: 'load-model'; mode: UpscaleMode; preset: UpscalePreset; useGPU: boolean }
    | { type: 'upscale'; imageBlob: Blob; options: UpscaleOptions; requestId: string }
    | { type: 'cancel'; requestId: string };

export type WorkerResponse =
    | { type: 'progress'; requestId: string; data: ProgressUpdate }
    | { type: 'status'; requestId: string; message: string }
    | { type: 'result'; requestId: string; blob: Blob; width: number; height: number }
    | { type: 'diagnostic'; requestId: string; data: UpscaleDiagnostics }
    | { type: 'error'; requestId: string; message: string };
