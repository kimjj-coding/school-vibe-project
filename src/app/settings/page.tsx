'use client';

import React, { useState } from 'react';
import { useThemeStore, ThemeType } from '@/store/themeStore';
import { Sparkles, Palette, ChevronDown, ChevronUp } from 'lucide-react';

// 파티클(휘날리는 이모지) 인터페이스
interface Particle {
  id: number;
  emoji: string;
  left: string;
  size: string;
  duration: string;
}

// 색상 칩 대신 사용할 직관적인 이모지 테마 리스트
const THEMES = [
  { id: 'default' as ThemeType, name: '클래식 블루', desc: '풍양중 표준 기본 컬러 테마', emoji: '🌊' },
  { id: 'cherry' as ThemeType, name: '봄날의 벚꽃', desc: '벚꽃잎이 휘날리는 로맨틱 핑크', emoji: '🌸' },
  { id: 'alien' as ThemeType, name: '시그니처 외계인', desc: '우주 최고 존엄 네온 그린 해커 모드', emoji: '👽' },
  { id: 'maple' as ThemeType, name: '가을 단풍잎', desc: '포근하고 아늑한 독서실 메이플 감성', emoji: '🍁' },
  { id: 'snow' as ThemeType, name: '설국 스노우', desc: '화면에 진짜 눈이 박히는 겨울 왕국', emoji: '❄️' },
];

export default function SettingsPage() {
  // 디렉터님이 만들어두신 Zustand 전역 스토어 호출
  const { theme, setTheme } = useThemeStore();
  
  // 아코디언(접고 펴기) 상태 관리
  const [isThemeOpen, setIsThemeOpen] = useState<boolean>(false);
  
  // 이모지 파티클 상태 관리
  const [particles, setParticles] = useState<Particle[]>([]);

  // 현재 선택된 테마 객체 찾기
  const currentTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  // 이모지 흩날리기 이펙트 트리거
  const triggerEmojiBurst = (emoji: string) => {
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      emoji: emoji,
      left: `${10 + Math.random() * 80}%`, // 화면 가로 10~90% 사이 랜덤 배치
      size: `${24 + Math.random() * 16}px`, // 크기 랜덤
      duration: `${1.5 + Math.random() * 1}s` // 속도 랜덤
    }));

    setParticles((prev) => [...prev, ...newParticles]);

    // 애니메이션이 끝나면 DOM에서 삭제하여 메모리 최적화
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.some((n) => n.id === p.id)));
    }, 2500);
  };

  return (
    <div className="min-h-screen transition-colors duration-300 pb-20" style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)' }}>
      
      {/* 이모지 파티클 CSS 애니메이션 (globals.css 건드릴 필요 없이 로컬 주입) */}
      <style>{`
        @keyframes flyUp {
          0% { transform: translateY(100vh) scale(0.5) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-10vh) scale(1.3) rotate(360deg); opacity: 0; }
        }
        .emoji-particle {
          position: fixed;
          bottom: -50px;
          pointer-events: none;
          z-index: 9999;
          animation: flyUp linear forwards;
        }
      `}</style>

      {/* 이모지 파티클 렌더링 레이어 */}
      {particles.map((p) => (
        <span key={p.id} className="emoji-particle" style={{ left: p.left, fontSize: p.size, animationDuration: p.duration }}>
          {p.emoji}
        </span>
      ))}

      <main className="max-w-md mx-auto px-4 py-8 w-full space-y-6">
        
        {/* 타이틀 */}
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Palette className="w-5 h-5" style={{ color: 'var(--primary)' }} /> 시스템 설정
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>StudyMate 환경 및 크리에이티브 커스텀</p>
        </div>

        {/* 내 프로필 요약 정보 */}
        <div className="rounded-2xl p-5 border flex items-center gap-4 transition-colors duration-300" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl drop-shadow-sm transition-transform" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            {currentTheme.emoji}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: 'var(--primary)' }}>Chief Architect</span>
            <h2 className="text-base font-black">미친 중2 개발자 디렉터님</h2>
          </div>
        </div>

        {/* 차세대 멀티버스 테마 엔진 (아코디언 UI) */}
        <div className="rounded-2xl border overflow-hidden shadow-sm transition-colors duration-300" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          
          {/* 접고 펴기 토글 버튼 */}
          <button 
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="w-full p-5 flex items-center justify-between transition-colors hover:bg-black/5 active:bg-black/10"
          >
            <div className="text-left">
              <h3 className="text-sm font-black flex items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
                <Sparkles className="w-4 h-4" style={{ color: 'var(--primary)' }} /> 차세대 멀티버스 테마 엔진
              </h3>
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                현재 적용됨: {currentTheme.emoji} {currentTheme.name}
              </p>
            </div>
            {isThemeOpen ? (
              <ChevronUp className="w-5 h-5 transition-transform" style={{ color: 'var(--text-muted)' }} />
            ) : (
              <ChevronDown className="w-5 h-5 transition-transform" style={{ color: 'var(--text-muted)' }} />
            )}
          </button>

          {/* 테마 리스트 (이모지 카드 뷰) */}
          {isThemeOpen && (
            <div className="p-4 pt-1 grid grid-cols-2 gap-3 border-t animate-fadeIn" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-sub)' }}>
              {THEMES.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setTheme(t.id); // Zustand 상태 변경 -> html data-theme 변경 -> 앱 전체 색상 즉각 변환
                      triggerEmojiBurst(t.emoji); // 클릭 시 이모지 폭죽 발사!
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all active:scale-95 ${
                      isSelected ? 'shadow-md scale-[1.02]' : 'opacity-60 border-dashed hover:opacity-100'
                    }`}
                    style={{ 
                      backgroundColor: isSelected ? 'var(--bg-card)' : 'transparent',
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                      borderWidth: isSelected ? '2px' : '1px'
                    }}
                  >
                    <span className="text-3xl mb-2 filter drop-shadow-sm">{t.emoji}</span>
                    <span className="text-xs font-bold mb-0.5" style={{ color: 'var(--text-main)' }}>{t.name}</span>
                    <span className="text-[9px] text-center break-keep leading-tight" style={{ color: 'var(--text-muted)' }}>{t.desc}</span>
                  </button>
                );
              })}
            </div>
          )}
          
        </div>

      </main>
    </div>
  );
} 