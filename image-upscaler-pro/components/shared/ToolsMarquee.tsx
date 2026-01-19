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
  Type
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

const tools = [
  { icon: Sparkles, label: 'AI업스케일&화질개선', href: '/upscale', gradient: 'from-pink-500 via-purple-500 to-blue-500' },
  { icon: Zap, label: '이미지 압축', href: '/tools/compress', gradient: 'from-green-500 to-emerald-600' },
  { icon: MoveDiagonal, label: '크기 조절', href: '/tools/resize', gradient: 'from-blue-500 to-cyan-500' },
  { icon: Files, label: '포맷 변환', href: '/tools/convert', gradient: 'from-purple-500 to-pink-500' },
  { icon: Droplets, label: '블러/흐림', href: '/tools/blur', gradient: 'from-orange-500 to-yellow-500' },
  { icon: Scissors, label: '잘라내기', href: '/tools/crop', gradient: 'from-red-500 to-pink-500' },
  { icon: RotateCw, label: '회전', href: '/tools/rotate', gradient: 'from-blue-500 to-indigo-500' },
  { icon: Palette, label: '컬러 보정', href: '/tools/adjust', gradient: 'from-purple-500 to-violet-500' },
  { icon: Square, label: '프레임', href: '/tools/frame', gradient: 'from-green-500 to-teal-500' },
  { icon: Type, label: '워터마크', href: '/tools/watermark-maker', gradient: 'from-indigo-500 to-blue-500' },
];

export default function ToolsMarquee() {
  // 카테고리를 3번 복제하여 끊김 없는 무한 스크롤 구현
  const tripleTools = [...tools, ...tools, ...tools];

  return (
    <div className="relative w-full overflow-hidden mb-12">
      {/* 양쪽 그라데이션 페이드 효과 */}
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background via-background/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background via-background/80 to-transparent z-10 pointer-events-none" />

      {/* 무한 스크롤 컨테이너 */}
      <div className="flex animate-tools-marquee hover:pause-animation py-2">
        {tripleTools.map((tool, index) => {
          const Icon = tool.icon;

          return (
            <Link
              key={`${tool.href}-${index}`}
              href={tool.href}
              className={cn(
                "flex items-center gap-2.5 px-5 py-3 mx-2.5 rounded-2xl transition-all duration-300 whitespace-nowrap group flex-shrink-0 shadow-lg",
                `bg-gradient-to-r ${tool.gradient} hover:scale-110 hover:shadow-2xl`
              )}
            >
              <Icon className="w-5 h-5 text-white transition-transform group-hover:rotate-12 group-hover:scale-110" />
              <span className="text-sm font-bold text-white">{tool.label}</span>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes tools-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }

        .animate-tools-marquee {
          animation: tools-marquee 45s linear infinite;
        }

        .pause-animation:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
