'use client';

import React from 'react';
import UnifiedUploadZone from '@/components/shared/UnifiedUploadZone';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import { Droplets } from 'lucide-react';
import { addRecentHistory, createThumbnail } from '@/lib/history/recentHistory';

export default function BlurUpload() {
    const router = useRouter();
    const setOriginalImage = useAppStore((state) => state.setOriginalImage);

    const handleUpload = async (files: File[]) => {
        if (files.length === 0) return;
        const file = files[0];
        const id = crypto.randomUUID();
        await imageDb.saveImage(id, file);

        const img = new Image();
        img.src = URL.createObjectURL(file);
        await img.decode();

        setOriginalImage({
            id,
            name: file.name,
            type: file.type,
            size: file.size,
            width: img.width,
            height: img.height,
        });

        const thumbUrl = await createThumbnail(file);
        addRecentHistory({
            id: crypto.randomUUID(),
            tool: '블러 처리',
            route: '/tools/blur/editor',
            imageId: id,
            name: file.name,
            type: file.type,
            size: file.size,
            width: img.width,
            height: img.height,
            thumbUrl,
            createdAt: Date.now(),
        });

        router.push('/tools/blur/editor');
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-background flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-3xl text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-red-500/10 text-red-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-red-500/20">
                    <Droplets className="h-4 w-4" />
                    Blur Tool
                </div>
                <h1 className="text-4xl font-black text-text-primary tracking-tighter mb-3">이미지 블러 처리</h1>
                <p className="text-text-secondary font-bold">민감한 정보나 배경을 흐릿하게 처리하세요. 여러 영역을 자유롭게 선택하고 각각의 흐림 정도를 조절할 수 있습니다.</p>
            </div>
            <UnifiedUploadZone onUpload={handleUpload} />
        </div>
    );
}
