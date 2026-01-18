'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import { Zap, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { compressImage, downloadImage, convertImage } from '@/lib/utils/imageProcessor';

export default function CompressEditor() {
    const router = useRouter();
    const { originalImage, quality, setOptions } = useAppStore();
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [compressedUrl, setCompressedUrl] = useState<string | null>(null);
    const [compressedSize, setCompressedSize] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [originalBlob, setOriginalBlob] = useState<Blob | null>(null);
    const [targetSizeKB, setTargetSizeKB] = useState<number | null>(null);
    const [useTargetSize, setUseTargetSize] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState<'jpg' | 'png' | 'webp'>('jpg');

    useEffect(() => {
        if (!originalImage) {
            router.push('/tools/compress');
            return;
        }
        const loadOriginal = async () => {
            const blob = await imageDb.getImage(originalImage.id);
            if (blob) {
                setOriginalBlob(blob);
                setImgUrl(URL.createObjectURL(blob));
                // 초기 압축 미리보기
                updateCompressedPreview(blob, quality);
            }
        };
        loadOriginal();
    }, [originalImage, router]);

    const updateCompressedPreview = useCallback(async (blob: Blob, q: number, targetKB?: number | null) => {
        setIsProcessing(true);
        try {
            const compressed = await compressImage(blob, q, targetKB);
            const url = URL.createObjectURL(compressed);
            setCompressedUrl(url);
            setCompressedSize(compressed.size);
        } catch (error) {
            console.error('압축 실패:', error);
        } finally {
            setIsProcessing(false);
        }
    }, []);

    useEffect(() => {
        if (originalBlob) {
            // 기존 URL 정리
            if (compressedUrl) {
                URL.revokeObjectURL(compressedUrl);
            }
            const timeoutId = setTimeout(() => {
                updateCompressedPreview(originalBlob, quality, useTargetSize ? targetSizeKB : null);
            }, 300);
            return () => {
                clearTimeout(timeoutId);
                if (compressedUrl) {
                    URL.revokeObjectURL(compressedUrl);
                }
            };
        }
    }, [quality, originalBlob, useTargetSize, targetSizeKB, updateCompressedPreview]);

    const handleDownload = async () => {
        if (!originalBlob || !compressedUrl) return;
        try {
            let compressed = await compressImage(originalBlob, quality, useTargetSize ? targetSizeKB : null);
            
            // 포맷 변환
            if (downloadFormat !== 'jpg') {
                compressed = await convertImage(compressed, `image/${downloadFormat}`, 0.95);
            }
            
            const filename = originalImage.name.replace(/\.[^/.]+$/, '') + `_compressed.${downloadFormat}`;
            downloadImage(compressed, filename);
        } catch (error) {
            console.error('다운로드 실패:', error);
            alert('다운로드 중 오류가 발생했습니다.');
        }
    };

    if (!originalImage || !imgUrl) return null;

    const compressionRatio = originalImage.size > 0 
        ? ((1 - compressedSize / originalImage.size) * 100).toFixed(1)
        : '0';

    return (
        <div className="flex h-[calc(100vh-64px)] bg-slate-950">
            <div className="flex-grow flex flex-col items-center justify-center p-12 overflow-auto">
                <div className="relative group max-w-2xl w-full text-center">
                    {compressedUrl ? (
                        <img 
                            src={compressedUrl} 
                            alt="Compressed Preview" 
                            className="relative z-10 mx-auto rounded-2xl border-4 border-slate-800 shadow-2xl object-contain h-[500px]" 
                        />
                    ) : (
                        <div className="relative z-10 mx-auto rounded-2xl border-4 border-slate-800 shadow-2xl h-[500px] flex items-center justify-center">
                            <Loader2 className="h-12 w-12 text-slate-500 animate-spin" />
                        </div>
                    )}
                    <div className="mt-8 space-y-2">
                        <p className="text-slate-500 font-medium">
                            원본 용량: {(originalImage.size / 1024).toFixed(1)} KB
                        </p>
                        {compressedSize > 0 && (
                            <>
                                <p className="text-slate-400 font-medium">
                                    압축 후: {(compressedSize / 1024).toFixed(1)} KB
                                </p>
                                <p className={cn(
                                    "font-bold text-sm",
                                    Number(compressionRatio) > 0 ? "text-emerald-400" : "text-red-400"
                                )}>
                                    {Number(compressionRatio) > 0 ? '↓' : '↑'} {Math.abs(Number(compressionRatio))}% 
                                    {Number(compressionRatio) > 0 ? ' 감소' : ' 증가'}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="w-[400px] border-l border-slate-800 bg-slate-900/50 backdrop-blur-xl p-8 flex flex-col gap-8">
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">압축 옵션</p>
                    <h2 className="text-3xl font-black text-white tracking-tighter">품질 마스터</h2>
                </div>

                <div className="bg-slate-800/50 p-6 rounded-[2rem] border border-slate-700 space-y-6">
                    <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">압축 방식</label>
                        <button
                            onClick={() => setUseTargetSize(!useTargetSize)}
                            className={cn(
                                "w-10 h-5 rounded-full relative transition-all duration-300",
                                useTargetSize ? "bg-accent" : "bg-slate-600"
                            )}
                        >
                            <div className={cn(
                                "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm",
                                useTargetSize ? "translate-x-5" : "translate-x-0"
                            )} />
                        </button>
                    </div>

                    {useTargetSize ? (
                        <div>
                            <label className="text-sm font-black text-white uppercase tracking-tight mb-3 block">희망 파일 크기 (KB)</label>
                            <input
                                type="number"
                                min="1"
                                max={Math.ceil(originalImage.size / 1024)}
                                value={targetSizeKB || ''}
                                onChange={(e) => setTargetSizeKB(e.target.value ? Number(e.target.value) : null)}
                                className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-lg font-bold focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="예: 500"
                                disabled={isProcessing}
                            />
                            <p className="text-[10px] text-slate-500 mt-2">원본: {(originalImage.size / 1024).toFixed(1)} KB</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <label className="text-sm font-black text-white uppercase tracking-tight">품질 ({quality}%)</label>
                                <span className={cn(
                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                                    quality > 80 ? "bg-emerald-500 text-white" : quality > 50 ? "bg-amber-500 text-white" : "bg-red-500 text-white"
                                )}>
                                    {quality > 80 ? 'Best Quality' : quality > 50 ? 'Balanced' : 'Smallest Size'}
                                </span>
                            </div>
                            <input
                                type="range" min="1" max="100" value={quality}
                                onChange={(e) => setOptions({ quality: Number(e.target.value) })}
                                className="w-full accent-red-500 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
                                disabled={isProcessing}
                            />
                            <div className="flex justify-between mt-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                <span>Small</span>
                                <span>Perfect</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-auto pt-8 border-t border-slate-800 space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">다운로드 포맷</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['jpg', 'png', 'webp'] as const).map((fmt) => (
                                <button
                                    key={fmt}
                                    onClick={() => setDownloadFormat(fmt)}
                                    className={cn(
                                        "py-2 rounded-lg text-xs font-bold uppercase transition-all",
                                        downloadFormat === fmt
                                            ? "bg-red-500 text-white"
                                            : "bg-slate-700 text-slate-400 hover:text-white"
                                    )}
                                >
                                    {fmt.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={isProcessing || !compressedUrl}
                        className={cn(
                            "w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-5 rounded-[1.5rem] text-xl transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95",
                            (isProcessing || !compressedUrl) && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <Download className="h-6 w-6" />
                        압축된 이미지 다운로드 ({downloadFormat.toUpperCase()})
                    </button>
                </div>
            </div>
        </div>
    );
}
