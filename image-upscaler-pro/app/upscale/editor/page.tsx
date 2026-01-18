'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import CompareSlider from '@/components/ui/CompareSlider';
import OptionsPanel from '@/components/ui/OptionsPanel';
import HelpPanel from '@/components/shared/HelpPanel';
import { useUpscale } from '@/hooks/useUpscale';
import { ArrowLeft, Sparkles, Settings2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { resizeImage, downloadImage, convertImage } from '@/lib/utils/imageProcessor';

export default function EditorPage() {
    const router = useRouter();
    const { originalImage, reset, isProcessing, progressStatus, upscaleFactor, processedImage } = useAppStore();
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
    const { startUpscale } = useUpscale();

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
            const newWidth = (originalImage.width || 0) * factor;
            const newHeight = (originalImage.height || 0) * factor;
            const resized = await resizeImage(blob, newWidth, newHeight, 0.95);
            const url = URL.createObjectURL(resized);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(url);
        } catch (error) {
            console.error('미리보기 생성 실패:', error);
        }
    }, [originalImage, previewUrl]);

    useEffect(() => {
        if (originalBlob && !isProcessing) {
            updatePreview(originalBlob, upscaleFactor);
        }
    }, [upscaleFactor, originalBlob, isProcessing, updatePreview]);

    // 처리된 이미지가 있으면 그것을 사용
    useEffect(() => {
        if (processedImage) {
            const loadProcessed = async () => {
                const blob = await imageDb.getImage(processedImage.id);
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                    }
                    setPreviewUrl(url);
                }
            };
            loadProcessed();
        }
    }, [processedImage, previewUrl]);

    const [downloadFormat, setDownloadFormat] = useState<'png' | 'webp' | 'jpg'>('png');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('saida_download_format') as 'png' | 'webp' | 'jpg' | null;
            if (saved) setDownloadFormat(saved);
        }
    }, []);

    const handleDownload = async () => {
        if (processedImage) {
            // 처리된 이미지가 있으면 그것을 다운로드
            const blob = await imageDb.getImage(processedImage.id);
            if (blob) {
                let finalBlob = blob;
                const { convertImage } = await import('@/lib/utils/imageProcessor');
                if (downloadFormat !== 'png') {
                    finalBlob = await convertImage(blob, `image/${downloadFormat}`, downloadFormat === 'jpg' ? 0.9 : 0.95);
                }
                const filename = processedImage.name.replace(/\.[^/.]+$/, '') + `.${downloadFormat}`;
                downloadImage(finalBlob, filename);
            }
        } else if (originalBlob && previewUrl) {
            // 미리보기 이미지를 다운로드
            try {
                const newWidth = (originalImage.width || 0) * upscaleFactor;
                const newHeight = (originalImage.height || 0) * upscaleFactor;
                const resized = await resizeImage(originalBlob, newWidth, newHeight, 0.95);
                const { convertImage } = await import('@/lib/utils/imageProcessor');
                let finalBlob = resized;
                if (downloadFormat !== 'png') {
                    finalBlob = await convertImage(resized, `image/${downloadFormat}`, downloadFormat === 'jpg' ? 0.9 : 0.95);
                }
                const filename = originalImage.name.replace(/\.[^/.]+$/, '') + `_${upscaleFactor}x.${downloadFormat}`;
                downloadImage(finalBlob, filename);
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

    const afterWidth = originalImage.width ? originalImage.width * upscaleFactor : undefined;
    const afterHeight = originalImage.height ? originalImage.height * upscaleFactor : undefined;

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-950">
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

                    {/* The Professional Shake-Free Slider */}
                    <CompareSlider
                        beforeUrl={imgUrl}
                        afterUrl={isProcessing ? null : previewUrl}
                        beforeW={originalImage.width}
                        beforeH={originalImage.height}
                        afterW={afterWidth}
                        afterH={afterHeight}
                    />

                    {/* Download Button */}
                    {previewUrl && (
                        <div className="flex flex-col items-center gap-4">
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block text-center">다운로드 포맷</label>
                                <div className="flex gap-2">
                                    {(['png', 'webp', 'jpg'] as const).map((fmt) => (
                                        <button
                                            key={fmt}
                                            onClick={() => {
                                                setDownloadFormat(fmt);
                                                if (typeof window !== 'undefined') {
                                                    localStorage.setItem('saida_download_format', fmt);
                                                }
                                            }}
                                            className={cn(
                                                "px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all",
                                                downloadFormat === fmt
                                                    ? "bg-emerald-500 text-white"
                                                    : "bg-slate-800 text-slate-400 hover:text-white"
                                            )}
                                        >
                                            {fmt.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleDownload}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-4 rounded-2xl text-lg transition-all shadow-xl flex items-center gap-3 active:scale-95"
                            >
                                <Loader2 className="h-5 w-5" />
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
            <OptionsPanel onUpscale={startUpscale} />
        </div>
    );
}
