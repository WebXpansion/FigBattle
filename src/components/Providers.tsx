"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

// Fournit la session Auth.js aux composants client (useSession).
export function Providers({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
