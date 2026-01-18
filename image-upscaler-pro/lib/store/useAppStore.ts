import { create } from 'zustand';

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

    // A-Version Upscale Options
    upscaleFactor: 2 | 4;
    outputFormat: 'image/png' | 'image/jpeg' | 'image/webp';
    quality: number;
    upscaleMode: 'photo' | 'anime' | 'text';
    faceRestore: boolean;
    gpuAcceleration: boolean;

    dailyDownloadCount: number;
    isPremium: boolean;
    theme: 'dark' | 'light';

    setOriginalImage: (img: ImageMetadata | null) => void;
    setProcessedImage: (img: ImageMetadata | null) => void;
    setProcessing: (bool: boolean) => void;
    setProgress: (val: number) => void;
    setProgressStatus: (status: string) => void;
    setOptions: (options: Partial<Pick<AppState, 'upscaleFactor' | 'outputFormat' | 'quality' | 'upscaleMode' | 'faceRestore' | 'gpuAcceleration'>>) => void;
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

    upscaleFactor: 2,
    outputFormat: 'image/png',
    quality: 90,
    upscaleMode: 'photo',
    faceRestore: false,
    gpuAcceleration: true,

    dailyDownloadCount: 0,
    isPremium: false,
    theme: 'dark',

    setOriginalImage: (img) => set({ originalImage: img }),
    setProcessedImage: (img) => set({ processedImage: img }),
    setProcessing: (bool) => set({ isProcessing: bool }),
    setProgress: (val) => set({ progress: val }),
    setProgressStatus: (status) => set({ progressStatus: status }),
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
        upscaleMode: 'photo',
        faceRestore: false
    }),
}));
