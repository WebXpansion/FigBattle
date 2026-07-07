// Barème de vote partagé entre le front et l'API (source unique de vérité).
export const VOTE_VALUES = {
  NOT_FAN: 0, // Pas fan
  GOOD: 1, // Bien
  EXCELLENT: 2, // Excellent
} as const;

export type VoteKey = keyof typeof VOTE_VALUES;
export const ALLOWED_VOTE_VALUES = Object.values(VOTE_VALUES);