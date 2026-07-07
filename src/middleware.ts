import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/routing";

// Gère la détection/redirection de locale sur toutes les pages.
export default createMiddleware(routing);

export const config = {
  // On exclut l'API, les assets statiques et les routes internes Next.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
