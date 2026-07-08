// Config de la saison de récompenses en cours.
//
// IMPORTANT : REWARDS_DRAW_AT est une date FIXE (ISO), pas un calcul relatif
// ("dans 30 jours à partir d'aujourd'hui"). Si c'était relatif, le compte à
// rebours se réinitialiserait à chaque visite/refresh. Pour lancer une
// nouvelle saison, change uniquement cette date (et la liste REWARDS
// ci-dessous si les lots changent).
export const REWARDS_DRAW_AT = "2026-08-03T00:00:00.000Z";

export type RewardKind = "top1" | "top2" | "top3" | "mostActive";

export type Reward = {
  id: string;
  kind: RewardKind;
  // Nom du lot — pas besoin de traduction, ce sont des noms de produits.
  title: string;
  // Chemin de l'image dans /public — remplace par tes propres visuels produit.
  image: string;
};

export const REWARDS: Reward[] = [
  { id: "top1", kind: "top1", title: "Iphone 17", image: "/rewards/iphone.webp", },
  {
    id: "top2",
    kind: "top2",
    title: "PS5",
    image: "/rewards/ps5.webp",
  },
  {
    id: "top3",
    kind: "top3",
    title: "Air Pod 4",
    image: "/rewards/air-pod.webp",
  },
  {
    id: "most-active",
    kind: "mostActive",
    title: "G512 X 75",
    image: "/rewards/clavier.webp",
  },
];