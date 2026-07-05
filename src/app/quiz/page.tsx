'use client';

import React, { useState, useEffect } from 'react';
import { Bot, Loader2, ChevronRight, Check, X, ArrowLeft } from 'lucide-react';
import { CURRICULUM_DB, Chapter } from '../../data/curriculum';

interface Question {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export default function QuizDashboardPage() {
  // 1. 공통 뷰 상태
  const [viewState, setViewState] = useState<
    'dashboard' | 'free_input' | 'loading' | 'quiz' | 'result' |
    'ranking_setup' | 'ranking_quiz' | 'ranking_result' | 'cheat_detected'
  >('dashboard');

  const [showComingSoon, setShowComingSoon] = useState(false);
  const [displayTitle, setDisplayTitle] = useState('');

  // 2. 퀴즈 DB 공통 상태
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 3. 자유 연습장 전용 상태
  const [freeTopic, setFreeTopic] = useState('');
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);

  // 4. 실전 랭킹전 전용 상태
  const [rankingSubject, setRankingSubject] = useState('역사');
  const [selectedChapterObj, setSelectedChapterObj] = useState<Chapter | null>(null);
  const [rankingAnswers, setRankingAnswers] = useState<Record<number, number>>({});

  // 🚨 실전 랭킹전 전용: 화면 이탈(딴짓) 감지 방화벽
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && viewState === 'ranking_quiz') {
        setViewState('cheat_detected');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [viewState]);

  // --- 🚀 공통 퀴즈 발사대 (API Fetch) ---
  const fetchQuiz = async (apiQueryDoc: string, cleanTitle: string, nextState: 'quiz' | 'ranking_quiz') => {
    setDisplayTitle(cleanTitle);
    setViewState('loading');
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topic: apiQueryDoc, 
          mode: nextState === 'quiz' ? 'free' : 'ranking' 
        }),
      });
      const data = await response.json();

      if (data.success && data.questions) {
        setQuestions(data.questions);
        setCurrentIndex(0);
        if (nextState === 'quiz') {
          setUserAnswers({});
          setIsAnswered(false);
        } else {
          setRankingAnswers({});
        }
        setViewState(nextState);
      } else {
        alert("문제 출제에 실패했습니다.");
        setViewState('dashboard');
      }
    } catch (error) {
      alert("서버와 통신할 수 없습니다.");
      setViewState('dashboard');
    }
  };

  // --- [모드 1] 자유 연습장 핸들러 ---
  const handleStartFreePractice = () => {
    if (!freeTopic.trim()) return alert("복습할 키워드를 입력해주세요!");
    fetchQuiz(freeTopic, freeTopic, 'quiz');
  };

  const handleSelectFreeOption = (idx: number) => {
    if (isAnswered) return;
    setUserAnswers({ ...userAnswers, [currentIndex]: idx });
    setIsAnswered(true);
  };

  const handleNextFreeQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsAnswered(false);
    } else {
      const calculatedScore = questions.filter((q, i) => q.answer === userAnswers[i]).length;
      setScore(calculatedScore);
      setViewState('result');
    }
  };

  // --- [모드 2] 실전 랭킹전 핸들러 ---
  const handleStartRankingMatch = () => {
    if (!selectedChapterObj) return alert("단원을 선택해주세요!");
    const cleanName = `[중2 ${rankingSubject}] ${selectedChapterObj.title}`;
    fetchQuiz(selectedChapterObj.promptDoc, cleanName, 'ranking_quiz');
  };

  const getRankingScore = () => questions.filter((q, i) => q.answer === rankingAnswers[i]).length;

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col font-sans pb-24">
      <main className="flex-1 max-w-md mx-auto px-5 py-6 w-full space-y-6 text-left">

        {/* =========================================================
            [대문] 모드 선택 대시보드 (진짜 3개 카드 완벽 복원)
            ========================================================= */}
        {viewState === 'dashboard' && (
          <div className="animate-in fade-in duration-300 space-y-4">
            <div>
              <h1 className="text-xl font-black flex items-center gap-1.5">🤖 AI 퀴즈 유니버스</h1>
              <p className="text-xs text-gray-400 mt-1">목표에 맞는 훈련 모드를 선택하세요 🔥</p>
            </div>

            <div className="space-y-3 pt-2">
              {/* ⚡️ 카드 1: 자유 연습장 (복원 완료!) */}
              <div 
                onClick={() => setViewState('free_input')}
                className="p-4 rounded-2xl border border-gray-200 bg-white hover:bg-blue-50/20 transition-all cursor-pointer flex items-center shadow-xs"
              >
                <div className="text-3xl mr-3.5">⚡️</div>
                <div className="flex-1">
                  <h3 className="font-black text-gray-900 text-sm">자유 연습장 (5분 컷)</h3>
                  <p className="text-xs text-gray-400 mt-0.5">자유 키워드로 가볍게 5제 풀기</p>
                </div>
                <div className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl">입장 🚀</div>
              </div>

              {/* 🏆 카드 2: 실전 랭킹전 */}
              <div 
                onClick={() => setViewState('ranking_setup')}
                className="p-4 rounded-2xl border-2 border-amber-400/60 bg-amber-50/30 hover:bg-amber-50/60 transition-all cursor-pointer flex items-center shadow-sm"
              >
                <div className="text-3xl mr-3.5">🏆</div>
                <div className="flex-1">
                  <h3 className="font-black text-gray-900 text-sm flex items-center gap-1.5">
                    실전 랭킹전 <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md text-[10px]">20제</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 font-medium">교과서 DB 연동형 고사장 (탈주 박제)</p>
                </div>
                <div className="text-xs font-black text-amber-700 bg-amber-100 px-3 py-2 rounded-xl">응시 ✍️</div>
              </div>

              {/* 💀 카드 3: 지옥의 기출 (복원 완료!) */}
              <div 
                onClick={() => setShowComingSoon(true)}
                className="p-4 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer flex items-center opacity-80"
              >
                <div className="text-3xl mr-3.5">💀</div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-700 text-sm flex items-center gap-1.5">
                    지옥의 기출 <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md text-[10px] font-black">50제</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">오답 함정 킬러 문항 모음</p>
                </div>
                <div className="text-xs font-bold text-gray-400 bg-gray-200 px-3 py-2 rounded-xl">잠금 🔒</div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            [모드 1 뷰] 자유 연습장 입력창 -> 풀이 -> 결과
            ========================================================= */}
        {viewState === 'free_input' && (
          <div className="animate-in fade-in space-y-4">
            <button onClick={() => setViewState('dashboard')} className="text-xs font-bold text-gray-400 flex items-center gap-1">← 뒤로 가기</button>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-4 text-center">
              <div className="text-3xl">⚡️</div>
              <h2 className="text-base font-bold text-gray-900">자유 연습장 키워드 입력</h2>
              <input 
                type="text" 
                value={freeTopic} 
                onChange={e => setFreeTopic(e.target.value)} 
                placeholder="예) 뉴턴의 운동 법칙..." 
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-left" 
              />
              <button onClick={handleStartFreePractice} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-sm">🚀 5제 스피드 출제</button>
            </div>
          </div>
        )}

        {viewState === 'quiz' && questions.length > 0 && (
          <div className="animate-in slide-in-from-right-4 space-y-6">
            <div className="flex justify-between text-xs font-bold text-gray-400 border-b pb-2">
              <span>자유 연습장 (스피드 모드)</span>
              <span className="text-blue-600">{currentIndex + 1} / {questions.length}</span>
            </div>
            <div className="bg-white rounded-3xl p-6 border shadow-sm space-y-6">
              <h3 className="text-base font-black leading-snug"><span className="text-blue-600 mr-1.5">Q.</span>{questions[currentIndex].question}</h3>
              <div className="space-y-2.5">
                {questions[currentIndex].options.map((opt, idx) => {
                  let btnStyle = "bg-white border-gray-200 text-gray-700";
                  if (isAnswered) {
                    if (questions[currentIndex].answer === idx) btnStyle = "bg-green-50 border-green-500 text-green-800 font-bold border-2";
                    else if (userAnswers[currentIndex] === idx) btnStyle = "bg-red-50 border-red-400 text-red-700 border-2";
                    else btnStyle = "opacity-40 border-gray-100";
                  }
                  return (
                    <button key={idx} disabled={isAnswered} onClick={() => handleSelectFreeOption(idx)} className={`w-full text-left px-4 py-3.5 rounded-2xl border text-xs font-bold transition-all ${btnStyle}`}>
                      {idx + 1}) {opt}
                    </button>
                  );
                })}
              </div>
            </div>
            {isAnswered && (
              <div className="p-4 rounded-2xl border bg-gray-50 space-y-3">
                <p className="text-xs leading-relaxed text-gray-700"><span className="font-bold text-blue-600">💡 해설:</span> {questions[currentIndex].explanation}</p>
                <button onClick={handleNextFreeQuestion} className="w-full bg-blue-600 text-white font-black py-3.5 rounded-xl text-xs">다음 문제 ➡️</button>
              </div>
            )}
          </div>
        )}

        {viewState === 'result' && (
          <div className="text-center py-16 space-y-6 bg-gray-50 rounded-3xl border p-6">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-black text-gray-900">스피드 훈련 완료!</h2>
            <div className="text-3xl font-black text-blue-600">{score} <span className="text-sm text-gray-400">/ {questions.length}점</span></div>
            <button onClick={() => setViewState('dashboard')} className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl text-xs">대시보드로 복귀 🏠</button>
          </div>
        )}

        {/* =========================================================
            [모드 2 뷰] 실전 랭킹전 설정 -> 고사장 -> 결과 / 추방
            ========================================================= */}
        {viewState === 'ranking_setup' && (
          <div className="animate-in fade-in space-y-5">
            <button onClick={() => setViewState('dashboard')} className="text-xs font-bold text-gray-400 flex items-center gap-1">← 뒤로 가기</button>
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl space-y-6">
              <div>
                <div className="text-3xl mb-1">🏆</div>
                <h2 className="text-base font-black text-gray-900">중학 2학년 표준 과목 선택</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">DB에 공식 등록된 교과서 목차입니다.</p>
              </div>

              {/* 과목 탭 */}
              <div className="flex gap-2">
                {Object.keys(CURRICULUM_DB['중등'] || {}).map((sub) => (
                  <button 
                    key={sub} 
                    onClick={() => { setRankingSubject(sub); setSelectedChapterObj(null); }} 
                    className={`flex-1 py-3 rounded-2xl text-xs font-black border transition-all ${rankingSubject === sub ? 'bg-amber-50 text-amber-800 border-amber-400 shadow-2xs' : 'bg-white text-gray-400 border-gray-200'}`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {/* 단원 리스트 */}
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {(CURRICULUM_DB['중등']?.[rankingSubject] || []).map((chap) => {
                  const isChecked = selectedChapterObj?.id === chap.id;
                  return (
                    <div 
                      key={chap.id} 
                      onClick={() => setSelectedChapterObj(chap)} 
                      className={`p-4 rounded-2xl border text-xs cursor-pointer flex items-center justify-between font-bold transition-all ${isChecked ? 'bg-amber-500 text-white border-amber-500 shadow-md' : 'bg-gray-50/80 text-gray-600 hover:bg-gray-100'}`}
                    >
                      <span>{chap.title}</span>
                      {isChecked && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  );
                })}
              </div>

              <button 
                disabled={!selectedChapterObj} 
                onClick={handleStartRankingMatch} 
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black py-4 rounded-2xl text-xs disabled:opacity-30 shadow-md active:scale-95 transition-all"
              >
                ✍️ 실전 20제 고사장 입장
              </button>
            </div>
          </div>
        )}

        {viewState === 'ranking_quiz' && questions.length > 0 && (
          <div className="animate-in slide-in-from-right-4 space-y-6">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border">
              <span className="text-xs font-black text-gray-800">{displayTitle}</span>
              <span className="text-xs font-black text-amber-600">{currentIndex + 1} / {questions.length}</span>
            </div>
            
            <div className="bg-white rounded-3xl p-6 border shadow-sm space-y-6 min-h-[280px] flex flex-col justify-between">
              <h3 className="text-base font-black leading-snug"><span className="text-amber-600 mr-1.5 font-black">Q.</span>{questions[currentIndex].question}</h3>
              <div className="space-y-2.5">
                {questions[currentIndex].options.map((opt, idx) => {
                  const isMarked = rankingAnswers[currentIndex] === idx;
                  return (
                    <button 
                      key={idx} 
                      onClick={() => setRankingAnswers({ ...rankingAnswers, [currentIndex]: idx })} 
                      className={`w-full text-left px-4 py-3.5 rounded-2xl border-2 text-xs font-bold transition-all flex items-center ${isMarked ? 'bg-amber-50 border-amber-500 text-amber-950 font-black' : 'bg-white border-gray-200 text-gray-600'}`}
                    >
                      <span className={`w-6 h-6 text-center rounded-full mr-3 border text-xs leading-5 shrink-0 ${isMarked ? 'bg-amber-500 text-white border-amber-500 font-black' : 'border-gray-300'}`}>{idx + 1}</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setCurrentIndex(p => p - 1)} disabled={currentIndex === 0} className="flex-1 bg-gray-100 disabled:opacity-30 font-black py-4 rounded-2xl text-xs">← 이전</button>
              {currentIndex === questions.length - 1 ? (
                <button onClick={() => setViewState('ranking_result')} className="flex-[2] bg-gray-900 text-white font-black py-4 rounded-2xl text-xs shadow-md">🚀 최종 OMR 제출</button>
              ) : (
                <button onClick={() => setCurrentIndex(p => p + 1)} className="flex-1 bg-gray-900 text-white font-black py-4 rounded-2xl text-xs">다음 →</button>
              )}
            </div>
          </div>
        )}

        {viewState === 'ranking_result' && (
          <div className="text-center py-12 space-y-6 bg-gray-50 rounded-3xl border p-6">
            <div className="text-5xl">🏆</div>
            <h2 className="text-xl font-black text-gray-900">OMR 채점 완료</h2>
            <p className="text-xs text-amber-600 font-black">{displayTitle}</p>
            <div className="bg-white rounded-2xl p-6 border shadow-2xs">
              <div className="text-[10px] font-black text-gray-400 mb-1">최종 내신 스코어</div>
              <div className="text-4xl font-black text-gray-900">{getRankingScore()} <span className="text-base text-gray-400">/ {questions.length}</span></div>
            </div>
            <button onClick={() => setViewState('dashboard')} className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl text-xs">대시보드로 복귀 🏠</button>
          </div>
        )}

        {/* 🚨 부정행위 이탈 박제 */}
        {viewState === 'cheat_detected' && (
          <div className="text-center py-20 space-y-6 bg-red-50 rounded-3xl border border-red-200 p-6">
            <div className="text-6xl animate-bounce">🚨</div>
            <h2 className="text-xl font-black text-red-600">부정행위 (화면 이탈) 감지</h2>
            <p className="text-xs text-red-900 font-bold">시험 도중 브라우저를 벗어난 이력이 감지되어<br/>해당 시험은 [ 0점 미응시 ] 처리되었습니다.</p>
            <button onClick={() => setViewState('dashboard')} className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl text-xs">대시보드로 추방</button>
          </div>
        )}

        {/* 공통 로딩 */}
        {viewState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32 text-center space-y-3">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <h2 className="text-sm font-black text-gray-800">{displayTitle}</h2>
            <p className="text-xs text-gray-400">AI 출제위원이 고실력자용 시험지를 인쇄 중입니다...</p>
          </div>
        )}

        {/* Coming Soon 모달 */}
        {showComingSoon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-xl text-center relative">
              <button onClick={() => setShowComingSoon(false)} className="absolute top-3 right-3 text-gray-400"><X className="w-4 h-4"/></button>
              <div className="text-3xl mb-2">🚧</div>
              <h3 className="text-xs font-black text-gray-900 mb-1">업데이트 준비 중</h3>
              <p className="text-[11px] text-gray-500">킬러 문항 지옥 모드는 다음 페이즈에 오픈됩니다!</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
