'use client';

import React, { useState } from 'react';
import UnifiedUploadZone from '@/components/shared/UnifiedUploadZone';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import { addRecentHistory, createThumbnail } from '@/lib/history/recentHistory';

export default function RotatePage() {
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
            tool: '이미지 회전',
            route: '/tools/rotate/editor',
            imageId: metadata.id,
            name: metadata.name,
            type: metadata.type,
            size: metadata.size,
            width: metadata.width,
            height: metadata.height,
            thumbUrl,
            createdAt: Date.now(),
        });
        router.push('/tools/rotate/editor');
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-background flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-3xl text-center mb-8">
                <h1 className="text-4xl font-black text-text-primary tracking-tighter mb-3">이미지 회전</h1>
                <p className="text-text-secondary font-bold">이미지를 90도씩 회전하거나 180도 반전시키세요.</p>
            </div>
            <UnifiedUploadZone onUpload={handleUpload} />
        </div>
    );
}
