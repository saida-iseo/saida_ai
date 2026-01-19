'use client';

import Link from 'next/link';
import { ArrowLeft, HelpCircle, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function FAQPage() {
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
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                            <HelpCircle className="h-6 w-6" />
                        </div>
                        <h1 className="text-4xl font-bold text-text-primary">자주 묻는 질문</h1>
                    </div>
                    <p className="text-xl text-text-secondary leading-relaxed">
                        궁금하신 점을 빠르게 해결하세요
                    </p>
                </div>

                {/* FAQ Categories */}
                <div className="space-y-8">
                    {/* General */}
                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">일반</h2>
                        <div className="space-y-3">
                            <FAQItem
                                question="Saida는 무료로 사용할 수 있나요?"
                                answer="네, 기본 기능은 모두 무료로 사용하실 수 있습니다. 무료 사용자는 하루 최대 5개의 작업 결과를 다운로드할 수 있으며, 프리미엄 플랜을 이용하시면 무제한으로 사용 가능합니다."
                            />
                            <FAQItem
                                question="회원가입이 필요한가요?"
                                answer="기본 기능은 회원가입 없이 바로 사용하실 수 있습니다. 하지만 작업 내역을 저장하고 프리미엄 기능을 사용하시려면 회원가입이 필요합니다."
                            />
                            <FAQItem
                                question="어떤 브라우저를 사용해야 하나요?"
                                answer="Chrome, Firefox, Safari, Edge 등 최신 버전의 모든 주요 브라우저에서 사용 가능합니다. 최상의 성능을 위해서는 Chrome 또는 Edge 브라우저를 권장합니다."
                            />
                        </div>
                    </section>

                    {/* Privacy & Security */}
                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">보안 및 개인정보</h2>
                        <div className="space-y-3">
                            <FAQItem
                                question="업로드한 이미지는 어디에 저장되나요?"
                                answer="모든 이미지는 사용자의 브라우저 내에서만 처리되며, 서버로 전송되지 않습니다. 브라우저를 닫으면 모든 데이터가 자동으로 삭제됩니다."
                            />
                            <FAQItem
                                question="개인정보는 안전한가요?"
                                answer="네, Saida는 사용자의 개인정보를 최우선으로 보호합니다. 이미지 처리는 100% 클라이언트 사이드에서 이루어지며, 어떠한 이미지나 개인정보도 서버에 저장하지 않습니다."
                            />
                            <FAQItem
                                question="작업 내역이 저장되나요?"
                                answer="작업 내역은 브라우저의 로컬 스토리지에만 저장됩니다. 회원가입 후에는 클라우드에 작업 내역을 동기화할 수 있으며, 원하실 때 언제든지 삭제하실 수 있습니다."
                            />
                        </div>
                    </section>

                    {/* Features */}
                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">기능</h2>
                        <div className="space-y-3">
                            <FAQItem
                                question="AI 업스케일링은 어떻게 작동하나요?"
                                answer="AI 업스케일링은 딥러닝 모델을 사용하여 저해상도 이미지를 분석하고, 손실된 디테일을 복원하여 고해상도로 변환합니다. 단순 확대와 달리 AI가 이미지의 특징을 학습하여 자연스럽고 선명한 결과를 생성합니다."
                            />
                            <FAQItem
                                question="지원하는 이미지 포맷은 무엇인가요?"
                                answer="JPEG, PNG, WebP, GIF 등 대부분의 주요 이미지 포맷을 지원합니다. 투명 배경이 필요한 경우 PNG 또는 WebP 포맷을 사용하시는 것을 권장합니다."
                            />
                            <FAQItem
                                question="최대 업로드 가능한 파일 크기는 얼마인가요?"
                                answer="무료 사용자는 최대 10MB, 프리미엄 사용자는 최대 50MB까지 업로드 가능합니다. 대용량 파일은 처리 시간이 더 오래 걸릴 수 있습니다."
                            />
                            <FAQItem
                                question="여러 이미지를 한 번에 처리할 수 있나요?"
                                answer="현재는 한 번에 하나의 이미지만 처리할 수 있습니다. 일괄 처리 기능은 향후 프리미엄 기능으로 추가될 예정입니다."
                            />
                        </div>
                    </section>

                    {/* Technical */}
                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">기술적 문제</h2>
                        <div className="space-y-3">
                            <FAQItem
                                question="처리 속도가 느려요"
                                answer="처리 속도는 이미지 크기, 브라우저 성능, 인터넷 연결 상태에 따라 달라질 수 있습니다. 더 나은 성능을 위해서는 Chrome 또는 Edge 브라우저를 사용하고, 다른 탭을 닫아 메모리를 확보하시는 것을 권장합니다."
                            />
                            <FAQItem
                                question="에러가 발생했어요"
                                answer="브라우저 캐시를 삭제하고 페이지를 새로고침해 보세요. 문제가 지속되면 다른 브라우저를 사용하거나 고객 지원팀에 문의해 주세요."
                            />
                            <FAQItem
                                question="모바일에서도 사용할 수 있나요?"
                                answer="네, 모바일 브라우저에서도 모든 기능을 사용하실 수 있습니다. 다만 대용량 이미지 처리는 데스크톱에서 더 빠르고 안정적입니다."
                            />
                        </div>
                    </section>

                    {/* Premium */}
                    <section>
                        <h2 className="text-2xl font-bold text-text-primary mb-4">프리미엄</h2>
                        <div className="space-y-3">
                            <FAQItem
                                question="프리미엄 플랜의 장점은 무엇인가요?"
                                answer="프리미엄 플랜을 이용하시면 무제한 다운로드, 대용량 파일 업로드(최대 50MB), 워터마크 제거, 우선 처리, 고급 AI 기능 등을 사용하실 수 있습니다."
                            />
                            <FAQItem
                                question="프리미엄 요금제는 얼마인가요?"
                                answer="월간 플랜은 9,900원, 연간 플랜은 99,000원(월 8,250원)입니다. 연간 플랜 선택 시 17% 할인 혜택을 받으실 수 있습니다."
                            />
                            <FAQItem
                                question="프리미엄 구독을 취소할 수 있나요?"
                                answer="네, 언제든지 구독을 취소하실 수 있습니다. 취소하시면 다음 결제일부터 요금이 청구되지 않으며, 현재 구독 기간이 끝날 때까지는 프리미엄 기능을 계속 사용하실 수 있습니다."
                            />
                        </div>
                    </section>

                    {/* Contact CTA */}
                    <section className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-8 rounded-[2rem] border border-blue-500/20 text-center">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">찾으시는 답변이 없나요?</h2>
                        <p className="text-text-secondary mb-6">
                            궁금하신 점이 있으시면 언제든지 문의해 주세요
                        </p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-lg shadow-blue-500/20 transition-all hover:scale-105"
                        >
                            문의하기
                        </Link>
                    </section>
                </div>
            </div>
        </div>
    );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-card-bg rounded-2xl border border-card-border shadow-sm overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-6 flex items-center justify-between hover:bg-background/50 transition-colors"
            >
                <span className="text-left font-semibold text-text-primary">{question}</span>
                <ChevronDown 
                    className={`h-5 w-5 text-text-tertiary transition-transform flex-shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            {isOpen && (
                <div className="px-6 pb-6">
                    <p className="text-text-secondary leading-relaxed">{answer}</p>
                </div>
            )}
        </div>
    );
}
