"use client";

import { useEffect, useState } from "react";

function getRemaining(targetIso: string) {
  const diffMs = new Date(targetIso).getTime() - Date.now();
  const clampedMs = Math.max(diffMs, 0);
  const totalMinutes = Math.floor(clampedMs / 60000);
  return {
    days: Math.floor(totalMinutes / (60 * 24)),
    hours: Math.floor((totalMinutes % (60 * 24)) / 60),
    minutes: totalMinutes % 60,
  };
}

export function RewardsCountdown({
  targetIso,
  label,
  dayShort,
  hourShort,
  minuteShort,
}: {
  targetIso: string;
  label: string;
  dayShort: string;
  hourShort: string;
  minuteShort: string;
}) {
  // Calculée à partir d'une date fixe (REWARDS_DRAW_AT) : ne se réinitialise
  // jamais au refresh, seul le temps réel qui passe la fait avancer.
  const [remaining, setRemaining] = useState(() => getRemaining(targetIso));

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(targetIso)), 1000);
    return () => clearInterval(id);
  }, [targetIso]);

  return (
<div className="text-left sm:text-right">
      <p className="font-display text-xs font-black uppercase tracking-wide text-white/60 sm:text-sm">
        {label}
      </p>
      <p className="whitespace-nowrap pt-2 font-mono text-3xl font-black text-white sm:text-5xl">
        {remaining.days}
        <span className="text-sm font-normal text-white/50 sm:text-base">
          {dayShort}
        </span>
        <span className="mx-1 text-white/30">:</span>
        {remaining.hours}
        <span className="text-sm font-normal text-white/50 sm:text-base">
          {hourShort}
        </span>
        <span className="mx-1 text-white/30">:</span>
        {remaining.minutes}
        <span className="text-sm font-normal text-white/50 sm:text-base">
          {minuteShort}
        </span>
      </p>
    </div>
  );
}