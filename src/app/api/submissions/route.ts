import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/ratelimit";
import { isAllowedExt, MAX_UPLOAD_BYTES } from "@/lib/upload-rules";
import { requireUserWithUsername } from "@/lib/require-user";
import { auth } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

// ---------- POST /api/submissions ----------
// Enregistre une soumission liée à une manche ACTIVE. Le serveur vérifie
// lui-même le délai : impossible de soumettre hors temps, peu importe le client.
const createSchema = z.object({
  roundId: z.string().min(1),
  filePath: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const authResult = await requireUserWithUsername();
  if (authResult.response) return authResult.response;

  const userId = authResult.user.id;

  if (!(await checkRateLimit("submission", userId))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { roundId, filePath } = parsed.data;

  // Le chemin doit appartenir à l'utilisateur connecté.
  if (!filePath.startsWith(`${userId}/`)) {
    return NextResponse.json({ error: "forbidden_path" }, { status: 403 });
  }
  // Extension autorisée.
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  if (!isAllowedExt(ext)) {
    return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
  }

  // Récupère la manche et vérifie : appartenance, statut ACTIVE, délai serveur.
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: { theme: true },
  });
  if (!round || round.userId !== userId) {
    return NextResponse.json({ error: "round_not_found" }, { status: 404 });
  }
  if (round.status !== "ACTIVE") {
    return NextResponse.json({ error: "round_not_active" }, { status: 409 });
  }
  // LE point anti-triche : c'est l'horloge serveur qui décide.
  const INTRO_GRACE_SEC = 10;
  const elapsed = Math.floor((Date.now() - round.startedAt.getTime()) / 1000);
  if (elapsed > round.durationSec + INTRO_GRACE_SEC) {
    // Trop tard : on marque la manche échouée et on refuse.
    await prisma.round.update({
      where: { id: round.id },
      data: { status: "EXPIRED", endedAt: new Date() },
    });
    return NextResponse.json({ error: "time_up" }, { status: 409 });
  }

  // Vérifie que le fichier existe bien dans le bucket ET respecte la taille.
  // La taille est lue depuis les métadonnées du fichier RÉELLEMENT stocké,
  // pas depuis ce que le client prétend : c'est la vraie garde-fou serveur.
  const folder = filePath.substring(0, filePath.lastIndexOf("/"));
  const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
  const { data: listed } = await supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .list(folder, { search: fileName });
  const fileMeta = listed?.find((f) => f.name === fileName);
  if (!fileMeta) {
    return NextResponse.json({ error: "file_missing" }, { status: 400 });
  }

  // Taille réelle du fichier stocké (en octets). Si elle dépasse la limite,
  // on refuse ET on supprime immédiatement le fichier pour ne pas laisser
  // d'orphelin dans le bucket.
  const size = fileMeta.metadata?.size as number | undefined;
  if (typeof size !== "number" || size > MAX_UPLOAD_BYTES) {
    await supabaseAdmin.storage.from(STORAGE_BUCKET).remove([filePath]);
    return NextResponse.json({ error: "file_too_large" }, { status: 413 });
  }

  const { data: pub } = supabaseAdmin.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  // Transaction : crée la soumission ET clôt la manche en SUBMITTED.
  // Le @unique sur roundId empêche deux soumissions sur la même manche :
  // en cas de course, la 2ᵉ lève P2002 → on répond proprement 409.
  let submission;
  try {
    submission = await prisma.$transaction(async (tx) => {
      const s = await tx.submission.create({
        data: {
          userId,
          themeId: round.themeId,
          roundId: round.id,
          imageUrl: pub.publicUrl,
        },
      });
      await tx.round.update({
        where: { id: round.id },
        data: { status: "SUBMITTED", endedAt: new Date() },
      });
      return s;
    });
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json({ error: "already_submitted" }, { status: 409 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ id: submission.id }, { status: 201 });
}

// ---------- GET /api/submissions ----------
// ?action=upload-url&ext=png  -> URL signée d'upload (vérifie l'extension).
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  // Upload URL : réservé aux utilisateurs connectés avec pseudo
  if (action === "upload-url") {
    const authResult = await requireUserWithUsername();
    if (authResult.response) return authResult.response;

    const userId = authResult.user.id;

    // Rate limit : chaque URL signée réserve une place dans le bucket.
    if (!(await checkRateLimit("uploadUrl", userId))) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }

    const rawExt = (req.nextUrl.searchParams.get("ext") ?? "png").toLowerCase();
    const ext = rawExt.replace(/[^a-z0-9]/g, "");

    if (!isAllowedExt(ext)) {
      return NextResponse.json({ error: "invalid_file_type" }, { status: 400 });
    }

    const filePath = `${userId}/${crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .createSignedUploadUrl(filePath);

    if (error) {
      return NextResponse.json({ error: "storage_error" }, { status: 500 });
    }

    return NextResponse.json({
      filePath,
      token: data.token,
      path: data.path,
    });
  }

  // Feed public : visible même sans connexion
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const where: Prisma.SubmissionWhereInput = userId
    ? {
        userId: { not: userId },
        hidden: false,
        votes: { none: { voterId: userId } },
      }
    : {
        hidden: false,
      };

  const candidates = await prisma.submission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      theme: {
        select: {
          labelFr: true,
          labelEn: true,
        },
      },
      user: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  const submissions = candidates.slice(0, 20);

  return NextResponse.json({ submissions });
}