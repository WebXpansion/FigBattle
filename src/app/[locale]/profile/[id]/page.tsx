import Image from "next/image";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getUserRank } from "@/lib/ranks";
import { auth } from "@/lib/auth";
import { ProfileSubmissionsGrid } from "@/components/profile/ProfileSubmissionsGrid";
import { ProfileReportButton } from "@/components/profile/ProfileReportButton";
import { ProfileLogoutButton } from "@/components/profile/ProfileLogoutButton";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("profile");

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      score: true,
      createdAt: true,
      submissions: {
        where: { hidden: false },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          imageUrl: true,
          score: true,
          voteCount: true,
          theme: {
            select: {
              labelFr: true,
              labelEn: true,
            },
          },
        },
      },
    },
  });

  if (!user) notFound();
  const session = await auth();
const isOwner = session?.user?.id === user.id;

  const displayName = user.username ?? user.name ?? "—";
  const userRank = getUserRank(user.score);

  const leaderboardRank =
    (await prisma.user.count({
      where: { score: { gt: user.score } },
    })) + 1;

  const totalVotesReceived = user.submissions.reduce(
    (total, submission) => total + submission.voteCount,
    0
  );

  return (
    <div className="min-h-screen bg-white text-ink">
      <section
        className="relative flex min-h-[360px] items-end overflow-hidden px-6 pb-10 pt-28 sm:px-12 lg:px-20"
        style={{
          backgroundColor: userRank.background.base,
        }}
      >
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background: `
              radial-gradient(circle at 75% 0%, ${userRank.background.glow1}, transparent 34%),
              radial-gradient(circle at 35% 65%, ${userRank.background.glow2}, transparent 42%),
              radial-gradient(circle at 0% 0%, ${userRank.background.glow3}, transparent 60%),
              linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))
            `,
          }}
        />

        <div className="absolute inset-0 bg-black/25" />

        <div className="relative z-10 flex w-full flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <h1 className="truncate font-display text-5xl font-black uppercase tracking-tight text-white sm:text-7xl lg:text-8xl">
              {displayName}
            </h1>

            {userRank.badgeSrc && (
              <Image
                src={userRank.badgeSrc}
                alt={userRank.label}
                width={96}
                height={96}
                className="h-14 w-14 shrink-0 object-contain sm:h-24 sm:w-24"
                priority
              />
            )}
          </div>

          <div className="flex flex-col items-end gap-3">
          {isOwner ? (
            <ProfileLogoutButton />
          ) : (
            <ProfileReportButton reportedUserId={user.id} />
          )}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <StatCard label={t("rank")} value={leaderboardRank} prefix="#" />
            <StatCard label={t("score")} value={user.score} />
            <StatCard label={t("votesReceived")} value={totalVotesReceived} />
          </div>
        </div>
        </div>
      </section>

      <section className="px-6 py-8 sm:px-12 lg:px-20">
        <h2 className="mb-5 text-base font-semibold text-ink">
          {t("submissions")} ({user.submissions.length})
        </h2>

        {user.submissions.length === 0 ? (
          <p className="rounded-2xl bg-black/[0.04] p-8 text-center text-sm text-black/50">
            {t("noSubmissions")}
          </p>
        ) : (
          
      <Suspense fallback={null}>
        <ProfileSubmissionsGrid
          isOwner={isOwner}
          submissions={user.submissions.map((submission) => ({
            id: submission.id,
            imageUrl: submission.imageUrl,
            score: submission.score,
            voteCount: submission.voteCount,
            themeLabel:
              locale === "fr"
                ? submission.theme.labelFr
                : submission.theme.labelEn,
          }))}
        />
      </Suspense>
        )}
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  prefix = "",
}: {
  label: string;
  value: number;
  prefix?: string;
}) {
  return (
    <div className="min-w-[100px] rounded-lg bg-white/10 px-4 py-4 backdrop-blur-md sm:min-w-[130px]">
      <p className="text-[10px] font-medium uppercase text-white/35">{label}</p>
      <p className="mt-1 font-display text-3xl font-black text-white sm:text-4xl">
        {prefix}
        {value}
      </p>
    </div>
  );
}