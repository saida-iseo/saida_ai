/* eslint-disable no-restricted-globals */

import { loadModel } from '@/lib/upscale/modelLoader';
import { makeTiles, resolveTileSize, blendTile } from '@/lib/upscale/tiling';
import { runSR, getDiagnosticsSnapshot, resetDiagnostics } from '@/lib/upscale/srRuntime';
import type { WorkerRequest, WorkerResponse } from '@/lib/upscale/types';

const activeRequests = new Map<string, AbortController>();

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
    const msg = e.data;

    if (msg.type === 'cancel') {
        activeRequests.get(msg.requestId)?.abort();
        return;
    }

    if (msg.type === 'load-model') {
        await loadModel(msg.mode, msg.preset, 2);
        return;
    }

    if (msg.type !== 'upscale') return;

    const controller = new AbortController();
    activeRequests.set(msg.requestId, controller);

    try {
        resetDiagnostics();
        const { imageBlob, options, requestId } = msg;
        let diagnosticSent = false;
        const sendDiagnostics = () => {
            if (diagnosticSent) return;
            diagnosticSent = true;
            postMessage(<WorkerResponse>{
                type: 'diagnostic',
                requestId,
                data: getDiagnosticsSnapshot()
            });
        };
        const decodeStart = performance.now();
        let imageBitmap: ImageBitmap;
        try {
            imageBitmap = await createImageBitmap(imageBlob, {
                imageOrientation: 'from-image',
                premultiplyAlpha: 'none',
                colorSpaceConversion: 'default'
            } as ImageBitmapOptions);
        } catch (error) {
            imageBitmap = await createImageBitmap(imageBlob);
        }

        postMessage(<WorkerResponse>{ type: 'progress', requestId, data: { totalTiles: 0, doneTiles: 0, stage: 'decode' } });

        const originalWidth = imageBitmap.width;
        const originalHeight = imageBitmap.height;
        const scaleFactor = options.targetSize
            ? Math.min(options.targetSize.width / originalWidth, options.targetSize.height / originalHeight)
            : options.scale;
        const finalWidth = Math.round(originalWidth * scaleFactor);
        const finalHeight = Math.round(originalHeight * scaleFactor);

        let tileSize = options.tile.auto
            ? resolveTileSize(originalWidth, originalHeight, scaleFactor, options.tile.size, options.tile.maxPixels)
            : options.tile.size;
        let overlap = Math.max(0, Math.min(options.tile.overlap, Math.floor(tileSize / 4)));

        if (originalWidth <= 900 && originalHeight <= 900) {
            tileSize = Math.max(originalWidth, originalHeight);
            overlap = 0;
        }

        const tiles = makeTiles(originalWidth, originalHeight, tileSize, overlap);

        const outputCanvas = new OffscreenCanvas(finalWidth, finalHeight);
        const outCtx = outputCanvas.getContext('2d', { alpha: true });
        if (!outCtx) throw new Error('Could not get output context');
        outCtx.clearRect(0, 0, finalWidth, finalHeight);

        let done = 0;
        const total = tiles.length;
        const tileStart = performance.now();

        if (tiles.length === 1) {
            const srBitmap = await runSR(imageBitmap, finalWidth, finalHeight, options);
            sendDiagnostics();
            outCtx.drawImage(srBitmap, 0, 0, finalWidth, finalHeight);
            if ('close' in srBitmap) srBitmap.close();
            postMessage(<WorkerResponse>{
                type: 'progress',
                requestId,
                data: { totalTiles: 1, doneTiles: 1, stage: 'upscale' }
            });
        } else {

        for (const tile of tiles) {
            if (controller.signal.aborted) throw new Error('cancelled');

            const tileBitmap = await createImageBitmap(
                imageBitmap,
                tile.x,
                tile.y,
                tile.w,
                tile.h
            );

            const scaledX = Math.floor(tile.x * scaleFactor);
            const scaledY = Math.floor(tile.y * scaleFactor);
            const scaledW = Math.ceil((tile.x + tile.w) * scaleFactor) - scaledX;
            const scaledH = Math.ceil((tile.y + tile.h) * scaleFactor) - scaledY;
            const scaledTile = {
                x: scaledX,
                y: scaledY,
                w: scaledW,
                h: scaledH
            };

            let srBitmap = await runSR(tileBitmap, scaledTile.w, scaledTile.h, options);
            if (!srBitmap || srBitmap.width === 0 || srBitmap.height === 0) {
                srBitmap = await runSR(tileBitmap, scaledTile.w, scaledTile.h, { ...options, preset: 'fast' });
            }
            sendDiagnostics();

            const edges = {
                left: tile.x > 0,
                right: tile.x + tile.w < originalWidth,
                top: tile.y > 0,
                bottom: tile.y + tile.h < originalHeight
            };

            blendTile(outCtx, srBitmap, scaledTile, Math.round(overlap * scaleFactor), edges);
            if ('close' in tileBitmap) tileBitmap.close();
            if ('close' in srBitmap) srBitmap.close();

            done++;
            const elapsed = (performance.now() - tileStart) / 1000;
            const perTile = elapsed / done;
            const etaSec = Math.max(0, Math.round((total - done) * perTile));

            postMessage(<WorkerResponse>{
                type: 'progress',
                requestId,
                data: { totalTiles: total, doneTiles: done, etaSec, stage: 'upscale' }
            });
        }
        }

        postMessage(<WorkerResponse>{
            type: 'progress',
            requestId,
            data: { totalTiles: total, doneTiles: done, stage: 'encode' }
        });

        const processedBlob = await outputCanvas.convertToBlob({
            type: options.output.format,
            quality: options.output.quality
        });

        const totalMs = Math.round(performance.now() - decodeStart);
        postMessage(<WorkerResponse>{ type: 'status', requestId, message: `처리 완료 (${totalMs}ms)` });
        postMessage(<WorkerResponse>{ type: 'result', requestId, blob: processedBlob, width: finalWidth, height: finalHeight });
    } catch (error) {
        postMessage(<WorkerResponse>{
            type: 'error',
            requestId: msg.requestId,
            message: error instanceof Error ? error.message : 'Unknown error'
        });
        postMessage(<WorkerResponse>{
            type: 'diagnostic',
            requestId: msg.requestId,
            data: getDiagnosticsSnapshot()
        });
    } finally {
        activeRequests.delete(msg.requestId);
    }
};
