import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiting via Upstash Redis. Si les variables d'env ne sont pas
// configurées (ex: en dev local sans Upstash), on désactive proprement
// la limite plutôt que de planter — pratique pour développer.
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash ? Redis.fromEnv() : null;

function makeLimiter(tokens: number, window: `${number} s` | `${number} m`) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: false,
    prefix: "figbattle",
  });
}

// Limites par type d'action (par utilisateur).
const limiters = {
  vote: makeLimiter(30, "1 m"),
  submission: makeLimiter(10, "1 m"),
  round: makeLimiter(20, "1 m"),
  // Génération d'URLs signées d'upload : chaque appel réserve une place dans
  // le bucket, donc on borne pour éviter qu'un compte en génère des centaines.
  uploadUrl: makeLimiter(20, "1 m"),
};

/**
 * Vérifie la limite pour une action et un identifiant (userId ou IP).
 * Retourne true si autorisé. Si Upstash n'est pas configuré, autorise toujours.
 */
export async function checkRateLimit(
  action: keyof typeof limiters,
  identifier: string
): Promise<boolean> {
  const limiter = limiters[action];
  if (!limiter) return true; // pas de Redis → on ne bloque pas en dev
  const { success } = await limiter.limit(`${action}:${identifier}`);
  return success;
}