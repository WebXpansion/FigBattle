import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiting via Upstash Redis. Si les variables d'env ne sont pas
// configurées (ex: dev local sans Upstash), on désactive proprement la limite.
const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

// FAILLE A corrigée : en PRODUCTION, si Upstash n'est pas configuré, on ne
// reste pas silencieux — on loggue un avertissement bien visible dans les logs.
// Sinon le site tournerait sans AUCUNE protection anti-spam sans qu'on le sache.
if (!hasUpstash && process.env.NODE_ENV === "production") {
  console.error(
    "[ratelimit] ⚠️ ALERTE : Upstash n'est PAS configuré en production. " +
      "Le rate limiting est DÉSACTIVÉ — aucune protection anti-spam active. " +
      "Vérifie UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN."
  );
}

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
  uploadUrl: makeLimiter(20, "1 m"),
};

/**
 * Vérifie la limite pour une action et un identifiant (userId ou IP).
 * Retourne true si autorisé, false si la limite est atteinte.
 *
 * Comportement en cas de problème (fail-open MAÎTRISÉ) :
 * - Upstash non configuré → autorise (déjà signalé au boot ci-dessus).
 * - Upstash plante (réseau, service down) → on ATTRAPE l'erreur, on la loggue,
 *   et on autorise la requête plutôt que de renvoyer une 500.
 *   Raison : la panne d'un service secondaire (anti-spam) ne doit jamais
 *   casser les fonctions principales du site (voter, jouer).
 */
export async function checkRateLimit(
  action: keyof typeof limiters,
  identifier: string
): Promise<boolean> {
  const limiter = limiters[action];
  if (!limiter) return true; // pas de Redis → on ne bloque pas

  try {
    const { success } = await limiter.limit(`${action}:${identifier}`);
    return success;
  } catch (e) {
    // FAILLE B corrigée : on ne laisse plus l'erreur remonter en 500.
    console.error(
      `[ratelimit] Erreur Upstash sur l'action "${action}" — requête autorisée par sécurité :`,
      e
    );
    return true; // fail-open : on laisse passer plutôt que de casser le site
  }
}