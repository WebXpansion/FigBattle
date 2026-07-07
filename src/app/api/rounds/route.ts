import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/ratelimit";
import { requireUserWithUsername } from "@/lib/require-user";

const roundThemeSelect = {
  id: true,
  labelFr: true,
  labelEn: true,
  difficulty: true,
  category: true,
} as const;

// Calcule le temps restant (secondes) d'une manche d'après l'horloge serveur.
function remainingSeconds(startedAt: Date, durationSec: number): number {
  const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
  return Math.max(0, durationSec - elapsed);
}

// Sérialise une manche pour le client (jamais d'info sensible).
function serializeRound(round: {
  id: string;
  status: string;
  startedAt: Date;
  durationSec: number;
  theme: {
    id: string;
    labelFr: string;
    labelEn: string;
    difficulty: string;
    category: string;
  };
}) {
  return {
    id: round.id,
    status: round.status,
    durationSec: round.durationSec,
    remainingSec: remainingSeconds(round.startedAt, round.durationSec),
    // startedAt en ISO : le client peut recalculer un chrono fluide localement,
    // mais le serveur reste la seule autorité au moment de la soumission.
    startedAt: round.startedAt.toISOString(),
    theme: round.theme,
  };
}

// ---------- GET /api/rounds ----------
// Renvoie la manche ACTIVE de l'utilisateur (reprise après refresh), ou null.
// Si une manche active a dépassé son temps, on la marque EXPIRED à la volée.
export async function GET() {
  const authResult = await requireUserWithUsername();
  if (authResult.response) return authResult.response;

  const userId = authResult.user.id;

  const active = await prisma.round.findFirst({
    where: { userId, status: "ACTIVE" },
    orderBy: { startedAt: "desc" },
    include: {
      theme: { select: roundThemeSelect },
    },
  });

  if (!active) return NextResponse.json({ round: null });

  if (remainingSeconds(active.startedAt, active.durationSec) <= 0) {
    await prisma.round.update({
      where: { id: active.id },
      data: { status: "EXPIRED", endedAt: new Date() },
    });

    return NextResponse.json({ round: null, expired: true });
  }

  return NextResponse.json({ round: serializeRound(active) });
}

// ---------- POST /api/rounds ----------
// Lance une nouvelle manche : tire un thème actif au hasard, fige le départ.
// Abandonne d'abord toute manche active précédente (le joueur peut changer).
//
// Abandon + création sont SOUDÉS dans une transaction. Combiné à l'index
// unique partiel en base (une seule manche ACTIVE par userId), ça rend
// impossible d'ouvrir deux manches actives en parallèle (double-clic, requêtes
// concurrentes) — sinon un joueur pourrait soumettre plusieurs maquettes.
export async function POST() {
  const authResult = await requireUserWithUsername();
  if (authResult.response) return authResult.response;

  const userId = authResult.user.id;

  if (!(await checkRateLimit("round", userId))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  // Tirage du thème AVANT la transaction (lecture seule, pas besoin de la
  // garder dans la transaction). 12 thèmes → on charge juste les IDs actifs.
  const activeThemes = await prisma.theme.findMany({
    where: { active: true },
    select: { id: true, durationSec: true },
  });
  if (activeThemes.length === 0) {
    return NextResponse.json({ error: "no_themes" }, { status: 404 });
  }
  const picked =
    activeThemes[Math.floor(Math.random() * activeThemes.length)];

  try {
    const round = await prisma.$transaction(async (tx) => {
      // Abandonne toute manche encore ACTIVE (changement volontaire de thème).
      await tx.round.updateMany({
        where: { userId, status: "ACTIVE" },
        data: { status: "ABANDONED", endedAt: new Date() },
      });

      // Crée la nouvelle manche. Si une autre requête concurrente a créé une
      // manche ACTIVE entre-temps, l'index unique partiel lève P2002 ici.
      return tx.round.create({
        data: {
          userId,
          themeId: picked.id,
          durationSec: picked.durationSec,
        },
        include: {
          theme: { select: roundThemeSelect },
        },
      });
    });

    return NextResponse.json({ round: serializeRound(round) }, { status: 201 });
  } catch (e: unknown) {
    // P2002 = violation de l'index unique "une seule manche ACTIVE par user".
    // Une requête concurrente a déjà ouvert une manche : on refuse proprement.
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json({ error: "round_already_active" }, { status: 409 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

// ---------- PATCH /api/rounds ----------
// Abandonne explicitement la manche active (bouton "changer de thème"
// ou futur bouton "abandonner").
const patchSchema = z.object({ action: z.literal("abandon") });

export async function PATCH(req: NextRequest) {
  const authResult = await requireUserWithUsername();
  if (authResult.response) return authResult.response;

  const userId = authResult.user.id;
  const body = await req.json().catch(() => null);
  if (!patchSchema.safeParse(body).success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  await prisma.round.updateMany({
    where: { userId, status: "ACTIVE" },
    data: { status: "ABANDONED", endedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}