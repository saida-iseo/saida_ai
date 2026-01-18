'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/store/useAppStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useAppStore();

  useEffect(() => {
    // localStorage에서 테마 불러오기
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('saida_theme') as 'dark' | 'light' | null;
      if (savedTheme) {
        useAppStore.setState({ theme: savedTheme });
      }
    }
  }, []);

  useEffect(() => {
    // 테마 변경 시 HTML 클래스 업데이트
    if (typeof window !== 'undefined') {
      document.documentElement.className = theme;
    }
  }, [theme]);

  return <>{children}</>;
}
