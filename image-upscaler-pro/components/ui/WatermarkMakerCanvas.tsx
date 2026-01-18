'use client';

import React, { useRef, useEffect } from 'react';

interface WatermarkCanvasProps {
    settings: any;
    logoImg?: HTMLImageElement | null;
    baseImg?: HTMLImageElement | null;
    width: number;
    height: number;
    showCheckerboard?: boolean;
}

export default function WatermarkMakerCanvas({
    settings,
    logoImg,
    baseImg,
    width,
    height,
    showCheckerboard = true
}: WatermarkCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear and draw background if needed
        ctx.clearRect(0, 0, width, height);

        if (showCheckerboard) {
            // Draw Checkerboard
            const size = 10;
            for (let y = 0; y < height; y += size) {
                for (let x = 0; x < width; x += size) {
                    ctx.fillStyle = (x / size + y / size) % 2 === 0 ? '#f8fafc22' : '#ffffff11';
                    ctx.fillRect(x, y, size, size);
                }
            }
        }

        if (baseImg) {
            ctx.drawImage(baseImg, 0, 0, width, height);
        }

        ctx.save();

        // Logic for Tiling
        if (settings.isTile) {
            drawTile(ctx, settings, width, height);
        } else {
            drawSingle(ctx, settings, logoImg, width, height);
        }

        ctx.restore();
    }, [settings, logoImg, width, height, showCheckerboard]);

    const drawSingle = (ctx: CanvasRenderingContext2D, s: any, img: HTMLImageElement | null | undefined, w: number, h: number) => {
        ctx.globalAlpha = s.opacity;
        const posX = (s.positionX ?? 50) / 100;
        const posY = (s.positionY ?? 50) / 100;

        if (s.type === 'text') {
            ctx.font = `${s.fontWeight} ${s.fontSize}px sans-serif`;
            ctx.fillStyle = s.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (s.shadow) {
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }

            ctx.save();
            ctx.translate(w * posX, h * posY);
            ctx.rotate(((s.angle || 0) * Math.PI) / 180);
            ctx.fillText(s.text, 0, 0);
            ctx.restore();
        } else if (img) {
            const iw = img.width * s.scale;
            const ih = img.height * s.scale;
            ctx.save();
            ctx.translate(w * posX, h * posY);
            ctx.rotate(((s.angle || 0) * Math.PI) / 180);
            ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
            ctx.restore();
        }
    };

    const drawTile = (ctx: CanvasRenderingContext2D, s: any, w: number, h: number) => {
        ctx.globalAlpha = s.opacity;
        ctx.font = `${s.fontWeight} ${s.fontSize}px sans-serif`;
        ctx.fillStyle = s.color;
        ctx.rotate((s.angle * Math.PI) / 180);

        const stepX = s.gapX || 200;
        const stepY = s.gapY || 200;

        for (let y = -h * 2; y < h * 2; y += stepY) {
            for (let x = -w * 2; x < w * 2; x += stepX) {
                ctx.fillText(s.text, x, y);
            }
        }
    };

    return (
        <div className="relative aspect-square w-full bg-card-bg rounded-[2rem] border-4 border-card-border shadow-2xl overflow-hidden group">
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-transparent pointer-events-none group-hover:bg-white/5 transition-colors" />
        </div>
    );
}
