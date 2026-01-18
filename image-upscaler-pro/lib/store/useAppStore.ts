import { create } from 'zustand';
import type { UpscaleDiagnostics } from '@/lib/upscale/types';

interface ImageMetadata {
    id: string;
    name: string;
    type: string;
    size: number;
    width?: number;
    height?: number;
}

interface AppState {
    originalImage: ImageMetadata | null;
    processedImage: ImageMetadata | null;
    isProcessing: boolean;
    progress: number;
    progressStatus: string;
    progressDetail: {
        totalTiles: number;
        doneTiles: number;
        etaSec: number | null;
    };
    diagnostics: UpscaleDiagnostics | null;

    // A-Version Upscale Options
    upscaleFactor: 2 | 4;
    outputFormat: 'image/png' | 'image/jpeg' | 'image/webp';
    quality: number;
    upscaleMode: 'photo' | 'anime' | 'text';
    faceRestore: boolean;
    gpuAcceleration: boolean;
    gpuAvailable: boolean;
    qualityPreset: 'fast' | 'balanced' | 'high';
    fidelity: number;
    tileAuto: boolean;
    tileSize: number;
    tileOverlap: number;
    maxPixels: number;
    targetSize: { label: string; width: number; height: number } | null;

    dailyDownloadCount: number;
    isPremium: boolean;
    theme: 'dark' | 'light';

    setOriginalImage: (img: ImageMetadata | null) => void;
    setProcessedImage: (img: ImageMetadata | null) => void;
    setProcessing: (bool: boolean) => void;
    setProgress: (val: number) => void;
    setProgressStatus: (status: string) => void;
    setProgressDetail: (detail: AppState['progressDetail']) => void;
    setDiagnostics: (diag: UpscaleDiagnostics | null) => void;
    setOptions: (options: Partial<Pick<AppState, 'upscaleFactor' | 'outputFormat' | 'quality' | 'upscaleMode' | 'faceRestore' | 'gpuAcceleration' | 'qualityPreset' | 'fidelity' | 'tileAuto' | 'tileSize' | 'tileOverlap' | 'maxPixels' | 'gpuAvailable' | 'targetSize'>>) => void;
    incrementDownloadCount: () => void;
    togglePremium: () => void;
    toggleTheme: () => void;
    reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    originalImage: null,
    processedImage: null,
    isProcessing: false,
    progress: 0,
    progressStatus: '',
    progressDetail: {
        totalTiles: 0,
        doneTiles: 0,
        etaSec: null,
    },
    diagnostics: null,

    upscaleFactor: 2,
    outputFormat: 'image/png',
    quality: 90,
    upscaleMode: 'photo',
    faceRestore: false,
    gpuAcceleration: true,
    gpuAvailable: true,
    qualityPreset: 'high',
    fidelity: 70,
    tileAuto: true,
    tileSize: 512,
    tileOverlap: 24,
    maxPixels: 12000000,
    targetSize: null,

    dailyDownloadCount: 0,
    isPremium: true,
    theme: 'dark',

    setOriginalImage: (img) => set({ originalImage: img }),
    setProcessedImage: (img) => set({ processedImage: img }),
    setProcessing: (bool) => set({ isProcessing: bool }),
    setProgress: (val) => set({ progress: val }),
    setProgressStatus: (status) => set({ progressStatus: status }),
    setProgressDetail: (detail) => set({ progressDetail: detail }),
    setDiagnostics: (diag) => set({ diagnostics: diag }),
    setOptions: (options) => set((state) => ({ ...state, ...options })),
    toggleTheme: () => set((state) => {
        const newTheme = state.theme === 'dark' ? 'light' : 'dark';
        if (typeof window !== 'undefined') {
            localStorage.setItem('saida_theme', newTheme);
        }
        return { theme: newTheme };
    }),
    incrementDownloadCount: () => set((state) => ({ dailyDownloadCount: state.dailyDownloadCount + 1 })),
    togglePremium: () => set((state) => ({ isPremium: !state.isPremium })),
    reset: () => set({
        originalImage: null,
        processedImage: null,
        isProcessing: false,
        progress: 0,
        progressStatus: '',
        progressDetail: {
            totalTiles: 0,
            doneTiles: 0,
            etaSec: null,
        },
        diagnostics: null,
        upscaleMode: 'photo',
        faceRestore: false,
        targetSize: null
    }),
}));
