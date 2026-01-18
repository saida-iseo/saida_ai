'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import { useUpscale } from '@/hooks/useUpscale'; // We can adapt or rename this to a generic useProcessor hook later
import { Download, ArrowLeft, Files, Settings2, Sparkles, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function ConvertEditor() {
    const router = useRouter();
    const { originalImage, outputFormat, quality, setOptions } = useAppStore();
    const [imgUrl, setImgUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [convertedUrl, setConvertedUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!originalImage) {
            router.push('/tools/convert');
            return;
        }

        const loadOriginal = async () => {
            const blob = await imageDb.getImage(originalImage.id);
            if (blob) {
                setImgUrl(URL.createObjectURL(blob));
                updatePreview(blob);
            }
        };
        loadOriginal();
    }, [originalImage, router]);

    const updatePreview = async (blob: Blob) => {
        try {
            const { convertImage } = await import('@/lib/utils/imageProcessor');
            const converted = await convertImage(blob, outputFormat, quality / 100);
            const url = URL.createObjectURL(converted);
            if (convertedUrl) {
                URL.revokeObjectURL(convertedUrl);
            }
            setConvertedUrl(url);
        } catch (error) {
            console.error('미리보기 생성 실패:', error);
        }
    };

    useEffect(() => {
        if (imgUrl && originalImage) {
            const blob = imageDb.getImage(originalImage.id);
            blob.then(b => {
                if (b) updatePreview(b);
            });
        }
        return () => {
            if (convertedUrl) {
                URL.revokeObjectURL(convertedUrl);
            }
        };
    }, [outputFormat, quality, originalImage, imgUrl]);

    const handleConvert = async () => {
        if (!originalImage || !imgUrl) return;
        setIsProcessing(true);
        try {
            const blob = await imageDb.getImage(originalImage.id);
            if (!blob) return;
            
            const { convertImage, downloadImage } = await import('@/lib/utils/imageProcessor');
            const converted = await convertImage(blob, outputFormat, quality / 100);
            const ext = outputFormat.split('/')[1] || 'png';
            const filename = originalImage.name.replace(/\.[^/.]+$/, '') + `.${ext}`;
            downloadImage(converted, filename);
        } catch (error) {
            console.error('변환 실패:', error);
            alert('변환 중 오류가 발생했습니다.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!originalImage || !imgUrl) return null;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-slate-950">
            <div className="flex-grow flex flex-col items-center justify-center p-12 overflow-auto">
                <div className="relative group max-w-2xl w-full">
                    <div className="absolute inset-0 bg-white/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    {convertedUrl ? (
                        <img src={convertedUrl} alt="Converted Preview" className="relative z-10 w-full rounded-2xl border-4 border-slate-800 shadow-2xl object-contain h-[500px]" />
                    ) : (
                        <div className="relative z-10 w-full rounded-2xl border-4 border-slate-800 shadow-2xl h-[500px] flex items-center justify-center bg-slate-900">
                            <Loader2 className="h-12 w-12 text-slate-500 animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            <div className="w-[400px] border-l border-slate-800 bg-slate-900/50 backdrop-blur-xl p-8 flex flex-col gap-8">
                <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">이미지 변환 옵션</p>
                    <h2 className="text-3xl font-black text-white tracking-tighter">포맷 선택</h2>
                </div>

                <div className="flex flex-col gap-4">
                    <FormatButton
                        active={outputFormat === 'image/png'}
                        onClick={() => setOptions({ outputFormat: 'image/png' })}
                        label="PNG"
                        desc="투명 배경 보존, 고품질"
                    />
                    <FormatButton
                        active={outputFormat === 'image/jpeg'}
                        onClick={() => setOptions({ outputFormat: 'image/jpeg' })}
                        label="JPG"
                        desc="가장 호환성이 좋은 압축 포맷"
                    />
                    <FormatButton
                        active={outputFormat === 'image/webp'}
                        onClick={() => setOptions({ outputFormat: 'image/webp' })}
                        label="WebP"
                        desc="웹 최적화, 뛰어난 압축률"
                    />
                </div>

                {outputFormat !== 'image/png' && (
                    <div className="pt-4 border-t border-slate-800">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-slate-400">품질 ({quality}%)</label>
                        </div>
                        <input
                            type="range" min="1" max="100" value={quality}
                            onChange={(e) => setOptions({ quality: Number(e.target.value) })}
                            className="w-full accent-red-500 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer"
                        />
                    </div>
                )}

                <div className="mt-auto pt-8 border-t border-slate-800">
                    <button
                        onClick={handleConvert}
                        disabled={isProcessing || !convertedUrl}
                        className="w-full bg-red-500 hover:bg-red-600 disabled:bg-slate-800 text-white font-black py-5 rounded-[1.5rem] text-xl transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-6 w-6 animate-spin" />
                                변환 중...
                            </>
                        ) : (
                            <>
                                <Download className="h-6 w-6" />
                                변환된 이미지 다운로드
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function FormatButton({ active, label, desc, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center justify-between p-5 rounded-3xl border transition-all text-left",
                active ? "bg-white border-white shadow-xl scale-[1.02]" : "bg-slate-800/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-700"
            )}
        >
            <div>
                <p className={cn("text-xl font-black mb-0.5", active ? "text-slate-950" : "text-white")}>{label}</p>
                <p className={cn("text-[10px] font-bold", active ? "text-slate-500" : "text-slate-500")}>{desc}</p>
            </div>
            {active && (
                <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                </div>
            )}
        </button>
    );
}
