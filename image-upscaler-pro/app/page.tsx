'use client';

import React from 'react';
import {
  Zap,
  MoveDiagonal,
  Image as ImageIcon,
  Scissors,
  RotateCw,
  Sparkles,
  ZapOff,
  Files,
  Droplets,
  Palette,
  Square,
  Eraser,
  Sparkle,
  QrCode
} from 'lucide-react';
import SplashScreen from '@/components/layout/SplashScreen';
import { ToolCard, ToolCardWide } from '@/components/ui/ToolCard';
import { useAppStore } from '@/lib/store/useAppStore';
import RecentHistory from '@/components/shared/RecentHistory';
import ToolsMarquee from '@/components/shared/ToolsMarquee';

export default function Home() {
  const { isPremium } = useAppStore();

  return (
    <div className="bg-background min-h-screen text-text-primary transition-colors duration-300">
      <SplashScreen />
      
      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Main Content - Left Side */}
          <div className="flex-1">
            <div className="mb-8 px-2 animate-in fade-in slide-in-from-top-4 duration-700">
              <h2 className="text-xl font-bold text-text-primary tracking-tight mb-1.5 uppercase tracking-widest">Quick Actions</h2>
              <p className="text-xs font-medium text-text-tertiary">한 번의 클릭으로 완성되는 프리미엄 이미지 편집</p>
            </div>

            {/* 2xN 그리드 레이아웃 */}
            <div className="grid grid-cols-2 gap-6 mb-16">
              <ToolCard
                title="AI 업스케일 & 화질 개선"
                description="인공지능 소프트웨어가 흐릿한 사진을 선명하게 복원하고 해상도를 2~4배 향상시킵니다."
                icon={Sparkles}
                gradient="bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600"
                badge={isPremium ? "Premium" : "Popular"}
                onClick={() => window.location.href = '/upscale'}
              />

              <ToolCard
                title="이미지 압축"
                description="파일 크기를 500KB 이하로 최적화하여 웹 로딩 속도를 높입니다."
                icon={Zap}
                gradient="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500"
                onClick={() => window.location.href = '/tools/compress'}
              />

              <ToolCard
                title="이미지 크기 조절"
                description="원하는 픽셀 크기로 정밀 조정하여 다양한 용도에 맞게 최적화합니다."
                icon={MoveDiagonal}
                gradient="bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-500"
                onClick={() => window.location.href = '/tools/resize'}
              />

              <ToolCard
                title="이미지 포맷 변환"
                description="JPG, PNG, WebP 등 다양한 포맷으로 원본 손실 없이 변환하세요."
                icon={Files}
                gradient="bg-gradient-to-br from-purple-500 via-violet-500 to-fuchsia-500"
                onClick={() => window.location.href = '/tools/convert'}
              />

              <ToolCard
                title="이미지 블러/흐림"
                description="개인정보 보호를 위해 원하는 영역만 자유롭게 흐림 처리하세요."
                icon={Droplets}
                gradient="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500"
                badge="New"
                onClick={() => window.location.href = '/tools/blur'}
              />

              <ToolCard
                title="이미지 잘라내기"
                description="정사각형, 16:9 등 규격에 맞춰 원하는 부분만 정확하게 잘라냅니다."
                icon={Scissors}
                gradient="bg-gradient-to-br from-red-500 via-rose-500 to-pink-500"
                onClick={() => window.location.href = '/tools/crop'}
              />

              <ToolCard
                title="이미지 회전"
                description="90도 단위 또는 상하좌우 반전을 통해 이미지 방향을 교정합니다."
                icon={RotateCw}
                gradient="bg-gradient-to-br from-indigo-500 via-blue-500 to-sky-500"
                onClick={() => window.location.href = '/tools/rotate'}
              />

              <ToolCard
                title="컬러 보정"
                description="밝기/대비/채도를 조정해 분위기를 빠르게 바꿉니다."
                icon={Palette}
                gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-pink-600"
                onClick={() => window.location.href = '/tools/adjust'}
              />

              <ToolCard
                title="AI 배경 제거"
                description="자동 배경 감지와 투명 처리로 피사체를 깔끔하게 분리합니다."
                icon={Eraser}
                gradient="bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500"
                badge="AI"
                onClick={() => window.location.href = '/ai/background-remove'}
              />

              <ToolCard
                title="프레임"
                description="두께와 색을 선택해 간단한 프레임을 추가합니다."
                icon={Square}
                gradient="bg-gradient-to-br from-teal-500 via-green-500 to-emerald-500"
                onClick={() => window.location.href = '/tools/frame'}
              />

              <ToolCard
                title="QR 코드 스캐너"
                description="이미지에서 QR 코드를 읽고 정보를 추출합니다."
                icon={QrCode}
                gradient="bg-gradient-to-br from-purple-600 via-indigo-500 to-blue-500"
                badge="New"
                onClick={() => window.location.href = '/tools/qr-scanner'}
              />
            </div>
          </div>

          {/* Right Sidebar - Recent History */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-20">
              <RecentHistory variant="sidebar" />
            </div>
          </div>
        </div>

        {/* Recent History for Mobile/Tablet */}
        <div className="lg:hidden max-w-4xl mx-auto mb-16">
          <RecentHistory variant="default" />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative px-6 py-12 lg:px-8 text-center overflow-hidden border-t border-card-border bg-card-bg/30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent/5 blur-[120px] rounded-full -z-10" />

        <div className="mx-auto max-w-4xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-card-bg/50 backdrop-blur-md border border-card-border text-text-tertiary px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] mb-4">
            Professional Image Toolkit
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl mb-4 leading-tight">
            <span className="whitespace-nowrap">Saida image maker</span>
          </h1>
          <p className="text-sm font-medium text-text-secondary mx-auto leading-relaxed">
            한 번의 클릭으로 완성되는 강력한 이미지 편집. 모든 데이터는 서버에 저장되지 않고 브라우저 내에서 안전하게 보호됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}
