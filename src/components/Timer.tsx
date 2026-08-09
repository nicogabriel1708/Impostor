import React, { useEffect, useState } from 'react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface TimerProps {
  endsAt: number | null;
  className?: string;
  onExpire?: () => void;
}

export function Timer({ endsAt, className, onExpire }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!endsAt) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && onExpire) {
        onExpire();
      }
    };

    tick();
    const interval = setInterval(tick, 100); // 100ms for smooth updates
    return () => clearInterval(interval);
  }, [endsAt, onExpire]);

  if (!endsAt) return null;

  const isUrgent = timeLeft <= 5 && timeLeft > 0;

  return (
    <motion.div 
      className={cn(
        "font-mono font-black text-xl tabular-nums rounded-[20px] px-4 py-2 inline-flex items-center justify-center border-4 shadow-inner",
        isUrgent ? "text-pink-500 border-pink-200 bg-white" : "text-yellow-400 border-indigo-400 bg-indigo-800/50",
        className
      )}
      animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
      transition={isUrgent ? { repeat: Infinity, duration: 1 } : {}}
    >
      {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
    </motion.div>
  );
}
