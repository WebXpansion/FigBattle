"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type AuthModalCtx = {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
};

const Ctx = createContext<AuthModalCtx | null>(null);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  return (
    <Ctx.Provider value={{ open, openModal, closeModal }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
}