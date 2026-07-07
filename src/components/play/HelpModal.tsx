"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

// Modale d'aide "comment jouer" — même design que la modale de connexion
// (voile flou + carte verre). 4 étapes en grille 2×2, numéro à gauche,
// titre + description à droite.
export function HelpModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("help");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  // Les 4 étapes : on lit titre + description depuis les traductions.
  const steps = [1, 2, 3, 4] as const;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Voile flou : on devine la page derrière. Clic = fermeture. */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-xl"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* La carte */}
      <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-y-auto rounded-3xl border border-white/15 bg-white/5 p-5 shadow-2xl backdrop-blur-md sm:p-10">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-white/50 transition hover:text-white"
          aria-label={t("close")}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>

        <h2 className="text-center font-display text-2xl font-black uppercase text-white sm:text-3xl">
          {t("title")}
        </h2>

        {/* Grille des étapes : 1 colonne sur mobile, 2 à partir de sm */}
        <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 sm:grid-cols-2">

          {steps.map((n) => (
            <div
              key={n}
              className="flex h-full items-start gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md sm:gap-5 sm:p-6"


            >
              <span className="font-display text-4xl font-black leading-none text-white/25">
                {n}
              </span>
              <div>
                <h3 className="font-display text-lg font-bold text-white">
                  {t(`step${n}Title`)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                  {t(`step${n}Body`)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bouton Compris : ferme l'overlay */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onClose}
            className="rounded-2xl bg-white px-10 py-3.5 font-display text-sm font-black uppercase text-ink transition hover:bg-white/90"
          >
            {t("gotIt")}
          </button>
        </div>
      </div>
    </div>
  );
}