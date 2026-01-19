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
            className="relative w-full max-w-[1100px] h-[560px] mx-auto overflow-hidden rounded-[2rem] bg-neutral-100 border-4 border-white shadow-2xl flex-none select-none"
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

            {/* 3. Information Labels */}
            <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
                <div className="bg-black/40 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-white/20 w-fit">
                    BEFORE {beforeW && beforeH ? `• ${beforeW}x${beforeH}px` : ''}
                </div>
            </div>

            {afterUrl && (
                <div className="absolute top-6 right-6 flex flex-col items-end gap-2 z-10">
                    <div className="bg-emerald-500/80 backdrop-blur-md text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-white/20 w-fit">
                        AI AFTER {afterW && afterH ? `• ${afterW}x${afterH}px` : ''}
                    </div>
                </div>
            )}

            {/* 4. Draggable Divider Handle */}
            {afterUrl && (
                <div
                    className="absolute inset-y-0 w-1.5 bg-white shadow-[0_0_20px_rgba(0,0,0,0.4)] cursor-ew-resize z-20"
                    style={{ 
                        left: `calc(8px + ${sliderPos}% * (100% - 16px) / 100)`,
                        top: '4px',
                        bottom: '4px'
                    }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white shadow-2xl flex items-center justify-center border-[5px] border-emerald-500 transition-transform active:scale-90 pointer-events-none">
                        <div className="flex gap-1.5">
                            <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                            <div className="h-4 w-1 bg-emerald-500 rounded-full" />
                        </div>
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
