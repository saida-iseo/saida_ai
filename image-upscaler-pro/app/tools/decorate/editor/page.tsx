'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Image as ImageIcon, Type, Sparkles, Square, Move } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { cn } from '@/lib/utils/cn';
import { buildFilename } from '@/lib/utils/filename';
import { downloadImage } from '@/lib/utils/imageProcessor';
import { STICKER_CATEGORIES, GOOGLE_FONTS } from '@/lib/constants/decorateAssets';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export default function DecorateEditor() {
    const router = useRouter();
    const { originalImage, setOriginalImage } = useAppStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);

    const [baseImg, setBaseImg] = useState<HTMLImageElement | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [downloadFormat, setDownloadFormat] = useState<'png' | 'webp' | 'jpg'>('png');
    const [isDragging, setIsDragging] = useState<'text' | 'sticker' | null>(null);

    const [textSettings, setTextSettings] = useState({
        enabled: true,
        content: 'Saida Image',
        size: 72,
        color: '#ffffff',
        opacity: 0.9,
        weight: 800,
        font: 'Roboto',
        positionX: 50,
        positionY: 12
    });

    const [stickerSettings, setStickerSettings] = useState({
        enabled: true,
        emoji: '✨',
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

    const [selectedCategory, setSelectedCategory] = useState<keyof typeof STICKER_CATEGORIES>('emoji');

    // Load Google Fonts
    useEffect(() => {
        const link = document.createElement('link');
        link.href = `https://fonts.googleapis.com/css2?${GOOGLE_FONTS.map(font => `family=${font.replace(/ /g, '+')}`).join('&')}&display=swap`;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }, []);

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
        if (!baseImg || !canvasRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        requestAnimationFrame(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(baseImg, 0, 0);

            // Frame
            if (frameSettings.enabled && frameSettings.thickness > 0) {
                const inset = frameSettings.thickness / 2;
                const w = canvas.width - frameSettings.thickness;
                const h = canvas.height - frameSettings.thickness;
                ctx.save();
                ctx.strokeStyle = frameSettings.color;
                ctx.lineWidth = frameSettings.thickness;
                if ('roundRect' in ctx && typeof ctx.roundRect === 'function') {
                    ctx.beginPath();
                    ctx.roundRect(inset, inset, w, h, frameSettings.radius);
                    ctx.stroke();
                } else {
                    ctx.beginPath();
                    ctx.strokeRect(inset, inset, w, h);
                }
                ctx.restore();
            }

            // Sticker (Emoji)
            if (stickerSettings.enabled && stickerSettings.emoji) {
                const minDim = Math.min(canvas.width, canvas.height);
                const size = clamp(stickerSettings.size, 6, 50) / 100 * minDim;
                const x = (stickerSettings.positionX / 100) * canvas.width;
                const y = (stickerSettings.positionY / 100) * canvas.height;
                ctx.save();
                ctx.globalAlpha = stickerSettings.opacity;
                ctx.font = `${size}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(stickerSettings.emoji, x, y);
                ctx.restore();
            }

            // Text
            if (textSettings.enabled && textSettings.content) {
                const fontSize = clamp(textSettings.size, 16, 200);
                const x = (textSettings.positionX / 100) * canvas.width;
                const y = (textSettings.positionY / 100) * canvas.height;
                ctx.save();
                ctx.globalAlpha = textSettings.opacity;
                ctx.font = `${textSettings.weight} ${fontSize}px "${textSettings.font}", sans-serif`;
                ctx.fillStyle = textSettings.color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.shadowColor = 'rgba(0,0,0,0.5)';
                ctx.shadowBlur = 8;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
                ctx.fillText(textSettings.content, x, y);
                ctx.restore();
            }
        });
    }, [baseImg, canvasSize, textSettings, stickerSettings, frameSettings]);

    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!previewRef.current || !canvasRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        // Check if clicking near text or sticker
        const textDist = Math.sqrt(Math.pow(x - textSettings.positionX, 2) + Math.pow(y - textSettings.positionY, 2));
        const stickerDist = Math.sqrt(Math.pow(x - stickerSettings.positionX, 2) + Math.pow(y - stickerSettings.positionY, 2));

        if (textSettings.enabled && textDist < 10) {
            setIsDragging('text');
        } else if (stickerSettings.enabled && stickerDist < 10) {
            setIsDragging('sticker');
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isDragging || !previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
        const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);

        if (isDragging === 'text') {
            setTextSettings(prev => ({ ...prev, positionX: x, positionY: y }));
        } else if (isDragging === 'sticker') {
            setStickerSettings(prev => ({ ...prev, positionX: x, positionY: y }));
        }
    };

    const handleCanvasMouseUp = () => {
        setIsDragging(null);
    };

    const handleDownload = async () => {
        const canvas = canvasRef.current;
        if (!canvas || !originalImage) return;
        const filename = buildFilename(originalImage.name, 'decorated', downloadFormat);
        const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob((b) => resolve(b), `image/${downloadFormat}`);
        });
        if (!blob) return;
        downloadImage(blob, filename);
    };

    if (!baseImg) return null;

    const allStickers = STICKER_CATEGORIES[selectedCategory];

    return (
        <div className="flex h-[calc(100vh-64px)] bg-background">
            <div className="flex-grow flex items-center justify-center p-10 overflow-auto">
                <div className="relative w-full max-w-3xl flex items-center justify-center">
                    <div className="rounded-3xl border border-card-border bg-black/5 p-6 shadow-2xl">
                        <div
                            ref={previewRef}
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                            className="relative cursor-move"
                        >
                            <canvas
                                ref={canvasRef}
                                className="max-h-[70vh] w-auto rounded-2xl shadow-xl"
                            />
                            {/* Text Indicator */}
                            {textSettings.enabled && (
                                <div
                                    className="absolute w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg pointer-events-none"
                                    style={{
                                        left: `${textSettings.positionX}%`,
                                        top: `${textSettings.positionY}%`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                />
                            )}
                            {/* Sticker Indicator */}
                            {stickerSettings.enabled && (
                                <div
                                    className="absolute w-4 h-4 bg-purple-500 rounded-full border-2 border-white shadow-lg pointer-events-none"
                                    style={{
                                        left: `${stickerSettings.positionX}%`,
                                        top: `${stickerSettings.positionY}%`,
                                        transform: 'translate(-50%, -50%)'
                                    }}
                                />
                            )}
                        </div>
                        <p className="text-xs text-text-tertiary text-center mt-4 flex items-center justify-center gap-2">
                            <Move className="h-3 w-3" />
                            캔버스를 클릭하여 텍스트/스티커를 드래그하세요
                        </p>
                    </div>
                </div>
            </div>

            <div className="w-[420px] border-l border-card-border bg-card-bg backdrop-blur-xl p-8 flex flex-col gap-6 overflow-y-auto">
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

                {/* Text Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-text-primary">
                            <Type className="h-4 w-4" />
                            <h3 className="text-sm font-black uppercase tracking-widest">텍스트</h3>
                        </div>
                        <button
                            onClick={() => setTextSettings({ ...textSettings, enabled: !textSettings.enabled })}
                            className={cn(
                                'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                                textSettings.enabled ? 'bg-accent text-white' : 'bg-background text-text-tertiary'
                            )}
                        >
                            {textSettings.enabled ? 'ON' : 'OFF'}
                        </button>
                    </div>
                    
                    <input
                        value={textSettings.content}
                        onChange={(e) => setTextSettings({ ...textSettings, content: e.target.value })}
                        className="w-full rounded-2xl bg-background border border-card-border px-4 py-3 text-sm text-text-primary"
                        placeholder="텍스트 입력"
                    />

                    <div>
                        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-2">폰트</label>
                        <select
                            value={textSettings.font}
                            onChange={(e) => setTextSettings({ ...textSettings, font: e.target.value })}
                            className="w-full rounded-xl bg-background border border-card-border px-3 py-2 text-sm text-text-primary"
                            style={{ fontFamily: textSettings.font }}
                        >
                            {GOOGLE_FONTS.map(font => (
                                <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-2">크기</label>
                            <input
                                type="range"
                                min="16"
                                max="200"
                                value={textSettings.size}
                                onChange={(e) => setTextSettings({ ...textSettings, size: Number(e.target.value) })}
                                className="w-full accent-accent"
                            />
                            <span className="text-xs text-text-tertiary">{textSettings.size}px</span>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-2">투명도</label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={Math.round(textSettings.opacity * 100)}
                                onChange={(e) => setTextSettings({ ...textSettings, opacity: Number(e.target.value) / 100 })}
                                className="w-full accent-accent"
                            />
                            <span className="text-xs text-text-tertiary">{Math.round(textSettings.opacity * 100)}%</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">색상</label>
                        <input
                            type="color"
                            value={textSettings.color}
                            onChange={(e) => setTextSettings({ ...textSettings, color: e.target.value })}
                            className="w-16 h-10 rounded-lg cursor-pointer"
                        />
                    </div>
                </section>

                {/* Sticker Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-text-primary">
                            <Sparkles className="h-4 w-4" />
                            <h3 className="text-sm font-black uppercase tracking-widest">스티커</h3>
                        </div>
                        <button
                            onClick={() => setStickerSettings({ ...stickerSettings, enabled: !stickerSettings.enabled })}
                            className={cn(
                                'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                                stickerSettings.enabled ? 'bg-accent text-white' : 'bg-background text-text-tertiary'
                            )}
                        >
                            {stickerSettings.enabled ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {(Object.keys(STICKER_CATEGORIES) as Array<keyof typeof STICKER_CATEGORIES>).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    'px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all',
                                    selectedCategory === cat ? 'bg-accent text-white' : 'bg-background text-text-tertiary hover:bg-white/5'
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 bg-background rounded-xl">
                        {allStickers.map(sticker => (
                            <button
                                key={sticker.id}
                                onClick={() => setStickerSettings({ ...stickerSettings, emoji: sticker.emoji })}
                                className={cn(
                                    'p-3 text-2xl rounded-lg transition-all hover:bg-white/10',
                                    stickerSettings.emoji === sticker.emoji ? 'bg-accent/20 ring-2 ring-accent' : 'bg-white/5'
                                )}
                                title={sticker.label}
                            >
                                {sticker.emoji}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-2">크기</label>
                            <input
                                type="range"
                                min="6"
                                max="50"
                                value={stickerSettings.size}
                                onChange={(e) => setStickerSettings({ ...stickerSettings, size: Number(e.target.value) })}
                                className="w-full accent-accent"
                            />
                            <span className="text-xs text-text-tertiary">{stickerSettings.size}%</span>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-2">투명도</label>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                value={Math.round(stickerSettings.opacity * 100)}
                                onChange={(e) => setStickerSettings({ ...stickerSettings, opacity: Number(e.target.value) / 100 })}
                                className="w-full accent-accent"
                            />
                            <span className="text-xs text-text-tertiary">{Math.round(stickerSettings.opacity * 100)}%</span>
                        </div>
                    </div>
                </section>

                {/* Frame Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-text-primary">
                            <Square className="h-4 w-4" />
                            <h3 className="text-sm font-black uppercase tracking-widest">프레임</h3>
                        </div>
                        <button
                            onClick={() => setFrameSettings({ ...frameSettings, enabled: !frameSettings.enabled })}
                            className={cn(
                                'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                                frameSettings.enabled ? 'bg-accent text-white' : 'bg-background text-text-tertiary'
                            )}
                        >
                            {frameSettings.enabled ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-2">두께</label>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                value={frameSettings.thickness}
                                onChange={(e) => setFrameSettings({ ...frameSettings, thickness: Number(e.target.value) })}
                                className="w-full accent-accent"
                            />
                            <span className="text-xs text-text-tertiary">{frameSettings.thickness}px</span>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-2">둥글기</label>
                            <input
                                type="range"
                                min="0"
                                max="50"
                                value={frameSettings.radius}
                                onChange={(e) => setFrameSettings({ ...frameSettings, radius: Number(e.target.value) })}
                                className="w-full accent-accent"
                            />
                            <span className="text-xs text-text-tertiary">{frameSettings.radius}px</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">색상</label>
                        <input
                            type="color"
                            value={frameSettings.color}
                            onChange={(e) => setFrameSettings({ ...frameSettings, color: e.target.value })}
                            className="w-16 h-10 rounded-lg cursor-pointer"
                        />
                    </div>
                </section>

                {/* Download Section */}
                <section className="space-y-4 pt-4 border-t border-card-border">
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block">다운로드 포맷</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(['png', 'webp', 'jpg'] as const).map(fmt => (
                            <button
                                key={fmt}
                                onClick={() => setDownloadFormat(fmt)}
                                className={cn(
                                    'px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all',
                                    downloadFormat === fmt ? 'bg-accent text-white' : 'bg-background text-text-tertiary hover:bg-white/5'
                                )}
                            >
                                {fmt}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={handleDownload}
                        className="w-full bg-accent hover:bg-accent/90 text-white font-bold py-4 rounded-2xl text-sm shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.98]"
                    >
                        <Download className="h-5 w-5" />
                        이미지 다운로드
                    </button>
                </section>
            </div>
        </div>
    );
}
