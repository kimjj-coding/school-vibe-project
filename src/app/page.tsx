'use client';

import React, { useState, useEffect } from 'react';
import { Timer, RotateCcw, Flame, CalendarRange, Sparkles, ArrowRight, ChevronDown, ChevronUp, Settings } from 'lucide-react';

// 테마 정의 데이터 (이모지 및 시스템 컬러 매핑)
const THEMES = [
  {
    id: 'peach',
    name: '피치 블라썸',
    emoji: '🌸',
    colors: {
      primary: '#ff7675',
      primaryDark: '#d63031',
      primaryLight: '#ffeaa7',
      gradFrom: '#ff7675',
      gradTo: '#e84393',
      bgCard: '#ffffff',
      bgSub: '#fff5f5',
      textMain: '#2d3436',
      textMuted: '#636e72',
      borderColor: '#fab1a0'
    }
  },
  {
    id: 'space',
    name: '갤럭시 스페이스',
    emoji: '🌌',
    colors: {
      primary: '#6c5ce7',
      primaryDark: '#341f97',
      primaryLight: '#a29bfe',
      gradFrom: '#6c5ce7',
      gradTo: '#a29bfe',
      bgCard: '#1e1e30',
      bgSub: '#2d2d44',
      textMain: '#ffffff',
      textMuted: '#b2bec3',
      borderColor: '#4834d4'
    }
  },
  {
    id: 'mint',
    name: '민트 프레시',
    emoji: '🌿',
    colors: {
      primary: '#00b894',
      primaryDark: '#006266',
      primaryLight: '#55efc4',
      gradFrom: '#00b894',
      gradTo: '#00cec9',
      bgCard: '#ffffff',
      bgSub: '#e8f8f5',
      textMain: '#2d3436',
      textMuted: '#636e72',
      borderColor: '#81ecec'
    }
  },
  {
    id: 'fire',
    name: '파이어 패션',
    emoji: '🔥',
    colors: {
      primary: '#ff7675',
      primaryDark: '#ff7675',
      primaryLight: '#ffeaa7',
      gradFrom: '#d63031',
      gradTo: '#e17055',
      bgCard: '#ffffff',
      bgSub: '#fff5f6',
      textMain: '#2d3436',
      textMuted: '#636e72',
      borderColor: '#ff7675'
    }
  }
];

interface Particle {
  id: number;
  emoji: string;
  left: string;
  size: string;
  duration: string;
}

