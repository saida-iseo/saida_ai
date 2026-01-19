'use client';

import Link from 'next/link';
import { ArrowLeft, Brain, Sparkles, Cpu, Zap, Image as ImageIcon, Layers } from 'lucide-react';

export default function GuidePage() {
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
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500 text-white shadow-lg shadow-purple-500/20">
                            <Brain className="h-6 w-6" />
                        </div>
                        <h1 className="text-4xl font-bold text-text-primary">AI 기술 가이드</h1>
                    </div>
                    <p className="text-xl text-text-secondary leading-relaxed">
                        Saida가 사용하는 AI 기술에 대해 알아보세요
                    </p>
                </div>

                {/* Content Section */}
                <div className="space-y-8">
                    {/* Introduction */}
                    <section className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-8 rounded-[2rem] border border-purple-500/20">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">AI 기반 이미지 처리</h2>
                        <p className="text-text-secondary leading-relaxed mb-4">
                            Saida image maker는 최신 인공지능 기술을 활용하여 이미지를 처리합니다. 
                            딥러닝 모델을 통해 이미지의 특징을 학습하고, 최적의 결과물을 생성합니다.
                        </p>
                        <p className="text-text-secondary leading-relaxed">
                            모든 AI 처리는 브라우저 내에서 실행되므로 빠른 속도와 높은 보안을 동시에 제공합니다.
                        </p>
                    </section>

                    {/* AI Features */}
                    <section className="space-y-4">
                        <h2 className="text-2xl font-bold text-text-primary mb-6">주요 AI 기능</h2>
                        
                        <AIFeatureCard
                            icon={<Sparkles className="h-6 w-6" />}
                            color="bg-yellow-500"
                            title="AI 업스케일링"
                            description="저해상도 이미지를 AI가 분석하여 디테일을 복원하고 선명하게 확대합니다."
                            details={[
                                "최대 4배까지 확대 가능",
                                "디테일 손실 최소화",
                                "자동 노이즈 제거",
                                "엣지 선명화"
                            ]}
                        />
                        
                        <AIFeatureCard
                            icon={<Layers className="h-6 w-6" />}
                            color="bg-purple-500"
                            title="AI 배경 제거"
                            description="피사체와 배경을 정확하게 분리하여 깔끔한 누끼 이미지를 생성합니다."
                            details={[
                                "정밀한 피사체 인식",
                                "머리카락, 털 등 복잡한 영역 처리",
                                "투명 배경 PNG 출력",
                                "수동 보정 도구 제공"
                            ]}
                        />
                        
                        <AIFeatureCard
                            icon={<ImageIcon className="h-6 w-6" />}
                            color="bg-blue-500"
                            title="AI 품질 향상"
                            description="이미지의 노이즈를 제거하고 색상을 보정하여 전체적인 품질을 향상시킵니다."
                            details={[
                                "자동 색상 보정",
                                "노이즈 감소",
                                "선명도 최적화",
                                "콘트라스트 조정"
                            ]}
                        />
                    </section>

                    {/* How It Works */}
                    <section className="bg-card-bg p-8 rounded-[2rem] border border-card-border shadow-sm">
                        <h2 className="text-2xl font-bold text-text-primary mb-6">작동 원리</h2>
                        <div className="space-y-6">
                            <ProcessStep
                                number="1"
                                title="이미지 분석"
                                description="업로드된 이미지를 AI 모델이 분석하여 특징을 추출합니다."
                            />
                            <ProcessStep
                                number="2"
                                title="딥러닝 처리"
                                description="학습된 신경망을 통해 이미지를 처리하고 최적의 결과를 생성합니다."
                            />
                            <ProcessStep
                                number="3"
                                title="후처리 최적화"
                                description="생성된 결과물을 추가로 최적화하여 최종 이미지를 완성합니다."
                            />
                        </div>
                    </section>

                    {/* Technology Stack */}
                    <section className="bg-card-bg p-8 rounded-[2rem] border border-card-border shadow-sm">
                        <h2 className="text-2xl font-bold text-text-primary mb-6">사용 기술</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TechCard
                                icon={<Brain className="h-5 w-5" />}
                                title="딥러닝 모델"
                                description="CNN 기반 이미지 처리"
                            />
                            <TechCard
                                icon={<Cpu className="h-5 w-5" />}
                                title="WebAssembly"
                                description="고성능 브라우저 실행"
                            />
                            <TechCard
                                icon={<Zap className="h-5 w-5" />}
                                title="WebGL 가속"
                                description="GPU 기반 고속 처리"
                            />
                            <TechCard
                                icon={<Layers className="h-5 w-5" />}
                                title="텐서플로우JS"
                                description="브라우저 기반 ML"
                            />
                        </div>
                    </section>

                    {/* Tips */}
                    <section className="bg-gradient-to-br from-accent/10 to-yellow-500/10 p-8 rounded-[2rem] border border-accent/20">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">최상의 결과를 위한 팁</h2>
                        <ul className="space-y-3">
                            <TipItem tip="원본 이미지의 품질이 좋을수록 AI 처리 결과가 향상됩니다" />
                            <TipItem tip="적절한 조명과 초점이 맞춰진 이미지를 사용하세요" />
                            <TipItem tip="배경 제거 시 피사체와 배경의 색상 대비가 클수록 정확합니다" />
                            <TipItem tip="업스케일링은 2배 단위로 진행하는 것이 품질이 좋습니다" />
                            <TipItem tip="대용량 이미지는 처리 시간이 더 오래 걸릴 수 있습니다" />
                        </ul>
                    </section>

                    {/* CTA */}
                    <section className="bg-card-bg p-8 rounded-[2rem] border border-card-border shadow-sm text-center">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">AI 기능 체험하기</h2>
                        <p className="text-text-secondary mb-6">
                            지금 바로 강력한 AI 이미지 처리를 경험해보세요
                        </p>
                        <Link
                            href="/upscale"
                            className="inline-flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-lg shadow-purple-500/20 transition-all hover:scale-105"
                        >
                            <Brain className="h-5 w-5" />
                            AI 업스케일 시작하기
                        </Link>
                    </section>
                </div>
            </div>
        </div>
    );
}

function AIFeatureCard({ 
    icon, 
    color, 
    title, 
    description,
    details
}: { 
    icon: React.ReactNode; 
    color: string; 
    title: string; 
    description: string;
    details: string[];
}) {
    return (
        <div className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-sm">
            <div className="flex items-start gap-4 mb-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white shadow-lg flex-shrink-0`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{description}</p>
                </div>
            </div>
            <div className="ml-16 space-y-2">
                {details.map((detail, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span className="text-text-tertiary text-xs">{detail}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ProcessStep({ number, title, description }: { number: string; title: string; description: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-white font-bold flex-shrink-0">
                {number}
            </div>
            <div>
                <h4 className="text-lg font-bold text-text-primary mb-1">{title}</h4>
                <p className="text-text-secondary text-sm">{description}</p>
            </div>
        </div>
    );
}

function TechCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="bg-background p-4 rounded-xl border border-card-border flex items-center gap-3">
            <div className="text-accent flex-shrink-0">{icon}</div>
            <div>
                <h4 className="text-text-primary font-bold text-sm">{title}</h4>
                <p className="text-text-tertiary text-xs">{description}</p>
            </div>
        </div>
    );
}

function TipItem({ tip }: { tip: string }) {
    return (
        <li className="flex items-start gap-3">
            <span className="text-accent font-bold flex-shrink-0">•</span>
            <span className="text-text-secondary text-sm">{tip}</span>
        </li>
    );
}
