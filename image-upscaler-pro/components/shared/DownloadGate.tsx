'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';
import { cn } from '@/lib/utils/cn';
import { Crown, Download, Lock, X } from 'lucide-react';

interface DownloadGateProps {
    onDownload: () => void;
    children: React.ReactNode;
}

export default function DownloadGate({ onDownload, children }: DownloadGateProps) {
    const { dailyDownloadCount, isPremium, incrementDownloadCount } = useAppStore();
    const [showModal, setShowModal] = useState(false);
    const [limitReached, setLimitReached] = useState(false);

    useEffect(() => {
        // Check localStorage for daily limit
        const today = new Date().toISOString().split('T')[0];
        const stored = localStorage.getItem('download_stats');

        if (stored) {
            const { date, count } = JSON.parse(stored);
            if (date === today) {
                // Simple sync for MVP
                if (count >= 5 && !isPremium) {
                    setLimitReached(true);
                }
            } else {
                localStorage.setItem('download_stats', JSON.stringify({ date: today, count: 0 }));
            }
        } else {
            localStorage.setItem('download_stats', JSON.stringify({ date: today, count: 0 }));
        }
    }, [isPremium]);

    const handleDownloadClick = () => {
        // Daily limit disabled as per user request (everything free for now)
        /*
        if (limitReached && !isPremium) {
            setShowModal(true);
            return;
        }
        */

        const today = new Date().toISOString().split('T')[0];
        const stored = JSON.parse(localStorage.getItem('download_stats') || '{}');
        const newCount = (stored.count || 0) + 1;

        localStorage.setItem('download_stats', JSON.stringify({ date: today, count: newCount }));
        incrementDownloadCount();
        onDownload();
    };

    return (
        <>
            <div onClick={handleDownloadClick}>
                {children}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] max-w-md w-full p-8 relative shadow-2xl animate-in fade-in zoom-in duration-300">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <X className="h-5 w-5 text-slate-400" />
                        </button>

                        <div className="flex justify-center mb-6">
                            <div className="h-16 w-16 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                                <Crown className="h-10 w-10 fill-current" />
                            </div>
                        </div>

                        <h3 className="text-2xl font-bold text-center text-slate-900 mb-2">프리미엄 한도 도달</h3>
                        <p className="text-center text-slate-500 mb-8 leading-relaxed">
                            무료 사용자는 하루 최대 5개의 이미지만 업스케일링할 수 있습니다. 무제한 다운로드를 위해 프리미엄으로 업그레이드하세요!
                        </p>

                        <button className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all mb-4 shadow-lg">
                            프리미엄 가입하기
                        </button>

                        <button
                            onClick={() => setShowModal(false)}
                            className="w-full text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            나중에 할게요
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
