'use client';

import React, { useState } from 'react';
import UnifiedUploadZone from '@/components/shared/UnifiedUploadZone';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';

export default function ResizePage() {
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
        router.push('/tools/resize/editor');
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-4xl text-center mb-12">
                <h1 className="text-5xl font-black text-white tracking-tighter mb-4">크기 조정</h1>
                <p className="text-slate-500 font-bold">이미지의 픽셀 크기나 비율을 정확하게 조정하세요.</p>
            </div>
            <UnifiedUploadZone onUpload={handleUpload} />
        </div>
    );
}
