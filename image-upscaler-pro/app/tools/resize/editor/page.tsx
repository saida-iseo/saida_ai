'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import { MoveDiagonal, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { resizeImage, downloadImage } from '@/lib/utils/imageProcessor';
import { buildFilename } from '@/lib/utils/filename';

export default function ResizeEditor() {
    const router = useRouter();
    const { originalImage } = useAppStore();
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [resizedUrl, setResizedUrl] = useState<string | null>(null);
    const [dims, setDims] = useState({ w: 0, h: 0 });
    const [aspectLocked, setAspectLocked] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);

    useEffect(() => {
        if (!originalImage) {
            router.push('/tools/resize');
            return;
        }
        setDims({ w: originalImage.width || 0, h: originalImage.height || 0 });

        const loadOriginal = async () => {
            const blob = await imageDb.getImage(originalImage.id);
            if (blob) {
                setOriginalBlob(blob);
                setImgUrl(URL.createObjectURL(blob));
            }
        };
        loadOriginal();
    }, [originalImage, router]);

    const updateResizedPreview = useCallback(async (blob: Blob, width: number, height: number) => {
        if (width <= 0 || height <= 0) return;
        setIsProcessing(true);
        try {
            const resized = await resizeImage(blob, width, height, 0.95);
            const url = URL.createObjectURL(resized);
            // 기존 URL 정리
            if (resizedUrl) {
                URL.revokeObjectURL(resizedUrl);
            }
            setResizedUrl(url);
        } catch (error) {
            console.error('리사이즈 실패:', error);
        } finally {
            setIsProcessing(false);
        }
    }, [resizedUrl]);

    useEffect(() => {
        if (originalBlob && dims.w > 0 && dims.h > 0) {
            const timeoutId = setTimeout(() => {
                updateResizedPreview(originalBlob, dims.w, dims.h);
            }, 300); // 디바운스
            return () => clearTimeout(timeoutId);
        }
        return () => {
            if (resizedUrl) {
                URL.revokeObjectURL(resizedUrl);
            }
        };
    }, [dims, originalBlob, updateResizedPreview]);

    const handleWidthChange = (val: number) => {
        const newW = Math.max(1, val);
        setDims(prev => {
            const newH = aspectLocked && originalImage?.width 
                ? Math.round((newW / originalImage.width) * (originalImage.height || 0)) 
                : prev.h;
            return { w: newW, h: Math.max(1, newH) };
        });
    };

    const handleHeightChange = (val: number) => {
        const newH = Math.max(1, val);
        setDims(prev => {
            const newW = aspectLocked && originalImage?.height 
                ? Math.round((newH / originalImage.height) * (originalImage.width || 0)) 
                : prev.w;
            return { w: Math.max(1, newW), h: newH };
        });
    };

    const handleDownload = async () => {
        if (!originalBlob || dims.w <= 0 || dims.h <= 0) return;
        try {
            const resized = await resizeImage(originalBlob, dims.w, dims.h, 0.95);
            const filename = buildFilename(originalImage.name, `resize${dims.w}x${dims.h}`, originalImage.type.split('/')[1] || 'png');
            downloadImage(resized, filename);
        } catch (error) {
            console.error('다운로드 실패:', error);
            alert('다운로드 중 오류가 발생했습니다.');
        }
    };

    if (!originalImage || !imgUrl) return null;

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-background transition-colors duration-300">
            <div className="flex-grow flex flex-col items-center justify-center p-8 lg:p-12 overflow-auto">
                <div className="relative group max-w-2xl w-full">
                    {resizedUrl ? (
                        <img 
                            src={resizedUrl} 
                            alt="Resized Preview" 
                            className="relative z-10 w-full rounded-3xl border border-card-border shadow-2xl object-contain max-h-[60vh] transition-all" 
                        />
                    ) : isProcessing ? (
                        <div className="relative z-10 w-full rounded-3xl border border-card-border shadow-2xl max-h-[60vh] flex items-center justify-center bg-card-bg min-h-[400px]">
                            <Loader2 className="h-12 w-12 text-text-tertiary animate-spin" />
                        </div>
                    ) : (
                        <img 
                            src={imgUrl} 
                            alt="Original" 
                            className="relative z-10 w-full rounded-3xl border border-card-border shadow-2xl object-contain max-h-[60vh] transition-all opacity-50" 
                        />
                    )}
                    <div className="absolute inset-0 bg-accent/5 blur-3xl rounded-full -z-10 group-hover:bg-accent/10 transition-colors" />
                    {resizedUrl && (
                        <div className="mt-4 text-center">
                            <p className="text-text-secondary text-sm font-medium">
                                {dims.w} × {dims.h} px
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full lg:w-[380px] border-t lg:border-t-0 lg:border-l border-card-border bg-card-bg backdrop-blur-xl p-8 flex flex-col gap-8 transition-colors duration-300 overflow-y-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1.5">Resize Tool</p>
                        <h2 className="text-xl font-bold text-text-primary tracking-tight">크기 조정</h2>
                    </div>
                    <div className="bg-accent/10 text-accent px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border border-accent/20">
                        Preview
                    </div>
                </div>

                <div className="bg-background rounded-3xl border border-card-border p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4 items-end">
                        <div className="relative group">
                            <label className="text-[10px] font-bold text-text-tertiary mb-2 block ml-1 uppercase tracking-widest">Width</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    value={dims.w}
                                    onChange={e => handleWidthChange(Number(e.target.value))}
                                    className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-base font-bold text-text-primary outline-none focus:ring-2 focus:ring-accent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-text-tertiary pointer-events-none">PX</span>
                            </div>
                        </div>

                        <div className="relative group">
                            <label className="text-[10px] font-bold text-text-tertiary mb-2 block ml-1 uppercase tracking-widest">Height</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    value={dims.h}
                                    onChange={e => handleHeightChange(Number(e.target.value))}
                                    className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-base font-bold text-text-primary outline-none focus:ring-2 focus:ring-accent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-bold text-text-tertiary pointer-events-none">PX</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-medium text-text-secondary">비율 고정</span>
                        <button
                            onClick={() => setAspectLocked(!aspectLocked)}
                            className={cn(
                                "w-10 h-5 rounded-full relative transition-all duration-300",
                                aspectLocked ? "bg-accent" : "bg-text-tertiary/20"
                            )}
                        >
                            <div className={cn(
                                "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm",
                                aspectLocked ? "translate-x-5" : "translate-x-0"
                            )} />
                        </button>
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3 ml-1">추천 프리셋</p>
                    <div className="grid grid-cols-2 gap-2">
                        <PresetBtn label="Web Full HD" onClick={() => handleWidthChange(1920)} />
                        <PresetBtn label="Mobile Sharp" onClick={() => handleWidthChange(1080)} />
                        <PresetBtn label="Square Grid" onClick={() => { setAspectLocked(false); setDims({ w: 1024, h: 1024 }); }} />
                        <PresetBtn label="Half Size" onClick={() => handleWidthChange(Math.round((originalImage.width || 0) / 2))} />
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-card-border">
                    <button
                        onClick={handleDownload}
                        disabled={isProcessing || !resizedUrl || dims.w <= 0 || dims.h <= 0}
                        className={cn(
                            "w-full bg-vibrant-green hover:bg-vibrant-green/90 text-white font-bold py-4 rounded-2xl text-lg transition-all shadow-lg shadow-vibrant-green/20 flex items-center justify-center gap-3 active:scale-95",
                            (isProcessing || !resizedUrl || dims.w <= 0 || dims.h <= 0) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Download className="h-5 w-5" />
                        리사이즈된 이미지 다운로드
                    </button>
                </div>
            </div>
        </div>
    );
}

function PresetBtn({ label, onClick }: any) {
    return (
        <button onClick={onClick} className="bg-background hover:bg-card-bg text-text-secondary font-semibold py-3 rounded-xl text-[11px] transition-all border border-card-border">
            {label}
        </button>
    )
}
