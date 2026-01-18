'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Image as ImageIcon, Type, Sparkles, Square } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { cn } from '@/lib/utils/cn';
import { buildFilename } from '@/lib/utils/filename';
import { downloadImage } from '@/lib/utils/imageProcessor';

const STICKERS = [
    {
        id: 'sparkle',
        label: 'Sparkle',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <radialGradient id="g" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#9ae6b4"/>
      <stop offset="100%" stop-color="#10b981"/>
    </radialGradient>
  </defs>
  <circle cx="100" cy="100" r="90" fill="url(#g)"/>
  <path d="M100 38l18 44 44 18-44 18-18 44-18-44-44-18 44-18z" fill="#0f172a" opacity="0.85"/>
  <circle cx="152" cy="52" r="14" fill="#0f172a" opacity="0.75"/>
</svg>`
    },
    {
        id: 'heart',
        label: 'Heart',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="40" fill="#fb7185"/>
  <path d="M100 148c-22-18-44-36-58-52-12-13-12-34 2-48 14-14 36-14 50 0l6 6 6-6c14-14 36-14 50 0 14 14 14 35 2 48-14 16-36 34-58 52z" fill="#fff"/>
</svg>`
    },
    {
        id: 'badge',
        label: 'Badge',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" rx="36" fill="#60a5fa"/>
  <circle cx="100" cy="90" r="48" fill="#0f172a" opacity="0.8"/>
  <path d="M70 160l30-22 30 22-10-36 28-20h-34l-14-32-14 32H52l28 20z" fill="#f8fafc"/>
</svg>`
    }
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function svgToDataUrl(svg: string) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function DecorateEditor() {
    const router = useRouter();
    const { originalImage, setOriginalImage } = useAppStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [baseImg, setBaseImg] = useState<HTMLImageElement | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [isRendering, setIsRendering] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState<'png' | 'webp' | 'jpg'>('png');

    const [textSettings, setTextSettings] = useState({
        enabled: true,
        content: 'Saida Image',
        size: 72,
        color: '#ffffff',
        opacity: 0.9,
        weight: 800,
        positionX: 50,
        positionY: 12
    });

    const [stickerSettings, setStickerSettings] = useState({
        enabled: true,
        stickerId: 'sparkle',
        size: 18,
        opacity: 0.95,
        positionX: 82,
        positionY: 20
    });

    const [frameSettings, setFrameSettings] = useState({
        enabled: true,
        thickness: 14,
        radius: 18,
        color: '#0f172a'
    });

    const stickerUrl = useMemo(() => {
        const sticker = STICKERS.find((item) => item.id === stickerSettings.stickerId);
        return sticker ? svgToDataUrl(sticker.svg) : null;
    }, [stickerSettings.stickerId]);

    const [stickerImg, setStickerImg] = useState<HTMLImageElement | null>(null);

    useEffect(() => {
        if (!originalImage) {
            router.push('/tools/decorate');
            return;
        }
        const loadOriginal = async () => {
            const blob = await imageDb.getImage(originalImage.id);
            if (!blob) return;
            const img = new Image();
            img.src = URL.createObjectURL(blob);
            await img.decode();
            setBaseImg(img);
            setCanvasSize({ width: img.width, height: img.height });
        };
        loadOriginal();
    }, [originalImage, router]);

    useEffect(() => {
        if (!stickerUrl) {
            setStickerImg(null);
            return;
        }
        const img = new Image();
        img.src = stickerUrl;
        img.onload = () => setStickerImg(img);
    }, [stickerUrl]);

    useEffect(() => {
        if (!baseImg || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const render = async () => {
            setIsRendering(true);
            await new Promise((resolve) => setTimeout(resolve, 0));
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(baseImg, 0, 0);

            if (frameSettings.enabled && frameSettings.thickness > 0) {
                const inset = frameSettings.thickness / 2;
                const w = canvas.width - frameSettings.thickness;
                const h = canvas.height - frameSettings.thickness;
                ctx.save();
                ctx.strokeStyle = frameSettings.color;
                ctx.lineWidth = frameSettings.thickness;
                if ('roundRect' in ctx) {
                    ctx.beginPath();
                    ctx.roundRect(inset, inset, w, h, frameSettings.radius);
                    ctx.stroke();
                } else {
                    ctx.strokeRect(inset, inset, w, h);
                }
                ctx.restore();
            }

            if (stickerSettings.enabled && stickerImg) {
                const minDim = Math.min(canvas.width, canvas.height);
                const size = clamp(stickerSettings.size, 6, 50) / 100 * minDim;
                const x = (stickerSettings.positionX / 100) * canvas.width - size / 2;
                const y = (stickerSettings.positionY / 100) * canvas.height - size / 2;
                ctx.save();
                ctx.globalAlpha = clamp(stickerSettings.opacity, 0.1, 1);
                ctx.drawImage(stickerImg, x, y, size, size);
                ctx.restore();
            }

            if (textSettings.enabled && textSettings.content.trim()) {
                const fontSize = clamp(textSettings.size, 12, 180);
                ctx.save();
                ctx.font = `${textSettings.weight} ${fontSize}px "Inter", system-ui, sans-serif`;
                ctx.fillStyle = textSettings.color;
                ctx.globalAlpha = clamp(textSettings.opacity, 0.1, 1);
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const x = (textSettings.positionX / 100) * canvas.width;
                const y = (textSettings.positionY / 100) * canvas.height;
                ctx.fillText(textSettings.content, x, y);
                ctx.restore();
            }
            setIsRendering(false);
        };
        render();
    }, [baseImg, canvasSize, frameSettings, stickerSettings, stickerImg, textSettings]);

    const handleDownload = async () => {
        if (!canvasRef.current || !originalImage) return;
        const canvas = canvasRef.current;
        const filename = buildFilename(originalImage.name, 'decorate', downloadFormat);
        const blob = await new Promise<Blob | null>((resolve) => {
            if (downloadFormat === 'jpg') {
                const temp = document.createElement('canvas');
                temp.width = canvas.width;
                temp.height = canvas.height;
                const tctx = temp.getContext('2d');
                if (!tctx) {
                    resolve(null);
                    return;
                }
                tctx.fillStyle = '#ffffff';
                tctx.fillRect(0, 0, temp.width, temp.height);
                tctx.drawImage(canvas, 0, 0);
                temp.toBlob((b) => resolve(b), 'image/jpeg', 0.95);
                return;
            }
            canvas.toBlob((b) => resolve(b), `image/${downloadFormat}`);
        });
        if (!blob) return;
        downloadImage(blob, filename);
    };

    if (!baseImg) return null;

    return (
        <div className="flex h-[calc(100vh-64px)] bg-background">
            <div className="flex-grow flex items-center justify-center p-10 overflow-auto">
                <div className="relative w-full max-w-3xl flex items-center justify-center">
                    <div className="rounded-3xl border border-card-border bg-black/5 p-6 shadow-2xl">
                        <canvas
                            ref={canvasRef}
                            className="max-h-[70vh] w-auto rounded-2xl shadow-xl"
                        />
                    </div>
                </div>
            </div>

            <div className="w-[420px] border-l border-card-border bg-card-bg backdrop-blur-xl p-8 flex flex-col gap-8 overflow-y-auto">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => {
                            setOriginalImage(null);
                            router.push('/tools/decorate');
                        }}
                        className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-text-secondary hover:text-text-primary transition-all border border-card-border"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2 text-[10px] font-black text-text-tertiary uppercase tracking-widest">
                        <ImageIcon className="h-4 w-4" />
                        Decorate Studio
                    </div>
                </div>

                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-text-primary">
                        <Type className="h-4 w-4" />
                        <h3 className="text-sm font-black uppercase tracking-widest">텍스트</h3>
                    </div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">내용</label>
                    <input
                        value={textSettings.content}
                        onChange={(e) => setTextSettings({ ...textSettings, content: e.target.value })}
                        className="w-full rounded-2xl bg-background border border-card-border px-4 py-3 text-sm text-text-primary"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">크기</label>
                            <input
                                type="range"
                                min="16"
                                max="160"
                                value={textSettings.size}
                                onChange={(e) => setTextSettings({ ...textSettings, size: Number(e.target.value) })}
                                className="w-full accent-accent"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">투명도</label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={Math.round(textSettings.opacity * 100)}
                                onChange={(e) => setTextSettings({ ...textSettings, opacity: Number(e.target.value) / 100 })}
                                className="w-full accent-accent"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">가로 위치</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={textSettings.positionX}
                                onChange={(e) => setTextSettings({ ...textSettings, positionX: Number(e.target.value) })}
                                className="w-full accent-accent"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">세로 위치</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={textSettings.positionY}
                                onChange={(e) => setTextSettings({ ...textSettings, positionY: Number(e.target.value) })}
                                className="w-full accent-accent"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">색상</label>
                        <input
                            type="color"
                            value={textSettings.color}
                            onChange={(e) => setTextSettings({ ...textSettings, color: e.target.value })}
                            className="h-8 w-16 rounded-lg border border-card-border bg-background"
                        />
                        <button
                            onClick={() => setTextSettings({ ...textSettings, enabled: !textSettings.enabled })}
                            className={cn(
                                "ml-auto text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border",
                                textSettings.enabled ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-card-border text-text-tertiary"
                            )}
                        >
                            {textSettings.enabled ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-text-primary">
                        <Sparkles className="h-4 w-4" />
                        <h3 className="text-sm font-black uppercase tracking-widest">스티커</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {STICKERS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setStickerSettings({ ...stickerSettings, stickerId: item.id, enabled: true })}
                                className={cn(
                                    "rounded-2xl border border-card-border p-3 text-[10px] font-bold uppercase tracking-widest transition-all",
                                    stickerSettings.stickerId === item.id ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40" : "bg-background text-text-secondary"
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">크기</label>
                            <input
                                type="range"
                                min="6"
                                max="50"
                                value={stickerSettings.size}
                                onChange={(e) => setStickerSettings({ ...stickerSettings, size: Number(e.target.value) })}
                                className="w-full accent-accent"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">투명도</label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={Math.round(stickerSettings.opacity * 100)}
                                onChange={(e) => setStickerSettings({ ...stickerSettings, opacity: Number(e.target.value) / 100 })}
                                className="w-full accent-accent"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">가로 위치</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={stickerSettings.positionX}
                                onChange={(e) => setStickerSettings({ ...stickerSettings, positionX: Number(e.target.value) })}
                                className="w-full accent-accent"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">세로 위치</label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={stickerSettings.positionY}
                                onChange={(e) => setStickerSettings({ ...stickerSettings, positionY: Number(e.target.value) })}
                                className="w-full accent-accent"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">표시</label>
                        <button
                            onClick={() => setStickerSettings({ ...stickerSettings, enabled: !stickerSettings.enabled })}
                            className={cn(
                                "ml-auto text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border",
                                stickerSettings.enabled ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-card-border text-text-tertiary"
                            )}
                        >
                            {stickerSettings.enabled ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </section>

                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-text-primary">
                        <Square className="h-4 w-4" />
                        <h3 className="text-sm font-black uppercase tracking-widest">프레임</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">두께</label>
                            <input
                                type="range"
                                min="0"
                                max="40"
                                value={frameSettings.thickness}
                                onChange={(e) => setFrameSettings({ ...frameSettings, thickness: Number(e.target.value) })}
                                className="w-full accent-accent"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">둥글기</label>
                            <input
                                type="range"
                                min="0"
                                max="60"
                                value={frameSettings.radius}
                                onChange={(e) => setFrameSettings({ ...frameSettings, radius: Number(e.target.value) })}
                                className="w-full accent-accent"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">색상</label>
                        <input
                            type="color"
                            value={frameSettings.color}
                            onChange={(e) => setFrameSettings({ ...frameSettings, color: e.target.value })}
                            className="h-8 w-16 rounded-lg border border-card-border bg-background"
                        />
                        <button
                            onClick={() => setFrameSettings({ ...frameSettings, enabled: !frameSettings.enabled })}
                            className={cn(
                                "ml-auto text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border",
                                frameSettings.enabled ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-card-border text-text-tertiary"
                            )}
                        >
                            {frameSettings.enabled ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </section>

                <div className="mt-auto pt-6 border-t border-card-border">
                    <div className="flex items-center gap-2 mb-3">
                        {(['png', 'webp', 'jpg'] as const).map((fmt) => (
                            <button
                                key={fmt}
                                onClick={() => setDownloadFormat(fmt)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all",
                                    downloadFormat === fmt ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-card-border text-text-tertiary"
                                )}
                            >
                                {fmt}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleDownload}
                        disabled={isRendering}
                        className={cn(
                            "w-full py-5 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-2xl",
                            isRendering ? "bg-slate-800 text-slate-600 cursor-not-allowed" : "bg-emerald-500 hover:bg-emerald-600 text-white hover:scale-[1.02] active:scale-[0.98]"
                        )}
                    >
                        <Download className="h-6 w-6" />
                        꾸미기 다운로드
                    </button>
                </div>
            </div>
        </div>
    );
}
