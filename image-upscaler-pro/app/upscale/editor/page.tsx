'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import OptionsPanel from '@/components/ui/OptionsPanel';
import HelpPanel from '@/components/shared/HelpPanel';
import { useUpscale } from '@/hooks/useUpscale';
import { ArrowLeft, Sparkles, Settings2, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { resizeImage, downloadImage } from '@/lib/utils/imageProcessor';
import { buildFilename } from '@/lib/utils/filename';

export default function EditorPage() {
    const router = useRouter();
    const { originalImage, reset, isProcessing, progressStatus, upscaleFactor, processedImage, targetSize } = useAppStore();
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
    const { startUpscale, cancelUpscale } = useUpscale();
    const [zoom, setZoom] = useState<1 | 2>(1);

    useEffect(() => {
        if (!originalImage) {
            router.push('/upscale');
            return;
        }

        const loadOriginal = async () => {
            const blob = await imageDb.getImage(originalImage.id);
            if (blob) {
                setOriginalBlob(blob);
                setImgUrl(URL.createObjectURL(blob));
                updatePreview(blob, upscaleFactor);
            }
        };

        loadOriginal();

        return () => {
            if (imgUrl) URL.revokeObjectURL(imgUrl);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [originalImage, router]);

    const updatePreview = useCallback(async (blob: Blob, factor: number) => {
        if (!originalImage) return;
        try {
            const newWidth = Math.round((originalImage.width || 0) * factor);
            const newHeight = Math.round((originalImage.height || 0) * factor);
            const resized = await resizeImage(blob, newWidth, newHeight, 0.95);
            const url = URL.createObjectURL(resized);
            setPreviewUrl(prev => {
                if (prev) URL.revokeObjectURL(prev);
                return url;
            });
        } catch (error) {
            console.error('미리보기 생성 실패:', error);
        }
    }, [originalImage]);

    useEffect(() => {
        if (originalBlob && !isProcessing) {
            const scale = targetSize
                ? Math.min(targetSize.width / (originalImage?.width || 1), targetSize.height / (originalImage?.height || 1))
                : upscaleFactor;
            updatePreview(originalBlob, scale);
        }
    }, [upscaleFactor, targetSize, originalBlob, isProcessing, updatePreview, originalImage]);

    // 처리된 이미지가 있으면 그것을 사용
    useEffect(() => {
        if (processedImage) {
            const loadProcessed = async () => {
                const blob = await imageDb.getImage(processedImage.id);
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    setPreviewUrl(prev => {
                        if (prev) URL.revokeObjectURL(prev);
                        return url;
                    });
                }
            };
            loadProcessed();
        }
    }, [processedImage]);


    const handleDownload = async () => {
        if (processedImage) {
            // 처리된 이미지가 있으면 그것을 다운로드
            const blob = await imageDb.getImage(processedImage.id);
            if (blob) {
                const scaleLabel = targetSize ? targetSize.label.replace(/\s+/g, '') : `${scaleFactor}x`;
                const ext = processedImage.name.split('.').pop() || 'png';
                const filename = buildFilename(processedImage.name, `upscale${scaleLabel}`, ext);
                downloadImage(blob, filename);
            }
        } else if (originalBlob && previewUrl && originalImage) {
            // 미리보기 이미지를 다운로드
            try {
                const newWidth = Math.round((originalImage.width || 0) * scaleFactor);
                const newHeight = Math.round((originalImage.height || 0) * scaleFactor);
                const resized = await resizeImage(originalBlob, newWidth, newHeight, 0.95);
                const scaleLabel = targetSize ? targetSize.label.replace(/\s+/g, '') : `${scaleFactor}x`;
                const ext = originalImage.name.split('.').pop() || 'png';
                const filename = buildFilename(originalImage.name, `upscale${scaleLabel}`, ext);
                downloadImage(resized, filename);
            } catch (error) {
                console.error('다운로드 실패:', error);
                alert('다운로드 중 오류가 발생했습니다.');
            }
        }
    };

    const handleBack = () => {
        reset();
        router.push('/upscale');
    };

    if (!originalImage || !imgUrl) return null;

    const scaleFactor = targetSize
        ? Math.min(targetSize.width / (originalImage.width || 1), targetSize.height / (originalImage.height || 1))
        : upscaleFactor;
    const afterWidth = originalImage.width ? Math.round(originalImage.width * scaleFactor) : undefined;
    const afterHeight = originalImage.height ? Math.round(originalImage.height * scaleFactor) : undefined;

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-background">
            {/* Main Preview Area */}
            <div className="flex-grow flex flex-col items-center overflow-auto scrollbar-hide py-12 px-6 bg-[radial-gradient(circle_at_center,_#111_0%,_#020617_100%)]">
                <div className="w-full max-w-[1100px] flex flex-col gap-8">

                    {/* Editor Header - ReDarkified */}
                    <div className="flex items-center justify-between bg-slate-900/50 backdrop-blur-xl p-6 rounded-[2.5rem] border border-slate-800 shadow-2xl">
                        <div className="flex items-center gap-5">
                            <button
                                onClick={handleBack}
                                className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all border border-slate-700 shadow-lg"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <Sparkles className="h-4 w-4 text-red-500 fill-current" />
                                    <h2 className="text-xl font-black text-white tracking-tight">{originalImage.name}</h2>
                                    <div className="bg-white/5 text-slate-500 text-[9px] font-black px-2 py-0.5 rounded-md border border-white/10 uppercase tracking-widest">
                                        {processedImage ? 'AI Processed' : 'Preview Mode'}
                                    </div>
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                    {originalImage.type.replace('image/', '')} • {originalImage.width}x{originalImage.height} PX • {(originalImage.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center gap-3">
                            <div className="h-10 w-px bg-slate-800 mx-2" />
                            <div className="flex flex-col items-end">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Engine Status</p>
                                <div className="flex items-center gap-2">
                                    {isProcessing && <Loader2 className="h-3 w-3 text-red-500 animate-spin" />}
                                    <p className={cn(
                                        "text-sm font-black",
                                        isProcessing ? "text-red-500" : "text-emerald-500"
                                    )}>
                                        {isProcessing ? (progressStatus || '처리 중') : '준비 완료'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">확대 보기</div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setZoom(1)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all",
                                    zoom === 1 ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                                )}
                            >
                                100%
                            </button>
                            <button
                                onClick={() => setZoom(2)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all",
                                    zoom === 2 ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-400 hover:text-white"
                                )}
                            >
                                200%
                            </button>
                        </div>
                    </div>

                    {/* BEFORE / AFTER Side by Side */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* BEFORE */}
                        <div className="relative w-full bg-gray-900 rounded-[2rem] border-4 border-gray-800 shadow-2xl overflow-hidden">
                            <div className="absolute top-4 left-4 z-10">
                                <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl text-white text-2xl md:text-3xl font-bold px-4 py-2 rounded-lg border border-white/20 shadow-lg" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.05em' }}>
                                    Before
                                </div>
                                {originalImage.width && originalImage.height && (
                                    <div className="text-left mt-1.5 text-white/70 text-[10px] font-medium ml-1" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                        {originalImage.width} × {originalImage.height}px
                                    </div>
                                )}
                            </div>
                            <div className="w-full h-[560px] flex items-center justify-center bg-gray-950">
                                <img
                                    src={imgUrl}
                                    alt="Before"
                                    className="w-full h-full object-contain"
                                    style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                                    draggable={false}
                                />
                            </div>
                        </div>

                        {/* AFTER */}
                        <div className="relative w-full bg-gray-900 rounded-[2rem] border-4 border-gray-800 shadow-2xl overflow-hidden">
                            {previewUrl && !isProcessing ? (
                                <>
                                    <div className="absolute top-4 right-4 z-10">
                                        <div className="bg-gradient-to-br from-emerald-500/95 to-emerald-600/95 backdrop-blur-xl text-white text-2xl md:text-3xl font-bold px-4 py-2 rounded-lg border border-white/20 shadow-lg" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.05em' }}>
                                            After
                                        </div>
                                        {afterWidth && afterHeight && (
                                            <div className="text-right mt-1.5 text-white/70 text-[10px] font-medium mr-1" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                                                {afterWidth} × {afterHeight}px
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-full h-[560px] flex items-center justify-center bg-gray-950">
                                        <img
                                            src={previewUrl}
                                            alt="After"
                                            className="w-full h-full object-contain"
                                            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                                            draggable={false}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-[560px] flex items-center justify-center bg-gray-950">
                                    {isProcessing ? (
                                        <div className="text-center">
                                            <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mx-auto mb-4" />
                                            <p className="text-white text-lg font-bold">{progressStatus || '처리 중...'}</p>
                                        </div>
                                    ) : (
                                        <div className="text-center text-gray-500">
                                            <p className="text-lg font-bold">미리보기 준비 중...</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Download Button */}
                    {previewUrl && (
                        <div className="flex flex-col items-center gap-4">
                            <button
                                onClick={handleDownload}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-4 rounded-2xl text-lg transition-all shadow-xl flex items-center gap-3 active:scale-95"
                            >
                                <Download className="h-5 w-5" />
                                {processedImage ? 'AI 처리된 이미지 다운로드' : '미리보기 이미지 다운로드'}
                            </button>
                        </div>
                    )}

                    {/* Bottom Guide Panels */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                        <HelpPanel
                            title="A-Version Upscale"
                            guidelines={[
                                "기기 자원(CPU/GPU)을 사용하며 데이터는 서버로 전송되지 않습니다.",
                                "Tiling 기술이 적용되어 대용량 이미지도 메모리 부족 없이 처리합니다.",
                                "처리 중 멈춘 것처럼 보여도 백그라운드에서 연산이 수행 중입니다."
                            ]}
                        />
                        <div className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-slate-800/50 flex flex-col justify-center">
                            <div className="flex items-center gap-3 mb-4 text-red-500">
                                <Settings2 className="h-6 w-6" />
                                <h4 className="text-xl font-black tracking-tight text-white uppercase italic">Reliability First</h4>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                Saida A-Version은 속도보다 <span className="text-white">성공률</span>에 최적화되어 있습니다.
                                오류 발생 시 최적화 알고리즘이 자동으로 개입하여 결과물을 생성합니다.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Options Sidebar */}
            <OptionsPanel onUpscale={startUpscale} onCancel={cancelUpscale} />
        </div>
    );
}
