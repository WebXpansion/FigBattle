import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { REWARDS, REWARDS_DRAW_AT } from "@/lib/rewards";
import { RewardsCountdown } from "@/components/rewards/RewardsCountdown";

export default async function RewardsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("rewardsPage");

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Vidéo de fond en boucle — remplace public/rewards/bg-loop.mp4
          par ton propre fichier (même nom, ou change le src ci-dessous). */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 -z-10 h-full w-full object-cover"
        src="/rewards/bg-loop.mp4"
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-black/0"
        aria-hidden="true"
      />

      <div className="relative z-10 flex h-full flex-col pt-28">
        {/* Titre + compte à rebours : haut de page sur mobile, centré sur desktop */}
<div className="flex flex-1 flex-col items-start justify-start gap-4 px-6  sm:flex-row sm:items-start sm:justify-between sm:px-12 sm:pt-0 lg:items-center">
          <h1 className="font-display text-2xl font-black uppercase text-white sm:text-5xl">
            {t("title")}
          </h1>

          <RewardsCountdown
            targetIso={REWARDS_DRAW_AT}
            label={t("drawIn")}
            dayShort={t("dayShort")}
            hourShort={t("hourShort")}
            minuteShort={t("minuteShort")}
          />
        </div>

        {/* Lots à gagner, scrollables horizontalement */}
{/* Lots à gagner, scrollables horizontalement */}
<div className="shrink-0 px-6 pb-6 sm:px-12">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {REWARDS.map((reward) => (
              <div
                key={reward.id}
                className="flex w-[280px] shrink-0 items-center gap-4 overflow-hidden rounded-3xl border border-white/10 bg-black/30 px-4 py-4 backdrop-blur-md sm:w-[440px] sm:gap-6 sm:px-4 sm:py-4"
              >
                <div className="relative h-24 w-24 shrink-0 sm:h-32 sm:w-32">
                  <Image
                    src={reward.image}
                    alt={reward.title}
                    fill
                    className="object-contain"
                    sizes="140px"
                  />
                </div>
                <div className="flex min-w-0 flex-col items-start gap-3">
                  <span className="rounded-lg bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                    {t(reward.kind)}
                  </span>
                  <p className="font-display text-base font-bold leading-tight text-white sm:text-2xl">
                    {reward.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}