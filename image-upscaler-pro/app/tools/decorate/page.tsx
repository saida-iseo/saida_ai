'use client';

import React from 'react';
import UnifiedUploadZone from '@/components/shared/UnifiedUploadZone';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import { addRecentHistory, createThumbnail } from '@/lib/history/recentHistory';

export default function DecoratePage() {
    const router = useRouter();
    const { setOriginalImage } = useAppStore();

    const handleUpload = async (files: File[]) => {
        const file = files[0];
        if (!file) return;

        const img = new Image();
        img.src = URL.createObjectURL(file);
        await new Promise((resolve) => {
            img.onload = resolve;
        });

        const metadata = {
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            size: file.size,
            width: img.width,
            height: img.height,
        };

        await imageDb.saveImage(metadata.id, file);
        setOriginalImage(metadata);

        const thumbUrl = await createThumbnail(file);
        addRecentHistory({
            id: crypto.randomUUID(),
            tool: '이미지 꾸미기',
            route: '/tools/decorate/editor',
            imageId: metadata.id,
            name: metadata.name,
            type: metadata.type,
            size: metadata.size,
            width: metadata.width,
            height: metadata.height,
            thumbUrl,
            createdAt: Date.now(),
        });

        router.push('/tools/decorate/editor');
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-background flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-4xl text-center mb-12">
                <h1 className="text-5xl font-black text-text-primary tracking-tighter mb-4">이미지 꾸미기</h1>
                <p className="text-text-secondary font-bold">텍스트, 스티커, 프레임으로 이미지를 꾸며보세요.</p>
            </div>
            <UnifiedUploadZone onUpload={handleUpload} />
        </div>
    );
}
