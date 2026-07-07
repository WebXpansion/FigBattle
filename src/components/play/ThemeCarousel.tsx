"use client";

import { useEffect, useRef } from "react";

export type CarouselTheme = {
  id: string;
  label: string;
  category: "ECOMMERCE" | "SAAS" | "PORTFOLIO" | "BLOG" | "MOBILE";
};


const CATEGORY = {
  ECOMMERCE: { icon: "shoe" },
  SAAS: { icon: "chart" },
  PORTFOLIO: { icon: "camera" },
  BLOG: { icon: "pen" },
  MOBILE: { icon: "phone" },
} as const;

// Icônes simples (chemins SVG) par catégorie.
const ICONS: Record<string, string> = {
  shoe: `<path d="M20 62 L20 44 C20 42 22 41 24 42 L34 48 C40 51 48 52 56 52 L78 52 C81 52 82 54 82 57 L82 62 Z" stroke="INK" stroke-width="3" fill="none" stroke-linejoin="round"/><path d="M24 44 L30 38" stroke="INK" stroke-width="3" stroke-linecap="round"/>`,
  chart: `<path d="M26 70 L26 30 M26 70 L74 70" stroke="INK" stroke-width="3.5" stroke-linecap="round"/><rect x="34" y="50" width="9" height="16" fill="INK"/><rect x="48" y="40" width="9" height="26" fill="INK"/><rect x="62" y="32" width="9" height="34" fill="INK"/>`,
  camera: `<rect x="24" y="38" width="52" height="34" rx="5" stroke="INK" stroke-width="3.2" fill="none"/><circle cx="50" cy="55" r="10" stroke="INK" stroke-width="3.2" fill="none"/><path d="M38 38 L42 32 L58 32 L62 38" stroke="INK" stroke-width="3.2" fill="none" stroke-linejoin="round"/>`,
  pen: `<path d="M30 70 L34 56 L62 28 L72 38 L44 66 Z" stroke="INK" stroke-width="3.2" fill="none" stroke-linejoin="round"/><path d="M58 32 L68 42" stroke="INK" stroke-width="3.2"/>`,
  phone: `<rect x="36" y="26" width="28" height="48" rx="5" stroke="INK" stroke-width="3.2" fill="none"/><circle cx="50" cy="67" r="2.4" fill="INK"/><path d="M45 32 L55 32" stroke="INK" stroke-width="3" stroke-linecap="round"/>`,
};

function iconSVG(category: keyof typeof CATEGORY) {
  const c = CATEGORY[category];
  const icon = ICONS[c.icon].replaceAll("INK", "rgba(255,255,255,0.85)");
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
    <g>${icon}</g>
  </svg>`;
}

const CARD_W = 300;
const GAP = 64;
const STEP = CARD_W + GAP;
const COPIES = 5; // assez de copies pour remplir et boucler

export function ThemeCarousel({
  themes,
  winnerIndex,
  onSettled,
  revealed = true,
}: {
  themes: CarouselTheme[];
  winnerIndex: number | null;
  onSettled?: () => void;
  revealed?: boolean;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef(0);
  const stateRef = useRef({ off: 0, vel: 0, settling: false, settled: false });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || themes.length === 0) return;

    const TOTAL = themes.length * COPIES;
    const LOOP = themes.length * STEP;

    // Construit les cartes une fois.
    rail.innerHTML = "";
    const cards: { el: HTMLDivElement; base: number; index: number }[] = [];
    for (let i = 0; i < TOTAL; i++) {
      const t = themes[i % themes.length];
      const el = document.createElement("div");
      el.className = "tc-card";
      el.innerHTML = `<div class="tc-glass"><div class="tc-icon">${iconSVG(t.category)}</div><div class="tc-title">${t.label}</div></div>`;
      rail.appendChild(el);
      cards.push({ el, base: i * STEP, index: i % themes.length });
    }

    const st = stateRef.current;
    st.off = 0;
    st.vel = 0;
    st.settling = false;
    st.settled = false;

    // Vitesse de défilement libre (px/frame) au départ.
    let freeSpeed = 7;
    let targetOff: number | null = null;

    const mod = (n: number, m: number) => ((n % m) + m) % m;
    const cx = () => window.innerWidth / 2;

    let startTime = performance.now();

    function frame(now: number) {
      const elapsed = now - startTime;

      // Phase 1 : défilement libre rapide pendant ~2.2s.
      // Phase 2 : si winnerIndex défini et temps écoulé, on calcule la cible et on freine.
      if (!st.settling && winnerIndex !== null && elapsed > 2200) {
        // Choisit la copie de la carte gagnante la plus proche devant nous,
        // pour un arrêt centré naturel.
        const targetBase = pickWinnerBase(winnerIndex);
        targetOff = targetBase;
        st.settling = true;
      }

      if (st.settling && targetOff !== null) {
        // Freinage en douceur vers la cible.
        st.off += (targetOff - st.off) * 0.04;
        if (Math.abs(targetOff - st.off) < 0.4 && !st.settled) {
          st.off = targetOff;
          st.settled = true;
          render();
          onSettled?.();
          return; // stop l'animation
        }
      } else {
        // Défilement libre continu.
        st.off += freeSpeed;
      }

      render();
      rafRef.current = requestAnimationFrame(frame);
    }


    function screenX(base: number) {
        const center = cx();
        // distance "logique" repliée sur une seule boucle
        let rel = mod(base - st.off, LOOP);
        if (rel > LOOP / 2) rel -= LOOP;
        return rel + center - CARD_W / 2;
      }
  

      function pickWinnerBase(idx: number) {
        const baseIdx = idx * STEP; // base de la première copie de ce thème

        const current = st.off;
        const phase = mod(baseIdx - current, LOOP); // distance vers la prochaine occurrence centrée
        return current + phase + LOOP * 3; // +3 tours pour le ralenti
      }
  
      function render() {
        const center = cx();
        cards.forEach((c) => {
          const x = screenX(c.base);
          const d = Math.abs(x + CARD_W / 2 - center);
          const s = 0.3 + 0.7 * Math.exp(-Math.pow(d / (window.innerWidth * 0.34), 2));
          c.el.style.transform = `translate3d(${x}px,-50%,0) scale(${s})`;
          c.el.style.zIndex = String(Math.round(s * 100));
          const title = c.el.querySelector(".tc-title") as HTMLElement;
        if (title) title.style.opacity = s > 0.62 ? String((s - 0.62) / 0.38) : "0";
        });
      }

    startTime = performance.now();
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themes, winnerIndex]);

  return (
    <div
      ref={railRef}
      className={`tc-rail transition-opacity duration-700 ${
        revealed ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden="true"
    />
  );
}