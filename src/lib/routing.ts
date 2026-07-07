import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

// FR par défaut, EN disponible. Préfixe de locale dans l'URL (/fr, /en).
export const routing = defineRouting({
  locales: ["fr", "en"],
  defaultLocale: "fr",
});

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
