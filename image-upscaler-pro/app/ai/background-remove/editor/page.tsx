'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Eraser, Pipette } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { buildFilename } from '@/lib/utils/filename';
import { downloadImage } from '@/lib/utils/imageProcessor';
import { cn } from '@/lib/utils/cn';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function rgbToHex(r: number, g: number, b: number) {
    const toHex = (val: number) => val.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(hex: string) {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return { r, g, b };
}

function sampleCornerColor(data: Uint8ClampedArray, width: number, height: number) {
    const sampleSize = Math.max(4, Math.floor(Math.min(width, height) * 0.02));
    const samples = [
        { x: 0, y: 0 },
        { x: width - sampleSize, y: 0 },
        { x: 0, y: height - sampleSize },
        { x: width - sampleSize, y: height - sampleSize },
    ];
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    samples.forEach(({ x, y }) => {
        for (let py = y; py < y + sampleSize; py += 1) {
            for (let px = x; px < x + sampleSize; px += 1) {
                const idx = (py * width + px) * 4;
                r += data[idx];
                g += data[idx + 1];
                b += data[idx + 2];
                count += 1;
            }
        }
    });
    return {
        r: Math.round(r / count),
        g: Math.round(g / count),
        b: Math.round(b / count)
    };
}

export default function BackgroundRemoveEditor() {
    const router = useRouter();
    const { originalImage, setOriginalImage } = useAppStore();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [processedBlob, setProcessedBlob] = useState<Blob | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [tolerance, setTolerance] = useState(45);
    const [softness, setSoftness] = useState(18);
    const [keyColor, setKeyColor] = useState('#00ff99');
    const [downloadFormat, setDownloadFormat] = useState<'png' | 'webp' | 'jpg'>('png');

    const baseImageRef = useRef<ImageData | null>(null);
    const baseSizeRef = useRef({ width: 0, height: 0 });

    useEffect(() => {
        if (!originalImage) {
            router.push('/ai/background-remove');
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
            const sample = sampleCornerColor(data.data, canvas.width, canvas.height);
            setKeyColor(rgbToHex(sample.r, sample.g, sample.b));
        };
        loadOriginal();
    }, [originalImage, router]);

    const processImage = useCallback(async () => {
        const base = baseImageRef.current;
        if (!base) return;
        setIsProcessing(true);
        await new Promise((resolve) => setTimeout(resolve, 0));

        const { width, height } = baseSizeRef.current;
        const output = new ImageData(new Uint8ClampedArray(base.data), width, height);
        const key = hexToRgb(keyColor);
        const threshold = (tolerance / 100) * 180 + 10;
        const feather = (softness / 100) * 120;

        for (let i = 0; i < output.data.length; i += 4) {
            const dr = output.data[i] - key.r;
            const dg = output.data[i + 1] - key.g;
            const db = output.data[i + 2] - key.b;
            const dist = Math.sqrt(dr * dr + dg * dg + db * db);

            if (dist <= threshold) {
                output.data[i + 3] = 0;
            } else if (feather > 0 && dist <= threshold + feather) {
                const ratio = (dist - threshold) / feather;
                output.data[i + 3] = clamp(Math.round(ratio * 255), 0, 255);
            }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.putImageData(output, 0, 0);

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
    }, [keyColor, tolerance, softness]);

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
        if (downloadFormat === 'jpg') {
            const img = new Image();
            img.src = URL.createObjectURL(processedBlob);
            await img.decode();
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const jpgBlob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95);
            });
            if (jpgBlob) blob = jpgBlob;
        } else if (downloadFormat === 'webp') {
            const img = new Image();
            img.src = URL.createObjectURL(processedBlob);
            await img.decode();
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(img, 0, 0);
            const webpBlob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob((b) => resolve(b), 'image/webp', 0.95);
            });
            if (webpBlob) blob = webpBlob;
        }
        const filename = buildFilename(originalImage.name, 'bg-removed', downloadFormat);
        downloadImage(blob, filename);
    };

    if (!originalImage) return null;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-background">
            <div className="flex-grow flex flex-col items-center justify-center p-10">
                <div className="relative max-w-3xl w-full">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Background removed preview" className="w-full rounded-2xl border-4 border-card-border shadow-2xl object-contain h-[520px]" />
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
                            router.push('/ai/background-remove');
                        }}
                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all border border-card-border"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2 text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                        <Eraser className="h-4 w-4" />
                        Background Remove
                    </div>
                </div>

                <div className="bg-background rounded-3xl border border-card-border p-6 space-y-5">
                    <div>
                        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2">감지 색상</p>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={keyColor}
                                onChange={(e) => setKeyColor(e.target.value)}
                                className="h-10 w-16 rounded-xl border border-card-border bg-background"
                            />
                            <button
                                onClick={() => processImage()}
                                className="px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border border-card-border text-text-secondary hover:text-text-primary"
                            >
                                <Pipette className="h-3.5 w-3.5 inline mr-1" />
                                재분석
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">허용 범위</label>
                        <input
                            type="range"
                            min="5"
                            max="100"
                            value={tolerance}
                            onChange={(e) => setTolerance(Number(e.target.value))}
                            className="w-full accent-accent"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2 block">경계 부드러움</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={softness}
                            onChange={(e) => setSoftness(Number(e.target.value))}
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
                        배경 제거 다운로드
                    </button>
                </div>
            </div>
        </div>
    );
}
