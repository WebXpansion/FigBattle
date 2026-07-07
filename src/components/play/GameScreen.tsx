"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/lib/routing";
import { createClient } from "@supabase/supabase-js";
import { HeroShader } from "@/components/hero/HeroShader";
import { SubmissionSuccess } from "@/components/play/SubmissionSuccess";
import { HelpModal } from "@/components/play/HelpModal";

import {
  MAX_UPLOAD_BYTES,
  ALLOWED_IMAGE_MIME,
  isAllowedExt,
} from "@/lib/upload-rules";


export type Round = {
  id: string;
  status: string;
  durationSec: number;
  remainingSec: number;
  startedAt: string;
  theme: {
    id: string;
    labelFr: string;
    labelEn: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    category: string;
  };
};

type Phase = "running" | "submitted" | "timeup";

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? "submissions";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase non configuré");
  return createClient(url, key);
}

function format(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
function computeRemaining(mountEpochMs: number, durationSec: number) {
  const elapsed = Math.floor((Date.now() - mountEpochMs) / 1000);
  return Math.max(0, durationSec - elapsed);
}

export function GameScreen({
  round,
  onPlayAgain,
}: {
  round: Round;
  onPlayAgain: () => void;
}) {
  const t = useTranslations("play");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>("running");
  // Instant de montage figé une seule fois : c'est le vrai départ du chrono.
  const mountRef = useRef<number>(Date.now());
  const [remaining, setRemaining] = useState(() =>
    computeRemaining(mountRef.current, round.durationSec)
  );
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Popup "êtes-vous sûr de vouloir abandonner" + état d'envoi de l'abandon.
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [abandoning, setAbandoning] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const label = round.theme[locale === "fr" ? "labelFr" : "labelEn"];

  useEffect(() => {
    if (phase !== "running") return;
    tickRef.current = setInterval(() => {
      const r = computeRemaining(mountRef.current, round.durationSec);
      setRemaining(r);
      if (r <= 0) {
        if (tickRef.current) clearInterval(tickRef.current);
        setPhase("timeup");
      }
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [phase, round]);

  const onPickFile = (f: File | null) => {
    setError(null);
    if (!f) return;
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!isAllowedExt(ext) || !(ALLOWED_IMAGE_MIME as readonly string[]).includes(f.type)) {
      setError(t("invalidType"));
      return;
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      setError(t("tooLarge"));
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!file || phase !== "running") return;
    setBusy(true);
    setError(null);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      const urlRes = await fetch(`/api/submissions?action=upload-url&ext=${ext}`);
      if (!urlRes.ok) throw new Error("upload-url");
      const { filePath, token } = await urlRes.json();

      const supabase = getSupabase();
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .uploadToSignedUrl(filePath, token, file);
      if (upErr) throw upErr;

      const createRes = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId: round.id, filePath }),
      });
      if (createRes.status === 409) {
        if (tickRef.current) clearInterval(tickRef.current);
        setPhase("timeup");
        return;
      }
      if (!createRes.ok) throw new Error("create");

      if (tickRef.current) clearInterval(tickRef.current);
      setPhase("submitted");
    } catch {
      setError(tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  // Abandon volontaire : PATCH le round en ABANDONED côté serveur, puis on
  // relance le flux normal (retour à l'écran d'intro → nouveau tirage possible).
// Abandon volontaire : PATCH le round en ABANDONED côté serveur, puis
  // redirige vers l'accueil (dans la bonne langue, et sur le bon domaine
  // une fois en prod — la locale est gérée automatiquement).
  const abandon = async () => {
    if (abandoning) return;
    setAbandoning(true);
    try {
      await fetch("/api/rounds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "abandon" }),
      });
    } catch {
      // Même en cas d'erreur réseau, on rend la main au joueur.
    } finally {
      if (tickRef.current) clearInterval(tickRef.current);
      setShowAbandonConfirm(false);
      setAbandoning(false);
      router.push("/");
    }
  };

  if (phase === "submitted") {
    return (
      <div className="fixed inset-0 overflow-hidden">
        <HeroShader />
        <div className="pointer-events-none absolute inset-0 -z-10 bg-ink/20" aria-hidden="true" />
        <SubmissionSuccess />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-24">
      <HeroShader />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-ink/20" aria-hidden="true" />

      {phase === "running" && (
        <div className="grid w-full max-w-6xl gap-4 lg:grid-cols-[1.2fr_1fr]">
          {/* Colonne gauche : dépôt d'image */}
          <label className="group relative flex min-h-[60vh] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-white/30 bg-white/10 p-8 text-center backdrop-blur-md transition hover:border-white/50">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
            />
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="absolute inset-0 h-full w-full object-contain p-4" />
            ) : (
              <>
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-3xl text-white/80">
                  +
                </span>
                <p className="mt-6 font-display text-xl font-bold text-white">
                  {t("uploadPrompt")}
                </p>
                <p className="mt-2 text-sm text-white/50">{t("uploadHint")}</p>
              </>
            )}
          </label>

          {/* Colonne droite : thème + chrono */}
          <div className="flex flex-col gap-4">
            {/* Bloc thème */}
            <div className="rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur-md">
              <h1 className="font-display text-2xl font-black uppercase leading-tight text-white">
                {label}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Lorem ipsum dolor sit amet consectetur. Ante ornare vitae viverra
                volutpat facilisi lectus tortor lorem. Etiam nec aliquet nullam
                interdum.
              </p>
            </div>

            {/* Bloc chrono */}
            <div className="flex flex-1 flex-col items-center justify-center rounded-3xl border border-white/15 bg-white/10 p-8 backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                {t("timeLeft")}
              </p>
              <p
                className={`mt-2 font-mono text-6xl font-bold tabular-nums ${
                  remaining <= 30 ? "text-magenta" : "text-white"
                }`}
              >
                {format(remaining)}
              </p>
            </div>

            {/* Bouton submit : apparaît après dépôt */}
            {file && (
              <button
                onClick={submit}
                disabled={busy}
                className="w-full rounded-2xl bg-white px-6 py-4 font-display text-lg font-black uppercase text-ink transition enabled:hover:brightness-110 disabled:opacity-40"
              >
                {busy ? t("uploading") : t("submit")}
              </button>
            )}
            {error && <p className="text-center text-sm text-magenta">{error}</p>}
          </div>
        </div>
      )}


{phase === "timeup" && (
        <div className="rounded-3xl border border-white/10 bg-white/10 p-10 text-center backdrop-blur-md">
          <h2 className="font-display text-3xl font-black uppercase text-white">
            {t("timeUpTitle")}
          </h2>
          <p className="mt-3 text-white/70">{t("timeUpBody")}</p>
          <button
            onClick={onPlayAgain}
            className="mt-6 rounded-full bg-white px-6 py-3 font-display font-bold uppercase text-ink transition hover:brightness-110"
          >
            {t("playAgain")}
          </button>
        </div>
      )}

      {/* Bouton ABANDONNER : bas au centre, uniquement pendant la partie. */}
      {phase === "running" && (
        <button
          onClick={() => setShowAbandonConfirm(true)}
          className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-2xl border border-white/40 bg-white/10 px-8 py-3 font-display text-sm font-black uppercase tracking-wider text-white backdrop-blur-md transition hover:border-white/70 hover:bg-white/20"
        >
          {t("abandon")}
        </button>
      )}

      {/* Boutons aide + son (décoratifs) */}
{/* Bouton aide (ouvre la modale) + bouton son (décoratif) */}
<button
        onClick={() => setShowHelp(true)}
        className="absolute bottom-6 left-6 z-20 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-lg font-bold text-white backdrop-blur-md transition hover:bg-white/20"
        aria-label={t("helpButton")}
      >
        ?
      </button>
      <button
        className="absolute bottom-6 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
        aria-label="Son"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M4 10v4M8 6v12M12 9v6M16 4v16M20 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Popup de confirmation d'abandon */}
      {/* Popup de confirmation d'abandon */}
      {showAbandonConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 px-4 backdrop-blur-sm"
          onClick={() => !abandoning && setShowAbandonConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-8 text-center text-ink shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-2xl font-black uppercase leading-tight text-ink">
              {t("abandonConfirmTitle")}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-ink/60">
              {t("abandonConfirmBody")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                onClick={abandon}
                disabled={abandoning}
                className="w-full rounded-2xl bg-ink px-6 py-3 font-display text-sm font-black uppercase text-white transition enabled:hover:brightness-125 disabled:opacity-40"
              >
                {t("abandonConfirm")}
              </button>
              <button
                onClick={() => setShowAbandonConfirm(false)}
                disabled={abandoning}
                className="w-full rounded-2xl border border-ink/15 bg-white px-6 py-3 font-display text-sm font-black uppercase text-ink transition enabled:hover:bg-ink/5 disabled:opacity-40"
              >
                {t("abandonCancel")}
              </button>
            </div>
          </div>
        </div>
      )}

         {/* Modale d'aide */}
         <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}