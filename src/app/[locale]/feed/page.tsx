"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import { Link } from "@/lib/routing";
import { HeroShader } from "@/components/hero/HeroShader";
import { VOTE_VALUES } from "@/lib/vote-values";
import { useAuthModal } from "@/components/auth/AuthModalContext";

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

  const current = queue[0];

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
                className="text-xs font-semibold uppercase tracking-wide text-white/50 transition hover:text-white"
              >
                {authorName}
              </Link>

              <h2 className="font-display text-xl font-black uppercase text-white sm:text-2xl">
                {locale === "fr"
                  ? current.theme.labelFr
                  : current.theme.labelEn}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setOpened(current)}
              className="relative block aspect-[16/9] w-full overflow-hidden rounded-2xl bg-ink/40"
            >
              <Image
                src={current.imageUrl}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 896px) 100vw, 896px"
                unoptimized
              />
            </button>
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