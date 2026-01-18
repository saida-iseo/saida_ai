'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Palette } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { buildFilename } from '@/lib/utils/filename';
import { downloadImage } from '@/lib/utils/imageProcessor';
import { cn } from '@/lib/utils/cn';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function ColorRestoreEditor() {
    const router = useRouter();
    const { originalImage, setOriginalImage } = useAppStore();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [strength, setStrength] = useState(55);
    const [downloadFormat, setDownloadFormat] = useState<'png' | 'webp' | 'jpg'>('png');

    const baseImageRef = useRef<ImageData | null>(null);
    const baseSizeRef = useRef({ width: 0, height: 0 });

    useEffect(() => {
        if (!originalImage) {
            router.push('/ai/color-restore');
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
        const output = new Uint8ClampedArray(base.data);
        const power = clamp(strength / 100, 0, 1);
        const contrast = 1 + power * 0.25;
        const saturation = 1 + power * 0.35;
        const brightness = power * 0.08;

        for (let i = 0; i < output.length; i += 4) {
            let r = output[i] / 255;
            let g = output[i + 1] / 255;
            let b = output[i + 2] / 255;

            r = (r + brightness);
            g = (g + brightness);
            b = (b + brightness);

            r = (r - 0.5) * contrast + 0.5;
            g = (g - 0.5) * contrast + 0.5;
            b = (b - 0.5) * contrast + 0.5;

            const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            r = luma + (r - luma) * saturation;
            g = luma + (g - luma) * saturation;
            b = luma + (b - luma) * saturation;

            output[i] = clamp(Math.round(r * 255), 0, 255);
            output[i + 1] = clamp(Math.round(g * 255), 0, 255);
            output[i + 2] = clamp(Math.round(b * 255), 0, 255);
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
    }, [strength]);

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
        const filename = buildFilename(originalImage.name, 'color-restore', downloadFormat);
        downloadImage(blob, filename);
    };

    if (!originalImage) return null;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-background">
            <div className="flex-grow flex flex-col items-center justify-center p-10">
                <div className="relative max-w-3xl w-full">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Color restore preview" className="w-full rounded-2xl border-4 border-card-border shadow-2xl object-contain h-[520px]" />
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
                            router.push('/ai/color-restore');
                        }}
                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all border border-card-border"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2 text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                        <Palette className="h-4 w-4" />
                        Color Restore
                    </div>
                </div>

                <div className="bg-background rounded-3xl border border-card-border p-6 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">복원 강도</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={strength}
                            onChange={(e) => setStrength(Number(e.target.value))}
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
