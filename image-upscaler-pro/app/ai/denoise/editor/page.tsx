'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { buildFilename } from '@/lib/utils/filename';
import { downloadImage } from '@/lib/utils/imageProcessor';
import { cn } from '@/lib/utils/cn';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function boxBlur(data: Uint8ClampedArray, width: number, height: number, radius: number) {
    const r = Math.max(1, radius);
    const tmp = new Uint8ClampedArray(data.length);
    const out = new Uint8ClampedArray(data.length);
    const stride = width * 4;

    for (let y = 0; y < height; y += 1) {
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let aSum = 0;
        for (let x = -r; x <= r; x += 1) {
            const cx = clamp(x, 0, width - 1);
            const idx = y * stride + cx * 4;
            rSum += data[idx];
            gSum += data[idx + 1];
            bSum += data[idx + 2];
            aSum += data[idx + 3];
        }
        for (let x = 0; x < width; x += 1) {
            const idx = y * stride + x * 4;
            tmp[idx] = rSum / (r * 2 + 1);
            tmp[idx + 1] = gSum / (r * 2 + 1);
            tmp[idx + 2] = bSum / (r * 2 + 1);
            tmp[idx + 3] = aSum / (r * 2 + 1);

            const removeX = clamp(x - r, 0, width - 1);
            const addX = clamp(x + r + 1, 0, width - 1);
            const removeIdx = y * stride + removeX * 4;
            const addIdx = y * stride + addX * 4;
            rSum += data[addIdx] - data[removeIdx];
            gSum += data[addIdx + 1] - data[removeIdx + 1];
            bSum += data[addIdx + 2] - data[removeIdx + 2];
            aSum += data[addIdx + 3] - data[removeIdx + 3];
        }
    }

    for (let x = 0; x < width; x += 1) {
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let aSum = 0;
        for (let y = -r; y <= r; y += 1) {
            const cy = clamp(y, 0, height - 1);
            const idx = cy * stride + x * 4;
            rSum += tmp[idx];
            gSum += tmp[idx + 1];
            bSum += tmp[idx + 2];
            aSum += tmp[idx + 3];
        }
        for (let y = 0; y < height; y += 1) {
            const idx = y * stride + x * 4;
            out[idx] = rSum / (r * 2 + 1);
            out[idx + 1] = gSum / (r * 2 + 1);
            out[idx + 2] = bSum / (r * 2 + 1);
            out[idx + 3] = aSum / (r * 2 + 1);

            const removeY = clamp(y - r, 0, height - 1);
            const addY = clamp(y + r + 1, 0, height - 1);
            const removeIdx = removeY * stride + x * 4;
            const addIdx = addY * stride + x * 4;
            rSum += tmp[addIdx] - tmp[removeIdx];
            gSum += tmp[addIdx + 1] - tmp[removeIdx + 1];
            bSum += tmp[addIdx + 2] - tmp[removeIdx + 2];
            aSum += tmp[addIdx + 3] - tmp[removeIdx + 3];
        }
    }

    return out;
}

