import type { ReactNode } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Inter, Archivo } from "next/font/google";
import { routing } from "@/lib/routing";
import { Nav } from "@/components/Nav";
import { Providers } from "@/components/Providers";
import "../globals.css";
import { AuthModalProvider } from "@/components/auth/AuthModalContext";
import { AuthModal } from "@/components/auth/AuthModal";
import { FocusProvider } from "@/components/play/FocusContext";
import { UsernameGate } from "@/components/auth/UsernameGate";
import { ClickAura } from "@/components/ClickAura";
import { CustomCursor } from "@/components/CustomCursor";


// Display condensé pour rappeler la typo des captures, Inter pour le corps.
const display = Archivo({
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  variable: "--font-display",
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "FigBattle — Le jeu de design de maquettes en multijoueur",
  description:
    "Conçois des maquettes sous chrono, fais voter la communauté, grimpe au classement. 100% gratuit.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "fr" | "en")) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <body className="font-body min-h-screen antialiased">
      <NextIntlClientProvider messages={messages}>
          <Providers>
          <AuthModalProvider>
              <FocusProvider>
                <Nav locale={locale} />
                <main>{children}</main>
                <AuthModal />
                <UsernameGate />
                <ClickAura />
                <CustomCursor />
              </FocusProvider>
            </AuthModalProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
