"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { Link, usePathname, useRouter } from "@/lib/routing";
import { useAuthModal } from "@/components/auth/AuthModalContext";
import { useFocus } from "@/components/play/FocusContext";

export function Nav({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const { openModal } = useAuthModal();
  const { focus } = useFocus();
  const user = session?.user;
const profileHref = user?.id ? `/profile/${user.id}` : "/";
const profileLabel = user?.username ?? user?.name ?? "Profil";

  const switchLocale = (next: "fr" | "en") => {
    setLangOpen(false);
    router.replace(pathname, { locale: next });
  };

  const links = [
    { href: "/", label: t("play") },
    { href: "/feed", label: t("feed") },
    { href: "/leaderboard", label: t("leaderboard") },
    { href: "/rewards", label: t("rewards") },
  ] as const;

  return (
<header
      className={`absolute inset-x-0 top-0 z-40 transition-transform duration-700 ease-in-out ${
        focus ? "-translate-y-full" : ""
      }`}
    >
     <nav className="mx-auto flex max-w-[2000px] items-center justify-between gap-4 px-4 pt-9 pb-5 sm:px-8">
        {/* Gauche : réalisé par */}
        <div className="hidden flex-col leading-tight sm:flex">
          <span className="text-[10px] uppercase tracking-wide text-white/50">
            {t("madeBy")}
          </span>
          <span className="font-display text-sm font-bold">Julien Lallouche</span>
        </div>

        {/* Logo court sur mobile (à la place du "réalisé par") */}
        <Link href="/" className="sm:hidden">
  <img
    src="/logo.webp"
    alt="FigBattle"
    className="h-7 w-auto select-none"
    draggable={false}
  />
</Link>

        {/* Centre : menu pilule (desktop) */}
        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 backdrop-blur-md md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Droite : langue + connexion (desktop) */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="relative">
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm font-bold uppercase backdrop-blur-md transition hover:bg-white/10"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
            >
              {locale.toUpperCase()}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={`transition ${langOpen ? "rotate-180" : ""}`}>
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {langOpen && (
       <ul className="absolute right-0 mt-2 w-24 overflow-hidden rounded-xl border border-white/10 bg-white/5 py-1 shadow-xl backdrop-blur-md" role="listbox">
       {(["fr", "en"] as const).map((lng) => (
         <li key={lng}>
           <button
             onClick={() => switchLocale(lng)}
             className={`block w-full px-4 py-2 text-left text-sm font-bold uppercase transition hover:bg-white/10 ${locale === lng ? "text-white" : "text-white/50"}`}
           >
             {lng.toUpperCase()}
           </button>
         </li>
       ))}
     </ul>
            )}
          </div>

          {user ? (
  <Link
    href={profileHref}
    className="flex max-w-[180px] items-center gap-2 truncate rounded-lg bg-white px-5 py-2 text-sm font-bold text-ink transition hover:bg-white/90"
    title={profileLabel}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 20c0-4 3.5-6 8-6s8 2 8 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>

    <span className="truncate">{profileLabel}</span>
  </Link>
) : (
  <button
    onClick={() => openModal()}
    className="flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-sm font-bold text-ink transition hover:bg-white/90"
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 20c0-4 3.5-6 8-6s8 2 8 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
    {t("signIn")}
  </button>
)}
        </div>

        {/* Hamburger (mobile) */}
        <button
          onClick={() => setMenuOpen(true)}
          className="flex flex-col gap-1.5 rounded-lg border border-white/15 bg-white/5 p-3 backdrop-blur-md md:hidden"
          aria-label={t("menu")}
        >
          <span className="block h-0.5 w-5 bg-white" />
          <span className="block h-0.5 w-5 bg-white" />
          <span className="block h-0.5 w-5 bg-white" />
        </button>
      </nav>

      {/* Overlay plein écran (mobile) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink/95 backdrop-blur-xl md:hidden">
<div className="flex items-center justify-between px-4 pt-9 pb-5 sm:px-8">
<img
  src="/logo.webp"
  alt="FigBattle"
  className="h-7 w-auto select-none"
  draggable={false}
/>
            <button
              onClick={() => setMenuOpen(false)}
              className="rounded-lg border border-white/15 p-3"
              aria-label={t("close")}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 flex-col justify-center gap-6 px-6">
          {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="font-display text-3xl font-black uppercase text-white/80 transition hover:text-magenta"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-white/10 px-6 py-6">
            <div className="flex gap-2">
              {(["fr", "en"] as const).map((lng) => (
                <button
                  key={lng}
                  onClick={() => switchLocale(lng)}
                  className={`rounded-full border border-white/15 px-3 py-1.5 text-sm font-bold uppercase ${locale === lng ? "bg-white text-ink" : "text-white/60"}`}
                  >
                  {lng.toUpperCase()}
                </button>
              ))}
            </div>
            {user ? (
  <Link
    href={profileHref}
    onClick={() => setMenuOpen(false)}
    className="flex max-w-[180px] items-center gap-2 truncate rounded-full bg-white px-5 py-2 text-sm font-bold text-ink"
    title={profileLabel}
  >
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M4 20c0-4 3.5-6 8-6s8 2 8 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>

    <span className="truncate">{profileLabel}</span>
  </Link>
) : (
  <button
    onClick={() => {
      setMenuOpen(false);
      openModal();
    }}
    className="rounded-full bg-white px-5 py-2 text-sm font-bold text-ink"
  >
    {t("signIn")}
  </button>
)}
          </div>
        </div>
      )}
    </header>
  );
}