'use client';

import { useRouter } from 'next/navigation';
import UnifiedUploadZone from '@/components/shared/UnifiedUploadZone';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { QrCode } from 'lucide-react';

export default function QRScannerPage() {
    const router = useRouter();
    const setOriginalImage = useAppStore((state) => state.setOriginalImage);

    const handleUpload = async (files: File[]) => {
        const file = files[0];
        if (!file) return;

        const img = new Image();
        const url = URL.createObjectURL(file);

        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
        });

        const imageRecord = {
            id: crypto.randomUUID(),
            name: file.name,
            width: img.width,
            height: img.height,
            size: file.size,
            type: file.type,
            createdAt: Date.now(),
        };

        await imageDb.saveImage(imageRecord.id, file);

        URL.revokeObjectURL(url);
        setOriginalImage(imageRecord);
        router.push('/tools/qr-scanner/editor');
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-background flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-3xl text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-purple-500/10 text-purple-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-purple-500/20">
                    <QrCode className="h-4 w-4" />
                    QR Scanner
                </div>
                <h1 className="text-4xl font-black text-text-primary tracking-tighter mb-3">QR 코드 스캐너</h1>
                <p className="text-text-secondary font-bold">이미지에서 QR 코드를 읽고 정보를 추출하세요.</p>
            </div>
            <UnifiedUploadZone onUpload={handleUpload} />
        </div>
    );
}
