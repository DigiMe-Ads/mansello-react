"use client";

import { useEffect, useState } from "react";

export interface Countdown {
  minutes: number;
  seconds: number;
  totalSeconds: number;
  expired: boolean;
}

export function useCountdown(targetIso: string | null | undefined): Countdown {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetIso) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  if (!targetIso) return { minutes: 0, seconds: 0, totalSeconds: 0, expired: false };

  const remainingMs = new Date(targetIso).getTime() - now;
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));

  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
    expired: remainingMs <= 0,
  };
}
