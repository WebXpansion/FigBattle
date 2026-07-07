import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/lib/routing";
import { HeroShader } from "@/components/hero/HeroShader";
import { PlaySoloButton } from "@/components/play/PlaySoloButton";
import { HelpButton } from "@/components/play/HelpButton";


export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Home />;
}

function Home() {
  const t = useTranslations("home");

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <HeroShader />

      {/* Logo + boutons */}
      <div className="flex flex-col items-center px-4 text-center">
        <img
          src="/logo.webp"
          alt="FigBattle"
          className="w-[90%] max-w-4xl select-none drop-shadow-[0_8px_40px_rgba(11,4,20,0.45)]"
          style={{ mixBlendMode: "overlay" }}
          draggable={false}
        />

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          {/* Jouer seul (actif) */}
          <PlaySoloButton className="relative rounded-2xl bg-white px-10 py-5 font-display text-xl font-black uppercase text-black backdrop-blur-md"
          >
          {t("playSolo")}
        </PlaySoloButton>

          {/* Multiplayer (désactivé, badge "bientôt") */}
          <span
            className="relative cursor-not-allowed rounded-2xl bg-white/15 px-10 py-5 font-display text-xl font-black uppercase text-white/50 backdrop-blur-md"
            aria-disabled="true"
          >
            {t("multiplayer")}
            <span className="absolute -right-2 -top-2 rotate-6 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-ink">
              {t("soon")}
            </span>
          </span>
        </div>
      </div>

      {/* Boutons ronds en bas (décoratifs pour l'instant) */}
{/* Bouton aide (ouvre la modale) + bouton son (décoratif) */}
<HelpButton className="absolute bottom-6 left-6 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-lg font-bold text-white backdrop-blur-md transition hover:bg-white/20" />
      <button
        className="absolute bottom-6 right-6 flex h-12 w-12 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-md transition hover:bg-white/20"
        aria-label="Son"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M4 10v4M8 6v12M12 9v6M16 4v16M20 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </section>
  );
}