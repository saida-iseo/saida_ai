'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Droplets, Download, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface BlurRegion {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    intensity: number;
    borderRadius: number; // 0-100 (0 = 사각형, 100 = 완전한 원)
}

export default function BlurEditor() {
    const router = useRouter();
    const { originalImage, reset } = useAppStore();
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [regions, setRegions] = useState<BlurRegion[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });
    const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
    const [isProcessing, setIsProcessing] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (!originalImage) {
            router.push('/tools/blur');
            return;
        }

        const load = async () => {
            const blob = await imageDb.getImage(originalImage.id);
            if (blob) setImgUrl(URL.createObjectURL(blob));
        };
        load();

        return () => { if (imgUrl) URL.revokeObjectURL(imgUrl); };
    }, [originalImage, router]);

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
        if (!imageRef.current || !originalImage) return;
        setIsProcessing(true);

        try {
            const canvas = document.createElement('canvas');
            canvas.width = originalImage.width!;
            canvas.height = originalImage.height!;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Draw original
            ctx.drawImage(imageRef.current, 0, 0);

            // Apply blurs
            for (const r of regions) {
                const rx = r.x * canvas.width;
                const ry = r.y * canvas.height;
                const rw = r.width * canvas.width;
                const rh = r.height * canvas.height;

                // Create a temp canvas for the blurred part
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = rw;
                tempCanvas.height = rh;
                const tctx = tempCanvas.getContext('2d');
                if (!tctx) continue;

                // Apply blur
                tctx.filter = `blur(${r.intensity}px)`;
                tctx.drawImage(canvas, rx, ry, rw, rh, 0, 0, rw, rh);

                // Create mask for rounded corners
                const maskCanvas = document.createElement('canvas');
                maskCanvas.width = rw;
                maskCanvas.height = rh;
                const maskCtx = maskCanvas.getContext('2d');
                if (!maskCtx) continue;

                const radius = (r.borderRadius / 100) * Math.min(rw, rh) / 2;
                maskCtx.fillStyle = 'black';
                maskCtx.fillRect(0, 0, rw, rh);
                maskCtx.globalCompositeOperation = 'destination-out';
                maskCtx.beginPath();
                maskCtx.roundRect(0, 0, rw, rh, radius);
                maskCtx.fill();

                // Apply mask
                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(maskCanvas, rx, ry);
                ctx.globalCompositeOperation = 'source-in';
                ctx.drawImage(tempCanvas, rx, ry);
                ctx.restore();
            }

            const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), originalImage.type));
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Saida_Blurred_${originalImage.name}`;
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
                        src={imgUrl}
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
                                backdropFilter: `blur(${r.intensity / 2}px)`,
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
                        disabled={isProcessing || regions.length === 0}
                        className={cn(
                            "w-full py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-2xl",
                            (isProcessing || regions.length === 0)
                                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                                : "bg-red-500 hover:bg-red-600 text-white hover:scale-[1.02] active:scale-[0.98] shadow-red-500/20"
                        )}
                    >
                        {isProcessing ? (
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
