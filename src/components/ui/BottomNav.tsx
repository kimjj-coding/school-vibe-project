'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Timer, Bot, Settings } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { label: '홈', icon: Home, path: '/' },
    { label: '타이머', icon: Timer, path: '/timer' },
    { label: 'AI 퀴즈', icon: Bot, path: '/quiz' },
    { label: '설정', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] z-40">
      <div className="max-w-md mx-auto flex justify-around items-center h-16 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center justify-center w-12 h-12 transition-all active:scale-95"
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-600 stroke-[2.5px]' : 'text-gray-400 stroke-[2px]'}`} />
              <span className={`text-[11px] mt-1 font-semibold ${isActive ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
