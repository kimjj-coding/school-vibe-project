'use client'; 

import { useEffect, useState } from 'react';
import { Timer, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';
// 💡 메인 뇌의 수정: 길 잃은 경로를 '상대 경로(점 3개)'로 확실하게 묶어줌!
import { useTimerStore } from '../../../store/timerStore';

export default function TimerCard() {
  const { time, isRunning, start, pause, reset, tick } = useTimerStore();
  const [showWarning, setShowWarning] = useState(false);

  // 💡 메인 뇌의 수정: NodeJS 서버 에러를 없애기 위해 완벽한 브라우저 타이머(window.setInterval)로 교체!
  useEffect(() => {
    let interval: number | null = null;
    if (isRunning) {
      interval = window.setInterval(() => {
        tick();
      }, 1000);
    } else if (interval !== null) {
      window.clearInterval(interval);
    }
    return () => {
      if (interval !== null) window.clearInterval(interval);
    };
  }, [isRunning, tick]);

  // 딴짓 방지 로직
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isRunning) {
        pause();
        setShowWarning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isRunning, pause]);

  // HH:MM:SS 변환기
  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
            <Timer className="w-5 h-5 text-blue-500" />
            내 학습 타이머
          </h2>
          {isRunning && (
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
          )}
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center py-6 bg-blue-50/50 rounded-xl mb-4">
          <span className="text-4xl md:text-5xl font-extrabold text-blue-600 tracking-wider font-mono drop-shadow-sm">
            {formatTime(time)}
          </span>
          <span className="text-sm text-gray-500 mt-3 font-medium">오늘의 누적 학습 시간</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-auto">
          {isRunning ? (
            <button 
              onClick={pause}
              className="col-span-2 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
            >
              <Pause className="w-5 h-5" />
              일시 정지
            </button>
          ) : (
            <button 
              onClick={start}
              className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" />
              {time > 0 ? '이어서 학습하기' : '타이머 시작하기'}
            </button>
          )}
          
          <button 
            onClick={reset}
            disabled={time === 0}
            className="col-span-2 bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50 disabled:hover:bg-gray-100 font-semibold py-2.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm mt-1"
          >
            <RotateCcw className="w-4 h-4" />
            초기화
          </button>
        </div>
      </div>

      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-red-100 p-3 rounded-full text-red-600">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">딴짓 금지! 🛑</h3>
                <p className="text-gray-500 mt-2 text-sm">
                  다른 화면을 보느라 타이머가 일시 정지되었습니다.<br/>
                  다시 집중해 볼까요?
                </p>
              </div>
              <button 
                onClick={() => setShowWarning(false)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors mt-2"
              >
                알겠습니다 (확인)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
