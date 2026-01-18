import type { UpscaleMode, UpscalePreset } from './types';

export type ModelEntry = {
    id: string;
    mode: UpscaleMode;
    preset: UpscalePreset;
    scale: 2 | 4;
    url?: string;
    sha256?: string;
    runtime: 'classic' | 'onnx';
    inputSize?: number;
    note?: string;
};

const MODELS: ModelEntry[] = [
    {
        id: 'onnx-photo-2x',
        mode: 'photo',
        preset: 'balanced',
        scale: 2,
        runtime: 'onnx',
        url: 'https://huggingface.co/JoPmt/Real_Esrgan_x2_Onnx_Tflite_Tfjs/resolve/main/ano_test/realesr-general-x4v3.onnx',
        note: 'Real-ESRGAN general x4v3. Downscale to 2x.'
    },
    {
        id: 'onnx-anime-2x',
        mode: 'anime',
        preset: 'balanced',
        scale: 2,
        runtime: 'onnx',
        url: 'https://huggingface.co/JoPmt/Real_Esrgan_x2_Onnx_Tflite_Tfjs/resolve/main/ano_test/realesr-general-x4v3.onnx',
        note: 'Real-ESRGAN general x4v3. Downscale to 2x.'
    },
    {
        id: 'onnx-text-2x',
        mode: 'text',
        preset: 'balanced',
        scale: 2,
        runtime: 'onnx',
        url: 'https://huggingface.co/JoPmt/Real_Esrgan_x2_Onnx_Tflite_Tfjs/resolve/main/ano_test/realesr-general-x4v3.onnx',
        note: 'Real-ESRGAN general x4v3. Downscale to 2x.'
    },
    {
        id: 'onnx-photo-4x',
        mode: 'photo',
        preset: 'balanced',
        scale: 4,
        runtime: 'onnx',
        url: 'https://huggingface.co/JoPmt/Real_Esrgan_x2_Onnx_Tflite_Tfjs/resolve/main/ano_test/realesr-general-x4v3.onnx',
        note: 'Real-ESRGAN general x4v3.'
    },
    {
        id: 'onnx-anime-4x',
        mode: 'anime',
        preset: 'balanced',
        scale: 4,
        runtime: 'onnx',
        url: 'https://huggingface.co/JoPmt/Real_Esrgan_x2_Onnx_Tflite_Tfjs/resolve/main/ano_test/realesr-general-x4v3.onnx',
        note: 'Real-ESRGAN general x4v3.'
    },
    {
        id: 'onnx-text-4x',
        mode: 'text',
        preset: 'balanced',
        scale: 4,
        runtime: 'onnx',
        url: 'https://huggingface.co/JoPmt/Real_Esrgan_x2_Onnx_Tflite_Tfjs/resolve/main/ano_test/realesr-general-x4v3.onnx',
        note: 'Real-ESRGAN general x4v3.'
    },
    {
        id: 'classic-photo-balanced-2x',
        mode: 'photo',
        preset: 'balanced',
        scale: 2,
        runtime: 'classic',
        note: 'Fallback renderer (bicubic + mild sharpen).'
    },
    {
        id: 'classic-photo-balanced-4x',
        mode: 'photo',
        preset: 'balanced',
        scale: 4,
        runtime: 'classic'
    },
    {
        id: 'classic-anime-balanced-2x',
        mode: 'anime',
        preset: 'balanced',
        scale: 2,
        runtime: 'classic'
    },
    {
        id: 'classic-anime-balanced-4x',
        mode: 'anime',
        preset: 'balanced',
        scale: 4,
        runtime: 'classic'
    },
    {
        id: 'classic-text-balanced-2x',
        mode: 'text',
        preset: 'balanced',
        scale: 2,
        runtime: 'classic'
    },
    {
        id: 'classic-text-balanced-4x',
        mode: 'text',
        preset: 'balanced',
        scale: 4,
        runtime: 'classic'
    },
];

export function resolveModel(mode: UpscaleMode, preset: UpscalePreset, scale: 2 | 4) {
    return MODELS.find((m) => m.mode === mode && m.preset === preset && m.scale === scale)
        || MODELS.find((m) => m.mode === mode && m.scale === scale)
        || MODELS[0];
}
