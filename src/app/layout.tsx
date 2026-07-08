import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "../components/ui/BottomNav";

export const metadata: Metadata = {
  title: "StudyMate",
  description: "나만의 육각형 학교 생활 메이트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body 
        className="min-h-screen font-sans antialiased transition-colors duration-300"
        style={{ backgroundColor: 'var(--bg-app)' }}
      >
        {/* 절대 터지지 않는 강철 가두리 모바일 프레임 */}
        <main 
          className="max-w-md mx-auto min-h-screen relative pb-24 shadow-[0_0_30px_rgba(0,0,0,0.03)] transition-colors duration-300"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          {children}
          
          {/* 하단 네비게이션 바 고정 */}
          <BottomNav />
        </main>
      </body>
    </html>
  );
}