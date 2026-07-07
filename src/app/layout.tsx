import type { ReactNode } from "react";

// Layout racine minimal : le vrai layout (locale, fonts, providers) est
// dans src/app/[locale]/layout.tsx.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
