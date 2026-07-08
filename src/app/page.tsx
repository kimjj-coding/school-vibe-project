'use client';

import React, { useState, useEffect } from 'react';
import { 
  Utensils, Calendar, Timer, BookOpenCheck, Play, Pause, RotateCcw, 
  Loader2, ArrowRight, BookOpen, User, Flame
} from 'lucide-react';

interface LocalTimerState {
  time: number;
  isRunning: boolean;
}

export default function SmartDashboardPage() {
  const todayDate = new Date();
  
  // 1. 실시간 나이스 연동 데이터 상태
  const [meal, setMeal] = useState<{ mealType: string; dishes: string[]; calories: string } | null>(null);
  const [timetable, setTimetable] = useState<{ period: number; subject: string }[]>([]);
  const [isMealLoading, setIsMealLoading] = useState(true);
  const [isTimetableLoading, setIsTimetableLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('1'); // 기본 1반 고정

  // 2. 학습 스톱워치 상태
  const [studyTimer, setStudyTimer] = useState<LocalTimerState>({ time: 0, isRunning: false });
  const [showCheatWarning, setShowCheatWarning] = useState(false);

  // 3. 2026년 7월 여름 학사일정 D-Day 계산 타겟 설정
  const vacationDDay = (() => {
    // 풍양중학교 실제 여름방학식 기준 타겟일 세팅 (7월 24일 전후 모델링)
    const target = new Date('2026-07-24T00:00:00');
    const diff = target.getTime() - todayDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  })();

  const reOpenDDay = (() => {
    // 2.학기 개학식 기준 타겟일 세팅 (8월 17일 전후 모델링)
    const target = new Date('2026-08-17T00:00:00');
    const diff = target.getTime() - todayDate.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  })();

  // --- [실시간 나이스 연동] 마운트 시 API 동적 호출 ---
  useEffect(() => {
    const fetchNeisData = async () => {
      // 클라이언트 디바이스 규격에 맞는 깔끔한 YYYYMMDD 날짜 구문 생성
      const year = todayDate.getFullYear();
      const month = String(todayDate.getMonth() + 1).padStart(2, '0');
      const day = String(todayDate.getDate()).padStart(2, '0');
      const dateString = `${year}${month}${day}`;

      // 급식 API 실시간 조회
      try {
        const response = await fetch(`/api/neis?type=meal&date=${dateString}`);
        const text = await response.text();
        const data = JSON.parse(text);
        if (data.success && data.dishes.length > 0) {
          setMeal({
            mealType: data.mealType,
            dishes: data.dishes,
            calories: data.calories
          });
        }
      } catch (err) {
        console.error('급식 파싱 에러:', err);
      } finally {
        setIsMealLoading(false);
      }

      // 시간표 API 실시간 조회 (2학년 1반 인자 명시 전송)
      try {
        const response = await fetch(`/api/neis?type=timetable&date=${dateString}&grade=2&class=${selectedClass}`);
        const text = await response.text();
        const data = JSON.parse(text);
        if (data.success && data.timetable.length > 0) {
          setTimetable(data.timetable);
        } else {
          setTimetable([]); // 데이터 없으면 비워주기 예외처리
        }
      } catch (err) {
        console.error('시간표 파싱 에러:', err);
      } finally {
        setIsTimetableLoading(false);
      }
    };

    fetchNeisData();
  }, [selectedClass]);

  // --- 스톱워치 타이머 트리거 ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (studyTimer.isRunning) {
      interval = setInterval(() => {
        setStudyTimer((prev) => ({ ...prev, time: prev.time + 1 }));
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [studyTimer.isRunning]);

  // 학습 딴짓(화면 가림 및 탭 이동) 실시간 적발 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && studyTimer.isRunning) {
        setStudyTimer((prev) => ({ ...prev, isRunning: false }));
        setShowCheatWarning(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [studyTimer.isRunning]);

  const formatStudyTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getKoreanDayOfWeek = () => {
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return days[todayDate.getDay()];
  };

  return (
    // [디자인 헌법] 트렌디한 스마트폰 고정 뷰포트 레이아웃
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 pb-16">
      <main className="flex-1 max-w-md mx-auto px-4 py-8 w-full space-y-6">
        
        {/* 상단 배너 */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-sm">
          <div>
            <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">{todayDate.toLocaleDateString('ko-KR')} ({getKoreanDayOfWeek()})</span>
            <h1 className="text-xl font-black mt-2">반가워, StudyMate! 👋</h1>
            <p className="text-xs text-blue-100/90 mt-1">오늘도 지식을 채우며 레벨을 한 단계 업그레이드하자.</p>
          </div>
          <div className="p-3 bg-white/10 rounded-xl">
            <Flame className="w-8 h-8 text-yellow-300 fill-yellow-300 animate-pulse" />
          </div>
        </div>

        {/* 1. 학습 타이머 카드 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[15px] flex items-center gap-2 text-gray-800">
              <Timer className="w-5 h-5 text-blue-500" />
              ⏰ 나의 학습 집중 시계
            </h2>
            {studyTimer.isRunning && (
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
              </span>
            )}
          </div>
          
          <div className="bg-blue-50/50 rounded-xl py-6 flex flex-col items-center justify-center border border-blue-100/50 mb-4">
            <span className="text-4xl font-mono font-black text-blue-700 tracking-widest">{formatStudyTime(studyTimer.time)}</span>
            <span className="text-xs text-gray-400 font-medium mt-1">오늘 총 공부 시간</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {studyTimer.isRunning ? (
              <button 
                onClick={() => setStudyTimer(prev => ({ ...prev, isRunning: false }))}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
              >
                <Pause className="w-4 h-4 fill-white" /> 일시 정지
              </button>
            ) : (
              <button 
                onClick={() => setStudyTimer(prev => ({ ...prev, isRunning: true }))}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
              >
                <Play className="w-4 h-4 fill-white" /> 공부 시작
              </button>
            )}
            <button 
              onClick={() => setStudyTimer({ time: 0, isRunning: false })}
              disabled={studyTimer.time === 0}
              className="bg-gray-100 hover:bg-gray-200 text-gray-600 disabled:opacity-50 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
            >
              <RotateCcw className="w-4 h-4" /> 초기화
            </button>
          </div>
        </div>

        {/* 2. 오늘의 풍양중학교 진짜 급식 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[15px] flex items-center gap-2 text-gray-800">
              <Utensils className="w-5 h-5 text-orange-500" />
              🍱 실시간 학교 급식 정보
            </h2>
            {meal && (
              <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded-full font-bold">
                {meal.mealType}
              </span>
            )}
          </div>

          {isMealLoading ? (
            <div className="py-10 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              <span className="text-xs text-gray-400 font-medium animate-pulse">식단 정보를 호출 중입니다...</span>
            </div>
          ) : meal && meal.dishes.length > 0 ? (
            <div className="bg-orange-50/30 rounded-xl p-4 border border-orange-100/50 space-y-3">
              <ul className="grid grid-cols-2 gap-2 text-xs text-gray-700 font-bold">
                {meal.dishes.map((dish, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-orange-400">●</span> {dish}
                  </li>
                ))}
              </ul>
              {meal.calories && (
                <div className="pt-2 border-t border-orange-100 text-center text-[10px] text-orange-500 font-medium">
                  ⚡ 총 열량 소모량: {meal.calories}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-xs text-gray-400 font-medium border border-gray-100">
              ⚠️ 오늘은 급식 정보가 없습니다. (방학 또는 공휴일)
            </div>
          )}
        </div>

        {/* 3. 오늘 학교 시간표 현황 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[15px] flex items-center gap-2 text-gray-800">
              <BookOpenCheck className="w-5 h-5 text-purple-500" />
              📅 오늘 교시별 시간표
            </h2>
            <select 
  value={selectedClass} 
  onChange={(e) => { setIsTimetableLoading(true); setSelectedClass(e.target.value); }}
  className="text-xs bg-purple-50 text-purple-600 border border-purple-200 rounded-lg px-2 py-1 font-bold focus:outline-none cursor-pointer"
>
  {['1', '2', '3', '4', '5', '6', '7', '8'].map(c => (
    <option key={c} value={c}>풍양중 2학년 {c}반</option>
  ))}
</select>
          </div>

          {isTimetableLoading ? (
            <div className="py-10 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              <span className="text-xs text-gray-400 font-medium animate-pulse">실시간 일정을 조회하는 중...</span>
            </div>
          ) : timetable.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {timetable.map((item) => (
                <div key={item.period} className="flex items-center justify-between bg-purple-50/40 border border-purple-100 p-2.5 rounded-xl">
                  <span className="text-[10px] text-purple-600 font-black">{item.period}교시</span>
                  <span className="text-xs text-purple-950 font-bold">{item.subject}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-xs text-gray-400 font-medium border border-gray-100">
              💤 등교 일정이 없거나 시간표가 텅 빈 날입니다.
            </div>
          )}
        </div>

        {/* 4. D-Day 카운터 보드 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-[15px] flex items-center gap-2 text-gray-800 mb-4">
            <Calendar className="w-5 h-5 text-red-500" />
            🚀 다가오는 주요 시험 & 학사일정
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-red-50/50 border border-red-100 p-3 rounded-xl">
              <span className="text-xs font-bold text-red-800">🌴 설레는 즐거운 여름방학식</span>
              <span className="text-xs font-black text-red-600">
                {vacationDDay > 0 ? `D - ${vacationDDay}` : vacationDDay === 0 ? 'D-Day 🎉' : '방학 중 🏖️'}
              </span>
            </div>
            <div className="flex items-center justify-between bg-teal-50/50 border border-teal-100 p-3 rounded-xl">
              <span className="text-xs font-bold text-teal-800">🏫 2학기 새로운 개학식</span>
              <span className="text-xs font-black text-teal-600">
                {reOpenDDay > 0 ? `D - ${reOpenDDay}` : '개학 완료'}
              </span>
            </div>
          </div>
        </div>

        {/* 5. AI 테스트 바로 가기 카드 */}
        <div className="bg-gray-900 text-white rounded-2xl p-6 shadow-md border border-gray-800 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">AI STUDY UNIVERSE</span>
            <h3 className="text-base font-black mt-2">오늘 배운 학업 단원을 즉시 퀴즈로 풀자!</h3>
            <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
              최신 인공지능이 탑재된 실전 모드에서 객관식 문항부터 서술형 전문 에이전트 채점까지 모두 무료로 응시할 수 있습니다.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/quiz'}
            className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1 active:scale-[0.98] transition-transform"
          >
            시험장 입장하기 <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </main>

      {/* 딴짓 방지 감지 경고 팝업 모달 */}
      {showCheatWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-xl">
            <span className="text-4xl block mb-3">🛑</span>
            <h4 className="text-base font-black text-gray-900 mb-1">딴짓 현장 적발!</h4>
            <p className="text-xs text-gray-500 leading-relaxed mb-5">
              공부 시계를 켜놓고 다른 화면을 보는 바람에<br />
              <b>학습 시계가 자동으로 멈추었습니다.</b><br />
              마음을 다잡고 다시 도전을 이어가세요!
            </p>
            <button 
              onClick={() => setShowCheatWarning(false)}
              className="w-full bg-red-500 text-white font-bold py-3 rounded-xl text-xs"
            >
              집중하기 (확인)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}