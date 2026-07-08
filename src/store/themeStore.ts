'use client';

import { create } from 'zustand';

export type ThemeType = 'default' | 'cherry' | 'alien' | 'maple' | 'snow';

interface ThemeState {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'default', // 기본값은 산뜻한 블루
  setTheme: (theme) => {
    // 브라우저 최상단 html 태그에 data-theme 속성을 심어 CSS 변수를 통제함
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
    set({ theme });
  },
}));