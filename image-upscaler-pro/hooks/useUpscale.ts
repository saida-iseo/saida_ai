'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../lib/store/useAppStore';
import { imageDb } from '../lib/db/imageDb';
import { useRouter } from 'next/navigation';

export function useUpscale() {
    const router = useRouter();
    const workerRef = useRef<Worker | null>(null);
    const {
        originalImage,
        upscaleFactor,
        outputFormat,
        quality,
        setProcessing,
        setProgress,
        setProgressStatus,
        setProcessedImage,
    } = useAppStore();

    const cleanup = useCallback(() => {
        workerRef.current?.terminate();
        workerRef.current = null;
    }, []);

    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    const initWorker = useCallback(() => {
        if (workerRef.current) cleanup();
        
        // GPU 가속이 활성화되어 있으면 WebGL 워커 사용
        const useGPU = useAppStore.getState().gpuAcceleration;
        const workerUrl = useGPU 
            ? new URL('../lib/workers/webgl-upscale.worker.ts', import.meta.url)
            : new URL('../lib/workers/upscale.worker.ts', import.meta.url);
        
        workerRef.current = new Worker(workerUrl);

        workerRef.current.onmessage = async (e) => {
            const { type, data } = e.data;

            if (type === 'progress') {
                setProgress(data);
                if (data < 20) setProgressStatus('AI 모델을 불러오고 있습니다...');
                else if (data < 80) setProgressStatus('영역별로 나누어 정밀 분석 중 (Tiling)...');
                else setProgressStatus('거의 다 되었습니다! 마무리 작업 중...');
            } else if (type === 'progressStatus') {
                setProgressStatus(data);
            } else if (type === 'result') {
                const blob = data;
                const id = crypto.randomUUID();
                await imageDb.saveImage(id, blob);

                const img = new Image();
                img.src = URL.createObjectURL(blob);
                await new Promise((resolve) => {
                    img.onload = resolve;
                });

                setProcessedImage({
                    id,
                    name: `Saida_${originalImage?.name}`,
                    type: blob.type,
                    size: blob.size,
                    width: img.width,
                    height: img.height,
                });

                setProcessing(false);
                setProgressStatus('');
                router.push('/upscale/download');
            } else if (type === 'error') {
                console.error('Processing error:', data);
                handleErrorFallback(data);
            }
        };
    }, [originalImage, setProcessedImage, setProcessing, setProgress, setProgressStatus, router, cleanup]);

    const handleErrorFallback = async (error: string) => {
        // A-Version Fallback Logic
        console.warn('Fallback triggered due to:', error);

        // Simulating a fallback path
        setProgressStatus('메모리가 부족하여 안전 모드로 전환합니다...');
        // In a real scenario, we would restart with lower scale or tiling
        // For this demo, we'll wait 1s and try a "safe" 2x if it was 4x
        setTimeout(() => {
            if (upscaleFactor === 4) {
                useAppStore.getState().setOptions({ upscaleFactor: 2 });
                startUpscale({ multiplier: 2, useTiling: true });
            } else {
                // Final resort: Basic Upscale (WIP)
                setProcessing(false);
                alert('처리 중 오류가 발생했습니다. 이미지를 더 작게 잘라낸 후 다시 시도해주세요.');
            }
        }, 1000);
    };

    const startUpscale = async (options?: { multiplier?: number, width?: number, height?: number, useTiling?: boolean }) => {
        if (!originalImage) return;

        initWorker();
        if (!workerRef.current) return;

        const blob = await imageDb.getImage(originalImage.id);
        if (!blob) return;

        setProcessing(true);
        setProgress(0);
        setProgressStatus('AI 엔진 준비 중...');

        const useGPU = useAppStore.getState().gpuAcceleration;
        const finalFactor = options?.multiplier || upscaleFactor || 1;
        
        // 6MP 제한 체크 (약 2448x2448 픽셀)
        const finalWidth = options?.width || (originalImage.width || 0) * finalFactor;
        const finalHeight = options?.height || (originalImage.height || 0) * finalFactor;
        const megapixels = (finalWidth * finalHeight) / 1000000;
        
        if (megapixels > 6) {
            alert('6MP보다 작은 이미지만 업스케일링할 수 있습니다.');
            setProcessing(false);
            return;
        }
        
        workerRef.current.postMessage({
            imageBlob: blob,
            upscaleFactor: finalFactor,
            outputFormat,
            quality: quality / 100,
            targetWidth: options?.width,
            targetHeight: options?.height,
            useTiling: options?.useTiling || (originalImage.width && originalImage.width > 2000),
            useGPU: useGPU
        });
    };

    return { startUpscale, isProcessing: useAppStore().isProcessing, progress: useAppStore().progress };
}
