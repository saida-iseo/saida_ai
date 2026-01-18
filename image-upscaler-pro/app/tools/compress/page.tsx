'use client';

import React, { useState } from 'react';
import UnifiedUploadZone from '@/components/shared/UnifiedUploadZone';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';

export default function CompressPage() {
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
        router.push('/tools/compress/editor');
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-slate-950 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-4xl text-center mb-12">
                <h1 className="text-5xl font-black text-white tracking-tighter mb-4">이미지 압축</h1>
                <p className="text-slate-500 font-bold">품질 손실을 최소화하며 파일 용량을 획기적으로 줄이세요.</p>
            </div>
            <UnifiedUploadZone onUpload={handleUpload} />
        </div>
    );
}
