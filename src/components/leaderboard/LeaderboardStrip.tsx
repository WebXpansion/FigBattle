"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/routing";

export type LeaderboardPlayer = {
  id: string;
  username: string | null;
  name: string | null;
  score: number;
  rank: number;
};

function displayName(p: { username: string | null; name: string | null }) {
  return p.username ?? p.name ?? "—";
}

function badgeClass(rank: number) {
  if (rank === 1) return "bg-gold text-ink";
  if (rank === 2) return "bg-white/70 text-ink";
  if (rank === 3) return "bg-bronze text-ink";
  return "";
}

function RankBadge({ rank }: { rank: number }) {
  if (rank > 3) {
    return (
      <span className="w-9 shrink-0 text-center font-mono text-base font-bold text-white/50">
        {rank}
      </span>
    );
  }

  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white text-sm font-black ${badgeClass(rank)}`}
    >
      {rank}
    </span>
  );
}

function cardClass(rank: number) {
  if (rank === 1) return "border-gold/30 bg-gold/10";
  if (rank === 2) return "border-white/20 bg-white/10";
  if (rank === 3) return "border-bronze/30 bg-bronze/10";
  return "border-white/10 bg-black/30";
}

export function LeaderboardStrip({
  players,
  subtitle,
}: {
  players: LeaderboardPlayer[];
  subtitle: string;
}) {
  const t = useTranslations("leaderboard");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => displayName(p).toLowerCase().includes(q));
  }, [players, query]);

  return (
    <div className="relative z-10 shrink-0 px-6 pb-6 sm:px-12">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-lg font-black uppercase text-white sm:text-xl">
            {t("title")}
          </h2>
          <p className="text-xs text-white/50">{subtitle}</p>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full max-w-[220px] rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder-white/30 outline-none transition focus:border-white/30"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center text-sm text-white/50">
          {t("noResults")}
        </p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/profile/${p.id}`}
              className={`flex w-[240px] shrink-0 items-center gap-4 rounded-2xl border px-5 py-4 backdrop-blur-md transition hover:border-white/30 ${cardClass(p.rank)}`}
            >
              <RankBadge rank={p.rank} />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate font-display text-lg font-black uppercase text-white">
                  {displayName(p)}
                </span>
                <span className="font-mono text-base font-bold text-white">
                  {p.score}{" "}
                  <span className="text-sm font-normal text-white/40">
                    {t("points")}
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}