export default function SmartDashboardPage() {
  // 상태 관리
  const [activeTheme, setActiveTheme] = useState(THEMES[1]); // 기본값: 갤럭시 스페이스
  const [isThemeOpen, setIsThemeOpen] = useState<boolean>(false); // 테마 접고 펴기 상태
  const [time, setTime] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  
  // NEIS API 실시간 바인딩 상태 (초기값 null로 하드코딩 배제)
  const [mainDDay, setMainDDay] = useState<number | null>(null);
  const [mainEventName, setMainEventName] = useState<string>('');
  const [isLoadingSchedule, setIsLoadingSchedule] = useState<boolean>(true);

  // 이모지 파티클 상태
  const [particles, setParticles] = useState<Particle[]>([]);

  // 실시간 학사일정 NEIS API 연동 엔진 (눈속임 제거)
  useEffect(() => {
    const fetchMainDDay = async () => {
      setIsLoadingSchedule(true);
      try {
        const todayDate = new Date();
        const dateString = todayDate.toISOString().slice(0, 10).replace(/-/g, '');

        const response = await fetch(`/api/neis?type=schedule&date=${dateString}`);
        const data = await response.json();

        if (data.success && data.schedules && data.schedules.length > 0) {
          const firstEvent = data.schedules[0];
          setMainEventName(firstEvent.eventName);
          
          const y = parseInt(firstEvent.eventDate.substring(0, 4), 10);
          const m = parseInt(firstEvent.eventDate.substring(4, 6), 10) - 1;
          const d = parseInt(firstEvent.eventDate.substring(6, 8), 10);
          const target = new Date(y, m, d, 0, 0, 0);
          const todayZero = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate(), 0, 0, 0);
          
          setMainDDay(Math.ceil((target.getTime() - todayZero.getTime()) / (1000 * 60 * 60 * 24)));
        } else {
          setMainEventName('다가오는 공식 학사일정 없음');
          setMainDDay(null);
        }
      } catch (err) {
        console.error('실시간 학사일정 바인딩 실패');
        setMainEventName('네트워크 연결 확인 필요');
        setMainDDay(null);
      } finally {
        setIsLoadingSchedule(false);
      }
    };
    fetchMainDDay();
  }, []);

  // 타이머 로직
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isRunning]);

  // 이모지 휘날리기 이펙트 트리거 함수
  const triggerEmojiBurst = (customEmoji?: string) => {
    const currentEmoji = customEmoji || activeTheme.emoji;
    const bonusEmojis = ['✨', '⭐', '⚡', '🚀', '🎉'];
    
    const newParticles = Array.from({ length: 16 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      emoji: Math.random() > 0.4 ? currentEmoji : bonusEmojis[Math.floor(Math.random() * bonusEmojis.length)],
      left: `${5 + Math.random() * 90}%`,
      size: `${20 + Math.random() * 24}px`,
      duration: `${1.5 + Math.random() * 1.5}s`
    }));

    setParticles((prev) => [...prev, ...newParticles]);

    // 애니메이션 종료 후 메모리 누수 방지용 삭제
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.some((n) => n.id === p.id)));
    }, 3000);
  };

  const formatStudyTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // 인라인 스타일 시스템 변수 매핑 생성기
  const themeStyles = {
    '--primary': activeTheme.colors.primary,
    '--primary-dark': activeTheme.colors.primaryDark,
    '--primary-light': activeTheme.colors.primaryLight,
    '--grad-from': activeTheme.colors.gradFrom,
    '--grad-to': activeTheme.colors.gradTo,
    '--bg-card': activeTheme.colors.bgCard,
    '--bg-sub': activeTheme.colors.bgSub,
    '--text-main': activeTheme.colors.textMain,
    '--text-muted': activeTheme.colors.textMuted,
    '--border-color': activeTheme.colors.borderColor,
  } as React.CSSProperties;

  return (
    <div className="w-full p-4 space-y-5 relative overflow-hidden min-h-screen transition-colors duration-300" style={themeStyles}>
      
      {/* CSS 애니메이션 주입 (글로벌 스타일시트 수정 번거로움 방지) */}
      <style>{`
        @keyframes floatUpAndFade {
          0% { transform: translateY(105vh) scale(0.5) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-10vh) scale(1.3) rotate(360deg); opacity: 0; }
        }
        .animate-emoji-particle {
          position: fixed;
          bottom: -50px;
          pointer-events: none;
          z-index: 999;
          animation: floatUpAndFade linear forwards;
        }
      `}</style>

      {/* 이모지 분수대 파티클 레이어 */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="animate-emoji-particle"
          style={{
            left: p.left,
            fontSize: p.size,
            animationDuration: p.duration,
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* 1. 상단 메인 대시 배너 */}
      <div 
        className="rounded-2xl p-5 text-white flex items-center justify-between shadow-md transition-all duration-300"
        style={{ background: 'linear-gradient(135deg, var(--grad-from), var(--grad-to))' }}
      >
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-md">
            {new Date().toLocaleDateString('ko-KR')}
          </span>
          <h1 className="text-xl font-black tracking-tight pt-1">반가워, StudyMate! {activeTheme.emoji}</h1>
          <p className="text-[11px] opacity-90">원하는 몰입 환경을 셋팅하고 달려보자!</p>
        </div>
        <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
          <Flame className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-pulse" />
        </div>
      </div>

      {/* 2. 접었다 폈다 하는 이모지 테마 설정 센터 */}
      <div 
        className="rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <button 
          onClick={() => setIsThemeOpen(!isThemeOpen)}
          className="w-full p-4 flex items-center justify-between font-bold text-xs"
          style={{ color: 'var(--text-main)' }}
        >
          <span className="flex items-center gap-2">
            <Settings className="w-4 h-4 animate-spin-slow" style={{ color: 'var(--primary)' }} />
            대시보드 원클릭 테마 설정 ({activeTheme.emoji} {activeTheme.name})
          </span>
          {isThemeOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isThemeOpen && (
          <div 
            className="p-4 pt-1 border-t grid grid-cols-4 gap-3 transition-all animate-fadeIn"
            style={{ backgroundColor: 'var(--bg-sub)', borderColor: 'var(--border-color)' }}
          >
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => {
                  setActiveTheme(theme);
                  triggerEmojiBurst(theme.emoji); // 테마 변경 시 이모지 폭죽 펑!
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${
                  activeTheme.id === theme.id ? 'shadow-md border-2 scale-105 font-black' : 'opacity-70 border-dashed'
                }`}
                style={{ 
                  backgroundColor: activeTheme.id === theme.id ? 'var(--bg-card)' : 'transparent',
                  borderColor: activeTheme.id === theme.id ? 'var(--primary)' : 'var(--border-color)'
                }}
              >
                <span className="text-3xl mb-1.5 filter drop-shadow-sm">{theme.emoji}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-main)' }}>{theme.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. 리얼타임 학사일정 브리핑 링크 (눈속임 X) */}
      <div 
        className="border rounded-2xl p-4 flex items-center gap-3 transition-colors duration-300"
        style={{ backgroundColor: 'var(--primary-light)', borderColor: 'var(--border-color)' }}
      >
        <div className="p-2.5 bg-white rounded-xl shadow-sm" style={{ color: 'var(--primary)' }}>
          <CalendarRange className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1">
          <span className="text-[10px] font-bold block" style={{ color: 'var(--text-muted)' }}>실시간 NEIS 학사일정 검증</span>
          {isLoadingSchedule ? (
            <p className="text-xs font-medium animate-pulse text-gray-500">교육청에서 오늘의 학학사일정을 수신하고 있습니다...</p>
          ) : mainDDay !== null ? (
            <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-main)' }}>
              가장 임박한 <span style={{ color: 'var(--primary-dark)' }}>{mainEventName}</span>이 약 <span className="font-black text-sm" style={{ color: 'var(--primary-dark)' }}>{mainDDay}일</span> 남았습니다!
            </p>
          ) : (
            <p className="text-xs font-bold mt-0.5" style={{ color: 'var(--text-main)' }}>
              현재 파싱된 가까운 주요 학사 일정이 존재하지 않습니다.
            </p>
          )}
        </div>
      </div>

      {/* 4. 테마형 집중 학습 계기판 */}
      <div 
        className="rounded-2xl p-5 border shadow-sm space-y-3.5 transition-all duration-300" 
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <h2 className="font-bold text-xs flex items-center gap-1.5" style={{ color: 'var(--text-main)' }}>
          <Timer className="w-4 h-4" style={{ color: 'var(--primary)' }} /> 나의 학습 집중 시계
        </h2>
        
        <div 
          className="rounded-xl py-6 flex flex-col items-center justify-center border transition-all duration-300"
          style={{ backgroundColor: 'var(--bg-sub)', borderColor: 'var(--border-color)' }}
        >
          <span className="text-4xl font-mono font-black tracking-widest" style={{ color: 'var(--primary-dark)' }}>
            {formatStudyTime(time)}
          </span>
          <span className="text-[10px] font-medium mt-1" style={{ color: 'var(--text-muted)' }}>오늘 집중한 누적 시간</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => {
              setIsRunning(!isRunning);
              if(!isRunning) triggerEmojiBurst(); // 공부 시작할 때 신나게 이모지 분출!
            }}
            className="text-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-[0.97] transition-all shadow-sm"
            style={{ backgroundColor: isRunning ? '#e67e22' : 'var(--primary)' }}
          >
            {isRunning ? '일시 정지' : `▶ 공부 시작 ${activeTheme.emoji}`}
          </button>
          <button 
            onClick={() => { setTime(0); setIsRunning(false); }}
            className="bg-gray-100 text-gray-500 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-[0.97] transition-transform"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 초기화
          </button>
        </div>
      </div>

      {/* 5. AI 테스트 우주선 스페이스 배너 */}
      <div 
        className="rounded-2xl p-5 text-white flex flex-col justify-between space-y-4 shadow-md transition-all duration-300"
        style={{ background: 'linear-gradient(135deg, #2d3436, var(--grad-to))' }}
      >
        <div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded font-black tracking-wider">
              AI STUDY UNIVERSE
            </span>
            <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
          </div>
          <h3 className="text-base font-black mt-2 tracking-tight">오늘 배운 학업 단원을 즉시 퀴즈로 풀자!</h3>
          <p className="text-[11px] opacity-80 mt-1 leading-relaxed font-medium">
            수석 아키텍트 엔진이 출제하는 25제 복합형 모의고사를 지금 즉시 응시할 수 있습니다.
          </p>
        </div>
        <button 
          onClick={() => window.location.href = '/quiz'}
          className="w-full bg-white font-black py-3 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-[0.97] transition-transform shadow-md"
          style={{ color: '#2d3436' }}
        >
          시험장 입장하기 <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}