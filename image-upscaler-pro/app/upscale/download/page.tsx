'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import DownloadGate from '@/components/shared/DownloadGate';
import HelpPanel from '@/components/shared/HelpPanel';
import Toast from '@/components/shared/Toast';
import { Download, ArrowLeft } from 'lucide-react';
import { buildFilename } from '@/lib/utils/filename';

export default function DownloadPage() {
    const router = useRouter();
    const { originalImage, processedImage, reset, upscaleFactor, targetSize } = useAppStore();
    const [originalUrl, setOriginalUrl] = useState<string | null>(null);
    const [processedUrl, setProcessedUrl] = useState<string | null>(null);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (!processedImage || !originalImage) {
            router.push('/upscale');
            return;
        }

        const loadImages = async () => {
            const oBlob = await imageDb.getImage(originalImage.id);
            const pBlob = await imageDb.getImage(processedImage.id);

            if (oBlob) setOriginalUrl(URL.createObjectURL(oBlob));
            if (pBlob) setProcessedUrl(URL.createObjectURL(pBlob));
        };

        loadImages();

        // Do NOT revoke immediately as the user might need it for a second attempt or click
    }, [processedImage, originalImage, router]);

    const handleDownload = () => {
        if (!processedUrl || !processedImage) return;

        // Using a more robust download method
        const link = document.createElement('a');
        link.href = processedUrl;
        const scaleLabel = targetSize ? targetSize.label.replace(/\s+/g, '') : `${upscaleFactor}x`;
        const ext = processedImage.name.split('.').pop() || 'png';
        link.setAttribute('download', buildFilename(originalImage?.name || processedImage.name, `upscale${scaleLabel}`, ext));
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const handleReset = () => {
        reset();
        router.push('/upscale');
    };

    if (!processedImage || !originalUrl || !processedUrl || !originalImage) return null;

    return (
        <div className="relative min-h-screen bg-background transition-colors duration-300">
            {/* Toast Notification */}
            {showToast && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200]">
                    <Toast
                        type="success"
                        message="변환 완료! 이미지가 성공적으로 다운로드되었습니다."
                        onClose={() => setShowToast(false)}
                    />
                </div>
            )}

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Header Navigation */}
                <div className="flex items-center justify-between mb-10">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-medium transition-all group"
                    >
                        <div className="p-2 rounded-xl bg-card-bg border border-card-border shadow-sm group-hover:scale-105 transition-all">
                            <ArrowLeft className="h-4 w-4" />
                        </div>
                        <span className="text-sm">다시 시작하기</span>
                    </button>
                    <div className="bg-card-bg px-4 py-1.5 rounded-full border border-card-border text-[11px] font-bold text-text-tertiary uppercase tracking-widest">
                        AI Upscale Result
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                    {/* Left: BEFORE / AFTER Side by Side */}
                    <div className="xl:col-span-8 flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* BEFORE */}
                            <div className="relative w-full bg-gray-900 rounded-[2rem] border-4 border-gray-800 shadow-2xl overflow-hidden">
                                <div className="absolute top-6 left-6 z-10">
                                    <div className="bg-black/80 backdrop-blur-xl text-white text-4xl md:text-5xl font-black uppercase tracking-wider px-6 py-3 rounded-xl border-4 border-white/40 shadow-2xl">
                                        BEFORE
                                    </div>
                                    {originalImage.width && originalImage.height && (
                                        <div className="text-left mt-2 text-white/90 text-xs font-bold ml-1">
                                            {originalImage.width} × {originalImage.height}px
                                        </div>
                                    )}
                                </div>
                                <div className="w-full h-[560px] flex items-center justify-center">
                                    <img
                                        src={originalUrl}
                                        alt="Before"
                                        className="max-w-full max-h-full object-contain"
                                        draggable={false}
                                    />
                                </div>
                            </div>

                            {/* AFTER */}
                            <div className="relative w-full bg-gray-900 rounded-[2rem] border-4 border-gray-800 shadow-2xl overflow-hidden">
                                <div className="absolute top-6 right-6 z-10">
                                    <div className="bg-emerald-600/90 backdrop-blur-xl text-white text-4xl md:text-5xl font-black uppercase tracking-wider px-6 py-3 rounded-xl border-4 border-white/40 shadow-2xl">
                                        AFTER
                                    </div>
                                    {processedImage.width && processedImage.height && (
                                        <div className="text-right mt-2 text-white/90 text-xs font-bold mr-1">
                                            {processedImage.width} × {processedImage.height}px
                                        </div>
                                    )}
                                </div>
                                <div className="w-full h-[560px] flex items-center justify-center">
                                    <img
                                        src={processedUrl}
                                        alt="After"
                                        className="max-w-full max-h-full object-contain"
                                        draggable={false}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions & Guides */}
                    <div className="xl:col-span-4 flex flex-col gap-6">
                        <div className="bg-card-bg p-8 rounded-[2rem] border border-card-border shadow-sm">
                            <div className="mb-6">
                                <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1.5">최종 결과물</p>
                                <h2 className="text-xl font-bold text-text-primary truncate mb-2">{processedImage.name}</h2>
                                <div className="inline-flex items-center gap-2 text-accent bg-accent/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-accent/20">
                                    AI Upscale Success ({targetSize ? targetSize.label : `${upscaleFactor}x`})
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-background p-4 rounded-2xl border border-card-border">
                                    <p className="text-[9px] font-bold text-text-tertiary uppercase mb-1">용량</p>
                                    <p className="font-bold text-text-primary">{(processedImage.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <div className="bg-background p-4 rounded-2xl border border-card-border">
                                    <p className="text-[9px] font-bold text-text-tertiary uppercase mb-1">해상도</p>
                                    <p className="font-bold text-accent">{processedImage.width}x{processedImage.height}</p>
                                </div>
                            </div>

                            <div className="text-[11px] font-semibold text-text-tertiary bg-background border border-card-border rounded-2xl px-4 py-3 mb-6">
                                {(originalImage.size / 1024 / 1024).toFixed(2)}MB → {(processedImage.size / 1024 / 1024).toFixed(2)}MB /
                                {` ${originalImage.width}x${originalImage.height}px → ${processedImage.width}x${processedImage.height}px`}
                            </div>

                            <DownloadGate onDownload={handleDownload}>
                                <button className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.98]">
                                    <Download className="h-5 w-5" />
                                    이미지 다운로드
                                </button>
                            </DownloadGate>
                        </div>

                        <HelpPanel
                            title="다운로드"
                            guidelines={[
                                "무료 사용자는 하루 최대 5개의 작업 결과를 다운로드할 수 있습니다.",
                                "결과물에 워터마크가 포함되지 않은 선명한 고화질 원본입니다.",
                                "추가 편집이 필요하면 아래 툴박스로 이어가세요."
                            ]}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
