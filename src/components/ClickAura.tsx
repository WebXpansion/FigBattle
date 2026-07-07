"use client";

import { useEffect, useState } from "react";

const AURA_IMAGES = [
  "/curseur/1_curseur.webp",
  "/curseur/2_curseur.webp",
  "/curseur/3_curseur.webp",
  "/curseur/4_curseur.webp",
  "/curseur/5_curseur.webp",
  "/curseur/6_curseur.webp",
];
type ClickBurst = {
    id: number;
    x: number;
    y: number;
    image: string;
  };
  
  let nextId = 0;
  
  // Effet global : à chaque clic, une aura blanche apparaît à l'endroit du clic,
  // grossit puis disparaît en 500ms. Un nouveau clic remplace instantanément
  // l'aura précédente (une seule à la fois, jamais d'empilement).
  export function ClickAura() {
    const [burst, setBurst] = useState<ClickBurst | null>(null);
  
    useEffect(() => {
      function handleClick(e: MouseEvent) {
        const image = AURA_IMAGES[Math.floor(Math.random() * AURA_IMAGES.length)];
        setBurst({ id: nextId++, x: e.clientX, y: e.clientY, image });
      }
  
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }, []);
  
    if (!burst) return null;
  
    return (
      <img
        // La key force un remount à chaque clic : l'animation CSS repart
        // toujours de zéro, même si on reclique au même endroit avec la même image.
        key={burst.id}
        src={burst.image}
        alt=""
        aria-hidden="true"
        onAnimationEnd={() => setBurst(null)}
        className="click-aura-burst pointer-events-none fixed z-[9999] h-16 w-16"
        style={{ left: burst.x, top: burst.y }}
      />
    );
  }