import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserWithUsername } from "@/lib/require-user";
import { ALLOWED_VOTE_VALUES } from "@/lib/vote-values";
import { checkRateLimit } from "@/lib/ratelimit";

// POST /api/votes — enregistre un vote sur une soumission.
// Barème : 0.5 (Moyen), 1 (Bien), 2 (Excellent).
const schema = z.object({
  submissionId: z.string().min(1),
  value: z.number().refine((v) => ALLOWED_VOTE_VALUES.includes(v as 0 | 1 | 2), {
    message: "invalid_value",
  }),
});

export async function POST(req: NextRequest) {
  const authResult = await requireUserWithUsername();
  if (authResult.response) return authResult.response;
  
  const voterId = authResult.user.id;

  if (!(await checkRateLimit("vote", voterId))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }


  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const { submissionId, value } = parsed.data;

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    select: {
      userId: true,
      hidden: true,
    },
  });
  
  if (!submission) {
    return NextResponse.json({ error: "submission_not_found" }, { status: 404 });
  }
  
  if (submission.hidden) {
    return NextResponse.json({ error: "submission_hidden" }, { status: 404 });
  }

  if (submission.userId === voterId) {
    return NextResponse.json({ error: "self_vote" }, { status: 403 });
  }

  try {
    // Transaction : crée le vote (unique), incrémente le score de la soumission
    // ET le score cumulé de l'auteur. Le @@unique bloque le double vote.
    await prisma.$transaction([
      prisma.vote.create({
        data: { submissionId, voterId, value },
      }),
      prisma.submission.update({
        where: { id: submissionId },
        data: { score: { increment: value }, voteCount: { increment: 1 } },
      }),
      prisma.user.update({
        where: { id: submission.userId },
        data: { score: { increment: value } },
      }),
    ]);
  } catch (e: unknown) {
    // Erreur P2002 = vote déjà existant pour ce couple (submission, voter).
    if (e && typeof e === "object" && "code" in e && e.code === "P2002") {
      return NextResponse.json({ error: "already_voted" }, { status: 409 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
