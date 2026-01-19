'use client';

import React, { useState } from 'react';
import { Chrome, Facebook, MessageCircle, Mail } from 'lucide-react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();

    const handleGoogleLogin = async () => {
        try {
            const result = await signIn('google', {
                callbackUrl: '/',
                redirect: true,
            });
        } catch (error) {
            console.error('Google 로그인 오류:', error);
            alert('Google 로그인 중 오류가 발생했습니다.');
        }
    };

    const handleSocialLogin = (provider: string) => {
        if (provider === 'Google') {
            handleGoogleLogin();
        } else {
            alert(`${provider} 로그인은 준비 중입니다.`);
        }
    };

    const handleEmailLogin = (e: React.FormEvent) => {
        e.preventDefault();
        alert('이메일 로그인 기능은 준비 중입니다.');
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-background flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md rounded-[2rem] border border-card-border bg-card-bg p-10 shadow-2xl">
                <h1 className="text-3xl font-black text-text-primary tracking-tight mb-3 text-center">로그인</h1>
                <p className="text-sm font-bold text-text-secondary mb-8 text-center">간편하게 시작하세요</p>

                {/* Social Login Buttons */}
                <div className="space-y-3 mb-6">
                    <button
                        onClick={() => handleSocialLogin('Google')}
                        className="w-full py-3.5 rounded-2xl bg-white text-slate-900 font-bold text-sm flex items-center justify-center gap-3 border border-slate-200 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
                    >
                        <Chrome className="h-5 w-5" />
                        Google로 계속하기
                    </button>

                    <button
                        onClick={() => handleSocialLogin('Facebook')}
                        className="w-full py-3.5 rounded-2xl bg-[#1877F2] text-white font-bold text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
                    >
                        <Facebook className="h-5 w-5" />
                        Facebook으로 계속하기
                    </button>

                    <button
                        onClick={() => handleSocialLogin('Kakao')}
                        className="w-full py-3.5 rounded-2xl bg-[#FEE500] text-slate-900 font-bold text-sm flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
                    >
                        <MessageCircle className="h-5 w-5" />
                        카카오로 계속하기
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

                {/* Email Login Form */}
                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-widest">
                            이메일
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-background border border-card-border text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 rounded-2xl bg-accent text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] mt-6"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Mail className="h-4 w-4" />
                            이메일로 로그인
                        </div>
                    </button>
                </form>

                {/* Sign Up Link */}
                <p className="text-sm text-text-secondary mt-6 text-center">
                    계정이 없으신가요?{' '}
                    <Link href="/signup" className="text-accent font-bold hover:underline">
                        회원가입
                    </Link>
                </p>

                <p className="text-[10px] text-text-tertiary mt-6 text-center">
                    소셜 로그인 연동은 OAuth 설정 후 활성화됩니다.
                </p>
            </div>
        </div>
    );
}
