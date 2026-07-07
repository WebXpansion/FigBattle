import { NextRequest, NextResponse } from "next/server";
import { cleanupOrphanFiles } from "@/lib/cleanup";

// GET /api/cron/cleanup?secret=XXX
// Supprime les fichiers orphelins du bucket (uploadés mais jamais soumis).
// Protégé par CRON_SECRET : à appeler par un cron externe (ex: cron-job.org),
// jamais exposé publiquement sans le secret.
//
// Le nettoyage peut être long : on force l'exécution en Node.js (pas Edge)
// et on autorise jusqu'à 60s.
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  // Si le secret n'est pas configuré en prod, on refuse par sécurité
  // (mieux vaut une route inerte qu'une route ouverte à tous).
  if (!secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  // Le secret peut venir du query param OU d'un header Authorization: Bearer.
  const provided =
    req.nextUrl.searchParams.get("secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    "";

  if (provided !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const result = await cleanupOrphanFiles();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[cron/cleanup] échec:", e);
    return NextResponse.json({ error: "cleanup_failed" }, { status: 500 });
  }
}