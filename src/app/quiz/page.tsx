'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, Scroll, AlertCircle, Bot, Loader2, 
  ChevronRight, CheckCircle, XCircle, Flame, ArrowLeft, RefreshCw
} from 'lucide-react';
import { CURRICULUM_DB, Chapter } from '../../data/curriculum';

// --- 통합 문항 인터페이스 (타입 충돌 완벽 방어 및 context 지문 데이터 수용) ---
interface Question {
  type: 'objective' | 'essay';
  question: string;
  context?: string; // 사료형/지문형/보기형 문항을 위한 지문 데이터 필드
  // 객관식 전용
  options?: string[];
  answer?: number;
  explanation?: string;
  // 서술형 전용
  modelAnswer?: string;
  rubric?: string[];
  maxScore?: number;
}

export default function QuizDashboardPage() {
  // 11개 모든 뷰 상태 완벽 맵핑
  const [viewState, setViewState] = useState<
    'dashboard' | 'free_input' | 'loading' | 'quiz' | 'result' | 
    'ranking_setup' | 'exam_setup' | 'ranking_quiz' | 'exam_grading' | 'exam_result' | 'cheat_detected'
  >('dashboard');
  
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [topic, setTopic] = useState('');
  
  // 퀴즈 공통 상태
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [timeElapsed, setTimeElapsed] = useState(0);

  // 자유 연습장 전용 상태 (5제)
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isAnswered, setIsAnswered] = useState(false); 
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

  // 실전 랭킹전(20제) & 종합 시험(25제) 전용 상태 (동적 바인딩)
  const dbSubjects = CURRICULUM_DB["중등"] ? Object.keys(CURRICULUM_DB["중등"]) : [];
  const initialSubject = dbSubjects.length > 0 ? dbSubjects[0] : '역사';
  const [rankingSubject, setRankingSubject] = useState<string>(initialSubject);
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [examAnswers, setExamAnswers] = useState<Record<number, string | number>>({});
  const [essayResults, setEssayResults] = useState<Record<number, { score: number, feedback: string }>>({});

  // 과목 변경에 따른 단원 리스트 동적 추출
  const currentSubjectChapters: Chapter[] = CURRICULUM_DB["중등"]?.[rankingSubject] || [];

  // --- Anti-Cheat: 화면 이탈 감지 ---
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && viewState === 'ranking_quiz') {
        setViewState('cheat_detected');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [viewState]);

  // 실전 모드 타이머
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (viewState === 'ranking_quiz') {
      timer = setInterval(() => setTimeElapsed(prev => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [viewState]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- API 호출 및 JSON 크래시 방어 로직 ---
  // 자유 연습장 (5제) 출제 트리거
  const handleGenerateFreePractice = async () => {
    if (!topic.trim()) return alert("키워드를 입력해주세요!");
    await fetchQuizData(topic, 'free', 'quiz');
  };

  // 실전 랭킹전/종합 시험 출제 트리거
  const handleStartRankingMatch = async (mode: 'ranking' | 'exam') => {
    if (selectedChapters.size === 0) return alert("출제할 단원을 최소 1개 이상 선택해주세요!");
    
    // 선택된 단원들의 promptDoc 믹스
    const combinedPrompt = Array.from(selectedChapters).map(id => {
      const chapter = currentSubjectChapters.find((c) => c.id === id);
      return chapter ? chapter.promptDoc : '';
    }).filter(Boolean).join(", ");

    const fullTopic = `${rankingSubject} 과목의 [${combinedPrompt}]`;
    setTimeElapsed(0);
    setExamAnswers({});
    setEssayResults({});
    await fetchQuizData(fullTopic, mode, 'ranking_quiz');
  };

  // 퀴즈 공통 Fetch 배관 및 예상치 못한 JSON 크래시 에러 완벽 쉴드
  const fetchQuizData = async (query: string, mode: string, nextState: 'quiz' | 'ranking_quiz') => {
    setViewState('loading');
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: query, mode }),
      });
      
      // 스크린샷 2, 3번 에러 대응: 원본 텍스트를 먼저 안전하게 수신
      const rawText = await response.text();
      
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (jsonErr) {
        console.error("수신된 원본 데이터 파싱 에러:", rawText);
        alert("🚨 구글 출제 엔진 서버의 응답 지연 또는 타임아웃이 발생했습니다.\n잠시 후 다시 시도해 주세요.");
        setViewState('dashboard');
        return;
      }
      
      if (data.success && data.questions) {
        if (mode === 'exam') {
          // 객관식 + 서술형 통합 병합 및 타입 캐스팅
          const objQuestions: Question[] = (data.questions.objective || []).map((q: any) => ({ ...q, type: 'objective' }));
          const essQuestions: Question[] = (data.questions.essay || []).map((q: any) => ({ ...q, type: 'essay' }));
          setQuestions([...objQuestions, ...essQuestions]);
        } else {
          // 자유/랭킹은 전부 객관식
          const unifiedQuestions: Question[] = data.questions.map((q: any) => ({ ...q, type: 'objective' }));
          setQuestions(unifiedQuestions);
        }

        setCurrentIndex(0);
        if (nextState === 'quiz') {
          setUserAnswers({});
          setIsAnswered(false);
          setCombo(0);
          setMaxCombo(0);
        }
        setViewState(nextState);
      } else {
        alert(data.error || "문제 생성에 실패했습니다.");
        setViewState('dashboard');
      }
    } catch (error) {
      console.error(error);
      alert("서버 통신 오류가 발생했습니다.");
      setViewState('dashboard');
    }
  };

  // --- 서술형 병렬 채점 파이프라인 ---
  const submitExam = async () => {
    const unanswered = questions.length - Object.keys(examAnswers).length;
    if (unanswered > 0) {
      if (!window.confirm(`아직 마킹하지 않은 문항이 ${unanswered}개 있습니다. 정말 OMR 답안을 최종 제출하시겠습니까?`)) return;
    }
    
    // 서술형 문제가 있다면 AI 채점관 호출 (Promise.all 병렬 처리)
    const essayIndexes = questions.map((q, idx) => q.type === 'essay' ? idx : -1).filter(idx => idx !== -1);
    
    if (essayIndexes.length > 0) {
      setViewState('exam_grading');
      try {
        const gradePromises = essayIndexes.map(async (idx) => {
          const q = questions[idx];
          const userAnswer = (examAnswers[idx] || "") as string;
          
          const res = await fetch('/api/grade-essay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              question: q.question,
              modelAnswer: q.modelAnswer,
              rubric: q.rubric,
              userAnswer: userAnswer
            })
          });
          const rawText = await res.text();
          const gradeData = JSON.parse(rawText);
          return { idx, score: gradeData.result.score, feedback: gradeData.result.feedback };
        });

        const results = await Promise.all(gradePromises);
        const newEssayResults: Record<number, { score: number, feedback: string }> = {};
        results.forEach(r => { newEssayResults[r.idx] = { score: r.score, feedback: r.feedback }; });
        
        setEssayResults(newEssayResults);
      } catch (err) {
        console.error(err);
        alert("채점 중 서버 에러가 발생했습니다. 임시 결과만 표시됩니다.");
      }
    }
    setViewState('exam_result');
  };

  // 종합 점수 산출 로직
  const calculateExamScores = () => {
    let objCorrect = 0;
    let objTotal = 0;
    let essayScoreSum = 0;
    let essayTotalMax = 0;

    questions.forEach((q, idx) => {
      if (q.type === 'objective') {
        objTotal++;
        if (examAnswers[idx] === q.answer) objCorrect++;
      } else {
        essayTotalMax += 5; // 문항당 5점 만점 기준
        if (essayResults[idx]) essayScoreSum += essayResults[idx].score;
      }
    });

    const objScore = objTotal > 0 ? (objCorrect / objTotal) * 80 : 0; // 80점 만점 환산
    const essScore = essayTotalMax > 0 ? (essayScoreSum / essayTotalMax) * 20 : 0; // 20점 만점 환산
    
    return {
      objScore: Math.round(objScore),
      essScore: Math.round(essScore),
      totalScore: Math.round(objScore + essScore)
    };
  };

  // --- 일반 이벤트 핸들러 ---
  // 1. 자유 연습장 핸들러 (듀오링고식 즉각 채점)
  const handleSelectOptionFree = (optionIndex: number) => {
    if (isAnswered) return; 
    setUserAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
    setIsAnswered(true);
    const isCorrect = optionIndex === questions[currentIndex].answer;
    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > maxCombo) setMaxCombo(newCombo);
    } else {
      setCombo(0);
    }
  };

  const handleNextQuestionFree = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswered(false);
    } else {
      setViewState('result');
    }
  };

  // 2. 실전 고사장 OMR 핸들러
  const handleMarkOMR = (val: number | string) => {
    setExamAnswers(prev => ({ ...prev, [currentIndex]: val }));
  };

  // 3. 단원 다중 선택 핸들러
  const toggleChapter = (id: string) => {
    const next = new Set(selectedChapters);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedChapters(next);
  };

  // 4. 대시보드 복귀
  const handleResetToDashboard = () => {
    setTopic('');
    setQuestions([]);
    setSelectedChapters(new Set());
    setViewState('dashboard');
  };
  
  // 자유 연습장용 점수 계산
  const getFreeScore = () => {
    return questions.filter((q, i) => q.answer === userAnswers[i]).length;
  };

  return (
    // [가시성 패치] 디자인 헌법: 스마트폰 뷰 (max-w-md mx-auto) 완벽 보존
    <div className="min-h-screen bg-theme-bg flex flex-col font-sans text-theme-text">
      <main className="flex-1 max-w-md mx-auto px-4 py-8 w-full relative">
        
        {/* =========================================
            View 1: 넷플릭스형 모드 선택 대시보드
            ========================================= */}
        {viewState === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-extrabold text-theme-text tracking-tight flex items-center justify-center gap-2">
                StudyMate <Bot className="w-8 h-8 text-blue-600" />
              </h1>
              <p className="text-theme-muted mt-2 text-sm">목표에 맞는 퀴즈 모드를 선택하세요!</p>
            </div>

            <div className="flex flex-col gap-5">
              {/* Card 1: 자유 연습장 */}
              <div onClick={() => setViewState('free_input')} className="bg-theme-surface rounded-2xl p-6 border border-theme-border cursor-pointer transition-all hover:bg-theme-bg active:scale-[0.98] shadow-sm flex items-center">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mr-4 shrink-0"><span className="text-2xl">⚡️</span></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-theme-text mb-1">자유 연습장</h3>
                  <p className="text-theme-muted text-xs leading-relaxed">스피드 퀴즈. 랭킹 무관.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              {/* Card 2: 실전 랭킹전 */}
              <div onClick={() => setViewState('ranking_setup')} className="bg-theme-surface rounded-2xl p-6 border border-theme-border cursor-pointer transition-all hover:bg-theme-bg active:scale-[0.98] shadow-sm flex items-center">
                <div className="w-14 h-14 bg-amber-50 rounded-xl flex items-center justify-center mr-4 shrink-0"><span className="text-2xl">🏆</span></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-theme-text mb-1">실전 랭킹전 <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">20제</span></h3>
                  <p className="text-theme-muted text-xs leading-relaxed">내신 표준. 하드코어 OMR 모드.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>

              {/* Card 3: 실전 종합 시험 (서술형 탑재) */}
              <div onClick={() => setViewState('exam_setup')} className="bg-gray-900 rounded-2xl p-6 border border-gray-800 cursor-pointer transition-all hover:bg-black active:scale-[0.98] shadow-md flex items-center">
                <div className="w-14 h-14 bg-gray-800 rounded-xl flex items-center justify-center mr-4 shrink-0"><span className="text-2xl">🚀</span></div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">실전 시험 대비 <span className="bg-theme-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold ml-1">25제</span></h3>
                  <p className="text-gray-400 text-xs leading-relaxed">서술형 포함 AI 종합 채점 모드.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {/* =========================================
            View 2: 랭킹전 & 종합시험 세팅 (CURRICULUM_DB 동적 바인딩)
            ========================================= */}
        {(viewState === 'ranking_setup' || viewState === 'exam_setup') && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
            <button onClick={handleResetToDashboard} className="flex items-center text-theme-muted hover:text-theme-text mb-6 font-medium text-sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> 대시보드로
            </button>
            <div className="bg-theme-surface rounded-2xl p-6 shadow-sm border border-theme-border">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${viewState === 'exam_setup' ? 'bg-blue-50' : 'bg-amber-50'}`}>
                <span className="text-2xl">{viewState === 'exam_setup' ? '🚀' : '🏆'}</span>
              </div>
              <h2 className="text-xl font-bold text-theme-text mb-2">{viewState === 'exam_setup' ? '실전 시험 (서술형 포함)' : '실전 랭킹전 (객관식)'} 설정</h2>
              <p className="text-theme-muted text-sm mb-6">출제할 과목과 단원들을 선택하세요. (다중 선택 가능)</p>
              
              <div className="space-y-5 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">📚 과목 선택</label>
                  <select 
                    value={rankingSubject} 
                    onChange={e => { setRankingSubject(e.target.value); setSelectedChapters(new Set()); }} 
                    className="w-full bg-theme-bg border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 font-bold"
                  >
                    {dbSubjects.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">📖 단원 믹스 (다중 선택)</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {currentSubjectChapters.map(chap => {
                      const isChecked = selectedChapters.has(chap.id);
                      return (
                        <div key={chap.id} onClick={() => toggleChapter(chap.id)} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-colors ${isChecked ? 'bg-blue-50 border-blue-400' : 'bg-theme-surface border-gray-200 hover:bg-theme-bg'}`}>
                          <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 ${isChecked ? 'bg-theme-primary' : 'border-2 border-gray-300'}`}>
                            {isChecked && <CheckCircle className="w-4 h-4 text-white" />}
                          </div>
                          <span className={`text-sm font-medium ${isChecked ? 'text-blue-900' : 'text-gray-700'}`}>{chap.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => handleStartRankingMatch(viewState === 'exam_setup' ? 'exam' : 'ranking')} 
                className="w-full bg-gray-900 hover:bg-black text-white px-6 py-4 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                ✍️ {viewState === 'exam_setup' ? '종합 시험지 인쇄 시작' : '랭킹전 시험지 인쇄 시작'}
              </button>
            </div>
          </div>
        )}

        {/* =========================================
            View 3: 통합 고사장 (OMR + Textarea, 보기 지문 context 완벽 지원)
            ========================================= */}
        {viewState === 'ranking_quiz' && questions.length > 0 && (
          <div className="animate-in slide-in-from-right-4 duration-300 pb-10">
            {/* 고사장 상단 정보 영역 */}
            <div className="flex items-center justify-between mb-6 bg-theme-surface p-4 rounded-2xl border border-theme-border shadow-sm">
              <div className="flex flex-col">
                <span className="text-xs text-gray-400 font-bold mb-1">{questions.length === 25 ? '실전 종합 시험' : '실전 랭킹전'}</span>
                <span className="text-sm font-bold text-gray-800">문항 <span className="text-blue-600">{currentIndex + 1}</span> / {questions.length}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-theme-bg px-3 py-1.5 rounded-lg border border-theme-border">
                <span className="text-lg">⏱️</span>
                <span className="font-mono font-bold text-gray-700">{formatTime(timeElapsed)}</span>
              </div>
            </div>

            {/* 문항 카드 */}
            <div className="bg-theme-surface rounded-2xl p-6 shadow-sm border border-theme-border mb-6 min-h-[300px]">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2 py-1 rounded text-xs font-bold ${questions[currentIndex].type === 'essay' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {questions[currentIndex].type === 'essay' ? '📝 서술형' : '📌 객관식'}
                </span>
              </div>
              
              {/* 질문 내용 (가시성 패치 보존) */}
              <h3 className="text-[15px] font-bold text-theme-text mb-4 leading-relaxed whitespace-pre-wrap font-mono break-words">
                {questions[currentIndex].question}
              </h3>
              
              {/* [🚨수정 완료] 객관식 사료 및 ㄱ, ㄴ, ㄷ 보기 상자 UI 탑재 */}
              {questions[currentIndex].context && (
                <div className="bg-theme-bg border border-gray-200 p-4 rounded-xl text-sm font-medium mb-5 whitespace-pre-wrap font-mono break-words text-gray-700 leading-relaxed shadow-inner">
                  {questions[currentIndex].context}
                </div>
              )}
              
              {/* Type 1: Objective (OMR 마킹) */}
              {questions[currentIndex].type === 'objective' && (
                <div className="space-y-3">
                  {questions[currentIndex].options?.map((opt, oIndex) => {
                    const isMarked = examAnswers[currentIndex] === oIndex;
                    return (
                      <button
                        key={oIndex}
                        onClick={() => handleMarkOMR(oIndex)}
                        className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-200 text-sm font-medium border-2 whitespace-pre-wrap font-mono break-words ${
                          isMarked ? 'bg-blue-50 border-blue-500 text-blue-800' : 'bg-theme-surface border-theme-border text-gray-600 hover:border-gray-300 hover:bg-theme-bg'
                        }`}
                      >
                        <span className={`inline-block align-middle w-6 h-6 text-center rounded-full mr-3 border ${isMarked ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 text-gray-400'}`}>
                          {oIndex + 1}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Type 2: Essay (직접 타이핑) */}
              {questions[currentIndex].type === 'essay' && (
                <div className="space-y-3">
                  <textarea
                    value={(examAnswers[currentIndex] as string) || ''}
                    onChange={(e) => handleMarkOMR(e.target.value)}
                    placeholder="2~3문장의 완성된 형태로 원인, 과정 등을 서술하세요."
                    className="w-full h-40 px-4 py-3 rounded-xl border-2 border-purple-200 bg-purple-50/30 focus:outline-none focus:border-purple-500 focus:bg-theme-bg resize-none text-sm leading-relaxed"
                  />
                </div>
              )}
            </div>

            {/* OMR 와리가리 네비게이션 */}
            <div className="flex justify-between items-center gap-3">
              <button 
                onClick={() => setCurrentIndex(prev => prev - 1)} disabled={currentIndex === 0}
                className="flex-1 bg-theme-surface border border-gray-200 text-gray-700 px-4 py-4 rounded-xl font-bold text-sm disabled:opacity-30 active:scale-[0.98] transition-all"
              >
                ← 이전
              </button>
              
              {currentIndex === questions.length - 1 ? (
                <button onClick={submitExam} className="flex-[2] bg-gray-900 text-white px-4 py-4 rounded-xl font-bold text-sm active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-sm">
                  🚀 최종 답안 제출
                </button>
              ) : (
                <button onClick={() => setCurrentIndex(prev => prev + 1)} className="flex-1 bg-theme-surface border border-gray-200 text-gray-700 px-4 py-4 rounded-xl font-bold text-sm active:scale-[0.98] transition-all">
                  다음 →
                </button>
              )}
            </div>
          </div>
        )}

        {/* =========================================
            View 4: 서술형 채점 로딩 뷰
            ========================================= */}
        {viewState === 'exam_grading' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-300">
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold ttext-theme-text mb-2">AI 서술형 채점 중...</h2>
            <p className="text-theme-muted text-sm text-center leading-relaxed">작성하신 답안의 논리와 키워드를<br/>수석 교사 수준으로 꼼꼼히 분석하고 있습니다.</p>
          </div>
        )}

        {/* =========================================
            View 5: OMR 오답 노트 & 성적표 리포트 (오답노트 context 완벽 연동)
            ========================================= */}
        {viewState === 'exam_result' && (
          <div className="animate-in zoom-in-95 duration-500 pb-12">
            {/* 상단 성적표 보드 */}
            <div className="bg-theme-surface rounded-2xl p-8 shadow-sm border border-theme-border text-center mb-6">
              <span className="text-4xl mb-4 block">📝</span>
              <h2 className="text-2xl font-bold text-theme-text mb-2">종합 성적표</h2>
              <p className="text-theme-muted text-sm mb-6">수고하셨습니다. 정밀 채점 리포트를 확인하세요.</p>
              
              {(() => {
                const scores = calculateExamScores();
                return (
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100 flex items-center justify-between">
                      <span className="font-bold text-blue-900">💯 총점 (100점 만점)</span>
                      <span className="text-3xl font-black text-blue-700">{scores.totalScore}점</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-theme-bg rounded-xl p-4 border border-theme-border">
                        <div className="text-xs text-theme-muted font-bold mb-1">객관식 (80점)</div>
                        <div className="text-xl font-bold text-theme-text">{scores.objScore}점</div>
                      </div>
                      <div className="bg-theme-bg rounded-xl p-4 border border-theme-border">
                        <div className="text-xs text-theme-muted font-bold mb-1">서술형 (20점)</div>
                        <div className="text-xl font-bold text-theme-text">{scores.essScore}점</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              <button onClick={handleResetToDashboard} className="w-full bg-gray-900 text-white px-6 py-4 rounded-xl font-bold text-sm active:scale-[0.98] transition-all">
                대시보드로 돌아가기
              </button>
            </div>

            {/* 문항별 상세 OMR 오답 노트 (가시성 패치 보존) */}
            <h3 className="text-lg font-bold text-theme-text mb-4 px-2 flex items-center gap-2">🔍 문항별 상세 오답 노트</h3>
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const isObj = q.type === 'objective';
                const uAnswer = examAnswers[idx];
                const isCorrectObj = isObj && uAnswer === q.answer;
                
                return (
                  <div key={idx} className={`bg-theme-surface rounded-2xl p-5 border shadow-sm ${isObj ? (isCorrectObj ? 'border-green-200 bg-green-50/10' : 'border-red-200 bg-red-50/10') : 'border-purple-200 bg-purple-50/10'}`}>
                    
                    {/* 오답 노트: 문항 제목 */}
                    <div className="flex items-start gap-3 mb-3">
                      {isObj ? (
                        isCorrectObj ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      ) : (
                        <span className="text-lg shrink-0 mt-0.5">📝</span>
                      )}
                      <h4 className="text-[14px] font-bold text-theme-text leading-relaxed whitespace-pre-wrap font-mono break-words">
                        <span className="text-theme-muted mr-1">{idx + 1}.</span> {q.question}
                      </h4>
                    </div>

                    {/* [🚨수정 완료] 오답 노트 목록 지문/자료 보기 박스 완벽 보존 */}
                    {q.context && (
                      <div className="ml-8 bg-theme-bg border border-theme-border p-4 rounded-xl text-xs text-gray-700 mb-3 whitespace-pre-wrap font-mono break-words shadow-inner leading-relaxed">
                        {q.context}
                      </div>
                    )}

                    {/* 오답 노트: 객관식 보기 영역 */}
                    {isObj && (
                      <div className="pl-8 space-y-2 mb-3">
                        {q.options?.map((opt, oIdx) => {
                          let style = "text-theme-muted opacity-60 text-xs";
                          if (oIdx === q.answer) style = "text-green-700 font-bold bg-green-100 px-2 py-1 rounded text-xs shadow-sm"; 
                          else if (uAnswer === oIdx && !isCorrectObj) style = "text-red-600 line-through text-xs"; 
                          return <div key={oIdx} className={`whitespace-pre-wrap font-mono break-words ${style}`}>{oIdx + 1}) {opt}</div>;
                        })}
                      </div>
                    )}

                    {/* 오답 노트: 서술형 채점 영역 */}
                    {!isObj && (
                      <div className="pl-8 space-y-3 mb-3 text-[13px]">
                        <div className="bg-theme-bg p-3 rounded-lg border border-theme-border">
                          <span className="font-bold text-gray-700 block mb-1">나의 답안:</span>
                          <span className="text-gray-600 whitespace-pre-wrap leading-relaxed">{uAnswer || '미응시'}</span>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-100">
                          <span className="font-bold text-purple-900 block mb-1">모범 답안:</span>
                          <span className="text-purple-700 whitespace-pre-wrap leading-relaxed">{q.modelAnswer}</span>
                        </div>
                        <div className="flex gap-2 flex-wrap mt-1">
                          {q.rubric?.map(k => <span key={k} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[11px] font-bold"># {k}</span>)}
                        </div>
                      </div>
                    )}

                    {/* 오답 노트: 해설 및 AI 피드백 박스 */}
                    <div className="ml-8 bg-theme-bg p-3 rounded-xl border border-gray-200 text-[13px] text-gray-700">
                      <span className="font-bold text-blue-600 mr-1">💡 해설:</span>
                      <span className="whitespace-pre-wrap leading-relaxed font-mono text-[12px] break-words">
                        {isObj ? q.explanation : essayResults[idx]?.feedback}
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================
            View 6: 부정행위 감지 (Anti-Cheat)
            ========================================= */}
        {viewState === 'cheat_detected' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in zoom-in-95 duration-300 text-center px-4">
            <span className="text-6xl mb-6">🚨</span>
            <h2 className="text-2xl font-black text-red-600 mb-3">부정행위 감지!</h2>
            <p className="text-gray-600 text-sm bg-red-50 p-4 rounded-xl border border-red-100 mb-8 leading-relaxed">
              시험 도중 <b>화면 이탈</b>이 감지되어 <b>0점 처리</b> 되었습니다.<br/>정정당당하게 실력으로 승부하세요.
            </p>
            <button onClick={handleResetToDashboard} className="w-full bg-gray-900 text-white px-6 py-4 rounded-xl font-bold text-sm active:scale-[0.98] transition-all">대시보드로 돌아가기</button>
          </div>
        )}

        {/* =========================================
            View 7: 자유 연습장 키워드 입력 화면
            ========================================= */}
        {viewState === 'free_input' && (
          <div className="animate-in fade-in zoom-in-95 duration-300 mt-6">
            <button onClick={handleResetToDashboard} className="flex items-center text-theme-muted hover:text-theme-text mb-6 font-medium text-sm">
              <ArrowLeft className="w-4 h-4 mr-1" /> 모드 선택으로
            </button>
            <div className="bg-theme-surface rounded-2xl p-8 shadow-sm border border-theme-border text-center">
              <span className="text-4xl mb-4 block">⚡️</span>
              <h2 className="text-xl font-bold text-theme-text mb-2">자유 연습장</h2>
              <p className="text-theme-muted text-sm mb-6">단원명이나 키워드를 입력하면, AI가 스피드 퀴즈를 세팅합니다.</p>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateFreePractice()}
                placeholder="예) 삼국의 통일 과정..." 
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-400 mb-4 text-sm font-medium"
              />
              <button onClick={handleGenerateFreePractice} className="w-full bg-theme-primary hover:bg-blue-700 text-white px-6 py-4 rounded-xl font-bold text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <Bot className="w-5 h-5" /> 퀴즈 출제
              </button>
            </div>
          </div>
        )}

        {/* =========================================
            View 8: 출제 로딩 뷰
            ========================================= */}
        {viewState === 'loading' && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-300">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-theme-text mb-2">출제 위원 소집 중...</h2>
            <p className="text-theme-muted text-sm text-center leading-relaxed">요청하신 내용에 맞추어 고품격 문제를 생성하고 있습니다.<br />최대 15초가 소요될 수 있습니다.</p>
          </div>
        )}

        {/* =========================================
            View 9: 자유 연습장 퀴즈 풀이 (지문 context 완벽 연동)
            ========================================= */}
        {viewState === 'quiz' && questions.length > 0 && (
          <div className="animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex-1 mr-4">
                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-500 rounded-full" 
                    style={{ width: `${(currentIndex / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className={`flex items-center gap-1 font-bold text-sm ${combo > 1 ? 'text-orange-500' : 'text-gray-400'}`}>
                🔥 {combo}
              </div>
            </div>

            <div className="bg-theme-surface rounded-2xl p-6 shadow-sm border border-theme-border">
              {/* 질문 내용 */}
              <h3 className="text-[15px] font-bold text-theme-text mb-4 leading-relaxed whitespace-pre-wrap font-mono break-words">
                <span className="text-blue-600 mr-1.5">Q{currentIndex + 1}.</span> {questions[currentIndex].question}
              </h3>

              {/* [🚨수정 완료] 자유 연습장 모드 보기 지문 box 연동 */}
              {questions[currentIndex].context && (
                <div className="bg-theme-bg border border-gray-200 p-4 rounded-xl text-sm font-medium mb-4 whitespace-pre-wrap font-mono break-words text-gray-700 leading-relaxed shadow-inner">
                  {questions[currentIndex].context}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3">
                {questions[currentIndex].options?.map((opt, oIndex) => {
                  const isSelected = userAnswers[currentIndex] === oIndex;
                  const isCorrectAnswer = questions[currentIndex].answer === oIndex;
                  let btnStyle = "bg-theme-surface border border-gray-200 text-gray-700 hover:bg-theme-bg";
                  if (isAnswered) {
                    if (isCorrectAnswer) btnStyle = "bg-green-100 border-green-500 text-green-800 font-bold border-2"; 
                    else if (isSelected) btnStyle = "bg-red-50 border-red-400 text-red-700 border-2"; 
                    else btnStyle = "bg-theme-bg border-theme-border text-gray-400 opacity-50"; 
                  }
                  return (
                    <button key={oIndex} disabled={isAnswered} onClick={() => handleSelectOptionFree(oIndex)} className={`text-left px-5 py-4 rounded-xl text-sm transition-all whitespace-pre-wrap font-mono break-words ${btnStyle}`}>
                      {oIndex + 1}) {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {isAnswered && (
              <div className={`mt-4 p-5 rounded-2xl border flex flex-col gap-4 animate-in slide-in-from-bottom-2 ${userAnswers[currentIndex] === questions[currentIndex].answer ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div>
                  <div className="font-bold text-lg mb-1 flex items-center gap-2">
                    {userAnswers[currentIndex] === questions[currentIndex].answer ? <span className="text-green-600">✅ 정답!</span> : <span className="text-red-600">❌ 오답</span>}
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed font-medium whitespace-pre-wrap font-mono break-words">💡 {questions[currentIndex].explanation}</p>
                </div>
                <button onClick={handleNextQuestionFree} className={`py-3 rounded-xl font-bold text-white text-sm transition-all active:scale-[0.98] ${userAnswers[currentIndex] === questions[currentIndex].answer ? 'bg-green-600' : 'bg-red-600'}`}>
                  {currentIndex < questions.length - 1 ? '다음 문제' : '결과 보기'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================
            View 10: 자유 연습장 결과
            ========================================= */}
        {viewState === 'result' && (
          <div className="text-center animate-in zoom-in-95 duration-500 mt-6">
            <div className="bg-theme-surface rounded-2xl p-8 shadow-sm border border-theme-border">
              <span className="text-4xl mb-4 block">🎉</span>
              <h2 className="text-2xl font-bold text-theme-text mb-2">훈련 완료</h2>
              <div className="grid grid-cols-2 gap-3 mb-6 mt-6">
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <div className="text-xs text-blue-600 font-bold mb-1">점수</div>
                  <div className="text-2xl font-black text-blue-900">{getFreeScore()}/{questions.length}</div>
                </div>
                <div className="bg-theme-bg rounded-xl p-4">
                  <div className="text-xs text-orange-600 font-bold mb-1">최대 콤보</div>
                  <div className="text-2xl font-black text-orange-900 flex justify-center items-center gap-1">🔥 {maxCombo}</div>
                </div>
              </div>
              <button onClick={() => setViewState('free_input')} className="w-full bg-theme-primary hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-sm mb-2 active:scale-[0.98] transition-all">다른 주제 풀기</button>
              <button onClick={handleResetToDashboard} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-xl font-bold text-sm active:scale-[0.98] transition-all">대시보드로</button>
            </div>
          </div>
        )}

        {/* =========================================
            모달: 준비 중 알림 (미래 확장 대비용 쉴드)
            ========================================= */}
        {showComingSoon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-theme-surface rounded-2xl p-6 max-w-sm w-full shadow-lg relative text-center">
              <span className="text-4xl mb-4 block">🚧</span>
              <h3 className="text-lg font-bold text-theme-text mb-2">업데이트 준비 중</h3>
              <p className="text-theme-muted text-sm mb-6">해당 모드는 다음 시즌에 오픈됩니다.</p>
              <button onClick={() => setShowComingSoon(false)} className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-xl text-sm transition-all">확인</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}