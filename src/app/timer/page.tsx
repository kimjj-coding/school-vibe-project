'use client';

import TimerCard from '../../components/ui/TimerCard';

export default function TimerPage() {
  return (
    <div className="px-5 py-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-theme-text">⏱️ 몰입 타이머</h1>
        <p className="text-xs text-gray-400 mt-0.5">화면을 끄거나 다른 짓을 하면 타이머가 감지합니다!</p>
      </div>
      
      {/* 레고 블록 장착 */}
      <TimerCard />
    </div>
  );
}
