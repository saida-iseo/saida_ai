'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import { Scissors, Square, Image as ImageIcon, Maximize, Check, Download } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { buildFilename } from '@/lib/utils/filename';

export default function CropEditor() {
    const router = useRouter();
    const { originalImage, setProcessedImage } = useAppStore();
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [aspect, setAspect] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!originalImage) {
            router.push('/tools/crop');
            return;
        }
        const loadOriginal = async () => {
            const blob = await imageDb.getImage(originalImage.id);
            if (blob) setImgUrl(URL.createObjectURL(blob));
        };
        loadOriginal();
    }, [originalImage, router]);

    const handleCrop = async () => {
        if (!originalImage || !imgUrl) return;
        setIsProcessing(true);
        try {
            const blob = await imageDb.getImage(originalImage.id);
            if (!blob) return;
            
            const img = new Image();
            img.src = URL.createObjectURL(blob);
            await new Promise((resolve) => {
                img.onload = resolve;
            });

            // 비율에 따른 크롭 계산
            let cropX = 0, cropY = 0, cropWidth = img.width, cropHeight = img.height;
            
            if (aspect !== null) {
                const imgAspect = img.width / img.height;
                if (imgAspect > aspect) {
                    // 이미지가 더 넓음 - 좌우를 잘라냄
                    cropWidth = Math.round(img.height * aspect);
                    cropX = Math.round((img.width - cropWidth) / 2);
                } else {
                    // 이미지가 더 높음 - 상하를 잘라냄
                    cropHeight = Math.round(img.width / aspect);
                    cropY = Math.round((img.height - cropHeight) / 2);
                }
            } else {
                // Custom: 중앙 80% 크롭
                cropWidth = Math.round(img.width * 0.8);
                cropHeight = Math.round(img.height * 0.8);
                cropX = Math.round((img.width - cropWidth) / 2);
                cropY = Math.round((img.height - cropHeight) / 2);
            }

            const { cropImage, downloadImage } = await import('@/lib/utils/imageProcessor');
            const cropped = await cropImage(blob, cropX, cropY, cropWidth, cropHeight);
            const filename = buildFilename(originalImage.name, 'crop', originalImage.type.split('/')[1] || 'png');
            downloadImage(cropped, filename);
        } catch (error) {
            console.error('크롭 실패:', error);
            alert('크롭 중 오류가 발생했습니다.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!originalImage || !imgUrl) return null;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-background">
            <div className="flex-grow flex flex-col items-center justify-center p-12 overflow-auto bg-[radial-gradient(circle_at_center,_#111_0%,_#020617_100%)]">
                <div className="relative group max-w-2xl w-full">
                    {/* Crop Overlay Mock */}
                    <div className="absolute inset-0 border-2 border-red-500/50 z-20 pointer-events-none">
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20">
                            <div className="border border-white/20" />
                            <div className="border border-white/20" />
                            <div className="border border-white/20" />
                            <div className="border border-white/20" />
                            <div className="border border-white/20" />
                            <div className="border border-white/20" />
                            <div className="border border-white/20" />
                            <div className="border border-white/20" />
                            <div className="border border-white/20" />
                        </div>
                    </div>
                    <img src={imgUrl} alt="Preview" className="relative z-10 w-full rounded-2xl border-4 border-slate-800 shadow-2xl object-contain h-[500px] opacity-50" />
                </div>
            </div>

            <div className="w-[400px] border-l border-slate-800 bg-slate-900/50 backdrop-blur-xl p-8 flex flex-col gap-8">
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">잘라내기 옵션</p>
                    <h2 className="text-3xl font-black text-white tracking-tighter">영역 선택</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <AspectBtn active={aspect === null} onClick={() => setAspect(null)} icon={Maximize} label="Custom" />
                    <AspectBtn active={aspect === 1} onClick={() => setAspect(1)} icon={Square} label="1:1" />
                    <AspectBtn active={aspect === 16 / 9} onClick={() => setAspect(16 / 9)} icon={ImageIcon} label="16:9" />
                    <AspectBtn active={aspect === 4 / 3} onClick={() => setAspect(4 / 3)} icon={ImageIcon} label="4:3" />
                </div>

                <div className="mt-6">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">SNS 규격</p>
                    <div className="grid grid-cols-2 gap-3">
                        <AspectBtn active={aspect === 1} onClick={() => setAspect(1)} icon={ImageIcon} label="인스타 1:1" />
                        <AspectBtn active={aspect === 9 / 16} onClick={() => setAspect(9 / 16)} icon={ImageIcon} label="릴스 9:16" />
                        <AspectBtn active={aspect === 16 / 9} onClick={() => setAspect(16 / 9)} icon={ImageIcon} label="유튜브 16:9" />
                    </div>
                </div>

                <div className="mt-auto pt-8 border-t border-slate-800">
                    <button
                        onClick={handleCrop}
                        disabled={isProcessing}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-5 rounded-[1.5rem] text-xl transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Download className="h-6 w-6" />
                                크롭된 이미지 다운로드
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AspectBtn({ active, icon: Icon, label, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all",
                active ? "bg-white border-white text-slate-950 shadow-xl" : "bg-slate-800/50 border-slate-800 text-slate-500 hover:text-white"
            )}
        >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </button>
    )
}
