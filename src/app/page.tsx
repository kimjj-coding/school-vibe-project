'use client';

import React, { useState, useEffect } from 'react';
import { 
  Utensils, Calendar, Timer, BookOpenCheck, Play, Pause, RotateCcw, 
  Loader2, ArrowRight, Flame
} from 'lucide-react';

interface LocalTimerState {
  time: number;
  isRunning: boolean;
}

export default function SmartDashboardPage() {
  const [meal, setMeal] = useState<{ mealType: string; dishes: string[]; calories: string } | null>(null);
  const [timetable, setTimetable] = useState<{ period: number; subject: string }[]>([]);
  const [isMealLoading, setIsMealLoading] = useState(true);
  const [isTimetableLoading, setIsTimetableLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('1'); // 풍양중 2학년 반 선택

  const [studyTimer, setStudyTimer] = useState<LocalTimerState>({ time: 0, isRunning: false });
  const [showCheatWarning, setShowCheatWarning] = useState(false);

  // 타임존 연산 버그 픽스 (안전한 오늘 날짜)
  const todayDate = new Date();
  const vacationDDay = (() => {
    const target = new Date('2026-07-24T00:00:00');
    return Math.ceil((target.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
  })();
  const reOpenDDay = (() => {
    const target = new Date('2026-08-17T00:00:00');
    return Math.ceil((target.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
  })();

  // 실시간 나이스 API 호출 (반별 전환 완벽 지원)
  useEffect(() => {
    const fetchNeisData = async () => {
      setIsMealLoading(true);
      setIsTimetableLoading(true);

      const kstFormatter = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' });
      const parts = kstFormatter.formatToParts(new Date());
      const dateString = `${parts.find(p=>p.type==='year')?.value}${parts.find(p=>p.type==='month')?.value}${parts.find(p=>p.type==='day')?.value}`;

      try {
        const response = await fetch(`/api/neis?type=meal&date=${dateString}`);
        const data = await response.json();
        if (data.success && data.dishes.length > 0) setMeal({ mealType: data.mealType, dishes: data.dishes, calories: data.calories });
        else setMeal(null);
      } catch (err) { setMeal(null); } finally { setIsMealLoading(false); }

      try {
        const response = await fetch(`/api/neis?type=timetable&date=${dateString}&grade=2&class=${selectedClass}`);
        const data = await response.json();
        if (data.success && data.timetable.length > 0) setTimetable(data.timetable);
        else setTimetable([]);
      } catch (err) { setTimetable([]); } finally { setIsTimetableLoading(false); }
    };

    fetchNeisData();
  }, [selectedClass]); // 반이 바뀔 때마다 실시간 재호출

  // 타이머 로직
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (studyTimer.isRunning) interval = setInterval(() => setStudyTimer(prev => ({ ...prev, time: prev.time + 1 })), 1000);
    else if (interval) clearInterval(interval);
    return () => { if (interval) clearInterval(interval); };
  }, [studyTimer.isRunning]);

  useEffect(() => {
    const handleVis = () => {
      if (document.hidden && studyTimer.isRunning) {
        setStudyTimer(prev => ({ ...prev, isRunning: false }));
        setShowCheatWarning(true);
      }
    };
    document.addEventListener('visibilitychange', handleVis);
    return () => document.removeEventListener('visibilitychange', handleVis);
  }, [studyTimer.isRunning]);

  const formatStudyTime = (s: number) => `${Math.floor(s/3600).toString().padStart(2,'0')}:${Math.floor((s%3600)/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

  return (
    <div className="flex flex-col gap-6 px-4 py-8">
      {/* 웰컴 배너 */}
      <div className="flex items-center justify-between bg-theme-primary text-white rounded-2xl p-5 shadow-sm">
        <div>
          <span className="text-[11px] font-bold bg-white/20 px-2.5 py-1 rounded-full">
            {todayDate.toLocaleDateString('ko-KR')} ({days[todayDate.getDay()]})
          </span>
          <h1 className="text-xl font-black mt-2">반가워, StudyMate! 👋</h1>
          <p className="text-xs text-white/80 mt-1">오늘도 지식을 채우며 레벨업 하자.</p>
        </div>
        <Flame className="w-8 h-8 text-yellow-300 fill-yellow-300 animate-pulse" />
      </div>

      {/* 1. 학습 타이머 */}
      <div className="bg-theme-surface border border-theme-border rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-[15px] flex items-center gap-2 mb-4 text-theme-text">
          <Timer className="w-5 h-5 text-theme-primary" /> 집중 시계
        </h2>
        <div className="bg-theme-bg border border-theme-border rounded-xl py-6 flex flex-col items-center justify-center mb-4">
          <span className="text-4xl font-mono font-black text-theme-primary tracking-widest">{formatStudyTime(studyTimer.time)}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {studyTimer.isRunning ? (
            <button onClick={() => setStudyTimer(p => ({...p, isRunning: false}))} className="bg-amber-500 text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5"><Pause className="w-4 h-4 fill-white"/> 일시 정지</button>
          ) : (
            <button onClick={() => setStudyTimer(p => ({...p, isRunning: true}))} className="bg-theme-primary text-white font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5"><Play className="w-4 h-4 fill-white"/> 공부 시작</button>
          )}
          <button onClick={() => setStudyTimer({time: 0, isRunning: false})} disabled={studyTimer.time === 0} className="bg-theme-bg text-theme-text border border-theme-border disabled:opacity-40 font-bold py-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5"><RotateCcw className="w-4 h-4"/> 초기화</button>
        </div>
      </div>

      {/* 2. 풍양중 급식 */}
      <div className="bg-theme-surface border border-theme-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[15px] flex items-center gap-2 text-theme-text">
            <Utensils className="w-5 h-5 text-orange-500" /> 실시간 급식
          </h2>
          {meal && <span className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">{meal.mealType}</span>}
        </div>
        {isMealLoading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 text-orange-500 animate-spin" /></div>
        ) : meal && meal.dishes.length > 0 ? (
          <div className="bg-theme-bg border border-theme-border rounded-xl p-4">
            <ul className="grid grid-cols-2 gap-2 text-xs font-bold text-theme-text mb-3">
              {meal.dishes.map((dish, i) => <li key={i}><span className="text-orange-500">●</span> {dish}</li>)}
            </ul>
            {meal.calories && <div className="pt-2 border-t border-theme-border text-center text-[10px] text-theme-muted">칼로리: {meal.calories}</div>}
          </div>
        ) : (
          <div className="bg-theme-bg border border-theme-border rounded-xl p-6 text-center text-xs text-theme-muted">⚠️ 급식 정보가 없습니다.</div>
        )}
      </div>

      {/* 3. 반별 시간표 */}
      <div className="bg-theme-surface border border-theme-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-[15px] flex items-center gap-2 text-theme-text">
            <BookOpenCheck className="w-5 h-5 text-purple-500" /> 오늘 시간표
          </h2>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="text-[11px] bg-theme-bg text-theme-primary border border-theme-border rounded-lg px-2 py-1 font-bold focus:outline-none">
            {['1','2','3','4','5','6','7','8'].map(c => <option key={c} value={c}>풍양중 2학년 {c}반</option>)}
          </select>
        </div>
        {isTimetableLoading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 text-purple-500 animate-spin" /></div>
        ) : timetable.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {timetable.map(item => (
              <div key={item.period} className="flex justify-between bg-theme-bg border border-theme-border p-2.5 rounded-xl">
                <span className="text-[10px] text-theme-primary font-black">{item.period}교시</span>
                <span className="text-xs text-theme-text font-bold">{item.subject}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-theme-bg border border-theme-border rounded-xl p-6 text-center text-xs text-theme-muted">💤 일정이 없습니다.</div>
        )}
      </div>

      {/* 4. 학사일정 */}
      <div className="bg-theme-surface border border-theme-border rounded-2xl p-6 shadow-sm">
        <h2 className="font-bold text-[15px] flex items-center gap-2 mb-4 text-theme-text">
          <Calendar className="w-5 h-5 text-red-500" /> 다가오는 학사일정
        </h2>
        <div className="space-y-2">
          <div className="flex justify-between bg-theme-bg border border-theme-border p-3 rounded-xl">
            <span className="text-xs font-bold text-theme-text">🌴 즐거운 여름방학식</span>
            <span className="text-xs font-black text-red-500">{vacationDDay > 0 ? `D - ${vacationDDay}` : '방학 중'}</span>
          </div>
          <div className="flex justify-between bg-theme-bg border border-theme-border p-3 rounded-xl">
            <span className="text-xs font-bold text-theme-text">🏫 2학기 개학식</span>
            <span className="text-xs font-black text-emerald-500">{reOpenDDay > 0 ? `D - ${reOpenDDay}` : '개학'}</span>
          </div>
        </div>
      </div>

      {/* 5. AI 테스트 */}
      <div className="bg-theme-surface border border-theme-border rounded-2xl p-6 shadow-md flex flex-col gap-4">
        <div>
          <span className="text-[9px] bg-theme-primary text-white px-2 py-0.5 rounded-md font-bold">AI STUDY UNIVERSE</span>
          <h3 className="text-sm font-black mt-2 text-theme-text">배운 내용을 즉시 퀴즈로 풀자!</h3>
        </div>
        <button onClick={() => window.location.href = '/quiz'} className="w-full bg-theme-primary text-white font-bold py-3.5 rounded-xl text-xs flex justify-center items-center gap-1">
          시험장 입장하기 <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 딴짓 모달 */}
      {showCheatWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-theme-surface rounded-2xl p-6 w-full max-w-xs text-center">
            <span className="text-4xl block mb-3">🛑</span>
            <h4 className="text-base font-black text-theme-text mb-1">딴짓 현장 적발!</h4>
            <p className="text-xs text-theme-muted mb-5">학습 시계가 중지되었습니다.</p>
            <button onClick={() => setShowCheatWarning(false)} className="w-full bg-red-500 text-white font-bold py-3 rounded-xl text-xs">확인</button>
          </div>
        </div>
      )}
    </div>
  );
}