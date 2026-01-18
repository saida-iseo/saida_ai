'use client';

import React from 'react';
import { Eraser, Sparkles, Palette } from 'lucide-react';
import { ToolCard } from '@/components/ui/ToolCard';

export default function AiHubPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-background">
            <div className="mx-auto max-w-6xl px-6 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-text-primary tracking-tight mb-4">AI 스튜디오</h1>
                    <p className="text-sm font-bold text-text-secondary">브라우저에서 바로 실행되는 AI 이미지 보정</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ToolCard
                        title="AI 배경 제거"
                        description="자동 배경 감지와 투명 처리로 피사체를 깔끔하게 분리합니다."
                        icon={Eraser}
                        gradient="bg-vibrant-green"
                        badge="Beta"
                        onClick={() => window.location.href = '/ai/background-remove'}
                    />
                    <ToolCard
                        title="AI 노이즈 제거/선명화"
                        description="노이즈를 줄이고 디테일을 또렷하게 복원합니다."
                        icon={Sparkles}
                        gradient="bg-vibrant-blue"
                        badge="New"
                        onClick={() => window.location.href = '/ai/denoise'}
                    />
                    <ToolCard
                        title="AI 색상 복원"
                        description="밝기·대비·채도를 조정해 자연스러운 색감을 되살립니다."
                        icon={Palette}
                        gradient="bg-vibrant-purple"
                        onClick={() => window.location.href = '/ai/color-restore'}
                    />
                </div>
            </div>
        </div>
    );
}
