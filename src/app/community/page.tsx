'use client';

import React, { useState } from 'react';
import { MessageSquare, Heart, MessageCircle, PenTool, Sparkles, FireExtinguisher } from 'lucide-react';

interface PostMock {
  id: number;
  author: string;
  content: string;
  time: string;
  likes: number;
  comments: number;
  tag?: string;
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<PostMock[]>([
    {
      id: 1,
      author: '풍양중 2학년 익명',
      content: '얘들아 오늘 과학 화학식 시험 범위 소단원 3단원까지 맞지? H2O 하첨자 깨지는거 정리본 볼 사람 구함',
      time: '10분 전',
      likes: 12,
      comments: 4,
      tag: '🔥 공부인증'
    },
    {
      id: 2,
      author: '스마트 중딩',
      content: 'StudyMate 공부 시계 켜놓고 유튜브 숏츠 보다가 딴짓 감지 모달 떠서 심장 떨어질 뻔했네ㅋㅋㅋ 안티치트 기능 성능 짱좋음',
      time: '1시간 전',
      likes: 24,
      comments: 7,
      tag: '✨ 리얼후기'
    }
  ]);

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col font-sans text-theme-text pb-20">
      <main className="flex-1 max-w-md mx-auto px-4 py-6 w-full space-y-4">
        
        {/* 헤더 안내 바 */}
        <div className="py-2 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-theme-text tracking-tight">💬 풍양중 스페이스</h1>
            <p className="text-xs text-theme-muted mt-0.5">우리 학교 학생들끼리 자유롭게 소통하는 커뮤니티</p>
          </div>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse">
            <Sparkles className="w-3 h-3 fill-blue-700" /> 로컬 개발 모드
          </span>
        </div>

        {/* 모의 글쓰기 트리거 폼 */}
        <div className="bg-theme-surface rounded-2xl p-4 border  border-theme-bordershadow-sm space-y-3">
          <textarea 
            placeholder="오늘 학업 질문이나 자유로운 이야기를 익명으로 남겨보세요..."
            className="w-full text-xs bg-theme-bg rounded-xl p-3 border-none focus:outline-none focus:ring-1 focus:ring-blue-500/30 resize-none h-16 text-gray-700 font-medium"
            disabled
          />
          <div className="flex justify-between items-center pt-1">
            <span className="text-[10px] text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
              🔒 로그인 후 작성 가능 (준비 중)
            </span>
            <button className="bg-theme-primary text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 opacity-60 cursor-not-allowed">
              <PenTool className="w-3.5 h-3.5" /> 글쓰기
            </button>
          </div>
        </div>

        {/* 게시글 리스트 스트림 */}
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-theme-surface rounded-2xl p-5 border border-theme-bordershadow-sm space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-black">
                    풍
                  </div>
                  <div>
                    <span className="text-xs font-black text-gray-800 block">{post.author}</span>
                    <span className="text-[9px] text-gray-400 font-medium">{post.time}</span>
                  </div>
                </div>
                {post.tag && (
                  <span className="text-[9px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-bold">
                    {post.tag}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-700 leading-relaxed font-semibold">
                {post.content}
              </p>

              <div className="pt-2 border-t border-gray-50 flex items-center gap-4 text-gray-400">
                <button className="flex items-center gap-1 text-[11px] font-bold hover:text-red-500 transition-colors">
                  <Heart className="w-4 h-4" /> {post.likes}
                </button>
                <button className="flex items-center gap-1 text-[11px] font-bold hover:text-blue-500 transition-colors">
                  <MessageCircle className="w-4 h-4" /> {post.comments}
                </button>
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}