'use client';

import React, { useState } from 'react';
import { Chrome, Facebook, MessageCircle, Mail, User, Lock } from 'lucide-react';
import Link from 'next/link';

export default function SignupPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleSocialSignup = (provider: string) => {
        alert(`${provider} 회원가입은 준비 중입니다. OAuth 설정 후 활성화됩니다.`);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }
        alert('회원가입 기능은 준비 중입니다.');
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-background flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md rounded-[2rem] border border-card-border bg-card-bg p-10 shadow-2xl">
                <h1 className="text-3xl font-black text-text-primary tracking-tight mb-3 text-center">회원가입</h1>
                <p className="text-sm font-bold text-text-secondary mb-8 text-center">빠르게 시작하세요</p>

                {/* Social Signup Buttons */}
                <div className="space-y-3 mb-6">
                    <button
                        onClick={() => handleSocialSignup('Google')}
                        className="w-full py-3.5 rounded-2xl bg-white text-slate-900 font-bold text-sm flex items-center justify-center gap-3 border border-slate-200 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
                    >
                        <Chrome className="h-5 w-5" />
                        Google로 가입하기
                    </button>

                    <button
                        onClick={() => handleSocialSignup('Facebook')}
                        className="w-full py-3.5 rounded-2xl bg-[#1877F2] text-white font-bold text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
                    >
                        <Facebook className="h-5 w-5" />
                        Facebook으로 가입하기
                    </button>

                    <button
                        onClick={() => handleSocialSignup('Kakao')}
                        className="w-full py-3.5 rounded-2xl bg-[#FEE500] text-slate-900 font-bold text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
                    >
                        <MessageCircle className="h-5 w-5" />
                        카카오로 가입하기
                    </button>
                </div>

                {/* Divider */}
                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-card-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card-bg px-4 text-text-tertiary font-bold">또는</span>
                    </div>
                </div>

                {/* Email Signup Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-widest">
                            이름
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-card-border text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                            placeholder="홍길동"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-widest">
                            이메일
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-card-border text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-widest">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            id="password"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-card-border text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                            placeholder="••••••••"
                            minLength={8}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-widest">
                            비밀번호 확인
                        </label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-card-border text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                            placeholder="••••••••"
                            minLength={8}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 rounded-2xl bg-accent text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] mt-6"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Mail className="h-4 w-4" />
                            가입하기
                        </div>
                    </button>
                </form>

                {/* Login Link */}
                <p className="text-sm text-text-secondary mt-6 text-center">
                    이미 계정이 있으신가요?{' '}
                    <Link href="/login" className="text-accent font-bold hover:underline">
                        로그인
                    </Link>
                </p>

                <p className="text-[10px] text-text-tertiary mt-6 text-center leading-relaxed">
                    가입함으로써{' '}
                    <Link href="/legal/terms" className="underline hover:text-accent">
                        이용약관
                    </Link>
                    과{' '}
                    <Link href="/legal/privacy" className="underline hover:text-accent">
                        개인정보처리방침
                    </Link>
                    에 동의합니다.
                </p>
            </div>
        </div>
    );
}
