'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../lib/store/useAppStore';
import { imageDb } from '../lib/db/imageDb';
import { useRouter } from 'next/navigation';
import type { UpscaleOptions, WorkerResponse } from '@/lib/upscale/types';

export function useUpscale() {
    const router = useRouter();
    const workerRef = useRef<Worker | null>(null);
    const requestIdRef = useRef<string | null>(null);
    const {
        originalImage,
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
        setProcessing,
        setProgress,
        setProgressStatus,
        setProgressDetail,
        setProcessedImage,
        setOptions,
        setDiagnostics,
    } = useAppStore();

    const cleanup = useCallback(() => {
        workerRef.current?.terminate();
        workerRef.current = null;
        requestIdRef.current = null;
    }, []);

    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    useEffect(() => {
        const available = typeof OffscreenCanvas !== 'undefined' && typeof WebGLRenderingContext !== 'undefined';
        setOptions({ gpuAvailable: available, gpuAcceleration: available ? gpuAcceleration : false });
    }, [setOptions, gpuAcceleration]);

    const initWorker = useCallback(() => {
        if (workerRef.current) cleanup();
        const workerUrl = new URL('../lib/workers/sr-upscale.worker.ts', import.meta.url);
        workerRef.current = new Worker(workerUrl);

        workerRef.current.onmessage = async (e: MessageEvent<WorkerResponse>) => {
            const message = e.data;

            if (message.type === 'progress') {
                const { doneTiles, totalTiles, etaSec, stage } = message.data;
                const percent = totalTiles ? Math.round((doneTiles / totalTiles) * 100) : 0;
                setProgress(percent);
                setProgressDetail({
                    doneTiles,
                    totalTiles,
                    etaSec: etaSec ?? null
                });

                if (stage === 'decode') setProgressStatus('이미지 분석 중...');
                else if (stage === 'upscale') setProgressStatus('타일 업스케일링 진행 중...');
                else if (stage === 'encode') setProgressStatus('출력 인코딩 중...');
            } else if (message.type === 'status') {
                setProgressStatus(message.message);
            } else if (message.type === 'result') {
                const { blob, width, height } = message;
                const id = crypto.randomUUID();
                await imageDb.saveImage(id, blob);

                setProcessedImage({
                    id,
                    name: `Saida_${originalImage?.name}`,
                    type: blob.type,
                    size: blob.size,
                    width,
                    height,
                });

                setProcessing(false);
                setProgressStatus('');
                setProgressDetail({ doneTiles: 0, totalTiles: 0, etaSec: null });
                router.push('/upscale/download');
            } else if (message.type === 'diagnostic') {
                setDiagnostics(message.data);
            } else if (message.type === 'error') {
                console.error('Processing error:', message.message);
                handleErrorFallback(message.message);
            }
        };
    }, [originalImage, setProcessedImage, setProcessing, setProgress, setProgressStatus, setProgressDetail, router, cleanup]);

    const handleErrorFallback = async (error: string) => {
        // A-Version Fallback Logic
        console.warn('Fallback triggered due to:', error);

        // Simulating a fallback path
        setProgressStatus('메모리가 부족하여 안전 모드로 전환합니다...');
        // In a real scenario, we would restart with lower scale or tiling
        // For this demo, we'll wait 1s and try a "safe" 2x if it was 4x
        setTimeout(() => {
            if (upscaleFactor === 4) {
                setOptions({ upscaleFactor: 2, tileAuto: true });
                startUpscale({ multiplier: 2, forceTiling: true });
            } else {
                // Final resort: Basic Upscale (WIP)
                setProcessing(false);
                alert('처리 중 오류가 발생했습니다. 이미지를 더 작게 잘라낸 후 다시 시도해주세요.');
            }
        }, 1000);
    };

    const startUpscale = async (options?: { multiplier?: number; width?: number; height?: number; forceTiling?: boolean }) => {
        if (!originalImage) return;

        initWorker();
        if (!workerRef.current) return;

        const blob = await imageDb.getImage(originalImage.id);
        if (!blob) return;

        setDiagnostics(null);
        setProcessing(true);
        setProgress(0);
        setProgressStatus('AI 엔진 준비 중...');
        setProgressDetail({ doneTiles: 0, totalTiles: 0, etaSec: null });

        const finalFactor = options?.multiplier || upscaleFactor || 1;
        
        const finalWidth = options?.width || (originalImage.width || 0) * finalFactor;
        const finalHeight = options?.height || (originalImage.height || 0) * finalFactor;
        const megapixels = (finalWidth * finalHeight) / 1000000;
        
        if (megapixels > 20) {
            alert('20MP보다 작은 이미지만 업스케일링할 수 있습니다.');
            setProcessing(false);
            return;
        }

        const requestId = crypto.randomUUID();
        requestIdRef.current = requestId;

        const upscaleOptions: UpscaleOptions = {
            mode: upscaleMode,
            scale: finalFactor as 2 | 4,
            preset: qualityPreset,
            fidelity: fidelity / 100,
            useGPU: gpuAcceleration,
            faceRestore,
            targetSize: targetSize || undefined,
            tile: {
                auto: options?.forceTiling ? true : tileAuto,
                size: tileSize,
                overlap: tileOverlap,
                maxPixels,
            },
            output: {
                format: outputFormat,
                quality: quality / 100,
            }
        };

        workerRef.current.postMessage({
            type: 'upscale',
            requestId,
            imageBlob: blob,
            options: upscaleOptions,
        });
    };

    const cancelUpscale = () => {
        if (!workerRef.current || !requestIdRef.current) return;
        workerRef.current.postMessage({ type: 'cancel', requestId: requestIdRef.current });
        setProcessing(false);
        setProgressStatus('취소됨');
        setProgress(0);
        setProgressDetail({ doneTiles: 0, totalTiles: 0, etaSec: null });
        setDiagnostics(null);
    };

    return { startUpscale, cancelUpscale, isProcessing: useAppStore().isProcessing, progress: useAppStore().progress };
}
