'use client';

import React, { useState, useEffect } from 'react';
import { Utensils, Calendar, BookOpenCheck, Loader2 } from 'lucide-react';

interface ScheduleItem {
  eventName: string;
  eventDate: string;
}

export default function SchoolInfoPage() {
  const todayDate = new Date();
  
  const [meal, setMeal] = useState<{ mealType: string; dishes: string[]; calories: string } | null>(null);
  const [timetable, setTimetable] = useState<{ period: number; subject: string }[]>([]);
  const [isMealLoading, setIsMealLoading] = useState(true);
  const [isTimetableLoading, setIsTimetableLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('1'); 
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);

  const calculateDDay = (targetYmd: string) => {
    const y = parseInt(targetYmd.substring(0, 4), 10);
    const m = parseInt(targetYmd.substring(4, 6), 10) - 1;
    const d = parseInt(targetYmd.substring(6, 8), 10);
    const target = new Date(y, m, d, 0, 0, 0);
    
    const todayZero = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate(), 0, 0, 0);
    const diff = target.getTime() - todayZero.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  useEffect(() => {
    const fetchSchoolData = async () => {
      const year = todayDate.getFullYear();
      const month = String(todayDate.getMonth() + 1).padStart(2, '0');
      const day = String(todayDate.getDate()).padStart(2, '0');
      const dateString = `${year}${month}${day}`;

      // 1. 학사일정 연동
      try {
        const response = await fetch(`/api/neis?type=schedule&date=${dateString}`);
        const data = await response.json();
        if (data.success && data.schedules) {
          setSchedules(data.schedules);
        }
      } catch (err) {
        console.error('학교 탭 학사일정 에러:', err);
      }

      // 2. 급식 연동
      try {
        const response = await fetch(`/api/neis?type=meal&date=${dateString}`);
        const data = await response.json();
        if (data.success && data.dishes.length > 0) {
          setMeal({
            mealType: data.mealType,
            dishes: data.dishes,
            calories: data.calories
          });
        }
      } catch (err) {
        console.error('학교 탭 급식 에러:', err);
      } finally {
        setIsMealLoading(false);
      }

      // 3. 시간표 연동
      try {
        const response = await fetch(`/api/neis?type=timetable&date=${dateString}&grade=2&class=${selectedClass}`);
        const data = await response.json();
        if (data.success && data.timetable.length > 0) {
          setTimetable(data.timetable);
        } else {
          setTimetable([]);
        }
      } catch (err) {
        console.error('학교 탭 시간표 에러:', err);
      } finally {
        setIsTimetableLoading(false);
      }
    };

    fetchSchoolData();
  }, [selectedClass]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 pb-20">
      <main className="flex-1 max-w-md mx-auto px-4 py-6 w-full space-y-5">
        
        <div className="py-2">
          <h1 className="text-xl font-black text-gray-900 tracking-tight">🏫 실시간 우리 학교 정보</h1>
          <p className="text-xs text-gray-500 mt-0.5">경기도 남양주 풍양중학교 고유 시스템 연동</p>
        </div>

        {/* 1. 오늘의 급식 정보 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[14px] flex items-center gap-2 text-gray-800">
              <Utensils className="w-4.5 h-4.5 text-orange-500" /> 오늘의 맛있는 중식 메뉴
            </h2>
            {meal && (
              <span className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100 px-2.5 py-0.5 rounded-full font-bold">
                {meal.mealType}
              </span>
            )}
          </div>

          {isMealLoading ? (
            <div className="py-8 flex flex-col items-center justify-center"><Loader2 className="w-5 h-5 text-orange-500 animate-spin" /></div>
          ) : meal && meal.dishes.length > 0 ? (
            <div className="bg-orange-50/20 rounded-xl p-4 border border-orange-100/40 space-y-3">
              <ul className="grid grid-cols-2 gap-2 text-xs text-gray-700 font-bold">
                {meal.dishes.map((dish, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <span className="text-orange-400">●</span> {dish}
                  </li>
                ))}
              </ul>
              {meal.calories && (
                <div className="pt-2 border-t border-orange-100/60 text-center text-[10px] text-orange-500 font-semibold">
                  ⚡ 총 식단 열량: {meal.calories}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-xs text-gray-400 border border-gray-100">⚠️ 급식 정보가 존재하지 않습니다.</div>
          )}
        </div>

        {/* 2. 오늘 학교 시간표 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[14px] flex items-center gap-2 text-gray-800">
              <BookOpenCheck className="w-4.5 h-4.5 text-purple-500" /> 교시별 정규 시간표
            </h2>
            <select 
              value={selectedClass} 
              onChange={(e) => { setIsTimetableLoading(true); setSelectedClass(e.target.value); }}
              className="text-xs bg-purple-50 text-purple-600 border border-purple-200 rounded-lg px-2 py-1 font-bold cursor-pointer"
            >
              {['1', '2', '3', '4', '5', '6', '7', '8'].map(c => <option key={c} value={c}>2학년 {c}반</option>)}
            </select>
          </div>
          {isTimetableLoading ? (
            <div className="py-8 flex flex-col items-center justify-center"><Loader2 className="w-5 h-5 text-purple-500 animate-spin" /></div>
          ) : timetable.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {timetable.map((item) => (
                <div key={item.period} className="flex items-center justify-between bg-purple-50/30 border border-purple-100/50 p-2.5 rounded-xl">
                  <span className="text-[10px] text-purple-600 font-black">{item.period}교시</span>
                  <span className="text-xs text-purple-950 font-bold">{item.subject}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-6 text-center text-xs text-gray-400 border border-gray-100">💤 오늘은 시간표 배정이 없는 날입니다.</div>
          )}
        </div>

        {/* 3. 전체 실시간 학사일정 */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <h2 className="font-bold text-[14px] flex items-center gap-2 text-gray-800 mb-4">
            <Calendar className="w-4.5 h-4.5 text-red-500" /> 다가오는 주요 실시간 학사 일정
          </h2>
          <div className="space-y-2">
            {schedules.length > 0 ? (
              schedules.slice(0, 4).map((item, index) => {
                const dday = calculateDDay(item.eventDate);
                return (
                  <div key={index} className="flex items-center justify-between border border-gray-100 p-3 rounded-xl bg-gray-50/50">
                    <span className="text-xs font-bold text-gray-700">{item.eventName}</span>
                    <span className="text-xs font-black text-blue-600">
                      {dday > 0 ? `D - ${dday}` : dday === 0 ? 'D-Day 🎉' : '진행 중'}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 text-center text-xs text-gray-400 border border-gray-100">가까운 학사 일정이 없습니다.</div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}