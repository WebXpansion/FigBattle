"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/lib/routing";


// Modale obligatoire de choix de pseudo (même style que la connexion).
// S'affiche tant que l'utilisateur connecté n'a pas de username.
export function UsernameModal({
  onSaved,
}: {
  onSaved?: (username: string) => void;
}) {
  const t = useTranslations("username");
  const router = useRouter();
  const { update } = useSession();

  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const username = value.trim();
  
    if (username.length < 3 || busy) return;
  
    setError(null);
    setBusy(true);
  
    try {
      const res = await fetch("/api/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
  
      const data = await res.json().catch(() => ({}));
  
      if (res.status === 409) {
        setError(t("taken"));
        return;
      }
  
      if (!res.ok) {
        const code = data?.error as string | undefined;
  
        setError(
          code === "too_short"
            ? t("tooShort")
            : code === "too_long"
            ? t("tooLong")
            : code === "invalid_chars"
            ? t("invalidChars")
            : t("generic")
        );
        return;
      }
  
      // Succès serveur : le pseudo est réellement enregistré en base.
      const saved = typeof data?.username === "string" ? data.username : username;
  
      // Force NextAuth côté client à relire /api/auth/session.
      await update().catch(() => null);
  
      // Ferme immédiatement la modale même si la session met un instant à se synchroniser.
      onSaved?.(saved);
  
      // Rafraîchit aussi les Server Components éventuels.
      router.refresh();
    } catch {
      setError(t("generic"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Voile flou (pas de fermeture au clic : c'est obligatoire) */}
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-xl" aria-hidden="true" />

      <div className="relative w-full max-w-md rounded-3xl border border-white/15 bg-white/5 p-8 shadow-2xl backdrop-blur-md">
        <h2 className="text-center font-display text-3xl font-black uppercase">
          {t("title")}
        </h2>
        <p className="mt-2 text-center text-sm text-white/60">{t("subtitle")}</p>

        <div className="mt-8 space-y-3">
          <input
            type="text"
            value={value}
            placeholder={t("placeholder")}
            autoComplete="off"
            maxLength={20}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && submit()}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3.5 text-center text-white placeholder-white/40 outline-none backdrop-blur-md transition focus:border-white/40"
          />

          {error && (
            <p className="rounded-lg bg-magenta/15 px-3 py-2 text-center text-sm text-magenta" role="alert">
              {error}
            </p>
          )}

          <button
            onClick={submit}
            disabled={busy || value.trim().length < 3}
            className="w-full rounded-xl bg-white py-3.5 font-display font-black uppercase text-ink transition enabled:hover:bg-white/90 disabled:opacity-40"
          >
            {busy ? t("saving") : t("confirm")}
          </button>
          <p className="text-center text-xs text-white/40">{t("rules")}</p>
        </div>
      </div>
    </div>
  );
}