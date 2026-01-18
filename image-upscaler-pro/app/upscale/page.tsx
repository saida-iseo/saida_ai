'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileWarning, Cloud, Box, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import FeatureBox from '@/components/ui/FeatureBox';
import { addRecentHistory, createThumbnail } from '@/lib/history/recentHistory';
import { downloadImage } from '@/lib/utils/imageProcessor';
import { buildFilename } from '@/lib/utils/filename';
import type { UpscaleOptions, WorkerResponse } from '@/lib/upscale/types';

export default function UpscaleUpload() {
    const router = useRouter();
    const setOriginalImage = useAppStore((state) => state.setOriginalImage);
    const {
        upscaleFactor,
        outputFormat,
        quality,
        upscaleMode,
        faceRestore,
        gpuAcceleration,
        qualityPreset,
        fidelity,
        tileAuto,
        tileSize,
        tileOverlap,
        maxPixels,
        targetSize,
    } = useAppStore();
    const [error, setError] = useState<string | null>(null);
    const [batchActive, setBatchActive] = useState(false);
    const [batchDone, setBatchDone] = useState(0);
    const [batchTotal, setBatchTotal] = useState(0);
    const [batchCurrent, setBatchCurrent] = useState('');
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        return () => {
            workerRef.current?.terminate();
            workerRef.current = null;
        };
    }, []);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        if (acceptedFiles.length > 10) {
            setError('무료 배치는 최대 10장까지 가능합니다.');
            return;
        }

        const file = acceptedFiles[0];

        // Validate file type
        if (!acceptedFiles.every((f) => ['image/png', 'image/jpeg', 'image/webp'].includes(f.type))) {
            setError('지원하지 않는 파일 형식입니다. (PNG, JPG, WebP만 가능)');
            return;
        }

        try {
            if (acceptedFiles.length > 1) {
                await runBatchUpscale(acceptedFiles);
                return;
            }

            const id = crypto.randomUUID();
            await imageDb.saveImage(id, file);

            // Get dimensions
            const img = new Image();
            img.src = URL.createObjectURL(file);
            await img.decode();

            setOriginalImage({
                id,
                name: file.name,
                type: file.type,
                size: file.size,
                width: img.width,
                height: img.height,
            });

            const thumbUrl = await createThumbnail(file);
            addRecentHistory({
                id: crypto.randomUUID(),
                tool: 'AI 업스케일',
                route: '/upscale/editor',
                imageId: id,
                name: file.name,
                type: file.type,
                size: file.size,
                width: img.width,
                height: img.height,
                thumbUrl,
                createdAt: Date.now(),
            });

            router.push('/upscale/editor');
        } catch (err) {
            console.error('File processing error:', err);
            setError('이미지 처리 중 오류가 발생했습니다.');
        }
    }, [
        setOriginalImage,
        router,
        upscaleFactor,
        outputFormat,
        quality,
        upscaleMode,
        faceRestore,
        gpuAcceleration,
        qualityPreset,
        fidelity,
        tileAuto,
        tileSize,
        tileOverlap,
        maxPixels,
        targetSize
    ]);

    const runBatchUpscale = async (files: File[]) => {
        setBatchActive(true);
        setBatchDone(0);
        setBatchTotal(files.length);

        const workerUrl = new URL('../../lib/workers/sr-upscale.worker.ts', import.meta.url);
        if (workerRef.current) workerRef.current.terminate();
        workerRef.current = new Worker(workerUrl);

        const processFile = (file: File) => {
            return new Promise<Blob>((resolve, reject) => {
                if (!workerRef.current) return reject(new Error('Worker unavailable'));

                const requestId = crypto.randomUUID();
                const options: UpscaleOptions = {
                    mode: upscaleMode,
                    scale: upscaleFactor,
                    preset: qualityPreset,
                    fidelity: fidelity / 100,
                    useGPU: gpuAcceleration,
                    faceRestore,
                    targetSize: targetSize || undefined,
                    tile: {
                        auto: tileAuto,
                        size: tileSize,
                        overlap: tileOverlap,
                        maxPixels,
                    },
                    output: {
                        format: outputFormat,
                        quality: quality / 100,
                    }
                };

                workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
                    const msg = e.data;
                    if (msg.type === 'error') reject(new Error(msg.message));
                    if (msg.type === 'result') resolve(msg.blob);
                };

                workerRef.current.postMessage({
                    type: 'upscale',
                    requestId,
                    imageBlob: file,
                    options,
                });
            });
        };

        try {
            for (const file of files) {
                setBatchCurrent(file.name);
                const id = crypto.randomUUID();
                await imageDb.saveImage(id, file);
                const img = new Image();
                img.src = URL.createObjectURL(file);
                await img.decode();
                const thumbUrl = await createThumbnail(file);
                addRecentHistory({
                    id: crypto.randomUUID(),
                    tool: 'AI 업스케일 (배치)',
                    route: '/upscale/editor',
                    imageId: id,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    width: img.width,
                    height: img.height,
                    thumbUrl,
                    createdAt: Date.now(),
                });

                const blob = await processFile(file);
                const scaleLabel = targetSize ? targetSize.label.replace(/\s+/g, '') : `${upscaleFactor}x`;
                const filename = buildFilename(file.name, `upscale${scaleLabel}`, outputFormat.split('/')[1] || 'png');
                downloadImage(blob, filename);
                setBatchDone((prev) => prev + 1);
            }
        } catch (err) {
            console.error(err);
            setError('배치 처리 중 오류가 발생했습니다.');
        } finally {
            workerRef.current?.terminate();
            workerRef.current = null;
            setBatchActive(false);
            setBatchCurrent('');
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.webp']
        },
        multiple: true,
        maxFiles: 10
    });

    return (
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 min-h-screen bg-background text-text-primary">
            <div className="text-center mb-16 animate-in fade-in slide-in-from-top-8 duration-1000">
                <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-red-500/20">
                    <Sparkles className="h-4 w-4" />
                    AI ENGINE A-VERSION
                </div>
                <h1 className="text-5xl font-black text-text-primary tracking-tighter mb-4 italic uppercase">이미지 업스케일</h1>
                <p className="text-text-secondary font-bold max-w-xl mx-auto leading-relaxed">
                    해상도를 높이고 싶은 이미지를 업로드하세요. <br />
                    인공지능이 픽셀을 분석하여 깨짐 없는 고화질로 복원합니다.
                </p>
                <p className="text-[11px] text-text-tertiary font-bold mt-4">무료 배치 업스케일은 최대 10장까지 지원됩니다.</p>
            </div>

            <div
                {...getRootProps()}
                className={cn(
                    "relative flex flex-col items-center justify-center min-h-[450px] border-4 border-dashed rounded-[3rem] transition-all cursor-pointer group px-8",
                    isDragActive
                        ? "border-red-500 bg-red-500/5 scale-[0.98]"
                        : "border-card-border bg-card-bg/50 hover:bg-card-bg hover:border-card-border shadow-2xl"
                )}
            >
                <input {...getInputProps()} />

                <div className={cn(
                    "h-24 w-24 rounded-3xl flex items-center justify-center transition-all duration-500 mb-8",
                    isDragActive ? "bg-red-500 text-white scale-110 rotate-12" : "bg-card-bg text-text-tertiary group-hover:bg-red-500 group-hover:text-white group-hover:rotate-6"
                )}>
                    <Upload className="h-10 w-10" />
                </div>

                <button className="bg-red-500 hover:bg-red-600 text-white font-black px-12 py-5 rounded-[2rem] text-xl shadow-2xl transition-all mb-6 hover:scale-105 active:scale-95">
                    {isDragActive ? "이미지를 여기에 놓으세요" : "여러 이미지 선택"}
                </button>

                <p className="text-text-tertiary font-bold uppercase tracking-widest text-[10px]">또는 이미지를 여기에 드래그 앤 드롭</p>

                {error && (
                    <div className="mt-8 flex items-center gap-2 text-red-400 bg-red-500/10 px-6 py-3 rounded-2xl text-sm border border-red-500/20 animate-bounce">
                        <FileWarning className="h-4 w-4" />
                        {error}
                    </div>
                )}

                {batchActive && (
                    <div className="mt-8 text-center text-slate-400 text-sm font-semibold">
                        배치 업스케일 진행 중: {batchDone}/{batchTotal} • {batchCurrent}
                    </div>
                )}

                {/* Cloud Importers */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 hidden md:flex">
                    <CloudButton icon={<Cloud className="h-4 w-4 text-blue-400" />} label="Google Drive" />
                    <CloudButton icon={<Box className="h-4 w-4 text-indigo-400" />} label="Dropbox" />
                </div>
            </div>

            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-center px-4 mb-16">
                <Feature label="무료 및 익명" description="가입 없이 바로 사용할 수 있습니다." />
                <Feature label="로컬 처리" description="데이터가 서버에 전송되지 않아 안전합니다." />
                <Feature label="고품질 강화" description="Saida Engine을 통한 선명한 업스케일." />
            </div>

            {/* Feature Highlights - AI 이미지 화질 개선 기술 */}
            <div className="mb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                <FeatureBox
                    title="AI 이미지 화질 개선 기술"
                    icon={<Sparkles className="h-6 w-6" />}
                    features={[
                        {
                            label: "흐릿한 사진 복원",
                            description: "야경, 어두운 조명 속 인물 사진도 AI가 디테일을 살려 선명하게 복원합니다."
                        },
                        {
                            label: "픽셀 깨짐 방지",
                            description: "단순 확장이 아닌 인공지능이 픽셀을 예측하여 자연스러운 고화질을 구현합니다."
                        },
                        {
                            label: "전문가 수준 결과",
                            description: "사진관 보정처럼 자연스럽고 디테일한 복원 결과를 제공합니다."
                        }
                    ]}
                />
            </div>
        </div>
    );
}

function CloudButton({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); alert('서비스 준비 중입니다.'); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-300 hover:text-white"
        >
            <div className="p-1 rounded-lg bg-white/5">{icon}</div>
            <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
        </button>
    );
}

function Feature({ label, description }: { label: string; description: string }) {
    return (
        <div className="group">
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-2 group-hover:text-red-500 transition-colors">{label}</h4>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">{description}</p>
        </div>
    );
}
