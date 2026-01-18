'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { cn } from '@/lib/utils/cn';
import { Info, Loader2, Sparkles, Image as ImageIcon, Smile, Type, Zap } from 'lucide-react';

export default function OptionsPanel({ onUpscale, onCancel }: { onUpscale: () => void; onCancel: () => void }) {
    const {
        originalImage,
        upscaleFactor,
        upscaleMode,
        faceRestore,
        gpuAcceleration,
        gpuAvailable,
        qualityPreset,
        fidelity,
        tileAuto,
        tileSize,
        tileOverlap,
        maxPixels,
        targetSize,
        setOptions,
        isProcessing,
        progress,
        progressStatus,
        progressDetail,
        diagnostics
    } = useAppStore();

    const [favorites, setFavorites] = useState<any[]>([]);
    const modelHost = diagnostics?.modelUrl ? diagnostics.modelUrl.replace(/^https?:\/\//, '').split('/')[0] : null;
    const modelFile = diagnostics?.modelUrl ? diagnostics.modelUrl.split('/').slice(-1)[0] : null;
    const modelDisplay = diagnostics?.modelId || (modelHost && modelFile ? `${modelHost}/${modelFile}` : null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const stored = localStorage.getItem('saida_upscale_favorites');
        if (stored) setFavorites(JSON.parse(stored));
    }, []);

    const saveFavorite = (index: number) => {
        const next = [...favorites];
        next[index] = {
            upscaleMode,
            upscaleFactor,
            qualityPreset,
            fidelity,
            faceRestore,
            gpuAcceleration,
            tileAuto,
            tileSize,
            tileOverlap,
            maxPixels,
            targetSize
        };
        setFavorites(next);
        localStorage.setItem('saida_upscale_favorites', JSON.stringify(next));
    };

    const loadFavorite = (index: number) => {
        const preset = favorites[index];
        if (!preset) return;
        setOptions(preset);
    };

    useEffect(() => {
        if (upscaleMode !== 'photo' && faceRestore) {
            setOptions({ faceRestore: false });
        }
    }, [upscaleMode, faceRestore, setOptions]);

    return (
        <div className="flex flex-col h-full bg-card-bg backdrop-blur-xl p-8 border-l border-card-border w-full lg:w-[380px] overflow-y-auto transition-colors duration-300">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold text-text-primary tracking-tight">Saida Engine</h2>
                <div className="flex items-center gap-1.5 bg-accent/10 text-accent px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border border-accent/20">
                    <Zap className="h-3 w-3 fill-current" />
                    A-Version
                </div>
            </div>

            {/* Mode Selector */}
            <div className="mb-8">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3 block">보정 모드 선택</label>
                <div className="grid grid-cols-1 gap-2">
                    <ModeBtn
                        active={upscaleMode === 'photo'}
                        onClick={() => setOptions({ upscaleMode: 'photo' })}
                        icon={<ImageIcon className="h-4 w-4" />}
                        label="사진"
                        desc="인물, 풍경 등 자연스러운 결과"
                    />
                    <ModeBtn
                        active={upscaleMode === 'anime'}
                        onClick={() => setOptions({ upscaleMode: 'anime' })}
                        icon={<Smile className="h-4 w-4" />}
                        label="일러스트"
                        desc="애니메이션, 그림 노이즈 제거"
                    />
                    <ModeBtn
                        active={upscaleMode === 'text'}
                        onClick={() => setOptions({ upscaleMode: 'text' })}
                        icon={<Type className="h-4 w-4" />}
                        label="텍스트"
                        desc="문서 및 글자를 선명하게 복원"
                    />
                </div>
            </div>

            {/* Info Box */}
            <div className="mb-6 p-4 rounded-2xl bg-accent/5 border border-accent/10">
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">크기 배율을 선택하고</p>
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-2">"업스케일"을 클릭하여</p>
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest">20MP 이하 이미지 권장</p>
            </div>

            {/* Preset Selector */}
            <div className="mb-8">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3 block">품질 프리셋</label>
                <div className="grid grid-cols-3 gap-2">
                    {(['fast', 'balanced', 'high'] as const).map((preset) => (
                        <button
                            key={preset}
                            onClick={() => setOptions({ qualityPreset: preset })}
                            className={cn(
                                "py-2.5 rounded-xl font-bold text-xs uppercase transition-all border",
                                qualityPreset === preset
                                    ? "border-emerald-400 bg-emerald-500 text-white shadow-lg"
                                    : "border-card-border bg-background text-text-secondary hover:text-text-primary"
                            )}
                        >
                            {preset === 'fast' ? '빠름' : preset === 'balanced' ? '균형' : '고품질'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Scale Selector */}
            <div className="mb-8">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3 block">크기 증가</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                        onClick={() => setOptions({ upscaleFactor: 2 })}
                        className={cn(
                            "py-3 rounded-xl font-bold text-sm transition-all border-2",
                            upscaleFactor === 2
                                ? "border-blue-500 bg-blue-500 text-white shadow-lg"
                                : "border-card-border bg-background text-text-secondary hover:text-text-primary"
                        )}
                    >
                        2x
                    </button>
                    <button
                        onClick={() => setOptions({ upscaleFactor: 4 })}
                        className={cn(
                            "py-3 rounded-xl font-bold text-sm transition-all border-2",
                            upscaleFactor === 4
                                ? "border-blue-500 bg-blue-500 text-white shadow-lg"
                                : "border-card-border bg-background text-text-secondary hover:text-text-primary"
                        )}
                    >
                        4x
                    </button>
                </div>
                {originalImage && (
                    <div className="text-[11px] font-medium text-text-secondary text-center">
                        {originalImage.width} × {originalImage.height} px → {originalImage.width * upscaleFactor} × {originalImage.height * upscaleFactor} px
                    </div>
                )}
            </div>

            {/* Fidelity Slider */}
            <div className="mb-8">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3 block">Fidelity (원본 충실도)</label>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-text-tertiary">보수적</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={fidelity}
                        onChange={(e) => setOptions({ fidelity: Number(e.target.value) })}
                        className="w-full accent-emerald-500 h-2 bg-card-border rounded-full appearance-none cursor-pointer"
                        disabled={isProcessing}
                    />
                    <span className="text-[10px] font-bold text-text-tertiary">선명</span>
                </div>
            </div>

            {/* Toggles */}
            <div className="mb-8 space-y-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3 block">추가 설정</label>
                <ToggleBtn
                    label="얼굴 상세 보정"
                    active={faceRestore}
                    disabled={upscaleMode !== 'photo'}
                    onClick={() => {
                        if (upscaleMode !== 'photo') return;
                        setOptions({ faceRestore: !faceRestore });
                    }}
                />
                <ToggleBtn
                    label={gpuAvailable ? "GPU 가속 (웹 가속)" : "GPU 가속 (미지원)"}
                    active={gpuAcceleration && gpuAvailable}
                    onClick={() => setOptions({ gpuAcceleration: gpuAvailable ? !gpuAcceleration : false })}
                />
            </div>

            {/* Diagnostics */}
            <div className="mb-8">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3 block">진단</label>
                <div className="rounded-2xl bg-slate-900/40 border border-slate-800/60 p-4 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">런타임</span>
                        <span className="text-slate-200 font-bold">
                            {diagnostics?.runtime ?? (isProcessing ? '분석 중' : '대기')}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">백엔드</span>
                        <span className="text-slate-200 font-bold">{diagnostics?.provider ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">경로</span>
                        <span className="text-slate-200 font-bold">{diagnostics?.path ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">모델</span>
                        <span className="text-slate-200 font-bold text-right max-w-[180px] truncate">
                            {modelDisplay ?? '—'}
                        </span>
                    </div>
                    {diagnostics?.fallback && (
                        <div className="flex items-center justify-between">
                            <span className="text-amber-400 font-semibold">폴백</span>
                            <span className="text-amber-200 font-bold">{diagnostics.fallback}</span>
                        </div>
                    )}
                    {diagnostics?.lastError && (
                        <div className="pt-2 border-t border-slate-800 text-[10px] text-rose-300">
                            {diagnostics.lastError}
                        </div>
                    )}
                </div>
            </div>

            {/* Tile Controls */}
            <div className="mb-8 space-y-4">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3 block">타일링 안정화</label>
                <ToggleBtn
                    label="자동 타일링"
                    active={tileAuto}
                    onClick={() => setOptions({ tileAuto: !tileAuto })}
                />
                {!tileAuto && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">타일 크기</label>
                            <input
                                type="number"
                                min="256"
                                max="1024"
                                value={tileSize}
                                onChange={(e) => setOptions({ tileSize: Number(e.target.value) })}
                                className="mt-2 w-full bg-background border border-card-border rounded-xl px-3 py-2 text-xs font-bold text-text-primary"
                            />
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">오버랩</label>
                            <input
                                type="number"
                                min="8"
                                max="64"
                                value={tileOverlap}
                                onChange={(e) => setOptions({ tileOverlap: Number(e.target.value) })}
                                className="mt-2 w-full bg-background border border-card-border rounded-xl px-3 py-2 text-xs font-bold text-text-primary"
                            />
                        </div>
                    </div>
                )}
                <div className="text-[10px] text-text-tertiary">
                    최대 픽셀 제한: {(maxPixels / 1000000).toFixed(1)} MP
                </div>
            </div>

            {/* SNS Presets */}
            <div className="mb-8">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3 block">SNS 규격</label>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: '인스타 1:1', width: 1080, height: 1080 },
                        { label: '릴스 9:16', width: 1080, height: 1920 },
                        { label: '유튜브 16:9', width: 1920, height: 1080 },
                    ].map((preset) => (
                        <button
                            key={preset.label}
                            onClick={() => setOptions({ targetSize: preset })}
                            className={cn(
                                "py-2.5 rounded-xl font-bold text-[10px] uppercase transition-all border",
                                targetSize?.label === preset.label
                                    ? "border-emerald-400 bg-emerald-500 text-white shadow-lg"
                                    : "border-card-border bg-background text-text-secondary hover:text-text-primary"
                            )}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
                {targetSize && (
                    <button
                        onClick={() => setOptions({ targetSize: null })}
                        className="mt-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest hover:text-text-primary"
                    >
                        SNS 규격 해제
                    </button>
                )}
            </div>

            {/* Favorite Presets */}
            <div className="mb-8">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-3 block">즐겨찾기 프리셋</label>
                <div className="grid grid-cols-3 gap-2">
                    {[0, 1, 2].map((index) => (
                        <div key={index} className="flex flex-col gap-2">
                            <button
                                onClick={() => loadFavorite(index)}
                                className="py-2 rounded-xl text-[10px] font-bold uppercase border border-card-border bg-background text-text-secondary hover:text-text-primary"
                            >
                                불러오기 {index + 1}
                            </button>
                            <button
                                onClick={() => saveFavorite(index)}
                                className="py-2 rounded-xl text-[10px] font-bold uppercase border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:text-white"
                            >
                                저장 {index + 1}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Progress Status Display */}
            {isProcessing && (
                <div className="mb-8 p-6 rounded-3xl bg-accent/5 border border-accent/10">
                    <p className="text-[9px] font-bold text-accent uppercase tracking-widest mb-2">Processing</p>
                    <p className="text-sm font-medium text-text-primary mb-4 leading-tight">{progressStatus || '잠시만 기다려주세요...'}</p>
                    <div className="w-full bg-background h-1.5 rounded-full overflow-hidden border border-card-border">
                        <div
                            className="bg-accent h-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-3 text-[10px] font-bold text-text-tertiary">
                        <span>{progress}% completed</span>
                        <span>
                            {progressDetail.totalTiles > 0
                                ? `${progressDetail.doneTiles}/${progressDetail.totalTiles} tiles`
                                : 'preparing'}
                        </span>
                        <span>{progressDetail.etaSec !== null ? `ETA ${progressDetail.etaSec}s` : 'ETA --'}</span>
                    </div>
                </div>
            )}

            {/* Info Card */}
            <div className="mt-auto bg-slate-800/30 p-5 rounded-3xl border border-slate-800 mb-8">
                <div className="flex gap-4">
                    <Info className="h-5 w-5 text-slate-500 shrink-0 mt-1" />
                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                        기기 로컬 자원만 사용하여 안전하게 처리됩니다. <br />
                        대용량 이미지는 메모리 보호를 위해 <span className="text-white font-bold">Tiling(분할 처리)</span> 모드가 자동으로 적용됩니다.
                    </p>
                </div>
            </div>

            {/* CTA Button */}
            <div className="space-y-3">
                <button
                    onClick={onUpscale}
                    disabled={isProcessing}
                    className={cn(
                        "w-full py-4 rounded-2xl font-bold text-md transition-all flex items-center justify-center gap-3 shadow-xl",
                        isProcessing
                            ? "bg-card-bg text-text-tertiary cursor-not-allowed border border-card-border"
                            : "bg-blue-500 hover:bg-blue-600 text-white hover:scale-[1.01] active:scale-[0.98] shadow-blue-500/20"
                    )}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            분석 중...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-5 w-5 fill-current" />
                            업스케일
                        </>
                    )}
                </button>
                {isProcessing && (
                    <button
                        onClick={onCancel}
                        className="w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all border border-card-border text-text-secondary hover:text-text-primary hover:border-text-tertiary"
                    >
                        취소
                    </button>
                )}
            </div>
        </div>
    );
}

function ModeBtn({ active, onClick, icon, label, desc }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center gap-4 p-4 rounded-[1.5rem] border transition-all text-left",
                active
                    ? "border-accent bg-accent/5 text-text-primary"
                    : "border-card-border bg-background text-text-secondary hover:border-text-tertiary hover:text-text-primary"
            )}
        >
            <div className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center transition-all shadow-sm",
                active ? "bg-accent text-white" : "bg-card-bg text-text-tertiary"
            )}>
                {icon}
            </div>
            <div>
                <p className="text-[13px] font-bold tracking-tight">{label}</p>
                <p className="text-[10px] font-medium opacity-60 leading-tight">{desc}</p>
            </div>
        </button>
    )
}

function ToggleBtn({ label, active, onClick, disabled }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center justify-between w-full p-4 rounded-2xl bg-background border border-card-border transition-colors",
                disabled ? "opacity-50 cursor-not-allowed" : "group hover:bg-card-bg"
            )}
            disabled={disabled}
        >
            <span className={cn(
                "text-[12px] font-medium transition-colors",
                active ? "text-text-primary" : "text-text-secondary"
            )}>{label}</span>
            <div className={cn(
                "w-9 h-5 rounded-full relative transition-colors duration-300",
                active ? "bg-accent" : "bg-text-tertiary/20"
            )}>
                <div className={cn(
                    "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm",
                    active ? "translate-x-4" : "translate-x-0"
                )} />
            </div>
        </button>
    )
}
