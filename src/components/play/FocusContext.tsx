"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type FocusCtx = {
  focus: boolean;
  setFocus: (v: boolean) => void;
};

const Ctx = createContext<FocusCtx | null>(null);

export function FocusProvider({ children }: { children: ReactNode }) {
  const [focus, setFocus] = useState(false);
  return <Ctx.Provider value={{ focus, setFocus }}>{children}</Ctx.Provider>;
}

export function useFocus() {
  const ctx = useContext(Ctx);
  // Si pas de provider (pages sans focus), valeurs neutres.
  return ctx ?? { focus: false, setFocus: () => {} };
}