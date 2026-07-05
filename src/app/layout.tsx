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
    // 🔥 프로의 3중 잠금 장치: 클래스 + 데이터속성 + 브라우저 엔진 스타일 강제 고정
    <html lang="ko" className="light" data-theme="light" style={{ colorScheme: 'light' }}>
      <body className="bg-white text-gray-900 min-h-screen pb-20 font-sans antialiased">
        <main className="max-w-md mx-auto min-h-screen bg-white">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
