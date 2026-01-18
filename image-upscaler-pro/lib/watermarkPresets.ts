'use client';

export interface WatermarkPreset {
    id: string;
    name: string;
    type: 'text' | 'logo' | 'tile';
    settings: any;
}

export const WATERMARK_PRESETS: WatermarkPreset[] = [
    {
        id: 'insta-bottom',
        name: '인스타 하단',
        type: 'text',
        settings: {
            text: '@YOUR_BRAND',
            fontSize: 24,
            fontWeight: '900',
            color: '#FFFFFF',
            opacity: 0.8,
            position: 'bottom-center',
            padding: 40,
        }
    },
    {
        id: 'tile-diagonal',
        name: '대각선 반복',
        type: 'tile',
        settings: {
            text: 'SAIDA IMAGE',
            fontSize: 32,
            fontWeight: '700',
            color: '#FFFFFF',
            opacity: 0.15,
            angle: -30,
            gapX: 200,
            gapY: 200,
        }
    },
    {
        id: 'logo-clean',
        name: '로고 기본',
        type: 'logo',
        settings: {
            scale: 0.5,
            opacity: 0.9,
            position: 'center',
            shadow: true
        }
    }
];
