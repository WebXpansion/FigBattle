"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { UsernameModal } from "./UsernameModal";

// Affiche la modale de pseudo si l'utilisateur est connecté mais sans username.
export function UsernameGate() {
  const { data: session, status } = useSession();
  const [savedUsername, setSavedUsername] = useState<string | null>(null);

  if (status !== "authenticated") return null;

  // Si la session a déjà le pseudo, ou si on vient de l'enregistrer avec succès,
  // on ferme immédiatement l'overlay.
  if (session.user?.username || savedUsername) return null;

  return <UsernameModal onSaved={setSavedUsername} />;
}