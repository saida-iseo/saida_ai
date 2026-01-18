'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Droplets, Download, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { buildFilename } from '@/lib/utils/filename';

interface BlurRegion {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    intensity: number;
    borderRadius: number; // 0-100 (0 = 사각형, 100 = 완전한 원)
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getBlurPx = (intensity: number, widthPx: number, heightPx: number) => {
    const minBlur = 2;
    const maxBlur = Math.max(minBlur, Math.min(widthPx, heightPx) / 5);
    const t = clamp(intensity / 100, 0, 1);
    const curved = Math.pow(t, 1.15);
    return Math.round(minBlur + (maxBlur - minBlur) * curved);
};

const getPreviewBlurPx = (intensity: number) => {
    const minBlur = 2;
    const maxBlur = 18;
    const t = clamp(intensity / 100, 0, 1);
    return Math.round(minBlur + (maxBlur - minBlur) * t);
};

export default function BlurEditor() {
    const router = useRouter();
    const { originalImage, reset } = useAppStore();
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
    const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
    const [regions, setRegions] = useState<BlurRegion[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);


    useEffect(() => {
        if (!originalImage) {
            router.push('/tools/blur');
            return;
        }

        const load = async () => {
            const blob = await imageDb.getImage(originalImage.id);
            if (blob) {
                setOriginalBlob(blob);
                setImgUrl(URL.createObjectURL(blob));
            }
        };
        load();

    }, [originalImage, router]);

    useEffect(() => {
        return () => {
            if (imgUrl) URL.revokeObjectURL(imgUrl);
        };
    }, [imgUrl]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const drawRoundedRectPath = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        r: number
    ) => {
        const radius = Math.max(0, Math.min(r, Math.min(w, h) / 2));
        if ('roundRect' in ctx) {
            ctx.roundRect(x, y, w, h, radius);
            return;
        }
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
    };

    const renderPreview = useCallback(async (blob: Blob, areas: BlurRegion[]) => {
        if (!originalImage) return null;
        const img = new Image();
        const blobUrl = URL.createObjectURL(blob);
        img.src = blobUrl;
        await img.decode();

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(img, 0, 0);

        for (const r of areas) {
            const rx = Math.round(r.x * canvas.width);
            const ry = Math.round(r.y * canvas.height);
            const rw = Math.max(1, Math.round(r.width * canvas.width));
            const rh = Math.max(1, Math.round(r.height * canvas.height));
            if (rw <= 0 || rh <= 0) continue;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = rw;
            tempCanvas.height = rh;
            const tctx = tempCanvas.getContext('2d');
            if (!tctx) continue;
            const blurPx = getBlurPx(r.intensity, rw, rh);
            const strength = clamp(r.intensity / 100, 0, 1);
            tctx.filter = `blur(${blurPx}px)`;
            tctx.drawImage(img, rx, ry, rw, rh, 0, 0, rw, rh);

            ctx.save();
            ctx.beginPath();
            const radius = (r.borderRadius / 100) * Math.min(rw, rh) / 2;
            drawRoundedRectPath(ctx, rx, ry, rw, rh, radius);
            ctx.clip();
            ctx.globalAlpha = 0.35 + 0.65 * strength;
            ctx.drawImage(tempCanvas, rx, ry);
            ctx.restore();
        }

        const mimeType = originalImage.type || 'image/png';
        const quality = mimeType === 'image/png' ? undefined : 0.95;
        const outBlob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), mimeType, quality);
        });
        URL.revokeObjectURL(blobUrl);
        return outBlob;
    }, [originalImage]);

    useEffect(() => {
        if (!originalBlob) return;
        if (regions.length === 0) {
            setPreviewUrl((prev) => {
                if (prev) URL.revokeObjectURL(prev);
                return null;
            });
            setPreviewBlob(null);
            return;
        }
        setIsPreviewing(true);
        const timer = setTimeout(async () => {
            try {
                const outBlob = await renderPreview(originalBlob, regions);
                if (!outBlob) return;
                const url = URL.createObjectURL(outBlob);
                setPreviewBlob(outBlob);
                setPreviewUrl((prev) => {
                    if (prev) URL.revokeObjectURL(prev);
                    return url;
                });
            } finally {
                setIsPreviewing(false);
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [originalBlob, regions, renderPreview]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        setIsDrawing(true);
        setStartPos({ x, y });
        setCurrentPos({ x, y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDrawing || !imageRef.current) return;
        const rect = imageRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        setCurrentPos({ x, y });
    };

    const handleMouseUp = () => {
        if (!isDrawing) return;
        setIsDrawing(false);

        const x = Math.min(startPos.x, currentPos.x);
        const y = Math.min(startPos.y, currentPos.y);
        const width = Math.abs(currentPos.x - startPos.x);
        const height = Math.abs(currentPos.y - startPos.y);

        if (width > 0.01 && height > 0.01) {
            const newRegion: BlurRegion = {
                id: crypto.randomUUID(),
                x, y, width, height,
                intensity: 20,
                borderRadius: 0
            };
            setRegions([...regions, newRegion]);
            setSelectedId(newRegion.id);
        }
    };

    const deleteRegion = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setRegions(regions.filter(r => r.id !== id));
        if (selectedId === id) setSelectedId(null);
    };

    const updateIntensity = (id: string, val: number) => {
        setRegions(regions.map(r => r.id === id ? { ...r, intensity: val } : r));
    };

    const updateBorderRadius = (id: string, val: number) => {
        setRegions(regions.map(r => r.id === id ? { ...r, borderRadius: val } : r));
    };

    const handleDownload = async () => {
        if (!originalImage) return;
        setIsProcessing(true);

        try {
            let blob = previewBlob;
            if (!blob && originalBlob) {
                blob = await renderPreview(originalBlob, regions);
            }
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = buildFilename(originalImage.name, 'blur', originalImage.type.split('/')[1] || 'png');
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!imgUrl) return null;

    const selectedRegion = regions.find(r => r.id === selectedId);

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-background overflow-hidden">
            {/* Editor Area */}
            <div className="flex-grow relative flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_#111_0%,_#020617_100%)] overflow-auto scrollbar-hide">
                <div
                    ref={containerRef}
                    className="relative shadow-2xl rounded-lg overflow-hidden border border-white/5 cursor-crosshair select-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                >
                    <img
                        ref={imageRef}
                        src={previewUrl ?? imgUrl}
                        alt="Blur target"
                        className="max-h-[80vh] w-auto pointer-events-none"
                    />

                    {/* Regions Preview */}
                    {regions.map(r => (
                        <div
                            key={r.id}
                            className={cn(
                                "absolute border-2 transition-all group",
                                selectedId === r.id ? "border-red-500 bg-red-500/10 z-20 shadow-[0_0_20px_rgba(239,68,68,0.3)]" : "border-white/40 hover:border-white z-10"
                            )}
                            style={{
                                left: `${r.x * 100}%`,
                                top: `${r.y * 100}%`,
                                width: `${r.width * 100}%`,
                                height: `${r.height * 100}%`,
                                backdropFilter: previewUrl ? 'none' : `blur(${getPreviewBlurPx(r.intensity)}px)`,
                                borderRadius: `${r.borderRadius}%`
                            }}
                            onClick={(e) => { e.stopPropagation(); setSelectedId(r.id); }}
                        >
                            <button
                                onClick={(e) => deleteRegion(r.id, e)}
                                className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </div>
                    ))}

                    {/* Current Drawing Box */}
                    {isDrawing && (
                        <div
                            className="absolute border-2 border-red-500 bg-red-500/10 pointer-events-none"
                            style={{
                                left: `${Math.min(startPos.x, currentPos.x) * 100}%`,
                                top: `${Math.min(startPos.y, currentPos.y) * 100}%`,
                                width: `${Math.abs(currentPos.x - startPos.x) * 100}%`,
                                height: `${Math.abs(currentPos.y - startPos.y) * 100}%`
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <div className="w-full lg:w-[400px] bg-card-bg backdrop-blur-xl border-l border-card-border p-8 flex flex-col">
                <div className="flex items-center justify-between mb-10">
                    <button
                        onClick={() => router.push('/tools/blur')}
                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 bg-red-500/20 text-red-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/30">
                            <Droplets className="h-3 w-3 fill-current" />
                            Blur Editor
                        </div>
                        <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1">Preview Mode</span>
                    </div>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 scrollbar-hide">
                    <h2 className="text-2xl font-black text-text-primary tracking-tighter mb-8 italic uppercase">Blur Regions</h2>

                    {regions.length === 0 ? (
                        <div className="text-center py-20 bg-card-bg rounded-3xl border border-dashed border-card-border">
                            <Droplets className="h-10 w-10 text-text-tertiary mx-auto mb-4 opacity-50" />
                            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest leading-loose">
                                마우스를 드래그하여<br />흐릿하게 만들 영역을 선택하세요
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {regions.map((r, i) => (
                                <div
                                    key={r.id}
                                    onClick={() => setSelectedId(r.id)}
                                    className={cn(
                                        "p-5 rounded-3xl border transition-all cursor-pointer",
                                        selectedId === r.id ? "bg-red-500/10 border-red-500/30" : "bg-white/5 border-white/5 hover:bg-white/10"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Region #{i + 1}</span>
                                        <button onClick={(e) => deleteRegion(r.id, e)} className="text-slate-500 hover:text-red-500 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">흐림 강도 (Intensity)</label>
                                    <div className="flex items-center gap-4 mb-4">
                                        <input
                                            type="range"
                                            min="2"
                                            max="100"
                                            value={r.intensity}
                                            disabled={isProcessing}
                                            onChange={(e) => updateIntensity(r.id, parseInt(e.target.value))}
                                            className="flex-grow accent-red-500"
                                        />
                                        <span className="text-xs font-black text-white w-8">{r.intensity}</span>
                                    </div>

                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">모서리 둥글기 (Border Radius)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={r.borderRadius}
                                            disabled={isProcessing}
                                            onChange={(e) => updateBorderRadius(r.id, parseInt(e.target.value))}
                                            className="flex-grow accent-red-500"
                                        />
                                        <span className="text-xs font-black text-white w-8">{r.borderRadius}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-10 pt-8 border-t border-white/5">
                    <button
                        onClick={handleDownload}
                        disabled={isProcessing || isPreviewing || regions.length === 0}
                        className={cn(
                            "w-full py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-2xl",
                            (isProcessing || isPreviewing || regions.length === 0)
                                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                                : "bg-red-500 hover:bg-red-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-red-500/20"
                        )}
                    >
                        {(isProcessing || isPreviewing) ? (
                            <>
                                <Loader2 className="h-6 w-6 animate-spin" />
                                처리 중...
                            </>
                        ) : (
                            <>
                                <Download className="h-6 w-6" />
                                블러 적용 후 다운로드
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
