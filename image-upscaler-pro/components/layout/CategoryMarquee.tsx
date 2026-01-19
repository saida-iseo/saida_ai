'use client';

import { 
  Sparkles, 
  Zap, 
  MoveDiagonal, 
  Files, 
  Droplets, 
  Scissors, 
  RotateCw, 
  Palette, 
  Square, 
  Type,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { useState } from 'react';

const categories = [
  { icon: Sparkles, label: 'AI업스케일&화질개선', href: '/upscale', gradient: 'from-pink-500 to-purple-500' },
  { icon: Zap, label: '이미지 압축', href: '/tools/compress', gradient: 'from-green-500 to-emerald-500' },
  { icon: MoveDiagonal, label: '크기 조절', href: '/tools/resize', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Files, label: '포맷 변환', href: '/tools/convert', gradient: 'from-purple-500 to-pink-500' },
  { icon: Droplets, label: '블러/흐림', href: '/tools/blur', gradient: 'from-orange-500 to-yellow-500' },
  { icon: Scissors, label: '잘라내기', href: '/tools/crop', gradient: 'from-red-500 to-pink-500' },
  { icon: RotateCw, label: '회전', href: '/tools/rotate', gradient: 'from-blue-500 to-indigo-500' },
  { icon: Palette, label: '컬러 보정', href: '/tools/adjust', gradient: 'from-purple-500 to-violet-500' },
  { icon: Square, label: '프레임', href: '/tools/frame', gradient: 'from-green-500 to-teal-500' },
  { icon: Type, label: '워터마크', href: '/tools/watermark-maker', gradient: 'from-indigo-500 to-blue-500' },
];

export default function CategoryMarquee() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // 카테고리를 3번 복제하여 끊김 없는 무한 스크롤 구현
  const tripleCategories = [...categories, ...categories, ...categories];

  return (
    <div className="relative w-full border-b border-card-border bg-card-bg/30 backdrop-blur-sm">
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2 flex items-center justify-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
      >
        <span className="text-xs font-semibold">모든 카테고리</span>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-300",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* 슬라이드 다운 컨테이너 */}
      <div className={cn(
        "relative w-full overflow-hidden transition-all duration-300",
        isOpen ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
      )}>
        {/* 양쪽 그라데이션 페이드 효과 */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-card-bg/80 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-card-bg/80 to-transparent z-10 pointer-events-none" />

        {/* 무한 스크롤 컨테이너 */}
        <div className="flex animate-marquee hover:pause-animation py-3">
          {tripleCategories.map((category, index) => {
            const Icon = category.icon;
            const isActive = pathname === category.href || pathname.startsWith(category.href + '/');

            return (
              <Link
                key={`${category.href}-${index}`}
                href={category.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 mx-2 rounded-full transition-all duration-300 whitespace-nowrap group flex-shrink-0 w-[140px] justify-center",
                  isActive
                    ? `bg-gradient-to-r ${category.gradient} text-white shadow-lg shadow-accent/20 scale-105`
                    : "bg-card-bg/50 text-text-secondary hover:text-text-primary hover:bg-card-bg border border-card-border/50 hover:border-card-border hover:scale-105"
                )}
              >
                <Icon className={cn(
                  "w-4 h-4 transition-transform group-hover:rotate-12 flex-shrink-0",
                  isActive && "animate-pulse"
                )} />
                <span className="text-xs font-semibold truncate">{category.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        .animate-marquee {
          animation: marquee 60s linear infinite;
        }

        .pause-animation:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
