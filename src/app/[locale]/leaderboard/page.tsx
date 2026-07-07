import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  LeaderboardStrip,
  type LeaderboardPlayer,
} from "@/components/leaderboard/LeaderboardStrip";

// Formate un rang en ordinal localisé : "4ème" (FR) / "4th" (EN).
function ordinal(n: number, locale: string) {
  if (locale === "en") {
    const rem100 = n % 100;
    if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
    switch (n % 10) {
      case 1:
        return `${n}st`;
      case 2:
        return `${n}nd`;
      case 3:
        return `${n}rd`;
      default:
        return `${n}th`;
    }
  }
  return n === 1 ? `${n}er` : `${n}ème`;
}

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("leaderboard");
  const session = await auth();

  const raw = await prisma.user.findMany({
    where: { score: { gt: 0 } },
    orderBy: { score: "desc" },
    take: 100,
    select: { id: true, username: true, name: true, score: true },
  });

  const players: LeaderboardPlayer[] = raw.map((p, i) => ({
    ...p,
    rank: i + 1,
  }));

  const top1 = players[0] ?? null;
  const top1Name = top1 ? (top1.username ?? top1.name ?? "—") : null;

  let me: LeaderboardPlayer | null = null;
  if (session?.user?.id) {
    const found = players.find((p) => p.id === session.user!.id) ?? null;
    if (found) {
      me = found;
    } else {
      const myUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, username: true, name: true, score: true },
      });
      if (myUser) {
        const rank =
          (await prisma.user.count({ where: { score: { gt: myUser.score } } })) + 1;
        me = { ...myUser, rank };
      }
    }
  }

  const subtitle = me
    ? t("yourPosition", { rank: ordinal(me.rank, locale), score: me.score })
    : t("subtitle");

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Vidéo de fond en boucle — remplace public/leaderboard/bg-loop.mp4
          par ton propre fichier (même nom, ou change le src ci-dessous). */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        src="/leaderboard/bg-loop.mp4"
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-black/0"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full flex-col pt-28">
        {/* TOP 1 : nom à gauche, score à droite. Haut de page sur mobile, centré sur desktop. */}
        <div className="flex flex-1 items-start justify-between px-6 sm:px-12 lg:items-center">
          {top1 ? (
            <>
              <div>
                <p className="font-display text-sm font-black uppercase tracking-wide text-white/60">
                  {t("topLabel")} 1
                </p>
                <p className="truncate font-display text-4xl font-black uppercase text-white sm:text-6xl">
                  {top1Name}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-sm font-black uppercase tracking-wide text-white/60">
                  {t("pointsLabel")}
                </p>
                <p className="font-mono text-4xl font-black text-white sm:text-6xl">
                  {top1.score}
                </p>
              </div>
            </>
          ) : (
            <p className="mx-auto text-sm text-white/40">{t("heroEmpty")}</p>
          )}
        </div>

        {/* Classement scrollable horizontalement */}
        <LeaderboardStrip players={players} subtitle={subtitle} />
      </div>
    </div>
  );
}