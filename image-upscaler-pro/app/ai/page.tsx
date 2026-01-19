'use client';

import React from 'react';
import { Eraser, Sparkles } from 'lucide-react';
import { ToolCard } from '@/components/ui/ToolCard';

export default function AiHubPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-background">
            <div className="mx-auto max-w-6xl px-6 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-text-primary tracking-tight mb-4">AI 스튜디오</h1>
                    <p className="text-sm font-bold text-text-secondary">브라우저에서 바로 실행되는 AI 이미지 보정</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    <ToolCard
                        title="AI 업스케일 & 화질 개선"
                        description="인공지능 소프트웨어가 흐릿한 사진을 선명하게 복원하고 해상도를 2~4배 향상시킵니다."
                        icon={Sparkles}
                        gradient="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600"
                        badge="Popular"
                        onClick={() => window.location.href = '/upscale'}
                    />
                    <ToolCard
                        title="AI 배경 제거"
                        description="자동 배경 감지와 투명 처리로 피사체를 깔끔하게 분리합니다."
                        icon={Eraser}
                        gradient="bg-vibrant-green"
                        badge="Beta"
                        onClick={() => window.location.href = '/ai/background-remove'}
                    />
                </div>
            </div>
        </div>
    );
}
