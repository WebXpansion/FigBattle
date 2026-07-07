"use client";

import { useEffect, useRef } from "react";

// Curseur custom "verre dépoli" : remplace le curseur système par un élément
// HTML qui suit la souris, avec un vrai backdrop-blur (impossible avec un
// curseur natif classique, qui n'est qu'une image statique).
// Désactivé sur tactile (pointer: coarse) où il n'y a pas de souris.
export function CustomCursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;

    document.documentElement.classList.add("custom-cursor-active");

    function handleMove(e: MouseEvent) {
      const el = ref.current;
      if (!el) return;
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      if (el.style.opacity !== "1") el.style.opacity = "1";
    }

    document.addEventListener("mousemove", handleMove);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, []);

  return <div ref={ref} className="custom-cursor" aria-hidden="true" />;
}