'use client';

import Link from 'next/link';
import { ArrowLeft, Heart, Zap, Shield, Sparkles } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background transition-colors duration-300">
            <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
                {/* Header */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary font-medium transition-all group mb-8"
                >
                    <div className="p-2 rounded-xl bg-card-bg border border-card-border shadow-sm group-hover:scale-105 transition-all">
                        <ArrowLeft className="h-4 w-4" />
                    </div>
                    <span className="text-sm">홈으로 돌아가기</span>
                </Link>

                {/* Title Section */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white shadow-lg shadow-accent/20">
                            <Heart className="h-6 w-6 fill-current" />
                        </div>
                        <h1 className="text-4xl font-bold text-text-primary">Saida 소개</h1>
                    </div>
                    <p className="text-xl text-text-secondary leading-relaxed">
                        한 번의 클릭으로 완성되는 강력한 이미지 편집 도구
                    </p>
                </div>

                {/* Content Section */}
                <div className="space-y-8">
                    {/* Introduction */}
                    <section className="bg-card-bg p-8 rounded-[2rem] border border-card-border shadow-sm">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">Saida image maker란?</h2>
                        <p className="text-text-secondary leading-relaxed mb-4">
                            Saida image maker는 이미지 변환, 압축, 편집을 위한 가장 쉽고 빠른 온라인 도구입니다. 
                            복잡한 소프트웨어 설치 없이 브라우저에서 바로 전문가 수준의 이미지 처리를 경험할 수 있습니다.
                        </p>
                        <p className="text-text-secondary leading-relaxed">
                            모든 처리는 사용자의 브라우저 내에서 이루어지므로 이미지가 서버로 전송되지 않으며, 
                            개인정보와 데이터가 완벽하게 보호됩니다.
                        </p>
                    </section>

                    {/* Features */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-text-primary mb-6">핵심 특징</h2>
                        
                        <FeatureCard
                            icon={<Zap className="h-6 w-6" />}
                            color="bg-yellow-500"
                            title="초고속 처리"
                            description="브라우저 기반 처리 기술로 서버 업로드 없이 즉시 작업이 완료됩니다. 대기 시간 제로."
                        />
                        
                        <FeatureCard
                            icon={<Shield className="h-6 w-6" />}
                            color="bg-blue-500"
                            title="완벽한 보안"
                            description="모든 데이터는 브라우저 내에서만 처리되며 서버에 저장되지 않습니다. 100% 프라이버시 보장."
                        />
                        
                        <FeatureCard
                            icon={<Sparkles className="h-6 w-6" />}
                            color="bg-purple-500"
                            title="AI 기술 탑재"
                            description="최신 AI 업스케일링, 배경 제거 등 전문가 수준의 이미지 처리를 간단한 클릭으로 완성."
                        />
                        
                        <FeatureCard
                            icon={<Heart className="h-6 w-6 fill-current" />}
                            color="bg-accent"
                            title="사용자 중심 설계"
                            description="직관적인 인터페이스로 누구나 쉽게 사용할 수 있습니다. 복잡한 설정 불필요."
                        />
                    </section>

                    {/* Mission */}
                    <section className="bg-gradient-to-br from-accent/10 to-purple-500/10 p-8 rounded-[2rem] border border-accent/20">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">우리의 미션</h2>
                        <p className="text-text-secondary leading-relaxed mb-4">
                            Saida는 "쉽고 빠른 이미지 편집"을 모든 사람에게 제공하는 것을 목표로 합니다. 
                            전문 디자이너가 아니더라도, 복잡한 소프트웨어를 배우지 않아도, 
                            누구나 원하는 결과물을 만들 수 있어야 한다고 믿습니다.
                        </p>
                        <p className="text-text-secondary leading-relaxed">
                            우리는 지속적으로 새로운 기능을 추가하고 사용자 경험을 개선하여 
                            최고의 온라인 이미지 편집 도구를 만들어가고 있습니다.
                        </p>
                    </section>

                    {/* Technology */}
                    <section className="bg-card-bg p-8 rounded-[2rem] border border-card-border shadow-sm">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">기술 스택</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TechItem title="Next.js 15" description="최신 React 프레임워크" />
                            <TechItem title="WebAssembly" description="고성능 브라우저 처리" />
                            <TechItem title="Canvas API" description="실시간 이미지 편집" />
                            <TechItem title="IndexedDB" description="로컬 데이터 저장" />
                            <TechItem title="AI 모델" description="딥러닝 기반 이미지 처리" />
                            <TechItem title="TypeScript" description="안정적인 코드 품질" />
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="bg-card-bg p-8 rounded-[2rem] border border-card-border shadow-sm text-center">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">지금 바로 시작하세요</h2>
                        <p className="text-text-secondary mb-6">
                            회원가입 없이 바로 사용할 수 있습니다
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-lg shadow-accent/20 transition-all hover:scale-105"
                        >
                            시작하기
                        </Link>
                    </section>
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ 
    icon, 
    color, 
    title, 
    description 
}: { 
    icon: React.ReactNode; 
    color: string; 
    title: string; 
    description: string; 
}) {
    return (
        <div className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white shadow-lg flex-shrink-0`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
                </div>
            </div>
        </div>
    );
}

function TechItem({ title, description }: { title: string; description: string }) {
    return (
        <div className="bg-background p-4 rounded-xl border border-card-border">
            <h4 className="text-text-primary font-bold mb-1">{title}</h4>
            <p className="text-text-tertiary text-xs">{description}</p>
        </div>
    );
}
