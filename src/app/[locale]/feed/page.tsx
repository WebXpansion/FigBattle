"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/lib/routing";
import { HeroShader } from "@/components/hero/HeroShader";
import { VOTE_VALUES } from "@/lib/vote-values";
import { useAuthModal } from "@/components/auth/AuthModalContext";
import { HelpButton } from "@/components/play/HelpButton";



type Submission = {
  id: string;
  imageUrl: string;
  score: number;
  theme: { labelFr: string; labelEn: string };
  user: {
    id: string;
    username: string | null;
    name: string | null;
  };
};

export default function FeedPage() {
  const t = useTranslations("feed");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const { openModal } = useAuthModal();

  const [queue, setQueue] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [opened, setOpened] = useState<Submission | null>(null);
const scrollRef = useRef<HTMLDivElement | null>(null);
const current = queue[0];
const cardScrollRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;

    setLoading(true);

    fetch("/api/submissions")
      .then((res) => {
        if (!res.ok) return { submissions: [] };
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setQueue(data.submissions ?? []);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [status]);

  useEffect(() => {
    if (!opened) return;
  
    const container = scrollRef.current;
    if (!container) return;
  
    const frame = requestAnimationFrame(() => {
      const maxScroll = container.scrollHeight - container.clientHeight;
  
      if (maxScroll <= 0) return;
  
      container.scrollTop = maxScroll;
  
      setTimeout(() => {
        container.scrollTo({ top: 0, behavior: "smooth" });
      }, 250);
    });
  
    return () => cancelAnimationFrame(frame);
  }, [opened]);

// Scroll auto "bas → haut" sur l'image de la carte du feed, rejoué à chaque
  // nouvelle soumission affichée (même effet que l'ouverture d'un rendu).
  useEffect(() => {
    if (!current) return;
    const container = cardScrollRef.current;
    if (!container) return;

    const frame = requestAnimationFrame(() => {
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll <= 0) return;

      container.scrollTop = maxScroll; // part du bas
      setTimeout(() => {
        container.scrollTo({ top: 0, behavior: "smooth" }); // remonte en douceur
      }, 250);
    });

    return () => cancelAnimationFrame(frame);
  }, [current]);




  const authorName = current?.user.username ?? current?.user.name ?? "—";

  const vote = async (value: number) => {
    if (status !== "authenticated" || !session?.user) {
      openModal();
      return;
    }

    if (!current || voting || leaving) return;

    setVoting(true);
    setNotice(null);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: current.id, value }),
      });

      if (res.status === 401) {
        openModal();
        return;
      }

      if (res.status === 429) {
        setNotice(t("rateLimited"));
        return;
      }

      if (res.status === 403) {
        setNotice(t("selfVote"));
        return;
      }

      if (!res.ok) return;

      setLeaving(true);

      setTimeout(() => {
        setQueue((q) => q.slice(1));
        setLeaving(false);
      }, 320);
    } finally {
      setVoting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <HeroShader />
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-ink/20"
          aria-hidden="true"
        />

        <p className="animate-pulse text-center text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
          Chargement des maquettes en cours
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-24">
      <HeroShader />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-ink/20"
        aria-hidden="true"
      />

      {/* Bouton aide (bas gauche) */}
      <HelpButton />

      {/* Bouton Discord (bas droite) */}
      <a
        href="https://discord.gg/EbyeDccR96"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-6 right-6 z-20 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-md transition hover:bg-white/20"
        aria-label="Discord"
      >
        <svg width="20" height="20" viewBox="0 -28.5 256 256" fill="currentColor" aria-hidden="true">
          <path d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z" />
        </svg>
      </a>

      {!current ? (
        <p className="max-w-md text-center text-lg font-medium text-white drop-shadow-[0_2px_16px_rgba(11,4,20,0.6)]">
          {t("empty")}
        </p>
      ) : (
        <div className="w-full max-w-4xl">
          <div
            className={`overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md transition-all duration-300 ${
              leaving ? "translate-x-8 opacity-0" : "translate-x-0 opacity-100"
            }`}
          >
            <div className="mb-5">
              <Link
                href={`/profile/${current.user.id}`}
                className="inline-block rounded-[4px] mb-3 bg-white/10 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 transition hover:text-white"
              >
                {authorName}
              </Link>

              <h2 className="font-display text-xl font-black uppercase text-white sm:text-3xl">
                {locale === "fr"
                  ? current.theme.labelFr
                  : current.theme.labelEn}
              </h2>
            </div>


            <div className="relative">
              <div
                ref={cardScrollRef}
                className="relative max-h-[55vh] w-full overflow-y-auto rounded-2xl bg-ink/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={current.imageUrl}
                  alt=""
                  className="block w-full"
                />
              </div>

              {/* Bouton plein écran : ouvre l'overlay, sans gêner le scroll. */}
              <button
                type="button"
                onClick={() => setOpened(current)}
                aria-label={t("fullscreen")}
                className="absolute bottom-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-ink/40 text-white backdrop-blur-md transition hover:bg-ink/80"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {notice && (
            <p
              className="mt-4 rounded-lg bg-magenta/15 px-3 py-2 text-center text-sm text-magenta"
              role="alert"
            >
              {notice}
            </p>
          )}

<div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

            <VoteButton
              onClick={() => vote(VOTE_VALUES.NOT_FAN)}
              disabled={voting || leaving}
              label={t("notFan")}
              points="0"
              variant="ghost"
            />

            <VoteButton
              onClick={() => vote(VOTE_VALUES.GOOD)}
              disabled={voting || leaving}
              label={t("good")}
              points="1"
              variant="ghost"
            />

            <VoteButton
              onClick={() => vote(VOTE_VALUES.EXCELLENT)}
              disabled={voting || leaving}
              label={t("excellent")}
              points="2"
              variant="solid"
            />
          </div>
        </div>
      )}
      {opened && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/70 p-6 backdrop-blur-md"
    onClick={() => setOpened(null)}
  >
    <button
      type="button"
      onClick={() => setOpened(null)}
      className="absolute right-6 top-6 z-20 rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-medium text-ink shadow-lg transition hover:bg-white/90"
    >
      × {locale === "fr" ? "Fermer" : "Close"}
    </button>

    <div
      ref={scrollRef}
      className="relative max-h-[82dvh] w-full max-w-6xl overflow-y-auto rounded-xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={opened.imageUrl}
        alt={
          locale === "fr"
            ? opened.theme.labelFr
            : opened.theme.labelEn
        }
        className="mx-auto h-auto w-full max-w-none rounded-xl object-contain"
      />
    </div>
  </div>
)}
    </div>
  );
}

function VoteButton({
  onClick,
  disabled,
  label,
  points,
  variant,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  points: string;
  variant: "ghost" | "solid";
}) {
  const base =
    "flex items-center justify-between gap-2 rounded-2xl px-5 py-5 font-display font-black uppercase transition disabled:opacity-40";

  const style =
    variant === "solid"
      ? "bg-white text-ink enabled:hover:bg-white/90"
      : "border border-white/15 bg-white/10 text-white backdrop-blur-md enabled:hover:bg-white/20";

  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${style}`}>
      <span className="text-sm sm:text-base">{label}</span>

      <span
        className={`text-xs font-bold ${
          variant === "solid" ? "text-ink/50" : "text-white/40"
        }`}
      >
        {points} pts
      </span>
    </button>
  );
}