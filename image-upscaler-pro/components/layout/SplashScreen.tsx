'use client';

import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

export default function SplashScreen() {
    const [isVisible, setIsVisible] = useState(true);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsFading(true);
            setTimeout(() => setIsVisible(false), 800);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-1000 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
            <div className="relative">
                <div className="absolute inset-0 bg-accent blur-[60px] opacity-10 animate-pulse" />

                <div className="relative flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-1000">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-accent text-white shadow-xl shadow-accent/20">
                        <Heart className="h-8 w-8 fill-current" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
                            Saida <span className="text-accent">image maker</span>
                        </h1>
                        <p className="mt-2 text-[10px] font-bold text-text-tertiary uppercase tracking-[0.3em]">
                            Processing Excellence
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
