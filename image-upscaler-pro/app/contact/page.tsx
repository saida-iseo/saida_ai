'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Send, Clock } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsSubmitting(false);
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        
        setTimeout(() => setSubmitted(false), 5000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="min-h-screen bg-background transition-colors duration-300">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
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
                            <MessageSquare className="h-6 w-6" />
                        </div>
                        <h1 className="text-4xl font-bold text-text-primary">문의하기</h1>
                    </div>
                    <p className="text-xl text-text-secondary leading-relaxed">
                        궁금하신 점이나 문제가 있으신가요? 언제든지 연락주세요
                    </p>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-card-bg p-8 rounded-[2rem] border border-card-border shadow-sm">
                            <h2 className="text-2xl font-bold text-text-primary mb-6">메시지 보내기</h2>
                            
                            {submitted && (
                                <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-xl">
                                    <p className="text-accent font-semibold">
                                        문의가 성공적으로 전송되었습니다! 빠른 시일 내에 답변드리겠습니다.
                                    </p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-semibold text-text-primary mb-2">
                                            이름 *
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-background border border-card-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                                            placeholder="홍길동"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold text-text-primary mb-2">
                                            이메일 *
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="w-full px-4 py-3 bg-background border border-card-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                                            placeholder="example@email.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className="block text-sm font-semibold text-text-primary mb-2">
                                        문의 유형 *
                                    </label>
                                    <select
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-background border border-card-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                                    >
                                        <option value="">선택해주세요</option>
                                        <option value="general">일반 문의</option>
                                        <option value="technical">기술 지원</option>
                                        <option value="billing">결제 관련</option>
                                        <option value="feature">기능 요청</option>
                                        <option value="bug">버그 신고</option>
                                        <option value="other">기타</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-semibold text-text-primary mb-2">
                                        메시지 *
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                        rows={8}
                                        className="w-full px-4 py-3 bg-background border border-card-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent transition-all resize-none"
                                        placeholder="문의 내용을 자세히 작성해주세요..."
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-accent/20 transition-all flex items-center justify-center gap-3 hover:scale-[1.01] active:scale-[0.98] disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            전송 중...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="h-5 w-5" />
                                            메시지 전송
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-text-tertiary text-center">
                                    메시지를 보내시면 개인정보처리방침에 동의하는 것으로 간주됩니다.
                                </p>
                            </form>
                        </div>
                    </div>

                    {/* Right: Contact Info */}
                    <div className="space-y-6">
                        {/* Contact Cards */}
                        <div className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg flex-shrink-0">
                                    <Mail className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-primary mb-1">이메일</h3>
                                    <p className="text-text-secondary text-sm">support@saida.io</p>
                                    <p className="text-text-tertiary text-xs mt-1">24시간 이내 답변</p>
                                </div>
                            </div>
                        </div>


                        <div className="bg-card-bg p-6 rounded-2xl border border-card-border shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white shadow-lg flex-shrink-0">
                                    <Clock className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-primary mb-1">운영 시간</h3>
                                    <p className="text-text-secondary text-sm">평일: 09:00 - 18:00</p>
                                    <p className="text-text-secondary text-sm">주말/공휴일: 휴무</p>
                                </div>
                            </div>
                        </div>

                        {/* FAQ CTA */}
                        <div className="bg-gradient-to-br from-accent/10 to-purple-500/10 p-6 rounded-2xl border border-accent/20">
                            <h3 className="text-lg font-bold text-text-primary mb-2">자주 묻는 질문</h3>
                            <p className="text-text-secondary text-sm mb-4">
                                일반적인 질문에 대한 답변을 FAQ에서 확인하세요
                            </p>
                            <Link
                                href="/faq"
                                className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-semibold text-sm transition-colors"
                            >
                                FAQ 보기 →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
