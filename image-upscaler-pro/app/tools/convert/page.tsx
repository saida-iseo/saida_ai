'use client';

import React, { useState } from 'react';
import UnifiedUploadZone from '@/components/shared/UnifiedUploadZone';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import { addRecentHistory, createThumbnail } from '@/lib/history/recentHistory';

export default function ConvertPage() {
    const router = useRouter();
    const { setOriginalImage, setOptions } = useAppStore();

    const handleUpload = async (files: File[]) => {
        const file = files[0];
        if (!file) return;

        // Load image to get dimensions
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
            tool: '포맷 변환',
            route: '/tools/convert/editor',
            imageId: metadata.id,
            name: metadata.name,
            type: metadata.type,
            size: metadata.size,
            width: metadata.width,
            height: metadata.height,
            thumbUrl,
            createdAt: Date.now(),
        });
        router.push('/tools/convert/editor');
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-background flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-3xl text-center mb-8">
                <h1 className="text-4xl font-black text-text-primary tracking-tighter mb-3">이미지 변환</h1>
                <p className="text-text-secondary font-bold">이미지 포맷을 PNG, JPG, WebP로 쉽게 변경하세요.</p>
            </div>
            <UnifiedUploadZone onUpload={handleUpload} />
        </div>
    );
}
