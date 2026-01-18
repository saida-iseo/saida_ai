'use client';

import React from 'react';
import { Chrome } from 'lucide-react';

export default function LoginPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-background flex items-center justify-center px-6">
            <div className="w-full max-w-md rounded-[2rem] border border-card-border bg-card-bg p-10 text-center shadow-2xl">
                <h1 className="text-3xl font-black text-text-primary tracking-tight mb-3">로그인</h1>
                <p className="text-sm font-bold text-text-secondary mb-8">구글 이메일로 간편하게 시작하세요.</p>
                <button
                    className="w-full py-4 rounded-full bg-white text-slate-900 font-black text-sm flex items-center justify-center gap-3 border border-slate-200 shadow-md hover:shadow-lg transition-all"
                >
                    <Chrome className="h-5 w-5" />
                    Google로 계속하기
                </button>
                <p className="text-[10px] text-text-tertiary mt-6">
                    로그인 연동은 Google OAuth 설정 후 활성화됩니다.
                </p>
            </div>
        </div>
    );
}
