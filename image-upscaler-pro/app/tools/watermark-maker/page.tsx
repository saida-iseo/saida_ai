'use client';

import React, { useState, useEffect } from 'react';
import WatermarkMakerCanvas from '@/components/ui/WatermarkMakerCanvas';
import Toast from '@/components/shared/Toast';
import HelpPanel from '@/components/shared/HelpPanel';
import UnifiedUploadZone from '@/components/shared/UnifiedUploadZone';
import { Download, Type, Image as ImageIcon, Ghost } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { buildFilename } from '@/lib/utils/filename';
import { addRecentHistory, createThumbnail } from '@/lib/history/recentHistory';
import { imageDb } from '@/lib/db/imageDb';
import { useAppStore } from '@/lib/store/useAppStore';

export default function WatermarkMakerPage() {
    const [settings, setSettings] = useState({
        type: 'text',
        text: 'SAIDA IMAGE',
        fontSize: 64,
        fontWeight: '800',
        color: '#ffffff',
        opacity: 0.7,
        angle: 0,
        shadow: true,
        scale: 0.6,
        positionX: 50,
        positionY: 50,
    });

    const [baseImg, setBaseImg] = useState<HTMLImageElement | null>(null);
    const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 1024, height: 1024 });
    const [showToast, setShowToast] = useState(false);
    const [showChecker, setShowChecker] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState<'png' | 'webp' | 'jpg'>('png');
    const [baseName, setBaseName] = useState('watermark');
    const { originalImage } = useAppStore();

    useEffect(() => {
        if (!originalImage || baseImg) return;
        const loadFromHistory = async () => {
            const blob = await imageDb.getImage(originalImage.id);
            if (!blob) return;
            const img = new Image();
            img.src = URL.createObjectURL(blob);
            await img.decode();
            setBaseImg(img);
            setCanvasSize({ width: img.width, height: img.height });
        };
        loadFromHistory();
    }, [originalImage, baseImg]);

    const handleBaseUpload = async (files: File[]) => {
        const file = files[0];
        if (!file) return;
        const img = new Image();
        img.src = URL.createObjectURL(file);
        await img.decode();
        setBaseImg(img);
        setCanvasSize({ width: img.width, height: img.height });
        setBaseName(file.name);

        const imageId = crypto.randomUUID();
        await imageDb.saveImage(imageId, file);

        const thumbUrl = await createThumbnail(file);
        addRecentHistory({
            id: crypto.randomUUID(),
            tool: '워터마크',
            route: '/tools/watermark-maker',
            imageId,
            name: file.name,
            type: file.type,
            size: file.size,
            width: img.width,
            height: img.height,
            thumbUrl,
            createdAt: Date.now(),
        });
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const img = new Image();
        img.onload = () => {
            setLogoImg(img);
            setSettings({ ...settings, type: 'logo' });
        };
        img.src = URL.createObjectURL(file);
    };

    const handleDownload = async () => {
        const canvas = document.querySelector('canvas');
        if (!canvas || !baseImg) return;

        const link = document.createElement('a');
        link.download = buildFilename(baseName, 'watermark', downloadFormat);

        if (downloadFormat === 'jpg') {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                tempCtx.fillStyle = '#ffffff';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(canvas, 0, 0);
                link.href = tempCanvas.toDataURL('image/jpeg', 0.95);
            }
        } else {
            link.href = canvas.toDataURL(`image/${downloadFormat}`);
        }

        link.click();
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    return (
        <div className="min-h-screen bg-background text-text-primary py-12 px-4 sm:px-6 lg:px-8">
            {showToast && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200]">
                    <Toast type="success" message="워터마크가 성공적으로 저장되었습니다." />
                </div>
            )}

            <div className="mx-auto max-w-7xl">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter mb-2">워터마크 만들기</h1>
                        <p className="text-text-secondary font-bold">이미지에 텍스트/로고를 바로 입히세요</p>
                    </div>
                    <button
                        onClick={() => setShowChecker(!showChecker)}
                        className={cn("p-4 rounded-2xl border transition-all",
                            showChecker ? "bg-accent/10 border-accent/40 text-accent" : "bg-card-bg border-card-border text-text-tertiary")}
                    >
                        <Ghost className="h-5 w-5" />
                    </button>
                </div>

                {!baseImg ? (
                    <UnifiedUploadZone onUpload={handleBaseUpload} title={'워터마크를 적용할\n이미지를 업로드하세요'} />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                        <div className="lg:col-span-7 flex flex-col gap-8">
                            <WatermarkMakerCanvas
                                settings={settings}
                                logoImg={logoImg}
                                baseImg={baseImg}
                                width={canvasSize.width}
                                height={canvasSize.height}
                                showCheckerboard={showChecker}
                            />
                            <div className="text-[11px] font-semibold text-text-tertiary bg-card-bg border border-card-border rounded-2xl px-4 py-3">
                                {canvasSize.width}x{canvasSize.height}px • 원본 해상도 유지
                            </div>
                        </div>

                        <div className="lg:col-span-5 flex flex-col gap-8">
                            <div className="bg-card-bg rounded-[2.5rem] border border-card-border p-8 shadow-2xl">
                                <div className="flex items-center gap-4 mb-8">
                                    <TabButton active={settings.type === 'text'} onClick={() => setSettings({ ...settings, type: 'text' })} icon={Type} label="Text" />
                                    <TabButton active={settings.type === 'logo'} onClick={() => setSettings({ ...settings, type: 'logo' })} icon={ImageIcon} label="Logo" />
                                </div>

                                <div className="space-y-6">
                                    {settings.type === 'text' && (
                                        <>
                                            <InputGroup label="내용">
                                                <input
                                                    type="text"
                                                    value={settings.text}
                                                    onChange={e => setSettings({ ...settings, text: e.target.value })}
                                                    className="w-full bg-background border-card-border rounded-xl px-4 py-3 text-text-primary font-bold focus:ring-2 focus:ring-accent outline-none"
                                                />
                                            </InputGroup>
                                            <div className="grid grid-cols-2 gap-4">
                                                <InputGroup label="크기">
                                                    <input type="number" value={settings.fontSize} onChange={e => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-full bg-background border-card-border rounded-xl px-4 py-2" />
                                                </InputGroup>
                                                <InputGroup label="색상">
                                                    <input type="color" value={settings.color} onChange={e => setSettings({ ...settings, color: e.target.value })} className="w-full h-10 bg-background border-card-border rounded-xl px-1 py-1" />
                                                </InputGroup>
                                            </div>
                                        </>
                                    )}

                                    {settings.type === 'logo' && (
                                        <>
                                            <InputGroup label="로고 업로드">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                    className="w-full bg-background border-card-border rounded-xl px-4 py-3 text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/90"
                                                />
                                            </InputGroup>
                                            {logoImg && (
                                                <div className="bg-background rounded-xl p-4 border border-card-border">
                                                    <p className="text-xs text-text-tertiary mb-2">업로드된 로고</p>
                                                    <img src={logoImg.src} alt="Logo" className="max-h-32 w-auto mx-auto rounded-lg" />
                                                </div>
                                            )}
                                            <InputGroup label="크기 조절">
                                                <input
                                                    type="range"
                                                    min="0.2"
                                                    max="2"
                                                    step="0.05"
                                                    value={settings.scale}
                                                    onChange={e => setSettings({ ...settings, scale: Number(e.target.value) })}
                                                    className="w-full accent-accent"
                                                />
                                                <p className="text-xs text-text-tertiary text-center mt-1">{Math.round(settings.scale * 100)}%</p>
                                            </InputGroup>
                                        </>
                                    )}

                                    <InputGroup label={`투명도 (${Math.round(settings.opacity * 100)}%)`}>
                                        <input type="range" min="0.1" max="1" step="0.05" value={settings.opacity} onChange={e => setSettings({ ...settings, opacity: Number(e.target.value) })} className="w-full accent-accent" />
                                    </InputGroup>

                                    <InputGroup label="회전">
                                        <input type="range" min="-45" max="45" step="1" value={settings.angle} onChange={e => setSettings({ ...settings, angle: Number(e.target.value) })} className="w-full accent-accent" />
                                    </InputGroup>

                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="가로 위치">
                                            <input type="range" min="0" max="100" value={settings.positionX} onChange={e => setSettings({ ...settings, positionX: Number(e.target.value) })} className="w-full accent-accent" />
                                        </InputGroup>
                                        <InputGroup label="세로 위치">
                                            <input type="range" min="0" max="100" value={settings.positionY} onChange={e => setSettings({ ...settings, positionY: Number(e.target.value) })} className="w-full accent-accent" />
                                        </InputGroup>
                                    </div>

                                    <div className="bg-background p-4 rounded-xl border border-card-border">
                                        <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-3 block">다운로드 포맷</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['png', 'webp', 'jpg'] as const).map((fmt) => (
                                                <button
                                                    key={fmt}
                                                    onClick={() => setDownloadFormat(fmt)}
                                                    className={cn(
                                                        "py-2 rounded-lg text-xs font-bold uppercase transition-all",
                                                        downloadFormat === fmt
                                                            ? "bg-accent text-white"
                                                            : "bg-card-bg text-text-tertiary hover:text-text-primary border border-card-border"
                                                    )}
                                                >
                                                    {fmt.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleDownload}
                                        className="w-full bg-accent text-white font-black py-5 rounded-[1.5rem] text-lg hover:bg-accent/90 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                    >
                                        <Download className="h-6 w-6" />
                                        워터마크 적용 다운로드
                                    </button>
                                </div>
                            </div>

                            <HelpPanel
                                title="워터마크 사용 팁"
                                guidelines={[
                                    "텍스트/로고 모두 원본 이미지 위에 직접 합성됩니다.",
                                    "투명 배경 유지가 필요하면 PNG/WebP로 저장하세요.",
                                    "위치 슬라이더로 빠르게 배치할 수 있습니다."
                                ]}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function TabButton({ active, icon: Icon, label, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex-grow flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border",
                active ? "bg-accent text-white border-accent shadow-xl" : "bg-background text-text-tertiary border-card-border hover:text-text-primary"
            )}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    );
}

function InputGroup({ label, children }: any) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-text-tertiary uppercase tracking-widest pl-1">{label}</label>
            {children}
        </div>
    );
}
