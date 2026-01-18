'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import { Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { downloadImage } from '@/lib/utils/imageProcessor';
import { buildFilename } from '@/lib/utils/filename';

export default function AdjustEditor() {
    const router = useRouter();
    const { originalImage } = useAppStore();
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
    const [brightness, setBrightness] = useState(0);
    const [contrast, setContrast] = useState(0);
    const [saturation, setSaturation] = useState(0);

    useEffect(() => {
        if (!originalImage) {
            router.push('/tools/adjust');
            return;
        }
        const loadOriginal = async () => {
            const blob = await imageDb.getImage(originalImage.id);
            if (blob) {
                setOriginalBlob(blob);
                setImgUrl(URL.createObjectURL(blob));
            }
        };
        loadOriginal();
    }, [originalImage, router]);

    const updatePreview = useCallback(async (blob: Blob) => {
        if (!originalImage) return;
        setIsProcessing(true);
        try {
            const img = new Image();
            img.src = URL.createObjectURL(blob);
            await img.decode();

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const b = 1 + brightness / 100;
            const c = 1 + contrast / 100;
            const s = 1 + saturation / 100;
            ctx.filter = `brightness(${b}) contrast(${c}) saturate(${s})`;
            ctx.drawImage(img, 0, 0);
            ctx.filter = 'none';

            const previewBlob = await new Promise<Blob | null>((resolve) =>
                canvas.toBlob((out) => resolve(out), blob.type || 'image/png', 0.95)
            );
            if (!previewBlob) return;
            const url = URL.createObjectURL(previewBlob);
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return url;
            });
        } finally {
            setIsProcessing(false);
        }
    }, [brightness, contrast, saturation, originalImage]);

    useEffect(() => {
        if (!originalBlob) return;
        const t = setTimeout(() => updatePreview(originalBlob), 200);
        return () => clearTimeout(t);
    }, [originalBlob, brightness, contrast, saturation, updatePreview]);

    const handleDownload = async () => {
        if (!originalBlob || !previewUrl || !originalImage) return;
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        const filename = buildFilename(originalImage.name, 'adjust', originalImage.type.split('/')[1] || 'png');
        downloadImage(blob, filename);
    };

    if (!originalImage || !imgUrl) return null;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-background">
            <div className="flex-grow flex flex-col items-center justify-center p-12 overflow-auto">
                <div className="relative group max-w-2xl w-full">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Adjusted Preview" className="relative z-10 w-full rounded-2xl border-4 border-card-border shadow-2xl object-contain h-[500px]" />
                    ) : (
                        <img src={imgUrl} alt="Original" className="relative z-10 w-full rounded-2xl border-4 border-card-border shadow-2xl object-contain h-[500px] opacity-50" />
                    )}
                </div>
            </div>

            <div className="w-[400px] border-l border-card-border bg-card-bg backdrop-blur-xl p-8 flex flex-col gap-8">
                <div>
                    <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-2">컬러 보정 옵션</p>
                    <h2 className="text-3xl font-black text-text-primary tracking-tighter">톤 조절</h2>
                </div>

                <div className="space-y-6">
                    <Slider label="밝기" value={brightness} setValue={setBrightness} />
                    <Slider label="대비" value={contrast} setValue={setContrast} />
                    <Slider label="채도" value={saturation} setValue={setSaturation} />
                </div>

                <div className="mt-auto pt-8 border-t border-card-border">
                    <button
                        onClick={handleDownload}
                        disabled={isProcessing || !previewUrl}
                        className={cn(
                            "w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-5 rounded-[1.5rem] text-xl transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95",
                            (isProcessing || !previewUrl) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Download className="h-6 w-6" />}
                        보정된 이미지 다운로드
                    </button>
                </div>
            </div>
        </div>
    );
}

function Slider({ label, value, setValue }: { label: string; value: number; setValue: (val: number) => void }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">{label}</label>
                <span className="text-xs font-bold text-text-secondary">{value}%</span>
            </div>
            <input
                type="range"
                min="-40"
                max="40"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full accent-emerald-500"
            />
        </div>
    );
}