export default function DenoiseEditor() {
    const router = useRouter();
    const { originalImage, setOriginalImage } = useAppStore();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [noiseLevel, setNoiseLevel] = useState(40);
    const [sharpness, setSharpness] = useState(35);
    const [downloadFormat, setDownloadFormat] = useState<'png' | 'webp' | 'jpg'>('png');

    const baseImageRef = useRef<ImageData | null>(null);
    const baseSizeRef = useRef({ width: 0, height: 0 });

    useEffect(() => {
        if (!originalImage) {
            router.push('/ai/denoise');
            return;
        }
        const loadOriginal = async () => {
            const blob = await imageDb.getImage(originalImage.id);
            if (!blob) return;
            const img = new Image();
            img.src = URL.createObjectURL(blob);
            await img.decode();

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
            baseImageRef.current = data;
            baseSizeRef.current = { width: canvas.width, height: canvas.height };
        };
        loadOriginal();
    }, [originalImage, router]);

    const processImage = useCallback(async () => {
        const base = baseImageRef.current;
        if (!base) return;
        setIsProcessing(true);
        await new Promise((resolve) => setTimeout(resolve, 0));

        const { width, height } = baseSizeRef.current;
        const original = base.data;
        const denoiseStrength = clamp(noiseLevel / 100, 0, 1);
        const sharpenStrength = clamp(sharpness / 100, 0, 1);
        const blurRadius = clamp(Math.round(denoiseStrength * 4) + 1, 1, 6);
        const blur = boxBlur(original, width, height, blurRadius);

        const mixed = new Uint8ClampedArray(original.length);
        for (let i = 0; i < original.length; i += 4) {
            mixed[i] = original[i] * (1 - denoiseStrength) + blur[i] * denoiseStrength;
            mixed[i + 1] = original[i + 1] * (1 - denoiseStrength) + blur[i + 1] * denoiseStrength;
            mixed[i + 2] = original[i + 2] * (1 - denoiseStrength) + blur[i + 2] * denoiseStrength;
            mixed[i + 3] = original[i + 3];
        }

        const sharpenBlur = boxBlur(mixed, width, height, Math.max(1, blurRadius - 1));
        const output = new Uint8ClampedArray(mixed.length);
        const amount = 1.4 * sharpenStrength;
        for (let i = 0; i < mixed.length; i += 4) {
            output[i] = clamp(Math.round(mixed[i] + amount * (mixed[i] - sharpenBlur[i])), 0, 255);
            output[i + 1] = clamp(Math.round(mixed[i + 1] + amount * (mixed[i + 1] - sharpenBlur[i + 1])), 0, 255);
            output[i + 2] = clamp(Math.round(mixed[i + 2] + amount * (mixed[i + 2] - sharpenBlur[i + 2])), 0, 255);
            output[i + 3] = mixed[i + 3];
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const imgData = new ImageData(output, width, height);
        ctx.putImageData(imgData, 0, 0);

        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), 'image/png');
        });
        if (blob) {
            setProcessedBlob(blob);
            const url = URL.createObjectURL(blob);
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return url;
            });
        }
        setIsProcessing(false);
    }, [noiseLevel, sharpness]);

    useEffect(() => {
        if (!baseImageRef.current) return;
        const timer = setTimeout(() => {
            processImage();
        }, 200);
        return () => clearTimeout(timer);
    }, [processImage]);

    const handleDownload = async () => {
        if (!processedBlob || !originalImage) return;
        let blob = processedBlob;
        if (downloadFormat !== 'png') {
            const img = new Image();
            img.src = URL.createObjectURL(processedBlob);
            await img.decode();
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            if (downloadFormat === 'jpg') {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0);
            const outputBlob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), downloadFormat === 'jpg' ? 'image/jpeg' : 'image/webp', 0.95);
            });
            if (outputBlob) blob = outputBlob;
        }
        const filename = buildFilename(originalImage.name, 'denoise', downloadFormat);
        downloadImage(blob, filename);
    };

    if (!originalImage) return null;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-background">
            <div className="flex-grow flex flex-col items-center justify-center p-10">
                <div className="relative max-w-3xl w-full">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Denoise preview" className="w-full rounded-2xl border-4 border-card-border shadow-2xl object-contain h-[520px]" />
                    ) : (
                        <div className="w-full rounded-2xl border-4 border-card-border shadow-2xl h-[520px] flex items-center justify-center text-text-tertiary">
                            미리보기 생성 중...
                        </div>
                    )}
                </div>
            </div>

            <div className="w-[420px] border-l border-card-border bg-card-bg backdrop-blur-xl p-8 flex flex-col gap-8">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => {
                            setOriginalImage(null);
                            router.push('/ai/denoise');
                        }}
                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all border border-card-border"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2 text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                        <Sparkles className="h-4 w-4" />
                        Denoise & Sharpen
                    </div>
                </div>

                <div className="bg-background rounded-3xl border border-card-border p-6 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">노이즈 감소</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={noiseLevel}
                            onChange={(e) => setNoiseLevel(Number(e.target.value))}
                            className="w-full accent-accent"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">선명도</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={sharpness}
                            onChange={(e) => setSharpness(Number(e.target.value))}
                            className="w-full accent-accent"
                        />
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-card-border">
                    <div className="flex items-center gap-2 mb-3">
                        {(['png', 'webp', 'jpg'] as const).map((fmt) => (
                            <button
                                key={fmt}
                                onClick={() => setDownloadFormat(fmt)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all",
                                    downloadFormat === fmt ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-card-border text-text-tertiary"
                                )}
                            >
                                {fmt}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={isProcessing || !processedBlob}
                        className={cn(
                            "w-full py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-2xl",
                            (isProcessing || !processedBlob) ? "bg-slate-800 text-slate-600 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98]"
                        )}
                    >
                        <Download className="h-6 w-6" />
                        결과 다운로드
                    </button>
                </div>
            </div>
        </div>
    );
}
