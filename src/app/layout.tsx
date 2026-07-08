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
    <html lang="ko" data-theme="light">
      {/* 💡 bg-white 강제 고정 제거 및 테마 변수(bg-theme-bg) 적용 */}
      <body className="bg-theme-bg text-theme-text min-h-screen pb-20 font-sans antialiased transition-colors duration-300">
        <main className="max-w-md mx-auto min-h-screen">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}