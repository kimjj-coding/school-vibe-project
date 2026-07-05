'use client';

import { Calendar, Utensils } from 'lucide-react';

export default function HomePage() {
  // 임시 일주일 급식 데이터 (추후 나이스 API 일주일치로 확장 가능!)
  const weeklyMeals = [
    { day: '월요일', menu: ['🍚 혼합곡밥', '🍲 쇠고기미역국', '🥩 돈육간장불고기', '🥬 배추김치'] },
    { day: '화요일', menu: ['🍚 발아현미밥', '🍲 순두부찌개', '🍗 닭간장조림', '🥗 깍두기'] },
    { day: '수요일', menu: ['🍛 카레라이스', '🍢 팽이버섯장국', '🍤 오징어튀김', '🍊 단감'] },
    { day: '목요일', menu: ['🍚 차조밥', '🍲 부대찌개', '🐟 고등어구이', '🥬 총각김치'] },
    { day: '금요일', menu: ['Spaghetti 스파게티', '🍞 마늘빵', '🥗 케이준샐러드', ' juice 피크닉'] },
  ];

  return (
    <div className="px-5 py-6 space-y-6">
      {/* 상단 웰컴 문구 */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">안녕하세요, 김학생님! 👋</h1>
        <p className="text-xs text-gray-400 mt-0.5">오늘도 완벽한 하루를 만들어봐요.</p>
      </div>

      {/* 📅 오늘의 시간표 카드 */}
      <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
        <h2 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-blue-500" /> 오늘의 시간표
        </h2>
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {['1교시\n수학', '2교시\n영어', '3교시\n과학', '4교시\n국어'].map((sub, idx) => (
            <div key={idx} className="bg-white p-3 rounded-lg border border-gray-100 font-medium text-gray-700 whitespace-pre-line shadow-sm">
              {sub}
            </div>
          ))}
        </div>
      </div>

      {/* 🍱 일주일 급식 세로 스크롤 구역 */}
      <div className="space-y-3">
        <h2 className="font-bold text-sm text-gray-800 flex items-center gap-2 px-1">
          <Utensils className="w-4 h-4 text-orange-500" /> 주간 급식 예보
        </h2>
        
        {/* 일주일치 세로 나열 */}
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
          {weeklyMeals.map((meal, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)] flex justify-between items-center">
              <div className="w-20 shrink-0">
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                  {meal.day}
                </span>
              </div>
              <div className="flex-1 text-right text-xs font-medium text-gray-600 leading-relaxed">
                {meal.menu.join(' • ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
