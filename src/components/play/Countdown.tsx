"use client";

import { useEffect, useState } from "react";

// Décompte 3 → 2 → 1 → GO, chaque étape apparaît petit puis grossit en fade/blur.
// Appelle onDone 1500ms après l'affichage de "GO".
export function Countdown({ onDone }: { onDone: () => void }) {
  const steps = ["3", "2", "1", "GO"];
  const [i, setI] = useState(0);

  useEffect(() => {
    if (i >= steps.length) return;
    const isLast = i === steps.length - 1;
    // Chaque chiffre reste ~900ms ; après "GO", on attend 1500ms puis onDone.
    const delay = isLast ? 1500 : 900;
    const timer = setTimeout(() => {
      if (isLast) {
        onDone();
      } else {
        setI((v) => v + 1);
      }
    }, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <span
        key={i}
        className="countdown-num font-display font-black uppercase text-white drop-shadow-[0_4px_30px_rgba(11,4,20,0.5)]"
      >
        {steps[i]}
      </span>
    </div>
  );
}