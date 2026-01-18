'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import { useUpscale } from '@/hooks/useUpscale';
import { RotateCw, CornerUpRight, CornerUpLeft, Download } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function RotateEditor() {
    const router = useRouter();
    const { originalImage, setProcessedImage } = useAppStore();
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [rotation, setRotation] = useState(0);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (!originalImage) {
            router.push('/');
            return;
        }
        const loadOriginal = async () => {
            const blob = await imageDb.getImage(originalImage.id);
            if (blob) setImgUrl(URL.createObjectURL(blob));
        };
        loadOriginal();
    }, [originalImage, router]);

    const handleRotate = async () => {
        if (!originalImage || !imgUrl) return;
        setIsProcessing(true);
        try {
            const blob = await imageDb.getImage(originalImage.id);
            if (!blob) return;
            
            const { rotateImage, downloadImage } = await import('@/lib/utils/imageProcessor');
            const rotated = await rotateImage(blob, rotation);
            const filename = originalImage.name.replace(/\.[^/.]+$/, '') + `_rotated_${rotation}deg.${originalImage.type.split('/')[1] || 'png'}`;
            downloadImage(rotated, filename);
        } catch (error) {
            console.error('회전 실패:', error);
            alert('회전 중 오류가 발생했습니다.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!originalImage || !imgUrl) return null;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-slate-950">
            <div className="flex-grow flex flex-col items-center justify-center p-12 overflow-auto">
                <div className="relative group max-w-2xl w-full transition-transform duration-500" style={{ transform: `rotate(${rotation}deg)` }}>
                    <img src={imgUrl} alt="Preview" className="relative z-10 w-full rounded-2xl border-4 border-slate-800 shadow-2xl object-contain h-[500px]" />
                </div>
            </div>

            <div className="w-[400px] border-l border-slate-800 bg-slate-900/50 backdrop-blur-xl p-8 flex flex-col gap-8">
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">회전 옵션</p>
                    <h2 className="text-3xl font-black text-white tracking-tighter">방향 전환</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setRotation(prev => prev - 90)}
                        className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
                    >
                        <CornerUpLeft className="h-6 w-6" />
                        <span className="text-xs font-black uppercase tracking-widest">-90°</span>
                    </button>
                    <button
                        onClick={() => setRotation(prev => prev + 90)}
                        className="flex flex-col items-center gap-3 p-6 rounded-3xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
                    >
                        <CornerUpRight className="h-6 w-6" />
                        <span className="text-xs font-black uppercase tracking-widest">+90°</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={() => setRotation(180)}
                        className="p-5 rounded-3xl bg-slate-800/50 border border-slate-800 text-slate-500 hover:text-white font-bold text-sm tracking-tight"
                    >
                        180° 반전
                    </button>
                    <button
                        onClick={() => setRotation(0)}
                        className="p-3 rounded-3xl text-slate-600 hover:text-red-500 font-bold text-xs uppercase tracking-widest"
                    >
                        초기화
                    </button>
                </div>

                <div className="mt-auto pt-8 border-t border-slate-800">
                    <button
                        onClick={handleRotate}
                        disabled={isProcessing}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-black py-5 rounded-[1.5rem] text-xl transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <div className="h-6 w-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Download className="h-6 w-6" />
                                회전된 이미지 다운로드
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
