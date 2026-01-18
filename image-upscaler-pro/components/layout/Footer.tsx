'use client';

import Link from 'next/link';
import { Heart, Github, Twitter, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-header-bg border-t border-card-border py-16 transition-colors duration-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
                    {/* Brand Column */}
                    <div className="col-span-2 lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6 group">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform">
                                <Heart className="h-4 w-4 fill-current" />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-text-primary">
                                Saida <span className="text-accent italic">image maker</span>
                            </span>
                        </Link>
                        <p className="text-text-tertiary text-sm font-medium max-w-xs leading-relaxed">
                            이미지 변환, 압축, 편집을 위한 가장 쉽고 빠른 온라인 도구입니다.
                            브라우저 기반 처리 기술로 탁월한 속도와 보안을 제공합니다.
                        </p>
                    </div>

                    {/* Tools Column */}
                    <div>
                        <h4 className="text-text-primary font-bold text-xs uppercase tracking-widest mb-6 border-b border-card-border pb-2 w-fit">도구</h4>
                        <ul className="space-y-4">
                            <FooterLink href="/upscale" label="이미지 업스케일링" />
                            <FooterLink href="/tools/convert" label="이미지 포맷 변환" />
                            <FooterLink href="/tools/compress" label="이미지 압축 최적화" />
                            <FooterLink href="/tools/blur" label="블러 및 흐림 처리" />
                            <FooterLink href="/tools/watermark-maker" label="워터마크 제작" />
                        </ul>
                    </div>

                    {/* Info Column */}
                    <div>
                        <h4 className="text-text-primary font-bold text-xs uppercase tracking-widest mb-6 border-b border-card-border pb-2 w-fit">정보</h4>
                        <ul className="space-y-4">
                            <FooterLink href="#" label="Saida 소개" />
                            <FooterLink href="#" label="AI 기술 가이드" />
                            <FooterLink href="#" label="자주 묻는 질문" />
                            <FooterLink href="#" label="문의하기" />
                        </ul>
                    </div>

                    {/* Legal Column */}
                    <div>
                        <h4 className="text-text-primary font-bold text-xs uppercase tracking-widest mb-6 border-b border-card-border pb-2 w-fit">법적 고지</h4>
                        <ul className="space-y-4">
                            <FooterLink href="#" label="이용약관" />
                            <FooterLink href="#" label="개인정보처리방침" />
                            <FooterLink href="#" label="데이터 보안 정책" />
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-card-border flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-text-tertiary text-[10px] font-bold uppercase tracking-widest">
                        © 2026 Saida Image Maker. All rights reserved. Locally Processed.
                    </p>

                    <div className="flex items-center gap-6">
                        <SocialLink icon={<Github className="h-5 w-5" />} />
                        <SocialLink icon={<Twitter className="h-5 w-5" />} />
                        <SocialLink icon={<Mail className="h-5 w-5" />} />
                    </div>
                </div>
            </div>
        </footer>
    );
}

function FooterLink({ href, label }: { href: string; label: string }) {
    return (
        <li>
            <Link href={href} className="text-text-secondary hover:text-accent transition-colors text-[13px] font-medium">
                {label}
            </Link>
        </li>
    );
}

function SocialLink({ icon }: { icon: React.ReactNode }) {
    return (
        <button className="text-text-tertiary hover:text-accent transition-all hover:scale-110">
            {icon}
        </button>
    );
}
