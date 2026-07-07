import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserWithUsername } from "@/lib/require-user";
import { checkRateLimit } from "@/lib/ratelimit";

// Seuil de signalements au-delà duquel la maquette est masquée automatiquement.
const HIDE_THRESHOLD = 5;

const schema = z.object({ submissionId: z.string().min(1) });

// POST /api/reports — signale une maquette (1 fois max par utilisateur).
export async function POST(req: NextRequest) {
  const authResult = await requireUserWithUsername();
  if (authResult.response) return authResult.response;
  
  const reporterId = authResult.user.id;

  if (!(await checkRateLimit("vote", reporterId))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { submissionId } = parsed.data;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      userId: true,
      hidden: true,
    },
  });
  
  if (!submission) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  
  if (submission.hidden) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  // On ne signale pas sa propre maquette.
  if (submission.userId === reporterId) {
    return NextResponse.json({ error: "self_report" }, { status: 403 });
  }

  try {
    // Transaction : crée le signalement (unique) + incrémente le compteur.
    const updated = await prisma.$transaction(async (tx) => {
      await tx.report.create({ data: { submissionId, reporterId } });
      return tx.submission.update({
        where: { id: submissionId },
        data: { reportCount: { increment: 1 } },
      });
    });

    // Au-delà du seuil, on masque automatiquement (quarantaine).
    if (updated.reportCount >= HIDE_THRESHOLD && !updated.hidden) {
      await prisma.submission.update({
        where: { id: submissionId },
        data: { hidden: true },
      });
    }
  } catch (e: unknown) {
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json({ error: "already_reported" }, { status: 409 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}