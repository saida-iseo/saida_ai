'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { cn } from '@/lib/utils/cn';
import { Info, Loader2, Sparkles, Zap } from 'lucide-react';

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
        progressDetail
    } = useAppStore();

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
                        onClick={() => {
                            const { setProcessedImage } = useAppStore.getState();
                            setProcessedImage(null); // 기존 처리 결과 초기화
                            setOptions({ upscaleFactor: 2 });
                            // 2x 선택 시 즉시 스케일링 시작
                            if (!isProcessing && upscaleFactor !== 2) {
                                setTimeout(() => onUpscale(), 100);
                            }
                        }}
                        className={cn(
                            "py-3 rounded-xl font-bold text-sm transition-all border-2",
                            upscaleFactor === 2
                                ? "border-blue-500 bg-blue-500 text-white shadow-lg"
                                : "border-card-border bg-background text-text-secondary hover:text-text-primary"
                        )}
                        disabled={isProcessing}
                    >
                        2x
                    </button>
                    <button
                        onClick={() => {
                            const { setProcessedImage } = useAppStore.getState();
                            setProcessedImage(null); // 기존 처리 결과 초기화
                            setOptions({ upscaleFactor: 4 });
                            // 4x 선택 시 즉시 스케일링 시작
                            if (!isProcessing && upscaleFactor !== 4) {
                                setTimeout(() => onUpscale(), 100);
                            }
                        }}
                        className={cn(
                            "py-3 rounded-xl font-bold text-sm transition-all border-2",
                            upscaleFactor === 4
                                ? "border-blue-500 bg-blue-500 text-white shadow-lg"
                                : "border-card-border bg-background text-text-secondary hover:text-text-primary"
                        )}
                        disabled={isProcessing}
                    >
                        4x
                    </button>
                </div>
                {originalImage && originalImage.width && originalImage.height && (
                    <div className="text-[11px] font-medium text-text-secondary text-center">
                        {originalImage.width} × {originalImage.height} px → {originalImage.width * upscaleFactor} × {originalImage.height * upscaleFactor} px
                    </div>
                )}
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
