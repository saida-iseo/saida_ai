'use client';

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
  Grid3X3,
  Square,
  Paintbrush,
  Wand2
} from 'lucide-react';
import SplashScreen from '@/components/layout/SplashScreen';
import { ToolCard, ToolCardWide } from '@/components/ui/ToolCard';
import { useAppStore } from '@/lib/store/useAppStore';
import RecentHistory from '@/components/shared/RecentHistory';

export default function Home() {
  const { isPremium } = useAppStore();

  return (
    <div className="bg-background min-h-screen text-text-primary transition-colors duration-300">
      <SplashScreen />
      {/* Main Container - AI Upscale is now at the TOP */}
      <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 lg:px-8">
        <div className="mb-8 px-2 animate-in fade-in slide-in-from-top-4 duration-700">
          <h2 className="text-xl font-bold text-text-primary tracking-tight mb-1.5 uppercase tracking-widest">Quick Actions</h2>
          <p className="text-xs font-medium text-text-tertiary">한 번의 클릭으로 완성되는 프리미엄 이미지 편집</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Premium Tool Grid */}
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 mb-16 animate-in fade-in zoom-in duration-700 delay-150">

              <ToolCardWide
                title="AI 업스케일 & 화질 개선"
                description="인공지능 소프트웨어가 흐릿한 사진을 선명하게 복원하고 해상도를 2~4배 향상시킵니다."
                icon={Sparkles}
                gradient="bg-vibrant-rainbow"
                badge={isPremium ? "Premium" : "Popular"}
                onClick={() => window.location.href = '/upscale'}
              />

              <ToolCard
                title="이미지 압축"
                description="파일 크기를 500KB 이하로 최적화하여 웹 로딩 속도를 높입니다."
                icon={Zap}
                gradient="bg-vibrant-green"
                onClick={() => window.location.href = '/tools/compress'}
              />

              <ToolCard
                title="이미지 크기 조절"
                description="원하는 픽셀 크기로 정밀 조정하여 다양한 용도에 맞게 최적화합니다."
                icon={MoveDiagonal}
                gradient="bg-vibrant-blue"
                onClick={() => window.location.href = '/tools/resize'}
              />

              <ToolCard
                title="이미지 포맷 변환"
                description="JPG, PNG, WebP 등 다양한 포맷으로 원본 손실 없이 변환하세요."
                icon={Files}
                gradient="bg-vibrant-purple"
                onClick={() => window.location.href = '/tools/convert'}
              />

              <ToolCard
                title="이미지 블러/흐림"
                description="개인정보 보호를 위해 원하는 영역만 자유롭게 흐림 처리하세요."
                icon={Droplets}
                gradient="bg-vibrant-orange"
                badge="New"
                onClick={() => window.location.href = '/tools/blur'}
              />

              <ToolCard
                title="이미지 잘라내기"
                description="정사각형, 16:9 등 규격에 맞춰 원하는 부분만 정확하게 잘라냅니다."
                icon={Scissors}
                gradient="bg-vibrant-red"
                onClick={() => window.location.href = '/tools/crop'}
              />

              <ToolCard
                title="이미지 회전"
                description="90도 단위 또는 상하좌우 반전을 통해 이미지 방향을 교정합니다."
                icon={RotateCw}
                gradient="bg-vibrant-blue"
                onClick={() => window.location.href = '/tools/rotate'}
              />

              <ToolCard
                title="컬러 보정"
                description="밝기/대비/채도를 조정해 분위기를 빠르게 바꿉니다."
                icon={Palette}
                gradient="bg-vibrant-purple"
                onClick={() => window.location.href = '/tools/adjust'}
              />

              <ToolCard
                title="모자이크"
                description="픽셀 모자이크로 민감한 영역을 손쉽게 가립니다."
                icon={Grid3X3}
                gradient="bg-vibrant-orange"
                onClick={() => window.location.href = '/tools/pixelate'}
              />

              <ToolCard
                title="프레임"
                description="두께와 색을 선택해 간단한 프레임을 추가합니다."
                icon={Square}
                gradient="bg-vibrant-green"
                onClick={() => window.location.href = '/tools/frame'}
              />

              <ToolCard
                title="이미지 꾸미기"
                description="텍스트, 스티커, 프레임으로 원하는 느낌을 완성하세요."
                icon={Paintbrush}
                gradient="bg-vibrant-purple"
                badge="New"
                onClick={() => window.location.href = '/tools/decorate'}
              />

              <ToolCard
                title="AI 스튜디오"
                description="AI 배경 제거, 노이즈 제거, 색상 복원을 한 곳에서."
                icon={Wand2}
                gradient="bg-vibrant-blue"
                badge="AI"
                onClick={() => window.location.href = '/ai'}
              />
            </div>
          </div>

          <aside className="order-1 lg:order-2 lg:sticky lg:top-24 h-fit">
            <div className="animate-in fade-in slide-in-from-top-4 duration-700">
              <RecentHistory variant="sidebar" />
            </div>
          </aside>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative px-6 py-20 sm:py-24 lg:px-8 text-center overflow-hidden border-t border-card-border bg-card-bg/30">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-accent/5 blur-[120px] rounded-full -z-10" />

        <div className="mx-auto max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-2 bg-card-bg/50 backdrop-blur-md border border-card-border text-text-tertiary px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] mb-8">
            Professional Image Toolkit
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl mb-6 leading-tight">
            Saida <br />
            <span className="text-accent italic font-black">image maker</span>
          </h1>
          <p className="text-sm font-medium text-text-secondary max-w-xl mx-auto leading-relaxed">
            한 번의 클릭으로 완성되는 강력한 이미지 편집.
            모든 데이터는 서버에 저장되지 않고 브라우저 내에서 안전하게 보호됩니다.
          </p>
        </div>
      </section>
    </div>
  );
}
