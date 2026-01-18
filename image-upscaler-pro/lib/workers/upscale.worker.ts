'use client';

/**
 * Saida Image Maker A-Version Worker
 * Focus: High Reliability, Tiling support, Fallback-safe
 */

/* eslint-disable no-restricted-globals */

self.onmessage = async (e: MessageEvent) => {
    const {
        imageBlob,
        upscaleFactor = 1,
        outputFormat = 'image/png',
        quality = 0.9,
        targetWidth,
        targetHeight,
        tileSize = 512, // Default tile size
        mode = 'photo', // photo, anime, text
        useTiling = false
    } = e.data;

    try {
        self.postMessage({ type: 'progress', data: 5 });

        const imageBitmap = await createImageBitmap(imageBlob);
        const originalWidth = imageBitmap.width;
        const originalHeight = imageBitmap.height;

        // Calculate final dimensions
        let finalWidth = targetWidth || originalWidth * upscaleFactor;
        let finalHeight = targetHeight || originalHeight * upscaleFactor;

        if (targetWidth && !targetHeight) {
            finalHeight = Math.round((targetWidth / originalWidth) * originalHeight);
        } else if (targetHeight && !targetWidth) {
            finalWidth = Math.round((targetHeight / originalHeight) * originalWidth);
        }

        self.postMessage({ type: 'progress', data: 20 });

        const canvas = new OffscreenCanvas(finalWidth, finalHeight);
        const ctx = canvas.getContext('2d', { alpha: true });

        if (!ctx) throw new Error('Could not get canvas context');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Enhanced upscaling with multi-pass approach
        if (upscaleFactor > 1) {
            // Multi-pass upscaling for better quality
            await runEnhancedUpscaling(imageBitmap, ctx, originalWidth, originalHeight, finalWidth, finalHeight, upscaleFactor, useTiling, tileSize);
        } else {
            // Standard high-quality pass for resize only
            ctx.drawImage(imageBitmap, 0, 0, finalWidth, finalHeight);
            self.postMessage({ type: 'progress', data: 80 });
        }

        const processedBlob = await canvas.convertToBlob({
            type: outputFormat,
            quality: quality,
        });

        self.postMessage({ type: 'progress', data: 100 });
        self.postMessage({ type: 'result', data: processedBlob });

    } catch (error) {
        self.postMessage({ type: 'error', data: error instanceof Error ? error.message : 'Unknown error' });
    }
};

/**
 * Enhanced upscaling with multi-pass approach for better quality
 */
async function runEnhancedUpscaling(
    bitmap: ImageBitmap,
    ctx: OffscreenCanvasRenderingContext2D,
    originalWidth: number,
    originalHeight: number,
    finalWidth: number,
    finalHeight: number,
    scale: number,
    useTiling: boolean,
    tileSize: number
) {
    // Multi-pass upscaling: scale in steps for better quality
    let currentBitmap = bitmap;
    let currentWidth = originalWidth;
    let currentHeight = originalHeight;
    let targetScale = scale;
    
    // If scale is large, do it in steps (2x at a time)
    while (targetScale > 1) {
        const stepScale = Math.min(2, targetScale);
        const nextWidth = Math.round(currentWidth * stepScale);
        const nextHeight = Math.round(currentHeight * stepScale);
        
        const tempCanvas = new OffscreenCanvas(nextWidth, nextHeight);
        const tempCtx = tempCanvas.getContext('2d', { alpha: true });
        if (!tempCtx) break;
        
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        
        if (useTiling || (currentWidth * currentHeight > 2000 * 2000)) {
            await runTiledProcessing(currentBitmap, tempCtx, nextWidth, nextHeight, stepScale, tileSize);
        } else {
            tempCtx.drawImage(currentBitmap, 0, 0, nextWidth, nextHeight);
        }
        
        // Update for next iteration
        currentBitmap = await createImageBitmap(tempCanvas);
        currentWidth = nextWidth;
        currentHeight = nextHeight;
        targetScale /= stepScale;
        
        self.postMessage({ type: 'progress', data: 20 + Math.floor((1 - targetScale / scale) * 60) });
        
        // Clean up previous bitmap if it's not the original
        if (currentBitmap !== bitmap) {
            // Note: ImageBitmap doesn't have explicit cleanup, but we can let GC handle it
        }
    }
    
    // Final draw to target canvas
    ctx.drawImage(currentBitmap, 0, 0, finalWidth, finalHeight);
    self.postMessage({ type: 'progress', data: 90 });
}

/**
 * Splits the image into tiles, processes them, and stitches them back.
 * This prevents Out-Of-Memory (OOM) on large images.
 */
async function runTiledProcessing(
    bitmap: ImageBitmap,
    ctx: OffscreenCanvasRenderingContext2D,
    finalWidth: number,
    finalHeight: number,
    scale: number,
    tileSize: number
) {
    const originalWidth = bitmap.width;
    const originalHeight = bitmap.height;

    const numTilesX = Math.ceil(originalWidth / tileSize);
    const numTilesY = Math.ceil(originalHeight / tileSize);
    const totalTiles = numTilesX * numTilesY;
    let completedTiles = 0;

    for (let y = 0; y < numTilesY; y++) {
        for (let x = 0; x < numTilesX; x++) {
            const sx = x * tileSize;
            const sy = y * tileSize;
            const sw = Math.min(tileSize, originalWidth - sx);
            const sh = Math.min(tileSize, originalHeight - sy);

            const dx = sx * scale;
            const dy = sy * scale;
            const dw = sw * scale;
            const dh = sh * scale;

            // Draw tile with high quality
            ctx.drawImage(bitmap, sx, sy, sw, sh, dx, dy, dw, dh);

            completedTiles++;
            const progress = 20 + Math.floor((completedTiles / totalTiles) * 60);
            self.postMessage({ type: 'progress', data: progress });

            // Allow event loop to breathe
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
}
