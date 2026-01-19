'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import { Heart, Sun, Moon, MoveDiagonal, Files, Droplets, Scissors, RotateCw, Palette, Square, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useSession, signOut } from 'next-auth/react';

const categories = [
    { icon: MoveDiagonal, label: '크기 조절', href: '/tools/resize' },
    { icon: Files, label: '포맷 변환', href: '/tools/convert' },
    { icon: Droplets, label: '블러/흐림', href: '/tools/blur' },
    { icon: Scissors, label: '잘라내기', href: '/tools/crop' },
    { icon: RotateCw, label: '회전', href: '/tools/rotate' },
    { icon: Palette, label: '컬러 보정', href: '/tools/adjust' },
    { icon: Square, label: '프레임', href: '/tools/frame' },
];

export default function Navbar() {
    const { theme, toggleTheme } = useAppStore();
    const pathname = usePathname();
    const { data: session, status } = useSession();

    // 카테고리를 3번 복제하여 끊김 없는 무한 스크롤 구현
    const tripleCategories = [...categories, ...categories, ...categories];

    return (
        <>
            <nav className="sticky top-0 z-50 w-full border-b border-card-border bg-header-bg backdrop-blur-md transition-colors duration-300">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
                                <Heart className="h-4 w-4 fill-current" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-text-primary hidden sm:block">
                                Saida <span className="text-accent italic">image maker</span>
                            </span>
                        </Link>
                    </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <button className="hidden sm:block text-[11px] font-bold text-accent px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-all">
                        Premium
                    </button>
                    
                    {status === 'loading' ? (
                        <div className="hidden sm:block w-20 h-7 bg-card-bg border border-card-border rounded-full animate-pulse" />
                    ) : session ? (
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card-bg border border-card-border">
                                {session.user?.image ? (
                                    <img 
                                        src={session.user.image} 
                                        alt={session.user.name || 'User'} 
                                        className="w-5 h-5 rounded-full"
                                    />
                                ) : (
                                    <User className="h-4 w-4 text-text-secondary" />
                                )}
                                <span className="text-[11px] font-bold text-text-primary">
                                    {session.user?.name || session.user?.email?.split('@')[0] || '사용자'}
                                </span>
                            </div>
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
                                className="p-2 rounded-xl bg-card-bg text-text-secondary hover:text-text-primary border border-card-border transition-all"
                                aria-label="로그아웃"
                                title="로그아웃"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="hidden sm:inline-flex text-[11px] font-bold text-text-primary px-4 py-1.5 rounded-full bg-card-bg border border-card-border hover:text-accent transition-all"
                        >
                            로그인
                        </Link>
                    )}
                    
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl bg-card-bg text-text-secondary hover:text-text-primary border border-card-border transition-all"
                        aria-label="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>
                </div>
                </div>
            </nav>

            {/* 회전하는 카테고리 네비게이션 */}
            <div className="relative w-full border-b border-card-border bg-card-bg/30 backdrop-blur-sm overflow-hidden">
                {/* 양쪽 그라데이션 페이드 효과 */}
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-card-bg/80 via-card-bg/60 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-card-bg/80 via-card-bg/60 to-transparent z-10 pointer-events-none" />

                {/* 무한 스크롤 컨테이너 */}
                <div className="flex animate-category-marquee py-2">
                    {tripleCategories.map((category, index) => {
                        const Icon = category.icon;
                        const isActive = pathname === category.href || pathname.startsWith(category.href + '/');

                        return (
                            <Link
                                key={`${category.href}-${index}`}
                                href={category.href}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 mx-2 rounded-full transition-all duration-300 whitespace-nowrap group flex-shrink-0",
                                    isActive
                                        ? "bg-accent text-white shadow-lg scale-105"
                                        : "bg-card-bg/50 text-text-secondary hover:text-text-primary hover:bg-card-bg border border-card-border/50 hover:border-card-border hover:scale-105"
                                )}
                            >
                                <Icon className={cn(
                                    "w-4 h-4 transition-transform group-hover:rotate-12 flex-shrink-0",
                                    isActive && "animate-pulse"
                                )} />
                                <span className="text-xs font-semibold">{category.label}</span>
                            </Link>
                        );
                    })}
                </div>

                <style jsx>{`
                    @keyframes category-marquee {
                        0% {
                            transform: translateX(0);
                        }
                        100% {
                            transform: translateX(-33.333%);
                        }
                    }

                    .animate-category-marquee {
                        animation: category-marquee 45s linear infinite;
                    }
                `}</style>
            </div>
        </>
    );
}
