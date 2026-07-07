"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HelpModal } from "@/components/play/HelpModal";

// Bouton d'aide autonome (le "?" en bas à gauche) + sa modale.
// Encapsule l'état d'ouverture pour pouvoir être posé dans un composant
// serveur (ex: la page d'accueil) sans y introduire de useState.
export function HelpButton({ className }: { className?: string }) {
  const t = useTranslations("play");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ??
          "absolute bottom-6 left-6 z-20 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-lg font-bold text-white backdrop-blur-md transition hover:bg-white/20"
        }
        aria-label={t("helpButton")}
      >
        ?
      </button>
      <HelpModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}