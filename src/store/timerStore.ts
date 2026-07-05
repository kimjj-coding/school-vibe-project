import { create } from 'zustand';

interface TimerState {
  time: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
}

export const useTimerStore = create<TimerState>((set) => ({
  time: 0,
  isRunning: false,
  start: () => set({ isRunning: true }),
  pause: () => set({ isRunning: false }),
  reset: () => set({ time: 0, isRunning: false }),
  tick: () => set((state) => ({ time: state.time + 1 })),
}));
