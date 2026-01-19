'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { imageDb } from '@/lib/db/imageDb';
import { useRouter } from 'next/navigation';
import { ArrowLeft, QrCode, Copy, ExternalLink, Check, AlertCircle } from 'lucide-react';
import jsQR from 'jsqr';

export default function QRScannerEditor() {
    const router = useRouter();
    const { originalImage } = useAppStore();
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [qrData, setQrData] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!originalImage) {
            router.push('/tools/qr-scanner');
            return;
        }

        const loadImage = async () => {
            const blob = await imageDb.getImage(originalImage.id);
            if (blob) {
                const url = URL.createObjectURL(blob);
                setImageUrl(url);
            }
        };

        loadImage();

        return () => {
            if (imageUrl) URL.revokeObjectURL(imageUrl);
        };
    }, [originalImage, router]);

    const scanQRCode = useCallback(async () => {
        if (!imageUrl) return;

        setIsScanning(true);
        setError(null);
        setQrData(null);

        try {
            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = imageUrl;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                throw new Error('Canvas context를 가져올 수 없습니다');
            }

            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
            });

            if (code) {
                setQrData(code.data);
            } else {
                setError('QR 코드를 찾을 수 없습니다. 이미지가 선명하고 QR 코드가 포함되어 있는지 확인하세요.');
            }
        } catch (err) {
            console.error('QR 스캔 실패:', err);
            setError('QR 코드 스캔 중 오류가 발생했습니다.');
        } finally {
            setIsScanning(false);
        }
    }, [imageUrl]);

    useEffect(() => {
        if (imageUrl) {
            scanQRCode();
        }
    }, [imageUrl, scanQRCode]);

    const handleCopy = async () => {
        if (!qrData) return;
        
        try {
            await navigator.clipboard.writeText(qrData);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('클립보드 복사 실패:', err);
        }
    };

    const handleOpenUrl = () => {
        if (!qrData) return;
        
        try {
            const url = new URL(qrData);
            window.open(url.toString(), '_blank', 'noopener,noreferrer');
        } catch (err) {
            console.error('유효하지 않은 URL:', err);
        }
    };

    const isValidUrl = (str: string) => {
        try {
            new URL(str);
            return true;
        } catch {
            return false;
        }
    };

    if (!originalImage || !imageUrl) return null;

    return (
        <div className="min-h-screen bg-background transition-colors duration-300">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <button
                        onClick={() => router.push('/tools/qr-scanner')}
                        className="flex items-center gap-2 text-text-secondary hover:text-text-primary font-medium transition-all group"
                    >
                        <div className="p-2 rounded-xl bg-card-bg border border-card-border shadow-sm group-hover:scale-105 transition-all">
                            <ArrowLeft className="h-4 w-4" />
                        </div>
                        <span className="text-sm">다시 업로드</span>
                    </button>
                    <div className="bg-card-bg px-4 py-1.5 rounded-full border border-card-border text-[11px] font-bold text-text-tertiary uppercase tracking-widest">
                        QR Scanner
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Image Preview */}
                    <div className="bg-card-bg p-6 rounded-[2rem] border border-card-border shadow-sm">
                        <h3 className="text-lg font-bold text-text-primary mb-4">원본 이미지</h3>
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-background border border-card-border">
                            <img
                                src={imageUrl}
                                alt="QR Code"
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="mt-4 text-xs text-text-tertiary">
                            <p>{originalImage.name}</p>
                            <p>{originalImage.width} × {originalImage.height}px</p>
                        </div>
                    </div>

                    {/* Right: Scan Results */}
                    <div className="space-y-6">
                        <div className="bg-card-bg p-8 rounded-[2rem] border border-card-border shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 text-white shadow-lg">
                                    <QrCode className="h-6 w-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-text-primary">스캔 결과</h2>
                                    <p className="text-xs text-text-tertiary">QR 코드 정보</p>
                                </div>
                            </div>

                            {isScanning && (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                        <p className="text-text-secondary font-semibold">QR 코드 스캔 중...</p>
                                    </div>
                                </div>
                            )}

                            {!isScanning && error && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-red-500 font-bold mb-1">스캔 실패</h4>
                                            <p className="text-text-secondary text-sm">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!isScanning && qrData && (
                                <div className="space-y-4">
                                    <div className="bg-background border border-card-border rounded-xl p-4">
                                        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2">
                                            QR 데이터
                                        </p>
                                        <p className="text-text-primary font-mono text-sm break-all leading-relaxed">
                                            {qrData}
                                        </p>
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleCopy}
                                            className="flex-1 bg-accent hover:bg-accent/90 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="h-4 w-4" />
                                                    복사됨!
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-4 w-4" />
                                                    복사하기
                                                </>
                                            )}
                                        </button>
                                        
                                        {isValidUrl(qrData) && (
                                            <button
                                                onClick={handleOpenUrl}
                                                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                링크 열기
                                            </button>
                                        )}
                                    </div>

                                    {isValidUrl(qrData) && (
                                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                                            <div className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-green-500" />
                                                <p className="text-green-500 font-semibold text-sm">유효한 URL이 감지되었습니다</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Info Panel */}
                        <div className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-sm">
                            <h4 className="text-sm font-bold text-text-primary mb-3">사용 팁</h4>
                            <ul className="space-y-2 text-xs text-text-secondary">
                                <li className="flex items-start gap-2">
                                    <span className="text-accent mt-0.5">•</span>
                                    <span>선명한 이미지를 사용하면 인식률이 높아집니다</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-accent mt-0.5">•</span>
                                    <span>QR 코드가 이미지의 중앙에 위치하면 더 잘 인식됩니다</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-accent mt-0.5">•</span>
                                    <span>URL, 텍스트, 연락처 등 다양한 QR 코드 형식을 지원합니다</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-accent mt-0.5">•</span>
                                    <span>모든 처리는 브라우저에서만 이루어져 보안이 보장됩니다</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
