'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import { Heart, Sparkles, Files, Zap, MoveDiagonal, Stamp, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function Navbar() {
    const { theme, toggleTheme } = useAppStore();
    const pathname = usePathname();
    const isHome = pathname === '/';

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-card-border bg-header-bg backdrop-blur-md transition-colors duration-300">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
                            <Heart className="h-4 w-4 fill-current" />
                        </div>
                        {isHome && (
                            <span className="text-xl font-bold tracking-tight text-text-primary hidden sm:block">
                                Saida <span className="text-accent italic">image maker</span>
                            </span>
                        )}
                    </Link>

                    {/* Core Menu */}
                    <div className="hidden lg:flex items-center gap-6">
                        <NavItem label="업스케일링" href="/upscale" />
                        <NavItem label="포맷 변환" href="/tools/convert" />
                        <NavItem label="이미지 압축" href="/tools/compress" />
                        <NavItem label="크기 조절" href="/tools/resize" />
                        <NavItem label="워터마크" href="/tools/watermark-maker" />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-xl bg-card-bg text-text-secondary hover:text-text-primary border border-card-border transition-all"
                        aria-label="Toggle Theme"
                    >
                        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </button>

                    <button className="hidden sm:block text-[11px] font-bold text-accent px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20">
                        Premium
                    </button>
                </div>
            </div>
        </nav>
    );
}

function NavItem({ label, href }: { label: string; href: string }) {
    const pathname = usePathname();
    const isActive = pathname.startsWith(href) && href !== '/';

    return (
        <Link
            href={href}
            className={cn(
                "text-[13px] font-medium transition-colors hover:text-accent",
                isActive ? "text-accent font-bold" : "text-text-secondary"
            )}
        >
            {label}
        </Link>
    );
}
