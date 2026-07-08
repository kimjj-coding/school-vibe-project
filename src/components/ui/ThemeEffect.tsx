'use client';

import React, { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/themeStore';

interface Particle {
  id: number;
  char: string;
  left: string;
  delay: string;
  duration: string;
  size: string;
}

export default function ThemeEffect() {
  const { theme } = useThemeStore();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // 기본 테마일 때는 아무것도 떨어뜨리지 않음
    if (theme === 'default') {
      setParticles([]);
      return;
    }

    // 테마별로 떨어질 시그니처 이모지 매핑
    let emoji = '🌸';
    if (theme === 'alien') emoji = '👽';
    if (theme === 'maple') emoji = '🍁';
    if (theme === 'snow') emoji = '❄️';

    // 총 15개의 파티클을 랜덤하게 생성하여 뿌림 (과하면 렉걸리니까 딱 세련될 정도로만!)
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      char: emoji,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 8}s`,
      duration: `${6 + Math.random() * 8}s`,
      size: `${12 + Math.random() * 16}px`,
    }));

    setParticles(newParticles);
  }, [theme]);

  return (
    <>
      {particles.map((p) => (
        <span
          key={p.id}
          className="falling-particle"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: p.size,
          }}
        >
          {p.char}
        </span>
      ))}
    </>
  );
}