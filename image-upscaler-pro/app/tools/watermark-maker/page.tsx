'use client';

import React, { useState, useEffect } from 'react';
import WatermarkMakerCanvas from '@/components/ui/WatermarkMakerCanvas';
import Toast from '@/components/shared/Toast';
import HelpPanel from '@/components/shared/HelpPanel';
import { WATERMARK_PRESETS } from '@/lib/watermarkPresets';
import { Download, Type, Image as ImageIcon, LayoutGrid, Check, Sparkles, Plus, Ghost } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function WatermarkMakerPage() {
    const [settings, setSettings] = useState({
        type: 'text',
        text: 'SAIDA IMAGE',
        fontSize: 64,
        fontWeight: '900',
        color: '#FFFFFF',
        opacity: 0.8,
        isTile: false,
        angle: -30,
        gapX: 200,
        gapY: 200,
        shadow: true,
        scale: 1,
    });

    const [canvasSize, setCanvasSize] = useState(1024);
    const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [showChecker, setShowChecker] = useState(true);
    const [downloadFormat, setDownloadFormat] = useState<'png' | 'webp' | 'jpg'>('png');

    const applyPreset = (id: string) => {
        const p = WATERMARK_PRESETS.find(x => x.id === id);
        if (p) {
            setSettings({ ...settings, ...p.settings, type: p.type, isTile: p.type === 'tile' });
            if (p.type === 'tile') setSettings(prev => ({ ...prev, type: 'text' }));
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `watermark-${Date.now()}.${downloadFormat}`;
        
        if (downloadFormat === 'jpg') {
            // JPG는 투명도 지원 안하므로 흰 배경 추가
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                tempCtx.fillStyle = 'white';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                tempCtx.drawImage(canvas, 0, 0);
                link.href = tempCanvas.toDataURL(`image/jpeg`, 0.95);
            }
        } else {
            link.href = canvas.toDataURL(`image/${downloadFormat}`);
        }
        
        link.click();

        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
            {showToast && (
                <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200]">
                    <Toast type="success" message="워터마크가 성공적으로 저장되었습니다." />
                </div>
            )}

            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter mb-2">워터마크 만들기</h1>
                        <p className="text-slate-500 font-bold">텍스트/로고 워터마크를 PNG로 생성</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowChecker(!showChecker)}
                            className={cn("p-4 rounded-2xl border transition-all",
                                showChecker ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-400" : "bg-slate-900 border-slate-800 text-slate-500")}
                        >
                            <Ghost className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    {/* Left: Preview */}
                    <div className="lg:col-span-7 flex flex-col gap-8">
                        <WatermarkMakerCanvas
                            settings={settings}
                            logoImg={logoImg}
                            width={canvasSize}
                            height={canvasSize}
                            showCheckerboard={showChecker}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {WATERMARK_PRESETS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => applyPreset(p.id)}
                                    className="bg-slate-900 p-4 rounded-2xl border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-left group"
                                >
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 group-hover:text-indigo-400">{p.type} preset</p>
                                    <p className="font-bold">{p.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right: Options */}
                    <div className="lg:col-span-5 flex flex-col gap-8">
                        <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-2xl">
                            <div className="flex items-center gap-4 mb-8">
                                <TabButton active={settings.type === 'text'} onClick={() => setSettings({ ...settings, type: 'text' })} icon={Type} label="Text" />
                                <TabButton active={settings.type === 'logo'} onClick={() => setSettings({ ...settings, type: 'logo' })} icon={ImageIcon} label="Logo" />
                                <TabButton active={settings.isTile} onClick={() => setSettings({ ...settings, isTile: !settings.isTile })} icon={LayoutGrid} label="Tiling" />
                            </div>

                            <div className="space-y-6">
                                {settings.type === 'text' && (
                                    <>
                                        <InputGroup label="내용">
                                            <input
                                                type="text"
                                                value={settings.text}
                                                onChange={e => setSettings({ ...settings, text: e.target.value })}
                                                className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                            />
                                        </InputGroup>
                                        <div className="grid grid-cols-2 gap-4">
                                            <InputGroup label="크기">
                                                <input type="number" value={settings.fontSize} onChange={e => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2" />
                                            </InputGroup>
                                            <InputGroup label="색상">
                                                <input type="color" value={settings.color} onChange={e => setSettings({ ...settings, color: e.target.value })} className="w-full h-10 bg-slate-800 border-slate-700 rounded-xl px-1 py-1" />
                                            </InputGroup>
                                        </div>
                                    </>
                                )}

                                {settings.type === 'logo' && (
                                    <>
                                        <InputGroup label="이미지 업로드">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
                                            />
                                        </InputGroup>
                                        {logoImg && (
                                            <div className="bg-slate-800 rounded-xl p-4">
                                                <p className="text-xs text-slate-400 mb-2">업로드된 이미지</p>
                                                <img src={logoImg.src} alt="Logo" className="max-h-32 w-auto mx-auto rounded-lg" />
                                            </div>
                                        )}
                                        <InputGroup label="크기 조절">
                                            <input
                                                type="range"
                                                min="0.1"
                                                max="2"
                                                step="0.1"
                                                value={settings.scale}
                                                onChange={e => setSettings({ ...settings, scale: Number(e.target.value) })}
                                                className="w-full accent-indigo-500"
                                            />
                                            <p className="text-xs text-slate-400 text-center mt-1">{Math.round(settings.scale * 100)}%</p>
                                        </InputGroup>
                                    </>
                                )}

                                <InputGroup label={`투명도 (${Math.round(settings.opacity * 100)}%)`}>
                                    <input type="range" min="0" max="1" step="0.05" value={settings.opacity} onChange={e => setSettings({ ...settings, opacity: Number(e.target.value) })} className="w-full accent-indigo-500" />
                                </InputGroup>

                                {settings.isTile && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputGroup label="회전 각도">
                                            <input type="number" value={settings.angle} onChange={e => setSettings({ ...settings, angle: Number(e.target.value) })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2" />
                                        </InputGroup>
                                        <InputGroup label="간격">
                                            <input type="number" value={settings.gapX} onChange={e => setSettings({ ...settings, gapX: Number(e.target.value), gapY: Number(e.target.value) })} className="w-full bg-slate-800 border-slate-700 rounded-xl px-4 py-2" />
                                        </InputGroup>
                                    </div>
                                )}

                                <div className="pt-8 space-y-4">
                                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">다운로드 포맷</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {(['png', 'webp', 'jpg'] as const).map((fmt) => (
                                                <button
                                                    key={fmt}
                                                    onClick={() => setDownloadFormat(fmt)}
                                                    className={cn(
                                                        "py-2 rounded-lg text-xs font-bold uppercase transition-all",
                                                        downloadFormat === fmt
                                                            ? "bg-indigo-500 text-white"
                                                            : "bg-slate-700 text-slate-400 hover:text-white"
                                                    )}
                                                >
                                                    {fmt.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleDownload}
                                        className="w-full bg-white text-slate-900 font-black py-5 rounded-[1.5rem] text-lg hover:bg-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                    >
                                        <Download className="h-6 w-6" />
                                        {downloadFormat.toUpperCase()}로 다운로드
                                    </button>
                                </div>
                            </div>
                        </div>

                        <HelpPanel
                            title="워터마크 만들기"
                            guidelines={[
                                "캔버스 사이즈는 기본 1024x1024 정규 규격으로 고정됩니다.",
                                "생성된 이미지는 투명 배경이 유지되므로 어디든 겹쳐 쓸 수 있습니다.",
                                "대각선 반복 타일 모드는 이미지 무단 도용 방지에 효과적입니다."
                            ]}
                        />
                    </div>
                </div>
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
                active ? "bg-white text-slate-950 border-white shadow-xl" : "bg-slate-800 text-slate-500 border-slate-800 hover:text-slate-300"
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
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">{label}</label>
            {children}
        </div>
    );
}
