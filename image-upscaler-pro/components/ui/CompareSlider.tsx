'use client';

import React, { useState, useRef, useEffect } from 'react';

interface CompareSliderProps {
    beforeUrl: string;
    afterUrl: string | null;
    beforeW?: number;
    beforeH?: number;
    afterW?: number;
    afterH?: number;
    zoom?: number;
}

export default function CompareSlider({
    beforeUrl,
    afterUrl,
    beforeW,
    beforeH,
    afterW,
    afterH,
    zoom = 1
}: CompareSliderProps) {
    const [sliderPos, setSliderPos] = useState(50);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);

    const handleMove = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        // 테두리 두께(4px * 2 = 8px)만큼 안쪽으로 제한
        const borderWidth = 8;
        const minX = borderWidth;
        const maxX = rect.width - borderWidth;
        const x = Math.max(minX, Math.min(clientX - rect.left, maxX));
        const percent = ((x - minX) / (maxX - minX)) * 100;
        setSliderPos(percent);
    };

    const onPointerDown = (e: React.PointerEvent) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setIsResizing(true);
        handleMove(e.clientX);
        document.body.style.userSelect = 'none';
    };

    const onPointerMove = (e: React.PointerEvent) => {
        if (isResizing) handleMove(e.clientX);
    };

    const onPointerUp = (e: React.PointerEvent) => {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        setIsResizing(false);
        document.body.style.userSelect = '';
    };

    return (
        <div
            className="relative w-full max-w-[1100px] h-[560px] mx-auto overflow-hidden rounded-[2rem] bg-gray-900 border-4 border-gray-800 shadow-2xl flex-none select-none"
            ref={containerRef}
        >
            {/* 1. BEFORE Image (Z-index base) */}
            <img
                src={beforeUrl}
                alt="Before"
                className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none select-none"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
                draggable={false}
            />

            {/* 2. AFTER Image (Z-index top + Masking) */}
            {afterUrl && (
                <img
                    src={afterUrl}
                    alt="After"
                    className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none select-none"
                    style={{
                        clipPath: `inset(4px calc(8px + ${sliderPos}% * (100% - 16px) / 100) 4px 8px)`,
                        transform: `scale(${zoom})`,
                        transformOrigin: 'center center'
                    }}
                    draggable={false}
                />
            )}

            {/* 3. Large BEFORE/AFTER Labels */}
            <div className="absolute inset-0 pointer-events-none z-10">
                {/* BEFORE Label - Large and Bold on Left */}
                <div 
                    className="absolute top-1/2 left-8 -translate-y-1/2 z-20"
                    style={{ 
                        opacity: afterUrl ? (sliderPos > 20 ? 1 : sliderPos / 20) : 1,
                        transition: 'opacity 0.2s ease'
                    }}
                >
                    <div className="bg-black/80 backdrop-blur-xl text-white text-5xl md:text-7xl font-black uppercase tracking-wider px-6 py-3 rounded-xl border-4 border-white/40 shadow-2xl">
                        BEFORE
                    </div>
                    {beforeW && beforeH && (
                        <div className="text-left mt-2 text-white/90 text-xs font-bold ml-1">
                            {beforeW} × {beforeH}px
                        </div>
                    )}
                </div>

                {/* AFTER Label - Large and Bold on Right */}
                {afterUrl && (
                    <div 
                        className="absolute top-1/2 right-8 -translate-y-1/2 z-20"
                        style={{ 
                            opacity: sliderPos < 80 ? 1 : (100 - sliderPos) / 20,
                            transition: 'opacity 0.2s ease'
                        }}
                    >
                        <div className="bg-emerald-600/90 backdrop-blur-xl text-white text-5xl md:text-7xl font-black uppercase tracking-wider px-6 py-3 rounded-xl border-4 border-white/40 shadow-2xl">
                            AFTER
                        </div>
                        {afterW && afterH && (
                            <div className="text-right mt-2 text-white/90 text-xs font-bold mr-1">
                                {afterW} × {afterH}px
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 4. Draggable Divider Handle */}
            {afterUrl && (
                <div
                    className="absolute inset-y-0 w-2 bg-white/90 shadow-[0_0_30px_rgba(0,0,0,0.6)] cursor-ew-resize z-30"
                    style={{ 
                        left: `calc(8px + ${sliderPos}% * (100% - 16px) / 100)`,
                        top: '4px',
                        bottom: '4px'
                    }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-white shadow-2xl flex items-center justify-center border-[6px] border-emerald-500 transition-transform active:scale-90 pointer-events-none">
                        <div className="flex gap-2">
                            <div className="h-5 w-1.5 bg-emerald-500 rounded-full" />
                            <div className="h-5 w-1.5 bg-emerald-500 rounded-full" />
                        </div>
                    </div>
                    {/* Arrow indicators */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-white text-2xl font-black">◀</div>
                        <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-white text-2xl font-black">▶</div>
                    </div>
                </div>
            )}
        </div>
    );
}

/** 
 * [왜 이 방식이 크기 흔들림을 100% 막는가]
 * 1. 컨테이너를 h-[560px]로 고정하여 외부 레이아웃의 유동성을 차단함.
 * 2. BEFORE/AFTER 이미지 모두 absolute inset-0와 동일한 object-fit을 사용하여 렌더링 좌표를 일치시킴.
 * 3. AFTER 이미지를 mask-width가 아닌 clip-path: inset()으로 가려 브라우저의 리플로우(Reflow)를 방지함.
 * 4. object-fit 연산이 이미지 크기 변화 시에도 컨테이너 기준점으로 고정되므로 픽셀 단위 흔들림이 발생하지 않음.
 */
