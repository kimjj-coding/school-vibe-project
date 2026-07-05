'use client';

import { useState } from 'react';
import { Bot, CheckCircle, XCircle, RefreshCw, Loader2, ChevronRight } from 'lucide-react';

// 문제 타입 정의
interface Question {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export default function AiTestCard() {
  const [topic, setTopic] = useState('');
  const [quizState, setQuizState] = useState<'input' | 'loading' | 'quiz' | 'result'>('input');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});

  // 1. API 호출 함수
  const handleGenerate = async () => {
    if (!topic.trim()) return alert("공부한 단원이나 키워드를 입력해주세요!");
    
    setQuizState('loading');
    
    try {
      const response = await fetch(window.location.origin + '/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      const data = await response.json();
      
      if (data.success && data.questions) {
        setQuestions(data.questions);
        setQuizState('quiz');
      } else {
        alert(data.error || "문제 생성에 실패했습니다.");
        setQuizState('input');
      }
    } catch (error) {
      console.error(error);
      alert("서버와 통신 중 오류가 발생했습니다.");
      setQuizState('input');
    }
  };

  // 2. 답안 선택 핸들러
  const handleSelectOption = (qIndex: number, optionIndex: number) => {
    setUserAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
  };

  // 3. 제출 및 채점
  const handleSubmit = () => {
    if (Object.keys(userAnswers).length < questions.length) {
      alert("모든 문제를 풀어주세요!");
      return;
    }
    setQuizState('result');
  };

  // 4. 초기화
  const handleReset = () => {
    setTopic('');
    setQuestions([]);
    setUserAnswers({});
    setQuizState('input');
  };

  // 점수 계산
  const getScore = () => {
    return questions.filter((q, i) => q.answer === userAnswers[i]).length;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex flex-col md:col-span-2 lg:col-span-3 hover:shadow-md transition-shadow">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
          <Bot className="w-5 h-5 text-purple-500" />
          AI 맞춤형 퀴즈 봇
        </h2>
        {quizState === 'result' && (
          <span className="text-sm font-bold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
            점수: {getScore()} / {questions.length}
          </span>
        )}
      </div>

      {/* State 1: Input (주제 입력) */}
      {quizState === 'input' && (
        <div className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50/50 to-blue-50 p-6 rounded-xl border border-purple-100 gap-4">
          <div className="flex-1 w-full text-center md:text-left space-y-3">
            <h3 className="font-bold text-purple-900 text-lg">어떤 내용을 복습할까요?</h3>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="예) 조선의 건국, 뉴턴의 운동 법칙, 이차방정식..." 
              className="w-full px-4 py-3 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white shadow-inner"
            />
          </div>
          <button onClick={handleGenerate} className="w-full md:w-auto md:mt-10 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 whitespace-nowrap">
            <Bot className="w-5 h-5" /> 문제 생성하기
          </button>
        </div>
      )}

      {/* State 2: Loading (생성 중) */}
      {quizState === 'loading' && (
        <div className="flex flex-col items-center justify-center p-10 bg-purple-50/50 rounded-xl border border-purple-100 space-y-4">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          <p className="text-purple-900 font-semibold text-center">
            AI가 맞춤형 문제를 출제하고 있습니다...<br/>
            <span className="text-sm text-purple-600 font-normal">학생 수준에 맞는 문제를 고르는 중이에요!</span>
          </p>
        </div>
      )}

      {/* State 3: Quiz View (문제 풀이) */}
      {quizState === 'quiz' && (
        <div className="space-y-6">
          <div className="bg-purple-50/50 rounded-xl p-6 border border-purple-100 space-y-8">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="space-y-3">
                <h3 className="font-bold text-gray-800 text-lg flex items-start gap-2">
                  <span className="text-purple-600">Q{qIndex + 1}.</span> {q.question}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                  {q.options.map((opt, oIndex) => (
                    <button
                      key={oIndex}
                      onClick={() => handleSelectOption(qIndex, oIndex)}
                      className={`text-left px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                        userAnswers[qIndex] === oIndex 
                          ? 'bg-purple-600 border-purple-600 text-white shadow-md' 
                          : 'bg-white border-gray-200 text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      {oIndex + 1}) {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all active:scale-[0.98] shadow-sm flex items-center gap-2">
              제출하고 채점하기 <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* State 4: Result View (채점 결과 및 해설) */}
      {quizState === 'result' && (
        <div className="space-y-6">
          <div className="bg-purple-50/50 rounded-xl p-6 border border-purple-100 space-y-8">
            {questions.map((q, qIndex) => {
              const isCorrect = userAnswers[qIndex] === q.answer;
              return (
                <div key={qIndex} className="space-y-3">
                  <h3 className="font-bold text-lg flex items-start gap-2">
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <span className="text-gray-800">{q.question}</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
                    {q.options.map((opt, oIndex) => {
                      let btnClass = "bg-white border-gray-200 text-gray-500 opacity-60"; // 기본
                      if (oIndex === q.answer) btnClass = "bg-green-100 border-green-500 text-green-800 font-bold border-2 shadow-sm"; // 정답
                      else if (userAnswers[qIndex] === oIndex && !isCorrect) btnClass = "bg-red-50 border-red-400 text-red-700 border-2"; // 틀린 선택
                      
                      return (
                        <div key={oIndex} className={`px-4 py-3 rounded-xl border text-sm ${btnClass}`}>
                          {oIndex + 1}) {opt}
                        </div>
                      );
                    })}
                  </div>
                  <div className="pl-8 pt-2">
                    <div className="bg-white p-4 rounded-xl border border-blue-100 text-sm text-blue-800">
                      <strong className="text-blue-600 mr-2">💡 해설:</strong>{q.explanation}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center">
            <button onClick={handleReset} className="bg-gray-800 hover:bg-gray-900 text-white px-8 py-3 rounded-xl font-bold transition-all active:scale-[0.98] shadow-sm flex items-center gap-2">
              <RefreshCw className="w-5 h-5" /> 다른 주제로 다시 풀기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
