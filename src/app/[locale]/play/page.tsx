"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/lib/routing";
import { ThemeCarousel, type CarouselTheme } from "@/components/play/ThemeCarousel";
import { GameScreen, type Round } from "@/components/play/GameScreen";
import { HeroShader } from "@/components/hero/HeroShader";
import { CinemaBars } from "@/components/play/CinemaBars";
import { useFocus } from "@/components/play/FocusContext";
import { Countdown } from "@/components/play/Countdown";

type Phase = "intro" | "drawing" | "countdown" | "playing";

export default function PlayPage() {
  const t = useTranslations("play");
  const tNav = useTranslations("nav");
  const tFeed = useTranslations("feed");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const { setFocus } = useFocus();

  const [phase, setPhase] = useState<Phase>("intro");
  const [themes, setThemes] = useState<CarouselTheme[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [barsActive, setBarsActive] = useState(false);
  // Reste `false` tant qu'on n'a pas vérifié côté serveur s'il existe déjà une
  // manche active à reprendre (évite de relancer un tirage à chaque reload).
  const [resumableChecked, setResumableChecked] = useState(false);

  // Au montage : vérifie s'il existe déjà une manche active (reprise après
  // refresh/navigation). Si oui, on saute direct au jeu avec le vrai temps
  // restant ; sinon on laisse la séquence de tirage normale se lancer.
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.username) return;
    let cancelled = false;

    fetch("/api/rounds")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.round) {
          setRound(d.round);
          setPhase("playing");
        }
        setResumableChecked(true);
      })
      .catch(() => {
        if (!cancelled) setResumableChecked(true);
      });

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.username]);

  // Charge la liste des thèmes (pour les cartes) dès que connecté.
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.username) return;
    fetch("/api/themes")
      .then((r) => r.json())
      .then((d) => {
        const list: CarouselTheme[] = (d.themes ?? []).map(
          (th: {
            id: string;
            labelFr: string;
            labelEn: string;
            category: CarouselTheme["category"];
          }) => ({
            id: th.id,
            label: locale === "fr" ? th.labelFr : th.labelEn,
            category: th.category,
          })
        );
        setThemes(list);
      });
    }, [status, locale, session?.user?.username]);

  // Lance le tirage automatiquement dès que les thèmes sont chargés — mais
  // seulement si on a confirmé qu'il n'y a pas déjà une manche active à
  // reprendre (sinon on aurait abandonné/écrasé la manche en cours à chaque
  // reload de la page).

  // Active le mode focus (nav sort, bandes cinéma) pendant le tirage.
// Séquence d'intro : focus → bandes → titre → cartes.
useEffect(() => {
  if (
    status !== "authenticated" ||
    !session?.user?.username ||
    themes.length === 0 ||
    !resumableChecked ||
    round
  )
    return;

    setBarsActive(true);
    setStep(1);
  
    const t1 = setTimeout(() => setStep(2), 500 + 200);
    const t2 = setTimeout(() => {
      setStep(3);
      startDraw();
    }, 100 + 300 + 600);
  
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [status, session?.user?.username, themes, resumableChecked, round]);

// Coupe le focus dès qu'on quitte les phases de tirage (retour de la nav).
useEffect(() => {
  const inSequence =
    phase === "intro" || phase === "drawing" || phase === "countdown";
  setFocus(inSequence);
}, [phase, setFocus]);

  // Lance le tirage : appelle le serveur, qui choisit le thème.
  const startDraw = async () => {
    setError(null);
    setWinnerIndex(null);
    setPhase("drawing");
    try {
      const res = await fetch("/api/rounds", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const r: Round = data.round;
      setRound(r);
      const idx = themes.findIndex((th) => th.id === r.theme.id);
      setWinnerIndex(idx >= 0 ? idx : 0);
    } catch {
      setError(t("error" as never) ?? "error");
      setPhase("intro");
    }
  };

  // Quand le carrousel s'est arrêté → on bascule au jeu.
  const onSettled = () => {
    // Laisse voir la carte gagnante ~700ms, puis lance le décompte.
    setTimeout(() => setPhase("countdown"), 700);
  };

  const playAgain = () => {
    setRound(null);
    setWinnerIndex(null);
    setPhase("intro");
  };

  // Non connecté
  if (status === "loading") {
    return <div className="py-24 text-center text-white/60">…</div>;
  }
  if (!session?.user) {
    return (
      <div className="py-24 text-center">
        <p className="mb-6 text-white/70">{tFeed("loginToVote")}</p>
        <Link href="/" className="rounded-full bg-magenta px-6 py-3 font-semibold text-ink">
          {tNav("signIn")}
        </Link>
      </div>
    );
  }

  // Phase JEU
  if (phase === "playing" && round) {
    return <GameScreen round={round} onPlayAgain={playAgain} />;
  }

  // Phases INTRO + DRAWING (carrousel sur le shader)
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Shader en fond, comme la home */}
      <HeroShader />
      {/* Voile sombre léger pour la lisibilité */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-ink/20" aria-hidden="true" />

      {/* Bandes cinéma (focus Netflix) */}
      <CinemaBars active={barsActive} />

      <h1
        className={`absolute top-[16vh] z-20 px-4 text-center font-display text-3xl font-black uppercase text-white drop-shadow-[0_2px_16px_rgba(11,4,20,0.6)] transition-opacity duration-700 sm:text-3xl ${
          step >= 2 && phase !== "countdown" ? "opacity-100" : "opacity-0"
        }`}
      >
        {t("drawTitle")}
      </h1>

      {themes.length > 0 && (phase === "intro" || phase === "drawing") && (
     <div className="absolute inset-0">
        <div className="absolute inset-0">
          <ThemeCarousel
            themes={themes}
            winnerIndex={phase === "drawing" ? winnerIndex : null}
            onSettled={onSettled}
            revealed={step >= 3}
          />
          </div>
        </div>
      )}
{phase === "countdown" && (
        <Countdown
          onDone={() => {
            // Les bandes sortent (haut remonte, bas redescend)…
            setBarsActive(false);
            // …puis on bascule vers le challenge une fois l'animation finie (700ms).
            setTimeout(() => setPhase("playing"), 700);
          }}
        />
      )}
      {error && (
        <p className="absolute bottom-[8vh] z-20 text-sm text-magenta">{error}</p>
      )}
    </div>
  );
}